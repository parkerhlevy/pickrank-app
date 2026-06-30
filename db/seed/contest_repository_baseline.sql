-- Baseline contest repository seed for the current PickRank contest schema.
-- Run this only after applying migrations 0001 through 0005.
-- Recommended order:
-- 1. db/migrations/0001_phase_0_foundation.sql
-- 2. db/migrations/0002_internal_operator_contest_ops.sql
-- 3. db/migrations/0003_contest_slate_player_admin_fields.sql
-- 4. db/migrations/0004_pending_operator_role_assignments.sql
-- 5. db/migrations/0005_contest_repository_backing_fields.sql
-- 6. db/seed/assign_first_contest_operator.sql
-- 7. this file

with operator_user as (
  select id
  from auth.users
  where lower(email) = 'parkerhlevy@gmail.com'
  limit 1
),
seed_contests as (
  insert into public.contests (
    slug,
    title,
    description,
    season,
    week,
    contest_type,
    stat_type,
    slate_size,
    entry_fee_cents,
    entry_count,
    paid_entries_count,
    min_entries_to_run,
    status,
    visibility_status,
    is_featured,
    display_order,
    entry_open_time,
    lock_time,
    lineup_players,
    created_by_admin_id,
    published_by_admin_id,
    published_at
  )
  values
    (
      'week-1-qb-passing-yards',
      'Week 1 QB Passing Yards',
      'Pick and rank your top 10 quarterbacks by passing yards.',
      2026,
      1,
      'public_paid',
      'qb_passing_yards',
      15,
      500,
      600,
      600,
      4,
      'open',
      'visible',
      true,
      0,
      '2026-09-01T12:00:00Z',
      '2026-09-04T00:15:00Z',
      array[
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
      ],
      (select id from operator_user),
      (select id from operator_user),
      '2026-08-28T12:00:00Z'
    ),
    (
      'week-2-qb-passing-yards-draft',
      'Week 2 QB Passing Yards',
      'Pick and rank your top 10 quarterbacks by passing yards.',
      2026,
      2,
      'public_paid',
      'qb_passing_yards',
      15,
      500,
      0,
      0,
      4,
      'draft',
      'hidden',
      false,
      1,
      '2026-09-10T12:00:00Z',
      '2026-09-11T00:15:00Z',
      array[
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
      ],
      (select id from operator_user),
      null,
      null
    )
  on conflict (slug) do update
  set
    title = excluded.title,
    description = excluded.description,
    season = excluded.season,
    week = excluded.week,
    contest_type = excluded.contest_type,
    stat_type = excluded.stat_type,
    slate_size = excluded.slate_size,
    entry_fee_cents = excluded.entry_fee_cents,
    entry_count = excluded.entry_count,
    paid_entries_count = excluded.paid_entries_count,
    min_entries_to_run = excluded.min_entries_to_run,
    status = excluded.status,
    visibility_status = excluded.visibility_status,
    is_featured = excluded.is_featured,
    display_order = excluded.display_order,
    entry_open_time = excluded.entry_open_time,
    lock_time = excluded.lock_time,
    lineup_players = excluded.lineup_players,
    created_by_admin_id = excluded.created_by_admin_id,
    published_by_admin_id = excluded.published_by_admin_id,
    published_at = excluded.published_at,
    updated_at = now()
  returning id, slug
),
seed_ids as (
  select id, slug
  from seed_contests
)
delete from public.contest_slate_players
where contest_id in (select id from seed_ids);

delete from public.contest_validation_results
where contest_id in (
  select id
  from public.contests
  where slug in ('week-1-qb-passing-yards', 'week-2-qb-passing-yards-draft')
);

delete from public.contest_state_events
where contest_id in (
  select id
  from public.contests
  where slug in ('week-1-qb-passing-yards', 'week-2-qb-passing-yards-draft')
);

with public_contest as (
  select id
  from public.contests
  where slug = 'week-1-qb-passing-yards'
),
draft_contest as (
  select id
  from public.contests
  where slug = 'week-2-qb-passing-yards-draft'
)
insert into public.contest_slate_players (
  contest_id,
  player_external_id,
  player_id,
  provider_player_id,
  provider_game_id,
  player_name,
  display_name,
  team_abbreviation,
  opponent_abbreviation,
  opponent_context,
  home_away,
  display_order,
  sort_order_internal,
  game_start_time,
  position,
  active_status
)
select
  contest_id,
  player_id,
  player_id,
  provider_player_id,
  provider_game_id,
  display_name,
  display_name,
  team_abbreviation,
  opponent_abbreviation,
  case when home_away = 'home' then 'vs' else '@' end,
  home_away,
  sort_order_internal,
  sort_order_internal,
  cast(game_start_time as timestamptz),
  'QB',
  active_status
