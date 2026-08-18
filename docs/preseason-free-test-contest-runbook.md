# Preseason Free/Test Contest Runbook

## Purpose

Document the preseason proof loop for a PickRank free/test contest without enabling paid entry.

This runbook ties together live-site navigation checks, admin contest setup, test/free entry, lineup save, lock behavior, provider validation, finalization, leaderboard/results, and manual QA signoff.

## Boundary

This is a proof and operator-readiness checklist, not a paid-entry launch plan.

Do not enable or imply production paid entry during this runbook. Paid entry remains blocked until legal, provider, payment infrastructure, eligibility, wallet-ledger, and withdrawal-path review are explicitly opened and approved.

Allowed modes:

- live public site route checks
- local or staging file-backed E2E free/test entry
- hidden internal provider validation contests
- dry-run provider prep from local fixture data
- manual/test final stats for operator finalization proof
- saved final leaderboard/results verification after typed `FINAL`

Blocked modes:

- real payment provider sessions
- real-money deposits
- withdrawals
- KYC vendor integration
- geolocation enforcement
- public paid-entry enablement
- using provisional provider snapshots as official final results

## Source Specs

Read these before running the checklist:

- `docs/agent-handoff.md`
- `spec/product_spec.md`
- `spec/features/implementation_roadmap.md`
- `spec/features/qa_acceptance_criteria.md`
- `spec/features/contest_lifecycle.md`
- `spec/features/contest_admin_setup.md`
- `spec/features/stat_finalization.md`

Supporting provider notes:

- `spec/features/stat_finalization.md`

## Current Proof Baseline

Live route proof captured on 2026-07-27:

| Route | Expected proof | Latest result |
|---|---|---|
| `https://www.pickrankgames.com/` | Home responds | `200` from Vercel |
| `https://www.pickrankgames.com/contests` | Open Contests responds | `200`; page includes `Open Contests`, `Week 1 QB Passing Yards`, `20-QB player pool`, `Ranked 10`, and `Enter Contest` |
| `https://www.pickrankgames.com/contests/week-1-qb-passing-yards` | Contest Detail responds | `200`; page includes `Week 1 QB Passing Yards`, `Contest Details`, `Contest Board`, `Contest Progression`, `Ranked 10`, `Save your lineup before Thu, Sep 3, 8:15 PM ET`, and signed-out entry routes through `/auth` |
| `https://www.pickrankgames.com/leaderboard` | Leaderboard responds | `200`; page says leaderboards are `Final only` and that standings appear after saved final scoring is confirmed |
| `https://www.pickrankgames.com/how-it-works` | How It Works responds | `200` |
| `https://www.pickrankgames.com/auth` | Auth responds | `200` |

Production paid-entry proof from the handoff remains in force:

- real Google SSO reached production `/profile`
- eligibility fields displayed correctly
- `pending_review` eligibility showed disabled entry CTA
- direct `/payment` kept `Confirm Entry` disabled
- paid entries still fail closed until verified payment infrastructure is connected

## Checklist

### 1. Site Navigation

Goal: prove the public loop is reachable before any account or entry action.

Manual checks:

- Open Home.
- Open Contests from bottom navigation or primary CTA.
- Open `Week 1 QB Passing Yards`.
- Open How It Works from contest context.
- Open Leaderboard.
- Open Auth from the contest CTA.

Pass criteria:

- Each route returns `200`.
- Contests page shows the current contest slate.
- Contest Detail explains the 20-player pool, ranked 10, lower-score-wins mechanic, lock time, projected payouts, and progression from player pool to final results.
- Leaderboard stays final-only when no public final contest exists.
- Signed-out entry sends the user to Auth rather than creating an entry.

Evidence commands:

```bash
curl -I https://www.pickrankgames.com/
curl -I https://www.pickrankgames.com/contests
curl -I https://www.pickrankgames.com/contests/week-1-qb-passing-yards
curl -I https://www.pickrankgames.com/leaderboard
curl -I https://www.pickrankgames.com/how-it-works
curl -I https://www.pickrankgames.com/auth
```

### 2. Admin Contest Setup

Goal: prove operators can create and validate a contest setup without exposing invalid slate data.

