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

Current branch reality on `main` as of 2026-06-29:

- `main` is aligned with `origin/main`
- there are no committed but unpushed changes
- uncommitted tracked changes currently exist in contest/admin files and marketing/Remotion docs
- the current Remotion source baseline is a motion-polished `32s` waitlist-focused cut under `assets/marketing/video/`, aligned to the 15-player / pick-10 product framing and the `pickrankgames.com` brand
- the latest rendered review asset is `assets/marketing/video/out/pickrank-landing-video.mp4`
- `lib/contest-data.ts` now prefers a Supabase/Postgres-backed contest repository for contests, slate players, validation rows, and state events, while carrying a narrow temporary file fallback until the active Supabase project has migration `0005` plus the first real contest rows applied
- Supabase role foundations now exist in repo migrations for `roles` and `user_roles`, with `contest_operator` as the single enforced MVP internal role
- internal operator assignment can now be staged by email before signup through `pending_user_roles`, which auto-converts into a real `user_roles` assignment when the matching user account is created
- the active Supabase project now has migrations `0001` through `0004` applied, plus the `assign_first_contest_operator.sql` seed
- operator bootstrap is confirmed for `parkerhlevy@gmail.com` as a live `contest_operator`, while `glevy59@icloud.com` is correctly staged in `pending_user_roles` and should auto-convert after signup
- the admin flow now records `created_by_admin_id`, `validated_by_admin_id`, and `published_by_admin_id`, and draft contests can now carry real `slatePlayers` rows plus stricter publish validation through the shared contest repository layer
- the public contest lobby and contest detail pages now read contests that include real slate-player arrays, while the lineup shell still temporarily derives a 10-player subset from that slate
- protected contest-entry routes now share one auth gate for signed-out, profile-incomplete, and email-unverified users, and the contest-detail CTA mirrors that same gating path
- the current automated QA baseline now covers signed-out direct visits to `/contests/[contestId]/payment`, `/success`, and `/lineup`, plus ready-account browser verification of those same protected routes through a dedicated Playwright signed-in auth fixture
- Playwright now runs those protected-route checks against the repo fixture contest store by enabling `PICKRANK_E2E_AUTH=1` and `PICKRANK_E2E_USE_FILE_STORE=1` in the e2e web-server command, which keeps production auth gates intact while isolating browser QA from the still-incomplete live contest migration
- sandboxed browser runs still fail before startup with `listen EPERM: operation not permitted 0.0.0.0:3000`; Playwright verification is confirmed only in an environment that can bind the local dev server
- publish is intentionally human-confirmed even when validation passes; agent assistance is limited to preparation and validation support
- migration `db/migrations/0005_contest_repository_backing_fields.sql` adds the missing contest slug, description, season, contest type, entry count, display order, lineup shell, and validation uniqueness fields needed for the repository swap
- direct Supabase verification on 2026-06-29 confirmed the active project still lacks migration `0005`: a live read against `public.contests` failed with `column contests.slug does not exist`
- `db/seed/contest_repository_baseline.sql` now provides the current idempotent seed for one public contest plus one hidden draft contest after `0005` is applied
- the active Supabase project still needs migration `0005` plus the updated contest baseline seed before browser-verified local behavior can stop falling back to `data/contests.json`
- the admin UI now includes a narrow text-based slate input for operators, but full provider sync, richer editing controls, and the final removal of the temporary file fallback are still follow-ups
- `next-env.d.ts` should usually be treated as generated noise unless a slice specifically requires it
- untracked marketing video work currently lives under `assets/marketing/video/` and belongs to this repo when it supports PickRank launch work

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
Apply repo migration `0005` to the active Supabase project, run `db/seed/contest_repository_baseline.sql`, confirm `/contests`, contest detail, and `/admin/contests` are reading and writing against Postgres, and only then remove the temporary file fallback.
```

Definition of done:

- The configured Supabase project has migration `0005` applied on top of the already-live `0001` through `0004` foundation
- `db/seed/contest_repository_baseline.sql` has been run successfully
- At least one public contest and one operator-manageable draft exist in Postgres
- Local `/contests`, contest detail, and `/admin/contests` load without falling back to `data/contests.json`
- Human-confirmed publish remains the final operator checkpoint
- Update this handoff note if the database source of truth or the recommended next move changes

## Starter Prompt For Future Chats

Use this default starter prompt pattern unless the next slice needs a tighter scoped variation:

```text
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, `spec/features/implementation_roadmap.md`, `spec/features/contest_admin_setup.md`, `spec/features/backend_data_architecture.md`, and `spec/features/frontend_navigation.md`, plus the current contest admin, contest data, and role files. Work carefully with the in-progress marketing/Remotion files but do not disturb them. This slice is narrow: apply `db/migrations/0005_contest_repository_backing_fields.sql` to the active Supabase project, run `db/seed/contest_repository_baseline.sql`, confirm the app can read and write contest data from Postgres, and only then remove the temporary file fallback after `/contests`, contest detail, and `/admin/contests` still work. Keep the human-confirmed publish step and `contest_operator` gate intact, avoid payments, payouts, withdrawals, and compliance work, run typecheck, tests, and browser verification before closing, and refresh `docs/agent-handoff.md` if repo reality or the next recommended move changes. Explain results business-first: what changed, why it matters, what passed, and what I need to do next.
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
