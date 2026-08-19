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
        title: 'Results open after final scoring',
        description:
          'This contest is not final yet. Final standings appear only after all games are complete and saved scoring is confirmed.',
      };
    case 'live':
      return {
        title: 'Contest is underway',
        description: 'Final results will be available after all games are complete.',
      };
    case 'finalizing':
      return {
        title: 'Final results are being calculated',
        description: 'Saved final standings will appear here once scoring is confirmed.',
      };
    case 'canceled':
      return {
        title: 'Contest canceled',
        description: 'This contest did not run, so results remain unavailable.',
      };
    case 'error_review':
      return {
        title: 'Results under review',
        description: 'Final results are under review while stats are confirmed.',
      };
    default:
      return {
        title: 'Results unavailable',
        description: 'This contest does not have public final results yet.',
      };
  }
}
