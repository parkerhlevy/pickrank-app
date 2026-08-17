import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Browser } from '@playwright/test';
import {
  defaultE2eViewerUserId,
  e2eAuthCookieName,
  encodeE2eAuthCookie,
} from '@/lib/viewer-identity';

const appUrl = 'http://127.0.0.1:3000';
const contestStorePath = path.join(process.cwd(), 'data', 'contests.json');
const entryStorePath = path.join(process.cwd(), 'data', 'contest-entries.json');
const resultsStorePath = path.join(process.cwd(), 'data', 'contest-results.json');
const providerStorePath = path.join(process.cwd(), 'data', 'provider-stats.json');
const serverActionTimeout = 20_000;
const targetContestId = 'week-1-sunday-qb-passing-yards';
const freeProofContestId = 'week-1-qb-passing-yards';
type SeedEntry = {
  entryId: string;
  contestId: string;
  userId: string;
  lineupOrder: string[];
};

const entrantUserId = defaultE2eViewerUserId;
const tiebreakRunnerUpUserId = '11111111-1111-4111-8111-111111111111';
const thirdPlaceUserId = '22222222-2222-4222-8222-222222222222';
const fourthPlaceUserId = '33333333-3333-4333-8333-333333333333';
const nonEntrantUserId = '44444444-4444-4444-8444-444444444444';

const operatorCookieValue = buildAuthCookieValue({
  email: 'operator@pickrank.test',
  username: 'operator_user',
  displayName: 'Operator User',
  userId: '99999999-9999-4999-8999-999999999999',
  roleSlugs: ['contest_operator'],
});

const entrantCookieValue = buildAuthCookieValue({
  email: 'entrant@pickrank.test',
  username: 'entrant_user',
  displayName: 'Entrant User',
  userId: entrantUserId,
});

const nonEntrantCookieValue = buildAuthCookieValue({
  email: 'spectator@pickrank.test',
  username: 'spectator_user',
  displayName: 'Spectator User',
  userId: nonEntrantUserId,
});

const finalStatRows = [
  'qb-josh-allen|Josh Allen|325|3',
  'qb-joe-burrow|Joe Burrow|300|2',
  'qb-derek-carr|Derek Carr|250|1',
  'qb-kirk-cousins|Kirk Cousins|220|1',
  'qb-justin-herbert|Justin Herbert|295|2',
  'qb-jalen-hurts|Jalen Hurts|280|2',
  'qb-lamar-jackson|Lamar Jackson|330|4',
  'qb-jordan-love|Jordan Love|270|2',
  'qb-dak-prescott|Dak Prescott|260|1',
  'qb-brock-purdy|Brock Purdy|240|1',
  'qb-cj-stroud|C.J. Stroud|230|1',
  'qb-patrick-mahomes|Patrick Mahomes|305|3',
  'qb-jared-goff|Jared Goff|290|2',
  'qb-tua-tagovailoa|Tua Tagovailoa|210|1',
  'qb-matthew-stafford|Matthew Stafford|205|1',
  'qb-baker-mayfield|Baker Mayfield|190|1',
  'qb-trevor-lawrence|Trevor Lawrence|185|1',
  'qb-kyler-murray|Kyler Murray|180|1',
  'qb-sam-darnold|Sam Darnold|175|1',
  'qb-russell-wilson|Russell Wilson|170|1',
].join('\n');

const correctedFinalStatRows = [
  'qb-josh-allen|Josh Allen|325|3',
  'qb-joe-burrow|Joe Burrow|300|2',
  'qb-derek-carr|Derek Carr|250|1',
  'qb-kirk-cousins|Kirk Cousins|220|1',
  'qb-justin-herbert|Justin Herbert|295|2',
  'qb-jalen-hurts|Jalen Hurts|318|4',
  'qb-lamar-jackson|Lamar Jackson|330|4',
  'qb-jordan-love|Jordan Love|270|2',
  'qb-dak-prescott|Dak Prescott|260|1',
  'qb-brock-purdy|Brock Purdy|240|1',
  'qb-cj-stroud|C.J. Stroud|230|1',
  'qb-patrick-mahomes|Patrick Mahomes|268|1',
  'qb-jared-goff|Jared Goff|290|2',
  'qb-tua-tagovailoa|Tua Tagovailoa|210|1',
  'qb-matthew-stafford|Matthew Stafford|205|1',
  'qb-baker-mayfield|Baker Mayfield|190|1',
  'qb-trevor-lawrence|Trevor Lawrence|185|1',
  'qb-kyler-murray|Kyler Murray|180|1',
  'qb-sam-darnold|Sam Darnold|175|1',
  'qb-russell-wilson|Russell Wilson|170|1',
].join('\n');

