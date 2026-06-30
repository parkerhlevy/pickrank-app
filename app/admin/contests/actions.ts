'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { z } from 'zod';
import {
  createDraftContest,
  publishContest,
  saveContestSlate,
  validateDraftContest,
  type ContestSlatePlayer,
} from '@/lib/contest-data';
import { requireContestOperator } from '@/lib/contest-operator-access';

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
  slateRows: z.string().trim().min(1, 'Add 15 quarterback rows before saving the slate.'),
});

function buildAdminContestsRedirect(
  status: 'created' | 'saved' | 'validated' | 'published' | 'error',
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
        `Draft slate saved for ${contest.title}. Validation still requires a full 15-QB pass.`,
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

function revalidateAdminContestPaths(contestId: string) {
  revalidatePath('/admin/contests');
  revalidatePath('/contests');
  revalidatePath(`/contests/${contestId}`);
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
