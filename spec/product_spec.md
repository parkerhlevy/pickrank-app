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
Compliance Direction
PickRank is framed as a paid skill-based contest, not sports betting. Public real-money launch requires legal/payment-provider review, supported jurisdiction definition, age/eligibility controls, and responsible play requirements.
Detailed design:
See /spec/features/compliance_eligibility_responsible_play.md
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
Backend Architecture
MVP backend uses server-authoritative contest state, eligibility checks, atomic entry/payment creation, append-only wallet ledger events, persisted scoring, and idempotent refunds/payouts.
Detailed design:
See /spec/features/backend_data_architecture.md
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
Contest Admin Setup
Weekly contests are created through an internal admin setup flow with validation before publish.
Detailed design:
See /spec/features/contest_admin_setup.md
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
Player Stat Ties
If multiple players finish with the same final stat, they share an actual rank range. A user receives distance 0 if the player is placed anywhere inside that tied actual rank range.
Detailed design:
See /spec/features/stat_finalization.md
---
5. Navigation Structure
Bottom navigation tabs:
Contests
Leaderboard
How It Works
Profile
---
6. Account + Authentication
Users must have a verified account before entering paid contests.
MVP uses email-based authentication, unique username/display name, basic Profile screen, account status, wallet access, and eligibility hooks for age, jurisdiction, and KYC/provider verification.
Detailed design:
See /spec/features/account_profile_auth.md
---
7. Compliance + Eligibility
Paid contest entry must be blocked unless the user is eligible by account status, age, jurisdiction, verification status, and responsible play restrictions.
MVP supports configurable jurisdiction rules, age gates, KYC placeholders, self-exclusion placeholders, eligibility event logging, and legal/provider review gates.
Detailed design:
See /spec/features/compliance_eligibility_responsible_play.md
---
8. Contest Lobby
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
9. Contest Entry Screen
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
10. Platform Fee & Payout Model
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
11. Lineup Builder
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
12. Contest Lock State
Once the contest locks: - lineup editing disabled - leaderboard becomes
available
At lock time, the system also checks contest viability. If the minimum paid entry threshold is not met, the contest is canceled instead of scored.
---
13. Live Leaderboard
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
14. Results Reveal

Purpose: Deliver the core reward moment after contest completion.

Displays:
- final position
- final score
- winnings
- player-by-player breakdown

Detailed design:
See /spec/features/results_reveal.md
---
15. Contest Rules
For MVP: Single entry per user
Contest must reach at least 4 paid entries by lock time to run.
Future: Multi-entry contests
---
16. Backend Data Model
Detailed MVP backend object and service design is defined in:
See /spec/features/backend_data_architecture.md

Core object groups:
User
User Eligibility
Compliance Eligibility Event
Jurisdiction Rule
Responsible Play Status
Contest
Contest Slate Player
Contest State Event
Contest Validation Result
Entry
Entry Lineup
Entry Payment Breakdown
Wallet Balance
Wallet Ledger Transaction
Contest Stat Snapshot
Player Contest Result
Entry Scoring Result
Entry Player Score
Notification Event
Admin Audit Event
---
17. Future Features
Leaderboard: - movement indicators - friend leaderboard - live scoring leaderboard
Lobby: - sorting - search - filters
Contest: - multi-entry contests - variable payout ladders - variable platform fees - guaranteed prize pools - private/capped contests - admin lifecycle dashboard - dispute workflow
Payments: - standalone deposits - expanded wallet history - payment provider reconciliation dashboard - tax reporting flows - chargeback tooling
Stats: - provider redundancy - stat dispute workflow - live stat tracking - additional stat categories - optional QB stat tie-breaker testing using interceptions, rushing yards, TDs, or other secondary stats
Admin: - automated weekly contest generation - bulk contest creation - role-based permissions - clone previous contest workflow
Account: - social login - avatars - public user stats - friend leaderboard - referral system - responsible gaming controls - self-exclusion tooling - enhanced KYC/location verification
Compliance: - geolocation provider integration - tax document dashboard - jurisdiction-specific terms - compliance admin dashboard - responsible play limits
Backend: - worker queues - event bus - admin audit viewer - analytics warehouse - fraud/risk scoring - provider redundancy system
---
18. Anchor Statement
We've locked the MVP product rules, compliance direction, account requirements, contest lifecycle, stat finalization, admin setup, wallet/payment behavior, and backend data architecture with server-authoritative state, atomic entry/payment creation, append-only wallet ledger, and idempotent refunds/payouts.
Next we will define the MVP frontend screen map and navigation architecture.