const seededEntries = withSavedEntryMetadata([
  {
    entryId: 'entry-tiebreak-winner',
    contestId: targetContestId,
    userId: entrantUserId,
    lineupOrder: [
      'Lamar Jackson',
      'Josh Allen',
      'Joe Burrow',
      'Justin Herbert',
      'Patrick Mahomes',
      'Jared Goff',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
      'Brock Purdy',
    ],
  },
  {
    entryId: 'entry-tiebreak-runner-up',
    contestId: targetContestId,
    userId: tiebreakRunnerUpUserId,
    lineupOrder: [
      'Lamar Jackson',
      'Josh Allen',
      'Joe Burrow',
      'Justin Herbert',
      'Jalen Hurts',
      'Jared Goff',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
      'Brock Purdy',
    ],
  },
  {
    entryId: 'entry-third-place',
    contestId: targetContestId,
    userId: thirdPlaceUserId,
    lineupOrder: [
      'Josh Allen',
      'Lamar Jackson',
      'Patrick Mahomes',
      'Joe Burrow',
      'Justin Herbert',
      'Jared Goff',
      'Jalen Hurts',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
    ],
  },
  {
    entryId: 'entry-fourth-place',
    contestId: targetContestId,
    userId: fourthPlaceUserId,
    lineupOrder: [
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
    ],
  },
]);

const sharedTieEntries = withSavedEntryMetadata([
  {
    entryId: 'entry-first-place',
    contestId: targetContestId,
    userId: thirdPlaceUserId,
    lineupOrder: [
      'Lamar Jackson',
      'Josh Allen',
      'Patrick Mahomes',
      'Joe Burrow',
      'Justin Herbert',
      'Jared Goff',
      'Jalen Hurts',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
    ],
  },
  {
    entryId: 'entry-second-place',
    contestId: targetContestId,
    userId: fourthPlaceUserId,
    lineupOrder: [
      'Josh Allen',
      'Lamar Jackson',
      'Patrick Mahomes',
      'Joe Burrow',
      'Justin Herbert',
      'Jared Goff',
      'Jalen Hurts',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
    ],
  },
  {
    entryId: 'entry-shared-third-a',
    contestId: targetContestId,
    userId: entrantUserId,
    lineupOrder: [
      'Lamar Jackson',
      'Josh Allen',
      'Joe Burrow',
      'Justin Herbert',
      'Patrick Mahomes',
      'Jared Goff',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
      'Brock Purdy',
    ],
  },
  {
    entryId: 'entry-shared-third-b',
    contestId: targetContestId,
    userId: tiebreakRunnerUpUserId,
    lineupOrder: [
      'Lamar Jackson',
      'Josh Allen',
      'Joe Burrow',
      'Justin Herbert',
      'Patrick Mahomes',
      'Jared Goff',
      'Jordan Love',
      'Dak Prescott',
      'Derek Carr',
      'Brock Purdy',
    ],
  },
]);

const freeProofEntries = withSavedEntryMetadata(
  seededEntries.map((entry) => ({
    ...entry,
    contestId: freeProofContestId,
  })),
);

let originalContestStore = '';
let originalEntryStore = '';
let originalResultsStore: string | null = null;
let originalProviderStore: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  originalContestStore = await readFile(contestStorePath, 'utf8');
  originalEntryStore = await readFile(entryStorePath, 'utf8');

  try {
    originalResultsStore = await readFile(resultsStorePath, 'utf8');
  } catch {
    originalResultsStore = null;
  }

  try {
    originalProviderStore = await readFile(providerStorePath, 'utf8');
  } catch {
    originalProviderStore = null;
  }
});

test.beforeEach(async () => {
  const contestStore = JSON.parse(originalContestStore) as {
    version: number;
    contests: Array<Record<string, unknown>>;
  };

  contestStore.contests = contestStore.contests.map((contest) => {
    if (contest.id === targetContestId) {
      return {
        ...contest,
        entryFeeCents: 1000,
        entryCount: 500,
        paidEntryCount: 500,
        status: 'locked',
        visibilityStatus: 'visible',
      };
    }

    return contest;
  });

  await writeFile(contestStorePath, `${JSON.stringify(contestStore, null, 2)}\n`, 'utf8');
  await writeFile(
    entryStorePath,
    `${JSON.stringify({ version: 1, entries: seededEntries }, null, 2)}\n`,
    'utf8',
  );
  await writeFile(providerStorePath, `${JSON.stringify(buildProviderStore(finalStatRows), null, 2)}\n`, 'utf8');
  await rm(resultsStorePath, { force: true });
});

