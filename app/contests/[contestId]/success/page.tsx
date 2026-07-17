import Link from 'next/link';
import { cookies } from 'next/headers';
import { ArrowLeft, CheckCircle2, Clock, ListChecks } from 'lucide-react';
import { redirect } from 'next/navigation';
import { Notice } from '@/components/ui/notice';
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
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
} from '@/lib/contest-data';
import { getPersistedContestEntry } from '@/lib/persisted-contest-entry';
import { getViewerIdentity } from '@/lib/viewer-identity';

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
  const viewerIdentity = await getViewerIdentity();
  const persistedEntry = await getPersistedContestEntry(
    contest.id,
    viewerIdentity.userId,
    getContestSelectablePlayers(contest),
    getContestDefaultLineupOrder(contest),
  );
  const routeState = getContestEntryRouteState({
    contestId: contest.id,
    persistedStage,
    route: 'success',
    hasPersistedEntry: Boolean(persistedEntry),
  });

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
        <p className="text-muted-foreground">
          Your entry is confirmed. Head into Build Your Lineup now and keep editing until the contest locks.
        </p>
      </div>

      <Card className="section-card overflow-hidden">
        <CardHeader className="border-b border-emerald-900/60 bg-[linear-gradient(180deg,hsl(151_63%_18%)_0%,hsl(160_55%_20%)_100%)] text-white">
          <CardTitle>You&apos;re In</CardTitle>
          <CardDescription className="text-emerald-200">
            Your contest entry is confirmed and your lineup is ready for your rankings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 pt-5 text-sm">
          <Notice
            variant="success"
            icon={CheckCircle2}
            title={stateCopy.title}
            description={stateCopy.description}
            badge={stateCopy.badge}
          />
          <div className="flex items-start gap-2">
            <Clock className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p className="numeric">Set your rankings before {contest.lockTime.replace('Locks ', '')}. You can keep editing until the contest locks.</p>
          </div>
          <div className="flex items-start gap-2">
            <ListChecks className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
            <p className="numeric">Your lineup screen is ready with one clear next step: rank your top 10 quarterbacks and save your order.</p>
          </div>
        </CardContent>
      </Card>

      <div className="action-panel">
        <Button asChild className="w-full">
          <Link href={getContestEntryProgressHref(contest.id, 'lineup')}>Continue to Build Your Lineup</Link>
        </Button>
      </div>
    </div>
  );
}
