import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import type { SupabaseClient } from '@supabase/supabase-js';
import { updateContestEntryCounts } from '@/lib/contest-data';
import { contestRankedPlayerCount } from '@/lib/contest-rules';
import type { Database } from '@/lib/supabase/types';

export type PersistedContestEntrySource = 'entry_created' | 'default_assigned' | 'user_saved';

export type PersistedContestEntry = {
  entryId: string;
  contestId: string;
  lineupOrder: string[];
  lastSavedAt: string | null;
  source: PersistedContestEntrySource;
  createdAt: string;
  updatedAt: string;
};

export type PersistedContestEntryForScoring = PersistedContestEntry & {
  userId: string;
};

type PersistedContestEntryRecord = PersistedContestEntry & {
  userId: string;
};

type PersistedContestEntryOptions = {
  dataFilePath?: string;
  contestDataFilePath?: string;
};

const persistedContestEntryRecordSchema = z.object({
  entryId: z.string().min(1),
  contestId: z.string().min(1),
  userId: z.string().min(1),
  lineupOrder: z.array(z.string().min(1)).max(contestRankedPlayerCount),
  lastSavedAt: z.string().datetime().nullable(),
  source: z.enum(['entry_created', 'default_assigned', 'user_saved']),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

const persistedContestEntryStoreSchema = z.object({
  version: z.literal(1),
  entries: z.array(persistedContestEntryRecordSchema),
});

const defaultContestEntryDataPath = path.join(process.cwd(), 'data', 'contest-entries.json');

type EntryDbRow = Database['public']['Tables']['entries']['Row'];
type EntryLineupDbRow = Database['public']['Tables']['entry_lineups']['Row'];
type EntryLineupDbInsert = Database['public']['Tables']['entry_lineups']['Insert'];
type ContestDbRow = Database['public']['Tables']['contests']['Row'];
type ContestSlatePlayerDbRow = Database['public']['Tables']['contest_slate_players']['Row'];

export async function getPersistedContestEntry(
  contestId: string,
  viewerId: string | null,
  players: string[],
  defaultSelectedOrder: string[],
  options?: PersistedContestEntryOptions,
) {
  if (!viewerId) {
    return null;
  }

  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);
    return (
      store.entries.find((entry) => entry.contestId === contestId && entry.userId === viewerId) ?? null
    );
  }

  const entry = await readPersistedContestEntryFromDatabase({
    contestId,
    viewerId,
    players,
    defaultSelectedOrder,
  });

  return entry;
}

export async function listPersistedContestIdsForViewer(
  viewerId: string | null,
  contestIds: string[],
  options?: PersistedContestEntryOptions,
) {
  if (!viewerId || contestIds.length === 0) {
    return new Set<string>();
  }

  const requestedContestIds = new Set(contestIds);

  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);

    return new Set(
      store.entries
        .filter((entry) => entry.userId === viewerId && requestedContestIds.has(entry.contestId))
        .map((entry) => entry.contestId),
    );
  }

  const supabase: SupabaseClient = await createSupabaseClient();
  const { data: contestRows, error: contestError } = await supabase
    .from('contests')
    .select('id, slug')
    .in('slug', contestIds);

  if (contestError) {
    throw new Error(`Unable to load contest entry states: ${contestError.message}`);
  }

  const contestSlugById = new Map((contestRows || []).map((contest) => [contest.id, contest.slug]));

  if (contestSlugById.size === 0) {
    return new Set<string>();
  }

  const { data: entryRows, error: entryError } = await supabase
    .from('entries')
    .select('contest_id')
    .eq('user_id', viewerId)
    .in('contest_id', [...contestSlugById.keys()]);

  if (entryError) {
    throw new Error(`Unable to load contest entry states: ${entryError.message}`);
  }

  return new Set(
    (entryRows || [])
      .map((entry) => contestSlugById.get(entry.contest_id))
      .filter((contestId): contestId is string => typeof contestId === 'string'),
  );
}

