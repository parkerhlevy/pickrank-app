import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, CircleAlert, ListChecks } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  contestEntryCookieName,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStateCopy,
  getContestEntrySteps,
  getPersistedContestEntryStage,
} from '@/lib/contest-entry-flow';
import { getContestById } from '@/lib/phase-0-demo';

export default async function EntrySuccessPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = getContestById(contestId);
  const cookieStore = await cookies();
  const persistedStage = getPersistedContestEntryStage(
    contest.id,
    cookieStore.get(contestEntryCookieName)?.value,
  );
  const routeState = getContestEntryRouteState({ contestId: contest.id, persistedStage, route: 'success' });

  if (routeState.shouldRedirect && routeState.redirectHref) {
    redirect(routeState.redirectHref);
  }

  const stateCopy = getContestEntryStateCopy(routeState.stage);
  const flowSteps = getContestEntrySteps(routeState.stage);

  return (
    <div className="space-y-5">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Details
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Entry Success</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">Step 3 confirms the handoff from entry into lineup editing, without mixing those states together.</p>
      </div>

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
        <CardContent className="space-y-2">
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
        </CardContent>
      </Card>

      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-950 text-white">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            You&apos;re In
          </CardTitle>
          <CardDescription className="text-emerald-200">
            Your contest entry is in place for this MVP flow and your lineup is ready for the next step.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <p className="font-semibold">Next step: Build Your Lineup</p>
            <p className="mt-1 text-muted-foreground">Set your rankings before {contest.lockTime.replace('Locks ', '')}. This is where lineup editing begins.</p>
          </div>
          <div className="flex items-start gap-2">
            <CircleAlert className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Your current entry record is now in place for the lineup builder, while payment processing remains future work.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Single-entry language stays intact: one contest entry, one lineup screen, and one clear next action.</p>
          </div>
        </CardContent>
      </Card>

      <div className="sticky bottom-20 rounded-lg border bg-white p-3 shadow-lg">
        <Button asChild className="w-full">
          <Link href={getContestEntryProgressHref(contest.id, 'lineup')}>Continue to Build Your Lineup</Link>
        </Button>
      </div>
    </div>
  );
}
