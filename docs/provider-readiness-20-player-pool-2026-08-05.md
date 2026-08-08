# 20-Player Provider Readiness

## Purpose

Record the repo-side readiness state for moving the local 20-player pool into the hidden SportsDataIO live-validation path.

## Selected Added Quarterbacks

The first 20-player local fixture slice added these five quarterbacks:

| Player | Team | Local opponent | Local home/away | Status |
|---|---|---|---|---|
| Baker Mayfield | TB | ATL | away | placeholder local fixture |
| Trevor Lawrence | JAX | CAR | home | placeholder local fixture |
| Kyler Murray | ARI | LAR | away | placeholder local fixture |
| Sam Darnold | SEA | SF | away | placeholder local fixture |
| Russell Wilson | NYG | WAS | away | placeholder local fixture |

These five players are not confirmed production data yet.

## Provider ID Status

The local public contest fixture still uses placeholder provider IDs such as `provider-qb-baker-mayfield`.

That is intentional for repo fixtures.

Do not copy those placeholder values into live Supabase rows.

The truthful SportsDataIO values must come from the live provider prep path:

- `ScoresByWeek/2026reg/1` supplies numeric `ScoreID` values.
- `DepthCharts` supplies numeric QB `PlayerID` values.
- `Teams` maps provider `TeamID` values back to team keys.

## Dry-Run Result

Read-only dry-run command:

```bash
npm run prepare:live-validation-contest:dry-run
```

Result on 2026-08-05:

- `dryRun`: `true`
- hidden validation slug: `week-1-qb-passing-yards-live-validation-2026`
- prepared pool size: `20`
- Supabase writes: none

SportsDataIO mapped the five added local fixture teams this way:

| Local source | Prepared provider player | SportsDataIO PlayerID | SportsDataIO ScoreID | Prepared matchup |
|---|---|---:|---:|---|
| Baker Mayfield, TB | Baker Mayfield | 19790 | 19459 | TB @ CIN |
| Trevor Lawrence, JAX | Trevor Lawrence | 22490 | 19463 | JAX vs CLE |
| Kyler Murray, ARI | Jacoby Brissett | 18018 | 19466 | ARI @ LAC |
| Sam Darnold, SEA | Sam Darnold | 19812 | 19457 | SEA vs NE |
| Russell Wilson, NYG | Jaxson Dart | 26082 | 19455 | NYG vs DAL |

Implication:

- TB, JAX, and SEA keep the selected local quarterback name.
- ARI and NYG should not be treated as confirmed production rows under the local names.
- If the production pool is QB1-driven, ARI should use Jacoby Brissett and NYG should use Jaxson Dart based on this provider response.
- If Parker wants Kyler Murray or Russell Wilson specifically, that is a product/operator decision and must be confirmed against SportsDataIO before mutation.

## Safe Operator Sequence

1. Run local proof.

```bash
npm run prepare:live-validation-contest:dry-run
```

2. Review the dry-run JSON.

Confirm:

- `slateSize` is `20`
- replacements are expected
- matchup changes are expected
- the five added teams are present
- player IDs and game IDs are numeric in the prepared output

3. Ask Parker for explicit approval before writing the hidden Supabase validation contest.

4. After approval, run:

```bash
npm run prepare:live-validation-contest
npm run validate:live-provisional
```

5. Keep provisional snapshots separate from official final results.

## Current Blocker

This local shell is missing `SUPABASE_SERVICE_ROLE_KEY`.

That blocks the mutating hidden-contest prep and live provisional validation scripts.

No live Supabase data was changed in this slice.
