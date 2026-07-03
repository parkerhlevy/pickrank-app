-- Add persisted stat snapshot storage so admin finalization can prefill from
-- the latest validated snapshot without coupling the UI to a live provider call.

create table if not exists public.contest_stat_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  provider_name text not null,
  provider_snapshot_time timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'validated',
  metadata jsonb,
  check (status in ('fetched', 'validated', 'failed'))
);

create table if not exists public.contest_stat_snapshot_rows (
  snapshot_id uuid not null references public.contest_stat_snapshots(snapshot_id) on delete cascade,
  provider_player_id text not null,
  provider_game_id text not null,
  player_name text,
  final_stat integer not null,
  passing_touchdowns integer not null default 0,
  game_status text not null default 'final',
  primary key (snapshot_id, provider_player_id, provider_game_id),
  check (game_status in ('scheduled', 'in_progress', 'final'))
);

create index if not exists contest_stat_snapshots_contest_status_idx
  on public.contest_stat_snapshots (contest_id, status, provider_snapshot_time desc, created_at desc);

create index if not exists contest_stat_snapshot_rows_snapshot_idx
  on public.contest_stat_snapshot_rows (snapshot_id);
