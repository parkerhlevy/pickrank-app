# MVP Frontend Screen Map + Navigation Architecture

## Purpose
Define the MVP app screen map, navigation structure, screen access rules, user flows, and frontend state behavior for PickRank.

## Status
Locked for MVP direction.

## Anchor
MVP frontend uses bottom-tab navigation for Home, Contests, Leaderboard, and Profile, keeps Wallet nested under Profile, keeps How It Works highly accessible through secondary links, supports logged-out browsing, requires the account gates before entry, routes free beta users directly from persisted entry creation to lineup while preserving review/payment for future paid entry, separates lineup editing from results states, and exposes admin setup screens only internally.

---

## Summary
PickRank's MVP frontend should be simple, mobile-first, and state-driven.

The UI should reflect backend contest state rather than trying to infer state locally.

Future paid-contest journey:

```text
Lobby
→ Contest Detail
→ Entry Review
→ Entry Success
→ Lineup Builder
→ Saved Lineup / Locked Lineup
→ Final Results Reveal
→ Final Leaderboard
→ Profile / Wallet
```

Active Early Access Beta journey:

```text
Contest Detail
→ Enter free beta contest
→ Build Your Board
```

Implementation note: `/contests/:contest_id/payment` and `/contests/:contest_id/success` remain available as parked future paid-version surfaces. Free beta entry reuses the server-authoritative persisted-entry action and skips both routes after the required account gates pass.

---

## Navigation Model

MVP uses bottom navigation tabs:

```text
Home
Contests
Leaderboard
Profile
```

### Tab behavior

| Tab | Public? | Auth Required? | Notes |
|---|---:|---:|---|
| Home | Yes | No | Landing shell and high-level entry point |
| Contests | Yes | No | Logged-out users can browse |
| Leaderboard | Partial | No for public/final boards, auth for user-centered context | MVP final leaderboards only |
| Profile | No | Yes | Shows embedded Google and email account access if logged out |

How It Works remains a public education screen that should stay easy to reach from Home, Contests, Contest Detail, Wallet, and Auth, but it is not a bottom-nav tab in the current MVP shell.

---

## Screen Access Categories

### Public screens
Available without login:

- Contest Lobby
- Contest Detail / Overview
- How It Works
- Final Leaderboard, if contest is final and public

### Auth-required screens
Require logged-in user:

- Entry Review
- Entry Success
- Lineup Builder
- Saved Lineup Confirmation
- Locked Lineup View
- Results Reveal for user's own entry
- Profile
- Wallet Summary

### Eligibility-required screens/actions
Require account eligibility:

- Confirm paid entry
- External payment flow
- Withdraw cash balance

### Admin/internal screens
Internal only:

- Admin Contest List
- Admin Create Contest
- Admin Slate Builder
- Admin Contest Validation
- Admin Publish Preview

---

## Primary Screen Map

## 1. Contest Lobby

### Route

```text
/contests
```

### Purpose
Help users find the active weekly contest.

### Access
Public.

When a known PickRank page links to How It Works, include a sanitized contextual return target. Show `Return to {origin}` above the How It Works header for Home, Account access, Contests, Contest details, Board builder, Profile, Beta Pass, and Beta Rules. Reject unknown, external, query-bearing, or fragment-bearing return targets. Direct visits keep the page unchanged and do not show a return action.

### Displays

- featured contest
- other contests
- contest title
- lock time/countdown
- prize pool
- entry count
- entry fee
- contest status
- Enter Contest / View Contest CTA

### State rules

| Contest State | Lobby Display |
|---|---|
| scheduled | Opens soon / countdown |
| open | Active entry CTA |
| locked | Locked |
| live | Underway |
| finalizing | Results pending |
| final | Final results ready |
| paid_out | Final |
| canceled | Canceled |

### Empty state

```text
No contests are available right now.
Check back soon.
```

---

## 2. Contest Detail / Overview

### Route

```text
/contests/:contest_id
```

### Purpose
Explain contest rules, economics, timing, and entry state.

### Access
Public.

### Displays

- contest title
- stat category
- slate size
- lock time/countdown
- entry fee
- prize pool
- entry count
- projected payouts
- scoring summary
- minimum entries to run
- contest status
- CTA based on user/account/contest state

### CTA logic

