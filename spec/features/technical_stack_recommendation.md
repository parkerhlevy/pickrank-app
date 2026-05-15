# MVP Technical Stack Recommendation

## Purpose
Recommend the practical MVP technical stack and AI-assisted build workflow for PickRank, optimized for a non-developer founder using GitHub-connected coding agents.

## Status
Recommended for MVP direction. Final stack decision should be confirmed before Phase 0 implementation.

## Anchor
Recommended MVP stack is a responsive Next.js web app with TypeScript, Supabase/Postgres for database/auth foundations, Vercel for deployment, Tailwind/shadcn for UI, and a service-oriented monolith architecture. Recommended AI build workflow is GitHub-first: use Codex or Claude Code for repo-aware implementation tasks, Cursor for local review/editing, and avoid no-code/vibe-app builders for core backend logic.

---

## Summary Recommendation

Build PickRank first as a responsive web app.

Recommended MVP stack:

```text
Frontend + app framework: Next.js + TypeScript
Database: Supabase Postgres
Auth: Supabase Auth
Backend/API: Next.js server actions / route handlers + Supabase server client
Hosting: Vercel
UI: Tailwind CSS + shadcn/ui
Validation: Zod
Testing: Vitest + Playwright
Payments: provider TBD, abstracted behind Payment Service
Stats provider: provider TBD, abstracted behind Stats Provider Service
Mobile/native later: Expo / React Native if needed
AI build workflow: Codex / Claude Code + GitHub + Cursor review loop
```

---

## Why This Stack

PickRank needs:

- fast iteration
- simple deployment
- relational data integrity
- strong transaction support
- auth without custom infrastructure
- easy AI coding-agent compatibility
- a clear path to production
- future mobile optionality

The product is not simple static content. It needs server-side correctness for contests, entries, lineups, wallet ledger, eligibility, scoring, and payouts.

For that reason, the MVP should use a Postgres-backed stack instead of a document-only database or pure no-code app builder.

---

# AI / Vibe Coding Tool Recommendation

## Recommended AI build workflow

Use a GitHub-first coding workflow:

```text
GitHub repo + specs
→ Codex or Claude Code for scoped implementation tasks
→ Pull request / branch review
→ Cursor for local inspection and small edits
→ Tests required before merging
```

This gives the best balance of:

- repo awareness
- file-by-file control
- test execution
- reviewable diffs
- fewer hidden abstractions
- easier rollback
- better fit for backend correctness

---

## Recommended tool roles

| Tool | Recommended Role | Why |
|---|---|---|
| Codex | Primary GitHub-connected implementation agent | Strong for scoped repo tasks, PRs, tests, refactors |
| Claude Code | Strong alternative / second-pass agent | Excellent repo understanding, terminal workflows, planning |
| Cursor | Local code review/editing environment | Best for hands-on inspection, diffs, small fixes |
| GitHub Copilot | Useful inside GitHub/IDE | Good support tool, especially if using GitHub-native workflow |
| Lovable/Bolt/v0-style app builders | Prototype UI only, not core backend | Fast visuals, but risky for wallet/scoring/compliance logic |
| Replit | Possible all-in-one prototype path | Useful sandbox, but less ideal than GitHub-first production repo |

---

## Best fit for Parker

Recommended path:

```text
1. Keep GitHub as source of truth.
2. Use Codex for implementation tasks from specs.
3. Use Claude Code for complex reasoning/refactors or second opinions.
4. Use Cursor when local code review/editing is needed.
5. Avoid letting visual app builders own the production codebase.
```

Reason:

PickRank is money-adjacent and state-heavy. We need traceable changes, tests, database migrations, and reviewable pull requests.

A pure vibe-app builder can help mock screens, but it should not be the main production system for:

- wallet ledger
- payouts
- refunds
- scoring
- eligibility
- contest lifecycle
- payment provider integration

---

## Tool-specific guidance

## Codex

Recommended use:

- primary repo implementation agent
- scoped feature branches
- database migrations
- route/API implementation
- tests
- refactors
- PR creation/review

Best prompt pattern:

```text
Repo: pickrank-app
Spec: /spec/features/backend_data_architecture.md
Task: Create the initial Supabase schema migration for users, contests, entries, and lineups only. Do not implement wallet yet. Add constraints and indexes from the spec. Add unit tests where applicable.
```

Use Codex for:

- Phase 0 setup
- schema migrations
- service modules
- route handlers
- unit tests
- Playwright flows
- bug fixes

Do not use Codex for:

- vague multi-phase tasks without boundaries
- approving its own financial logic without tests
- legal/compliance decisions

---

## Claude Code

Recommended use:

- second implementation option
- deeper repo reasoning
- refactor planning
- debugging tricky issues
- reviewing Codex-generated work
- creating implementation plans from specs

Best prompt pattern:

```text
Read /spec/features/implementation_roadmap.md and /spec/features/frontend_navigation.md. Propose the smallest Phase 0 implementation plan. Do not edit files yet. Identify risks and exact files to create.
```

Use Claude Code for:

- planning before implementation
- codebase Q&A
- multi-file refactors
- debugging
- test failure analysis
- PR review

---

## Cursor

Recommended use:

- local IDE
- manual inspection
- small guided edits
- understanding diffs
- reviewing generated code
- running local app/tests

Cursor is especially useful when Parker wants to see:

- what changed
- where files live
- how routes connect
- whether generated code is messy

Use Cursor as the local cockpit, not necessarily the autonomous primary builder.

---

## Lovable / Bolt / v0-style tools

Recommended use:

- quick visual prototypes
- landing page mockups
- contest card UI inspiration
- simple component ideas
- non-production screen exploration

Not recommended for core production backend.

Reason:

PickRank has real backend correctness needs:

- ledger integrity
- idempotency
- contest state transitions
- eligibility checks
- scoring correctness
- database constraints

These should live in a controlled GitHub repo with tests.

---

## Replit

Recommended use:

- possible prototype sandbox
- quick demos
- learning environment

Not recommended as primary production path if using GitHub + Supabase + Vercel.

Reason:

The recommended stack is already cleanly supported by GitHub + Vercel + Supabase.

---

# Recommended Architecture

## Frontend

```text
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
```

Use Next.js for:

- app routes
- public contest pages
- auth-gated flows
- admin/internal pages
- backend route handlers
- server-side data fetching
- simple deployment on Vercel

---

## Database + Auth

```text
Supabase
Postgres
Supabase Auth
Row Level Security where appropriate
```

Use Supabase for:

- Postgres database
- auth
- user/session handling
- database migrations
- local development tooling
- future realtime/notifications optionality

---

## Deployment

```text
Vercel
```

Use Vercel for:

- frontend hosting
- Next.js app deployment
- preview deployments
- environment variables
- simple GitHub deploy flow

---

## Styling/UI

```text
Tailwind CSS
shadcn/ui
lucide-react icons
```

Use this to keep UI implementation fast, consistent, and editable by AI coding tools.

---

## Testing

```text
Vitest
Playwright
```

Use Vitest for:

- scoring functions
- tie handling
- payout calculations
- wallet ledger helpers
- eligibility checks

Use Playwright for:

- contest entry flow
- lineup builder
- lock-state behavior
- results reveal
- admin publish flow

---

## Why Web-First Instead of Native Mobile First

PickRank should feel mobile-native, but the first build should still be responsive web.

Reasons:

- faster iteration
- easier debugging
- simpler deployment
- no app store review process
- easier sharing with testers
- easier admin/internal tooling
- easier AI-assisted development
- payment/compliance questions can be resolved before app store complexity

Future native mobile is still viable through Expo / React Native once the core loop is proven.

---

## Expo / React Native Position

Expo remains the recommended future path if PickRank needs native iOS/Android.

Do not start with Expo unless the immediate priority is app-store-native mobile.

