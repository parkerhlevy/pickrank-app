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

Current branch reality on `main` as of 2026-07-12:

- `main` is currently synced with `origin/main`; there are no committed-but-unpushed changes on this machine, and the only local branch is still `main`
- the latest pushed repo baseline includes the 2026-07-07 leaderboard hardening plus Supabase access tightening that keeps `/leaderboard?contest=...` in explicit placeholder states for non-final contests and moves the hidden replay/live validation scripts onto `SUPABASE_SERVICE_ROLE_KEY`
- the homepage integration keeps the live landing page pointed at `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster, adds the Remotion repo-hygiene helper notes and script, and updates homepage coverage in `tests/e2e/homepage.spec.ts`
- the 2026-07-08 homepage landing-page polish pass keeps that same video baseline, keeps the tighter video-line headline `15 players. Pick 10. Rank them.`, shortens the hero copy, collapses the above-the-fold CTA to a single waitlist-focused action, and trims the extra helper copy in the hero and video card without changing product behavior
- the approved 2026-07-12 homepage hero, `How PickRank works`, `Why PickRank`, and final waitlist CTA are live in production at `https://www.pickrankgames.com` through Vercel deployment `dpl_3WqaWZoFabyhtmFvghNbjNDGrZof`; the production build is `READY`, the hero and final waitlist CTAs route to `/auth`, and the lower homepage now ends with the single `Think you can rank them better?` conversion section
- the matching source in `app/page.tsx` and focused homepage coverage in `tests/e2e/homepage.spec.ts` are aligned with this handoff update on `main`, keeping GitHub aligned with the live wording
- the 2026-07-08 brand follow-up now approves `public/brand/pickrank-wordmark-football-transparent-light.png` as a secondary dark-surface homepage and marketing variant, keeps `public/brand/source/pickrank-wordmark-football-transparent-light-preview-dark.png` as a reference preview only, and points the homepage hero at the transparent asset instead of the earlier white-`Pick` fallback
- repo verification for the latest homepage CTA lane passes `npm run typecheck`, `npm run test` (`27` files, `124` tests passed), focused `npx eslint app/page.tsx tests/e2e/homepage.spec.ts`, `git diff --check`, and `npx playwright test tests/e2e/homepage.spec.ts` when the local dev server is allowed to bind outside the sandbox
- GitHub auth on this machine has now been restored through `gh auth login`, and `gh auth setup-git` is configured in `~/.gitconfig` so future HTTPS pushes use GitHub CLI's credential helper instead of failing on missing local credentials
- the latest local provider/admin baseline now includes the repeatable Replay validation harness, the hidden 2026 in-season live validation contest prep and fetch helpers, and the `/admin/contests` provisional preview plus refresh surface
- the current Remotion source baseline is a motion-polished `34.5s` waitlist-focused cut under `assets/marketing/video/`, aligned to the 15-player / pick-10 product framing and the `pickrankgames.com` brand
- the latest rendered review asset is `assets/marketing/video/out/pickrank-landing-video.mp4`
- the live landing page now serves the finalized `Locked In` export from `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster image, while the Remotion source-of-truth render remains under `assets/marketing/video/out/`
- the latest local video pass on 2026-07-02 loosened headline tracking for readability, removed the misleading ranking arrow marker, and rebuilt the scoring beat into a simpler two-example points equation so the slide reads as "lowest total wins" instead of a dense rule card
- the latest local video pass on 2026-07-03 restored several scene states that had drifted backward during earlier scoring/readability edits: selection now uses `Slate` and `Your Board`, ranking now animates to a clean final reorder with Mahomes landing in `#1`, scoring cards and rule pills are aligned more consistently, the differentiator headline is split into three lines, the weekly board shows actual point totals, and the CTA again uses the logo plus one waitlist button instead of duplicate waitlist copy
- the current cut lock now lives in `docs/marketing/remotion-current-cut.md`; future Remotion passes should read that file before editing scene copy, UI state, or CTA content so older brief ideas do not slip back into the active cut
- the latest local video pass on 2026-07-03 also slowed the cut so every scene now runs at least four seconds, accented `Pick your 10.` in Selection, switched the Ranking header to `Drag & drop`, tightened the Scoring pills and player cards, and kept the CTA on the high-contrast white-`Pick` logo variant
- the latest local video pass on 2026-07-03 now points the CTA to an interim white-`Pick` logo asset from the downloaded brand review set and layers in an original upbeat WAV music bed inside the Remotion project, which keeps the current export self-contained and free of third-party licensing dependency while a true transparent brand master is still pending
- Parker has now completed the music-selection reset using real licensable reference tracks, chose PremiumBeat's `Locked In` over `Design in Motion` in direct video review, and the current default Remotion cut points at a licensed `Locked In` short WAV trimmed into the heavier groove so one natural break lands at the Scoring scene transition without over-syncing every beat
- `lib/contest-data.ts` now reads and writes contest browse/admin data directly against Supabase/Postgres in normal app use, while keeping file-backed fixtures only for tests and explicit fixture-driven runs
- `data/contest-entries.json` now belongs with that fixture-backed path and should be treated as intentional repo fixture data alongside `data/contests.json`, not ignored or deleted as throwaway runtime output
- Supabase role foundations now exist in repo migrations for `roles` and `user_roles`, with `contest_operator` as the single enforced MVP internal role
- internal operator assignment can now be staged by email before signup through `pending_user_roles`, which auto-converts into a real `user_roles` assignment when the matching user account is created
- the active Supabase project now has migrations `0001` through `0004` applied, plus the `assign_first_contest_operator.sql` seed
- operator bootstrap is confirmed for `parkerhlevy@gmail.com` as a live `contest_operator`, while `glevy59@icloud.com` is correctly staged in `pending_user_roles` and should auto-convert after signup
- the admin flow now records `created_by_admin_id`, `validated_by_admin_id`, and `published_by_admin_id`, and draft contests can now carry real `slatePlayers` rows plus stricter publish validation through the shared contest repository layer
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
- GitHub push access from this machine is working again, and the current committed repo baseline is back on GitHub; production deployment still needs to catch up separately when the next approved deploy happens
- final live browser verification on 2026-06-30 confirms public `/contests` now shows Week 1 as `Open` and Week 2 as `Scheduled`, while signed-in admin `/admin/contests` shows both records as visible under the `contest_operator` gate with publish controls inactive for those already-published contests
- contest finalization now has a saved-results foundation: operators can prefill final stat rows from a provider-backed adapter seam, still type `FINAL` to confirm scoring, and publish saved contest results plus final leaderboard standings without exposing live scoring
- the official finalization seam still supports disabled, file-backed, and persisted-snapshot flows for final stat prefills, while the repo now also has a separate Replay-backed provisional snapshot foundation plus a manual admin fetch action for live QB passing-yard ordering and operator review prep
- provisional Replay snapshots now persist into dedicated provisional snapshot storage and carry normalized rank groups, game-state counts, and provider-keyed row data without touching the saved final-results tables or the typed `FINAL` confirmation gate
- the 2026-07-03 live Replay validation pass now confirms the provisional Replay routes needed for this slice live under `https://replay.sportsdata.io/api/v3/nfl/...?...key=...`, not the standard SportsDataIO host/header flow and not the earlier non-`v3` Replay path assumption
- the linked Vercel project now has a Replay key available for live validation, and the active Supabase project now exposes `contest_provisional_stat_snapshots` plus `contest_provisional_stat_snapshot_rows` through the REST schema used by the app
- the saved public Week 1 contest is still intentionally untouched at `season = 2026`, but there is now one hidden internal Replay validation contest at `week-1-qb-passing-yards-replay-validation-2025` that truthfully matches the `2025REG/1` package well enough for live provisional verification
- live package inspection still shows 14 of the 15 saved quarterbacks can be lined up directly to numeric SportsDataIO `PlayerID` values and package `ScoreID` values, `Kirk Cousins` appears only as Atlanta's QB2 in the recording, and `Derek Carr` does not appear as a package-matched Week 1 starter, so the internal validation slate replaces Carr with `Kyler Murray` and keeps Cousins on truthful numeric IDs
- a credential-backed run on 2026-07-04 now succeeds end to end: the hidden validation contest saves with real SportsDataIO IDs, Replay-backed provisional rows persist into `contest_provisional_stat_snapshots` plus `contest_provisional_stat_snapshot_rows`, and the latest saved snapshot currently reads `10 total / 0 scheduled / 0 in progress / 10 final` with the QB passing-yard order beginning `Josh Allen`, `Justin Herbert`, `Brock Purdy`, `Patrick Mahomes`, `Matthew Stafford`
- `scripts/replay-provisional-validation.mjs` is now the repeatable internal harness for this slice, and `npm run validate:replay-provisional` will upsert the hidden 2025 validation slate, hit the confirmed Replay `v3` routes, save one provisional snapshot, and fail loudly if the saved order or game counts drift from the currently confirmed package state
- `/admin/contests` now includes one internal Replay validation preview surface for the hidden `week-1-qb-passing-yards-replay-validation-2025` contest, showing the latest saved provisional QB passing-yard order plus scheduled, in-progress, final, and total game counts without changing the official `FINAL`-gated publish path
- that same `/admin/contests` preview surface can now trigger a narrow internal refresh path for the hidden validation contest, which re-upserts the truthful 2025 Replay validation slate, saves a new provisional snapshot through the Replay adapter, and then reloads the latest saved order plus game counts without touching official finalization
- `lib/stats-provider.ts` now performs a Replay readiness check before live provisional fetches and now calls the confirmed Replay `v3` host/query route family for provisional calls; the official `FINAL` publish path remains unchanged. The current live validation notes are captured in `docs/replay-provisional-live-validation-2026-07-03.md`
- `docs/replay-provisional-order-foundation.md` and `spec/features/stat_finalization.md` now explicitly document the boundary between Replay-backed validation mode, future true in-season live-data mode, and the unchanged human-confirmed `FINAL` publish path; future provider work should preserve that three-mode separation
- `.env.example` and `lib/env.ts` now reserve the future in-season live config seam explicitly: `PICKRANK_PROVISIONAL_STATS_SOURCE_MODE`, separate Replay versus live SportsDataIO base URLs and keys, and a live auth-mode setting so the repo can cut over to the standard SportsDataIO live host/header contract without mutating the current Replay validation path
- the current documented in-season target is SportsDataIO's standard live NFL API on `https://api.sportsdata.io/v3/nfl` with live entitlement for `ScoresByWeek` plus `PlayerGameStatsByWeek`; the exact account-level entitlement labels still need to be confirmed in the SportsDataIO portal on the active live key before production wiring
- `lib/stats-provider.ts` now also exposes a separate `SportsDataIO Live` provisional fetch path that hits `scores/json/ScoresByWeek` plus `stats/json/PlayerGameStatsByWeek` on the standard live host using header auth, while still persisting into the same provisional snapshot contract and leaving Replay validation plus the official `FINAL` publish path unchanged
- `lib/in-season-live-validation.ts` and `scripts/live-provisional-validation.mjs` now provide the first repeatable internal live-key verification lane: given `PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG`, the helper loads one saved current-season contest slate from `contest_slate_players`, validates that its saved SportsDataIO IDs are numeric, fetches one live provisional snapshot, and persists it through the existing provisional snapshot store
- `npm run validate:live-provisional` is now the narrow harness for the next operator proof once a truthful current-season contest slug and live key are available; it is expected to fail loudly on missing env, missing entitlement, non-numeric IDs, or upstream payload drift rather than silently falling back
- a read-only Supabase check on 2026-07-05 confirms the current live database still does not have a truthful current-season slug ready for that harness: `week-2-qb-passing-yards-draft` and public `week-1-qb-passing-yards` each have `15` slate rows but `0/15` numeric `provider_player_id` values and `0/15` numeric `provider_game_id` values, while only the hidden `week-1-qb-passing-yards-replay-validation-2025` contest has `15/15` numeric IDs
- `.env.local` on this machine now includes the narrow live-validation seam needed for current-season proofing: `PICKRANK_SPORTSDATAIO_LIVE_API_KEY`, `PICKRANK_SPORTSDATAIO_LIVE_BASE_URL=https://api.sportsdata.io/v3/nfl`, `PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE=header`, and `PICKRANK_IN_SEASON_LIVE_CONTEST_SLUG=week-1-qb-passing-yards-live-validation-2026`
- a credential-backed SportsDataIO live probe on 2026-07-05 confirmed the active live key is valid against the standard host/header contract and currently returns `ScoresByWeek/2026reg/1` successfully while `PlayerGameStatsByWeek/2026reg/1` is still empty before games begin
- `lib/in-season-live-validation-prep.ts` plus `scripts/prepare-live-validation-contest.mjs` now define the first truthful current-season internal validation contest path: start from the public Week 1 QB slate, replace placeholder matchups with the real `2026reg/1` schedule, replace stale quarterbacks with the current team QB1 from SportsDataIO depth charts, save numeric `PlayerID` plus `ScoreID` values into a hidden contest, and leave the public contest plus official `FINAL` publish path unchanged
- the hidden `week-1-qb-passing-yards-live-validation-2026` contest now exists in Supabase with `15/15` numeric SportsDataIO player and game identifiers; the current truthful replacements are `Derek Carr -> Tyler Shough`, `Kirk Cousins -> Michael Penix Jr.`, and `Tua Tagovailoa -> Malik Willis`, and most placeholder public matchups were corrected to the real 2026 Week 1 schedule
- `npm run prepare:live-validation-contest` is now the repeatable builder for that hidden 2026 slate, and `tests/unit/in-season-live-validation-prep.test.ts` covers the matchup-rewrite plus starter-replacement rules
- `npm run validate:live-provisional` now succeeds end to end against the hidden 2026 contest by fetching live `ScoresByWeek` plus `PlayerGameStatsByWeek`, building the provisional order, and saving a new row set into `contest_provisional_stat_snapshots` plus `contest_provisional_stat_snapshot_rows` without changing public contests or the official `FINAL` gate
- the latest saved live snapshot on 2026-07-06 currently reads `12 total / 12 scheduled / 0 in progress / 0 final`, which is the expected pre-kickoff state for the hidden 2026 validation contest because the live player-stat feed is still empty before Week 1 games begin
- rerun `npm run validate:live-provisional` during preseason games as the likely first realistic live-fire testing window for non-zero SportsDataIO player stats, in-progress game states, and truthful snapshot ordering before the regular-season operator path matters
- public `/contests/[contestId]/results` and `/leaderboard?contest=...` now read from saved final results after a contest reaches `final` or `paid_out`
- the 2026-07-07 leaderboard hardening pass now treats open, live, finalizing, canceled, and under-review contests as explicit placeholder states on `/leaderboard?contest=...` instead of falling through the final-results read path, so public Week 1 open-contest visits render a status-aware placeholder with contest-detail and open-contests CTAs rather than a live server crash
- repo verification for the committed scoring/results slice includes unit coverage for stat ingestion, ranking, tie handling, finalization, and saved results plus Playwright coverage for operator finalization and signed-in final-results viewing; the current provisional snapshot foundation additionally passes `npm run typecheck`, focused provisional/provider tests, and the full Vitest suite via `npx vitest run --maxWorkers=1` in this constrained environment
- the 2026-07-03 weekly repo-maintenance pass deleted six fully merged local `codex/*` branches, so the active local branch set is still just `main`
- the 2026-07-10 weekly repo-maintenance pass confirmed there is no second local worktree and no committed-but-unpushed branch work to consolidate
- merged remote refs still include the older `origin/codex/*` stack plus `origin/spec/results-reveal-clean`; treat those as optional remote-side cleanup candidates later, not as local blockers
- live remote-prune verification was not completed on 2026-07-10 because GitHub DNS/network access was unavailable from this environment, so no remote-tracking refs were deleted during this maintenance pass
- `next-env.d.ts` should usually be treated as generated noise unless a slice specifically requires it
- security hardening is now an explicit repo boundary: migration `db/migrations/0009_rls_hardening.sql` enables RLS on the main public-schema app tables, keeps public reads narrow to visible contests and final results, limits entry and lineup mutations to the signed-in owner during `open`, and reserves admin and snapshot writes for `contest_operator`
- the focused security-remediation lane now fails paid entry confirmation closed until verified payment infrastructure exists, moves free/test entry creation behind a POST server action, keeps E2E entry mode non-production-only, and adds migration `0010_entry_integrity_hardening.sql` for atomic free-entry creation, same-contest lineup membership, and immutable entry ownership fields
- migration `0010_entry_integrity_hardening.sql` is now runtime-verified against a disposable local Supabase database after a clean reset through migrations `0001`-`0010`; `db/tests/0010_entry_integrity_hardening.sql` covers successful and idempotent free entry, count integrity, paid/cross-contest/duplicate rejection, verified-profile gates, and denial of direct entry and cross-contest lineup writes
- file-backed E2E/test entries increment total entry count but no longer increment `paidEntryCount`; only a future verified payment or wallet-entitlement path may mark an entry paid
- deferred security release gate: the database branch of `removePersistedContestEntry` is intentionally denied by migration `0010` and must not be enabled by restoring direct authenticated `INSERT`, `UPDATE`, or `DELETE` access on `entries`; future paid-entry, wallet, refund, or cancellation work must replace it with narrow server-authoritative RPCs that validate ownership, contest state, and payment/refund entitlement while updating the entry, lineup, contest counts, payment status, and append-only wallet ledger atomically
- before any payment/wallet or entry-cancellation slice closes, rerun `db/tests/0010_entry_integrity_hardening.sql` and add executable database coverage for unauthorized and cross-user cancellation, payment/refund coupling, atomic rollback, idempotent retries, contest-state cutoffs, and ledger/count reconciliation; failure of any case is release-blocking
- the internal replay/live validation scripts now require `SUPABASE_SERVICE_ROLE_KEY` instead of the browser anon key because those hidden validation contests and snapshot tables should no longer depend on public-table access
- the 2026-07-13 read-only security review of auth, entry, results, admin, provisional snapshot, and hidden validation-script boundaries passed `npm run typecheck` plus `npm run test` (`27` files, `124` tests passed), but it flagged two follow-up hardening items before more auth or operator workflow widening: auth redirect origin construction still trusts forwarded host headers in `app/auth/actions.ts` and `app/auth/callback/route.ts`, and the results path still depends on a blanket public `profiles` read policy plus `select('*')` lookup even though it only needs public display handles
- the active marketing/Remotion and design-doc work was intentionally parked on 2026-07-02 in the local stashes `parked-remotion-design-2026-07-02` and `parked-next-env-noise-2026-07-02`; there is no active marketing dirt in the live `main` worktree right now
- the earlier `/private/tmp/pickrank-lineup-verify` detached worktree is no longer present on disk, but there is currently one separate active local worktree at `/private/tmp/pickrank-waitlist` on branch `codex/waitlist-workflow`; treat that branch as a distinct lane and keep it out of `main` hygiene or security follow-up commits unless Parker explicitly asks to reconcile it
- the live `main` worktree is currently effectively clean aside from generated `next-env.d.ts` churn from local Next.js and Playwright runs
- the 2026-07-04 shared-shell cleanup pass now carries the same header, status notice, section-card, badge, CTA, spacing, and placeholder framing system across the public and auth-gated shell surfaces, including `/`, `/contests`, `/contests/[contestId]`, `/payment`, `/success`, `/how-it-works`, `/auth`, `/profile`, `/wallet`, `/leaderboard`, `/contests/[contestId]/results`, and the saved and locked lineup states on `/contests/[contestId]/lineup`, without changing routing, auth gating, lineup rules, scoring, payouts, wallet rules, compliance boundaries, or admin/provider behavior
- `docs/design/DESIGN.md` is now the canonical design entrypoint for future UI work, with `figma-screenshot-audit.md`, `figma-v1.md`, and `figma-make-reference.md` treated as supporting presentation references behind `/spec` and `docs/agent-handoff.md`
- repo verification for that UI cleanup passes `npm run typecheck` and `npm run test`, and the focused lineup Playwright assertions are now aligned to the current `10/10 Ranked` and `Left in Slate` copy; direct sandbox startup still hits `listen EPERM` on `0.0.0.0:3000`, but the focused auth-gated entry-flow browser pass now succeeds when the local test server is allowed to start outside the sandbox via `npx playwright test tests/e2e/lineup-builder.spec.ts`
- the latest local browser verification on 2026-07-07 confirms `http://localhost:3000/leaderboard?contest=week-1-qb-passing-yards` now returns `200` with the new non-final placeholder state, `http://localhost:3000/contests/week-1-qb-passing-yards` still returns `200`, and the unauthenticated open-contest results path still redirects cleanly to `/auth?next=%2Fcontests%2Fweek-1-qb-passing-yards%2Fresults` without a browser-visible server error
- the locked Remotion music-cut slice now also passes repo `npm run typecheck`, repo `npm run test`, `npm run lint` inside `assets/marketing/video`, and a full unsandboxed `npm run render -- --timeout=120000` export of `PickRankLandingVideo`
- the Remotion repo-hygiene pass now keeps the committed baseline anchored to `audio/locked-in-final.wav`, the `brand/pickrank-wordmark-white-pick.png` CTA asset, and the lightweight regeneration helper under `assets/marketing/video/scripts/`, while ignoring the disposable hype-bed WAV set, the bulky local `locked-in-source/` package dump, and the unused alternate `pickrank-wordmark-light.png`
- there is no active uncommitted spec clarification draft in `spec/` right now
- `next-env.d.ts` is currently modified with the newer typed-route import/footer form; treat that file as generated noise unless a future slice explicitly needs that exact diff

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
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` files for the slice you are about to work on, plus any in-progress worktree files already involved. Work carefully with existing in-progress files. Keep the slice narrow, avoid payouts, scoring, real-money, compliance, and other broader lifecycle work unless explicitly requested, and run typecheck, tests, and browser verification before closing. Before you finish, refresh `docs/agent-handoff.md` if the slice changed repo reality or the next recommended move.

For this slice: run a broader security review focused on the newly hardened auth, entry, results, admin, provisional snapshot, and hidden validation-script access boundaries before more provider or operator workflow changes land.
```

