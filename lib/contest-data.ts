/* eslint-disable @typescript-eslint/no-explicit-any */
import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { contestPlayerPoolSize, contestRankedPlayerCount } from '@/lib/contest-rules';
import type { Database, Json } from '@/lib/supabase/types';

const contestStatusSchema = z.enum([
  'draft',
  'scheduled',
  'open',
  'locked',
  'canceled',
  'live',
  'finalizing',
  'final',
  'paid_out',
  'error_review',
]);

const contestVisibilityStatusSchema = z.enum(['hidden', 'visible']);
const contestSlatePlayerHomeAwaySchema = z.enum(['home', 'away']);
const contestSlatePlayerPositionSchema = z.literal('QB');

const contestSlatePlayerSchema = z.object({
  playerId: z.string().min(1),
  providerPlayerId: z.string().min(1),
  providerGameId: z.string().min(1),
  displayName: z.string().min(1),
  teamAbbreviation: z.string().min(1),
  opponentAbbreviation: z.string().min(1),
  homeAway: contestSlatePlayerHomeAwaySchema,
  gameStartTime: z.string().datetime(),
  position: contestSlatePlayerPositionSchema,
  activeStatus: z.string().min(1).nullable(),
  sortOrderInternal: z.number().int().positive(),
});

const contestRecordSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  season: z.number().int().min(2024),
  week: z.number().int().min(1).max(18),
  contestType: z.literal('public_paid'),
  statType: z.literal('qb_passing_yards'),
  slateSize: z.number().int().positive(),
  entryFeeCents: z.number().int().nonnegative(),
  entryCount: z.number().int().nonnegative(),
  paidEntryCount: z.number().int().nonnegative(),
  minEntriesToRun: z.number().int().positive(),
  status: contestStatusSchema,
  visibilityStatus: contestVisibilityStatusSchema,
  isFeatured: z.boolean(),
  displayOrder: z.number().int().nonnegative().nullable(),
  entryOpenTime: z.string().datetime().nullable(),
  lockTime: z.string().datetime(),
  createdByAdminId: z.string().min(1).nullable(),
  publishedByAdminId: z.string().min(1).nullable(),
  publishedAt: z.string().datetime().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  lineupPlayers: z.array(z.string().min(1)).length(contestRankedPlayerCount),
  slatePlayers: z.array(contestSlatePlayerSchema),
  validation: z.object({
    status: z.enum(['not_run', 'passed', 'failed']),
    errors: z.array(z.string()),
    warnings: z.array(z.string()),
    validatedAt: z.string().datetime().nullable(),
    validatedByAdminId: z.string().min(1).nullable(),
  }),
});

const contestStateEventSchema = z.object({
  eventId: z.string().min(1),
  contestId: z.string().min(1),
  fromStatus: contestStatusSchema.nullable(),
  toStatus: contestStatusSchema,
  trigger: z.enum(['admin', 'system', 'lock_time']),
  createdAt: z.string().datetime(),
  metadata: z.record(z.string(), z.string()).default({}),
});

const contestStoreSchema = z.object({
  version: z.literal(1),
  contests: z.array(contestRecordSchema),
  contestStateEvents: z.array(contestStateEventSchema).default([]),
});

const defaultContestDataPath = path.join(process.cwd(), 'data', 'contests.json');

const payoutStructure = [
  { place: '1st', percentage: 0.5 },
  { place: '2nd', percentage: 0.3 },
  { place: '3rd', percentage: 0.2 },
] as const;

const demoWalletBalances = {
  siteCreditCents: 200,
  cashBalanceCents: 100,
};

const defaultLineupPlayers = [
  'Josh Allen',
  'Joe Burrow',
  'Derek Carr',
  'Kirk Cousins',
  'Justin Herbert',
  'Jalen Hurts',
  'Lamar Jackson',
  'Jordan Love',
  'Dak Prescott',
  'Brock Purdy',
] as const;

const statusLabels: Record<ContestStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  open: 'Open',
  locked: 'Locked',
  canceled: 'Canceled',
  live: 'Underway',
  finalizing: 'Results Pending',
  final: 'Final',
  paid_out: 'Final',
  error_review: 'Needs Review',
};

type ContestStore = z.infer<typeof contestStoreSchema>;
type ContestDbRow = Database['public']['Tables']['contests']['Row'];
type ContestDbInsert = Database['public']['Tables']['contests']['Insert'];
type ContestDbUpdate = Database['public']['Tables']['contests']['Update'];
type ContestSlatePlayerDbRow = Database['public']['Tables']['contest_slate_players']['Row'];
type ContestSlatePlayerDbInsert = Database['public']['Tables']['contest_slate_players']['Insert'];
type ContestValidationDbRow = Database['public']['Tables']['contest_validation_results']['Row'];
type ContestValidationDbInsert = Database['public']['Tables']['contest_validation_results']['Insert'];
type ContestStateEventDbRow = Database['public']['Tables']['contest_state_events']['Row'];
type ContestStateEventDbInsert = Database['public']['Tables']['contest_state_events']['Insert'];

export type ContestRecord = z.infer<typeof contestRecordSchema>;
export type ContestStatus = z.infer<typeof contestStatusSchema>;
export type ContestVisibilityStatus = z.infer<typeof contestVisibilityStatusSchema>;
export type ContestValidationResult = z.infer<typeof contestRecordSchema>['validation'];
export type ContestStateEvent = z.infer<typeof contestStateEventSchema>;
export type ContestSlatePlayer = z.infer<typeof contestSlatePlayerSchema>;
export type ContestSlatePlayerHomeAway = z.infer<typeof contestSlatePlayerHomeAwaySchema>;

export type ContestSummary = {
  id: string;
  title: string;
  description: string;
  season: number;
  week: number;
  contestStatus: ContestStatus;
  status: string;
  visibilityStatus: ContestVisibilityStatus;
  isFeatured: boolean;
  displayOrder: number | null;
  entryFee: string;
  entryFeeCents: number;
  prizePool: string;
  prizePoolCents: number;
  entries: string;
  entryCount: number;
  paidEntryCount: number;
  minimum: string;
  slate: string;
  slateSize: number;
  task: string;
  statCategory: string;
  lockTime: string;
  lockTimeIso: string;
  entryOpenTimeIso: string | null;
  payoutRows: Array<{ place: string; value: string }>;
  lineupPlayers: string[];
  slatePlayers: ContestSlatePlayer[];
  createdByAdminId: string | null;
  publishedByAdminId: string | null;
  publishedAt: string | null;
  validation: ContestValidationResult;
};

