# MVP Data Model + Backend Architecture Requirements

## Purpose
Define the MVP backend architecture, core data objects, service boundaries, state management, wallet ledger model, scoring dependencies, and operational safeguards for PickRank.

## Status
Locked for MVP direction.

## Anchor
MVP backend architecture uses server-authoritative contest state, user eligibility checks, atomic entry/payment creation, append-only wallet ledger events, frozen contest slates, persisted scoring results, idempotent refunds/payouts, and clear service boundaries for contests, entries, scoring, payments, wallet, stats, admin, and compliance.

---

## Summary
PickRank's backend must be built around correctness, auditability, and state safety.

The highest-risk areas are:

- paid entry creation
- contest lock timing
- lineup finalization
- contest cancellation/refunds
- scoring finalization
- wallet balance updates
- payouts
- eligibility enforcement

Frontend should never be the source of truth for paid contest actions.

---

## Architecture Principles

MVP backend should follow these principles:

- server-authoritative contest states
- server-side eligibility checks
- atomic entry + payment creation
- append-only wallet ledger
- idempotent payments, refunds, and payouts
- immutable finalized contest results
- frozen contest slate after publish/entry
- auditable state transitions
- provider IDs stored for stats/payment/KYC integrations
- no hidden scoring logic in frontend

---

## Core Services

Recommended MVP service boundaries:

```text
Auth / User Service
Eligibility Service
Contest Service
Admin Contest Service
Entry Service
Lineup Service
Payment Service
Wallet Service
Stats Provider Service
Scoring Service
Leaderboard Service
Notification Service
Audit / Event Service
```

These can be implemented in one backend app for MVP. They do not need to be separate microservices.

---

## Auth / User Service

Responsible for:

- user creation
- login/session handling
- email verification status
- username/display name
- account status
- user preferences

Source spec:

```text
/spec/features/account_profile_auth.md
```

### User table

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | primary key |
| email | string | unique |
| email_verified | boolean | required before paid entry |
| username | string | unique/public |
| display_name | string | public display |
| date_of_birth | date/null | depends on auth/legal flow |
| age_confirmed | boolean | placeholder acceptable for early MVP |
| terms_accepted_at | timestamp/null | required before paid entry |
| privacy_policy_accepted_at | timestamp/null | required before paid entry |
| account_status | enum | active/restricted/suspended/closed |
| created_at | timestamp |  |
| updated_at | timestamp |  |
| last_login_at | timestamp/null |  |

### User preferences table

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | primary key / FK |
| email_notifications_enabled | boolean |  |
| push_notifications_enabled | boolean |  |
| lineup_reminders_enabled | boolean |  |
| marketing_emails_enabled | boolean |  |
| updated_at | timestamp |  |

---

## Eligibility Service

Responsible for:

- age eligibility
- jurisdiction eligibility
- KYC status
- self-exclusion status
- account restriction checks
- paid entry permission checks
- withdrawal permission checks

Source spec:

```text
/spec/features/compliance_eligibility_responsible_play.md
```

### User eligibility table

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | primary key / FK |
| jurisdiction | string/null | state or jurisdiction code |
| eligibility_status | enum | eligible/blocked/unknown/pending_review |
| eligibility_checked_at | timestamp/null |  |
| age_gate_status | enum | unknown/confirmed/failed |
| kyc_status | enum | not_required/required/pending/verified/failed/expired |
| kyc_provider_id | string/null |  |
| restriction_reason | string/null |  |
| updated_at | timestamp |  |

### Jurisdiction rule table

| Field | Type | Notes |
|---|---|---|
| jurisdiction_code | string | primary key |
| paid_entry_status | enum | eligible/blocked/pending_review |
| withdrawal_status | enum | eligible/blocked/pending_review |
| minimum_age | integer | configurable |
| kyc_required_for_entry | boolean |  |
| kyc_required_for_withdrawal | boolean |  |
| notes | text/null |  |
| last_legal_review_at | timestamp/null |  |
| status | enum | active/inactive |

