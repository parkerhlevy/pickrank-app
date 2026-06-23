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
| App shell | Mobile-first app frame, clear page headers, restrained sports-tech tone, persistent bottom navigation. | Bottom nav should not expose admin routes. Keep current primary app routes aligned with repo docs. | Bottom nav is decided for now: Home, Contests, Leaderboard, Profile. Wallet remains a secondary route under Profile. Make How It Works highly accessible from major pages instead of the bottom nav. |
| Contest cards | Strong card hierarchy, status badge, lock time, entry count, entry fee, prize pool or site-credit placeholder, primary CTA. | Avoid sportsbook-style emphasis, risk language, guaranteed-win framing, or unsupported contest states. Contest status must follow the repo lifecycle states. | Exact balance between light Figma treatment and darker Lovable energy remains a visual-direction decision. Recommended default is hybrid restraint. |
| Contest detail | Back affordance, title/status area, stat row, entry fee, projected payouts, scoring summary, minimum entries, sticky CTA. | CTA logic must follow auth, eligibility, entry, and contest state rules. Do not skip payment review or imply entry exists before payment succeeds. | Whether to show projected payout values in early placeholder screens should be reviewed if it makes the UI feel like real-money production behavior. |
| Lineup builder | Progress card, helper copy, ranked section, available-player section, sticky save area, disabled state before required picks are complete. | MVP is a 15-QB slate where users select and rank 10 QBs. Use `Save Lineup`, not `Review & Submit Entry`, unless the spec changes. Do not implement localStorage persistence as production behavior. | Final drag/drop interaction details can wait until lineup builder implementation, but the visual structure can be prototyped. |
| Leaderboard | Podium idea, ranking rows, contest summary card, readable point display. | MVP should not show live scoring or partial totals until lifecycle and scoring systems exist. Use final-only or placeholder treatment. Tie behavior must follow `/spec`. | How much podium styling to use in the placeholder route is a design choice. Keep it restrained enough to avoid implying final scoring is implemented. |
| Wallet | Balance card, site-credit explanation, compliance-aware disclaimer, simple summary rows. | Do not implement deposits, withdrawals, wallet ledger logic, payment methods, or full transaction filtering from screenshots. Any Add Credits or Withdraw actions must be omitted, disabled, or clearly test-only until provider/compliance review. | Whether to include a withdrawal placeholder depends on the specific UI slice. If shown, use provider-incomplete copy from `spec/features/payment_wallet_ux.md`. |
| Profile | Account summary card, placeholder account rows, verification placeholder, support/settings grouping. | Do not imply real eligibility, KYC, or identity verification exists. Profile should auth-gate when appropriate. | Exact account-row labels can be chosen during UI implementation if they stay placeholder-safe. |
| How It Works | Strong educational screen structure, simple contest explanation, scoring summary, skill-based positioning. | Avoid betting/wagering language and legal claims. Use compliance-safe terms from `spec/features/compliance_eligibility_responsible_play.md`. Keep How It Works easy to reach from major pages even though it is not in bottom nav. | Placement details can be refined per screen, but bottom nav should not change for this pass. |
| Data and content | Generic, realistic placeholder examples are fine for visual testing. | Avoid real player names, team logos, trademarks, exact NFL data assumptions, or provider-backed financial values unless those decisions are reviewed. | Future data-provider decisions may allow real data, but that is outside this design-component pass. |

## Parker Review Change Packet

These notes come from Parker's review of the Figma V1 clickthrough. Apply them before regenerating designs or implementing UI components.

### Non-Negotiable Figma Corrections

These items were missed in a later Figma pass. Put them in the prompt as hard requirements, not optional guidance.

| Do Not Show | Show Instead | Why |
|---|---|---|
| `87/100 entries`, `42/100`, progress bars, capacity meters, or any fixed contest cap. | `87 entries`, `42 entries`, or `Minimum 4 entries to run`. | PickRank contests are not capped at 100 entries unless a future spec explicitly adds a cap. |
| Payout rows past 3rd place on the individual Contest Details screen, such as `4th-5th`, `6th-10th`, or any deep payout ladder. | On Contest Details, show only three projected payout rows: `1st`, `2nd`, `3rd`. | MVP payout structure pays only the top 3 places. This correction must be made on the individual contest information page, not only the Leaderboard tab. |
| Generic `credits` for entry fee, prize pool, or payouts. | Dollar values for entry fee, prize pool, projected payouts, and winnings. | Credits make real-money contest economics unclear. |
| `Live` badge for contests that users can still enter. | `Open`, `Locks soon`, or a lifecycle-accurate status. | `Live` implies post-lock/live scoring behavior that is not implemented. |

### Global Copy And Terminology

