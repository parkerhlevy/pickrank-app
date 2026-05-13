# Tie Handling

## Purpose
Define how PickRank handles entry score ties in contest scoring, leaderboard placement, and payouts.

## Status
Locked for MVP.

## Anchor
MVP entry score tie handling uses true shared placements, `T-` display, skipped placement ranking, pooled payout splitting, no secondary entry score tie-breaker, and deterministic cent rounding by lowest `entry_id`.

## Important Distinction
This document covers **entry score ties**: two or more contest entries finishing with the same total score.

It does not define player stat ties, such as two quarterbacks finishing with the same passing yards. Player stat ties are handled in `/spec/features/stat_finalization.md`.

## Summary
PickRank contests allow true entry score ties. Entries with the same final score share the same leaderboard rank.

MVP does not use secondary entry score tie-breakers such as exact-pick count, entry timestamp, lineup uniqueness, closest aggregate miss distance, or random draw.

If a tie affects paid positions, the affected prize slots are pooled and split evenly across the tied entries.

## No Secondary Entry Score Tie-Breaker
For MVP, tied entries remain tied.

Do not break entry score ties using:

- most exact player placements
- closest aggregate miss distance
- earliest entry payment
- earliest lineup save
- fewest edits
- lineup uniqueness
- random draw
- account age
- external manual judgment

Reason:

- shared ties are simpler to explain
- pooled payout splitting is fair and transparent
- avoids hidden rules users did not optimize for
- reduces legal/compliance ambiguity around arbitrary tie-breaks

## Leaderboard Tie Rules

### Shared rank
Entries with the same final score share the same rank.

Example:

| Rank | Entry | Score |
|---:|---|---:|
| 1 | Entry A | 120 |
| T-2 | Entry B | 115 |
| T-2 | Entry C | 115 |
| 4 | Entry D | 110 |

### Ranking method
Use competition ranking.

That means tied entries occupy multiple rank positions, and the next rank skips ahead.

Example:

- 1st place
- T-2nd place
- T-2nd place
- 4th place

Do not use dense ranking for MVP.

### Display rule
Use a visible `T-` prefix for tied ranks.

Examples:

- `T-1`
- `T-2`
- `T-14`

If an entry is not tied, show the normal rank without the `T-` prefix.

## Payout Split Rules

### Core rule
If multiple entries tie and the tie affects paid positions, combine the prize amounts for the payout places occupied by the tied group and split the combined amount evenly across all entries in that tied group.

### Example: two-way tie for first
Prize table:

| Place | Prize |
|---:|---:|
| 1 | $100 |
| 2 | $60 |
| 3 | $40 |

Result:

| Rank | Entry | Score | Payout |
|---:|---|---:|---:|
| T-1 | Entry A | 120 | $80 |
| T-1 | Entry B | 120 | $80 |
| 3 | Entry C | 110 | $40 |

Calculation:

- Pool 1st + 2nd prizes: `$100 + $60 = $160`
- Split across 2 tied entries: `$160 / 2 = $80`

### Example: two-way tie for second
Prize table:

| Place | Prize |
|---:|---:|
| 1 | $100 |
| 2 | $60 |
| 3 | $40 |

Result:

| Rank | Entry | Score | Payout |
|---:|---|---:|---:|
| 1 | Entry A | 120 | $100 |
| T-2 | Entry B | 115 | $50 |
| T-2 | Entry C | 115 | $50 |

Calculation:

- Pool 2nd + 3rd prizes: `$60 + $40 = $100`
- Split across 2 tied entries: `$100 / 2 = $50`

### Example: tie crosses payout cutoff
Prize table:

| Place | Prize |
|---:|---:|
| 1 | $100 |
| 2 | $60 |
| 3 | $40 |

If two entries tie for 3rd, only the 3rd-place prize is available to that tied group.

Result:

