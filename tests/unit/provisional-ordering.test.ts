import { describe, expect, it } from 'vitest';
import {
  buildProvisionalOrderRows,
  buildProvisionalOrderSourceRows,
  buildProviderRowKey,
  summarizeProvisionalGames,
} from '../../lib/provisional-ordering';

describe('provisional ordering helpers', () => {
  it('assigns tied provisional ranks without using touchdowns as a hidden tiebreaker', () => {
    expect(
      buildProvisionalOrderRows([
        {
          playerId: 'qb-a',
          providerPlayerId: '1',
          providerGameId: '100',
          playerName: 'Player A',
          teamAbbreviation: 'BUF',
          opponentAbbreviation: 'BAL',
          homeAway: 'home',
          passingYards: 325,
          passingTouchdowns: 1,
          gameStatus: 'final',
        },
        {
          playerId: 'qb-b',
          providerPlayerId: '2',
          providerGameId: '200',
          playerName: 'Player B',
          teamAbbreviation: 'BAL',
          opponentAbbreviation: 'BUF',
          homeAway: 'away',
          passingYards: 288,
          passingTouchdowns: 4,
          gameStatus: 'in_progress',
        },
        {
          playerId: 'qb-c',
          providerPlayerId: '3',
          providerGameId: '300',
          playerName: 'Player C',
          teamAbbreviation: 'KC',
          opponentAbbreviation: 'LAC',
          homeAway: 'home',
          passingYards: 288,
          passingTouchdowns: 0,
          gameStatus: 'scheduled',
        },
      ]),
    ).toEqual([
      expect.objectContaining({
        playerId: 'qb-a',
        provisionalRank: 1,
        provisionalRankMin: 1,
        provisionalRankMax: 1,
        provisionalRankDisplay: '1',
      }),
      expect.objectContaining({
        playerId: 'qb-b',
        provisionalRank: 2,
        provisionalRankMin: 2,
        provisionalRankMax: 3,
        provisionalRankDisplay: 'T-2',
      }),
      expect.objectContaining({
        playerId: 'qb-c',
        provisionalRank: 2,
        provisionalRankMin: 2,
        provisionalRankMax: 3,
        provisionalRankDisplay: 'T-2',
      }),
    ]);
  });

  it('summarizes slate game completion across provisional rows', () => {
    expect(
      summarizeProvisionalGames([
        { providerGameId: '100', gameStatus: 'scheduled' },
        { providerGameId: '200', gameStatus: 'in_progress' },
        { providerGameId: '200', gameStatus: 'in_progress' },
        { providerGameId: '300', gameStatus: 'final' },
      ]),
    ).toEqual({
      totalGames: 3,
      scheduledGames: 1,
      inProgressGames: 1,
      finalGames: 1,
      allGamesFinal: false,
    });
  });

  it('fills missing live rows with zero-yard scheduled placeholders for the frozen slate', () => {
    const rowsByProviderKey = new Map([
      [
        buildProviderRowKey('1', '100'),
        {
          passingYards: 240,
          passingTouchdowns: 2,
          gameStatus: 'in_progress' as const,
        },
      ],
    ]);

    expect(
      buildProvisionalOrderSourceRows(
        [
          {
            playerId: 'qb-a',
            providerPlayerId: '1',
            providerGameId: '100',
            displayName: 'Player A',
            teamAbbreviation: 'BUF',
            opponentAbbreviation: 'BAL',
            homeAway: 'home',
          },
          {
            playerId: 'qb-b',
            providerPlayerId: '2',
            providerGameId: '200',
            displayName: 'Player B',
            teamAbbreviation: 'BAL',
            opponentAbbreviation: 'BUF',
            homeAway: 'away',
          },
        ],
        rowsByProviderKey,
      ),
    ).toEqual([
      expect.objectContaining({
        playerId: 'qb-a',
        passingYards: 240,
        passingTouchdowns: 2,
        gameStatus: 'in_progress',
      }),
      expect.objectContaining({
        playerId: 'qb-b',
        passingYards: 0,
        passingTouchdowns: 0,
        gameStatus: 'scheduled',
      }),
    ]);
  });
});