| Issue | Direction | Bucket |
|---|---|---|
| General screens overuse NFL-specific language. | Generalize broad product copy to `sports`, `ranking contests`, `slates`, or `PickRank contests`. Keep NFL/QB language only when the specific contest is NFL-specific. | Correct |
| The UI mixes `contest`, `slate`, `picks`, and `rankings` loosely. | Use `Contest` for the paid competition users enter. Use `Slate` for the group of players/items being ranked. Use `Lineup` or `Rankings` for the user's saved ordered list. Avoid using these terms interchangeably. | Correct |
| `Rank Your Picks` feels generic. | Prefer `Build Your Lineup` for the lineup-building screen. Keep `Rank the Slate` documented as backup language for explanatory copy. | Correct |
| `Win Prizes` implies vague non-money rewards. | Prefer clearer language such as `Compete for the prize pool`, `Climb the leaderboard`, or `See final results`, depending on the screen. | Correct |
| Status copy uses `Live` for contests that are merely available or open. | Avoid `Live` unless the contest is truly in a live/post-lock state and the product supports that display. Prefer `Open`, `Available`, `Locks soon`, or `Final`, based on lifecycle state. | Correct |
| Timing copy says `Results in x days` before lock. | Use `Locks in x days` or a specific lock timestamp before lock. `Results in` should not appear until a results/final state is relevant. | Correct |
| Lock/deadline times do not clarify timezone. | Show a timezone or use user-localized copy, such as `Locks Nov 24, 1:00 PM ET` or `Locks Nov 24, 10:00 AM PT`. | Correct / Decision needed |

### Money And Wallet Language

| Issue | Direction | Bucket |
|---|---|---|
| The UI uses generic `credits` for wallet value, entry fees, and payouts. | Do not use generic `credits` as the broad money term. Use dollars for entry fees, prize pools, projected payouts, and winnings. | Correct |
| Wallet language does not distinguish withdrawable and non-withdrawable value. | Use `Cash Balance` for withdrawable winnings. Use `Site Credit` only for non-withdrawable value such as promotional credit or canceled-contest refunds. | Correct |
| Prize rows show credit payouts. | Show projected dollar payouts for 1st, 2nd, and 3rd, or clearly mark values as placeholder/demo. Do not label paid contest payouts as generic credits. | Correct |
| Mockups need fake balances before real money flows exist. | Use `Demo balance`, `Placeholder balance`, or placeholder dollar values for design-only screens. Do not imply provider-backed wallet behavior exists. | Correct |

Recommended terms:

| Use For | Preferred Copy |
|---|---|
| Contest entry cost | `Entry Fee: $5` |
| Contest prize total | `Prize Pool: $2,000` |
| Payout preview | `Projected Payouts` |
| Withdrawable wallet value | `Cash Balance` |
| Non-withdrawable credit | `Site Credit` |
| Internal/demo state | `Demo balance` or clearly placeholder dollar values |

### Home / Active Contests

| Issue | Direction | Bucket |
|---|---|---|
| Hero copy says `Test your NFL knowledge...` on a broad home surface. | Generalize the hero to PickRank/sports/ranking-contest language. Keep specific NFL language inside NFL contest cards. | Correct |
| Section label says `Active Contests`. | Use `Open Contests` for now. Keep `Available Slates` and `Upcoming Slates` as backup labels if future product terminology shifts. Do not use `Live` for enterable pre-lock contests. | Correct |
| Contest card badge says `Live`. | Use `Open`, `Available`, `Locks soon`, or another lifecycle-accurate badge before lock. | Correct |
| Contest card says `Results in 2 days`. | Replace with `Locks in 2 days` or exact lock time with timezone. | Correct |
| CTA says `View Standings` on pre-lock contest cards. | Prefer `View Contest` or `Enter Contest` before lock. Avoid implying live standings exist. | Correct |
| Stat card says `Total Winnings`. | Avoid real account-history implications unless it is clearly demo/placeholder. Consider removing from early home UI or replacing with a safer placeholder metric. | Visual only / Correct |

### How It Works

| Issue | Direction | Bucket |
|---|---|---|
| Intro copy is NFL-specific. | Use broader product language on the educational surface. Example direction: `PickRank is a skill-based ranking contest where you rank a slate by a specific stat category.` | Correct |
| Ranking step says `Rank Your Picks`. | Prefer `Rank the Slate` if this becomes the product term. | Correct |
| Prize step says `Win Prizes`. | Use more precise copy such as `Compete for the prize pool` or `See final results`. | Correct |

### Contest Details

| Issue | Direction | Bucket |
|---|---|---|
| Entry count appears capped, such as `87/100`. | Remove fixed capacity language unless the spec adds contest caps. Use `87 entries` or another open-ended entry count. | Correct |
| Deadline timestamp lacks timezone clarity. | Show explicit timezone or user-localized lock time. | Correct / Decision needed |
| Copy says `rank 10` without clarifying top 10. | Say users select/rank their `top 10` from the available slate. | Correct |
| About/rules copy says `expected performance` generically. | Always name the actual stat category the contest is based on, such as `passing yards`. | Correct |
| Rules list uses broad stat examples like `passing yards, TDs, completion %, etc.` | Replace with the single contest stat for the active contest. Do not imply multi-stat scoring when the contest is one-stat based. | Correct |
| Tie copy says `Ties broken by earliest submission time`. | Replace with the repo's differential-scoring tiebreaker language. Do not use earliest submission time unless the spec is updated to say that. | Correct |
| Prize structure on the individual contest information page shows rows beyond 3rd place. | Contest Details payout display should show only 1st, 2nd, and 3rd. Remove 4th-5th and 6th-10th rows from the individual Contest Details page, not only from Leaderboard. | Correct |
| Prize values look fixed. | Treat prize amounts as projected/dynamic based on entry count and prize pool. | Correct |
| CTA says `Enter Contest - 50 credits`. | Use dollar entry fee language and route through payment review. Do not imply direct entry creation from the detail CTA. | Correct |

