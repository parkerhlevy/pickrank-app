import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { listPublicContests, type ContestSummary } from '@/lib/contest-data';

export default async function ContestsPage() {
  const contests = await listPublicContests();
  const featuredContest = contests[0] ?? null;
  const supportingContests = contests.slice(1);

  return (
    <div className="space-y-6">
      <div className="screen-header space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Contests</p>
            <h1 className="text-3xl font-black leading-tight">Open Contests</h1>
          </div>
          <Link href="/how-it-works" className="text-sm font-bold text-primary">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">
          Browse this week&apos;s contest slate now. After you sign in, PickRank preserves your place and sends you into
          entry and lineup setup for the contest you choose.
        </p>
      </div>

      {featuredContest ? (
        <Card className="overflow-hidden">
          <CardHeader className="bg-slate-950 text-white">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-xs font-bold uppercase text-blue-300">Featured</p>
                <CardTitle>{featuredContest.title}</CardTitle>
                <CardDescription className="text-slate-300">{featuredContest.task}</CardDescription>
              </div>
              <span className="rounded-full border border-blue-300/30 bg-blue-400/15 px-2.5 py-1 text-xs font-bold text-blue-200">
                {featuredContest.status}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <ContestStats contest={featuredContest} />
            <Button asChild className="w-full">
              <Link href={`/contests/${featuredContest.id}`}>Enter Contest</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="space-y-2 pt-6 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground">No contests are available right now.</p>
            <p>An internal contest operator can create, validate, and publish the next contest from admin.</p>
          </CardContent>
        </Card>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">More Open Contests</h2>
        {supportingContests.map((contest) => (
          <Card key={contest.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{contest.title}</CardTitle>
                  <CardDescription>{formatLockTime(contest.lockTime)}</CardDescription>
                </div>
                <span className="status-pill">{contest.status}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ContestStats contest={contest} compact />
              <Button asChild variant="secondary" className="w-full">
                <Link href={`/contests/${contest.id}`} className="gap-2">
                  View Contest
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}

function ContestStats({
  contest,
  compact = false,
}: {
  contest: ContestSummary;
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-3 text-sm' : 'grid grid-cols-2 gap-3 text-sm'}>
      <Stat icon={DollarSign} label="Prize Pool" value={contest.prizePool} />
      <Stat icon={Users} label="Entries" value={contest.entries} />
      <Stat icon={Clock} label="Lock Time" value={formatLockTime(contest.lockTime)} />
      <Stat icon={DollarSign} label="Entry Fee" value={contest.entryFee} />
    </div>
  );
}

function formatLockTime(lockTime: string) {
  return lockTime.replace(/^Locks\s+/, '');
}

function Stat({
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
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
