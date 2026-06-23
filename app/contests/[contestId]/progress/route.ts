import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { buildAuthHref, buildProfileHref, getProfileIdentity } from '@/lib/auth-profile';
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
  persistedContestEntryCookieName,
  removePersistedContestEntry,
} from '@/lib/persisted-contest-entry';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { demoLineupBuilderPlayers, getContestById, isContestOpenForEntry } from '@/lib/phase-0-demo';
import { createClient } from '@/lib/supabase/server';

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
  const contest = getContestById(contestId);
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(contestEntryCookieName)?.value;
  const entryCookieValue = cookieStore.get(persistedContestEntryCookieName)?.value;
  const requestedLineupAccess = stage === 'lineup';
  const requestedEntryFlow = stage === 'payment-review' || stage === 'entered';
  const requestedProtectedFlow = requestedEntryFlow || requestedLineupAccess;
  const contestIsOpen = isContestOpenForEntry(contest);
  const existingEntry = getPersistedContestEntry(contestId, entryCookieValue, demoLineupBuilderPlayers);

  if (requestedProtectedFlow) {
    const next = getContestEntryProgressHref(contestId, stage);

    if (!hasBrowserSupabaseConfig()) {
      return NextResponse.redirect(new URL(buildAuthHref(next), request.url));
    }

    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      const identity = getProfileIdentity(data.user);

      if (!data.user) {
        return NextResponse.redirect(new URL(buildAuthHref(next), request.url));
      }

      if (!identity.isProfileComplete) {
        return NextResponse.redirect(new URL(buildProfileHref(next), request.url));
      }
    } catch {
      return NextResponse.redirect(new URL(buildAuthHref(next), request.url));
    }
  }

  const shouldBlockEntryFlow = requestedEntryFlow && !contestIsOpen;
  const shouldBlockLockedLineupView = requestedLineupAccess && !contestIsOpen && !existingEntry;
  const nextStage = shouldBlockEntryFlow || shouldBlockLockedLineupView ? 'not-entered' : stage;
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

  if (nextStage === 'not-entered') {
    response.cookies.set(
      persistedContestEntryCookieName,
      removePersistedContestEntry({
        contestId,
        cookieValue: entryCookieValue,
        players: demoLineupBuilderPlayers,
      }),
      {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      },
    );
  } else if (nextStage === 'entered' || (requestedLineupAccess && contestIsOpen)) {
    const entryState = ensurePersistedContestEntry({
      contestId,
      cookieValue: entryCookieValue,
      players: demoLineupBuilderPlayers,
    });

    response.cookies.set(persistedContestEntryCookieName, entryState.cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }

  return response;
}
