-- Bring contest slate players closer to the MVP backend contest model.
-- This remains narrow: enough structure for admin setup, validation, and future DB-backed reads.

alter table public.contest_slate_players
  add column if not exists player_id text,
  add column if not exists provider_player_id text,
  add column if not exists provider_game_id text,
  add column if not exists display_name text,
  add column if not exists home_away text check (home_away in ('home', 'away')),
  add column if not exists game_start_time timestamptz,
  add column if not exists position text,
  add column if not exists sort_order_internal integer,
  add column if not exists active_status text;

update public.contest_slate_players
set
  player_id = coalesce(player_id, player_external_id, player_name),
  provider_player_id = coalesce(provider_player_id, player_external_id),
  display_name = coalesce(display_name, player_name),
  home_away = coalesce(
    home_away,
    case
      when opponent_context = 'vs' then 'home'
      when opponent_context = '@' then 'away'
      else null
    end
  ),
  sort_order_internal = coalesce(sort_order_internal, display_order),
  position = coalesce(position, 'QB')
where
  player_id is null
  or provider_player_id is null
  or display_name is null
  or home_away is null
  or sort_order_internal is null
  or position is null;

create unique index if not exists contest_slate_players_contest_provider_player_idx
  on public.contest_slate_players (contest_id, provider_player_id)
  where provider_player_id is not null;

create unique index if not exists contest_slate_players_contest_sort_order_internal_idx
  on public.contest_slate_players (contest_id, sort_order_internal)
  where sort_order_internal is not null;
