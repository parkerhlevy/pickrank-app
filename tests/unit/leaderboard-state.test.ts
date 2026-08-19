import { describe, expect, it } from 'vitest';
import { getLeaderboardPlaceholderState, hasPublishedContestResults } from '@/lib/leaderboard-state';

describe('leaderboard state helpers', () => {
  it('treats only final and paid contests as published results', () => {
    expect(hasPublishedContestResults('final')).toBe(true);
    expect(hasPublishedContestResults('paid_out')).toBe(true);
    expect(hasPublishedContestResults('open')).toBe(false);
    expect(hasPublishedContestResults('live')).toBe(false);
    expect(hasPublishedContestResults('finalizing')).toBe(false);
  });

  it('returns open-contest placeholder copy', () => {
    expect(getLeaderboardPlaceholderState('open')).toEqual({
      title: 'Results open after final scoring',
      description:
        'This contest is not final yet. Final standings appear only after all games are complete and saved scoring is confirmed.',
    });
  });

  it('returns live and finalizing copy from the status contract', () => {
    expect(getLeaderboardPlaceholderState('live')).toEqual({
      title: 'Contest is underway',
      description: 'Final results will be available after all games are complete.',
    });

    expect(getLeaderboardPlaceholderState('finalizing')).toEqual({
      title: 'Final results are being calculated',
      description: 'Saved final standings will appear here once scoring is confirmed.',
    });
  });
});
