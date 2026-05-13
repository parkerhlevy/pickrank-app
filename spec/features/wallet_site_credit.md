# Wallet + Site Credit System

## Purpose
Define how PickRank handles user balances, contest entry fees, payouts, and canceled-contest refunds.

## Status
Locked for MVP direction. External payment provider and withdrawal provider still need vendor selection.

## Anchor
MVP wallet handling uses separate cash and site credit balances, charges entry fees before slate access, pays contest winnings to cash balance, refunds canceled contests as site credit, requires external payment infrastructure for real-money entry fees, and requires a cash withdrawal path before public real-money launch.

---

## Summary
PickRank uses a two-balance wallet model:

1. Cash balance
2. Site credit balance

The balances must remain separate because they represent different types of value.

Cash balance represents withdrawable user funds, including contest winnings.

Site credit represents non-withdrawable platform credit, primarily issued when a contest is canceled for not meeting the minimum entry threshold.

Real-money payments and withdrawals should be handled through external provider infrastructure. PickRank should not manually process payment cards, bank payouts, or withdrawal operations without a provider.

---

## User Balance Structure

### Cash balance
Cash balance may include:

- contest winnings
- future cash deposits, if supported
- manually issued cash adjustments, if needed operationally

Cash balance may be used for:

- entering contests
- withdrawal flows

Cash balance may be withdrawn only through a compliant provider-backed withdrawal process.

### Site credit balance
Site credit may include:

- refunds from canceled contests
- future promotional credits
- manual customer support credits

Site credit may be used for:

- entering future contests

Site credit may not be:

- withdrawn
- transferred to another user
- converted directly to cash
- used outside PickRank contests

---

## Entry Fee Handling

### Entry gate
Users must pay the contest buy-in before accessing the slate.

This remains Commitment 1:

- user pays buy-in
- contest entry is created
- randomized default lineup is saved
- slate becomes available

### Payment source priority
When entering a contest, apply funds in this order:

1. site credit balance
2. cash balance
3. external payment method, if needed

Example:

- Entry fee: `$5`
- Site credit balance: `$2`
- Cash balance: `$1`
- External payment required: `$2`

### Partial balance use
Users may combine site credit, cash balance, and external payment to cover one entry fee.

### External payment requirement
If site credit and cash balance do not fully cover the entry fee, the remaining amount must be paid through an external payment provider.

Provider selection is still open and must be resolved before real-money contest launch.

### Ledger requirement
Every entry fee transaction must create ledger records showing:

- amount taken from site credit
- amount taken from cash balance
- amount charged externally
- contest ID
- entry ID
- timestamp

---

## Contest Prize Pool Handling

### Gross entry fees
Gross entry fees include all paid entries, regardless of funding source.

Site credit used for entry still counts toward gross entry fees for contest economics.

### Platform fee
Platform fee remains locked at 30% of total entry fees.

### Prize pool
Prize pool remains 70% of total entry fees.

Formula:

```text
total_entry_fees = entry_fee * paid_entries_count
platform_fee = total_entry_fees * 0.30
prize_pool = total_entry_fees * 0.70
```

### Payout structure
Default MVP payout structure remains:

- 1st: 50% of prize pool
- 2nd: 30% of prize pool
- 3rd: 20% of prize pool

Tie handling follows `/spec/features/tie_handling.md`.

---

## Payout Flow

### When payouts happen
Payouts are calculated after:

1. all games in the contest are final
2. player final rankings are finalized
3. scores are calculated
4. leaderboard placements are finalized
5. tie handling is applied

### Where winnings go
Contest winnings are credited to cash balance.

Winnings are not credited as site credit.

### Withdrawal requirement
Users must have a way to withdraw cash balance winnings before public real-money launch.

MVP should include at least a basic provider-backed withdrawal path.

Site credit is never withdrawable.

### Payout ledger entries
Each payout must create a ledger record with:

- user ID
- contest ID
- entry ID
- final rank
- payout amount
- balance type: `cash`
- timestamp
- transaction type: `contest_payout`

### No negative payouts
Payouts may never reduce a user balance.

If an entry does not finish in a paid position, payout amount is `$0`.

---

## Canceled Contest Refund Logic

### Cancellation trigger
A contest is canceled if it has fewer than 4 paid entries at lock time.

### Refund type
Canceled-contest refunds are issued as site credit.

