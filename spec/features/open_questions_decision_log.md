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
| Slate size | locked | 20 quarterbacks |
| User task | locked | Pick and rank the top 10 QBs by passing yards from the 20-QB player pool |
| Scoring model | locked | Low-score total rank differential scoring |
| Scoring table | locked | Each selected QB earns `abs(user_rank - actual_rank)` points against the full 20-QB player pool |
| Leaderboard tiebreakers | locked | Most exact picks, then most one-off-or-better picks, then closest placement of the actual QB1, then selected QB1 through QB5 passing TDs in order |
| Scoring-model validation basis | locked | 2025 repo simulation favored differential with tiebreakers because it produced the fewest payout-relevant ties among tested models |
| Single-entry MVP | locked | One entry per user per contest |
| No live scoring | locked | Final results only after games complete |

---

## Contest economics

| Decision | Status | Notes |
|---|---|---|
| Early Access Beta launch mode | locked | Free-to-play contests only; Beta Pass has no cash value; no payouts or cash prizes during beta |
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
| Entry tie-breakers | locked | Apply the three differential tiebreakers before declaring a true shared placement |
| QB passing-yard ties | locked | Use tied actual rank range |
| QB stat tie-breakers | revisit_after_testing | Consider interceptions, rushing yards, TDs, etc. later |
| Future non-QB tiebreak framework | recommended | Keep the same differential-first concept for WR/RB/TE contests, but define a position-specific stat-family fallback tree before those contest types launch |

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
Which licensed sports data provider should PickRank use for external-stat beta testing and, later, paid-contest launch?

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
The prior $10k-per-season provider is retired from PickRank provider planning because its commercial package is not affordable for the current launch path.

The current provider search priority is:

- MySportsFeeds is the leading candidate if it confirms commercial free-to-play beta use, future paid-contest permission, affordable NFL CORE + STATS pricing, preseason/postseason coverage, and internal snapshot rights.
- Rolling Insights DataFeeds is the backup candidate, especially if the Breakaway Accelerator can support PickRank's current stage and budget.
- The prior provider is retired from active planning. Keep the remaining provider candidates behind written rights and technical coverage review.
- ESPN endpoints remain human audit and research only unless ESPN/Disney grants written production permission.

The repo's existing provider seams should be reused only after the new provider choice is clear. The official saved-results path still stays behind the separate typed `FINAL` confirmation flow.

### Active follow-up
The prior provider is removed from active follow-up because its quoted `$10k` per-season commercial license is not affordable for the current launch path.

Parker contacted MySportsFeeds in August 2026 to confirm:

- whether public free-to-play Early Access Beta use is allowed
- whether future paid-contest use is allowed
- the price for NFL CORE + STATS, and optionally DETAILED, at Non-Live and near-realtime/live access levels
- preseason, regular-season, and postseason access
- game-state, player-ID, team-ID, and player-level QB passing-stat coverage
- rate limits and production usage terms
- display, caching, storage, and redistribution limits
- whether internal provisional snapshot persistence is allowed for validation
- whether PickRank is considered competitive or otherwise restricted under their terms

Parker started a 14-day MySportsFeeds trial in August 2026 with NFL CORE + STATS and live access with a 10-minute delay. Trial pricing observed in the account flow was `$158 CAD/month` for live with 10-minute delay and `$88 CAD/month` for Non-Live for the same package.

The 2026-08-13 read-only MySportsFeeds preseason test against DET at CIN, `2026-preseason/week/1/game/163796`, proved auth, schedule access, `LIVE` game state, `COMPLETED_PENDING_REVIEW` post-game state, non-zero QB passing yards, provider player IDs, provider game IDs, and the private provisional snapshot row shape. The repo still needs one plain `COMPLETED` final-state check and a repeatability check on another preseason game before MySportsFeeds can be treated as technically preferred.

Parker also contacted Rolling Insights about the Breakaway Accelerator in August 2026. Keep that item open until Rolling Insights confirms:

- whether the accelerator is available to PickRank
- whether free-to-play public beta and future paid-contest use are allowed
- whether NFL preseason, regular-season, and postseason player game stats are included
- whether post-game QB passing yards and future skill-position stats are available at the accelerator price
- whether internal validation, audit, provisional-results, and final-review snapshots may be stored

Do not treat any free-trial, personal-use, Discovery Lab, or unofficial endpoint access as production-ready provider access.

### Decision needed before
External-stat beta or real-money launch.

---

## 3a. Scoring-model validation record

| Field | Value |
|---|---|
| Status | locked |
| Launch classification | pre_build |
| Owner | TBD |
| Related specs | product_spec.md, stat_finalization.md, results_reveal.md |

### Question
Which scoring direction and leaderboard tiebreakers should PickRank treat as the product truth for MVP?

### Locked model
Use the same 20-player weekly player pool and the user's 10 submitted ranked QBs, and score each selected player by raw rank differential against the full 20-QB player pool:

```text
differential = abs(user_rank - actual_rank)
total_score = sum(differential for the 10 selected players)
```

For equal total scores, use the locked tiebreak tree in this order:

```text
1. most exact picks
2. most one-off-or-better picks
3. closest placement of the actual QB1
4. more passing TDs from the user's selected QB1
5. if still tied, compare the user's selected QB2, then QB3, then QB4, then QB5 passing TDs in order
6. if still tied after QB5, keep the true shared placement and split affected payout slots
```

### Future extension note
When PickRank expands beyond QB passing-yards contests, keep the same overall structure:

```text
differential scoring first
then a small ordered tiebreak tree drawn from the same contest's stat family
then true shared placement only after that position-specific fallback tree is exhausted
```

WR, RB, and TE contests should not automatically reuse QB passing-touchdown fallbacks. Each position/stat type should define its own explicit, explainable fallback tree before launch.

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

If two entries finish with the same total score, resolve standings in this order:

1. most exact picks
2. most one-off-or-better picks
3. closest placement of the actual QB1

If entries are still tied after those checks, keep them tied and apply shared placement plus payout-split rules.

### Why this is locked
The repo's 2025 scoring simulation compared four models on payout-relevant tie behavior:

- historical MVP point-table scoring
- raw differential scoring
- differential scoring with the three leaderboard tiebreakers above
- weighted differential scoring

Differential scoring with those tiebreakers produced the fewest top-3 payout tie collisions in the repo simulation run, so it is the cleanest current product truth.

### Decision needed before
No further decision is needed before scoring implementation unless the product team explicitly reopens scoring.

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
- Scoring: low-score total rank differential with locked leaderboard tiebreakers
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
