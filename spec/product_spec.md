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
awarded as ranking miss distance against the final results. The
lowest total score wins the contest.
Compliance Direction
PickRank is framed as a paid skill-based contest, not sports betting. Public real-money launch requires legal/payment-provider review, supported jurisdiction definition, age/eligibility controls, and responsible play requirements.
Detailed design:
See /spec/features/compliance_eligibility_responsible_play.md

Early Access Beta Launch Mode
PickRank launches first as Early Access Beta with free-to-play contests only.
Beta contests use a Beta Pass model. The Beta Pass grants free beta entry access, has no cash value, cannot be withdrawn, and does not create payouts or cash prizes.
Paid contests remain the future product direction, but public paid entry, deposits, withdrawals, payouts, cash-balance movement, KYC vendor integration, geolocation enforcement, and state-by-state paid eligibility remain blocked until legal, provider, payment, withdrawal, and compliance review is complete.
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
Frontend Navigation
MVP frontend uses bottom-tab navigation with public browsing, auth-gated paid entry, eligibility-gated payment, entry-gated lineup access, final-only leaderboard/results, and internal admin setup screens.
Detailed design:
See /spec/features/frontend_navigation.md
Implementation Roadmap
MVP should be built in phases, starting with playable test/free-entry contests before real-money payments and withdrawals.
Detailed design:
See /spec/features/implementation_roadmap.md
QA Acceptance Criteria
MVP QA must verify the full contest loop, money-adjacent logic, scoring, eligibility, wallet ledger, refunds, payouts, and results display before beta or real-money launch.
Detailed design:
See /spec/features/qa_acceptance_criteria.md
Open Questions + Decision Log
MVP open questions and launch-critical unresolved decisions are tracked in:
See /spec/features/open_questions_decision_log.md
Technical Stack Recommendation
MVP recommended stack is Next.js, TypeScript, Supabase/Postgres/Auth, Vercel, Tailwind/shadcn, Vitest, Playwright, and a GitHub-first AI build workflow using Codex or Claude Code with Cursor for local review.
Detailed design:
See /spec/features/technical_stack_recommendation.md
Phase 0 Implementation Plan
The first implementation phase establishes the runnable Next.js/Supabase foundation, route shell, folder structure, env setup, test tooling, and smoke tests before feature development begins.
Detailed design:
See /spec/features/phase_0_implementation_plan.md
---
3. Contest Structure
Contest Type (MVP)
Stat Category: QB Passing Yards  
Slate Size: 20 quarterbacks
User Task: Pick and rank the top 10 QBs by passing yards from the 20-QB player pool
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
Rank Differential Scoring
Distance   Points
---
Exact      0
1 off      1
2 off      2
3 off      3
4 off      4
5+ off     actual miss distance
Score Calculation
distance = abs(user_rank - actual_rank)  
points = distance
Total score = sum of points from the user's 10 selected QBs.
Lowest total score wins.
Actual rank is always measured against the full 20-QB player pool, not only against the user's selected 10.
Leaderboard Tie Resolution
If two entries finish with the same total score, resolve the order
using these tiebreakers in sequence:
1. most exact picks
2. most one-off-or-better picks
3. closest placement of the actual QB1
4. more passing touchdowns from the quarterback the user ranked #1
5. if still tied, compare passing touchdowns from the user's selected QB2, then QB3, then QB4, then QB5 in order
If entries remain tied after that locked tiebreak tree, they share the
same final placement and tie-based payout handling applies.
Player Stat Ties
If multiple players finish with the same final stat, they share an actual rank range. A user receives distance 0 if the player is placed anywhere inside that tied actual rank range.
Detailed design:
See /spec/features/stat_finalization.md
---
5. Navigation Structure
Bottom navigation tabs:
Home
Contests
Leaderboard
Profile
Wallet remains accessible through Profile and `/wallet`.
How It Works remains a major education screen, but it is reached through prominent secondary links rather than the bottom nav.
Detailed screen map:
See /spec/features/frontend_navigation.md
---
6. Account + Authentication
Users must have a verified account before entering paid contests.
MVP uses Supabase-backed authentication with currently supported Google and magic-link email sign-in, unique username/display name, basic Profile screen, account status, wallet access, and eligibility hooks for age, jurisdiction, and KYC/provider verification.
During Early Access Beta, users must sign in, choose a public username, supply date of birth for the 18+ beta age check, supply state/jurisdiction, accept Beta Terms, and accept the Privacy Policy before free beta entry. These beta acknowledgements are not public real-money eligibility approval.
Detailed design:
See /spec/features/account_profile_auth.md
---
7. Compliance + Eligibility
Paid contest entry must be blocked unless the user is eligible by account status, age, jurisdiction, verification status, and responsible play restrictions.
MVP supports configurable jurisdiction rules, age gates, KYC placeholders, self-exclusion placeholders, eligibility event logging, and legal/provider review gates.
Current eligibility capture is not the same as verified public real-money eligibility. Date of birth, jurisdiction, Terms acceptance, and Privacy acceptance are self-attested or captured account fields until legal/provider review, KYC/identity requirements, jurisdiction rules, payment/withdrawal approval, responsible-play requirements, and auditable reviewer controls are complete. Internal testing eligibility may be used only for known founder/operator/QA/test accounts in controlled no-money flows.
Early Access Beta free entry may use completed beta acknowledgements without marking an account eligible for public paid entry. Paid entry remains fail-closed.
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
20 Quarterbacks
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