Do not refund canceled contests back to external payment method in MVP.

### Refund amount
Refund amount equals the original entry fee paid by the user for that contest.

Example:

- Entry fee: `$5`
- Contest canceled
- User receives `$5` site credit

### Mixed funding source rule
Even if the user paid with a mix of site credit, cash balance, and external payment, the full canceled-contest refund is returned as site credit.

Example:

- Entry fee: `$5`
- User paid `$2` site credit + `$3` external payment
- Contest canceled
- User receives `$5` site credit

### Refund timing
Refunds are issued immediately after the contest cancellation event is processed.

### Refund ledger entries
Each refund must create a ledger record with:

- user ID
- contest ID
- entry ID
- refund amount
- balance type: `site_credit`
- timestamp
- transaction type: `contest_canceled_refund`

---

## MVP Wallet UX

### Profile / Wallet display
MVP should show:

- Cash balance
- Site credit balance
- Withdraw entry point for cash balance, once provider path is available

### Entry screen display
Before entering a contest, show:

- entry fee
- available site credit
- cash balance applied, if any
- amount due today, if any

Example:

```text
Entry fee: $5
Site credit applied: $2
Cash balance applied: $1
Amount due today: $2
```

### Canceled contest message
Use this copy:

> This contest did not reach the minimum number of entries and was canceled. Your entry fee has been returned as site credit for a future contest.

### Payout message
Use this copy:

> Your winnings have been added to your cash balance.

---

## Backend Requirements

### Recommended data objects

#### Wallet balance

- `user_id`
- `cash_balance`
- `site_credit_balance`
- `updated_at`

#### Wallet ledger transaction

- `transaction_id`
- `user_id`
- `transaction_type`
- `balance_type`
- `amount`
- `contest_id`
- `entry_id`
- `external_payment_id`
- `external_payout_id`
- `created_at`
- `metadata`

#### Entry payment breakdown

- `entry_id`
- `user_id`
- `contest_id`
- `entry_fee`
- `site_credit_used`
- `cash_balance_used`
- `external_payment_amount`
- `payment_status`
- `created_at`

### Required transaction types

- `entry_fee_site_credit_debit`
- `entry_fee_cash_debit`
- `entry_fee_external_payment`
- `contest_payout`
- `cash_withdrawal_requested`
- `cash_withdrawal_completed`
- `cash_withdrawal_failed`
- `contest_canceled_refund`
- `manual_adjustment`

### Balance safety rules

- Never allow wallet balances to go below `$0`.
- Ledger entries should be append-only.
- Balance changes should be atomic.
- Entry creation should not succeed unless the full entry fee is covered.
- Payouts should not run more than once for the same contest entry.
- Canceled-contest refunds should not run more than once for the same contest entry.
- Withdrawals should not run more than once for the same withdrawal request.

---

## MVP Constraints

Build for MVP:

- separate cash and site credit balances
- site credit application to entry fees
- cash balance application to entry fees
- external payment fallback
- contest payout to cash balance
- provider-backed cash withdrawal path before real-money launch
- canceled-contest refund to site credit
- append-only wallet ledger
- wallet balance display in Profile
- entry fee payment breakdown on Contest Entry screen

Do not build for MVP:

- peer-to-peer transfers
- gift credits
- promo code system
- expiring credits
- bonus cash
- multi-currency support
- crypto payments
- tax reporting flows beyond provider/legal requirements
- chargeback management UI
- full payment operations dashboard

---

## Future Expansion

Potential future additions:

- deposits into cash balance as standalone wallet action
- promotional credit campaigns
- expiring site credits
- admin wallet adjustment tools
- payment provider reconciliation dashboard
- refund-to-original-payment-method support
- tax document generation
- suspicious wallet activity monitoring
- state-by-state payment restrictions

---

## Open Decisions
Need to decide:

1. payment processor
2. payout / withdrawal provider
3. whether users can deposit to cash balance or only pay per entry
4. KYC / identity verification requirements
5. minimum withdrawal amount
6. withdrawal timing and fees
7. chargeback handling process
8. payment provider support for skill-based contests

---

## App Rules Copy

Use this user-facing copy in Help or Contest Rules:

> Winnings are added to your cash balance. If a contest is canceled because it does not reach the minimum number of entries, your entry fee is returned as site credit that can be used for future contests. Site credit cannot be withdrawn.
