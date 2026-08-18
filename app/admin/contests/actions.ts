'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';
import {
  createDraftContest,
  getContestById,
  lockFreeTestContestForProof,
  publishContest,
  removePublicContest,
  saveContestSlate,
  validateDraftContest,
  type ContestSlatePlayer,
} from '@/lib/contest-data';
import { canFinalizeContestStatus, parseFinalStatRows } from '@/lib/contest-finalization';
import { contestPlayerPoolSize } from '@/lib/contest-rules';
import { requireContestOperator } from '@/lib/contest-operator-access';
import { finalizeContestResults } from '@/lib/contest-results';
import { fetchAndPersistContestStatSnapshot } from '@/lib/stats-provider';

const createDraftContestSchema = z.object({
  title: z.string().trim().min(1, 'Add a contest title.'),
  description: z.string().trim().min(1, 'Add a short contest instruction.'),
  season: z.coerce.number().int().min(2026, 'Enter a valid NFL season year.'),
  week: z.coerce.number().int().min(1, 'Week must be between 1 and 18.').max(18, 'Week must be between 1 and 18.'),
  entryFeeDollars: z.coerce.number().min(0, 'Entry fee cannot be negative.'),
  entryOpenTimeLocal: z.string().trim().min(1, 'Add an entry open time.'),
  lockTimeLocal: z.string().trim().min(1, 'Add a contest lock time.'),
});

const contestIdSchema = z.object({
  contestId: z.string().trim().min(1, 'Contest not found.'),
});

const saveContestSlateSchema = z.object({
  contestId: z.string().trim().min(1, 'Contest not found.'),
  slateRows: z.string().trim().min(1, `Add ${contestPlayerPoolSize} quarterback rows before saving the player pool.`),
});

const finalizeContestSchema = z.object({
  contestId: z.string().trim().min(1, 'Contest not found.'),
  finalStatRows: z.string().trim().min(1, 'Add the confirmed final QB stats before running results.'),
  confirmationText: z.string().trim().min(1, 'Type FINAL to confirm the scoring publish step.'),
});

const lockFreeTestContestSchema = z.object({
  contestId: z.string().trim().min(1, 'Contest not found.'),
  confirmationText: z.string().trim().min(1, 'Type LOCK TEST to confirm this proof lock.'),
});

const removePublicContestSchema = z.object({
  contestId: z.string().trim().min(1, 'Contest not found.'),
  confirmationIntent: z.literal('remove_contest'),
});

function buildAdminContestsRedirect(
  status:
    | 'created'
    | 'saved'
    | 'validated'
    | 'published'
    | 'locked'
    | 'removed'
    | 'fetched'
    | 'finalized'
    | 'error',
  message?: string,
) {
  const params = new URLSearchParams({ status });

  if (message) {
    params.set('message', message);
  }

  return `/admin/contests?${params.toString()}`;
}

