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
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000001',
    'authenticated', 'authenticated', 'verified@example.test', '', now(), '{}',
    '{"username":"verified","display_name":"Verified User"}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000002',
    'authenticated', 'authenticated', 'unverified@example.test', '', null, '{}',
    '{"username":"unverified","display_name":"Unverified User"}', now(), now()
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '10000000-0000-0000-0000-000000000003',
    'authenticated', 'authenticated', 'incomplete@example.test', '', now(), '{}',
    '{}', now(), now()
  );

insert into public.profiles (
  id, username, display_name, date_of_birth, dob_captured_at, age_confirmed,
  age_gate_status, account_status, eligibility_status, jurisdiction,
  terms_accepted_at, privacy_policy_accepted_at
)
values (
  '10000000-0000-0000-0000-000000000001', 'verified', 'Verified User', '1990-01-01', now(), true,
  'confirmed', 'active', 'unknown', 'CA', now(), now()
);

insert into public.contests (
  id, title, slug, entry_fee_cents, lock_time, status, visibility_status
)
values
  ('20000000-0000-0000-0000-000000000001', 'Free test', 'free-test', 0, now() + interval '1 day', 'open', 'visible'),
  ('20000000-0000-0000-0000-000000000002', 'Paid test', 'paid-test', 500, now() + interval '1 day', 'open', 'visible'),
  ('20000000-0000-0000-0000-000000000003', 'Other free test', 'other-free-test', 0, now() + interval '1 day', 'open', 'visible');

insert into public.contest_slate_players (
  id, contest_id, player_external_id, player_name, team_abbreviation,
  opponent_abbreviation, opponent_context, display_order
)
select
  ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid,
  '20000000-0000-0000-0000-000000000001',
  'free-' || player_number,
  'Free Player ' || player_number,
  'F' || player_number,
  'O' || player_number,
  'vs',
  player_number
from generate_series(1, 10) as player_number;

