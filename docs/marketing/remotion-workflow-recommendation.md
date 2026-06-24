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
marketing-video/
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

For this repo state, a sibling project is the lowest-friction option.

## Recommended Folder Shape

```text
marketing-video/
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
          MechanicScene.tsx
          DifferentiatorScene.tsx
          SocialScene.tsx
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
  public/
    brand/
      pickrank-wordmark.svg
      pickrank-icon.svg
    audio/
      launch-bed.mp3
      launch-voiceover.wav
    textures/
      stadium-grain.png
      grid-noise.png
    ui/
      app-shell-frame.png
      contest-card.png
      leaderboard-card.png
```

## Composition Plan

### Primary Composition

- Folder: `Marketing`
- Composition id: `PickRankLandingVideo`
- Size: `1920x1080`
- FPS: `30`
- Duration: `1560` frames
- Total runtime: `52s`

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

Put local assets in `marketing-video/public/` and reference them with `staticFile()`.

## Concrete Timeline

Version 1 should stay at six scenes, one idea at a time.

| Scene | Frames | Time | Purpose |
| --- | ---: | ---: | --- |
| Hook | `0-149` | `0:00-0:05` | Stop the scroll and set the tension |
| Intro | `150-389` | `0:05-0:13` | Define PickRank in one sentence |
| Mechanic | `390-719` | `0:13-0:24` | Show ranking and accuracy scoring |
| Differentiator | `720-1079` | `0:24-0:36` | Show why it feels simpler than fantasy |
| Social | `1080-1439` | `0:36-0:48` | Make the friend-group payoff feel real |
| CTA | `1440-1559` | `0:48-0:52` | End cleanly with early-access signup |

## Scene Map

### 1. Hook

- Frames: `0-149`
- Goal: make the viewer feel the problem before showing UI
- Copy beats:
  - `Fantasy is fun.`
  - `But proving who knows the games best`
  - `should be simpler.`
- Visual treatment:
  - full-screen type
  - restrained dark-sports hybrid background
  - subtle grain or field-line texture
  - no product UI yet
- Motion:
  - staggered headline reveals
  - low-motion background drift
  - one sharp exit transition at frame `132`
- Props:
  - `lines: string[]`
  - `backgroundVariant: "texture-grid"`
  - `accentColor: "#2563EB"`

### 2. Intro

- Frames: `150-389`
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
  - `logoPath`
  - `featureCards`

### 3. Mechanic

- Frames: `390-719`
- Goal: explain the game loop with almost no ambiguity
- Copy beats:
  - `Rank the slate`
  - `One stat category`
  - `Put players in order`
  - `Get scored on accuracy`
- Visual treatment:
  - phone-frame or stylized panel
  - 15-player slate implied, with 10 ranked slots highlighted
  - ranked list locks in
  - actual results compare against user order
- Motion:
  - drag-reorder interaction
  - rank numbers flip
  - score badge settles in at the end
- Props:
  - `statCategory: "QB Passing Yards"`
  - `availablePlayers`
  - `rankedPlayers`
  - `actualResults`
  - `scoreSummary`
- Guardrail:
  - show the contest as a slate-ranking challenge
  - do not introduce payouts, wallet balances, or betting language

### 4. Differentiator

- Frames: `720-1079`
- Goal: make the product feel simpler without attacking fantasy
- Copy beats:
  - `No full roster management`
  - `No season-long maintenance`
  - `Just picks, accuracy, and competition`
- Visual treatment:
  - one focused comparison canvas
  - left-side clutter collapses away
  - right-side PickRank flow remains clean
- Motion:
  - cluttered blocks sweep out
  - clean stack remains
  - final line lands centered
- Props:
  - `comparisonLabels`
  - `pickrankBenefits`

### 5. Social

- Frames: `1080-1439`
- Goal: move from abstract product explanation to social payoff
- Copy beats:
  - `Run it with your friends`
  - `See who called it best`
  - `Climb the board`
- Visual treatment:
  - leaderboard card
  - avatar chips
  - position changes
  - subtle podium energy
- Motion:
  - rows reorder into final standings
  - user row highlights briefly
  - first-place glow stays restrained
- Props:
  - `leaderboardRows`
  - `friendAvatars`
  - `highlightedUser`

### 6. CTA

- Frames: `1440-1559`
- Goal: end with one clear ask
- Copy beats:
  - `PickRank`
  - `Rank the slate`
  - `Compete on accuracy`
  - `Sign up for early access`
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
  - `logoPath`
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
    mechanic: {
      statCategory: string;
      availablePlayers: string[];
      rankedPlayers: string[];
      actualResults: string[];
      scoreSummary: string;
    };
    differentiator: {
      comparisonLabels: string[];
      pickrankBenefits: string[];
    };
    social: {
      leaderboardRows: Array<{name: string; points: number}>;
      highlightedUser: string;
    };
    cta: {
      headline: string;
      supportingLines: string[];
      ctaLabel: string;
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

- `availablePlayers`
  - `A. Carter`
  - `J. Brooks`
  - `M. Daniels`
  - `R. Evans`
  - `T. Fields`
- `leaderboardRows`
  - `Alex`, `67`
  - `Jordan`, `65`
  - `Casey`, `64`
  - `You`, `61`

That keeps the mechanic legible without creating rights or product-readiness confusion.

## Suggested Scaffold Sequence

When you are ready to implement, the cleanest order is:

1. Create `marketing-video/` as a standalone Remotion app.
2. Register `PickRankLandingVideo` and `PickRankLandingThumb`.
3. Add shared theme and motion helpers.
4. Build scenes in this order:
   - Hook
   - Intro
   - CTA
   - Mechanic
   - Social
   - Differentiator
5. Drop in temporary audio last, after pacing is readable without sound.

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
