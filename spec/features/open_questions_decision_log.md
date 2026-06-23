# MVP Open Questions + Decision Log

## Purpose
Track unresolved MVP decisions, open questions, launch blockers, future revisit items, and decisions already locked for PickRank.

## Status
Active living document.

## Anchor
MVP open questions are primarily around provider/vendor choices, legal/state eligibility, real-money payments, withdrawals, KYC, infrastructure stack, beta scope, and launch readiness. Core product mechanics are locked, but launch-critical operational decisions remain open.

---

## Summary
PickRank's core product rules are mostly locked.

The remaining major decisions are not game-design issues. They are mostly:

- vendor choices
- legal/compliance requirements
- payment/withdrawal infrastructure
- technical stack choices
- beta launch scope
- operational readiness

This document should be updated whenever a major decision is made or reopened.

---

## Decision Status Definitions

Use these statuses:

```text
open
recommended
locked
deferred
blocked
revisit_after_testing
```

### open
No decision yet.

### recommended
Preferred direction exists, but not finalized.

### locked
Decision is finalized for MVP.

### deferred
Not needed for MVP.

### blocked
Cannot decide until another dependency is resolved.

### revisit_after_testing
Current MVP direction exists, but should be revisited after simulation/beta testing.

---

## Launch Classification

Use these classifications:

```text
pre_build
pre_beta
pre_real_money_launch
post_mvp
```

### pre_build
Must be resolved before implementation begins.

### pre_beta
Must be resolved before controlled beta testing.

### pre_real_money_launch
Must be resolved before public paid contests.

### post_mvp
Can wait until after MVP.

---

# Locked MVP Product Decisions

## Game format

| Decision | Status | Notes |
|---|---|---|
| Product type | locked | Skill-based NFL prediction contest |
| MVP stat category | locked | QB Passing Yards |
| Slate size | locked | 15 quarterbacks |
| User task | locked | Pick and rank the top 10 QBs by passing yards from the 15-QB slate |
| Scoring model | locked | Placement distance scoring |
| Scoring table | locked | Exact 15, 1 off 7, 2 off 5, 3 off 3, 4+ off 0 |
| Alternate scoring model testing | revisit_after_testing | Test low-score total rank differential once real NFL/stat-provider data is available |
| Single-entry MVP | locked | One entry per user per contest |
| No live scoring | locked | Final results only after games complete |

---

## Contest economics

| Decision | Status | Notes |
|---|---|---|
| Platform fee | locked | 30% |
| Prize pool | locked | 70% of entry fees |
| Payout structure | locked | Top 3: 50/30/20 |
| Minimum entries | locked | 4 paid entries to run |
| Below-minimum contest | locked | Cancel + refund as site credit |
| Guaranteed prize pools | deferred | Out of MVP |

---

## Tie handling

| Decision | Status | Notes |
|---|---|---|
| Entry score ties | locked | True shared placements |
| Entry tie payout | locked | Pool affected payout slots and split evenly |
| Entry tie-breakers | deferred | No secondary entry score tie-breaker for MVP |
| QB passing-yard ties | locked | Use tied actual rank range |
| QB stat tie-breakers | revisit_after_testing | Consider interceptions, rushing yards, TDs, etc. later |

---

## Wallet and payment behavior

| Decision | Status | Notes |
|---|---|---|
| Balance types | locked | Cash balance + site credit balance |
| Site credit withdrawal | locked | Not withdrawable |
| Winnings destination | locked | Cash balance |
| Canceled contest refund | locked | Site credit |
| External payments required | locked | Needed for real-money launch |
| Cash withdrawal path required | locked | Required before public paid launch |

---

# Open Decisions

## 1. Payment provider

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_real_money_launch |
| Owner | TBD |
| Related specs | payment_wallet_ux.md, wallet_site_credit.md, compliance_eligibility_responsible_play.md |

### Question
Which provider should process real-money entry payments?

### Requirements
Provider must support or be comfortable with:

- paid skill-based contest entry fees
- sports-adjacent contest product
- card or wallet payment flow
- payment failure handling
- idempotency
- chargeback handling
- restricted business review
- U.S. jurisdiction restrictions

### Current recommendation
Do not pick yet. Build a payment abstraction and test/free-entry mode first.

### Decision needed before
Public real-money launch.

---

## 2. Withdrawal / payout provider

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_real_money_launch |
| Owner | TBD |
| Related specs | wallet_site_credit.md, payment_wallet_ux.md, compliance_eligibility_responsible_play.md |

### Question
How do users withdraw cash balance winnings?

### Requirements
Provider/path must support:

- user payout recipients
- payout status tracking
- KYC/identity requirements
- failed payout handling
- compliance holds
- minimum withdrawal rules
- ledger reconciliation

### Current recommendation
Do not publicly launch paid contests until withdrawal path is confirmed and tested.

### Decision needed before
Public real-money launch.

---

## 3. Sports data provider

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_beta or pre_real_money_launch depending on beta mode |
| Owner | TBD |
| Related specs | stat_finalization.md, backend_data_architecture.md |

### Question
Which provider supplies official NFL game/player stats?

