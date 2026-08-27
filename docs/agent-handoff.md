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
- Draft contest player-pool setup with the first real 20-player quarterback data path saved into the shared contest store
- `spec/features/qb_player_pool_selection_framework.md` is a draft, provider-neutral operator framework for selecting and balancing the weekly 20-QB free-beta pool; it includes a synthetic 24-candidate test slate and keeps provider, scoring, payouts, and production writes out of scope
- Basic contest lifecycle automation functions for `scheduled -> open` and `open -> locked`
- Contest-entry placeholder flow and lineup-state persistence work that now reads real contest records
- Tailwind/PostCSS configured
- Vitest wired
- Basic route smoke tests
- The current auth lane adds token-hash handling for Supabase PKCE email links in `app/auth/callback/route.ts` and exposes `/auth/confirm`; focused auth tests, `npm run typecheck`, `npm run lint`, and the full `npm test` suite pass (`35` files, `212` tests). Commit `58f52ed` is deployed to Vercel Production deployment `dpl_FXP4J88XZadhmWj4YJnaTVs7d21f`. On 2026-08-24, live Supabase Auth logs identified the remaining send failure as an SMTP sender on the removed `auth.pickrankgames.com` domain. Custom SMTP now sends from `PickRank <hello@pickrankgames.com>` on the verified root domain. Both **Confirm sign up** and **Magic link or OTP** now use branded PickRank templates with `/auth/confirm?token_hash={{ .TokenHash }}&type=email`. After the Auth configuration reload, a fresh-address confirmation email and a returning-user magic link each rendered only the branded template, completed token-hash verification, and landed on `/profile` with an authenticated session. No app code or Vercel deployment was required for the live SMTP and template changes.

Current branch and production reality as of 2026-08-26:

