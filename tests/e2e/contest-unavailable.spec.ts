import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';

const contestStorePath = path.join(process.cwd(), 'data', 'contests.json');
const hiddenContestId = 'hidden-contest-route-verification';
const deletedContestId = 'deleted-contest-route-verification';
let originalContestStore = '';

test.beforeAll(async () => {
  originalContestStore = await readFile(contestStorePath, 'utf8');
  const store = JSON.parse(originalContestStore) as {
    contests: Array<Record<string, unknown>>;
  };
  const sourceContest = store.contests.find((contest) => contest.id === 'week-1-qb-passing-yards');

  if (!sourceContest) {
    throw new Error('The browser fixture needs the public Week 1 contest.');
  }

  store.contests.push({
    ...sourceContest,
    id: hiddenContestId,
    title: 'Hidden Contest Route Verification',
    status: 'draft',
    visibilityStatus: 'hidden',
    isFeatured: false,
    displayOrder: 999,
  });

  await writeFile(contestStorePath, `${JSON.stringify(store, null, 2)}\n`, 'utf8');
});

test.afterAll(async () => {
  if (originalContestStore) {
    await writeFile(contestStorePath, originalContestStore, 'utf8');
  }
});

test('deleted and hidden contest detail URLs return the same safe unavailable state', async ({ page }) => {
  for (const contestId of [deletedContestId, hiddenContestId]) {
    const response = await page.goto(`/contests/${contestId}`);

    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { name: 'This contest is not available' })).toBeVisible();
    await expect(
      page.getByText('The contest may have been removed, or it may not be open to the public yet.'),
    ).toBeVisible();
    await expect(page.getByRole('link', { name: 'View open contests' })).toHaveAttribute('href', '/contests');
    await expect(page.getByRole('link', { name: 'How it works' })).toHaveAttribute('href', '/how-it-works');
    await expect(page.getByText('A server error occurred.')).toHaveCount(0);
    await expect(page.getByText('Hidden Contest Route Verification')).toHaveCount(0);
  }
});

test('unavailable contest handlers return JSON 404 responses without entering protected flows', async ({ request }) => {
  for (const contestId of [deletedContestId, hiddenContestId]) {
    const progressResponse = await request.get(`/contests/${contestId}/progress`);
    expect(progressResponse.status()).toBe(404);
    expect(await progressResponse.json()).toEqual({ message: 'Contest not found.' });

    const lineupResponse = await request.post(`/api/contests/${contestId}/lineup`, {
      data: { order: [] },
    });
    expect(lineupResponse.status()).toBe(404);
    expect(await lineupResponse.json()).toEqual({ message: 'Contest not found.' });
  }
});

test('known visible contest detail URLs still render normally', async ({ page }) => {
  const response = await page.goto('/contests/week-1-qb-passing-yards');

  expect(response?.status()).toBe(200);
  await expect(page.getByRole('heading', { name: 'Week 1 QB Passing Yards', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'This contest is not available' })).toHaveCount(0);
});
