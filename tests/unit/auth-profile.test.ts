import { describe, expect, it } from 'vitest';
import {
  buildAuthHref,
  buildAuthStatusHref,
  buildProfileCompletionDestination,
  buildProfileHref,
  classifyDateOfBirthForBeta,
  defaultReturnPath,
  getReturnStepCopy,
  getPostAuthDestination,
  getProfileIdentity,
  normalizeReturnPath,
  normalizeAuthSurface,
  under18AgeGateRestrictionReason,
  validateEligibilityAcknowledgements,
  validateDateOfBirthForBeta,
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

  it('keeps auth status redirects on an approved account-access surface', () => {
    expect(normalizeAuthSurface('profile')).toBe('profile');
    expect(normalizeAuthSurface('unknown')).toBe('auth');
    expect(
      buildAuthStatusHref(
        'profile',
        'error',
        '/contests/week-1-qb-passing-yards/lineup',
        'Try again.',
      ),
    ).toBe(
      '/profile?status=error&next=%2Fcontests%2Fweek-1-qb-passing-yards%2Flineup&message=Try+again.',
    );
    expect(buildAuthStatusHref('auth', 'check-email', 'https://example.com')).toBe(
      '/auth?status=check-email&next=%2Fprofile',
    );
    expect(buildAuthStatusHref('profile', 'signed-out')).toBe(
      '/profile?status=signed-out&next=%2Fprofile',
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
      actionLabel: 'Continue to entry review',
      detail: 'Entry review for Week 1 QB Passing Yards',
      isContestFlow: true,
      shortLabel: 'Entry review',
    });
  });

  it('describes canonical contest routes in user-facing return copy', () => {
    expect(getReturnStepCopy('/contests/week-1-qb-passing-yards/lineup')).toEqual({
      actionLabel: 'Continue to build your board',
      detail: 'Build your board for Week 1 QB Passing Yards',
      isContestFlow: true,
      shortLabel: 'Build your board',
    });
  });

  it('uses profile as the default non-contest destination', () => {
    expect(getReturnStepCopy(defaultReturnPath)).toEqual({
      actionLabel: 'Continue to profile',
      detail: 'Profile',
      isContestFlow: false,
      shortLabel: 'Profile',
    });
  });

  it('uses Contests as the signed-in default and sends incomplete users through Profile first', () => {
    expect(
      getPostAuthDestination(defaultReturnPath, {
        isProfileComplete: true,
        isEligibilityComplete: true,
      }),
    ).toBe('/contests');
    expect(
      getPostAuthDestination(defaultReturnPath, {
        isProfileComplete: false,
        isEligibilityComplete: false,
      }),
    ).toBe('/profile?next=%2Fcontests');
    expect(
      getPostAuthDestination('/contests/week-1-qb-passing-yards', {
        isProfileComplete: false,
        isEligibilityComplete: true,
      }),
    ).toBe('/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards');
  });

  it('adds a completion notice only to the default Contests destination', () => {
    expect(buildProfileCompletionDestination()).toBe('/contests?status=profile-complete');
    expect(buildProfileCompletionDestination('/contests')).toBe('/contests?status=profile-complete');
    expect(buildProfileCompletionDestination('/contests/week-1-qb-passing-yards')).toBe(
      '/contests/week-1-qb-passing-yards',
    );
  });

  it('describes the Contests hub as a named Profile return step', () => {
    expect(getReturnStepCopy('/contests')).toEqual({
      actionLabel: 'Continue to contests',
      detail: 'Contests',
      isContestFlow: false,
      shortLabel: 'Contests',
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
        dateOfBirth: '1990-01-01',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        jurisdiction: 'ny',
      }),
    ).toBeNull();
    expect(
      validateEligibilityAcknowledgements({
        dateOfBirth: '',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        jurisdiction: 'CA',
      }),
    ).toBe('Enter a valid date of birth.');
    expect(
      validateEligibilityAcknowledgements({
        dateOfBirth: '2010-01-01',
        termsAccepted: true,
        privacyPolicyAccepted: true,
        jurisdiction: 'CA',
      }),
    ).toBe('PickRank Early Access Beta is for users who are at least 18 years old.');
  });

  it('validates the 18+ beta date-of-birth gate', () => {
    const asOf = new Date('2026-08-11T00:00:00.000Z');

    expect(classifyDateOfBirthForBeta('not-a-date', asOf)).toBe('invalid');
    expect(classifyDateOfBirthForBeta('2027-01-01', asOf)).toBe('invalid');
    expect(classifyDateOfBirthForBeta('2009-08-11', asOf)).toBe('under_18');
    expect(classifyDateOfBirthForBeta('2008-08-11', asOf)).toBe('eligible');
    expect(classifyDateOfBirthForBeta('1990-01-01', asOf)).toBe('eligible');
    expect(validateDateOfBirthForBeta('2008-08-11', asOf)).toBeNull();
    expect(validateDateOfBirthForBeta('2008-08-12', asOf)).toBe(
      'PickRank Early Access Beta is for users who are at least 18 years old.',
    );
    expect(validateDateOfBirthForBeta('not-a-date', asOf)).toBe('Enter a valid date of birth.');
    expect(validateDateOfBirthForBeta('2027-01-01', asOf)).toBe('Enter a valid date of birth.');
  });

  it('reads profile identity from Supabase user metadata', () => {
    const identity = getProfileIdentity({
      email: 'parkerhlevy@gmail.com',
      email_confirmed_at: '2026-06-22T00:00:00.000Z',
      user_metadata: {
        username: 'parkerhlevy1',
        display_name: 'parkerhlevy1',
        date_of_birth: '1990-01-01',
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
        dateOfBirth: '1990-01-01',
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
        isAgeOnlyRestriction: false,
        isEligibilityComplete: true,
        isEligibleForPaidEntry: true,
      },
    });
  });

  it('blocks stale age metadata when saved date of birth is under 18', () => {
    const identity = getProfileIdentity({
      email: 'qa-under-18@example.com',
      email_confirmed_at: '2026-08-11T00:00:00.000Z',
      user_metadata: {
        username: 'qa_under18',
        display_name: 'qa_under18',
        date_of_birth: '2010-01-01',
        age_confirmed: true,
        jurisdiction: 'WA',
        terms_accepted_at: '2026-08-09T00:00:00.000Z',
        privacy_policy_accepted_at: '2026-08-09T00:00:00.000Z',
        account_status: 'active',
        eligibility_status: 'pending_review',
        eligibility_checked_at: '2026-08-09T00:00:00.000Z',
        age_gate_status: 'confirmed',
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
      },
    } as never);

    expect(identity.eligibility).toMatchObject({
      ageConfirmed: false,
      dateOfBirth: '2010-01-01',
      ageGateStatus: 'blocked',
      isAgeOnlyRestriction: false,
      isEligibilityComplete: false,
      isEligibleForPaidEntry: false,
    });
  });

  it('keeps an age-only restriction until explicit review when stored DOB reaches 18', () => {
    const identity = getProfileIdentity({
      email: 'qa-age-resolved@example.com',
      email_confirmed_at: '2026-08-11T00:00:00.000Z',
      user_metadata: {
        username: 'qa_age_resolved',
        display_name: 'qa_age_resolved',
        date_of_birth: '2008-08-11',
        jurisdiction: 'WA',
        terms_accepted_at: '2026-08-09T00:00:00.000Z',
        privacy_policy_accepted_at: '2026-08-09T00:00:00.000Z',
        account_status: 'restricted',
        eligibility_status: 'blocked',
        age_gate_status: 'blocked',
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
        restriction_reason: under18AgeGateRestrictionReason,
      },
    } as never);

    expect(identity.eligibility).toMatchObject({
      ageConfirmed: true,
      accountStatus: 'restricted',
      eligibilityStatus: 'blocked',
      ageGateStatus: 'confirmed',
      restrictionReason: under18AgeGateRestrictionReason,
      isAgeOnlyRestriction: true,
      isEligibilityComplete: false,
      isEligibleForPaidEntry: false,
    });
  });

  it('does not auto-lift non-age restrictions when stored DOB is 18+', () => {
    const identity = getProfileIdentity({
      email: 'qa-manual-hold@example.com',
      email_confirmed_at: '2026-08-11T00:00:00.000Z',
      user_metadata: {
        username: 'qa_manual_hold',
        display_name: 'qa_manual_hold',
        date_of_birth: '2008-08-11',
        jurisdiction: 'WA',
        terms_accepted_at: '2026-08-09T00:00:00.000Z',
        privacy_policy_accepted_at: '2026-08-09T00:00:00.000Z',
        account_status: 'restricted',
        eligibility_status: 'blocked',
        age_gate_status: 'confirmed',
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
        restriction_reason: 'manual compliance hold',
      },
    } as never);

    expect(identity.eligibility).toMatchObject({
      ageConfirmed: true,
      accountStatus: 'restricted',
      eligibilityStatus: 'blocked',
      ageGateStatus: 'confirmed',
      restrictionReason: 'manual compliance hold',
      isAgeOnlyRestriction: false,
      isEligibilityComplete: false,
      isEligibleForPaidEntry: false,
    });
  });
});
