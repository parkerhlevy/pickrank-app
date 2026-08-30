import { expect, test } from '@playwright/test';
import { e2eAuthCookieName, encodeE2eAuthCookie } from '@/lib/viewer-identity';
import { e2eAppUrl, expectPagePath } from './support/navigation';

const operatorCookieValue = encodeE2eAuthCookie({
  email: 'operator@pickrank.test',
  username: 'operator_user',
  displayName: 'Operator User',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: '99999999-9999-4999-8999-999999999999',
  roleSlugs: ['contest_operator'],
});

test('signed-out admin root routes through the protected operator overview', async ({ page }) => {
  await page.goto('/admin');

  await expect(page).toHaveURL(/\/auth\?.*next=%2Fadmin/);
});

test('contest operators get a wide admin-only workspace with actionable navigation', async ({ page }, testInfo) => {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: operatorCookieValue,
      url: e2eAppUrl,
    },
  ]);

  await page.goto('/admin');
  await expectPagePath(page, '/admin');
  await expect(page.getByRole('heading', { name: 'Operator overview' })).toBeVisible();
  await expect(workspaceLink(page, 'User data')).toHaveAttribute('href', '/admin/users');
  await expect(workspaceLink(page, 'Evidence health')).toHaveAttribute('href', '/admin/evidence');
  await attachReviewScreenshot(page, testInfo, 'admin-overview-desktop');

  await page.goto('/admin/contests');
  await expectPagePath(page, '/admin/contests');

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
  await expect(adminNavigation.getByRole('link', { name: /User data/ })).toHaveAttribute('href', '/admin/users');
  await expect(adminNavigation.getByRole('link', { name: /Evidence/ })).toHaveAttribute('href', '/admin/evidence');
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

test('contest operators can investigate evidence by user and contest', async ({ page }, testInfo) => {
  await page.context().addCookies([
    {
      name: e2eAuthCookieName,
      value: operatorCookieValue,
      url: e2eAppUrl,
    },
  ]);

  await page.goto('/admin/users');
  await expectPagePath(page, '/admin/users');
  await expect(page.getByRole('heading', { name: 'User data' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'All users' })).toBeVisible();
  await expect(page.getByText('Showing 1–1 of 1 user')).toBeVisible();
  await expect(page.getByLabel('Account')).toHaveValue('all');
  await expect(page.getByLabel('Eligibility')).toHaveValue('all');
  await expect(page.getByLabel('Evidence')).toHaveValue('all');
  await expect(page.getByLabel('Sort')).toHaveValue('recent');
  await attachReviewScreenshot(page, testInfo, 'admin-all-users-desktop');
  await page.getByRole('link', { name: 'Demo Entrant' }).click();
  await expect(page.getByRole('heading', { name: 'Demo Entrant' })).toBeVisible();
  await expect(page.getByText('Saved board history')).toBeVisible();
  await attachReviewScreenshot(page, testInfo, 'admin-user-investigation-desktop');

  await page.getByRole('link', { name: 'Week 1 QB Passing Yards' }).click();
  await expect(page.getByRole('heading', { name: 'Week 1 QB Passing Yards' })).toBeVisible();
  await expect(page.getByText('Entrants and saved boards')).toBeVisible();
  await attachReviewScreenshot(page, testInfo, 'admin-contest-investigation-desktop');

  await page.goto('/admin/evidence');
  await expectPagePath(page, '/admin/evidence');
  await expect(page.getByRole('heading', { name: 'Evidence health' })).toBeVisible();
  await attachReviewScreenshot(page, testInfo, 'admin-evidence-health-desktop');
});

async function attachReviewScreenshot(
  page: import('@playwright/test').Page,
  testInfo: import('@playwright/test').TestInfo,
  name: string,
) {
  await testInfo.attach(name, {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
}

function workspaceLink(page: import('@playwright/test').Page, heading: string) {
  return page
    .getByRole('article')
    .filter({ has: page.getByRole('heading', { name: heading }) })
    .getByRole('link', { name: 'Open workspace' });
}
