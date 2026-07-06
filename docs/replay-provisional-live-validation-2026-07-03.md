# Replay Provisional Live Validation - 2026-07-03

## Scope

Validate the Replay-backed provisional snapshot path against one saved contest slate without changing the official `FINAL`-gated results publish flow.

## What was checked

- Linked Vercel project environment variable names across Development, Preview, and Production
- Saved Week 1 contest and slate rows in the active Supabase project
- Dedicated provisional snapshot table visibility in the active Supabase REST schema
- Current Replay provisional snapshot code path in `lib/stats-provider.ts`
- Live Replay metadata plus Week 1 route behavior for the NFL 2025 Regular Season Sunday-Tuesday package

## Result

The original saved public slate was correctly identified as a mismatch for this replay package, and a follow-up internal validation slate has now completed one live end-to-end provisional snapshot save successfully.

### Confirmed endpoint and auth shape

The Replay provisional path should call:

- `https://replay.sportsdata.io/api/v3/nfl/stats/json/scoresbyweek/2025reg/1?key=...`
- `https://replay.sportsdata.io/api/v3/nfl/stats/json/playergamestatsbyweek/2025reg/1?key=...`

A live authenticated probe with the real Replay key confirmed those exact endpoint families are available in this recording. Earlier probes against the wrong path family returned package-level misses or endpoint-unavailable errors.

That confirms three things relevant to this slice:

- the Replay host is `https://replay.sportsdata.io`
- the package path family for this slice is `api/v3/nfl/...`
- Replay auth is query-string `?key=...`, not the standard SportsDataIO subscription-key header flow

Inference:
The NFL 2025 Regular Season Week 1 Sunday-Tuesday replay package is key-bound, but route availability is still package-specific. The repo needed both the Replay host/auth correction and the `v3` route-family correction.

### Confirmed storage-layer status

The active Supabase project now exposes:

- `contest_provisional_stat_snapshots`
- `contest_provisional_stat_snapshot_rows`

Direct REST reads against `contest_provisional_stat_snapshots` now return an empty result instead of a schema-cache error, so dedicated provisional snapshot persistence storage is ready.

### Blocking issue 1: the saved contest season does not match the replay package

The active public contest row is:

- `slug = week-1-qb-passing-yards`
- `season = 2026`
- `week = 1`

The replay package is clearly:

- `2025REG / 1`

That means the current saved contest would still request the wrong season if the live provisional fetch used the contest row as-is.

### Blocking issue 2: the saved slate is a 2026 slate, not a 2025 Week 1 slate

The saved `contest_slate_players` rows are built around 2026 matchups such as:

- `buf-bal-2026-wk1`
- `lac-lv-2026-wk1`
- `kc-den-2026-wk1`
- `no-atl-2026-wk1`

The 2025 replay package exposes different Week 1 matchups for several of those quarterbacks, including:

- `KC @ LAC` instead of the saved `LAC vs LV`
- `TB @ ATL` instead of the saved `ATL vs NO`
- `ARI @ NO` instead of the saved `NO vs ATL`
- `MIA @ IND` instead of the saved `MIA vs NYJ`

This is not just an ID-format issue. It is a contest-data mismatch between the saved slate and the replay package.

### Blocking issue 3: one saved player does not exist as a package-matched Week 1 starter

Using the replay package's live `depthchartsall`, `scoresbyweek`, and `playergamestatsbyweek` data:

- 14 of the 15 saved quarterbacks can be lined up to numeric SportsDataIO player IDs
- 14 of the 15 saved quarterbacks can also be lined up to a replay-package `ScoreID`
- `Kirk Cousins` appears only as Atlanta's QB2 in this recording
- `Derek Carr` does not appear as a package-matched Week 1 starter at all

That means there is no clean one-to-one way to convert the saved 2026 slate into a fully truthful 2025 replay-backed slate without changing the saved player pool itself.

### Partial mapping evidence

The replay package does provide real numeric mappings for most of the saved names, for example:

- `Josh Allen -> PlayerID 19801, ScoreID 19067`
- `Joe Burrow -> PlayerID 21693, ScoreID 19056`
- `Jalen Hurts -> PlayerID 21831, ScoreID 19039`
- `Lamar Jackson -> PlayerID 19781, ScoreID 19067`
- `Justin Herbert -> PlayerID 21681, ScoreID 19054`

But those mappings still sit inside a broader saved-slate mismatch, because the contest currently represents a different season and several different matchups.

## Follow-up live validation outcome on 2026-07-04

The chosen best-path follow-up is now in place:

- hidden internal contest slug: `week-1-qb-passing-yards-replay-validation-2025`
- season/week: `2025 / 1`
- path used: `https://replay.sportsdata.io/api/v3/nfl/...?...key=...`
- auth used: Replay query-string key

The internal slate keeps 14 saved names on truthful numeric SportsDataIO identifiers and replaces `Derek Carr` with `Kyler Murray`, because Carr does not appear as a package-aligned Week 1 starter in this recording. `Kirk Cousins` remains included on his truthful numeric identifiers even though he appears as Atlanta's QB2 in this package.

