import path from 'node:path';
import { readFile } from 'node:fs/promises';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const env = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const args = parseArgs(process.argv.slice(2));
  const token = firstNonEmpty(
    process.env.PICKRANK_ROLLING_INSIGHTS_RSC_TOKEN,
    process.env.RSC_TOKEN,
    process.env.PICKRANK_ROLLING_INSIGHTS_CLIENT_SECRET,
    env.PICKRANK_ROLLING_INSIGHTS_RSC_TOKEN,
    env.RSC_TOKEN,
    env.PICKRANK_ROLLING_INSIGHTS_CLIENT_SECRET,
  );

  if (!token) {
    throw new Error(
      'Missing Rolling Insights RSC token. Set PICKRANK_ROLLING_INSIGHTS_RSC_TOKEN locally; do not paste it into chat or commit it.',
    );
  }

  const season = args.season || process.env.PICKRANK_ROLLING_INSIGHTS_SEASON || env.PICKRANK_ROLLING_INSIGHTS_SEASON || '2026';
  const date =
    args.date ||
    process.env.PICKRANK_ROLLING_INSIGHTS_DATE ||
    env.PICKRANK_ROLLING_INSIGHTS_DATE ||
    new Date().toISOString().slice(0, 10);
  const baseUrl = normalizeBaseUrl(
    args.baseUrl ||
      process.env.PICKRANK_ROLLING_INSIGHTS_BASE_URL ||
      env.PICKRANK_ROLLING_INSIGHTS_BASE_URL ||
      'https://rest.datafeeds.rolling-insights.com/api/v1',
  );

  const seasonSchedule = await requestJson({
    baseUrl,
    path: `/schedule-season/${encodeURIComponent(season)}/NFL`,
    token,
  });
  const dailySchedule = await requestJson({
    baseUrl,
    path: `/schedule/${encodeURIComponent(date)}/NFL`,
    token,
  });
  const liveFeed = await requestJson({
    baseUrl,
    path: `/live/${encodeURIComponent(date)}/NFL`,
    token,
    gameId: args.game,
    cacheBust: true,
  });

  const seasonGames = extractScheduleGames(seasonSchedule.body);
  const dailyGames = extractScheduleGames(dailySchedule.body);
  const liveGames = extractLiveGames(liveFeed.body);

  console.log(
    JSON.stringify(
      {
        provider: 'rolling-insights',
        mode: 'private_read_only',
        baseUrl,
        season,
        date,
        checks: {
          seasonSchedule: classifyStatus(seasonSchedule.statusCode),
          dailySchedule: classifyStatus(dailySchedule.statusCode),
          liveFeed: classifyStatus(liveFeed.statusCode),
        },
        responses: {
          seasonSchedule: responseSummary(seasonSchedule, {
            gameCount: seasonGames.length,
            preseasonCount: seasonGames.filter((game) => normalize(game.season_type).includes('preseason')).length,
            statuses: distinct(seasonGames.map((game) => game.status)),
            sampleGames: seasonGames.slice(0, 5).map(summarizeScheduleGame),
          }),
          dailySchedule: responseSummary(dailySchedule, {
            gameCount: dailyGames.length,
            sampleGames: dailyGames.slice(0, 5).map(summarizeScheduleGame),
          }),
          liveFeed: responseSummary(liveFeed, {
            gameCount: liveGames.length,
            games: liveGames.slice(0, 10).map(summarizeLiveGame),
            quarterbacks: liveGames.flatMap(extractQuarterbacks),
          }),
        },
        notes: [
          'This probe performs GET requests only.',
          'No Supabase, contest, final-results, or snapshot writes occur.',
          'The RSC token is never printed.',
          'The probe uses HTTPS by default and does not silently downgrade to HTTP.',
        ],
      },
      null,
      2,
    ),
  );
}

