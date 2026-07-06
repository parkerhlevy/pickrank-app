import {
  getLatestProvisionalContestStatSnapshot,
  type ProvisionalContestStatSnapshot,
} from '@/lib/stats-provider';

export type ProvisionalStatsPreview = {
  status: 'snapshot_ready' | 'snapshot_missing';
  sourceLabel: string;
  helperText: string;
  gameCounts: {
    total: number;
    scheduled: number;
    inProgress: number;
    final: number;
    allFinal: boolean;
  };
  rows: Array<{
    playerId: string;
    playerName: string;
    teamAbbreviation: string;
    opponentAbbreviation: string;
    homeAway: 'home' | 'away';
    passingYards: number;
    passingTouchdowns: number;
    gameStatus: 'scheduled' | 'in_progress' | 'final';
    provisionalRankDisplay: string;
  }>;
};

export async function buildProvisionalStatsPreview(
  contestId: string,
  loadSnapshot: (contestId: string) => Promise<ProvisionalContestStatSnapshot> = getLatestProvisionalContestStatSnapshot,
): Promise<ProvisionalStatsPreview> {
  try {
    const snapshot = await loadSnapshot(contestId);
    return formatProvisionalStatsPreview(snapshot);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Latest saved provisional snapshot is unavailable.';

    return {
      status: 'snapshot_missing',
      sourceLabel: 'No saved provisional snapshot yet',
      helperText: `${message} Run the internal Replay validation harness or refresh path before using this preview.`,
      gameCounts: {
        total: 0,
        scheduled: 0,
        inProgress: 0,
        final: 0,
        allFinal: false,
      },
      rows: [],
    };
  }
}

export function formatProvisionalStatsPreview(
  snapshot: ProvisionalContestStatSnapshot,
): ProvisionalStatsPreview {
  return {
    status: 'snapshot_ready',
    sourceLabel: `${snapshot.providerName} provisional snapshot`,
    helperText: `Latest saved provisional order from ${snapshot.providerName} at ${formatSnapshotTime(snapshot.providerSnapshotTime)}. Internal preview only. Official results still require the separate FINAL-confirmed publish path.`,
    gameCounts: {
      total: snapshot.gamesTotal,
      scheduled: snapshot.gamesScheduled,
      inProgress: snapshot.gamesInProgress,
      final: snapshot.gamesFinal,
      allFinal: snapshot.allGamesFinal,
    },
    rows: snapshot.rows.map((row) => ({
      playerId: row.playerId,
      playerName: row.playerName,
      teamAbbreviation: row.teamAbbreviation,
      opponentAbbreviation: row.opponentAbbreviation,
      homeAway: row.homeAway,
      passingYards: row.passingYards,
      passingTouchdowns: row.passingTouchdowns,
      gameStatus: row.gameStatus,
      provisionalRankDisplay: row.provisionalRankDisplay,
    })),
  };
}

function formatSnapshotTime(snapshotTime: string) {
  return new Date(snapshotTime).toLocaleString();
}
