import Link from 'next/link';
import { ArrowRight, Clock, DollarSign, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { openContests } from '@/lib/phase-0-demo';

export default function ContestsPage() {
  const featuredContest = openContests[0];
  const supportingContests = openContests.slice(1);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Contests</p>
            <h1 className="text-3xl font-bold tracking-tight">Open Contests</h1>
          </div>
          <Link href="/how-it-works" className="text-sm font-medium text-primary">
            How It Works
          </Link>
        </div>
        <p className="text-muted-foreground">Browse available Phase 0 contest cards. Entry flows are not active yet.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase text-primary">Featured</p>
              <CardTitle>{featuredContest.title}</CardTitle>
              <CardDescription>{featuredContest.task}</CardDescription>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
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

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">More Open Contests</h2>
        {supportingContests.map((contest) => (
          <Card key={contest.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="text-base">{contest.title}</CardTitle>
                  <CardDescription>{contest.lockTime}</CardDescription>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">{contest.status}</span>
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
  contest: (typeof openContests)[number];
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'grid grid-cols-2 gap-3 text-sm' : 'grid grid-cols-2 gap-3 text-sm'}>
      <Stat icon={DollarSign} label="Prize Pool" value={contest.prizePool} />
      <Stat icon={Users} label="Entries" value={contest.entries} />
      <Stat icon={Clock} label="Lock Time" value={contest.lockTime.replace('Locks ', '')} />
      <Stat icon={DollarSign} label="Entry Fee" value={contest.entryFee} />
    </div>
  );
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
    <div className="rounded-lg border bg-muted/35 p-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        {label}
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
