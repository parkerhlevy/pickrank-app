import Link from 'next/link';
import { AlertTriangle, ArrowLeft, Clock, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContestBoardPreview } from '@/components/contests/contest-board-preview';
import { Button } from '@/components/ui/button';
import { HowItWorksButton } from '@/components/ui/how-it-works-button';
import { Notice } from '@/components/ui/notice';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestDetailPrimaryAction } from '@/lib/contest-entry-flow';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
import { isBetaFreeEntryContest, launchMode } from '@/lib/launch-mode';
import { getPersistedContestEntry } from '@/lib/persisted-contest-entry';
import { getViewerIdentity } from '@/lib/viewer-identity';
import { confirmContestEntryAction } from './payment/actions';

export default async function ContestDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ contestId: string }>;
  searchParams?: Promise<{ message?: string; status?: string }>;
}) {
  const { contestId } = await params;
  const resolvedSearchParams = (await searchParams) || {};
  const contest = await getContestById(contestId);
  const viewerIdentity = await getViewerIdentity();
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultLineupOrder = getContestDefaultLineupOrder(contest);
  const isBetaContest = isBetaFreeEntryContest(contest.entryFeeCents);

  const hasEntry = Boolean(
    await getPersistedContestEntry(contest.id, viewerIdentity.userId, selectablePlayers, defaultLineupOrder),
  );
  const primaryAction = getContestDetailPrimaryAction({
    contestId: contest.id,
    entryFee: contest.entryFee,
    entryFeeCents: contest.entryFeeCents,
    hasEntry,
    isAuthenticated: viewerIdentity.isAuthenticated,
    isContestOpen: isContestOpenForEntry(contest),
    isProfileComplete: viewerIdentity.isProfileComplete,
    isEmailVerified: viewerIdentity.isEmailVerified,
    isEligibilityComplete: viewerIdentity.eligibility.isEligibilityComplete,
    isEligibleForPaidEntry: viewerIdentity.eligibility.isEligibleForPaidEntry,
    eligibilityStatus: viewerIdentity.eligibility.eligibilityStatus,
    contestStatus: contest.contestStatus,
  });
  const disabledActionClassName =
    primaryAction.tone === 'warning'
      ? 'border border-amber-300 bg-amber-100 text-amber-900 shadow-none disabled:opacity-100'
      : primaryAction.tone === 'error'
        ? 'border border-red-300 bg-red-100 text-red-900 shadow-none disabled:opacity-100'
        : '';

  return (
    <div className="space-y-5 pb-28">
      <div className="space-y-4">
        <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
          <Link href="/contests" transitionTypes={['nav-back']}>
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Contests
          </Link>
        </Button>
        <div className="screen-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span
              className={`status-pill ${
                contest.contestStatus === 'open' ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : ''
              }`}
              data-testid="contest-lifecycle-status"
            >
              {contest.status}
            </span>
            <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
            <p className="text-muted-foreground">{contest.task}</p>
          </div>
          <HowItWorksButton />
        </div>
      </div>

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header py-4">
          <CardTitle className="text-base">Contest details - Free to play during beta</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-4 text-sm md:grid-cols-3">
          <DetailStat icon={Clock} label="Stat category" value={contest.statCategory} />
          <DetailStat icon={Users} label="Entries" value={contest.entries} />
          <DetailStat icon={Clock} label="Lock time" value={contest.lockTime.replace('Locks ', '')} />
          {!isBetaContest ? (
            <>
              <DetailStat icon={Ticket} label="Entry type" value={launchMode.betaEntryLabel} />
              <DetailStat icon={Ticket} label="Entry cost" value={contest.entryFee} />
            </>
          ) : null}
          <p className="col-span-2 border-t border-slate-200 pt-2 text-xs text-muted-foreground md:col-span-3">
            {isBetaContest
              ? 'Early access beta contests have no cash prizes, no payouts, no minimum participants, and no cost to enter.'
              : contest.minimum}
          </p>
        </CardContent>
      </Card>

      <ContestBoardPreview
        title={contest.title}
        slateLabel={contest.slate}
        statCategory={contest.statCategory}
        lockTimeLabel={contest.lockTime.replace('Locks ', '')}
        rankedPlayers={defaultLineupOrder}
        slatePlayers={selectablePlayers}
        playerContexts={contest.slatePlayers}
        variant="detail"
      />

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Scoring</CardTitle>
          <CardDescription>Build the most accurate top-10 board from the full player pool.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="section-card-muted px-3 py-3 text-sm">
            <p className="mt-1 text-muted-foreground">
              Rank each quarterback as close to the final {contest.statCategory.toLowerCase()} order as possible. Each
              pick adds its rank miss to your total, so lower score wins.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works#rank-differential-example" transitionTypes={['nav-forward']}>
              See scoring example
            </Link>
          </Button>
        </CardContent>
      </Card>

      {!viewerIdentity.isAuthenticated ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>What you can do now</CardTitle>
            <CardDescription>
              Browse the contest details now, then sign in when you&apos;re ready to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You can review the format, lock time, and scoring on this page right now.</p>
            <p>
              After you sign in and finish the required Profile setup, PickRank will return you to this contest so
              you can enter and start building your board.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <div className="action-panel">
        {resolvedSearchParams.status === 'error' && resolvedSearchParams.message ? (
          <Notice
            variant="warning"
            icon={AlertTriangle}
            title="Contest entry needs attention"
            description={resolvedSearchParams.message}
          />
        ) : null}
        {'submitsEntry' in primaryAction && primaryAction.submitsEntry ? (
          <form action={confirmContestEntryAction}>
            <input type="hidden" name="contestId" value={contest.id} />
            <Button type="submit" className="w-full">
              {primaryAction.label}
            </Button>
          </form>
        ) : primaryAction.href ? (
          <Button asChild className="w-full">
            <Link href={primaryAction.href} transitionTypes={['nav-forward']}>
              {primaryAction.label}
            </Link>
          </Button>
        ) : (
          <Button className={`w-full ${disabledActionClassName}`} disabled>
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

function DetailStat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="metric-tile">
      <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </div>
      <p className="numeric text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}
