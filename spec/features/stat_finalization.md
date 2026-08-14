# Contest Data Provider + Stat Finalization Rules

## Purpose
Define how PickRank sources NFL player stats, determines final player rankings, handles tied player stats, applies stat corrections, and decides when contest scoring becomes official.

## Status
Locked for MVP stat-finalization rules. Provider choice is open after SportsDataIO pricing became a near-term blocker. The repo keeps the existing SportsDataIO Replay/live validation seams and now adds a private MySportsFeeds read-only validation lane. Exact production launch entitlements and final provider operations still require operator confirmation before public live use.

## Anchor
MVP stat finalization requires a trusted external NFL stats provider, uses official final passing yards to rank slate quarterbacks, allows tied player stat ranks without additional QB stat tie-breakers, waits until all slate games are final before scoring, applies a defined stat correction window before payouts, and does not show live scoring during games.

For implementation purposes, PickRank may store separate provisional live snapshots for future live-ordering work, but those snapshots are not the official finalization source of truth and must remain separate from the human-confirmed final-results publish path.

---

## Important Distinction
This document covers **player stat ties**: two or more quarterbacks finishing with the same final passing yards.

It does not define entry score ties, such as two users finishing with the same total contest score. Entry score ties, leaderboard placement, and payout splits are handled in `/spec/features/tie_handling.md`.

For MVP internal results finalization, the saved final-stat input may also carry passing-touchdown totals so the locked entry-score tiebreak tree can compare the user's selected QB1 through QB5 if total miss score, exact picks, one-off-or-better picks, and QB1 placement distance are still equal. Those passing-touchdown values do not change actual player rank for the contest and are not used to break tied passing-yard finishes.

---

## Summary
PickRank contests depend on accurate final player statistics.

For MVP, the core stat is:

```text
QB passing yards
```

Each contest uses a fixed slate of quarterbacks. After all slate games are complete, each quarterback is ranked by final passing yards. User lineups are scored based on how close their submitted rank order is to the final stat ranking.

---

## Data Provider Strategy

PickRank should use a trusted external sports data provider for NFL stats.

Do not manually enter stats for real contests unless operating in a controlled test environment.

The current repo has provider validation seams, but no approved production sports-data provider:

- SportsDataIO Replay is used for internal recorded-game provisional validation
- SportsDataIO live endpoints remain parked technical validation context after the quoted commercial package became a near-term blocker
- MySportsFeeds is the leading candidate under active trial, using an internal read-only validation lane first
- the official saved-results publish path remains separate and still requires the typed `FINAL` confirmation step

That means the implementation direction should preserve provider seams and provisional snapshot boundaries while the vendor decision remains open. Do not treat any trial, personal-use, Discovery Lab, or unofficial endpoint access as production-ready provider access.

The selected provider must support:

- NFL game schedules
- game status
- player-level passing stats
- final box score data
- player identifiers
- team identifiers
- stat correction handling or updated final stats
- reliable API access

### Internal path split
PickRank now distinguishes between:

- provisional live ordering snapshots for internal or future live-leaderboard use
- official final stat input that drives saved results, saved leaderboard standings, and the typed `FINAL` confirmation step

Do not treat provisional live data as sufficient to publish official contest results.

For current development, SportsDataIO Replay may be used to validate provisional snapshot ingestion against recorded games. That Replay path is a validation mode, not the default documented plan for true in-season live operation.

Before any in-season live provisional surface is treated as production-ready, PickRank must separately confirm the provider product/license, host, auth pattern, endpoint coverage, display rights, storage rights, and paid-contest rights needed for current-season data.

Current documented expectations:

- Replay validation uses `https://replay.sportsdata.io/api/v3/nfl/...?...key=...`
- parked SportsDataIO live validation uses the standard NFL API host `https://api.sportsdata.io/v3/nfl`
- private MySportsFeeds read-only validation uses `https://api.mysportsfeeds.com/v2.1/pull/nfl`
- the first MySportsFeeds path must remain read-only until Parker explicitly approves any Supabase provisional snapshot persistence
- exact account-level entitlement names remain an operator confirmation step before production wiring

---

## MVP Stat Source of Truth

For MVP contests, the source of truth should be the selected external sports data provider.

The app should store the provider's player IDs and map them to internal PickRank player IDs.

Recommended mapping:

- `provider_player_id`
- `pickrank_player_id`
- `player_name`
- `team_abbreviation`
- `position`
- `provider_team_id`

---

## Contest Slate Requirements

