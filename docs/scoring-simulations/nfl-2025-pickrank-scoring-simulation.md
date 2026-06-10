# PickRank 2025 NFL Scoring Simulation

## Purpose

Compare the locked MVP points table, the raw low-score rank differential model, a differential model with top-3 tiebreakers, and a weighted top-of-slate differential model using real NFL weekly QB passing data.

This is a simulation artifact, not production scoring code. Contestant entries are synthetic and deterministic so the same command produces the same comparison.

## Data + assumptions

- Data source: nflverse weekly player stats CSV (https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_2025.csv)
- Season: 2025
- Season type: regular season only
- Slate construction: top 15 quarterbacks by weekly passing yards, used as a hindsight test slate
- Contestant task: rank 10 quarterbacks from the 15-QB slate
- Contestants per week: 25
- MVP scoring: Exact 15, 1 off 7, 2 off 5, 3 off 3, 4+ off 0. Highest total wins.
- Raw differential scoring: sum of rank differentials across the 10 selected QBs. Each selected QB's actual rank is still measured against the full 15-QB slate. Lowest total wins.
- Differential with tiebreakers: raw differential first, then most exact picks, then most one-off-or-better picks, then closest placement of the actual QB1.
- Weighted differential scoring: top-3 actual finishers use distance x 4, actual ranks 4-10 use distance x 2, and actual ranks 11-15 use distance x 1. Weight buckets use actual rank minimum for tied stat ranks.
- Player stat ties: all scoring models use the same tied actual rank range logic.
- Contestant lineups: deterministic synthetic entries using season-to-date prior passing-yard rank, projection noise, alphabetical order, and random strategies.

## Season summary

|Week|QB stat tie groups|MVP winning score|MVP tie groups|MVP largest tie|MVP paid ties|Diff winning score|Diff tie groups|Diff largest tie|Diff paid ties|Diff+TB winning score|Diff+TB tie groups|Diff+TB largest tie|Diff+TB paid ties|Weighted winning score|Weighted tie groups|Weighted largest tie|Weighted paid ties|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
|1|0|40|6|4|0|42|7|5|0|42|2|2|0|73|5|3|1|
|2|0|53|5|2|0|31|7|3|0|31|2|2|0|52|4|3|1|
|3|1|50|6|3|1|32|6|5|2|32|1|2|0|50|2|2|0|
|4|0|43|5|4|1|35|6|5|0|35|1|2|0|54|6|2|1|
|5|0|59|3|3|0|29|6|3|1|29|0|1|0|46|4|4|1|
|6|1|60|4|3|0|30|8|4|1|30|4|2|0|42|3|4|0|
|7|2|40|10|3|1|34|7|4|1|34|0|1|0|67|5|4|0|
|8|0|57|4|3|0|33|7|4|1|33|1|2|0|49|6|2|1|
|9|4|57|5|4|0|40|5|6|0|40|0|1|0|59|3|3|0|
|10|1|35|3|5|0|36|6|6|2|36|2|3|0|53|2|6|0|
|11|0|39|6|4|1|36|7|4|1|36|3|2|0|68|3|2|0|
|12|1|61|4|4|1|26|6|4|1|26|1|2|0|48|3|3|1|
|13|2|67|5|3|0|26|6|4|0|26|1|2|0|42|2|2|0|
|14|1|55|3|3|0|28|5|4|1|28|1|2|1|41|3|2|0|
|15|0|64|4|3|1|21|7|3|0|21|1|2|0|35|3|2|0|
|16|0|65|5|3|0|29|5|5|1|29|0|1|0|43|5|3|1|
|17|0|48|6|3|0|39|6|4|0|39|0|1|0|52|2|2|0|
|18|1|63|6|3|0|37|6|4|2|37|1|2|0|54|4|3|1|


## Deep dive: Week 9

This week was selected automatically because it had the strongest combination of QB stat ties and contestant tie scenarios.

### QB slate

|Actual rank|Projection rank|QB|Team|Passing yards|Prior season yards|Attempts|
|---|---|---|---|---|---|---|
|1|11|Joe Flacco|CIN|470|1599|47|
|2|4|Daniel Jones|IND|342|2062|50|
|3|8|Sam Darnold|SEA|330|1754|24|
|T-4|14|Geno Smith|LV|284|1417|39|
|T-4|10|Jared Goff|DET|284|1631|37|
|6|6|Matthew Stafford|LA|281|1866|32|
|7|9|Caleb Williams|CHI|280|1636|34|
|T-8|7|Jordan Love|GB|273|1798|37|
|T-8|12|Josh Allen|BUF|273|1560|26|
|T-10|13|Tua Tagovailoa|MIA|261|1518|40|
|T-10|15|Jacoby Brissett|ARI|261|599|31|
|12|5|Drake Maye|NE|259|2026|29|
|T-13|3|Dak Prescott|DAL|250|2069|39|
|T-13|2|Patrick Mahomes|KC|250|2099|34|
|T-13|1|Justin Herbert|LAC|250|2140|29|


### QB stat tie groups

