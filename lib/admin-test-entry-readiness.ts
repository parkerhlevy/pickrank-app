import { listAdminContests, type ContestStatus, type ContestSummary } from '@/lib/contest-data';
import { hasBrowserSupabaseConfig } from '@/lib/env';
import { listPersistedContestEntriesForContest, type PersistedContestEntrySource } from '@/lib/persisted-contest-entry';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

const relevantContestStatuses = new Set<ContestStatus>([
  'scheduled',
  'open',
  'locked',
  'live',
  'finalizing',
]);

export type AdminTestEntrantIdentity = {
  userId: string;
  email?: string | null;
  username?: string | null;
  displayName?: string | null;
  eligibilityStatus?: string | null;
};

export type AdminTestEntryRecord = {
  entryId: string;
  contestId: string;
  userId: string;
  entryStatus: string;
  source: PersistedContestEntrySource;
  lastSavedAt: string | null;
  createdAt: string;
  updatedAt: string;
  lineupPlayerCount: number;
};

export type AdminTestEntryLineupStatus = 'saved' | 'assigned_default' | 'missing_incomplete';

export type AdminTestEntryReadinessEntrant = {
  entryId: string;
  userId: string;
  userLabel: string;
  email: string;
  displayName: string;
  username: string;
  eligibilityStatus: string;
  entryStatus: string;
  createdAt: string;
  updatedAt: string;
  lineupStatus: AdminTestEntryLineupStatus;
  lineupStatusLabel: string;
  lineupSourceLabel: string;
  lastSavedAt: string | null;
  savedPlayerCount: number;
  issues: string[];
};

export type AdminTestEntryContestReadiness = {
  contestId: string;
  title: string;
  lifecycleStatus: string;
  visibilityStatus: string;
  entryFee: string;
  entryFeeCents: number;
  lockTime: string;
  totalEntries: number;
  paidEntries: number;
  freeTestEntries: number;
  savedEntryRecords: number;
  status: 'ready' | 'needs_attention';
  issues: string[];
  entrants: AdminTestEntryReadinessEntrant[];
};

type AdminTestEntryReadinessOptions = {
  contests?: ContestSummary[];
  entryDataFilePath?: string;
  contestDataFilePath?: string;
};

type ContestDbIdentityRow = Pick<Database['public']['Tables']['contests']['Row'], 'id' | 'slug'>;
type EntryDbRow = Database['public']['Tables']['entries']['Row'];
type EntryLineupDbRow = Database['public']['Tables']['entry_lineups']['Row'];
type ProfileIdentityRow = Pick<
  Database['public']['Tables']['profiles']['Row'],
  'id' | 'username' | 'display_name' | 'eligibility_status'
>;
type SupabaseReadError = { message: string } | null;
type SupabaseReadResult<T> = Promise<{ data: T[] | null; error: SupabaseReadError }>;
type SupabaseSelectInQuery<T> = {
  in(column: string, values: string[]): SupabaseReadResult<T>;
};
type SupabaseSelectableTable<T> = {
  select(columns: string): SupabaseSelectInQuery<T>;
};

export async function listAdminTestEntryReadiness({
  contests,
  entryDataFilePath,
  contestDataFilePath,
}: AdminTestEntryReadinessOptions = {}) {
  const adminContests = contests ?? await listAdminContests();
  const entriesByContestId = await readAdminEntryRecordsByContestId(adminContests, {
    entryDataFilePath,
    contestDataFilePath,
  });
  const relevantContests = adminContests.filter((contest) => {
    const entries = entriesByContestId.get(contest.id) || [];

    return relevantContestStatuses.has(contest.contestStatus) || entries.length > 0;
  });
  const userIds = [
    ...new Set(
      relevantContests.flatMap((contest) => (entriesByContestId.get(contest.id) || []).map((entry) => entry.userId)),
    ),
  ];
  const identityByUserId = await readEntrantIdentitiesByUserId(userIds);

  return relevantContests.map((contest) =>
    buildContestTestEntryReadiness({
      contest,
      entries: entriesByContestId.get(contest.id) || [],
      identityByUserId,
    }),
  );
}

