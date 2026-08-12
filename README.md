# PickRank

PickRank is a skill-based NFL pick-order contest app. For the MVP, users browse a weekly 15-quarterback slate, enter a contest, rank their top 10 quarterbacks by passing yards, and receive the lowest score when their rankings stay closest to the final results.

This repo is no longer a Phase 0 scaffold. It is an MVP-in-progress Next.js application with live app routes, Supabase-backed contest data, internal admin contest setup, saved final-results foundations, and internal validation tooling for provisional stats ingestion.

## Product Status

Implemented in the repo today:

- public marketing and app shell routes
- contest browse and contest detail pages backed by the shared contest repository
- auth flow with Google and magic-link entry points when Supabase env is configured
- profile completion and username flow
- protected contest entry flow with payment-review placeholder, entry success, and lineup builder
- internal `/admin/contests` workflow with operator gating, draft creation, validation, publish, and finalization surfaces
- saved final-results and final leaderboard reads for final contests
- Replay-backed and SportsDataIO-live provisional validation harnesses for internal stats testing
- Supabase/Postgres migrations through `db/migrations/0012_waitlist_signups.sql`
- unit and Playwright test coverage for the current app surfaces and core contest logic

Still intentionally incomplete or blocked:

- real-money payment provider integration
- withdrawals and full wallet ledger production flows
- public real-money launch readiness
- full eligibility, jurisdiction, KYC, and responsible-play enforcement
- production-ready live scoring or public provisional standings
- richer admin slate-building UX beyond the current narrow internal flow

## Source Of Truth

Read these first before changing behavior:

- `spec/product_spec.md`
- relevant files in `spec/features/`
- `docs/agent-handoff.md`

Supporting docs:

- `docs/design/DESIGN.md` for current design direction
- `docs/replay-provisional-order-foundation.md` for the provisional-stats boundary
- `docs/deployment.md` for deployment notes

## Stack

- Next.js App Router
- TypeScript
- React
- Tailwind CSS
- Supabase Auth + Postgres
- Zod validation
- Vitest for unit and integration-style tests
- Playwright for end-to-end coverage

The repo uses a service-oriented monolith shape: route handlers and pages under `app/`, reusable domain logic under `lib/`, UI components under `components/`, SQL migrations and seeds under `db/`, and test fixtures plus file-backed fallback data under `data/`.

## Current App Surface

Primary user-facing routes:

- `/`
- `/contests`
- `/contests/[contestId]`
- `/contests/[contestId]/payment`
- `/contests/[contestId]/success`
- `/contests/[contestId]/lineup`
- `/contests/[contestId]/results`
- `/leaderboard`
- `/profile`
- `/wallet`
- `/how-it-works`
- `/auth`

Internal route:

- `/admin/contests`

Bottom navigation currently includes `Home`, `Contests`, `Leaderboard`, and `Profile`. `Wallet` remains nested under Profile, and `How It Works` is linked contextually rather than included in the bottom nav.

## Architecture Notes

- Contest browse, contest detail, admin setup, and related state now flow through `lib/contest-data.ts`.
- In normal app usage, the contest repository reads and writes through Supabase/Postgres.
- Tests and explicit fixture-driven runs can use the file-backed store under `data/` instead. This also applies when `PICKRANK_E2E_USE_FILE_STORE=1`.
- Final saved scoring and leaderboard/results reads are separate from provisional stats snapshots.
- Provisional stats work is split into two modes: `replay_validation` and `in_season_live`.
- The human-confirmed `FINAL` publish path remains the official boundary for saved contest results.

## Local Setup

1. Install dependencies.
2. Copy `.env.example` to `.env.local`.
3. Fill in the required Supabase values.
4. Start the dev server.

```bash
npm install
npm run dev
```

Local app URL:

```text
http://localhost:3000
```

## Environment

Required for normal app auth and Supabase-backed app behavior:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Launch-mode control:

- `PICKRANK_EXPERIENCE_MODE`

The default is `early_access_beta`. Vercel Production is forced to `early_access_beta` in code, even if the environment variable is misconfigured. Use `paid_preview` only in local development or Vercel Preview deployments when working on future paid-contest UI. The paid-preview mode can expose future paid-mode surfaces, but it does not enable deposits, withdrawals, payouts, cash prizes, wallet-ledger movement, or real-money entry.

Required for trusted internal scripts and server-only writes after RLS hardening:

- `SUPABASE_SERVICE_ROLE_KEY`

Current provisional-stats seam in `.env.example`:

- `PICKRANK_PROVISIONAL_STATS_SOURCE_MODE`
- `PICKRANK_SPORTSDATAIO_REPLAY_API_KEY`
- `PICKRANK_SPORTSDATAIO_REPLAY_BASE_URL`
- `PICKRANK_SPORTSDATAIO_LIVE_API_KEY`
- `PICKRANK_SPORTSDATAIO_LIVE_BASE_URL`
- `PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE`
- `PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG`

The active documented defaults are Replay validation on `https://replay.sportsdata.io/api/v3/nfl` and a future in-season live path on `https://api.sportsdata.io/v3/nfl`.

## Useful Commands

Core app commands:

```bash
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Internal validation and simulation commands:

```bash
npm run simulate:nfl-scoring
npm run validate:replay-provisional
npm run prepare:live-validation-contest
npm run validate:live-provisional
```

## Repo Layout

```text
app/         Next.js routes, pages, and route handlers
components/  Shared UI and route-level client components
lib/         Contest, auth, scoring, provider, and Supabase logic
db/          SQL migrations and seed files
spec/        Product and feature source-of-truth docs
docs/        Handoff, deployment, design, and validation notes
tests/       Vitest and Playwright coverage
scripts/     Internal validation and simulation scripts
data/        File-backed fixtures and snapshot stores for tests/internal runs
public/      Brand and marketing assets
```

## Workflow Conventions

- Keep GitHub and this repo as the permanent project record.
- Treat `docs/agent-handoff.md` as a living status handoff and refresh it when repo reality or the next recommended move changes.
- Keep `README.md` high-level and durable; put slice-by-slice status in `docs/agent-handoff.md`.
- Treat `/spec` as behavior authority. Do not change product rules in code first.
- Treat `next-env.d.ts` as generated noise unless a task explicitly depends on it.
- Quote dynamic route paths like `app/contests/[contestId]/...` in `zsh`.

## Validation Expectations

For meaningful code changes, the normal repo baseline is:

```bash
npm run typecheck
npm run test
```

Playwright coverage exists, but local browser runs can still be environment-limited if the dev server cannot bind to `0.0.0.0:3000`.
