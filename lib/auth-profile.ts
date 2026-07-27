import type { User } from '@supabase/supabase-js';

export const defaultReturnPath = '/profile';
export const verifyEmailToEnterContestsMessage = 'Verify your email to enter contests.';
export const eligibilityToEnterContestsMessage =
  'Complete age, location, Terms, and Privacy acknowledgements before paid entry.';

export type EligibilityStatus =
  | 'unknown'
  | 'pending_review'
  | 'eligible_for_internal_testing'
  | 'eligible'
  | 'blocked';
export type AgeGateStatus = 'unknown' | 'confirmed' | 'blocked';
export type KycStatus = 'not_required' | 'required' | 'pending' | 'verified' | 'failed' | 'expired';
export type AccountStatus = 'active' | 'restricted' | 'suspended' | 'closed';
export type SelfExclusionStatus = 'none' | 'requested' | 'active' | 'expired';

export type ProfileEligibility = {
  ageConfirmed: boolean;
  jurisdiction: string;
  termsAcceptedAt: string | null;
  privacyPolicyAcceptedAt: string | null;
  accountStatus: AccountStatus;
  eligibilityStatus: EligibilityStatus;
  eligibilityCheckedAt: string | null;
  ageGateStatus: AgeGateStatus;
  kycStatus: KycStatus;
  selfExclusionStatus: SelfExclusionStatus;
  restrictionReason: string | null;
  isEligibilityComplete: boolean;
  isEligibleForPaidEntry: boolean;
};

export type ProfileIdentity = {
  email: string;
  username: string;
  displayName: string;
  emailConfirmedAt: string | null;
  isProfileComplete: boolean;
  isEmailVerified: boolean;
  eligibility: ProfileEligibility;
};

type ReturnStepCopy = {
  actionLabel: string;
  detail: string;
  isContestFlow: boolean;
  shortLabel: string;
};

