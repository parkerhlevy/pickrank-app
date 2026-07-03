import type { ContestSlatePlayerHomeAway } from '@/lib/contest-data';

export type ProvisionalGameStatus = 'scheduled' | 'in_progress' | 'final';

export type ProvisionalOrderSourceRow = {
  playerId: string;
  providerPlayerId: string;
  providerGameId: string;
  playerName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: ContestSlatePlayerHomeAway;
  passingYards: number;
  passingTouchdowns: number;
  gameStatus: ProvisionalGameStatus;
};

export type ProvisionalOrderRow = ProvisionalOrderSourceRow & {
  provisionalRank: number;
  provisionalRankMin: number;
  provisionalRankMax: number;
  provisionalRankDisplay: string;
  sortOrder: number;
};

export type ProvisionalOrderGameSummary = {
  totalGames: number;
  scheduledGames: number;
  inProgressGames: number;
  finalGames: number;
  allGamesFinal: boolean;
};

export function buildProvisionalOrderRows(rows: ProvisionalOrderSourceRow[]): ProvisionalOrderRow[] {
  const sortedRows = [...rows].sort(compareProvisionalRows);
  const result: ProvisionalOrderRow[] = [];
  let currentRank = 1;
  let cursor = 0;

  while (cursor < sortedRows.length) {
    const row = sortedRows[cursor];
    const tieGroup = [row];
    let nextIndex = cursor + 1;

    while (nextIndex < sortedRows.length && sortedRows[nextIndex].passingYards === row.passingYards) {
      tieGroup.push(sortedRows[nextIndex]);
      nextIndex += 1;
    }

    const rankMin = currentRank;
    const rankMax = currentRank + tieGroup.length - 1;
    const rankDisplay = tieGroup.length > 1 ? `T-${rankMin}` : `${rankMin}`;

    tieGroup.forEach((tieRow, tieIndex) => {
      result.push({
        ...tieRow,
        provisionalRank: rankMin,
        provisionalRankMin: rankMin,
        provisionalRankMax: rankMax,
        provisionalRankDisplay: rankDisplay,
        sortOrder: cursor + tieIndex + 1,
      });
    });

    currentRank = rankMax + 1;
    cursor = nextIndex;
  }

  return result;
}

export function summarizeProvisionalGames(rows: Pick<ProvisionalOrderSourceRow, 'providerGameId' | 'gameStatus'>[]): ProvisionalOrderGameSummary {
  const uniqueGames = new Map<string, ProvisionalGameStatus>();

  rows.forEach((row) => {
    const currentStatus = uniqueGames.get(row.providerGameId);

    if (!currentStatus || compareGameStatusPriority(row.gameStatus, currentStatus) > 0) {
      uniqueGames.set(row.providerGameId, row.gameStatus);
    }
  });

  const statuses = [...uniqueGames.values()];
  const scheduledGames = statuses.filter((status) => status === 'scheduled').length;
  const inProgressGames = statuses.filter((status) => status === 'in_progress').length;
  const finalGames = statuses.filter((status) => status === 'final').length;

  return {
    totalGames: statuses.length,
    scheduledGames,
    inProgressGames,
    finalGames,
    allGamesFinal: statuses.length > 0 && finalGames === statuses.length,
  };
}

export function buildProvisionalOrderSourceRows(
  slatePlayers: Array<{
    playerId: string;
    providerPlayerId: string;
    providerGameId: string;
    displayName: string;
    teamAbbreviation: string;
    opponentAbbreviation: string;
    homeAway: ContestSlatePlayerHomeAway;
  }>,
  rowsByProviderKey: Map<string, Pick<ProvisionalOrderSourceRow, 'passingYards' | 'passingTouchdowns' | 'gameStatus'>>,
): ProvisionalOrderSourceRow[] {
  return slatePlayers.map((player) => {
    const row = rowsByProviderKey.get(buildProviderRowKey(player.providerPlayerId, player.providerGameId));

    return {
      playerId: player.playerId,
      providerPlayerId: player.providerPlayerId,
      providerGameId: player.providerGameId,
      playerName: player.displayName,
      teamAbbreviation: player.teamAbbreviation,
      opponentAbbreviation: player.opponentAbbreviation,
      homeAway: player.homeAway,
      passingYards: row?.passingYards ?? 0,
      passingTouchdowns: row?.passingTouchdowns ?? 0,
      gameStatus: row?.gameStatus ?? 'scheduled',
    };
  });
}

export function buildProviderRowKey(providerPlayerId: string, providerGameId: string) {
  return `${providerPlayerId}::${providerGameId}`;
}

function compareProvisionalRows(left: ProvisionalOrderSourceRow, right: ProvisionalOrderSourceRow) {
  if (right.passingYards !== left.passingYards) {
    return right.passingYards - left.passingYards;
  }

  return left.playerName.localeCompare(right.playerName);
}

function compareGameStatusPriority(left: ProvisionalGameStatus, right: ProvisionalGameStatus) {
  return gameStatusPriority(left) - gameStatusPriority(right);
}

function gameStatusPriority(status: ProvisionalGameStatus) {
  switch (status) {
    case 'final':
      return 2;
    case 'in_progress':
      return 1;
    default:
      return 0;
  }
}