Each contest must have a frozen slate before it opens for paid entry.

Slate fields:

- contest ID
- player ID
- provider player ID
- player display name
- team
- opponent
- game ID
- game start time
- stat type

For MVP, slate changes should not occur after contest opens unless the contest is canceled and recreated.

---

## Final Stat Definition

For QB Passing Yards contests:

```text
final_stat = official final passing yards for that quarterback in the slate game
```

Passing yards should be treated as a numeric stat.

Higher passing yards = better final rank.

Example:

| QB | Passing Yards | Final Rank |
|---|---:|---:|
| Player A | 325 | 1 |
| Player B | 288 | 2 |
| Player C | 241 | 3 |

---

## Player Stat Tie Rules

Player stat ties are allowed.

If two or more quarterbacks finish with the same passing yards, they share the same actual rank group.

Use competition ranking for actual player ranks.

Example:

| QB | Passing Yards | Actual Rank |
|---|---:|---:|
| Player A | 325 | 1 |
| Player B | 288 | T-2 |
| Player C | 288 | T-2 |
| Player D | 241 | 4 |

### No QB stat tie-breaker
For MVP, do not break tied QB passing-yard ranks using:

- completions
- attempts
- touchdowns
- interceptions
- passer rating
- rushing yards
- team result
- game start time
- alphabetical order
- manual judgment
- random draw

Reason:

- users are predicting passing yards only
- adding another stat would create a hidden game mechanic
- official equal passing-yard outcomes should remain equal
- tied rank ranges create fair scoring without extra rules

### Actual rank range
If multiple quarterbacks tie, the tied players occupy a rank range.

Example:

- Player B and Player C tie for 2nd
- They occupy rank positions 2 and 3
- Their actual rank range is `2-3`
- The next player is ranked 4th

Store:

- `actual_rank_min = 2`
- `actual_rank_max = 3`
- `actual_rank_display = T-2`

### Scoring against tied actual ranks
If a player has a tied actual rank, score that player using the closest occupied actual rank in the tied group.

For a tie group occupying ranks 2 and 3, both players should be treated as having an actual rank range of `2-3`.

Distance calculation:

```text
if user_rank is inside actual_rank_range:
  distance = 0
else:
  distance = minimum absolute distance to either edge of actual_rank_range
```

Example:

- Player B and Player C tie for 2nd
- Actual rank range: `2-3`
- User ranks Player B 2nd → distance 0
- User ranks Player B 3rd → distance 0
- User ranks Player B 4th → distance 1
- User ranks Player B 1st → distance 1

This prevents penalizing users for correctly placing a player within an official stat tie group.

### Multiple tie groups
Multiple player stat tie groups may exist in the same contest.

Example:

| QB | Passing Yards | Actual Rank Range | Display |
|---|---:|---:|---:|
| Player A | 325 | 1-1 | 1 |
| Player B | 288 | 2-3 | T-2 |
| Player C | 288 | 2-3 | T-2 |
| Player D | 241 | 4-4 | 4 |
| Player E | 200 | 5-7 | T-5 |
| Player F | 200 | 5-7 | T-5 |
| Player G | 200 | 5-7 | T-5 |
| Player H | 188 | 8-8 | 8 |

Each tied player uses its own actual rank range for scoring distance.

### All players tied
If all slate players finish with the same passing yards:

- all players share `T-1`
- actual rank range is `1-slate_size`
- every user receives distance 0 for every player
- all entries will likely tie on total score
- entry score tie handling then applies via `/spec/features/tie_handling.md`

---

## Game Completion Rule

Contest scoring cannot begin until all slate games are final.

A contest should not enter `finalizing` until:

- every slate player's game has final status
- every slate player has a recorded final stat value
- provider data passes basic validation checks

---

## Finalization Flow

When all slate games are final:

1. fetch final stat values from provider
2. validate all slate players have stat values
3. rank players by final stat
4. assign actual rank or actual rank range
5. calculate each entry's score
6. apply entry leaderboard tie handling
7. calculate payout amounts
8. persist final results
9. transition contest to `final`

---

## Stat Correction Window

MVP should include a short stat correction window before payouts are credited.

Recommended MVP rule:

```text
Final results may be shown first, but payouts should wait until the stat correction window closes.
```

Recommended window:

```text
24 hours after all slate games are final
```

During this period:

- contest may be in `final` state
- final leaderboard/results can be shown as pending official payout
- payouts are not credited yet
- app copy should indicate payouts are pending confirmation

