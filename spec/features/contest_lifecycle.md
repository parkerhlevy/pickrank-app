# Contest State Machine + Lifecycle System

## Purpose
Define the full contest lifecycle for PickRank, including contest creation, opening, entry, lock, cancellation, live state, finalization, payouts, and end-of-loop behavior.

## Status
Locked for MVP.

## Anchor
MVP contest lifecycle uses explicit contest states from draft through paid out, validates contest viability at lock, cancels contests below the minimum entry threshold with site credit refunds, prevents entries after lock, suppresses live scoring during games, finalizes results only after all slate games are complete, and pays winnings to cash balance after final standings are locked.

---

## Summary
The contest lifecycle is the operational backbone of PickRank.

Every contest should always be in one clear state.

Contest state controls:

- whether users can enter
- whether users can edit lineups
- whether the contest is visible
- whether the leaderboard is available
- whether results can be shown
- whether refunds or payouts should run

---

## Contest States

MVP contest states:

```text
draft
scheduled
open
locked
canceled
live
finalizing
final
paid_out
```

Optional internal/error state:

```text
error_review
```

---

## State Definitions

## 1. draft
Contest exists internally but is not publicly visible.

Used for:

- admin setup
- slate configuration
- entry fee setup
- payout configuration
- lock time setup
- QA review

User-facing behavior:

- not visible in lobby
- cannot be entered
- no leaderboard
- no results

Allowed next states:

- `scheduled`

---

## 2. scheduled
Contest is configured and ready but not yet accepting entries.

Used when contests are visible before entry opens, if needed.

User-facing behavior:

- may be visible in lobby
- shows upcoming status
- cannot be entered yet
- no lineup builder access

Allowed next states:

- `open`
- `draft`, if unpublished before entries open

MVP note:

Scheduled state is optional in UI but useful in backend.

---

## 3. open
Contest is accepting paid entries.

User-facing behavior:

- visible in lobby
- entry CTA active
- prize pool visible
- entry count visible
- entered users can build/edit lineup
- unentered users cannot see slate

Entry behavior:

- user confirms entry payment
- entry is created only after successful payment
- randomized default lineup is assigned at entry
- user can edit and save lineup until lock

Allowed next states:

- `locked`
- `canceled`, only for admin/system issue before lock

---

## 4. locked
Contest is no longer accepting entries or lineup edits.

Trigger:

- lock time is reached

Backend actions at lock:

1. prevent new entries
2. prevent lineup edits
3. verify contest viability
4. if entries are below minimum threshold, transition to `canceled`
5. if viable, transition to `live`

User-facing behavior:

- entered users see read-only lineup
- unentered users cannot enter
- lineup editing disabled

Allowed next states:

- `live`
- `canceled`
- `error_review`

---

## 5. canceled
Contest will not be scored.

Primary MVP cancellation trigger:

- fewer than 4 paid entries at lock time

Other possible cancellation triggers:

- invalid slate
- major data/provider issue
- contest setup error
- legal/compliance issue

Backend actions:

1. mark contest canceled
2. disable leaderboard
3. disable lineup editing
4. issue site credit refunds for all paid entries
5. create refund ledger entries
6. notify affected users

User-facing behavior:

- contest card shows `Canceled`
- no live leaderboard
- no results reveal
- message explains entry fee was returned as site credit

Allowed next states:

- terminal state for MVP

---

## 6. live
Contest is active and games are underway or waiting for slate games to complete.

Trigger:

- contest passes lock-time viability check

User-facing behavior:

- read-only lineup available
- player status may show upcoming / in progress / final
- no live scoring during games
- no partial totals
- leaderboard may show locked/static state only if needed, but not live score changes

Backend behavior:

- ingest player stats/results as games complete
- track slate completion
- do not finalize leaderboard until all relevant player results are final

Allowed next states:

- `finalizing`
- `error_review`

---

## 7. finalizing
Contest games are complete and backend is calculating final results.

Trigger:

- all slate players have final stats
- all final ranks can be calculated

Backend actions:

