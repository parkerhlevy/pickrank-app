import { describe, expect, it } from 'vitest';
import { getHowItWorksHref, getHowItWorksReturn } from '../../lib/how-it-works-navigation';

describe('How It Works navigation', () => {
  it('builds a contextual education link without changing the destination route', () => {
    expect(getHowItWorksHref('/profile')).toBe('/how-it-works?returnTo=%2Fprofile');
    expect(getHowItWorksHref()).toBe('/how-it-works');
  });

  it('maps known PickRank origins to clear return labels', () => {
    expect(getHowItWorksReturn('/contests')).toEqual({ href: '/contests', label: 'Contests' });
    expect(getHowItWorksReturn('/profile')).toEqual({ href: '/profile', label: 'Profile' });
    expect(getHowItWorksReturn('/wallet')).toEqual({ href: '/wallet', label: 'Beta Pass' });
    expect(getHowItWorksReturn('/contests/week-1-qb-passing-yards')).toEqual({
      href: '/contests/week-1-qb-passing-yards',
      label: 'Contest details',
    });
    expect(getHowItWorksReturn('/contests/week-1-qb-passing-yards/lineup')).toEqual({
      href: '/contests/week-1-qb-passing-yards/lineup',
      label: 'Board builder',
    });
  });

  it('rejects external, unknown, and query-bearing return targets', () => {
    expect(getHowItWorksReturn('https://example.com')).toBeNull();
    expect(getHowItWorksReturn('//example.com')).toBeNull();
    expect(getHowItWorksReturn('/admin/contests')).toBeNull();
    expect(getHowItWorksReturn('/profile?next=%2Fcontests')).toBeNull();
  });
});
