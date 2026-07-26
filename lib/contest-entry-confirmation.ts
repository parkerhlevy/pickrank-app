import type { ProfileEligibility } from '@/lib/auth-profile';

export function isNonProductionE2eEntryMode() {
  return (
    process.env.NODE_ENV !== 'production' &&
    process.env.PICKRANK_E2E_AUTH === '1' &&
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

export function getPaidContestEligibilityError(eligibility: ProfileEligibility | null | undefined) {
  if (!eligibility?.isEligibilityComplete) {
    return 'Complete age, location, Terms, and Privacy acknowledgements before paid entry.';
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

export function canConfirmContestEntry(entryFeeCents: number, eligibility?: ProfileEligibility | null) {
  if (entryFeeCents === 0) {
    return true;
  }

  if (getPaidContestEligibilityError(eligibility)) {
    return false;
  }

  return isNonProductionE2eEntryMode();
}

export function getContestEntryConfirmationError(entryFeeCents: number, eligibility?: ProfileEligibility | null) {
  if (entryFeeCents === 0) {
    return null;
  }

  const eligibilityError = getPaidContestEligibilityError(eligibility);

  if (eligibilityError) {
    return eligibilityError;
  }

  if (isNonProductionE2eEntryMode()) {
    return null;
  }

  return 'Paid contest entry is unavailable until verified payment infrastructure is connected.';
}
