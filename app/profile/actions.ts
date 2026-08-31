'use server';

import { redirect } from 'next/navigation';
import {
  buildAuthHref,
  buildProfileCompletionDestination,
  classifyDateOfBirthForBeta,
  defaultReturnPath,
  normalizeDateOfBirth,
  normalizeJurisdiction,
  normalizeReturnPath,
  normalizeUsername,
  validateDateOfBirthForBeta,
  validateJurisdiction,
  validateUsername,
} from '@/lib/auth-profile';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
import { getViewerIdentity } from '@/lib/viewer-identity';

type ProfileSetupField =
  | 'username'
  | 'jurisdiction'
  | 'dateOfBirth'
  | 'termsAccepted'
  | 'privacyPolicyAccepted';

export type ProfileSetupActionState = {
  status: 'idle' | 'error';
  message?: string;
  fieldErrors?: Partial<Record<ProfileSetupField, string>>;
};

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

function setupError(
  message: string,
  fieldErrors?: ProfileSetupActionState['fieldErrors'],
): ProfileSetupActionState {
  return {
    status: 'error',
    message,
    fieldErrors,
  };
}

export async function completeProfileSetup(
  _previousState: ProfileSetupActionState,
  formData: FormData,
): Promise<ProfileSetupActionState> {
  const next = normalizeReturnPath(String(formData.get('next') || defaultReturnPath), defaultReturnPath);
  const usernameInput = String(formData.get('username') || '');
  const jurisdictionInput = String(formData.get('jurisdiction') || '');
  const dateOfBirthInput = String(formData.get('dateOfBirth') || '');
  const termsAccepted = formData.get('termsAccepted') === 'on';
  const privacyPolicyAccepted = formData.get('privacyPolicyAccepted') === 'on';

  if (!hasBrowserSupabaseConfig()) {
    return setupError('Profile setup is temporarily unavailable. Try again in a few minutes.');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(buildAuthHref(next));
  }

  const identity = await getViewerIdentity();

  if (!identity.isAuthenticated) {
    return setupError('PickRank could not load your Profile. Refresh the page and try again.');
  }

  const needsUsername = !identity.isProfileComplete;
  const needsEligibility = !identity.eligibility.isEligibilityComplete;

  if (!needsUsername && !needsEligibility) {
    redirect(buildProfileCompletionDestination(next));
  }

  const dateOfBirthStatus = needsEligibility ? classifyDateOfBirthForBeta(dateOfBirthInput) : 'eligible';
  const isUnder18Submission = needsEligibility && dateOfBirthStatus === 'under_18';
  const dobCaptureClient = supabase as unknown as {
    rpc: (
      functionName: 'capture_profile_date_of_birth',
      args: { target_date_of_birth: string },
    ) => Promise<{ data: DobCaptureResult[] | null; error: { message: string } | null }>;
  };

  if (isUnder18Submission) {
    const { data: dobCapture, error: dobError } = await dobCaptureClient.rpc('capture_profile_date_of_birth', {
      target_date_of_birth: dateOfBirthInput,
    });

    if (dobError) {
      return setupError(dobError.message, { dateOfBirth: dobError.message });
    }

    if (dobCapture?.[0]?.age_gate_status === 'blocked') {
      redirect(
        buildProfileRedirect(
          next,
          'error',
          'PickRank Early Access Beta is for users who are at least 18 years old.',
        ),
      );
    }
  }

  const fieldErrors: NonNullable<ProfileSetupActionState['fieldErrors']> = {};

  if (needsUsername) {
    const usernameMessage = validateUsername(usernameInput);

    if (usernameMessage) {
      fieldErrors.username = usernameMessage;
    }
  }

  if (needsEligibility) {
    const jurisdictionMessage = validateJurisdiction(jurisdictionInput);
    const dateOfBirthMessage = validateDateOfBirthForBeta(dateOfBirthInput);

    if (jurisdictionMessage) {
      fieldErrors.jurisdiction = jurisdictionMessage;
    }

    if (dateOfBirthMessage) {
      fieldErrors.dateOfBirth = dateOfBirthMessage;
    }

    if (!termsAccepted) {
      fieldErrors.termsAccepted = 'Accept the Beta Terms before beta entry.';
    }

    if (!privacyPolicyAccepted) {
      fieldErrors.privacyPolicyAccepted = 'Accept the Privacy Policy before beta entry.';
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return setupError('Correct the highlighted Profile fields and try again.', fieldErrors);
  }

  const now = new Date().toISOString();
  const authMetadata: Record<string, string> = {};

  if (needsUsername) {
    const username = normalizeUsername(usernameInput);
    authMetadata.username = username;
    authMetadata.display_name = username;
  }

  if (needsEligibility) {
    const jurisdiction = normalizeJurisdiction(jurisdictionInput);
    const dateOfBirth = normalizeDateOfBirth(dateOfBirthInput);

    if (!dateOfBirth) {
      return setupError('Enter a valid date of birth.', {
        dateOfBirth: 'Enter a valid date of birth.',
      });
    }

    const { data: dobCapture, error: dobError } = await dobCaptureClient.rpc('capture_profile_date_of_birth', {
      target_date_of_birth: dateOfBirth,
    });

    if (dobError) {
      return setupError(dobError.message, { dateOfBirth: dobError.message });
    }

    if (dobCapture?.[0]?.age_gate_status === 'blocked') {
      redirect(
        buildProfileRedirect(
          next,
          'error',
          'PickRank Early Access Beta is for users who are at least 18 years old.',
        ),
      );
    }

    const profileEligibilityClient = supabase.from('profiles') as unknown as {
      update: (values: ProfileEligibilityUpdate) => {
        eq: (column: 'id', value: string) => Promise<{ error: { message: string } | null }>;
      };
    };
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
      return setupError(profileError.message);
    }

    Object.assign(authMetadata, {
      jurisdiction,
      terms_accepted_at: now,
      privacy_policy_accepted_at: now,
      eligibility_status: 'pending_review',
      eligibility_checked_at: now,
      kyc_status: 'not_required',
      self_exclusion_status: 'none',
    });
  }

  const { error } = await supabase.auth.updateUser({ data: authMetadata });

  if (error) {
    return setupError(error.message, needsUsername ? { username: error.message } : undefined);
  }

  if (identity.isEmailVerified) {
    redirect(buildProfileCompletionDestination(next));
  }

  redirect(buildProfileRedirect(next, 'profile-saved'));
}
