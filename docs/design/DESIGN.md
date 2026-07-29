# PickRank Design Entry Point

## Purpose

Use this file as the canonical starting point for future PickRank UI work inside `docs/design/`.

Behavior still comes from:

- `/spec`
- `docs/agent-handoff.md`

Design docs in this folder control presentation, visual hierarchy, layout direction, and copy guardrails only. They do not change routing, auth gates, scoring, payout logic, wallet rules, compliance rules, or other product behavior.

## Source Order In `docs/design/`

Read in this order for UI work:

1. `docs/design/DESIGN.md`
2. `docs/design/figma-screenshot-audit.md`
3. `docs/design/figma-v1.md`
4. `docs/design/figma-make-reference.md`
5. `docs/design/references/*` for screenshot context only

If any design note conflicts with `/spec` or `docs/agent-handoff.md`, treat the repo behavior docs as authoritative and update the design note later instead of following the conflict silently.

## Locked Terminology Defaults

Use these defaults unless a repo spec changes them:

- `Open Contests` for the primary browse label
- `Build Your Lineup` for the lineup-building screen
- `Cash Balance` for withdrawable winnings
- `Site Credit` for non-withdrawable refunds or promotions
- `Contest` for the paid competition
- `Slate` for the set of available players/items being ranked
- `Lineup` or `Rankings` for the user's saved ordered list
- `View Results` for entrant final-state CTA
- `View Leaderboard` for public final-state CTA

Avoid using `contest`, `slate`, `lineup`, `rankings`, and `picks` interchangeably when one specific term is more accurate.

## Non-Negotiable UI And Copy Constraints

- Keep PickRank framed as a skill-based contest product, not a sportsbook.
- Do not use betting, wagering, casino, odds, parlay, or risk-free language.
- Keep bottom navigation as `Home`, `Contests`, `Leaderboard`, `Profile`.
- Keep `How It Works` easy to reach from major screens without replacing bottom-nav items.
- Do not show capped entry counts such as `87/100` unless a future spec explicitly adds contest caps.
- Do not use `Live` for pre-lock enterable contests. Prefer lifecycle-accurate labels such as `Open`, `Locks soon`, `Final`, or `Canceled`.
- Contest Details payout previews should show only `1st`, `2nd`, and `3rd`.
- Use dollars for entry fees, prize pools, payouts, winnings, `Cash Balance`, and `Site Credit`.
- Keep wallet, withdrawal, eligibility, and verification copy placeholder-safe until providers and compliance flows are live.
- Final leaderboard and results screens should present saved final data only. Do not imply live scoring or unofficial results.
- Do not add new product rules to justify a visual treatment.

## Presentation Boundary

Use design docs here to guide:

- card density and spacing
- badge treatment
- page-header structure
- CTA hierarchy
- placeholder framing
- empty states
- results and leaderboard presentation
- focus, reduced-motion, and interaction polish for existing UI behavior

Use `/spec` and `docs/agent-handoff.md` to decide:

- navigation behavior
- auth and eligibility gates
- payment and wallet behavior
- scoring and tie handling
- contest lifecycle and results availability
- admin or provider boundaries

## External Design Skills Usage

External design-engineering skills may be used as review inputs, but they do not override PickRank specs or product behavior.

Current stable defaults:

- Prefer native HTML controls and visible `focus-visible` treatment before adding ARIA or custom widgets.
- Keep motion restrained, purposeful, interruptible, and reduced-motion aware.
- Use CSS transitions and existing Tailwind/CSS utilities before adding a motion library.
- Treat keyboard support as part of the game experience, especially on Build Your Lineup.
- Keep color-system changes scoped. Do not migrate from the current HSL token system to OKLCH without a separate design-system migration.
