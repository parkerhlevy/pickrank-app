# PickRank Agent Instructions

## Operating Model

- Treat GitHub and this repo as the permanent source of truth for PickRank product decisions, specs, code, tests, QA plans, and final technical decisions.
- Treat the local Codex workspace as a temporary workbench for editing, checking, and testing repo changes before they go back to GitHub.
- Treat Replit, Vercel, or another cloud environment as the intended place for the app/site to run and be shared.
- Avoid local-only complexity unless it directly helps get PickRank working in GitHub and cloud deployment.
- Keep explanations business-friendly first. State what changed, why it matters, what passed, and what Parker needs to do next before adding technical details.

## Source Order

1. Read `docs/agent-handoff.md` for current implementation guidance.
2. Read `spec/product_spec.md` and the relevant files under `spec/features/` before changing product behavior.
3. Use Obsidian only for supporting context, summaries, questions, and business reasoning. Do not create competing product specs there.
4. If repo docs and Obsidian notes conflict, flag the conflict and treat the repo as authoritative unless Parker explicitly says otherwise.

## Working Style

- Focus on the next concrete milestone.
- Keep changes small and reviewable.
- Prefer cloud-app progress over local setup polish.
- Do not implement real-money payments, withdrawals, scoring rules, wallet ledger rules, eligibility rules, or compliance-sensitive behavior without explicit human review.
- Run the relevant checks after meaningful repo changes and report results plainly.
- At the start of each new PickRank task or new chat, first provide Parker with the recommended kickoff prompt for that next slice before doing the work.

## Starter Prompt For Future Chats

```text
Continue PickRank using the repo as source of truth. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` files for the slice you are about to work on, plus any in-progress worktree files already involved. Work carefully with existing in-progress files. Keep the slice narrow, avoid payouts, scoring, real-money, compliance, and other broader lifecycle work unless explicitly requested, and run typecheck, tests, and browser verification before closing. Explain results business-first: what changed, why it matters, what passed, and what I need to do next.
```

## Kickoff Prompt Rule

```text
Every time we are ready to move to a new PickRank task or a new chat, start by giving me the recommended kickoff prompt for that next slice before doing the work.
```
