type ProvisionalGameStatus = 'scheduled' | 'in_progress' | 'final';

type ProvisionalOrderSourceRow = {
  playerId: string;
  providerPlayerId: string;
  providerGameId: string;
  playerName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: 'home' | 'away';
  passingYards: number;
  passingTouchdowns: number;
  gameStatus: ProvisionalGameStatus;
};

type ProvisionalOrderRow = ProvisionalOrderSourceRow & {
  provisionalRank: number;
  provisionalRankMin: number;
  provisionalRankMax: number;
  provisionalRankDisplay: string;
  sortOrder: number;
};

export type MySportsFeedsReadOnlyValidationOptions = {
  apiKey: string;
  password?: string;
  baseUrl?: string;
  season: string;
  week: number;
  gameId?: string;
  teamAbbreviation?: string;
  scheduleOnly?: boolean;
  allWeekGames?: boolean;
  now?: string;
  fetchImpl?: typeof fetch;
};

export type MySportsFeedsGameSummary = {
  providerGameId: string;
  awayTeam: string;
  homeTeam: string;
  startTime: string | null;
  rawPlayedStatus: string | null;
  rawScheduleStatus: string | null;
  gameStatus: ProvisionalGameStatus;
};

export type MySportsFeedsReadOnlyValidationResult = {
  providerKey: 'mysportsfeeds';
  providerName: 'MySportsFeeds';
  providerSnapshotTime: string;
  season: string;
  week: number;
  endpoints: {
    weeklyGames: string;
    weeklyPlayerGamelogs: string;
    officialFinalizationHandoff: 'separate_final_review_path_required';
  };
  checks: {
    auth: 'passed';
    scheduleAccess: 'passed';
    gameStateMapping: 'passed';
    qbPassYards: 'passed' | 'pending_completed_game';
    provisionalSnapshotShape: 'passed' | 'pending_completed_game';
  };
  gamesTotal: number;
  gamesScheduled: number;
  gamesInProgress: number;
  gamesFinal: number;
  allGamesFinal: boolean;
  games: MySportsFeedsGameSummary[];
  selectedGame: MySportsFeedsGameSummary | null;
  statRowsFound: number;
  topFive: Array<{
    rank: string;
    playerName: string;
    passingYards: number;
    gameStatus: ProvisionalGameStatus;
  }>;
  rows: ProvisionalOrderRow[];
  notes: string[];
};

type MySportsFeedsFetchResult =
  | {
      status: 'ok';
      url: string;
      statusCode: number;
      body: unknown;
    }
  | {
      status: 'empty';
      url: string;
      statusCode: 204;
      body: null;
    };

type MySportsFeedsPlayerGamelogRow = {
  providerPlayerId: string;
  providerGameId: string;
  playerName: string;
  teamAbbreviation: string;
  opponentAbbreviation: string;
  homeAway: 'home' | 'away';
  passingYards: number;
  passingTouchdowns: number;
  gameStatus: ProvisionalGameStatus;
};

