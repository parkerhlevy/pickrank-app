#!/usr/bin/env node

import fs from 'node:fs/promises';
import { createWriteStream } from 'node:fs';
import https from 'node:https';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

const SCORING_TABLE = new Map([
  [0, 15],
  [1, 7],
  [2, 5],
  [3, 3],
]);

const DEFAULTS = {
  season: 2025,
  entries: 500,
  slateSize: 15,
  rankedPicks: 10,
  seed: 20250608,
};

function parseArgs(argv) {
  const options = { ...DEFAULTS };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = argv[index + 1];

    if (arg === '--season') {
      options.season = Number(next);
      index += 1;
    } else if (arg === '--week') {
      options.week = Number(next);
      index += 1;
    } else if (arg === '--entries') {
      options.entries = Number(next);
      index += 1;
    } else if (arg === '--slate-size') {
      options.slateSize = Number(next);
      index += 1;
    } else if (arg === '--ranked-picks') {
      options.rankedPicks = Number(next);
      index += 1;
    } else if (arg === '--seed') {
      options.seed = Number(next);
      index += 1;
    } else if (arg === '--help') {
      printHelp();
      process.exit(0);
    }
  }

  if (!Number.isInteger(options.season) || options.season < 1999) {
    throw new Error('--season must be an NFL season year, such as 2025');
  }
  if (options.week !== undefined && (!Number.isInteger(options.week) || options.week < 1)) {
    throw new Error('--week must be a positive integer');
  }
  if (!Number.isInteger(options.entries) || options.entries < 4) {
    throw new Error('--entries must be an integer of at least 4');
  }
  if (!Number.isInteger(options.slateSize) || options.slateSize < 2) {
    throw new Error('--slate-size must be an integer of at least 2');
  }
  if (!Number.isInteger(options.rankedPicks) || options.rankedPicks < 1) {
    throw new Error('--ranked-picks must be a positive integer');
  }
  if (options.rankedPicks > options.slateSize) {
    throw new Error('--ranked-picks must be less than or equal to --slate-size');
  }

  return options;
}

function printHelp() {
  console.log(`PickRank NFL scoring simulator

Usage:
  npm run simulate:nfl-scoring -- --season 2025 --entries 500
  npm run simulate:nfl-scoring -- --season 2025 --week 7 --entries 1000
  npm run simulate:nfl-scoring -- --season 2025 --entries 25 --slate-size 15 --ranked-picks 10

Outputs:
  docs/scoring-simulations/nfl-<season>-pickrank-scoring-simulation.md
  docs/scoring-simulations/nfl-<season>-pickrank-scoring-simulation.json
`);
}

function nflverseStatsUrl(season) {
  return `https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_${season}.csv`;
}

async function ensureDataset(season) {
  const cacheDir = path.join(repoRoot, '.cache', 'nflverse');
  await fs.mkdir(cacheDir, { recursive: true });

  const filePath = path.join(cacheDir, `stats_player_week_${season}.csv`);
  try {
    const stat = await fs.stat(filePath);
    if (stat.size > 0) return filePath;
  } catch {
    // Download below.
  }

  await downloadFile(nflverseStatsUrl(season), filePath);
  return filePath;
}

function downloadFile(url, destination) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode ?? 0)) {
        response.resume();
        downloadFile(response.headers.location, destination).then(resolve, reject);
        return;
      }

      if (response.statusCode !== 200) {
        response.resume();
        reject(new Error(`Failed to download ${url}: HTTP ${response.statusCode}`));
        return;
      }

      const stream = createWriteStream(destination);
      response.pipe(stream);
      stream.on('finish', () => stream.close(resolve));
      stream.on('error', reject);
    });

    request.on('error', reject);
  });
}

async function loadRows(csvPath) {
  const content = await fs.readFile(csvPath, 'utf8');
  const lines = content.trimEnd().split(/\r?\n/);
  const headers = parseCsvLine(lines[0]);
  const wanted = new Set([
    'player_id',
    'player_display_name',
    'position',
    'season',
    'week',
    'season_type',
    'team',
    'opponent_team',
    'attempts',
    'passing_yards',
  ]);
  const indexes = headers
    .map((name, index) => ({ name, index }))
    .filter((column) => wanted.has(column.name));

  return lines.slice(1).map((line) => {
    const values = parseCsvLine(line);
    const row = {};
    for (const { name, index } of indexes) row[name] = values[index];
    return row;
  });
}

