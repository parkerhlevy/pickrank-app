'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getProtectedContestEntryRedirect } from '@/lib/contest-entry-access';
import { getContestEntryConfirmationError } from '@/lib/contest-entry-confirmation';
import { getContestEntryProgressHref } from '@/lib/contest-entry-flow';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  isContestOpenForEntry,
} from '@/lib/contest-data';
import { ensurePersistedContestEntry } from '@/lib/persisted-contest-entry';
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
  const next = `/contests/${contest.id}/payment`;
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
    redirect(`/contests/${contest.id}/payment?status=error&message=${encodeURIComponent(confirmationError)}`);
  }

  await ensurePersistedContestEntry({
    contestId: contest.id,
    viewerId: viewerIdentity.userId ?? '',
    players: getContestSelectablePlayers(contest),
    defaultSelectedOrder: getContestDefaultLineupOrder(contest),
  });

  redirect(getContestEntryProgressHref(contest.id, 'entered'));
}
