import type { User } from '@supabase/supabase-js';

export const defaultReturnPath = '/profile';

export function normalizeReturnPath(value: string | null | undefined, fallback = defaultReturnPath) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

export function buildAuthHref(next = defaultReturnPath) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  return `/auth?${new URLSearchParams({ next: normalizedNext }).toString()}`;
}

export function buildProfileHref(next = defaultReturnPath) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  return `/profile?${new URLSearchParams({ next: normalizedNext }).toString()}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);

  if (!username) {
    return 'Enter a username to continue.';
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return 'Use 3-20 lowercase letters, numbers, or underscores.';
  }

  return null;
}

export function getProfileIdentity(user: User | null) {
  const metadata = user?.user_metadata ?? {};
  const username = typeof metadata.username === 'string' ? normalizeUsername(metadata.username) : '';
  const displayName = typeof metadata.display_name === 'string' ? metadata.display_name : username;
  const email = user?.email ?? '';
  const emailConfirmedAt = user?.email_confirmed_at ?? null;

  return {
    email,
    username,
    displayName,
    emailConfirmedAt,
    isProfileComplete: Boolean(username),
    isEmailVerified: Boolean(emailConfirmedAt),
  };
}
