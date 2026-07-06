# Replay Provisional Order Foundation

## Purpose

Add a live-data foundation for provisional NFL QB passing-yard ordering without mixing mid-game data into the official final-results path.

## Separation Rule

PickRank now treats these as two different internal paths:

- `provisional_order`: live or partially complete QB ordering used for future live-leaderboard work
- `official_final`: human-reviewed final stat input that still gates saved leaderboard and results publishing behind typed `FINAL`

The provisional path must never overwrite `contest_player_results`, saved entry scoring, or the public final-results screens.

## Operating Modes

PickRank should now document and preserve three separate operating modes:

1. `replay_validation`
   - uses SportsDataIO Replay packages to validate provisional snapshot ingestion against recorded game windows
   - supports internal validation contests, operator testing, and repeatable snapshot checks
   - is not the source of truth for the real in-season app experience
2. `in_season_live`
   - will need a true live SportsDataIO product and credentials once real NFL games are underway
   - should power any future internal live-order refreshes that are meant to reflect the current season in real time
   - must not depend on Replay package availability or Replay-specific route assumptions
3. `official_final`
   - remains the only path allowed to publish saved results and leaderboard standings
   - still requires human review plus typed `FINAL`

Replay is the right tool for development and recorded validation. It is not, by itself, the documented long-term answer for real in-season live data.

## First True In-Season Live Plan

The first truthful current-season internal refresh should stay on SportsDataIO, but it must move off Replay and onto the live NFL API contract.

Target contract for `in_season_live`:

1. provider
   - SportsDataIO NFL API
2. product and license
   - SportsDataIO `Sports Data` access for NFL
   - the enabled live entitlement must cover both live game-state feeds and live player game-stat feeds
   - because SportsDataIO exposes exact `Required Product` and `Subfeed / Access` labels per account in the developer portal, the operator still must confirm the live entitlement names on the active key before wiring production behavior
3. host
   - `https://api.sportsdata.io/v3/nfl`
4. auth pattern
   - standard SportsDataIO live auth, not Replay auth
   - the developer portal states NFL API requests accept the API key either as query parameter or `Ocp-Apim-Subscription-Key` request header
   - PickRank should prefer the header form for the true live app path so the live key does not appear in URLs or logs
5. endpoint family for internal live ordering
   - `scores/json/ScoresByWeek/{seasonKey}/{week}`
   - `stats/json/PlayerGameStatsByWeek/{seasonKey}/{week}`
   - keep any later final-only or post-verification stat route as a separate official-final input, not as the publish trigger itself

Current `replay_validation` contract:

- host: `https://replay.sportsdata.io/api/v3/nfl`
- auth: query-string `?key=...`
- endpoint family:
  - `stats/json/scoresbyweek/{seasonKey}/{week}`
  - `stats/json/playergamestatsbyweek/{seasonKey}/{week}`

The two contracts are intentionally different. Do not assume Replay host, auth, path casing, or package behavior carries over to live season operation.

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

1. `https://replay.sportsdata.io/api/v3/nfl/stats/json/scoresbyweek/{seasonKey}/{week}?key=...`
   - confirmed live Week 1 game-state route in the 2025 Sunday-Tuesday replay package
   - supplies provider `ScoreID` plus scheduled, in-progress, and final game state
2. `https://replay.sportsdata.io/api/v3/nfl/stats/json/playergamestatsbyweek/{seasonKey}/{week}?key=...`
   - source of live player passing yards and passing touchdowns across the contest week
   - used to build the provisional QB order snapshot
3. future official handoff endpoint: unverified in this recording
   - keep the official `FINAL`-gated publish path unchanged until SportsDataIO Replay final-route coverage is validated separately

Notes:

- A live authenticated probe on 2026-07-03 confirmed this replay package serves the needed provisional data on `https://replay.sportsdata.io/api/v3/nfl/...?...key=...`.
- The earlier `https://replay.sportsdata.io/api/nfl/...?...key=...` assumption was close on host and auth but wrong on the path family for this package.
- The normalized output contract should stay unchanged even though the Replay host and auth format differ from the standard SportsDataIO header-based host.

## In-Season Live Cutover Checklist

Before PickRank relies on provisional live ordering during the actual NFL season, complete this cutover checklist:

1. Confirm the SportsDataIO product/license that supports true live in-season access for the endpoints PickRank needs.
   - this is not satisfied by Replay access alone
   - verify the active key is entitled to the live NFL `Sports Data` feeds needed for `ScoresByWeek` and `PlayerGameStatsByWeek`
2. Record the production host, auth format, and endpoint family for that live product instead of assuming Replay route shapes carry over.
   - target host: `https://api.sportsdata.io/v3/nfl`
   - target auth: `Ocp-Apim-Subscription-Key` header in app requests
   - target endpoint family: `scores/json/ScoresByWeek` plus `stats/json/PlayerGameStatsByWeek`
3. Add explicit environment-variable guidance for the live provider credentials and keep them separate from Replay validation credentials if both modes remain supported.
   - `PICKRANK_PROVISIONAL_STATS_SOURCE_MODE=replay_validation|in_season_live`
   - `PICKRANK_SPORTSDATAIO_REPLAY_API_KEY`
   - `PICKRANK_SPORTSDATAIO_REPLAY_BASE_URL`
   - `PICKRANK_SPORTSDATAIO_LIVE_API_KEY`
   - `PICKRANK_SPORTSDATAIO_LIVE_BASE_URL`
   - `PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE=header`
4. Verify that the live product returns the schedule, game-status, player-stat, and identifier fields needed by the existing normalized provisional snapshot contract.
   - required fields include `ScoreID`, `PlayerID`, game status, passing yards, and passing touchdowns
5. Run one internal live-season validation pass against a truthful current-season contest slate with real `PlayerID` and `ScoreID` values.
   - do not reuse the hidden 2025 Replay validation contest for this proof
6. Confirm the internal operator path can distinguish `Replay validation` snapshots from `in-season live` snapshots in logs, docs, and UI labels.
   - `providerKey` and `providerName` should remain explicit about which mode produced the snapshot
7. Reconfirm that the official saved-results path still reads only from the human-confirmed finalization seam and not from provisional live snapshots.

Do not treat the Replay validation success documented here as proof that PickRank is already ready for real in-season live-data operation.

## Persistence

- File-backed development storage: `data/contest-provisional-snapshots.json`
- Database tables:
  - `contest_provisional_stat_snapshots`
  - `contest_provisional_stat_snapshot_rows`

This keeps live provisional data audit-friendly while leaving the current final snapshot tables dedicated to the official finalization path.
