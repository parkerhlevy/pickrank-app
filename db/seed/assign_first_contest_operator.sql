-- Bootstrap internal contest operators by email.
-- This works both before and after signup:
-- 1. It stages the email in pending_user_roles so future signups auto-claim the role.
-- 2. It also grants the role immediately to any auth.users rows that already exist for those emails.

with operator_role as (
  select id
  from public.roles
  where slug = 'contest_operator'
),
target_emails as (
  select lower(email) as email
  from (
    values
      ('parkerhlevy@gmail.com'),
      ('glevy59@icloud.com')
  ) as seed(email)
)
insert into public.pending_user_roles (email, role_id)
select target_emails.email, operator_role.id
from target_emails
cross join operator_role
on conflict (email, role_id) do nothing;

with operator_role as (
  select id
  from public.roles
  where slug = 'contest_operator'
),
target_emails as (
  select lower(email) as email
  from (
    values
      ('parkerhlevy@gmail.com'),
      ('glevy59@icloud.com')
  ) as seed(email)
)
insert into public.user_roles (user_id, role_id)
select auth_users.id, operator_role.id
from auth.users auth_users
join target_emails on lower(auth_users.email) = target_emails.email
cross join operator_role
on conflict (user_id, role_id) do nothing;
