import { expect } from '@playwright/test';
import { test } from './fixtures/protected-entry-auth';

test('profile status notices use distinct tones and beta-safe copy', async ({ page }) => {
  await page.goto('/profile?status=profile-saved');

  await expect(page.locator('.notice-panel-info')).toContainText('Profile saved');
  await expect(page.locator('.notice-panel-info')).toContainText('Your account has been updated.');
  await expect(page.locator('.notice-panel-success')).toContainText('Entry status');
  await expect(page.locator('.notice-panel-success')).toContainText('Your entry details are saved.');
  await expect(page.getByText('Beta Pass has no cash value.', { exact: false })).toHaveCount(0);
});