export type CreateDraftContestInput = {
  title: string;
  description: string;
  season: number;
  week: number;
  entryFeeCents: number;
  entryOpenTimeIso: string | null;
  lockTimeIso: string;
  createdByAdminId: string | null;
};

type ContestDataOptions = {
  dataFilePath?: string;
};

type ContestLookupOptions = ContestDataOptions & {
  includeHidden?: boolean;
};

type TimestampOptions = ContestDataOptions & {
  now?: string;
};

type ContestEntryCountUpdateOptions = ContestDataOptions & {
  entryDelta?: number;
  paidEntryDelta?: number;
  now?: string;
};

type FreeTestContestLockOptions = TimestampOptions & {
  lockedByAdminId?: string | null;
};

type BetaContestCleanupOptions = TimestampOptions & {
  persistedEntryCount?: number;
};

export async function listPublicContests(options?: ContestDataOptions) {
  const store = await readContestStore(options);

  return store.contests
    .filter((contest) => contest.visibilityStatus === 'visible' && ['scheduled', 'open'].includes(contest.status))
    .sort(compareContestRecords)
    .map(toContestSummary);
}

export async function listPublicFinalContests(options?: ContestDataOptions) {
  const store = await readContestStore(options);

  return store.contests
    .filter(
      (contest) =>
        contest.visibilityStatus === 'visible' && ['final', 'paid_out'].includes(contest.status),
    )
    .sort(compareContestRecords)
    .map(toContestSummary);
}

export async function listAdminContests(options?: ContestDataOptions) {
  const store = await readContestStore(options);
  return [...store.contests].sort(compareContestRecords).map(toContestSummary);
}

export async function getContestById(contestId: string, options?: ContestLookupOptions) {
  const store = await readContestStore(options);
  const contests = options?.includeHidden
    ? store.contests
    : store.contests.filter((contest) => contest.visibilityStatus === 'visible');

  const contest = contests.find((item) => item.id === contestId) ?? contests[0];

  if (!contest) {
    throw new Error('No contests are available.');
  }

  return toContestSummary(contest);
}

export async function createDraftContest(input: CreateDraftContestInput, options?: ContestDataOptions) {
  const now = new Date().toISOString();

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options?.dataFilePath);
    const contest = buildDraftContestRecord(input, store.contests, now);

    await writeContestStoreToFile(
      {
        ...store,
        contests: [...store.contests, contest],
      },
      options?.dataFilePath,
    );

    return toContestSummary(contest);
  }

  const store = await readContestStoreFromDatabase();
  const contest = buildDraftContestRecord(input, store.contests, now);
  const supabase: any = await createSupabaseClient();
  const { error } = await supabase.from('contests').insert(toContestDbInsert(contest));

  if (error) {
    throw new Error(`Unable to create draft contest: ${error.message}`);
  }

  return toContestSummary(contest);
}

export async function saveContestSlate(
  contestId: string,
  slatePlayers: ContestSlatePlayer[],
  options?: TimestampOptions,
) {
  const now = options?.now ?? new Date().toISOString();

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options?.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    const normalizedSlatePlayers = normalizeContestSlatePlayers(slatePlayers);
    const nextContest: ContestRecord = {
      ...currentContest,
      slatePlayers: normalizedSlatePlayers,
      lineupPlayers: buildLineupShellPlayersFromSlate(normalizedSlatePlayers),
      validation: resetContestValidation(currentContest.validation),
      updatedAt: now,
    };

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
      },
      options?.dataFilePath,
    );

    return toContestSummary(nextContest);
  }

  const supabase: any = await createSupabaseClient();
  const currentContest = await getDatabaseContestBySlug(contestId);
  const normalizedSlatePlayers = normalizeContestSlatePlayers(slatePlayers);
  const nextContest: ContestRecord = {
    ...currentContest.record,
    slatePlayers: normalizedSlatePlayers,
    lineupPlayers: buildLineupShellPlayersFromSlate(normalizedSlatePlayers),
    validation: resetContestValidation(currentContest.record.validation),
    updatedAt: now,
  };

  const { error: updateContestError } = await supabase
    .from('contests')
    .update({
      lineup_players: nextContest.lineupPlayers,
      updated_at: now,
    })
    .eq('id', currentContest.row.id);

  if (updateContestError) {
    throw new Error(`Unable to save the draft slate: ${updateContestError.message}`);
  }

  const { error: deleteSlateError } = await supabase
    .from('contest_slate_players')
    .delete()
    .eq('contest_id', currentContest.row.id);

  if (deleteSlateError) {
    throw new Error(`Unable to replace the draft slate: ${deleteSlateError.message}`);
  }

  if (normalizedSlatePlayers.length > 0) {
    const { error: insertSlateError } = await supabase
      .from('contest_slate_players')
      .insert(normalizedSlatePlayers.map((player) => toContestSlatePlayerDbInsert(currentContest.row.id, player)));

    if (insertSlateError) {
      throw new Error(`Unable to save the draft slate: ${insertSlateError.message}`);
    }
  }

  await upsertContestValidationRow(currentContest.row.id, nextContest.validation);
  return toContestSummary(nextContest);
}

export async function validateDraftContest(
  contestId: string,
  validatedByAdminId: string | null,
  options?: TimestampOptions,
) {
  const now = options?.now ?? new Date().toISOString();

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options?.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    const validation = buildContestValidationResult(currentContest, now, validatedByAdminId);
    const nextContest: ContestRecord = {
      ...currentContest,
      validation,
      updatedAt: now,
    };

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
      },
      options?.dataFilePath,
    );

    return {
      contest: toContestSummary(nextContest),
      validation,
    };
  }

  const supabase: any = await createSupabaseClient();
  const currentContest = await getDatabaseContestBySlug(contestId);
  const validation = buildContestValidationResult(currentContest.record, now, validatedByAdminId);

  const { error: updateContestError } = await supabase
    .from('contests')
    .update({ updated_at: now })
    .eq('id', currentContest.row.id);

  if (updateContestError) {
    throw new Error(`Unable to update contest validation state: ${updateContestError.message}`);
  }

  await upsertContestValidationRow(currentContest.row.id, validation);

  return {
    contest: toContestSummary({
      ...currentContest.record,
      validation,
      updatedAt: now,
    }),
    validation,
  };
}

