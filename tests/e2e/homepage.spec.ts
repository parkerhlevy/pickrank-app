import { expect, test } from '@playwright/test';

test('homepage loads and links to contests', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'PickRank' })).toBeVisible();
  await expect(page.getByText('Open Contests')).toBeVisible();

  await page.getByRole('link', { name: 'View Contests' }).click();
  await expect(page).toHaveURL('/contests');
  await expect(page.getByRole('heading', { name: 'Open Contests', exact: true })).toBeVisible();
});
