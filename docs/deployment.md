# PickRank Cloud Deployment Guide

## Purpose

Get the current Phase 0 PickRank app to a shareable cloud URL with the smallest safe path.

## Recommended Path: Vercel

Vercel is the shortest path because PickRank is already a standard Next.js app and the repo is already connected to GitHub.

### What Vercel Will Do

Vercel will:

- pull the app from GitHub
- install dependencies from `package-lock.json`
- run the production build
- host the app at a public preview URL
- redeploy automatically after future GitHub pushes

### Click-By-Click Setup

1. Go to [vercel.com](https://vercel.com).
2. Sign in with GitHub.
3. Click `Add New...`.
4. Click `Project`.
5. Choose `parkerhlevy/pickrank-app`.
6. Keep the detected framework as `Next.js`.
7. Keep the default settings:
   - Build command: `npm run build`
   - Install command: `npm install`
   - Output directory: leave blank/default
8. Add the environment variables below before testing auth in preview or production.
9. Click `Deploy`.
10. When the deploy finishes, open the generated Vercel URL and confirm the PickRank homepage loads.

## Environment Variables

The repo includes `.env.example` with the variables PickRank needs for the current auth foundation:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

For the current Phase 1 auth foundation, these values should be set in both places:

- local `.env.local`
- Vercel `Project Settings -> Environment Variables`

Recommended values:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase public anon key
- `NEXT_PUBLIC_APP_URL`: the exact app origin receiving auth callbacks
- `SUPABASE_SERVICE_ROLE_KEY`: keep stored for future trusted server work, but do not expose it to client code

Example:

```text
Local:  NEXT_PUBLIC_APP_URL=http://localhost:3000
Vercel: NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

Before testing the auth flow, add the real Supabase values in Vercel under:

```text
Project Settings -> Environment Variables
```

Do not commit real secrets to the repo.

## Current Auth Wiring Points

The expected auth path is now:

1. `/auth` submits an email sign-in request through Supabase.
2. Supabase redirects back to `/auth/callback`.
3. The callback route exchanges the code for a session cookie.
4. `/profile` reads the authenticated session on the server.

This keeps the slice narrow:

- no real-money logic
- no wallet logic
- no scoring
- no compliance flows
- no profile table writes

## Replit Alternative

Replit can also run the app, but it is a less direct path for the current GitHub-first workflow.

Use Replit if the immediate goal is a hands-on sandbox. Use Vercel if the goal is the cleanest shareable cloud URL tied to the production repo.

Basic Replit path:

1. Create a new Replit project from GitHub.
2. Import `parkerhlevy/pickrank-app`.
3. Use the Node.js environment.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the Replit web preview.

## Deployment Readiness Checklist

Before sending the link around, confirm:

- `npm run typecheck` passes
- `npm run test` passes
- `npm run build` passes
- the homepage opens
- `/contests`, `/leaderboard`, `/wallet`, `/profile`, `/how-it-works`, and `/auth` open
- no real payment, wallet, eligibility, or scoring behavior is implied as live

## Current Recommendation

Deploy the current Phase 0 app to Vercel now. After the URL exists, use future small PRs for Phase 1 app shell and navigation improvements.
