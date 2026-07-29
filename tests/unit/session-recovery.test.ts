import { NextResponse } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildExpiredSessionRedirectPath,
  buildSessionExpiredHref,
  clearSupabaseSessionCookies,
  expiredSessionMessage,
  isInvalidSupabaseRefreshTokenError,
  isSupabaseAuthCookieName,
} from '../../lib/supabase/session-recovery';

describe('Supabase session recovery helpers', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('detects invalid Supabase refresh-token errors', () => {
    expect(
      isInvalidSupabaseRefreshTokenError({
        code: 'refresh_token_not_found',
        message: 'Invalid Refresh Token: Refresh Token Not Found',
      }),
    ).toBe(true);
    expect(isInvalidSupabaseRefreshTokenError(new Error('Invalid Refresh Token: Refresh Token Not Found'))).toBe(true);
    expect(isInvalidSupabaseRefreshTokenError(new Error('Network failed'))).toBe(false);
  });

  it('recognizes Supabase auth cookie names only', () => {
    expect(isSupabaseAuthCookieName('sb-example-auth-token')).toBe(true);
    expect(isSupabaseAuthCookieName('sb-example-auth-token.0')).toBe(true);
    expect(isSupabaseAuthCookieName('pickrank_auth_next')).toBe(false);
    expect(isSupabaseAuthCookieName('unrelated')).toBe(false);
  });

  it('builds trusted expired-session redirects', () => {
    expect(buildSessionExpiredHref('/admin/contests')).toBe('/auth/session-expired?next=%2Fadmin%2Fcontests');
    expect(buildSessionExpiredHref('https://attacker.example')).toBe('/auth/session-expired?next=%2Fprofile');
    expect(buildSessionExpiredHref('//attacker.example')).toBe('/auth/session-expired?next=%2Fprofile');

    expect(buildExpiredSessionRedirectPath('/admin/contests')).toBe(
      `/auth?${new URLSearchParams({
        status: 'error',
        next: '/admin/contests',
        message: expiredSessionMessage,
      }).toString()}`,
    );
    expect(buildExpiredSessionRedirectPath('/leaderboard?contest=week-1-qb-passing-yards')).toBe(
      '/leaderboard?contest=week-1-qb-passing-yards',
    );
  });

  it('clears configured and request Supabase session cookies', () => {
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    const response = NextResponse.redirect('https://pickrankgames.com/auth');

    clearSupabaseSessionCookies(response, {
      getAll: () => [
        { name: 'sb-example-auth-token', value: 'stale' },
        { name: 'sb-example-auth-token.0', value: 'stale-chunk' },
        { name: 'sb-other-auth-token', value: 'other-stale' },
        { name: 'unrelated', value: 'keep' },
      ],
    });

    const setCookie = response.headers.getSetCookie().join('\n');

    expect(setCookie).toContain('pickrank_auth_next=');
    expect(setCookie).toContain('sb-example-auth-token=');
    expect(setCookie).toContain('sb-example-auth-token.0=');
    expect(setCookie).toContain('sb-other-auth-token=');
    expect(setCookie).toContain('Max-Age=0');
    expect(setCookie).not.toContain('unrelated=');
  });
});
