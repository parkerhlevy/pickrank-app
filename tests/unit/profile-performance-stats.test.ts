import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildProfilePerformanceStats,
  getProfilePerformanceStats,
  type ProfilePerformanceRecord,
} from '../../lib/profile-performance-stats';

const viewerUserId = '00000000-0000-4000-8000-000000000001';
const createSupabaseClient = vi.hoisted(() => vi.fn());

vi.mock('@/lib/env', () => ({ hasBrowserSupabaseConfig: () => true }));
vi.mock('@/lib/supabase/server', () => ({ createClient: createSupabaseClient }));

afterEach(() => {
  createSupabaseClient.mockReset();
  vi.unstubAllEnvs();
});

function buildRecord(overrides: Partial<ProfilePerformanceRecord> = {}): ProfilePerformanceRecord {
  return {
    contestId: 'contest-1',
    contestSlug: 'contest-1',
    contestTitle: 'Week 1 QB Passing Yards',
    contestStatus: 'final',
    visibilityStatus: 'visible',
    entryId: 'entry-1',
    totalScore: 12,
    exactPicks: 2,
    oneOffOrBetterPicks: 5,
    finalRank: 4,
    finalRankDisplay: '4',
    scoreFinalizedAt: '2026-09-09T00:00:00.000Z',
    fieldSize: 20,
    scoredPickCount: 10,
    ...overrides,
  };
}

function expectReady(records: ProfilePerformanceRecord[]) {
  const stats = buildProfilePerformanceStats(records);
  expect(stats.status).toBe('ready');

  if (stats.status !== 'ready') {
    throw new Error('Expected ready Profile stats.');
  }

  return stats;
}

