-- Add a separate provisional snapshot store for private provisional ordering so provider-backed
-- mid-game stats do not share storage semantics with official finalization.

create table if not exists public.contest_provisional_stat_snapshots (
  snapshot_id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  provider_key text not null,
  provider_name text not null,
  provider_snapshot_time timestamptz not null,
  created_at timestamptz not null default now(),
  status text not null default 'validated',
  games_total integer not null default 0,
  games_scheduled integer not null default 0,
  games_in_progress integer not null default 0,
  games_final integer not null default 0,
  all_games_final boolean not null default false,
  metadata jsonb,
  check (status in ('fetched', 'validated', 'failed'))
);

create table if not exists public.contest_provisional_stat_snapshot_rows (
  snapshot_id uuid not null references public.contest_provisional_stat_snapshots(snapshot_id) on delete cascade,
  player_id text not null,
  provider_player_id text not null,
  provider_game_id text not null,
  player_name text not null,
  team_abbreviation text not null,
  opponent_abbreviation text not null,
  home_away text not null,
  passing_yards integer not null,
  passing_touchdowns integer not null default 0,
  game_status text not null,
  provisional_rank integer not null,
  provisional_rank_min integer not null,
  provisional_rank_max integer not null,
  provisional_rank_display text not null,
  sort_order integer not null,
  primary key (snapshot_id, player_id),
  check (home_away in ('home', 'away')),
  check (game_status in ('scheduled', 'in_progress', 'final'))
);

create index if not exists contest_provisional_stat_snapshots_contest_status_idx
  on public.contest_provisional_stat_snapshots (contest_id, status, provider_snapshot_time desc, created_at desc);

create index if not exists contest_provisional_stat_snapshot_rows_snapshot_idx
  on public.contest_provisional_stat_snapshot_rows (snapshot_id, sort_order);
