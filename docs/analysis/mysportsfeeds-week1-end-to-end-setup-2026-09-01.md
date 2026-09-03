# MySportsFeeds Week 1 End-to-End Setup

Date: 2026-09-01

Status: Non-production proof is complete. A validated production draft now exists, and the stale public contest has been removed. The replacement is hidden and unpublished.

## Scope and safety boundary

This slice used the PickRank repo as the source of truth. It read the current handoff, product spec, contest admin spec, stat finalization spec, provider adapter, contest data layer, admin actions, public contest routes, entry persistence, scoring, and results code.

All provider calls were GET-only. The MySportsFeeds key stayed in the existing `PICKRANK_MYSPORTSFEEDS_API_KEY` environment-variable path. The key was not printed, stored in a repo file, hard-coded, or committed.

The initial Week 1 proof was created only in `/private/tmp/pickrank-mysportsfeeds-week1`, a detached clean worktree based on `origin/main` at `24f239c`. The proof used the file-backed contest store. It did not use Supabase or change production data. The later approved production preparation is recorded below.

The primary checkout at `/Users/parkerlevy/Documents/PickRank` was left unchanged because it contains unrelated in-progress work.

## Provider account and feed coverage

The MySportsFeeds account page showed an active commercial NFL Non-Live subscription with STATS access. CORE is included automatically. The account page showed the next charge date as 2027-08-31. No purchase or subscription change was made.

Official MySportsFeeds material describes the relevant coverage as follows:

