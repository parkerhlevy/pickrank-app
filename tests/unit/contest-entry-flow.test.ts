import { describe, expect, it } from 'vitest';
import {
  getContestDetailPrimaryAction,
  getContestEntryHref,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStage,
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
        isContestOpen: true,
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
        isContestOpen: false,
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

  it('builds clean canonical and progress routes', () => {
    expect(getContestEntryHref('week-1-qb-passing-yards', 'payment-review')).toBe(
      '/contests/week-1-qb-passing-yards/payment',
    );
    expect(getContestEntryProgressHref('week-1-qb-passing-yards', 'lineup')).toBe(
      '/contests/week-1-qb-passing-yards/progress?stage=lineup',
    );
  });
});
