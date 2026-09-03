import { expect } from '@playwright/test';
import { e2eAuthCookieName, encodeE2eAuthCookie } from '@/lib/viewer-identity';
import { test } from './fixtures/protected-entry-auth';
import { e2eAppUrl } from './support/navigation';

test('profile status notices use distinct tones and beta-safe copy', async ({ page }) => {
  await page.goto('/profile?status=profile-saved');

  await expect(page.getByRole('heading', { name: 'My Stats' })).toBeVisible();
  await expect(page.locator('.notice-panel-info')).toContainText('Profile saved');
  await expect(page.locator('.notice-panel-info')).toContainText('Your Profile has been updated.');
  await expect(page.locator('.notice-panel-success')).toContainText('Entry status');
  await expect(page.locator('.notice-panel-success')).toContainText('Your entry details are saved.');
  await expect(page.getByText('Beta Pass has no cash value.', { exact: false })).toHaveCount(0);
});

test('a first-time player completes all missing Profile fields in one form', async ({ context, page }) => {
  await context.addCookies([
    {
      name: e2eAuthCookieName,
      value: encodeE2eAuthCookie({
        email: 'new-player@pickrank.test',
        username: '',
        emailConfirmedAt: '2026-08-29T00:00:00.000Z',
      }),
      url: e2eAppUrl,
    },
  ]);
  await page.goto('/profile?next=%2Fcontests');

  await expect(page.getByRole('heading', { name: 'Profile', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Finish your Profile' })).toBeVisible();
  await expect(page.getByText('Complete the missing fields once, then continue to Contests.')).toBeVisible();
  await expect(page.getByLabel('Username')).toBeVisible();
  await expect(page.getByLabel('State / jurisdiction')).toBeVisible();
  await expect(page.getByLabel('Date of birth')).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /PickRank Beta Terms/ })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /PickRank Privacy Policy/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Complete Profile' })).toHaveCount(1);
  await expect(page.getByRole('heading', { name: 'Finish account setup' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Complete your profile' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account settings' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'My Stats' })).toHaveCount(0);
});

test('a complete returning player continues from Profile sign-in to Contests', async ({ page }) => {
  await page.goto('/auth/continue?next=%2Fprofile');

  await expect(page).toHaveURL(/\/contests$/);
  await expect(page.getByRole('heading', { name: 'Open contests' })).toBeVisible();
});

test('Profile completion shows a clear ready-to-play confirmation on Contests', async ({ page }) => {
  await page.goto('/contests?status=profile-complete');

  await expect(page.locator('.notice-panel-success')).toContainText('Profile complete');
  await expect(page.locator('.notice-panel-success')).toContainText("You're ready to play. Choose a contest to enter.");
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
