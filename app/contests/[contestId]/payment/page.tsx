import Link from 'next/link';
import { cookies } from 'next/headers';
import { AlertTriangle, ArrowLeft, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { redirect } from 'next/navigation';
import { ContestBoardStagePanel, ContestJourneyRail } from '@/components/contests/contest-board-preview';
import { Notice } from '@/components/ui/notice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import { buildProfileHref } from '@/lib/auth-profile';
import {
  contestEntryCookieName,
  getContestEntryRouteState,
  getContestEntryStateCopy,
  getContestEntrySteps,
  getPersistedContestEntryStage,
} from '@/lib/contest-entry-flow';
import {
  formatCents,
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  getPaymentReviewBreakdown,
} from '@/lib/contest-data';
import { getPersistedContestEntry } from '@/lib/persisted-contest-entry';
import { getViewerIdentity } from '@/lib/viewer-identity';
import { getContestEntryConfirmationError } from '@/lib/contest-entry-confirmation';
import { confirmContestEntryAction } from './actions';

export default async function PaymentReviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ contestId: string }>;
  searchParams?: Promise<{
    message?: string;
    status?: string;
  }>;
}) {
  const { contestId } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const contest = await getContestById(contestId);
  const next = `/contests/${contest.id}/payment`;
  const protectedRedirect = await getProtectedContestEntryRedirect(next);

  if (protectedRedirect) {
    redirect(protectedRedirect);
  }

  const cookieStore = await cookies();
  const persistedStage = getPersistedContestEntryStage(
    contest.id,
    cookieStore.get(contestEntryCookieName)?.value,
  );
  const viewerIdentity = await getViewerIdentity();
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultLineupOrder = getContestDefaultLineupOrder(contest);
  const persistedEntry = await getPersistedContestEntry(
    contest.id,
    viewerIdentity.userId,
    selectablePlayers,
    defaultLineupOrder,
  );
  const routeState = getContestEntryRouteState({
    contestId: contest.id,
    persistedStage,
    route: 'payment',
    hasPersistedEntry: Boolean(persistedEntry),
  });

  if (routeState.shouldRedirect && routeState.redirectHref) {
    redirect(routeState.redirectHref);
  }

  const stateCopy = getContestEntryStateCopy(routeState.stage);
  const flowSteps = getContestEntrySteps(routeState.stage);
  const breakdown = getPaymentReviewBreakdown(contest.entryFeeCents);
  const isFreeEntryContest = contest.entryFeeCents === 0;
  const confirmationError = getContestEntryConfirmationError(contest.entryFeeCents, {
    eligibility: viewerIdentity.eligibility,
    viewerSource: viewerIdentity.source,
  });
  const profileEligibilityHref = buildProfileHref(next);

  const upcomingSteps = flowSteps.filter((step) => step.status === 'upcoming');

  return (
    <div className="space-y-5 pb-28">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Details
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Payment Review</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">
          Review your entry fee and confirm how this entry is covered before you continue to lineup setup.
        </p>
      </div>

      <ContestBoardStagePanel
        title={contest.title}
        description="This entry belongs to one contest board. Confirm the entry fee first, then Build Your Lineup by ranking your top 10 from the slate."
        slateLabel={contest.slate}
        statCategory={contest.statCategory}
        lockTimeLabel={contest.lockTime.replace('Locks ', '')}
        rankedCountLabel="Ready after entry"
        stateLabel="Payment Review"
      />

      <ContestJourneyRail currentStage="entry-review" />

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header">
          <CardTitle>Entry Fee Breakdown</CardTitle>
          <CardDescription className="text-slate-300">
            Site Credit is applied first, then Cash Balance, with any remaining amount shown as Amount Due Today.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <ReviewRow label="Entry Fee" value={formatCents(breakdown.entryFeeCents)} strong />
          <div className="border-t border-slate-200 pt-3">
            <ReviewRow label="Site Credit Applied" value={`-${formatCents(breakdown.siteCreditAppliedCents)}`} />
            <ReviewRow label="Cash Balance Applied" value={`-${formatCents(breakdown.cashBalanceAppliedCents)}`} />
          </div>
          <div className="section-card-muted p-3">
            <ReviewRow label="Amount Due Today" value={formatCents(breakdown.amountDueTodayCents)} strong />
          </div>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{stateCopy.title}</CardTitle>
              <CardDescription>Confirm this entry, then head straight into Build Your Lineup for this contest.</CardDescription>
            </div>
            <span className="status-pill shrink-0">{stateCopy.badge}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <Notice
            variant="muted"
            icon={ShieldCheck}
            title="Funding order"
            description="Site Credit is applied first, then Cash Balance, then any external amount due."
          />
          <Notice
            variant={isFreeEntryContest || viewerIdentity.eligibility.isEligibleForPaidEntry ? 'success' : 'warning'}
            icon={ShieldCheck}
            title={isFreeEntryContest ? 'No-money test entry' : 'Eligibility check'}
            description={
              isFreeEntryContest
                ? 'This contest has a $0 entry fee, so it can be confirmed for testing without paid-entry eligibility approval.'
                : viewerIdentity.eligibility.isEligibleForPaidEntry
                ? 'This account is marked eligible for paid entry.'
                : 'Paid contests require age confirmation, state capture, Terms acceptance, Privacy acceptance, and an eligible account status.'
            }
            badge={isFreeEntryContest ? 'Free Test' : viewerIdentity.eligibility.isEligibleForPaidEntry ? 'Eligible' : 'Required'}
          />
          <Notice
            variant={isFreeEntryContest ? 'success' : 'warning'}
            icon={CreditCard}
            title="Amount Due Today"
            description={
              isFreeEntryContest
                ? 'No payment, wallet balance, payout, or cash movement is used for this entry.'
                : 'If your balances do not fully cover the fee, the remaining amount stays under Amount Due Today until provider-backed payment is added.'
            }
            badge={isFreeEntryContest ? '$0.00' : 'Placeholder-safe'}
          />
          <Notice
            variant="success"
            icon={CheckCircle2}
            title="After confirmation"
            description="Once you confirm, your entry is saved and you can head straight into Build Your Lineup."
          />
          <div className="section-card-muted px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Up next</p>
            <div className="mt-2 space-y-2">
              {upcomingSteps.map((step) => (
                <div key={step.key} className="step-row bg-white">
                  <div>
                    <p className="numeric font-medium">
                      Step {step.stepNumber}: {step.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.summary}</p>
                  </div>
                  <span className="text-muted-foreground">Next</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="action-panel">
        {resolvedSearchParams.status === 'error' && resolvedSearchParams.message ? (
          <Notice
            variant="warning"
            icon={AlertTriangle}
            title="Entry confirmation needs attention"
            description={resolvedSearchParams.message}
          />
        ) : null}
        {confirmationError ? (
          <div className="space-y-3">
            <Notice
              variant="warning"
              icon={AlertTriangle}
              title="Entry confirmation unavailable"
              description={confirmationError}
            />
            <Button className="w-full" disabled>
              Confirm Entry
            </Button>
            {!viewerIdentity.eligibility.isEligibilityComplete ? (
              <Button asChild className="w-full" variant="secondary">
                <Link href={profileEligibilityHref}>Complete Eligibility Details</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <form action={confirmContestEntryAction}>
            <input type="hidden" name="contestId" value={contest.id} />
            <Button type="submit" className="w-full">
              Confirm Entry
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className={strong ? 'font-bold' : 'text-muted-foreground'}>{label}</span>
      <span className={strong ? 'numeric font-black' : 'numeric font-semibold'}>{value}</span>
    </div>
  );
}
