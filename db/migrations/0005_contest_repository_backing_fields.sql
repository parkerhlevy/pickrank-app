-- Add the narrow contest fields needed to replace the file-backed repository.
-- This keeps the current operator workflow and public browse shell stable while
-- moving persistence onto Postgres.

alter table public.contests
  add column if not exists slug text,
  add column if not exists description text not null default 'Pick and rank your top 10 quarterbacks by passing yards.',
  add column if not exists season integer not null default 2026,
  add column if not exists contest_type text not null default 'public_paid',
  add column if not exists entry_count integer not null default 0,
  add column if not exists display_order integer,
  add column if not exists lineup_players text[] not null default array[]::text[];

update public.contests
set slug = trim(both '-' from regexp_replace(lower(title || '-' || left(id::text, 8)), '[^a-z0-9]+', '-', 'g'))
where slug is null or slug = '';

update public.contests
set lineup_players = array[
  'Josh Allen',
  'Joe Burrow',
  'Derek Carr',
  'Kirk Cousins',
  'Justin Herbert',
  'Jalen Hurts',
  'Lamar Jackson',
  'Jordan Love',
  'Dak Prescott',
  'Brock Purdy'
]
where coalesce(array_length(lineup_players, 1), 0) = 0;

alter table public.contests
  alter column slug set not null;

create unique index if not exists contests_slug_idx
  on public.contests (slug);

create unique index if not exists contest_validation_results_contest_id_idx
  on public.contest_validation_results (contest_id);
