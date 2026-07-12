# MVP QA Test Plan + Acceptance Criteria

## Purpose
Define the MVP QA test plan, acceptance criteria, and critical pass/fail checks for PickRank before beta and public real-money launch.

## Status
Locked for MVP direction.

## Anchor
MVP QA must verify the full contest loop from account creation through contest entry, lineup save, lock, cancellation, scoring, tied rankings, refunds, payouts, wallet ledger reconciliation, eligibility gates, and final results reveal before beta or real-money launch.

---

## Summary
PickRank QA should focus on correctness, money safety, contest integrity, and user trust.

The highest-risk areas are:

- duplicate contest entries
- payment without entry creation
- entry creation without payment
- lineup edits after lock
- incorrect scoring
- incorrect tie handling
- duplicate refunds
- duplicate payouts
- wallet balance mismatch
- ineligible users entering paid contests
- wrong contest lifecycle state

---

## QA Levels

MVP testing should include:

1. Unit tests
2. Integration tests
3. End-to-end tests
4. Manual QA scenarios
5. Simulation contests
6. Pre-launch checklist

---

## Test Environments

Recommended environments:

```text
local
staging
production
```

### Local
Used for development and unit/integration tests.

### Staging
Used for full contest simulations, provider sandbox testing, payment sandbox testing, and QA signoff.

### Production
Only after launch gates are complete.

---

## Global Acceptance Criteria

MVP is not ready for beta unless:

- user can create account and log in
- admin can create and publish contest
- user can enter contest
- user can save lineup
- contest locks correctly
- contest cancels if below minimum entries
- viable contest finalizes correctly
- scoring matches expected results
- ties are handled correctly
- wallet ledger reconciles
- results reveal displays correct outcome
- final leaderboard displays correct ranks
- eligibility gates block ineligible users
- no duplicate entry/refund/payout scenarios occur

MVP is not ready for public real-money launch unless beta acceptance criteria pass and all legal/payment/provider launch gates are complete.

---

## 1. Account + Auth Tests

## Test: User can sign up

### Steps
1. Open app as logged-out user.
2. Start sign-up flow.
3. Enter email/auth credentials.
4. Choose username/display name.
5. Accept terms/privacy.
6. Complete age confirmation placeholder.

### Expected result

- account is created
- user is logged in
- user profile exists
- username/display name is saved
- account status is `active`

### Acceptance criteria

```text
PASS if new user can create account and Profile displays correct account data.
FAIL if user account is missing required profile fields.
```

---

## Test: Email verification blocks paid entry

### Steps
1. Create user with unverified email.
2. Attempt to enter open paid contest.

### Expected result

- entry is blocked
- payment review is not shown
- copy appears: `Verify your email to enter contests.`

### Acceptance criteria

```text
PASS if unverified user cannot enter paid contest.
FAIL if entry/payment flow is accessible before email verification.
```

---

## Test: Duplicate username blocked

### Steps
1. Create user with username `QBWizard`.
2. Create second user.
3. Attempt to use username `QBWizard`.

### Expected result

- second user cannot use duplicate username
- clear error is shown

### Acceptance criteria

```text
PASS if usernames are unique.
FAIL if duplicate public usernames can exist.
```

---

## 2. Contest Admin Setup Tests

## Test: Admin can create draft contest

### Steps
1. Log in as admin.
2. Open admin contest screen.
3. Create contest.
4. Enter title, season, week, stat type, slate size.

### Expected result

- contest is created in `draft`
- contest is not visible in public lobby

### Acceptance criteria

```text
PASS if draft contest exists internally and remains hidden publicly.
FAIL if draft contest appears in lobby.
```

---

## Test: Invalid contest cannot publish

### Steps
1. Create draft contest.
2. Add fewer than 15 QBs.
3. Attempt to publish.

### Expected result

- publish is blocked
- validation error explains missing slate requirement

### Acceptance criteria

```text
PASS if publish is blocked for invalid slate.
FAIL if invalid contest can publish.
```

---

## Test: Valid contest publishes

### Steps
1. Create valid contest with 15 QBs.
2. Add provider IDs and game IDs.
3. Set entry fee.
4. Set lock time.
5. Validate contest.
6. Publish.

### Expected result

- validation passes
- contest moves to `scheduled` or `open`
- contest appears in public lobby when visible

### Acceptance criteria

```text
PASS if valid contest can publish and appears correctly.
FAIL if valid contest cannot publish or appears with incorrect data.
```

---

## 3. Contest Lobby + Detail Tests

## Test: Logged-out user can browse contests

### Steps
1. Open app while logged out.
2. View Contests tab.
3. Open contest detail.

### Expected result

