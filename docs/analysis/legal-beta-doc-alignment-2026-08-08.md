# Legal Beta Document Alignment

Date: 2026-08-08

## Purpose

Track the changes needed before the August 6 free-to-play beta legal docs can be posted on PickRank.

This is a founder/product review artifact. It is not legal advice and does not publish or approve the documents.

## Supersession Note

Superseded on 2026-08-11 for age-gate purposes. PickRank Early Access Beta now uses an `18+` DOB gate. Do not follow the older lower-age recommendation in this note.

## Source Documents

- `00-Memo.docx`
- `2026-08-06_TermsofServicedocx.docx`
- `2026-08-06_PrivacyPolicy.docx`
- `2026-08-06_Official_ContestRules.docx`
- `2026-08-06_AcceptableUsePolicy.docx`

## Current Recommendation

Use the free-to-play beta document set, but revise it before publication.

Use `18+` for Early Access Beta.

Do not change repo mechanics to match the legal drafts. Change the legal drafts to match the repo.

## Blocker 1: Contest Rules Do Not Match The Repo

The updated Contest Rules still describe a 15-player slate. The repo now uses a 20-quarterback player pool where users save one ranked 10-player board.

Change the Contest Rules before publication:

- Replace `fifteen (15) professional football players` with `20 quarterbacks` or `20-player pool`.
- Replace `selecting ten (10) of the fifteen players` with `selecting 10 quarterbacks from the 20-player pool`.
- Prefer `player pool`, `your board`, `Build Your Board`, and `Save Your Board` in user-facing wording.
- Remove user-facing promises that users can cancel entries before lock unless the product adds that flow.
- Replace `lineups cannot be viewed` after lock with `boards cannot be edited` after lock. The current app can still show saved boards.
- Update all scoring language so actual rank is measured against the full 20-player pool.

## Blocker 2: Player-Stat Tie Rules Conflict With The Repo

The updated Contest Rules break tied passing-yard results by completions, attempts, interceptions, then alphabetical order.

The repo spec does not do this. It treats tied passing-yard results as shared actual-rank ranges.

Replace the player-stat tie section with:

```text
If two or more quarterbacks finish with the same passing yards, they share the same actual rank group. PickRank does not break tied passing-yard finishes with completions, attempts, touchdowns, interceptions, alphabetical order, or manual judgment.
```

Add this scoring rule:

```text
If a quarterback has a tied actual rank range, distance is 0 when your board position falls inside that range. Otherwise, distance is the shortest distance to either edge of the tied range.
```

## Blocker 3: Entry Tiebreakers Conflict With The Repo

The updated Contest Rules use exact matches, positional priority, then top-ten selections.

The repo tiebreaker order is:

1. most exact player placements
2. most one-off-or-better picks
3. closest placement of the actual QB1
4. more passing touchdowns from the quarterback the user ranked #1
5. if still tied, compare passing touchdowns from the user's selected QB2, then QB3, then QB4, then QB5

Replace the Contest Rules tiebreaker section with that order.

## Blocker 4: Age Gate Creates A Product Decision

The updated docs use `[13]` and assume:

- date of birth collection
- DOB-first signup
- underage registration blocking
- sticky device blocking after a failed age check
- parent/guardian reporting and deletion workflow
- support instructions for underage reports
- no ad tracking before age confirmation

The current app now captures date of birth after sign-in and uses it for the 18+ beta age check.

Beta decision:

```text
Early Access Beta is 18+.
```

Current local worktree status: app and site placeholder copy now follows the `18+` path. The current app collects first-party DOB in account/profile setup and blocks under-18 users before account use or beta entry.

Product decision: collect DOB directly in PickRank's account/profile setup instead of depending on Google SSO. Normal Google sign-in does not reliably return date of birth. Google's People API can request birthday data through `user.birthday.read`, but that creates extra OAuth consent, API-verification, and reliability work that is disproportionate for Early Access Beta.

Completed local action: add first-party DOB collection to PickRank account/profile setup for the `18+` beta posture.

Current local app copy now:

