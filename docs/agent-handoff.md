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

Use an ASD-STE100-inspired clarity standard for Parker-facing explanations, project updates, plans, handoffs, and technical summaries. This is not a claim of formal ASD-STE100 compliance. Use clear, controlled technical English. Prefer short sentences. Put one idea in each sentence. Use active voice. Use the same word for the same thing. Define acronyms or avoid them. Keep paragraphs short. Avoid filler, ornate phrasing, abstract metaphors, and long caveats. Preserve exact PickRank product, legal, compliance, and technical terms when precision matters.

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

Current branch reality on `main` as of 2026-08-05:

- this machine is currently on `main`; live Git shows `main` is ahead of `origin/main` by one gameplay presentation commit, `8ac5bad Polish board matchup context display`
- there is one focused uncommitted gameplay diff in `components/contests/lineup-builder-client.tsx` for the mobile Build Your Board cleanup; keep it separate from the parked Remotion/video/generated lane
- the latest product baseline now includes one presentation-only player-pool/board terminology slice plus one gameplay-page usability cleanup across public routes, entry handoff copy, Contest Detail, Entry Review, Entry Success, the board-builder surface, shared board preview, and focused tests
- the remaining live worktree dirt belongs to the parked Remotion/video/generated lane: `assets/marketing/video/**`, `docs/marketing/remotion-current-cut.md`, `public/marketing/pickrank-landing-video-locked-in-final.mp4`, and generated `next-env.d.ts`; keep those files out of unrelated commits unless the next slice explicitly resumes the marketing-video lane
- Early Access Beta is now the pushed and deployed production posture: public launch contests are free to play, visible launch contest seed data uses `$0.00` entry cost and `0` paid entries, public copy uses Beta Pass/no-cash-value/no-payout language, `/contests/:contest_id/payment` remains the route but is labeled `Entry Review`, and paid contests remain the future product direction behind legal, provider, payment, withdrawal, and compliance gates
- Vercel production deployment `dpl_2KU3hFwby5MS5PsoMqJ7WHYoEf89` is `READY` for commit `55b2bfcd71b74a44c9d0fd62f3aed8262287a20f` with deployment URL `https://pickrank-lqyzb25u3-parker-levys-projects.vercel.app`
- repo verification for the Early Access Beta pivot passed `npm run typecheck`, `npm run test` (`36` files, `196` tests), focused `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/lineup-builder.spec.ts --workers=1` (`14` passed), focused `npx playwright test tests/e2e/final-results.spec.ts --workers=1` (`4` passed), and `git diff --check`
- the latest pushed repo baseline includes the 2026-07-07 leaderboard hardening plus Supabase access tightening that keeps `/leaderboard?contest=...` in explicit placeholder states for non-final contests and moves the hidden replay/live validation scripts onto `SUPABASE_SERVICE_ROLE_KEY`
- the homepage integration keeps the live landing page pointed at `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster, adds the Remotion repo-hygiene helper notes and script, and updates homepage coverage in `tests/e2e/homepage.spec.ts`
- the 2026-07-08 homepage landing-page polish pass keeps that same video baseline, keeps the tighter video-line headline `15 players. Pick 10. Rank them.`, shortens the hero copy, collapses the above-the-fold CTA to a single waitlist-focused action, and trims the extra helper copy in the hero and video card without changing product behavior
- the approved 2026-07-12 homepage hero, `How PickRank works`, `Why PickRank`, and final waitlist CTA are live in production at `https://www.pickrankgames.com` through Vercel deployment `dpl_3WqaWZoFabyhtmFvghNbjNDGrZof`; the production build is `READY`, the hero and final waitlist CTAs route to `/auth`, and the lower homepage now ends with the single `Think you can rank them better?` conversion section
- the matching source in `app/page.tsx` and focused homepage coverage in `tests/e2e/homepage.spec.ts` are aligned with this handoff update on `main`, keeping GitHub aligned with the live wording
- the 2026-07-21 waitlist reconciliation slice is live in production: homepage waitlist CTAs are email-only forms with an explicit marketing-consent checkbox, `public.waitlist_signups` is the Supabase source of truth from migration `0012_waitlist_signups.sql`, Resend contact/welcome-email sync stays server-only behind `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, and `RESEND_WAITLIST_SEGMENT_ID`, and `/auth` remains reserved for protected account/contest flows; Parker applied `0012` to linked Supabase project `jmvzdspiobcjrewndhuf`, confirmed `public.waitlist_signups` exists, created the Resend `PickRank Waitlist` segment, added the required Resend variables plus `SUPABASE_SERVICE_ROLE_KEY` in Vercel for Production and Preview, changed the Resend key to Full access, and production testing confirmed Supabase capture, Resend segment sync, and welcome-email send; the remaining follow-up is email deliverability polish because a successful test email reached Parker's work-email junk folder
- `docs/waitlist-workflow.md` records the narrow deliverability-prep boundary for that follow-up, and `docs/waitlist-deliverability-audit-2026-07-22.md` now includes the live deliverability result: after explicit approval, `auth.pickrankgames.com` was removed from Resend to stay on the one-domain plan, `pickrankgames.com` was added and verified in Resend, authoritative DNS moved from ZenBusiness SystemDNS to Cloudflare Free nameservers `gannon.ns.cloudflare.com` and `val.ns.cloudflare.com`, Cloudflare carries the copied web/mail records plus the new Resend DKIM, return-path SPF/MX, and DMARC records, Vercel `RESEND_FROM_EMAIL` now uses `PickRank <hello@pickrankgames.com>` for Production and Preview while `RESEND_REPLY_TO_EMAIL` remains unchanged, Production was redeployed from `main` commit `5402c0a`, and a fresh Gmail plus-alias production signup landed in Gmail Inbox/Updates with Resend `Delivered`, `From: PickRank <hello@pickrankgames.com>`, root-domain DKIM pass, return-path SPF pass for `send.pickrankgames.com`, and unchanged `Reply-To: info@pickrankgames.com`; treat root-domain waitlist deliverability as good enough for the current priority level, with iCloud, Outlook/Hotmail, work-email retesting, tracking metrics, and stricter DMARC left as later polish
- the 2026-07-18 Contest-as-Board presentation slice adds reusable `components/contests/contest-board-preview.tsx` and wires it into Home, Open Contests, and Contest Detail so each contest reads as its own slate-to-ranked-10 board before the auth-gated lineup builder; this keeps routes, auth gates, scoring, entry, payout, wallet, and contest-data behavior unchanged
- repo verification for the 2026-07-18 Contest-as-Board slice passes `npm run typecheck`, focused `npx eslint app/page.tsx app/contests/page.tsx 'app/contests/[contestId]/page.tsx' components/contests/contest-board-preview.tsx`, `npm run test` (`27` files, `126` tests passed), and `npx playwright test tests/e2e/homepage.spec.ts`; Playwright route screenshots were captured only after allowing Chromium outside the macOS sandbox because sandboxed browser launch failed at `MachPortRendezvousServer` permission setup
- the follow-on 2026-07-18 auth-gated Contest-as-Board slice extends the same component with a non-interactive stage panel for Payment Review, Entry Success, and Build Your Lineup, preserving the pre-entry boundary by saying the ranked 10 is ready after entry instead of showing a fake assigned lineup before confirmation
- repo verification for the auth-gated Contest-as-Board slice passes `npm run typecheck`, focused `npx eslint 'app/contests/[contestId]/payment/page.tsx' 'app/contests/[contestId]/success/page.tsx' 'app/contests/[contestId]/lineup/page.tsx' components/contests/lineup-builder-client.tsx components/contests/contest-board-preview.tsx`, `npm run test` (`27` files, `126` tests passed), and `npx playwright test tests/e2e/lineup-builder.spec.ts`; signed-in screenshots were captured with the same E2E auth/file-store server environment used by Playwright
- the 2026-07-18 final-state Contest-as-Board slice reuses that stage panel on saved-final Leaderboard and entrant Results so the final views read as the resolved contest board, while open/live/finalizing placeholder states still avoid live-scoring implications
- repo verification for the final-state Contest-as-Board slice passes `npm run typecheck`, focused `npx eslint app/leaderboard/page.tsx 'app/contests/[contestId]/results/page.tsx' components/contests/contest-board-preview.tsx`, `npm run test` (`27` files, `126` tests passed), and `npx playwright test tests/e2e/final-results.spec.ts`; final-state screenshots were captured from a temporary restored fixture that runs final scoring through the admin path and leaves `data/` clean
- the 2026-07-19 Leaderboard/Results final-state density slice keeps behavior unchanged while polishing saved-final surfaces: Leaderboard now uses a stronger first-place hierarchy, more readable second/third cards, denser saved standing rows, and explicit display-name truncation; entrant Results now leads with a clearer saved-final summary, separates payout status from the saved-standings path, and makes the expanded player breakdown easier to scan without changing finality gates, scoring, tie, payout, wallet, provider, or availability behavior
- repo verification for the Leaderboard/Results final-state density slice passes `npm run typecheck`, focused `npx eslint app/leaderboard/page.tsx 'app/contests/[contestId]/results/page.tsx'`, `npm run test` (`27` files, `126` tests passed), and `npx playwright test tests/e2e/final-results.spec.ts` (`3` passed) after the expected sandbox `listen EPERM` bind failure; desktop and mobile screenshots for final Leaderboard and Results were captured under `/Users/parkerlevy/.codex/visualizations/2026/07/19/019f7939-3051-7aa1-aa24-a70bde060dd5/pickrank-final-surfaces/`, and the temporary final-results fixture restored `data/` clean afterward
- the 2026-07-19 Build Your Lineup interaction-quality slice keeps behavior unchanged while making the saved-entry editor feel more tactile: the screen header now exposes ranked/slate/save metrics, ranked rows use stronger rank badges and drag handles, row badges distinguish saved ranks from moved/new unsaved selections, available-slate cards scan as a clean one-column list inside the mobile-first shell, and the sticky save panel now mirrors saved versus unsaved state
- repo verification for the Build Your Lineup interaction-quality slice passes `npm run typecheck`, focused `npx eslint components/contests/lineup-builder-client.tsx tests/e2e/lineup-builder.spec.ts`, `npm run test` (`27` files, `126` tests passed), and `npx playwright test tests/e2e/lineup-builder.spec.ts` (`5` passed) after the expected sandbox `listen EPERM` bind failure; desktop saved-state and mobile unsaved-state screenshots were captured at `/private/tmp/pickrank-lineup-desktop-saved.png` and `/private/tmp/pickrank-lineup-mobile-unsaved.png`
- the 2026-07-19 Wallet/Profile product-feel slice keeps behavior unchanged while making `/profile` read as the PickRank account surface and `/wallet` read as the secondary balance route: Profile now emphasizes contest identity, account session, entry readiness, and one-tap wallet access; Wallet now emphasizes Cash Balance versus Site Credit, future contest-entry funding order, disabled wallet actions, and provider/compliance review boundaries without adding wallet ledger, deposit, withdrawal, provider, eligibility, auth, payout, or transaction behavior
- repo verification for the Wallet/Profile product-feel slice passes `npm run typecheck`, focused `npx eslint app/profile/page.tsx app/wallet/page.tsx`, and `npm run test` (`27` files, `126` tests passed); Profile and Wallet screenshots were captured at mobile and desktop sizes after allowing Chromium outside the macOS sandbox because sandboxed browser launch failed at `MachPortRendezvousServer` permission setup and sandboxed `next dev` still fails with `listen EPERM`
- the 2026-07-24 eligibility foundation slice keeps logged-out browsing and the waitlist flow unchanged while adding age confirmation, state/jurisdiction capture, Terms acceptance, Privacy acceptance, eligibility-status placeholders, KYC/self-exclusion placeholders, and paid-entry server blocking hooks on top of the existing auth/profile baseline; `/profile` stores the current foundation fields in Supabase auth metadata with `eligibility_status = pending_review` by default, `/contests/[contestId]/payment` surfaces eligibility status before confirmation, and `confirmContestEntryAction` now checks eligibility before creating any paid entry
- migration `db/migrations/0013_eligibility_foundation.sql` adds future database backing fields/tables for profile eligibility, jurisdiction rules, responsible-play status, and compliance eligibility events with RLS enabled; it does not seed supported states, implement geolocation, add a KYC vendor, add payments, add withdrawals, or create a state-by-state rules engine
- repo verification for the eligibility foundation slice passes `npm run typecheck`, focused `npx eslint lib/auth-profile.ts lib/viewer-identity.ts lib/contest-entry-confirmation.ts app/profile/page.tsx app/profile/actions.ts 'app/contests/[contestId]/payment/page.tsx' 'app/contests/[contestId]/payment/actions.ts' tests/unit/auth-profile.test.ts tests/unit/viewer-identity.test.ts tests/unit/contest-entry-confirmation.test.ts tests/unit/supabase-rls-hardening.test.ts tests/e2e/fixtures/protected-entry-auth.ts`, focused `npx vitest run tests/unit/auth-profile.test.ts tests/unit/contest-entry-confirmation.test.ts tests/unit/supabase-rls-hardening.test.ts`, full `npm run test` (`29` files, `145` tests passed), `git diff --check`, and `npx playwright test tests/e2e/lineup-builder.spec.ts` (`5` passed) after the expected sandbox `listen EPERM` failure and rerun outside the sandbox
- the 2026-07-24 eligibility deployment-readiness follow-up applied `db/migrations/0013_eligibility_foundation.sql` directly to linked Supabase project `jmvzdspiobcjrewndhuf` after preflight confirmed `public.profiles` existed and the three new eligibility tables did not; post-apply verification confirmed `public.jurisdiction_rules`, `public.responsible_play_statuses`, and `public.compliance_eligibility_events` now exist, all twelve new `public.profiles` eligibility columns exist, and the expected select/update RLS policies were created
- local browser verification for the deployment-readiness follow-up adds pending-eligibility coverage to `tests/e2e/lineup-builder.spec.ts`: a signed-in E2E user with age, jurisdiction, Terms, and Privacy captured but `eligibility_status = pending_review` sees paid entry blocked on Payment Review; the focused Playwright suite now passes `6` tests after the expected sandbox `listen EPERM` failure and rerun outside the sandbox
- the 2026-07-26 contest-detail eligibility CTA polish keeps the existing server-side paid-entry block unchanged while making the first contest CTA match the real eligibility state: captured-but-`pending_review` accounts now see a disabled amber `Eligibility Pending Review` status instead of a clickable `Enter Contest - $5`, and blocked accounts see a disabled red `Paid Entry Unavailable` status; Payment Review remains server-blocked if reached directly
- repo verification for the contest-detail eligibility CTA polish passes `npm run typecheck`, focused `npx eslint lib/contest-entry-flow.ts 'app/contests/[contestId]/page.tsx' tests/unit/contest-entry-flow.test.ts tests/e2e/lineup-builder.spec.ts`, focused `npx vitest run tests/unit/contest-entry-flow.test.ts` (`18` tests passed), full `npm run test` (`29` files, `153` tests passed), and `npx playwright test tests/e2e/lineup-builder.spec.ts` (`6` passed) after the expected sandbox `listen EPERM` failure and rerun outside the sandbox
- the 2026-07-29 external design-skills audit slice adds `docs/analysis/external-skills-pickrank-design-audit-2026-07-29.md` as the current cited audit artifact for Emil Kowalski's and Jakub Krehel's public skills repos, records upstream SHAs, and keeps the skills as review inputs rather than vendored product doctrine; the shipped implementation adds shared focus-visible and reduced-motion primitives, tightens shared button and waitlist-form focus behavior, labels the primary bottom navigation, stabilizes lineup client-state sync, adds keyboard move-up/move-down controls to Build Your Lineup, gives the unsaved-lineup modal dialog semantics, initial focus, and Escape close, and allows `127.0.0.1` as a Next dev origin so Playwright can hydrate client controls during local browser verification without changing routing, auth gates, lineup rules, scoring, payouts, wallet rules, eligibility, admin mutations, provider behavior, dependencies, or color-token notation
- repo verification for the 2026-07-29 external design-skills audit slice passes `npm run typecheck`, focused `npx eslint app/globals.css components/ui/button.tsx components/layout/bottom-nav.tsx components/waitlist/waitlist-form.tsx components/contests/lineup-builder-client.tsx tests/e2e/lineup-builder.spec.ts next.config.ts` with only the existing CSS ignored warning, full `npm run test` (`35` files, `189` tests), `npx playwright test tests/e2e/homepage.spec.ts` (`5` passed), `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` (`8` passed), `npx playwright test tests/e2e/final-results.spec.ts --workers=1` (`4` passed), and `npx playwright test tests/e2e/admin-shell.spec.ts --workers=1` (`2` passed) after the expected sandbox `listen EPERM` limitation required the browser suites to run outside the sandbox
- the 2026-07-30 public conversion/accessibility pass keeps live preseason provider validation deferred until the August 6, 2026 game window and stays presentation-only across `/`, `/contests`, `/contests/[contestId]`, and `/how-it-works`: Home now surfaces skill-contest, final-only scoring, and email-only early-access trust signals near the waitlist form; Open Contests explains the one-stat, pick-10, accuracy-wins model before the featured contest; Contest Detail adds a Quick Read block before dense metrics; How It Works adds fast basics and converts the rank-differential example to an accessible table; routes, auth gates, contest rules, scoring, payments, wallet behavior, eligibility, admin mutations, provider behavior, and legal/compliance logic remain unchanged
- repo verification for the 2026-07-30 public conversion/accessibility pass passes `npm run typecheck`, focused `npx eslint app/page.tsx app/contests/page.tsx 'app/contests/[contestId]/page.tsx' app/how-it-works/page.tsx tests/e2e/homepage.spec.ts`, full `npm run test` (`35` files, `189` tests), and focused `npx playwright test tests/e2e/homepage.spec.ts` (`6` passed) after the expected sandbox `listen EPERM` limitation required the browser suite to run outside the sandbox; desktop and mobile screenshots for the four public routes were captured under `/private/tmp/pickrank-public-conversion-2026-07-30/`
- the 2026-08-04 player-pool/board terminology slice is presentation-only: user-facing public and entry-flow copy now uses `player pool` instead of `slate`, shifts saved ranked-order language toward `your board`, changes visible actions to `Build Your Board` and `Save Your Board`, and makes the homepage board preview more compact for mobile while preserving the 15-player pool, pick-10 board, full-pool final-order scoring, routes, auth gates, admin setup, provider behavior, payments, wallet, eligibility, and legal/compliance logic
- repo verification for the 2026-08-04 player-pool/board terminology slice passes `npm run typecheck`, `npm run test` (`36` files, `196` tests), focused `npx eslint` on touched app routes/components/helpers/tests, `git diff --check`, and focused `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/lineup-builder.spec.ts --workers=1` (`14` passed) after the expected sandbox `listen EPERM` limitation required the browser suite to run outside the sandbox
- the 2026-08-04 gameplay-page usability cleanup is presentation-only: Contest Detail, Entry Review, and Entry Success now remove the repeated progression rail; shared board previews can show existing player team/opponent context; Build Your Board removes repeated row-level drag instructions, shows player context from existing `slatePlayers` as `Josh Allen (BUF)` with simplified matchup detail such as `vs. BAL`, uses smaller icon-first row controls, splits selected board and player pool into desktop columns while keeping mobile stacked, and moves lock time into the sticky Save Your Board panel
- repo verification for the 2026-08-04 gameplay-page usability cleanup passes `npm run typecheck`, `npm run test` (`36` files, `196` tests), focused `npx eslint 'app/contests/[contestId]/page.tsx' 'app/contests/[contestId]/payment/page.tsx' 'app/contests/[contestId]/success/page.tsx' 'app/contests/[contestId]/lineup/page.tsx' components/contests/contest-board-preview.tsx components/contests/lineup-builder-client.tsx tests/e2e/lineup-builder.spec.ts`, `git diff --check`, focused `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` (`8` passed), and a temporary screenshot Playwright pass; screenshots were captured under `/private/tmp/pickrank-gameplay-usability-2026-08-04/`
- the 2026-08-05 Build Your Board web/mobile parity cleanup is presentation-only and currently uncommitted: rows now separate rank/name/status from the icon controls on both mobile and desktop, row controls use the same larger tap targets across breakpoints, the board and player-pool sections stay stacked in the narrow app shell, the disabled Save Your Board panel stays in normal flow instead of covering content, the Save panel only sticks while there are unsaved changes, and the bottom spacing keeps the Save panel clear of the bottom nav
- repo verification for the 2026-08-05 Build Your Board web/mobile parity cleanup passes `npm run typecheck`, focused `npx eslint components/contests/lineup-builder-client.tsx tests/e2e/lineup-builder.spec.ts`, `npm run test` (`36` files, `196` tests), `git diff --check`, focused `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` (`8` passed after the expected sandbox `listen EPERM` rerun outside the sandbox), and a temporary screenshot Playwright pass; screenshots were captured under `/private/tmp/pickrank-build-your-board-parity-review/`
- the 2026-07-29 `$0` free/test contest proof slice adds one contest-operator-gated `/admin/contests` control for visible, open, zero-fee contests with at least one entry and zero paid entries; it records an admin state event for `open -> locked`, preserves saved lineups as read-only, keeps direct lineup saves blocked at lock with `409`, reuses the existing typed-`FINAL` manual finalization path, and verifies final leaderboard/results with zero payout amounts and no wallet, payout, payment, KYC, geolocation, provider-automation, or public paid-entry changes
- repo verification for the `$0` free/test proof slice passes `npm run typecheck`, focused Vitest on admin lifecycle/finalization/results/entry/lineup/readiness coverage (`8` files, `61` tests), full `npm run test` (`35` files, `189` tests), focused `CI=1 npx playwright test tests/e2e/final-results.spec.ts` (`4` passed), targeted `CI=1 npx playwright test tests/e2e/lineup-builder.spec.ts -g "locked zero-fee contests"` (`1` passed), and the full `CI=1 npx playwright test tests/e2e/lineup-builder.spec.ts` suite (`8` passed) with the shared file-backed lineup fixture serialized
- `docs/analysis/legal-consultant-draft-questions-2026-07-29.md` logs the read-only first-pass question bank for the July 28 legal consultant draft package; the core follow-up frame is separating what must change in the product now from what can remain a launch-readiness item before real-money contests, especially fixed prize schedules versus dynamic pools, cash refunds versus site-credit defaults, 15-20% fee versus 30%, 10-entry minimum versus 4, tiebreak alignment, launch-state footprint, vendor gates, tax review, and IP sequencing; this note does not change product specs or enable paid entry
- `docs/qa/preseason-free-test-signoff-2026-07-29.md` records the current runbook signoff as `PARTIAL`: local automated proof, production route HEAD checks, lineup proof, final-results proof, and no-money boundaries passed; a 2026-07-30 provider follow-up loaded the Supabase service-role key in-process, passed `npm run prepare:live-validation-contest`, then passed `npm run validate:live-provisional` against `week-1-qb-passing-yards-live-validation-2026`, saving a SportsDataIO live provisional snapshot with `12` total games, `12` scheduled, `0` in progress, `0` final, and top-five tied `0`-yard rows for Brock Purdy, C.J. Stroud, Dak Prescott, Jalen Hurts, and Jared Goff; keep signoff `PARTIAL` until the same validation runs during an active preseason game window and captures non-zero player stats or in-progress game state
- PR #17 is merged into `main` and Vercel production deployment `dpl_2khwkBox1QjSVhbh14SCXYXZ7Uy3` is READY for merge commit `496081e`; Vercel aliases now include `www.pickrankgames.com`, `pickrankgames.com`, and `pickrank-app-git-main-parker-levys-projects.vercel.app`
- production `/profile` now returns `200` from the eligibility foundation build and includes the updated account access, wallet, and entry-readiness surfaces; Parker also manually verified the preview SSO flow, secondary eligibility capture, and post-save pending-review state before merge
- the merged eligibility flow makes post-SSO secondary setup explicit with a `Finish Account Setup` prompt, clearer `/auth` copy, missing-eligibility Profile routing from contest CTAs, and no username-save shortcut into paid entry unless email and eligibility capture are already complete
- Parker's 2026-07-25 preview SSO test returned to the preview homepage after Google sign-in because preview auth callbacks were still pinned to `NEXT_PUBLIC_APP_URL`; the branch now uses trusted Vercel `VERCEL_URL` for non-production Vercel preview auth callbacks while keeping production pinned to `NEXT_PUBLIC_APP_URL`
- Supabase OAuth redirect configuration may still need the latest preview callback allowed, for example `https://pickrank-app-git-codex-eligibility-95f79a-parker-levys-projects.vercel.app/auth/callback` or the equivalent project preview wildcard; if Google SSO still returns home or errors after the new preview deploy, check Supabase `Authentication -> URL Configuration -> Redirect URLs`
- the follow-up preview OAuth fix now sends Supabase to a clean `/auth/callback` URL and stores the intended return path in a short-lived `pickrank_auth_next` cookie, avoiding Supabase redirect allowlist mismatches caused by callback query parameters such as `?next=/profile`
- production signed-in eligibility verification passed on 2026-07-27 with Parker's real Google account: Google SSO from `/auth?next=/profile` returned to `https://www.pickrankgames.com/profile`, `/profile` showed `thelevys20@gmail.com`, username `thelevystesting`, state `MA`, age confirmed, Terms captured, Privacy captured, eligibility `Pending Review`, KYC `Not Required`, responsible play `None`, and the Entry Readiness card kept eligibility in `Pending Review`; production `/contests/week-1-qb-passing-yards` showed a disabled `Eligibility Pending Review` CTA with no `Enter Contest - $5` link, and direct `/contests/week-1-qb-passing-yards/payment` showed `Eligibility check`, disabled `Confirm Entry`, and the pending legal/provider review block; the repo server action still fails paid entries closed until verified payment infrastructure is connected, so do not enable paid entry without explicit legal/provider/payment approval
- the 2026-07-27 eligibility-review policy slice is docs-only and defines the review boundary before tooling: PickRank can currently verify auth/session, saved profile fields, captured age/state/Terms/Privacy acknowledgements, stored eligibility status, and server-side blocking for non-eligible accounts; PickRank cannot yet verify legal identity, date of birth, physical location, supported public paid-contest jurisdiction, KYC/sanctions/fraud/payment-provider status, external responsible-play lists, payment approval, or withdrawal approval; self-attestation must remain distinct from real verification, internal-testing eligibility may apply only to known founder/operator/QA/test accounts in controlled no-money flows, and public real-money eligibility remains blocked until legal, payment, withdrawal, KYC, jurisdiction, responsible-play, reviewed Terms/Privacy/rules, and auditable reviewer controls are complete
- the 2026-07-27 internal eligibility-review foundation adds an operator-only `/admin/eligibility` surface plus `lib/eligibility-review.ts` and focused unit coverage; the route lists only known test accounts from `.test` fixture emails or the server-only `PICKRANK_INTERNAL_TEST_ACCOUNT_EMAILS` allowlist, requires a 12+ character reason and an authenticated operator identity for every action, stores internal approval as the distinct `eligible_for_internal_testing` status under `controlled_internal_testing_only` metadata, rejects internal approval for restricted, self-excluded, responsible-play-restricted, or already-blocked accounts, allows blocking with a required reason, updates auth metadata plus profile eligibility fields, and writes a `compliance_eligibility_events` audit row with `public_real_money_approval: false`; the internal-testing status does not satisfy the shared public paid-entry eligibility check, which still requires the separate `eligibility_status = eligible` status and still fails closed until verified payment infrastructure is connected
- repo verification for the internal eligibility-review foundation passes `npm run typecheck`, focused `npx eslint app/admin/contests/page.tsx app/admin/eligibility/actions.ts app/admin/eligibility/page.tsx lib/auth-profile.ts lib/eligibility-review.ts tests/unit/eligibility-review.test.ts tests/unit/routes.test.ts`, focused `npx vitest run tests/unit/eligibility-review.test.ts tests/unit/routes.test.ts tests/unit/auth-profile.test.ts tests/unit/contest-entry-confirmation.test.ts` (`4` files, `42` tests passed), full `npm run test` (`30` files, `167` tests passed), and `git diff --check`
- the desktop-first admin shell now gives `/admin/contests` and `/admin/eligibility` a wide protected workspace with persistent contest and internal-eligibility navigation, a compact horizontal fallback on narrow screens, and an explicit internal-only boundary; `/admin` routes to the current contest workspace, while the public bottom navigation is suppressed throughout `/admin` without changing admin actions, role gating, eligibility decisions, provider refreshes, or the typed `FINAL` results path
- repo verification for the desktop-first admin shell passes `npm run typecheck`, focused ESLint on the touched TS/TSX files, full `npm run test` (`31` files, `169` tests passed), `git diff --check`, and focused `npx playwright test tests/e2e/admin-shell.spec.ts tests/e2e/homepage.spec.ts` (`6` passed) after the expected sandbox `listen EPERM` failure and rerun outside the sandbox; browser coverage confirms the operator-only redirect, a desktop workspace wider than `900px`, a `390px` overflow-free compact fallback, no public bottom navigation under `/admin`, and unchanged public homepage/core-route navigation behavior
- `docs/preseason-free-test-contest-runbook.md` now documents the preseason free/test contest proof loop without enabling paid entry: live site navigation, admin contest setup, free/test entry, lineup save, lock behavior, provider validation, finalization, leaderboard/results, and manual QA signoff; `spec/features/qa_acceptance_criteria.md` points to this runbook as the operator checklist for the preseason proof pass
- the 2026-07-27 controlled test-entry path is now explicit in code: zero-fee entries remain allowed, nonzero no-payment confirmation requires the non-production E2E auth/file-store harness, the E2E fixture identity, and the separate `eligible_for_internal_testing` status; ordinary Supabase-style users stay blocked without payment infrastructure, public `eligible` alone does not open the no-payment test path, the Payment Review UI and POST server action share that same policy, and Playwright now proves one controlled test entry creates a default lineup, routes through Success to Build Your Lineup, reuses the existing entry, increments only total entry count, and leaves paid entry count unchanged; `docs/preseason-testing-runbook.md` is a compatibility pointer to the canonical free/test runbook
- the admin contest setup path now permits deliberate `$0` free/test contests to validate and publish for the preseason proof loop, while negative fees remain blocked and paid-entry launch still requires separate payment and compliance approval; `/admin/contests` copy calls out the `$0` boundary, and focused coverage in `tests/unit/admin-contest-creation.test.ts` proves a zero-fee draft can validate and publish without weakening the paid-entry guardrails
- the contest-detail and Payment Review surfaces now recognize `$0` published contests as free/test entries before applying paid-entry eligibility copy: a signed-in, profile-complete, email-verified account with captured-but-`pending_review` paid eligibility can click `Enter Free Test Contest`, reach Payment Review, and confirm the no-money entry, while nonzero paid contests still show the disabled pending-review CTA and still fail closed without payment infrastructure
- the 2026-07-28 admin test-entry visibility slice adds a read-only `Test Entry Readiness` panel inside `/admin/contests`, still behind the existing `contest_operator` gate and admin shell; it aggregates existing contest counts, saved entry records, lineups, safe profile handles, and auth emails when available, then flags obvious operator issues such as count mismatches, paid entries on `$0` contests, free/test counts on nonzero contests, unavailable entrant identity, default-assigned lineups, incomplete lineups, and locked contests with incomplete lineups without adding routes, schema, mutations, payment behavior, eligibility decisions, scoring changes, wallet behavior, or public visibility
- repo verification for the admin test-entry visibility slice passes `npm run typecheck`, focused `npx eslint app/admin/contests/page.tsx lib/admin-test-entry-readiness.ts tests/unit/admin-test-entry-readiness.test.ts tests/e2e/admin-shell.spec.ts`, focused `npx vitest run tests/unit/admin-test-entry-readiness.test.ts tests/unit/admin-contest-creation.test.ts tests/unit/persisted-contest-entry.test.ts` (`3` files, `17` tests passed), full `npm run test` (`32` files, `178` tests passed), `git diff --check`, and focused `npx playwright test tests/e2e/admin-shell.spec.ts tests/e2e/lineup-builder.spec.ts` (`9` passed) after the expected sandbox `listen EPERM` failure and rerun outside the sandbox
- the 2026-07-28 stale Supabase session recovery slice hardens invalid refresh-token handling after Vercel reported `AuthApiError: Invalid Refresh Token: Refresh Token Not Found` on `/leaderboard.rsc`, `/admin/contests`, and `/auth/callback`; `lib/supabase/session-recovery.ts` now detects `refresh_token_not_found`, clears Supabase auth cookies plus `pickrank_auth_next`, `/auth/session-expired` performs trusted recovery redirects, `/auth/callback` catches stale-session exchange failures, `/admin/contests` routes stale protected sessions through controlled auth recovery, and public `/leaderboard?contest=...` can clear stale cookies and retry without requiring sign-in or changing final-only leaderboard behavior
- repo verification for the stale Supabase session recovery slice passes focused `npx vitest run tests/unit/session-recovery.test.ts tests/unit/auth-callback-route.test.ts tests/unit/auth-session-expired-route.test.ts` (`3` files, `9` tests passed), full `npm run test` (`35` files, `189` tests passed), `git diff --check`, and focused `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/admin-shell.spec.ts` (`7` passed) after the expected sandbox `listen EPERM` failure and rerun outside the sandbox; `npm run typecheck` passed during implementation but the final full-tree rerun is currently blocked by unrelated uncommitted `tests/e2e/final-results.spec.ts:465` work referencing `updateContestFixture`; this slice does not change schema, eligibility, payment, contest-entry, scoring, wallet, Vercel env, production data, commit, or push state
- the live Supabase project `jmvzdspiobcjrewndhuf` now has the missing `public.confirm_free_contest_entry(uuid, uuid[])` RPC applied directly and the PostgREST schema cache reloaded after production returned `Could not find the function public.confirm_free_contest_entry(...) in the schema cache` during `$0` test-entry confirmation; verification confirmed the function signature exists and an unauthenticated REST probe now fails safely with `Authentication is required` instead of schema-cache not-found
- live public route checks on 2026-07-27 returned `200` for `https://www.pickrankgames.com/`, `/contests`, `/contests/week-1-qb-passing-yards`, `/leaderboard`, `/how-it-works`, and `/auth`; downloaded live HTML confirmed Contests and Contest Detail show the `Week 1 QB Passing Yards` contest board, 15-QB slate, ranked-10/lower-score-wins mechanics, signed-out auth handoff, and final-only leaderboard placeholder
- the 2026-07-19 cross-route stage/scroll progression pass adds one reusable non-interactive contest progression rail across Contest Detail, Payment Review, Entry Success, Build Your Lineup, saved-final Leaderboard, and entrant Results so the journey reads as slate review -> entry review -> confirmed board -> build -> lock -> saved final results without changing routes, auth gates, payment, wallet, entry creation, lineup persistence, scoring, result availability, leaderboard behavior, or fixture data
- repo verification for the cross-route stage/scroll progression pass passes `npm run typecheck`, focused `npx eslint 'app/contests/[contestId]/page.tsx' 'app/contests/[contestId]/payment/page.tsx' 'app/contests/[contestId]/success/page.tsx' 'app/contests/[contestId]/lineup/page.tsx' 'app/contests/[contestId]/results/page.tsx' app/leaderboard/page.tsx components/contests/contest-board-preview.tsx components/contests/lineup-builder-client.tsx`, `npm run test` (`27` files, `126` tests passed), isolated `npx playwright test tests/e2e/lineup-builder.spec.ts` (`5` passed), isolated `npx playwright test tests/e2e/final-results.spec.ts` (`3` passed), `git diff --check`, and a temporary restored screenshot pass covering the six touched screens under `/Users/parkerlevy/.codex/visualizations/2026/07/19/019f7939-0ecd-7bc1-9424-99c2e7122393/pickrank-stage-progression/`
- the 2026-07-08 brand follow-up now approves `public/brand/pickrank-wordmark-football-transparent-light.png` as a secondary dark-surface homepage and marketing variant, keeps `public/brand/source/pickrank-wordmark-football-transparent-light-preview-dark.png` as a reference preview only, and points the homepage hero at the transparent asset instead of the earlier white-`Pick` fallback
- repo verification for the latest homepage CTA lane passes `npm run typecheck`, `npm run test` (`27` files, `124` tests passed), focused `npx eslint app/page.tsx tests/e2e/homepage.spec.ts`, `git diff --check`, and `npx playwright test tests/e2e/homepage.spec.ts` when the local dev server is allowed to bind outside the sandbox
- GitHub auth on this machine has now been restored through `gh auth login`, and `gh auth setup-git` is configured in `~/.gitconfig` so future HTTPS pushes use GitHub CLI's credential helper instead of failing on missing local credentials
- the latest local provider/admin baseline now includes the repeatable Replay validation harness, the hidden 2026 in-season live validation contest prep and fetch helpers, and the `/admin/contests` provisional preview plus refresh surface
- the current Remotion source baseline is a motion-polished `34.5s` waitlist-focused cut under `assets/marketing/video/`, aligned to the 15-player / pick-10 product framing and the `pickrankgames.com` brand
- the latest rendered review asset is `assets/marketing/video/out/pickrank-landing-video.mp4`
- the 2026-08-02 Remotion teaching-flow pass keeps the same 34.5-second timing, `Locked In` music bed, CTA, poster path, and homepage video path, but changes the opening lesson to objective-first copy: `Same 15-player slate.`, `Pick 10.`, `Rank the final order.`, and `Closest board wins.`
- the live landing page now serves the updated `Locked In` export from `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster image, while the Remotion source-of-truth render remains under `assets/marketing/video/out/`
- repo verification for the 2026-08-02 Remotion teaching-flow pass passes repo `npm run typecheck`, repo `npm run test` (`35` files, `189` tests passed), focused `npx eslint app/page.tsx tests/e2e/homepage.spec.ts`, `npm run lint` inside `assets/marketing/video`, unsandboxed `npm run render -- --timeout=120000`, two Remotion still-frame visual checks for the opening and intro scenes, and unsandboxed focused `npx playwright test tests/e2e/homepage.spec.ts` (`6` passed) after the expected sandbox `listen EPERM` server-bind failure
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
- operator bootstrap is confirmed for `parkerhlevy@gmail.com` as a live `contest_operator`; the repo seed now targets `parkerhlevy@gmail.com`, `gary.levy59@gmail.com`, and `glevy59@icloud.com` for operator assignment or pending-role staging, but the two Gary addresses were not re-applied or reverified against live Supabase during the Early Access Beta push
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
- the 2026-07-31 weekly repo-maintenance pass confirms `main` is now the active synced baseline again: `0` ahead and `0` behind `origin/main`, with no committed-but-unpushed work
- the same 2026-07-31 pass confirms every remaining local `codex/*` branch still contains unique commits relative to `origin/main` (`codex/waitlist-deliverability-todo` `22/4`, `codex/waitlist-reconciliation` `26/2`, `codex/waitlist-resend-diagnostics` `25/1`, `codex/waitlist-resend-properties-hotfix` `24/1`, `codex/waitlist-workflow` `35/1` left/right counts), so none qualify for low-risk deletion even when they look old or docs-heavy; keep them preserved until their unique work is either merged or explicitly retired
- merged remote refs still include the older `origin/codex/*` stack plus `origin/spec/results-reveal-clean`; treat those as optional remote-side cleanup candidates later, not as local blockers
- live `git remote prune origin --dry-run` verification completed cleanly on 2026-07-17, so there are no stale remote-tracking refs to prune from this machine right now
- this 2026-07-31 run re-verified remote pruning with `git remote prune origin --dry-run` after a sandbox-limited DNS failure; it completed cleanly, so there are still no stale remote-tracking refs to prune from this machine right now
- `next-env.d.ts` should usually be treated as generated noise unless a slice specifically requires it
- security hardening is now an explicit repo boundary: migration `db/migrations/0009_rls_hardening.sql` enables RLS on the main public-schema app tables, keeps public reads narrow to visible contests and final results, limits entry and lineup mutations to the signed-in owner during `open`, and reserves admin and snapshot writes for `contest_operator`
- the focused security-remediation lane now fails paid entry confirmation closed until verified payment infrastructure exists, moves free/test entry creation behind a POST server action, keeps E2E entry mode non-production-only, and adds migration `0010_entry_integrity_hardening.sql` for atomic free-entry creation, same-contest lineup membership, and immutable entry ownership fields
- the 2026-07-15 security follow-up closes the two validated July 13 audit items: auth redirect origins now resolve to the configured app origin instead of forwarded host headers, final-results profile queries only request `id`, `username`, and `display_name` for users in saved final rows, and migration `0011_final_results_profile_read_hardening.sql` replaces the broad public `profiles` policy with a final-visible-results row policy plus a contest-operator read allowance for the `FINAL` publish workflow
- live Supabase project `jmvzdspiobcjrewndhuf` now has the broad `public can read leaderboard profiles` policy removed from `public.profiles`; because that live schema still does not have `public.entry_scoring_results` or `public.contest_player_results`, the guarded `0011` apply created only the `contest operators can read profiles for finalization` profile policy for now, and the final-results public profile policy will only be created once the final-results tables exist
- migration `0010_entry_integrity_hardening.sql` is now runtime-verified against a disposable local Supabase database after a clean reset through migrations `0001`-`0010`; `db/tests/0010_entry_integrity_hardening.sql` covers successful and idempotent free entry, count integrity, paid/cross-contest/duplicate rejection, verified-profile gates, and denial of direct entry and cross-contest lineup writes
- file-backed E2E/test entries increment total entry count but no longer increment `paidEntryCount`; only a future verified payment or wallet-entitlement path may mark an entry paid
- deferred security release gate: the database branch of `removePersistedContestEntry` is intentionally denied by migration `0010` and must not be enabled by restoring direct authenticated `INSERT`, `UPDATE`, or `DELETE` access on `entries`; future paid-entry, wallet, refund, or cancellation work must replace it with narrow server-authoritative RPCs that validate ownership, contest state, and payment/refund entitlement while updating the entry, lineup, contest counts, payment status, and append-only wallet ledger atomically
- before any payment/wallet or entry-cancellation slice closes, rerun `db/tests/0010_entry_integrity_hardening.sql` and add executable database coverage for unauthorized and cross-user cancellation, payment/refund coupling, atomic rollback, idempotent retries, contest-state cutoffs, and ledger/count reconciliation; failure of any case is release-blocking
- the internal replay/live validation scripts now require `SUPABASE_SERVICE_ROLE_KEY` instead of the browser anon key because those hidden validation contests and snapshot tables should no longer depend on public-table access
- the 2026-07-13 read-only security review of auth, entry, results, admin, provisional snapshot, and hidden validation-script boundaries passed `npm run typecheck` plus `npm run test` (`27` files, `124` tests passed), and its two narrow follow-ups were completed on 2026-07-15; future auth or operator workflow widening should keep auth redirects pinned to trusted configured origins and keep public leaderboard/results identity reads limited to display-handle data for users with saved final rows
- the older marketing/Remotion and design-doc work was intentionally parked on 2026-07-02 in the local stashes `parked-remotion-design-2026-07-02` and `parked-next-env-noise-2026-07-02`; current active marketing dirt in the live `main` worktree belongs to the narrow 2026-08-02 teaching-flow update
- the earlier `/private/tmp/pickrank-lineup-verify` detached worktree is no longer present on disk, and Git now marks `/private/tmp/pickrank-waitlist` on branch `codex/waitlist-workflow` as prunable stale worktree metadata because its gitdir link is broken; treat that path as a separate parked lane until Parker explicitly asks to repair or prune it, and keep it out of `main` hygiene or security follow-up commits
- the 2026-07-31 maintenance pass re-confirmed that broken `/private/tmp/pickrank-waitlist` metadata through `git worktree prune --dry-run --verbose`, but left it untouched because the parked waitlist branch still carries unique work and this run favors preservation over aggressive cleanup
- the July 15 security/final-results hardening slice is now committed on `main`; keep generated `next-env.d.ts` churn and local `docs/analysis/` notes out of unrelated release commits, and do not mix the parked `/private/tmp/pickrank-waitlist` lane into `main` unless Parker explicitly asks to reconcile or remove it
- the 2026-07-04 shared-shell cleanup pass now carries the same header, status notice, section-card, badge, CTA, spacing, and placeholder framing system across the public and auth-gated shell surfaces, including `/`, `/contests`, `/contests/[contestId]`, `/payment`, `/success`, `/how-it-works`, `/auth`, `/profile`, `/wallet`, `/leaderboard`, `/contests/[contestId]/results`, and the saved and locked lineup states on `/contests/[contestId]/lineup`, without changing routing, auth gating, lineup rules, scoring, payouts, wallet rules, compliance boundaries, or admin/provider behavior
- the 2026-07-15 shared-foundation UI polish pass adds root antialiasing plus `font-synthesis: none`, a shared `.numeric` tabular-number utility across contest/admin/leaderboard/results/wallet surfaces, explicit transition-property classes, safe shared button press feedback, 16px mobile form inputs, and 44px lineup icon touch targets without changing product behavior, routes, auth gates, scoring, payouts, wallet rules, schema, dependencies, or admin contest logic; verification passes `npm run typecheck`, `npm run test` (`27` files, `126` tests), focused ESLint on the touched TSX files with only `app/globals.css` ignored by config, and unsandboxed `npx playwright test tests/e2e/lineup-builder.spec.ts` (`5` passed) after the expected sandbox `listen EPERM` bind failure
- `docs/design/DESIGN.md` is now the canonical design entrypoint for future UI work, with `figma-screenshot-audit.md`, `figma-v1.md`, and `figma-make-reference.md` treated as supporting presentation references behind `/spec` and `docs/agent-handoff.md`
- repo verification for that UI cleanup passed `npm run typecheck` and `npm run test`, and the focused lineup Playwright assertions were aligned to the then-current `10/10 Ranked` and `Left in Slate` copy; direct sandbox startup still hits `listen EPERM` on `0.0.0.0:3000`, but the focused auth-gated entry-flow browser pass succeeds when the local test server is allowed to start outside the sandbox via `npx playwright test tests/e2e/lineup-builder.spec.ts`
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

Internal admin routes:

```text
/admin
/admin/contests
/admin/eligibility
```

Admin routes use a separate desktop-first workspace and are not exposed in the public bottom navigation.

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

Current beta-launch checklist:

```text
Early Access Beta launch readiness
```

Use the beta posture as the launch source of truth: free-to-play contests, Beta Pass, no cash value, no payouts, no cash prizes, and paid contests deferred behind legal/provider/payment/withdrawal/compliance gates. The repo and Vercel production deployment now carry that posture. The existing preseason free/test runbook still matters for proving the contest loop, but public copy and visible contest data should read as Early Access Beta, not an internal-only proof mode.

Next recommended slice:

```text
Continue PickRank using the repo as source of truth. After the focused mobile Build Your Board cleanup is reviewed or committed separately from the parked Remotion/video/generated lane, run a production Early Access Beta smoke pass against `https://www.pickrankgames.com` and the latest Vercel production deployment for Home, Contests, Contest Detail, Entry Review, Entry Success, Build Your Board, Leaderboard, Results, Auth, Profile, Wallet, and `/legal/*`. Verify that public beta contests are free to play, Beta Pass has no cash value, no payouts or cash prizes are shown, paid entry remains fail-closed, and the legal routes are marked pending counsel review. Confirm whether live Supabase contest data also needs a beta-safe data update beyond the repo `data/contests.json` fixture. Keep paid-game architecture intact. Keep the parked Remotion/video/generated lane separate unless explicitly resumed. Do not add payment providers, withdrawals, payouts, cash-balance or wallet-ledger movement, KYC vendor integration, geolocation enforcement, provider automation as official results, scoring changes, or broad contest operations. Run typecheck, tests, and focused browser checks before closing.
```

Definition of done:

- Start from `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` files
- Preserve the verified production eligibility foundation, paid-entry block, and beta free-entry boundary
- Keep reviewer/admin-shell work and controlled test-entry work separate unless a future user-approved slice explicitly reopens both
- Use `$0.00` beta contest defaults and the existing proof lock control for no-money beta proof; do not add broader contest operations controls without a separate approved slice
- Keep `next-env.d.ts` out
- Execute or rehearse the runbook with explicit pass/fail notes for each operator step
- Confirm any issue found is logged as a separate narrow follow-up before code changes begin
- Confirm payment providers, withdrawals, payouts, cash-balance and wallet-ledger movement, KYC vendor integration, geolocation, and public paid entry remain out of scope
- Update this handoff note again if repo reality or the next recommended move changes

## Starter Prompt For Future Chats

Use this default starter prompt pattern unless the next slice needs a tighter scoped variation:

```text
Continue PickRank using the repo as source of truth. Use clear, ASD-STE100-inspired technical English: short sentences, active voice, one idea per sentence, consistent terms, and short paragraphs. Keep explanations business-friendly. The current launch posture is Early Access Beta: free-to-play contests, Beta Pass, no cash value, no payouts, no cash prizes, and paid contests deferred behind legal/provider/payment/withdrawal/compliance gates. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` file for the area you are touching, plus any route, QA, or marketing docs that directly govern that slice. Keep the slice narrow, avoid mixing provider/admin/auth/marketing work unless the files clearly belong together, and treat `next-env.d.ts` as generated noise unless a diff proves otherwise. Do not add payment providers, withdrawals, payouts, cash-balance or wallet-ledger movement, KYC vendor integration, geolocation enforcement, provider automation as official results, scoring changes, or broad contest operations unless explicitly requested. Explain results business-first: what changed, why it matters, what passed, what remains risky, and what I need to do next.
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
