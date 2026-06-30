# PickRank Remotion Workflow Recommendation

## What This Slice Covers

This note recommends the cleanest way to add a Remotion-based marketing video workflow without mixing it into the current landing-page app work.

It also turns the launch video brief into a concrete first-build plan:

- project structure
- composition list
- scene timing
- reusable components
- scene props
- asset checklist

This is intentionally narrow. It does not change app behavior, product rules, or landing-page implementation.

## Recommended Structure

### Recommendation

Use a standalone Remotion project inside the repo at:

```text
assets/marketing/video/
```

This is cleaner than wiring Remotion directly into the existing Next.js app because it:

- keeps video dependencies separate from app dependencies
- avoids accidental coupling to landing-page code
- makes the marketing video its own commit and workflow
- lets the video evolve without changing the product app build

### Why Not Put Remotion Inside The App Package

The app repo is currently a single Next.js package. Adding Remotion directly into that package would blur concerns:

- app build tooling and video build tooling would share one dependency surface
- marketing assets would sit next to product code
- future video variants would create noise in the app package

For this repo state, a standalone project folder is the lowest-friction option.

## Recommended Folder Shape

```text
assets/marketing/video/
  package.json
  tsconfig.json
  remotion.config.ts
  src/
    Root.tsx
    compositions/
      PickRankLandingVideo/
        PickRankLandingVideo.tsx
        schema.ts
        timeline.ts
        scenes/
          HookScene.tsx
          IntroScene.tsx
          SelectionScene.tsx
          RankingScene.tsx
          ScoringScene.tsx
          DifferentiatorScene.tsx
          NationalScene.tsx
          CtaScene.tsx
        components/
          FullscreenText.tsx
          SectionEyebrow.tsx
          PhoneFrame.tsx
          SlateCard.tsx
          RankedList.tsx
          AccuracyScore.tsx
          LeaderboardCard.tsx
          AvatarRow.tsx
          EndCard.tsx
        lib/
          motion.ts
          theme.ts
    data/
      pickrank-launch-video.ts
  out/
    pickrank-landing-video.mp4
    pickrank-landing-thumb.png
```

`out/` and `node_modules/` should stay ignored. The repo should keep the source project and lockfile, not rendered exports or installed packages.

## Composition Plan

### Primary Composition

- Folder: `Marketing`
- Composition id: `PickRankLandingVideo`
- Size: `1920x1080`
- FPS: `30`
- Duration: `960` frames
- Total runtime: `32s`

### Optional Supporting Outputs

- Still id: `PickRankLandingThumb`
- Purpose: homepage poster frame or video thumbnail

Keep version 1 to one main video plus one thumbnail. Do not add social variants yet.

## Build Approach

### Composition Registration

Register the main composition in `src/Root.tsx` under a `Marketing` folder and keep props JSON-serializable.

### Timing Approach

Use explicit frame ranges and centralize them in `timeline.ts`. Each scene should read its own local frame through `Sequence`.

### Animation Approach

Use `interpolate()` with clamped frame ranges and crisp ease-out curves for entrances. Reuse shared timing helpers from `lib/motion.ts` instead of repeating bespoke animation math inside each scene.

### Asset Approach

Keep the current build self-contained in `assets/marketing/video/`. Add `public/` only if a later cut truly needs local media files.

## Concrete Timeline

The current baseline uses eight short scenes with one idea per scene.

| Scene | Frames | Time | Purpose |
| --- | ---: | ---: | --- |
| Hook | `0-89` | `0:00-0:03` | Open with a fast, clear challenge |
| Intro | `90-179` | `0:03-0:06` | Define PickRank in one sentence |
| Selection | `180-299` | `0:06-0:10` | Show the 15-player slate and 10-pick task |
| Ranking | `300-419` | `0:10-0:14` | Show drag-and-rank movement |
| Scoring | `420-539` | `0:14-0:18` | Explain accuracy-based scoring |
| Differentiator | `540-659` | `0:18-0:22` | Show why it feels simpler than fantasy |
| National | `660-809` | `0:22-0:27` | Show the shared leaderboard payoff |
| CTA | `810-959` | `0:27-0:32` | End cleanly with a waitlist CTA |

