-- Internal operator roles and contest-ops metadata foundation.
-- This adds the minimal authorization and audit tables needed for contest admin workflows.

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  assigned_at timestamptz not null default now(),
  unique (user_id, role_id)
);

insert into public.roles (slug, name)
values ('contest_operator', 'Contest Operator')
on conflict (slug) do update set name = excluded.name;

alter table public.roles enable row level security;
alter table public.user_roles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'roles'
      and policyname = 'authenticated users can read roles'
  ) then
    create policy "authenticated users can read roles"
    on public.roles
    for select
    to authenticated
    using (true);
  end if;
end
$$;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_roles'
      and policyname = 'users can read their own role assignments'
  ) then
    create policy "users can read their own role assignments"
    on public.user_roles
    for select
    to authenticated
    using (auth.uid() = user_id);
  end if;
end
$$;

alter table public.contests
  add column if not exists entry_open_time timestamptz,
  add column if not exists visibility_status text not null default 'hidden',
  add column if not exists is_featured boolean not null default false,
  add column if not exists paid_entries_count integer not null default 0,
  add column if not exists min_entries_to_run integer not null default 4,
  add column if not exists created_by_admin_id uuid references auth.users(id) on delete set null,
  add column if not exists published_by_admin_id uuid references auth.users(id) on delete set null,
  add column if not exists published_at timestamptz,
  add column if not exists week integer;

create table if not exists public.contest_validation_results (
  validation_id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  status text not null,
  errors text[] not null default '{}',
  warnings text[] not null default '{}',
  validated_at timestamptz not null default now(),
  validated_by_admin_id uuid references auth.users(id) on delete set null
);

create table if not exists public.contest_state_events (
  event_id uuid primary key default gen_random_uuid(),
  contest_id uuid not null references public.contests(id) on delete cascade,
  from_status text,
  to_status text not null,
  trigger text not null,
  created_at timestamptz not null default now(),
  metadata jsonb
);

-- Supabase cron/scheduled functions are the intended next execution surface for:
-- 1. scheduled -> open transitions at entry_open_time
-- 2. open -> locked transitions at lock_time
-- 3. lock-time viability checks
-- Keep those jobs server-authoritative and idempotent when wiring them in.
