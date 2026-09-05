import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import type { Database } from '@/lib/supabase/types';

const finalContestStatuses = new Set(['final', 'paid_out']);
const defaultContestDataPath = path.join(process.cwd(), 'data', 'contests.json');
const defaultContestResultsDataPath = path.join(process.cwd(), 'data', 'contest-results.json');

const profileContestStoreSchema = z.object({
  version: z.literal(1),
  contests: z.array(
    z.object({
      id: z.string().min(1),
      title: z.string().min(1),
      status: z.string().min(1),
      visibilityStatus: z.string().min(1),
    }),
  ),
});

const profileContestResultsStoreSchema = z.object({
  version: z.literal(1),
  contests: z.array(
    z.object({
      contestId: z.string().min(1),
      entryResults: z.array(
        z.object({
          entryId: z.string().min(1),
          userId: z.string().min(1),
          totalScore: z.number().int().nonnegative(),
          exactPicks: z.number().int().nonnegative(),
          oneOffOrBetterPicks: z.number().int().nonnegative(),
          finalRank: z.number().int().positive(),
          finalRankDisplay: z.string().min(1),
          scoreFinalizedAt: z.string().datetime(),
        }),
      ),
      entryPlayerScores: z.array(
        z.object({
          entryId: z.string().min(1),
        }),
      ),
    }),
  ),
});

export type ProfilePerformanceRecord = {
  contestId: string;
  contestSlug: string;
  contestTitle: string;
  contestStatus: string;
  visibilityStatus: string;
  entryId: string;
  totalScore: number;
  exactPicks: number;
  oneOffOrBetterPicks: number;
  finalRank: number;
  finalRankDisplay: string;
  scoreFinalizedAt: string;
  fieldSize: number;
  scoredPickCount: number;
};

export type ProfileRecentResult = {
  contestSlug: string;
  contestTitle: string;
  entryId: string;
  exactPicks: number;
  scoredPicks: number;
  fieldSize: number;
  finalRank: number;
  finalRankDisplay: string;
  scoreFinalizedAt: string;
  totalScore: number;
};

export type ProfilePerformanceStats =
  | { status: 'empty' }
  | { status: 'unavailable' }
  | {
      status: 'ready';
      contestsCompleted: number;
      topThreeFinishes: number;
      bestFinish: ProfileRecentResult;
      accuracy: {
        exactPicks: number;
        exactPickRate: number;
        withinOneSpotPicks: number;
        withinOneSpotRate: number;
        scoredPicks: number;
      };
      recentResults: ProfileRecentResult[];
    };

type ProfilePerformanceStatsOptions = {
  contestDataFilePath?: string;
  resultsDataFilePath?: string;
};

type EntryScoringResultRow = Pick<
  Database['public']['Tables']['entry_scoring_results']['Row'],
  | 'contest_id'
  | 'entry_id'
  | 'exact_picks'
  | 'final_rank'
  | 'final_rank_display'
  | 'one_off_or_better_picks'
  | 'score_finalized_at'
  | 'total_score'
>;

type ContestRow = Pick<
  Database['public']['Tables']['contests']['Row'],
  'id' | 'slug' | 'status' | 'title' | 'visibility_status'
>;

type FieldResultRow = Pick<
  Database['public']['Tables']['entry_scoring_results']['Row'],
  'contest_id'
>;

type PlayerScoreRow = Pick<
  Database['public']['Tables']['entry_player_scores']['Row'],
  'entry_id'
>;

type OptionalProfileStatsTable = 'entry_player_scores' | 'entry_scoring_results';

type SupabaseQueryError = {
  code?: string;
  message: string;
};

export async function getProfilePerformanceStats(
  viewerUserId: string,
  options?: ProfilePerformanceStatsOptions,
): Promise<ProfilePerformanceStats> {
  try {
    const records = shouldUseFileStore(options)
      ? await readProfilePerformanceRecordsFromFile(viewerUserId, options)
      : await readProfilePerformanceRecordsFromDatabase(viewerUserId);

    return buildProfilePerformanceStats(records);
  } catch (error) {
    console.error('Unable to load Profile performance stats.', error);
    return { status: 'unavailable' };
  }
}

