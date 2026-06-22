'use server';

import { redirect } from 'next/navigation';
import { buildAuthHref, defaultReturnPath, normalizeReturnPath, normalizeUsername, validateUsername } from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';

function buildProfileRedirect({
  status,
  message,
  next,
}: {
  status: 'error' | 'profile-saved';
  message?: string;
  next?: string;
}) {
  const params = new URLSearchParams({ status });
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  if (message) {
    params.set('message', message);
  }

  if (normalizedNext !== defaultReturnPath) {
    params.set('next', normalizedNext);
  }

  return `/profile?${params.toString()}`;
}

export async function completeProfile(formData: FormData) {
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);
  const usernameInput = String(formData.get('username') || '');
  const validationMessage = validateUsername(usernameInput);

  if (validationMessage) {
    redirect(
      buildProfileRedirect({
        status: 'error',
        message: validationMessage,
        next,
      }),
    );
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(
      buildProfileRedirect({
        status: 'error',
        message: 'Add the Supabase environment values before testing profile completion.',
        next,
      }),
    );
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
    redirect(
      buildProfileRedirect({
        status: 'error',
        message: error.message,
        next,
      }),
    );
  }

  if (next !== defaultReturnPath) {
    redirect(next);
  }

  redirect(buildProfileRedirect({ status: 'profile-saved' }));
}
