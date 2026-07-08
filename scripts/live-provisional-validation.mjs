import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import {
  buildProvisionalOrderRows,
  buildProvisionalOrderSourceRows,
  buildProviderRowKey,
  summarizeProvisionalGames,
} from '../lib/provisional-ordering.ts';
import {
  buildInSeasonLiveRefreshMessage,
  loadInSeasonLiveValidationContestInput,
} from '../lib/in-season-live-validation.ts';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const env = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const liveApiKey = process.env.PICKRANK_SPORTSDATAIO_LIVE_API_KEY || env.PICKRANK_SPORTSDATAIO_LIVE_API_KEY;
  const liveBaseUrl =
    process.env.PICKRANK_SPORTSDATAIO_LIVE_BASE_URL ||
    env.PICKRANK_SPORTSDATAIO_LIVE_BASE_URL ||
    'https://api.sportsdata.io/v3/nfl';
  const liveAuthMode =
    process.env.PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE ||
    env.PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE ||
    'header';
  const contestSlug =
    process.env.PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG || env.PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG || '';

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for in-season live validation.');
  }

  if (!liveApiKey) {
    throw new Error('Missing PICKRANK_SPORTSDATAIO_LIVE_API_KEY for in-season live validation.');
  }

  if (!contestSlug.trim()) {
    throw new Error('Missing PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG for in-season live validation.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const createSupabaseClient = async () => supabase;
  const contest = await loadInSeasonLiveValidationContestInput(contestSlug, createSupabaseClient);
  const snapshot = await saveSportsDataIoLiveProvisionalSnapshot({
    supabase,
    contest,
    apiKey: liveApiKey,
    baseUrl: liveBaseUrl,
    authMode: liveAuthMode,
  });

  console.log(
    JSON.stringify(
      {
        contestSlug: contest.id,
        contestTitle: contest.title,
        providerSnapshotTime: snapshot.providerSnapshotTime,
        providerKey: snapshot.providerKey,
        gamesTotal: snapshot.gamesTotal,
        gamesScheduled: snapshot.gamesScheduled,
        gamesInProgress: snapshot.gamesInProgress,
        gamesFinal: snapshot.gamesFinal,
        helperText: buildInSeasonLiveRefreshMessage(contest.title, snapshot),
        topFive: snapshot.rows.slice(0, 5).map((row) => ({
          rank: row.provisionalRankDisplay,
          playerName: row.playerName,
          passingYards: row.passingYards,
          gameStatus: row.gameStatus,
        })),
      },
      null,
      2,
    ),
  );
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

async function saveSportsDataIoLiveProvisionalSnapshot({
  supabase,
  contest,
  apiKey,
  baseUrl,
  authMode,
}) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const seasonKey = `${contest.season}reg`;
  const [scoresPayload, playerStatsPayload] = await Promise.all([
    fetchSportsDataIoJson(
      `${normalizedBaseUrl}/scores/json/ScoresByWeek/${seasonKey}/${contest.week}`,
      apiKey,
      authMode,
    ),
    fetchSportsDataIoJson(
      `${normalizedBaseUrl}/stats/json/PlayerGameStatsByWeek/${seasonKey}/${contest.week}`,
      apiKey,
      authMode,
    ),
  ]);

  const scoreStatusByGameId = new Map(
    (Array.isArray(scoresPayload) ? scoresPayload : []).map((score) => [
      String(score.ScoreID),
      normalizeGameStatus(score),
    ]),
  );
  const rowsByProviderKey = new Map();

  for (const stat of Array.isArray(playerStatsPayload) ? playerStatsPayload : []) {
    rowsByProviderKey.set(buildProviderRowKey(String(stat.PlayerID), String(stat.ScoreID)), {
      passingYards: readNumber(stat.PassingYards),
      passingTouchdowns: readNumber(stat.PassingTouchdowns),
      gameStatus: scoreStatusByGameId.get(String(stat.ScoreID)) ?? normalizeGameStatus(stat),
    });
  }

  const provisionalRows = buildProvisionalOrderRows(
    buildProvisionalOrderSourceRows(contest.slatePlayers, rowsByProviderKey),
  );
  const gameSummary = summarizeProvisionalGames(provisionalRows);
  const snapshotTimestamp = new Date().toISOString();
  const snapshotId = randomUUID();
  const snapshot = {
    snapshotId,
    snapshotKind: 'provisional_order',
    contestId: contest.id,
    providerKey: 'sportsdataio_live',
    providerName: 'SportsDataIO Live',
    providerSnapshotTime: snapshotTimestamp,
    createdAt: snapshotTimestamp,
    status: 'validated',
    gamesTotal: gameSummary.totalGames,
    gamesScheduled: gameSummary.scheduledGames,
    gamesInProgress: gameSummary.inProgressGames,
    gamesFinal: gameSummary.finalGames,
    allGamesFinal: gameSummary.allGamesFinal,
    metadata: {
      season: seasonKey,
      week: contest.week,
      authMode,
      endpoints: {
        liveGames: 'scores/json/ScoresByWeek',
        livePlayerGameStats: 'stats/json/PlayerGameStatsByWeek',
        officialFinalizationHandoff: 'separate_final_review_path_required',
      },
    },
    rows: provisionalRows,
  };

  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', contest.id)
    .single();

  if (contestError || !contestRow) {
    throw new Error(`Unable to load live validation contest for snapshot persistence: ${contestError?.message || 'Contest not found.'}`);
  }

  const { error: snapshotError } = await supabase.from('contest_provisional_stat_snapshots').insert({
    snapshot_id: snapshotId,
    contest_id: contestRow.id,
    provider_key: snapshot.providerKey,
    provider_name: snapshot.providerName,
    provider_snapshot_time: snapshot.providerSnapshotTime,
    created_at: snapshot.createdAt,
    status: snapshot.status,
    games_total: snapshot.gamesTotal,
    games_scheduled: snapshot.gamesScheduled,
    games_in_progress: snapshot.gamesInProgress,
    games_final: snapshot.gamesFinal,
    all_games_final: snapshot.allGamesFinal,
    metadata: snapshot.metadata,
  });

  if (snapshotError) {
    throw new Error(`Unable to save live provisional snapshot: ${snapshotError.message}`);
  }

  const { error: rowError } = await supabase.from('contest_provisional_stat_snapshot_rows').insert(
    snapshot.rows.map((row) => ({
      snapshot_id: snapshotId,
      player_id: row.playerId,
      provider_player_id: row.providerPlayerId,
      provider_game_id: row.providerGameId,
      player_name: row.playerName,
      team_abbreviation: row.teamAbbreviation,
      opponent_abbreviation: row.opponentAbbreviation,
      home_away: row.homeAway,
      passing_yards: row.passingYards,
      passing_touchdowns: row.passingTouchdowns,
      game_status: row.gameStatus,
      provisional_rank: row.provisionalRank,
      provisional_rank_min: row.provisionalRankMin,
      provisional_rank_max: row.provisionalRankMax,
      provisional_rank_display: row.provisionalRankDisplay,
      sort_order: row.sortOrder,
    })),
  );

  if (rowError) {
    throw new Error(`Unable to save live provisional snapshot rows: ${rowError.message}`);
  }

  return snapshot;
}

async function fetchSportsDataIoJson(url, apiKey, authMode) {
  const requestUrl =
    authMode === 'query'
      ? `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`
      : url;
  const response = await fetch(requestUrl, {
    method: 'GET',
    headers:
      authMode === 'header'
        ? {
            'Ocp-Apim-Subscription-Key': apiKey,
            'content-type': 'application/json',
          }
        : {
            'content-type': 'application/json',
          },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SportsDataIO live request failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`);
  }

  return response.json();
}

function normalizeGameStatus(row) {
  if (row?.IsClosed === true || row?.isClosed === true) {
    return 'final';
  }

  const status = String(row?.Status ?? row?.status ?? '').toLowerCase();

  if (status.includes('final') || status === 'closed' || status === 'complete') {
    return 'final';
  }

  if (
    status.includes('progress') ||
    status.includes('live') ||
    status === 'inprogress' ||
    status === 'active'
  ) {
    return 'in_progress';
  }

  return 'scheduled';
}

function readNumber(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}
