import { describe, expect, it } from 'vitest';
import {
  buildContestTestEntryReadiness,
  type AdminTestEntrantIdentity,
  type AdminTestEntryRecord,
} from '../../lib/admin-test-entry-readiness';
import type { ContestSummary } from '../../lib/contest-data';

const baseContest = buildContest();
const baseEntry = buildEntry();

describe('admin test-entry readiness', () => {
  it('marks a zero-fee contest with a saved test lineup as ready', () => {
    const identityByUserId = new Map<string, AdminTestEntrantIdentity>([
      [
        baseEntry.userId,
        {
          userId: baseEntry.userId,
          email: 'tester@pickrank.test',
          displayName: 'Tester One',
          username: 'tester_one',
          eligibilityStatus: 'eligible_for_internal_testing',
        },
      ],
    ]);
    const readiness = buildContestTestEntryReadiness({
      contest: baseContest,
      entries: [baseEntry],
      identityByUserId,
    });

    expect(readiness.status).toBe('ready');
    expect(readiness.freeTestEntries).toBe(1);
    expect(readiness.paidEntries).toBe(0);
    expect(readiness.issues).toEqual([]);
    expect(readiness.entrants[0]).toMatchObject({
      email: 'tester@pickrank.test',
      lineupStatus: 'saved',
      lineupStatusLabel: 'Saved',
      savedPlayerCount: 10,
      issues: [],
    });
  });

  it('flags an assigned default lineup as not fully test-ready', () => {
    const readiness = buildContestTestEntryReadiness({
      contest: baseContest,
      entries: [
        buildEntry({
          source: 'default_assigned',
          lastSavedAt: null,
        }),
      ],
      identityByUserId: buildIdentityMap(),
    });

    expect(readiness.status).toBe('needs_attention');
    expect(readiness.entrants[0]?.lineupStatus).toBe('assigned_default');
    expect(readiness.entrants[0]?.issues).toContain('Default lineup is still assigned.');
  });

  it('falls back safely and flags missing entrant identity', () => {
    const readiness = buildContestTestEntryReadiness({
      contest: baseContest,
      entries: [baseEntry],
    });

    expect(readiness.status).toBe('needs_attention');
    expect(readiness.entrants[0]).toMatchObject({
      email: 'Email unavailable',
      displayName: 'Display name unavailable',
      username: 'Username unavailable',
    });
    expect(readiness.entrants[0]?.issues).toContain('Entrant identity is unavailable.');
  });

  it('flags contest count mismatches and nonzero free/test entry counts', () => {
    const readiness = buildContestTestEntryReadiness({
      contest: buildContest({
        entryFee: '$5.00',
        entryFeeCents: 500,
        entryCount: 3,
        entries: '3 entries',
        paidEntryCount: 1,
      }),
      entries: [baseEntry],
      identityByUserId: buildIdentityMap(),
    });

    expect(readiness.status).toBe('needs_attention');
    expect(readiness.freeTestEntries).toBe(2);
    expect(readiness.issues).toContain('Entry count 3 does not match 1 saved entry records.');
    expect(readiness.issues).toContain('Nonzero contest has free/test entry count.');
  });

  it('flags paid entries on a zero-fee contest', () => {
    const readiness = buildContestTestEntryReadiness({
      contest: buildContest({
        entryCount: 1,
        paidEntryCount: 1,
      }),
      entries: [baseEntry],
      identityByUserId: buildIdentityMap(),
    });

    expect(readiness.status).toBe('needs_attention');
    expect(readiness.issues).toContain('$0 contest has paid entries counted.');
  });

  it('flags incomplete lineups, including after contest lock', () => {
    const readiness = buildContestTestEntryReadiness({
      contest: buildContest({
        contestStatus: 'locked',
        status: 'Locked',
      }),
      entries: [
        buildEntry({
          lineupPlayerCount: 8,
        }),
      ],
      identityByUserId: buildIdentityMap(),
    });

    expect(readiness.status).toBe('needs_attention');
    expect(readiness.issues).toContain('Locked contest has at least one incomplete lineup.');
    expect(readiness.entrants[0]?.lineupStatus).toBe('missing_incomplete');
    expect(readiness.entrants[0]?.issues).toEqual(
      expect.arrayContaining([
        'Lineup is missing or incomplete.',
        'Locked contest has an incomplete lineup.',
      ]),
    );
  });
});

function buildContest(overrides: Partial<ContestSummary> = {}): ContestSummary {
  return {
    id: 'week-1-free-test',
    title: 'Week 1 Free Test',
    description: 'Pick and rank your top 10 quarterbacks by passing yards.',
    season: 2026,
    week: 1,
    contestStatus: 'open',
    status: 'Open',
    visibilityStatus: 'visible',
    isFeatured: false,
    displayOrder: 1,
    entryFee: '$0.00',
    entryFeeCents: 0,
    prizePool: '$0.00',
    prizePoolCents: 0,
    entries: '1 entry',
    entryCount: 1,
    paidEntryCount: 0,
    minimum: 'This contest needs at least 4 total entries to run',
    slate: '15-QB slate',
    slateSize: 15,
    task: 'Rank QBs by passing yards',
    statCategory: 'QB Passing Yards',
    lockTime: 'Locks Thu, Sep 3, 8:15 PM ET',
    lockTimeIso: '2026-09-04T00:15:00.000Z',
    entryOpenTimeIso: '2026-09-01T12:00:00.000Z',
    payoutRows: [],
    lineupPlayers: buildLineupPlayers(),
    slatePlayers: [],
    createdByAdminId: null,
    publishedByAdminId: null,
    publishedAt: null,
    validation: {
      status: 'passed',
      errors: [],
      warnings: [],
      validatedAt: '2026-08-01T00:00:00.000Z',
      validatedByAdminId: 'operator-1',
    },
    ...overrides,
  };
}

function buildEntry(overrides: Partial<AdminTestEntryRecord> = {}): AdminTestEntryRecord {
  return {
    entryId: 'entry-1',
    contestId: 'week-1-free-test',
    userId: '00000000-0000-4000-8000-000000000001',
    entryStatus: 'created',
    source: 'user_saved',
    lastSavedAt: '2026-08-01T12:05:00.000Z',
    createdAt: '2026-08-01T12:00:00.000Z',
    updatedAt: '2026-08-01T12:05:00.000Z',
    lineupPlayerCount: 10,
    ...overrides,
  };
}

function buildIdentityMap() {
  return new Map<string, AdminTestEntrantIdentity>([
    [
      baseEntry.userId,
      {
        userId: baseEntry.userId,
        email: 'tester@pickrank.test',
        displayName: 'Tester One',
        username: 'tester_one',
        eligibilityStatus: 'eligible_for_internal_testing',
      },
    ],
  ]);
}

function buildLineupPlayers() {
  return [
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
}
