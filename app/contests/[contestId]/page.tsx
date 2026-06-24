import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, ChevronRight, Clock, DollarSign, ListOrdered, Lock, Users } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProfileIdentity } from '@/lib/auth-profile';
import {
  getContestDetailPrimaryAction,
  contestEntryCookieName,
} from '@/lib/contest-entry-flow';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { getPersistedContestEntry, persistedContestEntryCookieName } from '@/lib/persisted-contest-entry';
import { demoLineupBuilderPlayers, getContestById, isContestOpenForEntry } from '@/lib/phase-0-demo';
import { createClient } from '@/lib/supabase/server';

export default async function ContestDetailPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = getContestById(contestId);
  const cookieStore = await cookies();
  let isAuthenticated = false;
  let isProfileComplete = false;

  if (hasBrowserSupabaseConfig()) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      const identity = getProfileIdentity(data.user);

      isAuthenticated = Boolean(data.user);
      isProfileComplete = identity.isProfileComplete;
    } catch {
      isAuthenticated = false;
      isProfileComplete = false;
    }
  }

  const hasEntry = Boolean(
    getPersistedContestEntry(
      contest.id,
      cookieStore.get(persistedContestEntryCookieName)?.value,
      demoLineupBuilderPlayers,
    ),
  );
  const primaryAction = getContestDetailPrimaryAction({
    contestId: contest.id,
    hasEntry,
    isAuthenticated,
    isContestOpen: isContestOpenForEntry(contest),
    isProfileComplete,
  });

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
          <CardTitle>How It Works</CardTitle>
          <CardDescription>Keep it simple: log in, pay the entry fee, build your lineup, then compete for the top spot.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            'Log in or create your account.',
            'Pick your contest and pay the entry fee.',
            'Build your lineup before the deadline.',
            'Compete for the best scores and the top payouts.',
          ].map((step, index) => (
            <div key={step} className="rounded-lg border bg-white px-3 py-3 text-sm">
              <p className="font-medium">Step {index + 1}</p>
              <p className="mt-1 text-muted-foreground">{step}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Build Your Lineup</CardTitle>
              <CardDescription>You will see 15 quarterbacks. Pick the 10 you believe will finish highest in passing yards.</CardDescription>
            </div>
            <span className="status-pill shrink-0">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Entry Required
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="soft-panel space-y-3 text-sm">
            <p className="font-medium">How to build your lineup</p>
            <p className="text-muted-foreground">
              Start by choosing the 10 quarterbacks you want in your lineup. Then drag and drop them into order, from the quarterback you trust most down to number 10.
            </p>
          </div>
          <div className="space-y-2">
            {[
              'Start with a 15-quarterback slate.',
              'Pick the 10 quarterbacks you want in your lineup.',
              'Drag and drop them into your final order before the deadline.',
            ].map((step) => (
              <div key={step} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{step}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Once the deadline hits, your lineup is locked and can no longer be changed.
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
            Rank the top 10 quarterbacks as close to their real finish as possible.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Pick the 10 quarterbacks you think will finish highest in {contest.statCategory.toLowerCase()} and rank them accordingly.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListOrdered className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Your goal is the lowest score possible. You get points for how far off your rankings are compared with the real results.</p>
          </div>
          <Button asChild variant="secondary" className="w-full">
            <Link href="/how-it-works#rank-differential-example">See Scoring Example</Link>
          </Button>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
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
