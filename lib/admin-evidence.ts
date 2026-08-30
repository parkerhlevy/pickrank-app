import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { User } from '@supabase/supabase-js';
import { hasServiceRoleSupabaseConfig } from '@/lib/env';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Database, Json } from '@/lib/supabase/types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ContestRow = Database['public']['Tables']['contests']['Row'];
type EntryRow = Database['public']['Tables']['entries']['Row'];
type LineupRow = Database['public']['Tables']['entry_lineups']['Row'];
type SlateRow = Database['public']['Tables']['contest_slate_players']['Row'];
type RevisionRow = Database['public']['Tables']['entry_board_revisions']['Row'];
type RevisionItemRow = Database['public']['Tables']['entry_board_revision_items']['Row'];
type SubjectRow = Database['public']['Tables']['analytics_subjects']['Row'];
type ScoreRow = Database['public']['Tables']['entry_scoring_results']['Row'];
type AuditRow = Database['public']['Tables']['admin_audit_events']['Row'];
type RulesetRow = Database['public']['Tables']['contest_ruleset_snapshots']['Row'];
type PlayerResultRow = Database['public']['Tables']['contest_player_results']['Row'];
type EntryPlayerScoreRow = Database['public']['Tables']['entry_player_scores']['Row'];
type StatSnapshotRow = Database['public']['Tables']['contest_stat_snapshots']['Row'];
type StatSnapshotItemRow = Database['public']['Tables']['contest_stat_snapshot_rows']['Row'];

export type AdminBoardRevision = {
  boardHash: string;
  eventType: string;
  items: Array<{ playerName: string; rankPosition: number; slatePlayerId: string }>;
  revisionId: string;
  revisionNumber: number;
  savedAt: string;
  source: string;
};

export type AdminEvidenceEntry = {
  contestId: string;
  contestSlug: string;
  contestStatus: string;
  contestTitle: string;
  createdAt: string;
  currentBoard: Array<{ playerName: string; rankPosition: number; slatePlayerId: string }>;
  entryId: string;
  entryStatus: string;
  revisions: AdminBoardRevision[];
  score: null | {
    exactPicks: number;
    finalRank: number;
    finalRankDisplay: string;
    oneOffOrBetterPicks: number;
    scoringVersion: string;
    totalScore: number;
  };
  updatedAt: string;
  userId: string;
};

export type AdminEvidenceUser = {
  accountStatus: string;
  ageGateStatus: string;
  createdAt: string;
  dateOfBirth: string | null;
  displayName: string;
  email: string;
  eligibilityStatus: string;
  entries: AdminEvidenceEntry[];
  entryCount: number;
  jurisdiction: string;
  kycStatus: string;
  lastSignInAt: string | null;
  privacyPolicyAcceptedAt: string | null;
  revisionCount: number;
  scoredEntryCount: number;
  termsAcceptedAt: string | null;
  userId: string;
  username: string;
};

export type AdminContestEvidence = {
  contestId: string;
  entryCount: number;
  entries: Array<AdminEvidenceEntry & { displayName: string; email: string; username: string }>;
  evidenceStatus: 'complete' | 'needs_attention';
  lockTime: string;
  missingRevisionCount: number;
  revisionCount: number;
  scoredEntryCount: number;
  slug: string;
  status: string;
  title: string;
  visibilityStatus: string;
};

export type AdminEvidenceOverview = {
  auditEventCount: number;
  contestCount: number;
  entryCount: number;
  latestAuditEvents: AuditRow[];
  missingRevisionCount: number;
  revisionCount: number;
  scoredEntryCount: number;
  userCount: number;
};

export function isMissingOptionalEvidenceTable(error: null | { code?: string; message: string }) {
  return Boolean(
    error
    && (
      error.code === 'PGRST205'
      || error.message.includes('Could not find the table')
    )
  );
}