| Condition | Primary CTA |
|---|---|
| logged out + contest open | Sign up / Log in to Enter |
| logged in + eligible + not entered + open | Enter Contest |
| logged in + already entered + open | Edit Lineup |
| contest locked/live | View Lineup |
| contest final/paid_out + user entered | View Results |
| contest final/paid_out + user not entered | View Leaderboard |
| contest canceled | Contest Canceled |

---

## 3. Auth Gate / Sign Up / Login

### Route

```text
/auth
```

### Purpose
Create account or log in before paid actions.

### Access
Public.

### Entry points

- Profile tab while logged out
- Enter Contest CTA while logged out
- Wallet/withdraw action while logged out

### Displays

- email auth method
- Google auth method
- protected-flow destination guidance when applicable
- email verification prompt after a link is requested

### Return behavior
After auth, resolve the next route from the authenticated Profile state:

- a complete returning Profile continues to the sanitized intended destination
- direct Profile sign-in defaults a complete returning Profile to Contests
- an incomplete Profile goes to one Profile setup form before the intended destination
- successful Profile completion resumes the intended destination

Example:

```text
Contest Detail → Auth / Profile completion → Contest Detail
```

---

## 4. Eligibility Gate

### Route / UI Pattern
Modal, sheet, or blocking state within Contest Detail / Payment Review.

### Purpose
Block paid entry if user is not eligible.

### Access
Authenticated.

### Displays by reason

| Reason | Copy |
|---|---|
| email unverified | Verify your email to enter contests. |
| unknown jurisdiction | Confirm your location to enter paid contests. |
| blocked jurisdiction | Paid contests are not available in your location at this time. |
| age not confirmed | Confirm you meet the age requirement to enter paid contests. |
| account restricted | Your account is restricted from entering contests. |
| self-exclusion active | Paid contest entry is currently disabled for your account. |

---

## 5. Entry Review

### Route / UI Pattern

```text
/contests/:contest_id/payment
```

or modal/sheet from Contest Detail.

Route name stays `/payment` in the current implementation. The active Early Access Beta path skips this route. If the parked free-entry surface is restored, label it `Entry Review` rather than `Payment Review`.

### Purpose
Show payment breakdown before entry creation.

During Early Access Beta, free contest entry skips this screen. Direct visits return to Contest Detail before entry or Build Your Board after a persisted entry exists. Keep this route for future paid contests.

### Access
Authenticated + eligible + contest open + not already entered.

### Displays

```text
Entry Fee:               $5.00
Site Credit Applied:    -$2.00
Cash Balance Applied:   -$1.00
Amount Due Today:        $2.00

[ Confirm Entry ]
```

### State rules

- If external amount due > 0, confirm triggers provider payment flow.
- If external amount due = 0, confirm completes wallet-funded entry.
- Backend must re-check contest state before payment capture.

### Failure states

- payment failed
- contest locked during payment
- duplicate entry detected
- eligibility changed
- network error

---

## 6. Entry Success

### Route / UI Pattern
Post-payment confirmation state.

### Purpose
Confirm entry and route to lineup builder.

During Early Access Beta, successful free entry routes directly to Build Your Board. Direct visits to this screen return to Contest Detail before entry or Build Your Board after a persisted entry exists. Keep this route for future paid contests.

### Displays

```text
✓ You're In

Your lineup has been created.
You can edit your rankings until lock.

[ Build Lineup ]
```

### Next action
CTA opens Lineup Builder.

---

## 7. Lineup Builder

### Route

```text
/entries/:entry_id/lineup
```

### Purpose
Core gameplay screen for ranking players.

### Access
Authenticated + entered + contest open.

### Displays

- contest title
- lock countdown
- ordered QB list
- rank numbers
- player display rows
- drag handle
- Save Lineup button
- first-time drag hint

### Interaction

- drag-to-reorder primary
- save/re-save freely until lock
- no partial lineups
- no duplicates

### Save behavior

- Save Lineup button persists current order
- when the contest remains editable, the board source is `user_saved`, and the current order matches the saved order, show a persistent `Your board is saved` confirmation with a `Complete` badge
- the persistent confirmation appears after save and when the saved board is reopened or reloaded
- while the board is current, replace the disabled Save button with a compact green saved state
- adding, removing, or reordering a player removes the saved confirmation and restores the sticky `Unsaved changes` state with the active Save button
- on mobile, keep the sticky unsaved action compact: show only the unsaved label, ranked count, and Save button; the lock time remains in the board header and duplicate helper copy stays hidden
- keep enough mobile page clearance for the final ranked row to scroll fully above the sticky unsaved action and fixed bottom navigation
- keep the active drag treatment blue and prevent text selection while users drag; preserve the keyboard-accessible move-up and move-down controls
- save failures never show completion
- user can keep editing until lock

