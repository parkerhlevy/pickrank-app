# PickRank Agent Handoff

## Purpose

PickRank is a skill-based NFL pick-order contest app.

The product is being built from the specs in `/spec`. The goal is to keep the implementation aligned with the MVP plan while allowing coding agents to implement small, reviewable slices.

## Operating Model

GitHub and this repo are the permanent project record for PickRank. Product specs, implementation plans, code, tests, QA plans, and final technical decisions belong here.

The local Codex workspace is a temporary workbench. Use it to inspect, edit, test, and verify changes before they go back to GitHub.

The intended app surface is cloud-based: Replit, Vercel, or another deployment environment where the app/site can run and be shared.

Avoid local-only complexity unless it directly helps get PickRank working in GitHub and cloud deployment.

Explain results in business-friendly language first: what changed, why it matters, what passed, and what Parker needs to do next. Add technical detail only when it helps the decision or next step.

At the start of each new PickRank task or new chat, first provide Parker with the recommended kickoff prompt for that next slice before doing the work.

Codex owns updates to this handoff note. Parker should not need to remind the agent to refresh it.

## Handoff Maintenance Rule

Treat this file as a living repo-status handoff, not a one-time setup note.

Refresh this file at the end of any PickRank slice that changes repo reality, including:

- the recommended next move
- the current implementation stage or phase
- active in-progress work that future slices need to understand
- major routes, navigation, or app-surface behavior
- git/worktree expectations that materially affect the next slice

Minimum sections to keep current when applicable:

- `Current Repo State`
- `Suggested Next Slice`
- `Starter Prompt For Future Chats`

Add or update concise status details rather than turning this file into a long journal. If a slice does not materially change repo reality, do not churn this file just for wording.

## Current Repo State

The repo is past bare Phase 0 and currently includes:

- Next.js app shell
- Global layout
- Bottom navigation
- Public marketing copy
- Auth sign-in and profile-completion flow
- Public contest browse pages backed by a persisted contest data layer instead of hard-coded demo contest records
- Internal `/admin/contests` contest-operator workflow with server-side role gating
- Draft validation and human-confirmed publish flow that moves valid contests into `scheduled` or `open`
- Draft contest slate setup with the first real 15-player quarterback data path saved into the shared contest store
- Basic contest lifecycle automation functions for `scheduled -> open` and `open -> locked`
- Contest-entry placeholder flow and lineup-state persistence work that now reads real contest records
- Tailwind/PostCSS configured
- Vitest wired
- Basic route smoke tests

Current branch reality on `main` as of 2026-07-02:

- `main` is ahead of `origin/main` with the local commits `Add contest operator and repository foundation`, `Add Remotion marketing video source`, `Finish Postgres contest repository rollout`, `Exclude Remotion workspace from app typecheck`, `Document live deployment status`, and `Fix admin publish redirect handling`
- local `main` now also includes `49802ba Add server-backed saved entry lineup flow`, which moved contest entry, payment placeholder, success, and lineup screens onto persisted entry records plus a full 15-player slate with a ranked top-10 save flow
- the current Remotion source baseline is a motion-polished `32s` waitlist-focused cut under `assets/marketing/video/`, aligned to the 15-player / pick-10 product framing and the `pickrankgames.com` brand
- the latest rendered review asset is `assets/marketing/video/out/pickrank-landing-video.mp4`
- `lib/contest-data.ts` now reads and writes contest browse/admin data directly against Supabase/Postgres in normal app use, while keeping file-backed fixtures only for tests and explicit fixture-driven runs
- Supabase role foundations now exist in repo migrations for `roles` and `user_roles`, with `contest_operator` as the single enforced MVP internal role
- internal operator assignment can now be staged by email before signup through `pending_user_roles`, which auto-converts into a real `user_roles` assignment when the matching user account is created
- the active Supabase project now has migrations `0001` through `0004` applied, plus the `assign_first_contest_operator.sql` seed
- operator bootstrap is confirmed for `parkerhlevy@gmail.com` as a live `contest_operator`, while `glevy59@icloud.com` is correctly staged in `pending_user_roles` and should auto-convert after signup
- the admin flow now records `created_by_admin_id`, `validated_by_admin_id`, and `published_by_admin_id`, and draft contests can now carry real `slatePlayers` rows plus stricter publish validation through the shared contest repository layer
- the public contest lobby and contest detail pages now read contests that include real slate-player arrays, while the lineup shell still temporarily derives a 10-player subset from that slate
- the lineup shell no longer relies on the temporary 10-player subset shortcut; signed-in users can now save one ranked 10-quarterback lineup from the full 15-player contest slate against a persisted entry record
- protected contest-entry routes now share one auth gate for signed-out, profile-incomplete, and email-unverified users, and the contest-detail CTA mirrors that same gating path
- the current automated QA baseline now covers signed-out direct visits to `/contests/[contestId]/payment`, `/success`, and `/lineup`, plus ready-account browser verification of those same protected routes through a dedicated Playwright signed-in auth fixture
- Playwright now runs those protected-route checks against the repo fixture contest store by enabling `PICKRANK_E2E_AUTH=1` and `PICKRANK_E2E_USE_FILE_STORE=1` in the e2e web-server command, which keeps production auth gates intact while isolating browser QA from the still-incomplete live contest migration
- sandboxed browser runs still fail before startup with `listen EPERM: operation not permitted 0.0.0.0:3000`; Playwright verification is confirmed only in an environment that can bind the local dev server
- publish is intentionally human-confirmed even when validation passes; agent assistance is limited to preparation and validation support
- migration `db/migrations/0005_contest_repository_backing_fields.sql` adds the missing contest slug, description, season, contest type, entry count, display order, lineup shell, and validation uniqueness fields needed for the repository swap
- Supabase migration `0005` and the updated `db/seed/contest_repository_baseline.sql` are now applied in the active project
- direct Supabase verification on 2026-06-29 confirmed the active project held the initial Week 1 public contest plus the Week 2 draft before the later live publish step
- local verification now confirms `/contests` and `/contests/week-1-qb-passing-yards` return `200`, while `/admin/contests` redirects to `/auth?next=%2Fadmin%2Fcontests` until an operator signs in
- the contest repository layer now normalizes Supabase timestamp fields before schema validation so Postgres-backed slate rows load cleanly in the app
- the admin UI still includes a narrow text-based slate input for operators, but full provider sync and richer editing controls are still follow-ups
- live browser verification now confirms Google sign-in returns correctly to `www.pickrankgames.com`, public `/contests` and `/contests/week-1-qb-passing-yards` work against the real contest records, and a signed-in `contest_operator` can reach `/admin/contests`
- direct Vercel production deployment `dpl_GhDY7kEZxXn9Wvm6ACKmd8EwyDcQ` moved production onto the real admin contest UI, and follow-up deployment `dpl_EXHcfuUHrMokumP3wMcMkoE2iAtY` fixed the false `NEXT_REDIRECT` publish banner
- live production verification now confirms the draft validation step passes, the publish button enables only after validation, the publish action succeeds, and the newly published contest appears in public browse
- GitHub push access from this machine was restored on 2026-06-30, and local `main`, `origin/main`, and the already-deployed production code are now back in sync at `f1c70b9`
- final live browser verification on 2026-06-30 confirms public `/contests` now shows Week 1 as `Open` and Week 2 as `Scheduled`, while signed-in admin `/admin/contests` shows both records as visible under the `contest_operator` gate with publish controls inactive for those already-published contests
- contest finalization now has a saved-results foundation: operators can prefill final stat rows from a provider-backed adapter seam, still type `FINAL` to confirm scoring, and publish saved contest results plus final leaderboard standings without exposing live scoring
- the new provider seam supports disabled, file-backed, and persisted-snapshot adapter modes so the next integration slice can swap in a real external stats source without rewriting the current admin finalization UX
- public `/contests/[contestId]/results` and `/leaderboard?contest=...` now read from saved final results after a contest reaches `final` or `paid_out`
- repo verification for the new scoring/results slice now includes unit coverage for stat ingestion, ranking, tie handling, finalization, and saved results plus Playwright coverage for operator finalization and signed-in final-results viewing
- `next-env.d.ts` should usually be treated as generated noise unless a slice specifically requires it
- untracked marketing video work currently lives under `assets/marketing/video/` and belongs to this repo when it supports PickRank launch work
- additional in-progress design and marketing assets remain outside the product commits for this slice and should stay untouched unless that work is explicitly resumed

