export const openContests = [
  {
    id: 'week-1-qb-passing-yards',
    title: 'Week 1 QB Passing Yards',
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
    status: 'Open',
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

export const demoLeaderboardRows = [
  { rank: 1, username: 'RankBuilder', points: 67 },
  { rank: 2, username: 'SlateReader', points: 65 },
  { rank: 3, username: 'YardageScout', points: 64 },
  { rank: 4, username: 'PocketTimer', points: 61 },
];

export const demoLineup = [
  'QB Option A',
  'QB Option B',
  'QB Option C',
  'QB Option D',
  'QB Option E',
];
