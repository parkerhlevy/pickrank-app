NFL PickRank
Master Product Specification
Version 0.1
---
1. Product Definition
Product Name
PickRank (working title)
Product Type
Skill-based NFL prediction contest.
Core Mechanic
Users rank a slate of players by projected stat outcome. Points are
awarded based on how close their rankings are to the final results.
The highest total score wins the contest.
---
2. Core Game Loop
Lobby → Contest Entry → Lineup Builder → Contest Lock → Live Leaderboard
→ Final Results Reveal
This loop repeats weekly during the NFL season.
Lifecycle System
Contest progression is controlled by explicit states:
draft → scheduled → open → locked → canceled / live → finalizing → final → paid_out
Detailed design:
See /spec/features/contest_lifecycle.md
---
3. Contest Structure
Contest Type (MVP)
Stat Category: QB Passing Yards  
Slate Size: 15 quarterbacks  
User Task: Rank QBs by passing yards
Contest Lock
Entries lock at kickoff of the first game of the slate (typically
Thursday Night Football).
After lock: - lineups cannot be edited - contest scoring begins
Contest Viability
A contest must have at least 4 paid entries to run.
If a contest has fewer than 4 paid entries at lock time, the contest is canceled and entry fees are refunded as site credit.
MVP contests use dynamic prize pools only. Guaranteed prize pools are out of scope for MVP.
Detailed design:
See /spec/features/contest_viability.md
---
4. Scoring System
Placement Distance Scoring
Distance   Points
---
Exact      15
1 off      7
2 off      5
3 off      3
4+ off     0
Score Calculation
distance = abs(user_rank - actual_rank)  
points = scoring_table[distance]
Total score = sum of all player points.
---
5. Navigation Structure
Bottom navigation tabs:
Contests
Leaderboard
How It Works
Profile
---
6. Contest Lobby
Layout
Featured Contest  
↓  
Other Contests
Featured Contest Card
Displays:
Contest Title
Lock Time
Prize Pool
Entry Count
Enter Contest Button
Example:
FEATURED CONTEST  
Week 7 QB Passing Yards  
Entries lock: Thu 8:15 PM ET
$8,715  
Prize Pool
1,284 Entries
Enter Contest
Other Contest Cards
Display:
Contest Title
Lock Time
Prize Pool
Entry Count
Example:
Week 7 RB Rushing Yards  
Entries lock: Thu 8:15 PM ET
Prize Pool: $2,940  
842 Entries
Contest Ordering
Ordering is manually controlled.
Purpose: - promote specific contests - manage liquidity - highlight new
formats
Future additions: - sorting - search - filters
---
7. Contest Entry Screen
Layout
Contest Title  
Lock Time
Slate Size  
Contest Instruction
Prize Pool  
Entry Count
Projected Payouts
Enter Contest
Example:
Week 7 QB Passing Yards  
Entries lock: Thu 8:15 PM ET
15 Quarterbacks  
Rank QBs by passing yards
Prize Pool: $8,715  
1,284 Entries
Projected Payouts
1st: $4,357.50  
2nd: $2,614.50  
3rd: $1,743.00
Enter Contest
Post Entry State
Primary button becomes: Edit Lineup
Payment UX:
Users see a payment review step before entry confirmation. Site credit and cash balance are applied before external payment. Entries are created only after payment succeeds.
Detailed design:
See /spec/features/payment_wallet_ux.md
---
8. Platform Fee & Payout Model
Platform Fee
PickRank applies a platform fee before contest payouts.
Default MVP platform fee: 30% of total entry fees.
Prize Pool
Prize pool equals 70% of total entry fees.
total_entry_fees = entry_fee * entries_count
platform_fee = total_entry_fees * 0.30
prize_pool = total_entry_fees * 0.70
Default Payout Structure
Payouts are calculated as percentages of the prize pool:
1st place: 50%
2nd place: 30%
3rd place: 20%
Payout Guardrail
Total payouts must never exceed the available prize pool.
Rounding should be deterministic and should preserve total payout accuracy.
Tie Handling
If a tie affects paid positions, affected payout slots are combined and split evenly among tied entries.
Detailed design:
See /spec/features/tie_handling.md
Wallet + Site Credit:
PickRank uses separate cash and site credit balances. Contest winnings are credited to cash balance. Canceled-contest refunds are credited as site credit. Site credit cannot be withdrawn. External payment infrastructure and a cash withdrawal path are required before public real-money launch.
Detailed design:
See /spec/features/wallet_site_credit.md
---
9. Lineup Builder
This is a dedicated editing screen separate from other app content.
Default Player Order
Players appear in alphabetical order by last name.
Example:
1 Josh Allen  
2 Joe Burrow  
3 Derek Carr  
4 Justin Herbert  
5 Jalen Hurts
If the user makes no changes, the alphabetical order becomes the
submitted lineup.
Ranking Interaction
Players are reordered using a drag handle icon.
Interaction:
Press and hold drag handle\
Move player\
Release to drop
Save Interaction
A floating button appears when changes are made.
Save Lineup
When saved:
✓ Lineup Saved
Confirmation banner disappears after ~2 seconds.
Unsaved Changes Modal
Unsaved lineup changes
Save before leaving?
Save Lineup  
Discard Changes  
Cancel
First-Time Hint
Press and hold the ≡ icon to drag players into your rankings.
---
10. Contest Lock State
Once the contest locks: - lineup editing disabled - leaderboard becomes
available
At lock time, the system also checks contest viability. If the minimum paid entry threshold is not met, the contest is canceled instead of scored.
---
11. Live Leaderboard
MVP does not show live scoring during games.
Leaderboard is unavailable or placeholder-only until final results are calculated.
Display Format once final:
Rank  
Username  
Points
Example:
1 User123 67 pts  
2 QBWizard 65 pts  
3 StatMaster 64 pts
User Position
Final leaderboard opens centered on the user's position.
Example:
176 GridironPro 43 pts  
177 QBWizard 43 pts  
178 You 42 pts  
179 SportsFan22 42 pts
User row highlighted.
Leaderboard Restrictions (MVP)
No: - leaderboard search - rank movement indicators - projections - stat
breakdowns - live score updates
---
12. Results Reveal

