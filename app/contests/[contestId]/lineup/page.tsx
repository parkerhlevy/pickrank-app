import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LineupBuilderClient } from '@/components/contests/lineup-builder-client';
import {
  contestEntryCookieName,
  getContestEntryRouteState,
  getContestEntryStateCopy,
  getContestEntrySteps,
  getPersistedContestEntryStage,
} from '@/lib/contest-entry-flow';
import {
  createLineupStateFromSavedOrder,
  createDefaultLineupState,
} from '@/lib/lineup-builder-state';
import {
  getPersistedContestEntry,
  persistedContestEntryCookieName,
} from '@/lib/persisted-contest-entry';
import {
  demoLineupBuilderPlayers,
  getContestById,
  isContestLineupEditable,
} from '@/lib/phase-0-demo';

export default async function LineupBuilderPage({
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
  const routeState = getContestEntryRouteState({ contestId: contest.id, persistedStage, route: 'lineup' });

  if (routeState.shouldRedirect && routeState.redirectHref) {
    redirect(routeState.redirectHref);
  }

  const stateCopy = getContestEntryStateCopy(routeState.stage);
  const flowSteps = getContestEntrySteps(routeState.stage);
  const persistedEntry = getPersistedContestEntry(
    contest.id,
    cookieStore.get(persistedContestEntryCookieName)?.value,
    demoLineupBuilderPlayers,
  );
  const isEditable = isContestLineupEditable(contest);

  if (!persistedEntry) {
    redirect(`/contests/${contest.id}`);
  }

  const initialLineupState = persistedEntry
    ? createLineupStateFromSavedOrder({
        players: demoLineupBuilderPlayers,
        savedOrder: persistedEntry.lineupOrder,
        source: persistedEntry.source,
        lastSavedAt: persistedEntry.lastSavedAt,
      })
    : createDefaultLineupState(demoLineupBuilderPlayers);

  return (
    <LineupBuilderClient
      contest={contest}
      entryId={persistedEntry.entryId}
      initialLineupState={initialLineupState}
      isEditable={isEditable}
      stateCopy={stateCopy}
      flowSteps={flowSteps}
    />
  );
}
