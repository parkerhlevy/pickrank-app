import type { User } from '@supabase/supabase-js';
import { getProfileIdentity, type EligibilityStatus, type ProfileEligibility } from '@/lib/auth-profile';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/supabase/types';

export const eligibilityReviewSource = 'internal_admin_eligibility_review';
export const internalTestingScope = 'controlled_internal_testing_only';

export type EligibilityReviewDecision = 'eligible_for_internal_testing' | 'blocked';

export type EligibilityReviewCandidate = {
  authUserMetadata: Record<string, unknown>;
  userId: string;
  email: string;
  username: string;
  displayName: string;
  eligibility: ProfileEligibility;
  entryRestrictionStatus: string;
  isKnownInternalTestAccount: boolean;
};

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];
type ResponsiblePlayRow = Database['public']['Tables']['responsible_play_statuses']['Row'];
type EligibilityEventInsert = Database['public']['Tables']['compliance_eligibility_events']['Insert'];
type SupabaseMutationResult = Promise<{ error: { message: string } | null }>;

type ReviewInput = {
  decision: EligibilityReviewDecision;
  reason: string;
  reviewerEmail?: string | null;
  reviewerUserId?: string | null;
  target: EligibilityReviewCandidate;
};

export function normalizeInternalTestAccountEmails(rawValue = process.env.PICKRANK_INTERNAL_TEST_ACCOUNT_EMAILS || '') {
  return new Set(
    rawValue
      .split(',')
      .map((email) => normalizeEmail(email))
      .filter(Boolean),
  );
}

export function normalizeEmail(value: string | null | undefined) {
  return (value || '').trim().toLowerCase();
}

export function isKnownInternalTestAccountEmail(
  email: string | null | undefined,
  allowlist = normalizeInternalTestAccountEmails(),
) {
  const normalizedEmail = normalizeEmail(email);

  return Boolean(normalizedEmail && (normalizedEmail.endsWith('.test') || allowlist.has(normalizedEmail)));
}

export function validateEligibilityReviewInput(input: ReviewInput) {
  const reason = input.reason.trim();

  if (reason.length < 12) {
    return 'Add a review reason with at least 12 characters.';
  }

  if (reason.length > 500) {
    return 'Keep the review reason under 500 characters.';
  }

  if (!input.target.isKnownInternalTestAccount) {
    return 'Eligibility review actions are limited to known founder, operator, QA, or test accounts.';
  }

  if (!input.reviewerUserId) {
    return 'A signed-in contest operator is required for every eligibility review decision.';
  }

  if (input.decision === 'eligible_for_internal_testing' && !input.target.eligibility.isEligibilityComplete) {
    return 'Capture DOB, jurisdiction, Terms, and Privacy before marking a test account eligible.';
  }

  if (input.decision === 'eligible_for_internal_testing' && input.target.eligibility.accountStatus !== 'active') {
    return 'Only active test accounts can be marked eligible for internal testing.';
  }

  if (
    input.decision === 'eligible_for_internal_testing' &&
    ['requested', 'active'].includes(input.target.eligibility.selfExclusionStatus)
  ) {
    return 'Accounts with a current self-exclusion cannot be marked eligible for internal testing.';
  }

  if (input.decision === 'eligible_for_internal_testing' && input.target.entryRestrictionStatus !== 'none') {
    return 'Accounts with a responsible-play entry restriction cannot be marked eligible for internal testing.';
  }

  if (input.decision === 'eligible_for_internal_testing' && input.target.eligibility.eligibilityStatus === 'blocked') {
    return 'Clear the existing eligibility hold before marking this account eligible for internal testing.';
  }

  return null;
}

