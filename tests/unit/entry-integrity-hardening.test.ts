import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const migrationPath = path.join(process.cwd(), 'db', 'migrations', '0010_entry_integrity_hardening.sql');

describe('entry integrity hardening migration', () => {
  it('removes direct user entry lifecycle mutations', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('drop policy if exists "users can create their own open contest entries"');
    expect(sql).toContain('drop policy if exists "users can update their own open contest entries"');
    expect(sql).toContain('drop policy if exists "users can delete their own open contest entries"');
    expect(sql).not.toContain('create policy "users can create their own open contest entries"');
    expect(sql).not.toContain('create policy "users can update their own open contest entries"');
    expect(sql).not.toContain('create policy "users can delete their own open contest entries"');
  });

  it('requires lineup players to belong to the entry contest', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('public.contest_slate_players.contest_id = public.entries.contest_id');
    expect(sql).toContain('public.is_viewer_lineup_player_for_open_contest(entry_id, slate_player_id)');
  });

  it('provides an authenticated atomic RPC for zero-fee entries only', async () => {
    const sql = await readFile(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.confirm_free_contest_entry');
    expect(sql).toContain('and entry_fee_cents = 0');
    expect(sql).toContain('auth.users.email_confirmed_at is not null');
    expect(sql).toContain("auth.users.raw_user_meta_data ->> 'username'");
    expect(sql).toContain("auth.users.raw_user_meta_data ->> 'display_name'");
    expect(sql).toContain('grant execute on function public.confirm_free_contest_entry(uuid, uuid[]) to authenticated');
    expect(sql).not.toContain('paid_entries_count = paid_entries_count + 1');
  });
});