- T-4 (4-5), 284 yards: Geno Smith (LV), Jared Goff (DET)
- T-8 (8-9), 273 yards: Jordan Love (GB), Josh Allen (BUF)
- T-10 (10-11), 261 yards: Tua Tagovailoa (MIA), Jacoby Brissett (ARI)
- T-13 (13-15), 250 yards: Dak Prescott (DAL), Patrick Mahomes (KC), Justin Herbert (LAC)

### MVP points leaderboard sample

|Rank|Entry|Strategy|MVP points|Differential points|
|---|---|---|---|---|
|1|entry_0008|field_projection|57|44|
|2|entry_alphabetical|alphabetical|49|40|
|3|entry_0021|field_projection|47|49|
|4|entry_0016|field_projection|45|52|
|T-5|entry_0011|field_projection|40|53|
|T-5|entry_0019|sharp_projection|40|51|
|T-5|entry_0022|sharp_projection|40|53|
|T-5|entry_0023|field_projection|40|54|
|9|entry_0005|field_projection|35|53|
|T-10|entry_0012|field_projection|32|53|


### Alternate differential leaderboard sample

|Rank|Entry|Strategy|Differential points|Exact|1-off+|QB1 miss|MVP points|
|---|---|---|---|---|---|---|---|
|1|entry_alphabetical|alphabetical|40|2|4|7|49|
|2|entry_0008|field_projection|44|3|4|not picked|57|
|3|entry_0021|field_projection|49|2|4|8|47|
|T-4|entry_0010|random|51|0|2|not picked|20|
|T-4|entry_0019|sharp_projection|51|1|3|not picked|40|
|T-4|entry_0025|field_projection|51|1|2|not picked|32|
|7|entry_0016|field_projection|52|2|3|not picked|45|
|T-8|entry_0003|sharp_projection|53|0|3|not picked|26|
|T-8|entry_0005|field_projection|53|1|3|not picked|35|
|T-8|entry_0011|field_projection|53|2|3|8|40|


### Differential with tiebreakers leaderboard sample

|Rank|Entry|Strategy|Differential points|Exact|1-off+|QB1 miss|MVP points|
|---|---|---|---|---|---|---|---|
|1|entry_alphabetical|alphabetical|40|2|4|7|49|
|2|entry_0008|field_projection|44|3|4|not picked|57|
|3|entry_0021|field_projection|49|2|4|8|47|
|4|entry_0019|sharp_projection|51|1|3|not picked|40|
|5|entry_0025|field_projection|51|1|2|not picked|32|
|6|entry_0010|random|51|0|2|not picked|20|
|7|entry_0016|field_projection|52|2|3|not picked|45|
|8|entry_0011|field_projection|53|2|3|8|40|
|9|entry_0022|sharp_projection|53|2|2|not picked|40|
|10|entry_0005|field_projection|53|1|3|not picked|35|


### Weighted differential leaderboard sample

|Rank|Entry|Strategy|Weighted points|Raw differential|Exact|1-off+|QB1 miss|MVP points|
|---|---|---|---|---|---|---|---|---|
|1|entry_0008|field_projection|59|44|3|4|not picked|57|
|2|entry_0025|field_projection|72|51|1|2|not picked|32|
|3|entry_0019|sharp_projection|73|51|1|3|not picked|40|
|4|entry_alphabetical|alphabetical|77|40|2|4|7|49|
|5|entry_0022|sharp_projection|78|53|2|2|not picked|40|
|T-6|entry_0003|sharp_projection|80|53|0|3|not picked|26|
|T-6|entry_0006|field_projection|80|55|0|1|not picked|24|
|T-6|entry_0016|field_projection|80|52|2|3|not picked|45|
|9|entry_0018|field_projection|81|53|0|2|not picked|24|
|T-10|entry_0005|field_projection|82|53|1|3|not picked|35|


### Tie observations

- MVP scoring produced 5 tied leaderboard score group(s), with the largest tie group containing 4 entries.
- MVP scoring produced 0 tie group(s) intersecting the top 3 paid positions.
- Differential scoring produced 5 tied leaderboard score group(s), with the largest tie group containing 6 entries.
- Differential scoring produced 0 tie group(s) intersecting the top 3 paid positions.
- Differential with tiebreakers produced 0 tied leaderboard score group(s), with the largest tie group containing 1 entries.
- Differential with tiebreakers produced 0 tie group(s) intersecting the top 3 paid positions.
- Weighted differential produced 3 tied leaderboard score group(s), with the largest tie group containing 3 entries.
- Weighted differential produced 0 tie group(s) intersecting the top 3 paid positions.

### Top-3 tie payout shapes

- MVP points: no tied group intersects the top 3 paid positions in this simulation.
- Raw differential: no tied group intersects the top 3 paid positions in this simulation.
- Differential with tiebreakers: no tied group intersects the top 3 paid positions in this simulation.
- Weighted differential: no tied group intersects the top 3 paid positions in this simulation.

## How to rerun

```bash
npm run simulate:nfl-scoring -- --season 2025 --entries 25 --slate-size 15 --ranked-picks 10
```

To inspect a specific week:

```bash
npm run simulate:nfl-scoring -- --season 2025 --week 9 --entries 25 --slate-size 15 --ranked-picks 10
```