- `codex/persistent-board-save-state` is a local review lane in `/private/tmp/pickrank-persistent-board-save-state`, based on `origin/main` at `5fbb770` and recorded in the current branch-tip commit. An editable `user_saved` board whose current order matches its saved order now shows a persistent `Your board is saved` notice with the contest lock time and `Complete` badge. The bottom action panel shows a compact green saved state instead of a disabled Save button.
- adding, removing, or reordering a player removes completion and restores the sticky amber `Unsaved changes` state with the active Save button. A successful save restores completion, and a reopened or reloaded saved board derives completion from persisted state. Empty boards, save errors, unsaved-leave protection, and locked boards keep their existing behavior. No post-save exit action, persistence change, schema, migration, scoring change, or production mutation was added.
- persistent-board verification passes `npm run typecheck`, `npm run lint`, `npm test` (`36` files, `217` tests), `npx next build --webpack`, and `git diff --check`. Focused desktop/mobile Playwright coverage now includes initial saved state, edit, re-save, reload, empty board, save failure, locked board, and no added post-save exit action. Local Chromium remains blocked before test execution by macOS Mach port registration, including after the approved outside-sandbox retry. The hosted Linux Chromium gate remains pending separate push approval.
- the narrow signed-in return-to-board slice is merged into `main` through pull request `#26` at `51f1d8f`. The `/contests` page now reads persisted entry ownership for the current viewer. An entered open contest shows `Open` plus `Entered`, replaces `Enter free beta contest` with a green `Edit your board` action, and routes through the existing protected lineup check directly to the saved board. Users without an entry keep the existing entry action. Entry creation, single-entry enforcement, lineup persistence, lock behavior, scoring, eligibility, payment, provider, admin, and production data are unchanged.
- verification for the return-to-board slice passes `npm run typecheck`, focused ESLint, `npm run test` (`35` files, `212` tests), `git diff --check`, and `next build --webpack`. The default Turbopack build and local Chromium remain blocked by the Codex macOS sandbox, but the required Linux Chromium gate passed on implementation head `3a041b8` in GitHub Actions run `32699840537`. Pull request `#26` also has successful Vercel preview deployment and preview-comment checks.
- pull request `#27` is merged into `main` through merge commit `ed93c24`. It adds scoped status test IDs, shared `e2eAppUrl` and `expectPagePath()` helpers, an enforced `test:e2e:contracts` source check, explicit `127.0.0.1` Next.js binding, one-worker execution, retained failure traces/screenshots, generated-report lint exclusions, and a CI runner that continues through later suites before returning a combined failure. It also builds contest-progress redirects from `getRequestOrigin()` so Next.js loopback-host normalization cannot drop the host-scoped auth cookie. Product rules and production data are unchanged.
- local verification for pull request `#27` passes the expanded contract scan (`13` TypeScript files), the contract unit tests (`4` tests), `npm run typecheck`, `npm run lint`, `npm test` (`36` files, `216` tests), Playwright discovery (`27` tests), `next build --webpack`, and `git diff --check`. After reconciliation with current `main`, pull-request Linux Chromium run `32927016293` passed in `4m 14s`; post-merge run `32927316932` passed in `4m 9s` on `ed93c24`.
- Vercel Production deployment `dpl_DgKCk9Ac2A9qmweBXdE4XHiAQPzL` is `READY` for `ed93c24` and serves the `www.pickrankgames.com` and `pickrankgames.com` aliases. Read-only production checks returned `200` for Home, Open Contests, and Contest Detail with the expected PickRank content and How It Works action. The one-hour Vercel runtime error scan found no errors.
- the optional Portless local-development pilot is documented in `docs/local-development-portless.md` with root `portless.json`; `next.config.ts` allows the named `pickrank.localhost` and worktree subdomains, and Parker verified `https://pickrank.localhost` loads successfully; direct `127.0.0.1:3000`, Playwright, CI, OAuth defaults, and production behavior remain unchanged. The pilot is adopted as a single local-development tooling commit and remains opt-in; it is not part of the next product slice
- a fresh read-only remote check reports `origin/main` at `5fbb770`. The primary checkout remains detached at `aceb4f4`, 28 commits behind that delivery baseline, with unrelated preserved user work. Do not reset, stash, stage, or bundle that primary-checkout work with another slice.
- tracked `.env.example` is readable again and its working-tree object hash matches the committed `aceb4f4` version. It has no local diff and is not an active provider lane.
- the 2026-08-20 `/contests` presentation follow-up is committed as `0877e57` and deployed to Vercel Production deployment `dpl_4eeTtzbvuJT9SXda1bKXPYoZgcHs`; it converts the How It Works link into a secondary Button with an ArrowRight icon and does not change contest, auth, entry, scoring, payment, wallet, eligibility, provider, admin, or production-data behavior
- the Portless pilot is committed and remains opt-in. Primary-checkout dirt is mixed and preserved: repo/legal guidance; legal entity copy and tracking; provider-planning documents; a workspace-cleanup audit plus two deleted empty placeholders; final-results and legal-copy browser tests; the Taylor Loom audit artifacts; and local handoff edits. Keep each lane separate. No `next-env.d.ts` noise is present.
- the current uncommitted files are preserved user/in-progress work and are not part of a product implementation slice. Do not reset, stash, stage, or bundle them without explicit scope.
- Slice 1 is merged through merge commit `68500ba`
- Slice 2 simplifies Contest discovery into responsive contest cards with only status, entries, lock time, and stat category; removes Featured framing and lobby board previews; and makes Contest Detail a concise free-beta overview with a green Open state, compact scoring, and the full 20-QB player pool without a fake user board
- Slice 2 preserves future paid-contest detail fields for non-beta contests and does not change contest data, entry behavior, scoring, payments, wallet behavior, provider writes, lifecycle, legal terms, or production data
- Slice 2 verification passes `npm run typecheck`, `npm run lint`, and `npm run test` (`37` files, `216` tests); focused desktop/mobile Playwright is blocked because the installed Playwright browser is absent and the browser download endpoint returns `403 Forbidden`
- Slice 3 changes the active free beta entry path to Contest Detail -> Enter Free Beta Contest -> Build Your Board; the ready-state Contest Detail action submits the existing server action, reuses `ensurePersistedContestEntry`, and redirects a successful free entry directly to `/contests/:contest_id/lineup`
- Slice 3 keeps the auth, Profile, verified-email, beta-acknowledgement, contest-open, confirmation-policy, and single-entry persistence checks before entry creation; auth and Profile completion now return free beta users to Contest Detail instead of Entry Review
- `/contests/:contest_id/payment` and `/contests/:contest_id/success` remain intact as parked future paid-version surfaces; direct free beta visits return to Contest Detail before entry or Build Your Board after a persisted entry exists, while non-beta paid-review and success behavior remains preserved
- the active free beta board now reads `Step 2 of 2` and no longer expects `Entry Review`, `Entry Success`, or `Continue to Build Your Board`; the free path still has no cash value, payouts, cash prizes, wallet movement, or paid-entry count movement
- new free beta entries now persist an empty board with `0/10` ranked players; the board builder still loads legacy assigned-default boards and saved boards, and only a complete 10-player saved board enters final scoring; migration `db/migrations/0016_empty_free_entry_board.sql` updates the free-entry RPC to allow zero players at entry creation and was applied directly to linked Supabase project `jmvzdspiobcjrewndhuf` on 2026-08-26 through the Supabase SQL Editor
- pull request `#31` and the post-merge `main` browser workflow both pass the Linux Chromium gate. The post-merge run is GitHub Actions run `32942441074` on merge commit `7c07492`.
- Slice 3 verification passes `npm run typecheck`, `npm run lint`, `npm run test` (`37` files, `219` tests), `npm run build`, focused desktop/mobile `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` (`9` passed), and `git diff --check`; Playwright required the expected outside-sandbox Chromium and dev-server run because sandboxed Chromium failed macOS Mach port setup and sandboxed Next.js dev mode exhausted file watchers
- Slice 3 is merged into `main` through merge commit `262c1c8` from pull request `#22` and is deployed to Vercel Production; `main` and production now contain the same Slice 3 product behavior
- Slice 4 is a presentation-only Build Your Board cleanup, published on `main` as `7d78aa4` and deployed to Vercel Production as `dpl_2kdok1mUa9XH46bqVCXRco3DShfm`: it uses `One entry per person`, removes the top assigned-order chip, the entry-step block, the redundant board-header ranked badge, and the editable-board helper subtext; it also uses clear sentence-case board, save, and player-pool labels without changing entry, selection, reorder, persistence, lock, scoring, provider, payment, eligibility, or admin behavior
- Slice 4 verification passes `npm run typecheck`, `npm run lint`, `npm run test` (`37` files, `219` tests), and the durable Linux Chromium gate in GitHub Actions run `32009831158`; the browser gate completed all four isolated suites with `25` passed tests and `1` expected paid-preview skip
- Slice 5 is merged into `main` through merge commit `c50aa5b` from pull request `#23`: Profile now uses Account Settings and one Profile Information surface for username, session, and entry status; Results replaces public Leaderboard wording while `/leaderboard` remains unchanged, and personal result pages read Your results
- Slice 5 preserves all entry forms and return links, the two-step free beta journey, the 20-player pool, one ranked 10-player board, saved-entry persistence, lock state, scoring, provider behavior, payments, wallet behavior, eligibility logic, legal terms, admin behavior, and parked paid-version surfaces; branch verification passed `npm run typecheck`, `npm run lint`, `npm run test` (`34` files, `206` tests), and `git diff --check`; focused `npm run test:e2e:ci -- tests/e2e/homepage.spec.ts tests/e2e/final-results.spec.ts` was blocked before any test executed because Chromium could not register `org.chromium.Chromium.MachPortRendezvousServer` in the Codex desktop macOS process sandbox
- `42cd89e` consolidates the Contests, Contest Detail, Auth, signed-out Profile, How It Works, and site-wide presentation cleanup: it removes the duplicate Player Pool summary metric while retaining the full player-pool list, removes repeated sign-in helper copy, uses sentence case across visible labels, and updates focused assertions; it does not change contest data, entry behavior, auth actions, eligibility capture, payments, wallet behavior, scoring, lifecycle, provider writes, legal terms, admin behavior, or production Supabase state
- recorded verification for the QA copy sweep is `npm run typecheck`, `npm run lint`, and `npm run test` (`34` files, `206` tests); `git show --check 42cd89e` also passes. The last verified Vercel Production deployment in this lane is `dpl_w4vt7ikKCLZJB6bQXJCiSTmxRHWy` for older commit `665c787a625a96500d573d599749d2b96a2ad639`; do not claim `42cd89e` is deployed until a fresh deployment check confirms it
- the auth copy follow-up removes the email sign-in helper sentence below the button and removes the Beta Pass no-cash-value sentence from the `/auth` information panel while retaining `No payouts or cash prizes are available during beta.`; shared legal and paid-preview disclosure copy remains unchanged, focused auth assertions cover the requested absence/presence, local Playwright remains blocked by `test-results` cleanup `EPERM`, and Vercel Production deployment `dpl_2EAJtCjpusLG3Jm9qdFA3su5autk` for commit `4998f8d` is `READY`; live `/auth` verification returned `200` with the requested copy state
- Provider evaluation is parked in local `codex/provider-rolling-insights` at `5e5acd3`; its remote-tracking branch is at `5ca237a`. No provider work is part of `main` or the QB framework review.
- `.github/workflows/playwright.yml` now provides the verified browser gate outside the Codex desktop macOS process sandbox: it installs Playwright Chromium on Linux and runs the serialized full suite for pull requests, pushes to `main`, and manual dispatches; `docs/qa/browser-verification.md` records the failure classification and local fallback, while local Codex desktop runs can still fail before test execution at `bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)` because the parent application's macOS process sandbox remains in force
- the private MySportsFeeds read-only validation probe is integrated on `main`; it adds no Supabase writes and does not change the official typed-`FINAL` finalization path
- the repo-wide lint cleanup removes the remaining ESLint errors and warnings without changing product behavior; `npm run lint`, `npm run typecheck`, and `npm run test` (`37` files, `216` tests) pass
- earlier mixed local recovery work remains separated into preservation branches and active sibling worktrees; preserve those lanes until Parker chooses whether to integrate or retire them
- the latest pushed product baseline includes the paid-preview launch-mode guard, the admin contest removal flow, the production 18+ DOB gate/legal alignment, and the Early Access Beta public UI cleanup; `origin/main` is the source baseline for delivery
- the live worktree registry contains the dirty detached primary checkout, the current-main worktree at `/private/tmp/pickrank-main-reconciled`, the active final-results worktree, the docs-only pull request `#27` deployment closeout worktree, clean magic-link and return-to-board preservation worktrees, and the preserved dirty detached worktree at `/Users/parkerlevy/.codex/worktrees/6da1/PickRank`. Do not prune or clean dirty, active, or preservation lanes without explicit approval.
- `codex/provider-mysportsfeeds-read-only` remains a source preservation branch; the integrated `main` slice is verified, but branch retirement is still Parker's decision
- `git fetch --prune origin` completed on 2026-08-25. Before this handoff correction, local `main` was two commits behind `origin/main` at `b050edc`, with no commits ahead; the primary detached checkout had no committed-but-unpushed work.
- `git worktree prune --dry-run --verbose` reports no prunable registrations. Preserve branches with unique commits and every dirty or detached worktree.
- Early Access Beta is now the pushed and deployed production posture: public launch contests are free to play, visible launch contest seed data uses `$0.00` entry cost and `0` paid entries, public copy uses Beta Pass/no-cash-value/no-payout language, the active free entry path skips `/payment` and `/success`, those routes remain parked for future paid contests, and paid contests remain the future product direction behind legal, provider, payment, withdrawal, and compliance gates
- MySportsFeeds support confirmed the described B2C free-to-play beta use, internal validation, and storage are acceptable if PickRank does not place MySportsFeeds in competition. B2B and paid-contest terms remain separate. Historical technical checks passed, but a later private retest returned HTTP `403`, so current provider access remains unresolved. The repo includes `npm run validate:mysportsfeeds:read-only` as an internal no-Supabase probe.
- the read-only MySportsFeeds preseason test against DET at CIN, `2026-preseason/week/1/game/163796`, first proved auth, schedule access, `LIVE` game state, `COMPLETED_PENDING_REVIEW` post-game state, non-zero QB passing yards, provider player IDs, provider game IDs, and the private provisional snapshot row shape; a later read-only check on 2026-08-14 also proved the same game reaches plain `COMPLETED`, maps to provisional `final`, and returns six non-zero QB passing-stat rows
- a read-only live-slate check on 2026-08-14 proved repeatable `LIVE -> in_progress` handling and non-zero QB passing stats for three additional games: DEN at ATL (`163800`, 3 live rows), TB at NYJ (`163801`, 3 live rows), and MIA at WAS (`163802`, 4 live rows)
- follow-up read-only checks after completion now prove all three games reach plain `COMPLETED`, map to provisional `final`, and retain QB rows: DEN at ATL (`163800`, 5 rows), TB at NYJ (`163801`, 5 rows), and MIA at WAS (`163802`, 6 rows)
- `COMPLETED_PENDING_REVIEW` is intentionally mapped as provisional `in_progress`, not `final`; the historical technical validation and scoped internal validation/storage permission remain recorded. Current provider access is unresolved after the later `403` retest. Future paid-contest and B2B use remain separate commercial decisions, and the official typed-`FINAL` path remains unchanged.
- paid-mode UI work now has a safe preview setup path: `lib/launch-mode.ts` reads `PICKRANK_EXPERIENCE_MODE=early_access_beta|paid_preview`, Vercel Production is forced to `early_access_beta` even if the flag is misconfigured, and `paid_preview` keeps `paidEntryEnabled = false` plus `realMoneyEnabled = false` so it can expose future UI without enabling deposits, withdrawals, payouts, cash prizes, cash-balance movement, KYC, geolocation, wallet-ledger behavior, or real-money entry
- use branch `codex/paid-mode-preview-setup` and Vercel Preview branch-scoped `PICKRANK_EXPERIENCE_MODE=paid_preview` for future paid-mode UI development; do not copy the site into a second app, and keep production `www.pickrankgames.com` on the free-to-play Early Access Beta posture
- the merged beta public UI cleanup removes active public paid-review/wallet clutter from beta mode while preserving future paid-preview surfaces behind `launchMode.paidPreviewVisible`: Contest Detail replaces payout-style beta result rows with beta result status copy, Entry Review replaces money-sheet labels with Beta Pass summary labels for free beta contests, Profile hides public paid-entry/KYC/withdrawal rows plus the active wallet card in beta mode, `/wallet` reads as a Beta Pass status page in beta mode, and the current Slice 1 copy uses Results for public navigation and result-value labels without changing paid-preview behavior
- Vercel production deployment `dpl_2KU3hFwby5MS5PsoMqJ7WHYoEf89` is `READY` for commit `55b2bfcd71b74a44c9d0fd62f3aed8262287a20f` with deployment URL `https://pickrank-lqyzb25u3-parker-levys-projects.vercel.app`
- the 2026-08-10 contest-data cleanup code slice adds an operator-only `/admin/contests` retire control for visible scheduled/open public contests that do not match the free-beta posture; it requires `RETIRE BETA`, checks for saved `entries` rows with the service-role client, refuses hidden/internal validation contests, hides and cancels the contest, resets fake entry counters to `0`, and records a `free_beta_public_contest_retirement` state event; `db/seed/contest_repository_baseline.sql` now seeds public Week 1 at `$0.00` with `0` paid entries so future seed runs do not recreate the old paid-looking row
- the 2026-08-11 admin retirement hotfix awaits the asynchronous service-role Supabase client before checking saved `entries`; this fixes the production `b.from is not a function` failure without changing the retirement guardrails or contest data
- the 2026-08-11 contest removal usability follow-up is deployed from commit `51a8648` through production deployment `dpl_Fs1ooUvvw75auheC1BuY9Z9PqiEL`: the admin now uses a collapsed `Remove contest` review step and a `Yes, remove contest` button instead of the typed `RETIRE BETA` phrase; saved entries still block removal, removed contests retain their records, and no production contest data changed during verification
- the Early Access Beta under-18 account-support slice now keeps DOB entry validation strict for beta readiness while allowing a valid under-18 submission to reach the existing durable restriction RPC; Profile shows the account as restricted, provides `support@pickrankgames.com`, routes the account for discretionary review, and does not add a parent form, case-management system, automated deletion, or deadline
- focused browser verification passed `tests/e2e/admin-shell.spec.ts` (`2` tests) with signed-out protection, operator access, desktop and mobile layout, the new removal confirmation, and the absence of `RETIRE BETA`; commit `51a8648` is pushed on `origin/codex/admin-contest-removal-ux` but still needs integration into `main` so a later main deployment cannot regress the production change
- no production contest data was changed in the 2026-08-10 cleanup code slice because live mutation still requires Parker's explicit approval of the intended admin action or SQL path
- open follow-up: after fake active production contests are removed, hidden, or reconciled, rerun the eligible DOB smoke test through free-beta `Entry Review`; do not close the production contest-data cleanup slice until that retest either passes or is recorded with a fresh blocker
- repo verification for the Early Access Beta pivot passed `npm run typecheck`, `npm run test` (`36` files, `196` tests), focused `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/lineup-builder.spec.ts --workers=1` (`14` passed), focused `npx playwright test tests/e2e/final-results.spec.ts --workers=1` (`4` passed), and `git diff --check`
- the homepage integration keeps the live landing page pointed at `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster, adds the Remotion repo-hygiene helper notes and script, and updates homepage coverage in `tests/e2e/homepage.spec.ts`
- the 2026-07-08 homepage landing-page polish pass keeps that same video baseline, keeps the tighter video-line headline `15 players. Pick 10. Rank them.`, shortens the hero copy, collapses the above-the-fold CTA to a single waitlist-focused action, and trims the extra helper copy in the hero and video card without changing product behavior
- the approved 2026-07-12 homepage hero, `How PickRank works`, `Why PickRank`, and final waitlist CTA are live in production at `https://www.pickrankgames.com` through Vercel deployment `dpl_3WqaWZoFabyhtmFvghNbjNDGrZof`; the production build is `READY`, the hero and final waitlist CTAs route to `/auth`, and the lower homepage now ends with the single `Think you can rank them better?` conversion section
- the matching source in `app/page.tsx` and focused homepage coverage in `tests/e2e/homepage.spec.ts` are aligned with this handoff update on `main`, keeping GitHub aligned with the live wording
- the 2026-07-21 waitlist reconciliation slice is live in production: homepage waitlist CTAs are email-only forms with an explicit marketing-consent checkbox, `public.waitlist_signups` is the Supabase source of truth from migration `0012_waitlist_signups.sql`, Resend contact/welcome-email sync stays server-only behind `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_REPLY_TO_EMAIL`, and `RESEND_WAITLIST_SEGMENT_ID`, and `/auth` remains reserved for protected account/contest flows; Parker applied `0012` to linked Supabase project `jmvzdspiobcjrewndhuf`, confirmed `public.waitlist_signups` exists, created the Resend `PickRank Waitlist` segment, added the required Resend variables plus `SUPABASE_SERVICE_ROLE_KEY` in Vercel for Production and Preview, changed the Resend key to Full access, and production testing confirmed Supabase capture, Resend segment sync, and welcome-email send; the remaining follow-up is email deliverability polish because a successful test email reached Parker's work-email junk folder
- `docs/waitlist-workflow.md` records the narrow deliverability-prep boundary for that follow-up, and `docs/waitlist-deliverability-audit-2026-07-22.md` now includes the live deliverability result: after explicit approval, `auth.pickrankgames.com` was removed from Resend to stay on the one-domain plan, `pickrankgames.com` was added and verified in Resend, authoritative DNS moved from ZenBusiness SystemDNS to Cloudflare Free nameservers `gannon.ns.cloudflare.com` and `val.ns.cloudflare.com`, Cloudflare carries the copied web/mail records plus the new Resend DKIM, return-path SPF/MX, and DMARC records, Vercel `RESEND_FROM_EMAIL` now uses `PickRank <hello@pickrankgames.com>` for Production and Preview while `RESEND_REPLY_TO_EMAIL` remains unchanged, Production was redeployed from `main` commit `5402c0a`, and a fresh Gmail plus-alias production signup landed in Gmail Inbox/Updates with Resend `Delivered`, `From: PickRank <hello@pickrankgames.com>`, root-domain DKIM pass, return-path SPF pass for `send.pickrankgames.com`, and unchanged `Reply-To: info@pickrankgames.com`; treat root-domain waitlist deliverability as good enough for the current priority level, with iCloud, Outlook/Hotmail, work-email retesting, tracking metrics, and stricter DMARC left as later polish
- email-provider migration remains out of scope for the registrar-transfer slice; Cloudflare Email Routing is a viable later option for inbound forwarding to Gmail, but it is not a full mailbox and does not support normal sending or replying from PickRank domain addresses; moving to Cloudflare Email Routing later would require MX record changes, so treat it as a separate email-only slice after the registrar transfer is complete
- the 2026-08-20 Cloudflare Email Routing slice is active: the former root OpenSRS hosted-email MX now points to `route1.mx.cloudflare.net` at priority `20`, and `route2.mx.cloudflare.net` at `88` plus `route3.mx.cloudflare.net` at `76` were added; the root hosted-email SPF was replaced with `v=spf1 include:_spf.mx.cloudflare.net ~all`, and `cf2024-1._domainkey` routing DKIM was added. Cloudflare shows its DNS records as enabled and locked. Explicit active forwarding rules route `hello`, `info`, `support`, `privacy`, and `legal` at `pickrankgames.com` to Parker's verified Gmail address. The Vercel A/CNAME records, DMARC, both Resend DKIM records, both `send` and `send.auth` Amazon SES MX/SPF pairs, and the legacy hosted-email `mail` CNAME/DKIM remain unchanged. No catch-all rule is enabled. Parker cancelled the former ZenBusiness `Domain, Email, and Website` $15/month bundle on 2026-08-21; the cancellation page states it remains active through 2026-09-09 and will not renew. Next, test incoming mail to each alias from a separate mailbox and separately recheck a Resend waitlist email.
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
- the 2026-08-05 Build Your Board web/mobile parity cleanup is presentation-only and committed on `main` at `078653e`: rows now separate rank/name/status from the icon controls on both mobile and desktop, row controls use the same larger tap targets across breakpoints, the board and player-pool sections stay stacked in the narrow app shell, the disabled Save Your Board panel stays in normal flow instead of covering content, the Save panel only sticks while there are unsaved changes, and the bottom spacing keeps the Save panel clear of the bottom nav
- repo verification for the 2026-08-05 Build Your Board web/mobile parity cleanup passes `npm run typecheck`, focused `npx eslint components/contests/lineup-builder-client.tsx tests/e2e/lineup-builder.spec.ts`, `npm run test` (`36` files, `196` tests), `git diff --check`, focused `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` (`8` passed after the expected sandbox `listen EPERM` rerun outside the sandbox), and a temporary screenshot Playwright pass; screenshots were captured under `/private/tmp/pickrank-build-your-board-parity-review/`
- the 2026-07-29 `$0` free/test contest proof slice adds one contest-operator-gated `/admin/contests` control for visible, open, zero-fee contests with at least one entry and zero paid entries; it records an admin state event for `open -> locked`, preserves saved lineups as read-only, keeps direct lineup saves blocked at lock with `409`, reuses the existing typed-`FINAL` manual finalization path, and verifies final leaderboard/results with zero payout amounts and no wallet, payout, payment, KYC, geolocation, provider-automation, or public paid-entry changes
- repo verification for the `$0` free/test proof slice passes `npm run typecheck`, focused Vitest on admin lifecycle/finalization/results/entry/lineup/readiness coverage (`8` files, `61` tests), full `npm run test` (`35` files, `189` tests), focused `CI=1 npx playwright test tests/e2e/final-results.spec.ts` (`4` passed), targeted `CI=1 npx playwright test tests/e2e/lineup-builder.spec.ts -g "locked zero-fee contests"` (`1` passed), and the full `CI=1 npx playwright test tests/e2e/lineup-builder.spec.ts` suite (`8` passed) with the shared file-backed lineup fixture serialized
- `docs/analysis/legal-consultant-draft-questions-2026-07-29.md` logs the read-only first-pass question bank for the July 28 legal consultant draft package; the core follow-up frame is separating what must change in the product now from what can remain a launch-readiness item before real-money contests, especially fixed prize schedules versus dynamic pools, cash refunds versus site-credit defaults, 15-20% fee versus 30%, 10-entry minimum versus 4, tiebreak alignment, launch-state footprint, vendor gates, tax review, and IP sequencing; this note does not change product specs or enable paid entry
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
- GitHub access was re-verified from Codex on 2026-08-17: `gh auth status` and `gh api user` authenticate as `parkerhlevy`, `git fetch --dry-run origin`, `git ls-remote --heads origin main`, and `git push --dry-run origin HEAD` pass, and this checkout uses `https://github.com/parkerhlevy/pickrank-app.git` with the existing GitHub CLI credential helper; a dedicated `Codex PickRank` SSH key is registered as a fallback, but raw SSH DNS remains unavailable through the managed Codex network profile, so keep HTTPS as the Codex Git transport unless that network behavior changes
- the current Remotion source baseline is a motion-polished `38.5s` waitlist-focused cut under `assets/marketing/video/`, aligned to the Early Access Beta posture, the 20-player pool / pick-10 product framing, and the `pickrankgames.com` brand
- the latest rendered review asset is `assets/marketing/video/out/pickrank-landing-video.mp4`
- the 2026-08-09 Remotion free-beta pass keeps the `Locked In` music bed, CTA, poster path, and homepage video path, but changes the opening lesson to Early Access Beta objective-first copy: `Same 20-player pool.`, `Pick 10.`, `Rank the final order.`, `Closest board wins.`, and `Free to play during beta.`
- the 2026-08-10 Remotion pacing follow-up adds `0.5s` to each of the eight scenes, increasing the cut from `34.5s` to `38.5s`; the leaderboard scene now uses `Leaderboard` for the eyebrow and board title, removes the beta/no-cash subhead, and keeps `Beat the field.`, `National Week`, and point-total rows unchanged
- the live landing page now serves the updated Early Access Beta `Locked In` export from `public/marketing/pickrank-landing-video-locked-in-final.mp4` with `public/marketing/pickrank-landing-thumb.png` as the poster image, while the Remotion source-of-truth render remains under `assets/marketing/video/out/`
- repo verification for the 2026-08-10 Remotion pacing follow-up passes repo `npm run typecheck`, repo `npm run test` (`36` files, `207` tests passed), `git diff --check`, focused `npx eslint app/page.tsx tests/e2e/homepage.spec.ts`, `npm run lint` inside `assets/marketing/video`, unsandboxed `npm run render -- --timeout=120000`, a Remotion leaderboard still-frame visual check, and unsandboxed focused `npx playwright test tests/e2e/homepage.spec.ts` (`7` passed)
- an older local video pass on 2026-07-02 loosened headline tracking for readability, removed the misleading ranking arrow marker, and rebuilt the scoring beat into a simpler two-example points equation so the slide reads as "lowest total wins" instead of a dense rule card
- an older local video pass on 2026-07-03 restored several scene states that had drifted backward during earlier scoring/readability edits: selection then used `Slate` and `Your Board`, ranking animated to a clean final reorder with Mahomes landing in `#1`, scoring cards and rule pills aligned more consistently, the differentiator headline split into three lines, the weekly board showed actual point totals, and the CTA again used the logo plus one waitlist button instead of duplicate waitlist copy
- the current cut lock now lives in `docs/marketing/remotion-current-cut.md`; future Remotion passes should read that file before editing scene copy, UI state, or CTA content so older brief ideas do not slip back into the active cut
- the latest local video pass on 2026-07-03 also slowed the cut so every scene now runs at least four seconds, accented `Pick your 10.` in Selection, switched the Ranking header to `Drag & drop`, tightened the Scoring pills and player cards, and kept the CTA on the high-contrast white-`Pick` logo variant
- the latest local video pass on 2026-07-03 now points the CTA to an interim white-`Pick` logo asset from the downloaded brand review set and layers in an original upbeat WAV music bed inside the Remotion project, which keeps the current export self-contained and free of third-party licensing dependency while a true transparent brand master is still pending
- Parker has now completed the music-selection reset using real licensable reference tracks, chose PremiumBeat's `Locked In` over `Design in Motion` in direct video review, and the current default Remotion cut points at a licensed `Locked In` short WAV trimmed into the heavier groove so one natural break lands at the Scoring scene transition without over-syncing every beat
- `lib/contest-data.ts` now reads and writes contest browse/admin data directly against Supabase/Postgres in normal app use, while keeping file-backed fixtures only for tests and explicit fixture-driven runs
- `data/contest-entries.json` now belongs with that fixture-backed path and should be treated as intentional repo fixture data alongside `data/contests.json`, not ignored or deleted as throwaway runtime output
- Supabase role foundations now exist in repo migrations for `roles` and `user_roles`, with `contest_operator` as the single enforced MVP internal role
- internal operator assignment can now be staged by email before signup through `pending_user_roles`, which auto-converts into a real `user_roles` assignment when the matching user account is created
- the active Supabase project now has migrations `0001` through `0004` applied, plus the `assign_first_contest_operator.sql` seed
- operator bootstrap is confirmed for `parkerhlevy@gmail.com` and `thl2713@gmail.com` as live `contest_operator` assignments; the repo seed targets `parkerhlevy@gmail.com`, `gary.levy59@gmail.com`, `thl2713@gmail.com`, and `glevy59@icloud.com` for operator assignment or pending-role staging, while the two Gary addresses remain historical bootstrap targets that were not re-applied or reverified during the Early Access Beta push
- the admin flow now records `created_by_admin_id`, `validated_by_admin_id`, and `published_by_admin_id`, and draft contests can now carry real `slatePlayers` rows plus stricter publish validation through the shared contest repository layer
- the board builder no longer relies on the temporary 10-player subset shortcut; signed-in users can now save one ranked 10-quarterback board from the full 20-player contest pool against a persisted entry record
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
- the official finalization seam still supports disabled, file-backed, and persisted-snapshot flows for final stat prefills, while generic provisional snapshot storage remains available for private provider evaluation and operator review prep
- generic provisional snapshot storage remains separate from saved final-results tables and the typed `FINAL` confirmation gate; provider-specific writers are retired pending rights review
- the active Supabase project now exposes `contest_provisional_stat_snapshots` plus `contest_provisional_stat_snapshot_rows` through the REST schema used by the app for private provisional provider evaluation
- no hidden provider-validation contest or provider-specific Supabase persistence is part of the current implementation lane
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
- the 2026-07-13 read-only security review of auth, entry, results, admin, provisional snapshot, and hidden validation-script boundaries passed `npm run typecheck` plus `npm run test` (`27` files, `124` tests passed), and its two narrow follow-ups were completed on 2026-07-15; future auth or operator workflow widening should keep auth redirects pinned to trusted configured origins and keep public leaderboard/results identity reads limited to display-handle data for users with saved final rows
- the older marketing/Remotion and design-doc work was intentionally parked on 2026-07-02 in the local stashes `parked-remotion-design-2026-07-02` and `parked-next-env-noise-2026-07-02`; current active marketing dirt in the live `main` worktree belongs to the narrow 2026-08-02 teaching-flow update
- the 2026-08-21 weekly maintenance pass removed the broken `/private/tmp/pickrank-waitlist` registration as stale Git metadata; the `codex/waitlist-workflow` branch and its unique commits remain preserved, and no worktree directory or uncommitted file was deleted
- the July 15 security/final-results hardening slice is now committed on `main`; keep generated `next-env.d.ts` churn and local `docs/analysis/` notes out of unrelated release commits, and do not mix the parked `codex/waitlist-workflow` branch into `main` unless Parker explicitly asks to reconcile or retire it
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

