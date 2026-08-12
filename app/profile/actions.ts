'use server';

import { redirect } from 'next/navigation';
import {
  buildAuthHref,
  defaultReturnPath,
  getProfileIdentity,
  normalizeDateOfBirth,
  normalizeJurisdiction,
  normalizeReturnPath,
  normalizeUsername,
  validateEligibilityAcknowledgements,
  validateUsername,
} from '@/lib/auth-profile';
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

  const identity = getProfileIdentity(user);
  if (next !== defaultReturnPath && identity.isEmailVerified && identity.eligibility.isEligibilityComplete) {
    redirect(next);
  }

  redirect(buildProfileRedirect(next, 'profile-saved'));
}

export async function completeEligibilityProfile(formData: FormData) {
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);
  const jurisdictionInput = String(formData.get('jurisdiction') || '');
  const dateOfBirthInput = String(formData.get('dateOfBirth') || '');
  const termsAccepted = formData.get('termsAccepted') === 'on';
  const privacyPolicyAccepted = formData.get('privacyPolicyAccepted') === 'on';
  const validationMessage = validateEligibilityAcknowledgements({
    dateOfBirth: dateOfBirthInput,
    termsAccepted,
    privacyPolicyAccepted,
    jurisdiction: jurisdictionInput,
  });

  if (validationMessage) {
    redirect(buildProfileRedirect(next, 'error', validationMessage));
  }

  if (!hasBrowserSupabaseConfig()) {
    redirect(buildProfileRedirect(next, 'error', 'Add the Supabase environment values before testing eligibility capture.'));
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildAuthHref(next));
  }

  const identity = getProfileIdentity(user);

  if (identity.eligibility.accountStatus !== 'active' || identity.eligibility.eligibilityStatus === 'blocked') {
    redirect(
      buildProfileRedirect(
        next,
        'error',
        'Your account is restricted from beta entry. Contact support if you think this is a mistake.',
      ),
    );
  }

  const now = new Date().toISOString();
  const jurisdiction = normalizeJurisdiction(jurisdictionInput);
  const dateOfBirth = normalizeDateOfBirth(dateOfBirthInput);

  if (!dateOfBirth) {
    redirect(buildProfileRedirect(next, 'error', 'Enter a valid date of birth.'));
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      date_of_birth: dateOfBirth,
      age_confirmed: true,
      jurisdiction,
      terms_accepted_at: now,
      privacy_policy_accepted_at: now,
      account_status: 'active',
      eligibility_status: 'pending_review',
      eligibility_checked_at: now,
      age_gate_status: 'confirmed',
      kyc_status: 'not_required',
      self_exclusion_status: 'none',
    },
  });

  if (error) {
    redirect(buildProfileRedirect(next, 'error', error.message));
  }

  redirect(buildProfileRedirect(next, 'profile-saved'));
}
