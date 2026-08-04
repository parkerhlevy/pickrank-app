import { describe, expect, it } from 'vitest';
import {
  buildAuthHref,
  buildProfileHref,
  defaultReturnPath,
  getReturnStepCopy,
  getProfileIdentity,
  normalizeReturnPath,
  validateEligibilityAcknowledgements,
  validateJurisdiction,
  normalizeUsername,
  validateUsername,
  verifyEmailToEnterContestsMessage,
} from '../../lib/auth-profile';

describe('auth profile helpers', () => {
  it('normalizes safe return paths and blocks external redirects', () => {
    expect(normalizeReturnPath('/contests/week-1-qb-passing-yards/payment')).toBe('/contests/week-1-qb-passing-yards/payment');
    expect(normalizeReturnPath('https://example.com')).toBe(defaultReturnPath);
    expect(normalizeReturnPath('//example.com')).toBe(defaultReturnPath);
  });

  it('builds auth and profile handoff links', () => {
    expect(buildAuthHref('/contests/week-1-qb-passing-yards/payment')).toBe(
      '/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment',
    );
    expect(buildProfileHref('/contests/week-1-qb-passing-yards/payment')).toBe(
      '/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment',
    );
  });

  it('builds profile handoff links with additional gate messaging', () => {
    expect(
      buildProfileHref('/contests/week-1-qb-passing-yards/payment', {
        status: 'error',
        message: verifyEmailToEnterContestsMessage,
      }),
    ).toBe(
      '/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment&status=error&message=Verify+your+email+to+enter+contests.',
    );
  });

  it('turns protected contest paths into user-facing return copy', () => {
    expect(getReturnStepCopy('/contests/week-1-qb-passing-yards/progress?stage=payment-review')).toEqual({
      actionLabel: 'Continue to Entry Review',
      detail: 'Entry Review for Week 1 QB Passing Yards',
      isContestFlow: true,
      shortLabel: 'Entry Review',
    });
  });

  it('describes canonical contest routes in user-facing return copy', () => {
    expect(getReturnStepCopy('/contests/week-1-qb-passing-yards/lineup')).toEqual({
      actionLabel: 'Continue to Build Your Lineup',
      detail: 'Build Your Lineup for Week 1 QB Passing Yards',
      isContestFlow: true,
      shortLabel: 'Build Your Lineup',
    });
  });

  it('uses profile as the default non-contest destination', () => {
    expect(getReturnStepCopy(defaultReturnPath)).toEqual({
      actionLabel: 'Continue to Profile',
      detail: 'Profile',
      isContestFlow: false,
      shortLabel: 'Profile',
    });
  });

  it('validates usernames with the MVP rules', () => {
    expect(normalizeUsername('  Parker_1 ')).toBe('parker_1');
    expect(validateUsername('ab')).toBe('Use 3-20 lowercase letters, numbers, or underscores.');
    expect(validateUsername('valid_name')).toBeNull();
  });

  it('validates beta-entry acknowledgements', () => {
    expect(validateJurisdiction('CA')).toBeNull();
    expect(validateJurisdiction('not-a-state')).toBe('Choose a supported U.S. state or jurisdiction.');
    expect(
      validateEligibilityAcknowledgements({
        ageConfirmed: true,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        jurisdiction: 'ny',
      }),
    ).toBeNull();
    expect(
      validateEligibilityAcknowledgements({
        ageConfirmed: false,
        termsAccepted: true,
        privacyPolicyAccepted: true,
        jurisdiction: 'CA',
      }),
    ).toBe('Confirm you meet the age requirement to enter beta contests.');
  });

  it('reads profile identity from Supabase user metadata', () => {
    const identity = getProfileIdentity({
      email: 'parkerhlevy@gmail.com',
      email_confirmed_at: '2026-06-22T00:00:00.000Z',
      user_metadata: {
        username: 'parkerhlevy1',
        display_name: 'parkerhlevy1',
        age_confirmed: true,
        jurisdiction: 'CA',
        terms_accepted_at: '2026-07-24T00:00:00.000Z',
        privacy_policy_accepted_at: '2026-07-24T00:00:00.000Z',
        account_status: 'active',
        eligibility_status: 'eligible',
        eligibility_checked_at: '2026-07-24T00:00:00.000Z',
        age_gate_status: 'confirmed',
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
      },
    } as never);

    expect(identity).toMatchObject({
      email: 'parkerhlevy@gmail.com',
      username: 'parkerhlevy1',
      displayName: 'parkerhlevy1',
      emailConfirmedAt: '2026-06-22T00:00:00.000Z',
      isProfileComplete: true,
      isEmailVerified: true,
      eligibility: {
        ageConfirmed: true,
        jurisdiction: 'CA',
        termsAcceptedAt: '2026-07-24T00:00:00.000Z',
        privacyPolicyAcceptedAt: '2026-07-24T00:00:00.000Z',
        accountStatus: 'active',
        eligibilityStatus: 'eligible',
        eligibilityCheckedAt: '2026-07-24T00:00:00.000Z',
        ageGateStatus: 'confirmed',
        kycStatus: 'not_required',
        selfExclusionStatus: 'none',
        restrictionReason: null,
        isEligibilityComplete: true,
        isEligibleForPaidEntry: true,
      },
    });
  });
});
