import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import {
  getPersistedStatsSnapshotFilePath,
  getStatsProviderFilePath,
  getStatsProviderMode,
  hasBrowserSupabaseConfig,
} from '@/lib/env';
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

type ContestStatSnapshotDbRow = Database['public']['Tables']['contest_stat_snapshots']['Row'];
type ContestStatSnapshotRowDbRow = Database['public']['Tables']['contest_stat_snapshot_rows']['Row'];

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

function selectLatestValidatedSnapshot(
  snapshots: PersistedContestSnapshot[],
  contestId: string,
): PersistedContestSnapshot | null {
  const matchingSnapshots = snapshots
    .filter((snapshot) => snapshot.contestId === contestId && snapshot.status === 'validated')
    .sort((left, right) => compareSnapshotTimes(right, left));

  return matchingSnapshots[0] ?? null;
}

function compareSnapshotTimes(
  left: Pick<PersistedContestSnapshot, 'providerSnapshotTime' | 'createdAt'>,
  right: Pick<PersistedContestSnapshot, 'providerSnapshotTime' | 'createdAt'>,
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

async function createSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}
