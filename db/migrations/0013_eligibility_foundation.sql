-- Eligibility foundation for paid-entry gating.
-- This adds storage hooks only; final jurisdiction rules, provider KYC, geolocation,
-- withdrawals, and payment-provider behavior remain future/legal-reviewed work.

alter table if exists public.profiles
  add column if not exists age_confirmed boolean not null default false,
  add column if not exists jurisdiction text,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists privacy_policy_accepted_at timestamptz,
  add column if not exists account_status text not null default 'active',
  add column if not exists eligibility_status text not null default 'unknown',
  add column if not exists eligibility_checked_at timestamptz,
  add column if not exists age_gate_status text not null default 'unknown',
  add column if not exists kyc_status text not null default 'not_required',
  add column if not exists restriction_reason text,
  add column if not exists restricted_at timestamptz,
  add column if not exists restriction_source text;

create table if not exists public.jurisdiction_rules (
  jurisdiction_code text primary key,
  paid_entry_status text not null default 'pending_review',
  withdrawal_status text not null default 'pending_review',
  minimum_age integer not null default 18,
  kyc_required_for_entry boolean not null default false,
  kyc_required_for_withdrawal boolean not null default true,
  notes text,
  last_legal_review_at timestamptz,
  status text not null default 'pending_review',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.responsible_play_statuses (
  user_id uuid primary key references auth.users(id) on delete cascade,
  self_exclusion_status text not null default 'none',
  self_exclusion_started_at timestamptz,
  self_exclusion_ends_at timestamptz,
  entry_restriction_status text not null default 'none',
  restriction_reason text,
  updated_at timestamptz not null default now()
);

create table if not exists public.compliance_eligibility_events (
  event_id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null,
  jurisdiction text,
  eligibility_status text not null default 'unknown',
  age_gate_status text not null default 'unknown',
  kyc_status text not null default 'not_required',
  self_exclusion_status text not null default 'none',
  restriction_reason text,
  source text not null default 'app',
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

alter table if exists public.jurisdiction_rules enable row level security;
alter table if exists public.responsible_play_statuses enable row level security;
alter table if exists public.compliance_eligibility_events enable row level security;

do $$
begin
  if to_regclass('public.profiles') is not null
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'users can read own profile eligibility'
    ) then
    create policy "users can read own profile eligibility"
    on public.profiles
    for select
    to authenticated
    using (id = auth.uid());
  end if;

  if to_regclass('public.profiles') is not null
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'profiles'
        and policyname = 'users can update own profile eligibility'
    ) then
    create policy "users can update own profile eligibility"
    on public.profiles
    for update
    to authenticated
    using (id = auth.uid())
    with check (id = auth.uid());
  end if;

  if to_regclass('public.jurisdiction_rules') is not null
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'jurisdiction_rules'
        and policyname = 'authenticated users can read jurisdiction rules'
    ) then
    create policy "authenticated users can read jurisdiction rules"
    on public.jurisdiction_rules
    for select
    to authenticated
    using (true);
  end if;

  if to_regclass('public.responsible_play_statuses') is not null
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'responsible_play_statuses'
        and policyname = 'users can read own responsible play status'
    ) then
    create policy "users can read own responsible play status"
    on public.responsible_play_statuses
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;

  if to_regclass('public.compliance_eligibility_events') is not null
    and not exists (
      select 1
      from pg_policies
      where schemaname = 'public'
        and tablename = 'compliance_eligibility_events'
        and policyname = 'users can read own eligibility events'
    ) then
    create policy "users can read own eligibility events"
    on public.compliance_eligibility_events
    for select
    to authenticated
    using (user_id = auth.uid());
  end if;
end $$;