export async function runMySportsFeedsReadOnlyValidation(
  options: MySportsFeedsReadOnlyValidationOptions,
): Promise<MySportsFeedsReadOnlyValidationResult> {
  const apiKey = options.apiKey.trim();
  const season = options.season.trim();

  if (!apiKey) {
    throw new Error('Missing PICKRANK_MYSPORTSFEEDS_API_KEY.');
  }

  if (!season) {
    throw new Error('Missing MySportsFeeds season.');
  }

  if (!Number.isInteger(options.week) || options.week <= 0) {
    throw new Error('MySportsFeeds week must be a positive integer.');
  }

  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const fetchImpl = options.fetchImpl ?? fetch;
  const weeklyGamesPath = `${season}/week/${options.week}/games.json`;
  const weeklyGames = await fetchMySportsFeedsJson({
    baseUrl,
    path: weeklyGamesPath,
    apiKey,
    password: options.password,
    fetchImpl,
  });
  const games = parseMySportsFeedsGames(weeklyGames.body);
  const selectedGame = selectValidationGame(games, options.gameId);
  const weeklyPlayerGamelogsPath = buildWeeklyPlayerGamelogsPath({
    season,
    week: options.week,
    gameId: options.allWeekGames ? undefined : selectedGame?.providerGameId,
    teamAbbreviation: options.teamAbbreviation,
  });
  const notes: string[] = [];
  let gamelogs: MySportsFeedsPlayerGamelogRow[] = [];

  if (options.scheduleOnly) {
    notes.push('Schedule-only mode skipped the player gamelog request.');
  } else {
    const weeklyPlayerGamelogs = await fetchMySportsFeedsJson({
      baseUrl,
      path: weeklyPlayerGamelogsPath,
      apiKey,
      password: options.password,
      fetchImpl,
      allowEmpty: true,
    });
    gamelogs =
      weeklyPlayerGamelogs.status === 'empty'
      ? []
        : parseMySportsFeedsPlayerGamelogs(weeklyPlayerGamelogs.body, games);
  }

  if (gamelogs.length === 0 && !options.scheduleOnly) {
    notes.push(
      'Weekly QB gamelog feed returned no stat rows. This is expected for future or fully unplayed games, but a completed preseason game is still required to prove non-zero passYards.',
    );
  }

  const rows = buildProvisionalOrderRows(
    buildProvisionalOrderSourceRows(
      gamelogs.map((row) => ({
        playerId: `mysportsfeeds-${row.providerPlayerId}`,
        providerPlayerId: row.providerPlayerId,
        providerGameId: row.providerGameId,
        displayName: row.playerName,
        teamAbbreviation: row.teamAbbreviation,
        opponentAbbreviation: row.opponentAbbreviation,
        homeAway: row.homeAway,
      })),
      new Map(
        gamelogs.map((row) => [
          buildProviderRowKey(row.providerPlayerId, row.providerGameId),
          {
            passingYards: row.passingYards,
            passingTouchdowns: row.passingTouchdowns,
            gameStatus: row.gameStatus,
          },
        ]),
      ),
    ),
  );
  const gameSummary = summarizeProvisionalGames(
    rows.length > 0
      ? rows
      : games.map((game, index) => ({
          playerId: `game-status-check-${index + 1}`,
          providerPlayerId: `game-status-check-${index + 1}`,
          providerGameId: game.providerGameId,
          playerName: `${game.awayTeam} at ${game.homeTeam}`,
          teamAbbreviation: game.awayTeam,
          opponentAbbreviation: game.homeTeam,
          homeAway: 'away' as const,
          passingYards: 0,
          passingTouchdowns: 0,
          gameStatus: game.gameStatus,
          provisionalRank: index + 1,
          provisionalRankMin: index + 1,
          provisionalRankMax: index + 1,
          provisionalRankDisplay: String(index + 1),
          sortOrder: index + 1,
        })),
  );

  return {
    providerKey: 'mysportsfeeds',
    providerName: 'MySportsFeeds',
    providerSnapshotTime: options.now ?? new Date().toISOString(),
    season,
    week: options.week,
    endpoints: {
      weeklyGames: weeklyGames.url,
      weeklyPlayerGamelogs: `${baseUrl}/${weeklyPlayerGamelogsPath}`,
      officialFinalizationHandoff: 'separate_final_review_path_required',
    },
    checks: {
      auth: 'passed',
      scheduleAccess: 'passed',
      gameStateMapping: 'passed',
      qbPassYards: rows.length > 0 ? 'passed' : 'pending_completed_game',
      provisionalSnapshotShape: rows.length > 0 ? 'passed' : 'pending_completed_game',
    },
    gamesTotal: gameSummary.totalGames,
    gamesScheduled: gameSummary.scheduledGames,
    gamesInProgress: gameSummary.inProgressGames,
    gamesFinal: gameSummary.finalGames,
    allGamesFinal: gameSummary.allGamesFinal,
    games,
    selectedGame,
    statRowsFound: rows.length,
    topFive: rows.slice(0, 5).map((row) => ({
      rank: row.provisionalRankDisplay,
      playerName: row.playerName,
      passingYards: row.passingYards,
      gameStatus: row.gameStatus,
    })),
    rows,
    notes,
  };
}

export function buildMySportsFeedsAuthHeader(apiKey: string, password = 'MYSPORTSFEEDS') {
  return `Basic ${Buffer.from(`${apiKey}:${password}`).toString('base64')}`;
}

export function normalizeMySportsFeedsGameStatus(input: {
  playedStatus?: unknown;
  scheduleStatus?: unknown;
}): ProvisionalGameStatus {
  const playedStatus = readOptionalString(input.playedStatus)?.toUpperCase();
  const scheduleStatus = readOptionalString(input.scheduleStatus)?.toUpperCase();

  if (playedStatus === 'COMPLETED') {
    return 'final';
  }

  if (
    playedStatus === 'LIVE' ||
    playedStatus === 'COMPLETED_PENDING_REVIEW' ||
    scheduleStatus === 'DELAYED'
  ) {
    return 'in_progress';
  }

  return 'scheduled';
}

