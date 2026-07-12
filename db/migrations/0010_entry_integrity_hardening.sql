-- Close entry and lineup integrity gaps left by the initial RLS hardening.

-- Entry lifecycle changes must go through narrow RPCs so payment/entitlement
-- and contest-count invariants cannot be bypassed through direct table writes.
drop policy if exists "users can create their own open contest entries" on public.entries;
drop policy if exists "users can update their own open contest entries" on public.entries;
drop policy if exists "users can delete their own open contest entries" on public.entries;

create or replace function public.is_viewer_lineup_player_for_open_contest(
  entry_uuid uuid,
  slate_player_uuid uuid
)
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
    join public.contest_slate_players
      on public.contest_slate_players.id = slate_player_uuid
      and public.contest_slate_players.contest_id = public.entries.contest_id
    where public.entries.id = entry_uuid
      and public.entries.user_id = auth.uid()
      and public.contests.visibility_status = 'visible'
      and public.contests.status = 'open'
  );
$$;

revoke all on function public.is_viewer_lineup_player_for_open_contest(uuid, uuid) from public;
grant execute on function public.is_viewer_lineup_player_for_open_contest(uuid, uuid) to authenticated;

drop policy if exists "users can create their own open contest entry lineups" on public.entry_lineups;
create policy "users can create their own open contest entry lineups"
on public.entry_lineups
for insert
to authenticated
with check (public.is_viewer_lineup_player_for_open_contest(entry_id, slate_player_id));

drop policy if exists "users can update their own open contest entry lineups" on public.entry_lineups;
create policy "users can update their own open contest entry lineups"
on public.entry_lineups
for update
to authenticated
using (public.is_viewer_entry_for_open_contest(entry_id))
with check (public.is_viewer_lineup_player_for_open_contest(entry_id, slate_player_id));

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
  entry_was_created boolean := false;
begin
  if viewer_uuid is null then
    raise exception 'Authentication is required.';
  end if;

  if not exists (
    select 1
    from auth.users
    where auth.users.id = viewer_uuid
      and auth.users.email_confirmed_at is not null
      and length(trim(coalesce(auth.users.raw_user_meta_data ->> 'username', ''))) > 0
      and length(trim(coalesce(auth.users.raw_user_meta_data ->> 'display_name', ''))) > 0
  ) then
    raise exception 'A verified account with a complete profile is required.';
  end if;

  if coalesce(array_length(target_slate_player_ids, 1), 0) <> 10 then
    raise exception 'A free contest entry requires exactly 10 slate players.';
  end if;

  if exists (
    select 1
    from unnest(target_slate_player_ids) as candidate_id
    group by candidate_id
    having count(*) > 1
  ) then
    raise exception 'A free contest entry cannot contain duplicate slate players.';
  end if;

  if not exists (
    select 1
    from public.contests
    where id = target_contest_id
      and visibility_status = 'visible'
      and status = 'open'
      and entry_fee_cents = 0
  ) then
    raise exception 'This contest is not eligible for free entry.';
  end if;

  if (
    select count(*)
    from public.contest_slate_players
    where contest_id = target_contest_id
      and id = any(target_slate_player_ids)
  ) <> 10 then
    raise exception 'Every lineup player must belong to the selected contest.';
  end if;

  select id into entry_uuid
  from public.entries
  where user_id = viewer_uuid
    and contest_id = target_contest_id;

  if entry_uuid is null then
    insert into public.entries (contest_id, user_id, status)
    values (target_contest_id, viewer_uuid, 'created')
    returning id into entry_uuid;

    entry_was_created := true;

    insert into public.entry_lineups (entry_id, slate_player_id, rank_position)
    select entry_uuid, slate_player_id, rank_position::integer
    from unnest(target_slate_player_ids) with ordinality as lineup(slate_player_id, rank_position);

    update public.contests
    set entry_count = entry_count + 1,
        updated_at = now()
    where id = target_contest_id;
  end if;

  return entry_uuid;
exception
  when unique_violation then
    if entry_was_created then
      raise;
    end if;

    select id into entry_uuid
    from public.entries
    where user_id = viewer_uuid
      and contest_id = target_contest_id;

    return entry_uuid;
end;
$$;

revoke all on function public.confirm_free_contest_entry(uuid, uuid[]) from public;
grant execute on function public.confirm_free_contest_entry(uuid, uuid[]) to authenticated;
