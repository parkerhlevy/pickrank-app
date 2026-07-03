import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { formatCents, getContestById, updateContestStatus, type ContestSlatePlayer } from '@/lib/contest-data';
import {
  buildContestPlayerResults,
  buildPayoutSlots,
  scoreContestEntries,
  scoringVersion,
  type ContestPlayerFinalStat,
  type ContestPlayerStatInput,
  type EntryPlayerScore,
  type ScoredEntry,
} from '@/lib/contest-scoring';
import { listPersistedContestEntriesForContest } from '@/lib/persisted-contest-entry';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

const contestPlayerResultSchema = z.object({
  playerId: z.string().min(1),
  providerPlayerId: z.string().min(1),
  playerName: z.string().min(1),
  teamAbbreviation: z.string().min(1),
  finalStat: z.number().int(),
  passingTouchdowns: z.number().int().nonnegative(),
  actualRank: z.number().int().positive(),
  actualRankDisplay: z.string().min(1),
  actualRankMin: z.number().int().positive(),
  actualRankMax: z.number().int().positive(),
  gameId: z.string().min(1),
  gameStatus: z.literal('final'),
  statFinalizedAt: z.string().datetime(),
});

const finalizedEntryResultSchema = z.object({
  entryId: z.string().min(1),
  contestId: z.string().min(1),
  userId: z.string().min(1),
  displayName: z.string().min(1),
  totalScore: z.number().int().nonnegative(),
  exactPicks: z.number().int().nonnegative(),
  oneOffOrBetterPicks: z.number().int().nonnegative(),
  actualQb1Distance: z.number().int().nonnegative().nullable(),
  selectedQb1PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb2PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb3PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb4PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb5PassingTouchdowns: z.number().int().nonnegative().nullable(),
  finalRank: z.number().int().positive(),
  finalRankDisplay: z.string().min(1),
  isTied: z.boolean(),
  tieGroupId: z.string().min(1).nullable(),
  tieGroupSize: z.number().int().positive(),
  payoutAmountCents: z.number().int().nonnegative(),
  payoutStatus: z.enum(['pending', 'paid']),
  scoreFinalizedAt: z.string().datetime(),
  scoringVersion: z.literal(scoringVersion),
});

