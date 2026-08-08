import type { ContestSlatePlayer } from './contest-data';

const liveValidationRankedPlayerCount = 10;

export const inSeasonLiveValidationContestId = 'week-1-qb-passing-yards-live-validation-2026';
export const inSeasonLiveValidationContestTitle = 'Week 1 QB Passing Yards Live Validation';
export const inSeasonLiveValidationContestDescription =
  'Internal SportsDataIO live-validation slate for provisional ordering only.';

export type LiveValidationScheduleGame = {
  scoreId: string;
  awayTeam: string;
  homeTeam: string;
  date: string;
};

export type LiveValidationQuarterback = {
  teamAbbreviation: string;
  playerId: string;
  name: string;
  depthOrder: number;
};

export type PreparedLiveValidationSlatePlayer = {
  playerId: string;
  providerPlayerId: string;
  providerGameId: string;
  displayName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: 'home' | 'away';
  gameStartTime: string;
  position: 'QB';
  activeStatus: string;
  sortOrderInternal: number;
};

export type PreparedLiveValidationContest = {
  id: string;
  title: string;
  description: string;
  season: number;
  week: number;
  lineupPlayers: string[];
  slatePlayers: PreparedLiveValidationSlatePlayer[];
  warning: string;
  replacements: Array<{
    sourcePlayerName: string;
    replacementPlayerName: string;
    teamAbbreviation: string;
  }>;
  matchupChanges: Array<{
    teamAbbreviation: string;
    fromOpponentAbbreviation: string;
    toOpponentAbbreviation: string;
    fromHomeAway: 'home' | 'away';
    toHomeAway: 'home' | 'away';
  }>;
};

export function buildInSeasonLiveValidationContest(input: {
  sourceContestId: string;
  sourceContestTitle: string;
  season: number;
  week: number;
  sourceSlatePlayers: ContestSlatePlayer[];
  scheduleGames: LiveValidationScheduleGame[];
  quarterbacks: LiveValidationQuarterback[];
}): PreparedLiveValidationContest {
  const scheduleByTeam = new Map<string, LiveValidationScheduleGame>();
  input.scheduleGames.forEach((game) => {
    scheduleByTeam.set(game.homeTeam, game);
    scheduleByTeam.set(game.awayTeam, game);
  });

  const quarterbackByTeam = new Map<string, LiveValidationQuarterback>();
  input.quarterbacks
    .slice()
    .sort((left, right) => left.depthOrder - right.depthOrder)
    .forEach((quarterback) => {
      if (!quarterbackByTeam.has(quarterback.teamAbbreviation)) {
        quarterbackByTeam.set(quarterback.teamAbbreviation, quarterback);
      }
    });

  const replacements: PreparedLiveValidationContest['replacements'] = [];
  const matchupChanges: PreparedLiveValidationContest['matchupChanges'] = [];

  const slatePlayers = input.sourceSlatePlayers.map((player) => {
    const game = scheduleByTeam.get(player.teamAbbreviation);

    if (!game) {
      throw new Error(`No live Week ${input.week} schedule game found for ${player.teamAbbreviation}.`);
    }

    const quarterback = quarterbackByTeam.get(player.teamAbbreviation);

    if (!quarterback) {
      throw new Error(`No QB depth-chart starter found for ${player.teamAbbreviation}.`);
    }

    const actualHomeAway: 'home' | 'away' =
      game.homeTeam === player.teamAbbreviation ? 'home' : 'away';
    const actualOpponentAbbreviation =
      actualHomeAway === 'home' ? game.awayTeam : game.homeTeam;

    if (player.displayName !== quarterback.name) {
      replacements.push({
        sourcePlayerName: player.displayName,
        replacementPlayerName: quarterback.name,
        teamAbbreviation: player.teamAbbreviation,
      });
    }

    if (
      player.opponentAbbreviation !== actualOpponentAbbreviation ||
      player.homeAway !== actualHomeAway
    ) {
      matchupChanges.push({
        teamAbbreviation: player.teamAbbreviation,
        fromOpponentAbbreviation: player.opponentAbbreviation,
        toOpponentAbbreviation: actualOpponentAbbreviation,
        fromHomeAway: player.homeAway,
        toHomeAway: actualHomeAway,
      });
    }

    return {
      playerId: player.playerId,
      providerPlayerId: quarterback.playerId,
      providerGameId: game.scoreId,
      displayName: quarterback.name,
      teamAbbreviation: player.teamAbbreviation,
      opponentAbbreviation: actualOpponentAbbreviation,
      homeAway: actualHomeAway,
      gameStartTime: game.date,
      position: 'QB' as const,
      activeStatus: player.activeStatus ?? 'active',
      sortOrderInternal: player.sortOrderInternal,
    };
  });

  const lineupPlayers = slatePlayers
    .slice()
    .sort((left, right) => left.sortOrderInternal - right.sortOrderInternal)
    .slice(0, liveValidationRankedPlayerCount)
    .map((player) => player.displayName);

  return {
    id: inSeasonLiveValidationContestId,
    title: inSeasonLiveValidationContestTitle,
    description: inSeasonLiveValidationContestDescription,
    season: input.season,
    week: input.week,
    lineupPlayers,
    slatePlayers,
    warning: buildInSeasonLiveValidationWarning({
      sourceContestId: input.sourceContestId,
      replacements,
      matchupChanges,
    }),
    replacements,
    matchupChanges,
  };
}

function buildInSeasonLiveValidationWarning(input: {
  sourceContestId: string;
  replacements: PreparedLiveValidationContest['replacements'];
  matchupChanges: PreparedLiveValidationContest['matchupChanges'];
}) {
  const parts = [`Internal live validation slate derived from ${input.sourceContestId}.`];

  if (input.replacements.length > 0) {
    const replacementSummary = input.replacements
      .map(
        (replacement) =>
          `${replacement.teamAbbreviation}: ${replacement.sourcePlayerName} -> ${replacement.replacementPlayerName}`,
      )
      .join('; ');
    parts.push(`Current QB1 replacements: ${replacementSummary}.`);
  }

  if (input.matchupChanges.length > 0) {
    parts.push(
      'Matchups use the real 2026 Week 1 SportsDataIO schedule rather than the placeholder public contest opponents.',
    );
  }

  return parts.join(' ');
}