Future path:

```text
MVP web proves product loop
→ backend/API stabilizes
→ Expo app consumes same backend
```

---

## Service-Oriented Monolith

Build as one app/repo first, but organize code by service boundaries.

Recommended internal modules:

```text
auth
users
eligibility
contests
entries
lineups
wallet
payments
stats
scoring
leaderboard
admin
notifications
audit
```

This keeps the MVP simple without blocking future scaling.

Do not build microservices for MVP.

---

## Suggested Repo Structure

Recommended app structure:

```text
pickrank-app/
  app/
    (public)/
      contests/
      how-it-works/
    (auth)/
      auth/
    (app)/
      profile/
      entries/
    admin/
      contests/
    api/
  components/
    ui/
    contest/
    lineup/
    wallet/
    admin/
  lib/
    supabase/
    auth/
    eligibility/
    contests/
    entries/
    lineups/
    wallet/
    payments/
    stats/
    scoring/
    leaderboard/
    audit/
  db/
    migrations/
    seed/
  spec/
    product_spec.md
    features/
  tests/
    unit/
    e2e/
```

---

## Stack Decisions

## 1. Frontend framework

| Option | Recommendation | Reason |
|---|---|---|
| Next.js | Recommended | Best web-first MVP path |
| Expo / React Native | Future path | Best native app path later |
| Flutter | Not recommended for MVP | Less aligned with current web/admin needs |
| Plain React/Vite | Not recommended | Would need more backend/deployment decisions |

Decision:

```text
Use Next.js for MVP.
```

---

## 2. Database

| Option | Recommendation | Reason |
|---|---|---|
| Supabase Postgres | Recommended | Relational data, auth integration, speed |
| Firebase/Firestore | Not recommended | Ledger/scoring/relational constraints are awkward |
| Custom Postgres + server | Good later | More setup burden for MVP |
| SQLite | Not recommended | Not ideal for hosted multi-user MVP |

Decision:

```text
Use Supabase Postgres for MVP.
```

---

## 3. Auth

| Option | Recommendation | Reason |
|---|---|---|
| Supabase Auth | Recommended | Integrated with Supabase/Postgres |
| Clerk | Good alternative | Excellent UX, extra vendor |
| Auth0 | Overkill for MVP | Enterprise-heavy |
| Custom auth | Not recommended | Security burden |

Decision:

```text
Use Supabase Auth unless a major blocker appears.
```

---

## 4. Hosting

| Option | Recommendation | Reason |
|---|---|---|
| Vercel | Recommended | Best fit for Next.js/GitHub previews |
| Render/Fly/Railway | Good for custom backend | More infra decisions |
| AWS/GCP | Not recommended for MVP | Too much operational overhead |

Decision:

```text
Use Vercel for Next.js hosting.
```

---

## 5. API/backend approach

Recommended:

```text
Next.js server-side functions + Supabase server client
```

Use server-only code for:

- contest entry
- lineup save
- lock validation
- admin publish
- scoring jobs
- wallet ledger updates
- eligibility checks

Do not run money-adjacent logic purely client-side.

---

## 6. Background jobs

MVP can start with simple scheduled jobs/scripts.

Needed jobs:

- contest open transition
- contest lock transition
- contest viability check
- scoring finalization
- payout processing
- stat correction recheck

Recommended early approach:

```text
Supabase cron / scheduled function or Vercel cron depending implementation fit
```

If jobs become complex later, consider a queue/worker system.

---

## 7. Payments

Payment provider remains open.

MVP technical direction:

```text
Build Payment Service abstraction now.
Use test/free-entry mode first.
Add real payment provider later.
```

Do not hard-wire product logic directly to one payment provider before legal/payment review.

---

## 8. Sports data

Sports data provider remains open.

MVP technical direction:

```text
Build Stats Provider Service abstraction now.
Use manual/test stats first.
Add provider integration later.
```

---

## 9. KYC / identity

KYC provider remains open.

MVP technical direction:

