import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildContestStatIngestionPreview,
  loadProviderBackedFinalStats,
} from '../../lib/contest-stat-ingestion';
import {
  FileStatsProviderAdapter,
  PersistedStatsSnapshotAdapter,
  resolveStatsProviderAdapter,
} from '../../lib/stats-provider';

const contest = {
  id: 'week-1-qb-passing-yards',
  title: 'Week 1 QB Passing Yards',
  slatePlayers: [
    {
      playerId: 'qb-josh-allen',
      providerPlayerId: 'provider-qb-josh-allen',
      providerGameId: 'buf-bal-2026-wk1',
      displayName: 'Josh Allen',
      teamAbbreviation: 'BUF',
      opponentAbbreviation: 'BAL',
      homeAway: 'home' as const,
      gameStartTime: '2026-09-04T00:20:00.000Z',
      position: 'QB' as const,
      activeStatus: 'active',
      sortOrderInternal: 1,
    },
    {
      playerId: 'qb-lamar-jackson',
      providerPlayerId: 'provider-qb-lamar-jackson',
      providerGameId: 'bal-buf-2026-wk1',
      displayName: 'Lamar Jackson',
      teamAbbreviation: 'BAL',
      opponentAbbreviation: 'BUF',
      homeAway: 'away' as const,
      gameStartTime: '2026-09-04T00:20:00.000Z',
      position: 'QB' as const,
      activeStatus: 'active',
      sortOrderInternal: 2,
    },
  ],
};

async function writeProviderStore(payload: unknown) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-provider-stats-'));
  const providerStoreFilePath = path.join(tempDirectory, 'provider-stats.json');

  await writeFile(providerStoreFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return providerStoreFilePath;
}

