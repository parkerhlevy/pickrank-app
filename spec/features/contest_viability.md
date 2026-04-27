# Contest Viability

## Purpose
Define the rules that determine whether a contest runs, cancels, or refunds users based on participation levels.

## Status
Locked for MVP.

## Anchor
MVP contests require a minimum number of paid entries to run. Contests that do not meet the threshold are canceled and refunded as site credit.

## Core Rule

A contest must have at least **4 paid entries** at lock time to run.

## Behavior at Lock

At contest lock time:

- If **entries ≥ 4** → contest runs normally
- If **entries < 4** → contest is canceled

## Cancellation Flow

If a contest is canceled:

- Lineups are not scored
- No leaderboard is generated
- No results reveal is shown
- All entry fees are refunded as **site credit**
- Contest status is set to `canceled`

## Prize Pool Model

MVP contests use **dynamic prize pools only**:

- Prize pool is based on actual paid entries
- Platform fee is applied before payouts
- No guaranteed prize pools
- No overlay risk

## Data Model Requirements

Contest fields:

- `entries_count`
- `min_entries_to_run` (default: 4)
- `contest_status` (values: upcoming, active, completed, canceled)

## Backend Logic

At lock time:

1. Count total paid entries
2. Compare against `min_entries_to_run`
3. If below threshold:
   - Set contest_status = canceled
   - Issue refunds as site credit
4. If threshold met:
   - Set contest_status = active
   - Proceed with scoring and leaderboard

## UX Requirements

### Lobby

- Show entry count clearly
- Do not show cancellation warning for MVP (keep simple)

### Post-Cancellation

Users should see:

- "Contest canceled due to insufficient entries"
- Confirmation that entry fee was refunded as site credit

## Non-MVP / Future Considerations

- Guaranteed prize pools
- Minimum fill % instead of fixed count
- Partial payouts for low-fill contests
- Contest merging or consolidation
- Real-time fill indicators or urgency messaging

These are intentionally out of scope for MVP.