export async function ensurePersistedContestEntry({
  contestId,
  viewerId,
  players,
  defaultSelectedOrder,
  now = new Date().toISOString(),
  options,
}: {
  contestId: string;
  viewerId: string;
  players: string[];
  defaultSelectedOrder: string[];
  now?: string;
  options?: PersistedContestEntryOptions;
}) {
  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);
    const existingEntry = store.entries.find((entry) => entry.contestId === contestId && entry.userId === viewerId);

    if (existingEntry) {
      return {
        entry: existingEntry,
        created: false,
      };
    }

    const entry = buildPersistedContestEntryRecord({
      contestId,
      viewerId,
      now,
    });

    await writePersistedContestEntryStoreToFile(
      {
        version: 1,
        entries: [...store.entries, entry],
      },
      options?.dataFilePath,
    );

    await updateContestEntryCounts(contestId, {
      entryDelta: 1,
      paidEntryDelta: 0,
      now,
      dataFilePath: options?.contestDataFilePath,
    });

    return {
      entry,
      created: true,
    };
  }

  const existingEntry = await readPersistedContestEntryFromDatabase({
    contestId,
    viewerId,
    players,
    defaultSelectedOrder,
  });

  if (existingEntry) {
    return {
      entry: existingEntry,
      created: false,
    };
  }

  const entry = await createPersistedContestEntryInDatabase({
    contestId,
    viewerId,
    players,
    defaultSelectedOrder,
  });

  return {
    entry,
    created: true,
  };
}

export async function listPersistedContestEntriesForContest({
  contestId,
  players,
  defaultSelectedOrder,
  options,
}: {
  contestId: string;
  players: string[];
  defaultSelectedOrder: string[];
  options?: PersistedContestEntryOptions;
}) {
  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);

    return store.entries
      .filter((entry) => entry.contestId === contestId)
      .map((entry) => ({
        ...entry,
        userId: entry.userId,
      })) satisfies PersistedContestEntryForScoring[];
  }

  const contestRow = await getDatabaseContestRow(contestId);
  const supabase: SupabaseClient = await createSupabaseClient();
  const [
    { data: entryRows, error: entryError },
    { data: lineupRows, error: lineupError },
    { data: slateRows, error: slateError },
  ] = await Promise.all([
    supabase.from('entries').select('*').eq('contest_id', contestRow.id),
    supabase
      .from('entry_lineups')
      .select('*')
      .in(
        'entry_id',
        (
          (
            await supabase.from('entries').select('id').eq('contest_id', contestRow.id)
          ).data || []
        ).map((row: { id: string }) => row.id),
      ),
    supabase.from('contest_slate_players').select('*').eq('contest_id', contestRow.id),
  ]);

  if (entryError) {
    throw new Error(`Unable to read contest entries: ${entryError.message}`);
  }

  if (lineupError) {
    throw new Error(`Unable to read saved contest lineups: ${lineupError.message}`);
  }

  if (slateError) {
    throw new Error(`Unable to read contest slate for scoring: ${slateError.message}`);
  }

  const lineupRowsByEntryId = new Map<string, EntryLineupDbRow[]>();

  for (const lineupRow of (lineupRows || []) as EntryLineupDbRow[]) {
    const existing = lineupRowsByEntryId.get(lineupRow.entry_id) || [];
    existing.push(lineupRow);
    lineupRowsByEntryId.set(lineupRow.entry_id, existing);
  }

  return ((entryRows || []) as EntryDbRow[]).map((entryRow) => {
    const entry = toPersistedContestEntry({
      contestId,
      entryRow,
      lineupRows: lineupRowsByEntryId.get(entryRow.id) || [],
      slateRows: (slateRows || []) as ContestSlatePlayerDbRow[],
      players,
      defaultSelectedOrder,
    });

    return {
      ...entry,
      userId: entryRow.user_id,
    } satisfies PersistedContestEntryForScoring;
  });
}

