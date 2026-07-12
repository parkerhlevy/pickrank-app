import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { defaultE2eViewerUserId } from '@/lib/viewer-identity';
import { test as signedInTest } from './fixtures/protected-entry-auth';

const appUrl = 'http://127.0.0.1:3000';
const entryStorePath = path.join(process.cwd(), 'data', 'contest-entries.json');
const demoSavedLineup = [
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

async function resetEntryStore() {
  await mkdir(path.dirname(entryStorePath), { recursive: true });
  await writeFile(
    entryStorePath,
    `${JSON.stringify({ version: 1, entries: [] }, null, 2)}\n`,
    'utf8',
  );
}

async function seedEntryStore(entries: Array<{
  entryId: string;
  contestId: string;
  lineupOrder: string[];
  lastSavedAt: string | null;
  source: 'default_assigned' | 'user_saved';
  createdAt: string;
  updatedAt: string;
}>) {
  await mkdir(path.dirname(entryStorePath), { recursive: true });
  await writeFile(
    entryStorePath,
    `${JSON.stringify(
      {
        version: 1,
        entries: entries.map((entry) => ({
          ...entry,
          userId: defaultE2eViewerUserId,
        })),
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

test.beforeEach(async () => {
  await resetEntryStore();
});

test('signed-out users are redirected to auth from protected entry routes and keep their saved destination', async ({ page }) => {
  for (const route of [
    '/contests/week-1-qb-passing-yards/payment',
    '/contests/week-1-qb-passing-yards/success',
    '/contests/week-1-qb-passing-yards/lineup',
  ]) {
    await page.goto(route);

    await expect(page).toHaveURL(`http://127.0.0.1:3000/auth?next=${encodeURIComponent(route)}`);
    await expect(page.getByRole('heading', { name: 'Account Access' })).toBeVisible();
    await expect(page.getByText('Before You Enter')).toBeVisible();
  }
});

signedInTest.describe('protected entry flow with signed-in auth fixture', () => {
  signedInTest.describe.configure({ mode: 'serial' });

  signedInTest.beforeEach(async () => {
    await resetEntryStore();
  });

  signedInTest('entry screens reinforce the four-step handoff into the lineup builder', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/payment');
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(page.getByText('Review your entry before you confirm')).toBeVisible();
    const confirmEntryButton = page.getByRole('button', { name: 'Confirm Entry' });
    await expect(confirmEntryButton).toBeVisible();
    await confirmEntryButton.click();
    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\/success$/);
    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue to Build Your Lineup' })).toBeVisible();

    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByText('Step 4: Build Your Lineup')).toBeVisible();
  });

  signedInTest('ready signed-in users can open the lineup builder from the protected route', async ({ page }) => {
    await seedEntryStore([
      {
        entryId: 'demo-entry-open',
        contestId: 'week-1-qb-passing-yards',
        lineupOrder: demoSavedLineup,
        lastSavedAt: null,
        source: 'default_assigned',
        createdAt: '2026-06-22T00:00:00.000Z',
        updatedAt: '2026-06-22T00:00:00.000Z',
      },
    ]);
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');

    await expect(page.locator('h1').filter({ hasText: 'Build Your Lineup' })).toBeVisible();
    const rankedLineupCard = page.locator('.section-card').filter({ has: page.getByText('Your Ranked 10') });

    await expect(rankedLineupCard.locator('.status-pill').first()).toHaveText('10/10 Ranked');
    await expect(page.getByRole('button', { name: 'Save Lineup' })).toBeDisabled();
    await expect(page.locator('[data-lineup-player]').first()).toContainText('1. Josh Allen');
    await expect(page.getByText(/Add quarterbacks from the available slate/i)).toBeVisible();
    await expect(page.getByText('Available Quarterbacks')).toBeVisible();
    await expect(page.getByText('C.J. Stroud')).toBeVisible();
  });

  signedInTest('locked contests show the saved lineup in read-only mode', async ({ page }) => {
    await seedEntryStore([
      {
        entryId: 'demo-entry-locked',
        contestId: 'week-1-sunday-qb-passing-yards',
        lineupOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Kirk Cousins', 'Justin Herbert', 'Jalen Hurts', 'Lamar Jackson', 'Jordan Love', 'Dak Prescott', 'Brock Purdy'],
        lastSavedAt: '2026-06-19T10:05:00.000Z',
        source: 'user_saved',
        createdAt: '2026-06-19T10:00:00.000Z',
        updatedAt: '2026-06-19T10:05:00.000Z',
      },
    ]);
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-sunday-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-sunday-qb-passing-yards/lineup');

    await expect(page.getByText('Lineup Locked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locked - Read Only' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Joe Burrow lineup position is locked' })).toBeDisabled();
  });

  signedInTest('ready signed-in users see the full 15-player lineup pool on the builder screen', async ({ page }) => {
    await seedEntryStore([
      {
        entryId: 'demo-entry-open',
        contestId: 'week-1-qb-passing-yards',
        lineupOrder: demoSavedLineup,
        lastSavedAt: null,
        source: 'default_assigned',
        createdAt: '2026-06-22T00:00:00.000Z',
        updatedAt: '2026-06-22T00:00:00.000Z',
      },
    ]);
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');
    await expect(page.locator('[data-lineup-player]')).toHaveCount(10);
    const rankedLineupCard = page.locator('.section-card').filter({ has: page.getByText('Your Ranked 10') });

    await expect(rankedLineupCard.locator('.status-pill').first()).toHaveText('10/10 Ranked');
    await expect(page.getByText('5 Left in Slate')).toBeVisible();
    await expect(page.getByText('C.J. Stroud')).toBeVisible();
    await expect(page.getByText('Patrick Mahomes')).toBeVisible();
  });
});
