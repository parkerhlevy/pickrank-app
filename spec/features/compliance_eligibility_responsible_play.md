# Compliance, Eligibility, and Responsible Play Requirements

## Purpose
Define MVP requirements for compliance-aware product design, user eligibility, jurisdiction controls, responsible play hooks, contest language, and legal review checkpoints for PickRank paid skill-based contests.

## Status
Locked for MVP direction. Final legal rules, supported states, age thresholds, payment-provider requirements, and jurisdiction restrictions require legal/provider review before public real-money launch.

## Anchor
MVP compliance design treats PickRank as a paid skill-based contest product, requires legal review before launch, blocks paid entry until eligibility is confirmed, supports jurisdiction and age controls, avoids betting/wagering language, includes responsible play hooks, and does not publicly launch real-money contests until state, payment, KYC, and withdrawal requirements are resolved.

---

## Summary
PickRank is framed as a skill-based contest, not sports betting.

However, paid sports-related contests are regulated differently across U.S. states. MVP must be built with product hooks that allow PickRank to restrict eligibility by age, location, account status, and verification state.

Do not assume nationwide paid contest availability.

## Early Access Beta Boundary

PickRank's first public launch mode is Early Access Beta with free-to-play contests only.

Beta contests use a Beta Pass model:

- Beta Pass grants free beta entry access.
- Beta Pass has no cash value.
- Beta Pass cannot be withdrawn or redeemed for cash.
- Beta contests have no payouts and no cash prizes.
- Paid contests remain planned for a later launch.

Free beta launch is a risk-reduction product posture, not a legal bypass. Counsel should still review Beta Terms, Privacy Policy, Beta Contest Rules, no-cash-value language, age/state collection, and marketing claims before broad public use.

During beta, completed age confirmation, state capture, Beta Terms acceptance, and Privacy acceptance may allow free beta entry. They must not be treated as public real-money paid-entry approval.

## Current Verification Boundary

The current product foundation can collect and display account-level eligibility inputs, but it cannot independently verify legal eligibility for public real-money paid contests.

### PickRank can verify today

PickRank can currently verify only product-controlled facts and stored account state:

- the user is authenticated through the configured auth provider
- the user has a saved profile record or auth metadata for the current foundation fields
- the user has supplied a state/jurisdiction value
- the user has checked the age-confirmation box
- the user has accepted Terms and Privacy Policy placeholders
- the account has a stored eligibility status such as `pending_review`, `eligible`, or `blocked`
- the server-side paid-entry flow blocks users whose stored eligibility status is not `eligible`

### PickRank cannot verify today

PickRank cannot currently prove:

- the user's legal identity
- the user's date of birth
- that the age confirmation is truthful
- that the user is physically located in the supplied jurisdiction
- that the supplied jurisdiction is legally approved for public paid contests
- that the user has passed KYC, sanctions, fraud, or payment-provider review
- that the user is clear of external responsible-play, self-exclusion, or prohibited-person lists
- that public real-money paid entry or withdrawals are provider-approved

### Self-attestation versus verification

Self-attestation means the user supplies or confirms a value without independent proof. The current age confirmation, state/jurisdiction selection, Terms acceptance, and Privacy acceptance are self-attestations or captured acknowledgements.

Verification means PickRank or an approved provider has independently checked the relevant fact against a trusted source, such as legal review, payment-provider review, identity/KYC provider data, billing or payout provider records, geolocation provider evidence, or another approved compliance source.

Do not describe a self-attested account as legally verified. User-facing and admin-facing copy should distinguish:

- `captured`: the user supplied the required field or acknowledgement
- `pending_review`: the account has enough captured data for internal review but is not approved
- `eligible_for_internal_testing`: the account may be allowed into controlled test/free-entry flows
- `eligible`: the account may enter paid contests only after the public real-money launch gates are satisfied
- `blocked`: the account may not enter paid contests

### Internal testing eligibility

An account may be marked eligible for internal testing only when all of the following are true:

- the account is a known test, founder, operator, or approved QA account
- the auth identity and email address are recognized by the internal team
- age confirmation, jurisdiction, Terms acceptance, and Privacy acceptance are captured
- the account is not restricted, suspended, self-excluded, or on a known compliance hold
- the test flow does not use public real-money payment, withdrawal, payout, or cash-balance movement
- the reviewer records that the approval is for controlled internal testing, not public real-money eligibility

Internal testing eligibility may allow controlled free/test-entry flows where enabled by the environment. It must not be treated as permission to enable public paid entry, real-money payment capture, withdrawals, or public launch.

### Public real-money eligibility approval

Before any account can be approved for public real-money paid entry, PickRank still needs:

- legal review of supported jurisdictions and required age thresholds
- configured jurisdiction rules based on that review
- payment-provider approval for the business model and entry-payment flow
- a withdrawal provider or approved withdrawal path
- KYC, identity, sanctions, fraud, and responsible-play requirements defined by legal/provider review
- Terms, Privacy Policy, contest rules, and responsible-play copy reviewed
- server-side eligibility, payment, withdrawal, refund, payout, and wallet-ledger checks verified in test/sandbox mode
- reviewer/admin tooling with auditable decision records and rollback/restriction handling

Until those gates are complete, production accounts should remain `pending_review` or `blocked` for paid entry even if their self-attestation fields are complete.

---

## Legal Review Requirement

Before public real-money launch, PickRank needs legal review covering:

- state-by-state contest legality
- skill-based contest classification
- fantasy sports / DFS implications
- sports wagering risk
- payment processing rules
- payout / withdrawal rules
- age requirements
- KYC / identity verification requirements
- tax reporting requirements
- responsible play requirements
- prohibited language and marketing claims

Until legal review is complete, jurisdiction support should remain configurable and conservative.

---

## Product Classification Direction

MVP language should frame PickRank as:

```text
skill-based NFL prediction contest
```

Use:

- contest
- entry
- buy-in
- prize pool
- winnings
- leaderboard
- lineup
- score

Avoid:

- bet
- wager
- sportsbook
- odds
- parlay
- gambling
- guaranteed profit
- risk-free

---

## Jurisdiction Eligibility

### Core rule
Paid contest entry must be blocked unless the user is in an eligible jurisdiction.

Eligibility must be configurable by state/jurisdiction.

Do not hard-code all states as eligible.

### MVP jurisdiction statuses

Recommended statuses:

```text
eligible
blocked
unknown
pending_review
```

### User behavior by status

| Status | Can Browse | Can Enter Paid Contest | Can Withdraw | Message |
|---|---:|---:|---:|---|
| eligible | Yes | Yes | Yes, if verified | Normal |
| blocked | Yes | No | Limited/provider-dependent | Paid contests unavailable |
| unknown | Yes | No | No | Confirm location |
| pending_review | Yes | No | No | Eligibility under review |

### Jurisdiction source
MVP may use one or more of:

- user-entered state
- payment-provider billing state
- device/IP location check
- KYC provider location result
- geolocation provider, if required

Final requirement depends on legal/provider review.

---

## Age Eligibility

### MVP age gate
At minimum, users must confirm they meet the required age threshold before paid entry.

Current placeholder copy:

```text
I confirm I meet the age requirement to enter paid contests.
```

### Age threshold
Do not permanently lock the threshold without legal review.

Most likely starting assumption:

```text
18+
```

But some states or providers may require:

```text
21+
```

The app should support configurable age thresholds by jurisdiction.

---

## KYC / Identity Verification

MVP should support identity verification status even if full KYC is not implemented immediately.

KYC may be required for:

- withdrawals
- higher payout thresholds
- payment provider compliance
- fraud prevention
- state/jurisdiction requirements

Recommended statuses:

```text
not_required
required
pending
verified
failed
expired
```

### Entry vs withdrawal
MVP direction:

- browsing does not require KYC
- paid entry may require KYC depending on provider/legal review
- cash withdrawal likely requires KYC or provider verification

Do not allow public cash withdrawals without provider-compliant verification.

---

## Account Restrictions

Users may be restricted from paid contests or wallet actions.

Reasons may include:

- failed eligibility check
- blocked jurisdiction
- failed KYC
- suspected fraud
- chargeback issue
- self-exclusion
- responsible play restriction
- legal/compliance hold
- age verification issue

Recommended fields:

- `account_status`
- `eligibility_status`
- `restriction_reason`
- `restricted_at`
- `restriction_source`

---

## Responsible Play Requirements

MVP should include responsible play hooks even if advanced tools are deferred.

### MVP build
Build or support fields for:

- self-exclusion status
- deposit/entry restriction status
- responsible play messaging
- support contact path
- account restriction reason

### MVP user-facing content
Add a basic responsible play section in Help / Terms area.

Example copy:

```text
PickRank contests are paid skill-based contests. Play responsibly and only enter contests within your limits.
```

### Self-exclusion placeholder
Support a future self-exclusion flow.

Recommended statuses:

```text
none
requested
active
expired
```

If self-exclusion is active:

- block paid contest entry
- block new deposits, if deposits are later supported
- preserve access to withdrawal where legally/provider allowed

---

## Payment Compliance Hooks

Because paid entries and withdrawals require external payment infrastructure, product must support provider-driven requirements.

Potential provider requirements:

- identity verification
- sanctions screening
- fraud checks
- chargeback handling
- restricted business review
- payout recipient verification
- minimum withdrawal amount
- tax document collection

Do not publicly launch real-money contests until payment and payout providers approve the flow.

---

## Tax Reporting Placeholder

MVP should not build full tax reporting from scratch unless required.

