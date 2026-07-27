# PickRank Preseason Testing Runbook

The canonical preseason game-mechanics checklist is:

```text
docs/preseason-free-test-contest-runbook.md
```

Use that runbook for controlled free/test-entry rehearsals, lineup save, lock behavior, provider validation, typed-`FINAL` finalization, leaderboard/results, and manual QA signoff.

Boundary: public paid entry stays blocked. Nonzero no-payment entry belongs only to the non-production E2E auth/file-store harness with the E2E fixture identity and `eligible_for_internal_testing`; public `eligible` status alone is not enough. This file exists only so preseason-testing references route to the same checklist instead of creating a second source of truth.