### Requirements
Provider must support:

- NFL schedules
- game status
- player-level passing stats
- final box score data
- player IDs
- team IDs
- stat corrections or updated official stats
- reliable API availability

### Current recommendation
Use manual/test stats for early build. Select provider before realistic beta or public contests.

### Decision needed before
External-stat beta or real-money launch.

---

## 3a. Alternate scoring model testing

| Field | Value |
|---|---|
| Status | revisit_after_testing |
| Launch classification | post_mvp |
| Owner | TBD |
| Related specs | product_spec.md, stat_finalization.md, results_reveal.md |

### Question
Should PickRank eventually use, offer, or simulate a low-score differential scoring model instead of the MVP points table?

### Candidate model
Use the same 15-player weekly slate and the user's 10 submitted ranked QBs, but score each selected player by raw rank differential against the full 15-QB slate:

```text
differential = abs(user_rank - actual_rank)
total_score = sum(differential for the 10 selected players)
```

Lowest total score wins because the score represents total miss distance across the lineup.

Example:

```text
User ranks Patrick Mahomes 1st.
Mahomes finishes 9th in weekly passing yards.
Differential = abs(1 - 9) = 8.
The entry receives 8 points for that player.
```

Player stat ties should use the same tied actual rank range logic as MVP scoring. If a quarterback finishes in a tied passing-yards rank group, a user receives a differential of `0` when their submitted rank is anywhere inside that tied actual rank range. If the submitted rank is outside the tied range, the differential is the shortest distance to either edge of the tied range.

Unselected QBs are not directly scored. Their impact is indirect: leaving out a QB who finishes high removes the user's chance to earn a low differential on that QB.

### Testing intent
Do not replace MVP scoring yet. Keep MVP placement distance scoring as the locked product rule.

When real NFL/stat-provider data is available, run simulations comparing:

- MVP point-table scoring, where highest score wins
- total rank differential scoring, where lowest score wins
- leaderboard spread and tie frequency
- whether casual users understand the scoring more easily
- whether the model rewards selected-lineup accuracy better than the MVP table

### Decision needed before
Only needed before changing scoring rules or adding alternate contest formats.

---

## 4. Auth provider

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | account_profile_auth.md, frontend_navigation.md |

### Question
What auth system should PickRank use?

### Options
Potential options:

- Supabase Auth
- Firebase Auth
- Clerk
- Auth0
- custom auth, not recommended for MVP

### Current recommendation
Use a managed auth provider. Avoid custom auth for MVP.

### Decision needed before
Phase 2: Auth + Profile.

---

## 5. Backend/database stack

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | backend_data_architecture.md, implementation_roadmap.md |

### Question
What backend/database stack should power MVP?

### Options
Potential options:

- Supabase/Postgres
- Firebase/Firestore
- custom Node/Express/Nest + Postgres
- Next.js backend routes + Postgres
- managed backend service with Postgres

### Current recommendation
Use Postgres-backed architecture because the product needs transactions, ledger integrity, relational constraints, and auditability.

### Decision needed before
Phase 0: Project Foundation.

---

## 6. Frontend framework

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | frontend_navigation.md, implementation_roadmap.md |

### Question
What frontend framework should PickRank use?

### Options
Potential options:

- React Native / Expo
- Next.js web app
- React web app
- Flutter

### Current recommendation
Choose based on intended first launch surface.

If mobile-first test app:

```text
React Native / Expo
```

If fastest web MVP:

```text
Next.js
```

### Decision needed before
Phase 0: Project Foundation.

---

## 7. First launch surface

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | frontend_navigation.md, implementation_roadmap.md |

### Question
Should MVP launch first as mobile app, mobile web, or desktop/web app?

### Options

- mobile web first
- responsive web first
- native mobile app first
- Expo app first

### Current recommendation
Start with responsive web or Expo depending on build resources and desired beta testing path.

### Decision needed before
Phase 0: Project Foundation.

---

## 8. State-by-state legal/payment review

| Field | Value |
|---|---|
| Status | blocked |
| Launch classification | pre_real_money_launch |
| Owner | legal/payment expert TBD |
| Related specs | compliance_eligibility_responsible_play.md |
| GitHub issue | #3 |

### Question
Where can PickRank legally offer paid contests?

### Exact review question to keep handy
In which states can we legally offer this exact contest format for paid entry and cash prizes?

### Review should answer

- eligible states
- blocked states
- age thresholds
- required disclosures
- registration/licensing requirements
- whether the product is treated as skill contest, fantasy/DFS, gaming, gambling, or other category
- payment provider support by jurisdiction
- payout/withdrawal requirements
- KYC requirements
- tax reporting implications

### Current recommendation
Treat all states as pending review until legal/payment review supports eligibility.

### Decision needed before
Public real-money launch.

---

## 9. KYC / identity verification provider

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_real_money_launch |
| Owner | TBD |
| Related specs | account_profile_auth.md, compliance_eligibility_responsible_play.md |

### Question
Which provider, if any, handles KYC/identity verification?

### Current recommendation
Defer provider decision until payment/withdrawal provider requirements are known.