export async function savePersistedContestEntryLineup({
  contestId,
  viewerId,
  players,
  defaultSelectedOrder,
  order,
  now = new Date().toISOString(),
  options,
}: {
  contestId: string;
  viewerId: string;
  players: string[];
  defaultSelectedOrder: string[];
  order: string[];
  now?: string;
  options?: PersistedContestEntryOptions;
}) {
  const normalizedOrder = normalizeLineupOrder(order, players, defaultSelectedOrder);

  if (normalizedOrder.length !== order.length || normalizedOrder.some((player, index) => player !== order[index])) {
    throw new Error('Submitted lineup order is invalid.');
  }

  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);
    const entryIndex = store.entries.findIndex((entry) => entry.contestId === contestId && entry.userId === viewerId);

    if (entryIndex === -1) {
      throw new Error('No persisted entry exists for this contest.');
    }

    const updatedEntry: PersistedContestEntryRecord = {
      ...store.entries[entryIndex],
      lineupOrder: normalizedOrder,
      lastSavedAt: now,
      source: 'user_saved',
      updatedAt: now,
    };

    const nextEntries = [...store.entries];
    nextEntries[entryIndex] = updatedEntry;

    await writePersistedContestEntryStoreToFile(
      {
        version: 1,
        entries: nextEntries,
      },
      options?.dataFilePath,
    );

    return {
      entry: updatedEntry,
    };
  }

  const entry = await updatePersistedContestEntryLineupInDatabase({
    contestId,
    viewerId,
    players,
    defaultSelectedOrder,
    order: normalizedOrder,
    now,
  });

  return {
    entry,
  };
}

export async function removePersistedContestEntry({
  contestId,
  viewerId,
  options,
}: {
  contestId: string;
  viewerId: string;
  options?: PersistedContestEntryOptions;
}) {
  if (shouldUseFileStore(options)) {
    const store = await readPersistedContestEntryStoreFromFile(options?.dataFilePath);
    const existingEntry = store.entries.find((entry) => entry.contestId === contestId && entry.userId === viewerId);

    await writePersistedContestEntryStoreToFile(
      {
        version: 1,
        entries: store.entries.filter((entry) => !(entry.contestId === contestId && entry.userId === viewerId)),
      },
      options?.dataFilePath,
    );

    if (existingEntry) {
      await updateContestEntryCounts(contestId, {
        entryDelta: -1,
        paidEntryDelta: 0,
        dataFilePath: options?.contestDataFilePath,
      });
    }

    return;
  }

  const supabase: SupabaseClient = await createSupabaseClient();
  const contestRow = await getDatabaseContestRow(contestId);
  const { data: existingEntry, error: entryError } = await supabase
    .from('entries')
    .select('id')
    .eq('contest_id', contestRow.id)
    .eq('user_id', viewerId)
    .maybeSingle();

  if (entryError) {
    throw new Error(`Unable to remove the contest entry: ${entryError.message}`);
  }

  if (!existingEntry) {
    return;
  }

  const { error } = await supabase.from('entries').delete().eq('contest_id', contestRow.id).eq('user_id', viewerId);

  if (error) {
    throw new Error(`Unable to remove the contest entry: ${error.message}`);
  }

  await updateContestEntryCounts(contestId, {
    entryDelta: -1,
    paidEntryDelta: 0,
    dataFilePath: options?.contestDataFilePath,
  });
}

function buildPersistedContestEntryRecord({
  contestId,
  viewerId,
  now,
}: {
  contestId: string;
  viewerId: string;
  now: string;
}) {
  return persistedContestEntryRecordSchema.parse({
    entryId: `entry-${randomUUID()}`,
    contestId,
    userId: viewerId,
    lineupOrder: [],
    lastSavedAt: null,
    source: 'entry_created',
    createdAt: now,
    updatedAt: now,
  });
}

async function readPersistedContestEntryStoreFromFile(dataFilePath = defaultContestEntryDataPath) {
  try {
    const fileContents = await readFile(dataFilePath, 'utf8');
    return persistedContestEntryStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (!notFound) {
      throw error;
    }

    return persistedContestEntryStoreSchema.parse({
      version: 1,
      entries: [],
    });
  }
}

