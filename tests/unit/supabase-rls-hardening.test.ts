import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0009_rls_hardening.sql');

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
});
