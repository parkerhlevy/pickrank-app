import { NextRequest, NextResponse } from 'next/server';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin } from '@/lib/env';
import {
  buildExpiredSessionRedirectPath,
  clearSupabaseSessionCookies,
} from '@/lib/supabase/session-recovery';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const next = normalizeReturnPath(requestUrl.searchParams.get('next'), defaultReturnPath);
  const response = NextResponse.redirect(new URL(buildExpiredSessionRedirectPath(next), requestOrigin));

  clearSupabaseSessionCookies(response, request.cookies);

  return response;
}
