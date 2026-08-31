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

import { completeProfileSetup } from '../../app/profile/actions';

const initialState = { status: 'idle' as const };

describe('Profile setup action', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.authGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });
    mocks.authUpdateUser.mockResolvedValue({ error: null });
    mocks.profileEq.mockResolvedValue({ error: null });
    mocks.profileUpdate.mockReturnValue({ eq: mocks.profileEq });
    mocks.rpc.mockResolvedValue({
      data: [{ age_gate_status: 'confirmed' }],
      error: null,
    });
    mocks.getViewerIdentity.mockResolvedValue({
      isAuthenticated: true,
      isEmailVerified: true,
      isProfileComplete: false,
      eligibility: {
        isEligibilityComplete: false,
      },
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

  it('validates every missing Profile field in one submission without writing partial data', async () => {
    const formData = new FormData();
    formData.set('username', 'ab');

    await expect(completeProfileSetup(initialState, formData)).resolves.toEqual({
      status: 'error',
      message: 'Correct the highlighted Profile fields and try again.',
      fieldErrors: {
        username: 'Use 3-20 lowercase letters, numbers, or underscores.',
        jurisdiction: 'Choose your state or jurisdiction to continue.',
        dateOfBirth: 'Enter a valid date of birth.',
        termsAccepted: 'Accept the Beta Terms before beta entry.',
        privacyPolicyAccepted: 'Accept the Privacy Policy before beta entry.',
      },
    });

    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.authUpdateUser).not.toHaveBeenCalled();
  });

  it('captures a valid under-18 DOB through the safeguard before redirecting', async () => {
    mocks.rpc.mockResolvedValue({
      data: [{ age_gate_status: 'blocked' }],
      error: null,
    });
    const formData = buildCompleteFormData();
    formData.set('dateOfBirth', '2010-01-01');

    await expect(completeProfileSetup(initialState, formData)).rejects.toThrow(
      'REDIRECT:/profile?next=%2Fprofile&status=error&message=PickRank+Early+Access+Beta+is+for+users+who+are+at+least+18+years+old.',
    );

    expect(mocks.rpc).toHaveBeenCalledWith('capture_profile_date_of_birth', {
      target_date_of_birth: '2010-01-01',
    });
    expect(mocks.profileUpdate).not.toHaveBeenCalled();
    expect(mocks.authUpdateUser).not.toHaveBeenCalled();
  });

  it('saves username and entry details once, then continues to Contests', async () => {
    const formData = buildCompleteFormData();

    await expect(completeProfileSetup(initialState, formData)).rejects.toThrow(
      'REDIRECT:/contests?status=profile-complete',
    );

    expect(mocks.rpc).toHaveBeenCalledWith('capture_profile_date_of_birth', {
      target_date_of_birth: '1990-01-01',
    });
    expect(mocks.profileUpdate).toHaveBeenCalledWith({
      jurisdiction: 'CA',
      terms_accepted_at: expect.any(String),
      privacy_policy_accepted_at: expect.any(String),
      eligibility_checked_at: expect.any(String),
      kyc_status: 'not_required',
    });
    expect(mocks.authUpdateUser).toHaveBeenCalledWith({
      data: {
        username: 'parker_1',
        display_name: 'parker_1',
        jurisdiction: 'CA',
        terms_accepted_at: expect.any(String),
        privacy_policy_accepted_at: expect.any(String),
        eligibility_status: 'pending_review',
        eligibility_checked_at: expect.any(String),
        kyc_status: 'not_required',
        self_exclusion_status: 'none',
      },
    });
  });

  it('updates only missing entry details for a Profile that already has a username', async () => {
    mocks.getViewerIdentity.mockResolvedValue({
      isAuthenticated: true,
      isEmailVerified: true,
      isProfileComplete: true,
      eligibility: {
        isEligibilityComplete: false,
      },
    });
    const formData = buildCompleteFormData();
    formData.set('next', '/contests/week-1-qb-passing-yards');

    await expect(completeProfileSetup(initialState, formData)).rejects.toThrow(
      'REDIRECT:/contests/week-1-qb-passing-yards',
    );

    expect(mocks.authUpdateUser).toHaveBeenCalledWith({
      data: expect.not.objectContaining({ username: expect.anything() }),
    });
  });
});

function buildCompleteFormData() {
  const formData = new FormData();
  formData.set('username', 'Parker_1');
  formData.set('jurisdiction', 'ca');
  formData.set('dateOfBirth', '1990-01-01');
  formData.set('termsAccepted', 'on');
  formData.set('privacyPolicyAccepted', 'on');
  return formData;
}