test.afterAll(async () => {
  await writeFile(contestStorePath, originalContestStore, 'utf8');
  await writeFile(entryStorePath, originalEntryStore, 'utf8');

  if (originalResultsStore === null) {
    await rm(resultsStorePath, { force: true });
  } else {
    await writeFile(resultsStorePath, originalResultsStore, 'utf8');
  }

  if (originalProviderStore === null) {
    await rm(providerStorePath, { force: true });
    return;
  }

  await writeFile(providerStorePath, originalProviderStore, 'utf8');
});

test('finalizes the locked contest from admin and keeps leaderboard/results surfaces aligned with saved rows', async ({
  browser,
}) => {
  const operatorContext = await createSignedInContext(browser, operatorCookieValue);
  const operatorPage = await operatorContext.newPage();

  await operatorPage.goto('/admin/contests');
  await expect(operatorPage.getByRole('heading', { name: 'Contest Setup' })).toBeVisible();
  await expect(operatorPage.getByText('Week 1 QB Passing Yards').first()).toBeVisible();
  await expect(operatorPage.getByText('Mock Stats Feed snapshot.')).toBeVisible();
  await expect(operatorPage.locator(`#finalStatRows-${targetContestId}`)).toHaveValue(finalStatRows);
  await operatorPage.locator(`#finalStatRows-${targetContestId}`).fill(finalStatRows);
  await operatorPage.locator(`#confirmationText-${targetContestId}`).fill('FINAL');
  await operatorPage.getByRole('button', { name: 'Run Final Scoring' }).click();

  await expect(operatorPage).toHaveURL(/status=finalized/, { timeout: serverActionTimeout });
  await expect(
    operatorPage.getByText('Week 1 QB Passing Yards final results are now published from the confirmed QB stats.'),
  ).toBeVisible();

  const contestStore = JSON.parse(await readFile(contestStorePath, 'utf8')) as {
    contests: Array<{ id: string; status: string }>;
  };
  expect(contestStore.contests.find((contest) => contest.id === targetContestId)?.status).toBe('final');

  const persistedResultsStore = JSON.parse(await readFile(resultsStorePath, 'utf8')) as {
    contests: Array<{
      contestId: string;
      entryResults: Array<{
        entryId: string;
        userId: string;
        displayName: string;
        totalScore: number;
        finalRankDisplay: string;
        payoutAmountCents: number;
        exactPicks: number;
        oneOffOrBetterPicks: number;
        selectedQb1PassingTouchdowns: number | null;
        selectedQb2PassingTouchdowns: number | null;
        selectedQb3PassingTouchdowns: number | null;
        selectedQb4PassingTouchdowns: number | null;
        selectedQb5PassingTouchdowns: number | null;
      }>;
    }>;
  };
  const persistedContestResults = persistedResultsStore.contests.find(
    (contest) => contest.contestId === targetContestId,
  );

  expect(persistedContestResults).toBeTruthy();
  expect(
    persistedContestResults?.entryResults.map((entry) => ({
      userId: entry.userId,
      finalRankDisplay: entry.finalRankDisplay,
      totalScore: entry.totalScore,
      payoutAmountCents: entry.payoutAmountCents,
    })),
  ).toEqual([
    {
      userId: thirdPlaceUserId,
      finalRankDisplay: '1',
      totalScore: 2,
      payoutAmountCents: 175000,
    },
    {
      userId: entrantUserId,
      finalRankDisplay: '2',
      totalScore: 8,
      payoutAmountCents: 105000,
    },
    {
      userId: tiebreakRunnerUpUserId,
      finalRankDisplay: '3',
      totalScore: 8,
      payoutAmountCents: 70000,
    },
    {
      userId: fourthPlaceUserId,
      finalRankDisplay: '4',
      totalScore: 27,
      payoutAmountCents: 0,
    },
  ]);
  expect(
    persistedContestResults?.entryResults.slice(1, 3).map((entry) => ({
      totalScore: entry.totalScore,
      exactPicks: entry.exactPicks,
      oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
      qb1: entry.selectedQb1PassingTouchdowns,
      qb2: entry.selectedQb2PassingTouchdowns,
      qb3: entry.selectedQb3PassingTouchdowns,
      qb4: entry.selectedQb4PassingTouchdowns,
      qb5: entry.selectedQb5PassingTouchdowns,
    })),
  ).toEqual([
    {
      totalScore: 8,
      exactPicks: 3,
      oneOffOrBetterPicks: 9,
      qb1: 4,
      qb2: 3,
      qb3: 2,
      qb4: 2,
      qb5: 3,
    },
    {
      totalScore: 8,
      exactPicks: 3,
      oneOffOrBetterPicks: 9,
      qb1: 4,
      qb2: 3,
      qb3: 2,
      qb4: 2,
      qb5: 2,
    },
  ]);

  const entrantContext = await createSignedInContext(browser, entrantCookieValue);
  const entrantPage = await entrantContext.newPage();

  await entrantPage.goto(`/contests/${targetContestId}`);
  await expect(entrantPage.getByRole('link', { name: 'View Results' })).toBeVisible();

  await entrantPage.goto(`/leaderboard?contest=${targetContestId}`);
  await expect(entrantPage.getByRole('heading', { name: 'Final Results' })).toBeVisible();
  await expect(entrantPage.getByText(persistedContestResults!.entryResults[0]!.displayName)).toBeVisible();
  await expect(entrantPage.getByText(persistedContestResults!.entryResults[1]!.displayName)).toBeVisible();
  await expect(entrantPage.getByText(persistedContestResults!.entryResults[2]!.displayName)).toBeVisible();
  await expect(
    entrantPage.getByText(
      `${persistedContestResults!.entryResults[3]!.finalRankDisplay}. ${persistedContestResults!.entryResults[3]!.displayName}`,
    ),
  ).toBeVisible();
  await expect(entrantPage.getByText('2 pts')).toBeVisible();
  await expect(entrantPage.getByText('8 pts').first()).toBeVisible();
  await expect(entrantPage.getByText('27 pts')).toBeVisible();

  await entrantPage.goto(`/contests/${targetContestId}/results`);
  await expect(entrantPage.getByText('You finished 2')).toBeVisible();
  await expect(entrantPage.getByText('Your Score')).toBeVisible();
  await expect(entrantPage.getByText('8 pts')).toBeVisible();
  await expect(entrantPage.getByText('$1,050.00').first()).toBeVisible();
  await entrantPage.getByText('View Player Breakdown').click();
  await expect(entrantPage.getByText('#1 Lamar Jackson (BAL)')).toBeVisible();
  await expect(entrantPage.getByText('You: 1 | Actual: 1 | 0 pts')).toBeVisible();

  const nonEntrantContext = await createSignedInContext(browser, nonEntrantCookieValue);
  const nonEntrantPage = await nonEntrantContext.newPage();

  await nonEntrantPage.goto(`/contests/${targetContestId}`);
  await expect(nonEntrantPage.getByRole('link', { name: 'View Results' })).toBeVisible();
  await nonEntrantPage.goto(`/contests/${targetContestId}/results`);
  await expect(nonEntrantPage).toHaveURL(`/leaderboard?contest=${targetContestId}`);

  await operatorContext.close();
  await entrantContext.close();
  await nonEntrantContext.close();
});

