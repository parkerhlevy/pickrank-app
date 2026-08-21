import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  authGetUser: vi.fn(),
  authUpdateUser: vi.fn(),
  createClient: vi.fn(),
  getViewerIdentity: vi.fn(),
  profileEq: vi.fn(),
  profileUpdate: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
  rpc: vi.fn(),
}));

vi.mock('next/navigation', () => ({ redirect: mocks.redirect }));
vi.mock('@/lib/env', () => ({ hasBrowserSupabaseConfig: () => true }));
vi.mock('@/lib/supabase/server', () => ({ createClient: mocks.createClient }));
vi.mock('@/lib/viewer-identity', () => ({ getViewerIdentity: mocks.getViewerIdentity }));

import { completeEligibilityProfile } from '../../app/profile/actions';

describe('profile eligibility actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.authUpdateUser.mockResolvedValue({ error: null });
    mocks.profileEq.mockResolvedValue({ error: null });
    mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
    mocks.rpc.mockResolvedValue({
      data: [{ age_gate_status: 'blocked' }],
      error: null,
    });
    mocks.createClient.mockReturnValue({
      auth: {
        getUser: mocks.authGetUser,
        updateUser: mocks.authUpdateUser,
      },
      from: vi.fn(() => ({ update: mocks.profileUpdate })),
      rpc: mocks.rpc,
    });
  });

  it('captures a valid under-18 DOB through the safeguard before redirecting', async () => {
    const formData = new FormData();
    formData.set('jurisdiction', 'CA');
    formData.set('dateOfBirth', '2010-01-01');

    await expect(completeEligibilityProfile(formData)).rejects.toThrow(
      'REDIRECT:/profile?next=%2Fprofile&status=error&message=PickRank+Early+Access+Beta+is+for+users+who+are+at+least+18+years+old.',
    );

    expect(mocks.rpc).toHaveBeenCalledWith('capture_profile_date_of_birth', {
      target_date_of_birth: '2010-01-01',
    });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.authUpdateUser).not.toHaveBeenCalled();
  });
});