export async function publishContest(
  contestId: string,
  publishedByAdminId: string | null,
  options?: TimestampOptions,
) {
  const now = options?.now ?? new Date().toISOString();

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options?.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];

    if (currentContest.status !== 'draft') {
      throw new Error('Only draft contests can be published.');
    }

    const validation = buildContestValidationResult(currentContest, now, publishedByAdminId);

    if (validation.status !== 'passed') {
      throw new Error(validation.errors[0] || 'This contest must pass validation before publish.');
    }

    const nextStatus = resolvePublishedContestStatus(currentContest, now);
    const nextContest: ContestRecord = {
      ...currentContest,
      status: nextStatus,
      visibilityStatus: 'visible',
      publishedByAdminId,
      publishedAt: now,
      validation,
      updatedAt: now,
    };

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
        contestStateEvents: [
          ...store.contestStateEvents,
          createContestStateEvent({
            contestId,
            createdAt: now,
            fromStatus: currentContest.status,
            toStatus: nextStatus,
            trigger: 'admin',
          }),
        ],
      },
      options?.dataFilePath,
    );

    return {
      contest: toContestSummary(nextContest),
      validation,
    };
  }

  const supabase: any = await createSupabaseClient();
  const currentContest = await getDatabaseContestBySlug(contestId);

  if (currentContest.record.status !== 'draft') {
    throw new Error('Only draft contests can be published.');
  }

  const validation = buildContestValidationResult(currentContest.record, now, publishedByAdminId);

  if (validation.status !== 'passed') {
    throw new Error(validation.errors[0] || 'This contest must pass validation before publish.');
  }

  const nextStatus = resolvePublishedContestStatus(currentContest.record, now);
  const nextContest: ContestRecord = {
    ...currentContest.record,
    status: nextStatus,
    visibilityStatus: 'visible',
    publishedByAdminId,
    publishedAt: now,
    validation,
    updatedAt: now,
  };

  const { error: updateContestError } = await supabase
    .from('contests')
    .update({
      status: nextStatus,
      visibility_status: 'visible',
      published_by_admin_id: publishedByAdminId,
      published_at: now,
      updated_at: now,
    })
    .eq('id', currentContest.row.id);

  if (updateContestError) {
    throw new Error(`Unable to publish contest: ${updateContestError.message}`);
  }

  await upsertContestValidationRow(currentContest.row.id, validation);
  await insertContestStateEventRow(
    toContestStateEventDbInsert({
      contestId: currentContest.row.id,
      createdAt: now,
      fromStatus: currentContest.record.status,
      toStatus: nextStatus,
      trigger: 'admin',
    }),
  );

  return {
    contest: toContestSummary(nextContest),
    validation,
  };
}

export async function updateContestEntryCounts(
  contestId: string,
  {
    entryDelta = 0,
    paidEntryDelta = 0,
    now = new Date().toISOString(),
    ...options
  }: ContestEntryCountUpdateOptions = {},
) {
  if (entryDelta === 0 && paidEntryDelta === 0) {
    return;
  }

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    const nextContest = contestRecordSchema.parse({
      ...currentContest,
      entryCount: Math.max(0, currentContest.entryCount + entryDelta),
      paidEntryCount: Math.max(0, currentContest.paidEntryCount + paidEntryDelta),
      updatedAt: now,
    });

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
      },
      options.dataFilePath,
    );

    return;
  }

  const { row } = await getDatabaseContestBySlug(contestId);
  const supabase: any = await createSupabaseAdminClient();
  const { error } = await supabase
    .from('contests')
    .update({
      entry_count: Math.max(0, row.entry_count + entryDelta),
      paid_entries_count: Math.max(0, row.paid_entries_count + paidEntryDelta),
      updated_at: now,
    } satisfies ContestDbUpdate)
    .eq('id', row.id);

  if (error) {
    throw new Error(`Unable to update contest entry counts: ${error.message}`);
  }
}

export async function updateContestStatus(
  contestId: string,
  status: ContestStatus,
  {
    now = new Date().toISOString(),
    ...options
  }: TimestampOptions = {},
) {
  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    const nextContest = contestRecordSchema.parse({
      ...currentContest,
      status,
      updatedAt: now,
    });

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
      },
      options.dataFilePath,
    );

    return;
  }

  await updateContestLifecycleStatus(contestId, status, now);
}

export async function lockFreeTestContestForProof(
  contestId: string,
  {
    now = new Date().toISOString(),
    lockedByAdminId = null,
    ...options
  }: FreeTestContestLockOptions = {},
) {
  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    assertCanLockFreeTestContest(currentContest);

    const nextContest = contestRecordSchema.parse({
      ...currentContest,
      status: 'locked',
      updatedAt: now,
    });
    const event = createContestStateEvent({
      contestId,
      createdAt: now,
      fromStatus: currentContest.status,
      toStatus: 'locked',
      trigger: 'admin',
      metadata: {
        proof_type: 'free_test_lock',
        no_money: 'true',
        paid_entries_at_lock: String(currentContest.paidEntryCount),
        total_entries_at_lock: String(currentContest.entryCount),
        locked_by_admin_id: lockedByAdminId ?? '',
      },
    });

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
        contestStateEvents: [...store.contestStateEvents, event],
      },
      options.dataFilePath,
    );

    return {
      contest: toContestSummary(nextContest),
      event,
    };
  }

  const supabase: any = await createSupabaseClient();
  const currentContest = await getDatabaseContestBySlug(contestId);
  assertCanLockFreeTestContest(currentContest.record);

  const { error: updateContestError } = await supabase
    .from('contests')
    .update({
      status: 'locked',
      updated_at: now,
    } satisfies ContestDbUpdate)
    .eq('id', currentContest.row.id);

  if (updateContestError) {
    throw new Error(`Unable to lock free/test contest: ${updateContestError.message}`);
  }

  const event = createContestStateEvent({
    contestId,
    createdAt: now,
    fromStatus: currentContest.record.status,
    toStatus: 'locked',
    trigger: 'admin',
    metadata: {
      proof_type: 'free_test_lock',
      no_money: 'true',
      paid_entries_at_lock: String(currentContest.record.paidEntryCount),
      total_entries_at_lock: String(currentContest.record.entryCount),
      locked_by_admin_id: lockedByAdminId ?? '',
    },
  });

  await insertContestStateEventRow(
    toContestStateEventDbInsert({
      contestId: currentContest.row.id,
      createdAt: event.createdAt,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      trigger: event.trigger,
      metadata: event.metadata,
    }),
  );

  return {
    contest: toContestSummary({
      ...currentContest.record,
      status: 'locked',
      updatedAt: now,
    }),
    event,
  };
}

