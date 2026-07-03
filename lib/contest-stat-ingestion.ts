import type { ContestSummary } from '@/lib/contest-data';
import { buildFinalStatTemplate } from '@/lib/contest-finalization';
import type { ContestPlayerStatInput } from '@/lib/contest-scoring';
import { resolveStatsProviderAdapter, type StatsProviderMode } from '@/lib/stats-provider';

export type ContestStatIngestionPreview = {
  rows: string;
  status: 'provider_ready' | 'manual_only';
  sourceLabel: string;
  helperText: string;
};

type ContestStatIngestionOptions = {
  providerMode?: StatsProviderMode;
  providerStoreFilePath?: string;
  persistedSnapshotFilePath?: string;
};

export async function buildContestStatIngestionPreview(
  contest: Pick<ContestSummary, 'id' | 'title' | 'slatePlayers'>,
  options?: ContestStatIngestionOptions,
): Promise<ContestStatIngestionPreview> {
  const manualTemplate = buildFinalStatTemplate(contest);

  try {
    const result = await loadProviderBackedFinalStats(contest, options);

    return {
      rows: buildFinalStatRows(result.finalStats),
      status: 'provider_ready',
      sourceLabel: `${result.providerName} snapshot`,
      helperText: `Prefilled from ${result.providerName} at ${formatSnapshotTime(result.providerSnapshotTime)}. Review before typing FINAL.`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Provider-backed stat prefill is unavailable.';

    return {
      rows: manualTemplate,
      status: 'manual_only',
      sourceLabel: 'Manual entry',
      helperText: `${message} Paste or edit the confirmed rows manually, then type FINAL to publish results.`,
    };
  }
}

export async function loadProviderBackedFinalStats(
  contest: Pick<ContestSummary, 'id' | 'title' | 'slatePlayers'>,
  options?: ContestStatIngestionOptions,
): Promise<{
  providerName: string;
  providerSnapshotTime: string;
  finalStats: ContestPlayerStatInput[];
}> {
  const adapter = resolveStatsProviderAdapter(options);
  const snapshot = await adapter.getContestStatSnapshot(contest);
  const rowsByProviderKey = new Map(
    snapshot.rows.map((row) => [`${row.providerPlayerId}::${row.providerGameId}`, row] as const),
  );

  const finalStats = contest.slatePlayers.map((player) => {
    const providerRow = rowsByProviderKey.get(`${player.providerPlayerId}::${player.providerGameId}`);

    if (!providerRow) {
      throw new Error(`Provider snapshot is missing ${player.displayName}.`);
    }

    if (providerRow.gameStatus !== 'final') {
      throw new Error(`Provider snapshot still shows ${player.displayName} as ${providerRow.gameStatus}.`);
    }

    return {
      playerId: player.playerId,
      playerName: player.displayName,
      finalStat: providerRow.finalStat,
      passingTouchdowns: providerRow.passingTouchdowns,
    } satisfies ContestPlayerStatInput;
  });

  return {
    providerName: snapshot.providerName,
    providerSnapshotTime: snapshot.providerSnapshotTime,
    finalStats,
  };
}

function buildFinalStatRows(finalStats: ContestPlayerStatInput[]) {
  return finalStats
    .map((stat) => `${stat.playerId}|${stat.playerName}|${stat.finalStat}|${stat.passingTouchdowns}`)
    .join('\n');
}

function formatSnapshotTime(snapshotTime: string) {
  return new Date(snapshotTime).toLocaleString();
}
