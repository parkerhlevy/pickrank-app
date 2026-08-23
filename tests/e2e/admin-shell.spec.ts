import { expect, test } from '@playwright/test';
import { e2eAuthCookieName, encodeE2eAuthCookie } from '@/lib/viewer-identity';

const appUrl = 'http://127.0.0.1:3000';
const operatorCookieValue = encodeE2eAuthCookie({
  email: 'operator@pickrank.test',
  username: 'operator_user',
  displayName: 'Operator User',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: '99999999-9999-4999-8999-999999999999',
  roleSlugs: ['contest_operator'],
});

test('signed-out admin root routes through the protected contest workspace', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/auth\?.*next=%2Fadmin%2Fcontests/);
});

test('contest operators get a wide admin-only workspace with actionable navigation', async ({ page }) => {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: operatorCookieValue,
      url: appUrl,
    },
  ]);

  await page.goto('/admin/contests');
  await expect(page).toHaveURL('/admin/contests');

  const adminShell = page.locator('[data-admin-shell]');
  const adminNavigation = page.getByRole('navigation', { name: 'Admin navigation' });

  await expect(adminShell).toBeVisible();
  await expect(adminNavigation.getByRole('link', { name: /Contest operations/ })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await expect(adminNavigation.getByRole('link', { name: /Internal eligibility/ })).toHaveAttribute(
    'href',
    '/admin/eligibility',
  );
  await expect(page.getByRole('heading', { name: 'Test Entry Readiness' })).toBeVisible();
  await expect(page.getByText('Read-only operator visibility for free/test entries')).toBeVisible();
  await expect(page.getByText('Saved records').first()).toBeVisible();
  const removeContestControl = page.getByTestId('remove-contest-week-1-qb-passing-yards');
  await expect(removeContestControl.getByText('Remove contest', { exact: true })).toBeVisible();
  await expect(page.getByText('RETIRE BETA')).toHaveCount(0);
  await removeContestControl.locator('summary').click();
  await expect(removeContestControl.getByText('Remove Week 1 QB Passing Yards?')).toBeVisible();
  await expect(removeContestControl.getByRole('button', { name: 'Yes, remove contest' })).toBeVisible();
  await expect(page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Home' }) })).toHaveCount(0);

  const desktopBox = await adminShell.boundingBox();
  expect(desktopBox?.width).toBeGreaterThan(900);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();

  await expect(adminNavigation.getByRole('link', { name: /Contest operations/ })).toBeVisible();
  await expect(adminNavigation.getByRole('link', { name: /Internal eligibility/ })).toBeVisible();
  await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390);
});
