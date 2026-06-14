import { describe, expect, it } from 'vitest';
import { formatCents, getPaymentReviewBreakdown } from '../../lib/phase-0-demo';

describe('payment review placeholder breakdown', () => {
  it('applies Site Credit before Cash Balance before amount due today', () => {
    expect(getPaymentReviewBreakdown('$5')).toEqual({
      entryFeeCents: 500,
      siteCreditAppliedCents: 200,
      cashBalanceAppliedCents: 100,
      amountDueTodayCents: 200,
    });
  });

  it('formats cents as dollars', () => {
    expect(formatCents(200)).toBe('$2.00');
  });
});
