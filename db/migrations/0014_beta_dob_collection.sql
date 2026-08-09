-- First-party DOB capture for the 13+ Early Access Beta gate.
-- This stores the captured date only; it does not add KYC, geolocation,
-- paid-entry approval, payments, withdrawals, or broader compliance behavior.

alter table if exists public.profiles
  add column if not exists date_of_birth date;