Checklist:

- Create a draft contest in `draft`.
- Confirm the draft is hidden from public lobby.
- Save exactly 20 quarterbacks.
- Confirm each slate player has provider player ID, provider game ID, team, opponent, position, and game start time.
- Run validation before publish.
- Confirm invalid slate publish is blocked.
- Publish a valid contest to `scheduled` or `open`.
- Confirm operator audit fields are saved.

Executable proof:

```bash
npx vitest run tests/unit/admin-contest-creation.test.ts
```

Pass criteria:

- hidden draft creation passes
- 20-player pool save passes
- invalid publish fails
- valid publish saves `scheduled` or `open`
- scheduled-to-open and open-to-locked transitions log once

### 3. Free/Test Entry

Goal: prove the preseason loop can create entries without real payment.

Checklist:

- Use only zero-fee test contests, staging, or non-production E2E mode.
- Confirm zero-fee entries can be created without payment infrastructure.
- Confirm paid entries fail closed by default.
- Confirm `pending_review` eligibility blocks paid entry.
- Confirm the explicit file-backed E2E path works only outside production, only for the E2E fixture identity, and only when the fixture eligibility status is `eligible_for_internal_testing`.
- Confirm file-backed test entries increment total entry count but do not increment paid entry count.

Executable proof:

```bash
npx vitest run tests/unit/contest-entry-confirmation.test.ts tests/unit/persisted-contest-entry.test.ts
npx playwright test tests/e2e/lineup-builder.spec.ts
```

Pass criteria:

- entry is created exactly once
- duplicate/reused entry does not double-count
- default lineup is assigned
- paid entry remains blocked outside the explicit controlled E2E fixture path, and public `eligible` status alone is not enough for no-payment test entry
- production cannot activate the E2E bypass

### 4. Lineup Save

Goal: prove a test entrant can reach the lineup builder, see the full slate, save a ranked 10, and persist order.

Checklist:

- Enter a test/free contest.
- Confirm the lineup builder shows 10 ranked quarterbacks and 10 remaining player-pool players.
- Move quarterbacks into a new order.
- Save lineup.
- Reload.
- Confirm the saved order persists.
- Confirm invalid lineup shapes are rejected.

Executable proof:

```bash
npx vitest run tests/unit/lineup-builder-state.test.ts tests/unit/persisted-contest-entry.test.ts
npx playwright test tests/e2e/lineup-builder.spec.ts
```

Pass criteria:

- ranked lineup contains exactly 10 unique quarterbacks from the 20-player pool
- available slate derives from the full contest slate
- saved source changes to `user_saved`
- invalid lineup order is rejected

### 5. Lock Behavior

Goal: prove entries and lineups cannot be changed after lock.

Checklist:

- Move contest from `scheduled` to `open`.
- Move contest from `open` to `locked`.
- Confirm new entry attempts fail after lock.
- Confirm saved lineup is visible in read-only mode.
- Confirm save controls are disabled.
- Confirm server-side save remains blocked, not just the UI.

Executable proof:

```bash
npx vitest run tests/unit/admin-contest-creation.test.ts tests/unit/contest-entry-flow.test.ts
npx playwright test tests/e2e/lineup-builder.spec.ts
```

Pass criteria:

- lifecycle events are logged once
- locked contest routes point entrants to read-only lineup viewing
- locked lineup controls are disabled
- no post-lock lineup mutation succeeds

### 6. Provider Validation

Goal: prove a candidate provider path is ready for private preseason validation while keeping provisional data separate from official finalization.

Checklist:

- Confirm the provider agreement and read-only credentials before any probe.
- Use a private, non-persistent probe for current-season validation.
- Confirm the provider exposes the required player, game, passing-yard, and game-state fields.
- Confirm any snapshot remains private and provisional.
- Confirm the snapshot is labeled as provisional, not official final.
- Confirm no public leaderboard/results surface reads from provisional snapshots as official results.

Executable proof:

```bash
npx vitest run tests/unit/provisional-stats-provider.test.ts tests/unit/provisional-stats-preview.test.ts
```

Pass criteria:

