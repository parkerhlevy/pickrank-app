-- Preserve the empirical contest record needed for operator review and later
-- independent skill analysis. Evidence rows are append-only. The mutable
-- entry_lineups table remains the current-board projection used by the app.

create extension if not exists pgcrypto;

create table if not exists public.analytics_subjects (
  subject_id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  pseudonymized_at timestamptz
);

create table if not exists public.entry_board_revisions (
  revision_id uuid primary key default gen_random_uuid(),
  entry_id uuid not null,
  contest_id uuid not null,
  subject_id uuid not null references public.analytics_subjects(subject_id) on delete restrict,
  revision_number integer not null check (revision_number > 0),
  event_type text not null check (
    event_type in ('entry_created', 'user_saved', 'lock_snapshot', 'legacy_current_state', 'correction')
  ),
  previous_revision_id uuid references public.entry_board_revisions(revision_id) on delete restrict,
  idempotency_key uuid,
  board_hash text not null,
  source text not null default 'app',
  saved_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  unique (entry_id, revision_number)
);

create unique index if not exists entry_board_revisions_idempotency_idx
  on public.entry_board_revisions (entry_id, idempotency_key)
  where idempotency_key is not null;

create index if not exists entry_board_revisions_contest_saved_idx
  on public.entry_board_revisions (contest_id, saved_at, entry_id);

create index if not exists entry_board_revisions_subject_saved_idx
  on public.entry_board_revisions (subject_id, saved_at, entry_id);

create table if not exists public.entry_board_revision_items (
  revision_id uuid not null references public.entry_board_revisions(revision_id) on delete restrict,
  slate_player_id uuid not null,
  rank_position integer not null check (rank_position > 0),
  primary key (revision_id, rank_position),
  unique (revision_id, slate_player_id)
);

create table if not exists public.contest_ruleset_snapshots (
  ruleset_snapshot_id uuid primary key default gen_random_uuid(),
  contest_id uuid not null,
  ruleset_version integer not null check (ruleset_version > 0),
  ruleset_hash text not null,
  scoring_version text not null,
  source text not null,
  captured_at timestamptz not null default now(),
  ruleset jsonb not null,
  unique (contest_id, ruleset_version)
);

create index if not exists contest_ruleset_snapshots_contest_idx
  on public.contest_ruleset_snapshots (contest_id, ruleset_version desc);

