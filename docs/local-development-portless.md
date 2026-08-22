# Optional Portless local development

Portless is an optional local development layer for stable named URLs. It is useful when several PickRank worktrees or local services run at the same time.

The canonical PickRank path remains:

```text
npm run dev
http://127.0.0.1:3000
```

Playwright and GitHub Actions continue to use that direct path. Portless is not required for tests, builds, continuous integration, previews, or production.

## Install and run

Portless is pre-1.0. Pin the version for a repeatable local setup:

```bash
npm install --global portless@0.15.5
portless
```

The repository `portless.json` maps the default `dev` script to `pickrank.localhost`. A linked Git worktree receives a branch-prefixed host, such as `fix-ui.pickrank.localhost`.

Use `portless list` to inspect active routes. Use `portless doctor` for read-only diagnostics. Use `portless clean` to remove Portless state, certificates, and host entries when you stop using it.

## Auth boundary

Do not treat `https://pickrank.localhost` as a complete OAuth environment. Strict OAuth providers can reject `.localhost` redirect URLs. Keep direct `127.0.0.1:3000` for the normal local Google sign-in and magic-link path unless the exact Portless origin is configured in Google, Supabase, and the app environment.

If local auth parity becomes important, use a custom owned-domain TLD only after explicit review. For example, Portless can use a local host under `dev.pickrankgames.com`, but the exact callback and redirect allowlists must be configured before testing.

Do not enable LAN mode, Tailscale Funnel, ngrok, or the startup service as part of the default PickRank workflow.

## Pilot checks

Before using Portless for a worktree, confirm:

1. The named URL loads and hot reload works.
2. Server Actions and form submissions stay on the named host.
3. The direct `127.0.0.1:3000` workflow still works.
4. Auth tests use the direct local origin unless the custom-origin setup is approved and configured.
5. Worktree URLs do not expose the app outside the local machine.