export function buildEligibilityReviewEvent(input: ReviewInput & { reviewedAt: string }) {
  const nextStatus = getEligibilityStatusForDecision(input.decision);

  return {
    event_type: input.decision,
    user_id: input.target.userId,
    jurisdiction: input.target.eligibility.jurisdiction || null,
    eligibility_status: nextStatus,
    age_gate_status: input.target.eligibility.ageGateStatus,
    kyc_status: input.target.eligibility.kycStatus,
    self_exclusion_status: input.target.eligibility.selfExclusionStatus,
    restriction_reason: input.decision === 'blocked' ? input.reason.trim() : null,
    source: eligibilityReviewSource,
    metadata: {
      scope: internalTestingScope,
      reason: input.reason.trim(),
      reviewer_email: normalizeEmail(input.reviewerEmail),
      reviewer_user_id: input.reviewerUserId || null,
      reviewed_at: input.reviewedAt,
      prior_eligibility_status: input.target.eligibility.eligibilityStatus,
      known_internal_test_account: input.target.isKnownInternalTestAccount,
      public_real_money_approval: false,
    } satisfies Json,
  };
}

export async function listEligibilityReviewCandidates() {
  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });

  if (error) {
    throw new Error(`Unable to read auth users for eligibility review: ${error.message}`);
  }

  const users = data.users.filter((user) => isKnownInternalTestAccountEmail(user.email));
  const userIds = users.map((user) => user.id);
  const [profileRowsById, responsiblePlayRowsById] = await Promise.all([
    readProfileRowsById(userIds),
    readResponsiblePlayRowsById(userIds),
  ]);

  return users
    .map((user) =>
      buildEligibilityReviewCandidate(
        user,
        profileRowsById.get(user.id),
        responsiblePlayRowsById.get(user.id),
      ),
    )
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function applyEligibilityReviewDecision({
  decision,
  reason,
  reviewerEmail,
  reviewerUserId,
  targetUserId,
}: {
  decision: EligibilityReviewDecision;
  reason: string;
  reviewerEmail?: string | null;
  reviewerUserId?: string | null;
  targetUserId: string;
}) {
  const candidates = await listEligibilityReviewCandidates();
  const target = candidates.find((candidate) => candidate.userId === targetUserId);

  if (!target) {
    throw new Error('Eligibility review actions are limited to known internal test accounts.');
  }

  const validationMessage = validateEligibilityReviewInput({
    decision,
    reason,
    reviewerEmail,
    reviewerUserId,
    target,
  });

  if (validationMessage) {
    throw new Error(validationMessage);
  }

  const now = new Date().toISOString();
  const nextEligibilityStatus = getEligibilityStatusForDecision(decision);
  const trimmedReason = reason.trim();
  const updatedMetadata = {
    eligibility_status: nextEligibilityStatus,
    eligibility_checked_at: now,
    age_gate_status: decision === 'eligible_for_internal_testing' ? 'confirmed' : target.eligibility.ageGateStatus,
    restriction_reason: decision === 'blocked' ? trimmedReason : null,
    restriction_source: decision === 'blocked' ? eligibilityReviewSource : null,
    restricted_at: decision === 'blocked' ? now : null,
    eligibility_review_scope: internalTestingScope,
    eligibility_reviewed_at: now,
  };

  const supabase = createAdminClient();
  const event = buildEligibilityReviewEvent({
    decision,
    reason: trimmedReason,
    reviewerEmail,
    reviewerUserId,
    reviewedAt: now,
    target,
  });
  const eligibilityEventsTable = supabase.from('compliance_eligibility_events') as unknown as {
    insert(values: EligibilityEventInsert): SupabaseMutationResult;
  };
  const eventInsertQuery = eligibilityEventsTable.insert(event);
  const { error: eventError } = await eventInsertQuery;

  if (eventError) {
    throw new Error(`Unable to log eligibility review event: ${eventError.message}`);
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(target.userId, {
    user_metadata: {
      ...target.authUserMetadata,
      ...updatedMetadata,
    },
  });

  if (authError) {
    throw new Error(`Unable to update auth eligibility metadata: ${authError.message}`);
  }

  const profileUpdate: ProfileUpdate = {
    eligibility_status: nextEligibilityStatus,
    eligibility_checked_at: now,
    age_gate_status: decision === 'eligible_for_internal_testing' ? 'confirmed' : target.eligibility.ageGateStatus,
    restriction_reason: decision === 'blocked' ? trimmedReason : null,
    restriction_source: decision === 'blocked' ? eligibilityReviewSource : null,
    restricted_at: decision === 'blocked' ? now : null,
    updated_at: now,
  };
  const profilesTable = supabase.from('profiles') as unknown as {
    update(values: ProfileUpdate): { eq(column: string, value: string): SupabaseMutationResult };
  };
  const profileUpdateQuery = profilesTable.update(profileUpdate).eq('id', target.userId);
  const { error: profileError } = await profileUpdateQuery;

  if (profileError) {
    throw new Error(`Unable to update profile eligibility review status: ${profileError.message}`);
  }

  return {
    email: target.email,
    eligibilityStatus: nextEligibilityStatus,
  };
}

export function getEligibilityStatusForDecision(decision: EligibilityReviewDecision): EligibilityStatus {
  return decision;
}

async function readProfileRowsById(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ProfileRow>();
  }

  const supabase = createAdminClient();
  const profilesTable = supabase.from('profiles') as unknown as {
    select(columns: string): { in(column: string, values: string[]): Promise<{ data: ProfileRow[] | null; error: { message: string } | null }> };
  };
  const profileRowsQuery = profilesTable.select('*').in('id', userIds);
  const { data, error } = await profileRowsQuery;

  if (error) {
    throw new Error(`Unable to read eligibility profile rows: ${error.message}`);
  }

  return new Map((data || []).map((profile) => [profile.id, profile]));
}