export function buildContestTestEntryReadiness({
  contest,
  entries,
  identityByUserId = new Map<string, AdminTestEntrantIdentity>(),
}: {
  contest: ContestSummary;
  entries: AdminTestEntryRecord[];
  identityByUserId?: Map<string, AdminTestEntrantIdentity>;
}): AdminTestEntryContestReadiness {
  const freeTestEntries = Math.max(contest.entryCount - contest.paidEntryCount, 0);
  const entrants = entries
    .slice()
    .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
    .map((entry) => buildEntrantReadiness(entry, contest, identityByUserId.get(entry.userId)));
  const issues = buildContestIssues({ contest, entries, freeTestEntries, entrants });

  return {
    contestId: contest.id,
    title: contest.title,
    lifecycleStatus: contest.status,
    visibilityStatus: contest.visibilityStatus,
    entryFee: contest.entryFee,
    entryFeeCents: contest.entryFeeCents,
    lockTime: contest.lockTime,
    totalEntries: contest.entryCount,
    paidEntries: contest.paidEntryCount,
    freeTestEntries,
    savedEntryRecords: entries.length,
    status: issues.length === 0 && entrants.every((entrant) => entrant.issues.length === 0) ? 'ready' : 'needs_attention',
    issues,
    entrants,
  };
}

function buildEntrantReadiness(
  entry: AdminTestEntryRecord,
  contest: ContestSummary,
  identity: AdminTestEntrantIdentity | undefined,
): AdminTestEntryReadinessEntrant {
  const hasIdentity = Boolean(identity?.email || identity?.displayName || identity?.username);
  const lineupStatus = getLineupStatus(entry);
  const issues = [];

  if (!hasIdentity) {
    issues.push('Entrant identity is unavailable.');
  }

  if (lineupStatus === 'missing_incomplete') {
    issues.push('Lineup is missing or incomplete.');
  }

  if (lineupStatus === 'assigned_default') {
    issues.push('Default lineup is still assigned.');
  }

  if (contest.contestStatus === 'locked' && lineupStatus === 'missing_incomplete') {
    issues.push('Locked contest has an incomplete lineup.');
  }

  return {
    entryId: entry.entryId,
    userId: entry.userId,
    userLabel: identity?.displayName || identity?.username || `User ${formatUserIdSuffix(entry.userId)}`,
    email: identity?.email || 'Email unavailable',
    displayName: identity?.displayName || 'Display name unavailable',
    username: identity?.username || 'Username unavailable',
    eligibilityStatus: identity?.eligibilityStatus || 'Not shown',
    entryStatus: entry.entryStatus,
    createdAt: entry.createdAt,
    updatedAt: entry.updatedAt,
    lineupStatus,
    lineupStatusLabel: formatLineupStatus(lineupStatus),
    lineupSourceLabel:
      entry.source === 'user_saved'
        ? 'User saved'
        : entry.source === 'entry_created'
          ? 'Entry created'
          : 'Assigned default',
    lastSavedAt: entry.lastSavedAt,
    savedPlayerCount: entry.lineupPlayerCount,
    issues,
  };
}

function buildContestIssues({
  contest,
  entries,
  freeTestEntries,
  entrants,
}: {
  contest: ContestSummary;
  entries: AdminTestEntryRecord[];
  freeTestEntries: number;
  entrants: AdminTestEntryReadinessEntrant[];
}) {
  const issues = [];

  if (entries.length === 0) {
    issues.push('No saved entry records found.');
  }

  if (contest.entryCount !== entries.length) {
    issues.push(`Entry count ${contest.entryCount} does not match ${entries.length} saved entry records.`);
  }

  if (contest.entryFeeCents === 0 && contest.paidEntryCount > 0) {
    issues.push('$0 contest has paid entries counted.');
  }

  if (contest.entryFeeCents > 0 && freeTestEntries > 0) {
    issues.push('Nonzero contest has free/test entry count.');
  }

  if (contest.paidEntryCount > contest.entryCount) {
    issues.push('Paid entries exceed total entries.');
  }

  if (contest.contestStatus === 'locked' && entrants.some((entrant) => entrant.lineupStatus === 'missing_incomplete')) {
    issues.push('Locked contest has at least one incomplete lineup.');
  }

  return issues;
}

