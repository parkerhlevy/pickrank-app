'use server';

import { redirect } from 'next/navigation';
import { buildAuthHref, defaultReturnPath, normalizeReturnPath, normalizeUsername, validateUsername } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

function buildProfileRedirect(next: string, status: 'error' | 'profile-saved', message?: string) {
  const params = new URLSearchParams({
    next,
    status,
  });

  if (message) {
    params.set('message', message);
  }

  return `/profile?${params.toString()}`;
}

export async function completeProfile(formData: FormData) {
  const usernameInput = String(formData.get('username') || '');
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);
  const validationMessage = validateUsername(usernameInput);

  if (validationMessage) {
    redirect(buildProfileRedirect(next, 'error', validationMessage));
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildProfileRedirect(next, 'error', 'Add the Supabase environment values before testing profile completion.'));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildAuthHref(next));
  }

  const username = normalizeUsername(usernameInput);
  const { error } = await supabase.auth.updateUser({
    data: {
      username,
      display_name: username,
    },
  });

  if (error) {
    redirect(buildProfileRedirect(next, 'error', error.message));
  }

  if (next !== defaultReturnPath) {
    redirect(next);
  }

  redirect(buildProfileRedirect(defaultReturnPath, 'profile-saved'));
}
