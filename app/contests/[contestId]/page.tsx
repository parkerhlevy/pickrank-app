import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock, DollarSign, Lock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ContestBoardPreview, ContestJourneyRail } from '@/components/contests/contest-board-preview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestDetailPrimaryAction } from '@/lib/contest-entry-flow';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
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
    hasEntry,
    isAuthenticated: viewerIdentity.isAuthenticated,
    isContestOpen: isContestOpenForEntry(contest),
    isProfileComplete: viewerIdentity.isProfileComplete,
    isEmailVerified: viewerIdentity.isEmailVerified,
    contestStatus: contest.contestStatus,
  });

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

      <Card className="section-card overflow-hidden">
        <CardHeader className="section-card-header py-4">
          <CardTitle className="text-base">Contest Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-4 text-sm">
          <DetailStat icon={Users} label="Slate" value={contest.slate} />
          <DetailStat icon={Clock} label="Stat Category" value={contest.statCategory} />
          <DetailStat icon={DollarSign} label="Prize Pool" value={contest.prizePool} />
          <DetailStat icon={Users} label="Entries" value={contest.entries} />
          <DetailStat icon={DollarSign} label="Entry Fee" value={contest.entryFee} />
          <DetailStat icon={Clock} label="Lock Time" value={contest.lockTime.replace('Locks ', '')} />
          <p className="col-span-2 border-t border-slate-200 pt-2 text-xs text-muted-foreground">
            * {contest.minimum}.
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
        variant="detail"
      />

      <ContestJourneyRail currentStage="slate" />

      <Card className="section-card">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Contest Flow</CardTitle>
              <CardDescription>
                Review the contest, confirm your entry, Build Your Lineup before lock, then return for final results
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
              'Review your entry fee before you confirm.',
              `Pick and rank your top 10 quarterbacks from the ${contest.slateSize}-player slate.`,
              `Save your lineup before ${contest.lockTime.replace('Locks ', '')}.`,
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
          <CardTitle>Projected Payouts</CardTitle>
          <CardDescription>
            Current projected top-three payouts based on the prize pool shown today. Final settled results and payout
            processing appear only after the contest closes and saved scoring is confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {contest.payoutRows.map((row) => (
            <div key={row.place} className="detail-row bg-white">
              <span className="font-medium">{row.place}</span>
              <span className="numeric font-semibold">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {!viewerIdentity.isAuthenticated ? (
        <Card className="section-card">
          <CardHeader>
            <CardTitle>What You Can Do Now</CardTitle>
            <CardDescription>Browse the contest details now, then sign in when you&apos;re ready to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You can review the format, lock time, and projected payouts on this page right now.</p>
            <p>After you sign in, PickRank will take you into Payment Review and keep your next step pointed at this contest.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="action-panel">
        {primaryAction.href ? (
          <Button asChild className="w-full">
            <Link href={primaryAction.href}>{primaryAction.label}</Link>
          </Button>
        ) : (
          <Button className="w-full" disabled>
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
