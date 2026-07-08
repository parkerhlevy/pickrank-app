-- Lock down the public schema tables that the browser anon key should not
-- be able to read or mutate freely.

create or replace function public.is_contest_operator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    join public.roles on public.roles.id = public.user_roles.role_id
    where public.user_roles.user_id = auth.uid()
      and public.roles.slug = 'contest_operator'
  );
$$;

create or replace function public.is_visible_contest(contest_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests
    where id = contest_uuid
      and visibility_status = 'visible'
  );
$$;

create or replace function public.is_open_visible_contest(contest_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests
    where id = contest_uuid
      and visibility_status = 'visible'
      and status = 'open'
  );
$$;

create or replace function public.is_final_visible_contest(contest_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.contests
    where id = contest_uuid
      and visibility_status = 'visible'
      and status in ('final', 'paid_out')
  );
$$;

create or replace function public.is_viewer_entry(entry_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entries
    where id = entry_uuid
      and user_id = auth.uid()
  );
$$;

create or replace function public.is_viewer_entry_for_open_contest(entry_uuid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.entries
    join public.contests on public.contests.id = public.entries.contest_id
    where public.entries.id = entry_uuid
      and public.entries.user_id = auth.uid()
      and public.contests.visibility_status = 'visible'
      and public.contests.status = 'open'
  );
$$;

grant execute on function public.is_contest_operator() to anon, authenticated;
grant execute on function public.is_visible_contest(uuid) to anon, authenticated;
grant execute on function public.is_open_visible_contest(uuid) to anon, authenticated;
grant execute on function public.is_final_visible_contest(uuid) to anon, authenticated;
grant execute on function public.is_viewer_entry(uuid) to anon, authenticated;
grant execute on function public.is_viewer_entry_for_open_contest(uuid) to anon, authenticated;

alter table if exists public.profiles enable row level security;
alter table if exists public.contests enable row level security;
alter table if exists public.contest_slate_players enable row level security;
alter table if exists public.entries enable row level security;
alter table if exists public.entry_lineups enable row level security;
alter table if exists public.contest_validation_results enable row level security;
alter table if exists public.contest_state_events enable row level security;
alter table if exists public.contest_player_results enable row level security;
alter table if exists public.entry_scoring_results enable row level security;
alter table if exists public.entry_player_scores enable row level security;
alter table if exists public.contest_stat_snapshots enable row level security;
alter table if exists public.contest_stat_snapshot_rows enable row level security;
alter table if exists public.contest_provisional_stat_snapshots enable row level security;
alter table if exists public.contest_provisional_stat_snapshot_rows enable row level security;

