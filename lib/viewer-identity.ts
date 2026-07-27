import { cookies } from 'next/headers';
import { getProfileIdentity, type EligibilityStatus, type ProfileIdentity } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const e2eAuthCookieName = 'pickrank_e2e_auth';

export type ViewerIdentity = ProfileIdentity & {
  isAuthenticated: boolean;
  source: 'anonymous' | 'supabase' | 'e2e-fixture';
  userId: string | null;
};

const anonymousViewerIdentity: ViewerIdentity = {
  ...getProfileIdentity(null),
  isAuthenticated: false,
  source: 'anonymous',
  userId: null,
};

type E2eAuthCookiePayload = {
  email: string;
  username: string;
  displayName?: string;
  emailConfirmedAt?: string;
  userId?: string;
  roleSlugs?: string[];
  ageConfirmed?: boolean;
  jurisdiction?: string;
  termsAcceptedAt?: string;
  privacyPolicyAcceptedAt?: string;
  eligibilityStatus?: EligibilityStatus;
};

export const defaultE2eViewerUserId = '00000000-0000-4000-8000-000000000001';

export type E2eAuthFixture = {
  email: string;
  username: string;
  displayName: string;
  emailConfirmedAt: string;
  userId: string;
  roleSlugs: string[];
  ageConfirmed: boolean;
  jurisdiction: string;
  termsAcceptedAt: string;
  privacyPolicyAcceptedAt: string;
  eligibilityStatus: EligibilityStatus;
};

export function getE2eAuthFixture(cookieValue: string | undefined): E2eAuthFixture | null {
  if (process.env.NODE_ENV === 'production' || process.env.PICKRANK_E2E_AUTH !== '1' || !cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as E2eAuthCookiePayload;

    if (typeof parsed.email !== 'string' || typeof parsed.username !== 'string') {
      return null;
    }

    return {
      email: parsed.email,
      username: parsed.username,
      displayName: typeof parsed.displayName === 'string' ? parsed.displayName : parsed.username,
      emailConfirmedAt:
        typeof parsed.emailConfirmedAt === 'string' ? parsed.emailConfirmedAt : new Date().toISOString(),
      userId: typeof parsed.userId === 'string' ? parsed.userId : defaultE2eViewerUserId,
      roleSlugs:
        Array.isArray(parsed.roleSlugs) && parsed.roleSlugs.every((value) => typeof value === 'string')
          ? parsed.roleSlugs
          : [],
      ageConfirmed: parsed.ageConfirmed === true,
      jurisdiction: typeof parsed.jurisdiction === 'string' ? parsed.jurisdiction : '',
      termsAcceptedAt:
        typeof parsed.termsAcceptedAt === 'string' ? parsed.termsAcceptedAt : '',
      privacyPolicyAcceptedAt:
        typeof parsed.privacyPolicyAcceptedAt === 'string' ? parsed.privacyPolicyAcceptedAt : '',
      eligibilityStatus:
        parsed.eligibilityStatus === 'eligible' ||
        parsed.eligibilityStatus === 'eligible_for_internal_testing' ||
        parsed.eligibilityStatus === 'blocked' ||
        parsed.eligibilityStatus === 'pending_review'
          ? parsed.eligibilityStatus
          : 'unknown',
    };
  } catch {
    return null;
  }
}

export function getE2eViewerIdentity(cookieValue: string | undefined): ViewerIdentity | null {
  const fixture = getE2eAuthFixture(cookieValue);

  if (!fixture) {
    return null;
  }

  const identity = getProfileIdentity({
    email: fixture.email,
    email_confirmed_at: fixture.emailConfirmedAt,
    user_metadata: {
      username: fixture.username,
      display_name: fixture.displayName,
      age_confirmed: fixture.ageConfirmed,
      jurisdiction: fixture.jurisdiction,
      terms_accepted_at: fixture.termsAcceptedAt,
      privacy_policy_accepted_at: fixture.privacyPolicyAcceptedAt,
      account_status: 'active',
      eligibility_status: fixture.eligibilityStatus,
      eligibility_checked_at: fixture.termsAcceptedAt || null,
      age_gate_status: fixture.ageConfirmed ? 'confirmed' : 'unknown',
      kyc_status: 'not_required',
      self_exclusion_status: 'none',
    },
  } as never);

  return {
    ...identity,
    isAuthenticated: true,
    source: 'e2e-fixture',
    userId: fixture.userId,
  };
}

export async function getViewerIdentity(): Promise<ViewerIdentity> {
  const cookieStore = await cookies();
  const e2eIdentity = getE2eViewerIdentity(cookieStore.get(e2eAuthCookieName)?.value);

  if (e2eIdentity) {
    return e2eIdentity;
  }

  if (!hasBrowserSupabaseConfig()) {
    return anonymousViewerIdentity;
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      return anonymousViewerIdentity;
    }

    return {
      ...getProfileIdentity(data.user),
      isAuthenticated: true,
      source: 'supabase',
      userId: data.user.id,
    };
  } catch {
    return anonymousViewerIdentity;
  }
}