Definition of done:

- The repo stays synced with `origin/main` after the next slice lands
- The worktree remains single-lane and effectively clean aside from intentional generated noise like `next-env.d.ts`
- The focused security scan confirms there is no obvious regression in public reads, signed-in entry writes, admin-only actions, final-results access, or service-role-only hidden validation paths
- Any validated security finding or meaningful residual risk is written back into repo docs before the slice closes
- Generated `next-env.d.ts` churn stays out of follow-up commits unless the exact diff is intentionally required
- No unrelated product, provider, auth, admin, or design-system files are mixed into the next slice
- Relevant repo verification still runs before closeout, with browser checks added when the slice touches rendered route behavior or QA contracts
- Update this handoff note again if repo reality or the next recommended move changes

Replace that completed review prompt with this next narrow follow-up:

```text
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, `spec/features/account_profile_auth.md`, `spec/features/backend_data_architecture.md`, `spec/features/contest_admin_setup.md`, and `spec/features/stat_finalization.md`, plus the live auth/results files already involved. Keep the slice narrow and security-only. Harden two validated follow-ups from the 2026-07-13 audit: stop deriving auth callback origins from untrusted forwarded host headers, and narrow leaderboard/results profile reads so public final-results display does not depend on blanket `profiles` table exposure. Preserve the current entry, admin, provisional snapshot, and `FINAL` publish boundaries. Run typecheck, tests, and browser verification before closing, then refresh `docs/agent-handoff.md`.
```

## Starter Prompt For Future Chats

Use this default starter prompt pattern unless the next slice needs a tighter scoped variation:

```text
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Keep this slice limited to the next concrete product or deployment milestone, not git recovery. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` file for the area you are touching, plus any route, QA, or marketing docs that directly govern that slice. Keep the slice narrow, avoid mixing provider/admin/auth/marketing work unless the files clearly belong together, and treat `next-env.d.ts` as generated noise unless a diff proves otherwise. Explain results business-first: what changed, why it matters, what passed, what remains risky, and what I need to do next.
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
