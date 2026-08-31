import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildAdminEvidencePackage,
  getAdminContestEvidence,
  getAdminEvidenceOverview,
  isMissingOptionalEvidenceTable,
  listAdminEvidenceUsers,
} from '@/lib/admin-evidence';

const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0017_admin_evidence_foundation.sql');
const freshnessComponentPath = path.join(process.cwd(), 'components', 'admin', 'admin-data-freshness.tsx');
const freshnessPagePaths = [
  'app/admin/page.tsx',
  'app/admin/contests/page.tsx',
  'app/admin/contests/[contestId]/page.tsx',
  'app/admin/eligibility/page.tsx',
  'app/admin/evidence/page.tsx',
  'app/admin/users/page.tsx',
  'app/admin/users/[userId]/page.tsx',
];

describe('admin empirical evidence foundation', () => {
  it('treats missing optional scoring tables as empty without masking other database errors', () => {
    expect(isMissingOptionalEvidenceTable({ code: 'PGRST205', message: 'missing relation' })).toBe(true);
    expect(isMissingOptionalEvidenceTable({ message: "Could not find the table 'public.entry_scoring_results' in the schema cache" })).toBe(true);
    expect(isMissingOptionalEvidenceTable({ code: '42501', message: 'permission denied' })).toBe(false);
  });

  it('defines append-only board revisions, atomic saves, lock snapshots, and admin audit records', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.entry_board_revisions');
    expect(sql).toContain('create table if not exists public.entry_board_revision_items');
    expect(sql).toContain('create table if not exists public.admin_audit_events');
    expect(sql).toContain('create trigger entry_board_revisions_immutable');
    expect(sql).toContain('create or replace function public.save_entry_board_revision');
    expect(sql.match(/extensions\.digest\(/g)).toHaveLength(2);
    expect(sql.match(/drop policy if exists "contest operators can read/g)).toHaveLength(5);
    expect(sql).toContain('create or replace function public.lock_free_test_contest_with_evidence');
    expect(sql).toContain("'legacy_current_state'");
    expect(sql).toContain("'history_available', false");
  });

  it('removes direct user lineup writes after routing saves through the evidence RPC', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('drop policy if exists "users can create their own open contest entry lineups"');
    expect(sql).toContain('drop policy if exists "users can update their own open contest entry lineups"');
    expect(sql).toContain('drop policy if exists "users can delete their own open contest entry lineups"');
    expect(sql).toContain('grant execute on function public.save_entry_board_revision(uuid, uuid[], uuid) to authenticated');
  });

  it('builds both user-first and contest-first file-backed investigation views', async () => {
    const allUsers = await listAdminEvidenceUsers();
    const users = await listAdminEvidenceUsers('demo');
    const overview = await getAdminEvidenceOverview();
    const contest = await getAdminContestEvidence('week-1-qb-passing-yards');

    expect(allUsers).toHaveLength(1);
    expect(users).toHaveLength(1);
    expect(users[0]?.entries).toHaveLength(1);
    expect(users[0]?.entries[0]?.revisions[0]?.eventType).toBe('legacy_current_state');
    expect(overview.entryCount).toBeGreaterThan(0);
    expect(overview.missingRevisionCount).toBe(0);
    expect(contest?.entries).toHaveLength(1);
    expect(contest?.entries[0]?.currentBoard).toHaveLength(10);
  });

  it('shows request-time freshness and a router refresh control on every admin workspace page', async () => {
    const freshnessComponent = await readFile(freshnessComponentPath, 'utf8');

    expect(freshnessComponent).toContain('Data loaded');
    expect(freshnessComponent).toContain('router.refresh()');
    expect(freshnessComponent).toContain("isRefreshing ? 'Refreshing data' : 'Refresh data'");

    for (const pagePath of freshnessPagePaths) {
      const pageSource = await readFile(path.join(process.cwd(), pagePath), 'utf8');
      expect(pageSource).toContain('<AdminDataFreshness loadedAt={loadedAt} />');
    }
  });

  it('omits direct identity from the default evidence package', async () => {
    const evidencePackage = await buildAdminEvidencePackage({ identified: false });
    const serialized = JSON.stringify(evidencePackage.datasets.users);

    expect(evidencePackage.manifest.identified).toBe(false);
    expect(serialized).not.toContain('@pickrank.test');
    expect(evidencePackage.datasets.entries[0]).not.toHaveProperty('user_id');
    expect(evidencePackage.datasets.entries[0]).toHaveProperty('subject_id');
  });
});