Example copy:

```text
Final results are posted. Winnings will be credited after stats are confirmed.
```

After the window closes:

- re-check provider stats
- apply corrections if needed
- recalculate final scores if changed
- credit payouts
- transition to `paid_out`

---

## Stat Corrections After Payout

For MVP, avoid reopening paid contests unless legally or operationally required.

Recommended MVP rule:

```text
Once a contest reaches paid_out, results are treated as final for app purposes.
```

If a major provider correction happens after payout:

- route to `error_review`
- do not automatically claw back user balances
- require manual/admin review

---

## Missing Data Handling

If provider data is missing or incomplete during finalization:

- do not finalize scoring
- move contest to `error_review` or remain in `finalizing`
- show user-facing under-review copy

Example copy:

```text
Final results are under review while stats are confirmed.
```

Do not estimate or manually infer final stats in production.

---

## Invalid Player / DNP Handling

If a quarterback in the slate does not play:

- final passing yards = `0`
- player remains in final ranking
- user still receives scoring based on actual final rank or tied actual rank range

If multiple players finish with `0` passing yards:

- they share tied actual rank using the player stat tie rules

Do not remove DNP players from the slate after contest opens.

---

## Player Replacement Rule

For MVP, do not support player replacement after contest opens.

If a slate is materially invalid before lock:

- admin/system may cancel the contest
- users receive site credit refunds

If a QB is benched, injured, inactive, or unexpectedly does not play after contest opens:

- player remains in slate
- final stat is whatever official stat value is recorded
- usually `0` if no passing yards are recorded

This preserves contest integrity and avoids subjective replacements.

---

## Stat Validation Checks

Before final scoring, backend should validate:

- all slate players have provider stat rows
- all relevant games are final
- stat type matches contest stat type
- passing yards are numeric
- no duplicate player IDs in slate
- no missing provider player IDs
- no impossible stat values, such as negative passing yards unless provider officially reports them

If validation fails:

- block finalization
- move to `error_review` or keep `finalizing`

---

## Backend Requirements

### Recommended data objects

#### Contest Stat Snapshot

- `snapshot_id`
- `contest_id`
- `provider_name`
- `provider_snapshot_time`
- `created_at`
- `status`
- `metadata`

#### Player Contest Result

- `contest_id`
- `player_id`
- `provider_player_id`
- `final_stat`
- `actual_rank`
- `actual_rank_display`
- `actual_rank_min`
- `actual_rank_max`
- `game_id`
- `game_status`
- `stat_finalized_at`

#### Stat Correction Event

- `event_id`
- `contest_id`
- `player_id`
- `previous_stat`
- `corrected_stat`
- `previous_rank`
- `corrected_rank`
- `created_at`
- `source`
- `metadata`

---

## Contest Lifecycle Interaction

Stat finalization connects to lifecycle states:

- `live`: games underway or waiting for slate completion
- `finalizing`: all slate games final and scoring is being calculated
- `final`: results visible, payout may be pending stat confirmation
- `paid_out`: payouts credited after stat correction window closes
- `error_review`: provider/stat issue requires manual review

---

## User-Facing Copy

### Live
```text
Contest is underway. Final results will be available after all games are complete.
```

### Finalizing
```text
Final results are being calculated.
```

### Final, payout pending
```text
Final results are posted. Winnings will be credited after stats are confirmed.
```

### Paid out
```text
Winnings have been credited to your cash balance.
```

### Under review
```text
Final results are under review while stats are confirmed.
```

---

## MVP Constraints

Build for MVP:

- external provider stat ingestion
- provider-to-internal player ID mapping
- frozen contest slate
- final passing yards ranking
- tied player stat rank handling
- no QB stat tie-breaker beyond passing yards
- DNP as official stat value, usually 0
- all-games-final requirement
- finalization validation checks
- stat correction window before payout
- stat snapshots for auditability

Do not build for MVP:

- live scoring
- manual stat editing UI
- player replacement after contest opens
- multi-provider stat comparison UI
- user-facing stat disputes
- automated clawbacks after payout
- QB passing-yard tie-breakers using secondary stats
- alternate stat categories beyond initial QB passing yards unless explicitly added later

---

## Future Expansion

Potential future additions:

- provider redundancy / backup source
- admin stat correction dashboard
- stat dispute workflow
- live stat tracking
- live leaderboard
- additional stat categories
- optional player stat tie-breakers for non-MVP contest formats
- automated finality confidence checks
- provider reconciliation reporting