1. finalize player stat results
2. calculate actual final ranks
3. score each entry
4. sort leaderboard
5. apply tie handling
6. calculate payouts
7. persist final standings and payout amounts
8. verify payout total does not exceed prize pool

User-facing behavior:

- show processing state if user opens contest
- no payout shown until finalization succeeds

Example copy:

```text
Final results are being calculated.
Check back shortly.
```

Allowed next states:

- `final`
- `error_review`

---

## 8. final
Contest standings are complete and visible.

Trigger:

- scoring complete
- leaderboard finalized
- tie handling finalized
- payout amounts calculated

User-facing behavior:

- results reveal available
- final leaderboard available
- user sees final position, score, and winnings if applicable

Backend behavior:

- payout amounts are ready but not necessarily credited yet

Allowed next states:

- `paid_out`
- `error_review`

---

## 9. paid_out
Contest payouts have been credited to winning users' cash balances.

Trigger:

- payout process completes successfully

Backend actions:

1. credit winning users' cash balances
2. create payout ledger entries
3. mark payouts as complete
4. prevent duplicate payout processing

User-facing behavior:

- winnings message visible for winners
- wallet cash balance reflects payout
- final contest remains viewable historically

Allowed next states:

- terminal state for MVP

---

## 10. error_review
Internal exception state requiring manual/admin review.

Used when:

- scoring data conflict occurs
- payout calculation fails
- payment/refund processing error occurs
- external data provider issue occurs
- state transition fails unexpectedly

User-facing behavior:

Avoid technical language.

Example copy:

```text
Contest results are under review.
```

Backend/admin behavior:

- block payouts until resolved
- preserve all ledger/state history
- allow manual resolution to appropriate next state

Allowed next states:

- `canceled`
- `live`
- `finalizing`
- `final`
- `paid_out`

---

## State Transition Table

| Current State | Trigger | Next State |
|---|---|---|
| draft | Admin publishes contest | scheduled |
| scheduled | Entry window opens | open |
| open | Lock time reached | locked |
| locked | Minimum entries not met | canceled |
| locked | Minimum entries met | live |
| live | All slate results final | finalizing |
| finalizing | Scoring + payout calculation succeeds | final |
| final | Cash payouts credited | paid_out |
| any active state | Critical exception | error_review |

---

## State-Based Permissions

| State | Visible in Lobby | Can Enter | Can Edit Lineup | Can View Lineup | Leaderboard | Results Reveal | Wallet Action |
|---|---:|---:|---:|---:|---:|---:|---|
| draft | No | No | No | No | No | No | None |
| scheduled | Optional | No | No | No | No | No | None |
| open | Yes | Yes | Yes, if entered | Yes, if entered | No | No | Entry payment |
| locked | Yes | No | No | Yes, if entered | Limited/read-only | No | None |
| canceled | Yes/history | No | No | Yes, if entered | No | No | Site credit refund |
| live | Yes | No | No | Yes, if entered | No live scoring | No | None |
| finalizing | Yes/history | No | No | Yes, if entered | Processing | Processing | None |
| final | Yes/history | No | No | Yes, if entered | Final | Yes | Payout pending |
| paid_out | Yes/history | No | No | Yes, if entered | Final | Yes | Cash payout complete |
| error_review | Yes/history | No | No | Yes, if entered | Under review | Under review | Blocked |

---

## Contest Lock Rules

At lock time, system must:

1. close entry window
2. block all new payment sessions
3. block all lineup edits
4. preserve each user's latest saved lineup
5. submit randomized default lineup for users who never edited
6. count paid entries
7. check minimum viability threshold

Minimum viability threshold:

```text
min_entries_to_run = 4
```

If paid entries are fewer than 4:

- contest transitions to `canceled`
- site credit refunds are issued

If paid entries are 4 or more:

- contest transitions to `live`

---

## Payment + Entry State Interaction

Entry creation is only allowed while contest state is `open`.

Before finalizing payment, backend must re-check:

- contest state is still `open`
- current time is before lock time
- user does not already have an entry
- full entry fee is covered

If any check fails:

- payment should not be captured
- entry should not be created
- lineup should not be assigned

---