async function writePersistedSnapshotStore(payload: unknown) {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-stat-snapshots-'));
  const persistedSnapshotFilePath = path.join(tempDirectory, 'contest-stat-snapshots.json');

  await writeFile(persistedSnapshotFilePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  return persistedSnapshotFilePath;
}

describe('contest stat ingestion preview', () => {
  it('resolves the file-backed provider adapter when configured', async () => {
    const providerStoreFilePath = await writeProviderStore({
      version: 1,
      contests: [
        {
          contestId: contest.id,
          providerName: 'Mock Stats Feed',
          providerSnapshotTime: '2026-09-09T00:00:00.000Z',
          rows: [],
        },
      ],
    });

    const adapter = resolveStatsProviderAdapter({
      providerMode: 'file',
      providerStoreFilePath,
    });

    expect(adapter).toBeInstanceOf(FileStatsProviderAdapter);
    await expect(adapter.getContestStatSnapshot(contest)).resolves.toEqual(
      expect.objectContaining({
        contestId: contest.id,
        providerName: 'Mock Stats Feed',
      }),
    );
  });

  it('resolves the persisted snapshot adapter when configured', async () => {
    const persistedSnapshotFilePath = await writePersistedSnapshotStore({
      version: 1,
      snapshots: [
        {
          snapshotId: 'snapshot-1',
          contestId: contest.id,
          providerName: 'Stored Stats Feed',
          providerSnapshotTime: '2026-09-09T00:00:00.000Z',
          createdAt: '2026-09-09T00:05:00.000Z',
          status: 'validated',
          rows: [],
        },
      ],
    });

    const adapter = resolveStatsProviderAdapter({
      providerMode: 'persisted_snapshot',
      persistedSnapshotFilePath,
    });

    expect(adapter).toBeInstanceOf(PersistedStatsSnapshotAdapter);
    await expect(adapter.getContestStatSnapshot(contest)).resolves.toEqual(
      expect.objectContaining({
        contestId: contest.id,
        providerName: 'Stored Stats Feed',
      }),
    );
  });

  it('prefills final stat rows from a provider snapshot when every slate game is final', async () => {
    const providerStoreFilePath = await writeProviderStore({
      version: 1,
      contests: [
        {
          contestId: contest.id,
          providerName: 'Mock Stats Feed',
          providerSnapshotTime: '2026-09-09T00:00:00.000Z',
          rows: [
            {
              providerPlayerId: 'provider-qb-josh-allen',
              providerGameId: 'buf-bal-2026-wk1',
              playerName: 'Josh Allen',
              finalStat: 325,
              passingTouchdowns: 3,
              gameStatus: 'final',
            },
            {
              providerPlayerId: 'provider-qb-lamar-jackson',
              providerGameId: 'bal-buf-2026-wk1',
              playerName: 'Lamar Jackson',
              finalStat: 330,
              passingTouchdowns: 4,
              gameStatus: 'final',
            },
          ],
        },
      ],
    });

    await expect(
      loadProviderBackedFinalStats(contest, {
        providerMode: 'file',
        providerStoreFilePath,
      }),
    ).resolves.toEqual({
      providerName: 'Mock Stats Feed',
      providerSnapshotTime: '2026-09-09T00:00:00.000Z',
      finalStats: [
        { playerId: 'qb-josh-allen', playerName: 'Josh Allen', finalStat: 325, passingTouchdowns: 3 },
        { playerId: 'qb-lamar-jackson', playerName: 'Lamar Jackson', finalStat: 330, passingTouchdowns: 4 },
      ],
    });

    await expect(
      buildContestStatIngestionPreview(contest, {
        providerMode: 'file',
        providerStoreFilePath,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'provider_ready',
        sourceLabel: 'Mock Stats Feed snapshot',
        rows: ['qb-josh-allen|Josh Allen|325|3', 'qb-lamar-jackson|Lamar Jackson|330|4'].join('\n'),
      }),
    );
  });

  it('falls back to the manual template when provider data is missing or not final', async () => {
    const providerStoreFilePath = await writeProviderStore({
      version: 1,
      contests: [
        {
          contestId: contest.id,
          providerName: 'Mock Stats Feed',
          providerSnapshotTime: '2026-09-08T23:30:00.000Z',
          rows: [
            {
              providerPlayerId: 'provider-qb-josh-allen',
              providerGameId: 'buf-bal-2026-wk1',
              playerName: 'Josh Allen',
              finalStat: 325,
              passingTouchdowns: 3,
              gameStatus: 'final',
            },
            {
              providerPlayerId: 'provider-qb-lamar-jackson',
              providerGameId: 'bal-buf-2026-wk1',
              playerName: 'Lamar Jackson',
              finalStat: 330,
              passingTouchdowns: 4,
              gameStatus: 'in_progress',
            },
          ],
        },
      ],
    });

    await expect(
      buildContestStatIngestionPreview(contest, {
        providerMode: 'file',
        providerStoreFilePath,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'manual_only',
        sourceLabel: 'Manual entry',
        rows: ['qb-josh-allen|Josh Allen||', 'qb-lamar-jackson|Lamar Jackson||'].join('\n'),
        helperText: expect.stringContaining('still shows Lamar Jackson as in_progress'),
      }),
    );
  });

  it('falls back to the manual template when provider-backed prefill is disabled', async () => {
    await expect(
      buildContestStatIngestionPreview(contest, {
        providerMode: 'disabled',
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'manual_only',
        sourceLabel: 'Manual entry',
        rows: ['qb-josh-allen|Josh Allen||', 'qb-lamar-jackson|Lamar Jackson||'].join('\n'),
        helperText: expect.stringContaining('not configured yet'),
      }),
    );
  });

  it('prefills final stat rows from the latest validated persisted snapshot', async () => {
    const persistedSnapshotFilePath = await writePersistedSnapshotStore({
      version: 1,
      snapshots: [
        {
          snapshotId: 'snapshot-failed',
          contestId: contest.id,
          providerName: 'Stored Stats Feed',
          providerSnapshotTime: '2026-09-09T00:10:00.000Z',
          createdAt: '2026-09-09T00:10:30.000Z',
          status: 'failed',
          rows: [],
        },
        {
          snapshotId: 'snapshot-older',
          contestId: contest.id,
          providerName: 'Stored Stats Feed',
          providerSnapshotTime: '2026-09-09T00:00:00.000Z',
          createdAt: '2026-09-09T00:00:30.000Z',
          status: 'validated',
          rows: [
            {
              providerPlayerId: 'provider-qb-josh-allen',
              providerGameId: 'buf-bal-2026-wk1',
              playerName: 'Josh Allen',
              finalStat: 320,
              passingTouchdowns: 2,
              gameStatus: 'final',
            },
            {
              providerPlayerId: 'provider-qb-lamar-jackson',
              providerGameId: 'bal-buf-2026-wk1',
              playerName: 'Lamar Jackson',
              finalStat: 315,
              passingTouchdowns: 3,
              gameStatus: 'final',
            },
          ],
        },
        {
          snapshotId: 'snapshot-latest',
          contestId: contest.id,
          providerName: 'Stored Stats Feed',
          providerSnapshotTime: '2026-09-09T00:15:00.000Z',
          createdAt: '2026-09-09T00:15:30.000Z',
          status: 'validated',
          rows: [
            {
              providerPlayerId: 'provider-qb-josh-allen',
              providerGameId: 'buf-bal-2026-wk1',
              playerName: 'Josh Allen',
              finalStat: 325,
              passingTouchdowns: 3,
              gameStatus: 'final',
            },
            {
              providerPlayerId: 'provider-qb-lamar-jackson',
              providerGameId: 'bal-buf-2026-wk1',
              playerName: 'Lamar Jackson',
              finalStat: 330,
              passingTouchdowns: 4,
              gameStatus: 'final',
            },
          ],
        },
      ],
    });

    await expect(
      loadProviderBackedFinalStats(contest, {
        providerMode: 'persisted_snapshot',
        persistedSnapshotFilePath,
      }),
    ).resolves.toEqual({
      providerName: 'Stored Stats Feed',
      providerSnapshotTime: '2026-09-09T00:15:00.000Z',
      finalStats: [
        { playerId: 'qb-josh-allen', playerName: 'Josh Allen', finalStat: 325, passingTouchdowns: 3 },
        { playerId: 'qb-lamar-jackson', playerName: 'Lamar Jackson', finalStat: 330, passingTouchdowns: 4 },
      ],
    });

    await expect(
      buildContestStatIngestionPreview(contest, {
        providerMode: 'persisted_snapshot',
        persistedSnapshotFilePath,
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        status: 'provider_ready',
        sourceLabel: 'Stored Stats Feed snapshot',
        rows: ['qb-josh-allen|Josh Allen|325|3', 'qb-lamar-jackson|Lamar Jackson|330|4'].join('\n'),
      }),
    );
  });
});
