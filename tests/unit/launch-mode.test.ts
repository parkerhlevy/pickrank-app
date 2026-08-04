import { describe, expect, it } from 'vitest';
import { getEntryReviewLabel, getNoPayoutLabel, isBetaFreeEntryContest, launchMode } from '../../lib/launch-mode';

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
});
