'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authReturnCookieMaxAgeSeconds, authReturnCookieName } from '@/lib/auth-return';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

function buildAuthRedirect(status: 'check-email' | 'error' | 'signed-out', next: string, message?: string) {
  const params = new URLSearchParams({
    status,
    next,
  });

  if (message) {
    params.set('message', message);
  }

  return `/auth?${params.toString()}`;
}

function getFriendlyAuthError(message: string) {
  if (message.includes('provider is not enabled')) {
    return 'Google sign-in is not configured in Supabase yet.';
  }

  return message;
}

async function saveAuthReturnPath(next: string) {
  const cookieStore = await cookies();

  cookieStore.set(authReturnCookieName, next, {
    httpOnly: true,
    maxAge: authReturnCookieMaxAgeSeconds,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);

  if (!email) {
    redirect(buildAuthRedirect('error', next, 'Enter an email address to continue.'));
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildAuthRedirect('error', next, 'Add the Supabase environment values before testing auth.'));
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const appOrigin = getRequestOrigin(requestHeaders, getAppUrl());
  await saveAuthReturnPath(next);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appOrigin}/auth/callback`,
    },
  });

  if (error) {
    redirect(buildAuthRedirect('error', next, getFriendlyAuthError(error.message)));
  }

  redirect(buildAuthRedirect('check-email', next));
}

export async function requestGoogleSignIn(formData: FormData) {
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildAuthRedirect('error', next, 'Add the Supabase environment values before testing auth.'));
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const appOrigin = getRequestOrigin(requestHeaders, getAppUrl());
  await saveAuthReturnPath(next);
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${appOrigin}/auth/callback`,
    },
  });

  if (error || !data.url) {
    redirect(buildAuthRedirect('error', next, getFriendlyAuthError(error?.message || 'Google sign-in did not start.')));
  }

  redirect(data.url);
}

export async function signOut() {
  if (hasBrowserSupabaseConfig()) {
    const supabase = await createClient();

    await supabase.auth.signOut();
  }

  redirect('/auth?status=signed-out&next=%2Fprofile');
}
