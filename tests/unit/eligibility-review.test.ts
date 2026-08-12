import { describe, expect, it } from 'vitest';
import { getProfileIdentity, type ProfileEligibility } from '../../lib/auth-profile';
import {
  buildEligibilityReviewEvent,
  getEligibilityStatusForDecision,
  internalTestingScope,
  isKnownInternalTestAccountEmail,
  normalizeInternalTestAccountEmails,
  validateEligibilityReviewInput,
  type EligibilityReviewCandidate,
} from '../../lib/eligibility-review';

const completeEligibility: ProfileEligibility = {
  ageConfirmed: true,
  dateOfBirth: '1990-01-01',
  jurisdiction: 'MA',
  termsAcceptedAt: '2026-07-24T00:00:00.000Z',
  privacyPolicyAcceptedAt: '2026-07-24T00:00:00.000Z',
  accountStatus: 'active',
  eligibilityStatus: 'pending_review',
  eligibilityCheckedAt: '2026-07-24T00:00:00.000Z',
  ageGateStatus: 'confirmed',
  kycStatus: 'not_required',
  selfExclusionStatus: 'none',
  restrictionReason: null,
  isAgeOnlyRestriction: false,
  isEligibilityComplete: true,
  isEligibleForPaidEntry: false,
};

const candidate: EligibilityReviewCandidate = {
  authUserMetadata: {
    username: 'qa_user',
    display_name: 'QA User',
  },
  userId: '00000000-0000-4000-8000-000000000010',
  email: 'qa@pickrank.test',
  username: 'qa_user',
  displayName: 'QA User',
  eligibility: completeEligibility,
  entryRestrictionStatus: 'none',
  isKnownInternalTestAccount: true,
};

const reviewerUserId = '00000000-0000-4000-8000-000000000020';

describe('eligibility review policy', () => {
  it('limits known internal test accounts to fixture domains or explicit server allowlist', () => {
    const allowlist = normalizeInternalTestAccountEmails('founder@example.com, QA@PickRankGames.com ');

    expect(isKnownInternalTestAccountEmail('qa@pickrank.test', allowlist)).toBe(true);
    expect(isKnownInternalTestAccountEmail('qa@pickrankgames.com', allowlist)).toBe(true);
    expect(isKnownInternalTestAccountEmail('public@example.com', allowlist)).toBe(false);
  });

  it('requires a reason for every review decision', () => {
    expect(
      validateEligibilityReviewInput({
        decision: 'blocked',
        reason: 'too short',
        reviewerUserId,
        target: candidate,
      }),
    ).toContain('at least 12 characters');
  });

  it('does not allow ordinary public accounts to be marked eligible', () => {
    expect(
      validateEligibilityReviewInput({
        decision: 'eligible_for_internal_testing',
        reason: 'Known QA account for no-money preseason testing.',
        reviewerUserId,
        target: {
          ...candidate,
          email: 'public@example.com',
          isKnownInternalTestAccount: false,
        },
      }),
    ).toContain('known founder, operator, QA, or test accounts');
  });

  it('requires captured self-attestation fields before internal-test eligibility', () => {
    expect(
      validateEligibilityReviewInput({
        decision: 'eligible_for_internal_testing',
        reason: 'Known QA account for no-money preseason testing.',
        reviewerUserId,
        target: {
          ...candidate,
          eligibility: {
            ...completeEligibility,
            ageConfirmed: false,
            dateOfBirth: null,
            isEligibilityComplete: false,
          },
        },
      }),
    ).toContain('Capture DOB, jurisdiction, Terms, and Privacy');
  });

  it('requires an auditable operator identity for every decision', () => {
    expect(
      validateEligibilityReviewInput({
        decision: 'blocked',
        reason: 'Known internal testing hold requiring review.',
        target: candidate,
      }),
    ).toContain('signed-in contest operator');
  });

  it.each([
    {
      name: 'restricted account',
      target: {
        ...candidate,
        eligibility: { ...completeEligibility, accountStatus: 'restricted' as const },
      },
      message: 'Only active test accounts',
    },
    {
      name: 'active self-exclusion',
      target: {
        ...candidate,
        eligibility: { ...completeEligibility, selfExclusionStatus: 'active' as const },
      },
      message: 'current self-exclusion',
    },
    {
      name: 'responsible-play entry restriction',
      target: {
        ...candidate,
        entryRestrictionStatus: 'active',
      },
      message: 'responsible-play entry restriction',
    },
    {
      name: 'existing eligibility hold',
      target: {
        ...candidate,
        eligibility: { ...completeEligibility, eligibilityStatus: 'blocked' as const },
      },
      message: 'Clear the existing eligibility hold',
    },
  ])('blocks internal-test approval for a $name', ({ target, message }) => {
    expect(
      validateEligibilityReviewInput({
        decision: 'eligible_for_internal_testing',
        reason: 'Known QA account for controlled no-money testing.',
        reviewerUserId,
        target,
      }),
    ).toContain(message);
  });

  it('keeps internal-test approval separate from public paid-entry eligibility', () => {
    expect(getEligibilityStatusForDecision('eligible_for_internal_testing')).toBe('eligible_for_internal_testing');

    const identity = getProfileIdentity({
      email: candidate.email,
      email_confirmed_at: '2026-07-24T00:00:00.000Z',
      user_metadata: {
        date_of_birth: '1990-01-01',
        age_confirmed: true,
        jurisdiction: 'MA',
        terms_accepted_at: '2026-07-24T00:00:00.000Z',
        privacy_policy_accepted_at: '2026-07-24T00:00:00.000Z',
        account_status: 'active',
        eligibility_status: 'eligible_for_internal_testing',
        age_gate_status: 'confirmed',
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
      },
    } as never);

    expect(identity.eligibility.eligibilityStatus).toBe('eligible_for_internal_testing');
    expect(identity.eligibility.isEligibleForPaidEntry).toBe(false);
  });

  it('logs internal-test approval as scoped audit metadata, not public real-money approval', () => {
    const event = buildEligibilityReviewEvent({
      decision: 'eligible_for_internal_testing',
      reason: 'Known QA account for controlled no-money preseason testing.',
      reviewedAt: '2026-07-27T00:00:00.000Z',
      reviewerEmail: 'operator@pickrank.test',
      reviewerUserId,
      target: candidate,
    });

    expect(event.event_type).toBe('eligible_for_internal_testing');
    expect(event.eligibility_status).toBe('eligible_for_internal_testing');
    expect(event.restriction_reason).toBeNull();
    expect(event.metadata).toMatchObject({
      scope: internalTestingScope,
      public_real_money_approval: false,
      prior_eligibility_status: 'pending_review',
      reviewer_user_id: reviewerUserId,
    });
  });

  it('logs blocked decisions with the required reason', () => {
    const event = buildEligibilityReviewEvent({
      decision: 'blocked',
      reason: 'Internal testing hold until details are corrected.',
      reviewedAt: '2026-07-27T00:00:00.000Z',
      reviewerUserId,
      target: candidate,
    });

    expect(event.event_type).toBe('blocked');
    expect(event.eligibility_status).toBe('blocked');
    expect(event.restriction_reason).toBe('Internal testing hold until details are corrected.');
  });
});
