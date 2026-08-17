import { describe, expect, it } from 'vitest';
import {
  getContestDetailPrimaryAction,
  getContestEntryHref,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStage,
  getContestEntryStateCopy,
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

  it('maps later-stage detail visits to board editing', () => {
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
      label: 'Edit Your Board',
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
      label: 'View Your Board',
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

  it('allows zero-fee contests to enter the no-money test flow while eligibility is pending review', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'test-week-1-no-money-entry',
        entryFee: '$0.00',
        entryFeeCents: 0,
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
      label: 'Enter Free Beta Contest',
      href: null,
      disabled: false,
      tone: 'default',
      submitsEntry: true,
    });
  });

  it('returns gated free beta users to Contest Detail instead of Entry Review', () => {
    expect(
      getContestDetailPrimaryAction({
        contestId: 'test-week-1-no-money-entry',
        entryFee: '$0.00',
        entryFeeCents: 0,
        hasEntry: false,
        isAuthenticated: false,
        isContestOpen: true,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toEqual({
      label: 'Sign Up / Log In to Enter',
      href: '/auth?next=%2Fcontests%2Ftest-week-1-no-money-entry',
      disabled: false,
      tone: 'default',
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

  it('keeps paid entry disabled during Early Access Beta for ready signed-in users', () => {
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
      label: 'Paid Entry Coming Later',
      href: null,
      disabled: true,
      tone: 'warning',
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

  it('routes free beta review and success fallbacks away from parked paid screens', () => {
    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'payment-review',
        route: 'payment',
        hasPersistedEntry: false,
        usesDirectEntryFlow: true,
      }),
    ).toEqual({
      stage: 'not-entered',
      shouldRedirect: true,
      redirectHref: '/contests/week-1-qb-passing-yards',
    });

    expect(
      getContestEntryRouteState({
        contestId: 'week-1-qb-passing-yards',
        persistedStage: 'entered',
        route: 'success',
        hasPersistedEntry: true,
        usesDirectEntryFlow: true,
      }),
    ).toEqual({
      stage: 'lineup',
      shouldRedirect: true,
      redirectHref: '/contests/week-1-qb-passing-yards/lineup',
    });
  });

  it('uses a two-step label on the active free beta board', () => {
    expect(getContestEntryStateCopy('lineup', { usesDirectEntryFlow: true })).toMatchObject({
      badge: 'Step 2 of 2',
      stepLabel: 'Step 2: Build Your Board',
      title: 'Build Your Board',
    });
  });

  it('returns numbered step copy for the full contest-entry sequence', () => {
    expect(getContestEntrySteps('payment-review')).toEqual([
      {
        key: 'not-entered',
        label: 'Contest Detail',
        summary: 'Check the contest details, lock time, and beta results overview before you enter.',
        stepNumber: 1,
        status: 'complete',
      },
      {
        key: 'payment-review',
        label: 'Entry Review',
        summary: 'Review your free beta entry and Beta Pass status.',
        stepNumber: 2,
        status: 'current',
      },
      {
        key: 'entered',
        label: 'Entry Success',
        summary: 'See your confirmed entry and head straight into your board.',
        stepNumber: 3,
        status: 'upcoming',
      },
      {
        key: 'lineup',
        label: 'Build Your Board',
        summary: 'Rank your players and save your board until lock.',
        stepNumber: 4,
        status: 'upcoming',
      },
    ]);
  });
});