function getLineupStatus(entry: AdminTestEntryRecord): AdminTestEntryLineupStatus {
  if (entry.lineupPlayerCount !== 10) {
    return 'missing_incomplete';
  }

  return entry.source === 'user_saved' ? 'saved' : 'assigned_default';
}

function formatLineupStatus(status: AdminTestEntryLineupStatus) {
  switch (status) {
    case 'saved':
      return 'Saved';
    case 'assigned_default':
      return 'Assigned default';
    case 'missing_incomplete':
      return 'Missing/incomplete';
  }
}

async function readAdminEntryRecordsByContestId(
  contests: ContestSummary[],
  {
    entryDataFilePath,
    contestDataFilePath,
  }: Pick<AdminTestEntryReadinessOptions, 'entryDataFilePath' | 'contestDataFilePath'> = {},
) {
  if (shouldUseFixtureEntryStore(entryDataFilePath)) {
    return readFixtureEntryRecordsByContestId(contests, {
      entryDataFilePath,
      contestDataFilePath,
    });
  }

  return readDatabaseEntryRecordsByContestId(contests);
}

async function readFixtureEntryRecordsByContestId(
  contests: ContestSummary[],
  {
    entryDataFilePath,
    contestDataFilePath,
  }: Pick<AdminTestEntryReadinessOptions, 'entryDataFilePath' | 'contestDataFilePath'> = {},
) {
  const entriesByContestId = new Map<string, AdminTestEntryRecord[]>();

  await Promise.all(
    contests.map(async (contest) => {
      const entries = await listPersistedContestEntriesForContest({
        contestId: contest.id,
        players: contest.slatePlayers.map((player) => player.displayName),
        defaultSelectedOrder: contest.lineupPlayers,
        options: {
          dataFilePath: entryDataFilePath,
          contestDataFilePath,
        },
      });

      entriesByContestId.set(
        contest.id,
        entries.map((entry) => ({
          entryId: entry.entryId,
          contestId: entry.contestId,
          userId: entry.userId,
          entryStatus: 'created',
          source: entry.source,
          lastSavedAt: entry.lastSavedAt,
          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
          lineupPlayerCount: entry.lineupOrder.length,
        })),
      );
    }),
  );

  return entriesByContestId;
}

async function readDatabaseEntryRecordsByContestId(contests: ContestSummary[]) {
  const entriesByContestId = new Map<string, AdminTestEntryRecord[]>();

  if (contests.length === 0 || !hasBrowserSupabaseConfig()) {
    return entriesByContestId;
  }

  const supabase = await createClient();
  const contestSlugs = contests.map((contest) => contest.id);
  const contestsTable = supabase.from('contests') as unknown as SupabaseSelectableTable<ContestDbIdentityRow>;
  const { data: contestRows, error: contestError } = await contestsTable.select('id, slug').in('slug', contestSlugs);

  if (contestError) {
    throw new Error(`Unable to read contest ids for test-entry readiness: ${contestError.message}`);
  }

  const typedContestRows = (contestRows || []) as ContestDbIdentityRow[];
  const contestSlugByUuid = new Map<string, string>(typedContestRows.map((row) => [row.id, row.slug]));
  const contestUuids = [...contestSlugByUuid.keys()];

  if (contestUuids.length === 0) {
    return entriesByContestId;
  }

  const entriesTable = supabase.from('entries') as unknown as SupabaseSelectableTable<EntryDbRow>;
  const { data: entryRows, error: entryError } = await entriesTable.select('*').in('contest_id', contestUuids);

  if (entryError) {
    throw new Error(`Unable to read entries for test-entry readiness: ${entryError.message}`);
  }

  const entryIds = ((entryRows || []) as EntryDbRow[]).map((entry) => entry.id);
  const lineupRowsByEntryId = new Map<string, EntryLineupDbRow[]>();

  if (entryIds.length > 0) {
    const entryLineupsTable = supabase.from('entry_lineups') as unknown as SupabaseSelectableTable<EntryLineupDbRow>;
    const { data: lineupRows, error: lineupError } = await entryLineupsTable.select('*').in('entry_id', entryIds);

    if (lineupError) {
      throw new Error(`Unable to read lineups for test-entry readiness: ${lineupError.message}`);
    }

    for (const lineupRow of (lineupRows || []) as EntryLineupDbRow[]) {
      const existingRows = lineupRowsByEntryId.get(lineupRow.entry_id) || [];
      existingRows.push(lineupRow);
      lineupRowsByEntryId.set(lineupRow.entry_id, existingRows);
    }
  }

  for (const entryRow of (entryRows || []) as EntryDbRow[]) {
    const contestSlug = contestSlugByUuid.get(entryRow.contest_id);

    if (!contestSlug) {
      continue;
    }

    const lineupRows = lineupRowsByEntryId.get(entryRow.id) || [];
    const contestEntries = entriesByContestId.get(contestSlug) || [];
    const lastSavedAt = entryRow.updated_at > entryRow.created_at ? entryRow.updated_at : null;

    contestEntries.push({
      entryId: entryRow.id,
      contestId: contestSlug,
      userId: entryRow.user_id,
      entryStatus: entryRow.status,
      source: lineupRows.length === 0 ? 'entry_created' : lastSavedAt ? 'user_saved' : 'default_assigned',
      lastSavedAt,
      createdAt: entryRow.created_at,
      updatedAt: entryRow.updated_at,
      lineupPlayerCount: lineupRows.length,
    });
    entriesByContestId.set(contestSlug, contestEntries);
  }

  return entriesByContestId;
}

