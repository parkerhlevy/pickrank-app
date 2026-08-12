# PickRank Agent Instructions

## Operating Model

- Treat GitHub and this repo as the permanent source of truth for PickRank product decisions, specs, code, tests, QA plans, and final technical decisions.
- Treat the local Codex workspace as a temporary workbench for editing, checking, and testing repo changes before they go back to GitHub.
- Treat Replit, Vercel, or another cloud environment as the intended place for the app/site to run and be shared.
- Avoid local-only complexity unless it directly helps get PickRank working in GitHub and cloud deployment.
- Keep explanations business-friendly first. State what changed, why it matters, what passed, and what Parker needs to do next before adding technical details.

## Communication Standard

Use an ASD-STE100-inspired clarity standard for Parker-facing explanations, project updates, plans, handoffs, and technical summaries.

This is not a claim of formal ASD-STE100 compliance. It is the working communication rule:

- Use clear, controlled technical English.
- Prefer short sentences.
- Put one idea in each sentence.
- Use active voice.
- Use the same word for the same thing.
- Define acronyms or avoid them.
- Keep paragraphs short.
- Avoid filler, ornate phrasing, abstract metaphors, and long caveats.
- Preserve exact PickRank product, legal, compliance, and technical terms when precision matters.

## Source Order

1. Read `docs/agent-handoff.md` for current implementation guidance.
2. Read `spec/product_spec.md` and the relevant files under `spec/features/` before changing product behavior.
3. Use Obsidian only for supporting context, summaries, questions, and business reasoning. Do not create competing product specs there.
4. If repo docs and Obsidian notes conflict, flag the conflict and treat the repo as authoritative unless Parker explicitly says otherwise.

## Working Style

- Focus on the next concrete milestone.
- Keep changes small and reviewable.
- Prefer cloud-app progress over local setup polish.
- Follow the authorization policy below for implementation and delivery actions.
- Run the relevant checks after meaningful repo changes and report results plainly.
- At the start of each new PickRank task or new chat, first provide Parker with the recommended kickoff prompt for that next slice before doing the work.

## Authorization Policy

For PickRank, this section controls file edits, commits, pushes, merges, publishing, and deployments. It replaces inherited or vault-level blanket approval rules when they conflict with this section.

- A request to diagnose, review, or report is read-only unless Parker also asks for a change.
- A request to fix, implement, build, or change authorizes scoped file edits and proportionate verification.
- A request to commit, push, merge, publish, or deploy authorizes that named delivery action. A request to ship authorizes the normal scoped delivery sequence through the established PickRank path.
- When Parker reports a production bug and asks Codex to "fix it for me," Codex may inspect, edit, test, isolate the change from unrelated work, commit, push, deploy through the established PickRank path, and run non-mutating production verification.
- Preserve unrelated worktree changes. When the worktree is mixed, isolate a narrow hotfix.
- Request explicit approval before destructive production-data changes, contest retirement, deleting real entries, database migrations with material risk, sending external messages, spending money, merging unrelated work, or changing legal, payment, wallet, scoring, eligibility, payout, or compliance-sensitive behavior.
- Verification does not authorize form submission or any other action that mutates production data unless Parker explicitly requests that production mutation.
- Report the commit, push, deployment, verification results, production-data impact, remaining user action, and any blocked delivery step.

## Starter Prompt For Future Chats

```text
Continue PickRank using the repo as source of truth. Use clear, ASD-STE100-inspired technical English: short sentences, active voice, one idea per sentence, consistent terms, and short paragraphs. Keep explanations business-friendly. Before changing behavior, read `docs/agent-handoff.md`, `spec/product_spec.md`, and the relevant `spec/features/` files for the slice you are about to work on, plus any in-progress worktree files already involved. Work carefully with existing in-progress files. Keep the slice narrow, avoid payouts, scoring, real-money, compliance, and other broader lifecycle work unless explicitly requested, and run typecheck, tests, and browser verification before closing. Before you finish, refresh `docs/agent-handoff.md` if the slice changed repo reality or the next recommended move. Explain results business-first: what changed, why it matters, what passed, and what I need to do next.
```

## Kickoff Prompt Rule

```text
Every time we are ready to move to a new PickRank task or a new chat, start by giving me the recommended kickoff prompt for that next slice before doing the work.
```

## Handoff Update Rule

- Codex owns updates to `docs/agent-handoff.md`.
- Refresh it at the end of any slice that changes repo reality, stage, active in-progress work, or the next recommended move.
- Parker should not need to remind the agent to do this.
