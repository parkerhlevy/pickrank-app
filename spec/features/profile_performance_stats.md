# Profile Performance Stats

## Status

This specification defines the private `My Stats` experience on `/profile` for PickRank V1.

## Product Goal

Give an active player a compact record of completed-contest performance without changing Results or adding a public profile. The hierarchy uses a clear identity area, lifetime summary, and recent performance while retaining the existing PickRank design system.

## Placement and Access

- Keep `Profile` as the route and navigation label.
- Show `My Stats` only to the signed-in viewer whose Profile is complete and whose account is not restricted.
- Place `My Stats` before Profile information, entry status, support, sign-out, and future wallet content.
- Keep signed-out access, incomplete-Profile setup, restricted-account guidance, and return-to-contest behavior unchanged and ahead of stats when action is required.
- Do not accept a player identifier from the URL or browser. The server query must use the authenticated viewer user ID.

## Eligible Results

Include one saved result when all of these conditions are true:

- the result belongs to the signed-in viewer
- the contest is visible
- the contest status is `final` or `paid_out`
- the viewer has at least one saved player-score row for the entry

Exclude provisional, live, finalizing, canceled, hidden, and incomplete-board entries.

Use the latest saved `entry_scoring_results` and `entry_player_scores` rows so corrected results appear automatically. Calculate the field size from the saved scoring-result rows for the same contest.

## Lifetime Metrics

`Contests completed`

- Count eligible saved final contest results.

`Best finish`

- Use the lowest saved final rank.
- Show a shared rank with the `T-` prefix, for example `T-2 of 58`.
- If equal ranks exist, select the result with the larger field size.
- If the rank and field size are equal, select the most recently finalized result.

`Top-3 finishes`

- Count eligible results with a final rank of 3 or better.
- Include shared ranks.

`Exact pick rate`

- Divide exact picks by all saved player-score rows in eligible results.
- Show the percentage and the supporting count, for example `14 of 50 picks`.
- Do not assume a fixed number of picks per contest.

`Within one spot`

- Divide exact picks and picks one rank away by all saved player-score rows in eligible results.
- Present this as a secondary accuracy metric with its supporting count.

## Recent Results

Show the five most recently finalized eligible contests. Each row includes:

- contest name
- finalization date
- placement and field size
- saved score
- exact-pick count and saved-pick denominator
- a keyboard-accessible `View result` link to the existing personal contest result route

Order rows by finalization time from newest to oldest. Use a stable contest identifier as the final tie-breaker.

## States

Ready:

- show the lifetime summary, secondary accuracy metric, and recent results

Empty:

- show `Your stats will appear after your first completed contest.`
- include `View contests`

Unavailable:

- show `Stats are unavailable right now. Your saved results are not affected.`
- keep all Profile and account controls usable

## Data and Interface Boundary

Use the internal server-only `getProfilePerformanceStats(viewerUserId)` query. It returns a typed `ready`, `empty`, or `unavailable` result with lifetime totals, accuracy totals, and recent rows.

V1 reads the existing `entry_scoring_results`, `entry_player_scores`, and contest records. It adds no public API, public Profile route, aggregate stats table, cache, Row Level Security policy, database migration, production backfill, or production-data mutation.

## Deferred Work

Season filters, trend charts, streaks, achievements, player levels, ratings, public profiles, sharing, and cross-format comparisons remain deferred until PickRank has enough completed-contest data to define them honestly.
