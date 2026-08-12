import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import {
  defaultE2eViewerUserId,
  e2eAuthCookieName,
  encodeE2eAuthCookie,
} from '@/lib/viewer-identity';
import { test as signedInTest } from './fixtures/protected-entry-auth';

const appUrl = 'http://127.0.0.1:3000';
const entryStorePath = path.join(process.cwd(), 'data', 'contest-entries.json');
const contestStorePath = path.join(process.cwd(), 'data', 'contests.json');
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

test.describe.configure({ mode: 'serial' });

const internalTestEligibilityCookie = encodeE2eAuthCookie({
  email: 'playwright@pickrank.test',
  username: 'playwright_user',
  displayName: 'playwright_user',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: defaultE2eViewerUserId,
  ageConfirmed: true,
  dateOfBirth: '1990-01-01',
  jurisdiction: 'CA',
  termsAcceptedAt: '2026-06-29T00:00:00.000Z',
  privacyPolicyAcceptedAt: '2026-06-29T00:00:00.000Z',
  eligibilityStatus: 'eligible_for_internal_testing',
});

const secondInternalTestEligibilityCookie = encodeE2eAuthCookie({
  email: 'second-playwright@pickrank.test',
  username: 'second_playwright_user',
  displayName: 'second_playwright_user',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: '00000000-0000-4000-8000-000000000222',
  ageConfirmed: true,
  dateOfBirth: '1990-01-01',
  jurisdiction: 'CA',
  termsAcceptedAt: '2026-06-29T00:00:00.000Z',
  privacyPolicyAcceptedAt: '2026-06-29T00:00:00.000Z',
  eligibilityStatus: 'eligible_for_internal_testing',
});

async function allowControlledTestEntry(page: Page) {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: internalTestEligibilityCookie,
      url: appUrl,
    },
  ]);
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

async function readContestCounts(contestId: string) {
  const contestStore = JSON.parse(await readFile(contestStorePath, 'utf8')) as {
    contests: Array<{ id: string; entryCount: number; paidEntryCount: number }>;
  };
  const contest = contestStore.contests.find((entry) => entry.id === contestId);

  if (!contest) {
    throw new Error(`Missing contest fixture: ${contestId}`);
  }

  return {
    entryCount: contest.entryCount,
    paidEntryCount: contest.paidEntryCount,
  };
}

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