test('locks and finalizes the same zero-fee proof contest without paid count or payout movement', async ({
  browser,
}) => {
  await updateContestFixture(freeProofContestId, {
    entryFeeCents: 0,
    entryCount: freeProofEntries.length,
    paidEntryCount: 0,
    status: 'open',
    visibilityStatus: 'visible',
  });
  await writeSeededEntries(freeProofEntries);

  const operatorContext = await createSignedInContext(browser, operatorCookieValue);
  const operatorPage = await operatorContext.newPage();

  await operatorPage.goto('/admin/contests');
  await expect(operatorPage.getByRole('heading', { name: 'Contest Setup' })).toBeVisible();
  await expect(operatorPage.locator(`#lockConfirmationText-${freeProofContestId}`)).toBeVisible();
  await operatorPage.locator(`#lockConfirmationText-${freeProofContestId}`).fill('LOCK TEST');
  await operatorPage.getByRole('button', { name: 'Lock Free/Test Contest' }).click();

  await expect(operatorPage).toHaveURL(/status=locked/, { timeout: serverActionTimeout });
  await expect(
    operatorPage.getByText('Week 1 QB Passing Yards is locked for the no-money free/test proof.'),
  ).toBeVisible();

  let contestStore = JSON.parse(await readFile(contestStorePath, 'utf8')) as {
    contests: Array<{ id: string; status: string; entryFeeCents: number; entryCount: number; paidEntryCount: number }>;
    contestStateEvents: Array<{ contestId: string; toStatus: string; metadata: Record<string, string> }>;
  };
  const lockedContest = contestStore.contests.find((contest) => contest.id === freeProofContestId);

  expect(lockedContest).toMatchObject({
    status: 'locked',
    entryFeeCents: 0,
    entryCount: freeProofEntries.length,
    paidEntryCount: 0,
  });
  expect(contestStore.contestStateEvents.at(-1)).toMatchObject({
    contestId: freeProofContestId,
    toStatus: 'locked',
    metadata: expect.objectContaining({
      proof_type: 'free_test_lock',
      no_money: 'true',
      paid_entries_at_lock: '0',
    }),
  });

  const freeProofFinalizationForm = operatorPage.locator('form').filter({
    has: operatorPage.locator(`#finalStatRows-${freeProofContestId}`),
  });

  await freeProofFinalizationForm.locator(`#finalStatRows-${freeProofContestId}`).fill(finalStatRows);
  await freeProofFinalizationForm.locator(`#confirmationText-${freeProofContestId}`).fill('FINAL');
  await freeProofFinalizationForm.getByRole('button', { name: 'Run Final Scoring' }).click();

  await expect(operatorPage).toHaveURL(/status=finalized/, { timeout: serverActionTimeout });
  await expect(
    operatorPage.getByText('Week 1 QB Passing Yards final results are now published from the confirmed QB stats.'),
  ).toBeVisible();

  contestStore = JSON.parse(await readFile(contestStorePath, 'utf8')) as {
    contests: Array<{ id: string; status: string; entryFeeCents: number; entryCount: number; paidEntryCount: number }>;
    contestStateEvents: Array<{ contestId: string; toStatus: string; metadata: Record<string, string> }>;
  };
  expect(contestStore.contests.find((contest) => contest.id === freeProofContestId)).toMatchObject({
    status: 'final',
    entryFeeCents: 0,
    entryCount: freeProofEntries.length,
    paidEntryCount: 0,
  });

  const persistedResultsStore = JSON.parse(await readFile(resultsStorePath, 'utf8')) as {
    contests: Array<{
      contestId: string;
      prizePoolCents: number;
      payoutSlots: Array<{ amountCents: number }>;
      entryResults: Array<{
        userId: string;
        finalRankDisplay: string;
        totalScore: number;
        payoutAmountCents: number;
      }>;
      entryPlayerScores: Array<{
        entryId: string;
        playerId: string;
      }>;
    }>;
  };
  const persistedFreeResults = persistedResultsStore.contests.find((contest) => contest.contestId === freeProofContestId);

  expect(persistedFreeResults).toBeTruthy();
  expect(persistedFreeResults?.prizePoolCents).toBe(0);
  expect(persistedFreeResults?.payoutSlots.every((slot) => slot.amountCents === 0)).toBe(true);
  expect(persistedFreeResults?.entryResults).toHaveLength(freeProofEntries.length);
  expect(persistedFreeResults?.entryResults.every((entry) => entry.payoutAmountCents === 0)).toBe(true);
  expect(persistedFreeResults?.entryPlayerScores).toHaveLength(freeProofEntries.length * 10);
  const entrantFinalResult = persistedFreeResults!.entryResults.find((entry) => entry.userId === defaultE2eViewerUserId);

  expect(entrantFinalResult).toBeTruthy();

  const entrantContext = await createSignedInContext(browser, entrantCookieValue);
  const entrantPage = await entrantContext.newPage();

  await entrantPage.goto(`/contests/${freeProofContestId}`);
  await expect(entrantPage.getByRole('link', { name: 'View Results' })).toBeVisible();

  await entrantPage.goto(`/leaderboard?contest=${freeProofContestId}`);
  await expect(entrantPage.getByRole('heading', { name: 'Final Results' })).toBeVisible();
  await expect(entrantPage.getByText('Beta contest - no payout')).toHaveCount(0);
  await expect(entrantPage.getByText('Results', { exact: true }).first()).toBeVisible();

  await entrantPage.goto(`/contests/${freeProofContestId}/results`);
  await expect(entrantPage.getByText(`You finished ${entrantFinalResult!.finalRankDisplay}`)).toBeVisible();
  await expect(entrantPage.getByText(`${entrantFinalResult!.totalScore} pts`)).toBeVisible();
  await expect(entrantPage.getByText('Final Result', { exact: true })).toHaveCount(0);
  await expect(entrantPage.getByText('Beta contest - no payout')).toHaveCount(0);
  await expect(entrantPage.getByText('Results status')).toBeVisible();

  await operatorContext.close();
  await entrantContext.close();
});

