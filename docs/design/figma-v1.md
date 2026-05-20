# Figma V1 UI Direction

## Source

Figma Make concept link:

https://www.figma.com/make/uuqdTXPfoEWENwMhLR8B0x/PickRank?t=KW7uvLCiM1JqPsdJ-1

This document captures the first Figma Make UI direction for PickRank. These screens are visual reference only. Product rules, scoring, contest lifecycle, wallet behavior, payment rules, compliance, and implementation priorities remain governed by `/spec` and `docs/agent-handoff.md`.

## Purpose

Use this direction to guide the first Replit/Codex/engineering UI pass for the existing Next.js app.

The designs should help establish:

- Mobile-first layout direction
- Card and badge styling
- Bottom navigation pattern
- Contest card hierarchy
- Leaderboard/podium treatment
- Wallet/site-credit visual style
- Pick builder interaction direction

Do not use this file as authority to change product rules.

## Screens Captured

The first Figma Make pass included these visible screens:

1. Contests
2. Leaderboard
3. Wallet
4. Profile
5. Contest Details
6. Make Your Picks, empty state
7. Make Your Picks, partially selected state

## Overall Direction

The design direction is generally strong for the MVP shell:

- Clean mobile-first layout centered in a narrow viewport
- Light background with card-based sections
- Blue primary accent color
- Soft status badges for Open, Live, and completed-style states
- Bottom tab navigation with Contests, Leaderboard, Wallet, Profile
- Clear hierarchy between page title, primary card content, and supporting metadata
- Sports-tech feel without casino/sportsbook styling

## What To Keep

### Navigation

Keep the bottom nav pattern:

- Contests
- Leaderboard
- Wallet
- Profile

The nav should remain simple and persistent across primary app routes.

### Contest Cards

The contest cards work well as a visual direction:

- Contest title
- Week/context label
- Status badge
- Prize pool/site credit placeholder
- Entry count
- Deadline
- Entry cost
- Progress indicator

Use similar hierarchy in the existing `/contests` route.

### Contest Detail Page

The Contest Details screen has a useful structure:

- Back affordance
- Contest title/status
- Key stat row for prize pool, entries, and deadline
- Entry fee
- About this contest
- Contest rules
- Sticky bottom CTA

This is a good visual direction for future `/contests/[contestId]` work.

### Leaderboard

The leaderboard direction is useful:

- Live contest summary card
- Podium-style top-three visualization
- Ranking rows below
- Current prize indicator
- User-friendly point display

Use this as visual inspiration, but actual leaderboard logic and tie behavior must follow `/spec`.

### Wallet

The wallet page direction is helpful:

- Large site-credit balance card
- Clear disclaimer-style card explaining site credits
- Summary stats
- Transaction history list

Wallet copy should remain compliance-aware and avoid implying real-money withdrawal mechanics until reviewed.

### Profile

The profile direction is solid for placeholder UI:

- User summary card
- Account details
- Verification status placeholder
- Settings/support section

Do not implement real identity verification or eligibility logic from this design alone.

### Pick Builder

The Make Your Picks direction is useful visually:

- Progress card
- Instruction/helper card
- Ranked selections section
- Available players section
- Sticky bottom action area
- Disabled CTA until required picks are complete

The visual interaction can guide future lineup builder work, but the core product spec controls the real behavior.

## Important Product Mismatches To Correct Before Implementation

The Figma Make output includes a few useful UI patterns but also some product mismatches.

### Slate Size

Some Figma screens reference:

```text
0/10 selected
3/10 selected
Your Top 10
Rank the top 10 quarterbacks
```

The current MVP spec is based on a 15-quarterback slate. Implementation should use the spec-backed number unless the product decision is explicitly reopened.

### Entry Language

The Figma output uses:

```text
Review & Submit Entry
```

The project has previously preferred `Save Lineup` language for the lineup builder to avoid implying a user-controlled permanent lock before the deadline. Use the latest `/spec` guidance before changing save/submit wording.

### Player/Team Data

The Figma output uses real player names and city/team references. For implementation and screenshots, prefer mock or generic data unless the data model intentionally supports real NFL/player data and rights considerations have been reviewed.

### Wallet Actions

The Figma output shows Add Credits and Withdraw. These can remain placeholders, but do not implement deposits, withdrawals, payment processing, or real-money flows until compliance/payment review is complete.

## Implementation Guardrails For Replit/Codex

Use the Figma V1 direction to improve UI only.

Do not:

- Rewrite the app from scratch
- Introduce a new framework
- Implement real auth
- Implement payment flows
- Implement deposits or withdrawals
- Implement wallet ledger logic
- Implement contest scoring
- Change payout logic
- Change tie handling
- Change contest lifecycle rules
- Commit generated files

Do:

- Work inside the existing Next.js app
- Preserve GitHub as source of truth
- Keep changes small and reviewable
- Use existing UI components when possible
- Keep typecheck and tests passing
- Align copy with `/spec`
- Treat these designs as visual reference, not product authority

## Suggested First UI Implementation Slice

Use the Figma V1 visual style to improve existing placeholder pages only:

- `/`
- `/contests`
- `/leaderboard`
- `/wallet`
- `/profile`
- `/how-it-works`
- `/auth`

Definition of done:

- Existing routes render with cleaner card-based placeholder UI
- Bottom nav remains Contests, Leaderboard, Wallet, Profile
- No new business logic is added
- No real wallet/payment/auth/scoring behavior is implemented
- `npm run typecheck` passes
- `npm run test` passes

## Replit Prompt Starter

```text
You are working in the existing GitHub repo parkerhlevy/pickrank-app.

Read:
- docs/agent-handoff.md
- docs/design/figma-v1.md
- spec/product_spec.md
- tests/unit/routes.test.ts

Task:
Use docs/design/figma-v1.md as visual inspiration to improve the existing placeholder UI for the current routes only.

Do not rewrite the app.
Do not introduce a new framework.
Do not implement auth, payments, wallet ledger logic, scoring, contest lifecycle logic, database behavior, or admin tooling.
Do not treat the Figma design as product authority when it conflicts with /spec.

Definition of done:
- Existing routes render cleanly with mobile-first card-based UI
- Bottom nav remains Contests, Leaderboard, Wallet, Profile
- Copy stays aligned with /spec
- npm run typecheck passes
- npm run test passes
- No generated files are committed
```
