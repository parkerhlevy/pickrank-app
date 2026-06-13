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

- Home
- Contests
- Leaderboard
- Profile

Make How It Works accessible from major pages through header links or contextual CTAs, not bottom navigation.

## Brand Assets

The current working logo files come from Parker's individual logo exports from June 13, 2026. Prefer the transparent PNG set for implementation because it works across dark and light surfaces.

App-facing files:

- `public/brand/pickrank-wordmark-dark.png`
- `public/brand/pickrank-wordmark-light.png`
- `public/brand/pickrank-app-icon.png`

Source exports are stored in:

- `public/brand/source/`

Transparent source exports:

- `public/brand/source/pickrank-wordmark-football-transparent.png`
- `public/brand/source/pickrank-wordmark-transparent.png`
- `public/brand/source/pickrank-monogram-transparent.png`
- `public/brand/source/pickrank-app-icon-dark-transparent.png`
- `public/brand/source/pickrank-hero-concept-transparent.png`

Use the football wordmark for the current dark hero surface. Avoid using the full generated hero concept in production UI because it includes generated player/phone imagery and is better treated as visual reference only.

## Parker Review Notes After First Visual Pass

- Overall direction is positive. Continue with the current clean dark-blue/light-card visual system, while adding real logo assets when selected.
- Navigation decision made after review: bottom nav is `Home`, `Contests`, `Leaderboard`, `Profile`; Wallet content lives under Profile with `/wallet` still available as a secondary route.
- How It Works should include a concrete rank-differential example so users can understand scoring without knowing the model in advance.
- Build Your Lineup should sit behind the payment/entry component in the eventual user flow. Keep it visual-only in Phase 0, but do not make it feel available before entry/payment review.
- Reconsider How It Works link placement per page. It can stay prominent on Home, Contests, Contest Details, Wallet, and Auth, but it feels cramped in the Leaderboard and Profile hero blocks.
- The current UI is intentionally mobile-first and looks best as a narrow app shell. Future design work needs an explicit browser/desktop decision: either keep desktop as a centered mobile-style app experience, or create wider desktop layouts with better use of horizontal space.
