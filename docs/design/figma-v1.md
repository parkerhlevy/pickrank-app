# Figma V1 UI Direction

## Source

Figma Make concept link:

https://www.figma.com/make/uuqdTXPfoEWENwMhLR8B0x/PickRank?t=KW7uvLCiM1JqPsdJ-1

Lovable concept reference:

Parker also reviewed a Lovable-generated concept from the same ChatGPT project context. The Lovable screens are a second visual reference, not product authority.

This document captures early UI directions for PickRank. These screens are visual reference only. Product rules, scoring, contest lifecycle, wallet behavior, payment rules, compliance, and implementation priorities remain governed by `/spec` and `docs/agent-handoff.md`.

## Purpose

Use this direction to guide the first Replit/Codex/engineering UI pass for the existing Next.js app.

Before implementing from screenshots or regenerating designs, use:

```text
docs/design/figma-screenshot-audit.md
```

That audit file is the working checklist for separating useful visual direction from product-rule conflicts and invented details.

The designs should help establish:

- Mobile-first layout direction
- Card and badge styling
- Bottom navigation pattern
- Contest card hierarchy
- Leaderboard/podium treatment
- Wallet/site-credit visual style
- Pick builder interaction direction
- Formal visual direction choice across light, dark, or hybrid treatments

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

Additional screenshots reviewed from Parker:

- Home / active contests
- Contest Details
- Make Your Picks
- Leaderboard
- Wallet

The Lovable concept included these visible screens:

1. Contest lobby
2. Contest detail
3. Leaderboards list
4. How It Works
5. Profile

## Visual References

### Figma V1

The Figma direction is lighter, safer, and more approachable.

Keep from Figma:

- light mobile-first shell
- blue primary action color
- wallet disclaimer treatment
- soft card and badge patterns
- leaderboard/podium idea
- compliance-conscious placeholder copy

### Lovable V1

The Lovable direction is darker, more premium, and more energetic.

Keep from Lovable:

- stronger contest card hierarchy
- clearer contest detail structure
- payout and scoring summary placement
- strong How It Works screen
- Profile empty states and coming-soon account rows
- polished sports-contest energy

Use Lovable carefully because the dark green/black treatment, large prize-pool emphasis, and terms like `High Roller` can drift toward sportsbook or casino vibes.

## Visual Direction To-Do

Before a major UI pass, choose a formal visual direction:

1. Light Figma-inspired direction
2. Dark Lovable-inspired direction
3. Hybrid direction: Lovable structure and energy with Figma restraint and compliance-safe tone

Recommended default for now: hybrid direction.

Do not treat either mockup as final design authority until this decision is made.

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

## Discrepancy Log

The Figma Make output was created from earlier ChatGPT project files. Use it as visual context, but track discrepancies here so implementation does not accidentally override the repo specs.

Status meanings:

- `Use spec`: implement the repo/spec version.
- `Visual only`: keep the look and layout idea, but not the underlying behavior.
- `Needs decision`: do not implement until Parker explicitly decides.

### Slate Size

Some Figma screens reference:

```text
0/10 selected
3/10 selected
Your Top 10
Rank the top 10 quarterbacks
```

Status: `Use spec`.

The current MVP spec is based on a 15-quarterback slate where users select and rank their top 10. Implementation should show 15 available QBs and require 10 ranked selections.

### Entry Language

The Figma output uses:

```text
Review & Submit Entry
```

Status: `Use spec`.

The project has preferred `Save Lineup` language for the lineup builder to avoid implying a user-controlled permanent lock before the deadline. Use `Save Lineup` unless the relevant spec changes.

### Lineup Interaction

The screenshots show a select/add style pick builder with available players moving into rankings.

Status: `Use spec`.

The current MVP direction is selecting and drag-reordering 10 ranked QBs from a 15-QB slate. The visual progress card, helper copy, ranked list, available-player cards, and sticky action area can inspire layout, but the actual lineup behavior should follow `/spec`.

### Player/Team Data

The Figma output uses real player names and city/team references. For implementation and screenshots, prefer mock or generic data unless the data model intentionally supports real NFL/player data and rights considerations have been reviewed.

Status: `Visual only`.

Use realistic-looking placeholder data only where needed. Avoid real logos, trademarks, or production player-data assumptions until data/provider decisions are reviewed.

### Wallet Actions

The Figma output shows Add Credits and Withdraw. These can remain placeholders, but do not implement deposits, withdrawals, payment processing, or real-money flows until compliance/payment review is complete.

Status: `Visual only`.

The wallet layout and disclaimer card are useful. Add Credits and Withdraw must stay disabled, nonfunctional, or omitted until payments, withdrawals, wallet ledger behavior, and compliance are reviewed.

### Live Labels And Leaderboard

The screenshots use `Live` status badges and a live contest framing on leaderboard cards.

Status: `Visual only`.

Soft status badges are useful, but MVP must not show live scoring or partial totals. Leaderboard UI should remain placeholder/final-only until the contest lifecycle and scoring systems exist.

### Winnings And Prize Copy

The screenshots show total winnings, in-prize indicators, balance cards, and prize pool values.

Status: `Needs decision` for real values, `Visual only` for placeholder display.

Use placeholder copy carefully. Do not imply real cash withdrawals, guaranteed payouts, or completed wallet accounting until the relevant specs are implemented and reviewed.

### Home Screen Stats

The screenshots show stats such as contests entered, best rank, and total winnings.

Status: `Visual only`.

These can be used as static placeholder cards during the UI pass, but should not imply real account history or backend data exists.

### Dark Premium Sports-Gaming Styling

The Lovable concept uses a black/green premium sports-gaming look.

Status: `Needs decision`.

This may be useful for energy and perceived polish, but it risks feeling closer to sportsbook/casino products. If used, pair it with skill-based copy, restrained prize emphasis, and responsible-play language.

### High Roller Language

The Lovable concept includes `High Roller`.

Status: `Use spec`.

Avoid this language for MVP. It implies higher-risk play and can weaken the skill-contest positioning.

### Local Storage Demo Behavior

The Lovable output mentions state persisting in localStorage and a full mock flow.

Status: `Visual only`.

This is useful for prototyping, but production implementation should follow the repo roadmap and avoid treating localStorage as the real persistence plan.

### How It Works Priority

The Lovable concept gives How It Works a strong screen treatment.

Status: `Visual only`.

Use the structure as inspiration. This screen is important because it explains skill-based positioning, but copy should remain aligned with `/spec`.

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
- docs/design/figma-screenshot-audit.md
- spec/product_spec.md
- tests/unit/routes.test.ts

Task:
Use docs/design/figma-v1.md and docs/design/figma-screenshot-audit.md as visual inspiration to improve the existing placeholder UI for the current routes only.

Do not rewrite the app.
Do not introduce a new framework.
Do not implement auth, payments, wallet ledger logic, scoring, contest lifecycle logic, database behavior, or admin tooling.
Do not treat the Figma design as product authority when it conflicts with /spec.
Do not use sportsbook language such as bet, wager, odds, parlay, gambling, risk-free, or guaranteed profit.
Do not use real NFL logos, trademarks, or production player data unless the repo specs are updated to allow it.
Do not show live scoring or functional wallet actions.

Definition of done:
- Existing routes render cleanly with mobile-first card-based UI
- Bottom nav remains Contests, Leaderboard, Wallet, Profile
- Copy stays aligned with /spec
- npm run typecheck passes
- npm run test passes
- No generated files are committed
```
