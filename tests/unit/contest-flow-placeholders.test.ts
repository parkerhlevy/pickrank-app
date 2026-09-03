import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findContestById,
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
} from '../../lib/contest-data';

describe('contest data backbone', () => {
  it('exposes the full 20-player pool plus a 10-player default ranking for the board flow', async () => {
    const contest = await getContestById('week-1-qb-passing-yards');

    expect(getContestSelectablePlayers(contest)).toHaveLength(20);
    expect(getContestDefaultLineupOrder(contest)).toHaveLength(10);
  });

  it('keeps the public launch contest free to enter with no paid prize pool', async () => {
    const contest = await getContestById('week-1-qb-passing-yards');

    expect(contest.entryFeeCents).toBe(0);
    expect(contest.paidEntryCount).toBe(0);
    expect(contest.prizePoolCents).toBe(0);
    expect(contest.payoutRows.every((row) => row.value === '$0.00')).toBe(true);
  });

  it('returns the requested contest when building post-entry routes', async () => {
    const contest = await getContestById('week-1-sunday-qb-passing-yards');

    expect(contest.id).toBe('week-1-sunday-qb-passing-yards');
  });

  it('does not substitute another contest for a deleted or unknown id', async () => {
    await expect(findContestById('missing-contest')).resolves.toBeNull();
    await expect(getContestById('missing-contest')).rejects.toThrow('Contest not found.');
  });

  it('keeps hidden contests unavailable to public lookup while allowing explicit admin lookup', async () => {
    const sourcePath = path.join(process.cwd(), 'data', 'contests.json');
    const store = JSON.parse(await readFile(sourcePath, 'utf8')) as {
      contests: Array<{ id: string; visibilityStatus: string }>;
    };
    const hiddenContest = store.contests[0];

    hiddenContest.visibilityStatus = 'hidden';

    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contest-lookup-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');
    await writeFile(dataFilePath, JSON.stringify(store), 'utf8');

    await expect(findContestById(hiddenContest.id, { dataFilePath })).resolves.toBeNull();
    await expect(findContestById(hiddenContest.id, { dataFilePath, includeHidden: true })).resolves.toEqual(
      expect.objectContaining({ id: hiddenContest.id, visibilityStatus: 'hidden' }),
    );
  });
});