async function requestJson({ baseUrl, path: requestPath, token, gameId, cacheBust = false }) {
  const url = new URL(`${baseUrl}${requestPath}`);
  url.searchParams.set('RSC_token', token);
  if (gameId) {
    url.searchParams.set('game_id', gameId);
  }
  if (cacheBust) {
    url.searchParams.set('_', Date.now().toString());
  }

  let response;
  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json',
        ...(cacheBust
          ? {
              'Cache-Control': 'no-cache, no-store',
              Pragma: 'no-cache',
            }
          : {}),
      },
      redirect: 'follow',
    });
  } catch (error) {
    return {
      statusCode: null,
      contentType: null,
      dataType: null,
      body: null,
      errorCode: 'network_unreachable',
      errorClass: error instanceof Error ? error.name : 'Error',
    };
  }

  const rawBody = await response.text();
  let body = null;
  if (rawBody) {
    try {
      body = JSON.parse(rawBody);
    } catch {
      body = rawBody.slice(0, 500);
    }
  }

  return {
    statusCode: response.status,
    contentType: response.headers.get('content-type'),
    dataType: response.headers.get('rs-data-type'),
    body,
    errorCode: null,
    errorClass: null,
  };
}

function extractScheduleGames(body) {
  const games = body?.data?.NFL;
  return Array.isArray(games) ? games : [];
}

function extractLiveGames(body) {
  if (Array.isArray(body)) return body;
  if (Array.isArray(body?.data?.NFL)) return body.data.NFL;
  if (body?.game_ID || body?.game_id) return [body];
  return [];
}

function extractQuarterbacks(game) {
  const teams = [game.player_box?.away_team, game.player_box?.home_team].filter(Boolean);
  return teams.flatMap((team) =>
    Object.entries(team)
      .filter(([, player]) => normalize(player?.position) === 'qb')
      .map(([playerId, player]) => ({
        gameId: game.game_ID || game.game_id || null,
        playerId,
        player: player.player || null,
        position: player.position || null,
        status: player.status || null,
        passingYards: numberOrNull(player.passing_yards),
        passingTouchdowns: numberOrNull(player.passing_touchdowns),
        passingAttempts: numberOrNull(player.passing_attempts),
      })),
  );
}

function summarizeScheduleGame(game) {
  return {
    gameId: game.game_ID || null,
    awayTeam: game.away_team || null,
    homeTeam: game.home_team || null,
    awayTeamId: game.away_team_ID ?? null,
    homeTeamId: game.home_team_ID ?? null,
    seasonType: game.season_type || null,
    status: game.status || null,
    gameTime: game.game_time || null,
  };
}

function summarizeLiveGame(game) {
  return {
    gameId: game.game_ID || game.game_id || null,
    awayTeam: game.away_team_name || game.away_team || null,
    homeTeam: game.home_team_name || game.home_team || null,
    gameStatus: game.game_status || null,
    status: game.status || null,
    seasonType: game.season_type || null,
    gameTime: game.game_time || null,
  };
}

function responseSummary(response, details) {
  return {
    statusCode: response.statusCode,
    contentType: response.contentType,
    dataType: response.dataType,
    errorCode: response.errorCode,
    errorClass: response.errorClass,
    ...details,
  };
}

function classifyStatus(statusCode) {
  if (statusCode === null) return 'network_unreachable';
  if (statusCode === 200) return 'provider_success';
  if (statusCode === 304) return 'cache_not_modified';
  if (statusCode === 401 || statusCode === 403) return 'auth_failed';
  if (statusCode === 404) return 'no_data_or_not_found';
  return `http_${statusCode}`;
}

function normalizeBaseUrl(value) {
  const trimmed = value.trim().replace(/\/+$/, '');
  const url = new URL(trimmed);
  if (url.protocol !== 'https:') {
    throw new Error('Rolling Insights probe requires an HTTPS base URL. Do not send the RSC token over HTTP.');
  }
  return trimmed;
}

function parseArgs(args) {
  const parsed = {};
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === '--season') parsed.season = args[++index];
    else if (arg === '--date') parsed.date = args[++index];
    else if (arg === '--game') parsed.game = args[++index];
    else if (arg === '--base-url') parsed.baseUrl = args[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  return parsed;
}

async function loadEnvFile(filePath) {
  try {
    const fileContents = await readFile(filePath, 'utf8');
    return Object.fromEntries(
      fileContents
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const separatorIndex = line.indexOf('=');
          const key = line.slice(0, separatorIndex).trim();
          let value = line.slice(separatorIndex + 1).trim();
          if (value.length >= 2 && value[0] === value[value.length - 1] && ['"', "'"].includes(value[0])) {
            value = value.slice(1, -1);
          }
          return [key, value];
        }),
    );
  } catch {
    return {};
  }
}

function firstNonEmpty(...values) {
  return values.find((value) => typeof value === 'string' && value.trim())?.trim() || '';
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function numberOrNull(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function distinct(values) {
  return [...new Set(values.filter(Boolean))];
}