async function readEntrantIdentitiesByUserId(userIds: string[]) {
  const identityByUserId = new Map<string, AdminTestEntrantIdentity>();

  if (userIds.length === 0) {
    return identityByUserId;
  }

  await Promise.all([
    enrichIdentitiesFromProfiles(userIds, identityByUserId),
    enrichIdentitiesFromAuthUsers(userIds, identityByUserId),
  ]);

  return identityByUserId;
}

async function enrichIdentitiesFromProfiles(
  userIds: string[],
  identityByUserId: Map<string, AdminTestEntrantIdentity>,
) {
  if (!hasBrowserSupabaseConfig()) {
    return;
  }

  try {
    const supabase = await createClient();
    const profilesTable = supabase.from('profiles') as unknown as SupabaseSelectableTable<ProfileIdentityRow>;
    const { data, error } = await profilesTable
      .select('id, username, display_name, eligibility_status')
      .in('id', userIds);

    if (error) {
      return;
    }

    for (const profile of (data || []) as ProfileIdentityRow[]) {
      identityByUserId.set(profile.id, {
        ...identityByUserId.get(profile.id),
        userId: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        eligibilityStatus: profile.eligibility_status,
      });
    }
  } catch {
    return;
  }
}

async function enrichIdentitiesFromAuthUsers(
  userIds: string[],
  identityByUserId: Map<string, AdminTestEntrantIdentity>,
) {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });

    if (error) {
      return;
    }

    const requestedUserIds = new Set(userIds);

    for (const user of data.users) {
      if (!requestedUserIds.has(user.id)) {
        continue;
      }

      const metadata = user.user_metadata || {};
      const existingIdentity = identityByUserId.get(user.id);

      identityByUserId.set(user.id, {
        ...existingIdentity,
        userId: user.id,
        email: user.email || existingIdentity?.email || null,
        username:
          existingIdentity?.username ||
          (typeof metadata.username === 'string' ? metadata.username : null),
        displayName:
          existingIdentity?.displayName ||
          (typeof metadata.display_name === 'string' ? metadata.display_name : null),
        eligibilityStatus:
          existingIdentity?.eligibilityStatus ||
          (typeof metadata.eligibility_status === 'string' ? metadata.eligibility_status : null),
      });
    }
  } catch {
    return;
  }
}

function shouldUseFixtureEntryStore(entryDataFilePath: string | undefined) {
  return (
    Boolean(entryDataFilePath) ||
    process.env.NODE_ENV === 'test' ||
    process.env.VITEST === 'true' ||
    process.env.PICKRANK_E2E_USE_FILE_STORE === '1'
  );
}

function formatUserIdSuffix(userId: string) {
  return userId.slice(-6) || 'unknown';
}
