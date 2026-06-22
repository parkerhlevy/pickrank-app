import { describe, expect, it } from 'vitest';
import {
  buildAuthHref,
  buildProfileHref,
  defaultReturnPath,
  normalizeReturnPath,
  normalizeUsername,
  validateUsername,
} from '../../lib/auth-profile';

describe('auth/profile helpers', () => {
  it('keeps only safe internal return paths', () => {
    expect(normalizeReturnPath('/contests/week-1-qb-passing-yards/progress?stage=payment-review')).toBe(
      '/contests/week-1-qb-passing-yards/progress?stage=payment-review',
    );
    expect(normalizeReturnPath('https://example.com')).toBe(defaultReturnPath);
    expect(normalizeReturnPath('//evil.example.com')).toBe(defaultReturnPath);
  });

  it('builds auth and profile links with preserved return paths', () => {
    expect(buildAuthHref('/profile')).toBe('/auth');
    expect(buildAuthHref('/contests/week-1-qb-passing-yards/progress?stage=payment-review')).toBe(
      '/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
    );
    expect(buildProfileHref('/profile')).toBe('/profile');
    expect(buildProfileHref('/contests/week-1-qb-passing-yards/progress?stage=payment-review')).toBe(
      '/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
    );
  });

  it('normalizes and validates usernames', () => {
    expect(normalizeUsername(' RankBuilder ')).toBe('rankbuilder');
    expect(validateUsername('ab')).toBe(
      'Username must be 3-20 characters using lowercase letters, numbers, or underscores.',
    );
    expect(validateUsername('rank-builder')).toBe(
      'Username must be 3-20 characters using lowercase letters, numbers, or underscores.',
    );
    expect(validateUsername('rankbuilder_7')).toBeNull();
  });
});