export function buildProfilePerformanceStats(records: ProfilePerformanceRecord[]): ProfilePerformanceStats {
  const finalizedRecords = records.filter(
    (record) =>
      record.visibilityStatus === 'visible' &&
      finalContestStatuses.has(record.contestStatus) &&
      record.scoredPickCount > 0,
  );

  if (finalizedRecords.length === 0) {
    return { status: 'empty' };
  }

  const scoredPicks = finalizedRecords.reduce((sum, record) => sum + record.scoredPickCount, 0);
  const exactPicks = finalizedRecords.reduce((sum, record) => sum + record.exactPicks, 0);
  const withinOneSpotPicks = finalizedRecords.reduce((sum, record) => sum + record.oneOffOrBetterPicks, 0);
  const sortedByFinish = [...finalizedRecords].sort(compareBestFinish);
  const recentResults = [...finalizedRecords]
    .sort(compareMostRecent)
    .slice(0, 5)
    .map(toRecentResult);

  return {
    status: 'ready',
    contestsCompleted: finalizedRecords.length,
    topThreeFinishes: finalizedRecords.filter((record) => record.finalRank <= 3).length,
    bestFinish: toRecentResult(sortedByFinish[0]),
    accuracy: {
      exactPicks,
      exactPickRate: toPercentage(exactPicks, scoredPicks),
      withinOneSpotPicks,
      withinOneSpotRate: toPercentage(withinOneSpotPicks, scoredPicks),
      scoredPicks,
    },
    recentResults,
  };
}

function compareBestFinish(left: ProfilePerformanceRecord, right: ProfilePerformanceRecord) {
  return (
    left.finalRank - right.finalRank ||
    right.fieldSize - left.fieldSize ||
    new Date(right.scoreFinalizedAt).getTime() - new Date(left.scoreFinalizedAt).getTime() ||
    left.contestId.localeCompare(right.contestId)
  );
}

function compareMostRecent(left: ProfilePerformanceRecord, right: ProfilePerformanceRecord) {
  return (
    new Date(right.scoreFinalizedAt).getTime() - new Date(left.scoreFinalizedAt).getTime() ||
    left.contestId.localeCompare(right.contestId)
  );
}

function toRecentResult(record: ProfilePerformanceRecord): ProfileRecentResult {
  return {
    contestSlug: record.contestSlug,
    contestTitle: record.contestTitle,
    entryId: record.entryId,
    exactPicks: record.exactPicks,
    scoredPicks: record.scoredPickCount,
    fieldSize: record.fieldSize,
    finalRank: record.finalRank,
    finalRankDisplay: record.finalRankDisplay,
    scoreFinalizedAt: record.scoreFinalizedAt,
    totalScore: record.totalScore,
  };
}

function toPercentage(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 100) : 0;
}

async function readProfilePerformanceRecordsFromFile(
  viewerUserId: string,
  options?: ProfilePerformanceStatsOptions,
) {
  const resultsStore = await readResultsStore(options?.resultsDataFilePath);

  if (resultsStore.contests.length === 0) {
    return [];
  }

  const contestStore = profileContestStoreSchema.parse(
    JSON.parse(await readFile(options?.contestDataFilePath || defaultContestDataPath, 'utf8')),
  );
  const contestById = new Map(contestStore.contests.map((contest) => [contest.id, contest]));
  const records: ProfilePerformanceRecord[] = [];

  for (const result of resultsStore.contests) {
    const contest = contestById.get(result.contestId);

    if (!contest) {
      continue;
    }

    const fieldSize = result.entryResults.length;
    const scoredPickCountByEntryId = countBy(
      result.entryPlayerScores.map((score) => score.entryId),
    );

    for (const entry of result.entryResults) {
      if (entry.userId !== viewerUserId) {
        continue;
      }

      records.push({
        contestId: result.contestId,
        contestSlug: contest.id,
        contestTitle: contest.title,
        contestStatus: contest.status,
        visibilityStatus: contest.visibilityStatus,
        entryId: entry.entryId,
        totalScore: entry.totalScore,
        exactPicks: entry.exactPicks,
        oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
        finalRank: entry.finalRank,
        finalRankDisplay: entry.finalRankDisplay,
        scoreFinalizedAt: entry.scoreFinalizedAt,
        fieldSize,
        scoredPickCount: scoredPickCountByEntryId.get(entry.entryId) || 0,
      });
    }
  }

  return records;
}