type EvidenceSnapshot = {
  auditEvents: AuditRow[];
  authUsers: User[];
  contests: ContestRow[];
  entries: EntryRow[];
  lineups: LineupRow[];
  profiles: ProfileRow[];
  playerResults: PlayerResultRow[];
  revisionItems: RevisionItemRow[];
  revisions: RevisionRow[];
  rulesets: RulesetRow[];
  scores: ScoreRow[];
  slatePlayers: SlateRow[];
  statSnapshotItems: StatSnapshotItemRow[];
  statSnapshots: StatSnapshotRow[];
  subjects: SubjectRow[];
  entryPlayerScores: EntryPlayerScoreRow[];
};

export async function listAdminEvidenceUsers(query = '') {
  const snapshot = await loadEvidenceSnapshot();
  const normalizedQuery = query.trim().toLowerCase();

  return buildUsers(snapshot)
    .filter((user) => {
      if (!normalizedQuery) return true;
      return [user.email, user.username, user.displayName, user.userId]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
    })
    .sort((left, right) => left.email.localeCompare(right.email));
}

export async function getAdminEvidenceUser(userId: string) {
  const users = buildUsers(await loadEvidenceSnapshot());
  return users.find((user) => user.userId === userId) ?? null;
}

export async function getAdminContestEvidence(contestSlug: string) {
  const snapshot = await loadEvidenceSnapshot();
  const contest = snapshot.contests.find((candidate) => candidate.slug === contestSlug || candidate.id === contestSlug);

  if (!contest) return null;

  const usersById = new Map(buildUsers(snapshot).map((user) => [user.userId, user]));
  const entries = buildEntries(snapshot).filter((entry) => entry.contestId === contest.id);
  const missingRevisionCount = entries.filter((entry) => entry.revisions.length === 0).length;

  return {
    contestId: contest.id,
    entryCount: entries.length,
    entries: entries.map((entry) => {
      const user = usersById.get(entry.userId);
      return {
        ...entry,
        displayName: user?.displayName || 'Display name unavailable',
        email: user?.email || 'Email unavailable',
        username: user?.username || 'Username unavailable',
      };
    }),
    evidenceStatus: missingRevisionCount === 0 ? 'complete' : 'needs_attention',
    lockTime: contest.lock_time,
    missingRevisionCount,
    revisionCount: entries.reduce((total, entry) => total + entry.revisions.length, 0),
    scoredEntryCount: entries.filter((entry) => entry.score).length,
    slug: contest.slug,
    status: contest.status,
    title: contest.title,
    visibilityStatus: contest.visibility_status,
  } satisfies AdminContestEvidence;
}

export async function getAdminEvidenceOverview(): Promise<AdminEvidenceOverview> {
  const snapshot = await loadEvidenceSnapshot();
  const entryIdsWithRevisions = new Set(snapshot.revisions.map((revision) => revision.entry_id));

  return {
    auditEventCount: snapshot.auditEvents.length,
    contestCount: snapshot.contests.length,
    entryCount: snapshot.entries.length,
    latestAuditEvents: snapshot.auditEvents
      .slice()
      .sort((left, right) => right.created_at.localeCompare(left.created_at))
      .slice(0, 10),
    missingRevisionCount: snapshot.entries.filter((entry) => !entryIdsWithRevisions.has(entry.id)).length,
    revisionCount: snapshot.revisions.length,
    scoredEntryCount: snapshot.scores.length,
    userCount: snapshot.authUsers.length,
  };
}