test('reruns finalization after a stat correction and replaces saved rows without duplicate results drift', async ({
  browser,
}) => {
  const operatorContext = await createSignedInContext(browser, operatorCookieValue);
  const operatorPage = await operatorContext.newPage();

  await operatorPage.goto('/admin/contests');
  await expect(operatorPage.getByRole('heading', { name: 'Contest Setup' })).toBeVisible();
  await operatorPage.locator(`#finalStatRows-${targetContestId}`).fill(finalStatRows);
  await operatorPage.locator(`#confirmationText-${targetContestId}`).fill('FINAL');
  await operatorPage.getByRole('button', { name: 'Run Final Scoring' }).click();
  await expect(operatorPage).toHaveURL(/status=finalized/, { timeout: serverActionTimeout });

  const firstSavedResults = await readPersistedContestResults();
  const firstEntrantRow = firstSavedResults.entryResults.find((entry) => entry.userId === entrantUserId);
  expect(firstEntrantRow).toBeTruthy();

  await operatorPage.goto('/admin/contests');
  await operatorPage.locator(`#finalStatRows-${targetContestId}`).fill(correctedFinalStatRows);
  await operatorPage.locator(`#confirmationText-${targetContestId}`).fill('FINAL');
  await operatorPage.getByRole('button', { name: 'Run Final Scoring' }).click();

  await expect(operatorPage).toHaveURL(/status=finalized/, { timeout: serverActionTimeout });
  await expect(
    operatorPage.getByText('Week 1 QB Passing Yards final results are now published from the confirmed QB stats.'),
  ).toBeVisible();

  const correctedSavedResults = await readPersistedContestResults();
  const correctedEntrantRow = correctedSavedResults.entryResults.find((entry) => entry.userId === entrantUserId);

  expect(correctedSavedResults.entryResults).toHaveLength(seededEntries.length);
  expect(correctedSavedResults.entryPlayerScores).toHaveLength(seededEntries.length * 10);
  expect(correctedSavedResults.entryResults.map((entry) => entry.entryId)).toHaveLength(
    new Set(correctedSavedResults.entryResults.map((entry) => entry.entryId)).size,
  );
  expect(correctedSavedResults.entryPlayerScores.map((score) => `${score.entryId}:${score.playerId}`)).toHaveLength(
    new Set(correctedSavedResults.entryPlayerScores.map((score) => `${score.entryId}:${score.playerId}`)).size,
  );
  expect(
    (JSON.parse(await readFile(resultsStorePath, 'utf8')) as { contests: Array<{ contestId: string }> }).contests.filter(
      (contest) => contest.contestId === targetContestId,
    ),
  ).toHaveLength(1);
  expect(correctedEntrantRow).toBeTruthy();
  expect(correctedEntrantRow).not.toEqual(firstEntrantRow);

  const entrantContext = await createSignedInContext(browser, entrantCookieValue);
  const entrantPage = await entrantContext.newPage();
  await entrantPage.goto(`/leaderboard?contest=${targetContestId}`);
  await expect(entrantPage.getByRole('heading', { name: 'Final Results' })).toBeVisible();
  await expect(entrantPage.getByText(correctedSavedResults.entryResults[0]!.displayName)).toBeVisible();
  await expect(entrantPage.getByText(correctedSavedResults.entryResults[1]!.displayName)).toBeVisible();
  await expect(entrantPage.getByText(correctedSavedResults.entryResults[2]!.displayName)).toBeVisible();
  await expect(
    entrantPage.getByText(
      `${correctedSavedResults.entryResults[3]!.finalRankDisplay}. ${correctedSavedResults.entryResults[3]!.displayName}`,
    ),
  ).toBeVisible();
  await expect(entrantPage.getByText(`${correctedEntrantRow!.totalScore} pts`).first()).toBeVisible();

  await entrantPage.goto(`/contests/${targetContestId}/results`);
  await expect(entrantPage.getByText(`You finished ${correctedEntrantRow!.finalRankDisplay}`)).toBeVisible();
  await expect(entrantPage.getByText(`${correctedEntrantRow!.totalScore} pts`)).toBeVisible();
  await expect(entrantPage.getByText(formatUsd(correctedEntrantRow!.payoutAmountCents)).first()).toBeVisible();
  await entrantPage.getByText('View Player Breakdown').click();
  await expect(entrantPage.getByText('#1 Lamar Jackson (BAL)')).toBeVisible();

  await operatorContext.close();
  await entrantContext.close();
});

