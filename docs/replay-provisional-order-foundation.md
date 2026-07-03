# Replay Provisional Order Foundation

## Purpose

Add a live-data foundation for provisional NFL QB passing-yard ordering without mixing mid-game data into the official final-results path.

## Separation Rule

PickRank now treats these as two different internal paths:

- `provisional_order`: live or partially complete QB ordering used for future live-leaderboard work
- `official_final`: human-reviewed final stat input that still gates saved leaderboard and results publishing behind typed `FINAL`

The provisional path must never overwrite `contest_player_results`, saved entry scoring, or the public final-results screens.

## Internal Snapshot Model

Each provisional snapshot stores:

- `snapshotKind`: always `provisional_order`
- `contestId`
- `providerKey`: provider-specific adapter key such as `sportsdataio_replay`
- `providerName`
- `providerSnapshotTime`
- `status`
- game completion summary:
  - `gamesTotal`
  - `gamesScheduled`
  - `gamesInProgress`
  - `gamesFinal`
  - `allGamesFinal`
- ordered QB rows with:
  - internal player ID
  - provider player ID
  - provider game ID
  - player/team/opponent labels
  - `passingYards`
  - `passingTouchdowns`
  - `gameStatus`
  - `provisionalRank`
  - `provisionalRankMin`
  - `provisionalRankMax`
  - `provisionalRankDisplay`
  - `sortOrder`

## Ranking Rules

- Provisional ordering is based on passing yards only.
- If two quarterbacks have the same passing yards, they share a provisional rank range the same way final stat ties share a rank range.
- Passing touchdowns are carried for later official tiebreak support, but they do not break provisional passing-yard ties.
- Missing live stat rows default to zero yards and zero touchdowns while the slate game remains scheduled or otherwise unavailable in the live feed.

## Minimum SportsDataIO Replay Endpoints

PickRank should start with the smallest Replay set that covers live ordering plus final handoff:

1. `ScoresByWeek/{season}/{week}`
   - source of live game state and provider `ScoreID`
   - used to determine `scheduled`, `in_progress`, or `final`
2. `PlayerGameStatsByWeek/{season}/{week}`
   - source of live player passing yards and passing touchdowns across the contest week
   - used to build the provisional QB order snapshot
3. `PlayerGameStatsByWeekFinal/{season}/{week}`
   - handoff target once every slate game is final and an operator is ready to review official values
   - keeps the future official Replay path aligned to the same provider family without reusing provisional storage

Notes:

- The endpoint names above are based on the public SportsDataIO NFL v3 documentation.
- Replay is expected to use the same NFL operations with Replay-backed credentials or routing. If SportsDataIO provides a Replay-specific host or wrapper, keep the normalized output contract unchanged and swap only the adapter wiring.

## Persistence

- File-backed development storage: `data/contest-provisional-snapshots.json`
- Database tables:
  - `contest_provisional_stat_snapshots`
  - `contest_provisional_stat_snapshot_rows`

This keeps live provisional data audit-friendly while leaving the current final snapshot tables dedicated to the official finalization path.
