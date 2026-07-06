import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  fetchAndPersistReplayProvisionalSnapshot,
  fetchAndPersistSportsDataIoLiveProvisionalSnapshot,
  getReplayProvisionalValidationReadiness,
  getSportsDataIoLiveValidationReadiness,
  getLatestProvisionalContestStatSnapshot,
} from '../../lib/stats-provider';

const placeholderContest = {
  id: 'week-1-qb-passing-yards',
  title: 'Week 1 QB Passing Yards',
  season: 2026,
  week: 1,
  slatePlayers: [
    {
      playerId: 'qb-josh-allen',
      providerPlayerId: 'provider-qb-josh-allen',
      providerGameId: 'buf-bal-2026-wk1',
      displayName: 'Josh Allen',
      teamAbbreviation: 'BUF',
      opponentAbbreviation: 'BAL',
      homeAway: 'home' as const,
    },
    {
      playerId: 'qb-lamar-jackson',
      providerPlayerId: 'provider-qb-lamar-jackson',
      providerGameId: 'bal-buf-2026-wk1',
      displayName: 'Lamar Jackson',
      teamAbbreviation: 'BAL',
      opponentAbbreviation: 'BUF',
      homeAway: 'away' as const,
    },
    {
      playerId: 'qb-patrick-mahomes',
      providerPlayerId: 'provider-qb-patrick-mahomes',
      providerGameId: 'kc-den-2026-wk1',
      displayName: 'Patrick Mahomes',
      teamAbbreviation: 'KC',
      opponentAbbreviation: 'DEN',
      homeAway: 'home' as const,
    },
  ],
};