export async function retireFakePublicContestForBetaCleanup(
  contestId: string,
  retiredByAdminId: string | null,
  {
    now = new Date().toISOString(),
    persistedEntryCount,
    ...options
  }: BetaContestCleanupOptions = {},
) {
  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options.dataFilePath);
    const contestIndex = store.contests.findIndex((contest) => contest.id === contestId);

    if (contestIndex === -1) {
      throw new Error('Contest not found.');
    }

    const currentContest = store.contests[contestIndex];
    const actualEntryCount = persistedEntryCount ?? 0;
    assertCanRetireFakePublicContestForBetaCleanup(currentContest, actualEntryCount);

    const nextContest = contestRecordSchema.parse({
      ...currentContest,
      status: 'canceled',
      visibilityStatus: 'hidden',
      isFeatured: false,
      displayOrder: null,
      entryCount: 0,
      paidEntryCount: 0,
      updatedAt: now,
    });
    const event = createBetaCleanupRetirementEvent({
      contest: currentContest,
      actualEntryCount,
      retiredByAdminId,
      now,
    });

    await writeContestStoreToFile(
      {
        ...store,
        contests: replaceContest(store.contests, contestIndex, nextContest),
        contestStateEvents: [...store.contestStateEvents, event],
      },
      options.dataFilePath,
    );

    return {
      contest: toContestSummary(nextContest),
      event,
    };
  }

  const supabase: any = await createSupabaseClient();
  const currentContest = await getDatabaseContestBySlug(contestId);
  const actualEntryCount = persistedEntryCount ?? (await countPersistedEntriesForContestRow(currentContest.row.id));
  assertCanRetireFakePublicContestForBetaCleanup(currentContest.record, actualEntryCount);

  const { error: updateContestError } = await supabase
    .from('contests')
    .update({
      status: 'canceled',
      visibility_status: 'hidden',
      is_featured: false,
      display_order: null,
      entry_count: 0,
      paid_entries_count: 0,
      updated_at: now,
    } satisfies ContestDbUpdate)
    .eq('id', currentContest.row.id);

  if (updateContestError) {
    throw new Error(`Unable to retire fake public contest: ${updateContestError.message}`);
  }

  const event = createBetaCleanupRetirementEvent({
    contest: currentContest.record,
    actualEntryCount,
    retiredByAdminId,
    now,
  });

  await insertContestStateEventRow(
    toContestStateEventDbInsert({
      contestId: currentContest.row.id,
      createdAt: event.createdAt,
      fromStatus: event.fromStatus,
      toStatus: event.toStatus,
      trigger: event.trigger,
      metadata: event.metadata,
    }),
  );

  return {
    contest: toContestSummary({
      ...currentContest.record,
      status: 'canceled',
      visibilityStatus: 'hidden',
      isFeatured: false,
      displayOrder: null,
      entryCount: 0,
      paidEntryCount: 0,
      updatedAt: now,
    }),
    event,
  };
}

export async function runContestLifecycleTransitions(options?: TimestampOptions) {
  const now = options?.now ?? new Date().toISOString();

  if (shouldUseFileStore(options)) {
    const store = await readContestStoreFromFile(options?.dataFilePath);
    const nextEvents = [...store.contestStateEvents];
    let changed = false;

    const nextContests = store.contests.map((contest) => {
      const nextContest = transitionContestLifecycle(contest, now);

      if (nextContest) {
        changed = true;
        nextEvents.push(nextContest.event);
        return nextContest.contest;
      }

      return contest;
    });

    if (changed) {
      await writeContestStoreToFile(
        {
          ...store,
          contests: nextContests,
          contestStateEvents: nextEvents,
        },
        options?.dataFilePath,
      );
    }

    return {
      contests: nextContests.map(toContestSummary),
      events: nextEvents,
    };
  }

  const store = await readContestStoreFromDatabase();
  const nextEvents = [...store.contestStateEvents];
  const nextContests: ContestRecord[] = [];

  for (const contest of store.contests) {
    const nextContest = transitionContestLifecycle(contest, now);

    if (!nextContest) {
      nextContests.push(contest);
      continue;
    }

    await updateContestLifecycleStatus(nextContest.contest.id, nextContest.contest.status, now);
    await insertContestStateEventRow(toContestStateEventDbInsert(fromContestStateEvent(nextContest.event)));
    nextEvents.push(nextContest.event);
    nextContests.push(nextContest.contest);
  }

  return {
    contests: nextContests.map(toContestSummary),
    events: nextEvents,
  };
}

export function buildDraftContestRecord(
  input: CreateDraftContestInput,
  existingContests: ContestRecord[],
  now = new Date().toISOString(),
) {
  const baseId = slugify(input.title) || `contest-${randomUUID().slice(0, 8)}`;
  const existingIds = new Set(existingContests.map((contest) => contest.id));
  let nextId = baseId;
  let suffix = 2;

  while (existingIds.has(nextId)) {
    nextId = `${baseId}-${suffix}`;
    suffix += 1;
  }

  return contestRecordSchema.parse({
    id: nextId,
    title: input.title.trim(),
    description: input.description.trim(),
    season: input.season,
    week: input.week,
    contestType: 'public_paid',
    statType: 'qb_passing_yards',
    slateSize: contestPlayerPoolSize,
    entryFeeCents: input.entryFeeCents,
    entryCount: 0,
    paidEntryCount: 0,
    minEntriesToRun: 4,
    status: 'draft',
    visibilityStatus: 'hidden',
    isFeatured: false,
    displayOrder: existingContests.length,
    entryOpenTime: input.entryOpenTimeIso,
    lockTime: input.lockTimeIso,
    createdByAdminId: input.createdByAdminId,
    publishedByAdminId: null,
    publishedAt: null,
    createdAt: now,
    updatedAt: now,
    lineupPlayers: [...defaultLineupPlayers],
    slatePlayers: [],
    validation: {
      status: 'not_run',
      errors: [],
      warnings: [],
      validatedAt: null,
      validatedByAdminId: null,
    },
  });
}