describe('Profile performance stats', () => {
  it('returns empty when no saved final result qualifies', () => {
    expect(buildProfilePerformanceStats([])).toEqual({ status: 'empty' });
  });

  it('calculates one completed contest from the actual saved-pick denominator', () => {
    const stats = expectReady([
      buildRecord({ scoredPickCount: 12, exactPicks: 3, oneOffOrBetterPicks: 8 }),
    ]);

    expect(stats).toEqual(
      expect.objectContaining({
        contestsCompleted: 1,
        topThreeFinishes: 0,
        accuracy: {
          exactPicks: 3,
          exactPickRate: 25,
          withinOneSpotPicks: 8,
          withinOneSpotRate: 67,
          scoredPicks: 12,
        },
      }),
    );
    expect(stats.recentResults[0].scoredPicks).toBe(12);
  });

  it('combines multiple contests and counts shared top-three ranks', () => {
    const stats = expectReady([
      buildRecord({ finalRank: 1, finalRankDisplay: '1' }),
      buildRecord({ contestId: 'contest-2', entryId: 'entry-2', finalRank: 3, finalRankDisplay: 'T-3' }),
      buildRecord({ contestId: 'contest-3', entryId: 'entry-3', finalRank: 4, finalRankDisplay: '4' }),
    ]);

    expect(stats.contestsCompleted).toBe(3);
    expect(stats.topThreeFinishes).toBe(2);
  });

  it('resolves equal best ranks by field size and then finalization time', () => {
    const stats = expectReady([
      buildRecord({
        contestId: 'small-field',
        contestSlug: 'small-field',
        entryId: 'small-entry',
        finalRank: 2,
        finalRankDisplay: 'T-2',
        fieldSize: 20,
        scoreFinalizedAt: '2026-09-11T00:00:00.000Z',
      }),
      buildRecord({
        contestId: 'large-field-old',
        contestSlug: 'large-field-old',
        entryId: 'large-old-entry',
        finalRank: 2,
        finalRankDisplay: '2',
        fieldSize: 50,
        scoreFinalizedAt: '2026-09-09T00:00:00.000Z',
      }),
      buildRecord({
        contestId: 'large-field-new',
        contestSlug: 'large-field-new',
        entryId: 'large-new-entry',
        finalRank: 2,
        finalRankDisplay: 'T-2',
        fieldSize: 50,
        scoreFinalizedAt: '2026-09-10T00:00:00.000Z',
      }),
    ]);

    expect(stats.bestFinish.contestSlug).toBe('large-field-new');
    expect(stats.bestFinish.finalRankDisplay).toBe('T-2');
  });

  it('orders and limits recent results to the newest five', () => {
    const stats = expectReady(
      Array.from({ length: 6 }, (_, index) =>
        buildRecord({
          contestId: `contest-${index + 1}`,
          contestSlug: `contest-${index + 1}`,
          contestTitle: `Week ${index + 1}`,
          entryId: `entry-${index + 1}`,
          scoreFinalizedAt: `2026-09-${String(index + 10).padStart(2, '0')}T00:00:00.000Z`,
        }),
      ),
    );

    expect(stats.recentResults.map((result) => result.contestSlug)).toEqual([
      'contest-6',
      'contest-5',
      'contest-4',
      'contest-3',
      'contest-2',
    ]);
  });

  it('uses corrected saved result values without retaining prior values', () => {
    const stats = expectReady([
      buildRecord({ totalScore: 7, exactPicks: 4, oneOffOrBetterPicks: 6, finalRank: 1, finalRankDisplay: '1' }),
    ]);

    expect(stats.bestFinish.totalScore).toBe(7);
    expect(stats.accuracy.exactPicks).toBe(4);
    expect(stats.recentResults[0]).toEqual(expect.objectContaining({ totalScore: 7, exactPicks: 4 }));
  });

  it('excludes live, finalizing, canceled, hidden, and incomplete-board records', () => {
    expect(
      buildProfilePerformanceStats([
        buildRecord({ contestStatus: 'live' }),
        buildRecord({ contestId: 'finalizing', entryId: 'finalizing-entry', contestStatus: 'finalizing' }),
        buildRecord({ contestId: 'canceled', entryId: 'canceled-entry', contestStatus: 'canceled' }),
        buildRecord({ contestId: 'hidden', entryId: 'hidden-entry', visibilityStatus: 'hidden' }),
        buildRecord({ contestId: 'incomplete', entryId: 'incomplete-entry', scoredPickCount: 0 }),
      ]),
    ).toEqual({ status: 'empty' });
  });

  it('reads only the requested viewer from the file-backed scoring store', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-profile-stats-'));
    const contestDataFilePath = path.join(directory, 'contests.json');
    const resultsDataFilePath = path.join(directory, 'contest-results.json');

    await writeFile(
      contestDataFilePath,
      JSON.stringify({
        version: 1,
        contests: [{ id: 'final-visible', title: 'Final Visible', status: 'paid_out', visibilityStatus: 'visible' }],
      }),
      'utf8',
    );
    await writeFile(
      resultsDataFilePath,
      JSON.stringify({
        version: 1,
        contests: [
          {
            contestId: 'final-visible',
            entryResults: [
              {
                entryId: 'viewer-entry',
                userId: viewerUserId,
                totalScore: 10,
                exactPicks: 2,
                oneOffOrBetterPicks: 5,
                finalRank: 1,
                finalRankDisplay: 'T-1',
                scoreFinalizedAt: '2026-09-10T00:00:00.000Z',
              },
              {
                entryId: 'other-entry',
                userId: '99999999-9999-4999-8999-999999999999',
                totalScore: 11,
                exactPicks: 1,
                oneOffOrBetterPicks: 4,
                finalRank: 1,
                finalRankDisplay: 'T-1',
                scoreFinalizedAt: '2026-09-10T00:00:00.000Z',
              },
            ],
            entryPlayerScores: Array.from({ length: 20 }, (_, index) => ({
              entryId: index < 10 ? 'viewer-entry' : 'other-entry',
            })),
          },
        ],
      }),
      'utf8',
    );

    const stats = await getProfilePerformanceStats(viewerUserId, {
      contestDataFilePath,
      resultsDataFilePath,
    });

    expect(stats).toEqual(
      expect.objectContaining({
        status: 'ready',
        contestsCompleted: 1,
        topThreeFinishes: 1,
        accuracy: expect.objectContaining({ scoredPicks: 10 }),
      }),
    );
  });

  it('returns unavailable when saved results cannot be parsed', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-profile-stats-'));
    const resultsDataFilePath = path.join(directory, 'contest-results.json');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    await writeFile(resultsDataFilePath, '{not-valid-json', 'utf8');

    await expect(getProfilePerformanceStats(viewerUserId, { resultsDataFilePath })).resolves.toEqual({
      status: 'unavailable',
    });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });

  it('treats an absent optional scoring table as the first-contest empty state without logging an error', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VITEST', 'false');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '0');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const query = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: {
          message: "Could not find the table 'public.entry_scoring_results' in the schema cache",
        },
      }),
    };
    query.select.mockReturnValue(query);
    createSupabaseClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

    await expect(getProfilePerformanceStats(viewerUserId)).resolves.toEqual({ status: 'empty' });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('returns the empty state when saved results exist but the optional pick-score table is absent', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VITEST', 'false');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '0');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const userResultsQuery = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({
        data: [{
          contest_id: 'contest-1',
          entry_id: 'entry-1',
          exact_picks: 2,
          final_rank: 1,
          final_rank_display: '1',
          one_off_or_better_picks: 5,
          score_finalized_at: '2026-09-10T00:00:00.000Z',
          total_score: 10,
        }],
        error: null,
      }),
    };
    const contestQuery = {
      select: vi.fn(),
      in: vi.fn(),
      eq: vi.fn(),
    };
    const fieldQuery = { select: vi.fn(), in: vi.fn() };
    const playerScoreQuery = { select: vi.fn(), in: vi.fn() };
    userResultsQuery.select.mockReturnValue(userResultsQuery);
    contestQuery.select.mockReturnValue(contestQuery);
    contestQuery.in
      .mockReturnValueOnce(contestQuery)
      .mockResolvedValueOnce({ data: [{
        id: 'contest-1',
        slug: 'contest-1',
        status: 'final',
        title: 'Week 1',
        visibility_status: 'visible',
      }], error: null });
    contestQuery.eq.mockReturnValue(contestQuery);
    fieldQuery.select.mockReturnValue(fieldQuery);
    fieldQuery.in.mockResolvedValue({ data: [{ contest_id: 'contest-1' }], error: null });
    playerScoreQuery.select.mockReturnValue(playerScoreQuery);
    playerScoreQuery.in.mockResolvedValue({
      data: null,
      error: { code: 'PGRST205', message: 'missing relation' },
    });
    createSupabaseClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'contests') return contestQuery;
        if (table === 'entry_player_scores') return playerScoreQuery;
        return userResultsQuery.eq.mock.calls.length === 0 ? userResultsQuery : fieldQuery;
      }),
    });

    await expect(getProfilePerformanceStats(viewerUserId)).resolves.toEqual({ status: 'empty' });
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it('keeps unexpected scoring-table read failures unavailable and logged', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VITEST', 'false');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '0');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const query = {
      select: vi.fn(),
      eq: vi.fn().mockResolvedValue({
        data: null,
        error: { code: '42501', message: 'permission denied for table entry_scoring_results' },
      }),
    };
    query.select.mockReturnValue(query);
    createSupabaseClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });

    await expect(getProfilePerformanceStats(viewerUserId)).resolves.toEqual({ status: 'unavailable' });
    expect(consoleError).toHaveBeenCalledOnce();
    consoleError.mockRestore();
  });
});
