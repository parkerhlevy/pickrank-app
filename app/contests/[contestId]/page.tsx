import Link from 'next/link';
import { ArrowLeft, BarChart3, ChevronRight, Clock, ListOrdered, Lock, ShieldCheck, Ticket, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContestBoardPreview } from '@/components/contests/contest-board-preview';
import { Button } from '@/components/ui/button';
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

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  const viewerIdentity = await getViewerIdentity();
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultLineupOrder = getContestDefaultLineupOrder(contest);
  const isBetaContest = isBetaFreeEntryContest(contest.entryFeeCents);

  const hasEntry = Boolean(
    await getPersistedContestEntry(
      contest.id,
      viewerIdentity.userId,
      selectablePlayers,
      defaultLineupOrder,
    ),
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
          <Link href="/contests">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Contests
          </Link>
        </Button>
        <div className="screen-header flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <span className="status-pill">{contest.status}</span>
            <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
            <p className="text-muted-foreground">{contest.task}</p>
          </div>
          <Link href="/how-it-works" className="inline-link shrink-0">
            How It Works
          </Link>
        </div>
      </div>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Quick Read</CardTitle>
          <CardDescription>
            This contest is one accuracy board. Review the player pool, rank your top 10, and save your board before lock.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-3 sm:gap-3">
          <QuickReadItem
            icon={ListOrdered}
            title="What you do"
            description={`Pick and rank 10 quarterbacks from the ${contest.slateSize}-player pool.`}
          />
          <QuickReadItem
            icon={BarChart3}
            title="How you score"
            description={`Each saved rank is compared with the final ${contest.statCategory.toLowerCase()} order. Lower total miss wins.`}
          />
          <QuickReadItem
            icon={ShieldCheck}
            title="When results count"
            description="Leaderboards appear only after final stats are reviewed, confirmed, and saved."
          />
        </CardContent>
      </Card>

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header py-4">
          <CardTitle className="text-base">Contest Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-4 text-sm">
          <DetailStat icon={Users} label="Player Pool" value={formatPlayerPoolLabel(contest.slate)} />
          <DetailStat icon={Clock} label="Stat Category" value={contest.statCategory} />
          <DetailStat icon={Ticket} label={isBetaContest ? 'Beta Pass' : 'Entry Type'} value={launchMode.betaEntryLabel} />
          <DetailStat icon={Users} label="Entries" value={contest.entries} />
          <DetailStat icon={Ticket} label={isBetaContest ? 'Beta Access' : 'Entry Cost'} value={isBetaContest ? 'No cash value' : contest.entryFee} />
          <DetailStat icon={Clock} label="Lock Time" value={contest.lockTime.replace('Locks ', '')} />
          <p className="col-span-2 border-t border-slate-200 pt-2 text-xs text-muted-foreground">
            * {isBetaContest ? 'This beta contest has no cash prizes, no payouts, and no paid-entry minimum.' : contest.minimum}.
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Contest Flow</CardTitle>
              <CardDescription>
                Review the contest, confirm your free beta entry, Build Your Board before lock, then return for final results
                after scoring is saved.
              </CardDescription>
            </div>
            <span className="status-pill status-pill-muted shrink-0">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Single Entry
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              'Review your Beta Pass entry before you confirm.',
              `Pick and rank your top 10 quarterbacks from the ${contest.slateSize}-player pool.`,
              `Save your board before ${contest.lockTime.replace('Locks ', '')}.`,
            ].map((step) => (
              <div key={step} className="step-row text-sm">
                <span className="numeric font-medium">{step}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="section-card-muted px-3 py-3 text-sm">
            <p className="font-medium">Scoring at a glance</p>
            <p className="mt-1 text-muted-foreground">
              Rank each quarterback as close to the final {contest.statCategory.toLowerCase()} order as possible. Each
              pick adds its rank miss to your total, so lower score wins.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works#rank-differential-example">See Scoring Example</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="section-card">
        <CardHeader>
          <CardTitle>Beta Result Status</CardTitle>
          <CardDescription>
            Early Access Beta contests show final rank, score, and standings after saved scoring is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="section-card-muted px-3 py-3">
            <p className="font-semibold">Rank, score, and standings only</p>
            <p className="mt-1 text-muted-foreground">
              Beta standings do not create payouts, cash prizes, or withdrawable balances.
            </p>
          </div>
          <div className="detail-row bg-white">
            <span>{launchMode.betaPassLabel}</span>
            <span className="font-medium text-foreground">No cash value</span>
          </div>
        </CardContent>
      </Card>

      {!viewerIdentity.isAuthenticated ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>What You Can Do Now</CardTitle>
            <CardDescription>Browse the contest details now, then sign in when you&apos;re ready to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You can review the format, lock time, and beta results model on this page right now.</p>
            <p>After you sign in, PickRank will take you into Entry Review and keep your next step pointed at this contest.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="action-panel">
        {primaryAction.href ? (
          <Button asChild className="w-full">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
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

function DetailStat({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
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

function QuickReadItem({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
}) {
  return (
    <div className="section-card-muted flex flex-row items-start gap-3 p-3 sm:min-h-[8rem] sm:flex-col sm:gap-0">
      <div className="mb-0 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 shadow-sm sm:mb-2">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </div>
      <div>
        <p className="font-black leading-tight">{title}</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function formatPlayerPoolLabel(label: string) {
  return label.replace(/\bslate\b/gi, 'player pool');
}
