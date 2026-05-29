# PickRank Agent Handoff

## Purpose

PickRank is a skill-based NFL pick-order contest app.

The product is being built from the specs in `/spec`. The goal is to keep the implementation aligned with the MVP plan while allowing coding agents to implement small, reviewable slices.

## Operating Model

GitHub and this repo are the permanent project record for PickRank. Product specs, implementation plans, code, tests, QA plans, and final technical decisions belong here.

The local Codex workspace is a temporary workbench. Use it to inspect, edit, test, and verify changes before they go back to GitHub.

The intended app surface is cloud-based: Replit, Vercel, or another deployment environment where the app/site can run and be shared.

Avoid local-only complexity unless it directly helps get PickRank working in GitHub and cloud deployment.

Explain results in business-friendly language first: what changed, why it matters, what passed, and what Parker needs to do next. Add technical detail only when it helps the decision or next step.

## Current Repo State

The app currently has a Phase 0 foundation:

- Next.js app shell
- Global layout
- Bottom navigation
- Placeholder routes
- Tailwind/PostCSS configured
- Vitest wired
- Basic route smoke tests

## Core Commands

Run these before and after meaningful changes:

```bash
npm install
npm run dev
npm run typecheck
npm run test
```

The local app should run at:

```text
http://localhost:3000
```

## Current Routes

Core app routes:

```text
/
/contests
/leaderboard
/wallet
/profile
/how-it-works
/auth
```

Admin work may exist later under:

```text
/admin
```

Do not expose admin routes in the bottom navigation unless the product spec explicitly calls for it.

## Current Navigation

The bottom navigation currently includes:

```text
Contests
Leaderboard
Wallet
Profile
```

`/how-it-works` exists, but it is not currently in the bottom nav.

## Source of Truth

Before implementing features, read the relevant files in `/spec`.

The master spec is:

```text
/spec/product_spec.md
```

Use the more specific spec files when they exist.

## Implementation Principles

Build in small, reviewable slices.

Prefer:

- One feature or app area per commit
- Clear placeholder states before complex logic
- Type-safe interfaces
- Basic tests for routes and important business rules
- Simple mobile-first UI

Avoid:

- Large unreviewable rewrites
- Implementing payments before wallet rules are fully confirmed
- Implementing real-money flows without compliance review
- Changing product rules unless the spec is updated first
- Adding major dependencies without a clear reason

## Current Known Decisions

The MVP includes:

- Skill-based NFL pick-order contests
- Contest lifecycle states
- Leaderboard behavior
- Tie handling
- Payout structure
- 30% platform fee
- Wallet/site credit system
- Admin contest setup
- Auth/profile requirements
- Compliance and responsible play requirements

## Suggested Next Implementation Slice

Next recommended slice:

```text
Create consistent placeholder pages for all MVP routes and add route/nav tests.
```

Definition of done:

- All MVP placeholder pages render
- Bottom nav links only to intended primary routes
- Route smoke tests pass
- Typecheck passes
- No generated files are committed accidentally

## Generated Files to Avoid Committing

Do not commit local/generated artifacts such as:

```text
.next/
tsconfig.tsbuildinfo
node_modules/
```

If Next modifies `next-env.d.ts` automatically during local dev, review carefully before committing. In most cases, do not commit unrelated automatic changes.

## Git Workflow

Before starting work:

```bash
git status
```

After changes:

```bash
npm run typecheck
npm run test
git status
git diff
```

Commit only focused changes.

Example:

```bash
git add <changed-files>
git commit -m "Describe focused change"
git push
```

## Human Review Required Before

Require human review before implementing or changing:

- Wallet ledger rules
- Deposits or withdrawals
- Payment flows
- Payout logic
- Contest scoring rules
- Eligibility or compliance rules
- Responsible play features
- Supabase schema migrations
- Auth provider setup