- collects date of birth in account/profile setup
- uses the DOB field for the 18+ beta age check
- blocks under-18 users before account use or beta entry

Completed implementation slice:

- collect DOB directly in PickRank account/profile setup
- calculate and store the beta age check without depending on Google SSO
- block under-18 users before account use or beta entry
- update Privacy and Terms copy
- update stored profile metadata/types, validation, and tests

## Blocker 5: Email Footer And Outreach Requirements

Ross's memo says marketing email must include:

- working unsubscribe
- valid physical postal address
- honest headers and subject lines
- proof of consent
- Privacy Policy link
- no-purchase / no-entry-fee / no-prizes disclaimer
- NFL non-affiliation disclaimer

The current local welcome email now includes the source, no-purchase / no-entry-fee / no-prizes language, Privacy Policy link, future Resend unsubscribe language, the supplied postal address, and NFL non-affiliation language.

Before broader outreach:

- Verify the Resend unsubscribe link works without login and remains active.
- Keep proof of consent from `waitlist_signups`.
- Do not send SMS without separate express written consent.

## Blocker 6: Policy Promises May Exceed Implementation

Soften or implement these before publication:

- Cookie preferences tool: the Privacy Policy says users can manage non-essential cookies through a cookie preferences tool. Do not promise this unless it exists.
- Global Privacy Control: the Privacy Policy says PickRank honors GPC where required. Do not promise this unless implemented or confirmed by tooling.
- Device fingerprinting: Acceptable Use says PickRank identifies related accounts using device fingerprints. Use softer language unless current tooling truly does this.
- Lineup similarity analysis: Acceptable Use says PickRank uses lineup similarity analysis. Use `may use` or `may review` unless implemented.
- Automated/human review: Privacy says a person reviews automated determinations that materially affect an account. Keep only if admin review workflow supports it.
- Account deletion: Parker chose 30 days, with legal/security/fraud/dispute/compliance carveouts.
- Entry cancellation: Contest Rules say users can cancel entries before lock. Remove unless the product adds cancellation.

## Blocker 7: Placeholders

Fill these before publication:

| Placeholder | Recommendation | Needs Parker |
|---|---|---|
| `[ENTITY NAME]` | Playground Sports, LLC. | Supplied |
| `[State] [entity type]` | Washington limited liability company. | Supplied |
| Effective Date / Last Updated | August 9, 2026. | Supplied |
| Contact email | `support@pickrankgames.com`. | Supplied |
| Parent/guardian email | `support@pickrankgames.com`. | Supplied |
| Physical address | Playground Sports, LLC, 5014 42nd Ave SW, Unit C, Seattle, WA 98136. | Supplied |
| Governing law | Washington law. | Supplied |
| Venue | King County, Washington. | Supplied |
| `[DATA PROVIDER]` | Use a generic selected licensed stats provider reference until provider rights are confirmed in writing. | Needs provider-rights review |
| Results finality window | 24 hours after the last slate game ends. | Supplied |
| Cancellation game threshold | N/A during free beta with no cash prizes. | Supplied |
| Account deletion period | 30 days, with legal/security/fraud/dispute/compliance carveouts. | Supplied |
| Enforcement review window | 7 days. | Supplied |

## Immediate Website Work After Decisions

Current local site status:

- `/legal/terms` and `/legal/privacy` now use beta-ready site copy based on Parker's supplied decisions.
- A global legal footer now links Terms, Privacy, Beta Rules, and Responsible Play from public and account routes.
- Beta Rules site copy uses a generic selected licensed stats provider reference.

Remaining publication work:

- Review the selected provider terms and the August 6 test-game use case before treating provider naming as fully cleared.
- Add an Acceptable Use page or include it in the legal page set.
- Run `npm run typecheck`, `npm run test`, `git diff --check`, and focused homepage/profile route checks.

## Not In Scope

- Paid contest launch.
- Payment provider integration.
- KYC or identity provider integration.
- Geolocation enforcement.
- Payouts, withdrawals, cash balance, or wallet ledger movement.
- State-by-state paid eligibility.
- Real-money responsible-play operations.
