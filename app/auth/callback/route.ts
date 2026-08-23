import { NextRequest, NextResponse } from 'next/server';
import { authReturnCookieName } from '@/lib/auth-return';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import {
  buildExpiredSessionRedirectPath,
  clearSupabaseSessionCookies,
  isInvalidSupabaseRefreshTokenError,
} from '@/lib/supabase/session-recovery';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const authCode = requestUrl.searchParams.get('code');
  const tokenHash = requestUrl.searchParams.get('token_hash');
  const otpType = requestUrl.searchParams.get('type') || 'email';
  const next = normalizeReturnPath(requestUrl.searchParams.get('next') || request.cookies.get(authReturnCookieName)?.value, defaultReturnPath);

  if (!hasBrowserSupabaseConfig() || (!authCode && !tokenHash)) {
    const response = NextResponse.redirect(new URL(`/auth?status=error&next=${encodeURIComponent(next)}`, requestOrigin));
    response.cookies.delete(authReturnCookieName);

    return response;
  }

  const supabase = await createClient();
  let error: { message: string } | null = null;

  try {
    const result = tokenHash
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: otpType })
      : await supabase.auth.exchangeCodeForSession(authCode!);
    error = result.error;
  } catch (caughtError) {
    if (isInvalidSupabaseRefreshTokenError(caughtError)) {
      const response = NextResponse.redirect(new URL(buildExpiredSessionRedirectPath(next, 'auth'), requestOrigin));
      clearSupabaseSessionCookies(response, request.cookies);

      return response;
    }

    throw caughtError;
  }

  if (error) {
    if (isInvalidSupabaseRefreshTokenError(error)) {
      const response = NextResponse.redirect(new URL(buildExpiredSessionRedirectPath(next, 'auth'), requestOrigin));
      clearSupabaseSessionCookies(response, request.cookies);

      return response;
    }

    const redirectUrl = new URL('/auth', requestOrigin);
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('next', next);
    redirectUrl.searchParams.set('message', error.message);

    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete(authReturnCookieName);

    return response;
  }

  const response = NextResponse.redirect(new URL(next, requestOrigin));
  response.cookies.delete(authReturnCookieName);

  return response;
}