test('renders a saved shared paid tie consistently across leaderboard cards, ranking rows, and entrant results', async ({
  browser,
}) => {
  await writeSeededEntries(sharedTieEntries);

  const operatorContext = await createSignedInContext(browser, operatorCookieValue);
  const operatorPage = await operatorContext.newPage();

  await operatorPage.goto('/admin/contests');
  await expect(operatorPage.getByRole('heading', { name: 'Contest Setup' })).toBeVisible();
  await operatorPage.locator(`#finalStatRows-${targetContestId}`).fill(finalStatRows);
  await operatorPage.locator(`#confirmationText-${targetContestId}`).fill('FINAL');
  await operatorPage.getByRole('button', { name: 'Run Final Scoring' }).click();

  await expect(operatorPage).toHaveURL(/status=finalized/, { timeout: serverActionTimeout });

  const persistedResults = await readPersistedContestResults();
  expect(
    persistedResults.entryResults.map((entry) => ({
      entryId: entry.entryId,
      userId: entry.userId,
      finalRankDisplay: entry.finalRankDisplay,
      totalScore: entry.totalScore,
      payoutAmountCents: entry.payoutAmountCents,
    })),
  ).toEqual([
    {
      entryId: 'entry-first-place',
      userId: thirdPlaceUserId,
      finalRankDisplay: '1',
      totalScore: 0,
      payoutAmountCents: 175000,
    },
    {
      entryId: 'entry-second-place',
      userId: fourthPlaceUserId,
      finalRankDisplay: '2',
      totalScore: 2,
      payoutAmountCents: 105000,
    },
    {
      entryId: 'entry-shared-third-a',
      userId: entrantUserId,
      finalRankDisplay: 'T-3',
      totalScore: 8,
      payoutAmountCents: 35000,
    },
    {
      entryId: 'entry-shared-third-b',
      userId: tiebreakRunnerUpUserId,
      finalRankDisplay: 'T-3',
      totalScore: 8,
      payoutAmountCents: 35000,
    },
  ]);
  expect(
    persistedResults.entryResults.slice(2, 4).map((entry) => ({
      exactPicks: entry.exactPicks,
      oneOffOrBetterPicks: entry.oneOffOrBetterPicks,
      qb1: entry.selectedQb1PassingTouchdowns,
      qb2: entry.selectedQb2PassingTouchdowns,
      qb3: entry.selectedQb3PassingTouchdowns,
      qb4: entry.selectedQb4PassingTouchdowns,
      qb5: entry.selectedQb5PassingTouchdowns,
    })),
  ).toEqual([
    {
      exactPicks: 3,
      oneOffOrBetterPicks: 9,
      qb1: 4,
      qb2: 3,
      qb3: 2,
      qb4: 2,
      qb5: 3,
    },
    {
      exactPicks: 3,
      oneOffOrBetterPicks: 9,
      qb1: 4,
      qb2: 3,
      qb3: 2,
      qb4: 2,
      qb5: 3,
    },
  ]);

  const entrantContext = await createSignedInContext(browser, entrantCookieValue);
  const entrantPage = await entrantContext.newPage();

  await entrantPage.goto(`/leaderboard?contest=${targetContestId}`);
  await expect(entrantPage.getByText('Rank T-3')).toBeVisible();
  await expect(
    entrantPage.getByText(
      `${persistedResults.entryResults[3]!.finalRankDisplay}. ${persistedResults.entryResults[3]!.displayName}`,
    ),
  ).toBeVisible();
  await expect(entrantPage.getByText('$350.00')).toHaveCount(2);

  await entrantPage.goto(`/contests/${targetContestId}/results`);
  await expect(entrantPage.getByText('You finished T-3')).toBeVisible();
  await expect(entrantPage.getByText('Your Score')).toBeVisible();
  await expect(entrantPage.getByText('8 pts')).toBeVisible();
  await expect(entrantPage.getByText('$350.00').first()).toBeVisible();

  await operatorContext.close();
  await entrantContext.close();
});

