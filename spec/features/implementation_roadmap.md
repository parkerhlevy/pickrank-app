# MVP Implementation Roadmap + Build Phases

## Purpose
Define the recommended MVP build order for PickRank, including implementation phases, dependencies, launch gates, and what should be built before real-money public launch.

## Status
Locked for MVP direction.

## Anchor
MVP implementation should start with app shell, auth, contest browsing, admin contest setup, entry/lineup mechanics, contest lifecycle, scoring/stat finalization, wallet ledger, and results reveal, while real-money payments, withdrawals, state eligibility, and compliance gates remain blocked until legal/payment-provider review is complete.

---

## Summary
PickRank should be built in phases.

The goal is to get a working playable product before introducing real-money complexity.

Recommended build strategy:

1. Build the game without real money first.
2. Add backend correctness and scoring.
3. Add wallet ledger and payment abstractions.
4. Add provider integrations.
5. Add real-money launch gates only after legal/payment review.

---

## Build Philosophy

MVP should prioritize:

- playable contest loop
- clear backend state model
- accurate scoring
- safe wallet ledger foundations
- admin ability to create contests
- simple user experience
- future-ready compliance hooks

MVP should avoid:

- overbuilt admin dashboards
- live scoring
- social features
- advanced analytics
- public real-money launch before legal/payment review
- custom payment infrastructure without provider support

---

## Phase 0: Project Foundation

## Goal
Prepare the repo/app foundation for implementation.

## Build

- app framework setup
- routing setup
- environment config
- database setup
- backend API setup
- shared types/constants
- basic UI component system
- auth provider decision placeholder
- deployment environments

## Key outputs

- app runs locally
- backend runs locally
- database connection works
- basic route shell exists
- staging/test environment plan exists

## Dependencies

None.

## Done when

- developer can run app locally
- frontend and backend can communicate
- database migrations can run
- basic health check endpoint exists

---

## Phase 1: App Shell + Navigation

## Goal
Create the MVP frontend structure.

## Build

- bottom tab navigation
- Home tab
- Contests tab
- Leaderboard tab placeholder
- Profile tab
- prominent How It Works access from major pages
- base route structure
- logged-out browsing state
- loading/error/empty states

## Source spec

```text
/spec/features/frontend_navigation.md
```

## Done when

- user can navigate between MVP tabs
- logged-out user can access Home, Contests, and How It Works
- Profile shows auth gate when logged out
- screen routing matches MVP route map

---

## Phase 2: Auth + User Profile Foundation

## Goal
Create accounts and identity required for contest entry.

## Build

- sign up/login flow
- email verification state
- username/display name
- terms/privacy acceptance fields
- age confirmation placeholder
- Profile screen
- logout
- user/account tables
- user preferences fields

## Source spec

```text
/spec/features/account_profile_auth.md
```

## Done when

- user can create account
- user can log in/out
- user has public username
- Profile shows user identity
- backend can identify authenticated user

---

## Phase 3: Contest Lobby + Contest Detail

## Goal
Let users browse contests before paid entry exists.

## Build

- contest list API
- contest detail API
- lobby UI
- featured contest display
- other contest cards
- contest detail screen
- contest status labels
- prize pool/entry count display
- lock countdown display

## Source specs

```text
/spec/product_spec.md
/spec/features/frontend_navigation.md
/spec/features/contest_lifecycle.md
```

## Done when

- contests can be displayed from database
- contest cards render status correctly
- contest detail shows rules/economics
- logged-out users can browse

---

## Phase 4: Admin Contest Setup

## Goal
Allow internal team to create and publish weekly contests.

## Build

- internal admin route guard
- admin contest list
- create contest form
- contest basics
- stat type selection limited to QB passing yards
- slate player selection
- provider ID fields
- economics defaults
- lock time / entry open time
- validation checklist
- publish flow
- lobby visibility controls

## Source spec

```text
/spec/features/contest_admin_setup.md
```

## Done when

- admin can create draft contest
- admin can add 15 QBs
- validation blocks invalid publish
- valid contest can publish to scheduled/open
- published contest appears in lobby

---

## Phase 5: Entry + Lineup Builder Without Real Money

## Goal
Build the playable contest loop using test/free entry mode.

## Build

- entry creation endpoint
- single-entry enforcement
- default randomized lineup assignment
- lineup builder UI
- drag-to-reorder
- save lineup
- saved lineup confirmation
- edit lineup until lock
- locked lineup read-only state

## Important MVP shortcut
Use test/free entry mode first.

Do not block this phase on real payment integration.

## Source specs

```text
/spec/product_spec.md
/spec/features/frontend_navigation.md
/spec/features/backend_data_architecture.md
```

