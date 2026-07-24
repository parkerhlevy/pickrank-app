import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0009_rls_hardening.sql');
const profileReadHardeningMigrationPath = path.join(
  process.cwd(),
  'db',
  'migrations',
  '0011_final_results_profile_read_hardening.sql',
);
const eligibilityFoundationMigrationPath = path.join(
  process.cwd(),
  'db',
  'migrations',
  '0013_eligibility_foundation.sql',
);
const contestResultsPath = path.join(process.cwd(), 'lib', 'contest-results.ts');

describe('Supabase RLS hardening migration', () => {
  it('enables RLS on exposed public tables', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('alter table if exists public.contests enable row level security;');
    expect(sql).toContain('alter table if exists public.contest_slate_players enable row level security;');
    expect(sql).toContain('alter table if exists public.entries enable row level security;');
    expect(sql).toContain('alter table if exists public.entry_lineups enable row level security;');
    expect(sql).toContain('alter table if exists public.contest_player_results enable row level security;');
    expect(sql).toContain('alter table if exists public.entry_scoring_results enable row level security;');
    expect(sql).toContain('alter table if exists public.entry_player_scores enable row level security;');
    expect(sql).toContain('alter table if exists public.contest_provisional_stat_snapshots enable row level security;');
  });

  it('defines public, user, and operator policies for the affected flows', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('create policy "public can read visible contests"');
    expect(sql).toContain('create policy "users can create their own open contest entries"');
    expect(sql).toContain('create policy "users can read their own final entry player scores"');
    expect(sql).toContain('create policy "contest operators manage contest scoring results"');
    expect(sql).toContain('create policy "contest operators manage provisional stat snapshots"');
    expect(sql).toContain('create or replace function public.is_contest_operator()');
  });

  it('replaces broad profile exposure with a final-results-only profile policy', async () => {
    const sql = await readFile(profileReadHardeningMigrationPath, 'utf8');

    expect(sql).toContain('drop policy if exists "public can read leaderboard profiles" on public.profiles;');
    expect(sql).toContain("to_regclass('public.entry_scoring_results') is not null");
    expect(sql).toContain("to_regprocedure('public.is_contest_operator()') is not null");
    expect(sql).toContain('create policy "public can read final results profiles"');
    expect(sql).toContain('create policy "contest operators can read profiles for finalization"');
    expect(sql).toContain("entry_scoring_results.user_id = profiles.id");
    expect(sql).toContain("contests.visibility_status = 'visible'");
    expect(sql).toContain("contests.status in ('final', 'paid_out')");
    expect(sql).toContain('using (public.is_contest_operator())');
    expect(sql).not.toContain('using (true)');
  });

  it('keeps final-results profile queries limited to public display columns', async () => {
    const source = await readFile(contestResultsPath, 'utf8');

    expect(source).toContain("const publicProfileDisplayColumns = 'id, username, display_name';");
    expect(source).not.toContain("from('profiles').select('*')");
  });

  it('adds eligibility storage hooks without opening public write access', async () => {
    const sql = await readFile(eligibilityFoundationMigrationPath, 'utf8');

    expect(sql).toContain('add column if not exists age_confirmed boolean not null default false');
    expect(sql).toContain('add column if not exists jurisdiction text');
    expect(sql).toContain('create table if not exists public.jurisdiction_rules');
    expect(sql).toContain('create table if not exists public.responsible_play_statuses');
    expect(sql).toContain('create table if not exists public.compliance_eligibility_events');
    expect(sql).toContain('alter table if exists public.compliance_eligibility_events enable row level security;');
    expect(sql).toContain('create policy "users can read own eligibility events"');
    expect(sql).not.toContain('for insert');
    expect(sql).not.toContain('for delete');
  });
});