### Responsible play status table

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | primary key / FK |
| self_exclusion_status | enum | none/requested/active/expired |
| self_exclusion_started_at | timestamp/null |  |
| self_exclusion_ends_at | timestamp/null |  |
| entry_restriction_status | enum/null |  |
| restriction_reason | string/null |  |
| updated_at | timestamp |  |

---

## Contest Service

Responsible for:

- contest lifecycle state
- contest visibility
- entry window
- lock time
- viability rules
- contest cancellation
- final/paid_out status

Source specs:

```text
/spec/features/contest_lifecycle.md
/spec/features/contest_viability.md
```

### Contest table

| Field | Type | Notes |
|---|---|---|
| contest_id | uuid | primary key |
| contest_name | string | public |
| contest_description | text/null | public copy |
| season | integer | NFL season year |
| week | integer/string | NFL week |
| contest_type | enum | public_paid |
| stat_type | enum | qb_passing_yards for MVP |
| slate_size | integer | 20 for MVP |
| entry_fee | integer | cents |
| total_entry_fees | integer | cents, derived/persisted |
| platform_fee_percentage | decimal | 0.30 MVP |
| platform_fee_amount | integer | cents |
| prize_pool | integer | cents |
| payout_structure | json | Top 3 50/30/20 |
| entries_count | integer | all entries |
| paid_entries_count | integer | paid entries only |
| min_entries_to_run | integer | 4 MVP |
| contest_status | enum | draft/scheduled/open/locked/canceled/live/finalizing/final/paid_out/error_review |
| entry_open_time | timestamp |  |
| lock_time | timestamp |  |
| finalized_at | timestamp/null |  |
| paid_out_at | timestamp/null |  |
| canceled_at | timestamp/null |  |
| cancel_reason | string/null |  |
| visibility_status | enum | hidden/visible |
| is_featured | boolean | lobby control |
| display_order | integer/null | lobby ordering |
| state_version | integer | optimistic locking |
| created_by_admin_id | uuid/null |  |
| published_by_admin_id | uuid/null |  |
| published_at | timestamp/null |  |
| created_at | timestamp |  |
| updated_at | timestamp |  |

### Contest state event table

| Field | Type | Notes |
|---|---|---|
| event_id | uuid | primary key |
| contest_id | uuid | FK |
| from_status | enum/null |  |
| to_status | enum |  |
| trigger | string | lock_time/admin/system/scoring/payout |
| created_at | timestamp |  |
| metadata | json/null |  |

---

## Admin Contest Service

Responsible for:

- contest setup
- slate validation
- economics validation
- publish flow
- admin cancellation
- lobby controls

Source spec:

```text
/spec/features/contest_admin_setup.md
```

### Contest validation result table

| Field | Type | Notes |
|---|---|---|
| validation_id | uuid | primary key |
| contest_id | uuid | FK |
| status | enum | pass/fail/warning |
| errors | json | array |
| warnings | json | array |
| validated_at | timestamp |  |
| validated_by_admin_id | uuid/null |  |

---

## Contest Slate Service

Responsible for:

- slate player storage
- frozen slate after publish/entry
- player provider IDs
- game IDs
- opponent metadata

### Contest slate player table

| Field | Type | Notes |
|---|---|---|
| contest_slate_player_id | uuid | primary key |
| contest_id | uuid | FK |
| player_id | uuid | internal player ID |
| provider_player_id | string | required |
| provider_game_id | string | required |
| display_name | string |  |
| team_abbreviation | string |  |
| opponent_abbreviation | string |  |
| home_away | enum | home/away |
| game_start_time | timestamp |  |
| position | string | QB for MVP |
| sort_order_internal | integer/null | admin/internal only |
| created_at | timestamp |  |

### Player table

| Field | Type | Notes |
|---|---|---|
| player_id | uuid | primary key |
| provider_player_id | string | indexed |
| player_name | string |  |
| team_abbreviation | string |  |
| position | string |  |
| provider_team_id | string/null |  |
| active_status | string/null | if provider supplies |
| updated_at | timestamp |  |

---

## Entry Service

Responsible for:

