# PickRank Remotion Launch Video Brief

## Purpose

Create a short launch video that explains what PickRank is, why it feels different from typical fantasy products, and why someone should want to compete with friends on it.

This is not a rules-deep explainer and not a real-money or payout-focused ad.

Primary job:

- make the concept instantly understandable
- make it feel competitive and social
- make the product feel real and worth signing up for

Secondary job:

- provide a clean embedded video for the homepage landing page

## Output Target

- Primary format: `16:9`
- Recommended size: `1920x1080`
- FPS: `30`
- Target duration: `45-60 seconds`
- Tone: clean, competitive, modern, confident
- Audience: sports fans who like fantasy competition and friendly group bragging rights

## Platform Context

This video will initially live on the PickRank landing page.

That means:

- the message has to land without prior context
- the first 5 seconds matter a lot
- the video should work muted, with strong on-screen text
- narration should help, but visuals and captions should carry the meaning

## Product Guardrails

Stay aligned with the repo and product positioning.

Do:

- frame PickRank as a skill-based NFL ranking contest
- emphasize ranking players, accuracy, and competition
- emphasize playing against friends or a shared field
- keep terminology simple and easy to follow
- make the app feel mobile-first and modern

Do not:

- lean on gambling, betting, casino, or sportsbook energy
- overemphasize prize pools, winnings, or money language
- imply full real-money launch readiness
- invent unsupported product mechanics
- make the concept feel complicated or stats-nerdy too early

## Core Message

If fantasy sports makes you feel like luck matters too much, PickRank gives you a simpler, sharper way to compete.

You do not build a full roster.
You do not manage a long season.
You rank a slate of players around one stat category.
Then you see how close your order was to the real final results.

It is fast to understand, easy to enter, and naturally competitive with friends.

## Single-Sentence Positioning

PickRank is a skill-based fantasy contest where you rank a player slate, compete on accuracy, and prove who actually knows the games best.

## Desired Viewer Reaction

By the end of the video, the viewer should think:

- I get it immediately
- this feels easier to jump into than traditional fantasy
- this would be fun to run with friends
- I want to sign up and try it

## Recommended Structure

Keep the pace fast but readable.
Do not overpack the screen.
Prefer one idea at a time.

### Scene 1: Hook

Duration: `0:00-0:05`

Goal:
Stop the scroll and make the core tension clear.

Suggested on-screen text:

- `Fantasy is fun.`
- `But proving who knows the games best should be simpler.`

Visual direction:

- bold full-screen typography
- fast editorial cuts
- subtle sports texture or abstract motion background
- no cluttered UI yet

Suggested narration:

`Fantasy is fun. But proving who actually knows the games best should be simpler.`

### Scene 2: What PickRank Is

Duration: `0:05-0:13`

Goal:
Define the product in one clean idea.

Suggested on-screen text:

- `Meet PickRank`
- `A skill-based NFL ranking contest`

Visual direction:

- PickRank wordmark reveal
- clean logo lockup
- animated cards or slate modules entering frame

Suggested narration:

`PickRank is a skill-based NFL contest built around one simple challenge.`

### Scene 3: The Mechanic

Duration: `0:13-0:24`

Goal:
Explain how it works in the simplest possible way.

Suggested on-screen text sequence:

- `Rank the slate`
- `One stat category`
- `Put players in order`
- `Get scored on accuracy`

Visual direction:

- UI-inspired motion showing a small player slate
- drag-and-rank interaction
- a ranked list locking into place
- final results comparing user order against actual order

Suggested narration:

`You get a slate of players and one stat category. Rank them in the order you think they will finish. When the games end, your score is based on how close you were to the real results.`

### Scene 4: Why It Feels Better

Duration: `0:24-0:36`

Goal:
Differentiate PickRank from traditional fantasy without sounding negative or defensive.

Suggested on-screen text:

- `No full roster management`
- `No season-long maintenance`
- `Just picks, accuracy, and competition`

Visual direction:

- clean comparison-style motion
- avoid cheesy split-screen clichés
- keep typography and card motion crisp

Suggested narration:

`No full roster management. No long season commitment. Just picks, accuracy, and real competition.`

### Scene 5: Social Payoff

Duration: `0:36-0:48`

Goal:
Make it feel fun with friends, not just abstractly clever.

Suggested on-screen text:

- `Run it with your friends`
- `See who called it best`
- `Climb the board`

Visual direction:

- leaderboard motion
- profile chips or avatars
- podium or ranking movement
- subtle celebration energy, not casino energy

Suggested narration:

`It is the kind of game that works instantly with your friends. Make your picks, compare results, and see who really called the week best.`

### Scene 6: CTA

Duration: `0:48-0:58`

Goal:
End with a clean next step.

Suggested on-screen text:

- `PickRank`
- `Rank the slate`
- `Compete on accuracy`
- `Sign up for early access`

Visual direction:

- clean landing-page style finish
- logo
- button-style CTA treatment
- optional subtle background motion

Suggested narration:

`PickRank makes fantasy competition simpler, faster, and sharper. Sign up and be early.`

