# PickRank Marketing Video

This directory holds the source project for PickRank landing-page and demand-gen video assets.

Keep source files here:

- Remotion app code in `src/`
- project config
- lockfile and package metadata

Do not commit generated artifacts:

- `node_modules/`
- `out/`

Keep the committed baseline narrow:

- keep the active default bed at `public/audio/locked-in-final.wav`
- keep short review exports that directly support the current approved cut
- keep only the in-use CTA logo asset under `public/brand/`

Leave local review-only extras outside the committed baseline:

- throwaway hype-bed comparison WAVs
- the raw `locked-in-source/` license package dump
- alternate logo review files that are not wired into the current cut

If future audio experiments are needed again, use the helper in `scripts/` to regenerate local comparison beds instead of committing the old review batch.

## Commands

Install dependencies:

```console
npm install
```

Start the Remotion studio:

```console
npm run dev
```

Render the main landing-page video:

```console
npm run render
```

Render the thumbnail still:

```console
npm run still
```

## Related PickRank Docs

- `docs/marketing/remotion-pickrank-launch-video-brief.md`
- `docs/marketing/remotion-workflow-recommendation.md`