const liveReadyContest = {
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

  it('flags missing Replay credentials and placeholder provider ids before a live fetch attempt', () => {
    expect(getReplayProvisionalValidationReadiness(placeholderContest, { apiKey: '' })).toEqual({
      ready: false,
      issues: [
        {
          code: 'missing_replay_api_key',
          message: 'SportsDataIO Replay API key is not configured in the active environment.',
        },
        {
          code: 'non_numeric_provider_player_ids',
          message: 'week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO PlayerID values.',
          affectedPlayerIds: ['qb-josh-allen', 'qb-lamar-jackson', 'qb-patrick-mahomes'],
        },
        {
          code: 'non_numeric_provider_game_ids',
          message: 'week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO ScoreID values.',
          affectedPlayerIds: ['qb-josh-allen', 'qb-lamar-jackson', 'qb-patrick-mahomes'],
        },
      ],
    });
  });

  it('flags missing live credentials and placeholder provider ids before an in-season live fetch attempt', () => {
    expect(getSportsDataIoLiveValidationReadiness(placeholderContest, { apiKey: '' })).toEqual({
      ready: false,
      issues: [
        {
          code: 'missing_live_api_key',
          message: 'SportsDataIO live API key is not configured in the active environment.',
        },
        {
          code: 'non_numeric_provider_player_ids',
          message: 'week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO PlayerID values.',
          affectedPlayerIds: ['qb-josh-allen', 'qb-lamar-jackson', 'qb-patrick-mahomes'],
        },
        {
          code: 'non_numeric_provider_game_ids',
          message: 'week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO ScoreID values.',
          affectedPlayerIds: ['qb-josh-allen', 'qb-lamar-jackson', 'qb-patrick-mahomes'],
        },
      ],
    });
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
      fetchAndPersistReplayProvisionalSnapshot(liveReadyContest, {
        apiKey: 'secret-key',
        baseUrl: 'https://replay.sportsdata.io/api/v3/nfl',
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
        contestId: liveReadyContest.id,
        providerKey: 'sportsdataio_replay',
      }),
    );

    await expect(getLatestProvisionalContestStatSnapshot(liveReadyContest.id, persistedSnapshotFilePath)).resolves.toEqual(
      expect.objectContaining({
        contestId: liveReadyContest.id,
        rows: [
          expect.objectContaining({ playerId: 'qb-josh-allen', provisionalRankDisplay: 'T-1' }),
          expect.objectContaining({ playerId: 'qb-lamar-jackson', provisionalRankDisplay: 'T-1' }),
          expect.objectContaining({ playerId: 'qb-patrick-mahomes', provisionalRankDisplay: '3' }),
        ],
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://replay.sportsdata.io/api/v3/nfl/stats/json/scoresbyweek/2026reg/1?key=secret-key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://replay.sportsdata.io/api/v3/nfl/stats/json/playergamestatsbyweek/2026reg/1?key=secret-key',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
  });

  it('fetches SportsDataIO live rows with header auth and persists a provisional snapshot', async () => {
    const persistedSnapshotFilePath = await createPersistedSnapshotFilePath();

    vi.stubGlobal(
      'fetch',
      vi.fn()
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { ScoreID: 5001, Status: 'InProgress' },
            { ScoreID: 5002, Status: 'Final' },
          ],
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => [
            { PlayerID: 1001, ScoreID: 5001, PassingYards: 275, PassingTouchdowns: 2, Status: 'InProgress' },
            { PlayerID: 1002, ScoreID: 5001, PassingYards: 240, PassingTouchdowns: 1, Status: 'InProgress' },
            { PlayerID: 1003, ScoreID: 5002, PassingYards: 310, PassingTouchdowns: 3, Status: 'Final' },
          ],
        }),
    );

    await expect(
      fetchAndPersistSportsDataIoLiveProvisionalSnapshot(liveReadyContest, {
        apiKey: 'live-secret',
        baseUrl: 'https://api.sportsdata.io/v3/nfl',
        authMode: 'header',
        persistedSnapshotFilePath,
        now: '2026-09-04T02:00:00.000Z',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        snapshotKind: 'provisional_order',
        providerKey: 'sportsdataio_live',
        providerName: 'SportsDataIO Live',
        gamesTotal: 2,
        gamesScheduled: 0,
        gamesInProgress: 1,
        gamesFinal: 1,
        allGamesFinal: false,
        rows: expect.arrayContaining([
          expect.objectContaining({
            playerId: 'qb-patrick-mahomes',
            passingYards: 310,
            provisionalRank: 1,
            provisionalRankDisplay: '1',
            gameStatus: 'final',
          }),
          expect.objectContaining({
            playerId: 'qb-josh-allen',
            passingYards: 275,
            provisionalRank: 2,
            provisionalRankDisplay: '2',
            gameStatus: 'in_progress',
          }),
        ]),
      }),
    );

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      'https://api.sportsdata.io/v3/nfl/scores/json/ScoresByWeek/2026reg/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'Ocp-Apim-Subscription-Key': 'live-secret',
        }),
      }),
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      'https://api.sportsdata.io/v3/nfl/stats/json/PlayerGameStatsByWeek/2026reg/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'Ocp-Apim-Subscription-Key': 'live-secret',
        }),
      }),
    );
  });

  it('fails with one actionable readiness error when live Replay validation is not configured', async () => {
    await expect(fetchAndPersistReplayProvisionalSnapshot(placeholderContest, { apiKey: '' })).rejects.toThrow(
      'Replay provisional snapshot fetch is not ready: SportsDataIO Replay API key is not configured in the active environment. week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO PlayerID values. week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO ScoreID values.',
    );
  });

  it('fails with one actionable readiness error when in-season live validation is not configured', async () => {
    await expect(fetchAndPersistSportsDataIoLiveProvisionalSnapshot(placeholderContest, { apiKey: '' })).rejects.toThrow(
      'SportsDataIO live provisional snapshot fetch is not ready: SportsDataIO live API key is not configured in the active environment. week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO PlayerID values. week-1-qb-passing-yards still has 3 slate players without numeric SportsDataIO ScoreID values.',
    );
  });
});