- private probe reports truthful player and game IDs
- provider request exposes non-zero preseason stats once games are active
- provider terms permit the intended storage and display use
- official `FINAL` publish path remains unchanged

Interpretation note:

- A pre-kickoff run with zero player stats can still prove credentials, schedule access, and IDs.
- A preseason rerun is required to prove non-zero stats, in-progress game state, and truthful ordering.

### 7. Finalization

Goal: prove the official results path still uses reviewed final stats plus typed `FINAL`.

Checklist:

- Use the operator/admin finalization path.
- Prefill or enter final QB passing-yard rows.
- Confirm all 20 player rows are present and names match.
- Type `FINAL`.
- Publish final results.
- Rerun after a stat correction and confirm saved rows replace cleanly.
- Confirm provisional snapshots are not used as official results.

Executable proof:

```bash
npx vitest run tests/unit/contest-finalization.test.ts tests/unit/contest-results.test.ts
npx playwright test tests/e2e/final-results.spec.ts
```

Pass criteria:

- finalization is allowed only from locked/finalizing-safe states
- mismatched or missing player rows are rejected
- saved results persist once per entry/player
- rerun finalization replaces rows without duplicate drift
- contest moves to `final`

### 8. Leaderboard And Results

Goal: prove saved final standings appear correctly and only after finalization.

Checklist:

- Open `/leaderboard?contest=<contestId>` before finalization.
- Confirm placeholder/final-only state.
- Finalize contest through admin path.
- Open `/leaderboard?contest=<contestId>`.
- Open entrant `/contests/<contestId>/results`.
- Open non-entrant Results URL.
- Confirm non-entrant redirects to public leaderboard.
- Confirm tied ranks and payout display read from saved result rows.

Executable proof:

```bash
npx playwright test tests/e2e/final-results.spec.ts
```

Pass criteria:

- non-final contests do not show saved final standings
- final leaderboard uses saved rows
- entrant Results shows final score, rank, and player breakdown
- non-entrant Results redirects to leaderboard
- shared paid ties render consistently as saved, including `T-` rank display

### 9. Manual QA Signoff

Use this signoff block for each preseason run:

```text
Run date:
Environment:
Contest slug:
Operator:

Site navigation:
Admin contest setup:
Free/test entry:
Lineup save:
Lock behavior:
Provider validation:
Finalization:
Leaderboard/results:

Paid entry remained disabled:
Provisional stats stayed separate from official final results:
Known failures or follow-ups:
Decision:
```

Signoff rule:

- Mark the run `PASS` only if all sections pass and paid entry remains disabled.
- Mark the run `PARTIAL` if route/test proof passes but preseason provider stats are still pre-kickoff zeros.
- Mark the run `FAIL` if entry duplicates, post-lock lineup edits, provider identity drift, finalization duplicate drift, or public final-results leakage occurs.

## Recommended Full Proof Sequence

Run this order for a complete preseason proof pass:

```bash
npm run typecheck
npx vitest run tests/unit/admin-contest-creation.test.ts tests/unit/contest-entry-confirmation.test.ts tests/unit/persisted-contest-entry.test.ts tests/unit/lineup-builder-state.test.ts tests/unit/contest-entry-flow.test.ts tests/unit/provisional-stats-provider.test.ts tests/unit/contest-finalization.test.ts tests/unit/contest-results.test.ts
npx playwright test tests/e2e/lineup-builder.spec.ts
npx playwright test tests/e2e/final-results.spec.ts
```

Then run live route checks:

```bash
curl -I https://www.pickrankgames.com/
curl -I https://www.pickrankgames.com/contests
curl -I https://www.pickrankgames.com/contests/week-1-qb-passing-yards
curl -I https://www.pickrankgames.com/leaderboard
curl -I https://www.pickrankgames.com/how-it-works
curl -I https://www.pickrankgames.com/auth
```

## Next Required Preseason Proof

During the first available NFL preseason game window, rerun:

```bash
```

Capture:

- run date and time
- contest slug
- game counts
- top provisional QB order
- whether player stats are non-zero
- whether any games are in progress
- snapshot persistence result
- confirmation that official final results were not published from provisional data
