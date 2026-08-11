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
- Current duration: `38.5s`
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

- Eyebrow: `Early Access Beta`
- Headline lines:
  - `Same 20-player pool.`
  - `Pick 10.`
  - `Rank the final order.`
  - `Closest board wins.`
- Support line: `Free to play during beta.`
- Bottom cards:
  - `Pool / Same 20`
  - `Board / Pick 10`
  - `Goal / Closest wins`
- Top-right domain chip: `pickrankgames.com`
- Teaching rationale: open with the current beta posture and contest objective before the action mechanics, so a cold viewer understands what they are trying to do before the cut shows how to do it.

Do not revert:

- `Same 20-player pool.` back to older pool-size or action-only opening copy
- `Board` back to `Entry`
- the eyebrow back to `New fantasy format`
- beta framing back to paid-launch framing
- `Closest board wins.` into early `Lowest score wins.`; keep `Lowest total wins.` in the scoring scene after miss-distance points are explained

### Scene 2: Intro

- Headline: `Now build it.`
- Subhead: `Choose 10 from the weekly pool, then rank who finishes highest.`
- Feature cards:
  - `20-player pool`
  - `Pick 10`
  - `Rank order`

### Scene 3: Selection

- Step label: `Step 1`
- Header:
  - `Get 20 players.`
  - `Build your board.`
- `Build your board.` should use the accent color
- Stat line: `This week: QB Passing Yards`
- Left panel label: `Player Pool`
- Right panel label: `Your Board`
- Phone UI may render a compact pool preview plus a count chip, but the source data must include all 20 players.

Do not revert:

- `Player Pool` back to `Slate` or `Slate of 15`
- `Your Board` back to `Your 10`

### Scene 4: Ranking

- Step label: `Step 2`
- Header:
  - `Drag & drop`
  - `your order.`
- Subhead: `Rank the 10 you picked by the final stat.`
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
- Subhead: `Actual rank uses the full 20-player pool.`
- Rule pills:
  - green pill:
    - `Exact pick = 0 points`
  - red pill:
    - `Every spot away adds points`
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
  - `No draft room.`
  - `No roster grind.`
  - `A new board every week.`
- Third line should carry the accent treatment
- Support boxes:
  - `One pool.`
  - `One board.`
  - `One weekly result.`

Do not revert:

- the single wrapped headline line
- the older eyebrow `Why it lands`

### Scene 7: Leaderboard

- Eyebrow: `Leaderboard`
- Headline: `Beat the field.`
- Subhead: none
- Board title: `Leaderboard`
- Top chip: `National Week`
- Rows:
  - `1 Texas Tate TX 4 pts`
  - `2 Philly Phil PA 6 pts`
  - `3 Miami Max FL 8 pts`
  - `4 You CA 11 pts`

Do not revert:

- `Leaderboard` back to `Beta leaderboard` or `Beta Board`
- the removed no-cash subhead; keep the leaderboard scene focused on point totals
- descriptive labels like `Top finish`, `Right behind`, `Climbing`
- any version without actual point totals

### Scene 8: CTA

- Use the logo image, not text-only `PickRank`
- Use the interim logo image `brand/pickrank-wordmark-white-pick.png` in the Remotion public folder
- That asset currently uses a baked black background, so keep the CTA logo on `mixBlendMode: screen` until a clean transparent RGBA export replaces it
- Support lines:
  - `Rank the pool.`
  - `Beat the field.`
  - `Free beta access.`
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
