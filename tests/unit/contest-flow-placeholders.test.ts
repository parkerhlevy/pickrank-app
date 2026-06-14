import { describe, expect, it } from 'vitest';
import { demoLineupBuilderPlayers, getContestById, openContests } from '../../lib/phase-0-demo';

describe('contest flow placeholders', () => {
  it('exposes a 10-player lineup builder slate for the single-entry MVP flow', () => {
    expect(demoLineupBuilderPlayers).toHaveLength(10);
  });

  it('returns the requested contest when building post-entry routes', () => {
    expect(getContestById(openContests[1].id)).toEqual(openContests[1]);
  });

  it('falls back to the featured contest for unknown ids', () => {
    expect(getContestById('missing-contest')).toEqual(openContests[0]);
  });
});