## Active Legal Beta Action List

Source: the August 6 legal consultant call with Ross, Ross's August 6 beta document package in the shared Drive folder, plus the current repo beta posture.

Current decision frame:

- Phase 1 is strictly free-to-play Early Access Beta.
- Do not add paid entry, deposits, withdrawals, payouts, cash prizes, cash-balance movement, KYC vendor flows, geolocation enforcement, or state-by-state paid eligibility in this lane.
- Keep the public product posture consistent everywhere: Beta Pass, no cash value, no payouts, no cash prizes, and paid contests deferred behind legal/provider/payment/withdrawal/compliance gates.
- Treat Ross's revised core docs as the source for final legal wording once Parker approves them. Until then, site legal pages can be scaffolded and linked, but final terms should not be invented.
- The Drive package currently contains Office `.docx` files, not native Google Docs. The connector can read them. If connector-native document edits are needed, first confirm whether the Office-mode files must be converted or replaced.
- The revised Contest Rules still describe the old 15-player slate. They must be corrected to the repo's 20-player pool / ranked 10-player board rule before publication.
- Parker changed the Early Access Beta age posture to `18+` on 2026-08-11. The hotfix is now on `main` at `b6e7a6e`: PickRank collects DOB directly in account/profile setup, validates new DOB submissions against the 18+ threshold, and recomputes saved profile readiness from stored DOB so older confirmed age metadata cannot unlock beta use by itself. It does not rely on Google SSO or Google People API birthday scopes.

