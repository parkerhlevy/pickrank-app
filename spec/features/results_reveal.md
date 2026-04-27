# Results Reveal

## Purpose
Deliver the core reward moment immediately after contest completion.

## Key Principles
- Results load instantly.
- No staged reveal animation.
- Show personal results first.
- Keep the full player breakdown optional.

## Screen Structure
1. Result Header
2. Finish Position
3. Total Score
4. Best Unique Pick
5. Picks Summary
6. Expandable Player Breakdown
7. Leaderboard CTA
8. Enter Next Contest CTA

## Default State
The default view should fit on one mobile screen whenever possible.

Example:

```text
FINAL RESULTS
Week 7 QB Passing Yards

You finished
147th

Your Score
78 pts

Best Unique Pick
Josh Allen
You: 1 | Field: 6 | Actual: 1st
+15 pts

Picks Summary
Exact Picks: 2 (+30 pts)
Close Picks: 4 (+20 pts)
Avg Miss Distance: 6 spots

View Player Breakdown ↓

View Leaderboard →
Enter Next Contest
```

## Best Unique Pick
Highlights the pick where the user diverged from the field and was correct.

Suggested formula:

```text
unique_score = abs(user_rank - field_avg_rank) * points_earned
```

Rules:
- Only picks with points_earned > 0 qualify.
- If no pick qualifies, hide this section.
- Display field average rank as a rounded whole-number rank.

## Picks Summary
Use a hybrid format that shows both accuracy and score contribution.

Format:

```text
Exact Picks: X (+points)
Close Picks: X (+points)
Avg Miss Distance: X spots
```

Definitions:
- Exact = distance 0
- Close = distance 1–3
- Miss = distance 4+

Average miss distance:
- Calculated only from misses.
- Rounded to the nearest whole number.
- Hidden if the user has no misses.

Formula:

```text
avg_miss_distance = round(sum(miss_distances) / len(miss_distances))
```

## Player Breakdown
Collapsed by default.

Trigger:

```text
View Player Breakdown ↓
```

When tapped, the breakdown expands inline on the same screen.

Rules:
- Ordered by the user's ranking order.
- Do not sort by points earned.
- Use ordinal style for actual finish.

Row format:

```text
#1 Josh Allen (BUF)
You: 1 | Actual: 1st | +15
```

## Visual Cues
- Green = exact
- Yellow = close
- Gray = miss

## Navigation
After the summary and optional breakdown, show:

```text
View Leaderboard →
Enter Next Contest
```

Leaderboard should open centered on the user's position.
