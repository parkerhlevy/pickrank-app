import { expect, test } from '@playwright/test';

test('homepage loads as a landing page with sign-up CTA and no bottom nav', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('img', { name: 'PickRank' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'A simple new way to compete on NFL knowledge.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign Up' })).toHaveAttribute('href', '/auth');
  await expect(page.getByText('Preview video coming next')).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);

  await page.getByRole('link', { name: 'Sign Up' }).click();
  await expect(page).toHaveURL('/auth');
  await expect(page.getByRole('heading', { name: 'Account Access' })).toBeVisible();
});

test('bottom nav still renders on core app routes', async ({ page }) => {
  await page.goto('/contests');

  const navigation = page.getByRole('navigation');

  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Contests' })).toBeVisible();
});
