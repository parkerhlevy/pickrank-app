# PickRank Cloud Deployment Guide

## Purpose

Get PickRank to a shareable cloud URL with the smallest safe path, then finish the minimum Supabase auth setup needed for hosted sign-in.

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
8. Add the required frontend auth variables before testing sign-in:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL`
9. Click `Deploy`.
10. When the deploy finishes, open the generated Vercel URL and confirm the PickRank homepage loads.

## Environment Variables

The repo includes `.env.example` with the app-side variables PickRank needs once Supabase-backed auth and data flows are active:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

Add the real values in Vercel under:

```text
Project Settings -> Environment Variables
```

Do not commit real secrets to the repo.

## Supabase Hosted Auth Setup

### Google Sign-In

PickRank now expects Google to be the primary low-friction sign-in path.

Configure this in Supabase:

1. Open `Authentication -> Providers -> Google`.
2. Turn on the Google provider.
3. Create a Google OAuth web application in Google Cloud.
4. In Google Cloud, add your app origins:
   - `http://localhost:3000`
   - your Vercel preview or production origin
5. In Google Cloud, add the Supabase Google callback URL shown on the provider page.
6. Paste the Google Client ID and Client Secret into Supabase and save.

For Vercel preview testing, PickRank uses the trusted Vercel request host as the OAuth callback origin and stores the intended post-auth return path in a short-lived app cookie. Supabase must allow the clean preview callback URL, for example:

```text
https://pickrank-app-git-*-parker-levys-projects.vercel.app/auth/callback
```

Production should stay pinned to `NEXT_PUBLIC_APP_URL`.

### Email Fallback With Custom SMTP

PickRank keeps email magic link as a fallback, but Supabase's built-in sender is not production-safe.

Configure this in Supabase:

1. Choose a transactional email provider such as Resend, Postmark, SendGrid, or SES.
2. Open `Authentication -> Emails -> SMTP Settings`.
3. Turn on custom SMTP.
4. Enter your SMTP host, port, user, password, sender email, and sender name.
5. Save the settings.
6. Open `Authentication -> Rate Limits` and raise the email send limit to match your expected usage.

Business note:

- Google removes sign-in dependence on auth emails for most users.
- Custom SMTP keeps email fallback, recovery, and account management dependable in production.

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
- Google sign-in is enabled in Supabase
- custom SMTP is enabled in Supabase if email fallback is meant to be live
- no real payment, wallet, eligibility, or scoring behavior is implied as live

## Current Recommendation

Deploy to Vercel, configure Supabase hosted auth next, make Google the default login path, and keep email magic link only as a custom-SMTP-backed fallback.