Purpose: Deliver the core reward moment after contest completion.

Displays:
- final position
- final score
- winnings
- player-by-player breakdown

Detailed design:
See /spec/features/results_reveal.md
---
13. Contest Rules
For MVP: Single entry per user
Contest must reach at least 4 paid entries by lock time to run.
Future: Multi-entry contests
---
14. Data Model (Initial)
Contest
contest_id
contest_name
stat_type
slate_players[]
entry_fee
total_entry_fees
platform_fee_percentage
platform_fee_amount
prize_pool
payout_structure
entries_count
paid_entries_count
min_entries_to_run
contest_status
entry_open_time
lock_time
finalized_at
paid_out_at
canceled_at
cancel_reason
state_version
Entry
entry_id
user_id
contest_id
player_rankings[]
entry_status
payment_status
lineup_status
score
final_rank
final_rank_display
is_tied
payout_amount
payout_status
Player Result
player_id
final_stat
final_rank
Wallet Balance
user_id
cash_balance
site_credit_balance
updated_at
Wallet Ledger Transaction
transaction_id
user_id
transaction_type
balance_type
amount
contest_id
entry_id
external_payment_id
external_payout_id
created_at
metadata
Contest State Event
event_id
contest_id
from_status
to_status
trigger
created_at
metadata
---
15. Future Features
Leaderboard: - movement indicators - friend leaderboard - live scoring leaderboard
Lobby: - sorting - search - filters
Contest: - multi-entry contests - variable payout ladders - variable platform fees - guaranteed prize pools - private/capped contests - admin lifecycle dashboard - dispute workflow
Payments: - standalone deposits - expanded wallet history - payment provider reconciliation dashboard - tax reporting flows - chargeback tooling
---
16. Anchor Statement
We've locked the MVP game structure, scoring, leaderboard behavior, tie handling, payout structure, 30% platform fee, contest viability rules, wallet/site credit system, payment UX direction, and contest lifecycle state machine from draft through paid_out.
Next we will define contest data provider requirements and stat finalization rules.
