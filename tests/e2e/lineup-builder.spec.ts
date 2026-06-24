import { expect, test } from '@playwright/test';

test('entry screens reinforce the four-step handoff into the lineup builder', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-qb-passing-yards': 'payment-review' }),
      url: 'http://localhost:3000',
    },
  ]);

  await page.goto('http://localhost:3000/contests/week-1-qb-passing-yards/payment');
  await expect(page.getByText('Step 2 of 4')).toBeVisible();
  await expect(page.getByText('Step 2: Payment Review')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Confirm Entry Review' })).toBeVisible();

  await page.context().addCookies([
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-qb-passing-yards': 'entered' }),
      url: 'http://localhost:3000',
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
      url: 'http://localhost:3000',
    },
  ]);

  await page.goto('http://localhost:3000/contests/week-1-qb-passing-yards/success');
  await expect(page.getByText('Step 3 of 4')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Continue to Build Your Lineup' })).toBeVisible();

  await page.context().addCookies([
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
      url: 'http://localhost:3000',
    },
  ]);

  await page.goto('http://localhost:3000/contests/week-1-qb-passing-yards/lineup');
  await expect(page.getByText('Step 4 of 4')).toBeVisible();
  await expect(page.getByText('Step 4: Build Your Lineup')).toBeVisible();
});

test('lineup builder saves through the current entry and persists after reload', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-qb-passing-yards': 'lineup' }),
      url: 'http://localhost:3000',
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
      url: 'http://localhost:3000',
    },
  ]);

  await page.goto('http://localhost:3000/contests/week-1-qb-passing-yards/lineup');

  await expect(page.getByRole('heading', { name: 'Build Your Lineup' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save Lineup' })).toBeDisabled();

  await page.evaluate(() => window.scrollTo(0, 800));

  const dragHandle = page.getByRole('button', { name: 'Press and hold to drag Josh Allen' });
  const targetRow = page.locator('[data-lineup-player="Derek Carr"]');
  const dragHandleBox = await dragHandle.boundingBox();
  const targetRowBox = await targetRow.boundingBox();

  expect(dragHandleBox).not.toBeNull();
  expect(targetRowBox).not.toBeNull();

  const dragHandlePoint = {
    clientX: dragHandleBox!.x + dragHandleBox!.width / 2,
    clientY: dragHandleBox!.y + dragHandleBox!.height / 2,
  };
  const targetPoint = {
    clientX: targetRowBox!.x + targetRowBox!.width / 2,
    clientY: targetRowBox!.y + targetRowBox!.height / 2,
  };

  await dragHandle.evaluate((button, point) => {
    button.dispatchEvent(
      new PointerEvent('pointerdown', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 1,
        ...point,
      }),
    );
  }, dragHandlePoint);

  await page.evaluate((point) => {
    window.dispatchEvent(
      new PointerEvent('pointermove', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 1,
        ...point,
      }),
    );
  }, targetPoint);

  await page.evaluate((point) => {
    window.dispatchEvent(
      new PointerEvent('pointerup', {
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
        button: 0,
        buttons: 0,
        ...point,
      }),
    );
  }, targetPoint);

  await expect(page.locator('[data-lineup-player]').first()).toContainText('1. Joe Burrow');
  await expect(page.getByRole('button', { name: 'Save Lineup' })).toBeEnabled();

  await page.getByRole('button', { name: 'Save Lineup' }).click();

  await expect(page.getByText('Lineup Saved', { exact: true })).toBeVisible();
  await expect(page.getByText('Lineup saved. You can edit your rankings until lock.')).toBeVisible();

  await page.reload();

  await expect(page.locator('[data-lineup-player]').first()).toContainText('1. Joe Burrow');
  await expect(page.getByText(/Last saved at/i)).toBeVisible();
});

test('locked contests show the saved lineup in read-only mode', async ({ page }) => {
  await page.context().addCookies([
    {
      name: 'pickrank_demo_entry_state',
      value: JSON.stringify({ 'week-1-sunday-qb-passing-yards': 'lineup' }),
      url: 'http://localhost:3000',
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
      url: 'http://localhost:3000',
    },
  ]);

  await page.goto('http://localhost:3000/contests/week-1-sunday-qb-passing-yards/lineup');

  await expect(page.getByText('Lineup Locked')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Locked - Read Only' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Joe Burrow lineup position is locked' })).toBeDisabled();
});