## Scene Map

### 1. Hook

- Frames: `0-89`
- Goal: stop the scroll with a fast challenge before showing UI depth
- Copy beats:
  - `Pick 10.`
  - `Rank them.`
  - `Beat your friends.`
- Visual treatment:
  - full-screen type
  - restrained dark-sports hybrid background
  - subtle grain or field-line texture
  - no product UI yet
- Motion:
  - staggered headline reveals
  - low-motion background drift
  - one sharp exit transition at frame `78`
- Props:
  - `lines: string[]`
  - `backgroundVariant: "texture-grid"`
  - `accentColor: "#2563EB"`

### 2. Intro

- Frames: `90-179`
- Goal: define PickRank quickly and cleanly
- Copy beats:
  - `Meet PickRank`
  - `A skill-based NFL ranking contest`
- Visual treatment:
  - wordmark reveal
  - contest cards or slate modules entering from depth-flat layers
  - soft blue accents on light cards
- Motion:
  - wordmark fade and rise
  - two or three cards slide in with slight overlap
- Props:
  - `headline`
  - `subhead`
  - `featureCards`

### 3. Selection

- Frames: `180-299`
- Goal: show the contest setup before any ranking animation starts
- Copy beats:
  - `15-player slate`
  - `Choose 10`
  - `QB Passing Yards`
- Visual treatment:
  - phone-frame or stylized panel
  - 15-player slate visible
  - 10 selected players highlighted
- Motion:
  - selection chips settle in
  - chosen players highlight cleanly
- Props:
  - `statCategory: "QB Passing Yards"`
  - `allPlayers`
  - `selectedPlayers`
- Guardrail:
  - show the contest as a slate-ranking challenge
  - do not introduce payouts, wallet balances, or betting language

### 4. Ranking

- Frames: `300-419`
- Goal: make the ranking interaction instantly legible
- Copy beats:
  - `Rank the slate`
  - `Drag players into order`
- Visual treatment:
  - ranked list in a phone frame
  - one dragged row as the focal motion beat
- Motion:
  - dragged player lifts and settles
  - rank numbers update cleanly
- Props:
  - `rankedPlayers`
  - `draggedPlayer`
  - `draggedFrom`
  - `draggedTo`

### 5. Scoring

- Frames: `420-539`
- Goal: explain how accuracy turns into a result
- Copy beats:
  - `Closer picks score better`
  - `Get scored on accuracy`
- Visual treatment:
  - side-by-side picked rank and actual rank
  - simple score badge
- Motion:
  - result badge settles in
  - supporting line lands last
- Props:
  - `player`
  - `pickedRank`
  - `actualRank`
  - `distance`
  - `scoreSummary`
  - `supportingLine`

### 6. Differentiator

- Frames: `540-659`
- Goal: make the format feel simpler without sounding defensive
- Copy beats:
  - `No full roster`
  - `No long season`
  - `One weekly result`
- Visual treatment:
  - clean comparison-style typography
  - no cluttered fantasy-dashboard parody
- Motion:
  - each line lands in sequence
- Props:
  - `headline`
  - `lines`

### 7. National

- Frames: `660-809`
- Goal: move from mechanic to shared competition
- Copy beats:
  - `Beat the field`
  - `One nationwide board`
- Visual treatment:
  - leaderboard card
  - restrained highlight on the user row
- Motion:
  - rows settle into final order
  - highlighted row pulses once
- Props:
  - `headline`
  - `supportingLine`
  - `leaderboardRows`
  - `highlightedUser`

### 8. CTA

- Frames: `810-959`
- Goal: end with one clear ask
- Copy beats:
  - `PickRank`
  - `Rank the slate`
  - `Beat the field`
  - `Join the waitlist`
- Visual treatment:
  - clean end card
  - wordmark
  - landing-page style CTA button
  - slow atmospheric motion behind the lockup
- Motion:
  - headline settles first
  - CTA button appears second
  - final hold long enough for homepage embed pause state
- Props:
  - `headline`
  - `supportingLines`
  - `ctaLabel`
  - `ctaUrlLabel`