- paid contest entry creation
- single-entry enforcement
- entry status
- payment status
- entry/payment linkage

Source specs:

```text
/spec/features/payment_wallet_ux.md
/spec/features/account_profile_auth.md
```

### Entry table

| Field | Type | Notes |
|---|---|---|
| entry_id | uuid | primary key |
| user_id | uuid | FK |
| contest_id | uuid | FK |
| entry_status | enum | active/canceled/finalized |
| payment_status | enum | pending/paid/failed/refunded |
| lineup_status | enum | default_saved/user_saved/locked |
| score | integer/null | final score |
| final_rank | integer/null |  |
| final_rank_display | string/null | e.g. T-2 |
| is_tied | boolean |  |
| tie_group_id | string/null |  |
| tie_group_size | integer/null |  |
| payout_amount | integer | cents |
| payout_status | enum | none/pending/paid/failed |
| created_at | timestamp |  |
| locked_at | timestamp/null |  |
| score_finalized_at | timestamp/null |  |

### Required constraint

```text
unique(user_id, contest_id)
```

MVP is single-entry per user per contest.

---

## Lineup Service

Responsible for:

- randomized/default lineup assignment
- lineup saves
- final lineup lock
- user edits before lock

Source spec:

```text
/spec/product_spec.md
```

### Entry lineup table

| Field | Type | Notes |
|---|---|---|
| entry_id | uuid | primary key / FK |
| contest_id | uuid | FK |
| user_id | uuid | FK |
| lineup_players | json | ordered list of player IDs |
| lineup_source | enum | randomized_default/user_saved |
| version | integer | increments on save |
| saved_at | timestamp |  |
| locked_at | timestamp/null |  |

### Optional lineup history table

Useful for audit/debugging, optional for strict MVP.

| Field | Type | Notes |
|---|---|---|
| lineup_history_id | uuid | primary key |
| entry_id | uuid | FK |
| lineup_players | json | ordered list |
| lineup_source | enum | randomized_default/user_saved |
| version | integer |  |
| created_at | timestamp |  |

---

## Payment Service

Responsible for:

- external payment sessions
- external payment capture
- idempotency keys
- entry/payment atomicity
- provider payment IDs

Source specs:

```text
/spec/features/payment_wallet_ux.md
/spec/features/wallet_site_credit.md
```

### Entry payment breakdown table

| Field | Type | Notes |
|---|---|---|
| entry_payment_id | uuid | primary key |
| entry_id | uuid | FK |
| user_id | uuid | FK |
| contest_id | uuid | FK |
| entry_fee | integer | cents |
| site_credit_used | integer | cents |
| cash_balance_used | integer | cents |
| external_payment_amount | integer | cents |
| external_payment_id | string/null | provider ID |
| idempotency_key | string | unique |
| payment_status | enum | pending/paid/failed/refunded |
| created_at | timestamp |  |
| updated_at | timestamp |  |

---

## Wallet Service

Responsible for:

- cash balance
- site credit balance
- ledger events
- contest payouts
- canceled-contest refunds
- withdrawal readiness

Source spec:

```text
/spec/features/wallet_site_credit.md
```

### Wallet balance table

| Field | Type | Notes |
|---|---|---|
| user_id | uuid | primary key / FK |
| cash_balance | integer | cents |
| site_credit_balance | integer | cents |
| updated_at | timestamp |  |

### Wallet ledger transaction table

| Field | Type | Notes |
|---|---|---|
| transaction_id | uuid | primary key |
| user_id | uuid | FK |
| transaction_type | enum | see below |
| balance_type | enum | cash/site_credit |
| amount | integer | cents; positive credit, negative debit |
| contest_id | uuid/null |  |
| entry_id | uuid/null |  |
| external_payment_id | string/null |  |
| external_payout_id | string/null |  |
| idempotency_key | string/null | unique where applicable |
| created_at | timestamp |  |
| metadata | json/null |  |

### Required transaction types

```text
entry_fee_site_credit_debit
entry_fee_cash_debit
entry_fee_external_payment
contest_payout
cash_withdrawal_requested
cash_withdrawal_completed
cash_withdrawal_failed
contest_canceled_refund
manual_adjustment
```