- contest lobby loads
- contest detail opens
- paid entry CTA prompts login/auth

### Acceptance criteria

```text
PASS if browsing works without auth and paid entry requires auth.
FAIL if logged-out user can access paid entry flow.
```

---

## Test: Contest states display correctly

### Steps
1. Create contests in scheduled, open, locked, canceled, live, final, paid_out.
2. View lobby and contest detail.

### Expected result

- each state displays correct status copy and CTA

### Acceptance criteria

```text
PASS if state labels and CTAs match contest status.
FAIL if user sees wrong action for contest state.
```

---

## 4. Entry + Payment Flow Tests

## Test: Eligible user can enter open contest

### Steps
1. Log in as eligible verified user.
2. Open an `open` contest.
3. Tap Enter Contest.
4. Confirm entry using test/free entry mode or sandbox payment.

### Expected result

- entry is created once
- default randomized lineup is created
- user routes to lineup builder
- contest entry count increments

### Acceptance criteria

```text
PASS if entry and default lineup are created exactly once.
FAIL if entry is duplicated, missing, or created without successful payment/test confirmation.
```

---

## Test: Duplicate entry blocked

### Steps
1. User enters contest.
2. User attempts to enter same contest again.

### Expected result

- second entry is blocked
- CTA shows `Edit Lineup`
- backend unique constraint prevents duplicate entry

### Acceptance criteria

```text
PASS if user cannot create a second entry for same contest.
FAIL if duplicate entries are possible.
```

---

## Test: Contest lock blocks entry

### Steps
1. Open contest detail before lock.
2. Let contest move to `locked`.
3. Attempt to confirm entry/payment.

### Expected result

- entry/payment blocked
- no funds captured
- no entry created
- copy says contest is locked

### Acceptance criteria

```text
PASS if backend blocks entry after lock even if frontend was already open.
FAIL if user can enter after lock.
```

---

## Test: Payment failure does not create entry

### Steps
1. Trigger sandbox payment failure.
2. Attempt contest entry.

### Expected result

- payment failure message shown
- no entry created
- no lineup created
- no entry count increment

### Acceptance criteria

```text
PASS if failed payment creates no entry or lineup.
FAIL if failed payment creates any contest entry state.
```

---

## 5. Lineup Builder Tests

## Test: Default lineup exists immediately after entry

### Steps
1. Enter contest.
2. Open lineup builder.

### Expected result

- lineup has 10 selected QBs from the 15-QB slate
- no duplicates
- no missing players
- lineup source is `randomized_default`

### Acceptance criteria

```text
PASS if default lineup is complete and valid.
FAIL if lineup is missing, duplicated, or empty.
```

---

## Test: User can reorder and save lineup

### Steps
1. Open lineup builder.
2. Drag players into new order.
3. Save lineup.

### Expected result

- lineup saves successfully
- confirmation appears
- lineup source updates to `user_saved`
- saved order persists after reload

### Acceptance criteria

```text
PASS if saved lineup persists exactly.
FAIL if order changes, save fails, or duplicates appear.
```

---

## Test: Lineup edit blocked after lock

### Steps
1. Save lineup before lock.
2. Move contest to `locked`.
3. Attempt to edit/save lineup.

### Expected result

- lineup is read-only
- save is blocked server-side
- copy says contest locked

### Acceptance criteria

```text
PASS if locked contest prevents lineup edits server-side.
FAIL if lineup can be changed after lock.
```

---

## Test: User who never edits keeps default lineup

### Steps
1. Enter contest.
2. Do not edit lineup.
3. Let contest lock.

### Expected result

- randomized default lineup becomes final lineup
- user remains valid entry

### Acceptance criteria

```text
PASS if default lineup is submitted at lock.
FAIL if unedited lineup causes invalid or missing entry.
```

---

## 6. Contest Lifecycle Tests

## Test: Contest with fewer than 4 entries cancels

### Steps
1. Create open contest.
2. Add 3 paid/test entries.
3. Let lock time pass.

### Expected result

- contest moves to `canceled`
- leaderboard/results disabled
- site credit refunds triggered

### Acceptance criteria

```text
PASS if contest cancels and refunds are issued once.
FAIL if contest runs with fewer than 4 entries.
```

---

## Test: Contest with exactly 4 entries runs

### Steps
1. Create open contest.
2. Add exactly 4 paid/test entries.
3. Let lock time pass.

### Expected result

- contest moves to `live`
- lineups lock
- scoring can occur after stats final

### Acceptance criteria

```text
PASS if contest runs with exactly 4 paid entries.
FAIL if contest incorrectly cancels.
```

---

## Test: State transition events logged

