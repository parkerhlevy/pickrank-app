import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import {
  contestEntryCookieName,
  getContestEntryProgressHref,
  getContestEntryRouteState,
  getContestEntryStateCopy,
  getPersistedContestEntryStage,
} from '@/lib/contest-entry-flow';
import { getContestById } from '@/lib/contest-data';

export default async function EntrySuccessPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  const next = `/contests/${contest.id}/success`;
  const protectedRedirect = await getProtectedContestEntryRedirect(next);

  if (protectedRedirect) {
    redirect(protectedRedirect);
  }

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

  return (
    <div className="space-y-5 pb-28">
      <Button asChild variant="ghost" size="sm" className="-ml-3 justify-start">
        <Link href={`/contests/${contest.id}`}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
          Contest Details
        </Link>
      </Button>

      <div className="screen-header space-y-2">
        <p className="eyebrow">Entry Success</p>
        <h1 className="text-3xl font-black leading-tight">{contest.title}</h1>
        <p className="text-muted-foreground">Your entry is confirmed. Head into your lineup now and keep editing until the contest locks.</p>
      </div>

      <Card className="overflow-hidden">
        <CardHeader className="bg-emerald-950 text-white">
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
            You&apos;re In
          </CardTitle>
          <CardDescription className="text-emerald-200">
            Your contest entry is confirmed and your lineup is ready for your rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-3">
            <div>
              <p className="font-semibold">{stateCopy.title}</p>
              <p className="mt-1 text-muted-foreground">{stateCopy.description}</p>
            </div>
            <span className="status-pill shrink-0">{stateCopy.badge}</span>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Set your rankings before {contest.lockTime.replace('Locks ', '')}. You can keep editing until the contest locks.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p>Your lineup screen is ready with one clear next step: rank your quarterbacks and save your order.</p>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-lg border bg-white p-3 shadow-lg">
        <Button asChild className="w-full">
          <Link href={getContestEntryProgressHref(contest.id, 'lineup')}>Continue to Build Your Lineup</Link>
        </Button>
      </div>
    </div>
  );
}