export async function createDraftContestAction(formData: FormData) {
  const access = await requireContestOperator('/admin/contests');
  const parsed = createDraftContestSchema.safeParse({
    title: String(formData.get('title') || ''),
    description: String(formData.get('description') || ''),
    season: formData.get('season'),
    week: formData.get('week'),
    entryFeeDollars: formData.get('entryFeeDollars'),
    entryOpenTimeLocal: String(formData.get('entryOpenTimeLocal') || ''),
    lockTimeLocal: String(formData.get('lockTimeLocal') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Unable to create the draft contest.'));
  }

  const entryOpenTime = new Date(parsed.data.entryOpenTimeLocal);
  const lockTime = new Date(parsed.data.lockTimeLocal);

  if (Number.isNaN(entryOpenTime.getTime())) {
    redirect(buildAdminContestsRedirect('error', 'Add a valid entry open time.'));
  }

  if (Number.isNaN(lockTime.getTime())) {
    redirect(buildAdminContestsRedirect('error', 'Add a valid contest lock time.'));
  }

  if (entryOpenTime >= lockTime) {
    redirect(buildAdminContestsRedirect('error', 'Entry open time must be before contest lock time.'));
  }

  const contest = await createDraftContest({
    title: parsed.data.title,
    description: parsed.data.description,
    season: parsed.data.season,
    week: parsed.data.week,
    entryFeeCents: Math.round(parsed.data.entryFeeDollars * 100),
    entryOpenTimeIso: entryOpenTime.toISOString(),
    lockTimeIso: lockTime.toISOString(),
    createdByAdminId: access.user?.id ?? null,
  });

  revalidateAdminContestPaths(contest.id);

  redirect(buildAdminContestsRedirect('created', `Draft saved: ${contest.title}.`));
}

export async function saveContestSlateAction(formData: FormData) {
  await requireContestOperator('/admin/contests');
  const parsed = saveContestSlateSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
    slateRows: String(formData.get('slateRows') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Unable to save the draft slate.'));
  }

  try {
    const contest = await saveContestSlate(parsed.data.contestId, parseSlateRows(parsed.data.slateRows));

    revalidateAdminContestPaths(contest.id);

    redirect(
      buildAdminContestsRedirect(
        'saved',
        `Draft player pool saved for ${contest.title}. Validation still requires a full ${contestPlayerPoolSize}-QB pass.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to save the draft slate.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

export async function validateDraftContestAction(formData: FormData) {
  const access = await requireContestOperator('/admin/contests');
  const parsed = contestIdSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Contest not found.'));
  }

  const result = await validateDraftContest(parsed.data.contestId, access.user?.id ?? null);

  revalidateAdminContestPaths(result.contest.id);

  redirect(
    buildAdminContestsRedirect(
      result.validation.status === 'passed' ? 'validated' : 'error',
      result.validation.status === 'passed'
        ? `Validation passed for ${result.contest.title}.`
        : result.validation.errors[0] || `Validation failed for ${result.contest.title}.`,
    ),
  );
}

export async function publishContestAction(formData: FormData) {
  const access = await requireContestOperator('/admin/contests');
  const parsed = contestIdSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Contest not found.'));
  }

  try {
    const result = await publishContest(parsed.data.contestId, access.user?.id ?? null);

    revalidateAdminContestPaths(result.contest.id);

    redirect(buildAdminContestsRedirect('published', `${result.contest.title} is now ${result.contest.status.toLowerCase()}.`));
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to publish this contest right now.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

export async function lockFreeTestContestAction(formData: FormData) {
  const access = await requireContestOperator('/admin/contests');
  const parsed = lockFreeTestContestSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
    confirmationText: String(formData.get('confirmationText') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Unable to lock this proof contest.'));
  }

  if (parsed.data.confirmationText !== 'LOCK TEST') {
    redirect(buildAdminContestsRedirect('error', 'Type LOCK TEST to confirm this free/test proof lock.'));
  }

  try {
    const result = await lockFreeTestContestForProof(parsed.data.contestId, {
      lockedByAdminId: access.user?.id ?? null,
    });

    revalidateAdminContestPaths(result.contest.id);

    redirect(
      buildAdminContestsRedirect(
        'locked',
        `${result.contest.title} is locked for the no-money free/test proof. New entries and lineup edits are now blocked.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to lock this proof contest right now.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

export async function removePublicContestAction(formData: FormData) {
  const access = await requireContestOperator('/admin/contests');
  const parsed = removePublicContestSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
    confirmationIntent: String(formData.get('confirmationIntent') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', 'Confirm the contest removal before continuing.'));
  }

  try {
    const result = await removePublicContest(
      parsed.data.contestId,
      access.user?.id ?? null,
    );

    revalidateAdminContestPaths(result.contest.id);

    redirect(
      buildAdminContestsRedirect(
        'removed',
        `${result.contest.title} was removed from active contests. Its record and audit history are preserved.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to remove this public contest right now.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

export async function finalizeContestAction(formData: FormData) {
  await requireContestOperator('/admin/contests');
  const parsed = finalizeContestSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
    finalStatRows: String(formData.get('finalStatRows') || ''),
    confirmationText: String(formData.get('confirmationText') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Unable to run final scoring.'));
  }

  if (parsed.data.confirmationText !== 'FINAL') {
    redirect(buildAdminContestsRedirect('error', 'Type FINAL to confirm this results publish step.'));
  }

  try {
    const contest = await getContestById(parsed.data.contestId, {
      includeHidden: true,
    });

    if (!canFinalizeContestStatus(contest.contestStatus)) {
      redirect(
        buildAdminContestsRedirect(
          'error',
          `${contest.title} cannot be finalized from ${contest.contestStatus}.`,
        ),
      );
    }

    const finalStats = parseFinalStatRows({
      contest,
      rawRows: parsed.data.finalStatRows,
    });

    const result = await finalizeContestResults({
      contestId: contest.id,
      finalStats,
    });

    revalidateAdminContestPaths(result.contestId);

    redirect(
      buildAdminContestsRedirect(
        'finalized',
        `${result.contestTitle} final results are now published from the confirmed QB stats.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to run final scoring right now.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

export async function fetchContestStatSnapshotAction(formData: FormData) {
  await requireContestOperator('/admin/contests');
  const parsed = contestIdSchema.safeParse({
    contestId: String(formData.get('contestId') || ''),
  });

  if (!parsed.success) {
    redirect(buildAdminContestsRedirect('error', parsed.error.issues[0]?.message || 'Contest not found.'));
  }

  try {
    const contest = await getContestById(parsed.data.contestId, {
      includeHidden: true,
    });

    if (!canFinalizeContestStatus(contest.contestStatus)) {
      redirect(
        buildAdminContestsRedirect(
          'error',
          `${contest.title} cannot fetch final stats from ${contest.contestStatus}.`,
        ),
      );
    }

    const snapshot = await fetchAndPersistContestStatSnapshot({
      id: contest.id,
      title: contest.title,
      slatePlayers: contest.slatePlayers.map((player) => ({
        playerId: player.playerId,
        providerPlayerId: player.providerPlayerId,
        providerGameId: player.providerGameId,
        displayName: player.displayName,
      })),
    });

    revalidateAdminContestPaths(contest.id);

    redirect(
      buildAdminContestsRedirect(
        'fetched',
        `Stored ${snapshot.providerName} snapshot for ${contest.title}. Review the saved rows, then type FINAL to publish when ready.`,
      ),
    );
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to fetch the provider snapshot right now.';

    redirect(buildAdminContestsRedirect('error', message));
  }
}

function revalidateAdminContestPaths(contestId: string) {
  revalidatePath('/admin/contests');
  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
  revalidatePath(`/contests/${contestId}/results`);
  revalidatePath('/leaderboard');
}

function parseSlateRows(rawSlateRows: string) {
  const rows = rawSlateRows
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  const parsedPlayers = rows.map((row, index) => parseSlateRow(row, index));
  return parsedPlayers as ContestSlatePlayer[];
}

function parseSlateRow(row: string, index: number): ContestSlatePlayer {
  const columns = row.split('|').map((value) => value.trim());

  if (columns.length < 9 || columns.length > 10) {
    throw new Error(
      `Slate row ${index + 1} must include 9 required fields plus an optional active status: playerId|providerPlayerId|providerGameId|displayName|teamAbbreviation|opponentAbbreviation|homeAway|gameStartTime|position|activeStatus.`,
    );
  }

  const [
    playerId,
    providerPlayerId,
    providerGameId,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway,
    gameStartTime,
    position,
    activeStatus,
  ] = columns;

  const parsedGameStartTime = new Date(gameStartTime);

  if (Number.isNaN(parsedGameStartTime.getTime())) {
    throw new Error(`Slate row ${index + 1} must include a valid ISO game start time.`);
  }

  if (homeAway !== 'home' && homeAway !== 'away') {
    throw new Error(`Slate row ${index + 1} must mark homeAway as either "home" or "away".`);
  }

  if (position !== 'QB') {
    throw new Error(`Slate row ${index + 1} must use QB as the position for this MVP contest type.`);
  }

  return {
    playerId,
    providerPlayerId,
    providerGameId,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway,
    gameStartTime: parsedGameStartTime.toISOString(),
    position,
    activeStatus: activeStatus || null,
    sortOrderInternal: index + 1,
  };
}