export async function buildAdminEvidencePackage({
  identified,
}: {
  identified: boolean;
}) {
  const snapshot = await loadEvidenceSnapshot();
  const users = buildUsers(snapshot);
  const generatedAt = new Date().toISOString();

  return {
    manifest: {
      datasetVersion: 1,
      generatedAt,
      identified,
      scope: 'all_available_admin_evidence',
      tableCounts: {
        contests: snapshot.contests.length,
        entries: snapshot.entries.length,
        revisions: snapshot.revisions.length,
        revisionItems: snapshot.revisionItems.length,
        rulesets: snapshot.rulesets.length,
        scores: snapshot.scores.length,
        playerResults: snapshot.playerResults.length,
        entryPlayerScores: snapshot.entryPlayerScores.length,
        statSnapshots: snapshot.statSnapshots.length,
        subjects: snapshot.subjects.length,
      },
    },
    dataDictionary: {
      entries: 'One contest entry per user and contest.',
      revisions: 'Append-only explicit save, entry creation, lock snapshot, correction, or legacy baseline.',
      revisionItems: 'The ordered slate players belonging to one immutable board revision.',
      scores: 'Persisted final contest scoring outputs and scoring version.',
      rulesets: 'Immutable contest format, slate, and scoring-version snapshots.',
      playerResults: 'Final player outcomes used to score entries.',
      statSnapshots: 'Provider snapshot lineage retained before finalization.',
      subjects: 'Stable pseudonymous analysis identity. Direct user mapping is omitted by default.',
    },
    datasets: {
      contests: snapshot.contests,
      entries: snapshot.entries.map(({ user_id, ...entry }) => ({
        ...entry,
        ...(identified ? { user_id } : {}),
        subject_id: snapshot.subjects.find((subject) => subject.user_id === user_id)?.subject_id ?? null,
      })),
      revisions: snapshot.revisions,
      revisionItems: snapshot.revisionItems,
      rulesets: snapshot.rulesets,
      playerResults: snapshot.playerResults,
      entryPlayerScores: snapshot.entryPlayerScores,
      statSnapshots: snapshot.statSnapshots,
      statSnapshotItems: snapshot.statSnapshotItems,
      scores: snapshot.scores.map(({ user_id, ...score }) => ({
        ...score,
        ...(identified ? { user_id } : {}),
        subject_id: snapshot.subjects.find((subject) => subject.user_id === user_id)?.subject_id ?? null,
      })),
      users: users.map((user) => identified
        ? user
        : {
            accountStatus: user.accountStatus,
            eligibilityStatus: user.eligibilityStatus,
            entryCount: user.entryCount,
            revisionCount: user.revisionCount,
            scoredEntryCount: user.scoredEntryCount,
            subjectId: snapshot.subjects.find((subject) => subject.user_id === user.userId)?.subject_id ?? null,
          }),
    },
  };
}

export async function recordAdminAuditEvent({
  actorUserId,
  eventType,
  metadata = {},
  reason,
  targetId,
  targetType,
}: {
  actorUserId: string | null;
  eventType: string;
  metadata?: Json;
  reason?: string | null;
  targetId?: string | null;
  targetType: string;
}) {
  if (!hasServiceRoleSupabaseConfig()) return;

  const auditTable = createAdminClient().from('admin_audit_events') as unknown as {
    insert(value: Database['public']['Tables']['admin_audit_events']['Insert']): Promise<{ error: { message: string } | null }>;
  };
  const { error } = await auditTable.insert({
    actor_user_id: actorUserId,
    event_type: eventType,
    metadata,
    reason: reason || null,
    target_id: targetId || null,
    target_type: targetType,
  });

  if (error) {
    throw new Error(`Unable to write the admin audit record: ${error.message}`);
  }
}

