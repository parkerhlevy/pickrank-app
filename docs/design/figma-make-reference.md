# Figma Make Screenshot Reference

## Purpose

This note captures the usable design direction from the Figma Make screenshots saved in `docs/design/references/`.

The screenshots are visual reference only. Product behavior remains governed by:

- `docs/agent-handoff.md`
- `docs/design/figma-screenshot-audit.md`
- `docs/design/figma-v1.md`
- `spec/product_spec.md`
- relevant files under `spec/features/`

## Screenshot Files

| Screen | Reference |
|---|---|
| Home / dashboard | `docs/design/references/pickrank-make-01-current-home.jpg` |
| Contests | `docs/design/references/pickrank-make-02-view-contests.jpg` |
| Leaderboard | `docs/design/references/pickrank-make-03-leaderboard.jpg` |
| Wallet | `docs/design/references/pickrank-make-04-wallet.jpg` |
| Profile | `docs/design/references/pickrank-make-05-profile.jpg` |
| Browser viewport | `docs/design/references/figma-make-current-viewport.jpg` |

## Brand Assets

Current app assets are cropped from Parker's selected Concept 9 direction in the logo sheet:

- `public/brand/pickrank-wordmark.png`
- `public/brand/pickrank-app-icon.png`

Use these as working assets for the first brand pass. Replace them with clean exported source assets when final logo files are available.

## Keep As Visual Direction

- Mobile-first centered app shell.
- Light background with white cards and soft borders.
- Stronger dark top surface for PickRank identity.
- Blue primary actions and active states.
- Compact status badges.
- Contest cards with clear title, lock time, entry count, entry fee, prize pool, and CTA hierarchy.
- Contest detail layout with stat tiles, projected payouts, scoring summary, and a sticky visual CTA.
- Leaderboard podium treatment as a final-results visual direction.
- Wallet balance cards that separate Cash Balance and Site Credit.
- Profile sections for account preview, eligibility placeholders, and support/settings rows.

## Correct Before Implementation

- Do not use `Live` for enterable pre-lock contests.
- Do not show live scoring, partial scores, or in-game rank movement.
- Do not show `Results in` timing before contest lock or final state.
- Do not show capped entry counts such as `87/100`.
- Do not use generic `credits` for entry fees, prize pools, payouts, or wallet balances.
- Do not imply deposits, withdrawals, payment methods, wallet ledger history, KYC, or eligibility checks are implemented.
- Do not use real NFL player names, team logos, or production data assumptions in the placeholder UI.

## First Code Pass Direction

Use the screenshots to improve the existing Phase 0 routes only:

- `/`
- `/contests`
- `/contests/[contestId]`
- `/leaderboard`
- `/wallet`
- `/profile`
- `/how-it-works`
- `/auth`

Keep bottom navigation as:

- Contests
- Leaderboard
- Wallet
- Profile

Make How It Works accessible from major pages through header links or contextual CTAs, not bottom navigation.

## Parker Review Notes After First Visual Pass

- Overall direction is positive. Continue with the current clean dark-blue/light-card visual system, while adding real logo assets when selected.
- Navigation needs a follow-up decision. There is currently no obvious way back to `/` from the bottom navigation. Consider replacing `Wallet` with `Home` in the bottom nav and moving wallet information under `Profile`, or adding another clear home affordance that does not crowd the page headers.
- How It Works should include a concrete rank-differential example so users can understand scoring without knowing the model in advance.
- Build Your Lineup should sit behind the payment/entry component in the eventual user flow. Keep it visual-only in Phase 0, but do not make it feel available before entry/payment review.
- Reconsider How It Works link placement per page. It can stay prominent on Home, Contests, Contest Details, Wallet, and Auth, but it feels cramped in the Leaderboard and Profile hero blocks.
- The current UI is intentionally mobile-first and looks best as a narrow app shell. Future design work needs an explicit browser/desktop decision: either keep desktop as a centered mobile-style app experience, or create wider desktop layouts with better use of horizontal space.