## Lineup State Interaction

Users may edit lineup only when:

- contest state is `open`
- user has paid entry
- current time is before lock time

At lock:

- latest saved lineup becomes final
- if user never edited, randomized default lineup remains final

---

## Leaderboard State Interaction

MVP does not show live scoring during games.

Leaderboard behavior by state:

- `open`: unavailable
- `locked`: unavailable or placeholder
- `live`: no live scoring or partial totals
- `finalizing`: processing state
- `final`: final leaderboard visible
- `paid_out`: final leaderboard visible with payout context
- `canceled`: unavailable

---

## Results Reveal State Interaction

Results Reveal is available only in:

- `final`
- `paid_out`

Do not show Results Reveal in:

- `open`
- `locked`
- `canceled`
- `live`
- `finalizing`
- `error_review`

---

## Refund Lifecycle

Refunds only apply to canceled contests.

Canceled contest refund flow:

1. contest transitions to `canceled`
2. system finds all paid entries
3. system credits each user site credit equal to entry fee
4. system writes refund ledger transaction
5. user receives notification

Refunds must be idempotent.

Do not issue duplicate refunds for the same entry.

---

## Payout Lifecycle

Payouts apply after contest is final.

Payout flow:

1. contest transitions to `final`
2. payout amounts are verified
3. winning users receive cash balance credit
4. payout ledger transactions are created
5. contest transitions to `paid_out`

Payouts must be idempotent.

Do not issue duplicate payouts for the same entry.

---

## Data Model Additions

### Contest
Recommended fields:

- `contest_id`
- `contest_status`
- `entry_open_time`
- `lock_time`
- `finalized_at`
- `paid_out_at`
- `canceled_at`
- `cancel_reason`
- `min_entries_to_run`
- `entries_count`
- `paid_entries_count`
- `prize_pool`
- `platform_fee_amount`
- `state_version`
- `created_at`
- `updated_at`

### Contest State Event
Recommended fields:

- `event_id`
- `contest_id`
- `from_status`
- `to_status`
- `trigger`
- `created_at`
- `metadata`

### Entry
Recommended lifecycle fields:

- `entry_id`
- `contest_id`
- `user_id`
- `entry_status`
- `payment_status`
- `lineup_status`
- `created_at`
- `locked_at`
- `score_finalized_at`
- `payout_status`

---

## Required Safeguards

- State transitions should be validated server-side.
- State changes should be recorded as events.
- Payment capture and entry creation must be atomic.
- Refunds must be idempotent.
- Payouts must be idempotent.
- Contest cannot move to `paid_out` unless it first reaches `final`.
- Contest cannot move to `final` unless all slate results are complete.
- Contest cannot move to `live` unless minimum entries are met.
- Contest cannot accept entries unless state is `open`.

---

## User-Facing Copy

### Scheduled
```text
Contest opens soon.
```

### Open
```text
Enter Contest
```

### Locked
```text
Contest locked. Lineups can no longer be edited.
```

### Canceled
```text
This contest did not reach the minimum number of entries and was canceled. Your entry fee has been returned as site credit.
```

### Live
```text
Contest is underway. Final results will be available after all games are complete.
```

### Finalizing
```text
Final results are being calculated.
```

### Final / Paid Out
```text
Final results are ready.
```

### Error Review
```text
Contest results are under review.
```

---

## MVP Constraints

Build for MVP:

- explicit contest status field
- state transition validation
- lock-time viability check
- canceled contest refund trigger
- live state with no live scoring display
- finalizing state
- final results state
- payout completion state
- contest state event logging

Do not build for MVP:

- admin replay UI
- automated dispute workflow
- advanced manual correction tooling
- live scoring leaderboard
- partial results reveal
- contest reopening after cancellation
- multi-entry lifecycle complexity

---

## Future Expansion

Potential future additions:

- admin lifecycle dashboard
- manual contest correction workflow
- dispute resolution tooling
- contest replay/audit viewer
- live scoring leaderboard
- private contest lifecycle variants
- guaranteed prize pool cancellation rules
- multi-entry support
- state-specific push notification preferences
