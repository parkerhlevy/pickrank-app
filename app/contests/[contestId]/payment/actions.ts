'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import { getContestEntryConfirmationError } from '@/lib/contest-entry-confirmation';
import { getContestEntryHref, getContestEntryProgressHref } from '@/lib/contest-entry-flow';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
import { ensurePersistedContestEntry } from '@/lib/persisted-contest-entry';
import { isBetaFreeEntryContest } from '@/lib/launch-mode';
import { getViewerIdentity } from '@/lib/viewer-identity';

const confirmationSchema = z.object({
  contestId: z.string().trim().min(1),
});

export async function confirmContestEntryAction(formData: FormData) {
  const parsed = confirmationSchema.safeParse({
    contestId: formData.get('contestId'),
  });

  if (!parsed.success) {
    redirect('/contests');
  }

  const contest = await getContestById(parsed.data.contestId);
  const isFreeBetaEntry = isBetaFreeEntryContest(contest.entryFeeCents);
  const next = isFreeBetaEntry ? `/contests/${contest.id}` : `/contests/${contest.id}/payment`;
  const protectedRedirect = await getProtectedContestEntryRedirect(next);

  if (protectedRedirect) {
    redirect(protectedRedirect);
  }

  if (!isContestOpenForEntry(contest)) {
    redirect(`/contests/${contest.id}?status=error&message=${encodeURIComponent('This contest is no longer accepting entries.')}`);
  }

  const viewerIdentity = await getViewerIdentity();
  const confirmationError = getContestEntryConfirmationError(contest.entryFeeCents, {
    eligibility: viewerIdentity.eligibility,
    viewerSource: viewerIdentity.source,
  });

  if (confirmationError) {
    const errorPath = isFreeBetaEntry ? `/contests/${contest.id}` : `/contests/${contest.id}/payment`;
    redirect(`${errorPath}?status=error&message=${encodeURIComponent(confirmationError)}`);
  }

  await ensurePersistedContestEntry({
    contestId: contest.id,
    viewerId: viewerIdentity.userId ?? '',
    players: getContestSelectablePlayers(contest),
    defaultSelectedOrder: getContestDefaultLineupOrder(contest),
  });

  redirect(
    isFreeBetaEntry
      ? getContestEntryHref(contest.id, 'lineup')
      : getContestEntryProgressHref(contest.id, 'entered'),
  );
}
