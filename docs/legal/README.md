# Legal Document Index

This index is the control point for PickRank legal-document alignment. It maps the Ross source package, working copies, site implementation, and published releases. It is an internal product and legal-workflow record. It is not legal advice or counsel approval.

Ross source folder: [August 6 beta document package](https://drive.google.com/drive/folders/1OnUtXU9XmSQZcvGYmSpt1O4Lv312F3cD).

## Current Company Record

- Legal entity: Playground Sports, LLC, a Delaware limited liability company. The current formation certificate is preserved in the [Playground Sports LLC Drive folder](https://drive.google.com/drive/folders/1cwKfCekcv5tmp8pV-LRzVs-MU10MYdcH).
- Formation date: June 10, 2026.
- Principal and mailing address: 5014 42nd Ave SW, Unit C, Seattle, WA 98136.
- Parker confirmed on August 26, 2026 that the Company is not currently registered as a foreign limited liability company in Washington. Do not describe Washington foreign registration as complete without a later filing record.
- Washington governing law and King County venue remain separate legal choices in the current site copy. This entity correction does not change them.

## Current Sports Data Provider Record

- Parker confirmed on September 3, 2026 that PickRank has selected MySportsFeeds as its sports data provider for the next 12 months.
- Parker confirmed that the subscription covers PickRank's public free-to-play use, derived scoring and standings, data display, storage, caching, historical contest results, provider attribution and trademark requirements, data corrections, and continued-access terms as applicable.
- This confirmation applies to the current free-to-play product boundary. It does not establish rights for paid contests or business-to-business distribution. Review and approve those uses separately before implementation or publication.
- Public legal copy may identify MySportsFeeds as PickRank's designated statistical source or independent sports-data provider. It must state that this identification describes the source of statistical data only and does not mean that MySportsFeeds sponsors, endorses, administers, or assumes responsibility for PickRank or any PickRank contest.
- Use `contest` or the specific contest unit in provider and correction language. Do not use the retired product term `slate`.

## Operating Agreement Working Draft

- The [August 26, 2026 working draft](https://docs.google.com/document/d/1nmJH5XSj69qvEFHrj01ybt_CJ4jInI_4K3bQ0xstxuM/edit) is a member and counsel review draft. It is not executed and is not proof of filing or registration.
- Membership in the draft is Parker Levy at 33.4%, Taylor Schuster at 33.3%, and Gary Levy at 33.3%. Parker Levy and Gary Levy were members from formation. Taylor Schuster is admitted effective August 26, 2026. Each Member contributed $2,000 in cash.
- Management in the draft uses one-member-one-vote equal rights. Any one Member may sign an ordinary-course contract or approve ordinary-course spending up to and including $1,000. Spending, borrowing, or contracts above $1,000 require unanimous written consent.
- Parker Levy is the initial partnership representative. The Company has no fixed annual meeting date. Disputes use mediation followed by arbitration. Existing and future PickRank intellectual property is owned by the Company.
- Member mailing addresses are kept in the restricted Drive working draft and are not repeated in this public repo record.

## Source Layers

Keep these layers separate:

1. **Drive source snapshots.** Ross originals remain unchanged in the shared Drive folder. They are historical source material and are not the live site.
2. **Drive working drafts.** Dated copies may be edited for Parker and counsel review. Never overwrite a source snapshot.
3. **Repo live implementation.** The public legal routes under `app/legal/` and shared values in `lib/legal.ts` are the implementation source of truth for the current site.
4. **Published release record.** Record the Git commit and Vercel deployment that published a substantive legal change. Git preserves prior repo versions; the deployment record identifies what was public.

## Status Vocabulary

- **Source snapshot:** preserved original or received package file.
- **Working draft:** dated copy under review and not approved for publication.
- **Site-aligned:** repo copy reflects the current approved product posture, but counsel review or publication approval may still be open.
- **Counsel review:** the identified version is with counsel for review.
- **Published:** the version is tied to a verified production deployment.
- **Superseded:** retained for history but no longer the current working version.

## Document Register

| Document | Ross source snapshot | Current repo route | Current status | Alignment record and open gate |
| --- | --- | --- | --- | --- |
| Terms of Service | [Ross Terms](https://docs.google.com/document/d/1SGJorntwKsf-rAxp5J1A5eK9sn89ipwZ/edit) | [`/legal/terms`](../../app/legal/terms/page.tsx) | Published site-aligned copy; approved MySportsFeeds update pending publication and counsel review | 18+ beta, first-party date of birth, no-cash beta, `board` and `entry` terminology, Washington law, and King County venue. Parker approved third-party sports-data language covering provider delays, unavailability, incomplete data, corrections, and the corrective actions in the Contest Rules. Ross source still has placeholders and older 13+/lineup language. |
| Privacy Policy | [Ross Privacy](https://docs.google.com/document/d/1msfsI4-iHMuMIXtGteyNc_0LCGnTPODR/edit) | [`/legal/privacy`](../../app/legal/privacy/page.tsx) | Published site-aligned copy; counsel review pending | Covers first-party date of birth and beta data handling without promising payment, wallet, or know-your-customer collection. Ross source still has placeholders and older 13+/parent language. |
| Official Contest Rules | [Ross Official Rules](https://docs.google.com/document/d/1MBQFmpUby38fS8mJ28apcxo5yUR5uKdt/edit) | [`/legal/beta-rules`](../../app/legal/beta-rules/page.tsx) | Published site-aligned summary; approved MySportsFeeds update pending publication; Ross source needs alignment | Current product mechanic is a 20-quarterback pool, rank 10, actual rank against all 20, tied rank ranges, and repo tiebreakers. Parker approved naming MySportsFeeds as the designated statistical source, a no-sponsorship statement, and correction and availability rules without the retired term `slate`. Ross source still has old 15-player, lineup, placeholder, and tiebreaker language. |
| Acceptable Use | [Ross Acceptable Use](https://docs.google.com/document/d/1iiqGVpJLOhb2BHTZi_D1FbIvwFyWS6_1/edit) | [`/legal/acceptable-use`](../../app/legal/acceptable-use/page.tsx) | Published site-aligned copy; counsel review pending | Standalone public page with the free-beta 18+ posture, `board` and `entry` terminology, provider-neutral wording, and the seven-day enforcement review target. Ross source remains separate and unchanged. |
| Responsible Play | No separate Responsible Play file appears in the identified August 6 Ross package | [`/legal/responsible-play`](../../app/legal/responsible-play/page.tsx) | Published site-aligned copy; counsel review pending | Current page describes free-beta controls only. Paid-contest controls and operations remain deferred. Add a source snapshot when Ross or counsel supplies one. |

## Current Published Reference

- Current public routes are under `https://www.pickrankgames.com/legal/`.
- The latest known repo release carrying the current legal route set is `origin/main` commit `c7034c6`.
- The latest known Vercel production deployment associated with that release is `dpl_7bNW19JstmivPWizs8Gy6vLzD5KE`.
- Verify the production deployment and live route responses again whenever legal copy changes. Do not treat a local or branch commit as proof of publication.
- Shared legal values are centralized in [`lib/legal.ts`](../../lib/legal.ts). Route-specific copy remains in the route files listed above.

## Required Workflow

1. Read this index and [`change-log.md`](./change-log.md) before any legal-document or public-legal-copy work.
2. Identify the exact source snapshot, working draft, repo route, and current published release involved.
3. Keep Ross originals unchanged. Create a dated working copy for review when source text must be edited.
4. Keep public copy within the current free-to-play beta boundary unless Parker and counsel approve a phase change.
5. Use `board`, `entry`, and `contest` in public legal documents. Do not introduce `lineup` or the retired term `slate` as public legal terms.
6. Update this index and the append-only change log in the same repo change as any substantive legal-copy or legal-process update.
7. After publication, record the verified Git commit, deployment, effective date, and last-updated date here.
8. When a provider, parent-report workflow, age posture, economics, or other open decision changes, record the decision before changing public copy.

## Open Gates

- Parker and counsel must approve the final Terms, Privacy Policy, Official Contest Rules, Acceptable Use, and Responsible Play text before treating site-aligned copy as final legal text.
- MySportsFeeds is selected for the next 12 months, and Parker confirmed the current subscription rights listed in the provider record above. No provider-selection or current free-to-play rights gate remains. Apply any attribution or trademark requirements from the subscription when publishing. Paid-contest and business-to-business rights remain separate review gates.
- The under-18 parent-report workflow is held for separate review. Do not add a public promise until Parker re-approves it.
- Paid entry, prizes, deposits, withdrawals, payouts, wallets, know-your-customer, geolocation, state eligibility, refunds, and paid-contest responsible-play operations remain Phase 2 work.
