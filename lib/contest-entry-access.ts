import { buildAuthHref, buildProfileHref, getProfileIdentity } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function getProtectedContestEntryRedirect(next: string) {
  if (!hasBrowserSupabaseConfig()) {
    return buildAuthHref(next);
  }

  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    const identity = getProfileIdentity(data.user);

    if (!data.user) {
      return buildAuthHref(next);
    }

    if (!identity.isProfileComplete) {
      return buildProfileHref(next);
    }
  } catch {
    return buildAuthHref(next);
  }

  return null;
}
