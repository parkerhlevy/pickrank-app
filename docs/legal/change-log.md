# Legal Alignment Change Log

This is an append-only internal record of substantive PickRank legal-document alignment and publication decisions. Add a dated entry for each approved change. Do not rewrite history to make an older source snapshot look current.

## 2026-08-06

- Ross's beta package was received in the shared Drive folder as Office `.docx` source files.
- The original Terms, Privacy Policy, Official Contest Rules, and Acceptable Use files remain preserved in Drive and are not live site copies.

## 2026-08-08

- The historical alignment review identified material differences between the Ross package and the repo posture. The main items were old 15-player slate language, `lineup` terminology, 13+ and parent-workflow promises, placeholders, old tie and entry tiebreakers, provider placeholders, and paid-contest provisions.
- See [`docs/analysis/legal-beta-doc-alignment-2026-08-08.md`](../analysis/legal-beta-doc-alignment-2026-08-08.md) for the historical review. That memo remains an internal record and is not the live legal source.

## 2026-08-11

- PickRank's Early Access Beta age posture changed to 18+.
- The product posture uses first-party date-of-birth collection and blocks under-18 users before beta entry.
- The site-aligned legal routes were updated to reflect the 18+ posture. The age-gate implementation was released on `main` at commit `b6e7a6e`.

## 2026-08-20

- Acceptable Use became a standalone public route at [`/legal/acceptable-use`](../../app/legal/acceptable-use/page.tsx).
- The footer and Terms page link to the standalone policy.
- The site copy uses the no-cash beta boundary, `board` and `entry` terminology, provider-neutral wording, `support@pickrankgames.com`, and the seven-day enforcement review target.
- Ross's Acceptable Use source file was not edited.

## 2026-08-24

- The repo legal index and this append-only change log were established.
- The current public legal route set was reconciled against the free-to-play 18+ beta posture and the current 20-player pool / rank-10 board mechanic.
- The index records Ross originals as source snapshots, site routes as implementation, and Git plus Vercel as the publication record.
- The provider remains intentionally unspecified pending provider selection and terms review.
- The under-18 parent-report workflow remains held for separate Parker review and is not promised in the public pages.

## 2026-08-25

- Corrected the repo legal entity description from a Washington limited liability company to a Delaware limited liability company based on the current formation certificate in the shared Playground Sports LLC Drive folder.
- Recorded 5014 42nd Ave SW, Unit C, Seattle, WA 98136 as the principal and mailing address.
- Kept Washington governing law and King County venue unchanged. Washington foreign-registration status remains open and is not represented as complete.

## 2026-08-26

- Recorded the June 10, 2026 Delaware formation date and Parker's confirmation that the Company is not currently registered as a foreign limited liability company in Washington.
- Prepared the [Playground Sports LLC operating agreement working draft](https://docs.google.com/document/d/1nmJH5XSj69qvEFHrj01ybt_CJ4jInI_4K3bQ0xstxuM/edit) with the confirmed members, percentage interests, capital contributions, admission date for Taylor Schuster, equal voting rights, $1,000 unanimous-approval threshold, partnership representative, meeting approach, mediation-then-arbitration process, and Company ownership of existing and future PickRank intellectual property.
- The operating agreement draft remains unsigned and requires member and counsel review. It does not establish Washington foreign registration or change the published site legal-copy status.

## 2026-09-03

- Parker confirmed that PickRank has selected MySportsFeeds as its sports data provider for the next 12 months.
- Parker confirmed that the subscription covers the current public free-to-play product's use of provider data for derived scoring and standings, display, storage, caching, historical contest results, provider attribution and trademark requirements, corrections, and continued-access terms as applicable.
- Paid-contest and business-to-business distribution rights remain separate review gates. This provider decision does not approve either use.
- Parker approved provider-specific language for the Beta Terms and Beta Contest Rules. The approved legal posture identifies MySportsFeeds as the designated statistical source or an independent sports-data provider, explains data availability and correction handling, and states that MySportsFeeds does not sponsor, endorse, administer, or assume responsibility for PickRank or its contests.
- Provider and correction language must use `contest` or the specific contest unit. It must not use the retired term `slate`.
- Playground Sports, LLC remains a Delaware limited liability company with its principal and mailing address in Washington. The provider decision does not change the entity, address, governing-law, or venue records.
