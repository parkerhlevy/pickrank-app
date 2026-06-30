-- Allow internal operator access to be staged before a user has signed up.
-- Pending email assignments are converted into real user_roles rows when auth.users records are created.

create table if not exists public.pending_user_roles (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (email, role_id)
);

create index if not exists pending_user_roles_email_idx
  on public.pending_user_roles (email);

alter table public.pending_user_roles enable row level security;

create or replace function public.assign_pending_roles_to_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.user_roles (user_id, role_id, assigned_by_user_id)
  select new.id, pending.role_id, pending.assigned_by_user_id
  from public.pending_user_roles pending
  where lower(pending.email) = lower(new.email)
  on conflict (user_id, role_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created_assign_pending_roles on auth.users;

create trigger on_auth_user_created_assign_pending_roles
after insert on auth.users
for each row
execute function public.assign_pending_roles_to_user();