function parseCsvLine(line) {
  const values = [];
  let value = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(value);
      value = '';
    } else {
      value += char;
    }
  }

  values.push(value);
  return values;
}

function groupWeeklyQbs(rows, season, slateSize) {
  const byWeek = new Map();

  for (const row of rows) {
    if (row.position !== 'QB') continue;
    if (row.season_type !== 'REG') continue;
    if (Number(row.season) !== season) continue;

    const passingYards = Number(row.passing_yards || 0);
    const attempts = Number(row.attempts || 0);
    if (!Number.isFinite(passingYards) || attempts <= 0) continue;

    const week = Number(row.week);
    if (!byWeek.has(week)) byWeek.set(week, []);

    byWeek.get(week).push({
      playerId: row.player_id,
      name: row.player_display_name,
      team: row.team,
      opponent: row.opponent_team,
      passingYards,
      attempts,
    });
  }

  const weeks = [];
  const priorStats = new Map();
  const sortedWeeks = [...byWeek.entries()].sort(([a], [b]) => a - b);

  for (const [week, players] of sortedWeeks) {
    const sorted = players
      .sort((a, b) => b.passingYards - a.passingYards || b.attempts - a.attempts || a.name.localeCompare(b.name))
      .slice(0, slateSize);
    const projectionRankById = assignProjectionRanks(sorted, priorStats);

    weeks.push({
      week,
      slate: assignActualRanks(sorted).map((player) => ({
        ...player,
        projectionRank: projectionRankById.get(player.playerId),
        priorPassingYards: priorStats.get(player.playerId)?.passingYards ?? 0,
      })),
    });

    for (const player of players) {
      const existing = priorStats.get(player.playerId) ?? { passingYards: 0, attempts: 0 };
      priorStats.set(player.playerId, {
        passingYards: existing.passingYards + player.passingYards,
        attempts: existing.attempts + player.attempts,
      });
    }
  }

  return weeks;
}

function assignProjectionRanks(slate, priorStats) {
  const ranked = [...slate]
    .sort((a, b) => {
      const aPrior = priorStats.get(a.playerId) ?? { passingYards: 0, attempts: 0 };
      const bPrior = priorStats.get(b.playerId) ?? { passingYards: 0, attempts: 0 };
      return bPrior.passingYards - aPrior.passingYards
        || bPrior.attempts - aPrior.attempts
        || a.name.localeCompare(b.name);
    });

  return new Map(ranked.map((player, index) => [player.playerId, index + 1]));
}

function assignActualRanks(players) {
  const ranked = [];
  let index = 0;

  while (index < players.length) {
    const yards = players[index].passingYards;
    let end = index;
    while (end + 1 < players.length && players[end + 1].passingYards === yards) end += 1;

    const min = index + 1;
    const max = end + 1;
    const display = min === max ? String(min) : `T-${min}`;

    for (let playerIndex = index; playerIndex <= end; playerIndex += 1) {
      ranked.push({
        ...players[playerIndex],
        actualRankMin: min,
        actualRankMax: max,
        actualRankDisplay: display,
      });
    }

    index = end + 1;
  }

  return ranked;
}