create table if not exists public.admin_audit_events (
  event_id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  target_type text not null,
  target_id text,
  reason text,
  request_id uuid not null default gen_random_uuid(),
  result text not null default 'success',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_events_created_idx
  on public.admin_audit_events (created_at desc, event_type);

create or replace function public.reject_evidence_mutation()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  raise exception 'Empirical evidence records are append-only.';
end;
$$;

drop trigger if exists entry_board_revisions_immutable on public.entry_board_revisions;
create trigger entry_board_revisions_immutable
before update or delete on public.entry_board_revisions
for each row execute function public.reject_evidence_mutation();

drop trigger if exists entry_board_revision_items_immutable on public.entry_board_revision_items;
create trigger entry_board_revision_items_immutable
before update or delete on public.entry_board_revision_items
for each row execute function public.reject_evidence_mutation();

drop trigger if exists admin_audit_events_immutable on public.admin_audit_events;
create trigger admin_audit_events_immutable
before update or delete on public.admin_audit_events
for each row execute function public.reject_evidence_mutation();

drop trigger if exists contest_ruleset_snapshots_immutable on public.contest_ruleset_snapshots;
create trigger contest_ruleset_snapshots_immutable
before update or delete on public.contest_ruleset_snapshots
for each row execute function public.reject_evidence_mutation();

alter table public.analytics_subjects enable row level security;
alter table public.entry_board_revisions enable row level security;
alter table public.entry_board_revision_items enable row level security;
alter table public.contest_ruleset_snapshots enable row level security;
alter table public.admin_audit_events enable row level security;

drop policy if exists "contest operators can read analytics subjects" on public.analytics_subjects;
create policy "contest operators can read analytics subjects"
on public.analytics_subjects for select to authenticated
using (public.is_contest_operator());

drop policy if exists "contest operators can read board revisions" on public.entry_board_revisions;
create policy "contest operators can read board revisions"
on public.entry_board_revisions for select to authenticated
using (public.is_contest_operator());

drop policy if exists "contest operators can read board revision items" on public.entry_board_revision_items;
create policy "contest operators can read board revision items"
on public.entry_board_revision_items for select to authenticated
using (
  public.is_contest_operator()
  and exists (
    select 1
    from public.entry_board_revisions
    where public.entry_board_revisions.revision_id = entry_board_revision_items.revision_id
  )
);

drop policy if exists "contest operators can read admin audit events" on public.admin_audit_events;
create policy "contest operators can read admin audit events"
on public.admin_audit_events for select to authenticated
using (public.is_contest_operator());

drop policy if exists "contest operators can read contest ruleset snapshots" on public.contest_ruleset_snapshots;
create policy "contest operators can read contest ruleset snapshots"
on public.contest_ruleset_snapshots for select to authenticated
using (public.is_contest_operator());

-- Direct browser writes can bypass neither evidence capture nor atomic current-board replacement.
drop policy if exists "users can create their own open contest entry lineups" on public.entry_lineups;
drop policy if exists "users can update their own open contest entry lineups" on public.entry_lineups;
drop policy if exists "users can delete their own open contest entry lineups" on public.entry_lineups;

create or replace function public.ensure_analytics_subject(target_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_subject_id uuid;
begin
  insert into public.analytics_subjects (user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;

  select subject_id into resolved_subject_id
  from public.analytics_subjects
  where user_id = target_user_id;

  return resolved_subject_id;
end;
$$;

revoke all on function public.ensure_analytics_subject(uuid) from public;

create or replace function public.append_entry_board_revision(
  target_entry_id uuid,
  target_contest_id uuid,
  target_user_id uuid,
  target_slate_player_ids uuid[],
  target_event_type text,
  target_idempotency_key uuid default null,
  target_source text default 'app',
  target_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  next_revision_id uuid;
  next_revision_number integer;
  previous_revision_uuid uuid;
  resolved_subject_id uuid;
  resolved_board_hash text;
begin
  if target_event_type not in ('entry_created', 'user_saved', 'lock_snapshot', 'legacy_current_state', 'correction') then
    raise exception 'Unsupported board evidence event type.';
  end if;

  if target_idempotency_key is not null then
    select revision_id into next_revision_id
    from public.entry_board_revisions
    where entry_id = target_entry_id
      and idempotency_key = target_idempotency_key;

    if next_revision_id is not null then
      return next_revision_id;
    end if;
  end if;

  resolved_subject_id := public.ensure_analytics_subject(target_user_id);

  select revision_id, revision_number
  into previous_revision_uuid, next_revision_number
  from public.entry_board_revisions
  where entry_id = target_entry_id
  order by revision_number desc
  limit 1;

  next_revision_number := coalesce(next_revision_number, 0) + 1;
  resolved_board_hash := encode(
    extensions.digest(
      concat_ws(
        '|',
        target_entry_id::text,
        target_contest_id::text,
        coalesce(array_to_string(target_slate_player_ids, ','), '')
      ),
      'sha256'
    ),
    'hex'
  );

  insert into public.entry_board_revisions (
    entry_id,
    contest_id,
    subject_id,
    revision_number,
    event_type,
    previous_revision_id,
    idempotency_key,
    board_hash,
    source,
    metadata
  )
  values (
    target_entry_id,
    target_contest_id,
    resolved_subject_id,
    next_revision_number,
    target_event_type,
    previous_revision_uuid,
    target_idempotency_key,
    resolved_board_hash,
    target_source,
    coalesce(target_metadata, '{}'::jsonb)
  )
  returning revision_id into next_revision_id;

  insert into public.entry_board_revision_items (revision_id, slate_player_id, rank_position)
  select next_revision_id, slate_player_id, rank_position::integer
  from unnest(coalesce(target_slate_player_ids, array[]::uuid[]))
    with ordinality as board(slate_player_id, rank_position);

  return next_revision_id;
end;
$$;

revoke all on function public.append_entry_board_revision(uuid, uuid, uuid, uuid[], text, uuid, text, jsonb) from public;

create or replace function public.append_contest_ruleset_snapshot(
  target_contest_id uuid,
  target_source text,
  target_scoring_version text default 'rank-differential-v1'
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_contest public.contests%rowtype;
  next_version integer;
  snapshot_payload jsonb;
  snapshot_hash text;
  snapshot_uuid uuid;
begin
  select * into target_contest
  from public.contests
  where id = target_contest_id;

  if target_contest.id is null then
    raise exception 'Contest not found.';
  end if;

  select coalesce(max(ruleset_version), 0) + 1 into next_version
  from public.contest_ruleset_snapshots
  where contest_id = target_contest_id;

  snapshot_payload := jsonb_build_object(
    'contest_type', target_contest.contest_type,
    'entry_fee_cents', target_contest.entry_fee_cents,
    'lock_time', target_contest.lock_time,
    'min_entries_to_run', target_contest.min_entries_to_run,
    'season', target_contest.season,
    'slate_size', target_contest.slate_size,
    'stat_type', target_contest.stat_type,
    'week', target_contest.week,
    'scoring_version', target_scoring_version,
    'slate', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'slate_player_id', contest_slate_players.id,
          'player_id', contest_slate_players.player_id,
          'provider_player_id', contest_slate_players.provider_player_id,
          'provider_game_id', contest_slate_players.provider_game_id,
          'display_name', contest_slate_players.display_name,
          'position', contest_slate_players.position,
          'display_order', contest_slate_players.display_order
        ) order by contest_slate_players.display_order
      )
      from public.contest_slate_players
      where contest_slate_players.contest_id = target_contest_id
    ), '[]'::jsonb)
  );
  snapshot_hash := encode(extensions.digest(snapshot_payload::text, 'sha256'), 'hex');

  select ruleset_snapshot_id into snapshot_uuid
  from public.contest_ruleset_snapshots
  where contest_id = target_contest_id
    and ruleset_hash = snapshot_hash
  order by ruleset_version desc
  limit 1;

  if snapshot_uuid is not null then
    return snapshot_uuid;
  end if;

  insert into public.contest_ruleset_snapshots (
    contest_id,
    ruleset_version,
    ruleset_hash,
    scoring_version,
    source,
    ruleset
  ) values (
    target_contest_id,
    next_version,
    snapshot_hash,
    target_scoring_version,
    target_source,
    snapshot_payload
  ) returning ruleset_snapshot_id into snapshot_uuid;

  return snapshot_uuid;
end;
$$;

revoke all on function public.append_contest_ruleset_snapshot(uuid, text, text) from public;

create or replace function public.save_entry_board_revision(
  target_entry_id uuid,
  target_slate_player_ids uuid[],
  target_idempotency_key uuid
)
returns table (revision_id uuid, saved_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_uuid uuid := auth.uid();
  target_entry public.entries%rowtype;
  target_contest public.contests%rowtype;
  committed_revision_id uuid;
  existing_revision_id uuid;
begin
  if viewer_uuid is null then
    raise exception 'Authentication is required.';
  end if;

  select * into target_entry
  from public.entries
  where id = target_entry_id
  for update;

  if target_entry.id is null or target_entry.user_id <> viewer_uuid then
    raise exception 'No persisted entry exists for this contest.';
  end if;

  select revisions.revision_id into existing_revision_id
  from public.entry_board_revisions as revisions
  where revisions.entry_id = target_entry.id
    and revisions.idempotency_key = target_idempotency_key;

  if existing_revision_id is not null then
    return query
      select revisions.revision_id, revisions.saved_at
      from public.entry_board_revisions as revisions
      where revisions.revision_id = existing_revision_id;
    return;
  end if;

  select * into target_contest
  from public.contests
  where id = target_entry.contest_id
  for update;

  if target_contest.visibility_status <> 'visible' or target_contest.status <> 'open' then
    raise exception 'This contest is locked, so your board is now read-only.';
  end if;

  if coalesce(array_length(target_slate_player_ids, 1), 0) <> 10 then
    raise exception 'A saved board requires exactly 10 slate players.';
  end if;

  if exists (
    select 1 from unnest(target_slate_player_ids) as candidate_id
    group by candidate_id having count(*) > 1
  ) then
    raise exception 'A saved board cannot contain duplicate slate players.';
  end if;

  if (
    select count(*) from public.contest_slate_players
    where contest_id = target_entry.contest_id
      and id = any(target_slate_player_ids)
  ) <> 10 then
    raise exception 'Every lineup player must belong to the selected contest.';
  end if;

  committed_revision_id := public.append_entry_board_revision(
    target_entry.id,
    target_entry.contest_id,
    target_entry.user_id,
    target_slate_player_ids,
    'user_saved',
    target_idempotency_key,
    'lineup_api',
    jsonb_build_object('contest_status', target_contest.status)
  );

  delete from public.entry_lineups where entry_id = target_entry.id;

  insert into public.entry_lineups (entry_id, slate_player_id, rank_position)
  select target_entry.id, slate_player_id, rank_position::integer
  from unnest(target_slate_player_ids) with ordinality as board(slate_player_id, rank_position);

  update public.entries
  set updated_at = now()
  where id = target_entry.id;

  return query
    select committed_revision_id, revisions.saved_at
    from public.entry_board_revisions as revisions
    where revisions.revision_id = committed_revision_id;
end;
$$;

revoke all on function public.save_entry_board_revision(uuid, uuid[], uuid) from public;
grant execute on function public.save_entry_board_revision(uuid, uuid[], uuid) to authenticated;

create or replace function public.lock_free_test_contest_with_evidence(
  target_contest_id uuid,
  target_locked_at timestamptz default now()
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  operator_uuid uuid := auth.uid();
  target_contest public.contests%rowtype;
  entry_record public.entries%rowtype;
  locked_board uuid[];
begin
  if operator_uuid is null or not public.is_contest_operator() then
    raise exception 'Contest operator access is required.';
  end if;

  select * into target_contest
  from public.contests
  where id = target_contest_id
  for update;

  if target_contest.id is null then
    raise exception 'Contest not found.';
  end if;

  if target_contest.status <> 'open' then
    raise exception 'Only open contests can be locked through the free/test proof control.';
  end if;

  if target_contest.visibility_status <> 'visible' then
    raise exception 'Only visible contests can be locked through the free/test proof control.';
  end if;

  if target_contest.entry_fee_cents <> 0 then
    raise exception 'Only $0 free/test contests can use the free/test proof lock.';
  end if;

  if target_contest.paid_entries_count > 0 then
    raise exception '$0 free/test proof contests must not have paid entries counted.';
  end if;

  if target_contest.entry_count < 1 then
    raise exception 'Add at least one free/test entry before locking this proof contest.';
  end if;

  perform public.append_contest_ruleset_snapshot(
    target_contest_id,
    'admin_lock',
    'rank-differential-v1'
  );

  for entry_record in
    select * from public.entries
    where contest_id = target_contest_id
    order by id
    for update
  loop
    select coalesce(
      array_agg(entry_lineups.slate_player_id order by entry_lineups.rank_position),
      array[]::uuid[]
    ) into locked_board
    from public.entry_lineups
    where entry_id = entry_record.id;

    perform public.append_entry_board_revision(
      entry_record.id,
      target_contest_id,
      entry_record.user_id,
      locked_board,
      'lock_snapshot',
      null,
      'admin_lock',
      jsonb_build_object(
        'locked_at', target_locked_at,
        'locked_by_admin_id', operator_uuid,
        'player_count', coalesce(array_length(locked_board, 1), 0)
      )
    );
  end loop;

  update public.contests
  set status = 'locked', updated_at = target_locked_at
  where id = target_contest_id;

  insert into public.contest_state_events (
    contest_id,
    from_status,
    to_status,
    trigger,
    created_at,
    metadata
  ) values (
    target_contest_id,
    'open',
    'locked',
    'admin',
    target_locked_at,
    jsonb_build_object(
      'proof_type', 'free_test_lock',
      'no_money', true,
      'paid_entries_at_lock', target_contest.paid_entries_count,
      'total_entries_at_lock', target_contest.entry_count,
      'locked_by_admin_id', operator_uuid,
      'board_evidence_captured', true
    )
  );

  insert into public.admin_audit_events (
    actor_user_id,
    event_type,
    target_type,
    target_id,
    metadata,
    created_at
  ) values (
    operator_uuid,
    'contest_locked_with_board_evidence',
    'contest',
    target_contest_id::text,
    jsonb_build_object('entry_count', target_contest.entry_count),
    target_locked_at
  );
end;
$$;

revoke all on function public.lock_free_test_contest_with_evidence(uuid, timestamptz) from public;
grant execute on function public.lock_free_test_contest_with_evidence(uuid, timestamptz) to authenticated;

-- Recreate entry confirmation so the initial empty or complete board is evidence too.
create or replace function public.confirm_free_contest_entry(
  target_contest_id uuid,
  target_slate_player_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_uuid uuid := auth.uid();
  entry_uuid uuid;
  requested_player_count integer := coalesce(array_length(target_slate_player_ids, 1), 0);
begin
  if viewer_uuid is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1 from auth.users
    where auth.users.id = viewer_uuid
      and auth.users.email_confirmed_at is not null
      and length(trim(coalesce(auth.users.raw_user_meta_data ->> 'username', ''))) > 0
      and length(trim(coalesce(auth.users.raw_user_meta_data ->> 'display_name', ''))) > 0
  ) then
    raise exception 'A verified account with a complete profile is required.';
  end if;

  if requested_player_count not in (0, 10) then
    raise exception 'A free contest entry must contain zero players or exactly 10 slate players.';
  end if;

  if exists (
    select 1 from unnest(target_slate_player_ids) as candidate_id
    group by candidate_id having count(*) > 1
  ) then
    raise exception 'A free contest entry cannot contain duplicate slate players.';
  end if;

  if not exists (
    select 1 from public.contests
    where id = target_contest_id
      and visibility_status = 'visible'
      and status = 'open'
      and entry_fee_cents = 0
  ) then
    raise exception 'This contest is not eligible for free entry.';
  end if;

  if (
    select count(*) from public.contest_slate_players
    where contest_id = target_contest_id
      and id = any(target_slate_player_ids)
  ) <> requested_player_count then
    raise exception 'Every lineup player must belong to the selected contest.';
  end if;

  select id into entry_uuid
  from public.entries
  where user_id = viewer_uuid and contest_id = target_contest_id;

  if entry_uuid is null then
    insert into public.entries (contest_id, user_id, status)
    values (target_contest_id, viewer_uuid, 'created')
    returning id into entry_uuid;

    insert into public.entry_lineups (entry_id, slate_player_id, rank_position)
    select entry_uuid, slate_player_id, rank_position::integer
    from unnest(target_slate_player_ids) with ordinality as lineup(slate_player_id, rank_position);

    perform public.append_entry_board_revision(
      entry_uuid,
      target_contest_id,
      viewer_uuid,
      target_slate_player_ids,
      'entry_created',
      null,
      'entry_confirmation',
      jsonb_build_object('initial_player_count', requested_player_count)
    );

    update public.contests
    set entry_count = entry_count + 1, updated_at = now()
    where id = target_contest_id;
  end if;

  return entry_uuid;
exception
  when unique_violation then
    select id into entry_uuid
    from public.entries
    where user_id = viewer_uuid and contest_id = target_contest_id;
    return entry_uuid;
end;
$$;

revoke all on function public.confirm_free_contest_entry(uuid, uuid[]) from public;
grant execute on function public.confirm_free_contest_entry(uuid, uuid[]) to authenticated;

-- Preserve only what is known for pre-migration boards. Do not invent edit history.
insert into public.analytics_subjects (user_id)
select distinct user_id from public.entries
on conflict (user_id) do nothing;

with legacy_boards as (
  select
    entries.id as entry_id,
    entries.contest_id,
    entries.user_id,
    coalesce(
      array_agg(entry_lineups.slate_player_id order by entry_lineups.rank_position)
        filter (where entry_lineups.slate_player_id is not null),
      array[]::uuid[]
    ) as slate_player_ids
  from public.entries
  left join public.entry_lineups on public.entry_lineups.entry_id = entries.id
  group by entries.id, entries.contest_id, entries.user_id
)
select public.append_entry_board_revision(
  legacy_boards.entry_id,
  legacy_boards.contest_id,
  legacy_boards.user_id,
  legacy_boards.slate_player_ids,
  'legacy_current_state',
  null,
  'migration_0017',
  jsonb_build_object('history_available', false)
)
from legacy_boards
where not exists (
  select 1 from public.entry_board_revisions
  where public.entry_board_revisions.entry_id = legacy_boards.entry_id
);

select public.append_contest_ruleset_snapshot(
  contests.id,
  'migration_0017',
  'rank-differential-v1'
)
from public.contests as contests;
