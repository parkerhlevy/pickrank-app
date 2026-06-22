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

## Phase 1 Auth Foundation

The repo now includes the minimum safe auth foundation needed to move beyond the visual-only auth placeholder:

- shared Supabase environment helpers
- server and browser Supabase client wiring
- `/auth` email link request flow
- `/auth/callback` session exchange route
- signed-in session detection on `/profile`

This is still placeholder-safe:

- no payments
- no wallet ledger behavior
- no scoring
- no contest entry creation
- no compliance approval flow
- no profile database writes

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

Install dependencies, copy `.env.example` to `.env.local`, fill in the Supabase project values, then run the dev server.

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

Minimum auth wiring points:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

`SUPABASE_SERVICE_ROLE_KEY` remains reserved for future trusted server/admin work and is not used by the current auth foundation.

Do not commit real secrets.

## Current Auth Flow

Once local env vars and matching Vercel env vars are set:

1. open `/auth`
2. request an email sign-in link
3. follow the callback link
4. confirm `/profile` shows the active session
