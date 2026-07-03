import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  getProvisionalStatsSnapshotFilePath,
  getSportsDataIoReplayApiKey,
  getSportsDataIoReplayBaseUrl,
  getStatsProviderFetchToken,
  getStatsProviderFetchUrl,
  getPersistedStatsSnapshotFilePath,
  getStatsProviderFilePath,
  getStatsProviderMode,
  hasBrowserSupabaseConfig,
} from '@/lib/env';
import {
  buildProvisionalOrderRows,
  buildProvisionalOrderSourceRows,
  buildProviderRowKey,
  summarizeProvisionalGames,
  type ProvisionalGameStatus,
  type ProvisionalOrderRow,
} from '@/lib/provisional-ordering';
import type { Database, Json } from '@/lib/supabase/types';

export type StatsProviderMode = 'disabled' | 'file' | 'persisted_snapshot';

export type ContestStatsProviderPlayer = {
  playerId: string;
  providerPlayerId: string;
  providerGameId: string;
  displayName: string;
};

export type ContestStatsProviderInput = {
  id: string;
  title: string;
  slatePlayers: ContestStatsProviderPlayer[];
};

export type ProviderStatRow = {
  providerPlayerId: string;
  providerGameId: string;
  playerName?: string;
  finalStat: number;
  passingTouchdowns: number;
  gameStatus: 'scheduled' | 'in_progress' | 'final';
};

export type ContestStatSnapshot = {
  contestId: string;
  providerName: string;
  providerSnapshotTime: string;
  rows: ProviderStatRow[];
};

export interface StatsProviderAdapter {
  getContestStatSnapshot(contest: ContestStatsProviderInput): Promise<ContestStatSnapshot>;
}

type StatsProviderAdapterOptions = {
  providerMode?: StatsProviderMode;
  providerStoreFilePath?: string;
  persistedSnapshotFilePath?: string;
};

type StatsProviderFetchOptions = {
  fetchUrl?: string;
  fetchToken?: string;
  persistedSnapshotFilePath?: string;
};

export type ReplayBackedContestStatsProviderInput = ContestStatsProviderInput & {
  season: number;
  week: number;
  slatePlayers: Array<
    ContestStatsProviderPlayer & {
      teamAbbreviation: string;
      opponentAbbreviation: string;
      homeAway: 'home' | 'away';
    }
  >;
};

export type ProvisionalStatsSnapshotStatus = z.infer<typeof persistedSnapshotStatusSchema>;

export type ProvisionalContestStatSnapshot = {
  snapshotId: string;
  snapshotKind: 'provisional_order';
  contestId: string;
  providerKey: string;
  providerName: string;
  providerSnapshotTime: string;
  createdAt: string;
  status: ProvisionalStatsSnapshotStatus;
  gamesTotal: number;
  gamesScheduled: number;
  gamesInProgress: number;
  gamesFinal: number;
  allGamesFinal: boolean;
  metadata?: Record<string, unknown> | null;
  rows: ProvisionalOrderRow[];
};

type ProvisionalStatsProviderFetchOptions = {
  apiKey?: string;
  baseUrl?: string;
  persistedSnapshotFilePath?: string;
  now?: string;
};

type ContestStatSnapshotDbRow = Database['public']['Tables']['contest_stat_snapshots']['Row'];
type ContestStatSnapshotRowDbRow = Database['public']['Tables']['contest_stat_snapshot_rows']['Row'];
type ContestProvisionalStatSnapshotDbRow =
  Database['public']['Tables']['contest_provisional_stat_snapshots']['Row'];
type ContestProvisionalStatSnapshotRowDbRow =
  Database['public']['Tables']['contest_provisional_stat_snapshot_rows']['Row'];

const providerStatRowSchema = z.object({
  providerPlayerId: z.string().min(1),
  providerGameId: z.string().min(1),
  playerName: z.string().min(1).optional(),
  finalStat: z.number().int().nonnegative(),
  passingTouchdowns: z.number().int().nonnegative(),
  gameStatus: z.enum(['scheduled', 'in_progress', 'final']),
});

const providerContestSnapshotSchema = z.object({
  contestId: z.string().min(1),
  providerName: z.string().min(1),
  providerSnapshotTime: z.string().datetime(),
  rows: z.array(providerStatRowSchema),
});

const providerStatsStoreSchema = z.object({
  version: z.literal(1),
  contests: z.array(providerContestSnapshotSchema),
});

const persistedSnapshotStatusSchema = z.enum(['fetched', 'validated', 'failed']);

const persistedContestSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  contestId: z.string().min(1),
  providerName: z.string().min(1),
  providerSnapshotTime: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: persistedSnapshotStatusSchema,
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  rows: z.array(providerStatRowSchema),
});

const persistedContestSnapshotStoreSchema = z.object({
  version: z.literal(1),
  snapshots: z.array(persistedContestSnapshotSchema),
});

type PersistedContestSnapshot = z.infer<typeof persistedContestSnapshotSchema>;
type PersistedContestSnapshotStore = z.infer<typeof persistedContestSnapshotStoreSchema>;

const defaultPersistedStatsSnapshotDataPath = path.join(process.cwd(), 'data', 'contest-stat-snapshots.json');
const defaultPersistedProvisionalStatsSnapshotDataPath = path.join(
  process.cwd(),
  'data',
  'contest-provisional-snapshots.json',
);

const provisionalOrderRowSchema = z.object({
  playerId: z.string().min(1),
  providerPlayerId: z.string().min(1),
  providerGameId: z.string().min(1),
  playerName: z.string().min(1),
  teamAbbreviation: z.string().min(1),
  opponentAbbreviation: z.string().min(1),
  homeAway: z.enum(['home', 'away']),
  passingYards: z.number().int().nonnegative(),
  passingTouchdowns: z.number().int().nonnegative(),
  gameStatus: z.enum(['scheduled', 'in_progress', 'final']),
  provisionalRank: z.number().int().positive(),
  provisionalRankMin: z.number().int().positive(),
  provisionalRankMax: z.number().int().positive(),
  provisionalRankDisplay: z.string().min(1),
  sortOrder: z.number().int().positive(),
});

