# PickRank Remotion Current Cut

## Purpose

This note is the current source of truth for the live Remotion marketing cut under `assets/marketing/video/`.

Use this file to prevent version slippage between older brief ideas and the currently approved scene states.

The broader concept brief still lives in:

- `docs/marketing/remotion-pickrank-launch-video-brief.md`

The active source data for the cut lives in:

- `assets/marketing/video/src/data/pickrank-launch-video.ts`

If this note and the source data diverge, update both together.

## Current Output

- Format: `16:9`
- Resolution target: `1920x1080`
- FPS: `30`
- Current duration: `34.5s`
- Current render path: `assets/marketing/video/out/pickrank-landing-video.mp4`
- Current default audio bed: `assets/marketing/video/public/audio/locked-in-final.wav`

## Guardrail

When editing the video:

- preserve approved scene states unless Parker explicitly changes them
- do not pull older copy back in from the launch brief without checking this file
- treat this file as the lock for the current cut, not just a suggestion list
- keep every scene at `4s` or longer unless Parker explicitly approves a faster beat

## Current Scene Lock

### Scene 1: Hook

- Eyebrow: `Your new favorite fantasy game`
- Headline lines:
  - `15 NFL Players.`
  - `Pick 10.`
  - `Rank them.`
- Support line: `Simple fantasy. Real cash winnings.`
- Bottom cards:
  - `Slate / 15 players`
  - `Skill / Pick 10`
  - `Prize / Cash`
- Top-right domain chip: `pickrankgames.com`

Do not revert:

- `15 NFL Players` back to `15 NFL QBs`
- `Skill` back to `Entry`
- `Cash` back to `Real money`
- the eyebrow back to `New fantasy format`

### Scene 2: Intro

- Headline: `15-player slate.`
- Subhead: `One stat. One board.`
- Feature cards:
  - `Pick 10`
  - `Drag to rank`
  - `Beat the field`

### Scene 3: Selection

- Step label: `Step 1`
- Header:
  - `Get 15 players.`
  - `Pick your 10.`
- `Pick your 10.` should use the accent color
- Stat line: `This week: QB Passing Yards`
- Left panel label: `Slate`
- Right panel label: `Your Board`

Do not revert:

- `Slate` back to `Slate of 15`
- `Your Board` back to `Your 10`

### Scene 4: Ranking

- Step label: `Step 2`
- Header:
  - `Drag & drop`
  - `your order.`
- Subhead: `Put your players where you think they will finish each week.`
- Animation state:
  - Patrick Mahomes starts at `#4`
  - Patrick Mahomes moves into `#1`
  - the rest of the board reorders visually
  - the motion must land in a clean final state
- Use the subtle blue drag marker only

Do not revert:

- the old down-arrow indicator
- any version where Mahomes appears to move but still visually stays in `#4`

### Scene 5: Scoring

- Step label: `Step 3`
- Header: `Lowest total wins.`
- Subhead: `Every spot away adds points.`
- Rule pills:
  - green pill:
    - `Exact pick = 0 points`
  - red pill:
    - `Bigger miss = more points`
- Example cards:
  - `Patrick Mahomes`
    - `Your rank / #1`
    - `Actual finish / #6`
    - `5 points`
    - player name should stay visually dominant over the points badge
  - `Jalen Hurts`
    - `Your rank / #3`
    - `Actual finish / #2`
    - `1 point`
    - player name should stay visually dominant over the points badge
- Equation row:
  - `5 for Mahomes + 1 for Hurts = 6 total points`
  - the full math row should stay on one line

Do not revert:

- the older three-card scoring layout
- `Example 1` / `Example 2`
- any version where the score cards or pills lose alignment

### Scene 6: Differentiator

- Eyebrow: `How it's unique`
- Headline lines:
  - `No full roster.`
  - `No long season.`
  - `A new game every week.`
- Third line should carry the accent treatment
- Support boxes:
  - `One slate.`
  - `One ranking.`
  - `One weekly result.`

Do not revert:

- the single wrapped headline line
- the older eyebrow `Why it lands`

### Scene 7: National Board

- Eyebrow: `Compete to win`
- Headline: `Beat the field.`
- Subhead: `More entries = bigger prize pool.`
- Board title: `Weekly Board`
- Top chip: `National Week`
- Rows:
  - `1 Texas Tate TX 4 pts`
  - `2 Philly Phil PA 6 pts`
  - `3 Miami Max FL 8 pts`
  - `4 You CA 11 pts`

Do not revert:

- descriptive labels like `Top finish`, `Right behind`, `Climbing`
- any version without actual point totals

### Scene 8: CTA

- Use the logo image, not text-only `PickRank`
- Use the interim logo image `brand/pickrank-wordmark-white-pick.png` in the Remotion public folder
- That asset currently uses a baked black background, so keep the CTA logo on `mixBlendMode: screen` until a clean transparent RGBA export replaces it
- Support lines:
  - `Rank the slate.`
  - `Beat the field.`
  - `Win cash.`
- Button only:
  - `Join the waitlist`
- Footer domain: `pickrankgames.com`

Do not revert:

- duplicated `Join the waitlist` in both body copy and button
- text-only headline if the logo asset is available

## Working Rule For Future Passes

Before changing any Remotion scene:

1. Read this file.
2. Read `assets/marketing/video/src/data/pickrank-launch-video.ts`.
3. Only then edit the relevant scene or component files.

If a scene changes meaningfully, update this note in the same slice.

## Current Asset Notes

- Best immediate CTA logo candidate is the simple white-`Pick` wordmark without the football arc
- The current downloaded PNG options are still RGB exports without true transparency, so treat them as interim review assets rather than final brand masters
- Parker selected PremiumBeat's `Locked In` as the winning music direction after direct video comparison against `Design in Motion`
- The current default music bed is the licensed `297_short3_locked-in_0060.wav` source copied to `audio/locked-in-final.wav`
- The active cut trims `Locked In` by `75` frames so the heavier groove starts immediately and the track's strongest natural break lands at the Scoring scene transition without trying to over-sync every scene change
- Temporary music review variants may still be rendered from the same cut for future comparison, but `Locked In` is the current default source of truth until Parker explicitly changes the bed
