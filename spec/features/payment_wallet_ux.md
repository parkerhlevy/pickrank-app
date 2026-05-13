# Payment + Wallet UX States

## Purpose
Define the user-facing payment, wallet, entry confirmation, failure, cancellation, and payout states for PickRank contests.

## Status
Draft locked for MVP direction. External payment provider and withdrawal provider still need vendor selection.

## Anchor
MVP payment UX uses an external payment provider from launch, shows a payment review step before entry, creates entries only after successful payment, supports wallet-funded entries, supports external payment fallback, and requires a withdrawal path for cash balance winnings.

---

## Strategic Decision
PickRank should assume external payment infrastructure is required from the start.

There is no strong MVP shortcut for real-money contest entries and withdrawals.

MVP should not attempt to manually manage card payments, bank payouts, compliance-sensitive money movement, or withdrawal operations without a payment provider.

Provider selection is still open.

Potential provider categories:

- card payment processor
- wallet / stored balance provider
- payout provider
- identity / KYC provider, if required
- fraud / chargeback tooling, if required

Vendor decision should happen before engineering implementation of paid contests.

---

## Core UX Principles
The payment UX should feel:

- fast
- low-friction
- trustworthy
- transparent
- mobile-native

Users should always know:

- what they are paying
- how much site credit is applied
- how much cash balance is applied
- how much is due externally
- whether entry succeeded
- where winnings or refunds went

---

## Contest Entry CTA
Primary CTA on contest screen:

```text
Enter Contest — $5
```

If the user has already entered the contest, replace with:

```text
Edit Lineup
```

MVP is single-entry only.

---

## Payment Review Sheet

### Purpose
Before confirming entry, show the full payment breakdown.

### Example

```text
Week 7 QB Passing Yards

Entry Fee:               $5.00

Site Credit Applied:    -$2.00
Cash Balance Applied:   -$1.00

Amount Due Today:        $2.00

[ Confirm Entry ]
```

### Funding priority
Funds are automatically applied in this order:

1. site credit
2. cash balance
3. external payment method

No manual funding toggles in MVP.

### External amount due
If the user does not have enough site credit or cash balance to cover the entry fee, the remaining amount is charged through the external payment provider.

---

## Successful Entry State
After payment succeeds:

```text
✓ You're In

Your lineup has been created.
You can edit your rankings until lock.

[ Build Lineup ]
```

### Backend actions on success

1. validate contest is still open
2. process wallet debits
3. process external payment, if needed
4. create entry
5. assign randomized default lineup
6. increment contest entry count
7. route user to lineup builder

Entry creation must not happen until payment succeeds.

---

## Payment Failure State
If payment provider fails, payment is declined, or the request cannot complete:

```text
Payment Failed

Your contest entry could not be completed.

Please try another payment method.

[ Try Again ]
```

### Rules

- Do not create an entry.
- Do not assign a lineup.
- Do not increment entry count.
- Do not debit wallet funds unless the full transaction succeeds.

---

## Contest Lock Payment Protection
Users cannot begin payment after contest lock.

If the contest locks while the payment sheet is open or while payment is processing:

```text
Contest Locked

This contest is no longer accepting entries.
```

No funds should be charged.

Backend must validate lock status immediately before final payment capture and entry creation.

---

## Duplicate Entry Prevention
MVP allows one entry per user per contest.

If user already entered:

- show `Edit Lineup`
- hide payment CTA
- prevent duplicate backend entry creation

Never show:

- `Enter Again`
- multi-entry options

---

## Canceled Contest UX

### Trigger
Contest has fewer than 4 paid entries at lock.

### User notification
Push notification + in-app banner:

```text
Contest Canceled

This contest did not reach the minimum number of entries.

Your entry fee has been returned as site credit.
```

### Contest card state
Canceled contests display:

```text
Canceled
```

Disable:

- leaderboard
- lineup editing
- scoring state
- results reveal

---

## Results Payout UX

### Winning entry
Results reveal should display:

```text
You Won $84.50
```

Supporting text:

```text
Your winnings have been added to your cash balance.
```

### Non-winning entry
Avoid loss-heavy language.

Do not use:

- `You lost`
- `No winnings`

Use:

```text
Final Position: 214
Score: 67
```

---

## Wallet Display
MVP Profile should show:

```text
Cash Balance: $42.50
Site Credit: $10.00
```

Entry screen should show available site credit context:

```text
You have $10.00 in site credit available.
```

---

## Withdrawals
Users need a way to get cash balance winnings out of PickRank.

MVP should include at least a basic withdrawal path before real-money launch.

### MVP withdrawal direction
Build or integrate a provider-backed withdrawal flow for cash balance.

Site credit cannot be withdrawn.

### Withdrawal UX placeholder
Until the exact provider is selected, Profile / Wallet may include:

```text
Cash Balance: $42.50

[ Withdraw ]
```

If withdrawal setup is incomplete during internal testing, show:

```text
Withdrawals are not available in this test environment.
```

Do not publicly launch paid contests without a defined cash withdrawal path.

---

## Wallet History
Do not build a full wallet history UI for MVP unless required by payment provider or compliance review.

Backend ledger is required even if full transaction history UI is deferred.

---

## Error States

### Generic payment error

```text
Something went wrong while processing your payment.

Please try again.
```

### Network interruption

```text
Connection lost.

Please check your internet connection and try again.
```

### Duplicate payment protection
If payment succeeds but app response fails, the user must not be charged twice.

Backend should use:

- idempotency keys
- payment session validation
- atomic wallet updates
- duplicate entry checks

---

## Backend Requirements
Frontend states rely on backend support for:

- external payment provider integration
- external payout / withdrawal provider integration
- idempotent payment requests
- atomic wallet debits
- contest lock validation
- duplicate-entry protection
- payment status tracking
- refund event handling
- payout status tracking

---

## MVP Constraints
Build:

- payment review sheet
- successful entry state
- failed payment state
- locked-contest protection state
- duplicate-entry state
- canceled-contest messaging
- payout confirmation messaging
- basic wallet balance display
- withdrawal entry point / provider-backed path

Do not build:

- full wallet dashboard
- transaction filtering
- manual withdrawal operations
- peer-to-peer transfers
- promo code UI
- tipping/referrals
- advanced receipts
- user-managed payment-method dashboard unless provider requires it

---

## Open Decisions
Need to decide:

1. payment processor
2. payout / withdrawal provider
3. whether cash deposits are allowed or only per-entry external charges
4. KYC / identity verification requirements
5. minimum withdrawal amount
6. withdrawal timing and fees
7. chargeback handling process
8. payment provider support for skill-based contests

---

## App Rules Copy

> Before entering a contest, you will see how your entry fee is covered by site credit, cash balance, and any amount due today. Winnings are added to your cash balance. Site credit can be used for future contests but cannot be withdrawn.