const entryPlayerScoreSchema = z.object({
  entryId: z.string().min(1),
  contestId: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  userRank: z.number().int().positive(),
  actualRankMin: z.number().int().positive(),
  actualRankMax: z.number().int().positive(),
  actualRankDisplay: z.string().min(1),
  distance: z.number().int().nonnegative(),
  pointsAwarded: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

const finalizedContestResultSchema = z.object({
  contestId: z.string().min(1),
  contestTitle: z.string().min(1),
  finalizedAt: z.string().datetime(),
  scoringVersion: z.literal(scoringVersion),
  prizePoolCents: z.number().int().nonnegative(),
  payoutSlots: z.array(
    z.object({
      place: z.number().int().positive(),
      amountCents: z.number().int().nonnegative(),
    }),
  ),
  playerResults: z.array(contestPlayerResultSchema).length(15),
  entryResults: z.array(finalizedEntryResultSchema),
  entryPlayerScores: z.array(entryPlayerScoreSchema),
});

const contestResultsStoreSchema = z.object({
  version: z.literal(1),
  contests: z.array(finalizedContestResultSchema),
});

const defaultContestResultsDataPath = path.join(process.cwd(), 'data', 'contest-results.json');

type ContestResultsStore = z.infer<typeof contestResultsStoreSchema>;
export type FinalizedContestResult = z.infer<typeof finalizedContestResultSchema>;
export type FinalizedEntryResult = z.infer<typeof finalizedEntryResultSchema>;
export type ContestLeaderboardRow = FinalizedEntryResult & {
  payoutAmount: string;
};
export type ContestPlayerBreakdownRow = EntryPlayerScore & {
  teamAbbreviation: string;
  finalStat: number;
  fieldAverageRank: number;
  passingTouchdowns: number;
};
export type ContestUserResult = {
  contestId: string;
  contestTitle: string;
  finalizedAt: string;
  entry: ContestLeaderboardRow;
  bestUniquePick: ContestPlayerBreakdownRow | null;
  averageMissDistance: number | null;
  playerBreakdown: ContestPlayerBreakdownRow[];
};

type ContestResultsOptions = {
  resultsDataFilePath?: string;
  contestDataFilePath?: string;
  contestEntryDataFilePath?: string;
};

type ContestPlayerResultDbInsert = Database['public']['Tables']['contest_player_results']['Insert'];
type ContestPlayerResultDbRow = Database['public']['Tables']['contest_player_results']['Row'];
type EntryScoringResultDbInsert = Database['public']['Tables']['entry_scoring_results']['Insert'];
type EntryScoringResultDbRow = Database['public']['Tables']['entry_scoring_results']['Row'];
type EntryPlayerScoreDbInsert = Database['public']['Tables']['entry_player_scores']['Insert'];
type EntryPlayerScoreDbRow = Database['public']['Tables']['entry_player_scores']['Row'];
type ProfileDbRow = Database['public']['Tables']['profiles']['Row'];

export async function finalizeContestResults({
  contestId,
  finalStats,
  finalizedAt = new Date().toISOString(),
  options,
}: {
  contestId: string;
  finalStats: ContestPlayerStatInput[];
  finalizedAt?: string;
  options?: ContestResultsOptions;
}) {
  const contest = await getContestById(contestId, {
    includeHidden: true,
    dataFilePath: options?.contestDataFilePath,
  });
  const entries = await listPersistedContestEntriesForContest({
    contestId,
    players: contest.slatePlayers.map((player) => player.displayName),
    defaultSelectedOrder: contest.lineupPlayers,
    options: {
      dataFilePath: options?.contestEntryDataFilePath,
      contestDataFilePath: options?.contestDataFilePath,
    },
  });

  const playerResults = buildContestPlayerResults({
    slatePlayers: contest.slatePlayers,
    finalStats,
    finalizedAt,
  });
  const scoredEntries = scoreContestEntries({
    contestId,
    entries,
    playerResults,
    finalizedAt,
    prizePoolCents: contest.prizePoolCents,
  });

  const displayNameByUserId = await loadDisplayNamesByUserId(
    scoredEntries.map((entry) => entry.userId),
    options,
  );

  const entryResults = scoredEntries.map((entry) =>
    finalizedEntryResultSchema.parse({
      entryId: entry.entryId,
      contestId: entry.contestId,
      userId: entry.userId,
      displayName: displayNameByUserId.get(entry.userId) ?? formatFallbackDisplayName(entry.userId),
      totalScore: entry.totalScore,
      exactPicks: entry.exactPicks,
      oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
      actualQb1Distance: entry.actualQb1Distance,
      selectedQb1PassingTouchdowns: entry.selectedQb1PassingTouchdowns,
      selectedQb2PassingTouchdowns: entry.selectedQb2PassingTouchdowns,
      selectedQb3PassingTouchdowns: entry.selectedQb3PassingTouchdowns,
      selectedQb4PassingTouchdowns: entry.selectedQb4PassingTouchdowns,
      selectedQb5PassingTouchdowns: entry.selectedQb5PassingTouchdowns,
      finalRank: entry.finalRank,
      finalRankDisplay: entry.finalRankDisplay,
      isTied: entry.isTied,
      tieGroupId: entry.tieGroupId,
      tieGroupSize: entry.tieGroupSize,
      payoutAmountCents: entry.payoutAmountCents,
      payoutStatus: entry.payoutStatus,
      scoreFinalizedAt: entry.scoreFinalizedAt,
      scoringVersion: entry.scoringVersion,
    }),
  );

  const entryPlayerScores = scoredEntries.flatMap((entry) => entry.playerScores.map((score) => entryPlayerScoreSchema.parse(score)));
  const finalizedResult = finalizedContestResultSchema.parse({
    contestId,
    contestTitle: contest.title,
    finalizedAt,
    scoringVersion,
    prizePoolCents: contest.prizePoolCents,
    payoutSlots: buildPayoutSlots(contest.prizePoolCents),
    playerResults,
    entryResults,
    entryPlayerScores,
  });

  if (shouldUseFileStore(options)) {
    const store = await readContestResultsStoreFromFile(options?.resultsDataFilePath);
    const nextContests = upsertFinalizedContestResult(store.contests, finalizedResult);

    await writeContestResultsStoreToFile(
      {
        version: 1,
        contests: nextContests,
      },
      options?.resultsDataFilePath,
    );
  } else {
    await writeContestResultsToDatabase(finalizedResult);
  }

  await updateContestStatus(contestId, 'final', {
    dataFilePath: options?.contestDataFilePath,
    now: finalizedAt,
  });

  return finalizedResult;
}

export async function getContestLeaderboard(
  contestId: string,
  options?: ContestResultsOptions,
): Promise<{
  contestId: string;
  contestTitle: string;
  finalizedAt: string;
  rows: ContestLeaderboardRow[];
} | null> {
  const finalizedResult = shouldUseFileStore(options)
    ? await readFinalizedContestResultFromFile(contestId, options?.resultsDataFilePath)
    : await readFinalizedContestResultFromDatabase(contestId);

  if (!finalizedResult) {
    return null;
  }

  return {
    contestId: finalizedResult.contestId,
    contestTitle: finalizedResult.contestTitle,
    finalizedAt: finalizedResult.finalizedAt,
    rows: finalizedResult.entryResults.map((entryResult) => ({
      ...entryResult,
      payoutAmount: formatCents(entryResult.payoutAmountCents),
    })),
  };
}

export async function getContestResultForUser(
  contestId: string,
  userId: string,
  options?: ContestResultsOptions,
): Promise<ContestUserResult | null> {
  const finalizedResult = await getFinalizedContestResult(contestId, options);

  if (!finalizedResult) {
    return null;
  }

  const entry = finalizedResult.entryResults.find((entryResult) => entryResult.userId === userId);

  if (!entry) {
    return null;
  }

  const playerResultsByPlayerId = new Map(
    finalizedResult.playerResults.map((playerResult) => [playerResult.playerId, playerResult]),
  );
  const playerScores = finalizedResult.entryPlayerScores
    .filter((playerScore) => playerScore.entryId === entry.entryId)
    .sort((left, right) => left.userRank - right.userRank);

  const fieldAverageRankByPlayerId = new Map<string, number>();

  for (const playerResult of finalizedResult.playerResults) {
    const playerScoresForContestPlayer = finalizedResult.entryPlayerScores.filter(
      (playerScore) => playerScore.playerId === playerResult.playerId,
    );

    if (playerScoresForContestPlayer.length === 0) {
      fieldAverageRankByPlayerId.set(playerResult.playerId, playerResult.actualRankMin);
      continue;
    }

    const averageRank =
      playerScoresForContestPlayer.reduce((sum, playerScore) => sum + playerScore.userRank, 0) /
      playerScoresForContestPlayer.length;

    fieldAverageRankByPlayerId.set(playerResult.playerId, averageRank);
  }

  const playerBreakdown = playerScores.map((playerScore) => {
    const playerResult = playerResultsByPlayerId.get(playerScore.playerId);

    if (!playerResult) {
      throw new Error(`Missing finalized player result for ${playerScore.playerId}.`);
    }

    return {
      ...playerScore,
      teamAbbreviation: playerResult.teamAbbreviation,
      finalStat: playerResult.finalStat,
      passingTouchdowns: playerResult.passingTouchdowns,
      fieldAverageRank: fieldAverageRankByPlayerId.get(playerScore.playerId) ?? playerScore.userRank,
    } satisfies ContestPlayerBreakdownRow;
  });

  const misses = playerBreakdown.filter((playerScore) => playerScore.distance >= 2);
  const averageMissDistance =
    misses.length > 0 ? Math.round(misses.reduce((sum, playerScore) => sum + playerScore.distance, 0) / misses.length) : null;

  const bestUniquePick =
    [...playerBreakdown].sort((left, right) => {
      const byDistance = left.pointsAwarded - right.pointsAwarded;

      if (byDistance !== 0) {
        return byDistance;
      }

      const leftFieldGap = Math.abs(left.userRank - left.fieldAverageRank);
      const rightFieldGap = Math.abs(right.userRank - right.fieldAverageRank);
      const byFieldGap = rightFieldGap - leftFieldGap;

      if (byFieldGap !== 0) {
        return byFieldGap;
      }

      return left.userRank - right.userRank;
    })[0] ?? null;

  return {
    contestId: finalizedResult.contestId,
    contestTitle: finalizedResult.contestTitle,
    finalizedAt: finalizedResult.finalizedAt,
    entry: {
      ...entry,
      payoutAmount: formatCents(entry.payoutAmountCents),
    },
    bestUniquePick,
    averageMissDistance,
    playerBreakdown,
  };
}

export async function getFinalizedContestResult(contestId: string, options?: ContestResultsOptions) {
  return shouldUseFileStore(options)
    ? await readFinalizedContestResultFromFile(contestId, options?.resultsDataFilePath)
    : await readFinalizedContestResultFromDatabase(contestId);
}

function upsertFinalizedContestResult(contests: FinalizedContestResult[], nextResult: FinalizedContestResult) {
  const existingIndex = contests.findIndex((contest) => contest.contestId === nextResult.contestId);

  if (existingIndex === -1) {
    return [...contests, nextResult];
  }

  return contests.map((contest, index) => (index === existingIndex ? nextResult : contest));
}

async function loadDisplayNamesByUserId(userIds: string[], options?: ContestResultsOptions) {
  const uniqueUserIds = [...new Set(userIds)];

  if (shouldUseFileStore(options)) {
    return new Map(uniqueUserIds.map((userId) => [userId, formatFallbackDisplayName(userId)]));
  }

  if (!hasBrowserSupabaseConfig() || uniqueUserIds.length === 0) {
    return new Map<string, string>();
  }

  const supabase: any = await createSupabaseClient();
  const { data, error } = await supabase.from('profiles').select('*').in('id', uniqueUserIds);

  if (error) {
    throw new Error(`Unable to read profiles for finalized results: ${error.message}`);
  }

  return new Map(
    ((data || []) as ProfileDbRow[]).map((profile) => [
      profile.id,
      profile.display_name || profile.username || formatFallbackDisplayName(profile.id),
    ]),
  );
}

function formatFallbackDisplayName(userId: string) {
  return `Entry ${userId.slice(0, 8)}`;
}

async function readContestResultsStoreFromFile(dataFilePath = defaultContestResultsDataPath) {
  try {
    const fileContents = await readFile(dataFilePath, 'utf8');
    return contestResultsStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (!notFound) {
      throw error;
    }

    return contestResultsStoreSchema.parse({
      version: 1,
      contests: [],
    });
  }
}

async function writeContestResultsStoreToFile(store: ContestResultsStore, dataFilePath = defaultContestResultsDataPath) {
  const nextStore = contestResultsStoreSchema.parse(store);
  const directory = path.dirname(dataFilePath);
  const tempFilePath = path.join(directory, `${path.basename(dataFilePath)}.${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(tempFilePath, `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8');
  await rename(tempFilePath, dataFilePath);
}

async function readFinalizedContestResultFromFile(contestId: string, dataFilePath = defaultContestResultsDataPath) {
  const store = await readContestResultsStoreFromFile(dataFilePath);
  return store.contests.find((contest) => contest.contestId === contestId) ?? null;
}

async function writeContestResultsToDatabase(finalizedResult: FinalizedContestResult) {
  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase.from('contests').select('*').eq('slug', finalizedResult.contestId).maybeSingle();

  if (contestError) {
    throw new Error(`Unable to load contest for final scoring: ${contestError.message}`);
  }

  if (!contestRow) {
    throw new Error('Contest not found.');
  }

  const contestId = contestRow.id as string;
  const playerResultRows = finalizedResult.playerResults.map((playerResult) =>
    toContestPlayerResultDbInsert(contestId, playerResult),
  );
  const entryResultRows = finalizedResult.entryResults.map((entryResult) => toEntryScoringResultDbInsert(contestId, entryResult));
  const entryPlayerScoreRows = finalizedResult.entryPlayerScores.map((entryPlayerScore) =>
    toEntryPlayerScoreDbInsert(contestId, entryPlayerScore),
  );

  const deleteEntryIds = finalizedResult.entryResults.map((entryResult) => entryResult.entryId);
  const { error: deletePlayerScoresError } = await supabase.from('entry_player_scores').delete().eq('contest_id', contestId);

  if (deletePlayerScoresError) {
    throw new Error(`Unable to clear prior entry player scores: ${deletePlayerScoresError.message}`);
  }

  if (deleteEntryIds.length > 0) {
    const { error: deleteEntryScoresError } = await supabase.from('entry_scoring_results').delete().in('entry_id', deleteEntryIds);

    if (deleteEntryScoresError) {
      throw new Error(`Unable to clear prior entry scoring results: ${deleteEntryScoresError.message}`);
    }
  }

  const { error: deletePlayerResultsError } = await supabase.from('contest_player_results').delete().eq('contest_id', contestId);

  if (deletePlayerResultsError) {
    throw new Error(`Unable to clear prior contest player results: ${deletePlayerResultsError.message}`);
  }

  const { error: playerResultsError } = await supabase.from('contest_player_results').insert(playerResultRows);

  if (playerResultsError) {
    throw new Error(`Unable to save contest player results: ${playerResultsError.message}`);
  }

  if (entryResultRows.length > 0) {
    const { error: entryResultsError } = await supabase.from('entry_scoring_results').insert(entryResultRows);

    if (entryResultsError) {
      throw new Error(`Unable to save entry scoring results: ${entryResultsError.message}`);
    }
  }

  if (entryPlayerScoreRows.length > 0) {
    const { error: entryPlayerScoresError } = await supabase.from('entry_player_scores').insert(entryPlayerScoreRows);

    if (entryPlayerScoresError) {
      throw new Error(`Unable to save entry player scores: ${entryPlayerScoresError.message}`);
    }
  }
}

async function readFinalizedContestResultFromDatabase(contestSlug: string) {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error('Finalized contest results require Supabase configuration.');
  }

  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase.from('contests').select('*').eq('slug', contestSlug).maybeSingle();

  if (contestError) {
    throw new Error(`Unable to read contest leaderboard: ${contestError.message}`);
  }

  if (!contestRow) {
    return null;
  }

  const contestId = contestRow.id as string;
  const [
    { data: playerResultRows, error: playerResultsError },
    { data: entryResultRows, error: entryResultsError },
    { data: entryPlayerScoreRows, error: entryPlayerScoresError },
    { data: profileRows, error: profilesError },
  ] = await Promise.all([
    supabase.from('contest_player_results').select('*').eq('contest_id', contestId),
    supabase.from('entry_scoring_results').select('*').eq('contest_id', contestId).order('final_rank', { ascending: true }),
    supabase.from('entry_player_scores').select('*').eq('contest_id', contestId).order('user_rank', { ascending: true }),
    supabase.from('profiles').select('*'),
  ]);

  if (playerResultsError) {
    throw new Error(`Unable to read contest player results: ${playerResultsError.message}`);
  }

  if (entryResultsError) {
    throw new Error(`Unable to read entry scoring results: ${entryResultsError.message}`);
  }

  if (entryPlayerScoresError) {
    throw new Error(`Unable to read entry player scores: ${entryPlayerScoresError.message}`);
  }

  if (profilesError) {
    throw new Error(`Unable to read leaderboard display names: ${profilesError.message}`);
  }

  if (!entryResultRows || entryResultRows.length === 0) {
    return null;
  }

  const displayNameByUserId = new Map(
    ((profileRows || []) as ProfileDbRow[]).map((profile) => [
      profile.id,
      profile.display_name || profile.username || formatFallbackDisplayName(profile.id),
    ]),
  );
  const entryResults = ((entryResultRows || []) as EntryScoringResultDbRow[]).map((entryResultRow) =>
    finalizedEntryResultSchema.parse({
      entryId: entryResultRow.entry_id,
      contestId: contestSlug,
      userId: entryResultRow.user_id,
      displayName: displayNameByUserId.get(entryResultRow.user_id) ?? formatFallbackDisplayName(entryResultRow.user_id),
      totalScore: entryResultRow.total_score,
      exactPicks: entryResultRow.exact_picks,
      oneOffOrBetterPicks: entryResultRow.one_off_or_better_picks,
      actualQb1Distance: entryResultRow.actual_qb1_distance,
      selectedQb1PassingTouchdowns: entryResultRow.selected_qb1_passing_touchdowns,
      selectedQb2PassingTouchdowns: entryResultRow.selected_qb2_passing_touchdowns,
      selectedQb3PassingTouchdowns: entryResultRow.selected_qb3_passing_touchdowns,
      selectedQb4PassingTouchdowns: entryResultRow.selected_qb4_passing_touchdowns,
      selectedQb5PassingTouchdowns: entryResultRow.selected_qb5_passing_touchdowns,
      finalRank: entryResultRow.final_rank,
      finalRankDisplay: entryResultRow.final_rank_display,
      isTied: entryResultRow.is_tied,
      tieGroupId: entryResultRow.tie_group_id,
      tieGroupSize: entryResultRow.tie_group_size,
      payoutAmountCents: entryResultRow.payout_amount,
      payoutStatus: entryResultRow.payout_status === 'paid' ? 'paid' : 'pending',
      scoreFinalizedAt: entryResultRow.score_finalized_at,
      scoringVersion,
    }),
  );

  const finalizedAt = entryResults[0]?.scoreFinalizedAt ?? new Date().toISOString();

  return finalizedContestResultSchema.parse({
    contestId: contestSlug,
    contestTitle: contestRow.title as string,
    finalizedAt,
    scoringVersion,
    prizePoolCents: Math.round(((contestRow.entry_fee_cents as number) * (contestRow.paid_entries_count as number)) * 0.7),
    payoutSlots: buildPayoutSlots(
      Math.round(((contestRow.entry_fee_cents as number) * (contestRow.paid_entries_count as number)) * 0.7),
    ),
    playerResults: ((playerResultRows || []) as ContestPlayerResultDbRow[]).map((playerResultRow) =>
      contestPlayerResultSchema.parse({
        playerId: playerResultRow.player_id,
        providerPlayerId: playerResultRow.provider_player_id,
        playerName: playerResultRow.player_name,
        teamAbbreviation: playerResultRow.team_abbreviation,
        finalStat: playerResultRow.final_stat,
        passingTouchdowns: playerResultRow.passing_touchdowns,
        actualRank: playerResultRow.actual_rank,
        actualRankDisplay: playerResultRow.actual_rank_display,
        actualRankMin: playerResultRow.actual_rank_min,
        actualRankMax: playerResultRow.actual_rank_max,
        gameId: playerResultRow.game_id,
        gameStatus: playerResultRow.game_status === 'final' ? 'final' : 'final',
        statFinalizedAt: playerResultRow.stat_finalized_at,
      }),
    ),
    entryResults,
    entryPlayerScores: ((entryPlayerScoreRows || []) as EntryPlayerScoreDbRow[]).map((entryPlayerScoreRow) =>
      entryPlayerScoreSchema.parse({
        entryId: entryPlayerScoreRow.entry_id,
        contestId: contestSlug,
        playerId: entryPlayerScoreRow.player_id,
        playerName: entryPlayerScoreRow.player_name,
        userRank: entryPlayerScoreRow.user_rank,
        actualRankMin: entryPlayerScoreRow.actual_rank_min,
        actualRankMax: entryPlayerScoreRow.actual_rank_max,
        actualRankDisplay: entryPlayerScoreRow.actual_rank_display,
        distance: entryPlayerScoreRow.distance,
        pointsAwarded: entryPlayerScoreRow.points_awarded,
        createdAt: entryPlayerScoreRow.created_at,
      }),
    ),
  });
}

function shouldUseFileStore(options?: ContestResultsOptions) {
  return (
    Boolean(options?.resultsDataFilePath) ||
    Boolean(options?.contestDataFilePath) ||
    Boolean(options?.contestEntryDataFilePath) ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

function toContestPlayerResultDbInsert(contestId: string, playerResult: ContestPlayerFinalStat): ContestPlayerResultDbInsert {
  return {
    contest_id: contestId,
    player_id: playerResult.playerId,
    provider_player_id: playerResult.providerPlayerId,
    player_name: playerResult.playerName,
    team_abbreviation: playerResult.teamAbbreviation,
    final_stat: playerResult.finalStat,
    passing_touchdowns: playerResult.passingTouchdowns,
    actual_rank: playerResult.actualRank,
    actual_rank_display: playerResult.actualRankDisplay,
    actual_rank_min: playerResult.actualRankMin,
    actual_rank_max: playerResult.actualRankMax,
    game_id: playerResult.gameId,
    game_status: playerResult.gameStatus,
    stat_finalized_at: playerResult.statFinalizedAt,
  };
}

function toEntryScoringResultDbInsert(contestId: string, entryResult: FinalizedEntryResult): EntryScoringResultDbInsert {
  return {
    entry_id: entryResult.entryId,
    contest_id: contestId,
    user_id: entryResult.userId,
    total_score: entryResult.totalScore,
    exact_picks: entryResult.exactPicks,
    one_off_or_better_picks: entryResult.oneOffOrBetterPicks,
    actual_qb1_distance: entryResult.actualQb1Distance,
    selected_qb1_passing_touchdowns: entryResult.selectedQb1PassingTouchdowns,
    selected_qb2_passing_touchdowns: entryResult.selectedQb2PassingTouchdowns,
    selected_qb3_passing_touchdowns: entryResult.selectedQb3PassingTouchdowns,
    selected_qb4_passing_touchdowns: entryResult.selectedQb4PassingTouchdowns,
    selected_qb5_passing_touchdowns: entryResult.selectedQb5PassingTouchdowns,
    final_rank: entryResult.finalRank,
    final_rank_display: entryResult.finalRankDisplay,
    is_tied: entryResult.isTied,
    tie_group_id: entryResult.tieGroupId,
    tie_group_size: entryResult.tieGroupSize,
    payout_amount: entryResult.payoutAmountCents,
    payout_status: entryResult.payoutStatus,
    scoring_version: entryResult.scoringVersion,
    created_at: entryResult.scoreFinalizedAt,
    score_finalized_at: entryResult.scoreFinalizedAt,
  };
}

function toEntryPlayerScoreDbInsert(contestId: string, entryPlayerScore: EntryPlayerScore): EntryPlayerScoreDbInsert {
  return {
    entry_player_score_id: randomUUID(),
    entry_id: entryPlayerScore.entryId,
    contest_id: contestId,
    player_id: entryPlayerScore.playerId,
    player_name: entryPlayerScore.playerName,
    user_rank: entryPlayerScore.userRank,
    actual_rank_min: entryPlayerScore.actualRankMin,
    actual_rank_max: entryPlayerScore.actualRankMax,
    actual_rank_display: entryPlayerScore.actualRankDisplay,
    distance: entryPlayerScore.distance,
    points_awarded: entryPlayerScore.pointsAwarded,
    created_at: entryPlayerScore.createdAt,
  };
}

async function createSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}
