# Admin Evidence Dashboard

## Purpose

Give PickRank contest operators one protected workspace for routine contest, user, entry, board-history, scoring, eligibility, and evidence review without using the Supabase table editor.

Preserve an empirical record that can support later independent analysis of persistent user skill. The dashboard reports data quality. It does not make a legal conclusion.

## Approved First Release

Top-level workspaces:

```text
Overview
Contest Operations
Internal Eligibility
User Data
Evidence
```

Operators must be able to investigate in both directions:

```text
Contest -> entrants -> entries -> board versions -> scores
User -> contests -> entries -> board versions -> scores
```

User Data opens as an All users directory. Operators can browse without entering a search term. The directory shows total and filtered counts, account and eligibility status, recent activity, entry and revision counts, and evidence completeness. Search, operational filters, sorting, and 25-user pagination use URL parameters so an investigation can be linked and revisited.

The first release is evidence and visibility focused. Broad user editing, entry deletion, payment, wallet, KYC, paid-entry eligibility, and live legal skill claims are out of scope.

## Data Freshness and Scale Trigger

Every admin workspace page reads current server data when the route loads or refreshes. Show the UTC load time and a Refresh data control. Do not add background polling or a scheduled synchronization process for the first release.

The current broad request-time snapshot is acceptable during alpha. Schedule database-level filtering, pagination, and aggregate queries when any one of these triggers occurs:

- 500 registered accounts
- 25,000 immutable board revisions
- a seven-day admin-route p95 response time above two seconds

Complete the change before 1,000 registered accounts because the current Supabase Auth request reads one page of at most 1,000 users. The scaled design must paginate Supabase Auth users, move filtering and pagination into database queries, and calculate overview counts with database aggregates instead of loading full datasets into application memory.

## Immutable Board Evidence

Create one append-only board revision for:

- entry creation, including an empty free-beta board
- every explicit user save
- the board state at contest lock
- a later correction that references prior evidence
- one migration baseline for pre-existing boards

Each revision stores:

- entry, contest, and stable pseudonymous analysis subject
- revision number and prior revision
- server UTC timestamp
- event type and source
- ordered slate-player IDs
- idempotency key for explicit saves
- SHA-256 board hash

Do not collect unsaved drag-by-drag interactions.

Do not invent historical versions during migration. Label each pre-existing board `legacy_current_state` with `history_available=false`.

## Atomic Save Rule

An explicit save must use one server-authoritative database transaction that:

1. Verifies ownership, contest state, player count, uniqueness, and slate membership.
2. Inserts the immutable revision and ordered items.
3. Replaces the mutable current-board projection.
4. Advances the entry update timestamp.
5. Returns the committed revision and save time.

Direct authenticated writes to `entry_lineups` are not allowed after this migration.

## Lock Evidence

The free/test contest lock must atomically:

- snapshot every entry board, including incomplete boards
- save the locked ruleset and slate
- change the contest to `locked`
- append the contest lifecycle event
- append the admin audit event

## Sensitive Data and Audit

All `contest_operator` users may view complete profile data in this first release.

Append an admin audit event for:

- a direct sensitive user-record view
- a search by email or exact user ID
- a pseudonymous evidence export
- an identified evidence export
- future admin mutations

Identified exports require a written reason of at least 12 characters.

## Evidence Exports

Default exports use a stable analysis subject and omit direct user identity.

The package includes:

- manifest, generation time, dataset version, row counts, and payload checksum
- data dictionary
- contests and immutable rulesets
- entries and analysis subjects
- board revisions and ordered items
- provider stat snapshots and final player results
- entry scores, component scores, and scoring version

## Account Deletion Direction

Future account deletion should detach direct identity and retain approved pseudonymous contest evidence. This behavior requires counsel-approved retention language and privacy notice updates before production implementation.

Current evidence tables must avoid cascading deletion from authentication users or mutable contest rows.

## Analysis Boundary

Before full-season results are analyzed, an independent statistician should define:

- eligible cohorts and minimum participation
- first-half versus second-half persistence
- out-of-sample top-versus-bottom decile comparisons
- normalization across contest size and ruleset changes
- random-board or Monte Carlo chance benchmarks
- treatment of missing boards, ties, corrections, bots, duplicate accounts, and collusion
- confidence intervals and multiple-testing policy

The admin dashboard shows sample size and completeness only. Public, regulatory, processor, or legal claims require independent analysis and counsel review.

## Acceptance Criteria

- Every new explicit save has one immutable revision and one current-board update.
- A retried save with the same idempotency key creates no duplicate revision.
- Lock creates one evidence snapshot per entry.
- Operators can reach the same entry from a contest and from a user.
- User Data shows all users by default and supports search, status and evidence filters, sorting, totals, and pagination.
- Every admin workspace shows its UTC data-load time and can request fresh server data without a full browser reload.
- Non-operators cannot read admin evidence or exports.
- Default exports omit direct identity and include a checksum.
- Identified exports require a reason and create an audit event.
- Existing scoring, payments, wallet, KYC, and free-beta safeguards remain unchanged.
