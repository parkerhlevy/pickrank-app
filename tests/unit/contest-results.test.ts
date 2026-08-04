import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { finalizeContestResults, getContestLeaderboard, getContestResultForUser } from '../../lib/contest-results';

const baselineFinalStats = [
  { playerId: 'qb-josh-allen', finalStat: 325, passingTouchdowns: 3 },
  { playerId: 'qb-joe-burrow', finalStat: 300, passingTouchdowns: 2 },
  { playerId: 'qb-derek-carr', finalStat: 250, passingTouchdowns: 1 },
  { playerId: 'qb-kirk-cousins', finalStat: 220, passingTouchdowns: 1 },
  { playerId: 'qb-justin-herbert', finalStat: 295, passingTouchdowns: 2 },
  { playerId: 'qb-jalen-hurts', finalStat: 280, passingTouchdowns: 2 },
  { playerId: 'qb-lamar-jackson', finalStat: 330, passingTouchdowns: 4 },
  { playerId: 'qb-jordan-love', finalStat: 270, passingTouchdowns: 2 },
  { playerId: 'qb-dak-prescott', finalStat: 260, passingTouchdowns: 1 },
  { playerId: 'qb-brock-purdy', finalStat: 240, passingTouchdowns: 1 },
  { playerId: 'qb-cj-stroud', finalStat: 230, passingTouchdowns: 1 },
  { playerId: 'qb-patrick-mahomes', finalStat: 305, passingTouchdowns: 3 },
  { playerId: 'qb-jared-goff', finalStat: 290, passingTouchdowns: 2 },
  { playerId: 'qb-tua-tagovailoa', finalStat: 210, passingTouchdowns: 1 },
  { playerId: 'qb-matthew-stafford', finalStat: 205, passingTouchdowns: 1 },
];

const correctedFinalStats = [
  { playerId: 'qb-josh-allen', finalStat: 325, passingTouchdowns: 3 },
  { playerId: 'qb-joe-burrow', finalStat: 300, passingTouchdowns: 2 },
  { playerId: 'qb-derek-carr', finalStat: 250, passingTouchdowns: 1 },
  { playerId: 'qb-kirk-cousins', finalStat: 220, passingTouchdowns: 1 },
  { playerId: 'qb-justin-herbert', finalStat: 295, passingTouchdowns: 2 },
  { playerId: 'qb-jalen-hurts', finalStat: 318, passingTouchdowns: 4 },
  { playerId: 'qb-lamar-jackson', finalStat: 330, passingTouchdowns: 4 },
  { playerId: 'qb-jordan-love', finalStat: 270, passingTouchdowns: 2 },
  { playerId: 'qb-dak-prescott', finalStat: 260, passingTouchdowns: 1 },
  { playerId: 'qb-brock-purdy', finalStat: 240, passingTouchdowns: 1 },
  { playerId: 'qb-cj-stroud', finalStat: 230, passingTouchdowns: 1 },
  { playerId: 'qb-patrick-mahomes', finalStat: 268, passingTouchdowns: 1 },
  { playerId: 'qb-jared-goff', finalStat: 290, passingTouchdowns: 2 },
  { playerId: 'qb-tua-tagovailoa', finalStat: 210, passingTouchdowns: 1 },
  { playerId: 'qb-matthew-stafford', finalStat: 205, passingTouchdowns: 1 },
];

async function createTempFilePath(fileName: string) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-results-'));
  return path.join(tempDirectory, fileName);
}

async function createContestStorePath() {
  const contestDataFilePath = await createTempFilePath('contests.json');
  const baselineContestStore = await readFile(path.join(process.cwd(), 'data', 'contests.json'), 'utf8');
  const contestStore = JSON.parse(baselineContestStore) as {
    contests: Array<Record<string, unknown>>;
  };

  contestStore.contests = contestStore.contests.map((contest) =>
    contest.id === 'week-1-qb-passing-yards'
      ? {
          ...contest,
          entryFeeCents: 500,
          entryCount: 600,
          paidEntryCount: 600,
        }
      : contest,
  );

  await writeFile(contestDataFilePath, `${JSON.stringify(contestStore, null, 2)}\n`, 'utf8');

  return contestDataFilePath;
}

