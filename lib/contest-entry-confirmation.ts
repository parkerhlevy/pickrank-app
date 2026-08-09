import type { ProfileEligibility } from '@/lib/auth-profile';
import { launchMode } from '@/lib/launch-mode';

type ContestEntryViewerSource = 'anonymous' | 'supabase' | 'e2e-fixture';

type ContestEntryConfirmationContext = {
  eligibility?: ProfileEligibility | null;
  viewerSource?: ContestEntryViewerSource;
};

export function isControlledTestEntryMode(context: ContestEntryConfirmationContext = {}) {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.PICKRANK_E2E_AUTH === '1' &&
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1' &&
    context.viewerSource === 'e2e-fixture'
  );
}

export function getPaidContestEligibilityError(eligibility: ProfileEligibility | null | undefined) {
  if (!eligibility?.isEligibilityComplete) {
    return 'Complete date of birth, state, Beta Terms, and Privacy acknowledgements before contest entry.';
  }

  if (eligibility.accountStatus !== 'active') {
    return 'Your account is restricted from entering contests. Contact support if you think this is a mistake.';
  }

  if (eligibility.ageGateStatus !== 'confirmed') {
    return 'Paid contests are not available for your account at this time.';
  }

  if (eligibility.selfExclusionStatus === 'active') {
    return 'Paid contest entry is currently disabled for your account.';
  }

  if (eligibility.eligibilityStatus === 'blocked') {
    return 'Paid contests are not available in your location at this time.';
  }

  if (eligibility.eligibilityStatus !== 'eligible') {
    return 'Paid contest entry is unavailable while eligibility is pending legal and provider review.';
  }

  if (eligibility.kycStatus === 'failed' || eligibility.kycStatus === 'expired') {
    return 'Additional verification is required before paid contest entry.';
  }

  return null;
}

export function getControlledTestEntryEligibilityError(eligibility: ProfileEligibility | null | undefined) {
  if (!eligibility?.isEligibilityComplete) {
    return 'Complete date of birth, location, Terms, and Privacy acknowledgements before test entry.';
  }

  if (eligibility.accountStatus !== 'active') {
    return 'Your account is restricted from entering contests. Contact support if you think this is a mistake.';
  }

  if (eligibility.ageGateStatus !== 'confirmed') {
    return 'Test entries are not available for your account at this time.';
  }

  if (eligibility.selfExclusionStatus === 'active') {
    return 'Contest entry is currently disabled for your account.';
  }

  if (eligibility.eligibilityStatus === 'blocked') {
    return 'Contests are not available for this test account at this time.';
  }

  if (eligibility.eligibilityStatus === 'pending_review') {
    return 'Paid contest entry is unavailable while eligibility is pending legal and provider review.';
  }

  if (eligibility.eligibilityStatus !== 'eligible_for_internal_testing') {
    return 'Controlled test entry requires internal test approval.';
  }

  if (eligibility.kycStatus === 'failed' || eligibility.kycStatus === 'expired') {
    return 'Additional verification is required before test entry.';
  }

  return null;
}

export function canConfirmContestEntry(entryFeeCents: number, context: ContestEntryConfirmationContext = {}) {
  if (entryFeeCents === 0) {
    return true;
  }

  if (isControlledTestEntryMode(context)) {
    return !getControlledTestEntryEligibilityError(context.eligibility);
  }

  if (getPaidContestEligibilityError(context.eligibility)) {
    return false;
  }

  return false;
}

export function getContestEntryConfirmationError(
  entryFeeCents: number,
  context: ContestEntryConfirmationContext = {},
) {
  if (entryFeeCents === 0) {
    return null;
  }

  if (isControlledTestEntryMode(context)) {
    return getControlledTestEntryEligibilityError(context.eligibility);
  }

  const eligibilityError = getPaidContestEligibilityError(context.eligibility);

  if (eligibilityError) {
    return eligibilityError;
  }

  if (!launchMode.paidEntryEnabled) {
    return 'Paid contest entry is not available during Early Access Beta.';
  }

  return 'Paid contest entry is unavailable until verified payment infrastructure is connected.';
}
