import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  ensurePersistedContestEntry,
  getPersistedContestEntry,
  removePersistedContestEntry,
  savePersistedContestEntryLineup,
} from '../../lib/persisted-contest-entry';

const demoViewerId = '00000000-0000-4000-8000-000000000123';
const demoPlayers = ['Josh Allen', 'Joe Burrow', 'Derek Carr'];
const demoSelectablePlayers = [
  'Josh Allen',
  'Joe Burrow',
  'Derek Carr',
  'Lamar Jackson',
  'Jalen Hurts',
  'Patrick Mahomes',
  'Jared Goff',
  'Dak Prescott',
  'Brock Purdy',
  'Tua Tagovailoa',
  'Matthew Stafford',
  'C.J. Stroud',
];
const demoDefaultOrder = [
  'Josh Allen',
  'Joe Burrow',
  'Derek Carr',
  'Lamar Jackson',
  'Jalen Hurts',
  'Patrick Mahomes',
  'Jared Goff',
  'Dak Prescott',
  'Brock Purdy',
  'Tua Tagovailoa',
];

async function createEntryStorePath() {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-entry-store-'));
  return path.join(tempDirectory, 'contest-entries.json');
}

async function createContestStorePath() {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contest-store-'));
  const contestDataFilePath = path.join(tempDirectory, 'contests.json');
  const baselineContestStore = await readFile(path.join(process.cwd(), 'data', 'contests.json'), 'utf8');

  await writeFile(contestDataFilePath, baselineContestStore, 'utf8');

  return contestDataFilePath;
}

async function readContestCounts(contestDataFilePath: string, contestId: string) {
  const contestStore = JSON.parse(await readFile(contestDataFilePath, 'utf8')) as {
    contests: Array<{ id: string; entryCount: number; paidEntryCount: number }>;
  };
  const contest = contestStore.contests.find((entry) => entry.id === contestId);

  if (!contest) {
    throw new Error(`Missing contest fixture: ${contestId}`);
  }

  return {
    entryCount: contest.entryCount,
    paidEntryCount: contest.paidEntryCount,
  };
}

describe('persisted contest entry store', () => {
  it('creates a new entry with a saved default lineup order', async () => {
    const dataFilePath = await createEntryStorePath();
    const contestDataFilePath = await createContestStorePath();
    const beforeCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    const result = await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      now: '2026-06-19T10:00:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    expect(result.created).toBe(true);
    expect(result.entry.contestId).toBe('week-1-qb-passing-yards');
    expect(result.entry.lineupOrder).toEqual(demoDefaultOrder);
    expect(result.entry.source).toBe('default_assigned');

    const savedStore = JSON.parse(await readFile(dataFilePath, 'utf8')) as {
      version: number;
      entries: Array<{ userId: string }>;
    };
    expect(savedStore.version).toBe(1);
    expect(savedStore.entries[0]?.userId).toBe(demoViewerId);

    const afterCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    expect(afterCounts.entryCount).toBe(beforeCounts.entryCount + 1);
    expect(afterCounts.paidEntryCount).toBe(beforeCounts.paidEntryCount);
  });

  it('reuses an existing entry and saved lineup order', async () => {
    const dataFilePath = await createEntryStorePath();
    const contestDataFilePath = await createContestStorePath();
    const beforeCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    const created = await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      now: '2026-06-19T10:00:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    const reused = await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      now: '2026-06-19T11:00:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    expect(reused.created).toBe(false);
    expect(reused.entry.entryId).toBe(created.entry.entryId);
    expect(reused.entry.lineupOrder).toEqual(demoDefaultOrder);

    const afterCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    expect(afterCounts.entryCount).toBe(beforeCounts.entryCount + 1);
    expect(afterCounts.paidEntryCount).toBe(beforeCounts.paidEntryCount);
  });

  it('updates the saved lineup order for the current entry', async () => {
    const dataFilePath = await createEntryStorePath();
    const contestDataFilePath = await createContestStorePath();
    await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      now: '2026-06-19T10:00:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    const saved = await savePersistedContestEntryLineup({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      order: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa'],
      now: '2026-06-19T10:05:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    expect(saved.entry.lineupOrder).toEqual(['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Lamar Jackson', 'Jalen Hurts', 'Patrick Mahomes', 'Jared Goff', 'Dak Prescott', 'Brock Purdy', 'Tua Tagovailoa']);
    expect(saved.entry.source).toBe('user_saved');
    expect(saved.entry.lastSavedAt).toBe('2026-06-19T10:05:00.000Z');
  });

  it('rejects a saved lineup unless it contains exactly 10 unique quarterbacks from the full slate', async () => {
    const dataFilePath = await createEntryStorePath();
    const contestDataFilePath = await createContestStorePath();
    await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      now: '2026-06-19T10:00:00.000Z',
      options: { dataFilePath, contestDataFilePath },
    });

    await expect(() =>
      savePersistedContestEntryLineup({
        contestId: 'week-1-qb-passing-yards',
        viewerId: demoViewerId,
        players: demoSelectablePlayers,
        defaultSelectedOrder: demoDefaultOrder,
        order: demoPlayers,
        now: '2026-06-19T10:05:00.000Z',
        options: { dataFilePath, contestDataFilePath },
      }),
    ).rejects.toThrow('Submitted lineup order is invalid.');
  });

  it('removes an entry from the file-backed store', async () => {
    const dataFilePath = await createEntryStorePath();
    const contestDataFilePath = await createContestStorePath();
    const beforeCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    await ensurePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      players: demoSelectablePlayers,
      defaultSelectedOrder: demoDefaultOrder,
      options: { dataFilePath, contestDataFilePath },
    });

    await removePersistedContestEntry({
      contestId: 'week-1-qb-passing-yards',
      viewerId: demoViewerId,
      options: { dataFilePath, contestDataFilePath },
    });

    await expect(
      getPersistedContestEntry('week-1-qb-passing-yards', demoViewerId, demoSelectablePlayers, demoDefaultOrder, {
        dataFilePath,
      }),
    ).resolves.toBeNull();

    const afterCounts = await readContestCounts(contestDataFilePath, 'week-1-qb-passing-yards');
    expect(afterCounts.entryCount).toBe(beforeCounts.entryCount);
    expect(afterCounts.paidEntryCount).toBe(beforeCounts.paidEntryCount);
  });
});
