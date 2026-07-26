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
import { eligibilityToEnterContestsMessage, verifyEmailToEnterContestsMessage } from '../../lib/auth-profile';

describe('contest entry flow state', () => {
  const verificationGateHref = new URLSearchParams({
    next: '/contests/week-1-qb-passing-yards/progress?stage=payment-review',
    status: 'error',
    message: verifyEmailToEnterContestsMessage,
  }).toString();
  const eligibilityGateHref = new URLSearchParams({
    next: '/contests/week-1-qb-passing-yards/progress?stage=payment-review',
    status: 'error',
    message: eligibilityToEnterContestsMessage,
  }).toString();

  it('falls back to the expected stage when the entry param is missing or invalid', () => {
    expect(getContestEntryStage(undefined, 'not-entered')).toBe('not-entered');
    expect(getContestEntryStage('unknown', 'payment-review')).toBe('payment-review');
  });

  it('maps later-stage detail visits to lineup editing', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: true,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: true,
      }),
    ).toEqual({
      label: 'Edit Lineup',
      href: '/contests/week-1-qb-passing-yards/progress?stage=lineup',
      disabled: false,
      tone: 'default',
    });
  });

  it('switches the primary action to read-only viewing after lock', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: true,
        isAuthenticated: true,
        isContestOpen: false,
        isProfileComplete: true,
        isEmailVerified: true,
      }),
    ).toEqual({
      label: 'View Lineup',
      href: '/contests/week-1-qb-passing-yards/progress?stage=lineup',
      disabled: false,
      tone: 'default',
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

  it('redirects payment review to saved-entry state when a real entry already exists', () => {
    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'not-entered',
        route: 'payment',
        hasPersistedEntry: true,
      }),
    ).toEqual({
      stage: 'entered',
      shouldRedirect: true,
      redirectHref: getContestEntryHref('week-1-qb-passing-yards', 'entered'),
    });
  });

  it('allows direct lineup access when a real entry already exists even if the cookie is stale', () => {
    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'not-entered',
        route: 'lineup',
        hasPersistedEntry: true,
      }),
    ).toEqual({
      stage: 'lineup',
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
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: false,
        isContestOpen: true,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toEqual({
      label: 'Sign Up / Log In to Enter',
      href: '/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
      disabled: false,
      tone: 'default',
    });
  });

  it('routes signed-in users without usernames into profile completion', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toEqual({
      label: 'Complete Profile to Enter',
      href: '/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
      disabled: false,
      tone: 'default',
    });
  });

  it('routes signed-in users with unverified email into the profile gate', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: false,
      }),
    ).toEqual({
      label: 'Verify Email to Enter',
      href: `/profile?${verificationGateHref}`,
      disabled: false,
      tone: 'default',
    });
  });

  it('routes signed-in users missing eligibility capture into the profile gate', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: true,
        isEligibilityComplete: false,
      }),
    ).toEqual({
      label: 'Complete Eligibility to Enter',
      href: `/profile?${eligibilityGateHref}`,
      disabled: false,
      tone: 'default',
    });
  });

  it('routes captured but pending eligibility users to a review-safe payment explanation', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: true,
        isEligibilityComplete: true,
        isEligibleForPaidEntry: false,
        eligibilityStatus: 'pending_review',
      }),
    ).toEqual({
      label: 'Eligibility Pending Review',
      href: null,
      disabled: true,
      tone: 'warning',
    });
  });

  it('does not imply paid entry is possible for blocked eligibility status', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: true,
        isEligibilityComplete: true,
        isEligibleForPaidEntry: false,
        eligibilityStatus: 'blocked',
      }),
    ).toEqual({
      label: 'Paid Entry Unavailable',
      href: null,
      disabled: true,
      tone: 'error',
    });
  });

  it('uses the pay-and-enter CTA for ready signed-in users who have not entered yet', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'week-1-qb-passing-yards',
        entryFee: '$5',
        hasEntry: false,
        isAuthenticated: true,
        isContestOpen: true,
        isProfileComplete: true,
        isEmailVerified: true,
      }),
    ).toEqual({
      label: 'Enter Contest - $5',
      href: '/contests/week-1-qb-passing-yards/progress?stage=payment-review',
      disabled: false,
      tone: 'default',
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
        summary: 'Check the contest details, lock time, and payout overview before you enter.',
        stepNumber: 1,
        status: 'complete',
      },
      {
        key: 'payment-review',
        label: 'Payment Review',
        summary: 'Review your entry fee, applied balances, and amount due today.',
        stepNumber: 2,
        status: 'current',
      },
      {
        key: 'entered',
        label: 'Entry Success',
        summary: 'See your confirmed entry and head straight into your lineup.',
        stepNumber: 3,
        status: 'upcoming',
      },
      {
        key: 'lineup',
        label: 'Build Your Lineup',
        summary: 'Rank your players and save your order until lock.',
        stepNumber: 4,
        status: 'upcoming',
      },
    ]);
  });
});