do $$
begin
  if to_regclass('public.profiles') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'public can read leaderboard profiles'
  ) then
    create policy "public can read leaderboard profiles"
    on public.profiles
    for select
    to anon, authenticated
    using (true);
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contests') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contests'
      and policyname = 'public can read visible contests'
  ) then
    create policy "public can read visible contests"
    on public.contests
    for select
    to anon, authenticated
    using (visibility_status = 'visible');
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contests'
      and policyname = 'contest operators manage contests'
  ) then
    create policy "contest operators manage contests"
    on public.contests
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contest_slate_players') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_slate_players'
      and policyname = 'public can read visible contest slate players'
  ) then
    create policy "public can read visible contest slate players"
    on public.contest_slate_players
    for select
    to anon, authenticated
    using (public.is_visible_contest(contest_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_slate_players'
      and policyname = 'contest operators manage contest slate players'
  ) then
    create policy "contest operators manage contest slate players"
    on public.contest_slate_players
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.entries') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'users can read their own entries'
  ) then
    create policy "users can read their own entries"
    on public.entries
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'users can create their own open contest entries'
  ) then
    create policy "users can create their own open contest entries"
    on public.entries
    for insert
    to authenticated
    with check (
      auth.uid() = user_id
      and public.is_open_visible_contest(contest_id)
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'users can update their own open contest entries'
  ) then
    create policy "users can update their own open contest entries"
    on public.entries
    for update
    to authenticated
    using (
      auth.uid() = user_id
      and public.is_open_visible_contest(contest_id)
    )
    with check (
      auth.uid() = user_id
      and public.is_open_visible_contest(contest_id)
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'users can delete their own open contest entries'
  ) then
    create policy "users can delete their own open contest entries"
    on public.entries
    for delete
    to authenticated
    using (
      auth.uid() = user_id
      and public.is_open_visible_contest(contest_id)
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entries'
      and policyname = 'contest operators can read all entries'
  ) then
    create policy "contest operators can read all entries"
    on public.entries
    for select
    to authenticated
    using (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.entry_lineups') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_lineups'
      and policyname = 'users can read their own entry lineups'
  ) then
    create policy "users can read their own entry lineups"
    on public.entry_lineups
    for select
    to authenticated
    using (public.is_viewer_entry(entry_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_lineups'
      and policyname = 'users can create their own open contest entry lineups'
  ) then
    create policy "users can create their own open contest entry lineups"
    on public.entry_lineups
    for insert
    to authenticated
    with check (public.is_viewer_entry_for_open_contest(entry_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_lineups'
      and policyname = 'users can update their own open contest entry lineups'
  ) then
    create policy "users can update their own open contest entry lineups"
    on public.entry_lineups
    for update
    to authenticated
    using (public.is_viewer_entry_for_open_contest(entry_id))
    with check (public.is_viewer_entry_for_open_contest(entry_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_lineups'
      and policyname = 'users can delete their own open contest entry lineups'
  ) then
    create policy "users can delete their own open contest entry lineups"
    on public.entry_lineups
    for delete
    to authenticated
    using (public.is_viewer_entry_for_open_contest(entry_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_lineups'
      and policyname = 'contest operators can read all entry lineups'
  ) then
    create policy "contest operators can read all entry lineups"
    on public.entry_lineups
    for select
    to authenticated
    using (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contest_validation_results') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_validation_results'
      and policyname = 'contest operators manage contest validation results'
  ) then
    create policy "contest operators manage contest validation results"
    on public.contest_validation_results
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;

  if to_regclass('public.contest_state_events') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_state_events'
      and policyname = 'contest operators manage contest state events'
  ) then
    create policy "contest operators manage contest state events"
    on public.contest_state_events
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contest_player_results') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_player_results'
      and policyname = 'public can read final visible contest player results'
  ) then
    create policy "public can read final visible contest player results"
    on public.contest_player_results
    for select
    to anon, authenticated
    using (public.is_final_visible_contest(contest_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_player_results'
      and policyname = 'contest operators manage contest player results'
  ) then
    create policy "contest operators manage contest player results"
    on public.contest_player_results
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.entry_scoring_results') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_scoring_results'
      and policyname = 'public can read final visible contest scoring results'
  ) then
    create policy "public can read final visible contest scoring results"
    on public.entry_scoring_results
    for select
    to anon, authenticated
    using (public.is_final_visible_contest(contest_id));
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_scoring_results'
      and policyname = 'contest operators manage contest scoring results'
  ) then
    create policy "contest operators manage contest scoring results"
    on public.entry_scoring_results
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.entry_player_scores') is null then
    return;
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_player_scores'
      and policyname = 'users can read their own final entry player scores'
  ) then
    create policy "users can read their own final entry player scores"
    on public.entry_player_scores
    for select
    to authenticated
    using (
      public.is_viewer_entry(entry_id)
      and public.is_final_visible_contest(contest_id)
    );
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'entry_player_scores'
      and policyname = 'contest operators manage entry player scores'
  ) then
    create policy "contest operators manage entry player scores"
    on public.entry_player_scores
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contest_stat_snapshots') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_stat_snapshots'
      and policyname = 'contest operators manage contest stat snapshots'
  ) then
    create policy "contest operators manage contest stat snapshots"
    on public.contest_stat_snapshots
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;

  if to_regclass('public.contest_stat_snapshot_rows') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_stat_snapshot_rows'
      and policyname = 'contest operators manage contest stat snapshot rows'
  ) then
    create policy "contest operators manage contest stat snapshot rows"
    on public.contest_stat_snapshot_rows
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;
end
$$;

do $$
begin
  if to_regclass('public.contest_provisional_stat_snapshots') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_provisional_stat_snapshots'
      and policyname = 'contest operators manage provisional stat snapshots'
  ) then
    create policy "contest operators manage provisional stat snapshots"
    on public.contest_provisional_stat_snapshots
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;

  if to_regclass('public.contest_provisional_stat_snapshot_rows') is not null then
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'contest_provisional_stat_snapshot_rows'
      and policyname = 'contest operators manage provisional stat snapshot rows'
  ) then
    create policy "contest operators manage provisional stat snapshot rows"
    on public.contest_provisional_stat_snapshot_rows
    for all
    to authenticated
    using (public.is_contest_operator())
    with check (public.is_contest_operator());
  end if;
  end if;
end
$$;