async function readResultsStore(resultsDataFilePath = defaultContestResultsDataPath) {
  try {
    return profileContestResultsStoreSchema.parse(JSON.parse(await readFile(resultsDataFilePath, 'utf8')));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return profileContestResultsStoreSchema.parse({ version: 1, contests: [] });
    }

    throw error;
  }
}

async function readProfilePerformanceRecordsFromDatabase(viewerUserId: string) {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error('Profile performance stats require Supabase configuration.');
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data: userResultData, error: userResultsError } = await supabase
    .from('entry_scoring_results')
    .select(
      'contest_id, entry_id, exact_picks, final_rank, final_rank_display, one_off_or_better_picks, score_finalized_at, total_score',
    )
    .eq('user_id', viewerUserId);

  if (userResultsError) {
    if (isMissingOptionalProfileStatsTable(userResultsError, 'entry_scoring_results')) {
      return [];
    }

    throw new Error(`Unable to read Profile scoring results: ${userResultsError.message}`);
  }

  const userResults = (userResultData || []) as EntryScoringResultRow[];

  if (userResults.length === 0) {
    return [];
  }

  const contestIds = [...new Set(userResults.map((result) => result.contest_id))];
  const entryIds = userResults.map((result) => result.entry_id);
  const [contestResponse, fieldResponse, playerScoreResponse] = await Promise.all([
    supabase
      .from('contests')
      .select('id, slug, status, title, visibility_status')
      .in('id', contestIds)
      .eq('visibility_status', 'visible')
      .in('status', ['final', 'paid_out']),
    supabase.from('entry_scoring_results').select('contest_id').in('contest_id', contestIds),
    supabase.from('entry_player_scores').select('entry_id').in('entry_id', entryIds),
  ]);

  if (contestResponse.error) {
    throw new Error(`Unable to read Profile contest details: ${contestResponse.error.message}`);
  }

  if (fieldResponse.error) {
    if (isMissingOptionalProfileStatsTable(fieldResponse.error, 'entry_scoring_results')) {
      return [];
    }

    throw new Error(`Unable to read Profile field sizes: ${fieldResponse.error.message}`);
  }

  if (playerScoreResponse.error) {
    if (isMissingOptionalProfileStatsTable(playerScoreResponse.error, 'entry_player_scores')) {
      return [];
    }

    throw new Error(`Unable to read Profile pick totals: ${playerScoreResponse.error.message}`);
  }

  const contestById = new Map(
    ((contestResponse.data || []) as ContestRow[]).map((contest) => [contest.id, contest]),
  );
  const fieldSizeByContestId = countBy(
    ((fieldResponse.data || []) as FieldResultRow[]).map((result) => result.contest_id),
  );
  const scoredPickCountByEntryId = countBy(
    ((playerScoreResponse.data || []) as PlayerScoreRow[]).map((score) => score.entry_id),
  );

  return userResults.flatMap((result) => {
    const contest = contestById.get(result.contest_id);

    if (!contest) {
      return [];
    }

    return [
      {
        contestId: contest.id,
        contestSlug: contest.slug,
        contestTitle: contest.title,
        contestStatus: contest.status,
        visibilityStatus: contest.visibility_status,
        entryId: result.entry_id,
        totalScore: result.total_score,
        exactPicks: result.exact_picks,
        oneOffOrBetterPicks: result.one_off_or_better_picks,
        finalRank: result.final_rank,
        finalRankDisplay: result.final_rank_display,
        scoreFinalizedAt: result.score_finalized_at,
        fieldSize: fieldSizeByContestId.get(result.contest_id) || 0,
        scoredPickCount: scoredPickCountByEntryId.get(result.entry_id) || 0,
      } satisfies ProfilePerformanceRecord,
    ];
  });
}

function isMissingOptionalProfileStatsTable(
  error: SupabaseQueryError,
  table: OptionalProfileStatsTable,
) {
  return (
    error.code === 'PGRST205'
    || error.code === '42P01'
    || (
      error.message.includes('Could not find the table')
      && error.message.includes(`public.${table}`)
      && error.message.includes('schema cache')
    )
  );
}

function countBy(values: string[]) {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }

  return counts;
}

function shouldUseFileStore(options?: ProfilePerformanceStatsOptions) {
  return (
    Boolean(options?.contestDataFilePath) ||
    Boolean(options?.resultsDataFilePath) ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}
