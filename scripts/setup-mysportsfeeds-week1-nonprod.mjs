import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';

const vite = await createServer({
  appType: 'custom',
  configFile: false,
  logLevel: 'silent',
  resolve: { alias: { '@': process.cwd() } },
  server: { middlewareMode: true },
});
const {
  createDraftContest,
  listPublicContests,
  publishContest,
  saveContestSlate,
  validateDraftContest,
} = await vite.ssrLoadModule('/lib/contest-data.ts');

const confirmationFlag = '--confirm-isolated-file-store';
const requestedPath = readArgument('--data-file');

if (!process.argv.includes(confirmationFlag) || !requestedPath) {
  throw new Error(
    `Refusing to continue. Pass ${confirmationFlag} and an explicit --data-file path for a non-production file store.`,
  );
}

const dataFilePath = path.resolve(process.cwd(), requestedPath);
const allowedDataDirectory = path.resolve(process.cwd(), 'data');

if (!dataFilePath.startsWith(`${allowedDataDirectory}${path.sep}`)) {
  throw new Error('The non-production contest file must be inside this worktree data directory.');
}

const targetContestId = 'week-1-qb-passing-yards-msf-validation';
const existingStore = JSON.parse(await readFile(dataFilePath, 'utf8'));
const existingTarget = existingStore.contests?.some((contest) => contest.id === targetContestId);

if (existingTarget && !process.argv.includes('--replace-existing')) {
  throw new Error('The MySportsFeeds Week 1 validation contest already exists. Pass --replace-existing to replace only that local contest.');
}

if (existingTarget) {
  await writeFile(
    dataFilePath,
    `${JSON.stringify({
      ...existingStore,
      contests: existingStore.contests.filter((contest) => contest.id !== targetContestId),
      contestStateEvents: (existingStore.contestStateEvents || []).filter((event) => event.contestId !== targetContestId),
    }, null, 2)}\n`,
    'utf8',
  );
}

const setupTime = '2026-09-01T05:00:00.000Z';
const operatorId = 'local-mysportsfeeds-week1-setup';
const contest = await createDraftContest(
  {
    title: 'Week 1 QB Passing Yards MSF Validation',
    description: 'Pick and rank your top 10 quarterbacks by Week 1 passing yards.',
    season: 2026,
    week: 1,
    entryFeeCents: 0,
    entryOpenTimeIso: '2026-09-01T00:00:00.000Z',
    lockTimeIso: '2026-09-13T17:00:00.000Z',
    createdByAdminId: operatorId,
  },
  { dataFilePath },
);

const slatePlayers = [
  player('mysportsfeeds-133835', '133835', '163543', 'Caleb Williams', 'CHI', 'CAR', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-79739', '79739', '163543', 'Bryce Young', 'CAR', 'CHI', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-14492', '14492', '163544', 'Baker Mayfield', 'TB', 'CIN', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-18577', '18577', '163544', 'Joe Burrow', 'CIN', 'TB', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-166710', '166710', '163545', 'Tyler Shough', 'NO', 'DET', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-9919', '9919', '163545', 'Jared Goff', 'DET', 'NO', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-14498', '14498', '163546', 'Josh Allen', 'BUF', 'HOU', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-79740', '79740', '163546', 'C.J. Stroud', 'HOU', 'BUF', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-14523', '14523', '163547', 'Lamar Jackson', 'BAL', 'IND', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-16603', '16603', '163547', 'Daniel Jones', 'IND', 'BAL', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-13027', '13027', '163548', 'Deshaun Watson', 'CLE', 'JAX', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-30425', '30425', '163548', 'Trevor Lawrence', 'JAX', 'CLE', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-19276', '19276', '163550', 'Geno Smith', 'NYJ', 'TEN', 'away', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-166676', '166676', '163550', 'Cam Ward', 'TEN', 'NYJ', 'home', '2026-09-13T17:00:00.000Z'),
  player('mysportsfeeds-18607', '18607', '163553', 'Jordan Love', 'GB', 'MIN', 'away', '2026-09-13T20:25:00.000Z'),
  player('mysportsfeeds-16226', '16226', '163553', 'Kyler Murray', 'MIN', 'GB', 'home', '2026-09-13T20:25:00.000Z'),
  player('mysportsfeeds-133836', '133836', '163554', 'Jayden Daniels', 'WAS', 'PHI', 'away', '2026-09-13T20:25:00.000Z'),
  player('mysportsfeeds-18668', '18668', '163554', 'Jalen Hurts', 'PHI', 'WAS', 'home', '2026-09-13T20:25:00.000Z'),
  player('mysportsfeeds-9845', '9845', '163555', 'Dak Prescott', 'DAL', 'NYG', 'away', '2026-09-14T00:20:00.000Z'),
  player('mysportsfeeds-166640', '166640', '163555', 'Jaxson Dart', 'NYG', 'DAL', 'home', '2026-09-14T00:20:00.000Z'),
];

await saveContestSlate(contest.id, slatePlayers, { dataFilePath, now: setupTime });
const validation = await validateDraftContest(contest.id, operatorId, { dataFilePath, now: setupTime });

if (validation.validation.status !== 'passed') {
  throw new Error(`Week 1 contest validation failed: ${validation.validation.errors.join(' ')}`);
}

const published = await publishContest(contest.id, operatorId, { dataFilePath, now: setupTime });
const publicContests = await listPublicContests({ dataFilePath });
const publicContest = publicContests.find((candidate) => candidate.id === contest.id);

if (!publicContest) {
  throw new Error('The published Week 1 contest is missing from the non-production public contest list.');
}

console.log(
  JSON.stringify(
    {
      environment: 'isolated_file_store',
      dataFilePath,
      contestId: published.contest.id,
      status: published.contest.contestStatus,
      visibilityStatus: published.contest.visibilityStatus,
      statCategory: published.contest.statCategory,
      slateSize: published.contest.slatePlayers.length,
      rankedPlayerCount: published.contest.lineupPlayers.length,
      entryFeeCents: published.contest.entryFeeCents,
      lockTimeIso: published.contest.lockTimeIso,
      validationStatus: published.validation.status,
      publicListVerified: true,
    },
    null,
    2,
  ),
);
await vite.close();

function player(playerId, providerPlayerId, providerGameId, displayName, teamAbbreviation, opponentAbbreviation, homeAway, gameStartTime) {
  return {
    playerId,
    providerPlayerId,
    providerGameId,
    displayName,
    teamAbbreviation,
    opponentAbbreviation,
    homeAway,
    gameStartTime,
    position: 'QB',
    activeStatus: 'starter_confirmed_manual_2026-09-01',
    sortOrderInternal: 1,
  };
}

function readArgument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? '' : process.argv[index + 1] || '';
}