### Wallet rule
Wallet ledger should be append-only. Do not update old ledger rows to change history.

---

## Stats Provider Service

Responsible for:

- external provider stat ingestion
- player stat snapshots
- game final status
- stat correction check
- provider ID mapping

Source spec:

```text
/spec/features/stat_finalization.md
```

### Contest stat snapshot table

| Field | Type | Notes |
|---|---|---|
| snapshot_id | uuid | primary key |
| contest_id | uuid | FK |
| provider_name | string |  |
| provider_snapshot_time | timestamp |  |
| created_at | timestamp |  |
| status | enum | fetched/validated/failed |
| metadata | json/null |  |

### Player contest result table

| Field | Type | Notes |
|---|---|---|
| contest_id | uuid | composite key |
| player_id | uuid | composite key |
| provider_player_id | string |  |
| final_stat | integer | passing yards |
| actual_rank | integer | competition rank min |
| actual_rank_display | string | e.g. T-2 |
| actual_rank_min | integer |  |
| actual_rank_max | integer |  |
| game_id | string | provider game ID |
| game_status | string | final required |
| stat_finalized_at | timestamp |  |

### Stat correction event table

| Field | Type | Notes |
|---|---|---|
| event_id | uuid | primary key |
| contest_id | uuid | FK |
| player_id | uuid | FK |
| previous_stat | integer |  |
| corrected_stat | integer |  |
| previous_rank | string/int |  |
| corrected_rank | string/int |  |
| created_at | timestamp |  |
| source | string | provider/admin/system |
| metadata | json/null |  |

---

## Scoring Service

Responsible for:

- actual rank calculation
- tied player stat range scoring
- entry score calculation
- leaderboard sorting
- entry score tie grouping
- payout calculation

Source specs:

```text
/spec/features/stat_finalization.md
/spec/features/tie_handling.md
```

### Entry scoring result table

Optional if score fields on Entry are enough, but recommended for auditability.

| Field | Type | Notes |
|---|---|---|
| scoring_result_id | uuid | primary key |
| entry_id | uuid | FK |
| contest_id | uuid | FK |
| user_id | uuid | FK |
| total_score | integer |  |
| final_rank | integer |  |
| final_rank_display | string |  |
| is_tied | boolean |  |
| payout_amount | integer | cents |
| scoring_version | string |  |
| created_at | timestamp |  |

### Entry player score table

Recommended for Results Reveal.

| Field | Type | Notes |
|---|---|---|
| entry_player_score_id | uuid | primary key |
| entry_id | uuid | FK |
| contest_id | uuid | FK |
| player_id | uuid | FK |
| user_rank | integer |  |
| actual_rank_min | integer |  |
| actual_rank_max | integer |  |
| actual_rank_display | string |  |
| distance | integer |  |
| points_awarded | integer | 15/7/5/3/0 |
| created_at | timestamp |  |

---

## Leaderboard Service

Responsible for:

- final leaderboard retrieval
- current user row highlighting
- rank display
- payout display after final/paid_out

MVP does not support live scoring leaderboard.

Leaderboard can be generated from Entry or Entry Scoring Result after finalization.

---

## Notification Service

Responsible for:

- deadline reminders
- default-lineup reminders
- contest canceled notifications
- results ready notifications
- payout credited notifications

Notification implementation may be deferred, but event hooks should exist.

### Notification event table

Optional for strict MVP but recommended.

| Field | Type | Notes |
|---|---|---|
| notification_event_id | uuid | primary key |
| user_id | uuid | FK |
| contest_id | uuid/null |  |
| event_type | enum |  |
| status | enum | pending/sent/failed/skipped |
| created_at | timestamp |  |
| sent_at | timestamp/null |  |
| metadata | json/null |  |

---

## Audit / Event Service

Responsible for:

- contest state event logging
- eligibility event logging
- wallet ledger events
- payment/payout idempotency
- admin action logging

### Admin audit event table

