import {
  replayValidationContestDescription,
  replayValidationContestId,
  replayValidationContestTitle,
  replayValidationContestWarning,
  replayValidationSlateRows,
} from './replay-provisional-validation-config';
import {
  fetchAndPersistReplayProvisionalSnapshot,
  type ProvisionalContestStatSnapshot,
} from './stats-provider';

export { replayValidationContestId } from './replay-provisional-validation-config';

const replayValidationRankedPlayerCount = 10;

type ReplayValidationSlatePlayer = {
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

type ReplayValidationContestInput = {
  id: string;
  title: string;
  season: number;
  week: number;
  slatePlayers: ReplayValidationSlatePlayer[];
};

type SupabaseClientLike = {
  from: (table: string) => {
    upsert: (payload: unknown, options?: { onConflict?: string }) => Promise<{ error: { message: string } | null }>;
    select: (columns: string) => {
      eq: (column: string, value: string) => {
        single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }>;
      };
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    insert: (payload: unknown) => Promise<{ error: { message: string } | null }>;
  };
};

export function buildReplayValidationContestInput(): ReplayValidationContestInput {
  return {
    id: replayValidationContestId,
    title: replayValidationContestTitle,
    season: 2025,
    week: 1,
    slatePlayers: replayValidationSlateRows.map(
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
        position: 'QB' as const,
        activeStatus: 'active',
        sortOrderInternal,
      }),
    ),
  };
}

export async function refreshReplayValidationContestSnapshot(options?: {
  createSupabaseClient?: () => Promise<SupabaseClientLike>;
  fetchSnapshot?: (
    contest: ReplayValidationContestInput,
  ) => Promise<ProvisionalContestStatSnapshot>;
}): Promise<ProvisionalContestStatSnapshot> {
  const contest = buildReplayValidationContestInput();
  await upsertReplayValidationContest(contest, options?.createSupabaseClient);
  return (options?.fetchSnapshot ?? fetchAndPersistReplayProvisionalSnapshot)(contest);
}

export function buildReplayValidationRefreshMessage(snapshot: ProvisionalContestStatSnapshot) {
  return `Saved Replay provisional snapshot for ${replayValidationContestTitle}: ${snapshot.gamesScheduled} scheduled, ${snapshot.gamesInProgress} in progress, ${snapshot.gamesFinal} final.`;
}

async function upsertReplayValidationContest(
  contest: ReplayValidationContestInput,
  createSupabaseClient = defaultCreateSupabaseClient,
) {
  const supabase = await createSupabaseClient();
  const now = new Date().toISOString();
  const lineupPlayers = contest.slatePlayers.slice(0, replayValidationRankedPlayerCount).map((player) => player.displayName);

  const { error: contestError } = await supabase.from('contests').upsert(
    {
      slug: contest.id,
      title: contest.title,
      description: replayValidationContestDescription,
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
    .eq('slug', contest.id)
    .single();

  if (contestLookupError || !contestRow) {
    throw new Error(
      `Unable to load Replay validation contest row: ${contestLookupError?.message || 'Contest not found.'}`,
    );
  }

  const { error: slateDeleteError } = await supabase
    .from('contest_slate_players')
    .delete()
    .eq('contest_id', contestRow.id);

  if (slateDeleteError) {
    throw new Error(`Unable to clear Replay validation slate rows: ${slateDeleteError.message}`);
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
    throw new Error(`Unable to save Replay validation slate rows: ${slateInsertError.message}`);
  }

  const { error: validationError } = await supabase.from('contest_validation_results').upsert(
    {
      contest_id: contestRow.id,
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
}

async function defaultCreateSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as unknown as SupabaseClientLike;
}
