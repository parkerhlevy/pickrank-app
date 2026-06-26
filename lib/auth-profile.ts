import type { User } from '@supabase/supabase-js';

export const defaultReturnPath = '/profile';

type ReturnStepCopy = {
  actionLabel: string;
  detail: string;
  isContestFlow: boolean;
  shortLabel: string;
};

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

export function getReturnStepCopy(next: string): ReturnStepCopy {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  if (normalizedNext === defaultReturnPath) {
    return {
      actionLabel: 'Continue to Profile',
      detail: 'Profile',
      isContestFlow: false,
      shortLabel: 'Profile',
    };
  }

  if (!normalizedNext.startsWith('/contests/')) {
    return {
      actionLabel: 'Continue',
      detail: normalizedNext,
      isContestFlow: false,
      shortLabel: 'Next Step',
    };
  }

  const [pathPart, queryString = ''] = normalizedNext.split('?');
  const contestTitle = pathPart
    .replace('/contests/', '')
    .split('/')[0]
    .split('-')
    .map((segment) => {
      if (!segment.length) {
        return segment;
      }

      if (segment.length <= 2) {
        return segment.toUpperCase();
      }

      return `${segment[0].toUpperCase()}${segment.slice(1)}`;
    })
    .join(' ');
  const stage = new URLSearchParams(queryString).get('stage');
  const isPaymentPath = pathPart.endsWith('/payment');
  const isSuccessPath = pathPart.endsWith('/success');
  const isLineupPath = pathPart.endsWith('/lineup');

  if (stage === 'payment-review' || isPaymentPath) {
    return {
      actionLabel: 'Continue to Payment Review',
      detail: `Payment Review for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Payment Review',
    };
  }

  if (stage === 'entered' || isSuccessPath) {
    return {
      actionLabel: 'Continue to Entry Success',
      detail: `Entry Success for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Entry Success',
    };
  }

  if (stage === 'lineup' || isLineupPath) {
    return {
      actionLabel: 'Continue to Build Your Lineup',
      detail: `Build Your Lineup for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Build Your Lineup',
    };
  }

  return {
    actionLabel: 'Continue to Contest Entry',
    detail: `Contest Entry for ${contestTitle}`,
    isContestFlow: true,
    shortLabel: 'Contest Entry',
  };
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