export const jurisdictionOptions = [
  { value: 'AL', label: 'Alabama' },
  { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' },
  { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' },
  { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' },
  { value: 'DE', label: 'Delaware' },
  { value: 'DC', label: 'District of Columbia' },
  { value: 'FL', label: 'Florida' },
  { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' },
  { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' },
  { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' },
  { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' },
  { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' },
  { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' },
  { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' },
  { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' },
  { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' },
  { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' },
  { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' },
  { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' },
  { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' },
  { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' },
  { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' },
  { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' },
  { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' },
  { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' },
  { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' },
  { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' },
  { value: 'WY', label: 'Wyoming' },
] as const;

const jurisdictionValues = new Set(jurisdictionOptions.map((option) => option.value));

export function normalizeReturnPath(value: string | null | undefined, fallback = defaultReturnPath) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) {
    return fallback;
  }

  return value;
}

export function buildAuthHref(next = defaultReturnPath) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  return `/auth?${new URLSearchParams({ next: normalizedNext }).toString()}`;
}

export function buildProfileHref(next = defaultReturnPath, params?: Record<string, string>) {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);
  const searchParams = new URLSearchParams({ next: normalizedNext });

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, value);
    }
  }

  return `/profile?${searchParams.toString()}`;
}

export function normalizeUsername(value: string) {
  return value.trim().toLowerCase();
}

export function validateUsername(value: string) {
  const username = normalizeUsername(value);

  if (!username) {
    return 'Enter a username to continue.';
  }

  if (!/^[a-z0-9_]{3,20}$/.test(username)) {
    return 'Use 3-20 lowercase letters, numbers, or underscores.';
  }

  return null;
}

export function normalizeJurisdiction(value: string) {
  return value.trim().toUpperCase();
}

export function validateJurisdiction(value: string) {
  const jurisdiction = normalizeJurisdiction(value);

  if (!jurisdiction) {
    return 'Choose your state or jurisdiction to continue.';
  }

  if (!jurisdictionValues.has(jurisdiction as (typeof jurisdictionOptions)[number]['value'])) {
    return 'Choose a supported U.S. state or jurisdiction.';
  }

  return null;
}

export function validateEligibilityAcknowledgements({
  ageConfirmed,
  termsAccepted,
  privacyPolicyAccepted,
  jurisdiction,
}: {
  ageConfirmed: boolean;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  jurisdiction: string;
}) {
  const jurisdictionMessage = validateJurisdiction(jurisdiction);

  if (jurisdictionMessage) {
    return jurisdictionMessage;
  }

  if (!ageConfirmed) {
    return 'Confirm you meet the age requirement to enter paid contests.';
  }

  if (!termsAccepted) {
    return 'Accept the Terms before paid entry.';
  }

  if (!privacyPolicyAccepted) {
    return 'Accept the Privacy Policy before paid entry.';
  }

  return null;
}

export function getReturnStepCopy(next: string): ReturnStepCopy {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  if (normalizedNext === defaultReturnPath) {
    return {
      actionLabel: 'Continue to Profile',
      detail: 'Profile',
      isContestFlow: false,
      shortLabel: 'Profile',
    };
  }

  if (!normalizedNext.startsWith('/contests/')) {
    return {
      actionLabel: 'Continue',
      detail: normalizedNext,
      isContestFlow: false,
      shortLabel: 'Next Step',
    };
  }

  const [pathPart, queryString = ''] = normalizedNext.split('?');
  const contestTitle = pathPart
    .replace('/contests/', '')
    .split('/')[0]
    .split('-')
    .map((segment) => {
      if (!segment.length) {
        return segment;
      }

      if (segment.length <= 2) {
        return segment.toUpperCase();
      }

      return `${segment[0].toUpperCase()}${segment.slice(1)}`;
    })
    .join(' ');
  const stage = new URLSearchParams(queryString).get('stage');
  const isPaymentPath = pathPart.endsWith('/payment');
  const isSuccessPath = pathPart.endsWith('/success');
  const isLineupPath = pathPart.endsWith('/lineup');

  if (stage === 'payment-review' || isPaymentPath) {
    return {
      actionLabel: 'Continue to Payment Review',
      detail: `Payment Review for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Payment Review',
    };
  }

  if (stage === 'entered' || isSuccessPath) {
    return {
      actionLabel: 'Continue to Entry Success',
      detail: `Entry Success for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Entry Success',
    };
  }

  if (stage === 'lineup' || isLineupPath) {
    return {
      actionLabel: 'Continue to Build Your Lineup',
      detail: `Build Your Lineup for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Build Your Lineup',
    };
  }

  return {
    actionLabel: 'Continue to Contest Entry',
    detail: `Contest Entry for ${contestTitle}`,
    isContestFlow: true,
    shortLabel: 'Contest Entry',
  };
}

export function getProfileIdentity(user: User | null): ProfileIdentity {
  const metadata = user?.user_metadata ?? {};
  const username = typeof metadata.username === 'string' ? normalizeUsername(metadata.username) : '';
  const displayName = typeof metadata.display_name === 'string' ? metadata.display_name : username;
  const email = user?.email ?? '';
  const emailConfirmedAt = user?.email_confirmed_at ?? null;
  const ageConfirmed = metadata.age_confirmed === true;
  const jurisdiction = typeof metadata.jurisdiction === 'string' ? normalizeJurisdiction(metadata.jurisdiction) : '';
  const termsAcceptedAt = typeof metadata.terms_accepted_at === 'string' ? metadata.terms_accepted_at : null;
  const privacyPolicyAcceptedAt =
    typeof metadata.privacy_policy_accepted_at === 'string' ? metadata.privacy_policy_accepted_at : null;
  const accountStatus = readMetadataStatus(metadata.account_status, ['active', 'restricted', 'suspended', 'closed'], 'active');
  const eligibilityStatus = readMetadataStatus(
    metadata.eligibility_status,
    ['unknown', 'pending_review', 'eligible_for_internal_testing', 'eligible', 'blocked'],
    'unknown',
  );
  const ageGateStatus = readMetadataStatus(metadata.age_gate_status, ['unknown', 'confirmed', 'blocked'], 'unknown');
  const kycStatus = readMetadataStatus(
    metadata.kyc_status,
    ['not_required', 'required', 'pending', 'verified', 'failed', 'expired'],
    'not_required',
  );
  const selfExclusionStatus = readMetadataStatus(
    metadata.self_exclusion_status,
    ['none', 'requested', 'active', 'expired'],
    'none',
  );
  const eligibilityCheckedAt =
    typeof metadata.eligibility_checked_at === 'string' ? metadata.eligibility_checked_at : null;
  const restrictionReason = typeof metadata.restriction_reason === 'string' ? metadata.restriction_reason : null;
  const isEligibilityComplete = Boolean(ageConfirmed && jurisdiction && termsAcceptedAt && privacyPolicyAcceptedAt);
  const isEligibleForPaidEntry =
    isEligibilityComplete &&
    accountStatus === 'active' &&
    eligibilityStatus === 'eligible' &&
    ageGateStatus === 'confirmed' &&
    selfExclusionStatus !== 'active' &&
    !['failed', 'expired'].includes(kycStatus);

  return {
    email,
    username,
    displayName,
    emailConfirmedAt,
    isProfileComplete: Boolean(username),
    isEmailVerified: Boolean(emailConfirmedAt),
    eligibility: {
      ageConfirmed,
      jurisdiction,
      termsAcceptedAt,
      privacyPolicyAcceptedAt,
      accountStatus,
      eligibilityStatus,
      eligibilityCheckedAt,
      ageGateStatus,
      kycStatus,
      selfExclusionStatus,
      restrictionReason,
      isEligibilityComplete,
      isEligibleForPaidEntry,
    },
  };
}

function readMetadataStatus<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}
