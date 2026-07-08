import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  replayValidationContestDescription,
  replayValidationContestId,
  replayValidationContestTitle,
  replayValidationContestWarning,
  replayValidationSlateRows,
} from '../lib/replay-provisional-validation-config.ts';
import {
  buildProviderRowKey,
  buildProvisionalOrderRows,
  buildProvisionalOrderSourceRows,
  summarizeProvisionalGames,
} from '../lib/provisional-ordering.ts';

const replayBaseUrl = 'https://replay.sportsdata.io/api/v3/nfl';
const replaySeasonKey = '2025reg';
const replayWeek = 1;
const expectedTopFour = ['Josh Allen', 'Justin Herbert', 'Brock Purdy', 'Patrick Mahomes'];

const replayValidationSlate = replayValidationSlateRows.map(
  ([
    playerId,
    providerPlayerId,
    providerGameId,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway,
    gameStartTime,
    sortOrderInternal,
  ]) => ({
    playerId,
    providerPlayerId,
    providerGameId,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway,
    gameStartTime,
    position: 'QB',
    activeStatus: 'active',
    sortOrderInternal,
  }),
);

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const env = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
  const replayApiKey = process.env.PICKRANK_SPORTSDATAIO_REPLAY_API_KEY || env.PICKRANK_SPORTSDATAIO_REPLAY_API_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for live validation.');
  }

  if (!replayApiKey) {
    throw new Error('Missing PICKRANK_SPORTSDATAIO_REPLAY_API_KEY for live validation.');
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
  const contestId = await upsertReplayValidationContest(supabase);
  const snapshot = await fetchReplaySnapshot(replayApiKey);
  await persistReplaySnapshot(supabase, contestId, snapshot);
  const savedRows = await readReplaySnapshotRows(supabase, snapshot.snapshotId);

  assertValidation(snapshot, savedRows);

  console.log(
    JSON.stringify(
      {
        contestSlug: replayValidationContestId,
        snapshotId: snapshot.snapshotId,
        providerSnapshotTime: snapshot.providerSnapshotTime,
        gamesTotal: snapshot.gamesTotal,
        gamesScheduled: snapshot.gamesScheduled,
        gamesInProgress: snapshot.gamesInProgress,
        gamesFinal: snapshot.gamesFinal,
        topFive: savedRows.slice(0, 5).map((row) => ({
          rank: row.provisional_rank_display,
          playerName: row.player_name,
          passingYards: row.passing_yards,
          gameStatus: row.game_status,
        })),
      },
      null,
      2,
    ),
  );
}