### Disabled states

If contest locks while user is editing:

```text
Contest locked. Lineups can no longer be edited.
```

Route user to Locked Lineup View.

---

## 8. Saved Lineup Confirmation

### Route / UI Pattern
Use the lineup-builder route with a persistent confirmation state.

### Purpose
Confirm lineup is saved without implying permanent lock.

### Displays

- Lineup Saved confirmation
- current saved lineup
- countdown to lock
- compact saved state in the bottom action panel
- no post-save exit action

### Copy

```text
Your board is saved
You're entered. You can edit your rankings until {lock time}.
Complete
```

---

## 9. Locked Lineup View

### Route

```text
/entries/:entry_id/lineup/locked
```

or same lineup route with read-only state.

### Purpose
Show final saved lineup after lock.

### Access
Authenticated + entered + contest locked/live/final/finalizing/paid_out.

### Displays

- final lineup
- contest status
- player status: upcoming / in progress / final
- no live score totals

### Copy

```text
Contest locked. Your lineup is final.
```

---

## 10. Live / Underway Contest State

### Route
Same contest or entry route.

### Purpose
Maintain anticipation without live scoring.

### Displays

- read-only lineup
- contest underway status
- no live scoring
- no partial totals

### Copy

```text
Contest is underway. Final results will be available after all games are complete.
```

---

## 11. Finalizing State

### Route
Contest detail, leaderboard, or results route.

### Purpose
Show processing state after games complete but before results are finalized.

### Displays

```text
Final results are being calculated.
```

No payout shown until final results are persisted.

---

## 12. Results Reveal

### Route

```text
/entries/:entry_id/results
```

### Purpose
Deliver user's contest result.

### Access
Authenticated + entered + contest final/paid_out.

### Displays

- total score
- final position
- winnings, if applicable
- player-by-player score breakdown
- actual rank
- user rank
- miss points awarded
- tie status, if applicable
- payout pending/paid status

### Winner copy

```text
You Won $84.50
```

```text
Your winnings have been added to your cash balance.
```

If payout pending:

```text
Final results are posted. Winnings will be credited after stats are confirmed.
```

---

## 13. Final Leaderboard

### Route

```text
/contests/:contest_id/leaderboard
```

### Purpose
Show final contest standings.

### Access
Public after final, with current user highlighting if logged in and entered.

### Displays

- rank
- username
- score
- payout amount for paid positions when visible
- tied rank display using `T-`
- current user highlight

### MVP restrictions

No:

- live leaderboard
- search
- rank movement
- stat breakdowns
- projections

---

## 14. Profile

### Route

```text
/profile
```

### Purpose
Show user account and wallet basics.

### Access
Authenticated.

Logged out users see the same Google and email account-access choices as the dedicated Auth route.

Use `Profile` consistently for the screen, navigation label, setup flow, and cross-page destination copy. Do not use `Account settings` or `My account` as alternate names for this screen. `Account access` remains the sign-in card label because it describes authentication rather than the Profile destination.

An incomplete authenticated user sees one `Finish your Profile` form. The form contains all missing username and beta-entry fields, preserves entered values after validation, keeps explicit Beta Terms and Privacy Policy acknowledgements, and submits once. A complete returning user does not see sign-in methods or setup fields.

### Displays

- username/display name
- email
- account status
- cash balance
- site credit balance
- Withdraw button, if enabled
- notification preference basics
- logout

---

## 15. Wallet Summary

### Route

```text
/profile/wallet
```

or embedded in Profile for MVP.

### Purpose
Show user balances and withdrawal access.

### Displays

```text
Cash Balance: $42.50
Site Credit: $10.00
```

If withdrawals enabled:

```text
[ Withdraw ]
```

### MVP constraint
Do not build full transaction history unless required.

---

## 16. Withdraw Flow Placeholder

### Route

```text
/profile/wallet/withdraw
```

### Purpose
Allow cash balance withdrawals once provider path is selected.

### Access
Authenticated + eligible + verified as required.

### Placeholder copy for internal testing

```text
Withdrawals are not available in this test environment.
```

Do not publicly launch real-money contests without a working withdrawal path.

