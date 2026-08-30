# Contest Admin / Setup Flow

## Purpose
Define how PickRank admins create, validate, schedule, and publish weekly contests.

## Status
Locked for MVP direction.

## Anchor
MVP contest setup uses an internal admin flow to create contests, select stat type, configure slate players, validate provider IDs, set entry fee, confirm payout settings, set lock time, preview the contest, and publish only after validation passes.

---

## Summary
PickRank needs a controlled internal setup process for weekly contests.

For MVP, this does not need to be a polished public-facing admin dashboard. It can start as a basic internal tool, protected route, or structured admin workflow.

The goal is to prevent invalid contests from reaching users.

The broader operator information architecture, immutable board history, contest-lock evidence, and analysis exports are defined in:

```text
/spec/features/admin_evidence_dashboard.md
```

---

## MVP Admin Setup Flow

Recommended flow:

```text
Create Contest
→ Configure Contest Basics
→ Select Stat Type
→ Build Slate
→ Validate Slate
→ Configure Economics
→ Set Timing
→ Preview Contest
→ Publish Contest
```

---

## 1. Create Contest

Admin starts a new contest in `draft` state.

Required fields:

- contest name
- season
- week
- contest type
- stat category

Example:

```text
Week 7 QB Passing Yards
```

Default state:

```text
draft
```

User-facing visibility:

- not visible in lobby
- cannot be entered

---

## 2. Configure Contest Basics

Admin sets:

- contest title
- contest description / instruction
- NFL week
- contest category
- slate size

MVP defaults:

- contest category: `QB Passing Yards`
- slate size: `20`
- contest type: `public paid contest`
- entry model: `single entry per user`

Example instruction:

```text
Rank QBs by passing yards.
```

---

## 3. Select Stat Type

MVP stat type:

```text
qb_passing_yards
```

Stat type controls:

- eligible player position
- provider stat field
- final ranking logic
- display copy
- scoring calculation input

MVP should not allow admins to create arbitrary stat types without engineering support.

---

## 4. Build Slate

Admin selects the quarterbacks included in the contest slate.

Required player fields:

- PickRank player ID
- provider player ID
- player display name
- team abbreviation
- opponent
- home/away indicator
- NFL game ID
- game start time
- position
- active/injury metadata, if available

MVP slate size:

```text
20 quarterbacks
```

### Slate selection rule
For MVP, the slate should be intentionally curated.

Do not automatically include every starting QB unless that is specifically chosen for the contest.

### Slate order before entry
Admin slate order should not determine the user-facing default lineup.

User-facing default order remains controlled by the lineup builder rules.

---

## 5. Validate Slate

Before publishing, the system must validate:

- exactly 20 players selected
- all selected players are quarterbacks
- no duplicate players
- every player has a provider player ID
- every player has a provider game ID
- every game has a scheduled start time
- every player has team and opponent data
- contest stat type is supported for all selected players
- no selected game starts before contest lock time

If validation fails, contest cannot be published.

Example error:

```text
Cannot publish contest: Patrick Mahomes is missing provider_player_id.
```

---

## 6. Configure Economics

Admin confirms contest economics.

MVP locked defaults:

- fixed entry fee
- platform fee: `30%`
- prize pool: `70%`
- payout structure: Top 3
- 1st: `50%`
- 2nd: `30%`
- 3rd: `20%`
- minimum entries to run: `4`
- dynamic prize pool only

Admin may set:

- entry fee

Admin should not edit for MVP unless explicitly enabled:

- platform fee percentage
- payout structure
- minimum entries to run
- guaranteed prize pool

### Economic preview
Admin preview should show examples at different entry counts.

Example:

| Entries | Gross Entry Fees | Platform Fee | Prize Pool | 1st | 2nd | 3rd |
|---:|---:|---:|---:|---:|---:|---:|
| 4 | $20 | $6 | $14 | $7 | $4.20 | $2.80 |
| 100 | $500 | $150 | $350 | $175 | $105 | $70 |
| 1,000 | $5,000 | $1,500 | $3,500 | $1,750 | $1,050 | $700 |

---

## 7. Set Timing

Admin sets:

- entry open time
- contest lock time

MVP default:

```text
Contest locks at kickoff of the first game in the slate.
```

Validation rules:

- entry open time must be before lock time
- lock time must be before or equal to first slate game kickoff
- no slate game should begin before lock time
- contest should not publish if lock time is missing

---

## 8. Preview Contest