test('signed-in users with pending paid eligibility can review free beta entry', async ({ page }) => {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: encodeE2eAuthCookie({
        email: 'pending-eligibility@pickrank.test',
        username: 'pending_user',
        displayName: 'pending_user',
        emailConfirmedAt: '2026-07-24T00:00:00.000Z',
        userId: '00000000-0000-4000-8000-000000000777',
        ageConfirmed: true,
        dateOfBirth: '1990-01-01',
        jurisdiction: 'CA',
        termsAcceptedAt: '2026-07-24T00:00:00.000Z',
        privacyPolicyAcceptedAt: '2026-07-24T00:00:00.000Z',
        eligibilityStatus: 'pending_review',
      }),
      url: appUrl,
    },
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
      url: appUrl,
    },
  ]);

  await page.goto('/contests/week-1-qb-passing-yards');
  await expect(page.getByRole('link', { name: 'Enter Free Beta Contest' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Eligibility Pending Review' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Enter Contest - $5' })).toHaveCount(0);

  await page.goto('/contests/week-1-qb-passing-yards/payment');

  await expect(page.getByRole('heading', { name: 'Beta Pass Summary' })).toBeVisible();
  await expect(page.getByText('Entry access')).toBeVisible();
  await expect(page.getByText('Payment required', { exact: true })).toBeVisible();
  await expect(page.getByText('Entry Cost', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Cash Value', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Amount Due Today', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Free beta entry', { exact: true })).toBeVisible();
  await expect(page.getByText('This contest is free to play during Early Access Beta.')).toBeVisible();
  await expect(page.getByText('No payment required')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Confirm Entry' })).toBeEnabled();
});

signedInTest.describe('protected entry flow with signed-in auth fixture', () => {
  signedInTest.describe.configure({ mode: 'serial' });

  let originalContestStore = '';
  let originalEntryStore = '';

  signedInTest.beforeAll(async () => {
    originalContestStore = await readFile(contestStorePath, 'utf8');
    originalEntryStore = await readFile(entryStorePath, 'utf8');
  });

  signedInTest.beforeEach(async () => {
    await resetEntryStore();
  });

  signedInTest.afterEach(async () => {
    await writeFile(contestStorePath, originalContestStore, 'utf8');
    await writeFile(entryStorePath, originalEntryStore, 'utf8');
  });

  signedInTest('entry screens reinforce the four-step handoff into the board builder', async ({ page }) => {
    await allowControlledTestEntry(page);
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/payment');
    await expect(page.getByText('Step 2 of 4')).toBeVisible();
    await expect(
      page.getByText('Review your free beta entry and confirm your Beta Pass'),
    ).toBeVisible();
    const confirmEntryButton = page.getByRole('button', { name: 'Confirm Entry' });
    await expect(confirmEntryButton).toBeVisible();
    await confirmEntryButton.click();
    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\/success$/);
    await expect(page.getByText('Step 3 of 4')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Continue to Build Your Board' })).toBeVisible();

    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');
    await expect(page.getByText('Step 4 of 4')).toBeVisible();
    await expect(page.getByText('Step 4: Build Your Board')).toBeVisible();
  });

  signedInTest('controlled test entry creates one default board and routes to Build Your Board without paid count movement', async ({ page }) => {
    await allowControlledTestEntry(page);
    await updateContestFixture('week-1-qb-passing-yards', {
      entryFeeCents: 0,
      entryCount: 0,
      paidEntryCount: 0,
      status: 'open',
      visibilityStatus: 'visible',
    });
    const beforeCounts = await readContestCounts('week-1-qb-passing-yards');

    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/payment');
    await page.getByRole('button', { name: 'Confirm Entry' }).click();

    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\/success$/);
    await page.getByRole('link', { name: 'Continue to Build Your Board' }).click();
    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\/lineup$/);
    await expect(page.locator('h1').filter({ hasText: 'Build Your Board' })).toBeVisible();
    await expect(page.locator('[data-lineup-player]')).toHaveCount(10);

    const savedStore = JSON.parse(await readFile(entryStorePath, 'utf8')) as {
      entries: Array<{
        contestId: string;
        userId: string;
        lineupOrder: string[];
        source: string;
      }>;
    };
    const savedEntries = savedStore.entries.filter(
      (entry) => entry.contestId === 'week-1-qb-passing-yards' && entry.userId === defaultE2eViewerUserId,
    );
    const afterCounts = await readContestCounts('week-1-qb-passing-yards');

    expect(savedEntries).toHaveLength(1);
    expect(savedEntries[0]?.lineupOrder).toEqual(demoSavedLineup);
    expect(savedEntries[0]?.source).toBe('default_assigned');
    expect(afterCounts.entryCount).toBe(beforeCounts.entryCount + 1);
    expect(afterCounts.paidEntryCount).toBe(0);

    await page.goto('/contests/week-1-qb-passing-yards/payment');
    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\/success$/);
    const reusedCounts = await readContestCounts('week-1-qb-passing-yards');

    expect(reusedCounts.entryCount).toBe(afterCounts.entryCount);
    expect(reusedCounts.paidEntryCount).toBe(0);
  });

  signedInTest('ready signed-in users can open the board builder from the protected route', async ({ page }) => {
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

    await expect(page.locator('h1').filter({ hasText: 'Build Your Board' })).toBeVisible();
    const rankedLineupCard = page.locator('.section-card').filter({ has: page.getByRole('heading', { name: 'Your Board' }) });

    await expect(rankedLineupCard.locator('.status-pill').first()).toHaveText('10/10 Ranked');
    await expect(page.getByRole('button', { name: 'Save Your Board' })).toBeDisabled();
    await expect(page.locator('[data-lineup-player]').first()).toContainText('#1');
    await expect(page.locator('[data-lineup-player]').first()).toContainText('Josh Allen (BUF)');
    await expect(page.locator('[data-lineup-player]').first()).toContainText('vs. BAL');
    await expect(page.getByText(/Fill any open board spots from the player pool/i)).toBeVisible();
    await expect(page.getByText('Available Quarterbacks')).toBeVisible();
    await expect(page.getByText('C.J. Stroud')).toBeVisible();
  });

  signedInTest('ready signed-in users can reorder the ranked board with keyboard-accessible controls', async ({ page }) => {
    await seedEntryStore([
      {
        entryId: 'demo-entry-keyboard-rank',
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
    await expect(page.locator('[data-lineup-client-ready="true"]')).toBeVisible();
    await page.getByRole('button', { name: 'Move Josh Allen down one rank' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-lineup-player]').first()).toContainText('Joe Burrow');
    await expect(page.locator('[data-lineup-player]').nth(1)).toContainText('Josh Allen');
    await expect(page.getByRole('button', { name: 'Save Your Board' })).toBeEnabled();

    await page.getByRole('button', { name: 'Move Josh Allen up one rank' }).focus();
    await page.keyboard.press('Enter');

    await expect(page.locator('[data-lineup-player]').first()).toContainText('Josh Allen');
    await expect(page.locator('[data-lineup-player]').nth(1)).toContainText('Joe Burrow');
  });

  signedInTest('locked zero-fee contests block new entries and board mutation while preserving the saved board', async ({ page }) => {
    await updateContestFixture('week-1-qb-passing-yards', {
      entryFeeCents: 0,
      entryCount: 1,
      paidEntryCount: 0,
      status: 'locked',
      visibilityStatus: 'visible',
    });
    await seedEntryStore([
      {
        entryId: 'demo-entry-free-test-locked',
        contestId: 'week-1-qb-passing-yards',
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
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');

    await expect(page.getByText('Board Locked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locked - Read Only' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Joe Burrow board position is locked' })).toBeDisabled();

    const saveAttempt = await page.evaluate(async (order) => {
      const response = await fetch('/api/contests/week-1-qb-passing-yards/lineup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ order }),
      });
      const payload = await response.json();

      return {
        status: response.status,
        message: payload.message,
      };
    }, demoSavedLineup);

    expect(saveAttempt).toEqual({
      status: 409,
      message: 'This contest is locked, so your board is now read-only.',
    });

    await page.context().addCookies([
      {
        name: e2eAuthCookieName,
        value: secondInternalTestEligibilityCookie,
        url: appUrl,
      },
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/payment');
    await page.getByRole('button', { name: 'Confirm Entry' }).click();
    await expect(page).toHaveURL(/\/contests\/week-1-qb-passing-yards\?status=error/);
    await expect(page).toHaveURL(/message=This(%20|\+)contest(%20|\+)is(%20|\+)no(%20|\+)longer(%20|\+)accepting(%20|\+)entries/);
  });

  signedInTest('ready signed-in users see the full 20-player pool on the board builder screen', async ({ page }) => {
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
    const rankedLineupCard = page.locator('.section-card').filter({ has: page.getByRole('heading', { name: 'Your Board' }) });

    await expect(rankedLineupCard.locator('.status-pill').first()).toHaveText('10/10 Ranked');
    await expect(page.getByText('10 Left in Pool')).toBeVisible();
    await expect(page.getByText('C.J. Stroud (HOU)')).toBeVisible();
    await expect(page.getByText('vs. IND')).toBeVisible();
    await expect(page.getByText('Patrick Mahomes')).toBeVisible();
  });
});
