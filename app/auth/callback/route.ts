import { NextResponse } from 'next/server';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { createClient } from '@/lib/supabase/server';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const authCode = requestUrl.searchParams.get('code');
  const next = normalizeReturnPath(requestUrl.searchParams.get('next'), defaultReturnPath);

  if (!hasBrowserSupabaseConfig() || !authCode) {
    return NextResponse.redirect(new URL('/auth?status=error', requestOrigin));
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(authCode);

  if (error) {
    return NextResponse.redirect(new URL('/auth?status=error', requestOrigin));
  }

  return NextResponse.redirect(new URL(next, requestOrigin));
}