## Done when

- logged-in user can enter a test contest
- default lineup is assigned
- user can reorder QBs
- user can save/re-save lineup
- user cannot create duplicate entry
- lineup becomes read-only after lock

---

## Phase 6: Contest Lifecycle Jobs

## Goal
Make contest states transition correctly.

## Build

- contest state field enforcement
- scheduled → open transition
- open → locked transition
- lock-time job
- viability check
- canceled contest state
- live state
- finalizing/final/paid_out placeholders
- state event logging

## Source spec

```text
/spec/features/contest_lifecycle.md
```

## Done when

- contests automatically lock at lock time
- entries are blocked after lock
- lineup edits are blocked after lock
- contests with fewer than 4 paid/test entries cancel
- viable contests move to live
- state events are logged

---

## Phase 7: Scoring Engine + Manual/Test Stats

## Goal
Calculate results before external stats provider integration.

## Build

- scoring table constants
- final stat input/test tool
- actual rank calculation
- tied QB stat rank range handling
- entry score calculation
- entry score tie handling
- payout calculation preview
- scoring result persistence
- player-by-player score breakdown

## Important MVP shortcut
Use manual/test stat input for internal testing only.

External sports data provider integration can follow after scoring logic is proven.

## Source specs

```text
/spec/features/stat_finalization.md
/spec/features/tie_handling.md
/spec/features/backend_data_architecture.md
```

## Done when

- test stats can be entered/imported internally
- scoring calculates correctly
- tied player stat ranges score correctly
- tied entry scores produce shared ranks
- payout calculations match Top 3 50/30/20 rules
- results data persists

---

## Phase 8: Results Reveal + Final Leaderboard

## Goal
Complete the end-of-contest user loop.

## Build

- final leaderboard screen
- current user highlight
- Results Reveal screen
- total score display
- final rank/tie display
- winnings display
- player-by-player score breakdown
- payout pending/paid copy states

## Source specs

```text
/spec/features/results_reveal.md
/spec/features/tie_handling.md
/spec/features/frontend_navigation.md
```

## Done when

- user can view final score
- user can view player-by-player breakdown
- leaderboard shows final ranks
- tied ranks show `T-`
- payout amounts display for paid positions

---

## Phase 9: Wallet Ledger Foundation

## Goal
Build wallet accounting before external payments.

## Build

- wallet balance table
- wallet ledger transaction table
- site credit balance
- cash balance
- test credits
- test payout credits
- canceled contest refund to site credit
- payout credit to cash balance
- wallet summary in Profile

## Important MVP shortcut
Use test ledger events first.

Do not connect real payment/withdrawal provider yet.

## Source spec

```text
/spec/features/wallet_site_credit.md
```

## Done when

- wallet balances display in Profile
- ledger entries update balances correctly
- canceled contest issues site credit
- contest payout credits cash balance
- balances cannot go negative
- duplicate refunds/payouts are prevented

---

## Phase 10: Eligibility + Compliance Gates

## Goal
Add server-side product gates before real-money testing.

## Build

- jurisdiction rule table
- user eligibility fields
- age gate field
- KYC status placeholder
- self-exclusion placeholder
- account restriction support
- eligibility check before entry
- withdrawal check placeholder
- eligibility event logging
- blocked/unknown eligibility UI states

## Source spec

```text
/spec/features/compliance_eligibility_responsible_play.md
```

## Done when

- ineligible users cannot enter contests
- restricted users cannot enter contests
- unknown jurisdiction blocks paid entry
- eligibility decisions are logged
- frontend shows correct eligibility gate copy

---

## Phase 11: External Sports Data Provider Integration

## Goal
Replace manual/test stats with provider-driven final stats.

## Build

- provider selection
- provider player ID mapping
- provider game ID mapping
- game status ingestion
- final stat ingestion
- stat snapshot persistence
- stat validation checks
- stat correction check
- 24-hour payout confirmation window support

## Source spec

```text
/spec/features/stat_finalization.md
```

## Done when

- app can fetch final QB passing yards from provider
- all slate games final check works
- stat snapshots persist
- scoring uses provider stats
- stat correction window can delay payout

---

## Phase 12: Payment Provider + Entry Payment Integration

## Goal
Enable real-money entry fees only after provider/legal direction is clear.

## Build

- payment provider selection
- external payment session creation
- payment capture
- idempotency keys
- funding breakdown with site credit/cash/external payment
- payment failure states
- contest lock payment protection
- external payment provider IDs in ledger

## Hard launch gate
Do not build public real-money entry until legal/payment-provider review supports the flow.

## Source specs

