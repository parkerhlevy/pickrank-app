import type { User } from '@supabase/supabase-js';
import { getEntryReviewLabel } from '@/lib/launch-mode';

export const defaultReturnPath = '/profile';
export const verifyEmailToEnterContestsMessage = 'Verify your email to enter contests.';
export const eligibilityToEnterContestsMessage =
  'Complete date of birth, state, Beta Terms, and Privacy acknowledgements before beta entry.';
export const betaMinimumAge = 18;
export const betaMinimumAgeRequirementMessage =
  'PickRank Early Access Beta is for users who are at least 18 years old.';
export const under18AgeGateRestrictionReason = 'under_18_age_gate';

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
export type RestrictionReason = typeof under18AgeGateRestrictionReason | string;

export type ProfileEligibility = {
  ageConfirmed: boolean;
  dateOfBirth: string | null;
  jurisdiction: string;
  termsAcceptedAt: string | null;
  privacyPolicyAcceptedAt: string | null;
  accountStatus: AccountStatus;
  eligibilityStatus: EligibilityStatus;
  eligibilityCheckedAt: string | null;
  ageGateStatus: AgeGateStatus;
  kycStatus: KycStatus;
  selfExclusionStatus: SelfExclusionStatus;
  restrictionReason: RestrictionReason | null;
  isAgeOnlyRestriction: boolean;
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

export function normalizeDateOfBirth(value: string) {
  const dateOfBirth = value.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    return null;
  }

  const [yearText, monthText, dayText] = dateOfBirth.split('-');
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return dateOfBirth;
}

export function calculateAge(dateOfBirth: string, asOf = new Date()) {
  const normalizedDateOfBirth = normalizeDateOfBirth(dateOfBirth);

  if (!normalizedDateOfBirth) {
    return null;
  }

  const [yearText, monthText, dayText] = normalizedDateOfBirth.split('-');
  const birthYear = Number(yearText);
  const birthMonth = Number(monthText);
  const birthDay = Number(dayText);
  const asOfYear = asOf.getUTCFullYear();
  const asOfMonth = asOf.getUTCMonth() + 1;
  const asOfDay = asOf.getUTCDate();
  const hadBirthdayThisYear = asOfMonth > birthMonth || (asOfMonth === birthMonth && asOfDay >= birthDay);

  return asOfYear - birthYear - (hadBirthdayThisYear ? 0 : 1);
}

export function validateDateOfBirthForBeta(value: string, asOf = new Date()) {
  const normalizedDateOfBirth = normalizeDateOfBirth(value);

  if (!normalizedDateOfBirth) {
    return 'Enter a valid date of birth.';
  }

  const age = calculateAge(normalizedDateOfBirth, asOf);

  if (age === null || age < 0) {
    return 'Enter a valid date of birth.';
  }

  if (age < betaMinimumAge) {
    return betaMinimumAgeRequirementMessage;
  }

  return null;
}

export function isDateOfBirthEligibleForBeta(value: string | null, asOf = new Date()) {
  return Boolean(value && validateDateOfBirthForBeta(value, asOf) === null);
}

export function isUnder18AgeGateRestriction(value: string | null | undefined) {
  return value === under18AgeGateRestrictionReason;
}

export function validateEligibilityAcknowledgements({
  dateOfBirth,
  termsAccepted,
  privacyPolicyAccepted,
  jurisdiction,
}: {
  dateOfBirth: string;
  termsAccepted: boolean;
  privacyPolicyAccepted: boolean;
  jurisdiction: string;
}) {
  const jurisdictionMessage = validateJurisdiction(jurisdiction);

  if (jurisdictionMessage) {
    return jurisdictionMessage;
  }

  const dateOfBirthMessage = validateDateOfBirthForBeta(dateOfBirth);

  if (dateOfBirthMessage) {
    return dateOfBirthMessage;
  }

  if (!termsAccepted) {
    return 'Accept the Beta Terms before beta entry.';
  }

  if (!privacyPolicyAccepted) {
    return 'Accept the Privacy Policy before beta entry.';
  }

  return null;
}

