import type {
  ProvisionalContestStatSnapshot,
  ReplayBackedContestStatsProviderInput,
} from './stats-provider';

type LiveValidationSlatePlayer = ReplayBackedContestStatsProviderInput['slatePlayers'][number];
type LiveValidationSlatePlayerRow = LiveValidationSlatePlayer & {
  sortOrderInternal: number;
};

type SupabaseClientLike = {
  from: (table: string) => {
    select: (columns: string) => {
      eq: (column: string, value: string) => Promise<{
        data: Array<Record<string, unknown>> | null;
        error: { message: string } | null;
      }> & {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
      };
    };
  };
};

export async function loadInSeasonLiveValidationContestInput(
  contestSlug: string,
  createSupabaseClient = defaultCreateSupabaseClient,
): Promise<ReplayBackedContestStatsProviderInput> {
  const trimmedContestSlug = contestSlug.trim();

  if (!trimmedContestSlug) {
    throw new Error('Add a contest slug before running the in-season live validation path.');
  }

  const supabase = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id, slug, title, season, week')
    .eq('slug', trimmedContestSlug)
    .single();

  if (contestError || !contestRow) {
    throw new Error(`Unable to load in-season live validation contest: ${contestError?.message || 'Contest not found.'}`);
  }

  const contestId = readRequiredString(contestRow.id, 'Contest id');
  const slateQuery = supabase
    .from('contest_slate_players')
    .select(
      'player_id, provider_player_id, provider_game_id, display_name, player_name, team_abbreviation, opponent_abbreviation, home_away, sort_order_internal',
    )
    .eq('contest_id', contestId);
  const { data: allSlateRows, error: allSlateRowsError } = await slateQuery;

  if (allSlateRowsError) {
    throw new Error(`Unable to load in-season live validation slate rows: ${allSlateRowsError.message}`);
  }

  const normalizedSlateRows = Array.isArray(allSlateRows)
    ? allSlateRows
        .map(normalizeSlatePlayerRow)
        .sort((left, right) => left.sortOrderInternal - right.sortOrderInternal)
    : [];

  if (normalizedSlateRows.length === 0) {
    throw new Error(`No contest_slate_players rows are saved yet for ${trimmedContestSlug}.`);
  }

  return {
    id: readRequiredString(contestRow.slug, 'Contest slug'),
    title: readRequiredString(contestRow.title, 'Contest title'),
    season: readRequiredNumber(contestRow.season, 'Contest season'),
    week: readRequiredNumber(contestRow.week, 'Contest week'),
    slatePlayers: normalizedSlateRows.map(({ sortOrderInternal, ...player }) => player),
  };
}

export async function refreshInSeasonLiveContestSnapshot(
  contestSlug: string,
  options?: {
    createSupabaseClient?: () => Promise<SupabaseClientLike>;
    fetchSnapshot?: (
      contest: ReplayBackedContestStatsProviderInput,
    ) => Promise<ProvisionalContestStatSnapshot>;
  },
): Promise<ProvisionalContestStatSnapshot> {
  const contest = await loadInSeasonLiveValidationContestInput(
    contestSlug,
    options?.createSupabaseClient,
  );

  if (!options?.fetchSnapshot) {
    throw new Error('In-season live validation requires an explicit live snapshot fetch implementation.');
  }

  return options.fetchSnapshot(contest);
}

export function buildInSeasonLiveRefreshMessage(
  contestTitle: string,
  snapshot: ProvisionalContestStatSnapshot,
) {
  return `Saved SportsDataIO live provisional snapshot for ${contestTitle}: ${snapshot.gamesScheduled} scheduled, ${snapshot.gamesInProgress} in progress, ${snapshot.gamesFinal} final.`;
}

async function defaultCreateSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient() as unknown as SupabaseClientLike;
}

function normalizeSlatePlayerRow(row: Record<string, unknown>): LiveValidationSlatePlayerRow {
  const homeAway = readRequiredString(row.home_away, 'Slate player home_away');

  if (homeAway !== 'home' && homeAway !== 'away') {
    throw new Error(`Slate player home_away must be home or away. Received ${homeAway}.`);
  }

  return {
    playerId: readRequiredString(row.player_id, 'Slate player player_id'),
    providerPlayerId: readRequiredString(row.provider_player_id, 'Slate player provider_player_id'),
    providerGameId: readRequiredString(row.provider_game_id, 'Slate player provider_game_id'),
    displayName: readRequiredString(row.display_name ?? row.player_name, 'Slate player display name'),
    teamAbbreviation: readRequiredString(row.team_abbreviation, 'Slate player team_abbreviation'),
    opponentAbbreviation: readRequiredString(row.opponent_abbreviation, 'Slate player opponent_abbreviation'),
    homeAway,
    sortOrderInternal: readRequiredNumber(row.sort_order_internal, 'Slate player sort_order_internal'),
  };
}

function readRequiredString(value: unknown, label: string) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }

  throw new Error(`${label} is missing.`);
}

function readRequiredNumber(value: unknown, label: string) {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim()) {
    const parsedValue = Number(value);

    if (Number.isInteger(parsedValue)) {
      return parsedValue;
    }
  }

  throw new Error(`${label} is missing.`);
}
