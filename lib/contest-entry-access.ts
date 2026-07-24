import {
  buildAuthHref,
  buildProfileHref,
  eligibilityToEnterContestsMessage,
  verifyEmailToEnterContestsMessage,
} from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { getViewerIdentity } from '@/lib/viewer-identity';

export function getProtectedContestEntryHref({
  next,
  hasSupabaseConfig,
  isAuthenticated,
  isProfileComplete,
  isEmailVerified,
  isEligibilityComplete = true,
}: {
  next: string;
  hasSupabaseConfig: boolean;
  isAuthenticated: boolean;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  isEligibilityComplete?: boolean;
}) {
  if (!hasSupabaseConfig || !isAuthenticated) {
    return buildAuthHref(next);
  }

  if (!isProfileComplete) {
    return buildProfileHref(next);
  }

  if (!isEmailVerified) {
    return buildProfileHref(next, {
      status: 'error',
      message: verifyEmailToEnterContestsMessage,
    });
  }

  if (!isEligibilityComplete) {
    return buildProfileHref(next, {
      status: 'error',
      message: eligibilityToEnterContestsMessage,
    });
  }

  return null;
}

export async function getProtectedContestEntryRedirect(next: string) {
  const hasSupabaseConfig = hasBrowserSupabaseConfig();

  try {
    const identity = await getViewerIdentity();

    return getProtectedContestEntryHref({
      next,
      hasSupabaseConfig: hasSupabaseConfig || identity.source === 'e2e-fixture',
      isAuthenticated: identity.isAuthenticated,
      isProfileComplete: identity.isProfileComplete,
      isEmailVerified: identity.isEmailVerified,
      isEligibilityComplete: identity.eligibility.isEligibilityComplete,
    });
  } catch {
    return buildAuthHref(next);
  }
}
