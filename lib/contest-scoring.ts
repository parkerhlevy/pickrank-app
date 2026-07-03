import { z } from 'zod';
import type { ContestSlatePlayer } from '@/lib/contest-data';

export const scoringVersion = 'rank_differential_v2';

const contestPlayerFinalStatSchema = z.object({
  playerId: z.string().min(1),
  providerPlayerId: z.string().min(1),
  playerName: z.string().min(1),
  teamAbbreviation: z.string().min(1),
  finalStat: z.number().int(),
  passingTouchdowns: z.number().int().nonnegative(),
  actualRank: z.number().int().positive(),
  actualRankDisplay: z.string().min(1),
  actualRankMin: z.number().int().positive(),
  actualRankMax: z.number().int().positive(),
  gameId: z.string().min(1),
  gameStatus: z.literal('final'),
  statFinalizedAt: z.string().datetime(),
});

const entryPlayerScoreSchema = z.object({
  entryId: z.string().min(1),
  contestId: z.string().min(1),
  playerId: z.string().min(1),
  playerName: z.string().min(1),
  userRank: z.number().int().positive(),
  actualRankMin: z.number().int().positive(),
  actualRankMax: z.number().int().positive(),
  actualRankDisplay: z.string().min(1),
  distance: z.number().int().nonnegative(),
  pointsAwarded: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

const scoredEntrySchema = z.object({
  entryId: z.string().min(1),
  contestId: z.string().min(1),
  userId: z.string().min(1),
  lineupOrder: z.array(z.string().min(1)).length(10),
  totalScore: z.number().int().nonnegative(),
  exactPicks: z.number().int().nonnegative(),
  oneOffOrBetterPicks: z.number().int().nonnegative(),
  actualQb1Distance: z.number().int().nonnegative().nullable(),
  selectedQb1PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb2PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb3PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb4PassingTouchdowns: z.number().int().nonnegative().nullable(),
  selectedQb5PassingTouchdowns: z.number().int().nonnegative().nullable(),
  finalRank: z.number().int().positive(),
  finalRankDisplay: z.string().min(1),
  isTied: z.boolean(),
  tieGroupId: z.string().min(1).nullable(),
  tieGroupSize: z.number().int().positive(),
  payoutAmountCents: z.number().int().nonnegative(),
  payoutStatus: z.enum(['pending', 'paid']),
  scoreFinalizedAt: z.string().datetime(),
  scoringVersion: z.literal(scoringVersion),
  playerScores: z.array(entryPlayerScoreSchema).length(10),
});

export type ContestPlayerFinalStat = z.infer<typeof contestPlayerFinalStatSchema>;
export type EntryPlayerScore = z.infer<typeof entryPlayerScoreSchema>;
export type ScoredEntry = z.infer<typeof scoredEntrySchema>;
export type LeaderboardTiebreakSummary = {
  entryId: string;
  totalScore: number;
  exactPicks: number;
  oneOffOrBetterPicks: number;
  actualQb1Distance: number | null;
  selectedQb1PassingTouchdowns: number | null;
  selectedQb2PassingTouchdowns: number | null;
  selectedQb3PassingTouchdowns: number | null;
  selectedQb4PassingTouchdowns: number | null;
  selectedQb5PassingTouchdowns: number | null;
};

export type ContestPlayerStatInput = {
  playerId?: string;
  providerPlayerId?: string;
  playerName?: string;
  finalStat: number;
  passingTouchdowns: number;
  gameStatus?: 'final';
};

export type ContestEntryForScoring = {
  entryId: string;
  contestId: string;
  userId: string;
  lineupOrder: string[];
};

const payoutPercentages = [0.5, 0.3, 0.2] as const;

export function buildContestPlayerResults({
  slatePlayers,
  finalStats,
  finalizedAt,
}: {
  slatePlayers: ContestSlatePlayer[];
  finalStats: ContestPlayerStatInput[];
  finalizedAt: string;
}) {
  const statsByPlayerId = new Map<string, ContestPlayerStatInput>();
  const statsByProviderPlayerId = new Map<string, ContestPlayerStatInput>();
  const statsByPlayerName = new Map<string, ContestPlayerStatInput>();

  for (const stat of finalStats) {
    if (stat.playerId) {
      statsByPlayerId.set(stat.playerId, stat);
    }
    if (stat.providerPlayerId) {
      statsByProviderPlayerId.set(stat.providerPlayerId, stat);
    }
    if (stat.playerName) {
      statsByPlayerName.set(stat.playerName, stat);
    }
  }

  const rows = slatePlayers.map((player) => {
    const stat =
      statsByPlayerId.get(player.playerId) ||
      statsByProviderPlayerId.get(player.providerPlayerId) ||
      statsByPlayerName.get(player.displayName);

    if (!stat) {
      throw new Error(`Missing final stat for ${player.displayName}.`);
    }

    if (!Number.isInteger(stat.finalStat)) {
      throw new Error(`Final stat for ${player.displayName} must be an integer.`);
    }

    if (!Number.isInteger(stat.passingTouchdowns) || stat.passingTouchdowns < 0) {
      throw new Error(`Passing touchdowns for ${player.displayName} must be a non-negative integer.`);
    }

    return {
      player,
      finalStat: stat.finalStat,
      passingTouchdowns: stat.passingTouchdowns,
    };
  });

  const sorted = rows.sort(
    (left, right) =>
      right.finalStat - left.finalStat ||
      left.player.displayName.localeCompare(right.player.displayName) ||
      left.player.playerId.localeCompare(right.player.playerId),
  );

  const results: ContestPlayerFinalStat[] = [];
  let index = 0;

  while (index < sorted.length) {
    let end = index;
    while (end + 1 < sorted.length && sorted[end + 1]?.finalStat === sorted[index]?.finalStat) {
      end += 1;
    }

    const actualRankMin = index + 1;
    const actualRankMax = end + 1;
    const actualRankDisplay = actualRankMin === actualRankMax ? String(actualRankMin) : `T-${actualRankMin}`;

    for (let playerIndex = index; playerIndex <= end; playerIndex += 1) {
      const { player, finalStat, passingTouchdowns } = sorted[playerIndex]!;
      results.push(
        contestPlayerFinalStatSchema.parse({
          playerId: player.playerId,
          providerPlayerId: player.providerPlayerId,
          playerName: player.displayName,
          teamAbbreviation: player.teamAbbreviation,
          finalStat,
          passingTouchdowns,
          actualRank: actualRankMin,
          actualRankDisplay,
          actualRankMin,
          actualRankMax,
          gameId: player.providerGameId,
          gameStatus: 'final',
          statFinalizedAt: finalizedAt,
        }),
      );
    }

    index = end + 1;
  }

  return results;
}

export function scoreContestEntries({
  contestId,
  entries,
  playerResults,
  finalizedAt,
  prizePoolCents,
}: {
  contestId: string;
  entries: ContestEntryForScoring[];
  playerResults: ContestPlayerFinalStat[];
  finalizedAt: string;
  prizePoolCents: number;
}) {
  const playerResultsByName = new Map(playerResults.map((playerResult) => [playerResult.playerName, playerResult]));
  const payoutSlots = buildPayoutSlots(prizePoolCents);

  const prelim = entries.map((entry) => {
    const playerScores = entry.lineupOrder.map((playerName, index) => {
      const playerResult = playerResultsByName.get(playerName);

      if (!playerResult) {
        throw new Error(`Missing finalized result for lineup player ${playerName}.`);
      }

      const userRank = index + 1;
      const distance = getDistanceToActualRange(userRank, playerResult.actualRankMin, playerResult.actualRankMax);

      return entryPlayerScoreSchema.parse({
        entryId: entry.entryId,
        contestId,
        playerId: playerResult.playerId,
        playerName: playerResult.playerName,
        userRank,
        actualRankMin: playerResult.actualRankMin,
        actualRankMax: playerResult.actualRankMax,
        actualRankDisplay: playerResult.actualRankDisplay,
        distance,
        pointsAwarded: distance,
        createdAt: finalizedAt,
      });
    });

    const totalScore = playerScores.reduce((sum, playerScore) => sum + playerScore.pointsAwarded, 0);
    const exactPicks = playerScores.filter((playerScore) => playerScore.distance === 0).length;
    const oneOffOrBetterPicks = playerScores.filter((playerScore) => playerScore.distance <= 1).length;
    const actualQb1Distances = playerScores
      .filter((playerScore) => playerScore.actualRankMin === 1)
      .map((playerScore) => playerScore.distance);
    const selectedQbTouchdownTiebreakers = entry.lineupOrder.slice(0, 5).map((playerName) => {
      const playerResult = playerResultsByName.get(playerName);
      return playerResult?.passingTouchdowns ?? Number.NEGATIVE_INFINITY;
    });

    return {
      ...entry,
      playerScores,
      totalScore,
      exactPicks,
      oneOffOrBetterPicks,
      actualQb1Distance:
        actualQb1Distances.length > 0 ? Math.min(...actualQb1Distances) : Number.POSITIVE_INFINITY,
      selectedQb1PassingTouchdowns: selectedQbTouchdownTiebreakers[0] ?? Number.NEGATIVE_INFINITY,
      selectedQb2PassingTouchdowns: selectedQbTouchdownTiebreakers[1] ?? Number.NEGATIVE_INFINITY,
      selectedQb3PassingTouchdowns: selectedQbTouchdownTiebreakers[2] ?? Number.NEGATIVE_INFINITY,
      selectedQb4PassingTouchdowns: selectedQbTouchdownTiebreakers[3] ?? Number.NEGATIVE_INFINITY,
      selectedQb5PassingTouchdowns: selectedQbTouchdownTiebreakers[4] ?? Number.NEGATIVE_INFINITY,
    };
  });

  prelim.sort(compareScoredEntries);

  const finalized: ScoredEntry[] = [];
  let index = 0;

  while (index < prelim.length) {
    let end = index;
    while (end + 1 < prelim.length && entriesRemainTied(prelim[end]!, prelim[end + 1]!)) {
      end += 1;
    }

    const tieGroup = prelim.slice(index, end + 1).sort((left, right) => left.entryId.localeCompare(right.entryId));
    const finalRank = index + 1;
    const tieGroupSize = tieGroup.length;
    const finalRankDisplay = tieGroupSize > 1 ? `T-${finalRank}` : String(finalRank);
    const tieGroupId = tieGroupSize > 1 ? `${contestId}:${finalRank}` : null;
    const payouts = splitTieGroupPayouts({
      entryIds: tieGroup.map((entry) => entry.entryId),
      finalRank,
      tieGroupSize,
      payoutSlots,
    });

    for (const entry of tieGroup) {
      finalized.push(
        scoredEntrySchema.parse({
          entryId: entry.entryId,
          contestId,
          userId: entry.userId,
          lineupOrder: entry.lineupOrder,
          totalScore: entry.totalScore,
          exactPicks: entry.exactPicks,
          oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
          actualQb1Distance: Number.isFinite(entry.actualQb1Distance) ? entry.actualQb1Distance : null,
          selectedQb1PassingTouchdowns:
            Number.isFinite(entry.selectedQb1PassingTouchdowns) ? entry.selectedQb1PassingTouchdowns : null,
          selectedQb2PassingTouchdowns:
            Number.isFinite(entry.selectedQb2PassingTouchdowns) ? entry.selectedQb2PassingTouchdowns : null,
          selectedQb3PassingTouchdowns:
            Number.isFinite(entry.selectedQb3PassingTouchdowns) ? entry.selectedQb3PassingTouchdowns : null,
          selectedQb4PassingTouchdowns:
            Number.isFinite(entry.selectedQb4PassingTouchdowns) ? entry.selectedQb4PassingTouchdowns : null,
          selectedQb5PassingTouchdowns:
            Number.isFinite(entry.selectedQb5PassingTouchdowns) ? entry.selectedQb5PassingTouchdowns : null,
          finalRank,
          finalRankDisplay,
          isTied: tieGroupSize > 1,
          tieGroupId,
          tieGroupSize,
          payoutAmountCents: payouts.get(entry.entryId) ?? 0,
          payoutStatus: payouts.get(entry.entryId) ? 'pending' : 'pending',
          scoreFinalizedAt: finalizedAt,
          scoringVersion,
          playerScores: entry.playerScores,
        }),
      );
    }

    index = end + 1;
  }

  return finalized;
}

export function buildPayoutSlots(prizePoolCents: number) {
  const slots = payoutPercentages.map((percentage, index) => ({
    place: index + 1,
    amountCents: Math.floor(prizePoolCents * percentage),
  }));
  let remainder = prizePoolCents - slots.reduce((sum, slot) => sum + slot.amountCents, 0);

  for (const slot of slots) {
    if (remainder <= 0) {
      break;
    }

    slot.amountCents += 1;
    remainder -= 1;
  }

  return slots;
}

function getDistanceToActualRange(userRank: number, actualRankMin: number, actualRankMax: number) {
  if (userRank >= actualRankMin && userRank <= actualRankMax) {
    return 0;
  }

  return Math.min(Math.abs(userRank - actualRankMin), Math.abs(userRank - actualRankMax));
}

export function compareLeaderboardTiebreakers(
  left: LeaderboardTiebreakSummary,
  right: LeaderboardTiebreakSummary,
) {
  const leftActualQb1Distance = left.actualQb1Distance ?? Number.POSITIVE_INFINITY;
  const rightActualQb1Distance = right.actualQb1Distance ?? Number.POSITIVE_INFINITY;

  const baseComparison =
    left.totalScore - right.totalScore ||
    right.exactPicks - left.exactPicks ||
    right.oneOffOrBetterPicks - left.oneOffOrBetterPicks ||
    leftActualQb1Distance - rightActualQb1Distance;

  if (baseComparison !== 0) {
    return baseComparison;
  }

  const leftSelectedQbTouchdowns = getSelectedQbTopFivePassingTouchdowns(left);
  const rightSelectedQbTouchdowns = getSelectedQbTopFivePassingTouchdowns(right);

  for (let index = 0; index < leftSelectedQbTouchdowns.length; index += 1) {
    const comparison = rightSelectedQbTouchdowns[index]! - leftSelectedQbTouchdowns[index]!;

    if (comparison !== 0) {
      return comparison;
    }
  }

  return left.entryId.localeCompare(right.entryId);
}

export function entriesRemainTiedAfterTiebreakers(
  left: LeaderboardTiebreakSummary,
  right: LeaderboardTiebreakSummary,
) {
  return (
    left.totalScore === right.totalScore &&
    left.exactPicks === right.exactPicks &&
    left.oneOffOrBetterPicks === right.oneOffOrBetterPicks &&
    (left.actualQb1Distance ?? Number.POSITIVE_INFINITY) === (right.actualQb1Distance ?? Number.POSITIVE_INFINITY) &&
    getSelectedQbTopFivePassingTouchdowns(left).every(
      (touchdowns, index) => touchdowns === getSelectedQbTopFivePassingTouchdowns(right)[index],
    )
  );
}

function compareScoredEntries(
  left: ContestEntryForScoring & {
    totalScore: number;
    exactPicks: number;
    oneOffOrBetterPicks: number;
    actualQb1Distance: number;
    selectedQb1PassingTouchdowns: number;
    selectedQb2PassingTouchdowns: number;
    selectedQb3PassingTouchdowns: number;
    selectedQb4PassingTouchdowns: number;
    selectedQb5PassingTouchdowns: number;
  },
  right: ContestEntryForScoring & {
    totalScore: number;
    exactPicks: number;
    oneOffOrBetterPicks: number;
    actualQb1Distance: number;
    selectedQb1PassingTouchdowns: number;
    selectedQb2PassingTouchdowns: number;
    selectedQb3PassingTouchdowns: number;
    selectedQb4PassingTouchdowns: number;
    selectedQb5PassingTouchdowns: number;
  },
) {
  return compareLeaderboardTiebreakers({
    entryId: left.entryId,
    totalScore: left.totalScore,
    exactPicks: left.exactPicks,
    oneOffOrBetterPicks: left.oneOffOrBetterPicks,
    actualQb1Distance: left.actualQb1Distance,
    selectedQb1PassingTouchdowns: left.selectedQb1PassingTouchdowns,
    selectedQb2PassingTouchdowns: left.selectedQb2PassingTouchdowns,
    selectedQb3PassingTouchdowns: left.selectedQb3PassingTouchdowns,
    selectedQb4PassingTouchdowns: left.selectedQb4PassingTouchdowns,
    selectedQb5PassingTouchdowns: left.selectedQb5PassingTouchdowns,
  }, {
    entryId: right.entryId,
    totalScore: right.totalScore,
    exactPicks: right.exactPicks,
    oneOffOrBetterPicks: right.oneOffOrBetterPicks,
    actualQb1Distance: right.actualQb1Distance,
    selectedQb1PassingTouchdowns: right.selectedQb1PassingTouchdowns,
    selectedQb2PassingTouchdowns: right.selectedQb2PassingTouchdowns,
    selectedQb3PassingTouchdowns: right.selectedQb3PassingTouchdowns,
    selectedQb4PassingTouchdowns: right.selectedQb4PassingTouchdowns,
    selectedQb5PassingTouchdowns: right.selectedQb5PassingTouchdowns,
  });
}

function entriesRemainTied(
  left: {
    totalScore: number;
    exactPicks: number;
    oneOffOrBetterPicks: number;
    actualQb1Distance: number;
    selectedQb1PassingTouchdowns: number;
    selectedQb2PassingTouchdowns: number;
    selectedQb3PassingTouchdowns: number;
    selectedQb4PassingTouchdowns: number;
    selectedQb5PassingTouchdowns: number;
  },
  right: {
    totalScore: number;
    exactPicks: number;
    oneOffOrBetterPicks: number;
    actualQb1Distance: number;
    selectedQb1PassingTouchdowns: number;
    selectedQb2PassingTouchdowns: number;
    selectedQb3PassingTouchdowns: number;
    selectedQb4PassingTouchdowns: number;
    selectedQb5PassingTouchdowns: number;
  },
) {
  return entriesRemainTiedAfterTiebreakers({
    entryId: 'left',
    totalScore: left.totalScore,
    exactPicks: left.exactPicks,
    oneOffOrBetterPicks: left.oneOffOrBetterPicks,
    actualQb1Distance: left.actualQb1Distance,
    selectedQb1PassingTouchdowns: left.selectedQb1PassingTouchdowns,
    selectedQb2PassingTouchdowns: left.selectedQb2PassingTouchdowns,
    selectedQb3PassingTouchdowns: left.selectedQb3PassingTouchdowns,
    selectedQb4PassingTouchdowns: left.selectedQb4PassingTouchdowns,
    selectedQb5PassingTouchdowns: left.selectedQb5PassingTouchdowns,
  }, {
    entryId: 'right',
    totalScore: right.totalScore,
    exactPicks: right.exactPicks,
    oneOffOrBetterPicks: right.oneOffOrBetterPicks,
    actualQb1Distance: right.actualQb1Distance,
    selectedQb1PassingTouchdowns: right.selectedQb1PassingTouchdowns,
    selectedQb2PassingTouchdowns: right.selectedQb2PassingTouchdowns,
    selectedQb3PassingTouchdowns: right.selectedQb3PassingTouchdowns,
    selectedQb4PassingTouchdowns: right.selectedQb4PassingTouchdowns,
    selectedQb5PassingTouchdowns: right.selectedQb5PassingTouchdowns,
  });
}

function getSelectedQbTopFivePassingTouchdowns(summary: LeaderboardTiebreakSummary) {
  return [
    summary.selectedQb1PassingTouchdowns ?? Number.NEGATIVE_INFINITY,
    summary.selectedQb2PassingTouchdowns ?? Number.NEGATIVE_INFINITY,
    summary.selectedQb3PassingTouchdowns ?? Number.NEGATIVE_INFINITY,
    summary.selectedQb4PassingTouchdowns ?? Number.NEGATIVE_INFINITY,
    summary.selectedQb5PassingTouchdowns ?? Number.NEGATIVE_INFINITY,
  ];
}

function splitTieGroupPayouts({
  entryIds,
  finalRank,
  tieGroupSize,
  payoutSlots,
}: {
  entryIds: string[];
  finalRank: number;
  tieGroupSize: number;
  payoutSlots: Array<{ place: number; amountCents: number }>;
}) {
  const tiedPayouts = new Map(entryIds.map((entryId) => [entryId, 0]));
  const occupiedSlots = Array.from({ length: tieGroupSize }, (_, index) => finalRank + index);
  const pooledAmount = occupiedSlots.reduce(
    (sum, slot) => sum + (payoutSlots.find((payout) => payout.place === slot)?.amountCents ?? 0),
    0,
  );

  if (pooledAmount <= 0) {
    return tiedPayouts;
  }

  const baseAmount = Math.floor(pooledAmount / tieGroupSize);
  let remainder = pooledAmount - baseAmount * tieGroupSize;

  for (const entryId of entryIds) {
    tiedPayouts.set(entryId, baseAmount);
  }

  for (const entryId of entryIds) {
    if (remainder <= 0) {
      break;
    }

    tiedPayouts.set(entryId, (tiedPayouts.get(entryId) ?? 0) + 1);
    remainder -= 1;
  }

  return tiedPayouts;
}