### Steps
1. Move contest through draft → open → locked → live → finalizing → final.
2. Check state events.

### Expected result

- each transition logged with from/to status and timestamp

### Acceptance criteria

```text
PASS if contest state history is auditable.
FAIL if transitions occur without event logs.
```

---

## 7. Scoring Tests

## Test: Exact rank scoring

### Setup
User ranks all QBs exactly correctly.

### Expected result

- each player earns 0 points
- total score = 0

### Acceptance criteria

```text
PASS if exact lineup receives a zero-difference score.
FAIL if any exact placement receives more than 0 points.
```

---

## Test: Distance scoring table

### Setup
Create lineup with players 0, 1, 2, 3, and 4+ spots away from actual rank.

### Expected result

```text
0 distance = 0 points
1 distance = 1 point
2 distance = 2 points
3 distance = 3 points
4+ distance = actual miss distance
```

### Acceptance criteria

```text
PASS if all distance scores match scoring table.
FAIL if any distance maps to wrong point value.
```

---

## Test: Player stat tie rank range scoring

### Setup
Two QBs tie for 2nd with same passing yards.

Actual rank range for both:

```text
2-3
```

### Expected result

- user placing either tied QB 2nd gets distance 0
- user placing either tied QB 3rd gets distance 0
- user placing tied QB 1st gets distance 1
- user placing tied QB 4th gets distance 1

### Acceptance criteria

```text
PASS if tied QB rank range scoring works.
FAIL if tied players are forced into arbitrary single rank.
```

---

## Test: DNP / zero-yard players remain in slate

### Setup
One or more QBs record 0 passing yards.

### Expected result

- players remain in final ranking
- multiple zero-yard players tie using rank range
- scoring uses tied range logic

### Acceptance criteria

```text
PASS if DNP/zero-yard players are scored correctly.
FAIL if players are removed or replaced after contest opens.
```

---

## 8. Entry Score Tie + Payout Tests

## Test: Leaderboard tiebreakers resolve equal total scores

### Setup
Two entries finish with the same total score.

### Expected result

- entry with more exact picks ranks higher
- if exact picks are equal, entry with more one-off-or-better picks ranks higher
- if both are still equal, entry with closer placement of the actual QB1 ranks higher
- if entries are still equal after that, compare passing touchdowns from the user's selected QB1, then QB2, QB3, QB4, and QB5 in order
- only entries still equal after that full tree remain tied

### Acceptance criteria

```text
PASS if equal total scores use the locked scoring tiebreakers before payout split logic.
FAIL if standings skip those tiebreakers or use an arbitrary fallback first.
```

## Test: Two-way tie for first

### Setup
Two entries finish tied for 1st.

Payouts:

```text
1st = $100
2nd = $60
3rd = $40
```

### Expected result

- both entries show `T-1`
- first and second prizes pool to `$160`
- each tied entry receives `$80`
- next entry is rank 3

### Acceptance criteria

```text
PASS if pooled payout split is correct.
FAIL if arbitrary tiebreaker is applied.
```

---

## Test: Tie crosses payout cutoff

### Setup
Top 3 pays. Two entries tie for 3rd.

### Expected result

- tied entries show `T-3`
- only 3rd prize is pooled
- both tied entries split 3rd prize

### Acceptance criteria

```text
PASS if cutoff tie splits only remaining paid slots.
FAIL if extra prize pool money is created or unpaid tied entries are excluded unfairly.
```

---

## Test: Rounding leftover cents

### Setup
Payout pool does not divide evenly by tied entries.

### Expected result

- base payout rounded down
- leftover cents distributed by lowest `entry_id`
- total distributed equals available payout pool

### Acceptance criteria

```text
PASS if payout rounding is deterministic and exact.
FAIL if total payout is over/under-distributed.
```

---

## 9. Wallet + Ledger Tests

## Test: Canceled contest refunds site credit

### Steps
1. User enters contest.
2. Contest cancels below minimum entry count.

### Expected result

- user receives site credit equal to entry fee
- ledger transaction created
- refund runs once

### Acceptance criteria

```text
PASS if site credit refund is correct and idempotent.
FAIL if refund is duplicated, missing, or credited to wrong balance type.
```

---

## Test: Contest winnings credit cash balance

### Steps
1. Finalize contest with winning user.
2. Run payout job.

### Expected result

- winnings added to cash balance
- ledger transaction created
- payout status updates to paid

### Acceptance criteria

```text
PASS if winnings credit cash balance exactly once.
FAIL if payout duplicates, fails silently, or credits site credit.
```

---

## Test: Wallet balance reconciles to ledger

### Steps
1. Create series of entry debits, refunds, and payouts.
2. Compare wallet balance to ledger sum.

