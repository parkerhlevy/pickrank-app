import { expect, test } from '@playwright/test';

test('homepage loads and links to contests', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'PickRank' })).toBeVisible();
  await expect(page.getByText('App shell ready')).toBeVisible();

  await page.getByRole('link', { name: 'View Contests' }).click();
  await expect(page).toHaveURL('/contests');
  await expect(page.getByRole('heading', { name: 'Contests' })).toBeVisible();
});