export function getContestSelectablePlayers(contest: Pick<ContestSummary, 'lineupPlayers' | 'slatePlayers'>) {
  if (contest.slatePlayers.length > 0) {
    return [...contest.slatePlayers]
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
      .map((player) => player.displayName);
  }

  return [...contest.lineupPlayers];
}

export function getContestDefaultLineupOrder(
  contest: Pick<ContestSummary, 'lineupPlayers' | 'slatePlayers'>,
) {
  const selectablePlayers = getContestSelectablePlayers(contest);
  const selectedPlayers = contest.lineupPlayers.filter((player) => selectablePlayers.includes(player));

  if (selectedPlayers.length === 10 && new Set(selectedPlayers).size === 10) {
    return [...selectedPlayers];
  }

  return selectablePlayers.slice(0, 10);
}

export function isContestOpenForEntry(contest: Pick<ContestSummary, 'contestStatus'>) {
  return contest.contestStatus === 'open';
}

export function isContestLineupEditable(contest: Pick<ContestSummary, 'contestStatus'>) {
  return contest.contestStatus === 'open';
}

export function getPaymentReviewBreakdown(entryFeeCents: number) {
  const siteCreditAppliedCents = Math.min(demoWalletBalances.siteCreditCents, entryFeeCents);
  const remainingAfterSiteCredit = entryFeeCents - siteCreditAppliedCents;
  const cashBalanceAppliedCents = Math.min(demoWalletBalances.cashBalanceCents, remainingAfterSiteCredit);
  const amountDueTodayCents = entryFeeCents - siteCreditAppliedCents - cashBalanceAppliedCents;

  return {
    entryFeeCents,
    siteCreditAppliedCents,
    cashBalanceAppliedCents,
    amountDueTodayCents,
  };
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

async function readContestStore(options?: ContestDataOptions) {
  if (shouldUseFileStore(options)) {
    return readContestStoreFromFile(options?.dataFilePath);
  }

  return readContestStoreFromDatabase();
}

async function readContestStoreFromFile(dataFilePath = defaultContestDataPath) {
  const raw = await readFile(dataFilePath, 'utf8');
  return contestStoreSchema.parse(JSON.parse(raw));
}

async function writeContestStoreToFile(store: ContestStore, dataFilePath = defaultContestDataPath) {
  const directory = path.dirname(dataFilePath);
  const tempFilePath = path.join(directory, `${path.basename(dataFilePath)}.tmp`);

  await mkdir(directory, { recursive: true });
  await writeFile(tempFilePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
  await rename(tempFilePath, dataFilePath);
}

async function readContestStoreFromDatabase() {
  if (!hasBrowserSupabaseConfig()) {
    throw new Error('Contest data now requires Supabase configuration.');
  }

  const supabase: any = await createSupabaseClient();
  const [
    { data: contestRows, error: contestsError },
    { data: slateRows, error: slateError },
    { data: validationRows, error: validationError },
    { data: eventRows, error: eventError },
  ] = await Promise.all([
    supabase.from('contests').select('*'),
    supabase.from('contest_slate_players').select('*'),
    supabase.from('contest_validation_results').select('*'),
    supabase.from('contest_state_events').select('*'),
  ]);

  if (contestsError) {
    throw new Error(`Unable to read contests from Supabase: ${contestsError.message}`);
  }

  if (slateError) {
    throw new Error(`Unable to read slate players from Supabase: ${slateError.message}`);
  }

  if (validationError) {
    throw new Error(`Unable to read contest validation from Supabase: ${validationError.message}`);
  }

  if (eventError) {
    throw new Error(`Unable to read contest state events from Supabase: ${eventError.message}`);
  }

  const slatePlayersByContestId = new Map<string, ContestSlatePlayer[]>();

  for (const row of slateRows || []) {
    const parsed = toContestSlatePlayer(row);
    const existing = slatePlayersByContestId.get(row.contest_id) || [];
    existing.push(parsed);
    slatePlayersByContestId.set(row.contest_id, existing);
  }

  for (const players of slatePlayersByContestId.values()) {
    players.sort((a, b) => a.sortOrderInternal - b.sortOrderInternal);
  }

  const validationsByContestId = new Map<string, ContestValidationResult>();

  for (const row of validationRows || []) {
    const nextValidation = toContestValidationResult(row);
    const currentValidation = validationsByContestId.get(row.contest_id);

    if (!currentValidation || (currentValidation.validatedAt || '') < (nextValidation.validatedAt || '')) {
      validationsByContestId.set(row.contest_id, nextValidation);
    }
  }

  const contests = ((contestRows || []) as ContestDbRow[]).map((row) =>
    toContestRecord({
      row,
      slatePlayers: slatePlayersByContestId.get(row.id) || [],
      validation: validationsByContestId.get(row.id) || defaultContestValidation(),
    }),
  );

  const contestStateEvents = ((eventRows || []) as ContestStateEventDbRow[]).map(toContestStateEvent);

  return contestStoreSchema.parse({
    version: 1,
    contests,
    contestStateEvents,
  });
}

function shouldUseFixtureStore(options?: ContestDataOptions) {
  return (
    Boolean(options?.dataFilePath) ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

function shouldUseFileStore(options?: ContestDataOptions) {
  return shouldUseFixtureStore(options);
}

async function createSupabaseClient() {
  const { createClient } = await import('@/lib/supabase/server');
  return createClient();
}

async function createSupabaseAdminClient() {
  const { createAdminClient } = await import('@/lib/supabase/admin');
  return createAdminClient();
}

async function getDatabaseContestBySlug(contestSlug: string) {
  const store = await readContestStoreFromDatabase();
  const record = store.contests.find((contest) => contest.id === contestSlug);

  if (!record) {
    throw new Error('Contest not found.');
  }

  const supabase: any = await createSupabaseClient();
  const { data: row, error } = await supabase.from('contests').select('*').eq('slug', contestSlug).maybeSingle();

  if (error) {
    throw new Error(`Unable to load contest record: ${error.message}`);
  }

  if (!row) {
    throw new Error('Contest not found.');
  }

  return { row, record };
}

async function upsertContestValidationRow(contestRowId: string, validation: ContestValidationResult) {
  const supabase: any = await createSupabaseClient();
  const { error } = await supabase.from('contest_validation_results').upsert(
    {
      contest_id: contestRowId,
      status: validation.status,
      errors: validation.errors,
      warnings: validation.warnings,
      validated_at: validation.validatedAt ?? new Date().toISOString(),
      validated_by_admin_id: validation.validatedByAdminId,
    } satisfies ContestValidationDbInsert,
    {
      onConflict: 'contest_id',
    },
  );

  if (error) {
    throw new Error(`Unable to save contest validation: ${error.message}`);
  }
}

async function insertContestStateEventRow(event: ContestStateEventDbInsert) {
  const supabase: any = await createSupabaseClient();
  const { error } = await supabase.from('contest_state_events').insert(event);

  if (error) {
    throw new Error(`Unable to save contest state event: ${error.message}`);
  }
}

async function updateContestLifecycleStatus(contestSlug: string, status: ContestStatus, updatedAt: string) {
  const supabase: any = await createSupabaseClient();
  const { error } = await supabase.from('contests').update({ status, updated_at: updatedAt }).eq('slug', contestSlug);

  if (error) {
    throw new Error(`Unable to update contest lifecycle: ${error.message}`);
  }
}

function toContestSummary(contest: ContestRecord): ContestSummary {
  const prizePoolCents = Math.round(contest.entryFeeCents * contest.paidEntryCount * 0.7);
  const task = contest.description || 'Pick and rank your top 10 quarterbacks by passing yards.';

  return {
    id: contest.id,
    title: contest.title,
    description: contest.description,
    season: contest.season,
    week: contest.week,
    contestStatus: contest.status,
    status: statusLabels[contest.status],
    visibilityStatus: contest.visibilityStatus,
    isFeatured: contest.isFeatured,
    displayOrder: contest.displayOrder,
    entryFee: formatCents(contest.entryFeeCents),
    entryFeeCents: contest.entryFeeCents,
    prizePool: formatCents(prizePoolCents),
    prizePoolCents,
    entries: `${contest.entryCount} entries`,
    entryCount: contest.entryCount,
    paidEntryCount: contest.paidEntryCount,
    minimum: `This contest needs at least ${contest.minEntriesToRun} total entries to run`,
    slate: `${contest.slateSize}-QB player pool`,
    slateSize: contest.slateSize,
    task,
    statCategory: 'Passing yards',
    lockTime: formatContestLockTime(contest.lockTime),
    lockTimeIso: contest.lockTime,
    entryOpenTimeIso: contest.entryOpenTime,
    payoutRows: payoutStructure.map((row) => ({
      place: row.place,
      value: formatCents(Math.round(prizePoolCents * row.percentage)),
    })),
    lineupPlayers: [...contest.lineupPlayers],
    slatePlayers: [...contest.slatePlayers],
    createdByAdminId: contest.createdByAdminId,
    publishedByAdminId: contest.publishedByAdminId,
    publishedAt: contest.publishedAt,
    validation: contest.validation,
  };
}

function compareContestRecords(a: ContestRecord, b: ContestRecord) {
  const featuredDifference = Number(b.isFeatured) - Number(a.isFeatured);

  if (featuredDifference !== 0) {
    return featuredDifference;
  }

  const displayOrderA = a.displayOrder ?? Number.MAX_SAFE_INTEGER;
  const displayOrderB = b.displayOrder ?? Number.MAX_SAFE_INTEGER;

  if (displayOrderA !== displayOrderB) {
    return displayOrderA - displayOrderB;
  }

  return a.lockTime.localeCompare(b.lockTime);
}

function formatContestLockTime(lockTimeIso: string) {
  const lockTime = new Date(lockTimeIso);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(lockTime);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `Locks ${values.weekday}, ${values.month} ${values.day}, ${values.hour}:${values.minute} ${values.dayPeriod} ET`;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildContestValidationResult(contest: ContestRecord, now: string, validatedByAdminId: string | null) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!contest.title.trim()) {
    errors.push('Add a contest title before publish.');
  }

  if (!contest.description.trim()) {
    errors.push('Add a contest instruction before publish.');
  }

  if (contest.entryFeeCents < 0) {
    errors.push('Entry fee cannot be negative before publish.');
  }

  if (!contest.entryOpenTime) {
    errors.push('Add an entry open time before publish.');
  }

  if (!contest.lockTime) {
    errors.push('Add a contest lock time before publish.');
  }

  if (contest.entryOpenTime && contest.lockTime && contest.entryOpenTime >= contest.lockTime) {
    errors.push('Entry open time must be before contest lock time.');
  }

  if (contest.statType !== 'qb_passing_yards') {
    errors.push('Only QB Passing Yards is supported in the current admin flow.');
  }

  if (contest.slatePlayers.length !== contestPlayerPoolSize) {
    errors.push(
      `Add exactly ${contestPlayerPoolSize} quarterbacks before publish. Current player pool count: ${contest.slatePlayers.length}.`,
    );
  }

  const duplicatePlayerIds = findDuplicates(contest.slatePlayers.map((player) => player.playerId));
  if (duplicatePlayerIds.length > 0) {
    errors.push(`Remove duplicate slate players before publish. Duplicate player ids: ${duplicatePlayerIds.join(', ')}.`);
  }

  const duplicateProviderPlayerIds = findDuplicates(contest.slatePlayers.map((player) => player.providerPlayerId));
  if (duplicateProviderPlayerIds.length > 0) {
    errors.push(
      `Remove duplicate provider player ids before publish. Duplicate ids: ${duplicateProviderPlayerIds.join(', ')}.`,
    );
  }

  const duplicateSortOrders = findDuplicates(contest.slatePlayers.map((player) => String(player.sortOrderInternal)));
  if (duplicateSortOrders.length > 0) {
    errors.push(`Each slate row needs a unique internal order. Duplicate positions: ${duplicateSortOrders.join(', ')}.`);
  }

  for (const player of contest.slatePlayers) {
    if (player.position !== 'QB') {
      errors.push(`${player.displayName} must be marked as a QB before publish.`);
      break;
    }

    if (!player.providerPlayerId) {
      errors.push(`Cannot publish contest: ${player.displayName} is missing provider_player_id.`);
      break;
    }

    if (!player.providerGameId) {
      errors.push(`Cannot publish contest: ${player.displayName} is missing provider_game_id.`);
      break;
    }

    if (!player.teamAbbreviation || !player.opponentAbbreviation) {
      errors.push(`Cannot publish contest: ${player.displayName} is missing team or opponent data.`);
      break;
    }

    if (!player.gameStartTime) {
      errors.push(`Cannot publish contest: ${player.displayName} is missing game start time.`);
      break;
    }

    if (contest.lockTime && player.gameStartTime < contest.lockTime) {
      errors.push(`Cannot publish contest: ${player.displayName} starts before the contest lock time.`);
      break;
    }
  }

  if (contest.lineupPlayers.length !== contestRankedPlayerCount) {
    errors.push(`Save a ${contestRankedPlayerCount}-player default board order before publish.`);
  }

  return {
    status: errors.length > 0 ? 'failed' : 'passed',
    errors,
    warnings,
    validatedAt: now,
    validatedByAdminId,
  } satisfies ContestValidationResult;
}

function replaceContest(contests: ContestRecord[], contestIndex: number, nextContest: ContestRecord) {
  return contests.map((contest, index) => (index === contestIndex ? nextContest : contest));
}

function assertCanLockFreeTestContest(contest: ContestRecord) {
  if (contest.status !== 'open') {
    throw new Error('Only open contests can be locked through the free/test proof control.');
  }

  if (contest.visibilityStatus !== 'visible') {
    throw new Error('Only visible contests can be locked through the free/test proof control.');
  }

  if (contest.entryFeeCents !== 0) {
    throw new Error('Only $0 free/test contests can use the free/test proof lock.');
  }

  if (contest.paidEntryCount > 0) {
    throw new Error('$0 free/test proof contests must not have paid entries counted.');
  }

  if (contest.entryCount < 1) {
    throw new Error('Add at least one free/test entry before locking this proof contest.');
  }
}

function assertCanRetireFakePublicContestForBetaCleanup(contest: ContestRecord, actualEntryCount: number) {
  if (contest.visibilityStatus !== 'visible') {
    throw new Error('Hidden contests cannot use the public contest beta cleanup control.');
  }

  if (contest.id.includes('validation')) {
    throw new Error('Internal validation contests cannot use the public contest beta cleanup control.');
  }

  if (contest.status !== 'scheduled' && contest.status !== 'open') {
    throw new Error('Only scheduled or open public contests can use the beta cleanup retire control.');
  }

  if (actualEntryCount > 0) {
    throw new Error('This contest has saved entries. Review entries before retiring it.');
  }

  if (contest.entryFeeCents === 0 && contest.slateSize === contestPlayerPoolSize && contest.paidEntryCount === 0) {
    throw new Error('This contest already matches the free-beta public contest posture.');
  }
}

async function countPersistedEntriesForContestRow(contestRowId: string) {
  const supabase = await createSupabaseAdminClient();
  const { count, error } = await supabase
    .from('entries')
    .select('id', { count: 'exact', head: true })
    .eq('contest_id', contestRowId);

  if (error) {
    throw new Error(`Unable to verify saved entries before beta cleanup: ${error.message}`);
  }

  return count ?? 0;
}

function createBetaCleanupRetirementEvent({
  contest,
  actualEntryCount,
  retiredByAdminId,
  now,
}: {
  contest: ContestRecord;
  actualEntryCount: number;
  retiredByAdminId: string | null;
  now: string;
}) {
  return createContestStateEvent({
    contestId: contest.id,
    createdAt: now,
    fromStatus: contest.status,
    toStatus: 'canceled',
    trigger: 'admin',
    metadata: {
      cleanup_type: 'free_beta_public_contest_retirement',
      no_money: 'true',
      previous_visibility_status: contest.visibilityStatus,
      previous_entry_fee_cents: String(contest.entryFeeCents),
      previous_slate_size: String(contest.slateSize),
      previous_entry_count: String(contest.entryCount),
      previous_paid_entry_count: String(contest.paidEntryCount),
      persisted_entry_count: String(actualEntryCount),
      retired_by_admin_id: retiredByAdminId ?? '',
    },
  });
}

function resolvePublishedContestStatus(contest: ContestRecord, now: string) {
  if (contest.entryOpenTime && contest.entryOpenTime <= now) {
    return 'open' as const;
  }

  return 'scheduled' as const;
}

function createContestStateEvent({
  contestId,
  createdAt,
  fromStatus,
  toStatus,
  trigger,
  metadata = {},
}: {
  contestId: string;
  createdAt: string;
  fromStatus: ContestStatus | null;
  toStatus: ContestStatus;
  trigger: ContestStateEvent['trigger'];
  metadata?: Record<string, string>;
}) {
  return {
    eventId: randomUUID(),
    contestId,
    fromStatus,
    toStatus,
    trigger,
    createdAt,
    metadata,
  } satisfies ContestStateEvent;
}

function normalizeContestSlatePlayers(slatePlayers: ContestSlatePlayer[]) {
  return slatePlayers.map((player, index) =>
    contestSlatePlayerSchema.parse({
      ...player,
      playerId: player.playerId.trim(),
      displayName: player.displayName.trim(),
      teamAbbreviation: player.teamAbbreviation.trim().toUpperCase(),
      opponentAbbreviation: player.opponentAbbreviation.trim().toUpperCase(),
      providerPlayerId: player.providerPlayerId.trim(),
      providerGameId: player.providerGameId.trim(),
      homeAway: player.homeAway,
      position: 'QB',
      activeStatus: player.activeStatus?.trim() || null,
      sortOrderInternal: index + 1,
    }),
  );
}

function buildLineupShellPlayersFromSlate(slatePlayers: ContestSlatePlayer[]) {
  return [...slatePlayers]
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .slice(0, contestRankedPlayerCount)
    .map((player) => player.displayName);
}

function findDuplicates(values: string[]) {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  values.forEach((value) => {
    if (seen.has(value)) {
      duplicates.add(value);
    } else {
      seen.add(value);
    }
  });

  return [...duplicates];
}

function defaultContestValidation(): ContestValidationResult {
  return {
    status: 'not_run',
    errors: [],
    warnings: [],
    validatedAt: null,
    validatedByAdminId: null,
  };
}

function resetContestValidation(validation: ContestValidationResult): ContestValidationResult {
  return {
    ...validation,
    status: 'not_run',
    errors: [],
    warnings: [],
    validatedAt: null,
    validatedByAdminId: null,
  };
}

function toContestRecord({
  row,
  slatePlayers,
  validation,
}: {
  row: ContestDbRow;
  slatePlayers: ContestSlatePlayer[];
  validation: ContestValidationResult;
}) {
  return contestRecordSchema.parse({
    id: row.slug,
    title: row.title,
    description: row.description,
    season: row.season,
    week: row.week ?? 1,
    contestType: row.contest_type,
    statType: row.stat_type,
    slateSize: row.slate_size,
    entryFeeCents: row.entry_fee_cents,
    entryCount: row.entry_count,
    paidEntryCount: row.paid_entries_count,
    minEntriesToRun: row.min_entries_to_run,
    status: row.status,
    visibilityStatus: row.visibility_status,
    isFeatured: row.is_featured,
    displayOrder: row.display_order,
    entryOpenTime: normalizeIsoDateTime(row.entry_open_time),
    lockTime: normalizeIsoDateTime(row.lock_time),
    createdByAdminId: row.created_by_admin_id,
    publishedByAdminId: row.published_by_admin_id,
    publishedAt: normalizeIsoDateTime(row.published_at),
    createdAt: normalizeIsoDateTime(row.created_at),
    updatedAt: normalizeIsoDateTime(row.updated_at),
    lineupPlayers:
      row.lineup_players && row.lineup_players.length === contestRankedPlayerCount
        ? row.lineup_players
        : slatePlayers.length > 0
          ? buildLineupShellPlayersFromSlate(slatePlayers)
          : [...defaultLineupPlayers],
    slatePlayers,
    validation,
  });
}

function toContestDbInsert(contest: ContestRecord): ContestDbInsert {
  return {
    slug: contest.id,
    title: contest.title,
    description: contest.description,
    season: contest.season,
    week: contest.week,
    contest_type: contest.contestType,
    stat_type: contest.statType,
    slate_size: contest.slateSize,
    entry_fee_cents: contest.entryFeeCents,
    entry_count: contest.entryCount,
    paid_entries_count: contest.paidEntryCount,
    min_entries_to_run: contest.minEntriesToRun,
    status: contest.status,
    visibility_status: contest.visibilityStatus,
    is_featured: contest.isFeatured,
    display_order: contest.displayOrder,
    entry_open_time: contest.entryOpenTime,
    lock_time: contest.lockTime,
    created_by_admin_id: contest.createdByAdminId,
    published_by_admin_id: contest.publishedByAdminId,
    published_at: contest.publishedAt,
    created_at: contest.createdAt,
    updated_at: contest.updatedAt,
    lineup_players: contest.lineupPlayers,
  };
}

function toContestSlatePlayer(row: ContestSlatePlayerDbRow) {
  return contestSlatePlayerSchema.parse({
    playerId: row.player_id || row.player_external_id || row.player_name,
    providerPlayerId: row.provider_player_id || row.player_external_id || row.player_name,
    providerGameId: row.provider_game_id || `${row.contest_id}-${row.id}`,
    displayName: row.display_name || row.player_name,
    teamAbbreviation: row.team_abbreviation,
    opponentAbbreviation: row.opponent_abbreviation,
    homeAway: row.home_away || (row.opponent_context === 'vs' ? 'home' : 'away'),
    gameStartTime: normalizeIsoDateTime(row.game_start_time || new Date().toISOString()),
    position: 'QB',
    activeStatus: row.active_status,
    sortOrderInternal: row.sort_order_internal || row.display_order,
  });
}

function toContestSlatePlayerDbInsert(contestRowId: string, player: ContestSlatePlayer): ContestSlatePlayerDbInsert {
  return {
    contest_id: contestRowId,
    player_external_id: player.providerPlayerId,
    player_name: player.displayName,
    team_abbreviation: player.teamAbbreviation,
    opponent_abbreviation: player.opponentAbbreviation,
    opponent_context: player.homeAway === 'home' ? 'vs' : '@',
    display_order: player.sortOrderInternal,
    player_id: player.playerId,
    provider_player_id: player.providerPlayerId,
    provider_game_id: player.providerGameId,
    display_name: player.displayName,
    home_away: player.homeAway,
    game_start_time: player.gameStartTime,
    position: player.position,
    sort_order_internal: player.sortOrderInternal,
    active_status: player.activeStatus,
  };
}

function toContestValidationResult(row: ContestValidationDbRow): ContestValidationResult {
  return {
    status: row.status === 'passed' || row.status === 'failed' ? row.status : 'not_run',
    errors: row.errors,
    warnings: row.warnings,
    validatedAt: normalizeIsoDateTime(row.validated_at),
    validatedByAdminId: row.validated_by_admin_id,
  };
}

function toContestStateEvent(row: ContestStateEventDbRow): ContestStateEvent {
  return contestStateEventSchema.parse({
    eventId: row.event_id,
    contestId: row.contest_id,
    fromStatus: row.from_status,
    toStatus: row.to_status,
    trigger: row.trigger,
    createdAt: normalizeIsoDateTime(row.created_at),
    metadata: toStringRecord(row.metadata),
  });
}

function normalizeIsoDateTime(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toISOString();
}

function toContestStateEventDbInsert(event: {
  contestId: string;
  createdAt: string;
  fromStatus: ContestStatus | null;
  toStatus: ContestStatus;
  trigger: ContestStateEvent['trigger'];
  metadata?: Record<string, string>;
}): ContestStateEventDbInsert {
  return {
    contest_id: event.contestId,
    created_at: event.createdAt,
    from_status: event.fromStatus,
    to_status: event.toStatus,
    trigger: event.trigger,
    metadata: event.metadata || {},
  };
}

function fromContestStateEvent(event: ContestStateEvent) {
  return {
    contestId: event.contestId,
    createdAt: event.createdAt,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    trigger: event.trigger,
    metadata: event.metadata,
  };
}

function toStringRecord(value: Json | null) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value)
      .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
      .map(([key, entryValue]) => [key, entryValue]),
  );
}

function transitionContestLifecycle(contest: ContestRecord, now: string) {
  if (contest.status === 'scheduled' && contest.entryOpenTime && contest.entryOpenTime <= now) {
    return {
      contest: {
        ...contest,
        status: 'open',
        updatedAt: now,
      } satisfies ContestRecord,
      event: createContestStateEvent({
        contestId: contest.id,
        createdAt: now,
        fromStatus: 'scheduled',
        toStatus: 'open',
        trigger: 'system',
      }),
    };
  }

  if (contest.status === 'open' && contest.lockTime <= now) {
    return {
      contest: {
        ...contest,
        status: 'locked',
        updatedAt: now,
      } satisfies ContestRecord,
      event: createContestStateEvent({
        contestId: contest.id,
        createdAt: now,
        fromStatus: 'open',
        toStatus: 'locked',
        trigger: 'lock_time',
        metadata: {
          viability_check: 'pending',
        },
      }),
    };
  }

  return null;
}