Early Access Beta exception:
Free beta users enter from Contest Detail through the same server-authoritative entry creation path, then route directly to Build Your Board. They do not visit Entry Review or Entry Success. The payment and success routes remain parked for future paid contests.
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
1 User123 22 pts  
2 QBWizard 24 pts  
3 StatMaster 27 pts
User Position
Final leaderboard opens centered on the user's position.
Example:
176 GridironPro 58 pts  
177 QBWizard 58 pts  
178 You 55 pts  
179 SportsFan22 55 pts
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
Scoring direction is locked for MVP: each selected player receives `abs(user_rank - actual_rank)` points, all 10 selected player differentials are summed, and the lowest total score wins. Actual rank is measured against the full 20-QB player pool. Player stat ties use the same tied actual rank range logic as the rest of MVP scoring.
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
17. Frontend Screen Map
Detailed MVP frontend routes and navigation guards are defined in:
See /spec/features/frontend_navigation.md

Core routes:
/contests
/contests/:contest_id
/auth
/contests/:contest_id/payment
/entries/:entry_id/lineup
/entries/:entry_id/results
/contests/:contest_id/leaderboard
/profile
/profile/wallet
/profile/wallet/withdraw
/how-it-works
/admin/contests
/admin/contests/new
/admin/contests/:contest_id/edit
/admin/contests/:contest_id/validate
/admin/contests/:contest_id/preview
---
18. Implementation Roadmap
Detailed MVP build phases are defined in:
See /spec/features/implementation_roadmap.md

Recommended order:
0. Project Foundation
1. App Shell + Navigation
2. Auth + Profile
3. Contest Lobby + Detail
4. Admin Contest Setup
5. Entry + Lineup Builder without real money
6. Contest Lifecycle Jobs
7. Scoring Engine + Manual/Test Stats
8. Results Reveal + Final Leaderboard
9. Wallet Ledger Foundation
10. Eligibility + Compliance Gates
11. External Sports Data Provider
12. Payment Provider Integration
13. Withdrawal Provider Integration
14. Notifications
15. Internal QA + Simulation Testing
16. Beta Launch Preparation
---
19. QA Acceptance Criteria
Detailed MVP QA plan is defined in:
See /spec/features/qa_acceptance_criteria.md

Launch-blocking test areas:
Account/auth
Contest admin setup
Contest lobby/detail
Entry/payment
Lineup builder
Contest lifecycle
Scoring
Tie handling
Wallet ledger
Eligibility/compliance
Results reveal
Leaderboard
Provider/stat finalization
---
20. Open Questions + Decision Log
Detailed MVP open questions and decision status are tracked in:
See /spec/features/open_questions_decision_log.md

Primary open decisions:
Payment provider
Withdrawal provider
Sports data provider
Auth provider
Backend/database stack
Frontend framework
First launch surface
Hosting/deployment stack
State-by-state legal/payment review
KYC provider
Beta scope details
---
21. Technical Stack Recommendation
Detailed MVP stack and AI build workflow recommendation is defined in:
See /spec/features/technical_stack_recommendation.md

Recommended stack:
Next.js
TypeScript
Supabase Postgres
Supabase Auth
Vercel
Tailwind + shadcn/ui
Vitest
Playwright
Codex or Claude Code for GitHub-connected implementation
Cursor for local review/editing
---
22. Phase 0 Implementation Plan
Detailed Phase 0 setup instructions are defined in:
See /spec/features/phase_0_implementation_plan.md

Phase 0 establishes:
Next.js app foundation
TypeScript setup
Tailwind/shadcn setup
Supabase client/server structure
env example
route shell
bottom navigation placeholder
test tooling
smoke tests
seed/test data approach
---
23. Future Features
Leaderboard: - movement indicators - friend leaderboard - live scoring leaderboard
Lobby: - sorting - search - filters
Contest: - multi-entry contests - variable payout ladders - variable platform fees - guaranteed prize pools - private/capped contests - admin lifecycle dashboard - dispute workflow
Payments: - standalone deposits - expanded wallet history - payment provider reconciliation dashboard - tax reporting flows - chargeback tooling
Stats: - provider redundancy - stat dispute workflow - live stat tracking - additional stat categories - optional QB stat tie-breaker testing using interceptions, rushing yards, TDs, or other secondary stats
Admin: - automated weekly contest generation - bulk contest creation - role-based permissions - clone previous contest workflow
Account: - social login - avatars - public user stats - friend leaderboard - referral system - responsible gaming controls - self-exclusion tooling - enhanced KYC/location verification
Compliance: - geolocation provider integration - tax document dashboard - jurisdiction-specific terms - compliance admin dashboard - responsible play limits
Backend: - worker queues - event bus - admin audit viewer - analytics warehouse - fraud/risk scoring - provider redundancy system
Frontend: - live contest tracker - private leagues tab - friends/social tab - user history - wallet transaction history - support/dispute center
---
24. Anchor Statement
We've locked the MVP product rules, compliance direction, account requirements, contest lifecycle, stat finalization, admin setup, wallet/payment behavior, backend data architecture, frontend screen map/navigation architecture, implementation roadmap/build phases, QA acceptance criteria, open questions/decision log, MVP technical stack recommendation, and Phase 0 implementation plan.
Next step is to switch to a new implementation chat and start Phase 0 build execution.