export function getReturnStepCopy(next: string): ReturnStepCopy {
  const normalizedNext = normalizeReturnPath(next, defaultReturnPath);

  if (normalizedNext === defaultReturnPath) {
    return {
      actionLabel: 'Continue to profile',
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
      shortLabel: 'Next step',
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
    const entryReviewLabel = getEntryReviewLabel();
    return {
      actionLabel: 'Continue to entry review',
      detail: `${entryReviewLabel} for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: entryReviewLabel,
    };
  }

  if (stage === 'entered' || isSuccessPath) {
    return {
      actionLabel: 'Continue to entry success',
      detail: `Entry success for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Entry success',
    };
  }

  if (stage === 'lineup' || isLineupPath) {
    return {
      actionLabel: 'Continue to build your board',
      detail: `Build your board for ${contestTitle}`,
      isContestFlow: true,
      shortLabel: 'Build your board',
    };
  }

  return {
    actionLabel: 'Continue to contest entry',
    detail: `Contest entry for ${contestTitle}`,
    isContestFlow: true,
    shortLabel: 'Contest entry',
  };
}

export function getProfileIdentity(user: User | null): ProfileIdentity {
  const metadata = user?.user_metadata ?? {};
  const username = typeof metadata.username === 'string' ? normalizeUsername(metadata.username) : '';
  const displayName = typeof metadata.display_name === 'string' ? metadata.display_name : username;
  const email = user?.email ?? '';
  const emailConfirmedAt = user?.email_confirmed_at ?? null;
  const dateOfBirth =
    typeof metadata.date_of_birth === 'string' && normalizeDateOfBirth(metadata.date_of_birth)
      ? metadata.date_of_birth
      : null;
  const isBetaAgeEligible = isDateOfBirthEligibleForBeta(dateOfBirth);
  const ageConfirmed = isBetaAgeEligible;
  const jurisdiction = typeof metadata.jurisdiction === 'string' ? normalizeJurisdiction(metadata.jurisdiction) : '';
  const termsAcceptedAt = typeof metadata.terms_accepted_at === 'string' ? metadata.terms_accepted_at : null;
  const privacyPolicyAcceptedAt =
    typeof metadata.privacy_policy_accepted_at === 'string' ? metadata.privacy_policy_accepted_at : null;
  const storedAccountStatus = readMetadataStatus(metadata.account_status, ['active', 'restricted', 'suspended', 'closed'], 'active');
  const storedEligibilityStatus = readMetadataStatus(
    metadata.eligibility_status,
    ['unknown', 'pending_review', 'eligible_for_internal_testing', 'eligible', 'blocked'],
    'unknown',
  );
  const storedAgeGateStatus = readMetadataStatus(metadata.age_gate_status, ['unknown', 'confirmed', 'blocked'], 'unknown');
  const ageGateStatus =
    dateOfBirth && !isBetaAgeEligible
      ? 'blocked'
      : ageConfirmed
        ? 'confirmed'
        : storedAgeGateStatus === 'confirmed'
          ? 'unknown'
          : storedAgeGateStatus;
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
  const isAgeOnlyRestriction = isUnder18AgeGateRestriction(restrictionReason);
  const hasResolvedAgeOnlyRestriction = Boolean(isAgeOnlyRestriction && isBetaAgeEligible);
  const accountStatus =
    hasResolvedAgeOnlyRestriction && storedAccountStatus === 'restricted' ? 'active' : storedAccountStatus;
  const eligibilityStatus =
    hasResolvedAgeOnlyRestriction && storedEligibilityStatus === 'blocked'
      ? 'pending_review'
      : storedEligibilityStatus;
  const isEligibilityComplete = Boolean(
    ageConfirmed &&
      dateOfBirth &&
      jurisdiction &&
      termsAcceptedAt &&
      privacyPolicyAcceptedAt &&
      ageGateStatus === 'confirmed' &&
      accountStatus === 'active' &&
      eligibilityStatus !== 'blocked',
  );
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
      dateOfBirth,
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
      isAgeOnlyRestriction,
      isEligibilityComplete,
      isEligibleForPaidEntry,
    },
  };
}

function readMetadataStatus<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? (value as T) : fallback;
}
