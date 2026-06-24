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
  getContestEntryProgressHref,
  getContestEntryStateCopy,
  getContestEntrySteps,
  getPersistedContestEntryStage,
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

  const stage = getPersistedContestEntryStage(
    contest.id,
    cookieStore.get(contestEntryCookieName)?.value,
  );
  const hasEntry = Boolean(
    getPersistedContestEntry(
      contest.id,
      cookieStore.get(persistedContestEntryCookieName)?.value,
      demoLineupBuilderPlayers,
    ),
  );
  const stateCopy = getContestEntryStateCopy(stage);
  const primaryAction = getContestDetailPrimaryAction({
    contestId: contest.id,
    hasEntry,
    isAuthenticated,
    isContestOpen: isContestOpenForEntry(contest),
    isProfileComplete,
  });
  const flowSteps = getContestEntrySteps(stage);

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
            Public overview with single-entry MVP flow guidance.
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{stateCopy.title}</CardTitle>
              <CardDescription>{stateCopy.description}</CardDescription>
            </div>
            <span className="status-pill shrink-0">{stateCopy.badge}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {flowSteps.map((step) => (
            <div key={step.key} className="rounded-lg border bg-white px-3 py-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium">
                  Step {step.stepNumber}: {step.label}
                </span>
                <span
                  className={
                    step.status === 'current'
                      ? 'font-bold text-primary'
                      : step.status === 'complete'
                        ? 'text-emerald-700'
                        : 'text-muted-foreground'
                  }
                >
                  {step.status === 'current' ? 'Current' : step.status === 'complete' ? 'Complete' : 'Next'}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{step.summary}</p>
            </div>
          ))}
          <div className="rounded-lg bg-slate-100 p-3 text-sm text-muted-foreground">
            The lineup builder stays behind entry confirmation so the contest overview, payment handoff, and edit state each have a clear job.
          </div>
          {stage !== 'not-entered' ? (
            <Button asChild variant="ghost" className="w-full">
              <Link href={getContestEntryProgressHref(contest.id, 'not-entered')}>Reset Placeholder Flow</Link>
            </Button>
          ) : null}
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
              <CardDescription>Lineup editing happens on a separate screen after Payment Review and Entry Success.</CardDescription>
            </div>
            <span className="status-pill shrink-0">
              <Lock className="mr-1 h-3 w-3" aria-hidden="true" />
              Entry Required
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="soft-panel space-y-3 text-sm">
            <p className="font-medium">Why this flow is separated</p>
            <p className="text-muted-foreground">
              Contest Detail explains the contest. Payment Review confirms the fee breakdown. Entry Success hands off into one dedicated lineup screen tied to the current entry.
            </p>
          </div>
          <div className="space-y-2">
            {[
              'Step 2: Review the payment breakdown',
              'Step 3: Confirm the entry success handoff',
              'Step 4: Open the dedicated Build Your Lineup screen',
            ].map((step) => (
              <div key={step} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm">
                <span className="font-medium">{step}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Once you have an entry, the primary button changes from entering the contest to editing or viewing that lineup depending on lock state.
          </p>
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