What can be done now:

- Keep `/legal/terms`, `/legal/privacy`, `/legal/beta-rules`, `/legal/acceptable-use`, and `/legal/responsible-play` aligned with the free beta posture and the current 20-player pool / ranked 10-player board mechanic. The hotfix legal routes use beta-ready site copy based on Parker's supplied decisions, including the `18+` beta posture, DOB collection, Playground Sports, LLC as operator, August 9, 2026 effective date, August 11, 2026 last-updated date, Washington law, King County venue, `support@pickrankgames.com`, 30-day deletion target, and 7-day enforcement review target.
- Correct the beta Official Contest Rules before publication: use a 20-quarterback player pool, rank 10, actual rank measured against all 20 players, tied player stats sharing an actual rank range, and the locked repo entry tiebreakers. The site summary copy is updated locally; Ross's Office-mode `.docx` rules file still needs conversion/replacement or manual edit before it can be treated as final.
- The standalone `/legal/acceptable-use` page is now part of the repo legal set. It uses the current free-beta `18+` posture, `board` and `entry` terminology, provider-neutral wording, and the seven-day enforcement review target; the full Ross `.docx` policy remains separate and unchanged in Drive.
- Keep the global legal footer visible on public and account routes. It links Terms, Privacy, Beta Rules, Acceptable Use, and Responsible Play. The local legal pages also cross-link each other.
- Audit homepage, contest, auth, profile, wallet, and email copy for paid-launch remnants, cash-prize implications, "credits" ambiguity, or betting/wagering language.
- Confirm the waitlist form and welcome-email copy clearly state marketing consent and unsubscribe availability before any broader outreach. The waitlist form already requires explicit marketing consent and says users can unsubscribe anytime.
- Update the welcome-email footer before broader outreach so it includes why the recipient is receiving the email, no-purchase/no-entry-fee/no-prizes language, unsubscribe or Resend preference handling, Privacy Policy link once live, the required real postal address, and the NFL/no-endorsement disclaimer. The local welcome email now includes the source, no-purchase/no-entry-fee/no-prizes language, Privacy Policy link, future Resend unsubscribe language, Playground Sports, LLC's supplied postal address, and NFL/no-endorsement disclaimer. A live campaign unsubscribe/preference URL remains required before marketing broadcasts.
- Review Ross's revised core beta docs against the site-ready Terms and Privacy copy before final publication.
- Keep first-party DOB collection in the account/profile setup flow for the `18+` beta posture. A valid under-18 submission reaches the existing durable restriction RPC, while strict 18+ validation remains the beta-entry readiness rule. Production data remediation remains approval-gated and separate from this code slice. Use `restriction_reason='under_18_age_gate'` for an age-only hold; the age gate may become confirmed when stored DOB reaches 18, but the account restriction remains until explicit review. Non-age account, eligibility, compliance, or responsible-play holds must remain blocked until review.
- The existing `/admin/eligibility` surface now shows computed `DOB / 18+ check`, age-gate status, account status, eligibility status, restriction reason, and whether the restriction is age-only or admin/compliance. This is read-only visibility for the hotfix; it does not add public paid eligibility or a production remediation workflow.
- Verification for the `main` cherry-pick passed in `/private/tmp/pickrank-main-age-gate-18`: `npm run typecheck`, `npm run test` (`36` files, `211` tests), `git diff --check`, the stale age-copy search across `app`, `lib`, `spec`, `docs`, `tests`, and `db` with no matches, and focused `npx playwright test tests/e2e/homepage.spec.ts tests/e2e/lineup-builder.spec.ts --workers=1` (`15` passed after the expected sandbox `listen EPERM` rerun outside the sandbox). Vercel production deployment `dpl_BdCeCgJKyyABQ47duaBDiaYgHCqh` is `READY` for the `main` push and aliases `www.pickrankgames.com`; read-only live checks on Terms, Privacy, Beta Rules, Responsible Play, and Profile returned `200`, legal pages had 18+ language, old age-threshold copy was absent, and the no-money beta boundary remained present. No production Supabase data was mutated.

