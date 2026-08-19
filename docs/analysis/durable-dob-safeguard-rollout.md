# Durable DOB Safeguard Rollout

## Scope

This slice makes `public.profiles.date_of_birth` the protected source of truth for the Early Access Beta 18+ gate.

It does not add identity verification, payments, KYC, geolocation, payouts, account deletion, or paid-entry enablement.

## Migration Plan

Do not apply `db/migrations/0015_durable_dob_safeguard.sql` to production without Parker's explicit approval.

1. Take a read-only baseline. Count profiles with a protected DOB, profiles without one, and legacy auth metadata DOB values that do not match the `YYYY-MM-DD` format.
2. Review the baseline with the operator. The migration uses an existing protected profile DOB first. It backfills only a missing protected DOB from valid legacy auth metadata. It leaves invalid or missing legacy values unset.
3. Apply the migration in an approved staging environment. Run `db/tests/0010_entry_integrity_hardening.sql` and `db/tests/0015_durable_dob_safeguard.sql` against a disposable reset database.
4. Confirm that the migration reports no unexpected failures. Review the counts again. Do not repair individual records with ad hoc SQL.
5. Obtain explicit approval before production application. Apply once through the approved migration tool. Do not run a separate production backfill script.
6. After application, use the read-only checks below. Accounts without a durable DOB remain unable to enter until they submit DOB through the protected capture flow.

## Read-Only Production Verification Plan

Do not submit profile forms, create entries, update records, apply migrations, or use disposable production accounts for this plan.

1. Confirm the migration version is recorded by the deployment or migration system.
2. Query schema metadata only. Confirm `profiles.dob_captured_at`, `capture_profile_date_of_birth`, `protect_profile_date_of_birth`, and `enforce_free_beta_entry_dob_eligibility` exist.
3. Read aggregate counts only:
   - profiles with `date_of_birth is not null`
   - profiles with `date_of_birth is null`
   - under-18 protected DOB profiles with `account_status = 'restricted'`, `eligibility_status = 'blocked'`, and `age_gate_status = 'blocked'`
   - `date_of_birth_change_attempted` events grouped by day
4. Confirm no audit-event metadata contains a `date_of_birth` key. Do not export DOB values or user-level event details.
5. Inspect deployed server source or release artifact. Confirm free-beta entry still reaches the shared server confirmation action and database `confirm_free_contest_entry` path.
6. Record the aggregate results, release identifier, query timestamps, and any count mismatch. Escalate mismatches for operator review. Do not alter records during verification.
