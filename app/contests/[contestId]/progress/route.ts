import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  contestEntryCookieName,
  contestEntryStages,
  getContestEntryHref,
  getContestEntryProgressHref,
  getUpdatedContestEntryCookieValue,
  type ContestEntryStage,
} from '@/lib/contest-entry-flow';
import {
  ensurePersistedContestEntry,
  getPersistedContestEntry,
} from '@/lib/persisted-contest-entry';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
import { getViewerIdentity } from '@/lib/viewer-identity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const requestUrl = new URL(request.url);
  const requestedStage = requestUrl.searchParams.get('stage');
  const stage = contestEntryStages.includes(requestedStage as ContestEntryStage)
    ? (requestedStage as ContestEntryStage)
    : 'not-entered';
  const contest = await getContestById(contestId);
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(contestEntryCookieName)?.value;
  const requestedLineupAccess = stage === 'lineup';
  const requestedEntryFlow = stage === 'payment-review' || stage === 'entered';
  const requestedProtectedFlow = requestedEntryFlow || requestedLineupAccess;
  const contestIsOpen = isContestOpenForEntry(contest);
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultSelectedOrder = getContestDefaultLineupOrder(contest);
  const viewerIdentity = await getViewerIdentity();
  const existingEntry = await getPersistedContestEntry(
    contestId,
    viewerIdentity.userId,
    selectablePlayers,
    defaultSelectedOrder,
  );

  if (requestedProtectedFlow) {
    const next = getContestEntryProgressHref(contestId, stage);
    const redirectHref = await getProtectedContestEntryRedirect(next);

    if (redirectHref) {
      return NextResponse.redirect(new URL(redirectHref, request.url));
    }
  }

  const shouldBlockEntryFlow = requestedEntryFlow && !contestIsOpen;
  const shouldBlockLockedLineupView = requestedLineupAccess && !contestIsOpen && !existingEntry;
  const nextStage = shouldBlockEntryFlow || shouldBlockLockedLineupView
    ? 'not-entered'
    : existingEntry
      ? requestedLineupAccess
        ? 'lineup'
        : 'entered'
      : stage;
  const updatedCookieValue = getUpdatedContestEntryCookieValue({
    contestId,
    currentCookieValue: cookieValue,
    stage: nextStage,
  });
  const response = NextResponse.redirect(new URL(getContestEntryHref(contestId, nextStage), request.url));

  response.cookies.set(contestEntryCookieName, updatedCookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  if (nextStage === 'entered' || (requestedLineupAccess && contestIsOpen)) {
    await ensurePersistedContestEntry({
      contestId,
      viewerId: viewerIdentity.userId ?? '',
      players: selectablePlayers,
      defaultSelectedOrder,
    });
  }

  return response;
}