## Reusable Components

Keep the scene layer thin. Most rendering should happen through a few reusable blocks:

- `FullscreenText`
  - for hook and CTA typography scenes
- `PhoneFrame`
  - reusable mobile shell for mechanic shots
- `SlateCard`
  - compact contest or stat-category panel
- `RankedList`
  - numbered list with animated reordering
- `AccuracyScore`
  - result badge or score callout
- `LeaderboardCard`
  - standings layout used in the social scene
- `EndCard`
  - final lockup with wordmark and CTA

## Data Model

Keep on-screen copy and sample data out of scene files.

Recommended source:

```text
src/data/pickrank-launch-video.ts
```

Recommended shape:

```ts
export type LaunchVideoData = {
  meta: {
    compositionId: "PickRankLandingVideo";
    durationInFrames: number;
    fps: number;
  };
  scenes: {
    hook: {
      lines: string[];
    };
    intro: {
      headline: string;
      subhead: string;
    };
    selection: {
      statCategory: string;
      allPlayers: string[];
      selectedPlayers: string[];
    };
    ranking: {
      rankedPlayers: string[];
      draggedPlayer: string;
      draggedFrom: number;
      draggedTo: number;
    };
    scoring: {
      player: string;
      pickedRank: number;
      actualRank: number;
      distance: number;
      scoreSummary: string;
      supportingLine: string;
    };
    differentiator: {
      headline: string;
      lines: string[];
    };
    national: {
      headline: string;
      supportingLine: string;
      leaderboardRows: Array<{name: string; points: number; region: string}>;
      highlightedUser: string;
    };
    cta: {
      headline: string;
      supportingLines: string[];
      ctaLabel: string;
      ctaUrlLabel: string;
    };
  };
};
```

This keeps the brief editable without rewriting scene logic.

## Asset Plan

### Required For First Build

- PickRank wordmark
- PickRank icon
- one licensed music bed
- one voiceover track or temporary scratch narration
- one texture background

### Recommended For Better Polish

- recreated product UI cards based on current design direction
- lightweight avatar set
- homepage poster frame still

### Better To Avoid In Version 1

- literal real-player photography
- sportsbook-style green odds visuals
- prize-pool-heavy graphics
- money-first motion beats

If the product UI is not polished enough yet, use stylized UI-inspired blocks rather than forcing real screenshots into every scene.

## Sample Props For Version 1

Use generic or placeholder-safe sample content first.

- `allPlayers`
  - `Josh Allen`
  - `Joe Burrow`
  - `Jalen Hurts`
  - `Patrick Mahomes`
  - `Brock Purdy`
- `leaderboardRows`
  - `Texas Tate`, `67`, `TX`
  - `Philly Phil`, `65`, `PA`
  - `Miami Max`, `64`, `FL`
  - `You`, `61`, `CA`

That keeps the mechanic legible without creating rights or product-readiness confusion.

## Suggested Scaffold Sequence

When you are ready to implement, the cleanest order is:

1. Keep `assets/marketing/video/` as the standalone Remotion app.
2. Register `PickRankLandingVideo` and `PickRankLandingThumb`.
3. Keep shared theme and motion helpers centralized.
4. Refine scenes in this order:
   - Hook
   - Selection
   - Ranking
   - Scoring
   - National
   - CTA
5. Add temporary audio last, after pacing is readable without sound.

That order gets a presentable first cut faster than starting with the most complex mechanic animation.

## What Not To Do In This Slice

- do not add Remotion dependencies to the current Next.js app package
- do not mix video assets into `app/` or `components/`
- do not couple the video to unfinished product routes
- do not add fantasy-rule depth beyond the brief
- do not imply public real-money launch readiness

## Basis

This recommendation is based on:

- repo guidance in `docs/agent-handoff.md`
- product positioning in `spec/product_spec.md`
- visual direction constraints in `docs/design/figma-v1.md`
- messaging and output goals in `docs/marketing/remotion-pickrank-launch-video-brief.md`
- Remotion best-practice guidance for standalone setup, composition folders, frame timing, sequencing, and `staticFile()` asset handling
