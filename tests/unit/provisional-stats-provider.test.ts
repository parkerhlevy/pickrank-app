import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAndPersistReplayProvisionalSnapshot,
  getLatestProvisionalContestStatSnapshot,
} from '../../lib/stats-provider';

const contest = {
  id: 'week-1-qb-passing-yards',
  title: 'Week 1 QB Passing Yards',
  season: 2026,
  week: 1,
  slatePlayers: [
    {
      playerId: 'qb-josh-allen',
      providerPlayerId: '1001',
      providerGameId: '5001',
      displayName: 'Josh Allen',
      teamAbbreviation: 'BUF',
      opponentAbbreviation: 'BAL',
      homeAway: 'home' as const,
    },
    {
      playerId: 'qb-lamar-jackson',
      providerPlayerId: '1002',
      providerGameId: '5001',
      displayName: 'Lamar Jackson',
      teamAbbreviation: 'BAL',
      opponentAbbreviation: 'BUF',
      homeAway: 'away' as const,
    },
    {
      playerId: 'qb-patrick-mahomes',
      providerPlayerId: '1003',
      providerGameId: '5002',
      displayName: 'Patrick Mahomes',
      teamAbbreviation: 'KC',
      opponentAbbreviation: 'LAC',
      homeAway: 'home' as const,
    },
  ],
};

async function createPersistedSnapshotFilePath() {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-provisional-snapshots-'));
  return path.join(tempDirectory, 'contest-provisional-snapshots.json');
}

describe('provisional replay stats provider', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches Replay-backed live rows, persists a provisional snapshot, and keeps ties grouped by passing yards only', async () => {
    const persistedSnapshotFilePath = await createPersistedSnapshotFilePath();

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { ScoreID: 5001, Status: 'InProgress' },
            { ScoreID: 5002, Status: 'Scheduled' },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { PlayerID: 1001, ScoreID: 5001, PassingYards: 250, PassingTouchdowns: 2, Status: 'InProgress' },
            { PlayerID: 1002, ScoreID: 5001, PassingYards: 250, PassingTouchdowns: 3, Status: 'InProgress' },
          ],
        }),
    );

    await expect(
      fetchAndPersistReplayProvisionalSnapshot(contest, {
        apiKey: 'secret-key',
        baseUrl: 'https://api.sportsdata.io/v3/nfl',
        persistedSnapshotFilePath,
        now: '2026-09-04T01:00:00.000Z',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        snapshotKind: 'provisional_order',
        providerKey: 'sportsdataio_replay',
        providerName: 'SportsDataIO Replay',
        gamesTotal: 2,
        gamesScheduled: 1,
        gamesInProgress: 1,
        gamesFinal: 0,
        allGamesFinal: false,
        rows: [
          expect.objectContaining({
            playerId: 'qb-josh-allen',
            passingYards: 250,
            provisionalRank: 1,
            provisionalRankDisplay: 'T-1',
            gameStatus: 'in_progress',
          }),
          expect.objectContaining({
            playerId: 'qb-lamar-jackson',
            passingYards: 250,
            provisionalRank: 1,
            provisionalRankDisplay: 'T-1',
            gameStatus: 'in_progress',
          }),
          expect.objectContaining({
            playerId: 'qb-patrick-mahomes',
            passingYards: 0,
            provisionalRank: 3,
            provisionalRankDisplay: '3',
            gameStatus: 'scheduled',
          }),
        ],
      }),
    );

    const persistedStore = JSON.parse(await readFile(persistedSnapshotFilePath, 'utf8'));
    expect(persistedStore.snapshots).toHaveLength(1);
    expect(persistedStore.snapshots[0]).toEqual(
      expect.objectContaining({
        contestId: contest.id,
        providerKey: 'sportsdataio_replay',
      }),
    );

    await expect(getLatestProvisionalContestStatSnapshot(contest.id, persistedSnapshotFilePath)).resolves.toEqual(
      expect.objectContaining({
        contestId: contest.id,
        rows: [
          expect.objectContaining({ playerId: 'qb-josh-allen', provisionalRankDisplay: 'T-1' }),
          expect.objectContaining({ playerId: 'qb-lamar-jackson', provisionalRankDisplay: 'T-1' }),
          expect.objectContaining({ playerId: 'qb-patrick-mahomes', provisionalRankDisplay: '3' }),
        ],
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2026REG/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Ocp-Apim-Subscription-Key': 'secret-key',
        }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByWeek/2026REG/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'Ocp-Apim-Subscription-Key': 'secret-key',
        }),
      }),
    );
  });
});
