export type LaunchModeName = 'early_access_beta' | 'paid_preview';

type LaunchModeEnv = {
  [key: string]: string | undefined;
  PICKRANK_EXPERIENCE_MODE?: string;
  VERCEL_ENV?: string;
};

export type LaunchModeConfig = {
  mode: LaunchModeName;
  displayName: string;
  betaPassLabel: string;
  betaEntryLabel: string;
  betaNoCashValueCopy: string;
  paidEntryEnabled: boolean;
  realMoneyEnabled: boolean;
  isBetaFreeEntryEnabled: boolean;
  paidPreviewVisible: boolean;
};

const earlyAccessBetaLaunchMode = {
  mode: 'early_access_beta',
  displayName: 'Early Access Beta',
  betaPassLabel: 'Beta Pass',
  betaEntryLabel: 'Free to play during beta',
  betaNoCashValueCopy: 'Beta Pass has no cash value. No payouts or cash prizes are available during beta.',
  paidEntryEnabled: false,
  realMoneyEnabled: false,
  isBetaFreeEntryEnabled: true,
  paidPreviewVisible: false,
} as const satisfies LaunchModeConfig;

const paidPreviewLaunchMode = {
  mode: 'paid_preview',
  displayName: 'Paid contest preview',
  betaPassLabel: 'Beta Pass',
  betaEntryLabel: 'Paid-mode preview',
  betaNoCashValueCopy:
    'Paid-mode preview is not a live paid contest environment. Do not use it for deposits, withdrawals, payouts, or cash prizes.',
  paidEntryEnabled: false,
  realMoneyEnabled: false,
  isBetaFreeEntryEnabled: false,
  paidPreviewVisible: true,
} as const satisfies LaunchModeConfig;

export type LaunchMode = LaunchModeName;

export function resolveLaunchMode(env: LaunchModeEnv = process.env): LaunchModeConfig {
  if (env.VERCEL_ENV === 'production') {
    return earlyAccessBetaLaunchMode;
  }

  if (env.PICKRANK_EXPERIENCE_MODE === 'paid_preview') {
    return paidPreviewLaunchMode;
  }

  return earlyAccessBetaLaunchMode;
}

export const launchMode = resolveLaunchMode();

export function isEarlyAccessBeta(mode = launchMode) {
  return mode.mode === 'early_access_beta';
}

export function isBetaFreeEntryContest(entryFeeCents: number, mode = launchMode) {
  return mode.isBetaFreeEntryEnabled && entryFeeCents === 0;
}

export function getEntryReviewLabel(entryFeeCents?: number, mode = launchMode) {
  return entryFeeCents === 0 || isEarlyAccessBeta(mode) ? 'Entry review' : 'Payment review';
}

export function getNoPayoutLabel(entryFeeCents?: number, mode = launchMode) {
  return entryFeeCents === 0 || isEarlyAccessBeta(mode) ? 'Beta contest - no payout' : 'No payout';
}
