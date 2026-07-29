import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { expiredSessionMessage } from '../../lib/supabase/session-recovery';
import { GET } from '../../app/auth/session-expired/route';

describe('auth session-expired route', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('clears stale cookies and sends protected destinations back through auth', async () => {
    stubAppEnv();
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/session-expired?next=/admin/contests', {
        headers: {
          cookie: 'pickrank_auth_next=/admin/contests; sb-example-auth-token=stale',
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
    expect(setCookie).toContain('Max-Age=0');
  });

  it('clears stale cookies and retries public leaderboard destinations', async () => {
    stubAppEnv();
    const response = await GET(
      new NextRequest(
        'https://www.pickrankgames.com/auth/session-expired?next=/leaderboard?contest=week-1-qb-passing-yards',
        {
          headers: {
            cookie: 'pickrank_auth_next=/leaderboard; sb-example-auth-token=stale',
          },
        },
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.pickrankgames.com/leaderboard?contest=week-1-qb-passing-yards',
    );
    expect(response.headers.getSetCookie().join('\n')).toContain('sb-example-auth-token=');
  });
});

function stubAppEnv() {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.pickrankgames.com');
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
}
