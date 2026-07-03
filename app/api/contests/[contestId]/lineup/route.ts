import { NextResponse } from 'next/server';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestLineupEditable,
} from '@/lib/contest-data';
import {
  savePersistedContestEntryLineup,
} from '@/lib/persisted-contest-entry';
import { getViewerIdentity } from '@/lib/viewer-identity';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ contestId: string }> },
) {
  const { contestId } = await params;
  const contest = await getContestById(contestId);
  const selectablePlayers = getContestSelectablePlayers(contest);
  const defaultSelectedOrder = getContestDefaultLineupOrder(contest);

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

  const viewerIdentity = await getViewerIdentity();

  if (!viewerIdentity.isAuthenticated || !viewerIdentity.isProfileComplete || !viewerIdentity.isEmailVerified || !viewerIdentity.userId) {
    return NextResponse.json({ message: 'Sign in with a ready account before saving a lineup.' }, { status: 401 });
  }

  try {
    const result = await savePersistedContestEntryLineup({
      contestId,
      viewerId: viewerIdentity.userId,
      players: selectablePlayers,
      defaultSelectedOrder,
      order: body.order,
    });
    const response = NextResponse.json({
      entryId: result.entry.entryId,
      savedOrder: result.entry.lineupOrder,
      source: result.entry.source,
      lastSavedAt: result.entry.lastSavedAt,
    });

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to save this lineup right now.';
    const status = message === 'No persisted entry exists for this contest.' ? 404 : 400;

    return NextResponse.json({ message }, { status });
  }
}
