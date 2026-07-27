'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';
import {
  applyEligibilityReviewDecision,
  type EligibilityReviewDecision,
} from '@/lib/eligibility-review';
import { requireContestOperator } from '@/lib/contest-operator-access';

const eligibilityReviewSchema = z.object({
  decision: z.enum(['eligible_for_internal_testing', 'blocked']),
  reason: z.string().trim().min(12, 'Add a review reason with at least 12 characters.').max(500, 'Keep the review reason under 500 characters.'),
  targetUserId: z.string().trim().min(1, 'Choose a test account to review.'),
});

function buildEligibilityReviewRedirect(status: 'reviewed' | 'error', message?: string) {
  const params = new URLSearchParams({ status });

  if (message) {
    params.set('message', message);
  }

  return `/admin/eligibility?${params.toString()}`;
}

export async function reviewEligibilityAction(formData: FormData) {
  const access = await requireContestOperator('/admin/eligibility');
  const parsed = eligibilityReviewSchema.safeParse({
    decision: String(formData.get('decision') || ''),
    reason: String(formData.get('reason') || ''),
    targetUserId: String(formData.get('targetUserId') || ''),
  });

  if (!parsed.success) {
    redirect(
      buildEligibilityReviewRedirect(
        'error',
        parsed.error.issues[0]?.message || 'Unable to save the eligibility review decision.',
      ),
    );
  }

  try {
    const result = await applyEligibilityReviewDecision({
      decision: parsed.data.decision as EligibilityReviewDecision,
      reason: parsed.data.reason,
      reviewerEmail: access.user?.email ?? null,
      reviewerUserId: access.user?.id ?? null,
      targetUserId: parsed.data.targetUserId,
    });

    revalidatePath('/admin/eligibility');
    redirect(
      buildEligibilityReviewRedirect(
        'reviewed',
        `${result.email} is now marked ${formatEligibilityStatus(result.eligibilityStatus)}. Public paid entry remains blocked.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to save the eligibility review decision.';
    redirect(buildEligibilityReviewRedirect('error', message));
  }
}

function formatEligibilityStatus(status: string) {
  return status.replaceAll('_', ' ');
}
