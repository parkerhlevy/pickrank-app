import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { runMySportsFeedsReadOnlyValidation } from '../lib/mysportsfeeds-validation.ts';

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

async function main() {
  const env = await loadEnvFile(path.join(process.cwd(), '.env.local'));
  const args = parseArgs(process.argv.slice(2));
  const season =
    args.season ||
    process.env.PICKRANK_MYSPORTSFEEDS_SEASON ||
    env.PICKRANK_MYSPORTSFEEDS_SEASON ||
    '2026-regular';
  const week = readPositiveInteger(
    args.week || process.env.PICKRANK_MYSPORTSFEEDS_WEEK || env.PICKRANK_MYSPORTSFEEDS_WEEK || '1',
    'PICKRANK_MYSPORTSFEEDS_WEEK',
  );
  const result = await runMySportsFeedsReadOnlyValidation({
    apiKey: process.env.PICKRANK_MYSPORTSFEEDS_API_KEY || env.PICKRANK_MYSPORTSFEEDS_API_KEY || '',
    password:
      process.env.PICKRANK_MYSPORTSFEEDS_PASSWORD ||
      env.PICKRANK_MYSPORTSFEEDS_PASSWORD ||
      'MYSPORTSFEEDS',
    baseUrl:
      process.env.PICKRANK_MYSPORTSFEEDS_BASE_URL ||
      env.PICKRANK_MYSPORTSFEEDS_BASE_URL ||
      'https://api.mysportsfeeds.com/v2.1/pull/nfl',
    season,
    week,
    gameId: args.game || process.env.PICKRANK_MYSPORTSFEEDS_GAME_ID || env.PICKRANK_MYSPORTSFEEDS_GAME_ID,
    teamAbbreviation:
      args.team || process.env.PICKRANK_MYSPORTSFEEDS_TEAM || env.PICKRANK_MYSPORTSFEEDS_TEAM,
  });

  console.log(
    JSON.stringify(
      {
        providerKey: result.providerKey,
        providerName: result.providerName,
        providerSnapshotTime: result.providerSnapshotTime,
        season: result.season,
        week: result.week,
        endpoints: result.endpoints,
        checks: result.checks,
        gamesTotal: result.gamesTotal,
        gamesScheduled: result.gamesScheduled,
        gamesInProgress: result.gamesInProgress,
        gamesFinal: result.gamesFinal,
        allGamesFinal: result.allGamesFinal,
        selectedGame: result.selectedGame,
        statRowsFound: result.statRowsFound,
        topFive: result.topFive,
        notes: result.notes,
      },
      null,
      2,
    ),
  );
}

async function loadEnvFile(filePath) {
  try {
    const fileContents = await readFile(filePath, 'utf8');
    return Object.fromEntries(
      fileContents
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith('#'))
        .map((line) => {
          const separatorIndex = line.indexOf('=');
          const key = line.slice(0, separatorIndex).trim();
          let value = line.slice(separatorIndex + 1).trim();

          if (value.length >= 2 && value[0] === value[value.length - 1] && ['"', "'"].includes(value[0])) {
            value = value.slice(1, -1);
          }

          return [key, value];
        }),
    );
  } catch {
    return {};
  }
}

function parseArgs(args) {
  const parsed = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--season') {
      parsed.season = args[index + 1];
      index += 1;
    } else if (arg === '--week') {
      parsed.week = args[index + 1];
      index += 1;
    } else if (arg === '--game') {
      parsed.game = args[index + 1];
      index += 1;
    } else if (arg === '--team') {
      parsed.team = args[index + 1];
      index += 1;
    }
  }

  return parsed;
}

function readPositiveInteger(value, label) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} must be a positive integer.`);
  }

  return parsed;
}
