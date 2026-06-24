import { describe, expect, it } from 'vitest';
import {
  getContestDetailPrimaryAction,
  getContestEntryHref,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStage,
  getContestEntrySteps,
  getPersistedContestEntryStage,
  getUpdatedContestEntryCookieValue,
} from '../../lib/contest-entry-flow';

describe('contest entry flow state', () => {
  it('falls back to the expected stage when the entry param is missing or invalid', () => {
    expect(getContestEntryStage(undefined, 'not-entered')).toBe('not-entered');
    expect(getContestEntryStage('unknown', 'payment-review')).toBe('payment-review');
  });

  it('maps later-stage detail visits to lineup editing', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        hasEntry: true,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
      }),
    ).toEqual({
      label: 'Edit Lineup',
      href: '/contests/week-1-qb-passing-yards/progress?stage=lineup',
      disabled: false,
    });
  });

  it('switches the primary action to read-only viewing after lock', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        hasEntry: true,
        isAuthenticated: true,
        isContestOpen: false,
        isProfileComplete: true,
      }),
    ).toEqual({
      label: 'View Lineup',
      href: '/contests/week-1-qb-passing-yards/progress?stage=lineup',
      disabled: false,
    });
  });

  it('keeps non-detail routes on their canonical stage path', () => {
    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'lineup',
        route: 'payment',
      }),
    ).toEqual({
      stage: 'lineup',
      shouldRedirect: true,
      redirectHref: getContestEntryHref('week-1-qb-passing-yards', 'lineup'),
    });
  });

  it('allows the expected route when the stage already matches', () => {
    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'entered',
        route: 'success',
      }),
    ).toEqual({
      stage: 'entered',
      shouldRedirect: false,
      redirectHref: null,
    });
  });

  it('reads a persisted stage from the cookie payload', () => {
    expect(
      getPersistedContestEntryStage(
        'week-1-qb-passing-yards',
        JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
      ),
    ).toBe('payment-review');
  });

  it('updates the cookie payload for a contest', () => {
    expect(
      getUpdatedContestEntryCookieValue({
        contestId: 'week-1-qb-passing-yards',
        currentCookieValue: JSON.stringify({ 'other-contest': 'lineup' }),
        stage: 'entered',
      }),
    ).toBe(JSON.stringify({ 'other-contest': 'lineup', 'week-1-qb-passing-yards': 'entered' }));
  });

  it('routes logged-out users into auth before payment review', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        hasEntry: false,
        isAuthenticated: false,
        isContestOpen: true,
        isProfileComplete: false,
      }),
    ).toEqual({
      label: 'Sign Up / Log In to Enter',
      href: '/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
      disabled: false,
    });
  });

  it('routes signed-in users without usernames into profile completion', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: false,
      }),
    ).toEqual({
      label: 'Complete Profile to Enter',
      href: '/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
      disabled: false,
    });
  });

  it('builds clean canonical and progress routes', () => {
    expect(getContestEntryHref('week-1-qb-passing-yards', 'payment-review')).toBe(
      '/contests/week-1-qb-passing-yards/payment',
    );
    expect(getContestEntryProgressHref('week-1-qb-passing-yards', 'lineup')).toBe(
      '/contests/week-1-qb-passing-yards/progress?stage=lineup',
    );
  });

  it('returns numbered step copy for the full contest-entry sequence', () => {
    expect(getContestEntrySteps('payment-review')).toEqual([
      {
        key: 'not-entered',
        label: 'Contest Detail',
        summary: 'Review the contest, timing, and single-entry rules before moving ahead.',
        stepNumber: 1,
        status: 'complete',
      },
      {
        key: 'payment-review',
        label: 'Payment Review',
        summary: 'Check the placeholder fee breakdown and confirm the entry handoff.',
        stepNumber: 2,
        status: 'current',
      },
      {
        key: 'entered',
        label: 'Entry Success',
        summary: 'See that your entry is in place and head to the lineup screen.',
        stepNumber: 3,
        status: 'upcoming',
      },
      {
        key: 'lineup',
        label: 'Build Your Lineup',
        summary: 'Rank players and save your order until lock.',
        stepNumber: 4,
        status: 'upcoming',
      },
    ]);
  });
});