function mulberry32(seed) {
  return function random() {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function normalish(random) {
  return random() + random() + random() + random() - 2;
}

function generateEntries(slate, count, seed, rankedPicks) {
  const entries = [
    {
      entryId: 'entry_projection_chalk',
      strategy: 'projection_chalk',
      lineup: [...slate]
        .sort((a, b) => a.projectionRank - b.projectionRank || a.name.localeCompare(b.name))
        .slice(0, rankedPicks)
        .map((player) => player.playerId),
    },
    {
      entryId: 'entry_alphabetical',
      strategy: 'alphabetical',
      lineup: [...slate]
        .sort((a, b) => a.name.localeCompare(b.name))
        .slice(0, rankedPicks)
        .map((player) => player.playerId),
    },
  ];

  for (let index = entries.length; index < count; index += 1) {
    const random = mulberry32(seed + index * 101);
    const strategyRoll = random();
    const strategy = strategyRoll < 0.25 ? 'sharp_projection' : strategyRoll < 0.82 ? 'field_projection' : 'random';

    entries.push({
      entryId: `entry_${String(index + 1).padStart(4, '0')}`,
      strategy,
      lineup: buildLineup(slate, strategy, random, rankedPicks),
    });
  }

  return entries;
}

function buildLineup(slate, strategy, random, rankedPicks) {
  if (strategy === 'random') {
    return shuffle(slate.map((player) => player.playerId), random).slice(0, rankedPicks);
  }

  const noiseScale = strategy === 'sharp_projection' ? 1.6 : 4.2;

  return [...slate]
    .map((player) => ({
      player,
      sortValue: player.projectionRank + normalish(random) * noiseScale,
    }))
    .sort((a, b) => a.sortValue - b.sortValue || a.player.name.localeCompare(b.player.name))
    .slice(0, rankedPicks)
    .map((item) => item.player.playerId);
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function scoreEntries(slate, entries) {
  const playerById = new Map(slate.map((player) => [player.playerId, player]));

  return entries.map((entry) => {
    let mvpPoints = 0;
    let differentialPoints = 0;
    let weightedDifferentialPoints = 0;
    const breakdown = entry.lineup.map((playerId, index) => {
      const player = playerById.get(playerId);
      const userRank = index + 1;
      const distance = distanceToActualRange(userRank, player);
      const points = SCORING_TABLE.get(distance) ?? 0;
      const weightedPoints = distance * actualRankWeight(player);

      mvpPoints += points;
      differentialPoints += distance;
      weightedDifferentialPoints += weightedPoints;

      return {
        playerId,
        name: player.name,
        userRank,
        actualRankDisplay: player.actualRankDisplay,
        passingYards: player.passingYards,
        distance,
        mvpPoints: points,
        differentialPoints: distance,
        weightedDifferentialPoints: weightedPoints,
      };
    });

    return {
      entryId: entry.entryId,
      strategy: entry.strategy,
      mvpPoints,
      differentialPoints,
      weightedDifferentialPoints,
      exactPicks: breakdown.filter((pick) => pick.distance === 0).length,
      oneOffOrBetterPicks: breakdown.filter((pick) => pick.distance <= 1).length,
      actualQb1Distance: breakdown.find((pick) => pick.actualRankDisplay === '1')?.distance ?? Number.POSITIVE_INFINITY,
      breakdown,
    };
  });
}

function actualRankWeight(player) {
  if (player.actualRankMin <= 3) return 4;
  if (player.actualRankMin <= 10) return 2;
  return 1;
}

function distanceToActualRange(userRank, player) {
  if (userRank >= player.actualRankMin && userRank <= player.actualRankMax) return 0;
  return Math.min(
    Math.abs(userRank - player.actualRankMin),
    Math.abs(userRank - player.actualRankMax),
  );
}

function rankEntries(scoredEntries, system) {
  const scoreKey = scoreKeyForSystem(system);
  const sorted = [...scoredEntries].sort((a, b) => {
    const scoreDelta = system === 'mvp' ? b[scoreKey] - a[scoreKey] : a[scoreKey] - b[scoreKey];
    if (scoreDelta) return scoreDelta;

    if (system === 'differential_tiebreak') {
      return b.exactPicks - a.exactPicks
        || b.oneOffOrBetterPicks - a.oneOffOrBetterPicks
        || a.actualQb1Distance - b.actualQb1Distance
        || a.entryId.localeCompare(b.entryId);
    }

    return scoreDelta || a.entryId.localeCompare(b.entryId);
  });

  const ranked = [];
  let index = 0;
  while (index < sorted.length) {
    let end = index;
    while (end + 1 < sorted.length && entriesRemainTied(sorted[end], sorted[end + 1], system, scoreKey)) end += 1;

    const rank = index + 1;
    const tieSize = end - index + 1;
    for (let entryIndex = index; entryIndex <= end; entryIndex += 1) {
      ranked.push({
        ...sorted[entryIndex],
        rank,
        rankDisplay: tieSize > 1 ? `T-${rank}` : String(rank),
        tieSize,
      });
    }

    index = end + 1;
  }

  return ranked;
}

function scoreKeyForSystem(system) {
  if (system === 'mvp') return 'mvpPoints';
  if (system === 'weighted_differential') return 'weightedDifferentialPoints';
  return 'differentialPoints';
}

function entriesRemainTied(a, b, system, scoreKey) {
  if (a[scoreKey] !== b[scoreKey]) return false;
  if (system !== 'differential_tiebreak') return true;

  return a.exactPicks === b.exactPicks
    && a.oneOffOrBetterPicks === b.oneOffOrBetterPicks
    && a.actualQb1Distance === b.actualQb1Distance;
}

function summarizeTieGroups(rankedEntries, system) {
  const scoreKey = scoreKeyForSystem(system);
  const groups = new Map();
  for (const entry of rankedEntries) {
    if (entry.tieSize <= 1) continue;
    const key = String(entry.rank);
    if (!groups.has(key)) {
      groups.set(key, {
        rank: entry.rank,
        rankDisplay: entry.rankDisplay,
        score: entry[scoreKey],
        scoringSystem: system,
        mvpPoints: entry.mvpPoints,
        differentialScore: entry.differentialPoints,
        weightedDifferentialScore: entry.weightedDifferentialPoints,
        exactPicks: entry.exactPicks,
        oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
        actualQb1Distance: entry.actualQb1Distance,
        size: entry.tieSize,
      });
    }
  }

  return [...groups.values()].sort((a, b) => a.rank - b.rank);
}

function summarizeStatTies(slate) {
  const byYards = new Map();
  for (const player of slate) {
    if (!byYards.has(player.passingYards)) byYards.set(player.passingYards, []);
    byYards.get(player.passingYards).push(player);
  }

  return [...byYards.entries()]
    .filter(([, players]) => players.length > 1)
    .map(([passingYards, players]) => ({
      passingYards: Number(passingYards),
      rankDisplay: players[0].actualRankDisplay,
      range: `${players[0].actualRankMin}-${players[0].actualRankMax}`,
      players: players.map((player) => `${player.name} (${player.team})`),
    }));
}

function paidTieGroups(tieGroups, paidSlots = 3) {
  return tieGroups.filter((group) => group.rank <= paidSlots && group.rank + group.size - 1 >= 1);
}

function renderPaidTieGroups(groups, systemLabel, paidSlots = 3) {
  if (groups.length === 0) {
    return `- ${systemLabel}: no tied group intersects the top ${paidSlots} paid positions in this simulation.`;
  }

  return groups.map((group) => {
    const firstOccupiedSlot = group.rank;
    const lastOccupiedSlot = group.rank + group.size - 1;
    const firstPaidSlot = Math.max(firstOccupiedSlot, 1);
    const lastPaidSlot = Math.min(lastOccupiedSlot, paidSlots);
    const paidSlotText = firstPaidSlot === lastPaidSlot
      ? `${firstPaidSlot}`
      : `${firstPaidSlot}-${lastPaidSlot}`;

    return `- ${systemLabel}: ${group.rankDisplay}, score ${group.score}, ${group.size} tied entries. Occupies leaderboard slots ${firstOccupiedSlot}-${lastOccupiedSlot}; affects paid slot(s) ${paidSlotText}.`;
  }).join('\n');
}

function analyzeWeek(weekData, options) {
  const entries = generateEntries(weekData.slate, options.entries, options.seed + weekData.week * 10000, options.rankedPicks);
  const scored = scoreEntries(weekData.slate, entries);
  const mvpLeaderboard = rankEntries(scored, 'mvp');
  const differentialLeaderboard = rankEntries(scored, 'differential');
  const differentialTiebreakLeaderboard = rankEntries(scored, 'differential_tiebreak');
  const weightedDifferentialLeaderboard = rankEntries(scored, 'weighted_differential');
  const mvpTieGroups = summarizeTieGroups(mvpLeaderboard, 'mvp');
  const differentialTieGroups = summarizeTieGroups(differentialLeaderboard, 'differential');
  const differentialTiebreakTieGroups = summarizeTieGroups(differentialTiebreakLeaderboard, 'differential_tiebreak');
  const weightedDifferentialTieGroups = summarizeTieGroups(weightedDifferentialLeaderboard, 'weighted_differential');

  return {
    week: weekData.week,
    slate: weekData.slate,
    statTieGroups: summarizeStatTies(weekData.slate),
    mvp: {
      leaderboard: mvpLeaderboard,
      tieGroups: mvpTieGroups,
      paidTieGroups: paidTieGroups(mvpTieGroups),
      winnerIds: mvpLeaderboard.filter((entry) => entry.rank === 1).map((entry) => entry.entryId),
      winningScore: mvpLeaderboard[0].mvpPoints,
      largestTieSize: mvpTieGroups.reduce((max, group) => Math.max(max, group.size), 1),
    },
    differential: {
      leaderboard: differentialLeaderboard,
      tieGroups: differentialTieGroups,
      paidTieGroups: paidTieGroups(differentialTieGroups),
      winnerIds: differentialLeaderboard.filter((entry) => entry.rank === 1).map((entry) => entry.entryId),
      winningScore: differentialLeaderboard[0].differentialPoints,
      largestTieSize: differentialTieGroups.reduce((max, group) => Math.max(max, group.size), 1),
    },
    differentialTiebreak: {
      leaderboard: differentialTiebreakLeaderboard,
      tieGroups: differentialTiebreakTieGroups,
      paidTieGroups: paidTieGroups(differentialTiebreakTieGroups),
      winnerIds: differentialTiebreakLeaderboard.filter((entry) => entry.rank === 1).map((entry) => entry.entryId),
      winningScore: differentialTiebreakLeaderboard[0].differentialPoints,
      largestTieSize: differentialTiebreakTieGroups.reduce((max, group) => Math.max(max, group.size), 1),
    },
    weightedDifferential: {
      leaderboard: weightedDifferentialLeaderboard,
      tieGroups: weightedDifferentialTieGroups,
      paidTieGroups: paidTieGroups(weightedDifferentialTieGroups),
      winnerIds: weightedDifferentialLeaderboard.filter((entry) => entry.rank === 1).map((entry) => entry.entryId),
      winningScore: weightedDifferentialLeaderboard[0].weightedDifferentialPoints,
      largestTieSize: weightedDifferentialTieGroups.reduce((max, group) => Math.max(max, group.size), 1),
    },
  };
}

function chooseDeepDive(weeks) {
  return [...weeks].sort((a, b) => {
    const bScore = b.statTieGroups.length * 100
      + b.mvp.paidTieGroups.length * 50
      + b.differential.paidTieGroups.length * 50
      + b.differentialTiebreak.paidTieGroups.length * 50
      + b.weightedDifferential.paidTieGroups.length * 50
      + b.mvp.largestTieSize
      + b.differential.largestTieSize
      + b.differentialTiebreak.largestTieSize
      + b.weightedDifferential.largestTieSize;
    const aScore = a.statTieGroups.length * 100
      + a.mvp.paidTieGroups.length * 50
      + a.differential.paidTieGroups.length * 50
      + a.differentialTiebreak.paidTieGroups.length * 50
      + a.weightedDifferential.paidTieGroups.length * 50
      + a.mvp.largestTieSize
      + a.differential.largestTieSize
      + a.differentialTiebreak.largestTieSize
      + a.weightedDifferential.largestTieSize;
    return bScore - aScore;
  })[0];
}

function table(headers, rows) {
  const separator = headers.map(() => '---').join('|');
  const header = headers.join('|');
  const body = rows.map((row) => row.join('|')).join('\n');
  return `|${header}|\n|${separator}|\n${body ? `${body.split('\n').map((line) => `|${line}|`).join('\n')}\n` : ''}`;
}

function formatQb1Distance(distance) {
  return Number.isFinite(distance) ? String(distance) : 'not picked';
}

function renderReport({ season, entries, slateSize, rankedPicks, sourceUrl, weeks, deepDive }) {
  const summaryRows = weeks.map((week) => [
    String(week.week),
    String(week.statTieGroups.length),
    String(week.mvp.winningScore),
    String(week.mvp.tieGroups.length),
    String(week.mvp.largestTieSize),
    String(week.mvp.paidTieGroups.length),
    String(week.differential.winningScore),
    String(week.differential.tieGroups.length),
    String(week.differential.largestTieSize),
    String(week.differential.paidTieGroups.length),
    String(week.differentialTiebreak.winningScore),
    String(week.differentialTiebreak.tieGroups.length),
    String(week.differentialTiebreak.largestTieSize),
    String(week.differentialTiebreak.paidTieGroups.length),
    String(week.weightedDifferential.winningScore),
    String(week.weightedDifferential.tieGroups.length),
    String(week.weightedDifferential.largestTieSize),
    String(week.weightedDifferential.paidTieGroups.length),
  ]);

  const slateRows = deepDive.slate.map((player) => [
    player.actualRankDisplay,
    String(player.projectionRank),
    player.name,
    player.team,
    String(player.passingYards),
    String(player.priorPassingYards),
    String(player.attempts),
  ]);

  const mvpRows = deepDive.mvp.leaderboard.slice(0, 10).map((entry) => [
    entry.rankDisplay,
    entry.entryId,
    entry.strategy,
    String(entry.mvpPoints),
    String(entry.differentialPoints),
  ]);

  const differentialRows = deepDive.differential.leaderboard.slice(0, 10).map((entry) => [
    entry.rankDisplay,
    entry.entryId,
    entry.strategy,
    String(entry.differentialPoints),
    String(entry.exactPicks),
    String(entry.oneOffOrBetterPicks),
    formatQb1Distance(entry.actualQb1Distance),
    String(entry.mvpPoints),
  ]);

  const differentialTiebreakRows = deepDive.differentialTiebreak.leaderboard.slice(0, 10).map((entry) => [
    entry.rankDisplay,
    entry.entryId,
    entry.strategy,
    String(entry.differentialPoints),
    String(entry.exactPicks),
    String(entry.oneOffOrBetterPicks),
    formatQb1Distance(entry.actualQb1Distance),
    String(entry.mvpPoints),
  ]);

  const weightedDifferentialRows = deepDive.weightedDifferential.leaderboard.slice(0, 10).map((entry) => [
    entry.rankDisplay,
    entry.entryId,
    entry.strategy,
    String(entry.weightedDifferentialPoints),
    String(entry.differentialPoints),
    String(entry.exactPicks),
    String(entry.oneOffOrBetterPicks),
    formatQb1Distance(entry.actualQb1Distance),
    String(entry.mvpPoints),
  ]);

  const statTieText = deepDive.statTieGroups.length
    ? deepDive.statTieGroups.map((group) => `- ${group.rankDisplay} (${group.range}), ${group.passingYards} yards: ${group.players.join(', ')}`).join('\n')
    : '- No player passing-yard ties inside this 15-QB slate.';
  const paidTieText = [
    renderPaidTieGroups(deepDive.mvp.paidTieGroups, 'MVP points'),
    renderPaidTieGroups(deepDive.differential.paidTieGroups, 'Raw differential'),
    renderPaidTieGroups(deepDive.differentialTiebreak.paidTieGroups, 'Differential with tiebreakers'),
    renderPaidTieGroups(deepDive.weightedDifferential.paidTieGroups, 'Weighted differential'),
  ].join('\n');

  return `# PickRank ${season} NFL Scoring Simulation

## Purpose

Compare the locked MVP points table, the raw low-score rank differential model, a differential model with top-3 tiebreakers, and a weighted top-of-slate differential model using real NFL weekly QB passing data.

This is a simulation artifact, not production scoring code. Contestant entries are synthetic and deterministic so the same command produces the same comparison.

## Data + assumptions

- Data source: nflverse weekly player stats CSV (${sourceUrl})
- Season: ${season}
- Season type: regular season only
- Slate construction: top ${slateSize} quarterbacks by weekly passing yards, used as a hindsight test slate
- Contestant task: rank ${rankedPicks} quarterbacks from the ${slateSize}-QB slate
- Contestants per week: ${entries}
- MVP scoring: Exact 15, 1 off 7, 2 off 5, 3 off 3, 4+ off 0. Highest total wins.
- Raw differential scoring: sum of rank differentials across the ${rankedPicks} selected QBs. Each selected QB's actual rank is still measured against the full ${slateSize}-QB slate. Lowest total wins.
- Differential with tiebreakers: raw differential first, then most exact picks, then most one-off-or-better picks, then closest placement of the actual QB1.
- Weighted differential scoring: top-3 actual finishers use distance x 4, actual ranks 4-10 use distance x 2, and actual ranks 11-15 use distance x 1. Weight buckets use actual rank minimum for tied stat ranks.
- Player stat ties: all scoring models use the same tied actual rank range logic.
- Contestant lineups: deterministic synthetic entries using season-to-date prior passing-yard rank, projection noise, alphabetical order, and random strategies.

## Season summary

${table([
    'Week',
    'QB stat tie groups',
    'MVP winning score',
    'MVP tie groups',
    'MVP largest tie',
    'MVP paid ties',
    'Diff winning score',
    'Diff tie groups',
    'Diff largest tie',
    'Diff paid ties',
    'Diff+TB winning score',
    'Diff+TB tie groups',
    'Diff+TB largest tie',
    'Diff+TB paid ties',
    'Weighted winning score',
    'Weighted tie groups',
    'Weighted largest tie',
    'Weighted paid ties',
  ], summaryRows)}

## Deep dive: Week ${deepDive.week}

This week was selected automatically because it had the strongest combination of QB stat ties and contestant tie scenarios.

### QB slate

${table(['Actual rank', 'Projection rank', 'QB', 'Team', 'Passing yards', 'Prior season yards', 'Attempts'], slateRows)}

### QB stat tie groups

${statTieText}

### MVP points leaderboard sample

${table(['Rank', 'Entry', 'Strategy', 'MVP points', 'Differential points'], mvpRows)}

### Alternate differential leaderboard sample

${table(['Rank', 'Entry', 'Strategy', 'Differential points', 'Exact', '1-off+', 'QB1 miss', 'MVP points'], differentialRows)}

### Differential with tiebreakers leaderboard sample

${table(['Rank', 'Entry', 'Strategy', 'Differential points', 'Exact', '1-off+', 'QB1 miss', 'MVP points'], differentialTiebreakRows)}

### Weighted differential leaderboard sample

${table(['Rank', 'Entry', 'Strategy', 'Weighted points', 'Raw differential', 'Exact', '1-off+', 'QB1 miss', 'MVP points'], weightedDifferentialRows)}

### Tie observations

- MVP scoring produced ${deepDive.mvp.tieGroups.length} tied leaderboard score group(s), with the largest tie group containing ${deepDive.mvp.largestTieSize} entries.
- MVP scoring produced ${deepDive.mvp.paidTieGroups.length} tie group(s) intersecting the top 3 paid positions.
- Differential scoring produced ${deepDive.differential.tieGroups.length} tied leaderboard score group(s), with the largest tie group containing ${deepDive.differential.largestTieSize} entries.
- Differential scoring produced ${deepDive.differential.paidTieGroups.length} tie group(s) intersecting the top 3 paid positions.
- Differential with tiebreakers produced ${deepDive.differentialTiebreak.tieGroups.length} tied leaderboard score group(s), with the largest tie group containing ${deepDive.differentialTiebreak.largestTieSize} entries.
- Differential with tiebreakers produced ${deepDive.differentialTiebreak.paidTieGroups.length} tie group(s) intersecting the top 3 paid positions.
- Weighted differential produced ${deepDive.weightedDifferential.tieGroups.length} tied leaderboard score group(s), with the largest tie group containing ${deepDive.weightedDifferential.largestTieSize} entries.
- Weighted differential produced ${deepDive.weightedDifferential.paidTieGroups.length} tie group(s) intersecting the top 3 paid positions.

### Top-3 tie payout shapes

${paidTieText}

## How to rerun

\`\`\`bash
npm run simulate:nfl-scoring -- --season ${season} --entries ${entries} --slate-size ${slateSize} --ranked-picks ${rankedPicks}
\`\`\`

To inspect a specific week:

\`\`\`bash
npm run simulate:nfl-scoring -- --season ${season} --week ${deepDive.week} --entries ${entries} --slate-size ${slateSize} --ranked-picks ${rankedPicks}
\`\`\`
`;
}

function toJsonPayload({ season, entries, slateSize, rankedPicks, sourceUrl, weeks }) {
  return {
    season,
    entries,
    slateSize,
    rankedPicks,
    sourceUrl,
    generatedAt: new Date().toISOString(),
    weeks: weeks.map((week) => ({
      week: week.week,
      slate: week.slate,
      statTieGroups: week.statTieGroups,
      mvp: {
        winningScore: week.mvp.winningScore,
        winnerIds: week.mvp.winnerIds,
        tieGroups: week.mvp.tieGroups,
        paidTieGroups: week.mvp.paidTieGroups,
        top10: week.mvp.leaderboard.slice(0, 10).map(stripBreakdown),
      },
      differential: {
        winningScore: week.differential.winningScore,
        winnerIds: week.differential.winnerIds,
        tieGroups: week.differential.tieGroups,
        paidTieGroups: week.differential.paidTieGroups,
        top10: week.differential.leaderboard.slice(0, 10).map(stripBreakdown),
      },
      differentialTiebreak: {
        winningScore: week.differentialTiebreak.winningScore,
        winnerIds: week.differentialTiebreak.winnerIds,
        tieGroups: week.differentialTiebreak.tieGroups,
        paidTieGroups: week.differentialTiebreak.paidTieGroups,
        top10: week.differentialTiebreak.leaderboard.slice(0, 10).map(stripBreakdown),
      },
      weightedDifferential: {
        winningScore: week.weightedDifferential.winningScore,
        winnerIds: week.weightedDifferential.winnerIds,
        tieGroups: week.weightedDifferential.tieGroups,
        paidTieGroups: week.weightedDifferential.paidTieGroups,
        top10: week.weightedDifferential.leaderboard.slice(0, 10).map(stripBreakdown),
      },
    })),
  };
}

function stripBreakdown(entry) {
  return Object.fromEntries(
    Object.entries(entry).filter(([key]) => key !== 'breakdown'),
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const csvPath = await ensureDataset(options.season);
  const rows = await loadRows(csvPath);
  const weeklyData = groupWeeklyQbs(rows, options.season, options.slateSize)
    .filter((week) => options.week === undefined || week.week === options.week);

  if (weeklyData.length === 0) {
    throw new Error(`No regular-season QB data found for season ${options.season}${options.week ? ` week ${options.week}` : ''}`);
  }

  const weeks = weeklyData.map((week) => analyzeWeek(week, options));
  const deepDive = options.week ? weeks[0] : chooseDeepDive(weeks);
  const sourceUrl = nflverseStatsUrl(options.season);
  const outputDir = path.join(repoRoot, 'docs', 'scoring-simulations');
  await fs.mkdir(outputDir, { recursive: true });

  const basename = options.week
    ? `nfl-${options.season}-week-${options.week}-pickrank-scoring-simulation`
    : `nfl-${options.season}-pickrank-scoring-simulation`;
  const markdownPath = path.join(outputDir, `${basename}.md`);
  const jsonPath = path.join(outputDir, `${basename}.json`);

  await fs.writeFile(
    markdownPath,
    renderReport({
      season: options.season,
      entries: options.entries,
      slateSize: options.slateSize,
      rankedPicks: options.rankedPicks,
      sourceUrl,
      weeks,
      deepDive,
    }),
  );
  await fs.writeFile(
    jsonPath,
    `${JSON.stringify(toJsonPayload({
      season: options.season,
      entries: options.entries,
      slateSize: options.slateSize,
      rankedPicks: options.rankedPicks,
      sourceUrl,
      weeks,
    }), null, 2)}\n`,
  );

  console.log(`Wrote ${path.relative(repoRoot, markdownPath)}`);
  console.log(`Wrote ${path.relative(repoRoot, jsonPath)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
