import { describe, expect, it, vi } from 'vitest';
import {
  extractMySportsFeedsStatValue,
  normalizeMySportsFeedsGameStatus,
  runMySportsFeedsReadOnlyValidation,
} from '../../lib/mysportsfeeds-validation';

describe('mysportsfeeds read-only validation', () => {
  it('maps MySportsFeeds game states into provisional game states', () => {
    expect(normalizeMySportsFeedsGameStatus({ playedStatus: 'UNPLAYED' })).toBe('scheduled');
    expect(normalizeMySportsFeedsGameStatus({ playedStatus: 'LIVE' })).toBe('in_progress');
    expect(normalizeMySportsFeedsGameStatus({ playedStatus: 'COMPLETED_PENDING_REVIEW' })).toBe('in_progress');
    expect(normalizeMySportsFeedsGameStatus({ playedStatus: 'COMPLETED' })).toBe('final');
  });

  it('extracts passYards from nested stat objects and stat-reference arrays', () => {
    expect(
      extractMySportsFeedsStatValue(
        {
          passing: {
            passYards: 284,
          },
        },
        ['passYards', 'Yds', 'Pass Yards'],
      ),
    ).toBe(284);

    expect(
      extractMySportsFeedsStatValue(
        [
          {
            category: 'Passing',
            fullName: 'passYards',
            abbreviation: 'Yds',
            value: '177',
          },
        ],
        ['passYards', 'Yds', 'Pass Yards'],
      ),
    ).toBe(177);
  });

  it('proves auth, schedule access, game-state shape, and reports future games as pending passYards proof', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          lastUpdatedOn: '2026-08-12T03:31:01.531Z',
          games: [
            {
              schedule: {
                id: 163541,
                week: 1,
                startTime: '2026-09-10T00:20:00.000Z',
                awayTeam: { id: 50, abbreviation: 'NE' },
                homeTeam: { id: 79, abbreviation: 'SEA' },
                scheduleStatus: 'NORMAL',
                playedStatus: 'UNPLAYED',
              },
              score: {
                awayScoreTotal: null,
                homeScoreTotal: null,
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

    await expect(
      runMySportsFeedsReadOnlyValidation({
        apiKey: 'secret-key',
        password: 'MYSPORTSFEEDS',
        baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull/nfl',
        season: '2026-regular',
        week: 1,
        fetchImpl: fetchImpl as unknown as typeof fetch,
        now: '2026-08-12T04:00:00.000Z',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        providerKey: 'mysportsfeeds',
        checks: {
          auth: 'passed',
          scheduleAccess: 'passed',
          gameStateMapping: 'passed',
          qbPassYards: 'pending_completed_game',
          provisionalSnapshotShape: 'pending_completed_game',
        },
        gamesTotal: 1,
        gamesScheduled: 1,
        gamesInProgress: 0,
        gamesFinal: 0,
        games: [
          expect.objectContaining({
            providerGameId: '163541',
            awayTeam: 'NE',
            homeTeam: 'SEA',
            gameStatus: 'scheduled',
          }),
        ],
        statRowsFound: 0,
        selectedGame: expect.objectContaining({
          providerGameId: '163541',
          gameStatus: 'scheduled',
        }),
      }),
    );

    expect(fetchImpl).toHaveBeenNthCalledWith(
      1,
      'https://api.mysportsfeeds.com/v2.1/pull/nfl/2026-regular/week/1/games.json',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: expect.stringMatching(/^Basic /),
          Accept: 'application/json',
        }),
      }),
    );
    expect(fetchImpl).toHaveBeenNthCalledWith(
      2,
      'https://api.mysportsfeeds.com/v2.1/pull/nfl/2026-regular/week/1/player_gamelogs.json?position=QB&stats=Yds%2CTD&game=163541',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });

  it('supports a schedule-only Week 1 check without requesting unavailable pregame stats', async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        games: [
          {
            schedule: {
              id: 163541,
              startTime: '2026-09-10T00:20:00.000Z',
              awayTeam: { abbreviation: 'NE' },
              homeTeam: { abbreviation: 'SEA' },
              scheduleStatus: 'NORMAL',
              playedStatus: 'UNPLAYED',
            },
          },
        ],
      }),
    });

    const result = await runMySportsFeedsReadOnlyValidation({
      apiKey: 'secret-key',
      season: '2026-regular',
      week: 1,
      scheduleOnly: true,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(result.games).toHaveLength(1);
    expect(result.checks.qbPassYards).toBe('pending_completed_game');
    expect(result.notes).toContain('Schedule-only mode skipped the player gamelog request.');
  });

  it('builds provisional rows from completed QB gamelogs without persisting anything', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          games: [
            {
              schedule: {
                id: 1001,
                startTime: '2026-08-08T00:20:00.000Z',
                awayTeam: { abbreviation: 'BUF' },
                homeTeam: { abbreviation: 'BAL' },
                scheduleStatus: 'NORMAL',
                playedStatus: 'COMPLETED',
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          gamelogs: [
            {
              game: { id: 1001 },
              player: { id: 10, firstName: 'Josh', lastName: 'Allen' },
              team: { abbreviation: 'BUF' },
              stats: { passing: { passYards: 210, passTD: 1 } },
            },
            {
              game: { id: 1001 },
              player: { id: 11, firstName: 'Lamar', lastName: 'Jackson' },
              team: { abbreviation: 'BAL' },
              stats: { passing: { passYards: 198, passTD: 0 } },
            },
          ],
        }),
      });

    const result = await runMySportsFeedsReadOnlyValidation({
      apiKey: 'secret-key',
      season: '2026-preseason',
      week: 1,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    expect(result).toEqual(
      expect.objectContaining({
        checks: {
          auth: 'passed',
          scheduleAccess: 'passed',
          gameStateMapping: 'passed',
          qbPassYards: 'passed',
          provisionalSnapshotShape: 'passed',
        },
        gamesTotal: 1,
        gamesFinal: 1,
        statRowsFound: 2,
        rows: [
          expect.objectContaining({
            playerName: 'Josh Allen',
            passingYards: 210,
            provisionalRankDisplay: '1',
            gameStatus: 'final',
          }),
          expect.objectContaining({
            playerName: 'Lamar Jackson',
            passingYards: 198,
            provisionalRankDisplay: '2',
            gameStatus: 'final',
          }),
        ],
      }),
    );
  });

  it('keeps completed-pending-review games out of the final bucket while validating stat rows', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          games: [
            {
              schedule: {
                id: 163796,
                startTime: '2026-08-13T23:00:00.000Z',
                awayTeam: { abbreviation: 'DET' },
                homeTeam: { abbreviation: 'CIN' },
                scheduleStatus: 'NORMAL',
                playedStatus: 'COMPLETED_PENDING_REVIEW',
              },
            },
          ],
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          gamelogs: [
            {
              game: { id: 163796 },
              player: { id: 13191, firstName: 'Joshua', lastName: 'Dobbs' },
              team: { abbreviation: 'DET' },
              stats: { passing: { passYards: 143, passTD: 0 } },
            },
            {
              game: { id: 163796 },
              player: { id: 15431, firstName: 'Josh', lastName: 'Johnson' },
              team: { abbreviation: 'CIN' },
              stats: { passing: { passYards: 120, passTD: 0 } },
            },
          ],
        }),
      });

    const result = await runMySportsFeedsReadOnlyValidation({
      apiKey: 'secret-key',
      season: '2026-preseason',
      week: 1,
      gameId: '163796',
      fetchImpl: fetchImpl as unknown as typeof fetch,
      now: '2026-08-14T03:16:10.835Z',
    });

    expect(result).toEqual(
      expect.objectContaining({
        checks: {
          auth: 'passed',
          scheduleAccess: 'passed',
          gameStateMapping: 'passed',
          qbPassYards: 'passed',
          provisionalSnapshotShape: 'passed',
        },
        gamesTotal: 1,
        gamesScheduled: 0,
        gamesInProgress: 1,
        gamesFinal: 0,
        allGamesFinal: false,
        selectedGame: expect.objectContaining({
          providerGameId: '163796',
          rawPlayedStatus: 'COMPLETED_PENDING_REVIEW',
          gameStatus: 'in_progress',
        }),
        rows: [
          expect.objectContaining({
            providerPlayerId: '13191',
            providerGameId: '163796',
            playerName: 'Joshua Dobbs',
            passingYards: 143,
            gameStatus: 'in_progress',
          }),
          expect.objectContaining({
            providerPlayerId: '15431',
            providerGameId: '163796',
            playerName: 'Josh Johnson',
            passingYards: 120,
            gameStatus: 'in_progress',
          }),
        ],
      }),
    );
  });
});
