import { expect, test } from '@playwright/test';
import { test as signedInTest } from './fixtures/protected-entry-auth';

const appUrl = 'http://127.0.0.1:3000';

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
    await expect(page.getByRole('link', { name: 'Confirm Entry' })).toBeVisible();

    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'entered' }),
        url: appUrl,
      },
      {
        name: 'pickrank_demo_entry_data',
        value: JSON.stringify({
          'week-1-qb-passing-yards': {
            entryId: 'demo-entry-open',
            contestId: 'week-1-qb-passing-yards',
            lineupOrder: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Kirk Cousins', 'Justin Herbert', 'Jalen Hurts', 'Lamar Jackson', 'Jordan Love', 'Dak Prescott', 'Brock Purdy'],
            lastSavedAt: null,
            source: 'default',
            createdAt: '2026-06-22T00:00:00.000Z',
            updatedAt: '2026-06-22T00:00:00.000Z',
          },
        }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/success');
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
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
      {
        name: 'pickrank_demo_entry_data',
        value: JSON.stringify({
          'week-1-qb-passing-yards': {
            entryId: 'demo-entry-open',
            contestId: 'week-1-qb-passing-yards',
            lineupOrder: ['Josh Allen', 'Joe Burrow', 'Derek Carr', 'Kirk Cousins', 'Justin Herbert', 'Jalen Hurts', 'Lamar Jackson', 'Jordan Love', 'Dak Prescott', 'Brock Purdy'],
            lastSavedAt: null,
            source: 'default_assigned',
            createdAt: '2026-06-22T00:00:00.000Z',
            updatedAt: '2026-06-22T00:00:00.000Z',
          },
        }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-qb-passing-yards/lineup');

    await expect(page.locator('h1').filter({ hasText: 'Build Your Lineup' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save Lineup' })).toBeDisabled();
    await expect(page.locator('[data-lineup-player]').first()).toContainText('1. Josh Allen');
    await expect(page.getByText(/Press and hold the/i)).toBeVisible();
  });

  signedInTest('locked contests show the saved lineup in read-only mode', async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'pickrank_demo_entry_state',
        value: JSON.stringify({ 'week-1-sunday-qb-passing-yards': 'lineup' }),
        url: appUrl,
      },
      {
        name: 'pickrank_demo_entry_data',
        value: JSON.stringify({
          'week-1-sunday-qb-passing-yards': {
            entryId: 'demo-entry-locked',
            contestId: 'week-1-sunday-qb-passing-yards',
            lineupOrder: ['Joe Burrow', 'Josh Allen', 'Derek Carr', 'Kirk Cousins', 'Justin Herbert', 'Jalen Hurts', 'Lamar Jackson', 'Jordan Love', 'Dak Prescott', 'Brock Purdy'],
            lastSavedAt: '2026-06-19T10:05:00.000Z',
            source: 'user_saved',
            createdAt: '2026-06-19T10:00:00.000Z',
            updatedAt: '2026-06-19T10:05:00.000Z',
          },
        }),
        url: appUrl,
      },
    ]);

    await page.goto('/contests/week-1-sunday-qb-passing-yards/lineup');

    await expect(page.getByText('Lineup Locked')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Locked - Read Only' })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Joe Burrow lineup position is locked' })).toBeDisabled();
  });
});