function buildAuthCookieValue({
  email,
  username,
  displayName,
  userId,
  roleSlugs = [],
}: {
  email: string;
  username: string;
  displayName: string;
  userId: string;
  roleSlugs?: string[];
}) {
  return encodeE2eAuthCookie({
    email,
    username,
    displayName,
    emailConfirmedAt: '2026-06-29T00:00:00.000Z',
    userId,
    roleSlugs,
  });
}

async function createSignedInContext(browser: Browser, cookieValue: string) {
  const context = await browser.newContext({ baseURL: appUrl });
  await context.addCookies([
    {
      name: e2eAuthCookieName,
      value: cookieValue,
      url: appUrl,
    },
  ]);

  return context;
}

function buildProviderStore(rowsText: string) {
  return {
    version: 1,
    contests: [
      {
        contestId: targetContestId,
        providerName: 'Mock Stats Feed',
        providerSnapshotTime: '2026-09-09T00:00:00.000Z',
        rows: rowsText.split('\n').map((row) => {
          const [playerId, playerName, finalStat, passingTouchdowns] = row.split('|');
          return {
            providerPlayerId: `provider-${playerId}`,
            providerGameId: playerId === 'qb-josh-allen' ? 'buf-bal-2026-wk1' : inferProviderGameId(playerId),
            playerName,
            finalStat: Number(finalStat),
            passingTouchdowns: Number(passingTouchdowns),
            gameStatus: 'final',
          };
        }),
      },
    ],
  };
}