| Field | Type | Notes |
|---|---|---|
| admin_event_id | uuid | primary key |
| admin_user_id | uuid |  |
| action_type | string |  |
| contest_id | uuid/null |  |
| user_id | uuid/null |  |
| created_at | timestamp |  |
| metadata | json/null |  |

---

## Critical Backend Flows

## 1. Enter Contest Flow

1. User taps Enter Contest.
2. Backend verifies contest state is `open`.
3. Backend verifies user eligibility.
4. Backend checks no existing `user_id + contest_id` entry.
5. Backend calculates funding breakdown.
6. Backend processes wallet debit and external payment if needed.
7. Backend creates Entry.
8. Backend creates default randomized lineup.
9. Backend writes payment breakdown.
10. Backend writes wallet ledger rows.
11. Backend increments contest entry counts.

This flow must be atomic.

---

## 2. Lock Contest Flow

1. Lock time reached.
2. Contest moves from `open` to `locked`.
3. Backend blocks entries and lineup edits.
4. Backend locks all current saved lineups.
5. Backend checks paid_entries_count.
6. If fewer than 4 paid entries, contest moves to `canceled`.
7. If 4 or more paid entries, contest moves to `live`.

---

## 3. Cancel Contest Refund Flow

1. Contest moves to `canceled`.
2. Backend finds all paid entries.
3. Backend credits site credit equal to entry fee.
4. Backend writes refund ledger rows.
5. Backend updates entry/payment status to refunded.
6. Backend prevents duplicate refunds via idempotency key.

---

## 4. Finalize Scoring Flow

1. All slate games are final.
2. Backend fetches provider final stats.
3. Backend validates stat data.
4. Backend creates stat snapshot.
5. Backend ranks players, including tied actual rank ranges.
6. Backend calculates entry player scores.
7. Backend calculates total entry scores.
8. Backend applies entry score tie handling.
9. Backend calculates payout amounts.
10. Backend persists scoring results.
11. Contest moves to `final`.

---

## 5. Payout Flow

1. Stat correction window closes.
2. Backend rechecks provider stats.
3. Backend recalculates if needed.
4. Backend verifies payouts do not exceed prize pool.
5. Backend credits winning users' cash balances.
6. Backend writes payout ledger rows.
7. Backend marks payout status paid.
8. Contest moves to `paid_out`.

Payouts must be idempotent.

---

## MVP API Surface

Recommended API groups:

```text
/auth
/users
/profile
/eligibility
/contests
/contests/:id
/contests/:id/entry
/entries/:id/lineup
/contests/:id/leaderboard
/contests/:id/results
/wallet
/admin/contests
/admin/contests/:id/validate
/admin/contests/:id/publish
```

Exact API design can happen during implementation.

---

## Required Safeguards

- Server validates every paid entry.
- Server validates every lineup save.
- Server validates contest lock before payment capture.
- Unique constraint prevents duplicate entries.
- Wallet balances cannot go below zero.
- Ledger rows are append-only.
- Refunds are idempotent.
- Payouts are idempotent.
- Contest state transitions are logged.
- Final scoring results are persisted.
- Payout totals cannot exceed prize pool.
- Paid-out contest results are immutable except manual `error_review` path.

---

## MVP Constraints

Build for MVP:

- core tables listed above
- server-side contest state enforcement
- server-side entry eligibility enforcement
- entry/payment atomicity
- append-only wallet ledger
- contest lock job
- contest finalization job
- payout job
- stat snapshot persistence
- scoring result persistence
- admin publish validation

Do not build for MVP:

- microservices
- event streaming infrastructure
- full admin analytics dashboard
- full transaction history UI
- advanced fraud ML
- multi-entry support
- live scoring pipeline
- real-time websocket leaderboard
- multi-stat contest framework beyond planned extension points

---

## Future Expansion

Potential future additions:

- separate worker queues for scoring/payment jobs
- event bus
- admin audit viewer
- data warehouse / analytics pipeline
- fraud/risk scoring
- live leaderboard infrastructure
- multi-entry contest support
- private leagues
- richer user performance history
- provider redundancy system