describe('contest results finalization', () => {
  it('persists finalized leaderboard results and moves the contest to final in the file-backed store', async () => {
    const contestDataFilePath = await createContestStorePath();
    const contestEntryDataFilePath = await createTempFilePath('contest-entries.json');
    const resultsDataFilePath = await createTempFilePath('contest-results.json');

    await writeFile(
      contestEntryDataFilePath,
      JSON.stringify(
        {
          version: 1,
          entries: [
            {
              entryId: 'entry-perfect',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000001',
              lineupOrder: [
                'Lamar Jackson',
                'Josh Allen',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-chaser',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000002',
              lineupOrder: [
                'Josh Allen',
                'Lamar Jackson',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    await finalizeContestResults({
      contestId: 'week-1-qb-passing-yards',
      finalizedAt: '2026-09-09T00:00:00.000Z',
      finalStats: baselineFinalStats,
      options: {
        contestDataFilePath,
        contestEntryDataFilePath,
        resultsDataFilePath,
      },
    });

    const leaderboard = await getContestLeaderboard('week-1-qb-passing-yards', {
      resultsDataFilePath,
    });

    expect(leaderboard).toEqual({
      contestId: 'week-1-qb-passing-yards',
      contestTitle: 'Week 1 QB Passing Yards',
      finalizedAt: '2026-09-09T00:00:00.000Z',
      rows: [
        expect.objectContaining({
          entryId: 'entry-perfect',
          finalRankDisplay: '1',
          totalScore: 0,
          payoutAmount: '$1,050.00',
        }),
        expect.objectContaining({
          entryId: 'entry-chaser',
          finalRankDisplay: '2',
          totalScore: 2,
          payoutAmount: '$630.00',
        }),
      ],
    });

    const savedContestStore = JSON.parse(await readFile(contestDataFilePath, 'utf8')) as {
      contests: Array<{ id: string; status: string }>;
    };

    expect(savedContestStore.contests.find((contest) => contest.id === 'week-1-qb-passing-yards')?.status).toBe('final');
  });

  it('returns the persisted signed-in user result with player breakdown data', async () => {
    const contestDataFilePath = await createContestStorePath();
    const contestEntryDataFilePath = await createTempFilePath('contest-entries.json');
    const resultsDataFilePath = await createTempFilePath('contest-results.json');

    await writeFile(
      contestEntryDataFilePath,
      JSON.stringify(
        {
          version: 1,
          entries: [
            {
              entryId: 'entry-perfect',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000001',
              lineupOrder: [
                'Lamar Jackson',
                'Josh Allen',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-chaser',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000002',
              lineupOrder: [
                'Josh Allen',
                'Lamar Jackson',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    await finalizeContestResults({
      contestId: 'week-1-qb-passing-yards',
      finalizedAt: '2026-09-09T00:00:00.000Z',
      finalStats: baselineFinalStats,
      options: {
        contestDataFilePath,
        contestEntryDataFilePath,
        resultsDataFilePath,
      },
    });

    const userResult = await getContestResultForUser(
      'week-1-qb-passing-yards',
      '00000000-0000-4000-8000-000000000001',
      {
        resultsDataFilePath,
      },
    );

    expect(userResult).toEqual(
      expect.objectContaining({
        contestId: 'week-1-qb-passing-yards',
        contestTitle: 'Week 1 QB Passing Yards',
        averageMissDistance: null,
        entry: expect.objectContaining({
          entryId: 'entry-perfect',
          finalRankDisplay: '1',
          totalScore: 0,
          payoutAmount: '$1,050.00',
        }),
        bestUniquePick: expect.objectContaining({
          playerName: 'Lamar Jackson',
          teamAbbreviation: 'BAL',
          fieldAverageRank: 1.5,
          pointsAwarded: 0,
        }),
      }),
    );

    expect(userResult?.playerBreakdown[0]).toEqual(
      expect.objectContaining({
        playerName: 'Lamar Jackson',
        userRank: 1,
        actualRankDisplay: '1',
        pointsAwarded: 0,
      }),
    );
  });

  it('persists a true shared paid tie only after the full QB1-through-QB5 touchdown fallback stays equal', async () => {
    const contestDataFilePath = await createContestStorePath();
    const contestEntryDataFilePath = await createTempFilePath('contest-entries.json');
    const resultsDataFilePath = await createTempFilePath('contest-results.json');

    await writeFile(
      contestEntryDataFilePath,
      JSON.stringify(
        {
          version: 1,
          entries: [
            {
              entryId: 'entry-first',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000001',
              lineupOrder: [
                'Lamar Jackson',
                'Josh Allen',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-tied-a',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000002',
              lineupOrder: [
                'Josh Allen',
                'Lamar Jackson',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-tied-b',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000003',
              lineupOrder: [
                'Josh Allen',
                'Lamar Jackson',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-fourth',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000004',
              lineupOrder: [
                'Josh Allen',
                'Joe Burrow',
                'Derek Carr',
                'Kirk Cousins',
                'Justin Herbert',
                'Jalen Hurts',
                'Lamar Jackson',
                'Jordan Love',
                'Dak Prescott',
                'Brock Purdy',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    await finalizeContestResults({
      contestId: 'week-1-qb-passing-yards',
      finalizedAt: '2026-09-09T00:00:00.000Z',
      finalStats: baselineFinalStats,
      options: {
        contestDataFilePath,
        contestEntryDataFilePath,
        resultsDataFilePath,
      },
    });

    const leaderboard = await getContestLeaderboard('week-1-qb-passing-yards', {
      resultsDataFilePath,
    });

    expect(leaderboard?.rows.map((row) => ({
      entryId: row.entryId,
      finalRankDisplay: row.finalRankDisplay,
      totalScore: row.totalScore,
      payoutAmount: row.payoutAmount,
      qb1: row.selectedQb1PassingTouchdowns,
      qb2: row.selectedQb2PassingTouchdowns,
      qb3: row.selectedQb3PassingTouchdowns,
      qb4: row.selectedQb4PassingTouchdowns,
      qb5: row.selectedQb5PassingTouchdowns,
    }))).toEqual([
      {
        entryId: 'entry-first',
        finalRankDisplay: '1',
        totalScore: 0,
        payoutAmount: '$1,050.00',
        qb1: 4,
        qb2: 3,
        qb3: 3,
        qb4: 2,
        qb5: 2,
      },
      {
        entryId: 'entry-tied-a',
        finalRankDisplay: 'T-2',
        totalScore: 2,
        payoutAmount: '$525.00',
        qb1: 3,
        qb2: 4,
        qb3: 3,
        qb4: 2,
        qb5: 2,
      },
      {
        entryId: 'entry-tied-b',
        finalRankDisplay: 'T-2',
        totalScore: 2,
        payoutAmount: '$525.00',
        qb1: 3,
        qb2: 4,
        qb3: 3,
        qb4: 2,
        qb5: 2,
      },
      {
        entryId: 'entry-fourth',
        finalRankDisplay: '4',
        totalScore: 27,
        payoutAmount: '$0.00',
        qb1: 3,
        qb2: 2,
        qb3: 1,
        qb4: 1,
        qb5: 2,
      },
    ]);
  });

  it('replaces saved leaderboard rows and entrant results cleanly when finalization reruns after a stat correction', async () => {
    const contestDataFilePath = await createContestStorePath();
    const contestEntryDataFilePath = await createTempFilePath('contest-entries.json');
    const resultsDataFilePath = await createTempFilePath('contest-results.json');

    await writeFile(
      contestEntryDataFilePath,
      JSON.stringify(
        {
          version: 1,
          entries: [
            {
              entryId: 'entry-tiebreak-winner',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000001',
              lineupOrder: [
                'Lamar Jackson',
                'Josh Allen',
                'Joe Burrow',
                'Justin Herbert',
                'Patrick Mahomes',
                'Jared Goff',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
                'Brock Purdy',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-tiebreak-runner-up',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000002',
              lineupOrder: [
                'Lamar Jackson',
                'Josh Allen',
                'Joe Burrow',
                'Justin Herbert',
                'Jalen Hurts',
                'Jared Goff',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
                'Brock Purdy',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-third-place',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000003',
              lineupOrder: [
                'Josh Allen',
                'Lamar Jackson',
                'Patrick Mahomes',
                'Joe Burrow',
                'Justin Herbert',
                'Jared Goff',
                'Jalen Hurts',
                'Jordan Love',
                'Dak Prescott',
                'Derek Carr',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
            {
              entryId: 'entry-fourth-place',
              contestId: 'week-1-qb-passing-yards',
              userId: '00000000-0000-4000-8000-000000000004',
              lineupOrder: [
                'Josh Allen',
                'Joe Burrow',
                'Derek Carr',
                'Kirk Cousins',
                'Justin Herbert',
                'Jalen Hurts',
                'Lamar Jackson',
                'Jordan Love',
                'Dak Prescott',
                'Brock Purdy',
              ],
              lastSavedAt: '2026-09-08T00:00:00.000Z',
              source: 'user_saved',
              createdAt: '2026-09-04T00:00:00.000Z',
              updatedAt: '2026-09-08T00:00:00.000Z',
            },
          ],
        },
        null,
        2,
      ),
      'utf8',
    );

    await finalizeContestResults({
      contestId: 'week-1-qb-passing-yards',
      finalizedAt: '2026-09-09T00:00:00.000Z',
      finalStats: baselineFinalStats,
      options: {
        contestDataFilePath,
        contestEntryDataFilePath,
        resultsDataFilePath,
      },
    });

    const firstLeaderboard = await getContestLeaderboard('week-1-qb-passing-yards', {
      resultsDataFilePath,
    });
    const firstUserResult = await getContestResultForUser(
      'week-1-qb-passing-yards',
      '00000000-0000-4000-8000-000000000001',
      { resultsDataFilePath },
    );

    await finalizeContestResults({
      contestId: 'week-1-qb-passing-yards',
      finalizedAt: '2026-09-09T01:30:00.000Z',
      finalStats: correctedFinalStats,
      options: {
        contestDataFilePath,
        contestEntryDataFilePath,
        resultsDataFilePath,
      },
    });

    const savedResultsStore = JSON.parse(await readFile(resultsDataFilePath, 'utf8')) as {
      contests: Array<{
        contestId: string;
        finalizedAt: string;
        entryResults: Array<{ entryId: string; totalScore: number; payoutAmountCents: number }>;
        entryPlayerScores: Array<{ entryId: string; playerId: string }>;
      }>;
    };
    const savedContest = savedResultsStore.contests.find((contest) => contest.contestId === 'week-1-qb-passing-yards');
    const correctedLeaderboard = await getContestLeaderboard('week-1-qb-passing-yards', {
      resultsDataFilePath,
    });
    const correctedUserResult = await getContestResultForUser(
      'week-1-qb-passing-yards',
      '00000000-0000-4000-8000-000000000001',
      { resultsDataFilePath },
    );

    expect(savedResultsStore.contests.filter((contest) => contest.contestId === 'week-1-qb-passing-yards')).toHaveLength(1);
    expect(savedContest?.entryResults).toHaveLength(4);
    expect(savedContest?.entryPlayerScores).toHaveLength(40);
    expect(savedContest?.entryResults.map((entry) => entry.entryId)).toHaveLength(
      new Set(savedContest?.entryResults.map((entry) => entry.entryId)).size,
    );
    expect(savedContest?.entryPlayerScores.map((score) => `${score.entryId}:${score.playerId}`)).toHaveLength(
      new Set(savedContest?.entryPlayerScores.map((score) => `${score.entryId}:${score.playerId}`)).size,
    );
    expect(savedContest?.finalizedAt).toBe('2026-09-09T01:30:00.000Z');
    expect(correctedLeaderboard?.rows).not.toEqual(firstLeaderboard?.rows);
    expect(correctedUserResult?.entry).not.toEqual(firstUserResult?.entry);
    expect(correctedUserResult?.playerBreakdown).toHaveLength(10);
  });
});
