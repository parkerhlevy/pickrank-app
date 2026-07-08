import type { ContestStatus } from '@/lib/contest-data';

export function hasPublishedContestResults(status: ContestStatus) {
  return status === 'final' || status === 'paid_out';
}

export function getLeaderboardPlaceholderState(status: ContestStatus) {
  switch (status) {
    case 'scheduled':
    case 'open':
    case 'locked':
      return {
        title: 'Leaderboard Opens After Final Scoring',
        description:
          'This contest is not final yet. Final standings appear only after all games are complete and saved scoring is confirmed.',
      };
    case 'live':
      return {
        title: 'Contest Is Underway',
        description: 'Final results will be available after all games are complete.',
      };
    case 'finalizing':
      return {
        title: 'Final Results Are Being Calculated',
        description: 'Saved final standings will appear here once scoring is confirmed.',
      };
    case 'canceled':
      return {
        title: 'Contest Canceled',
        description: 'This contest did not run, so leaderboard and results remain unavailable.',
      };
    case 'error_review':
      return {
        title: 'Results Under Review',
        description: 'Final results are under review while stats are confirmed.',
      };
    default:
      return {
        title: 'Leaderboard Unavailable',
        description: 'This contest does not have a public final leaderboard yet.',
      };
  }
}