```text
/spec/features/payment_wallet_ux.md
/spec/features/wallet_site_credit.md
/spec/features/compliance_eligibility_responsible_play.md
```

## Done when

- real payment can complete in test/sandbox
- payment failure does not create entry
- payment success creates entry once
- duplicate payment is prevented
- contest lock blocks payment capture

---

## Phase 13: Withdrawal Provider Integration

## Goal
Allow users to withdraw cash balance winnings through approved provider path.

## Build

- withdrawal provider selection
- withdrawal eligibility check
- KYC requirement handling
- withdrawal request flow
- withdrawal status tracking
- cash balance debit/hold logic
- external payout ID storage
- withdrawal failed/reversed handling

## Hard launch gate
Do not publicly launch real-money paid contests without a defined withdrawal path.

## Source specs

```text
/spec/features/wallet_site_credit.md
/spec/features/payment_wallet_ux.md
/spec/features/compliance_eligibility_responsible_play.md
```

## Done when

- eligible user can request withdrawal in sandbox/test mode
- KYC/verification blocks withdrawal when required
- wallet ledger records withdrawal status
- failed withdrawal does not lose user funds

---

## Phase 14: Notifications

## Goal
Support essential user reminders and lifecycle notifications.

## Build

- lineup deadline reminder hooks
- enhanced default-lineup reminders
- contest canceled notification
- results ready notification
- payout credited notification
- basic notification preferences

## Source specs

```text
/spec/product_spec.md
/spec/features/frontend_navigation.md
/spec/features/backend_data_architecture.md
```

## Done when

- users with default lineup can receive reminder event
- users can receive contest canceled event
- users can receive results ready event
- notifications respect basic preferences

---

## Phase 15: Internal QA + Simulation Testing

## Goal
Stress test the game loop before beta.

## Test scenarios

- contest with exactly 4 entries runs
- contest with fewer than 4 entries cancels
- duplicate entry attempt fails
- lineup save before lock succeeds
- lineup save after lock fails
- user does not edit default lineup
- player stat tie occurs
- entry score tie affects payout
- all entries tie
- canceled contest refund runs once
- payout runs once
- stat correction changes result before payout
- payment fails before entry creation
- contest locks during payment attempt
- ineligible jurisdiction blocks entry
- restricted account blocks entry

## Done when

- all critical game loop tests pass
- no duplicate refunds/payouts
- scoring matches expected examples
- wallet balances reconcile with ledger

---

## Phase 16: Beta Launch Preparation

## Goal
Prepare controlled release.

## Build/Complete

- production environment readiness
- monitoring/logging
- admin support process
- customer support email/path
- Terms/Privacy draft loaded
- responsible play copy loaded
- legal/payment review status confirmed
- supported jurisdictions configured
- payment provider sandbox/live readiness
- withdrawal path readiness

## Done when

- team can run one weekly contest end-to-end
- launch gates are satisfied
- support process exists
- rollback/cancel process exists

---

## Real-Money Public Launch Gates

Do not publicly launch real-money paid contests until:

- state-by-state legal/payment review is complete
- supported jurisdictions are configured
- age requirements are configured
- payment provider approves the business/use case
- withdrawal provider/path is working
- KYC requirements are defined
- Terms and Privacy Policy are reviewed
- responsible play copy is in place
- eligibility checks run server-side
- wallet ledger reconciles correctly
- payouts/refunds are idempotent
- contest cancellation path is tested
- scoring/stat finalization path is tested

---

## Recommended Build Order Summary

```text
0. Project Foundation
1. App Shell + Navigation
2. Auth + Profile
3. Contest Lobby + Detail
4. Admin Contest Setup
5. Entry + Lineup Builder without real money
6. Contest Lifecycle Jobs
7. Scoring Engine + Manual/Test Stats
8. Results Reveal + Final Leaderboard
9. Wallet Ledger Foundation
10. Eligibility + Compliance Gates
11. External Sports Data Provider
12. Payment Provider Integration
13. Withdrawal Provider Integration
14. Notifications
15. Internal QA + Simulation Testing
16. Beta Launch Preparation
```

---

## MVP Scope Boundary

MVP means:

- one contest format
- one stat category
- one entry per user
- no live scoring
- no social graph
- no private leagues
- no advanced admin dashboard
- no multi-entry contests
- no guaranteed prize pools
- no arbitrary stat builders

MVP does require:

- playable contest loop
- server-side correctness
- safe ledger model
- contest lifecycle control
- stat finalization
- eligibility hooks
- real-money launch gates

---

## Next Recommended Spec

After this roadmap, define:

```text
MVP QA Test Plan + Acceptance Criteria
```

That should convert each phase and core rule into testable pass/fail checks.
