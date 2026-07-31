# PickRank Legal Consultant Draft Questions

Date: 2026-07-29

## Purpose

This note logs the first-pass question bank from the July 28, 2026 legal consultant draft package. It is a working founder-review artifact, not legal advice and not a product-spec change.

Primary decision frame:

```text
Separate what needs to change in the product now from what can remain a launch-readiness item before public paid contests.
```

Parker's current preference is that PickRank should not launch only as zero-money contests, because that defeats the core purpose of the game. The current repo still blocks public real-money entry until legal, payment, withdrawal, KYC, jurisdiction, responsible-play, and auditable review gates are resolved.

## What The Drafts Appear To Cover

- Terms of Service and User Agreement
- Official Contest Rules
- Privacy Policy
- Eligibility and Restricted States Policy
- Responsible Gaming Policy
- Payments, Deposits, and Withdrawals Terms
- Acceptable Use and Contest Integrity Policy
- KYC, AML, and Identity Verification Policy
- Compliance, product-structure, state-footprint, payments, app-store, tax, and IP strategy memo

## Key Product Decision Tension

The consultant package appears internally coherent, but it intentionally recommends changing several core PickRank economics and rules that are currently locked in the repo:

- fixed guaranteed prize schedules instead of dynamic prize pools
- cash refunds by default instead of site-credit default refunds
- lower service fee, roughly 15-20%, instead of the current 30% platform fee
- 10 paid-entry minimum instead of the current 4 paid-entry minimum
- a different entry tiebreak sequence than the current repo scoring model
- deterministic player-stat tiebreakers instead of the current shared rank-range handling for tied passing-yard totals

These should be treated as lawyer questions and product decisions, not as automatic spec changes.

## Full Lawyer Question Bank

1. For public paid launch, are fixed guaranteed prize schedules a legal requirement in your view, or a risk-reduction recommendation? If PickRank kept dynamic prize pools with clear pre-entry formula disclosure, which states become meaningfully riskier?

2. Do you recommend changing the product spec now from 30% platform fee / 70% prize pool to a 15-20% service fee? Is the concern primarily commercial optics, skill-predominance evidence, regulator scrutiny, or specific state requirements?

3. Should the 4 paid-entry minimum be replaced with 10 paid entries before any real-money launch? If yes, should that be treated as a legal launch gate or an integrity/commercial recommendation?

4. For canceled contests, do you consider cash refunds to original payment method legally necessary, or can PickRank keep site-credit refunds if users clearly consent before entry? What is the safest version if we want site credit to remain part of the product?

5. The repo currently treats identical QB passing-yard results as shared rank ranges, while the draft rules break those ties using completions, attempts, interceptions, then alphabetical order. Which approach is stronger legally and operationally?

6. The repo's entry tiebreakers use exact picks, one-off-or-better picks, actual-QB1 placement, then selected QB1-QB5 passing touchdowns. The draft rules use a different sequence. Should the rules conform to the current product, or are you recommending we change the product?

7. Can we run a controlled no-money/free-test beta under a lighter public document set while keeping full paid-entry Terms/Rules in draft, or should all user-facing legal docs be live before any authenticated testing?

8. For the launch-state list, should Texas, Florida, and Utah be included in the first paid launch footprint, or should they be held until we have more operating data or a formal opinion of counsel?

9. Do we need a formal state-by-state legal opinion before payment-provider underwriting, before first paid contest, or only before expanding into registered/licensed states?

10. What are the minimum vendor requirements before paid launch: geolocation, KYC/identity, sanctions screening, payment processor, payout provider, and sports data provider? Which of those are hard blockers versus best-practice blockers?

11. For KYC, should PickRank avoid any vendor flow using selfie/document face matching at launch because of biometric-law exposure, especially with Illinois in the proposed footprint?

12. For taxes, should we engage a tax adviser separately on 1099 methodology, net winnings, entry fee treatment, backup withholding, and the 2026 wagering-loss change noted in the memo?

13. Can PickRank publish the Privacy Policy now for waitlist coverage before the operating entity, vendor names, and paid-launch details are finalized? If yes, what placeholders must be filled first?

14. Do the Terms/Privacy/Eligibility docs need separate handling for users in blocked states who only join the waitlist or browse free content?

15. For IP, should the immediate next step be trademark clearance and intent-to-use filing before any broader launch campaign? Should we also register code/UI copyrights now or wait until the product is more stable?

## Shorter Draft Note To Lawyer

```text
Hi [Lawyer Name],

I read through the first draft package and had a few follow-up questions before I start translating this into product decisions.

The biggest clarification I need is whether the recommended product changes are hard legal launch gates or risk-reduction recommendations. In particular: fixed guaranteed prize schedules instead of dynamic prize pools, cash refunds by default instead of site-credit refunds, reducing the 30% platform fee to 15-20%, and increasing the paid-entry minimum from 4 to 10.

I also want to confirm the contest mechanics. Our current product spec uses shared rank ranges for tied QB passing-yard results and a specific entry tiebreak sequence based on exact picks, one-off-or-better picks, actual-QB1 placement, and selected QB1-QB5 passing touchdowns. The draft rules use a different tiebreak approach. Should we conform the legal docs to the current product, or are you recommending a product change?

A few other items I'd like your guidance on:

1. Can we run a controlled no-money/free-test beta under a lighter public document set, or should all paid-entry legal docs be posted before any authenticated testing?
2. Should Texas, Florida, and Utah be included in the first paid launch footprint, or held until we have more operating data or a formal opinion?
3. What exactly must be in place before paid launch: geolocation, KYC/identity, sanctions screening, payment processor, payout provider, sports data provider, and/or state-by-state opinion?
4. Should we avoid any KYC vendor flow that uses selfie/document face matching at launch because of biometric-law exposure?
5. Can we publish the Privacy Policy now for waitlist coverage before the operating entity and vendor details are final, and if so, which placeholders must be filled first?
6. Should the tax questions around 1099 methodology, net winnings, entry fees, withholding, and the 2026 wagering-loss change go to a separate tax adviser?
7. Is trademark clearance and intent-to-use filing the immediate IP next step before broader launch marketing?

My goal is to separate what needs to change in the product now from what can remain a launch-readiness item before real-money contests.
```

## Follow-Up Status

Parker will review the question bank and share back which version he sends to the lawyer.