function buildUsers(snapshot: EvidenceSnapshot): AdminEvidenceUser[] {
  const profilesById = new Map(snapshot.profiles.map((profile) => [profile.id, profile]));
  const entriesByUserId = groupBy(snapshot.entries, (entry) => entry.user_id);
  const builtEntries = buildEntries(snapshot);
  const builtEntriesByUserId = groupBy(builtEntries, (entry) => entry.userId);

  return snapshot.authUsers.map((authUser) => {
    const profile = profilesById.get(authUser.id);
    const entries = builtEntriesByUserId.get(authUser.id) || [];
    const rawEntries = entriesByUserId.get(authUser.id) || [];

    return {
      accountStatus: profile?.account_status || String(authUser.user_metadata?.account_status || 'active'),
      ageGateStatus: profile?.age_gate_status || String(authUser.user_metadata?.age_gate_status || 'unknown'),
      createdAt: authUser.created_at,
      dateOfBirth: profile?.date_of_birth || null,
      displayName: profile?.display_name || String(authUser.user_metadata?.display_name || 'Display name unavailable'),
      email: authUser.email || 'Email unavailable',
      eligibilityStatus: profile?.eligibility_status || String(authUser.user_metadata?.eligibility_status || 'unknown'),
      entries,
      entryCount: rawEntries.length,
      jurisdiction: profile?.jurisdiction || String(authUser.user_metadata?.jurisdiction || 'Not provided'),
      kycStatus: profile?.kyc_status || String(authUser.user_metadata?.kyc_status || 'not_required'),
      lastSignInAt: authUser.last_sign_in_at || null,
      privacyPolicyAcceptedAt: profile?.privacy_policy_accepted_at || null,
      revisionCount: entries.reduce((total, entry) => total + entry.revisions.length, 0),
      scoredEntryCount: entries.filter((entry) => entry.score).length,
      termsAcceptedAt: profile?.terms_accepted_at || null,
      userId: authUser.id,
      username: profile?.username || String(authUser.user_metadata?.username || 'Username unavailable'),
    };
  });
}

function buildEntries(snapshot: EvidenceSnapshot): AdminEvidenceEntry[] {
  const contestsById = new Map(snapshot.contests.map((contest) => [contest.id, contest]));
  const slateById = new Map(snapshot.slatePlayers.map((player) => [player.id, player]));
  const lineupsByEntryId = groupBy(snapshot.lineups, (lineup) => lineup.entry_id);
  const subjectsById = new Map(snapshot.subjects.map((subject) => [subject.subject_id, subject]));
  const revisionsByEntryId = groupBy(snapshot.revisions, (revision) => revision.entry_id);
  const subjectIdByEntryId = new Map(
    snapshot.revisions.map((revision) => [revision.entry_id, revision.subject_id]),
  );
  const revisionItemsByRevisionId = groupBy(snapshot.revisionItems, (item) => item.revision_id);
  const scoresByEntryId = new Map(snapshot.scores.map((score) => [score.entry_id, score]));

  return snapshot.entries.map((entry) => {
    const contest = contestsById.get(entry.contest_id);
    const revisions = (revisionsByEntryId.get(entry.id) || [])
      .slice()
      .sort((left, right) => left.revision_number - right.revision_number)
      .map((revision) => ({
        boardHash: revision.board_hash,
        eventType: revision.event_type,
        items: buildBoardItems(revisionItemsByRevisionId.get(revision.revision_id) || [], slateById),
        revisionId: revision.revision_id,
        revisionNumber: revision.revision_number,
        savedAt: revision.saved_at,
        source: revision.source,
      }));
    const revisionSubject = subjectIdByEntryId.get(entry.id);
    const evidenceUserId = revisionSubject ? subjectsById.get(revisionSubject)?.user_id : null;
    const score = scoresByEntryId.get(entry.id);

    return {
      contestId: entry.contest_id,
      contestSlug: contest?.slug || entry.contest_id,
      contestStatus: contest?.status || 'unknown',
      contestTitle: contest?.title || 'Contest unavailable',
      createdAt: entry.created_at,
      currentBoard: buildBoardItems(lineupsByEntryId.get(entry.id) || [], slateById),
      entryId: entry.id,
      entryStatus: entry.status,
      revisions,
      score: score
        ? {
            exactPicks: score.exact_picks,
            finalRank: score.final_rank,
            finalRankDisplay: score.final_rank_display,
            oneOffOrBetterPicks: score.one_off_or_better_picks,
            scoringVersion: score.scoring_version,
            totalScore: score.total_score,
          }
        : null,
      updatedAt: entry.updated_at,
      userId: evidenceUserId || entry.user_id,
    };
  });
}

