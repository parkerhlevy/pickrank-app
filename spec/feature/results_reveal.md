Results Reveal Screen (MVP — Detailed UX Spec)
Purpose: Deliver the core reward moment immediately after contest completion.

Results must load instantly. No staged reveal or animation sequence is used because all scoring is already calculated when results become available.

Screen Hierarchy
Result Header
Finish Position
Total Score
Best Unique Pick
Picks Summary
Expandable Player Breakdown
Leaderboard CTA
Enter Next Contest CTA
The first five sections should fit within a single mobile screen height whenever possible.

Result Header
Displays contest name and state.

Example:

FINAL RESULTS
Week 7 QB Passing Yards

Finish Position
Primary emotional feedback element.

Example:

You finished
147th

If the user finishes in a paying position, winnings are displayed directly below.

Total Score
Displayed prominently but secondary to finish position.

Example:

Your Score
78 pts

Best Unique Pick
Highlights the pick where the user most diverged from the field and was validated by the outcome.

Required inputs:

player_id
user_rank
field_average_rank
actual_rank
points_earned

Suggested scoring logic:

unique_pick_score = abs(user_rank - field_average_rank) * points_earned

Rules:

Only picks earning points (>0) are eligible.
If no qualifying pick exists, this section is hidden.
Example display:

Best Unique Pick

Josh Allen
You: 1 | Field: 6 | Actual: 1st
+15 pts

Picks Summary
Hybrid format showing both accuracy counts and score contribution.

Format:

Exact Picks: X (+points)
Close Picks: X (+points)
Avg Miss Distance: X spots

Definitions:

Exact = distance 0
Close = distance 1–3
Miss = distance ≥4

Average miss distance is calculated only from misses.

avg_miss_distance = round(sum(miss_distances) / len(miss_distances))

Miss distances are rounded to the nearest whole number for display.

Example:

Exact Picks: 2 (+30 pts)
Close Picks: 4 (+20 pts)
Avg Miss Distance: 6 spots

If the user has zero misses, the Avg Miss Distance line is hidden.

Player Breakdown (Expandable Inline)
Collapsed by default.

Trigger:

View Player Breakdown ↓

When expanded, the list appears inline beneath the summary.

Rows are ordered by the user's ranking order, not by points earned.

Row format:

#Rank Player Name (TEAM)
You: X | Actual: Xth | +points

Example:

#1 Josh Allen (BUF)
You: 1 | Actual: 1st | +15

#2 Patrick Mahomes (KC)
You: 2 | Actual: 4th | +5

#3 Justin Herbert (LAC)
You: 3 | Actual: 9th | 0

Visual cues:

Green = exact
Yellow = close (1–3 off)
Gray = miss (4+ off)

Row height should remain approximately 60–70px to match the card builder list.

Navigation Actions
Two primary actions appear after the summary.

View Leaderboard →
Enter Next Contest

Leaderboard opens centered on the user's position.