```text
Store KYC status fields now.
Do not implement provider until payment/withdrawal requirements are known.
```

---

## Recommended Phase 0 Decisions

Before implementation starts, lock:

```text
Frontend: Next.js
Language: TypeScript
Database: Supabase Postgres
Auth: Supabase Auth
Hosting: Vercel
UI: Tailwind + shadcn/ui
Testing: Vitest + Playwright
Initial mode: free-entry/test contests
AI build workflow: Codex/Claude Code + GitHub PRs + Cursor review
```

---

## Non-Developer Founder Considerations

This stack is recommended because it is:

- widely documented
- compatible with AI coding tools
- easy to preview/deploy
- easier to debug than native mobile first
- strong enough for wallet/scoring correctness
- not too infrastructure-heavy

The main tradeoff:

- responsive web is not as polished as a native app at first
- but it is much faster to build and test

---

## AI Coding Tool Operating Rules

Use AI coding tools with small scoped tasks.

Recommended pattern:

1. Build one feature at a time.
2. Reference the relevant spec file.
3. Require tests for money/scoring/state logic.
4. Commit frequently.
5. Avoid large ambiguous prompts.
6. Review diffs before merging.
7. Do not let agents decide product rules without updating specs.

Example prompt style:

```text
Repo: pickrank-app
Spec: /spec/features/backend_data_architecture.md
Task: Create initial Supabase schema migration for users, contests, entries, and lineups only. Do not implement wallet yet. Add constraints and indexes from the spec.
```

---

## Stack Risks

### Supabase RLS complexity
Row Level Security is powerful but can become confusing.

Mitigation:

- keep privileged contest/payment/scoring logic server-side
- do not expose sensitive wallet operations directly to client
- write clear policies only where needed

### Next.js server action misuse
Server actions/route handlers must not become messy.

Mitigation:

- organize logic in `/lib` service modules
- keep routes thin
- add unit tests for service logic

### Real-money complexity
Payments/withdrawals may force changes later.

Mitigation:

- keep Payment Service and Wallet Service abstracted
- do not tie core contest logic to one provider yet

### AI-generated code quality
AI agents may produce broad changes, duplicate logic, or weak tests.

Mitigation:

- use small scoped prompts
- require tests
- review diffs
- prefer PRs/branches over direct main changes
- use specs as source of truth

### Mobile app later
If native mobile becomes necessary, web-first may require duplicated UI work.

Mitigation:

- keep backend/API clean
- keep business logic server-side
- use Expo later against same backend

---

## MVP Stack Decision Table

| Area | MVP Recommendation | Status |
|---|---|---|
| First launch surface | Responsive web | recommended |
| Frontend | Next.js | recommended |
| Language | TypeScript | recommended |
| Database | Supabase Postgres | recommended |
| Auth | Supabase Auth | recommended |
| Hosting | Vercel | recommended |
| UI | Tailwind + shadcn/ui | recommended |
| Unit tests | Vitest | recommended |
| E2E tests | Playwright | recommended |
| AI primary build tool | Codex or Claude Code | recommended |
| AI review/local tool | Cursor | recommended |
| Visual app builders | Prototype only | recommended |
| Mobile native | Expo later | deferred |
| Payments | TBD provider behind abstraction | open |
| Withdrawals | TBD provider behind abstraction | open |
| Sports data | TBD provider behind abstraction | open |
| KYC | TBD provider/status fields now | open |

---

## Implementation Start Recommendation

Start Phase 0 with:

```text
Next.js + TypeScript + Supabase + Vercel
```

Build only:

- app shell
- database connection
- auth foundation
- contest table/schema foundation
- basic route structure
- first seed/test contest

Do not begin with:

- payment provider integration
- withdrawal provider integration
- sports data provider integration
- native mobile app
- live scoring

---

## Next Recommended Spec

After this technical stack recommendation, define:

```text
Phase 0 Implementation Plan
```

That should break the first actual build phase into concrete setup tasks and files.
