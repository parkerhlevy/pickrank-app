import { describe, expect, it } from 'vitest';
import {
  getContestById,
  getContestDefaultLineupOrder,
  getContestSelectablePlayers,
  listPublicContests,
} from '../../lib/contest-data';

describe('contest data backbone', () => {
  it('exposes the full 15-player slate plus a 10-player default ranking for the lineup flow', async () => {
    const contest = await getContestById('week-1-qb-passing-yards');

    expect(getContestSelectablePlayers(contest)).toHaveLength(15);
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

  it('falls back to the featured contest for unknown ids', async () => {
    const contests = await listPublicContests();
    const contest = await getContestById('missing-contest');

    expect(contest).toEqual(contests[0]);
  });
});