insert into public.contest_slate_players (
  id, contest_id, player_external_id, player_name, team_abbreviation,
  opponent_abbreviation, opponent_context, display_order
)
select
  ('40000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid,
  '20000000-0000-0000-0000-000000000002',
  'paid-' || player_number,
  'Paid Player ' || player_number,
  'P' || player_number,
  'O' || player_number,
  'vs',
  player_number
from generate_series(1, 10) as player_number;

insert into public.contest_slate_players (
  id, contest_id, player_external_id, player_name, team_abbreviation,
  opponent_abbreviation, opponent_context, display_order
)
select
  ('50000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid,
  '20000000-0000-0000-0000-000000000003',
  'other-' || player_number,
  'Other Player ' || player_number,
  'X' || player_number,
  'O' || player_number,
  'vs',
  player_number
from generate_series(1, 10) as player_number;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select set_config('request.jwt.claim.role', 'authenticated', true);

do $$
begin
  begin
    insert into public.entries (contest_id, user_id)
    values ('20000000-0000-0000-0000-000000000001', auth.uid());
    raise exception 'direct authenticated entry insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;
end;
$$;

select public.confirm_free_contest_entry(
  '20000000-0000-0000-0000-000000000001',
  array(
    select ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid
    from generate_series(1, 10) as player_number
    order by player_number
  )
);

reset role;
select pg_temp.assert_true(
  (select count(*) = 1 from public.entries where contest_id = '20000000-0000-0000-0000-000000000001'),
  'free confirmation should create one entry'
);
select pg_temp.assert_true(
  (select count(*) = 10 from public.entry_lineups where entry_id = (
    select id from public.entries where contest_id = '20000000-0000-0000-0000-000000000001'
  )),
  'free confirmation should create ten lineup rows'
);
select pg_temp.assert_true(
  (select entry_count = 1 and paid_entries_count = 0 from public.contests where id = '20000000-0000-0000-0000-000000000001'),
  'free confirmation should increment total entries once and never paid entries'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
select public.confirm_free_contest_entry(
  '20000000-0000-0000-0000-000000000001',
  array(
    select ('30000000-0000-0000-0000-' || lpad(player_number::text, 12, '0'))::uuid
    from generate_series(1, 10) as player_number
    order by player_number
  )
);
reset role;
select pg_temp.assert_true(
  (select count(*) = 1 from public.entries where contest_id = '20000000-0000-0000-0000-000000000001')
  and (select entry_count = 1 from public.contests where id = '20000000-0000-0000-0000-000000000001'),
  'free confirmation should be idempotent'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000001', true);
do $$
begin
  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000002',
      array(select ('40000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 10) n)
    );
    raise exception 'paid contest confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'paid contest confirmation unexpectedly succeeded' then raise; end if;
  end;

  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000003',
      array(select ('30000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 10) n)
    );
    raise exception 'cross-contest lineup confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'cross-contest lineup confirmation unexpectedly succeeded' then raise; end if;
  end;

  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000003',
      array[('50000000-0000-0000-0000-000000000001')::uuid, ('50000000-0000-0000-0000-000000000001')::uuid,
        ('50000000-0000-0000-0000-000000000003')::uuid, ('50000000-0000-0000-0000-000000000004')::uuid,
        ('50000000-0000-0000-0000-000000000005')::uuid, ('50000000-0000-0000-0000-000000000006')::uuid,
        ('50000000-0000-0000-0000-000000000007')::uuid, ('50000000-0000-0000-0000-000000000008')::uuid,
        ('50000000-0000-0000-0000-000000000009')::uuid, ('50000000-0000-0000-0000-000000000010')::uuid]
    );
    raise exception 'duplicate lineup confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'duplicate lineup confirmation unexpectedly succeeded' then raise; end if;
  end;
end;
$$;

do $$
begin
  begin
    update public.entries set status = 'tampered'
    where contest_id = '20000000-0000-0000-0000-000000000001';
  exception when insufficient_privilege then null;
  end;

  begin
    delete from public.entries
    where contest_id = '20000000-0000-0000-0000-000000000001';
  exception when insufficient_privilege then null;
  end;
end;
$$;
reset role;
select pg_temp.assert_true(
  (select status = 'created' from public.entries where contest_id = '20000000-0000-0000-0000-000000000001'),
  'direct authenticated update and delete should affect no entry'
);

do $$
declare
  viewer_entry_id uuid := (select id from public.entries where contest_id = '20000000-0000-0000-0000-000000000001');
begin
  execute 'set local role authenticated';
  begin
    insert into public.entry_lineups (entry_id, slate_player_id, rank_position)
    values (viewer_entry_id, '50000000-0000-0000-0000-000000000001', 11);
    raise exception 'cross-contest lineup insert unexpectedly succeeded';
  exception
    when insufficient_privilege then null;
  end;

  begin
    update public.entry_lineups
    set slate_player_id = '50000000-0000-0000-0000-000000000001'
    where entry_id = viewer_entry_id and rank_position = 1;
  exception when insufficient_privilege then null;
  end;
  execute 'reset role';
  perform pg_temp.assert_true(
    (select slate_player_id = '30000000-0000-0000-0000-000000000001'
     from public.entry_lineups where entry_id = viewer_entry_id and rank_position = 1),
    'cross-contest lineup update should affect no row'
  );
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000002', true);
do $$
begin
  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000003',
      array(select ('50000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 10) n)
    );
    raise exception 'unverified account confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'unverified account confirmation unexpectedly succeeded' then raise; end if;
  end;
end;
$$;

select set_config('request.jwt.claim.sub', '10000000-0000-0000-0000-000000000003', true);
do $$
begin
  begin
    perform public.confirm_free_contest_entry(
      '20000000-0000-0000-0000-000000000003',
      array(select ('50000000-0000-0000-0000-' || lpad(n::text, 12, '0'))::uuid from generate_series(1, 10) n)
    );
    raise exception 'incomplete account confirmation unexpectedly succeeded';
  exception when others then
    if sqlerrm = 'incomplete account confirmation unexpectedly succeeded' then raise; end if;
  end;
end;
$$;

rollback;
