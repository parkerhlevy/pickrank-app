import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Clock, DollarSign, ListOrdered, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { demoLineup, openContests } from '@/lib/phase-0-demo';

export default async function ContestDetailPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const contest = openContests.find((item) => item.id === contestId) ?? openContests[0];

  return (
    <div className="space-y-5">
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
          <CardDescription className="text-xs text-slate-300">
            Public overview only. Payment review and entry creation are future work.
          </CardDescription>
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
          <CardTitle>Projected Payouts</CardTitle>
          <CardDescription>Projected from the current placeholder prize pool. Final payout logic is not implemented.</CardDescription>
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

      <Card>
        <CardHeader>
          <CardTitle>Scoring Summary</CardTitle>
          <CardDescription>
            {contest.slate}. Rank differential compares each saved spot against the official final rank.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Select and rank your top 10 quarterbacks by {contest.statCategory.toLowerCase()}.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListOrdered className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Your score is based on rank differential against the official final stat ranking. Lower is better.</p>
          </div>
          <p className="rounded-lg bg-slate-100 p-3 text-muted-foreground">Results appear only after final stat review in a future phase.</p>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works#rank-differential-example">See Scoring Example</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Build Your Lineup</CardTitle>
          <CardDescription>Visual preview for the future lineup builder. Saving is not wired yet.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="soft-panel text-sm">
            <p className="font-medium">5/10 ranked</p>
            <p className="text-muted-foreground">Rank the top 10 quarterbacks by passing yards.</p>
          </div>
          <div className="space-y-2">
            {demoLineup.map((name, index) => (
              <div key={name} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="font-medium">
                  {index + 1}. {name}
                </span>
                <span className="text-muted-foreground">Mock slate</span>
              </div>
            ))}
          </div>
          <Button className="w-full" disabled>
            Save Lineup
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button className="w-full" disabled>
          Enter Contest - Payment Review Not Implemented
        </Button>
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
