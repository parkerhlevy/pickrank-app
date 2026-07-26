import { describe, expect, it } from 'vitest';
import { eligibilityToEnterContestsMessage, verifyEmailToEnterContestsMessage } from '../../lib/auth-profile';
import { getProtectedContestEntryHref } from '../../lib/contest-entry-access';

describe('protected contest entry gate', () => {
  const next = '/contests/week-1-qb-passing-yards/payment';
  const verificationGateHref = new URLSearchParams({
    next,
    status: 'error',
    message: verifyEmailToEnterContestsMessage,
  }).toString();
  const eligibilityGateHref = new URLSearchParams({
    next,
    status: 'error',
    message: eligibilityToEnterContestsMessage,
  }).toString();

  it('routes signed-out users into auth', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: true,
        isAuthenticated: false,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toBe('/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment');
  });

  it('routes signed-in users without a username into profile completion', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: true,
        isAuthenticated: true,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toBe('/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment');
  });

  it('routes signed-in users with unverified email into the verification gate', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: true,
        isAuthenticated: true,
        isProfileComplete: true,
        isEmailVerified: false,
      }),
    ).toBe(`/profile?${verificationGateHref}`);
  });

  it('routes signed-in users missing eligibility capture into the profile gate', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: true,
        isAuthenticated: true,
        isProfileComplete: true,
        isEmailVerified: true,
        isEligibilityComplete: false,
      }),
    ).toBe(`/profile?${eligibilityGateHref}`);
  });

  it('allows ready accounts through to protected entry routes', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: true,
        isAuthenticated: true,
        isProfileComplete: true,
        isEmailVerified: true,
      }),
    ).toBeNull();
  });

  it('falls back to auth when Supabase browser config is unavailable', () => {
    expect(
      getProtectedContestEntryHref({
        next,
        hasSupabaseConfig: false,
        isAuthenticated: false,
        isProfileComplete: false,
        isEmailVerified: false,
      }),
    ).toBe('/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fpayment');
  });
});