### Make Your Picks / Lineup Builder

| Issue | Direction | Bucket |
|---|---|---|
| Interaction copy says users drag players from the available list into rankings. | Current intended interaction is selecting/clicking players from the available list to add them to the slate, then dragging selected players up or down to reorder. | Correct |
| CTA says `Review & Submit Entry`. | Replace with `Save Lineup`. Entry/payment should already be handled before this screen. | Correct |
| Instruction panel is useful but generic. | Keep an instruction/helper panel and include the contest-specific criterion, such as `Rank the top 10 quarterbacks by passing yards.` | Keep / Correct |
| Screen title says `Make Your Picks`. | Use `Build Your Lineup`. Keep `Rank the Slate` as backup language for explanatory or educational copy. | Correct |
| Progress says `0/10 selected`. | Use clear progress language such as `0/10 ranked` or `0/10 selected`, and keep it tied to the top-10 requirement. | Keep |
| Available list uses real player names and real matchup-style text. | Replace real names, teams, logos, and schedule assumptions with generic/mock data unless data-provider and rights decisions are reviewed. | Correct |

## Component Brief For First UI Pass

### App Shell And Bottom Navigation

Allowed:

- Mobile-first layout with a narrow readable content column.
- Bottom navigation using the current app routes from `docs/agent-handoff.md`: Home, Contests, Leaderboard, Profile.
- Soft active states and simple icons if already supported by the app stack.

Forbidden:

- Admin routes in the primary nav.
- New routing architecture.
- Navigation labels that imply sportsbook behavior.

Decision note:

- Bottom nav remains Home, Contests, Leaderboard, Profile for this pass.
- Do not swap Profile or Home out for How It Works.
- Make How It Works highly accessible from major pages through links, help affordances, or contextual CTAs.

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
- Projected payout summary on Contest Details must show only 1st, 2nd, and 3rd.
- Sticky CTA as a visual pattern.
- Placeholder payment-review entry point without real payment behavior.

Forbidden:

- Skipping the payment review step.
- Showing a user as entered before payment succeeds.
- Showing Contest Details payout rows beyond 3rd place.
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
- How It Works access point from major pages
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
- HARD REQUIREMENT: Do not show entry counts as capped values. Never show 87/100, 42/100, progress bars toward 100, capacity meters, or any fixed max-entry cap unless a future spec explicitly adds a cap. Use plain entry counts such as 87 entries.
- HARD REQUIREMENT: On the individual Contest Details screen, projected payouts must show only 1st, 2nd, and 3rd. Never show 4th-5th, 6th-10th, or any payout rows beyond 3rd place on the individual contest information page. Do not only fix this in the Leaderboard tab.
- Treat this as visual design only, not product authority.
- Do not invent scoring rules, payout rules, wallet rules, eligibility rules, contest lifecycle rules, or payment behavior.
- Do not add sportsbook language: no bet, wager, odds, parlay, gambling, risk-free, or guaranteed profit.
- Do not use High Roller language.
- Do not show real-money deposits, functional withdrawals, payment methods, wallet ledger history, or provider integrations.
- Do not show live scoring or partial leaderboard totals.
- Do not use real NFL team logos, trademarks, or production player data.
- Use generic but realistic placeholder data where needed.
- Do not use generic credits as the broad money term.
- Use dollars for entry fees, prize pools, projected payouts, and winnings.
- Use Cash Balance for withdrawable wallet value.
- Use Site Credit only for non-withdrawable promotional credit or canceled-contest refunds.
- For lineup screens, show a 15-QB slate where the user ranks/selects 10 QBs.
- Use Save Lineup for lineup saving.
- Use Build Your Lineup as the lineup screen title.
- Use Open Contests as the main home/contest-list section label.
- Keep Available Slates and Upcoming Slates as backup labels only.
- For lineup screens, users select players from the available list, then reorder selected rankings by dragging.
- Show the contest-specific stat criterion on the lineup and contest detail screens.
- Use only 1st, 2nd, and 3rd in projected payout displays.
- Show lock times with timezone clarity.
- Make questionable product behavior visibly placeholder-only or omit it.

Bottom navigation for the current implementation should remain:
- Home
- Contests
- Leaderboard
- Profile

Do not replace Home or Profile with How It Works in the bottom navigation. Wallet should remain available through Profile and its secondary route. How It Works should remain highly accessible from major pages through links, help affordances, or contextual CTAs.

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
