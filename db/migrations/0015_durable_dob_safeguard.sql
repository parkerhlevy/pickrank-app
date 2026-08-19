-- Durable DOB safeguard for Early Access Beta.
-- Apply only through the approved migration process. This migration does not add
-- identity verification, payments, KYC, geolocation, payouts, or account deletion.

alter table if exists public.profiles
  add column if not exists dob_captured_at timestamptz;

-- Backfill only where the protected profile record has no DOB. Existing protected
-- profile values always win over legacy auth metadata. Invalid legacy values remain
-- unset for support-led review; this migration never guesses a DOB.
update public.profiles as profile
set date_of_birth = to_date(auth_user.raw_user_meta_data ->> 'date_of_birth', 'YYYY-MM-DD'),
    dob_captured_at = coalesce(profile.dob_captured_at, now())
from auth.users as auth_user
where profile.id = auth_user.id
  and profile.date_of_birth is null
  and (auth_user.raw_user_meta_data ->> 'date_of_birth') ~ '^\d{4}-\d{2}-\d{2}$'
  and to_char(to_date(auth_user.raw_user_meta_data ->> 'date_of_birth', 'YYYY-MM-DD'), 'YYYY-MM-DD') =
      (auth_user.raw_user_meta_data ->> 'date_of_birth');

-- Apply the current 18+ beta hold to existing durable DOBs. Preserve a non-age
-- restriction reason so this migration cannot erase a separate account hold.
update public.profiles
set age_confirmed = true,
    age_gate_status = 'blocked',
    account_status = 'restricted',
    eligibility_status = 'blocked',
    restriction_reason = coalesce(restriction_reason, 'under_18_age_gate'),
    restricted_at = coalesce(restricted_at, now()),
    restriction_source = coalesce(restriction_source, 'beta_dob_age_gate')
where date_of_birth is not null
  and date_of_birth > (current_date - interval '18 years')::date;

update public.profiles
set age_confirmed = true,
    age_gate_status = 'confirmed'
where date_of_birth is not null
  and date_of_birth <= (current_date - interval '18 years')::date
  and age_gate_status <> 'blocked';

create or replace function public.record_dob_change_attempt(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.compliance_eligibility_events (
    user_id,
    event_type,
    eligibility_status,
    age_gate_status,
    restriction_reason,
    source,
    metadata
  )
  select
    target_user_id,
    'date_of_birth_change_attempted',
    profile.eligibility_status,
    profile.age_gate_status,
    profile.restriction_reason,
    'app',
    jsonb_build_object('field', 'date_of_birth')
  from public.profiles as profile
  where profile.id = target_user_id;
end;
$$;

create or replace function public.protect_profile_date_of_birth()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.date_of_birth is not null
    and new.date_of_birth is distinct from old.date_of_birth then
    perform public.record_dob_change_attempt(old.id);
    new.date_of_birth := old.date_of_birth;
    new.dob_captured_at := old.dob_captured_at;
  end if;

  if old.date_of_birth is not null
    and old.date_of_birth > (current_date - interval '18 years')::date then
    new.age_confirmed := true;
    new.age_gate_status := 'blocked';
    new.account_status := 'restricted';
    new.eligibility_status := 'blocked';
    new.restriction_reason := coalesce(old.restriction_reason, 'under_18_age_gate');
    new.restricted_at := coalesce(old.restricted_at, now());
    new.restriction_source := coalesce(old.restriction_source, 'beta_dob_age_gate');
  end if;

  return new;
end;
$$;

drop trigger if exists protect_profile_date_of_birth on public.profiles;
create trigger protect_profile_date_of_birth
before update on public.profiles
for each row execute function public.protect_profile_date_of_birth();

create or replace function public.enforce_free_beta_entry_dob_eligibility()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if exists (
    select 1
    from public.contests
    where id = new.contest_id
      and entry_fee_cents = 0
  ) and not exists (
    select 1
    from public.profiles as profile
    where profile.id = new.user_id
      and profile.date_of_birth is not null
      and profile.date_of_birth <= (current_date - interval '18 years')::date
      and profile.age_gate_status = 'confirmed'
      and profile.account_status = 'active'
      and profile.eligibility_status <> 'blocked'
      and nullif(trim(profile.jurisdiction), '') is not null
      and profile.terms_accepted_at is not null
      and profile.privacy_policy_accepted_at is not null
  ) then
    raise exception 'Free beta entry requires a confirmed 18+ protected profile.';
  end if;

  return new;
end;
$$;

drop trigger if exists enforce_free_beta_entry_dob_eligibility on public.entries;
create trigger enforce_free_beta_entry_dob_eligibility
before insert on public.entries
for each row execute function public.enforce_free_beta_entry_dob_eligibility();

create or replace function public.capture_profile_date_of_birth(target_date_of_birth date)
returns table (
  date_of_birth date,
  age_gate_status text,
  account_status text,
  eligibility_status text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  viewer_id uuid := auth.uid();
  existing_date_of_birth date;
  is_under_18 boolean;
begin
  if viewer_id is null then
    raise exception 'Authentication is required.';
  end if;

  if target_date_of_birth is null or target_date_of_birth > current_date then
    raise exception 'Enter a valid date of birth.';
  end if;

  insert into public.profiles (id, username, display_name)
  select
    viewer_id,
    nullif(trim(auth_user.raw_user_meta_data ->> 'username'), ''),
    nullif(trim(auth_user.raw_user_meta_data ->> 'display_name'), '')
  from auth.users as auth_user
  where auth_user.id = viewer_id
  on conflict (id) do nothing;

  select profile.date_of_birth
  into existing_date_of_birth
  from public.profiles as profile
  where profile.id = viewer_id
  for update;

  if existing_date_of_birth is not null then
    if existing_date_of_birth <> target_date_of_birth then
      perform public.record_dob_change_attempt(viewer_id);
    end if;

    return query
    select profile.date_of_birth, profile.age_gate_status, profile.account_status, profile.eligibility_status
    from public.profiles as profile
    where profile.id = viewer_id;
    return;
  end if;

  is_under_18 := target_date_of_birth > (current_date - interval '18 years')::date;

  update public.profiles as profile
  set date_of_birth = target_date_of_birth,
      dob_captured_at = now(),
      age_confirmed = true,
      age_gate_status = case when is_under_18 then 'blocked' else 'confirmed' end,
      account_status = case when is_under_18 then 'restricted' else profile.account_status end,
      eligibility_status = case when is_under_18 then 'blocked' else profile.eligibility_status end,
      restriction_reason = case
        when is_under_18 then coalesce(profile.restriction_reason, 'under_18_age_gate')
        else profile.restriction_reason
      end,
      restricted_at = case when is_under_18 then coalesce(profile.restricted_at, now()) else profile.restricted_at end,
      restriction_source = case
        when is_under_18 then coalesce(profile.restriction_source, 'beta_dob_age_gate')
        else profile.restriction_source
      end
  where profile.id = viewer_id;

  return query
  select profile.date_of_birth, profile.age_gate_status, profile.account_status, profile.eligibility_status
  from public.profiles as profile
  where profile.id = viewer_id;
end;
$$;

revoke all on function public.record_dob_change_attempt(uuid) from public;
revoke all on function public.protect_profile_date_of_birth() from public;
revoke all on function public.enforce_free_beta_entry_dob_eligibility() from public;
revoke all on function public.capture_profile_date_of_birth(date) from public;
grant execute on function public.capture_profile_date_of_birth(date) to authenticated;
