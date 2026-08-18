import { describe, expect, it } from 'vitest';
import {
  buildProvisionalStatsPreview,
  formatProvisionalStatsPreview,
} from '../../lib/provisional-stats-preview';

describe('provisional stats preview', () => {
  it('formats the saved provisional snapshot into admin preview counts and ordered rows', async () => {
    const preview = formatProvisionalStatsPreview({
      snapshotId: 'snapshot-1',
      snapshotKind: 'provisional_order',
      contestId: 'week-1-qb-passing-yards-private-validation',
      providerKey: 'candidate_provider',
      providerName: 'Candidate provider',
      providerSnapshotTime: '2026-07-04T14:30:00.000Z',
      createdAt: '2026-07-04T14:31:00.000Z',
      status: 'validated',
      gamesTotal: 10,
      gamesScheduled: 2,
      gamesInProgress: 3,
      gamesFinal: 5,
      allGamesFinal: false,
      metadata: null,
      rows: [
        {
          playerId: 'qb-josh-allen',
          providerPlayerId: '19801',
          providerGameId: '19067',
          playerName: 'Josh Allen',
          teamAbbreviation: 'BUF',
          opponentAbbreviation: 'BAL',
          homeAway: 'home',
          passingYards: 394,
          passingTouchdowns: 3,
          gameStatus: 'final',
          provisionalRank: 1,
          provisionalRankMin: 1,
          provisionalRankMax: 1,
          provisionalRankDisplay: '1',
          sortOrder: 1,
        },
        {
          playerId: 'qb-justin-herbert',
          providerPlayerId: '21681',
          providerGameId: '19054',
          playerName: 'Justin Herbert',
          teamAbbreviation: 'LAC',
          opponentAbbreviation: 'KC',
          homeAway: 'home',
          passingYards: 318,
          passingTouchdowns: 2,
          gameStatus: 'in_progress',
          provisionalRank: 2,
          provisionalRankMin: 2,
          provisionalRankMax: 2,
          provisionalRankDisplay: '2',
          sortOrder: 2,
        },
      ],
    });

    expect(preview).toEqual(
      expect.objectContaining({
        status: 'snapshot_ready',
        sourceLabel: 'Candidate provider provisional snapshot',
        gameCounts: {
          total: 10,
          scheduled: 2,
          inProgress: 3,
          final: 5,
          allFinal: false,
        },
        rows: [
          expect.objectContaining({
            playerId: 'qb-josh-allen',
            provisionalRankDisplay: '1',
            passingYards: 394,
            gameStatus: 'final',
          }),
          expect.objectContaining({
            playerId: 'qb-justin-herbert',
            provisionalRankDisplay: '2',
            passingYards: 318,
            gameStatus: 'in_progress',
          }),
        ],
      }),
    );
    expect(preview.helperText).toContain('FINAL-confirmed publish path');
  });

  it('returns a safe empty preview when no saved provisional snapshot is available', async () => {
    const preview = await buildProvisionalStatsPreview('week-1-qb-passing-yards-private-validation', async () => {
      throw new Error('Persisted provisional stat snapshot is not available yet for week-1-qb-passing-yards-private-validation.');
    });

    expect(preview).toEqual(
      expect.objectContaining({
        status: 'snapshot_missing',
        sourceLabel: 'No saved provisional snapshot yet',
        rows: [],
        gameCounts: {
          total: 0,
          scheduled: 0,
          inProgress: 0,
          final: 0,
          allFinal: false,
        },
      }),
    );
    expect(preview.helperText).toContain('Load a private provisional snapshot');
  });
});
