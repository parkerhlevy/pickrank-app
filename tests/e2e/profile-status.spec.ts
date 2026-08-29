import { expect } from '@playwright/test';
import { e2eAuthCookieName, encodeE2eAuthCookie } from '@/lib/viewer-identity';
import { test } from './fixtures/protected-entry-auth';
import { e2eAppUrl } from './support/navigation';

test('profile status notices use distinct tones and beta-safe copy', async ({ page }) => {
  await page.goto('/profile?status=profile-saved');

  await expect(page.locator('.notice-panel-info')).toContainText('Profile saved');
  await expect(page.locator('.notice-panel-info')).toContainText('Your account has been updated.');
  await expect(page.locator('.notice-panel-success')).toContainText('Entry status');
  await expect(page.locator('.notice-panel-success')).toContainText('Your entry details are saved.');
  await expect(page.getByText('Beta Pass has no cash value.', { exact: false })).toHaveCount(0);
});

for (const { viewportName, viewport } of [
  { viewportName: 'desktop', viewport: { width: 1280, height: 900 } },
  { viewportName: 'mobile', viewport: { width: 390, height: 844 } },
]) {
  test(`Profile legal links preserve unfinished entry details on ${viewportName}`, async ({ context, page }) => {
    await page.setViewportSize(viewport);
    await context.addCookies([
      {
        name: e2eAuthCookieName,
        value: encodeE2eAuthCookie({
          email: 'incomplete-profile@pickrank.test',
          username: 'incomplete_profile',
          emailConfirmedAt: '2026-08-26T00:00:00.000Z',
        }),
        url: e2eAppUrl,
      },
    ]);
    await page.goto('/profile');

    const jurisdiction = page.getByLabel('State / jurisdiction');
    const dateOfBirth = page.getByLabel('Date of birth');
    const termsCheckbox = page.getByRole('checkbox', { name: /PickRank Beta Terms/ });
    const privacyCheckbox = page.getByRole('checkbox', { name: /PickRank Privacy Policy/ });
    const termsLink = page.getByRole('link', { name: 'PickRank Beta Terms (opens in a new tab)' });
    const privacyLink = page.getByRole('link', { name: 'PickRank Privacy Policy (opens in a new tab)' });

    await expect(jurisdiction).toHaveAttribute('aria-describedby', 'jurisdiction-purpose');
    await expect(
      page.getByText('PickRank uses your state to determine which contest rules apply to you.'),
    ).toBeVisible();
    await jurisdiction.selectOption('CA');
    await dateOfBirth.fill('1990-01-01');
    await termsCheckbox.check();
    await privacyCheckbox.check();
    await expect(termsLink).toHaveAttribute('target', '_blank');
    await expect(termsLink).toHaveAttribute('rel', 'noopener noreferrer');
    await expect(privacyLink).toHaveAttribute('target', '_blank');
    await expect(privacyLink).toHaveAttribute('rel', 'noopener noreferrer');

    for (const { heading, link } of [
      { heading: 'Beta Terms', link: termsLink },
      { heading: 'Privacy Policy', link: privacyLink },
    ]) {
      const legalPagePromise = context.waitForEvent('page');
      await link.click();
      const legalPage = await legalPagePromise;

      await expect(legalPage.getByRole('heading', { name: heading })).toBeVisible();
      await legalPage.close();
      await expect(jurisdiction).toHaveValue('CA');
      await expect(dateOfBirth).toHaveValue('1990-01-01');
      await expect(termsCheckbox).toBeChecked();
      await expect(privacyCheckbox).toBeChecked();
    }
  });
}
