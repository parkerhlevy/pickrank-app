-- Phase 0 seed placeholder.
-- Run manually in Supabase SQL editor after applying migrations if a test contest is needed.
-- This does not create real contest entry, scoring, wallet, or payment logic.

insert into public.contests (title, stat_type, slate_size, entry_fee_cents, lock_time, status)
values ('Week 1 QB Passing Yards', 'qb_passing_yards', 20, 0, now() + interval '7 days', 'draft');
