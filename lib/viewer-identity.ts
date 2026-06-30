import { cookies } from 'next/headers';
import { getProfileIdentity, type ProfileIdentity } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export const e2eAuthCookieName = 'pickrank_e2e_auth';

export type ViewerIdentity = ProfileIdentity & {
  isAuthenticated: boolean;
  source: 'anonymous' | 'supabase' | 'e2e-fixture';
};

const anonymousViewerIdentity: ViewerIdentity = {
  email: '',
  username: '',
  displayName: '',
  emailConfirmedAt: null,
  isAuthenticated: false,
  isEmailVerified: false,
  isProfileComplete: false,
  source: 'anonymous',
};

type E2eAuthCookiePayload = {
  email: string;
  username: string;
  displayName?: string;
  emailConfirmedAt?: string;
};

export function getE2eViewerIdentity(cookieValue: string | undefined): ViewerIdentity | null {
  if (process.env.PICKRANK_E2E_AUTH !== '1' || !cookieValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(cookieValue) as E2eAuthCookiePayload;

    if (typeof parsed.email !== 'string' || typeof parsed.username !== 'string') {
      return null;
    }

    const identity = getProfileIdentity({
      email: parsed.email,
      email_confirmed_at:
        typeof parsed.emailConfirmedAt === 'string' ? parsed.emailConfirmedAt : new Date().toISOString(),
      user_metadata: {
        username: parsed.username,
        display_name:
          typeof parsed.displayName === 'string' ? parsed.displayName : parsed.username,
      },
    } as never);

    return {
      ...identity,
      isAuthenticated: true,
      source: 'e2e-fixture',
    };
  } catch {
    return null;
  }
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
    };
  } catch {
    return anonymousViewerIdentity;
  }
}
