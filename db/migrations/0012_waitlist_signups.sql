create table if not exists public.waitlist_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  signed_up_at timestamptz not null default now(),
  consented_at timestamptz not null default now(),
  source_path text not null default '/',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  resend_contact_sync_status text not null default 'pending'
    check (resend_contact_sync_status in ('pending', 'synced', 'skipped_unsubscribed', 'missing_config', 'failed_retryable')),
  resend_contact_sync_attempted_at timestamptz,
  resend_contact_id text,
  welcome_email_status text not null default 'pending'
    check (welcome_email_status in ('pending', 'sent', 'skipped_duplicate', 'skipped_unsubscribed', 'missing_config', 'failed_retryable')),
  welcome_email_sent_at timestamptz,
  provider_retry_reason text
    check (provider_retry_reason is null or provider_retry_reason in ('missing_config', 'contact_sync_failed', 'welcome_email_failed', 'contact_unsubscribed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint waitlist_signups_email_lowercase check (email = lower(email)),
  constraint waitlist_signups_email_length check (char_length(email) between 3 and 254),
  constraint waitlist_signups_source_path_safe check (
    char_length(source_path) between 1 and 120
    and source_path like '/%'
    and source_path not like '%?%'
    and source_path not like '%#%'
  ),
  constraint waitlist_signups_provider_retry_reason_length check (provider_retry_reason is null or char_length(provider_retry_reason) <= 64)
);

create unique index if not exists waitlist_signups_email_unique_idx
  on public.waitlist_signups (lower(email));

create index if not exists waitlist_signups_signed_up_at_idx
  on public.waitlist_signups (signed_up_at desc);

create index if not exists waitlist_signups_resend_retry_idx
  on public.waitlist_signups (resend_contact_sync_status, welcome_email_status)
  where resend_contact_sync_status in ('pending', 'failed_retryable', 'missing_config')
     or welcome_email_status in ('pending', 'failed_retryable', 'missing_config');

alter table public.waitlist_signups enable row level security;

revoke all on table public.waitlist_signups from anon, authenticated;
revoke all on table public.waitlist_signups from public;