One credential-backed live validation run now succeeds end to end:

- the internal slate saves into `contests` plus `contest_slate_players`
- one Replay-backed provisional snapshot saves into `contest_provisional_stat_snapshots`
- the snapshot rows save into `contest_provisional_stat_snapshot_rows`

Saved snapshot confirmation from the live run:

- snapshot id: `9e944126-33ff-46e2-8ab2-d303f1dca7df`
- contest slug: `week-1-qb-passing-yards-replay-validation-2025`
- game counts: `10 total / 0 scheduled / 0 in progress / 10 final`
- top QB passing-yard order begins:
  - `1. Josh Allen - 394`
  - `2. Justin Herbert - 318`
  - `3. Brock Purdy - 277`
  - `4. Patrick Mahomes - 258`
  - `5. Matthew Stafford - 245`

Important live-package note:

The earlier local sample files reflected a partial-week state, but the current live Replay package now resolves this validation slate as fully final. That is why the final 2026-07-04 run reports `10 final` games instead of the earlier expected mixed scheduled/final counts.

## Harness prerequisites and interpretation

Use this note as the operator reference before treating a harness result as meaningful.

### Required environment inputs

The repeatable harness now lives at:

- `npm run validate:replay-provisional`

That run expects these values to be available in the active shell or `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `PICKRANK_SPORTSDATAIO_REPLAY_API_KEY`

Optional override:

- `PICKRANK_SPORTSDATAIO_REPLAY_BASE_URL`
  - default remains `https://replay.sportsdata.io/api/v3/nfl`

### What a successful run proves

A successful harness run proves only the current Replay validation path:

- the hidden `week-1-qb-passing-yards-replay-validation-2025` contest can be upserted with the truthful saved validation slate
- Replay `v3` endpoints can be reached with the active Replay key
- one provisional snapshot can be saved into `contest_provisional_stat_snapshots`
- snapshot rows can be saved into `contest_provisional_stat_snapshot_rows`
- the saved order and game counts still match the currently confirmed Replay package expectations

It does not prove true in-season live readiness. Replay validation is still a recorded-package mode, not the final live-season provider contract.

### How to interpret a failed run

Interpret failures in this order:

1. missing env or credential failure
   - example: missing `PICKRANK_SPORTSDATAIO_REPLAY_API_KEY`
   - meaning: the harness did not reach a meaningful Replay or snapshot validation step yet
2. Replay request failure
   - meaning: host, auth, package access, route family, or package availability may have drifted
3. contest upsert or snapshot persistence failure
   - meaning: Supabase schema, permissions, or row-shape expectations may have drifted
4. saved-order or game-count assertion failure
   - meaning: the package state changed, the hidden slate assumptions drifted, or the provider normalization path changed

### Latest verified baseline

The last confirmed credential-backed baseline for this harness remains:

- verified date: `2026-07-04`
- hidden validation contest: `week-1-qb-passing-yards-replay-validation-2025`
- snapshot id: `9e944126-33ff-46e2-8ab2-d303f1dca7df`
- game counts: `10 total / 0 scheduled / 0 in progress / 10 final`
- expected leading QB order:
  - `1. Josh Allen`
  - `2. Justin Herbert`
  - `3. Brock Purdy`
  - `4. Patrick Mahomes`

If a later run fails before reaching these assertions, treat it as an environment or access problem first, not immediate evidence that the provisional ordering code regressed.

## Provider-shape conclusion

The confirmed mismatches from live validation are:

- endpoint-shape mismatch:
  - the earlier `https://replay.sportsdata.io/api/nfl/...` path assumption was incomplete for this package
  - the working live provisional routes are on `https://replay.sportsdata.io/api/v3/nfl/...`
- auth mismatch:
  - Replay uses query-string `?key=...`, not the standard SportsDataIO header flow
- contest-season mismatch:
  - saved contest is `2026`, replay package is `2025`
- slate-identifier and matchup mismatch:
  - the saved Week 1 slate is based on 2026 matchups and cannot be cleanly replay-validated against the 2025 Week 1 package without changing saved slate content
- player-pool mismatch:
  - at least one saved player, `Derek Carr`, is not package-aligned as a Week 1 starter in this replay
- package-time-state difference:
  - earlier saved local probes reflected a partial-week recording state
  - the current live key-backed validation run resolves this package as fully final for the chosen internal validation slate

## Repo change from this validation pass

`lib/stats-provider.ts` now points the provisional Replay path at the confirmed `v3` route family and still keeps Replay-specific readiness failures isolated from the official `FINAL` path.

## Actionable next move

The narrow validation step is now complete. The next recommended move is to choose the first internal product surface that should read these provisional snapshots without affecting the official final-results flow:

1. internal admin preview:
   - show the latest saved provisional ordering and game counts for the hidden validation contest inside `/admin/contests`
2. background refresh path:
   - move this validation harness logic behind a narrow server-triggered refresh path for future live internal updates