## Recommended Voiceover Style

- confident
- conversational
- concise
- sports-literate but not shouty
- clear enough that a new user understands the product on first listen

Avoid:

- hype-man energy
- betting-ad voice
- overly dramatic trailer voice
- dense sports jargon

## Recommended Motion Style

Use motion that feels like premium product marketing, not a template montage.

Recommended:

- strong ease-out entrances
- quick card slides
- number flips
- ranked-list movement
- scoreboard transitions
- layered typography reveals

Avoid:

- excessive zooms
- constant motion on every element
- noisy particle effects
- meme-style editing
- fake 3D gimmicks unless used very sparingly

## Typography Direction

Choose typography that feels athletic, modern, and legible.

Recommended behavior:

- large headline moments
- short on-screen lines
- strong hierarchy between hook, explanation, and CTA
- enough dwell time for muted viewing

Text should never move so much that it becomes hard to read.

## Visual System

Base the visual language on the current PickRank product direction:

- blue-led accent system
- clean light surfaces or a restrained dark-sports hybrid
- soft card edges
- mobile UI references
- high contrast for readability

Do not drift into:

- neon sportsbook visuals
- green odds-board styling
- red urgent-casino styling

## Audio Direction

Music:

- modern
- rhythmic
- competitive
- lightly cinematic
- should support pace, not overpower explanation

Sound design:

- subtle UI clicks
- soft whooshes
- restrained rank-lock or score-hit moments

No heavy impacts or trailer booms.

## Remotion Build Guidance

Remotion is code-based, so this should be built as a composition, not treated like a prompt-only text-to-video request.

Recommended implementation shape:

- one main composition for the landing-page version
- `1920x1080`, `30fps`, `45-60s`
- scene timing controlled with explicit frame ranges
- on-screen copy as structured data, not hardcoded inline everywhere
- reusable components for:
  - full-screen text scene
  - app-card or player-slate scene
  - ranking list animation
  - leaderboard scene
  - CTA end card

Recommended composition organization:

- `Marketing/PickRankLandingVideo`
- optional stills for thumbnail frames

Recommended animation behavior:

- prefer `interpolate()` with clear frame windows
- use clean ease-out curves for entrances
- keep transitions intentional and fast

## Asset Wishlist

Helpful assets if available:

- PickRank wordmark
- app icon
- UI screenshots or recreated UI blocks from the live app
- sample avatars
- subtle sports texture background
- music bed
- optional voiceover track

If UI is not polished enough yet, use stylized UI-inspired blocks instead of forcing literal product screenshots everywhere.

## Best-First Version

For the first version, optimize for clarity over production complexity.

That means:

- 45-55 seconds
- 6 scenes max
- one clear voiceover track
- strong captions or on-screen text
- no feature sprawl
- no deep rules explanation

## Prompt For A Coding Agent Building The Remotion Video

```text
Create a Remotion marketing video for PickRank.

Build one main composition named `PickRankLandingVideo` in 1920x1080 at 30fps with a total duration between 45 and 60 seconds.

The purpose of the video is to explain what PickRank is and why it feels like a simpler, more competitive fantasy sports game to play with friends.

Core product message:
PickRank is a skill-based NFL ranking contest where users rank a player slate around one stat category and compete based on how close their order is to the final real results.

Audience:
Sports fans who enjoy fantasy competition but want something faster to understand and easier to play with friends.

Tone:
Modern, competitive, clean, easy to follow, not casino-like, not gambling-coded.

Constraints:
- Use concise on-screen text that works even if the video is muted.
- Do not overemphasize prize pools, betting, or money.
- Do not imply full real-money launch readiness.
- Keep the concept easy to understand in the first 15 seconds.
- Prefer premium product-marketing motion, not generic template effects.

Required scene flow:
1. Hook: fantasy is fun, but proving who knows the games best should be simpler.
2. Introduce PickRank as a skill-based NFL ranking contest.
3. Explain the mechanic: rank the slate, one stat category, score based on accuracy.
4. Differentiate it from traditional fantasy: no full roster management, no long season commitment, just picks and competition.
5. Show the social payoff: compete with friends, compare picks, climb the board.
6. End with a CTA to sign up for early access.

Suggested on-screen phrases to use or adapt:
- Fantasy is fun. But proving who knows the games best should be simpler.
- Meet PickRank
- A skill-based NFL ranking contest
- Rank the slate
- One stat category
- Get scored on accuracy
- Run it with your friends
- See who called it best
- Sign up for early access

Build the video with reusable components for:
- fullscreen text scenes
- ranking list / player slate animation
- leaderboard or standings scene
- CTA end card

Use clear frame-based timing with readable pacing.
Prefer ease-out entrances and restrained transitions.
Use the existing PickRank blue-led visual language where possible.

If real UI assets are limited, create stylized UI-inspired panels instead of blocking on product screenshots.
```

## Optional Next Versions

After the first landing-page version works, consider:

- a `9:16` vertical cut for social
- a `15-20 second` teaser
- a silent autoplay homepage loop
- a version with stronger real UI once the app polish improves
