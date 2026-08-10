import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  createDraftContest,
  lockFreeTestContestForProof,
  publishContest,
  retireFakePublicContestForBetaCleanup,
  runContestLifecycleTransitions,
  saveContestSlate,
  validateDraftContest,
  type ContestSlatePlayer,
} from '../../lib/contest-data';

describe('admin contest draft creation', () => {
  it('creates a hidden draft contest in the persisted store', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 2 QB Passing Yards',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 2,
        entryFeeCents: 500,
        entryOpenTimeIso: '2026-09-10T12:00:00.000Z',
        lockTimeIso: '2026-09-11T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    expect(createdContest.id).toBe('week-2-qb-passing-yards');
    expect(createdContest.status).toBe('Draft');
    expect(createdContest.visibilityStatus).toBe('hidden');
    expect(createdContest.createdByAdminId).toBe('operator-1');

    const savedStore = JSON.parse(await readFile(dataFilePath, 'utf8')) as {
      contests: Array<{ id: string; status: string; visibilityStatus: string; createdByAdminId: string | null }>;
    };

    expect(savedStore.contests).toEqual([
      expect.objectContaining({
        id: 'week-2-qb-passing-yards',
        status: 'draft',
        visibilityStatus: 'hidden',
        createdByAdminId: 'operator-1',
      }),
    ]);
  });

  it('saves real draft slate rows and resets validation state', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 2 QB Passing Yards',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 2,
        entryFeeCents: 500,
        entryOpenTimeIso: '2026-09-10T12:00:00.000Z',
        lockTimeIso: '2026-09-11T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    const savedContest = await saveContestSlate(createdContest.id, buildValidSlatePlayers('2026-09-11T00:20:00.000Z'), {
      dataFilePath,
    });

    expect(savedContest.slatePlayers).toHaveLength(20);
    expect(savedContest.lineupPlayers).toHaveLength(10);
    expect(savedContest.validation.status).toBe('not_run');
  });

  it('blocks publish when the required 20-player pool has not been saved', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 3 QB Passing Yards',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 3,
        entryFeeCents: 500,
        entryOpenTimeIso: '2026-09-17T12:00:00.000Z',
        lockTimeIso: '2026-09-18T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    await expect(
      publishContest(createdContest.id, 'operator-3', {
        dataFilePath,
        now: '2026-09-10T00:00:00.000Z',
      }),
    ).rejects.toThrow('Add exactly 20 quarterbacks before publish.');
  });

  it('validates and publishes a draft contest with operator audit fields', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 3 QB Passing Yards',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 3,
        entryFeeCents: 500,
        entryOpenTimeIso: '2026-09-17T12:00:00.000Z',
        lockTimeIso: '2026-09-18T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    await saveContestSlate(createdContest.id, buildValidSlatePlayers('2026-09-18T00:20:00.000Z'), {
      dataFilePath,
    });

    const validationResult = await validateDraftContest(createdContest.id, 'operator-2', {
      dataFilePath,
      now: '2026-09-10T00:00:00.000Z',
    });

    expect(validationResult.validation.status).toBe('passed');
    expect(validationResult.validation.validatedByAdminId).toBe('operator-2');

    const publishResult = await publishContest(createdContest.id, 'operator-3', {
      dataFilePath,
      now: '2026-09-10T00:00:00.000Z',
    });

    expect(publishResult.contest.contestStatus).toBe('scheduled');
    expect(publishResult.contest.visibilityStatus).toBe('visible');
    expect(publishResult.contest.publishedByAdminId).toBe('operator-3');
    expect(publishResult.contest.publishedAt).toBe('2026-09-10T00:00:00.000Z');
  });

  it('validates and publishes a zero-fee contest for controlled free testing', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 4 QB Passing Yards Free Test',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 4,
        entryFeeCents: 0,
        entryOpenTimeIso: '2026-09-24T12:00:00.000Z',
        lockTimeIso: '2026-09-25T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    await saveContestSlate(createdContest.id, buildValidSlatePlayers('2026-09-25T00:20:00.000Z'), {
      dataFilePath,
    });

    const validationResult = await validateDraftContest(createdContest.id, 'operator-2', {
      dataFilePath,
      now: '2026-09-20T00:00:00.000Z',
    });

    expect(validationResult.validation.status).toBe('passed');
    expect(validationResult.contest.entryFee).toBe('$0.00');

    const publishResult = await publishContest(createdContest.id, 'operator-3', {
      dataFilePath,
      now: '2026-09-20T00:00:00.000Z',
    });

    expect(publishResult.contest.entryFeeCents).toBe(0);
    expect(publishResult.contest.visibilityStatus).toBe('visible');
    expect(publishResult.contest.publishedByAdminId).toBe('operator-3');
  });

  it('locks an open visible zero-fee proof contest and records no-money event metadata', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const createdContest = await createDraftContest(
      {
        title: 'Week 4 QB Passing Yards Free Test',
        description: 'Pick and rank your top 10 quarterbacks by passing yards.',
        season: 2026,
        week: 4,
        entryFeeCents: 0,
        entryOpenTimeIso: '2026-09-24T12:00:00.000Z',
        lockTimeIso: '2026-09-25T00:15:00.000Z',
        createdByAdminId: 'operator-1',
      },
      { dataFilePath },
    );

    await saveContestSlate(createdContest.id, buildValidSlatePlayers('2026-09-25T00:20:00.000Z'), {
      dataFilePath,
    });
    await publishContest(createdContest.id, 'operator-3', {
      dataFilePath,
      now: '2026-09-24T13:00:00.000Z',
    });

    await updateStoredContest(dataFilePath, createdContest.id, {
      entryCount: 1,
      paidEntryCount: 0,
    });

    const lockedResult = await lockFreeTestContestForProof(createdContest.id, {
      dataFilePath,
      lockedByAdminId: 'operator-4',
      now: '2026-09-24T14:00:00.000Z',
    });

    expect(lockedResult.contest.contestStatus).toBe('locked');
    expect(lockedResult.contest.entryFeeCents).toBe(0);
    expect(lockedResult.contest.paidEntryCount).toBe(0);
    expect(lockedResult.event).toEqual(
      expect.objectContaining({
        contestId: createdContest.id,
        fromStatus: 'open',
        toStatus: 'locked',
        trigger: 'admin',
        metadata: expect.objectContaining({
          proof_type: 'free_test_lock',
          no_money: 'true',
          paid_entries_at_lock: '0',
          total_entries_at_lock: '1',
          locked_by_admin_id: 'operator-4',
        }),
      }),
    );

    const savedStore = JSON.parse(await readFile(dataFilePath, 'utf8')) as {
      contests: Array<{ id: string; status: string; paidEntryCount: number }>;
      contestStateEvents: Array<{ toStatus: string; metadata: Record<string, string> }>;
    };

    expect(savedStore.contests.find((contest) => contest.id === createdContest.id)).toMatchObject({
      status: 'locked',
      paidEntryCount: 0,
    });
    expect(savedStore.contestStateEvents.at(-1)).toMatchObject({
      toStatus: 'locked',
      metadata: expect.objectContaining({ proof_type: 'free_test_lock' }),
    });
  });

  it('rejects free/test proof lock for paid, non-open, or no-entry contests', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const paidContest = await createAndPublishContest({
      dataFilePath,
      title: 'Week 5 QB Passing Yards Paid',
      entryFeeCents: 500,
      entryCount: 1,
      now: '2026-10-01T13:00:00.000Z',
    });
    const scheduledContest = await createAndPublishContest({
      dataFilePath,
      title: 'Week 6 QB Passing Yards Free Test',
      entryFeeCents: 0,
      entryCount: 1,
      now: '2026-10-01T00:00:00.000Z',
    });
    const noEntryContest = await createAndPublishContest({
      dataFilePath,
      title: 'Week 7 QB Passing Yards Free Test',
      entryFeeCents: 0,
      entryCount: 0,
      now: '2026-10-15T13:00:00.000Z',
    });

    await expect(lockFreeTestContestForProof(paidContest.id, { dataFilePath })).rejects.toThrow(
      'Only $0 free/test contests can use the free/test proof lock.',
    );
    await expect(lockFreeTestContestForProof(scheduledContest.id, { dataFilePath })).rejects.toThrow(
      'Only open contests can be locked through the free/test proof control.',
    );
    await expect(lockFreeTestContestForProof(noEntryContest.id, { dataFilePath })).rejects.toThrow(
      'Add at least one free/test entry before locking this proof contest.',
    );
  });

  it('retires a fake active public contest without deleting the contest record', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const contest = await createAndPublishContest({
      dataFilePath,
      title: 'Week 8 QB Passing Yards Paid Seed',
      entryFeeCents: 500,
      entryCount: 600,
      now: '2026-10-22T13:00:00.000Z',
    });

    const result = await retireFakePublicContestForBetaCleanup(contest.id, 'operator-5', {
      dataFilePath,
      persistedEntryCount: 0,
      now: '2026-10-22T14:00:00.000Z',
    });

    expect(result.contest.contestStatus).toBe('canceled');
    expect(result.contest.visibilityStatus).toBe('hidden');
    expect(result.contest.entryCount).toBe(0);
    expect(result.contest.paidEntryCount).toBe(0);
    expect(result.event.metadata).toMatchObject({
      cleanup_type: 'free_beta_public_contest_retirement',
      previous_entry_fee_cents: '500',
      previous_entry_count: '600',
      previous_paid_entry_count: '600',
      persisted_entry_count: '0',
      retired_by_admin_id: 'operator-5',
    });

    const savedStore = JSON.parse(await readFile(dataFilePath, 'utf8')) as {
      contests: Array<{ id: string; status: string; visibilityStatus: string; entryCount: number; paidEntryCount: number }>;
      contestStateEvents: Array<{ toStatus: string; metadata: Record<string, string> }>;
    };

    expect(savedStore.contests.find((savedContest) => savedContest.id === contest.id)).toMatchObject({
      status: 'canceled',
      visibilityStatus: 'hidden',
      entryCount: 0,
      paidEntryCount: 0,
    });
    expect(savedStore.contestStateEvents.at(-1)).toMatchObject({
      toStatus: 'canceled',
      metadata: expect.objectContaining({ cleanup_type: 'free_beta_public_contest_retirement' }),
    });
  });

  it('rejects public beta cleanup when saved entries or hidden validation contests are present', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(dataFilePath, JSON.stringify({ version: 1, contests: [], contestStateEvents: [] }, null, 2));

    const publicContest = await createAndPublishContest({
      dataFilePath,
      title: 'Week 9 QB Passing Yards Paid Seed',
      entryFeeCents: 500,
      entryCount: 0,
      now: '2026-10-29T13:00:00.000Z',
    });

    await expect(
      retireFakePublicContestForBetaCleanup(publicContest.id, 'operator-5', {
        dataFilePath,
        persistedEntryCount: 1,
      }),
    ).rejects.toThrow('This contest has saved entries. Review entries before retiring it.');

    await updateStoredContest(dataFilePath, publicContest.id, {
      id: 'week-9-qb-passing-yards-live-validation-2026',
      visibilityStatus: 'hidden',
    });

    await expect(
      retireFakePublicContestForBetaCleanup('week-9-qb-passing-yards-live-validation-2026', 'operator-5', {
        dataFilePath,
        persistedEntryCount: 0,
      }),
    ).rejects.toThrow('Hidden contests cannot use the public contest beta cleanup control.');
  });

  it('moves contests through scheduled to open and open to locked without double transitions', async () => {
    const tempDirectory = await mkdtemp(path.join(os.tmpdir(), 'pickrank-contests-'));
    const dataFilePath = path.join(tempDirectory, 'contests.json');

    await writeFile(
      dataFilePath,
      JSON.stringify(
        {
          version: 1,
          contests: [
            {
              id: 'scheduled-contest',
              title: 'Scheduled Contest',
              description: 'Pick and rank your top 10 quarterbacks by passing yards.',
              season: 2026,
              week: 4,
              contestType: 'public_paid',
              statType: 'qb_passing_yards',
              slateSize: 20,
              entryFeeCents: 500,
              entryCount: 0,
              paidEntryCount: 0,
              minEntriesToRun: 4,
              status: 'scheduled',
              visibilityStatus: 'visible',
              isFeatured: false,
              displayOrder: 0,
              entryOpenTime: '2026-09-20T12:00:00.000Z',
              lockTime: '2026-09-21T00:15:00.000Z',
              createdByAdminId: 'operator-1',
              publishedByAdminId: 'operator-1',
              publishedAt: '2026-09-19T00:00:00.000Z',
              createdAt: '2026-09-19T00:00:00.000Z',
              updatedAt: '2026-09-19T00:00:00.000Z',
              lineupPlayers: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Kirk Cousins', 'Justin Herbert', 'Jalen Hurts', 'Lamar Jackson', 'Jordan Love', 'Dak Prescott', 'Brock Purdy'],
              slatePlayers: buildValidSlatePlayers('2026-09-21T00:20:00.000Z'),
              validation: {
                status: 'passed',
                errors: [],
                warnings: [],
                validatedAt: '2026-09-19T00:00:00.000Z',
                validatedByAdminId: 'operator-1',
              },
            },
          ],
          contestStateEvents: [],
        },
        null,
        2,
      ),
    );

    const openedResult = await runContestLifecycleTransitions({
      dataFilePath,
      now: '2026-09-20T12:00:00.000Z',
    });

    expect(openedResult.contests[0]?.contestStatus).toBe('open');
    expect(openedResult.events).toHaveLength(1);

    const lockedResult = await runContestLifecycleTransitions({
      dataFilePath,
      now: '2026-09-21T00:15:00.000Z',
    });

    expect(lockedResult.contests[0]?.contestStatus).toBe('locked');
    expect(lockedResult.events).toHaveLength(2);

    const repeatedResult = await runContestLifecycleTransitions({
      dataFilePath,
      now: '2026-09-21T00:16:00.000Z',
    });

    expect(repeatedResult.events).toHaveLength(2);
  });
});

