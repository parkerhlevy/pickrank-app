# PickRank

PickRank is a skill-based NFL pick-order contest app.

## Phase 0 Foundation

This repo now has the starter foundation for the app:

- Next.js
- TypeScript
- Tailwind CSS
- shadcn-style starter UI components
- placeholder routes
- bottom navigation placeholder
- Supabase client/server files
- environment example
- foundation database migration
- seed placeholder
- Vitest setup
- Playwright setup

## Intentionally Not Included Yet

- payments
- wallet ledger
- scoring engine
- sports data provider
- real contest entry logic
- full auth UX
- lineup drag-and-drop
- results reveal

## Local Setup

Install dependencies, copy `.env.example` to `.env.local`, add Supabase values later, then run the dev server.

Useful commands:

- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run typecheck`
- `npm run test`
- `npm run test:e2e`

## Supabase

Database migrations live in `db/migrations`.

Seed placeholders live in `db/seed`.

Do not commit real secrets.

## Next Phase

After Phase 0 is verified locally, move to Phase 1: App Shell + Navigation.