const provisionalContestSnapshotSchema = z.object({
  snapshotId: z.string().min(1),
  snapshotKind: z.literal('provisional_order'),
  contestId: z.string().min(1),
  providerKey: z.string().min(1),
  providerName: z.string().min(1),
  providerSnapshotTime: z.string().datetime(),
  createdAt: z.string().datetime(),
  status: persistedSnapshotStatusSchema,
  gamesTotal: z.number().int().nonnegative(),
  gamesScheduled: z.number().int().nonnegative(),
  gamesInProgress: z.number().int().nonnegative(),
  gamesFinal: z.number().int().nonnegative(),
  allGamesFinal: z.boolean(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
  rows: z.array(provisionalOrderRowSchema),
});

const provisionalContestSnapshotStoreSchema = z.object({
  version: z.literal(1),
  snapshots: z.array(provisionalContestSnapshotSchema),
});

type PersistedProvisionalContestSnapshot = z.infer<typeof provisionalContestSnapshotSchema>;
type PersistedProvisionalContestSnapshotStore = z.infer<typeof provisionalContestSnapshotStoreSchema>;

export function resolveStatsProviderAdapter(options?: StatsProviderAdapterOptions): StatsProviderAdapter {
  const providerMode = options?.providerMode ?? getStatsProviderMode();

  switch (providerMode) {
    case 'file':
      return new FileStatsProviderAdapter(options?.providerStoreFilePath ?? getStatsProviderFilePath());
    case 'persisted_snapshot':
      return new PersistedStatsSnapshotAdapter({
        persistedSnapshotFilePath: options?.persistedSnapshotFilePath ?? getPersistedStatsSnapshotFilePath(),
      });
    default:
      return new DisabledStatsProviderAdapter();
  }
}

export async function fetchAndPersistContestStatSnapshot(
  contest: ContestStatsProviderInput,
  options?: StatsProviderFetchOptions,
) {
  const fetchUrl = options?.fetchUrl ?? getStatsProviderFetchUrl();

  if (!fetchUrl) {
    throw new Error('Provider snapshot fetch is not configured yet.');
  }

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: buildStatsProviderFetchHeaders(options?.fetchToken ?? getStatsProviderFetchToken()),
    body: JSON.stringify({
      contestId: contest.id,
      title: contest.title,
      slatePlayers: contest.slatePlayers,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Provider snapshot fetch failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`,
    );
  }

  const responseBody = await response.json();
  const snapshot = providerContestSnapshotSchema.parse(responseBody);

  if (snapshot.contestId !== contest.id) {
    throw new Error(`Provider snapshot contest mismatch. Expected ${contest.id} but received ${snapshot.contestId}.`);
  }

  const persistedSnapshot = persistedContestSnapshotSchema.parse({
    snapshotId: randomUUID(),
    contestId: snapshot.contestId,
    providerName: snapshot.providerName,
    providerSnapshotTime: snapshot.providerSnapshotTime,
    createdAt: new Date().toISOString(),
    status: 'validated',
    metadata: {
      fetchedFrom: safeFetchOrigin(fetchUrl),
      fetchedAt: new Date().toISOString(),
      rowCount: snapshot.rows.length,
    },
    rows: snapshot.rows,
  });

  await persistContestStatSnapshot(persistedSnapshot, options?.persistedSnapshotFilePath);

  return persistedSnapshot;
}

export async function fetchAndPersistReplayProvisionalSnapshot(
  contest: ReplayBackedContestStatsProviderInput,
  options?: ProvisionalStatsProviderFetchOptions,
): Promise<ProvisionalContestStatSnapshot> {
  const apiKey = options?.apiKey ?? getSportsDataIoReplayApiKey();

  if (!apiKey) {
    throw new Error('SportsDataIO Replay API key is not configured yet.');
  }

  const baseUrl = (options?.baseUrl ?? getSportsDataIoReplayBaseUrl()).replace(/\/$/, '');
  const seasonKey = buildSportsDataIoSeasonKey(contest.season);
  const [scoresPayload, playerStatsPayload] = await Promise.all([
    fetchSportsDataIoReplayJson(
      `${baseUrl}/scores/json/ScoresByWeek/${seasonKey}/${contest.week}`,
      apiKey,
    ),
    fetchSportsDataIoReplayJson(
      `${baseUrl}/stats/json/PlayerGameStatsByWeek/${seasonKey}/${contest.week}`,
      apiKey,
    ),
  ]);

  const scores = z.array(z.unknown()).parse(scoresPayload).map(parseSportsDataIoScore);
  const playerStats = z.array(z.unknown()).parse(playerStatsPayload).map(parseSportsDataIoPlayerGameStat);
  const scoreStatusByGameId = new Map(scores.map((score) => [score.providerGameId, score.gameStatus] as const));
  const rowsByProviderKey = new Map<string, { passingYards: number; passingTouchdowns: number; gameStatus: ProvisionalGameStatus }>();

  contest.slatePlayers.forEach((player) => {
    const matchingPlayerStat = playerStats.find(
      (stat) =>
        stat.providerPlayerId === player.providerPlayerId &&
        stat.providerGameId === player.providerGameId,
    );
    const gameStatus = scoreStatusByGameId.get(player.providerGameId) ?? matchingPlayerStat?.gameStatus ?? 'scheduled';

    rowsByProviderKey.set(buildProviderRowKey(player.providerPlayerId, player.providerGameId), {
      passingYards: matchingPlayerStat?.passingYards ?? 0,
      passingTouchdowns: matchingPlayerStat?.passingTouchdowns ?? 0,
      gameStatus,
    });
  });

  const provisionalRows = buildProvisionalOrderRows(
    buildProvisionalOrderSourceRows(contest.slatePlayers, rowsByProviderKey),
  );
  const gameSummary = summarizeProvisionalGames(provisionalRows);
  const snapshotTimestamp = options?.now ?? new Date().toISOString();
  const snapshot = provisionalContestSnapshotSchema.parse({
    snapshotId: randomUUID(),
    snapshotKind: 'provisional_order',
    contestId: contest.id,
    providerKey: 'sportsdataio_replay',
    providerName: 'SportsDataIO Replay',
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
      endpoints: {
        liveGames: 'ScoresByWeek',
        livePlayerGameStats: 'PlayerGameStatsByWeek',
        officialFinalizationHandoff: 'PlayerGameStatsByWeekFinal',
      },
    },
    rows: provisionalRows,
  });

  await persistProvisionalContestStatSnapshot(snapshot, options?.persistedSnapshotFilePath);

  return snapshot;
}

export async function getLatestProvisionalContestStatSnapshot(
  contestId: string,
  persistedSnapshotFilePath = getProvisionalStatsSnapshotFilePath(),
): Promise<ProvisionalContestStatSnapshot> {
  return shouldUsePersistedSnapshotFileStore(persistedSnapshotFilePath)
    ? readProvisionalSnapshotFromFileStore(contestId, persistedSnapshotFilePath)
    : readProvisionalSnapshotFromDatabase(contestId);
}

class DisabledStatsProviderAdapter implements StatsProviderAdapter {
  async getContestStatSnapshot(_contest: ContestStatsProviderInput): Promise<ContestStatSnapshot> {
    throw new Error('Provider-backed stat prefill is not configured yet.');
  }
}

export class FileStatsProviderAdapter implements StatsProviderAdapter {
  constructor(private readonly providerStoreFilePath: string) {}

  async getContestStatSnapshot(contest: ContestStatsProviderInput) {
    const store = await readProviderStatsStore(this.providerStoreFilePath);
    const snapshot = store.contests.find((entry) => entry.contestId === contest.id);

    if (!snapshot) {
      throw new Error(`Provider snapshot is not available yet for ${contest.id}.`);
    }

    return snapshot;
  }
}

export class PersistedStatsSnapshotAdapter implements StatsProviderAdapter {
  constructor(
    private readonly options: {
      persistedSnapshotFilePath: string;
    },
  ) {}

  async getContestStatSnapshot(contest: ContestStatsProviderInput) {
    const snapshot = shouldUsePersistedSnapshotFileStore(this.options.persistedSnapshotFilePath)
      ? await readPersistedSnapshotFromFileStore(contest.id, this.options.persistedSnapshotFilePath)
      : await readPersistedSnapshotFromDatabase(contest.id);

    return {
      contestId: snapshot.contestId,
      providerName: snapshot.providerName,
      providerSnapshotTime: snapshot.providerSnapshotTime,
      rows: snapshot.rows,
    };
  }
}

async function readProviderStatsStore(providerStoreFilePath: string) {
  try {
    const fileContents = await readFile(providerStoreFilePath, 'utf8');
    return providerStatsStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (notFound) {
      throw new Error(`Provider-backed stat snapshot file is missing at ${path.relative(process.cwd(), providerStoreFilePath)}.`);
    }

    if (error instanceof z.ZodError) {
      throw new Error('Provider-backed stat snapshot data is malformed.');
    }

    throw error;
  }
}

async function readPersistedSnapshotFromFileStore(contestId: string, persistedSnapshotFilePath: string) {
  const store = await readPersistedSnapshotStore(persistedSnapshotFilePath);
  const snapshot = selectLatestValidatedSnapshot(store.snapshots, contestId);

  if (!snapshot) {
    throw new Error(`Persisted stat snapshot is not available yet for ${contestId}.`);
  }

  return snapshot;
}

async function readPersistedSnapshotStore(persistedSnapshotFilePath: string): Promise<PersistedContestSnapshotStore> {
  try {
    const fileContents = await readFile(persistedSnapshotFilePath, 'utf8');
    return persistedContestSnapshotStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (notFound) {
      throw new Error(
        `Persisted stat snapshot file is missing at ${path.relative(process.cwd(), persistedSnapshotFilePath)}.`,
      );
    }

    if (error instanceof z.ZodError) {
      throw new Error('Persisted stat snapshot data is malformed.');
    }

    throw error;
  }
}

async function persistContestStatSnapshot(
  snapshot: PersistedContestSnapshot,
  persistedSnapshotFilePath = getPersistedStatsSnapshotFilePath(),
) {
  if (shouldUsePersistedSnapshotFileStore(persistedSnapshotFilePath)) {
    const store = await readPersistedSnapshotStoreOrEmpty(persistedSnapshotFilePath);
    const nextStore = persistedContestSnapshotStoreSchema.parse({
      version: 1,
      snapshots: upsertPersistedSnapshot(store.snapshots, snapshot),
    });
    await writePersistedSnapshotStore(nextStore, persistedSnapshotFilePath);
    return;
  }

  await writePersistedSnapshotToDatabase(snapshot);
}

async function readPersistedSnapshotStoreOrEmpty(
  persistedSnapshotFilePath: string,
): Promise<PersistedContestSnapshotStore> {
  try {
    const fileContents = await readFile(persistedSnapshotFilePath, 'utf8');
    return persistedContestSnapshotStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (!notFound) {
      if (error instanceof z.ZodError) {
        throw new Error('Persisted stat snapshot data is malformed.');
      }

      throw error;
    }

    return persistedContestSnapshotStoreSchema.parse({
      version: 1,
      snapshots: [],
    });
  }
}

function upsertPersistedSnapshot(
  snapshots: PersistedContestSnapshot[],
  nextSnapshot: PersistedContestSnapshot,
) {
  return [...snapshots.filter((snapshot) => snapshot.snapshotId !== nextSnapshot.snapshotId), nextSnapshot].sort((left, right) =>
    compareSnapshotTimes(right, left),
  );
}

async function writePersistedSnapshotStore(
  store: PersistedContestSnapshotStore,
  persistedSnapshotFilePath = defaultPersistedStatsSnapshotDataPath,
) {
  const nextStore = persistedContestSnapshotStoreSchema.parse(store);
  const directory = path.dirname(persistedSnapshotFilePath);
  const tempFilePath = path.join(directory, `${path.basename(persistedSnapshotFilePath)}.${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(tempFilePath, `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8');
  await rename(tempFilePath, persistedSnapshotFilePath);
}

async function persistProvisionalContestStatSnapshot(
  snapshot: PersistedProvisionalContestSnapshot,
  persistedSnapshotFilePath = getProvisionalStatsSnapshotFilePath(),
) {
  if (shouldUsePersistedSnapshotFileStore(persistedSnapshotFilePath)) {
    const store = await readProvisionalSnapshotStoreOrEmpty(persistedSnapshotFilePath);
    const nextStore = provisionalContestSnapshotStoreSchema.parse({
      version: 1,
      snapshots: upsertProvisionalSnapshot(store.snapshots, snapshot),
    });
    await writeProvisionalSnapshotStore(nextStore, persistedSnapshotFilePath);
    return;
  }

  await writeProvisionalSnapshotToDatabase(snapshot);
}

async function readProvisionalSnapshotFromFileStore(
  contestId: string,
  persistedSnapshotFilePath: string,
): Promise<ProvisionalContestStatSnapshot> {
  const store = await readProvisionalSnapshotStore(persistedSnapshotFilePath);
  const snapshot = selectLatestValidatedProvisionalSnapshot(store.snapshots, contestId);

  if (!snapshot) {
    throw new Error(`Persisted provisional stat snapshot is not available yet for ${contestId}.`);
  }

  return snapshot;
}

async function readProvisionalSnapshotStore(
  persistedSnapshotFilePath: string,
): Promise<PersistedProvisionalContestSnapshotStore> {
  try {
    const fileContents = await readFile(persistedSnapshotFilePath, 'utf8');
    return provisionalContestSnapshotStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (notFound) {
      throw new Error(
        `Persisted provisional stat snapshot file is missing at ${path.relative(process.cwd(), persistedSnapshotFilePath)}.`,
      );
    }

    if (error instanceof z.ZodError) {
      throw new Error('Persisted provisional stat snapshot data is malformed.');
    }

    throw error;
  }
}

async function readProvisionalSnapshotStoreOrEmpty(
  persistedSnapshotFilePath: string,
): Promise<PersistedProvisionalContestSnapshotStore> {
  try {
    const fileContents = await readFile(persistedSnapshotFilePath, 'utf8');
    return provisionalContestSnapshotStoreSchema.parse(JSON.parse(fileContents));
  } catch (error) {
    const notFound = (error as NodeJS.ErrnoException).code === 'ENOENT';

    if (!notFound) {
      if (error instanceof z.ZodError) {
        throw new Error('Persisted provisional stat snapshot data is malformed.');
      }

      throw error;
    }

    return provisionalContestSnapshotStoreSchema.parse({
      version: 1,
      snapshots: [],
    });
  }
}

function upsertProvisionalSnapshot(
  snapshots: PersistedProvisionalContestSnapshot[],
  nextSnapshot: PersistedProvisionalContestSnapshot,
) {
  return [...snapshots.filter((snapshot) => snapshot.snapshotId !== nextSnapshot.snapshotId), nextSnapshot].sort((left, right) =>
    compareSnapshotTimes(right, left),
  );
}

async function writeProvisionalSnapshotStore(
  store: PersistedProvisionalContestSnapshotStore,
  persistedSnapshotFilePath = defaultPersistedProvisionalStatsSnapshotDataPath,
) {
  const nextStore = provisionalContestSnapshotStoreSchema.parse(store);
  const directory = path.dirname(persistedSnapshotFilePath);
  const tempFilePath = path.join(directory, `${path.basename(persistedSnapshotFilePath)}.${randomUUID()}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(tempFilePath, `${JSON.stringify(nextStore, null, 2)}\n`, 'utf8');
  await rename(tempFilePath, persistedSnapshotFilePath);
}

function selectLatestValidatedSnapshot(
  snapshots: PersistedContestSnapshot[],
  contestId: string,
) {
  const matchingSnapshots = snapshots
    .filter((snapshot) => snapshot.contestId === contestId && snapshot.status === 'validated')
    .sort((left, right) => compareSnapshotTimes(right, left));

  return matchingSnapshots[0] ?? null;
}

function selectLatestValidatedProvisionalSnapshot(
  snapshots: PersistedProvisionalContestSnapshot[],
  contestId: string,
) {
  const matchingSnapshots = snapshots
    .filter((snapshot) => snapshot.contestId === contestId && snapshot.status === 'validated')
    .sort((left, right) => compareSnapshotTimes(right, left));

  return matchingSnapshots[0] ?? null;
}

function compareSnapshotTimes(
  left: { providerSnapshotTime: string; createdAt: string },
  right: { providerSnapshotTime: string; createdAt: string },
) {
  const snapshotTimeDelta =
    new Date(left.providerSnapshotTime).getTime() - new Date(right.providerSnapshotTime).getTime();

  if (snapshotTimeDelta !== 0) {
    return snapshotTimeDelta;
  }

  return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
}

async function readPersistedSnapshotFromDatabase(contestSlug: string): Promise<PersistedContestSnapshot> {
  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', contestSlug)
    .maybeSingle();

  if (contestError) {
    throw new Error(`Unable to load contest snapshot source: ${contestError.message}`);
  }

  if (!contestRow) {
    throw new Error('Contest not found.');
  }

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from('contest_stat_snapshots')
    .select('*')
    .eq('contest_id', contestRow.id)
    .eq('status', 'validated')
    .order('provider_snapshot_time', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (snapshotError) {
    throw new Error(`Unable to load persisted stat snapshots: ${snapshotError.message}`);
  }

  const snapshotRow = (snapshotRows as ContestStatSnapshotDbRow[] | null)?.[0];

  if (!snapshotRow) {
    throw new Error(`Persisted stat snapshot is not available yet for ${contestSlug}.`);
  }

  const { data: statRows, error: statRowError } = await supabase
    .from('contest_stat_snapshot_rows')
    .select('*')
    .eq('snapshot_id', snapshotRow.snapshot_id);

  if (statRowError) {
    throw new Error(`Unable to load persisted stat snapshot rows: ${statRowError.message}`);
  }

  return {
    snapshotId: snapshotRow.snapshot_id,
    contestId: contestSlug,
    providerName: snapshotRow.provider_name,
    providerSnapshotTime: snapshotRow.provider_snapshot_time,
    createdAt: snapshotRow.created_at,
    status: parsePersistedSnapshotStatus(snapshotRow.status),
    metadata: parseSnapshotMetadata(snapshotRow.metadata),
    rows: (statRows as ContestStatSnapshotRowDbRow[] | null)?.map((row) => ({
      providerPlayerId: row.provider_player_id,
      providerGameId: row.provider_game_id,
      playerName: row.player_name ?? undefined,
      finalStat: row.final_stat,
      passingTouchdowns: row.passing_touchdowns,
      gameStatus: parseProviderGameStatus(row.game_status),
    })) ?? [],
  };
}

async function writePersistedSnapshotToDatabase(snapshot: PersistedContestSnapshot) {
  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', snapshot.contestId)
    .maybeSingle();

  if (contestError) {
    throw new Error(`Unable to load contest for stat snapshot persistence: ${contestError.message}`);
  }

  if (!contestRow) {
    throw new Error('Contest not found.');
  }

  const contestId = contestRow.id as string;
  const snapshotInsert: Database['public']['Tables']['contest_stat_snapshots']['Insert'] = {
    snapshot_id: snapshot.snapshotId,
    contest_id: contestId,
    provider_name: snapshot.providerName,
    provider_snapshot_time: snapshot.providerSnapshotTime,
    created_at: snapshot.createdAt,
    status: snapshot.status,
    metadata: (snapshot.metadata ?? null) as Json | null,
  };
  const rowInserts: Database['public']['Tables']['contest_stat_snapshot_rows']['Insert'][] = snapshot.rows.map((row) => ({
    snapshot_id: snapshot.snapshotId,
    provider_player_id: row.providerPlayerId,
    provider_game_id: row.providerGameId,
    player_name: row.playerName ?? null,
    final_stat: row.finalStat,
    passing_touchdowns: row.passingTouchdowns,
    game_status: row.gameStatus,
  }));

  const { error: snapshotError } = await supabase.from('contest_stat_snapshots').insert(snapshotInsert);

  if (snapshotError) {
    throw new Error(`Unable to save contest stat snapshot: ${snapshotError.message}`);
  }

  if (rowInserts.length > 0) {
    const { error: rowError } = await supabase.from('contest_stat_snapshot_rows').insert(rowInserts);

    if (rowError) {
      throw new Error(`Unable to save contest stat snapshot rows: ${rowError.message}`);
    }
  }
}

async function readProvisionalSnapshotFromDatabase(contestSlug: string): Promise<ProvisionalContestStatSnapshot> {
  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', contestSlug)
    .maybeSingle();

  if (contestError) {
    throw new Error(`Unable to load provisional snapshot source: ${contestError.message}`);
  }

  if (!contestRow) {
    throw new Error('Contest not found.');
  }

  const { data: snapshotRows, error: snapshotError } = await supabase
    .from('contest_provisional_stat_snapshots')
    .select('*')
    .eq('contest_id', contestRow.id)
    .eq('status', 'validated')
    .order('provider_snapshot_time', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1);

  if (snapshotError) {
    throw new Error(`Unable to load persisted provisional stat snapshots: ${snapshotError.message}`);
  }

  const snapshotRow = (snapshotRows as ContestProvisionalStatSnapshotDbRow[] | null)?.[0];

  if (!snapshotRow) {
    throw new Error(`Persisted provisional stat snapshot is not available yet for ${contestSlug}.`);
  }

  const { data: statRows, error: statRowError } = await supabase
    .from('contest_provisional_stat_snapshot_rows')
    .select('*')
    .eq('snapshot_id', snapshotRow.snapshot_id)
    .order('sort_order', { ascending: true });

  if (statRowError) {
    throw new Error(`Unable to load persisted provisional stat snapshot rows: ${statRowError.message}`);
  }

  return provisionalContestSnapshotSchema.parse({
    snapshotId: snapshotRow.snapshot_id,
    snapshotKind: 'provisional_order',
    contestId: contestSlug,
    providerKey: snapshotRow.provider_key,
    providerName: snapshotRow.provider_name,
    providerSnapshotTime: snapshotRow.provider_snapshot_time,
    createdAt: snapshotRow.created_at,
    status: parsePersistedSnapshotStatus(snapshotRow.status),
    gamesTotal: snapshotRow.games_total,
    gamesScheduled: snapshotRow.games_scheduled,
    gamesInProgress: snapshotRow.games_in_progress,
    gamesFinal: snapshotRow.games_final,
    allGamesFinal: snapshotRow.all_games_final,
    metadata: parseSnapshotMetadata(snapshotRow.metadata),
    rows:
      (statRows as ContestProvisionalStatSnapshotRowDbRow[] | null)?.map((row) => ({
        playerId: row.player_id,
        providerPlayerId: row.provider_player_id,
        providerGameId: row.provider_game_id,
        playerName: row.player_name,
        teamAbbreviation: row.team_abbreviation,
        opponentAbbreviation: row.opponent_abbreviation,
        homeAway: provisionalOrderRowSchema.shape.homeAway.parse(row.home_away),
        passingYards: row.passing_yards,
        passingTouchdowns: row.passing_touchdowns,
        gameStatus: parseProviderGameStatus(row.game_status),
        provisionalRank: row.provisional_rank,
        provisionalRankMin: row.provisional_rank_min,
        provisionalRankMax: row.provisional_rank_max,
        provisionalRankDisplay: row.provisional_rank_display,
        sortOrder: row.sort_order,
      })) ?? [],
  });
}

async function writeProvisionalSnapshotToDatabase(snapshot: PersistedProvisionalContestSnapshot) {
  const supabase: any = await createSupabaseClient();
  const { data: contestRow, error: contestError } = await supabase
    .from('contests')
    .select('id')
    .eq('slug', snapshot.contestId)
    .maybeSingle();

  if (contestError) {
    throw new Error(`Unable to load contest for provisional snapshot persistence: ${contestError.message}`);
  }

  if (!contestRow) {
    throw new Error('Contest not found.');
  }

  const snapshotInsert: Database['public']['Tables']['contest_provisional_stat_snapshots']['Insert'] = {
    snapshot_id: snapshot.snapshotId,
    contest_id: contestRow.id as string,
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
    metadata: (snapshot.metadata ?? null) as Json | null,
  };
  const rowInserts: Database['public']['Tables']['contest_provisional_stat_snapshot_rows']['Insert'][] =
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
    }));

  const { error: snapshotError } = await supabase.from('contest_provisional_stat_snapshots').insert(snapshotInsert);

  if (snapshotError) {
    throw new Error(`Unable to save provisional stat snapshot: ${snapshotError.message}`);
  }

  if (rowInserts.length > 0) {
    const { error: rowError } = await supabase.from('contest_provisional_stat_snapshot_rows').insert(rowInserts);

    if (rowError) {
      throw new Error(`Unable to save provisional stat snapshot rows: ${rowError.message}`);
    }
  }
}

function parseSnapshotMetadata(metadata: Json | null) {
  if (!metadata || Array.isArray(metadata) || typeof metadata !== 'object') {
    return null;
  }

  return metadata as Record<string, unknown>;
}

function parsePersistedSnapshotStatus(status: string): z.infer<typeof persistedSnapshotStatusSchema> {
  return persistedSnapshotStatusSchema.parse(status);
}

function parseProviderGameStatus(status: string): ProviderStatRow['gameStatus'] {
  return providerStatRowSchema.shape.gameStatus.parse(status);
}

function shouldUsePersistedSnapshotFileStore(persistedSnapshotFilePath: string) {
  return (
    Boolean(persistedSnapshotFilePath) &&
    (!hasBrowserSupabaseConfig() ||
      process.env.NODE_ENV === 'test' ||
      process.env.VITEST === 'true' ||
      process.env.PICKRANK_E2E_USE_FILE_STORE === '1')
  );
}

function buildStatsProviderFetchHeaders(fetchToken: string) {
  const headers: Record<string, string> = {
    'content-type': 'application/json',
  };

  if (fetchToken) {
    headers.authorization = `Bearer ${fetchToken}`;
  }

  return headers;
}

function buildSportsDataIoReplayHeaders(apiKey: string) {
  return {
    'content-type': 'application/json',
    'Ocp-Apim-Subscription-Key': apiKey,
  };
}

async function fetchSportsDataIoReplayJson(url: string, apiKey: string) {
  const response = await fetch(url, {
    method: 'GET',
    headers: buildSportsDataIoReplayHeaders(apiKey),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `SportsDataIO Replay request failed with ${response.status}${errorText ? `: ${errorText.slice(0, 200)}` : '.'}`,
    );
  }

  return response.json();
}

function buildSportsDataIoSeasonKey(season: number) {
  return `${season}REG`;
}

function parseSportsDataIoScore(input: unknown) {
  const row = readObject(input);
  const providerGameId = readString(row.ScoreID ?? row.scoreId ?? row.GameID ?? row.gameId);

  if (!providerGameId) {
    throw new Error('SportsDataIO Replay score row is missing ScoreID.');
  }

  return {
    providerGameId,
    gameStatus: normalizeSportsDataIoGameStatus(row),
  };
}

function parseSportsDataIoPlayerGameStat(input: unknown) {
  const row = readObject(input);
  const providerPlayerId = readString(row.PlayerID ?? row.playerId);
  const providerGameId = readString(row.ScoreID ?? row.scoreId ?? row.GameID ?? row.gameId);

  if (!providerPlayerId || !providerGameId) {
    throw new Error('SportsDataIO Replay player stat row is missing PlayerID or ScoreID.');
  }

  return {
    providerPlayerId,
    providerGameId,
    passingYards: readWholeNumber(row.PassingYards ?? row.passingYards),
    passingTouchdowns: readWholeNumber(row.PassingTouchdowns ?? row.passingTouchdowns),
    gameStatus: normalizeSportsDataIoGameStatus(row),
  };
}

function safeFetchOrigin(fetchUrl: string) {
  try {
    return new URL(fetchUrl).origin;
  } catch {
    return fetchUrl;
  }
}

async function createSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

function normalizeSportsDataIoGameStatus(row: Record<string, unknown>): ProvisionalGameStatus {
  const isClosed = typeof row.IsClosed === 'boolean' ? row.IsClosed : typeof row.isClosed === 'boolean' ? row.isClosed : null;

  if (isClosed === true) {
    return 'final';
  }

  const status = readString(row.Status ?? row.status)?.toLowerCase() ?? '';

  if (
    status.includes('final') ||
    status === 'f' ||
    status === 'f/ot' ||
    status === 'closed'
  ) {
    return 'final';
  }

  if (
    status.includes('in progress') ||
    status.includes('progress') ||
    status.includes('halftime') ||
    status.includes('quarter') ||
    status.includes('ot') ||
    status.includes('delay') ||
    status === 'live'
  ) {
    return 'in_progress';
  }

  const quarter = typeof row.Quarter === 'number' ? row.Quarter : typeof row.quarter === 'number' ? row.quarter : null;

  if (quarter && quarter > 0) {
    return 'in_progress';
  }

  return 'scheduled';
}

function readObject(input: unknown) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('SportsDataIO Replay payload row is malformed.');
  }

  return input as Record<string, unknown>;
}

function readString(input: unknown) {
  if (typeof input === 'string' && input.trim()) {
    return input.trim();
  }

  if (typeof input === 'number' && Number.isFinite(input)) {
    return String(input);
  }

  return '';
}

function readWholeNumber(input: unknown) {
  if (typeof input === 'number' && Number.isFinite(input)) {
    return Math.max(0, Math.trunc(input));
  }

  if (typeof input === 'string' && input.trim()) {
    const parsed = Number.parseInt(input, 10);

    if (Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }

  return 0;
}