async function createAndPublishContest({
  dataFilePath,
  title,
  entryFeeCents,
  entryCount,
  now,
}: {
  dataFilePath: string;
  title: string;
  entryFeeCents: number;
  entryCount: number;
  now: string;
}) {
  const createdContest = await createDraftContest(
    {
      title,
      description: 'Pick and rank your top 10 quarterbacks by passing yards.',
      season: 2026,
      week: 5,
      entryFeeCents,
      entryOpenTimeIso: '2026-10-01T12:00:00.000Z',
      lockTimeIso: '2026-10-02T00:15:00.000Z',
      createdByAdminId: 'operator-1',
    },
    { dataFilePath },
  );

  await saveContestSlate(createdContest.id, buildValidSlatePlayers('2026-10-02T00:20:00.000Z'), {
    dataFilePath,
  });
  const publishResult = await publishContest(createdContest.id, 'operator-2', {
    dataFilePath,
    now,
  });

  await updateStoredContest(dataFilePath, createdContest.id, {
    entryCount,
    paidEntryCount: entryFeeCents > 0 ? entryCount : 0,
  });

  return publishResult.contest;
}

async function updateStoredContest(dataFilePath: string, contestId: string, updates: Record<string, unknown>) {
  const store = JSON.parse(await readFile(dataFilePath, 'utf8')) as {
    contests: Array<Record<string, unknown>>;
  };

  store.contests = store.contests.map((contest) =>
    contest.id === contestId
      ? {
          ...contest,
          ...updates,
        }
      : contest,
  );

  await writeFile(dataFilePath, JSON.stringify(store, null, 2), 'utf8');
}

