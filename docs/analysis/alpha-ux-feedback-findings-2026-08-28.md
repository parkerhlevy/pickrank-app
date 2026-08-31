# Alpha UX Feedback Findings

Date: 2026-08-28

Status: Review input. This note does not approve product behavior changes.

## Purpose

This note preserves the non-sensitive conclusions from recent written feedback and recorded Alpha walkthroughs.

The raw evidence remains local and outside Git. This note does not include participant names, private links, screenshots, transcripts, account details, or direct quotations.

## Source Method

The private source mapping uses these anonymous evidence labels:

- `W1`: initial written collaborator feedback
- `W2`: follow-up written collaborator feedback
- `M1`: desktop and mobile walkthroughs from one participant; count these as one independent source
- `M2`: mobile walkthrough recorded on a second attempt after the first recording lacked audio
- `M3`: mobile walkthrough that completed the full journey after one intermittent entry failure

The labels preserve source separation without placing participant identity or private source locations in Git.

Evidence confidence uses these rules:

- High: repeated by at least two independent walkthrough sources or directly confirmed by current repo behavior
- Medium: one clear walkthrough or written concern supported by current repo behavior
- Low: a proposed treatment without enough evidence that it will improve the product

Tester suggestions remain hypotheses. The observed friction has more weight than the suggested interface treatment.

## Open Findings Worth Preserving

### 1. Explain scoring at first contact

- Impact: High
- Evidence: `M1`, `M2`, and current repo copy
- Confidence: High
- Current state: The first scoring summary says that each miss distance adds points. The full worked example appears later on How It Works.
- Conclusion: Add one compact, plain-language example where users first encounter scoring. Keep the full table lower on How It Works.
- Boundary: Do not change the scoring model, tiebreakers, finalization, or result calculations.

### 2. Preserve return context from How It Works

- Impact: Medium-high
- Evidence: `M2`, `M3`, and current shared navigation behavior
- Confidence: High
- Current state: Major screens link to the same fixed How It Works route. The destination has no context-aware return control.
- Conclusion: Provide a predictable return to the originating internal screen with a safe fallback.
- Boundary: Preserve protected return paths and reject external or malformed destinations.

### 3. Reduce mobile board obstruction and comparison cost

- Impact: Medium-high
- Evidence: `M1`, `M2`, `M3`, and current board layout
- Confidence: High
- Current state: The unsaved action panel remains sticky and includes status, helper text, lock time, and the Save board action. Selected and available players remain in separate vertical sections.
- Conclusion: Keep Save board persistent, but reduce the mobile panel footprint and guarantee enough clearance for every player row. Reduce unnecessary vertical density before attempting a larger board redesign.
- Boundary: Preserve saved completion, save errors, leave protection, lock behavior, accessible move controls, and the existing distinction between `player pool` and `your board`.

### 4. Explain state or jurisdiction collection

- Impact: Medium
- Evidence: `M3` and current Profile form behavior
- Confidence: Medium-high
- Current state: Profile explains why date of birth is required but gives no equivalent reason for state or jurisdiction.
- Conclusion: Add one short explanation that states why PickRank collects state or jurisdiction.
- Boundary: Preserve the current eligibility rules, validation, legal acknowledgements, and stored evidence.

## Validation And Policy Queue

These items are worth retaining, but they are not approved implementation work.

### Contest preview, entry, and editing distinction

- Evidence: `M3`
- Current repo check: Contest Detail shows a read-only player-pool preview before the entry action. The editable board is a separate route.
- Next proof: Test whether clearer read-only labeling and earlier action hierarchy solve the confusion before changing selection controls.

### Intermittent contest-entry loading

- Evidence: `M3`
- Limit: The failure resolved during the same walkthrough. No controlled reproduction, error identifier, or technical cause was captured.
- Decision: Deferred on 2026-08-27. Preserve the observation and investigate only if it repeats or new technical evidence appears.

### Fixed player-pool freshness

- Evidence: `M2` and current fixed contest data
- Limit: The recording does not prove the current production record or its intended beta fixture policy.
- Next proof: Verify the production player source and operator policy before changing any player record.

### Late roster changes

- Evidence: `M3`
- Scope: Injuries, inactive players, trades, replacements, entrant communication, contest validity, and scoring can affect multiple product rules.
- Decision: Handle this as a separate contest-lifecycle and operator-policy slice. Do not solve it through player-card copy alone.

## Resolved Or Partly Mitigated Findings

Do not carry these forward as confirmed open defects without fresh evidence:

- Signed-out Profile now explains account access and uses the shared sign-in controls.
- Beta Terms and Privacy Policy links open in new tabs during unfinished setup.
- Saved boards show persistent completion and return to an unsaved state after edits.
- Production email confirmation and returning-user magic-link flows are verified.
- Dragging now prevents body text selection, disables touch scrolling during the active drag, and shows a moving state. Retest on mobile before adding more drag behavior.

## Approved Implementation Pending Review

### Unified Profile setup and post-auth routing

- Evidence: `W1`, `W2`, follow-up written feedback, and current separate Profile forms
- Approved direction: Use one `Finish your Profile` form for every missing username and beta-entry field, preserve explicit legal acknowledgements, keep field errors on the form, send complete returning users to their intended destination, and use Contests as the default after direct Profile sign-in.
- Current branch: `codex/account-onboarding-consolidation`
- Boundary: Preserve auth providers, sanitized return paths, eligibility rules, durable under-18 capture, legal acknowledgement timestamps, Supabase configuration, and production data.

## Recommended Decision

Choose one bounded implementation slice after this note is approved:

1. Education and trust: compact scoring example, context-aware How It Works return, and state or jurisdiction explanation.
2. Mobile board workspace: smaller unsaved action panel, verified bottom clearance, and reduced vertical density.

Do not combine both slices. Each slice needs focused unit and browser coverage before merge.

## Privacy And Traceability Boundary

Keep the private source mapping and raw evidence outside Git. Do not commit:

- participant names or contact details
- private recording or workspace links
- screenshots, transcripts, captions, or generated highlights
- account images, view counts, or recording metadata that can identify a participant
- direct quotations that can identify a participant

If a future finding needs stronger proof, return to the private source record and add only the minimum anonymous conclusion to this note.
