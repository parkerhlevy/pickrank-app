import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

const getViewerIdentityMock = vi.fn();

vi.mock('../../lib/viewer-identity', () => ({
  getViewerIdentity: getViewerIdentityMock,
}));

describe('auth continuation route', () => {
  afterEach(() => {
    getViewerIdentityMock.mockReset();
    vi.unstubAllEnvs();
  });

  it('sends a complete returning user from Profile sign-in to Contests', async () => {
    stubAppEnv();
    getViewerIdentityMock.mockResolvedValue({
      isAuthenticated: true,
      isProfileComplete: true,
      eligibility: { isEligibilityComplete: true },
    });
    const { GET } = await import('../../app/auth/continue/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/continue?next=%2Fprofile'),
    );

    expect(response.headers.get('location')).toBe('https://www.pickrankgames.com/contests');
  });

  it('sends an incomplete user to one Profile setup form before the intended destination', async () => {
    stubAppEnv();
    getViewerIdentityMock.mockResolvedValue({
      isAuthenticated: true,
      isProfileComplete: false,
      eligibility: { isEligibilityComplete: false },
    });
    const { GET } = await import('../../app/auth/continue/route');
    const response = await GET(
      new NextRequest(
        'https://www.pickrankgames.com/auth/continue?next=%2Fcontests%2Fweek-1-qb-passing-yards',
      ),
    );

    expect(response.headers.get('location')).toBe(
      'https://www.pickrankgames.com/profile?next=%2Fcontests%2Fweek-1-qb-passing-yards',
    );
  });

  it('returns an unconfirmed session to Auth without accepting an external destination', async () => {
    stubAppEnv();
    getViewerIdentityMock.mockResolvedValue({
      isAuthenticated: false,
      isProfileComplete: false,
      eligibility: { isEligibilityComplete: false },
    });
    const { GET } = await import('../../app/auth/continue/route');
    const response = await GET(
      new NextRequest('https://www.pickrankgames.com/auth/continue?next=%2F%2Fattacker.example'),
    );
    const location = new URL(response.headers.get('location') || '');

    expect(location.origin).toBe('https://www.pickrankgames.com');
    expect(location.pathname).toBe('/auth');
    expect(location.searchParams.get('next')).toBe('/profile');
    expect(location.searchParams.get('status')).toBe('error');
  });
});

function stubAppEnv() {
  vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://www.pickrankgames.com');
}
