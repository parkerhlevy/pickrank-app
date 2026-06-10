# Figma Screenshot Audit And Component Brief

## Purpose

Use this file to audit Figma and Lovable screenshots before turning them into PickRank UI components.

The screenshots are visual reference only. Product behavior, copy constraints, wallet rules, scoring, contest lifecycle, and implementation priorities remain governed by:

- `docs/agent-handoff.md`
- `docs/design/figma-v1.md`
- `spec/product_spec.md`
- relevant files under `spec/features/`

## Audit Rules

Every screenshot detail should be placed in one of these buckets before implementation:

| Bucket | Meaning | Implementation Rule |
|---|---|---|
| Keep | Visual pattern fits PickRank and does not imply unsupported behavior. | Safe to use as visual direction for placeholder UI. |
| Correct | Detail conflicts with repo specs or implies behavior that is not implemented. | Replace with spec-aligned content before design or code work. |
| Decision needed | Direction may be useful, but Parker or repo specs have not locked it. | Do not implement until the decision is made and documented. |

When a screenshot combines a good layout with incorrect product behavior, keep the layout idea and correct the product detail.

## Screenshot Audit Matrix

| Area | Keep | Correct | Decision needed |
|---|---|---|---|
| App shell | Mobile-first app frame, clear page headers, restrained sports-tech tone, persistent bottom navigation. | Bottom nav should not expose admin routes. Keep current primary app routes aligned with repo docs. | Current repo docs conflict on whether `How It Works` belongs in bottom nav. `docs/agent-handoff.md` says current nav is Contests, Leaderboard, Wallet, Profile; `spec/features/frontend_navigation.md` says MVP nav is Contests, Leaderboard, How It Works, Profile. |
| Contest cards | Strong card hierarchy, status badge, lock time, entry count, entry fee, prize pool or site-credit placeholder, primary CTA. | Avoid sportsbook-style emphasis, risk language, guaranteed-win framing, or unsupported contest states. Contest status must follow the repo lifecycle states. | Exact balance between light Figma treatment and darker Lovable energy remains a visual-direction decision. Recommended default is hybrid restraint. |
| Contest detail | Back affordance, title/status area, stat row, entry fee, projected payouts, scoring summary, minimum entries, sticky CTA. | CTA logic must follow auth, eligibility, entry, and contest state rules. Do not skip payment review or imply entry exists before payment succeeds. | Whether to show projected payout values in early placeholder screens should be reviewed if it makes the UI feel like real-money production behavior. |
| Lineup builder | Progress card, helper copy, ranked section, available-player section, sticky save area, disabled state before required picks are complete. | MVP is a 15-QB slate where users select and rank 10 QBs. Use `Save Lineup`, not `Review & Submit Entry`, unless the spec changes. Do not implement localStorage persistence as production behavior. | Final drag/drop interaction details can wait until lineup builder implementation, but the visual structure can be prototyped. |
| Leaderboard | Podium idea, ranking rows, contest summary card, readable point display. | MVP should not show live scoring or partial totals until lifecycle and scoring systems exist. Use final-only or placeholder treatment. Tie behavior must follow `/spec`. | How much podium styling to use in the placeholder route is a design choice. Keep it restrained enough to avoid implying final scoring is implemented. |
| Wallet | Balance card, site-credit explanation, compliance-aware disclaimer, simple summary rows. | Do not implement deposits, withdrawals, wallet ledger logic, payment methods, or full transaction filtering from screenshots. Any Add Credits or Withdraw actions must be omitted, disabled, or clearly test-only until provider/compliance review. | Whether to include a withdrawal placeholder depends on the specific UI slice. If shown, use provider-incomplete copy from `spec/features/payment_wallet_ux.md`. |
| Profile | Account summary card, placeholder account rows, verification placeholder, support/settings grouping. | Do not imply real eligibility, KYC, or identity verification exists. Profile should auth-gate when appropriate. | Exact account-row labels can be chosen during UI implementation if they stay placeholder-safe. |
| How It Works | Strong educational screen structure, simple contest explanation, scoring summary, skill-based positioning. | Avoid betting/wagering language and legal claims. Use compliance-safe terms from `spec/features/compliance_eligibility_responsible_play.md`. | If nav remains Wallet instead of How It Works for the current phase, How It Works can stay as a route outside bottom nav. |
| Data and content | Generic, realistic placeholder examples are fine for visual testing. | Avoid real player names, team logos, trademarks, exact NFL data assumptions, or provider-backed financial values unless those decisions are reviewed. | Future data-provider decisions may allow real data, but that is outside this design-component pass. |

## Component Brief For First UI Pass

### App Shell And Bottom Navigation

Allowed:

- Mobile-first layout with a narrow readable content column.
- Bottom navigation using the current app routes from `docs/agent-handoff.md`: Contests, Leaderboard, Wallet, Profile.
- Soft active states and simple icons if already supported by the app stack.

Forbidden:

- Admin routes in the primary nav.
- New routing architecture.
- Navigation labels that imply sportsbook behavior.

Decision note:

- Resolve the Wallet vs How It Works bottom-nav conflict before a larger MVP navigation pass. Until then, preserve the currently implemented nav.

### Contest Cards

Allowed:

