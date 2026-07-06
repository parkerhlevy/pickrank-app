import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import {
  buildInSeasonLiveValidationContest,
  inSeasonLiveValidationContestId,
} from '../lib/in-season-live-validation-prep.ts';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const env = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const liveApiKey = process.env.PICKRANK_SPORTSDATAIO_LIVE_API_KEY || env.PICKRANK_SPORTSDATAIO_LIVE_API_KEY;
  const liveBaseUrl =
    process.env.PICKRANK_SPORTSDATAIO_LIVE_BASE_URL ||
    env.PICKRANK_SPORTSDATAIO_LIVE_BASE_URL ||
    'https://api.sportsdata.io/v3/nfl';

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY for live validation contest prep.');
  }

  if (!liveApiKey) {
    throw new Error('Missing PICKRANK_SPORTSDATAIO_LIVE_API_KEY for live validation contest prep.');
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const sourceContest = await loadSourceContest(supabase, 'week-1-qb-passing-yards');
  const normalizedLiveBaseUrl = liveBaseUrl.replace(/\/$/, '');
  const [scores, depthCharts, teams] = await Promise.all([
    fetchSportsDataIoJson(`${normalizedLiveBaseUrl}/scores/json/ScoresByWeek/2026reg/1`, liveApiKey),
    fetchSportsDataIoJson(`${normalizedLiveBaseUrl}/scores/json/DepthCharts`, liveApiKey),
    fetchSportsDataIoJson(`${normalizedLiveBaseUrl}/scores/json/Teams`, liveApiKey),
  ]);
  const teamKeyById = new Map(
    teams.map((team) => [String(team.TeamID), String(team.Key)]),
  );

  const preparedContest = buildInSeasonLiveValidationContest({
    sourceContestId: sourceContest.slug,
    sourceContestTitle: sourceContest.title,
    season: sourceContest.season,
    week: sourceContest.week,
    sourceSlatePlayers: sourceContest.slatePlayers,
    scheduleGames: scores.map((score) => ({
      scoreId: String(score.ScoreID),
      awayTeam: String(score.AwayTeam),
      homeTeam: String(score.HomeTeam),
      date: normalizeDateTime(score.Date),
    })),
    quarterbacks: depthCharts.flatMap((team) =>
      (team.Offense || [])
        .filter((row) => row.Position === 'QB')
        .map((row) => ({
          teamAbbreviation: readRequiredTeamKey(teamKeyById, team.TeamID),
          playerId: String(row.PlayerID),
          name: String(row.Name),
          depthOrder: Number(row.DepthOrder || 999),
        })),
    ),
  });

  await upsertPreparedContest(supabase, preparedContest);

  console.log(
    JSON.stringify(
      {
        contestSlug: preparedContest.id,
        slateSize: preparedContest.slatePlayers.length,
        replacements: preparedContest.replacements,
        matchupChanges: preparedContest.matchupChanges,
        firstFive: preparedContest.slatePlayers.slice(0, 5).map((player) => ({
          displayName: player.displayName,
          providerPlayerId: player.providerPlayerId,
          providerGameId: player.providerGameId,
          teamAbbreviation: player.teamAbbreviation,
          opponentAbbreviation: player.opponentAbbreviation,
          homeAway: player.homeAway,
        })),
      },
      null,
      2,
    ),
  );
}

async function loadSourceContest(supabase, slug) {
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id, slug, title, season, week')
    .eq('slug', slug)
    .single();

  if (contestError || !contestRow) {
    throw new Error(`Unable to load source contest ${slug}: ${contestError?.message || 'Contest not found.'}`);
  }

  const { data: slateRows, error: slateError } = await supabase
    .from('contest_slate_players')
    .select(
      'player_id, provider_player_id, provider_game_id, display_name, player_name, team_abbreviation, opponent_abbreviation, home_away, game_start_time, position, active_status, sort_order_internal',
    )
    .eq('contest_id', contestRow.id);

  if (slateError) {
    throw new Error(`Unable to load source contest slate rows: ${slateError.message}`);
  }

      return {
        slug: contestRow.slug,
        title: contestRow.title,
        season: contestRow.season,
        week: contestRow.week,
        slatePlayers: (slateRows || []).map((row) => ({
          playerId: row.player_id,
          providerPlayerId: row.provider_player_id || row.player_id,
          providerGameId: row.provider_game_id || row.player_id,
          displayName: row.display_name || row.player_name,
          teamAbbreviation: row.team_abbreviation,
          opponentAbbreviation: row.opponent_abbreviation,
      homeAway: row.home_away,
      gameStartTime: normalizeDateTime(row.game_start_time),
      position: row.position,
      activeStatus: row.active_status,
      sortOrderInternal: row.sort_order_internal,
    })),
  };
}

async function upsertPreparedContest(supabase, contest) {
  const now = new Date().toISOString();

  const { error: contestError } = await supabase.from('contests').upsert(
    {
      slug: contest.id,
      title: contest.title,
      description: contest.description,
      season: contest.season,
      week: contest.week,
      contest_type: 'public_paid',
      stat_type: 'qb_passing_yards',
      slate_size: contest.slatePlayers.length,
      entry_fee_cents: 0,
      entry_count: 0,
      paid_entries_count: 0,
      min_entries_to_run: 1,
      status: 'live',
      visibility_status: 'hidden',
      is_featured: false,
      display_order: 98,
      entry_open_time: contest.slatePlayers[0]?.gameStartTime ?? now,
      lock_time: contest.slatePlayers[0]?.gameStartTime ?? now,
      lineup_players: contest.lineupPlayers,
      created_by_admin_id: null,
      published_by_admin_id: null,
      published_at: null,
      updated_at: now,
    },
    { onConflict: 'slug' },
  );

  if (contestError) {
    throw new Error(`Unable to upsert live validation contest: ${contestError.message}`);
  }

  const { data: contestRow, error: contestLookupError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', contest.id)
    .single();

  if (contestLookupError || !contestRow) {
    throw new Error(`Unable to load live validation contest row: ${contestLookupError?.message || 'Contest not found.'}`);
  }

  const { error: slateDeleteError } = await supabase
    .from('contest_slate_players')
    .delete()
    .eq('contest_id', contestRow.id);

  if (slateDeleteError) {
    throw new Error(`Unable to clear live validation slate rows: ${slateDeleteError.message}`);
  }

  const { error: slateInsertError } = await supabase.from('contest_slate_players').insert(
    contest.slatePlayers.map((player) => ({
      contest_id: contestRow.id,
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
    throw new Error(`Unable to save live validation slate rows: ${slateInsertError.message}`);
  }

  const { error: validationError } = await supabase.from('contest_validation_results').upsert(
    {
      contest_id: contestRow.id,
      status: 'passed',
      errors: [],
      warnings: [contest.warning],
      validated_at: now,
      validated_by_admin_id: null,
    },
    { onConflict: 'contest_id' },
  );

  if (validationError) {
    throw new Error(`Unable to save live validation result: ${validationError.message}`);
  }
}

async function fetchSportsDataIoJson(url, apiKey) {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'content-type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`SportsDataIO request failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`);
  }

  return response.json();
}

function readRequiredTeamKey(teamKeyById, teamId) {
  const key = teamKeyById.get(String(teamId));

  if (!key) {
    throw new Error(`Unable to map SportsDataIO TeamID ${teamId} to a team key.`);
  }

  return key;
}

function normalizeDateTime(value) {
  const date = new Date(value);
  return date.toISOString();
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