### Decision needed before
Cash withdrawals or real-money launch.

---

## 10. Free-entry / test mode details

| Field | Value |
|---|---|
| Status | recommended |
| Launch classification | pre_beta |
| Owner | TBD |
| Related specs | implementation_roadmap.md, backend_data_architecture.md |

### Question
How should PickRank simulate contests before real-money payments?

### Current recommendation
Build early MVP with test/free-entry mode.

Test mode should:

- create entries without real payment
- still enforce single-entry rules
- still assign lineups
- still run lifecycle/scoring/results
- optionally simulate wallet ledger events separately
- be clearly separated from production real-money contests

### Decision needed before
Controlled internal beta.

---

## 11. Beta scope

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_beta |
| Owner | TBD |
| Related specs | implementation_roadmap.md, qa_acceptance_criteria.md |

### Question
What should the first beta include?

### Current recommendation
First beta should include:

- free/test contests only
- login/profile
- contest lobby/detail
- entry flow
- lineup builder
- contest lock
- manual/test stat finalization
- results reveal
- final leaderboard

First beta should not include:

- real payments
- cash withdrawals
- public prize claims
- broad marketing

---

## 12. Hosting/deployment stack

| Field | Value |
|---|---|
| Status | open |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | implementation_roadmap.md |

### Question
Where should frontend/backend/database be hosted?

### Current recommendation
Decide alongside backend/frontend stack.

Potential options:

- Vercel + Supabase
- Render/Fly/Railway + Postgres
- AWS/GCP later, likely overkill early

### Decision needed before
Phase 0: Project Foundation.

---

## 13. Notification provider

| Field | Value |
|---|---|
| Status | deferred |
| Launch classification | post_mvp or pre_beta if reminders are included |
| Owner | TBD |
| Related specs | backend_data_architecture.md, implementation_roadmap.md |

### Question
How should lineup reminders, cancellation notices, and results notices be sent?

### Current recommendation
Build notification event hooks first. Choose provider later.

Potential providers:

- email provider
- push notification provider
- SMS provider, likely deferred

---

## 14. Payment sandbox only vs live payments

| Field | Value |
|---|---|
| Status | recommended |
| Launch classification | pre_real_money_launch |
| Owner | TBD |
| Related specs | payment_wallet_ux.md, implementation_roadmap.md |

### Question
Should payment integration start in sandbox only?

### Current recommendation
Yes. Start sandbox/test mode only. Do not enable live payments until all real-money launch gates are complete.

---

## 15. Stat correction payout window

| Field | Value |
|---|---|
| Status | locked_for_mvp |
| Launch classification | pre_beta |
| Owner | product/engineering |
| Related specs | stat_finalization.md |

### Decision
Use a 24-hour payout confirmation window after all slate games are final.

### Revisit
May revisit after sports data provider selection and beta testing.

---

# Revisit After Testing

## QB stat tie-breakers

### Current MVP decision
Do not use secondary QB stat tie-breakers.

### Revisit after
Simulation testing and beta.

### Potential future tie-breakers

- interceptions
- rushing yards
- passing touchdowns
- completions
- attempts
- passer rating

### Caution
Adding QB stat tie-breakers changes the core prediction mechanic. Users would no longer be ranking only passing yards.

---

## Live scoring

### Current MVP decision
No live scoring.

### Revisit after
MVP results loop is working.

### Potential future direction
Live leaderboard, stat tracker, and rank movement indicators.

---

## Multi-entry contests

### Current MVP decision
Single entry per user.

### Revisit after
MVP contest liquidity and user behavior are understood.

---

## Guaranteed prize pools

### Current MVP decision
Dynamic prize pools only.

### Revisit after
Contest demand/liquidity is understood.

---

## Marketing plan

### Current status
To do.

### Current direction
Start with a basic public landing page, a simple sign-up path, and a short product video.

### Revisit after
The landing page is live and early interest feedback is available.

---

# Decision Log

## 2026-05-14/15 Product spec buildout

### Locked

- MVP game format: QB Passing Yards ranking contest
- Slate size: 15 QBs
- Scoring: placement distance scoring
- Platform fee: 30%
- Prize pool: 70%
- Payout: Top 3, 50/30/20
- Contest viability: min 4 entries
- Canceled contests refund as site credit
- Wallet model: cash + site credit
- Site credit not withdrawable
- Winnings credited to cash balance
- True shared entry ties
- Pooled payout splitting
- Tied QB passing-yard rank ranges
- No live scoring for MVP
- Contest lifecycle state machine
- Internal admin contest setup flow
- Email-based account/auth direction
- Eligibility/compliance hooks
- Backend data architecture
- Frontend screen map
- Implementation roadmap
- QA acceptance criteria

### Open

- payment provider
- withdrawal provider
- sports data provider
- auth provider
- backend/database stack
- frontend framework
- first launch surface
- hosting/deployment stack
- state-by-state legal/payment review
- KYC provider
- beta scope details

---

# Next Recommended Spec

After this decision log, define:

```text
MVP Technical Stack Recommendation
```

That should compare practical stack options and recommend a build path for a non-developer founder using AI coding tools.
