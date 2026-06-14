import Link from 'next/link';
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, DollarSign, ListOrdered, Lock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getContestById } from '@/lib/phase-0-demo';

export default async function ContestDetailPage({ params }: { params: Promise<{ contestId: string }> }) {
  const { contestId } = await params;
  const contest = getContestById(contestId);

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
            Public overview only. Entry creation remains placeholder-safe in this phase.
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Build Your Lineup</CardTitle>
              <CardDescription>Lineup editing happens on a separate screen after payment review and the entry success step.</CardDescription>
            </div>
            <span className="status-pill shrink-0">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Entry Required
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="soft-panel space-y-3 text-sm">
            <p className="font-medium">Single-entry flow</p>
            <p className="text-muted-foreground">
              Contest detail now points into the gated MVP path instead of showing the lineup builder inline.
            </p>
          </div>
          <div className="space-y-2">
            {[
              'Review payment breakdown',
              'See the visual-only entry success state',
              'Open the dedicated Build Your Lineup screen',
            ].map((step) => (
              <div key={step} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{step}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Lineup access is still placeholder-only. No entry is created and no lineup is saved in this phase.
          </p>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button asChild className="w-full">
          <Link href={`/contests/${contest.id}/payment`}>Enter Contest - Review Payment</Link>
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