- Featured contest card and supporting contest cards.
- Status badges using spec lifecycle terms such as scheduled, open, locked, final, canceled.
- Entry fee, lock time, entry count, minimum entries, and prize pool placeholder.
- CTA labels such as `Enter Contest`, `View Contest`, or `Edit Lineup` when state-appropriate.

Forbidden:

- `High Roller`, odds, bet, wager, parlay, risk-free, guaranteed profit, or sportsbook-style framing.
- Behavior that creates entries, payments, scoring, or backend state.

### Contest Detail Layout

Allowed:

- Public overview layout with contest title, stat category, slate size, entry fee, prize pool, entry count, projected payouts, scoring summary, and minimum entries.
- Sticky CTA as a visual pattern.
- Placeholder payment-review entry point without real payment behavior.

Forbidden:

- Skipping the payment review step.
- Showing a user as entered before payment succeeds.
- Changing payout, platform fee, contest viability, or lifecycle rules.

### Leaderboard Placeholder

Allowed:

- Final-results placeholder, empty state, or demo visual labeled as placeholder.
- Podium-inspired layout for final-only leaderboard direction.
- Point display examples that do not claim to be live production results.

Forbidden:

- Live scoring, partial totals, live rank changes, or `in prize now` behavior before scoring/lifecycle systems exist.
- Tie handling that differs from `/spec`.

### Wallet Balance And Disclaimer Cards

Allowed:

- Cash balance and site-credit display as placeholder UI.
- Clear site-credit explanation.
- Provider-incomplete withdrawal placeholder only if copy makes the test status clear.

Forbidden:

- Functional Add Credits, Withdraw, deposits, payment methods, wallet ledger history, or provider integrations.
- Copy implying site credit can be withdrawn.

### Profile Placeholder Sections

Allowed:

- Logged-out auth gate placeholder.
- User summary placeholder.
- Account details, eligibility status placeholder, support/settings rows.

Forbidden:

- Real KYC, identity verification, age verification, jurisdiction checking, or account restriction logic.
- Copy that says the user is verified unless that is clearly placeholder/test data.

### Pick Builder Visual Structure

Allowed:

- Progress card for 10 required ranked picks.
- Instruction card for ranking QBs by passing yards.
- Ranked selections section.
- Available players section.
- Sticky `Save Lineup` action area.

Forbidden:

- Production drag/drop behavior unless implemented in the lineup-builder slice.
- `Review & Submit Entry` copy for lineup saving.
- Real NFL/player data assumptions.
- localStorage as the production persistence model.

## Figma Regeneration Prompt

Use this prompt for the next Figma Make or design-generation pass after screenshots are audited:

```text
Design PickRank mobile-first app screens using the existing repo specs as product authority.

PickRank is a skill-based NFL prediction contest app. It is not a sportsbook.

Read and follow these source-of-truth docs:
- docs/agent-handoff.md
- docs/design/figma-v1.md
- docs/design/figma-screenshot-audit.md
- spec/product_spec.md

Use the hybrid visual direction:
- light, approachable Figma restraint
- Lovable-style structure and contest-card hierarchy
- sports-tech energy without casino or sportsbook styling
- blue primary actions, soft cards, clear badges, readable mobile layout

Allowed routes for this design pass:
- /
- /contests
- /contests/[contestId]
- /leaderboard
- /wallet
- /profile
- /how-it-works
- /auth

Design these reusable components:
- app shell and bottom navigation
- contest card
- contest detail summary
- projected payout summary
- scoring summary
- leaderboard placeholder/final-results layout
- wallet balance card
- site-credit disclaimer card
- profile placeholder sections
- pick-builder visual structure

Important product constraints:
- Treat this as visual design only, not product authority.
- Do not invent scoring rules, payout rules, wallet rules, eligibility rules, contest lifecycle rules, or payment behavior.
- Do not add sportsbook language: no bet, wager, odds, parlay, gambling, risk-free, or guaranteed profit.
- Do not use High Roller language.
- Do not show real-money deposits, functional withdrawals, payment methods, wallet ledger history, or provider integrations.
- Do not show live scoring or partial leaderboard totals.
- Do not use real NFL team logos, trademarks, or production player data.
- Use generic but realistic placeholder data where needed.
- For lineup screens, show a 15-QB slate where the user ranks/selects 10 QBs.
- Use Save Lineup for lineup saving.
- Make questionable product behavior visibly placeholder-only or omit it.

Bottom navigation for the current implementation should remain:
- Contests
- Leaderboard
- Wallet
- Profile

How It Works can exist as a separate route/screen unless the repo navigation decision is updated.

Screens should be implementation-ready for a Next.js + Tailwind + shadcn-style component pass, but should not require new frameworks or backend behavior.
```

## Acceptance Checklist

Before implementing from any screenshot or generated design:

- Every questionable element has a bucket: Keep, Correct, or Decision needed.
- Product behavior matches `/spec`, not the generated screenshot.
- Copy avoids betting/sportsbook language.
- Wallet/payment/withdrawal behavior remains placeholder-safe.
- Leaderboard does not imply live scoring.
- Lineup builder uses 15 available QBs and 10 ranked selections.
- Real player/team data is replaced with generic placeholder data unless reviewed.
- The implementation scope remains current placeholder routes and reusable visual components.
