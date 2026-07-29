# External Skills PickRank Design Audit

Date: 2026-07-29

## Purpose

This note translates Emil Kowalski's and Jakub Krehel's public design-skill repos into a PickRank-specific audit and implementation queue. It is an implementation planning artifact, not a product spec. Product behavior remains governed by `docs/agent-handoff.md`, `spec/product_spec.md`, the relevant `spec/features/` files, and `docs/design/DESIGN.md`.

## External Sources

| Source | URL | Snapshot |
| --- | --- | --- |
| Emil Kowalski skills | https://github.com/emilkowalski/skills | `70744e3816f1d93eafb697161a8b880a7384c5ff` from `git ls-remote` on 2026-07-29 |
| Jakub Krehel skills | https://github.com/jakubkrehel/skills | `79a09456be60419e652e63fc9e057b5587d051ea` from `git ls-remote` on 2026-07-29 |

Skills used as source material:

- Emil: `improve-animations`, `find-animation-opportunities`, `review-animations`, `emil-design-eng`, `apple-design`.
- Jakub: `better-interface`, `better-accessibility`, `better-layout`, `better-writing`, `better-typography`, `better-colors`, `better-ui`.

The skills were not installed, copied, or vendored into the repo.

## PickRank Rubric

| Domain | PickRank application |
| --- | --- |
| Accessibility | Keyboard paths, visible focus, native controls, usable disabled states, form labels and errors, hit targets, reduced motion. |
| Layout | Mobile-first grouping, route hierarchy, sticky bottom navigation clearance, responsive stress, scannable contest and lineup rows. |
| Writing | Locked PickRank terms, direct button labels, clear empty/error states, compliance-safe copy, no betting or casino cues. |
| Typography | Heading hierarchy, line length, wrapping, tabular numeric values, mobile input sizing. |
| Color | Semantic state colors, contrast on status and notice panels, no decorative sportsbook color language. |
| UI polish | Consistent radius, shadow as elevation, border as structure, icon sizing, active feedback, card density. |
| Motion | Purposeful, low-frequency, interruptible motion only. CSS transitions before new dependencies. Honor reduced motion. |

Priority formula:

```text
priority = user impact + route reach + shared-component leverage + PickRank fit - implementation risk - behavior/compliance risk
```

Severity:

- `P0`: blocks task completion, accessibility, eligibility/payment clarity, or game-flow comprehension.
- `P1`: improves repeated product feel across shared components or the contest loop.
- `P2`: isolated polish with limited reach.

## Coverage

Inspected source and route coverage:

- Public: `/`, `/contests`, `/contests/[contestId]`, `/how-it-works`.
- Account/wallet: `/auth`, `/profile`, `/wallet`.
- Game flow: `/contests/[contestId]/payment`, `/success`, `/lineup`, `/results`, `/leaderboard?contest=week-1-qb-passing-yards`.
- Admin/internal: `/admin`, `/admin/contests`, `/admin/eligibility`.
- Shared components: `Button`, `Card`, `Notice`, `BottomNav`, `ContestBoardPreview`, `LineupBuilderClient`, `WaitlistForm`.
- States inspected from code and tests: logged out, pending eligibility, internal-test eligible, empty/placeholder, disabled action, saved lineup, unsaved lineup, final results, desktop and mobile classes.

Runtime visual review was not completed in the audit step. Browser verification is tracked in the implementation verification results for each shipped slice.

## Ranked Findings

