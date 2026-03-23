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
$12,450  
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
Prize Pool: $4,200  
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
Prize Pool: $12,450  
1,284 Entries
Projected Payouts
1st: $6,000  
2nd: $3,000  
3rd: $1,500
Enter Contest
Post Entry State
Primary button becomes: Edit Lineup
---
8. Lineup Builder
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
9. Contest Lock State
Once the contest locks: - lineup editing disabled - leaderboard becomes
available
---
10. Live Leaderboard
Leaderboard updates during games.
Refresh interval: ~60 seconds
Display Format
Rank  
Username  
Points
Example:
1 User123 67 pts  
2 QBWizard 65 pts  
3 StatMaster 64 pts
User Position
Leaderboard opens centered on the user's position.
Example:
176 GridironPro 43 pts  
177 QBWizard 43 pts  
178 You 42 pts  
179 SportsFan22 42 pts
User row highlighted.
Leaderboard Restrictions (MVP)
No: - leaderboard search - rank movement indicators - projections - stat
breakdowns
---
11. Results Reveal (Next Design Phase)
After all games finish:
Leaderboard becomes final.
A results reveal screen will show: - final position - final score -
winnings - player-by-player breakdown
This screen will deliver the core reward moment.
---
12. Contest Rules
For MVP: Single entry per user
Future: Multi-entry contests
---
13. Data Model (Initial)
Contest
contest_id
contest_name
stat_type
slate_players[]
entry_fee
prize_pool
entries_count
lock_time
Entry
entry_id
user_id
contest_id
player_rankings[]
score
Player Result
player_id
final_stat
final_rank
---
14. Future Features
Leaderboard: - movement indicators - friend leaderboard
Lobby: - sorting - search - filters
Contest: - multi-entry contests - payout ladder
---
15. Anchor Statement
We've locked the MVP game structure, contest lobby with a featured
contest, manual contest ordering, contest entry screen layout, lineup
builder interaction model (drag handle, floating save button,
alphabetical default lineup), and a live leaderboard that updates during
games and opens centered on the user's position.
Next we will design the Results Reveal experience and finalize how final
standings and winnings are presented.
