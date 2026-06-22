'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { defaultReturnPath, normalizeReturnPath } from '@/lib/auth-profile';
import { getRequestOrigin, hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

function buildAuthRedirect(status: 'check-email' | 'error', message?: string) {
  const params = new URLSearchParams({ status });

  if (message) {
    params.set('message', message);
  }

  return `/auth?${params.toString()}`;
}

export async function requestMagicLink(formData: FormData) {
  const email = String(formData.get('email') || '').trim();
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);

  if (!email) {
    redirect(buildAuthRedirect('error', 'Enter an email address to continue.'));
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildAuthRedirect('error', 'Add the Supabase environment values before testing auth.'));
  }

  const supabase = await createClient();
  const requestHeaders = await headers();
  const appOrigin = getRequestOrigin(requestHeaders);
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${appOrigin}/auth/callback?${new URLSearchParams({ next }).toString()}`,
    },
  });

  if (error) {
    redirect(buildAuthRedirect('error', error.message));
  }

  redirect(buildAuthRedirect('check-email'));
}