function inferProviderGameId(playerId: string) {
  const gameIds: Record<string, string> = {
    'qb-joe-burrow': 'cin-cle-2026-wk1',
    'qb-derek-carr': 'no-atl-2026-wk1',
    'qb-kirk-cousins': 'atl-no-2026-wk1',
    'qb-justin-herbert': 'lac-lv-2026-wk1',
    'qb-jalen-hurts': 'phi-dal-2026-wk1',
    'qb-lamar-jackson': 'bal-buf-2026-wk1',
    'qb-jordan-love': 'gb-min-2026-wk1',
    'qb-dak-prescott': 'dal-phi-2026-wk1',
    'qb-brock-purdy': 'sf-sea-2026-wk1',
    'qb-cj-stroud': 'hou-ind-2026-wk1',
    'qb-patrick-mahomes': 'kc-den-2026-wk1',
    'qb-jared-goff': 'det-chi-2026-wk1',
    'qb-tua-tagovailoa': 'mia-nyj-2026-wk1',
    'qb-matthew-stafford': 'lar-ari-2026-wk1',
    'qb-baker-mayfield': 'tb-atl-2026-wk1',
    'qb-trevor-lawrence': 'jax-car-2026-wk1',
    'qb-kyler-murray': 'ari-lar-2026-wk1',
    'qb-sam-darnold': 'sea-sf-2026-wk1',
    'qb-russell-wilson': 'nyg-was-2026-wk1',
  };

  return gameIds[playerId] ?? '';
}

async function readPersistedContestResults() {
  const persistedResultsStore = JSON.parse(await readFile(resultsStorePath, 'utf8')) as {
    contests: Array<{
      contestId: string;
      entryResults: Array<{
        entryId: string;
        userId: string;
        displayName: string;
        totalScore: number;
        finalRankDisplay: string;
        payoutAmountCents: number;
        exactPicks: number;
        oneOffOrBetterPicks: number;
        selectedQb1PassingTouchdowns: number | null;
        selectedQb2PassingTouchdowns: number | null;
        selectedQb3PassingTouchdowns: number | null;
        selectedQb4PassingTouchdowns: number | null;
        selectedQb5PassingTouchdowns: number | null;
      }>;
      entryPlayerScores: Array<{
        entryId: string;
        playerId: string;
      }>;
    }>;
  };

  const persistedContestResults = persistedResultsStore.contests.find(
    (contest) => contest.contestId === targetContestId,
  );

  expect(persistedContestResults).toBeTruthy();

  return persistedContestResults!;
}

function formatUsd(amountCents: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amountCents / 100);
}

function withSavedEntryMetadata(entries: SeedEntry[]) {
  return entries.map((entry) => ({
    ...entry,
    lastSavedAt: '2026-09-08T00:00:00.000Z',
    source: 'user_saved' as const,
    createdAt: '2026-09-04T00:00:00.000Z',
    updatedAt: '2026-09-08T00:00:00.000Z',
  }));
}

async function writeSeededEntries(entries: typeof seededEntries) {
  await writeFile(entryStorePath, `${JSON.stringify({ version: 1, entries }, null, 2)}\n`, 'utf8');
}

async function updateContestFixture(contestId: string, updates: Record<string, unknown>) {
  const contestStore = JSON.parse(await readFile(contestStorePath, 'utf8')) as {
    contests: Array<Record<string, unknown>>;
  };

  contestStore.contests = contestStore.contests.map((contest) =>
    contest.id === contestId
      ? {
          ...contest,
          ...updates,
        }
      : contest,
  );

  await writeFile(contestStorePath, `${JSON.stringify(contestStore, null, 2)}\n`, 'utf8');
}