| Rank | Severity | Domain | Location | Finding | Recommendation | Status |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | P1 | Accessibility | `components/contests/lineup-builder-client.tsx` | Ranked lineup reordering was pointer-first. The drag handle had an accessible name, but keyboard users did not have an explicit move-up or move-down path. | Add icon buttons for moving a ranked player up or down one slot while preserving the existing pointer drag path. | Implemented in this slice. |
| 2 | P1 | Accessibility | `app/globals.css`, shared buttons and forms | Focus treatment was mostly local border changes, and several controls used `outline-none` without a consistent shared replacement. | Add a shared `:focus-visible` perimeter and reinforce form/button focus rings. | Implemented in this slice. |
| 3 | P1 | Motion/accessibility | `app/globals.css`, `components/ui/button.tsx` | Existing transitions were subtle and mostly appropriate, but there was no global reduced-motion safety net for future motion work. | Add reduced-motion handling and explicit shared motion tokens. Do not add a motion dependency. | Implemented in this slice. |
| 4 | P1 | Accessibility | `components/contests/lineup-builder-client.tsx` | Unsaved-change interception used a visual modal without dialog semantics or Escape handling. | Add `role="dialog"`, `aria-modal`, labels, initial focus, and Escape close. | Implemented in this slice. |
| 5 | P1 | Interaction stability | `components/contests/lineup-builder-client.tsx` | Local lineup state synced from server props by object reference during render, which could reset client-side reorder attempts. | Sync from server state with a content-keyed effect so local edits persist unless the actual initial state changes. | Implemented in this slice. |
| 6 | P2 | Layout/UI polish | `components/contests/lineup-builder-client.tsx` | Mobile lineup row controls could become dense once keyboard controls are added. | Keep controls as icon buttons in a compact two-column cluster and preserve 44px targets. | Implemented in this slice. |
| 7 | P2 | Typography/writing | Public and account routes | The page copy is already aligned to locked PickRank terminology, but a future pass can tighten long helper copy after visual review. | Defer to a route-specific public conversion pass with screenshots. | Deferred. |
| 8 | P2 | Color | `app/globals.css` | The repo still uses HSL tokens. The external color guidance favors OKLCH when designing a new color system, but also says to preserve existing systems unless migration is intentional. | Do not migrate color notation in this slice. Revisit only as a deliberate design-system migration. | Rejected for this slice. |
| 9 | P2 | Motion | Page entrances and route transitions | Broad page choreography would be visible on frequent app surfaces and risks making PickRank feel theatrical. | Do not add page-load choreography. Reserve motion for feedback and rare state changes. | Rejected for this slice. |

## Implementation Summary

This slice implemented the first shared/game-flow improvements:

- Added shared focus-visible and reduced-motion primitives in `app/globals.css`.
- Tightened shared button transition/focus behavior without changing variants, routes, or dependencies.
- Added an accessible primary-navigation label to `BottomNav`.
- Improved waitlist form focus behavior and pending state semantics while preserving email-only capture.
- Added keyboard move-up and move-down controls to `Build Your Lineup`.
- Stabilized lineup client-state sync so local reorder edits are not reset by reference-only prop comparison.
- Added dialog semantics, initial focus, and Escape close to the unsaved-lineup modal.
- Added `127.0.0.1` to Next dev allowed origins so local Playwright browser checks can hydrate client controls reliably.

## Verification

- `npm run typecheck` passed.
- Focused ESLint passed for the touched TypeScript and TSX files. `app/globals.css` produced the existing ignored-file warning because the repo ESLint config does not target CSS.
- `npm run test` passed: 35 files, 189 tests.
- `npx playwright test tests/e2e/homepage.spec.ts` passed: 5 tests.
- `npx playwright test tests/e2e/lineup-builder.spec.ts --workers=1` passed: 8 tests.
- `npx playwright test tests/e2e/final-results.spec.ts --workers=1` passed: 4 tests.
- `npx playwright test tests/e2e/admin-shell.spec.ts --workers=1` passed: 2 tests.

Playwright browser suites required running outside the sandbox because the local Next dev server cannot bind to `0.0.0.0:3000` inside the managed sandbox.

## Deferred Queue

Recommended next design slices if the design lane stays open:

1. Public conversion pass: homepage, waitlist, contest lobby, contest detail, and How It Works screenshots at mobile and desktop sizes.
2. Account surface pass: `/auth`, `/profile`, and `/wallet` copy density, focus order, and disabled-action clarity.
3. Admin/internal pass: `/admin/contests` and `/admin/eligibility` density and keyboard review, after current operator priorities are stable.
4. Optional color-system study: compare current HSL tokens against contrast needs before considering any OKLCH migration.

## Boundaries

- No new animation or UI dependencies.
- No payment, wallet, payout, eligibility, scoring, admin mutation, provider, or lifecycle behavior changes.
- No vendoring of external skills.
- `next-env.d.ts` remains generated noise unless a future slice proves otherwise.
