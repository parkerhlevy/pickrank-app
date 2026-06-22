import type { User } from '@supabase/supabase-js';

export const defaultReturnPath = '/profile';

const usernamePattern = /^[a-z0-9_]{3,20}$/;

export function normalizeReturnPath(value: string | null | undefined, fallback = defaultReturnPath) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  try {
    const url = new URL(value, 'http://localhost');

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}

export function buildAuthHref(next: string | null | undefined) {
  const normalizedNext = normalizeReturnPath(next);
  const params = new URLSearchParams();

  if (normalizedNext !== defaultReturnPath) {
    params.set('next', normalizedNext);
  }

  return params.size > 0 ? `/auth?${params.toString()}` : '/auth';
}

export function buildProfileHref(next: string | null | undefined) {
  const normalizedNext = normalizeReturnPath(next);

  if (normalizedNext === defaultReturnPath) {
    return '/profile';
  }

  return `/profile?${new URLSearchParams({ next: normalizedNext }).toString()}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);

  if (!username) {
    return 'Choose a username to continue.';
  }

  if (!usernamePattern.test(username)) {
    return 'Username must be 3-20 characters using lowercase letters, numbers, or underscores.';
  }

  return null;
}

export function getProfileIdentity(user: User | null) {
  const username = typeof user?.user_metadata?.username === 'string' ? normalizeUsername(user.user_metadata.username) : null;
  const displayName =
    typeof user?.user_metadata?.display_name === 'string' && user.user_metadata.display_name.trim().length > 0
      ? user.user_metadata.display_name.trim()
      : username;

  return {
    email: user?.email ?? null,
    username,
    displayName,
    emailVerified: Boolean(user?.email_confirmed_at),
    isProfileComplete: Boolean(username),
  };
}
