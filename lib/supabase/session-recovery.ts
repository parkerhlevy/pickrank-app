import type { NextRequest, NextResponse } from 'next/server';
import { authReturnCookieName } from '@/lib/auth-return';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';

export const expiredSessionMessage = 'Your sign-in session expired. Please sign in again.';

type CookieSource = Pick<NextRequest['cookies'], 'getAll'>;

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  name?: unknown;
  status?: unknown;
};

export function isInvalidSupabaseRefreshTokenError(error: unknown) {
  const authError = error as ErrorLike;
  const message = typeof authError?.message === 'string' ? authError.message : '';

  return (
    authError?.code === 'refresh_token_not_found' ||
    message.includes('Invalid Refresh Token') ||
    message.includes('Refresh Token Not Found')
  );
}

export function isSupabaseAuthCookieName(name: string) {
  return name.startsWith('sb-') && name.includes('-auth-token');
}

export function clearSupabaseSessionCookies(response: NextResponse, cookieSource?: CookieSource) {
  for (const name of getSupabaseSessionCookieNames(cookieSource)) {
    response.cookies.set(name, '', {
      httpOnly: true,
      maxAge: 0,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  }
}

export function buildSessionExpiredHref(next = defaultReturnPath) {
  return `/auth/session-expired?${new URLSearchParams({ next: normalizeReturnPath(next, defaultReturnPath) }).toString()}`;
}

export function buildExpiredSessionRedirectPath(next = defaultReturnPath, mode: 'auth' | 'retry' = getExpiredSessionRedirectMode(next)) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  if (mode === 'retry') {
    return normalizedNext;
  }

  return `/auth?${new URLSearchParams({
    status: 'error',
    next: normalizedNext,
    message: expiredSessionMessage,
  }).toString()}`;
}

function getExpiredSessionRedirectMode(next: string) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  return isPublicSessionRetryPath(normalizedNext) ? 'retry' : 'auth';
}

function isPublicSessionRetryPath(path: string) {
  return path === '/leaderboard' || path.startsWith('/leaderboard?');
}

function getSupabaseSessionCookieNames(cookieSource?: CookieSource) {
  const names = new Set<string>([authReturnCookieName]);
  const configuredCookieBaseName = getConfiguredSupabaseCookieBaseName();

  if (configuredCookieBaseName) {
    names.add(configuredCookieBaseName);

    for (let index = 0; index < 10; index += 1) {
      names.add(`${configuredCookieBaseName}.${index}`);
    }
  }

  cookieSource?.getAll().forEach((cookie) => {
    if (isSupabaseAuthCookieName(cookie.name)) {
      names.add(cookie.name);
    }
  });

  return names;
}

function getConfiguredSupabaseCookieBaseName() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return '';
  }

  try {
    const projectRef = new URL(supabaseUrl).hostname.split('.')[0];

    return projectRef ? `sb-${projectRef}-auth-token` : '';
  } catch {
    return '';
  }
}