export function extractMySportsFeedsStatValue(stats: unknown, names: string[]) {
  const normalizedNames = names.map(normalizeStatName);
  const stack = [stats];

  while (stack.length > 0) {
    const current = stack.pop();

    if (Array.isArray(current)) {
      stack.push(...current);
      continue;
    }

    if (!current || typeof current !== 'object') {
      continue;
    }

    const record = current as Record<string, unknown>;
    const directName = readOptionalString(record.fullName ?? record.name ?? record.abbreviation);

    if (directName && normalizedNames.includes(normalizeStatName(directName))) {
      const directValue = readNumber(record.value ?? record.amount ?? record.total);

      if (directValue !== null) {
        return directValue;
      }
    }

    for (const [key, value] of Object.entries(record)) {
      if (normalizedNames.includes(normalizeStatName(key))) {
        const nestedValue = readNumber(value);

        if (nestedValue !== null) {
          return nestedValue;
        }
      }

      if (value && typeof value === 'object') {
        stack.push(value);
      }
    }
  }

  return 0;
}

async function fetchMySportsFeedsJson(input: {
  baseUrl: string;
  path: string;
  apiKey: string;
  password?: string;
  fetchImpl: typeof fetch;
  allowEmpty?: boolean;
}): Promise<MySportsFeedsFetchResult> {
  const url = `${input.baseUrl}/${input.path}`;
  const response = await input.fetchImpl(url, {
    method: 'GET',
    headers: {
      Authorization: buildMySportsFeedsAuthHeader(input.apiKey, input.password),
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
    },
  });

  if (response.status === 204 && input.allowEmpty) {
    return {
      status: 'empty',
      url,
      statusCode: 204,
      body: null,
    };
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `MySportsFeeds read-only validation failed for ${input.path} with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`,
    );
  }

  return {
    status: 'ok',
    url,
    statusCode: response.status,
    body: await response.json(),
  };
}

function parseMySportsFeedsGames(payload: unknown): MySportsFeedsGameSummary[] {
  const payloadRecord = readRecord(payload, 'MySportsFeeds games payload');
  const games = Array.isArray(payloadRecord.games) ? payloadRecord.games : [];

  return games.map((entry, index) => {
    const record = readRecord(entry, `MySportsFeeds game ${index + 1}`);
    const schedule = readRecord(record.schedule, `MySportsFeeds game ${index + 1} schedule`);
    const awayTeam = readRecord(schedule.awayTeam, `MySportsFeeds game ${index + 1} away team`);
    const homeTeam = readRecord(schedule.homeTeam, `MySportsFeeds game ${index + 1} home team`);
    const providerGameId = readRequiredString(schedule.id, `MySportsFeeds game ${index + 1} id`);

    return {
      providerGameId,
      awayTeam: readRequiredString(awayTeam.abbreviation, `MySportsFeeds game ${index + 1} away team`),
      homeTeam: readRequiredString(homeTeam.abbreviation, `MySportsFeeds game ${index + 1} home team`),
      startTime: readOptionalString(schedule.startTime),
      rawPlayedStatus: readOptionalString(schedule.playedStatus),
      rawScheduleStatus: readOptionalString(schedule.scheduleStatus),
      gameStatus: normalizeMySportsFeedsGameStatus({
        playedStatus: schedule.playedStatus,
        scheduleStatus: schedule.scheduleStatus,
      }),
    };
  });
}

function selectValidationGame(games: MySportsFeedsGameSummary[], requestedGameId?: string) {
  if (games.length === 0) {
    return null;
  }

  if (requestedGameId?.trim()) {
    const requestedGame = games.find((game) => game.providerGameId === requestedGameId.trim());

    if (!requestedGame) {
      throw new Error(`MySportsFeeds game ${requestedGameId} was not found in the weekly games feed.`);
    }

    return requestedGame;
  }

  return (
    games.find((game) => game.gameStatus === 'final') ??
    games.find((game) => game.gameStatus === 'in_progress') ??
    games[0]
  );
}

function buildWeeklyPlayerGamelogsPath(input: {
  season: string;
  week: number;
  gameId?: string;
  teamAbbreviation?: string;
}) {
  const params = new URLSearchParams({
    position: 'QB',
    stats: 'Yds,TD',
  });

  if (input.gameId) {
    params.set('game', input.gameId);
  } else if (input.teamAbbreviation?.trim()) {
    params.set('team', input.teamAbbreviation.trim());
  }

  return `${input.season}/week/${input.week}/player_gamelogs.json?${params.toString()}`;
}

