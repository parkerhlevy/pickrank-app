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
import { getPersistedContestEntry } from '@/lib/persisted-contest-entry';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import {
  findContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
import { getViewerIdentity } from '@/lib/viewer-identity';
import { isBetaFreeEntryContest } from '@/lib/launch-mode';
import { getAppUrl, getRequestOrigin } from '@/lib/env';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const requestUrl = new URL(request.url);
  const requestOrigin = getRequestOrigin(request.headers, getAppUrl());
  const requestedStage = requestUrl.searchParams.get('stage');
  const stage = contestEntryStages.includes(requestedStage as ContestEntryStage)
    ? (requestedStage as ContestEntryStage)
    : 'not-entered';
  const contest = await findContestById(contestId);
  if (!contest) {
    return NextResponse.json({ message: 'Contest not found.' }, { status: 404 });
  }
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

  if (isBetaFreeEntryContest(contest.entryFeeCents) && requestedEntryFlow) {
    const directEntryHref = existingEntry
      ? getContestEntryHref(contestId, 'lineup')
      : getContestEntryHref(contestId, 'not-entered');

    return NextResponse.redirect(new URL(directEntryHref, requestOrigin));
  }

  if (requestedProtectedFlow) {
    const next = getContestEntryProgressHref(contestId, stage);
    const redirectHref = await getProtectedContestEntryRedirect(next);

    if (redirectHref) {
      return NextResponse.redirect(new URL(redirectHref, requestOrigin));
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
      : stage === 'entered' || stage === 'lineup'
        ? 'payment-review'
        : stage;
  const updatedCookieValue = getUpdatedContestEntryCookieValue({
    contestId,
    currentCookieValue: cookieValue,
    stage: nextStage,
  });
  const response = NextResponse.redirect(new URL(getContestEntryHref(contestId, nextStage), requestOrigin));

  response.cookies.set(contestEntryCookieName, updatedCookieValue, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });

  return response;
}
