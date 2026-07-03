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
18 pts

Best Unique Pick
Josh Allen
You: 1 | Field: 6 | Actual: 1st
0 pts

Picks Summary
Exact Picks: 2
One-Off-Or-Better Picks: 4
Avg Miss Distance: 6 spots

View Player Breakdown ↓

View Leaderboard →
Enter Next Contest
```

## Best Unique Pick
Highlights the pick where the user diverged from the field and was correct.

Suggested selection order:

```text
1. lowest points_earned
2. largest abs(user_rank - field_avg_rank)
3. lowest user_rank
```

Rules:
- Only picks with the lowest available miss score should be considered first.
- If no pick qualifies, hide this section.
- Display field average rank as a rounded whole-number rank.

## Picks Summary
Use a hybrid format that shows accuracy plus miss direction.

Format:

```text
Exact Picks: X
One-Off-Or-Better Picks: X
Avg Miss Distance: X spots
```

Definitions:
- Exact = distance 0
- One-Off-Or-Better = distance 0-1
- Miss = distance 2+

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
You: 1 | Actual: 1st | 0 pts
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