### Expected result

- wallet balance equals ledger-derived balance

### Acceptance criteria

```text
PASS if ledger and wallet balance reconcile.
FAIL if displayed balance differs from ledger total.
```

---

## 10. Eligibility + Compliance Tests

## Test: Blocked jurisdiction cannot enter

### Steps
1. Set user jurisdiction to blocked.
2. Attempt paid entry.

### Expected result

- entry blocked
- payment review not shown
- eligibility event logged

### Acceptance criteria

```text
PASS if blocked jurisdiction cannot enter.
FAIL if blocked user reaches paid entry/payment.
```

---

## Test: Unknown jurisdiction cannot enter

### Steps
1. Set user jurisdiction to unknown.
2. Attempt paid entry.

### Expected result

- entry blocked
- user prompted to confirm location

### Acceptance criteria

```text
PASS if unknown jurisdiction blocks paid entry.
FAIL if unknown user can enter.
```

---

## Test: Restricted account cannot enter

### Steps
1. Set account status to restricted.
2. Attempt paid entry.

### Expected result

- entry blocked
- user sees restriction copy

### Acceptance criteria

```text
PASS if restricted account cannot enter paid contest.
FAIL if restricted user can enter.
```

---

## 11. Results Reveal + Leaderboard Tests

## Test: Results reveal shows final user outcome

### Steps
1. Finalize contest.
2. User opens results.

### Expected result

- final score displays
- final rank displays
- winnings display if applicable
- player-by-player breakdown displays

### Acceptance criteria

```text
PASS if results reveal matches persisted scoring result.
FAIL if results reveal recalculates differently or displays stale data.
```

---

## Test: Final leaderboard displays correct ranks

### Steps
1. Finalize contest with tied and untied entries.
2. Open final leaderboard.

### Expected result

- ranks display correctly
- tied ranks use `T-`
- user row highlights if applicable
- payout amounts display for paid positions

### Acceptance criteria

```text
PASS if leaderboard reflects persisted final standings.
FAIL if leaderboard order/rank differs from scoring result.
```

---

## 12. Provider / Stat Finalization Tests

## Test: Missing provider stat blocks finalization

### Steps
1. Finalize contest with missing stat for one slate player.

### Expected result

- contest does not move to final
- finalization is blocked or moves to error review
- user-facing under-review copy appears

### Acceptance criteria

```text
PASS if missing stat prevents final scoring.
FAIL if scoring finalizes with incomplete provider data.
```

---

## Test: Stat correction before payout updates results

### Steps
1. Finalize contest.
2. Apply stat correction before payout window closes.
3. Re-run scoring.

### Expected result

- corrected stats are used
- scores/ranks/payouts update
- payout does not happen until corrected final state

### Acceptance criteria

```text
PASS if pre-payout stat correction is handled safely.
FAIL if payout uses stale stats.
```

---

## 13. Critical Regression Suite

Run before every beta release:

- sign up/login
- admin contest publish
- contest lobby loads
- contest entry succeeds
- duplicate entry blocked
- lineup save succeeds
- lock blocks lineup edits
- below-minimum contest cancels
- exact-minimum contest runs
- scoring table correct
- player stat tie scoring correct
- entry tie payout split correct
- canceled contest refund correct
- payout correct
- wallet ledger reconciles
- blocked jurisdiction blocks entry
- results reveal correct
- final leaderboard correct

---

## Real-Money Launch Acceptance Criteria

Before public real-money launch:

- beta QA passes
- payment sandbox tests pass
- withdrawal sandbox tests pass
- provider stat ingestion passes
- state-by-state legal/payment review complete
- eligible jurisdictions configured
- Terms/Privacy reviewed
- responsible play copy live
- KYC/withdrawal rules configured
- eligibility checks server-side
- payment capture idempotent
- refund idempotent
- payout idempotent
- wallet ledger reconciles
- migrations `0001` through the current payment/wallet migration apply cleanly to a disposable database
- existing `db/tests/0010_entry_integrity_hardening.sql` protections still pass
- paid-entry creation and cancellation database tests prove ownership enforcement, payment/refund coupling, atomic rollback, idempotent retries, contest-state cutoffs, and entry/lineup/count/ledger reconciliation
- support process defined

---

## MVP Pass/Fail Rule

If a test affects money movement, entry ownership, lineup lock, scoring, payout, refund, or eligibility, a failure is launch-blocking.

Do not launch around those failures.

---

## Next Recommended Spec

After this QA plan, define:

```text
MVP Open Questions + Decision Log
```

That should collect unresolved choices like payment provider, sports data provider, auth provider, legal jurisdictions, KYC provider, withdrawal model, and production launch constraints.