function buildValidSlatePlayers(gameStartTime: string): ContestSlatePlayer[] {
  const rows = [
    ['qb-josh-allen', 'provider-qb-josh-allen', 'buf-bal-2026', 'Josh Allen', 'BUF', 'BAL', 'home'],
    ['qb-joe-burrow', 'provider-qb-joe-burrow', 'cin-cle-2026', 'Joe Burrow', 'CIN', 'CLE', 'away'],
    ['qb-derek-carr', 'provider-qb-derek-carr', 'no-atl-2026', 'Derek Carr', 'NO', 'ATL', 'home'],
    ['qb-kirk-cousins', 'provider-qb-kirk-cousins', 'atl-no-2026', 'Kirk Cousins', 'ATL', 'NO', 'away'],
    ['qb-justin-herbert', 'provider-qb-justin-herbert', 'lac-lv-2026', 'Justin Herbert', 'LAC', 'LV', 'home'],
    ['qb-jalen-hurts', 'provider-qb-jalen-hurts', 'phi-dal-2026', 'Jalen Hurts', 'PHI', 'DAL', 'home'],
    ['qb-lamar-jackson', 'provider-qb-lamar-jackson', 'bal-buf-2026', 'Lamar Jackson', 'BAL', 'BUF', 'away'],
    ['qb-jordan-love', 'provider-qb-jordan-love', 'gb-min-2026', 'Jordan Love', 'GB', 'MIN', 'home'],
    ['qb-dak-prescott', 'provider-qb-dak-prescott', 'dal-phi-2026', 'Dak Prescott', 'DAL', 'PHI', 'away'],
    ['qb-brock-purdy', 'provider-qb-brock-purdy', 'sf-sea-2026', 'Brock Purdy', 'SF', 'SEA', 'home'],
    ['qb-cj-stroud', 'provider-qb-cj-stroud', 'hou-ind-2026', 'C.J. Stroud', 'HOU', 'IND', 'home'],
    ['qb-patrick-mahomes', 'provider-qb-patrick-mahomes', 'kc-den-2026', 'Patrick Mahomes', 'KC', 'DEN', 'home'],
    ['qb-jared-goff', 'provider-qb-jared-goff', 'det-chi-2026', 'Jared Goff', 'DET', 'CHI', 'home'],
    ['qb-tua-tagovailoa', 'provider-qb-tua-tagovailoa', 'mia-nyj-2026', 'Tua Tagovailoa', 'MIA', 'NYJ', 'away'],
    ['qb-matthew-stafford', 'provider-qb-matthew-stafford', 'lar-ari-2026', 'Matthew Stafford', 'LAR', 'ARI', 'home'],
    ['qb-baker-mayfield', 'provider-qb-baker-mayfield', 'tb-atl-2026', 'Baker Mayfield', 'TB', 'ATL', 'away'],
    ['qb-trevor-lawrence', 'provider-qb-trevor-lawrence', 'jax-car-2026', 'Trevor Lawrence', 'JAX', 'CAR', 'home'],
    ['qb-kyler-murray', 'provider-qb-kyler-murray', 'ari-lar-2026', 'Kyler Murray', 'ARI', 'LAR', 'away'],
    ['qb-sam-darnold', 'provider-qb-sam-darnold', 'sea-sf-2026', 'Sam Darnold', 'SEA', 'SF', 'away'],
    ['qb-russell-wilson', 'provider-qb-russell-wilson', 'nyg-was-2026', 'Russell Wilson', 'NYG', 'WAS', 'away'],
  ] as const;

  return rows.map((row, index) => ({
    playerId: row[0],
    providerPlayerId: row[1],
    providerGameId: row[2],
    displayName: row[3],
    teamAbbreviation: row[4],
    opponentAbbreviation: row[5],
    homeAway: row[6],
    gameStartTime,
    position: 'QB',
    activeStatus: 'active',
    sortOrderInternal: index + 1,
  }));
}