async function upsertReplayValidationContest(supabase) {
  const now = new Date().toISOString();
  const lineupPlayers = replayValidationSlate.slice(0, 10).map((player) => player.displayName);

  const { error: contestError } = await supabase.from('contests').upsert(
    {
      slug: replayValidationContestId,
      title: replayValidationContestTitle,
      description: replayValidationContestDescription,
      season: 2025,
      week: 1,
      contest_type: 'public_paid',
      stat_type: 'qb_passing_yards',
      slate_size: replayValidationSlate.length,
      entry_fee_cents: 0,
      entry_count: 0,
      paid_entries_count: 0,
      min_entries_to_run: 1,
      status: 'live',
      visibility_status: 'hidden',
      is_featured: false,
      display_order: 99,
      entry_open_time: '2025-09-04T16:00:00.000Z',
      lock_time: '2025-09-04T20:20:00.000Z',
      lineup_players: lineupPlayers,
      created_by_admin_id: null,
      published_by_admin_id: null,
      published_at: null,
      updated_at: now,
    },
    { onConflict: 'slug' },
  );

  if (contestError) {
    throw new Error(`Unable to upsert Replay validation contest: ${contestError.message}`);
  }

  const { data: contestRow, error: contestLookupError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', replayValidationContestId)
    .single();

  if (contestLookupError || !contestRow) {
    throw new Error(`Unable to load Replay validation contest row: ${contestLookupError?.message || 'Contest not found.'}`);
  }

  const contestId = contestRow.id;

  const { error: slateDeleteError } = await supabase.from('contest_slate_players').delete().eq('contest_id', contestId);

  if (slateDeleteError) {
    throw new Error(`Unable to clear Replay validation slate rows: ${slateDeleteError.message}`);
  }

  const { error: slateInsertError } = await supabase.from('contest_slate_players').insert(
    replayValidationSlate.map((player) => ({
      contest_id: contestId,
      player_external_id: player.providerPlayerId,
      player_id: player.playerId,
      provider_player_id: player.providerPlayerId,
      provider_game_id: player.providerGameId,
      player_name: player.displayName,
      display_name: player.displayName,
      team_abbreviation: player.teamAbbreviation,
      opponent_abbreviation: player.opponentAbbreviation,
      opponent_context: player.homeAway === 'home' ? 'vs' : '@',
      home_away: player.homeAway,
      display_order: player.sortOrderInternal,
      sort_order_internal: player.sortOrderInternal,
      game_start_time: player.gameStartTime,
      position: player.position,
      active_status: player.activeStatus,
    })),
  );

  if (slateInsertError) {
    throw new Error(`Unable to save Replay validation slate rows: ${slateInsertError.message}`);
  }

  const { error: validationError } = await supabase.from('contest_validation_results').upsert(
    {
      contest_id: contestId,
      status: 'passed',
      errors: [],
      warnings: [replayValidationContestWarning],
      validated_at: now,
      validated_by_admin_id: null,
    },
    { onConflict: 'contest_id' },
  );

  if (validationError) {
    throw new Error(`Unable to save Replay validation result: ${validationError.message}`);
  }

  return contestId;
}

async function fetchReplaySnapshot(replayApiKey) {
  const [scoresPayload, playerStatsPayload] = await Promise.all([
    fetchReplayJson(`${replayBaseUrl}/stats/json/scoresbyweek/${replaySeasonKey}/${replayWeek}`, replayApiKey),
    fetchReplayJson(`${replayBaseUrl}/stats/json/playergamestatsbyweek/${replaySeasonKey}/${replayWeek}`, replayApiKey),
  ]);

  const scores = Array.isArray(scoresPayload) ? scoresPayload : [];
  const playerStats = Array.isArray(playerStatsPayload) ? playerStatsPayload : [];
  const scoreStatusByGameId = new Map(
    scores.map((score) => [String(score.ScoreID), normalizeReplayGameStatus(score)]),
  );
  const rowsByProviderKey = new Map();

  replayValidationSlate.forEach((player) => {
    const matchingPlayerStat = playerStats.find(
      (stat) => String(stat.PlayerID) === player.providerPlayerId && String(stat.ScoreID) === player.providerGameId,
    );
    const gameStatus = scoreStatusByGameId.get(player.providerGameId) || normalizeReplayGameStatus(matchingPlayerStat);

    rowsByProviderKey.set(buildProviderRowKey(player.providerPlayerId, player.providerGameId), {
      passingYards: readWholeNumber(matchingPlayerStat?.PassingYards),
      passingTouchdowns: readWholeNumber(matchingPlayerStat?.PassingTouchdowns),
      gameStatus,
    });
  });

  const provisionalRows = buildProvisionalOrderRows(
    buildProvisionalOrderSourceRows(replayValidationSlate, rowsByProviderKey),
  );
  const gameSummary = summarizeProvisionalGames(provisionalRows);
  const snapshotTime = new Date().toISOString();

  return {
    snapshotId: randomUUID(),
    providerSnapshotTime: snapshotTime,
    createdAt: snapshotTime,
    gamesTotal: gameSummary.totalGames,
    gamesScheduled: gameSummary.scheduledGames,
    gamesInProgress: gameSummary.inProgressGames,
    gamesFinal: gameSummary.finalGames,
    allGamesFinal: gameSummary.allGamesFinal,
    rows: provisionalRows,
  };
}

async function persistReplaySnapshot(supabase, contestId, snapshot) {
  const { error: snapshotError } = await supabase.from('contest_provisional_stat_snapshots').insert({
    snapshot_id: snapshot.snapshotId,
    contest_id: contestId,
    provider_key: 'sportsdataio_replay',
    provider_name: 'SportsDataIO Replay',
    provider_snapshot_time: snapshot.providerSnapshotTime,
    created_at: snapshot.createdAt,
    status: 'validated',
    games_total: snapshot.gamesTotal,
    games_scheduled: snapshot.gamesScheduled,
    games_in_progress: snapshot.gamesInProgress,
    games_final: snapshot.gamesFinal,
    all_games_final: snapshot.allGamesFinal,
    metadata: {
      season: replaySeasonKey,
      week: replayWeek,
      endpoints: {
        liveGames: 'stats/json/scoresbyweek',
        livePlayerGameStats: 'stats/json/playergamestatsbyweek',
        officialFinalizationHandoff: 'unverified_in_this_recording',
      },
      validationContest: replayValidationContestId,
    },
  });

  if (snapshotError) {
    throw new Error(`Unable to save Replay validation snapshot: ${snapshotError.message}`);
  }

  const { error: rowError } = await supabase.from('contest_provisional_stat_snapshot_rows').insert(
    snapshot.rows.map((row) => ({
      snapshot_id: snapshot.snapshotId,
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
    throw new Error(`Unable to save Replay validation snapshot rows: ${rowError.message}`);
  }
}

async function readReplaySnapshotRows(supabase, snapshotId) {
  const { data, error } = await supabase
    .from('contest_provisional_stat_snapshot_rows')
    .select('*')
    .eq('snapshot_id', snapshotId)
    .order('sort_order', { ascending: true });

  if (error || !data) {
    throw new Error(`Unable to read back Replay validation snapshot rows: ${error?.message || 'Rows missing.'}`);
  }

  return data;
}

function assertValidation(snapshot, savedRows) {
  if (savedRows.length !== replayValidationSlate.length) {
    throw new Error(`Replay validation saved ${savedRows.length} rows, expected ${replayValidationSlate.length}.`);
  }

  if (snapshot.gamesTotal !== 10 || snapshot.gamesScheduled !== 0 || snapshot.gamesInProgress !== 0 || snapshot.gamesFinal !== 10) {
    throw new Error(
      `Replay validation saved unexpected game counts: total=${snapshot.gamesTotal}, scheduled=${snapshot.gamesScheduled}, in_progress=${snapshot.gamesInProgress}, final=${snapshot.gamesFinal}.`,
    );
  }

  const actualTopFour = savedRows.slice(0, 4).map((row) => row.player_name);

  if (JSON.stringify(actualTopFour) !== JSON.stringify(expectedTopFour)) {
    throw new Error(`Replay validation saved unexpected QB order: ${actualTopFour.join(', ')}.`);
  }
}

async function fetchReplayJson(url, replayApiKey) {
  const requestUrl = new URL(url);
  requestUrl.searchParams.set('key', replayApiKey);

  const response = await fetch(requestUrl, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SportsDataIO Replay request failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`,
    );
  }

  return response.json();
}

function normalizeReplayGameStatus(row) {
  if (!row) {
    return 'scheduled';
  }

  if (row.IsClosed === true) {
    return 'final';
  }

  const status = String(row.Status || '').toLowerCase();

  if (status.includes('final') || status === 'f' || status === 'f/ot' || status === 'closed') {
    return 'final';
  }

  if (status.includes('in progress') || status.includes('halftime') || status.includes('overtime') || status === 'inprogress') {
    return 'in_progress';
  }

  return 'scheduled';
}

function readWholeNumber(value) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return 0;
}

async function loadEnvFile(envFilePath) {
  try {
    const contents = await readFile(envFilePath, 'utf8');
    const values = {};

    contents.split('\n').forEach((line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        return;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();

      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      values[key] = value;
    });

    return values;
  } catch {
    return {};
  }
}
