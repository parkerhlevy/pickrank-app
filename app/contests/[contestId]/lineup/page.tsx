import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LineupBuilderClient } from '@/components/contests/lineup-builder-client';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
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
import { getPersistedContestEntry } from '@/lib/persisted-contest-entry';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestLineupEditable,
} from '@/lib/contest-data';
import { getViewerIdentity } from '@/lib/viewer-identity';

export default async function LineupBuilderPage({
  params,
}: {
  params: Promise<{ contestId: string }>;
}) {
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  const next = `/contests/${contest.id}/lineup`;
  const protectedRedirect = await getProtectedContestEntryRedirect(next);

  if (protectedRedirect) {
    redirect(protectedRedirect);
  }

  const cookieStore = await cookies();
  const persistedStage = getPersistedContestEntryStage(
    contest.id,
    cookieStore.get(contestEntryCookieName)?.value,
  );
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultSelectedOrder = getContestDefaultLineupOrder(contest);
  const viewerIdentity = await getViewerIdentity();
  const persistedEntry = await getPersistedContestEntry(
    contest.id,
    viewerIdentity.userId,
    selectablePlayers,
    defaultSelectedOrder,
  );
  const routeState = getContestEntryRouteState({
    contestId: contest.id,
    persistedStage,
    route: 'lineup',
    hasPersistedEntry: Boolean(persistedEntry),
  });

  if (routeState.shouldRedirect && routeState.redirectHref) {
    redirect(routeState.redirectHref);
  }

  const stateCopy = getContestEntryStateCopy(routeState.stage);
  const flowSteps = getContestEntrySteps(routeState.stage);
  const isEditable = isContestLineupEditable(contest);

  if (!persistedEntry) {
    redirect(`/contests/${contest.id}`);
  }

  const initialLineupState = persistedEntry
    ? createLineupStateFromSavedOrder({
        players: selectablePlayers,
        savedOrder: persistedEntry.lineupOrder,
        defaultSelectedOrder,
        source: persistedEntry.source,
        lastSavedAt: persistedEntry.lastSavedAt,
      })
    : createDefaultLineupState({ players: selectablePlayers, defaultSelectedOrder });

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
