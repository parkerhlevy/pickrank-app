-- Add the narrow scoring/results persistence layer for finalized contest standings.
-- This keeps contest entry and lineup storage unchanged while adding server-backed
-- final player results, per-entry leaderboard results, and player-by-player scoring.

create table if not exists public.contest_player_results (
  contest_id uuid not null references public.contests(id) on delete cascade,
  player_id text not null,
  provider_player_id text not null,
  player_name text not null,
  team_abbreviation text not null,
  final_stat integer not null,
  passing_touchdowns integer not null default 0,
  actual_rank integer not null,
  actual_rank_display text not null,
  actual_rank_min integer not null,
  actual_rank_max integer not null,
  game_id text not null,
  game_status text not null default 'final',
  stat_finalized_at timestamptz not null default now(),
  primary key (contest_id, player_id)
);

create table if not exists public.entry_scoring_results (
  entry_id uuid primary key references public.entries(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_score integer not null,
  exact_picks integer not null default 0,
  one_off_or_better_picks integer not null default 0,
  actual_qb1_distance integer,
  selected_qb1_passing_touchdowns integer,
  selected_qb2_passing_touchdowns integer,
  selected_qb3_passing_touchdowns integer,
  selected_qb4_passing_touchdowns integer,
  selected_qb5_passing_touchdowns integer,
  final_rank integer not null,
  final_rank_display text not null,
  is_tied boolean not null default false,
  tie_group_id text,
  tie_group_size integer not null default 1,
  payout_amount integer not null default 0,
  payout_status text not null default 'pending',
  scoring_version text not null,
  created_at timestamptz not null default now(),
  score_finalized_at timestamptz not null default now()
);

create table if not exists public.entry_player_scores (
  entry_player_score_id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  contest_id uuid not null references public.contests(id) on delete cascade,
  player_id text not null,
  player_name text not null,
  user_rank integer not null,
  actual_rank_min integer not null,
  actual_rank_max integer not null,
  actual_rank_display text not null,
  distance integer not null,
  points_awarded integer not null,
  created_at timestamptz not null default now()
);

create unique index if not exists contest_player_results_contest_rank_idx
  on public.contest_player_results (contest_id, actual_rank_min, actual_rank_max, player_id);

create index if not exists entry_scoring_results_contest_rank_idx
  on public.entry_scoring_results (contest_id, final_rank, entry_id);

create index if not exists entry_player_scores_entry_rank_idx
  on public.entry_player_scores (entry_id, user_rank);