from (
  values
    ((select id from public_contest), 'qb-josh-allen', 'provider-qb-josh-allen', 'buf-bal-2026-wk1', 'Josh Allen', 'BUF', 'BAL', 'home', 1, '2026-09-04T00:20:00Z', 'active'),
    ((select id from public_contest), 'qb-joe-burrow', 'provider-qb-joe-burrow', 'cin-cle-2026-wk1', 'Joe Burrow', 'CIN', 'CLE', 'home', 2, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-derek-carr', 'provider-qb-derek-carr', 'no-atl-2026-wk1', 'Derek Carr', 'NO', 'ATL', 'home', 3, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-kirk-cousins', 'provider-qb-kirk-cousins', 'atl-no-2026-wk1', 'Kirk Cousins', 'ATL', 'NO', 'away', 4, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-justin-herbert', 'provider-qb-justin-herbert', 'lac-lv-2026-wk1', 'Justin Herbert', 'LAC', 'LV', 'home', 5, '2026-09-07T20:25:00Z', 'active'),
    ((select id from public_contest), 'qb-jalen-hurts', 'provider-qb-jalen-hurts', 'phi-dal-2026-wk1', 'Jalen Hurts', 'PHI', 'DAL', 'home', 6, '2026-09-07T20:25:00Z', 'active'),
    ((select id from public_contest), 'qb-lamar-jackson', 'provider-qb-lamar-jackson', 'bal-buf-2026-wk1', 'Lamar Jackson', 'BAL', 'BUF', 'away', 7, '2026-09-04T00:20:00Z', 'active'),
    ((select id from public_contest), 'qb-jordan-love', 'provider-qb-jordan-love', 'gb-min-2026-wk1', 'Jordan Love', 'GB', 'MIN', 'home', 8, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-dak-prescott', 'provider-qb-dak-prescott', 'dal-phi-2026-wk1', 'Dak Prescott', 'DAL', 'PHI', 'away', 9, '2026-09-07T20:25:00Z', 'active'),
    ((select id from public_contest), 'qb-brock-purdy', 'provider-qb-brock-purdy', 'sf-sea-2026-wk1', 'Brock Purdy', 'SF', 'SEA', 'home', 10, '2026-09-07T20:05:00Z', 'active'),
    ((select id from public_contest), 'qb-cj-stroud', 'provider-qb-cj-stroud', 'hou-ind-2026-wk1', 'C.J. Stroud', 'HOU', 'IND', 'home', 11, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-patrick-mahomes', 'provider-qb-patrick-mahomes', 'kc-den-2026-wk1', 'Patrick Mahomes', 'KC', 'DEN', 'home', 12, '2026-09-08T00:20:00Z', 'active'),
    ((select id from public_contest), 'qb-jared-goff', 'provider-qb-jared-goff', 'det-chi-2026-wk1', 'Jared Goff', 'DET', 'CHI', 'home', 13, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-tua-tagovailoa', 'provider-qb-tua-tagovailoa', 'mia-nyj-2026-wk1', 'Tua Tagovailoa', 'MIA', 'NYJ', 'home', 14, '2026-09-07T17:00:00Z', 'active'),
    ((select id from public_contest), 'qb-matthew-stafford', 'provider-qb-matthew-stafford', 'lar-ari-2026-wk1', 'Matthew Stafford', 'LAR', 'ARI', 'home', 15, '2026-09-07T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-josh-allen', 'provider-qb-josh-allen', 'buf-bal-2026-wk2', 'Josh Allen', 'BUF', 'BAL', 'home', 1, '2026-09-11T00:20:00Z', 'active'),
    ((select id from draft_contest), 'qb-joe-burrow', 'provider-qb-joe-burrow', 'cin-cle-2026-wk2', 'Joe Burrow', 'CIN', 'CLE', 'away', 2, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-derek-carr', 'provider-qb-derek-carr', 'no-atl-2026-wk2', 'Derek Carr', 'NO', 'ATL', 'home', 3, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-kirk-cousins', 'provider-qb-kirk-cousins', 'atl-no-2026-wk2', 'Kirk Cousins', 'ATL', 'NO', 'away', 4, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-justin-herbert', 'provider-qb-justin-herbert', 'lac-lv-2026-wk2', 'Justin Herbert', 'LAC', 'LV', 'home', 5, '2026-09-11T23:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-jalen-hurts', 'provider-qb-jalen-hurts', 'phi-dal-2026-wk2', 'Jalen Hurts', 'PHI', 'DAL', 'home', 6, '2026-09-11T23:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-lamar-jackson', 'provider-qb-lamar-jackson', 'bal-buf-2026-wk2', 'Lamar Jackson', 'BAL', 'BUF', 'away', 7, '2026-09-11T00:20:00Z', 'active'),
    ((select id from draft_contest), 'qb-jordan-love', 'provider-qb-jordan-love', 'gb-min-2026-wk2', 'Jordan Love', 'GB', 'MIN', 'home', 8, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-dak-prescott', 'provider-qb-dak-prescott', 'dal-phi-2026-wk2', 'Dak Prescott', 'DAL', 'PHI', 'away', 9, '2026-09-11T23:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-brock-purdy', 'provider-qb-brock-purdy', 'sf-sea-2026-wk2', 'Brock Purdy', 'SF', 'SEA', 'home', 10, '2026-09-11T23:05:00Z', 'active'),
    ((select id from draft_contest), 'qb-cj-stroud', 'provider-qb-cj-stroud', 'hou-ind-2026-wk2', 'C.J. Stroud', 'HOU', 'IND', 'home', 11, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-patrick-mahomes', 'provider-qb-patrick-mahomes', 'kc-den-2026-wk2', 'Patrick Mahomes', 'KC', 'DEN', 'home', 12, '2026-09-12T00:20:00Z', 'active'),
    ((select id from draft_contest), 'qb-jared-goff', 'provider-qb-jared-goff', 'det-chi-2026-wk2', 'Jared Goff', 'DET', 'CHI', 'home', 13, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-tua-tagovailoa', 'provider-qb-tua-tagovailoa', 'mia-nyj-2026-wk2', 'Tua Tagovailoa', 'MIA', 'NYJ', 'away', 14, '2026-09-11T20:25:00Z', 'active'),
    ((select id from draft_contest), 'qb-matthew-stafford', 'provider-qb-matthew-stafford', 'lar-ari-2026-wk2', 'Matthew Stafford', 'LAR', 'ARI', 'home', 15, '2026-09-11T23:25:00Z', 'active')
) as seed_rows (
  contest_id,
  player_id,
  provider_player_id,
  provider_game_id,
  display_name,
  team_abbreviation,
  opponent_abbreviation,
  home_away,
  sort_order_internal,
  game_start_time,
  active_status
);

insert into public.contest_validation_results (
  contest_id,
  status,
  errors,
  warnings,
  validated_at,
  validated_by_admin_id
)
select
  contests.id,
  case when contests.slug = 'week-1-qb-passing-yards' then 'passed' else 'not_run' end,
  case when contests.slug = 'week-1-qb-passing-yards' then '{}'::text[] else '{}'::text[] end,
  case
    when contests.slug = 'week-1-qb-passing-yards'
      then array['The public lineup shell still uses a temporary 10-player subset until the full 15-to-10 selection flow lands.']
    else '{}'::text[]
  end,
  case when contests.slug = 'week-1-qb-passing-yards' then '2026-08-28T12:00:00Z'::timestamptz else now() end,
  (select id from auth.users where lower(email) = 'parkerhlevy@gmail.com' limit 1)
from public.contests contests
where contests.slug in ('week-1-qb-passing-yards', 'week-2-qb-passing-yards-draft')
on conflict (contest_id) do update
set
  status = excluded.status,
  errors = excluded.errors,
  warnings = excluded.warnings,
  validated_at = excluded.validated_at,
  validated_by_admin_id = excluded.validated_by_admin_id;

insert into public.contest_state_events (
  contest_id,
  from_status,
  to_status,
  trigger,
  created_at,
  metadata
)
select
  contests.id,
  'draft',
  'open',
  'admin',
  '2026-08-28T12:00:00Z'::timestamptz,
  jsonb_build_object('source', 'contest_repository_baseline_seed')
from public.contests contests
where contests.slug = 'week-1-qb-passing-yards';