function parseMySportsFeedsPlayerGamelogs(
  payload: unknown,
  games: MySportsFeedsGameSummary[],
): MySportsFeedsPlayerGamelogRow[] {
  const payloadRecord = readRecord(payload, 'MySportsFeeds player gamelogs payload');
  const gamelogs = findArray(payloadRecord, ['gamelogs', 'gamelog', 'playerGamelogs']);

  return gamelogs.map((entry, index) => {
    const record = readRecord(entry, `MySportsFeeds player gamelog ${index + 1}`);
    const player = readRecord(record.player, `MySportsFeeds player gamelog ${index + 1} player`);
    const team = readRecord(record.team, `MySportsFeeds player gamelog ${index + 1} team`);
    const game = record.game ? readRecord(record.game, `MySportsFeeds player gamelog ${index + 1} game`) : null;
    const providerGameId = readRequiredString(
      game?.id ?? games[0]?.providerGameId,
      `MySportsFeeds player gamelog ${index + 1} game id`,
    );
    const teamAbbreviation = readRequiredString(
      team.abbreviation,
      `MySportsFeeds player gamelog ${index + 1} team abbreviation`,
    );
    const matchingGame = games.find((candidate) => candidate.providerGameId === providerGameId);
    const gameStatus = matchingGame?.gameStatus ?? 'final';
    const awayTeam = matchingGame?.awayTeam ?? teamAbbreviation;
    const homeTeam = matchingGame?.homeTeam ?? teamAbbreviation;
    const homeAway = teamAbbreviation === homeTeam ? 'home' : 'away';

    return {
      providerPlayerId: readRequiredString(player.id, `MySportsFeeds player gamelog ${index + 1} player id`),
      providerGameId,
      playerName: buildPlayerName(player),
      teamAbbreviation,
      opponentAbbreviation: homeAway === 'home' ? awayTeam : homeTeam,
      homeAway,
      passingYards: extractMySportsFeedsStatValue(record.stats, ['passYards', 'Yds', 'Pass Yards']),
      passingTouchdowns: extractMySportsFeedsStatValue(record.stats, ['passTD', 'TD', 'Pass Touchdowns']),
      gameStatus,
    };
  });
}

function buildPlayerName(player: Record<string, unknown>) {
  const firstName = readOptionalString(player.firstName);
  const lastName = readOptionalString(player.lastName);
  const fullName = readOptionalString(player.fullName);

  if (fullName) {
    return fullName;
  }

  return [firstName, lastName].filter(Boolean).join(' ') || readRequiredString(player.id, 'MySportsFeeds player name');
}

function normalizeBaseUrl(baseUrl = 'https://api.mysportsfeeds.com/v2.1/pull/nfl') {
  return baseUrl.replace(/\/$/, '');
}

function findArray(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  return [];
}

function readRecord(value: unknown, label: string): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(`${label} is missing.`);
}

function readRequiredString(value: unknown, label: string) {
  const stringValue = readOptionalString(value);

  if (stringValue) {
    return stringValue;
  }

  throw new Error(`${label} is missing.`);
}

function readOptionalString(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isFinite(parsedValue)) {
      return Math.max(0, Math.trunc(parsedValue));
    }
  }

  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;
    return readNumber(record.value ?? record.amount ?? record.total);
  }

  return null;
}

function normalizeStatName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function buildProvisionalOrderRows(rows: ProvisionalOrderSourceRow[]): ProvisionalOrderRow[] {
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

function buildProvisionalOrderSourceRows(
  slatePlayers: Array<{
    playerId: string;
    providerPlayerId: string;
    providerGameId: string;
    displayName: string;
    teamAbbreviation: string;
    opponentAbbreviation: string;
    homeAway: 'home' | 'away';
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

function summarizeProvisionalGames(rows: Pick<ProvisionalOrderSourceRow, 'providerGameId' | 'gameStatus'>[]) {
  const uniqueGames = new Map<string, ProvisionalGameStatus>();

  rows.forEach((row) => {
    const currentStatus = uniqueGames.get(row.providerGameId);

    if (!currentStatus || gameStatusPriority(row.gameStatus) > gameStatusPriority(currentStatus)) {
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

function buildProviderRowKey(providerPlayerId: string, providerGameId: string) {
  return `${providerPlayerId}::${providerGameId}`;
}

function compareProvisionalRows(left: ProvisionalOrderSourceRow, right: ProvisionalOrderSourceRow) {
  if (right.passingYards !== left.passingYards) {
    return right.passingYards - left.passingYards;
  }

  return left.playerName.localeCompare(right.playerName);
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