---

## 17. How It Works

### Route

```text
/how-it-works
```

### Purpose
Explain game rules, scoring, contest economics, tie handling, and site credit basics.

### Access
Public.

### Sections

- What is PickRank?
- How contests work
- How to build a lineup
- How scoring works
- Worked scoring example
- How ties work
- Prize pools and platform fee
- Canceled contests and site credit
- Responsible play
- Eligibility note

### Worked scoring example requirement

How It Works must include at least one concrete example showing:

- a user-ranked quarterback
- that quarterback's actual weekly passing-yards rank
- the rank distance
- the miss points awarded under the locked rank-differential scoring model
- how individual player points roll up into the user's total score

Example:

```text
If you rank Patrick Mahomes 1st and he finishes 9th in passing yards, he is 8 spots off.
Under PickRank scoring, that player earns 8 points because the score is the miss distance.
```

Keep this example near the scoring table so users can understand the point system without opening a contest result.

The first scoring summary also uses a compact visual example:

```text
Your rank 2nd -> Final rank 5th -> Difference +3 points
Exact ranks add 0. Lowest total wins.
```

This summary illustrates the locked rank-differential rule. Keep the full worked example table and all tiebreaker copy unchanged unless a separate scoring-rule change is approved.

---

## 18. Admin Contest List

### Route

```text
/admin/contests
```

### Purpose
Internal contest management.

### Access
Admin only.

### Displays

- contests by status
- draft/scheduled/open/locked/live/final states
- create contest button
- validation state
- publish state

---

## 19. Admin Create / Edit Contest

### Route

```text
/admin/contests/new
/admin/contests/:contest_id/edit
```

### Purpose
Create and configure contests.

### Access
Admin only.

### Flow

```text
Create Contest
→ Configure Basics
→ Select Stat Type
→ Build Slate
→ Validate Slate
→ Configure Economics
→ Set Timing
→ Preview
→ Publish
```

---

## 20. Admin Contest Validation / Publish Preview

### Route

```text
/admin/contests/:contest_id/validate
/admin/contests/:contest_id/preview
```

### Purpose
Prevent invalid contests from publishing.

### Displays

- validation pass/fail
- errors
- warnings
- slate preview
- economics preview
- timing preview
- publish CTA if validation passes

---

## Route Summary

```text
/contests
/contests/:contest_id
/auth
/contests/:contest_id/payment
/entries/:entry_id/lineup
/entries/:entry_id/results
/contests/:contest_id/leaderboard
/profile
/profile/wallet
/profile/wallet/withdraw
/how-it-works
/admin/contests
/admin/contests/new
/admin/contests/:contest_id/edit
/admin/contests/:contest_id/validate
/admin/contests/:contest_id/preview
```

---

## Navigation Guards

### Paid entry guard
Before Payment Review:

- user authenticated
- email verified
- account active
- eligible jurisdiction
- age confirmed
- not self-excluded
- contest open
- not already entered

### Lineup guard
Before Lineup Builder:

- user authenticated
- owns entry
- contest open

If contest is locked, route to read-only lineup.

### Results guard
Before Results Reveal:

- user authenticated
- owns entry
- contest final or paid_out

### Admin guard
Before admin routes:

- user authenticated
- admin permission true

---

## Frontend State Dependencies

Frontend should consume backend-provided state for:

- contest_status
- user_entry_status
- payment_status
- lineup_status
- eligibility_status
- payout_status
- wallet balances
- leaderboard finality

Frontend should not infer paid contest state from local timers alone.

Countdown timers are display helpers only. Backend state wins.

---

## MVP Constraints

Build for MVP:

- bottom tab navigation
- public contest lobby
- public contest detail
- auth gate
- eligibility gate states
- payment review
- entry success
- lineup builder
- saved lineup confirmation
- locked lineup view
- final results reveal
- final leaderboard
- profile/wallet summary
- how it works
- basic internal admin contest setup screens

Do not build for MVP:

- live leaderboard UI
- social profile pages
- friend/follow navigation
- advanced wallet dashboard
- full transaction history
- notification preference center
- advanced admin analytics UI
- dispute UI
- public user history pages

---

## Future Expansion

Potential future additions:

- live contest tracker
- live leaderboard
- private leagues tab
- friends/social tab
- user history and analytics
- wallet transaction history
- richer notification preferences
- admin dashboards
- support/dispute center
- state-specific onboarding screens
