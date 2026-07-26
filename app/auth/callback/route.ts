import { NextRequest, NextResponse } from 'next/server';
import { authReturnCookieName } from '@/lib/auth-return';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const authCode = requestUrl.searchParams.get('code');
  const next = normalizeReturnPath(requestUrl.searchParams.get('next') || request.cookies.get(authReturnCookieName)?.value, defaultReturnPath);

  if (!hasBrowserSupabaseConfig() || !authCode) {
    const response = NextResponse.redirect(new URL(`/auth?status=error&next=${encodeURIComponent(next)}`, requestOrigin));
    response.cookies.delete(authReturnCookieName);

    return response;
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
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