However, the system should store enough data to support future reporting:

- user identity/KYC provider ID
- payout amounts
- payout dates
- annual winnings totals
- withdrawal totals
- tax form status, if applicable

Provider/legal review should determine thresholds and obligations.

---

## Contest Rules / Terms Requirements

Before paid entry, users must accept Terms and Privacy Policy.

Terms should cover:

- skill-based contest rules
- entry fees
- prize pool calculation
- platform fee
- payout structure
- tie handling
- canceled contest refunds as site credit
- site credit non-withdrawability
- withdrawal terms
- eligibility requirements
- state/jurisdiction restrictions
- stat correction window
- finality of paid-out contests
- responsible play language

---

## Marketing / Copy Restrictions

Avoid claims that imply gambling or guaranteed financial outcomes.

Do not say:

- risk-free
- guaranteed win
- bet now
- wager
- odds boost
- sportsbook-style language
- free money

Preferred copy:

- enter contest
- build your lineup
- rank the slate
- compete on skill
- winnings added to cash balance

---

## User-Facing Eligibility Copy

### Location blocked
```text
Paid contests are not available in your location at this time.
```

### Unknown location
```text
Confirm your location to enter paid contests.
```

### Age blocked
```text
Paid contests are not available for your account at this time.
```

### KYC required
```text
Additional verification is required before you can withdraw funds.
```

### Account restricted
```text
Your account is restricted from entering paid contests. Contact support if you think this is a mistake.
```

### Self-exclusion active
```text
Paid contest entry is currently disabled for your account.
```

---

## Backend Requirements

### Eligibility check service
Before paid entry, backend must check:

- authenticated user
- email verified
- account status active
- age eligibility
- jurisdiction eligibility
- KYC status, if required
- self-exclusion status
- contest state is open
- no duplicate entry

### Withdrawal check service
Before cash withdrawal, backend must check:

- authenticated user
- account active
- cash balance available
- withdrawal provider requirements met
- KYC/identity status sufficient
- jurisdiction allows withdrawal
- self-exclusion does not block withdrawal, if applicable
- no fraud/compliance hold

### Auditability
Eligibility decisions should be logged.

Recommended event fields:

- `event_id`
- `user_id`
- `event_type`
- `eligibility_result`
- `jurisdiction`
- `source`
- `created_at`
- `metadata`

---

## Data Model Additions

### Compliance Eligibility Event

- `event_id`
- `user_id`
- `event_type`
- `jurisdiction`
- `eligibility_status`
- `age_gate_status`
- `kyc_status`
- `self_exclusion_status`
- `restriction_reason`
- `source`
- `created_at`
- `metadata`

### Jurisdiction Rule

- `jurisdiction_code`
- `paid_entry_status`
- `withdrawal_status`
- `minimum_age`
- `kyc_required_for_entry`
- `kyc_required_for_withdrawal`
- `notes`
- `last_legal_review_at`
- `status`

### Responsible Play Status

- `user_id`
- `self_exclusion_status`
- `self_exclusion_started_at`
- `self_exclusion_ends_at`
- `entry_restriction_status`
- `restriction_reason`
- `updated_at`

---

## Admin Requirements

Internal admin should be able to:

- mark jurisdictions as eligible/blocked/pending review
- restrict or unrestrict user accounts
- view eligibility status
- view KYC status
- view self-exclusion status
- cancel contests for legal/compliance reasons

MVP admin tooling can be basic, but the data model must support these actions safely.

---

## Launch Gate Checklist

Do not publicly launch real-money paid contests until:

- legal review is complete
- supported jurisdictions are defined
- age requirements are defined
- payment provider is selected/approved
- withdrawal provider/path is selected/approved
- KYC requirements are defined
- Terms and Privacy Policy are drafted/reviewed
- responsible play copy is in place
- eligibility blocking works server-side
- test accounts cannot bypass restrictions

---

## MVP Constraints

Build for MVP:

- jurisdiction eligibility fields
- age gate field
- KYC status placeholder
- self-exclusion status placeholder
- server-side eligibility checks before paid entry
- server-side verification checks before withdrawal
- account restriction support
- eligibility event logging
- responsible play copy placeholder
- configurable jurisdiction rules

Do not build for MVP:

- full legal rules engine
- advanced geolocation enforcement unless required by provider/legal review
- public dispute workflow
- automated tax form generation
- advanced responsible gaming dashboard
- deposit limits unless standalone deposits are added
- full self-service self-exclusion UI unless required before launch

---

## Future Expansion

Potential future additions:

- geolocation provider integration
- real-time state eligibility checks
- responsible play limits
- cool-off periods
- self-exclusion flow
- play history summaries
- tax document dashboard
- compliance admin dashboard
- jurisdiction-specific terms display
- automated legal/rules configuration by state
