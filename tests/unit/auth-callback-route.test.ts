import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expiredSessionMessage } from '../../lib/supabase/session-recovery';

const createClientMock = vi.fn();

vi.mock('../../lib/supabase/server', () => ({
  createClient: createClientMock,
}));

describe('auth callback route', () => {
  afterEach(() => {
    createClientMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('redirects missing auth codes to auth and clears the saved return cookie', async () => {
    stubSupabaseEnv();
    const { GET } = await import('../../app/auth/callback/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/callback', {
        headers: {
          cookie: 'pickrank_auth_next=/admin/contests',
        },
      }),
    );

    expect(response.headers.get('location')).toBe('https://www.pickrankgames.com/auth?status=error&next=%2Fadmin%2Fcontests');
    expect(response.headers.getSetCookie().join('\n')).toContain('pickrank_auth_next=');
    expect(createClientMock).not.toHaveBeenCalled();
  });

  it('clears stale Supabase cookies and redirects expired sessions back to auth', async () => {
    stubSupabaseEnv();
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockRejectedValue({
          code: 'refresh_token_not_found',
          message: 'Invalid Refresh Token: Refresh Token Not Found',
        }),
      },
    });
    const { GET } = await import('../../app/auth/callback/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/callback?code=abc', {
        headers: {
          cookie: 'pickrank_auth_next=/admin/contests; sb-example-auth-token=stale; sb-example-auth-token.0=stale-chunk',
        },
      }),
    );
    const location = new URL(response.headers.get('location') || '');
    const setCookie = response.headers.getSetCookie().join('\n');

    expect(location.origin).toBe('https://www.pickrankgames.com');
    expect(location.pathname).toBe('/auth');
    expect(location.searchParams.get('status')).toBe('error');
    expect(location.searchParams.get('next')).toBe('/admin/contests');
    expect(location.searchParams.get('message')).toBe(expiredSessionMessage);
    expect(setCookie).toContain('pickrank_auth_next=');
    expect(setCookie).toContain('sb-example-auth-token=');
    expect(setCookie).toContain('sb-example-auth-token.0=');
    expect(setCookie).toContain('Max-Age=0');
  });

  it('redirects successful auth exchanges to the sanitized return path', async () => {
    stubSupabaseEnv();
    createClientMock.mockResolvedValue({
      auth: {
        exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
      },
    });
    const { GET } = await import('../../app/auth/callback/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/callback?code=abc&next=//attacker.example'),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.pickrankgames.com/auth/continue?next=%2Fprofile',
    );
    expect(response.headers.getSetCookie().join('\n')).toContain('pickrank_auth_next=');
  });

  it('verifies token-hash magic links without requiring a PKCE code verifier', async () => {
    stubSupabaseEnv();
    const verifyOtp = vi.fn().mockResolvedValue({ error: null });
    createClientMock.mockResolvedValue({
      auth: {
        verifyOtp,
      },
    });
    const { GET } = await import('../../app/auth/confirm/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/confirm?token_hash=hash&type=email', {
        headers: {
          cookie: 'pickrank_auth_next=/contests/week-1/lineup',
        },
      }),
    );

    expect(verifyOtp).toHaveBeenCalledWith({ token_hash: 'hash', type: 'email' });
    expect(response.headers.get('location')).toBe(
      'https://www.pickrankgames.com/auth/continue?next=%2Fcontests%2Fweek-1%2Flineup',
    );
    expect(response.headers.getSetCookie().join('\n')).toContain('pickrank_auth_next=');
  });
});

function stubSupabaseEnv() {
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.pickrankgames.com');
}