async function readResponsiblePlayRowsById(userIds: string[]) {
  if (userIds.length === 0) {
    return new Map<string, ResponsiblePlayRow>();
  }

  const supabase = createAdminClient();
  const responsiblePlayTable = supabase.from('responsible_play_statuses') as unknown as {
    select(columns: string): {
      in(
        column: string,
        values: string[],
      ): Promise<{ data: ResponsiblePlayRow[] | null; error: { message: string } | null }>;
    };
  };
  const responsiblePlayQuery = responsiblePlayTable.select('*').in('user_id', userIds);
  const { data, error } = await responsiblePlayQuery;

  if (error) {
    throw new Error(`Unable to read responsible-play status rows: ${error.message}`);
  }

  return new Map((data || []).map((status) => [status.user_id, status]));
}

function buildEligibilityReviewCandidate(
  user: User,
  profile?: ProfileRow,
  responsiblePlay?: ResponsiblePlayRow,
): EligibilityReviewCandidate {
  const metadata = user.user_metadata || {};
  const identity = getProfileIdentity({
    ...user,
    user_metadata: {
      ...metadata,
      username: metadata.username ?? profile?.username,
      display_name: metadata.display_name ?? profile?.display_name,
      date_of_birth: metadata.date_of_birth ?? profile?.date_of_birth,
      age_confirmed: metadata.age_confirmed ?? profile?.age_confirmed,
      jurisdiction: metadata.jurisdiction ?? profile?.jurisdiction,
      terms_accepted_at: metadata.terms_accepted_at ?? profile?.terms_accepted_at,
      privacy_policy_accepted_at: metadata.privacy_policy_accepted_at ?? profile?.privacy_policy_accepted_at,
      account_status: metadata.account_status ?? profile?.account_status,
      eligibility_status: metadata.eligibility_status ?? profile?.eligibility_status,
      eligibility_checked_at: metadata.eligibility_checked_at ?? profile?.eligibility_checked_at,
      age_gate_status: metadata.age_gate_status ?? profile?.age_gate_status,
      kyc_status: metadata.kyc_status ?? profile?.kyc_status,
      self_exclusion_status: responsiblePlay?.self_exclusion_status ?? metadata.self_exclusion_status,
      restriction_reason:
        responsiblePlay?.restriction_reason ?? metadata.restriction_reason ?? profile?.restriction_reason,
    },
  });

  return {
    authUserMetadata: metadata,
    userId: user.id,
    email: identity.email,
    username: identity.username,
    displayName: identity.displayName,
    eligibility: identity.eligibility,
    entryRestrictionStatus: responsiblePlay?.entry_restriction_status ?? 'none',
    isKnownInternalTestAccount: isKnownInternalTestAccountEmail(identity.email),
  };
}
