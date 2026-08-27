'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { authReturnCookieMaxAgeSeconds, authReturnCookieName } from '@/lib/auth-return';
import {
  buildAuthStatusHref,
  defaultReturnPath,
  normalizeAuthSurface,
  normalizeReturnPath,
} from '@/lib/auth-profile';
import { getAppUrl, getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

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
  const authSurface = normalizeAuthSurface(formData.get('authSurface'));

  if (!email) {
    redirect(buildAuthStatusHref(authSurface, 'error', next, 'Enter an email address to continue.'));
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildAuthStatusHref(authSurface, 'error', next, 'Add the Supabase environment values before testing auth.'));
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
    redirect(buildAuthStatusHref(authSurface, 'error', next, getFriendlyAuthError(error.message)));
  }

  redirect(buildAuthStatusHref(authSurface, 'check-email', next));
}

export async function requestGoogleSignIn(formData: FormData) {
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);
  const authSurface = normalizeAuthSurface(formData.get('authSurface'));

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildAuthStatusHref(authSurface, 'error', next, 'Add the Supabase environment values before testing auth.'));
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
    redirect(
      buildAuthStatusHref(
        authSurface,
        'error',
        next,
        getFriendlyAuthError(error?.message || 'Google sign-in did not start.'),
      ),
    );
  }

  redirect(data.url);
}

export async function signOut() {
  if (hasBrowserSupabaseConfig()) {
    const supabase = await createClient();

    await supabase.auth.signOut();
  }

  redirect(buildAuthStatusHref('profile', 'signed-out', defaultReturnPath));
}