function buildBoardItems(
  rows: Array<LineupRow | RevisionItemRow>,
  slateById: Map<string, SlateRow>,
) {
  return rows
    .map((row) => ({
      playerName: slateById.get(row.slate_player_id)?.display_name
        || slateById.get(row.slate_player_id)?.player_name
        || 'Unknown slate player',
      rankPosition: row.rank_position,
      slatePlayerId: row.slate_player_id,
    }))
    .sort((left, right) => left.rankPosition - right.rankPosition);
}

async function loadEvidenceSnapshot(): Promise<EvidenceSnapshot> {
  if (!hasServiceRoleSupabaseConfig()) return loadFileEvidenceSnapshot();

  const supabase = createAdminClient();
  const [
    authResult,
    profilesResult,
    contestsResult,
    entriesResult,
    lineupsResult,
    slateResult,
    subjectsResult,
    revisionsResult,
    revisionItemsResult,
    scoresResult,
    auditResult,
    rulesetsResult,
    playerResultsResult,
    entryPlayerScoresResult,
    statSnapshotsResult,
    statSnapshotItemsResult,
  ] = await Promise.all([
    supabase.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    supabase.from('profiles').select('*'),
    supabase.from('contests').select('*'),
    supabase.from('entries').select('*'),
    supabase.from('entry_lineups').select('*'),
    supabase.from('contest_slate_players').select('*'),
    supabase.from('analytics_subjects').select('*'),
    supabase.from('entry_board_revisions').select('*'),
    supabase.from('entry_board_revision_items').select('*'),
    supabase.from('entry_scoring_results').select('*'),
    supabase.from('admin_audit_events').select('*'),
    supabase.from('contest_ruleset_snapshots').select('*'),
    supabase.from('contest_player_results').select('*'),
    supabase.from('entry_player_scores').select('*'),
    supabase.from('contest_stat_snapshots').select('*'),
    supabase.from('contest_stat_snapshot_rows').select('*'),
  ]);

  const failures = [
    authResult.error,
    profilesResult.error,
    contestsResult.error,
    entriesResult.error,
    lineupsResult.error,
    slateResult.error,
    subjectsResult.error,
    revisionsResult.error,
    revisionItemsResult.error,
    auditResult.error,
    rulesetsResult.error,
    scoresResult.error && !isMissingOptionalEvidenceTable(scoresResult.error) ? scoresResult.error : null,
    playerResultsResult.error && !isMissingOptionalEvidenceTable(playerResultsResult.error) ? playerResultsResult.error : null,
    entryPlayerScoresResult.error && !isMissingOptionalEvidenceTable(entryPlayerScoresResult.error) ? entryPlayerScoresResult.error : null,
    statSnapshotsResult.error && !isMissingOptionalEvidenceTable(statSnapshotsResult.error) ? statSnapshotsResult.error : null,
    statSnapshotItemsResult.error && !isMissingOptionalEvidenceTable(statSnapshotItemsResult.error)
      ? statSnapshotItemsResult.error
      : null,
  ].filter(Boolean);

  if (failures.length > 0) {
    throw new Error(`Unable to load the admin evidence workspace: ${failures[0]?.message}`);
  }

  return {
    auditEvents: auditResult.data || [],
    authUsers: authResult.data.users,
    contests: contestsResult.data || [],
    entries: entriesResult.data || [],
    lineups: lineupsResult.data || [],
    profiles: profilesResult.data || [],
    playerResults: playerResultsResult.error ? [] : playerResultsResult.data || [],
    revisionItems: revisionItemsResult.data || [],
    revisions: revisionsResult.data || [],
    rulesets: rulesetsResult.data || [],
    scores: scoresResult.error ? [] : scoresResult.data || [],
    slatePlayers: slateResult.data || [],
    statSnapshotItems: statSnapshotItemsResult.error ? [] : statSnapshotItemsResult.data || [],
    statSnapshots: statSnapshotsResult.error ? [] : statSnapshotsResult.data || [],
    subjects: subjectsResult.data || [],
    entryPlayerScores: entryPlayerScoresResult.error ? [] : entryPlayerScoresResult.data || [],
  };
}

