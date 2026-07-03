import type { ContestSummary } from '@/lib/contest-data';
import type { ContestPlayerStatInput } from '@/lib/contest-scoring';

const finalizableStatuses = new Set(['locked', 'live', 'finalizing', 'final']);

export function canFinalizeContestStatus(status: ContestSummary['contestStatus']) {
  return finalizableStatuses.has(status);
}

export function buildFinalStatTemplate(contest: Pick<ContestSummary, 'slatePlayers'>) {
  return contest.slatePlayers.map((player) => `${player.playerId}|${player.displayName}||`).join('\n');
}

export function parseFinalStatRows({
  contest,
  rawRows,
}: {
  contest: Pick<ContestSummary, 'slatePlayers' | 'slateSize' | 'title'>;
  rawRows: string;
}) {
  const rows = rawRows
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length !== contest.slatePlayers.length) {
    throw new Error(`Add ${contest.slatePlayers.length} final stat rows before running results.`);
  }

  const slatePlayersById = new Map(contest.slatePlayers.map((player) => [player.playerId, player]));
  const seenPlayerIds = new Set<string>();

  return rows.map((row, index) => {
    const columns = row.split('|').map((value) => value.trim());

    if (columns.length !== 4) {
      throw new Error(
        `Final stat row ${index + 1} must use playerId|playerName|passingYards|passingTouchdowns.`,
      );
    }

    const [playerId, playerName, finalStatRaw, passingTouchdownsRaw] = columns;
    const slatePlayer = slatePlayersById.get(playerId);

    if (!slatePlayer) {
      throw new Error(`Final stat row ${index + 1} uses an unknown playerId: ${playerId}.`);
    }

    if (seenPlayerIds.has(playerId)) {
      throw new Error(`Final stat row ${index + 1} duplicates ${playerId}.`);
    }

    if (playerName !== slatePlayer.displayName) {
      throw new Error(
        `Final stat row ${index + 1} must keep the saved player name for ${playerId}. Expected "${slatePlayer.displayName}".`,
      );
    }

    const finalStat = Number.parseInt(finalStatRaw, 10);
    const passingTouchdowns = Number.parseInt(passingTouchdownsRaw, 10);

    if (!Number.isInteger(finalStat) || finalStat < 0) {
      throw new Error(`Final stat row ${index + 1} must end with a non-negative whole-number passing-yard total.`);
    }

    if (!Number.isInteger(passingTouchdowns) || passingTouchdowns < 0) {
      throw new Error(`Final stat row ${index + 1} must end with a non-negative whole-number passing-touchdown total.`);
    }

    seenPlayerIds.add(playerId);

    return {
      playerId,
      playerName,
      finalStat,
      passingTouchdowns,
    } satisfies ContestPlayerStatInput;
  });
}
