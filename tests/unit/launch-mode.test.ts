import { describe, expect, it } from 'vitest';
import {
  getEntryReviewLabel,
  getNoPayoutLabel,
  isBetaFreeEntryContest,
  launchMode,
  resolveLaunchMode,
} from '../../lib/launch-mode';

describe('launch mode', () => {
  it('defaults the public product to free Early Access Beta', () => {
    expect(launchMode).toMatchObject({
      mode: 'early_access_beta',
      displayName: 'Early Access Beta',
      betaPassLabel: 'Beta Pass',
      isBetaFreeEntryEnabled: true,
      paidEntryEnabled: false,
      realMoneyEnabled: false,
    });
  });

  it('labels zero-fee contests as free beta contests without payouts', () => {
    expect(isBetaFreeEntryContest(0)).toBe(true);
    expect(isBetaFreeEntryContest(500)).toBe(false);
    expect(getEntryReviewLabel(0)).toBe('Entry Review');
    expect(getNoPayoutLabel(0)).toBe('Beta contest - no payout');
  });

  it('can expose paid-preview UI outside Vercel Production without enabling real-money entry', () => {
    const mode = resolveLaunchMode({
      PICKRANK_EXPERIENCE_MODE: 'paid_preview',
      VERCEL_ENV: 'preview',
    });

    expect(mode).toMatchObject({
      mode: 'paid_preview',
      displayName: 'Paid Contest Preview',
      paidPreviewVisible: true,
      paidEntryEnabled: false,
      realMoneyEnabled: false,
      isBetaFreeEntryEnabled: false,
    });
    expect(getEntryReviewLabel(500, mode)).toBe('Payment Review');
    expect(getNoPayoutLabel(500, mode)).toBe('No payout');
  });

  it('forces Vercel Production to Early Access Beta even if paid preview is requested', () => {
    const mode = resolveLaunchMode({
      PICKRANK_EXPERIENCE_MODE: 'paid_preview',
      VERCEL_ENV: 'production',
    });

    expect(mode).toMatchObject({
      mode: 'early_access_beta',
      paidPreviewVisible: false,
      paidEntryEnabled: false,
      realMoneyEnabled: false,
      isBetaFreeEntryEnabled: true,
    });
  });
});