async function writePersistedContestEntryStoreToFile(
  store: z.infer<typeof persistedContestEntryStoreSchema>,
  dataFilePath = defaultContestEntryDataPath,
) {
  const nextStore = persistedContestEntryStoreSchema.parse(store);
  const directory = path.dirname(dataFilePath);
  const tempFilePath = path.join(directory, `${path.basename(dataFilePath)}.${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(tempFilePath, `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8');
  await rename(tempFilePath, dataFilePath);
}

async function readPersistedContestEntryFromDatabase({
  contestId,
  viewerId,
  players,
  defaultSelectedOrder,
}: {
  contestId: string;
  viewerId: string;
  players: string[];
  defaultSelectedOrder: string[];
}) {
  const supabase: SupabaseClient = await createSupabaseClient();
  const contestRow = await getDatabaseContestRow(contestId);
  const { data: entryRow, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('contest_id', contestRow.id)
    .eq('user_id', viewerId)
    .maybeSingle();

  if (entryError) {
    throw new Error(`Unable to read the contest entry: ${entryError.message}`);
  }

  if (!entryRow) {
    return null;
  }

  const { data: lineupRows, error: lineupError } = await supabase
    .from('entry_lineups')
    .select('*')
    .eq('entry_id', entryRow.id)
    .order('rank_position', { ascending: true });

  if (lineupError) {
    throw new Error(`Unable to read the saved lineup: ${lineupError.message}`);
  }

  const { data: slateRows, error: slateError } = await supabase
    .from('contest_slate_players')
    .select('*')
    .eq('contest_id', contestRow.id);

  if (slateError) {
    throw new Error(`Unable to read the contest slate: ${slateError.message}`);
  }

  return toPersistedContestEntry({
    contestId,
    entryRow,
    lineupRows: (lineupRows || []) as EntryLineupDbRow[],
    slateRows: (slateRows || []) as ContestSlatePlayerDbRow[],
    players,
    defaultSelectedOrder,
  });
}

async function createPersistedContestEntryInDatabase({
  contestId,
  viewerId,
  players,
  defaultSelectedOrder,
}: {
  contestId: string;
  viewerId: string;
  players: string[];
  defaultSelectedOrder: string[];
}) {
  const supabase: SupabaseClient = await createSupabaseClient();
  const contestRow = await getDatabaseContestRow(contestId);
  const { data: slateRows, error: slateError } = await supabase
    .from('contest_slate_players')
    .select('*')
    .eq('contest_id', contestRow.id);

  if (slateError) {
    throw new Error(`Unable to read the contest slate: ${slateError.message}`);
  }

  const normalizedOrder = normalizeLineupOrder(defaultSelectedOrder, players, defaultSelectedOrder);
  const slateIdByName = buildSlatePlayerIdByName((slateRows || []) as ContestSlatePlayerDbRow[]);
  const slatePlayerIds = normalizedOrder.map((playerName) => {
    const slatePlayerId = slateIdByName.get(playerName);

    if (!slatePlayerId) {
      throw new Error(`Unable to create the contest entry: missing slate player for ${playerName}.`);
    }

    return slatePlayerId;
  });

  const { error: confirmationError } = await supabase.rpc('confirm_free_contest_entry', {
    target_contest_id: contestRow.id,
    target_slate_player_ids: slatePlayerIds,
  });

  if (confirmationError) {
    throw new Error(`Unable to confirm the free contest entry: ${confirmationError.message}`);
  }

  const confirmedEntry = await readPersistedContestEntryFromDatabase({
    contestId,
    viewerId,
    players,
    defaultSelectedOrder,
  });

  if (!confirmedEntry) {
    throw new Error('Unable to read the confirmed free contest entry.');
  }

  return confirmedEntry;
}

async function updatePersistedContestEntryLineupInDatabase({
  contestId,
  viewerId,
  players,
  defaultSelectedOrder,
  order,
  now,
}: {
  contestId: string;
  viewerId: string;
  players: string[];
  defaultSelectedOrder: string[];
  order: string[];
  now: string;
}) {
  const supabase: SupabaseClient = await createSupabaseClient();
  const contestRow = await getDatabaseContestRow(contestId);
  const { data: entryRow, error: entryError } = await supabase
    .from('entries')
    .select('*')
    .eq('contest_id', contestRow.id)
    .eq('user_id', viewerId)
    .maybeSingle();

  if (entryError) {
    throw new Error(`Unable to read the contest entry: ${entryError.message}`);
  }

  if (!entryRow) {
    throw new Error('No persisted entry exists for this contest.');
  }

  const { data: slateRows, error: slateError } = await supabase
    .from('contest_slate_players')
    .select('*')
    .eq('contest_id', contestRow.id);

  if (slateError) {
    throw new Error(`Unable to read the contest slate: ${slateError.message}`);
  }

  const slateIdByName = buildSlatePlayerIdByName((slateRows || []) as ContestSlatePlayerDbRow[]);
  const lineupInsert = order.map((playerName, index) => {
    const slatePlayerId = slateIdByName.get(playerName);

    if (!slatePlayerId) {
      throw new Error(`Unable to save this lineup right now: missing slate player for ${playerName}.`);
    }

    return {
      entry_id: entryRow.id,
      slate_player_id: slatePlayerId,
      rank_position: index + 1,
      created_at: now,
      updated_at: now,
    } satisfies EntryLineupDbInsert;
  });

  const { error: deleteError } = await supabase.from('entry_lineups').delete().eq('entry_id', entryRow.id);

  if (deleteError) {
    throw new Error(`Unable to replace the saved lineup: ${deleteError.message}`);
  }

  const { error: insertError } = await supabase.from('entry_lineups').insert(lineupInsert);

  if (insertError) {
    throw new Error(`Unable to save the lineup: ${insertError.message}`);
  }

  return toPersistedContestEntry({
    contestId,
    entryRow: entryRow as EntryDbRow,
    lineupRows: lineupInsert.map((lineup, index) => ({
      id: `lineup-${index + 1}`,
      entry_id: lineup.entry_id,
      slate_player_id: lineup.slate_player_id,
      rank_position: lineup.rank_position,
      created_at: lineup.created_at ?? now,
      updated_at: lineup.updated_at ?? now,
    })),
    slateRows: (slateRows || []) as ContestSlatePlayerDbRow[],
    players,
    defaultSelectedOrder,
  });
}

function toPersistedContestEntry({
  contestId,
  entryRow,
  lineupRows,
  slateRows,
  players,
  defaultSelectedOrder,
}: {
  contestId: string;
  entryRow: EntryDbRow;
  lineupRows: EntryLineupDbRow[];
  slateRows: ContestSlatePlayerDbRow[];
  players: string[];
  defaultSelectedOrder: string[];
}) {
  const playerNameBySlateId = new Map(
    slateRows.map((row) => [row.id, row.display_name || row.player_name]),
  );
  const orderedPlayers = lineupRows
    .slice()
    .sort((left, right) => left.rank_position - right.rank_position)
    .map((row) => playerNameBySlateId.get(row.slate_player_id))
    .filter((playerName): playerName is string => typeof playerName === 'string');
  const normalizedOrder = normalizeLineupOrder(orderedPlayers, players, defaultSelectedOrder);
  const lastSavedAt = entryRow.updated_at > entryRow.created_at ? entryRow.updated_at : null;

  return {
    entryId: entryRow.id,
    contestId,
    lineupOrder: normalizedOrder,
    lastSavedAt,
    source: orderedPlayers.length === 0 ? 'entry_created' : lastSavedAt ? 'user_saved' : 'default_assigned',
    createdAt: entryRow.created_at,
    updatedAt: entryRow.updated_at,
  } satisfies PersistedContestEntry;
}

function buildSlatePlayerIdByName(slateRows: ContestSlatePlayerDbRow[]) {
  return new Map(slateRows.map((row) => [row.display_name || row.player_name, row.id]));
}

function normalizeLineupOrder(value: unknown, players: string[], defaultSelectedOrder: string[]) {
  const fallbackSelectedOrder = defaultSelectedOrder.filter(
    (player, index, allPlayers) => players.includes(player) && allPlayers.indexOf(player) === index,
  );

  if (!Array.isArray(value)) {
    return [...fallbackSelectedOrder];
  }

  if (value.length === 0) {
    return [];
  }

  const filteredPlayers = value.filter((item): item is string => typeof item === 'string' && players.includes(item));

  if (filteredPlayers.length !== contestRankedPlayerCount || new Set(filteredPlayers).size !== contestRankedPlayerCount) {
    return [...fallbackSelectedOrder];
  }

  return filteredPlayers;
}

function shouldUseFileStore(options?: PersistedContestEntryOptions) {
  return (
    Boolean(options?.dataFilePath) ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

async function createSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

async function getDatabaseContestRow(contestId: string) {
  const supabase: SupabaseClient = await createSupabaseClient();
  const { data: row, error } = await supabase.from('contests').select('*').eq('slug', contestId).maybeSingle();

  if (error) {
    throw new Error(`Unable to load the contest: ${error.message}`);
  }

  if (!row) {
    throw new Error('Contest not found.');
  }

  return row as ContestDbRow;
}
