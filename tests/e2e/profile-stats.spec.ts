import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type BrowserContext } from '@playwright/test';
import {
  defaultE2eViewerUserId,
  e2eAuthCookieName,
  encodeE2eAuthCookie,
} from '@/lib/viewer-identity';
import { e2eAppUrl, expectPagePath } from './support/navigation';

const contestStorePath = path.join(process.cwd(), 'data', 'contests.json');
const resultsStorePath = path.join(process.cwd(), 'data', 'contest-results.json');
const targetContestId = 'week-1-qb-passing-yards';
const finalizedAt = '2026-09-09T00:00:00.000Z';
const viewerEntryId = 'profile-stats-viewer-entry';
let originalContestStore = '';
let originalResultsStore: string | null = null;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  originalContestStore = await readFile(contestStorePath, 'utf8');

  try {
    originalResultsStore = await readFile(resultsStorePath, 'utf8');
  } catch {
    originalResultsStore = null;
  }
});

test.beforeEach(async () => {
  await restoreStores();
});

test.afterAll(async () => {
  await restoreStores();
});

test('active Profile shows private lifetime stats before account settings on desktop and mobile', async ({
  context,
  page,
}) => {
  await seedFinalProfileResult();
  await addViewerCookie(context);

  for (const viewport of [
    { width: 1280, height: 900 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(viewport);
    await page.goto('/profile');

    const statsHeading = page.getByRole('heading', { name: 'My Stats' });
    const profileHeading = page.getByRole('heading', { name: 'Profile information' });
    const supportLink = page.getByRole('link', { name: 'Contact support' });
    await expect(statsHeading).toBeVisible();
    await expect(profileHeading).toBeVisible();
    await expect(page.getByText('Contests completed')).toBeVisible();
    await expect(page.getByText('Best finish')).toBeVisible();
    await expect(page.getByText('Top-3 finishes')).toBeVisible();
    await expect(page.getByText('Exact pick rate')).toBeVisible();
    await expect(page.getByText('1 of 4')).toBeVisible();
    await expect(page.getByText('30%')).toBeVisible();
    await expect(page.getByText('60%')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Recent results' })).toBeVisible();
    await expect(page.getByText('1 of 4 · 7 pts · 3 of 10 exact')).toBeVisible();
    await expect(page.getByRole('link', { name: 'View result' })).toHaveAttribute(
      'href',
      `/contests/${targetContestId}/results`,
    );

    const [statsBox, profileBox, supportBox] = await Promise.all([
      statsHeading.boundingBox(),
      profileHeading.boundingBox(),
      supportLink.boundingBox(),
    ]);
    expect(statsBox).not.toBeNull();
    expect(profileBox).not.toBeNull();
    expect(supportBox).not.toBeNull();
    expect(statsBox!.y).toBeLessThan(profileBox!.y);
    expect(statsBox!.y).toBeLessThan(supportBox!.y);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth),
    ).toBe(true);

    if (viewport.width === 1280 && process.env.PICKRANK_PROFILE_STATS_CAPTURE_PATH) {
      await page.screenshot({ path: process.env.PICKRANK_PROFILE_STATS_CAPTURE_PATH, fullPage: true });
    }
  }

  await page.getByRole('link', { name: 'View result' }).click();
  await expectPagePath(page, `/contests/${targetContestId}/results`);
  await expect(page.getByRole('heading', { name: 'Your results' })).toBeVisible();
});

test('a required return-to-contest action stays ahead of private stats', async ({ context, page }) => {
  await addViewerCookie(context);
  await page.goto(`/profile?next=%2Fcontests%2F${targetContestId}%2Flineup`);

  const returnAction = page.getByRole('link', { name: 'Continue to build your board' });
  const statsHeading = page.getByRole('heading', { name: 'My Stats' });
  await expect(returnAction).toHaveAttribute('href', `/contests/${targetContestId}/lineup`);
  await expect(statsHeading).toBeVisible();

  const [returnBox, statsBox] = await Promise.all([returnAction.boundingBox(), statsHeading.boundingBox()]);
  expect(returnBox).not.toBeNull();
  expect(statsBox).not.toBeNull();
  expect(returnBox!.y).toBeLessThan(statsBox!.y);
});

test('active Profile shows the first-contest empty state without saved final results', async ({ context, page }) => {
  await rm(resultsStorePath, { force: true });
  await addViewerCookie(context);
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
  await expect(page.getByText('Your stats will appear after your first completed contest.')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View contests' })).toHaveAttribute('href', '/contests');
  await expect(page.getByRole('heading', { name: 'Profile information' })).toBeVisible();
});

test('Profile keeps account controls usable when stats cannot load', async ({ context, page }) => {
  await writeFile(resultsStorePath, '{not-valid-json', 'utf8');
  await addViewerCookie(context);
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
  await expect(page.getByText('Stats are unavailable right now.')).toBeVisible();
  await expect(page.getByText('Your saved results are not affected.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Profile information' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
});

test('restricted accounts do not receive the private stats surface', async ({ context, page }) => {
  await addViewerCookie(context, { eligibilityStatus: 'blocked' });
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Account restricted' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'My Stats' })).toHaveCount(0);
});

async function addViewerCookie(
  context: BrowserContext,
  overrides: { eligibilityStatus?: 'eligible' | 'blocked' } = {},
) {
  await context.addCookies([
    {
      name: e2eAuthCookieName,
      value: encodeE2eAuthCookie({
        email: 'profile-stats@pickrank.test',
        username: 'profile_stats_user',
        displayName: 'Profile Stats User',
        emailConfirmedAt: '2026-09-02T00:00:00.000Z',
        userId: defaultE2eViewerUserId,
        ageConfirmed: true,
        dateOfBirth: '1990-01-01',
        jurisdiction: 'CA',
        termsAcceptedAt: '2026-09-02T00:00:00.000Z',
        privacyPolicyAcceptedAt: '2026-09-02T00:00:00.000Z',
        eligibilityStatus: overrides.eligibilityStatus || 'eligible',
      }),
      url: e2eAppUrl,
    },
  ]);
}

async function seedFinalProfileResult() {
  const contestStore = JSON.parse(originalContestStore) as {
    version: number;
    contests: Array<Record<string, unknown>>;
  };
  contestStore.contests = contestStore.contests.map((contest) =>
    contest.id === targetContestId
      ? { ...contest, status: 'final', visibilityStatus: 'visible' }
      : contest,
  );
  await writeFile(contestStorePath, `${JSON.stringify(contestStore, null, 2)}\n`, 'utf8');
  await writeFile(resultsStorePath, `${JSON.stringify(buildResultsStore(), null, 2)}\n`, 'utf8');
}

function buildResultsStore() {
  const playerResults = Array.from({ length: 10 }, (_, index) => ({
    playerId: `player-${index + 1}`,
    providerPlayerId: `provider-player-${index + 1}`,
    playerName: `Player ${index + 1}`,
    teamAbbreviation: 'TST',
    finalStat: 300 - index,
    passingTouchdowns: 2,
    actualRank: index + 1,
    actualRankDisplay: String(index + 1),
    actualRankMin: index + 1,
    actualRankMax: index + 1,
    gameId: `game-${index + 1}`,
    gameStatus: 'final',
    statFinalizedAt: finalizedAt,
  }));
  const entryResults = [
    buildEntryResult(viewerEntryId, defaultE2eViewerUserId, 1, 7, 3, 6),
    buildEntryResult('profile-stats-entry-2', '11111111-1111-4111-8111-111111111111', 2, 10, 2, 5),
    buildEntryResult('profile-stats-entry-3', '22222222-2222-4222-8222-222222222222', 3, 12, 1, 4),
    buildEntryResult('profile-stats-entry-4', '33333333-3333-4333-8333-333333333333', 4, 15, 1, 3),
  ];
  const entryPlayerScores = playerResults.map((player, index) => ({
    entryId: viewerEntryId,
    contestId: targetContestId,
    playerId: player.playerId,
    playerName: player.playerName,
    userRank: index + 1,
    actualRankMin: player.actualRankMin,
    actualRankMax: player.actualRankMax,
    actualRankDisplay: player.actualRankDisplay,
    distance: index < 3 ? 0 : index < 6 ? 1 : 2,
    pointsAwarded: index < 3 ? 0 : index < 6 ? 1 : 2,
    createdAt: finalizedAt,
  }));

  return {
    version: 1,
    contests: [
      {
        contestId: targetContestId,
        contestTitle: 'Week 1 QB Passing Yards',
        finalizedAt,
        scoringVersion: 'rank_differential_v2',
        prizePoolCents: 0,
        payoutSlots: [],
        playerResults,
        entryResults,
        entryPlayerScores,
      },
    ],
  };
}

function buildEntryResult(
  entryId: string,
  userId: string,
  finalRank: number,
  totalScore: number,
  exactPicks: number,
  oneOffOrBetterPicks: number,
) {
  return {
    entryId,
    contestId: targetContestId,
    userId,
    displayName: userId === defaultE2eViewerUserId ? 'Profile Stats User' : `Entrant ${finalRank}`,
    totalScore,
    exactPicks,
    oneOffOrBetterPicks,
    actualQb1Distance: 0,
    selectedQb1PassingTouchdowns: 2,
    selectedQb2PassingTouchdowns: 2,
    selectedQb3PassingTouchdowns: 2,
    selectedQb4PassingTouchdowns: 2,
    selectedQb5PassingTouchdowns: 2,
    finalRank,
    finalRankDisplay: String(finalRank),
    isTied: false,
    tieGroupId: null,
    tieGroupSize: 1,
    payoutAmountCents: 0,
    payoutStatus: 'pending',
    scoreFinalizedAt: finalizedAt,
    scoringVersion: 'rank_differential_v2',
  };
}

async function restoreStores() {
  await writeFile(contestStorePath, originalContestStore, 'utf8');

  if (originalResultsStore === null) {
    await rm(resultsStorePath, { force: true });
    return;
  }

  await writeFile(resultsStorePath, originalResultsStore, 'utf8');
}
