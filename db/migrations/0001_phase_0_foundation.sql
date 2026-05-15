-- Phase 0 foundation schema for PickRank.
-- This is intentionally limited to contest/entry/lineup foundations.
-- Wallet, payments, scoring, sports data, and results are out of scope for Phase 0.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contests (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  stat_type text not null default 'qb_passing_yards',
  slate_size integer not null default 15,
  entry_fee_cents integer not null default 0,
  lock_time timestamptz not null,
  status text not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contest_slate_players (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  player_external_id text,
  player_name text not null,
  team_abbreviation text not null,
  opponent_abbreviation text not null,
  opponent_context text not null check (opponent_context in ('vs', '@')),
  display_order integer not null,
  created_at timestamptz not null default now(),
  unique (contest_id, display_order),
  unique (contest_id, player_name)
);

create table if not exists public.entries (
  id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, contest_id)
);

create table if not exists public.entry_lineups (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.entries(id) on delete cascade,
  slate_player_id uuid not null references public.contest_slate_players(id) on delete cascade,
  rank_position integer not null check (rank_position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entry_id, rank_position),
  unique (entry_id, slate_player_id)
);
