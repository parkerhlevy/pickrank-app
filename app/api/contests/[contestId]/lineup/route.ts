import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { demoLineupBuilderPlayers, getContestById, isContestLineupEditable } from '@/lib/phase-0-demo';
import {
  persistedContestEntryCookieName,
  savePersistedContestEntryLineup,
} from '@/lib/persisted-contest-entry';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const contest = getContestById(contestId);

  if (!isContestLineupEditable(contest)) {
    return NextResponse.json(
      {
        message: 'This contest is locked, so the lineup is now read-only.',
      },
      { status: 409 },
    );
  }

  const body = (await request.json()) as { order?: string[] };

  if (!Array.isArray(body.order)) {
    return NextResponse.json({ message: 'A lineup order is required.' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(persistedContestEntryCookieName)?.value;

  try {
    const result = savePersistedContestEntryLineup({
      contestId,
      cookieValue,
      players: demoLineupBuilderPlayers,
      order: body.order,
    });
    const response = NextResponse.json({
      entryId: result.entry.entryId,
      savedOrder: result.entry.lineupOrder,
      source: result.entry.source,
      lastSavedAt: result.entry.lastSavedAt,
    });

    response.cookies.set(persistedContestEntryCookieName, result.cookieValue, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save this lineup right now.';
    const status = message === 'No persisted entry exists for this contest.' ? 404 : 400;

    return NextResponse.json({ message }, { status });
  }
}
