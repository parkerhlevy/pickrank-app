import { describe, expect, it } from 'vitest';
import { getContestById, getContestLineupPlayers, listPublicContests } from '../../lib/contest-data';

describe('contest data backbone', () => {
  it('exposes a 10-player lineup builder shell for the current single-entry flow', async () => {
    const contest = await getContestById('week-1-qb-passing-yards');

    expect(getContestLineupPlayers(contest)).toHaveLength(10);
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
