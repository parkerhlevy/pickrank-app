import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { getLatestProvisionalContestStatSnapshot } from '../../lib/stats-provider';

describe('provisional stats snapshot reader', () => {
  it('loads the latest validated snapshot without coupling to a provider brand', async () => {
    const directory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-provisional-snapshots-'));
    const filePath = path.join(directory, 'contest-provisional-snapshots.json');

    await writeFile(
      filePath,
      JSON.stringify({
        version: 1,
        snapshots: [
          {
            snapshotId: 'snapshot-1',
            snapshotKind: 'provisional_order',
            contestId: 'week-1-qb-passing-yards',
            providerKey: 'candidate_provider',
            providerName: 'Candidate provider',
            providerSnapshotTime: '2026-09-04T01:00:00.000Z',
            createdAt: '2026-09-04T01:01:00.000Z',
            status: 'validated',
            gamesTotal: 1,
            gamesScheduled: 0,
            gamesInProgress: 1,
            gamesFinal: 0,
            allGamesFinal: false,
            metadata: null,
            rows: [
              {
                playerId: 'qb-josh-allen',
                providerPlayerId: 'provider-player-1',
                providerGameId: 'provider-game-1',
                playerName: 'Josh Allen',
                teamAbbreviation: 'BUF',
                opponentAbbreviation: 'BAL',
                homeAway: 'home',
                passingYards: 250,
                passingTouchdowns: 2,
                gameStatus: 'in_progress',
                provisionalRank: 1,
                provisionalRankMin: 1,
                provisionalRankMax: 1,
                provisionalRankDisplay: '1',
                sortOrder: 1,
              },
            ],
          },
        ],
      }),
      'utf8',
    );

    await expect(getLatestProvisionalContestStatSnapshot('week-1-qb-passing-yards', filePath)).resolves.toEqual(
      expect.objectContaining({
        providerKey: 'candidate_provider',
        providerName: 'Candidate provider',
        rows: [expect.objectContaining({ passingYards: 250 })],
      }),
    );
  });
});