| Rank | Entry | Score | Payout |
|---:|---|---:|---:|
| 1 | Entry A | 120 | $100 |
| 2 | Entry B | 115 | $60 |
| T-3 | Entry C | 110 | $20 |
| T-3 | Entry D | 110 | $20 |

Calculation:

- Pool 3rd prize only: `$40`
- Split across 2 tied entries: `$40 / 2 = $20`

## Edge Cases

### Tie outside paid positions
If tied entries do not occupy a paid position, no payout is awarded. The leaderboard still shows the shared tied rank.

### Tie partially crosses the payout cutoff
If a tied group starts in a paid position but extends beyond the final paid position, only the remaining paid prize slots are pooled and split across the entire tied group.

Example:

- Top 3 pays
- 2 entries tie for 3rd
- Only the 3rd-place prize is pooled
- Both tied entries split that prize

### Tie larger than remaining prize slots
If more entries are tied than there are remaining payout slots, pool only the remaining payout slots occupied by that tied rank group and split across all tied entries.

Example:

- Top 3 pays
- 5 entries tie for 2nd
- Pool 2nd + 3rd prizes
- Split that pool across all 5 tied entries

### All entries tie
If all entries tie for 1st place:

- All entries display as `T-1`
- Pool all available prize slots
- Split the pool evenly across all entries

### No paid positions
If a contest has no paid positions, tied ranks still display normally, but no payout logic applies.

### Zero-dollar payout slots
If a payout slot is configured as `$0`, it may be included in the occupied payout slot calculation but does not increase the pooled payout amount.

## Rounding Rule
Payout calculations must be deterministic.

When a pooled payout does not divide evenly to the cent:

1. Calculate the exact split.
2. Round each tied payout down to the nearest cent.
3. Calculate leftover cents.
4. Distribute leftover cents one cent at a time by lowest `entry_id` first.

Example:

- Pool: `$200`
- Tied entries: `3`
- Exact split: `$66.666...`
- Rounded down base payout: `$66.66`
- Total distributed before remainder: `$199.98`
- Leftover: `$0.02`
- Lowest two `entry_id` values receive one extra cent.

Final payouts:

- Entry with lowest `entry_id`: `$66.67`
- Entry with second-lowest `entry_id`: `$66.67`
- Entry with third-lowest `entry_id`: `$66.66`

## Backend Requirements
Backend should persist enough final contest data to avoid recalculating tie outcomes inconsistently across screens.

Recommended fields:

- `final_rank`
- `final_rank_display`
- `is_tied`
- `tie_group_id`
- `tie_group_size`
- `payout_amount`

Backend logic:

1. Sort finalized entries by `total_score` descending.
2. Group entries with identical `total_score`.
3. Assign shared competition ranks.
4. Determine whether each tie group intersects paid positions.
5. Pool affected payout slots for each paid tie group.
6. Split pooled payout across tied entries.
7. Apply deterministic cent rounding by lowest `entry_id`.
8. Persist final rank and payout results.

## UX Requirements

### Leaderboard
Leaderboard must show:

- Rank or tied rank display
- Entry/user display name
- Total score
- Payout amount when contest is final and entry is in a paid position

Tied rows should display the same tied rank using the `T-` prefix.

### Results reveal
Results reveal should display tied rank status when applicable.

Examples:

- `You finished T-1`
- `You tied for 2nd place`
- `You tied for 14th place`

If the tie affects payout, include a short explanation:

> You tied for 2nd place. The affected prizes were combined and split evenly.

If the tie does not affect payout, no payout explanation is needed.

## App Rules Copy
Use this user-facing rule copy in contest rules or help text:

> If two or more entries finish with the same final score, they share the same placement. If the tie affects paid positions, the prizes for those positions are combined and split evenly among all tied entries.

## Non-MVP / Future Considerations
Do not build secondary entry score tie-breakers for MVP.

Potential future tie-breaker concepts, if needed later:

- Most exact picks
- Closest aggregate miss distance
- Earliest entry submission
- Random draw
- Custom contest-level tie-break rules

These are intentionally out of scope for MVP.
