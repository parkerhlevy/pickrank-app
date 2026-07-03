import Link from 'next/link';
import { ArrowLeft, ChevronRight, Clock, DollarSign, Lock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
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

  const hasEntry = Boolean(
    await getPersistedContestEntry(
      contest.id,
      viewerIdentity.userId,
      getContestSelectablePlayers(contest),
      getContestDefaultLineupOrder(contest),
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
          <Link href="/how-it-works" className="shrink-0 text-sm font-bold text-primary">
            How It Works
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-slate-950 py-4 text-white">
          <CardTitle className="text-base">Contest Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-2 pt-4 text-sm">
          <DetailStat icon={DollarSign} label="Prize Pool" value={contest.prizePool} />
          <DetailStat icon={Users} label="Entries" value={contest.entries} />
          <DetailStat icon={DollarSign} label="Entry Fee" value={contest.entryFee} />
          <DetailStat icon={Clock} label="Lock Time" value={contest.lockTime.replace('Locks ', '')} />
          <p className="col-span-2 border-t border-slate-200 pt-2 text-xs text-muted-foreground">
            * {contest.minimum}.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Before You Enter</CardTitle>
              <CardDescription>This contest follows a simple path: enter, set your rankings before lock, and compete for the top payouts.</CardDescription>
            </div>
            <span className="status-pill shrink-0">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Entry Required
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {[
              'Review your entry fee before you confirm.',
              'Pick and rank 10 quarterbacks from the 15-player slate.',
              `Save your lineup before ${contest.lockTime.replace('Locks ', '')}.`,
            ].map((step) => (
              <div key={step} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{step}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
          <div className="rounded-lg border bg-slate-50 px-3 py-3 text-sm">
            <p className="font-medium">Scoring at a glance</p>
            <p className="mt-1 text-muted-foreground">
              Rank the quarterbacks as close to their real finish as possible. Each pick adds its rank miss to your total, so lower score wins.
            </p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works#rank-differential-example">See Scoring Example</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Projected Payouts</CardTitle>
          <CardDescription>
            Current payout examples based on the prize pool shown today. Final settled results and payout processing will
            appear here after contests close.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {contest.payoutRows.map((row) => (
            <div key={row.place} className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
              <span className="font-medium">{row.place}</span>
              <span className="font-semibold">{row.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {!viewerIdentity.isAuthenticated ? (
        <Card>
          <CardHeader>
            <CardTitle>What You Can Do Now</CardTitle>
            <CardDescription>Browse the contest details today, then sign in when you&apos;re ready to continue.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>You can review the format, lock time, and payout structure on this page right now.</p>
            <p>After you sign in, PickRank will take you into Payment Review and keep your next step pointed at this contest.</p>
          </CardContent>
        </Card>
      ) : null}

      <div className="rounded-lg border bg-white p-3 shadow-lg">
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
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
      <div className="mb-1 flex items-center gap-1 text-[11px] text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden="true" />
        {label}
      </div>
      <p className="text-sm font-semibold leading-tight">{value}</p>
    </div>
  );
}
