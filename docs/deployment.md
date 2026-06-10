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
8. For the first Phase 0 deploy, environment variables can be left blank because the current pages do not call Supabase at build time.
9. Click `Deploy`.
10. When the deploy finishes, open the generated Vercel URL and confirm the PickRank homepage loads.

## Environment Variables

The repo includes `.env.example` with the variables PickRank will need once Supabase-backed auth and data flows are active:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

For Phase 0, these are not required for the placeholder app shell to build and load.

Before implementing real auth, database reads, contest entries, wallet behavior, or admin tools, add the real Supabase values in Vercel under:

```text
Project Settings -> Environment Variables
```

Do not commit real secrets to the repo.

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