Before publishing, admin sees the same core information users will see.

Preview should include:

- contest title
- stat category
- slate size
- lock time
- entry fee
- projected prize pool examples
- payout structure
- minimum entries to run
- slate player list
- player/team/opponent display

Admin should confirm:

```text
I have reviewed this contest and confirm it is ready to publish.
```

---

## 9. Publish Contest

Publishing transitions contest from:

```text
draft → scheduled
```

or, if entry open time has already arrived:

```text
draft → open
```

Published contests become visible according to lobby rules.

Once contest is published:

- contest appears in lobby if scheduled/open
- contest may accept entries only in `open`
- major edits should be restricted

---

## Post-Publish Edit Rules

### Allowed before first paid entry
Admin may edit:

- contest title
- description/instruction
- entry open time
- lock time
- slate players
- entry fee

If edited, validation must run again.

### Restricted after first paid entry
After first paid entry, admin should not edit:

- slate players
- stat type
- entry fee
- platform fee
- payout structure
- minimum entries to run
- lock time, unless operationally necessary and before lock

Allowed after first paid entry:

- minor copy typo fixes
- lobby ordering / featured placement

### Material issue after first paid entry
If a material issue is found after entries exist:

- do not silently edit contest terms
- cancel contest if needed
- refund users as site credit
- recreate corrected contest

---

## Admin Cancellation Flow

Admins may cancel a contest before or after entries exist only for valid operational reasons.

Valid reasons:

- invalid slate
- incorrect lock time
- provider data issue
- compliance/legal issue
- duplicate contest
- major setup error

If paid entries exist:

- transition contest to `canceled`
- issue site credit refunds
- notify users
- block leaderboard/results

Cancellation reason should be stored.

---

## Admin Visibility Controls

MVP should support simple lobby controls:

- visible / hidden
- featured contest flag
- manual display order

Contest ordering remains manually controlled.

---

## Required Validation Checklist

Contest cannot publish unless:

- contest title exists
- stat type exists and is supported
- exactly 20 slate players are selected
- all slate players have provider IDs
- all slate players have game IDs
- no duplicate slate players
- all game start times exist
- entry fee exists and is greater than `$0`
- platform fee is set
- payout structure totals `100%` of prize pool
- minimum entries to run is set
- lock time exists
- lock time is valid relative to slate games

---

## Backend Requirements

### Recommended Admin Fields

#### Contest

- `contest_id`
- `contest_name`
- `contest_description`
- `season`
- `week`
- `contest_type`
- `stat_type`
- `slate_size`
- `entry_fee`
- `platform_fee_percentage`
- `payout_structure`
- `min_entries_to_run`
- `entry_open_time`
- `lock_time`
- `contest_status`
- `visibility_status`
- `is_featured`
- `display_order`
- `created_by_admin_id`
- `published_by_admin_id`
- `published_at`
- `created_at`
- `updated_at`

#### Contest Slate Player

- `contest_id`
- `player_id`
- `provider_player_id`
- `provider_game_id`
- `display_name`
- `team_abbreviation`
- `opponent_abbreviation`
- `home_away`
- `game_start_time`
- `position`
- `sort_order_internal`

#### Contest Validation Result

- `validation_id`
- `contest_id`
- `status`
- `errors[]`
- `warnings[]`
- `validated_at`
- `validated_by_admin_id`

---

## User-Facing Copy Impact

Admin setup controls these user-facing fields:

- contest title
- entry fee
- lock time
- prize pool
- payout preview
- player display rows
- contest status

Admin tools should prevent bad setup because errors become public immediately after publish.

---

## MVP Constraints

Build for MVP:

- internal contest creation workflow
- draft/scheduled/open publishing flow
- stat type selection limited to QB passing yards
- slate player selection
- provider ID validation
- economics confirmation
- timing validation
- publish validation checklist
- featured/manual lobby ordering
- admin cancellation reason

Do not build for MVP:

- polished full admin dashboard
- bulk contest upload
- role-based admin permission tiers
- arbitrary stat type builder
- automated contest generation
- payout structure editor
- guaranteed prize pool setup
- post-entry material edits
- advanced admin audit UI

---

## Future Expansion

Potential future additions:

- automated weekly contest generation
- provider-powered player slate suggestions
- role-based admin permissions
- audit log viewer
- bulk contest creation
- payout structure templates
- private contest setup
- guaranteed prize pool setup
- admin QA checklist UI
- clone previous contest workflow