- [Sports Data API](https://www.mysportsfeeds.com/data-feeds): CORE includes schedules and game status. STATS includes player game logs and statistics.
- [Feed pricing and add-ons](https://www.mysportsfeeds.com/feed-pricing/): DETAILED is a separate add-on for Players, Game Lineups, and Injuries.
- [FAQ](https://www.mysportsfeeds.com/faq/): Non-Live access can return no content before the relevant post-game data is available.

Current CORE + STATS access is enough for schedules, provider game IDs, completed-game quarterback player IDs, passing yards, passing touchdowns, and game completion state. It does not provide the DETAILED player directory, game lineups, injuries, or a provider-native pregame starter confirmation path.

## Read-only provider validation

### Completed-game check

The read-only probe checked 2026 preseason Week 1 game `163800`, Denver at Atlanta, at provider snapshot time `2026-09-01T04:42:47.649Z`.

Confirmed results:

- Authentication passed.
- Schedule access passed.
- Provider game ID parsing passed.
- Player ID parsing passed.
- QB passing-yard parsing passed.
- Provisional snapshot shape passed.
- `playedStatus=COMPLETED` and `scheduleStatus=NORMAL` mapped to provisional `final`.
- Five QB passing-stat rows were returned.
- The leading passing-yard rows were Jarrett Stidham 148, Sam Ehlinger 67, Cooper Rush 62, Jack Strand 50, and Tua Tagovailoa 22.

The probe did not persist data and did not call PickRank's official final-results path.

### Final-stat behavior

Provider status and PickRank official finality remain separate:

- `COMPLETED_PENDING_REVIEW` maps to provisional `in_progress`.
- Plain `COMPLETED` maps to provisional `final`.
- Neither status publishes official PickRank results by itself.
- Official PickRank finalization still requires an eligible contest state, operator review of the final stat rows, and typed `FINAL` confirmation.

This preserves the human review boundary in `spec/features/stat_finalization.md` and the existing results implementation.

### Reliability observation

One completed preseason Week 3 request returned a truncated response and failed JSON parsing with `Unexpected end of JSON input`. Other requests succeeded. Production readiness needs bounded retry, backoff, response-size logging that excludes credentials, and a clear malformed-response error before automated ingestion is enabled.

## 2026 regular-season Week 1 schedule

The schedule-only probe ran at `2026-09-01T04:46:01.328Z`. It returned 16 scheduled games. The selected contest pool uses these 10 games:

| Provider game ID | Matchup | Start time UTC |
| --- | --- | --- |
| 163543 | CHI at CAR | 2026-09-13T17:00:00.000Z |
| 163544 | TB at CIN | 2026-09-13T17:00:00.000Z |
| 163545 | NO at DET | 2026-09-13T17:00:00.000Z |
| 163546 | BUF at HOU | 2026-09-13T17:00:00.000Z |
| 163547 | BAL at IND | 2026-09-13T17:00:00.000Z |
| 163548 | CLE at JAX | 2026-09-13T17:00:00.000Z |
| 163550 | NYJ at TEN | 2026-09-13T17:00:00.000Z |
| 163553 | GB at MIN | 2026-09-13T20:25:00.000Z |
| 163554 | WAS at PHI | 2026-09-13T20:25:00.000Z |
| 163555 | DAL at NYG | 2026-09-14T00:20:00.000Z |

The pool excludes the Thursday and Friday games. It also excludes Denver at Kansas City because the current public depth-chart source listed Patrick Mahomes as questionable, and it excludes Atlanta at Pittsburgh because the Atlanta starter was not sufficiently settled for this non-production proof.

## Week 1 quarterback pool

All provider player IDs below were confirmed from completed MySportsFeeds QB stat rows. Pregame starter status was checked manually against the current [PFN NFL depth-chart index](https://www.profootballnetwork.com/nfl-hq/depth-charts). Cleveland and Minnesota also had team-source confirmation for [Deshaun Watson](https://www.clevelandbrowns.com/news/deshaun-watson-named-browns-starting-quarterback) and [Kyler Murray](https://www.vikings.com/news/kyler-murray-quarterback-starting-2026-nfl-season).

| Order | Player | Provider player ID | Provider game ID | Team | Opponent | Home/away |
| ---: | --- | ---: | ---: | --- | --- | --- |
| 1 | Caleb Williams | 133835 | 163543 | CHI | CAR | away |
| 2 | Bryce Young | 79739 | 163543 | CAR | CHI | home |
| 3 | Baker Mayfield | 14492 | 163544 | TB | CIN | away |
| 4 | Joe Burrow | 18577 | 163544 | CIN | TB | home |
| 5 | Tyler Shough | 166710 | 163545 | NO | DET | away |
| 6 | Jared Goff | 9919 | 163545 | DET | NO | home |
| 7 | Josh Allen | 14498 | 163546 | BUF | HOU | away |
| 8 | C.J. Stroud | 79740 | 163546 | HOU | BUF | home |
| 9 | Lamar Jackson | 14523 | 163547 | BAL | IND | away |
| 10 | Daniel Jones | 16603 | 163547 | IND | BAL | home |
| 11 | Deshaun Watson | 13027 | 163548 | CLE | JAX | away |
| 12 | Trevor Lawrence | 30425 | 163548 | JAX | CLE | home |
| 13 | Geno Smith | 19276 | 163550 | NYJ | TEN | away |
| 14 | Cam Ward | 166676 | 163550 | TEN | NYJ | home |
| 15 | Jordan Love | 18607 | 163553 | GB | MIN | away |
| 16 | Kyler Murray | 16226 | 163553 | MIN | GB | home |
| 17 | Jayden Daniels | 133836 | 163554 | WAS | PHI | away |
| 18 | Jalen Hurts | 18668 | 163554 | PHI | WAS | home |
| 19 | Dak Prescott | 9845 | 163555 | DAL | NYG | away |
| 20 | Jaxson Dart | 166640 | 163555 | NYG | DAL | home |

Pool checks:

- 20 unique quarterbacks.
- 20 numeric MySportsFeeds player IDs.
- 10 unique provider game IDs.
- Two quarterbacks per selected game.
- 10 home quarterbacks and 10 away quarterbacks.
- All game start times are at or after the contest lock time.
- One supported stat category: `qb_passing_yards`.
- Users rank 10 players from the full 20-player pool.
- Scoring stays `rank_differential_v2` against the full-pool final order.

This is a non-production pool. Recheck every starter, injury, roster, game status, kickoff time, and provider ID before any production publish decision.

## Admin flow and local setup

The traced admin path is:

1. `createDraftContestAction` validates title, instruction, season, week, $0 entry fee, entry-open time, and lock time.
2. `createDraftContest` creates a hidden `draft` with `qb_passing_yards` and a 20-player pool requirement.
3. `saveContestSlateAction` parses the pipe-delimited operator rows.
4. `saveContestSlate` saves provider player IDs, provider game IDs, matchups, kickoff times, QB position, and active status.
5. `validateDraftContestAction` runs the 20-player, uniqueness, stat-category, time, and default-board checks.
6. `publishContestAction` requires a passed validation and a human operator action.
7. `publishContest` changes only the isolated file record to visible `open` for this proof.

The guarded command used for the setup was:

```bash
npm run setup:mysportsfeeds:week1:nonprod -- --confirm-isolated-file-store --data-file data/contests.json
```

The generated local contest state is:

- Contest ID: `week-1-qb-passing-yards-msf-validation`
- Status: `open`
- Visibility: `visible`
- Entry fee: `$0.00`
- Entry opens: `2026-09-01T00:00:00.000Z`
- Lock time: `2026-09-13T17:00:00.000Z`
- Stat category: Passing yards
- Player pool: 20
- Ranked board: 10
- Validation: passed
- Public contest list lookup: passed

The script refuses to run without the explicit isolated-file-store confirmation and an explicit file path inside the current worktree `data` directory. It does not contain or read the MySportsFeeds key.

## Verification report

Story: A PickRank operator validates MySportsFeeds schedule and QB data, creates a free Week 1 passing-yards contest with provider-native IDs, validates and publishes it in an isolated file store, and an eligible user finds the contest, enters, ranks 10 of 20 quarterbacks, and saves the board.

| Boundary | Status | Evidence |
| --- | --- | --- |
| Provider authentication | Passed | GET-only completed-game and schedule probes passed |
| Provider schedule to game IDs | Passed | 16 Week 1 games returned; 10 selected IDs saved |
| Provider QB rows to player IDs | Passed | 20 selected IDs confirmed from completed stat rows |
| Provider final state to provisional rows | Passed | `COMPLETED` mapped to provisional `final` with passing yards |
| Admin draft to saved slate | Passed | Local setup command saved 20 rows |
| Admin validation | Passed | No validation errors |
| Local publish to public list | Passed | Visible `open` contest returned by `listPublicContests` |
| Public route and entry browser execution | Passed in GitHub Actions | GitHub Actions run `33474643826` passed the complete Chromium workflow on branch `codex/mysportsfeeds-week1-nonprod-proof`, including the focused admin, contest detail, entry, 10-player selection, save, and persistence flow. Local Next dev still cannot bind on this host. |
| Browser test contract | Passed | The focused admin, contest detail, entry, 10-player selection, save, and persistence spec passed contract validation |
| Official Week 1 final results | Pending future games | Week 1 has not been played; no final result was fabricated or published |

Verification commands that passed:

- `npx vitest run tests/unit/mysportsfeeds-validation.test.ts tests/unit/admin-contest-creation.test.ts`: 17 tests.
- Focused finalization, results, scoring, ingestion, provisional, and leaderboard run: 25 tests.
- Full `npx vitest run --maxWorkers=1`: 40 files and 239 tests.
- `npm run typecheck`.
- Full `npm run lint` and focused ESLint on the changed provider, setup, unit, and browser-test files.
- `npm run test:e2e:contracts`: 16 Playwright files passed contract validation.
- GitHub Actions `Browser verification` run `33474643826`: the complete Linux Chromium workflow passed in 4 minutes 22 seconds.
- `git diff --check`.

The browser test is `tests/e2e/mysportsfeeds-week1-flow.spec.ts`. The first GitHub Actions run exposed an existing global button locator that became ambiguous when this proof added a second open free contest. The locator was scoped to the exact contest form. GitHub Actions run `33474643826` then passed the complete `Browser verification` workflow in Chromium.

## Approved production preparation on 2026-09-02

Parker reviewed the player list, games, and contest logic. Parker also confirmed that the written MySportsFeeds approval is sufficient for the current business-to-consumer, non-competing, text-only use. This is a project decision, not legal advice. Paid contests, business-to-business use, images, and new product categories remain outside this approval.

The production admin now contains one replacement contest:

- Title: `2026 Week 1 QB Passing Yards`.
- Slug: `2026-week-1-qb-passing-yards`.
- State: hidden `draft`.
- Entry fee: `$0.00`.
- Entry open time: `2026-09-01T00:00:00.000Z`.
- Lock time: `2026-09-13T17:00:00.000Z`, or Sunday, September 13 at 1:00 PM Eastern Time.
- Stat category: `qb_passing_yards` through the existing draft default.
- Player pool: the reviewed 20-player MySportsFeeds slate from the non-production proof.
- Validation: `passed` in the production admin.

The replacement remains hidden and unpublished. No code was deployed or merged.

Parker explicitly approved permanent deletion of stale production contest `week-1-qb-passing-yards`, ID `a95512b2-2dd8-4095-a0c5-e70be4bc2bd4`. A guarded transaction required the exact reviewed counts and a validated hidden replacement before deletion. It removed the contest and its cascading ordinary records: 20 slate players, 9 free entries, 90 lineup rows, 1 validation row, and 3 state events. It removed no paid entries because the contest had none.

The transaction retained the append-only evidence that does not cascade with the contest: 14 board revisions, 140 revision items, and 1 ruleset snapshot. It also wrote one persistent `production_contest_hard_delete` admin audit event with the approved reason and row counts.

Post-delete database checks returned zero rows for the stale contest, slate players, entries, validation records, and state events. The replacement still returned one hidden draft, 20 slate players, and one passed validation. Public `/contests` showed no available contests and exposed neither slug.

Direct visits to both the deleted slug and the hidden replacement slug returned a generic server-error page instead of a clean unavailable or not-found response. Resolve and deploy that route behavior before publishing the replacement.

An uncommitted route-safety fix is now prepared on `codex/mysportsfeeds-week1-nonprod-proof`. Public contest lookup no longer substitutes the first visible contest for an unknown slug. Deleted and hidden contest pages call the Next.js not-found boundary and render one contest-specific unavailable page. The contest progress and lineup API handlers return JSON `404` responses. The same public lookup guard applies to detail, payment, success, lineup, results, and requested leaderboard routes. Admin calls can still request hidden contests explicitly.

Focused lookup coverage passes with 5 unit tests. The full Vitest suite passes with 40 files and 240 tests. Typecheck, full lint, Playwright contract validation for 17 files, the webpack production build, and `git diff --check` pass. Local browser execution is blocked before the application starts by the host `listen EPERM` restriction, including an elevated retry. Commits `cd23d98`, `da9bb2c`, and `e08f376` are pushed. Run `33718470053` exposed that the explicit CI suite list validated without executing the new browser file. Run `33718937096` then passed the deleted, hidden, and JSON-handler cases but found an ambiguous visible-title test locator. Final GitHub Actions run `33721107914` passed the complete hosted Chromium gate in 4 minutes 42 seconds. Its unavailable-contest group passed all 3 cases in 8.6 seconds. No deployment, publication, or production-data change was made for this route fix.

## Legal, commercial, and production-readiness gaps

The repo records a MySportsFeeds support confirmation that the described PickRank business-to-consumer free-to-play beta, internal validation, and storage are acceptable if PickRank does not place MySportsFeeds in competition. That record does not authorize paid contests, business-to-business use, or any new product category.

Keep the written approval with the provider record. Confirm any required attribution, retention, correction, and deletion terms when the contract or product use changes. Obtain separate written terms before paid contests, business-to-business use, images, or a new product category.

Previously identified contract questions included:

- Public display and redistribution rights for schedules, player names, provider IDs, and stat values.
- Cache duration, historical retention, correction handling, and deletion obligations.
- Required attribution and trademark wording.
- Rate limits, retry rules, request concurrency, and expected post-game publication latency.
- Whether the current free-to-play beta still fits the approved business-to-consumer scope.
- Separate terms for paid contests or business-to-business use.

Technical production gaps:

- CORE + STATS does not prove pregame starters, active rosters, lineups, or injuries. DETAILED access or a written approved alternate process is still required for provider-only automation.
- The Week 1 player pool uses manual public depth-chart confirmation. It needs a same-day and pre-lock operator recheck.
- The adapter needs bounded retry and malformed-response handling.
- Week 1 final-stat and correction behavior can only be checked after the games finish.
- The existing data model still labels contests `public_paid` even when the free-beta entry fee is zero. This did not activate payment behavior, but the naming remains a product-data cleanup gap.
- Production Supabase draft creation and admin validation now pass. Provider snapshot persistence, scheduled refreshes, and public result publication remain untested and approval-gated.
- Production direct deleted or hidden contest URLs continue to return a generic server-error page until the prepared local route fix passes hosted Chromium and receives separate commit, deployment, and publish approvals.

## Recommended next action

Review the pushed Week 1 production candidate through `e08f376`. If approved, integrate and deploy only after Parker gives separate approval. Verify the deleted and hidden URLs in production after deployment. Then recheck starters, injuries, rosters, kickoff times, and provider IDs close to publish time. Keep the replacement hidden until Parker gives a separate explicit publish approval.