async function loadFileEvidenceSnapshot(): Promise<EvidenceSnapshot> {
  const [contestSource, entrySource] = await Promise.all([
    readFile(path.join(process.cwd(), 'data', 'contests.json'), 'utf8'),
    readFile(path.join(process.cwd(), 'data', 'contest-entries.json'), 'utf8'),
  ]);
  const contestStore = JSON.parse(contestSource) as { contests: Array<Record<string, unknown>> };
  const entryStore = JSON.parse(entrySource) as { entries: Array<Record<string, unknown>> };
  const contests = contestStore.contests.map((contest) => toFallbackContest(contest));
  const contestIdBySlug = new Map(contests.map((contest) => [contest.slug, contest.id]));
  const slatePlayers = contestStore.contests.flatMap((contest) => toFallbackSlateRows(contest, contestIdBySlug));
  const slateIdByContestAndName = new Map(slatePlayers.map((player) => [`${player.contest_id}:${player.display_name}`, player.id]));
  const entries = entryStore.entries.map((entry) => toFallbackEntry(entry, contestIdBySlug));
  const lineups = entryStore.entries.flatMap((entry) => toFallbackLineups(entry, entries, slateIdByContestAndName));
  const userIds = [...new Set(entries.map((entry) => entry.user_id))];
  const entryByUserId = new Map(entries.map((entry) => [entry.user_id, entry]));
  const authUsers = userIds.map((userId) => ({
    id: userId,
    aud: 'authenticated',
    role: 'authenticated',
    email: `demo-${userId.slice(-4)}@pickrank.test`,
    created_at: entryByUserId.get(userId)?.created_at || new Date(0).toISOString(),
    app_metadata: {},
    user_metadata: {
      display_name: 'Demo Entrant',
      username: `demo_${userId.slice(-4)}`,
    },
  })) as User[];
  const subjects = userIds.map((userId) => ({
    created_at: entryByUserId.get(userId)?.created_at || new Date(0).toISOString(),
    pseudonymized_at: null,
    subject_id: `10000000-0000-4000-8000-${userId.replaceAll('-', '').slice(-12)}`,
    user_id: userId,
  }));
  const revisions = entries.map((entry) => ({
    board_hash: `legacy-${entry.id}`,
    contest_id: entry.contest_id,
    entry_id: entry.id,
    event_type: 'legacy_current_state',
    idempotency_key: null,
    metadata: { history_available: false },
    previous_revision_id: null,
    revision_id: `20000000-0000-4000-8000-${entry.id.replaceAll('-', '').slice(-12).padStart(12, '0')}`,
    revision_number: 1,
    saved_at: entry.updated_at,
    source: 'file_fixture',
    subject_id: subjects.find((subject) => subject.user_id === entry.user_id)?.subject_id || '',
  }));
  const revisionIdByEntryId = new Map(
    revisions.map((revision) => [revision.entry_id, revision.revision_id]),
  );
  const revisionItems = lineups.map((lineup) => ({
    rank_position: lineup.rank_position,
    revision_id: revisionIdByEntryId.get(lineup.entry_id) || '',
    slate_player_id: lineup.slate_player_id,
  }));

  return {
    auditEvents: [],
    authUsers,
    contests,
    entries,
    lineups,
    profiles: [],
    playerResults: [],
    revisionItems,
    revisions,
    rulesets: [],
    scores: [],
    slatePlayers,
    statSnapshotItems: [],
    statSnapshots: [],
    subjects,
    entryPlayerScores: [],
  };
}

