import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test as baseTest } from '@playwright/test';
import { e2eAuthCookieName, encodeE2eAuthCookie } from '@/lib/viewer-identity';
import { test as signedInTest } from './fixtures/protected-entry-auth';
import { e2eAppUrl, expectPagePath } from './support/navigation';

const contestId = 'week-1-qb-passing-yards-msf-validation';
const contestTitle = 'Week 1 QB Passing Yards MSF Validation';
const contestStorePath = path.join(process.cwd(), 'data', 'contests.json');
const entryStorePath = path.join(process.cwd(), 'data', 'contest-entries.json');

const operatorCookie = encodeE2eAuthCookie({
  email: 'operator@pickrank.test',
  username: 'operator_user',
  displayName: 'Operator User',
  emailConfirmedAt: '2026-09-01T00:00:00.000Z',
  userId: '99999999-9999-4999-8999-999999999999',
  roleSlugs: ['contest_operator'],
});

baseTest('operator sees the validated MySportsFeeds Week 1 setup in the admin flow', async ({ page }) => {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: operatorCookie,
      url: e2eAppUrl,
    },
  ]);

  await page.goto('/admin/contests');
  await expectPagePath(page, '/admin/contests');
  await expect(page.getByRole('heading', { name: 'Contest setup' })).toBeVisible();

  const contestCard = page.locator('.rounded-lg.border.bg-white.p-3').filter({ hasText: contestTitle });
  await expect(contestCard).toContainText('Open');
  await expect(contestCard).toContainText('Validation: passed');
  await expect(contestCard).toContainText('Player pool setup: 20/20 quarterbacks saved');
  await expect(contestCard).toContainText('Visible in public browse');
  await expect(contestCard.getByRole('link', { name: 'View public page' })).toHaveAttribute(
    'href',
    `/contests/${contestId}`,
  );
});

signedInTest('eligible user can enter the MySportsFeeds Week 1 contest and save a 10-player board', async ({ page }) => {
  const originalContestStore = await readFile(contestStorePath, 'utf8');
  const originalEntryStore = await readFile(entryStorePath, 'utf8');

  try {
    await writeFile(entryStorePath, `${JSON.stringify({ version: 1, entries: [] }, null, 2)}\n`, 'utf8');

    await page.goto('/contests');
    const contestCard = page.getByTestId(`contest-card-${contestId}`);
    await expect(contestCard.getByTestId('contest-lifecycle-status')).toHaveText('Open');
    await expect(contestCard).toContainText('Passing yards');
    await contestCard.getByRole('link', { name: 'Enter free beta contest' }).click();

    await expectPagePath(page, `/contests/${contestId}`);
    await expect(page.getByRole('heading', { name: contestTitle })).toBeVisible();
    await expect(page.getByText('20-player pool')).toBeVisible();
    await expect(page.getByText('Caleb Williams')).toBeVisible();
    await expect(page.getByText('Jaxson Dart')).toBeVisible();
    await page.getByRole('button', { name: 'Enter free beta contest' }).click();

    await expectPagePath(page, `/contests/${contestId}/lineup`);
    await expect(page.locator('h1').filter({ hasText: 'Build your board' })).toBeVisible();
    await expect(page.getByText('Available quarterbacks')).toBeVisible();

    for (let index = 0; index < 10; index += 1) {
      await page.getByRole('button', { name: 'Add' }).first().click();
    }

    await expect(page.getByText('10/10 ranked', { exact: true })).toHaveCount(2);
    await page.getByRole('button', { name: 'Save board' }).click();
    await expect(page.getByText('Your board is saved', { exact: true })).toBeVisible();

    const entryStore = JSON.parse(await readFile(entryStorePath, 'utf8')) as {
      entries: Array<{ contestId: string; lineupOrder: string[]; source: string }>;
    };
    const savedEntry = entryStore.entries.find((entry) => entry.contestId === contestId);

    expect(savedEntry?.lineupOrder).toHaveLength(10);
    expect(savedEntry?.source).toBe('user_saved');
  } finally {
    await writeFile(contestStorePath, originalContestStore, 'utf8');
    await writeFile(entryStorePath, originalEntryStore, 'utf8');
  }
});
