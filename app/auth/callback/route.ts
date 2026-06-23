import { NextResponse } from 'next/server';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const authCode = requestUrl.searchParams.get('code');
  const next = normalizeReturnPath(requestUrl.searchParams.get('next'), defaultReturnPath);

  if (!hasBrowserSupabaseConfig() || !authCode) {
    return NextResponse.redirect(new URL(`/auth?status=error&next=${encodeURIComponent(next)}`, requestOrigin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    const redirectUrl = new URL('/auth', requestOrigin);
    redirectUrl.searchParams.set('status', 'error');
    redirectUrl.searchParams.set('next', next);
    redirectUrl.searchParams.set('message', error.message);

    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.redirect(new URL(next, requestOrigin));
}