function toFallbackContest(source: Record<string, unknown>): ContestRow {
  return {
    contest_type: String(source.contestType || 'public_paid'),
    created_at: String(source.createdAt),
    created_by_admin_id: null,
    description: String(source.description || ''),
    display_order: Number(source.displayOrder || 0),
    entry_count: Number(source.entryCount || 0),
    entry_fee_cents: Number(source.entryFeeCents || 0),
    entry_open_time: source.entryOpenTime ? String(source.entryOpenTime) : null,
    id: String(source.id),
    is_featured: Boolean(source.isFeatured),
    lineup_players: Array.isArray(source.lineupPlayers) ? source.lineupPlayers.map(String) : [],
    lock_time: String(source.lockTime),
    min_entries_to_run: Number(source.minEntriesToRun || 4),
    paid_entries_count: Number(source.paidEntryCount || 0),
    published_at: source.publishedAt ? String(source.publishedAt) : null,
    published_by_admin_id: null,
    season: Number(source.season || 2026),
    slate_size: Number(source.slateSize || 20),
    slug: String(source.id),
    stat_type: String(source.statType || 'qb_passing_yards'),
    status: String(source.status || 'draft'),
    title: String(source.title),
    updated_at: String(source.updatedAt),
    visibility_status: String(source.visibilityStatus || 'hidden'),
    week: Number(source.week || 0),
  };
}

function toFallbackSlateRows(source: Record<string, unknown>, contestIdBySlug: Map<string, string>): SlateRow[] {
  const contestId = contestIdBySlug.get(String(source.id)) || String(source.id);
  const players = Array.isArray(source.slatePlayers) ? source.slatePlayers as Array<Record<string, unknown>> : [];
  return players.map((player, index) => ({
    active_status: player.activeStatus ? String(player.activeStatus) : null,
    contest_id: contestId,
    created_at: String(source.createdAt),
    display_name: String(player.displayName),
    display_order: index + 1,
    game_start_time: player.gameStartTime ? String(player.gameStartTime) : null,
    home_away: player.homeAway ? String(player.homeAway) : null,
    id: `${contestId}-slate-${index + 1}`,
    opponent_abbreviation: String(player.opponentAbbreviation || ''),
    opponent_context: player.homeAway === 'away' ? '@' : 'vs',
    player_external_id: String(player.playerId || ''),
    player_id: String(player.playerId || ''),
    player_name: String(player.displayName),
    position: String(player.position || 'QB'),
    provider_game_id: String(player.providerGameId || ''),
    provider_player_id: String(player.providerPlayerId || ''),
    sort_order_internal: Number(player.sortOrderInternal || index + 1),
    team_abbreviation: String(player.teamAbbreviation || ''),
  }));
}

function toFallbackEntry(source: Record<string, unknown>, contestIdBySlug: Map<string, string>): EntryRow {
  return {
    contest_id: contestIdBySlug.get(String(source.contestId)) || String(source.contestId),
    created_at: String(source.createdAt),
    id: String(source.entryId),
    status: 'created',
    updated_at: String(source.updatedAt),
    user_id: String(source.userId),
  };
}

function toFallbackLineups(
  source: Record<string, unknown>,
  entries: EntryRow[],
  slateIdByContestAndName: Map<string, string>,
): LineupRow[] {
  const entry = entries.find((candidate) => candidate.id === String(source.entryId));
  const order = Array.isArray(source.lineupOrder) ? source.lineupOrder.map(String) : [];
  if (!entry) return [];
  return order.map((playerName, index) => ({
    created_at: String(source.createdAt),
    entry_id: entry.id,
    id: `${entry.id}-lineup-${index + 1}`,
    rank_position: index + 1,
    slate_player_id: slateIdByContestAndName.get(`${entry.contest_id}:${playerName}`) || `${entry.contest_id}-unknown-${index + 1}`,
    updated_at: String(source.updatedAt),
  }));
}

function groupBy<T>(values: T[], key: (value: T) => string) {
  const grouped = new Map<string, T[]>();
  for (const value of values) {
    const groupKey = key(value);
    const group = grouped.get(groupKey);
    if (group) group.push(value);
    else grouped.set(groupKey, [value]);
  }
  return grouped;
}
