import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildAdminEvidencePackage,
  getAdminContestEvidence,
  getAdminEvidenceOverview,
  listAdminEvidenceUsers,
} from '@/lib/admin-evidence';

const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0017_admin_evidence_foundation.sql');

describe('admin empirical evidence foundation', () => {
  it('defines append-only board revisions, atomic saves, lock snapshots, and admin audit records', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('create table if not exists public.entry_board_revisions');
    expect(sql).toContain('create table if not exists public.entry_board_revision_items');
    expect(sql).toContain('create table if not exists public.admin_audit_events');
    expect(sql).toContain('create trigger entry_board_revisions_immutable');
    expect(sql).toContain('create or replace function public.save_entry_board_revision');
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

  it('omits direct identity from the default evidence package', async () => {
    const evidencePackage = await buildAdminEvidencePackage({ identified: false });
    const serialized = JSON.stringify(evidencePackage.datasets.users);

    expect(evidencePackage.manifest.identified).toBe(false);
    expect(serialized).not.toContain('@pickrank.test');
    expect(evidencePackage.datasets.entries[0]).not.toHaveProperty('user_id');
    expect(evidencePackage.datasets.entries[0]).toHaveProperty('subject_id');
  });
});