## Core Commands

Run these before and after meaningful changes:

```bash
npm install
npm run dev
npm run typecheck
npm run test
```

For cloud deployment instructions, see:

```text
docs/deployment.md
```

The local app should run at:

```text
http://localhost:3000
```

## Current Routes

Core app routes:

```text
/
/contests
/leaderboard
/wallet
/profile
/how-it-works
/auth
```

Admin work may exist later under:

```text
/admin
```

Do not expose admin routes in the bottom navigation unless the product spec explicitly calls for it.

## Current Navigation

The bottom navigation currently includes:

```text
Home
Contests
Leaderboard
Profile
```

`/wallet` remains available as a secondary route under Profile.

`/how-it-works` exists, but it is not currently in the bottom nav. Keep it easy to reach from major pages through links or contextual CTAs.

## Source of Truth

Before implementing features, read the relevant files in `/spec`.

The master spec is:

```text
/spec/product_spec.md
```

Use the more specific spec files when they exist.

## Implementation Principles

Build in small, reviewable slices.

Prefer:

- One feature or app area per commit
- Clear placeholder states before complex logic
- Type-safe interfaces
- Basic tests for routes and important business rules
- Simple mobile-first UI

Avoid:

- Large unreviewable rewrites
- Implementing payments before wallet rules are fully confirmed
- Implementing real-money flows without compliance review
- Changing product rules unless the spec is updated first
- Adding major dependencies without a clear reason

## Current Known Decisions

The MVP includes:

- Skill-based NFL pick-order contests
- Contest lifecycle states
- Leaderboard behavior
- Tie handling
- Payout structure
- 30% platform fee
- Wallet/site credit system
- Admin contest setup
- Auth/profile requirements
- Compliance and responsible play requirements

## Suggested Next Slice

Next recommended slice:

```text
Replace the file and persisted-snapshot stat adapter placeholders with the first real provider-backed snapshot fetch and persistence path, while keeping the current operator `FINAL` confirmation step, saved-results surfaces, and low-score differential scoring model intact.
```

Definition of done:

- A provider adapter can fetch one contest snapshot from a real external stats source and normalize it into the existing finalization seam
- The fetched snapshot can be persisted for operator review without auto-publishing results
- Admin finalization still requires a human operator to review the rows and type `FINAL`
- Public final-results and leaderboard screens continue to read only from saved final results after confirmation
- `npm run typecheck`, `npm run test`, and browser verification pass for the provider-backed ingestion slice
- Update this handoff note if the admin verification outcome or next recommended move changes

## Starter Prompt For Future Chats

Use this default starter prompt pattern unless the next slice needs a tighter scoped variation:

```text
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, `spec/features/stat_finalization.md`, `spec/features/results_reveal.md`, and the other scoring/results spec files already aligned to the low-score differential model, plus the in-progress contest-entry and provider/results files already involved. Work carefully with the parked design and marketing files but do not disturb them. Keep the slice narrow: wire the first real provider-backed stat snapshot adapter and persistence path only, preserve the current human-confirmed finalization step and saved-results surfaces, avoid payments, withdrawals, compliance, and unrelated UI work, run the relevant typecheck/tests/browser verification for that seam, and refresh `docs/agent-handoff.md` if repo reality or the next recommended move changes. Explain results business-first: what changed, why it matters, what passed, what remains risky, and what I need to do next.
```

## Generated Files to Avoid Committing

Do not commit local/generated artifacts such as:

```text
.next/
tsconfig.tsbuildinfo
node_modules/
```

If Next modifies `next-env.d.ts` automatically during local dev, review carefully before committing. In most cases, do not commit unrelated automatic changes.

## Git Workflow

Before starting work:

```bash
git status
```

After changes:

```bash
npm run typecheck
npm run test
git status
git diff
```

Commit only focused changes.

Example:

```bash
git add <changed-files>
git commit -m "Describe focused change"
git push
```

## Human Review Required Before

Require human review before implementing or changing:

- Wallet ledger rules
- Deposits or withdrawals
- Payment flows
- Payout logic
- Contest scoring rules
- Eligibility or compliance rules
- Responsible play features
- Supabase schema migrations
- Auth provider setup
