export const openContests = [
  {
    id: 'week-1-qb-passing-yards',
    title: 'Week 1 QB Passing Yards',
    contestStatus: 'open',
    status: 'Open',
    lockTime: 'Locks Thu, Sep 5, 8:15 PM ET',
    entryFee: '$5',
    prizePool: '$2,100',
    entries: '600 entries',
    minimum: 'Minimum 4 entries to run',
    slate: '15-QB slate',
    task: 'Pick and rank your top 10 quarterbacks by passing yards.',
    statCategory: 'Passing yards',
    payoutRows: [
      { place: '1st', value: '$1,050' },
      { place: '2nd', value: '$630' },
      { place: '3rd', value: '$420' },
    ],
  },
  {
    id: 'week-1-sunday-qb-passing-yards',
    title: 'Week 1 Sunday QB Passing Yards',
    contestStatus: 'locked',
    status: 'Locked',
    lockTime: 'Locks Sun, Sep 8, 1:00 PM ET',
    entryFee: '$10',
    prizePool: '$3,500',
    entries: '500 entries',
    minimum: 'Minimum 4 entries to run',
    slate: '15-QB slate',
    task: 'Pick and rank your top 10 quarterbacks by passing yards.',
    statCategory: 'Passing yards',
    payoutRows: [
      { place: '1st', value: '$1,750' },
      { place: '2nd', value: '$1,050' },
      { place: '3rd', value: '$700' },
    ],
  },
];

export function getContestById(contestId: string) {
  return openContests.find((item) => item.id === contestId) ?? openContests[0];
}

export function isContestOpenForEntry(contest: (typeof openContests)[number]) {
  return contest.contestStatus === 'open';
}

export function isContestLineupEditable(contest: (typeof openContests)[number]) {
  return contest.contestStatus === 'open';
}

export const demoWalletBalances = {
  siteCreditCents: 200,
  cashBalanceCents: 100,
};

export function getPaymentReviewBreakdown(entryFee: string) {
  const entryFeeCents = parseDollarAmount(entryFee);
  const siteCreditAppliedCents = Math.min(demoWalletBalances.siteCreditCents, entryFeeCents);
  const remainingAfterSiteCredit = entryFeeCents - siteCreditAppliedCents;
  const cashBalanceAppliedCents = Math.min(demoWalletBalances.cashBalanceCents, remainingAfterSiteCredit);
  const amountDueTodayCents = entryFeeCents - siteCreditAppliedCents - cashBalanceAppliedCents;

  return {
    entryFeeCents,
    siteCreditAppliedCents,
    cashBalanceAppliedCents,
    amountDueTodayCents,
  };
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function parseDollarAmount(amount: string) {
  const dollars = Number(amount.replace(/[^0-9.]/g, ''));

  if (!Number.isFinite(dollars)) {
    return 0;
  }

  return Math.round(dollars * 100);
}

export const demoLeaderboardRows = [
  { rank: 1, username: 'RankBuilder', points: 67 },
  { rank: 2, username: 'SlateReader', points: 65 },
  { rank: 3, username: 'YardageScout', points: 64 },
  { rank: 4, username: 'PocketTimer', points: 61 },
];

export const demoLineupBuilderPlayers = [
  'Josh Allen',
  'Joe Burrow',
  'Derek Carr',
  'Kirk Cousins',
  'Justin Herbert',
  'Jalen Hurts',
  'Lamar Jackson',
  'Jordan Love',
  'Dak Prescott',
  'Brock Purdy',
];
