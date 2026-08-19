begin;

create or replace function pg_temp.assert_true(condition boolean, message text)
returns void
language plpgsql
as $$
begin
  if not coalesce(condition, false) then
    raise exception 'assertion failed: %', message;
  end if;
end;
$$;

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000011',
   'authenticated', 'authenticated', 'adult-dob@example.test', '', now(), '{}',
   '{"username":"adult_dob","display_name":"Adult DOB"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000012',
   'authenticated', 'authenticated', 'underage-dob@example.test', '', now(), '{}',
   '{"username":"underage_dob","display_name":"Underage DOB"}', now(), now());

insert into public.contests (id, title, slug, entry_fee_cents, lock_time, status, visibility_status)
values ('20000000-0000-0000-0000-000000000015', 'DOB beta test', 'dob-beta-test', 0, now() + interval '1 day', 'open', 'visible');

insert into public.contest_slate_players (
  id, contest_id, player_external_id, player_name, team_abbreviation,
  opponent_abbreviation, opponent_context, display_order
)
select
  ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid,
  '20000000-0000-0000-0000-000000000015', 'dob-' || player_number, 'DOB Player ' || player_number,
  'D' || player_number, 'O', 'vs', player_number
from generate_series(1, 10) as player_number;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000011', true);
select public.capture_profile_date_of_birth('1990-01-01');
update public.profiles
set jurisdiction = 'CA', terms_accepted_at = now(), privacy_policy_accepted_at = now()
where id = auth.uid();

select pg_temp.assert_true(
  (select date_of_birth = '1990-01-01'::date and dob_captured_at is not null and age_gate_status = 'confirmed'
   from public.profiles where id = auth.uid()),
  'first submitted DOB should be captured in the protected profile record'
);

select public.capture_profile_date_of_birth('1991-01-01');
select pg_temp.assert_true(
  (select date_of_birth = '1990-01-01'::date from public.profiles where id = auth.uid()),
  'a later DOB submission must not replace the first protected DOB'
);
select pg_temp.assert_true(
  (select count(*) = 1 from public.compliance_eligibility_events
   where user_id = auth.uid() and event_type = 'date_of_birth_change_attempted'
     and metadata = jsonb_build_object('field', 'date_of_birth')),
  'a DOB change attempt should create one minimal audit event without a DOB value'
);

update public.profiles set date_of_birth = '1992-01-01' where id = auth.uid();
select pg_temp.assert_true(
  (select date_of_birth = '1990-01-01'::date from public.profiles where id = auth.uid()),
  'ordinary profile updates must not change the protected DOB'
);

select public.confirm_free_contest_entry(
  '20000000-0000-0000-0000-000000000015',
  array(
    select ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid
    from generate_series(1, 10) as player_number order by player_number
  )
);

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000012', true);
select public.capture_profile_date_of_birth((current_date - interval '17 years')::date);
do $$
begin
  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000015',
      array(
        select ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid
        from generate_series(1, 10) as player_number order by player_number
      )
    );
    raise exception 'under-18 free beta entry unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'under-18 free beta entry unexpectedly succeeded' then raise; end if;
  end;
end;
$$;
reset role;

select pg_temp.assert_true(
  (select account_status = 'restricted' and eligibility_status = 'blocked' and age_gate_status = 'blocked'
   from public.profiles where id = '10000000-0000-0000-0000-000000000012'),
  'under-18 capture must restrict the account server-side'
);

rollback;
