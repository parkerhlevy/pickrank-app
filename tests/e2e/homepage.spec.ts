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
  await expect(page.getByText('Enter your email and we’ll send launch updates before account signup opens.')).toHaveCount(2);
  await expect(page.getByLabel('I agree to receive PickRank launch and product update emails. I can unsubscribe anytime.')).toHaveCount(2);
  await expect(page.getByText('By joining, you agree to receive PickRank launch emails. Unsubscribe anytime.')).toHaveCount(0);
  await expect(page.getByText('Contest-as-Board')).toBeVisible();
  await expect(page.getByText('Skill contest')).toBeVisible();
  await expect(page.getByText('Final-only scoring')).toBeVisible();
  await expect(page.getByText('Early Access Beta').first()).toBeVisible();
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

test('public conversion routes explain the contest mechanics before entry', async ({ page }) => {
  await page.goto('/contests');

  await expect(page.getByRole('heading', { name: 'Open Contests' })).toBeVisible();
  await expect(page.getByText('Find a free beta contest, scan the 15-player slate')).toBeVisible();
  await expect(page.getByText('Pick 10', { exact: true })).toBeVisible();
  await expect(page.getByText('Accuracy wins')).toBeVisible();

  await page.goto('/contests/week-1-qb-passing-yards');

  await expect(page.getByRole('heading', { name: 'Quick Read' })).toBeVisible();
  await expect(page.getByText('What you do')).toBeVisible();
  await expect(page.getByText('How you score')).toBeVisible();
  await expect(page.getByText('When results count')).toBeVisible();

  await page.goto('/how-it-works');

  await expect(page.getByRole('heading', { name: 'Skill-based ranking contests' })).toBeVisible();
  const basics = page.getByLabel('PickRank basics');
  await expect(basics.getByText('Pick 10 from 15')).toBeVisible();
  await expect(basics.getByText('Lower score wins')).toBeVisible();
  await expect(page.getByRole('table')).toBeVisible();
});

test('bottom nav still renders on core app routes', async ({ page }) => {
  await page.goto('/contests');

  const navigation = page.getByRole('navigation');

  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Contests' })).toBeVisible();
});

test('waitlist form requires consent without routing visitors to auth', async ({ page }) => {
  await page.goto('/');

  const emailInput = page.getByLabel('Email address').first();
  const consentCheckbox = page
    .getByLabel('I agree to receive PickRank launch and product update emails. I can unsubscribe anytime.')
    .first();

  await emailInput.fill('fan@example.com');
  await page.getByRole('button', { name: 'Join the waitlist' }).first().click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('You’re on the list.')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account Access' })).toHaveCount(0);
  await expect(consentCheckbox).not.toBeChecked();
  await expect(consentCheckbox).toHaveJSProperty('validity.valid', false);
});

test('auth remains available as a separate protected-flow route', async ({ page }) => {
  await page.goto('/auth');

  await expect(page.getByRole('heading', { name: 'Account Access' })).toBeVisible();
});

test('logged-out leaderboard contest route stays public and final-only', async ({ page }) => {
  await page.goto('/leaderboard?contest=week-1-qb-passing-yards');

  await expect(page.getByRole('heading', { name: 'Leaderboard Opens After Final Scoring' })).toBeVisible();
  await expect(
    page.getByText('This contest is not final yet. Final standings appear only after all games are complete').first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Contest Details' })).toHaveAttribute(
    'href',
    '/contests/week-1-qb-passing-yards',
  );
});
