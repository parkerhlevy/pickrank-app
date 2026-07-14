import { expect, test } from '@playwright/test';

test('homepage loads as a landing page with waitlist forms and no bottom nav', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('img', { name: 'PickRank' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '15 players. Pick 10. Rank them.' })).toBeVisible();
  const waitlistButtons = page.getByRole('button', { name: 'Join the waitlist' });
  await expect(waitlistButtons).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Join the waitlist' })).toHaveCount(0);
  await expect(page.locator('a[href="/auth"]')).toHaveCount(0);
  await expect(page.getByLabel('Email address')).toHaveCount(2);
  await expect(page.getByText('Enter your email and we’ll let you know when PickRank is ready to play.')).toHaveCount(2);
  await expect(page.getByText('By joining, you agree to receive PickRank launch emails. Unsubscribe anytime.')).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Browse Open Contests' })).toHaveCount(0);
  await expect(page.getByText('See PickRank in action')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Learn the game in 34 seconds' })).toBeVisible();
  const walkthroughVideo = page.getByLabel('PickRank product walkthrough video');
  await expect(walkthroughVideo).toBeVisible();
  await expect(walkthroughVideo).toHaveAttribute('poster', '/marketing/pickrank-landing-thumb.png');
  await expect(page.locator('video source')).toHaveAttribute('src', '/marketing/pickrank-landing-video-locked-in-final.mp4');
  await expect(page.getByText('Walkthrough video coming soon')).toHaveCount(0);
  await expect(page.getByText('Understand the weekly contest structure before you commit to the flow.')).toHaveCount(0);
  await expect(page.getByRole('navigation')).toHaveCount(0);
});

test('bottom nav still renders on core app routes', async ({ page }) => {
  await page.goto('/contests');

  const navigation = page.getByRole('navigation');

  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Contests' })).toBeVisible();
});
