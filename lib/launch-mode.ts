export const launchMode = {
  mode: 'early_access_beta',
  displayName: 'Early Access Beta',
  betaPassLabel: 'Beta Pass',
  betaEntryLabel: 'Free to play during beta',
  betaNoCashValueCopy: 'Beta Pass has no cash value. No payouts or cash prizes are available during beta.',
  paidEntryEnabled: false,
  realMoneyEnabled: false,
  isBetaFreeEntryEnabled: true,
} as const;

export type LaunchMode = typeof launchMode.mode | 'paid_launch';

export function isEarlyAccessBeta() {
  return launchMode.mode === 'early_access_beta';
}

export function isBetaFreeEntryContest(entryFeeCents: number) {
  return launchMode.isBetaFreeEntryEnabled && entryFeeCents === 0;
}

export function getEntryReviewLabel(entryFeeCents?: number) {
  return entryFeeCents === 0 || isEarlyAccessBeta() ? 'Entry Review' : 'Payment Review';
}

export function getNoPayoutLabel(entryFeeCents?: number) {
  return entryFeeCents === 0 || isEarlyAccessBeta() ? 'Beta contest - no payout' : 'No payout';
}
