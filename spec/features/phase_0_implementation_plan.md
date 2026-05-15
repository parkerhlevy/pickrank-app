# Phase 0 Implementation Plan

## Purpose
Define the first concrete implementation phase for PickRank: project foundation setup before feature development begins.

## Status
Locked for implementation start.

## Anchor
Phase 0 establishes the technical foundation for PickRank using Next.js, TypeScript, Supabase/Postgres/Auth, Vercel, Tailwind/shadcn, Vitest, Playwright, and a GitHub-first AI build workflow. Phase 0 should create the app shell, repo structure, environment configuration, database foundation, first seed/test contest path, and baseline smoke tests before moving into feature implementation.

---

## Summary
Phase 0 is not about building the full product.

Phase 0 is about creating a clean, testable foundation that future phases can build on safely.

The goal is to end Phase 0 with:

- app running locally
- app deployable to Vercel
- Supabase connected
- auth foundation ready
- initial database migration path ready
- core folder structure in place
- basic routes created
- testing tools installed
- seed/test data approach defined
- AI coding workflow ready

---

## Recommended Stack

Use the stack from `/spec/features/technical_stack_recommendation.md`:

```text
Next.js
TypeScript
Supabase Postgres
Supabase Auth
Vercel
Tailwind CSS
shadcn/ui
Zod
Vitest
Playwright
Codex / Claude Code
Cursor
```

---

## Phase 0 Goals

## Goal 1: Create runnable app foundation

The repo should have a working Next.js app that can run locally.

Acceptance:

```text
npm run dev
```

starts the app without errors.

---

## Goal 2: Establish project structure

Create the expected structure for future implementation.

Recommended structure:

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

Acceptance:

- folders exist
- placeholder/index files exist where needed
- structure matches spec enough for agents to follow

---

## Goal 3: Configure styling/UI foundation

Install/configure:

- Tailwind CSS
- shadcn/ui
- base theme tokens
- shared button/card/input components
- lucide-react icons

Acceptance:

- homepage or app shell renders styled UI
- shadcn components can be imported
- Tailwind classes work

---

## Goal 4: Configure Supabase foundation

Set up Supabase client structure.

Create:

```text
lib/supabase/client.ts
lib/supabase/server.ts
lib/supabase/types.ts
```

Environment variable placeholders:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Acceptance:

- app can initialize Supabase client
- env example exists
- no real secrets committed

---

## Goal 5: Create initial database migration plan

Phase 0 should not implement every table from the backend spec.

Start with foundation tables only:

- users/profile extension table, if needed beyond Supabase Auth
- contests
- contest_slate_players
- entries
- entry_lineups

Do not implement wallet/payment/scoring tables yet unless needed for schema planning.

Acceptance:

- migration file exists or migration plan exists in `db/migrations`
- initial tables support Phase 1-5 work
- constraints are included where obvious, especially `unique(user_id, contest_id)` for entries

---

## Goal 6: Create basic route shell

Create route placeholders for:

```text
/contests
/contests/[contestId]
/auth
/profile
/how-it-works
/admin/contests
```

Acceptance:

- routes compile
- each route shows a simple placeholder page
- navigation between primary screens works

---

## Goal 7: Create app navigation shell

Create bottom-tab navigation placeholders:

```text
Contests
Leaderboard
How It Works
Profile
```

MVP note:

Leaderboard can be placeholder-only in Phase 0.

Acceptance:

- bottom nav renders
- tabs route to correct placeholder screens
- mobile/responsive layout works at basic level

---

## Goal 8: Add testing foundation

Install/configure:

- Vitest
- Testing Library, if useful
- Playwright

Create initial tests:

- unit smoke test
- route smoke test or Playwright homepage load test

Acceptance:

```text
npm run test
npm run test:e2e
```

or equivalent scripts run successfully.

---

## Goal 9: Add lint/typecheck scripts

Add scripts for:

```text
npm run lint
npm run typecheck
npm run test
npm run test:e2e
```

Acceptance:

- scripts exist
- scripts run without fatal errors on fresh setup

---

## Goal 10: Seed/test contest approach

Create a basic seed approach for future test contests.

Phase 0 seed data may include:

- one test contest
- 15 placeholder QBs
- scheduled/open status option

Do not need full gameplay yet.

Acceptance:

- seed file or seed plan exists
- future phases can create a test contest without guessing structure

---

## Manual Setup Required From Parker

Parker may need to manually create/connect:

1. Supabase project
2. Supabase environment variables
3. Vercel project
4. Vercel environment variables
5. GitHub integration with Vercel
6. local `.env.local`
7. local package install

Do not commit secrets.

---

## AI Agent Build Workflow For Phase 0

Recommended implementation agent:

```text
Codex or Claude Code
```

Recommended local review tool:

```text
Cursor
```

### Phase 0 agent rules

- keep changes scoped
- do not implement payment provider
- do not implement wallet logic
- do not implement scoring engine yet
- do not implement full auth UX beyond foundation
- do not alter locked product specs without explicit instruction
- add tests/smoke checks
- commit changes in reviewable chunks

---

## First Implementation Prompt

Use this in the new implementation chat or coding agent:

```text
Repo: pickrank-app
Specs:
- /spec/features/technical_stack_recommendation.md
- /spec/features/phase_0_implementation_plan.md

Task:
Implement Phase 0 project foundation only.

Use Next.js + TypeScript + Tailwind + shadcn/ui + Supabase client structure + Vitest + Playwright.

Create the recommended folder structure, placeholder routes, bottom navigation shell, environment variable example, Supabase client/server files, and initial test scripts.

Do not implement payment, wallet, scoring, sports data provider, or real contest entry logic yet.

Keep changes small and reviewable. Add or update README setup instructions if needed.
```

---

## Phase 0 Acceptance Criteria

Phase 0 is complete when:

- app runs locally
- primary placeholder routes exist
- bottom nav shell exists
- Supabase client/server structure exists
- env example exists
- no secrets committed
- initial folder structure exists
- basic styling works
- test scripts exist
- at least one smoke test passes
- setup instructions exist
- repo is ready for Phase 1: App Shell + Navigation

---

## Out of Scope For Phase 0

Do not build:

- real payment provider integration
- withdrawal provider integration
- wallet ledger
- scoring engine
- sports data provider integration
- full auth flow
- full admin contest setup
- contest entry/payment flow
- lineup drag-and-drop
- results reveal
- live leaderboard
- legal/state eligibility engine

---

## Phase 1 Preview

After Phase 0, next implementation phase is:

```text
Phase 1: App Shell + Navigation
```

Phase 1 should build the real app shell and navigation behavior from `/spec/features/frontend_navigation.md`.

---

## Chat Switch Instruction

After this spec is locked, switch to a new implementation chat before actual build execution.

Use the implementation anchor from the current assistant response.