Decisions Parker needs to make:

- Review Ross's revised document overview first, then approve the exact beta docs before final site copy changes.
- Decide whether `PickRank` remains the long-term name before spending on trademark clearance or intent-to-use filing.
- Defer entity restructuring unless traction, fundraising plans, or Phase 2 paid-contest planning make it necessary.

Deferred Phase 2 items:

- Paid-contest Terms, paid Official Contest Rules, payment provider selection, payout provider selection, KYC/identity, geolocation, taxes, supported-state rules, responsible-play operations, refunds, wallet ledger movement, and public paid eligibility approval.
- Trademark filing, code/UI copyright registration, and trade-secret process work after the name and business direction are more settled.

## Suggested Next Slice

Current product checklist:

```text
1. Profile and Results: merged into `main` through pull request `#23`
2. Shared shell + static public pages: merged
3. Contest discovery + Contest Detail: implemented in Slice 2
4. Free beta entry flow: implemented in Slice 3
5. Build your board: implemented in Slice 4
6. Provider evaluation: parked in `codex/provider-rolling-insights`; it is not part of Slice 5
7. Repo hygiene: the primary checkout is detached and mixes several preserved lanes; use a clean current-main worktree for new work and reconcile the primary checkout one explicit lane at a time
8. Under-18 account support: implemented as a narrow free-beta restriction and support-review path
```

Next recommended slice:

```text
Review the two local Profile/Auth commits first, then review the separate local `codex/persistent-board-save-state` commit. Push only with separate approval, then use the hosted Linux Chromium gate as the browser delivery check.
```

Definition of done:

- Parker approved Lane A and Lane B
- the persistent saved-board notice and compact bottom saved state are recorded in one local review commit
- the saved-board lane remains separate from Profile/Auth
- the hosted Linux Chromium gate passes after an approved push
- no production board is mutated without separate disposable-account approval

Queued separate provider decision:

Historical MySportsFeeds preseason and live/final read-only checks passed, and on 2026-08-19 support confirmed the described PickRank B2C free-to-play beta use, internal validation, and storage are acceptable as long as PickRank does not place MySportsFeeds in competition. A later private retest returned HTTP `403`, so current provider access remains unresolved. B2B and paid-contest terms remain separate decisions. Do not write Supabase rows without explicit approval, and preserve the official typed-`FINAL` path.

Queued separate production-account slice:

```text
Continue PickRank using the repo as source of truth. Work only on the production 18+ DOB/profile gate smoke and read-only under-18 account audit. Start from `docs/agent-handoff.md`, `spec/product_spec.md`, `spec/features/account_profile_auth.md`, `spec/features/compliance_eligibility_responsible_play.md`, `app/auth/*`, `app/profile/*`, `app/legal/*`, `lib/auth-profile.ts`, `lib/viewer-identity.ts`, `lib/contest-entry-access.ts`, and `lib/contest-entry-confirmation.ts`. Keep Phase 1 strictly free-to-play Early Access Beta. Confirm production Profile shows the `DOB / 18+ check` readiness state for an approved 18+ account and that Entry Review remains free beta. Run only read-only production checks for under-18 profiles unless Parker explicitly approves a disposable under-18 form submission or remediation. Do not mutate production data without explicit approval.
```

Queued separate paid-preview UI slice:

```text
Continue PickRank using the repo as source of truth. Work only on future paid-mode UI in the paid-preview lane. Start from branch `codex/paid-mode-preview-setup`, `docs/agent-handoff.md`, `docs/deployment.md`, `spec/product_spec.md`, `spec/features/frontend_navigation.md`, `spec/features/payment_wallet_ux.md`, `spec/features/compliance_eligibility_responsible_play.md`, `lib/launch-mode.ts`, and the page/component files for the surfaces being changed. Use `PICKRANK_EXPERIENCE_MODE=paid_preview` only in local development or Vercel Preview. Keep Vercel Production forced to free-to-play Early Access Beta. Do not enable real-money entry, deposits, withdrawals, payouts, cash prizes, cash-balance movement, KYC, geolocation, wallet-ledger behavior, production Supabase writes, or paid eligibility approval. Make page-by-page UI changes behind the paid-preview mode, keep beta public UI safe, update focused tests, and verify both beta and paid-preview behavior before closing.
```

## Starter Prompt For Future Chats

Use this prompt for the immediate follow-up:

```text
Review the local persistent saved-board commit in `/private/tmp/pickrank-persistent-board-save-state`. Confirm the saved notice persists after save and reload, editing restores `Unsaved changes`, re-saving restores completion, empty and locked boards do not show completion, save failures stay unsaved, and no post-save exit action was added. Preserve the detached primary checkout. Do not push, merge, deploy, or mutate a production board without explicit approval.
```

Use this default starter prompt pattern after that slice is complete:

```text
Continue PickRank using the repo as source of truth. Use clear, short technical English. The current launch posture is free-to-play Early Access Beta with no cash value, payouts, or cash prizes. The remaining stats-provider candidates are MySportsFeeds and Rolling Insights DataFeeds. Keep provider work private and read-only until written rights and technical coverage are confirmed. Do not change scoring, payments, wallet, eligibility, auth, public results, Supabase data, or typed `FINAL` finalization without explicit approval.
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
