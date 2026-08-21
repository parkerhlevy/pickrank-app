'use server';

import { redirect } from 'next/navigation';
import {
  buildAuthHref,
  classifyDateOfBirthForBeta,
  defaultReturnPath,
  normalizeDateOfBirth,
  normalizeJurisdiction,
  normalizeReturnPath,
  normalizeUsername,
  validateEligibilityAcknowledgements,
  validateUsername,
} from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { getViewerIdentity } from '@/lib/viewer-identity';

type DobCaptureResult = {
  age_gate_status: string;
};

type ProfileEligibilityUpdate = {
  eligibility_checked_at: string;
  jurisdiction: string;
  kyc_status: string;
  privacy_policy_accepted_at: string;
  terms_accepted_at: string;
};

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

  const identity = await getViewerIdentity();
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
  const dateOfBirthStatus = classifyDateOfBirthForBeta(dateOfBirthInput);
  const isUnder18Submission = dateOfBirthStatus === 'under_18';
  const validationMessage = isUnder18Submission
    ? null
    : validateEligibilityAcknowledgements({
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

  const now = new Date().toISOString();
  const jurisdiction = normalizeJurisdiction(jurisdictionInput);
  const dateOfBirth = normalizeDateOfBirth(dateOfBirthInput);

  if (!dateOfBirth) {
    redirect(buildProfileRedirect(next, 'error', 'Enter a valid date of birth.'));
  }

  const dobCaptureClient = supabase as unknown as {
    rpc: (
      functionName: 'capture_profile_date_of_birth',
      args: { target_date_of_birth: string },
    ) => Promise<{ data: DobCaptureResult[] | null; error: { message: string } | null }>;
  };
  const profileEligibilityClient = supabase.from('profiles') as unknown as {
    update: (values: ProfileEligibilityUpdate) => {
      eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
    };
  };
  const { data: dobCapture, error: dobError } = await dobCaptureClient.rpc('capture_profile_date_of_birth', {
    target_date_of_birth: dateOfBirth,
  });

  if (dobError) {
    redirect(buildProfileRedirect(next, 'error', dobError.message));
  }

  if (dobCapture?.[0]?.age_gate_status === 'blocked') {
    redirect(buildProfileRedirect(next, 'error', 'PickRank Early Access Beta is for users who are at least 18 years old.'));
  }

  if (isUnder18Submission) {
    const existingProfileValidationMessage = validateEligibilityAcknowledgements({
      dateOfBirth: dateOfBirthInput,
      termsAccepted,
      privacyPolicyAccepted,
      jurisdiction: jurisdictionInput,
    });

    if (existingProfileValidationMessage) {
      redirect(buildProfileRedirect(next, 'error', existingProfileValidationMessage));
    }
  }

  const { error: profileError } = await profileEligibilityClient
    .update({
      jurisdiction,
      terms_accepted_at: now,
      privacy_policy_accepted_at: now,
      eligibility_checked_at: now,
      kyc_status: 'not_required',
    })
    .eq('id', user.id);

  if (profileError) {
    redirect(buildProfileRedirect(next, 'error', profileError.message));
  }

  const { error } = await supabase.auth.updateUser({
    data: {
      jurisdiction,
      terms_accepted_at: now,
      privacy_policy_accepted_at: now,
      eligibility_status: 'pending_review',
      eligibility_checked_at: now,
      kyc_status: 'not_required',
      self_exclusion_status: 'none',
    },
  });

  if (error) {
    redirect(buildProfileRedirect(next, 'error', error.message));
  }

  redirect(buildProfileRedirect(next, 'profile-saved'));
}
