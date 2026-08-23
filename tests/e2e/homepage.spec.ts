import { expect, test } from '@playwright/test';

const isPaidPreview = process.env.PICKRANK_EXPERIENCE_MODE === 'paid_preview';

test('homepage loads as a landing page with waitlist forms and no bottom nav', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('img', { name: 'PickRank' })).toBeVisible();
  await expect(page.getByRole('heading', { name: '20 players. Pick 10. Rank them.' })).toBeVisible();
  const waitlistButtons = page.getByRole('button', { name: 'Join the waitlist' });
  await expect(waitlistButtons).toHaveCount(2);
  await expect(page.getByRole('link', { name: 'Join the waitlist' })).toHaveCount(0);
  await expect(page.locator('a[href="/auth"]')).toHaveCount(0);
  await expect(page.getByLabel('Email address')).toHaveCount(2);
  await expect(page.getByText('Enter your email and we’ll send Early Access Beta updates.')).toHaveCount(2);
  await expect(page.getByLabel('I agree to receive PickRank Early Access Beta and product update emails. I can unsubscribe anytime.')).toHaveCount(2);
  await expect(page.getByText('By joining, you agree to receive PickRank launch emails. Unsubscribe anytime.')).toHaveCount(0);
  await expect(page.getByText('Weekly Board Snapshot')).toHaveCount(0);
  await expect(page.getByText('Skill contest')).toHaveCount(0);
  await expect(page.getByText('Final-only scoring')).toHaveCount(0);
  await expect(page.getByText('Free beta contests use a Beta Pass.')).toHaveCount(0);
  await expect(page.getByText('No drafting.')).toBeVisible();
  await expect(page.getByText('No season-long commitment.')).toBeVisible();
  await expect(page.getByText('Easy to play.')).toBeVisible();
  await expect(page.getByText('Harder to master.')).toBeVisible();
  await expect(
    page.getByText(
      'PickRank is launching as an early access beta. Join the waitlist and be among the first to play our contests for free.',
    ),
  ).toBeVisible();
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
  await expect(page.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/legal/terms');
  await expect(page.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/legal/privacy');
  await expect(page.getByRole('link', { name: 'Acceptable use' })).toHaveAttribute('href', '/legal/acceptable-use');
  await expect(page.getByText('Early Access Beta is free to play. No purchase')).toBeVisible();
});

test('public conversion routes explain the contest mechanics before entry', async ({ page }) => {
  await page.goto('/contests');

  await expect(page.getByRole('heading', { name: 'Open contests' })).toBeVisible();
  await expect(page.getByText('Find and enter a contest, evaluate the 20-player pool, and build the most accurate board possible to beat the field.')).toBeVisible();
  await expect(page.getByText('One stat', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Pick 10', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Accuracy wins')).toHaveCount(0);
  await expect(page.getByText('Featured', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Contest Board', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Beta Pass', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Entry Cost', { exact: true })).toHaveCount(0);

  await page.goto('/contests/week-1-qb-passing-yards');

  await expect(page.getByText('Open', { exact: true }).first()).toHaveClass(/bg-emerald-100/);
  await expect(page.getByRole('heading', { name: 'Contest details - Free to play during beta' })).toBeVisible();
  await expect(page.getByText('Early access beta contests have no cash prizes, no payouts, no minimum participants, and no cost to enter.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scoring' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Quick Read' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Beta Result Status' })).toHaveCount(0);
  await expect(page.getByText('Your Board', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Final order', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Lower score wins', { exact: true })).toHaveCount(0);
  const playerPool = page.getByText('Player pool', { exact: true }).last().locator('../../..');
  await expect(playerPool.locator('div.rounded-md')).toHaveCount(20);
  await expect(page.getByText('Beta contest - no payout')).toHaveCount(0);
  await expect(page.getByText('operator proof')).toHaveCount(0);

  await page.goto('/how-it-works');

  await expect(page.getByText('How it works', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Skill-based ranking contests' })).toBeVisible();
  await expect(page.getByText('Public guide', { exact: true })).toHaveCount(0);
  await expect(page.getByText('PickRank asks one question: how well do you know players and their matchups?')).toBeVisible();
  const basics = page.getByLabel('PickRank basics');
  await expect(basics.getByText('Early access beta')).toBeVisible();
  await expect(basics.getByText('Pick 10 from 20')).toBeVisible();
  await expect(
    basics.getByText('Start with the player pool. Pick and rank the top 10 by the contest stat category.'),
  ).toBeVisible();
  await expect(basics.getByText('Lowest score wins')).toBeVisible();
  await expect(basics.getByText('Contests have no payouts or cash prizes during beta period')).toBeVisible();
  const howToEnter = page.getByRole('heading', { name: 'How to enter' }).locator('..').locator('..');
  await expect(howToEnter.getByText('Follow the same path from contest browsing')).toHaveCount(0);
  await expect(howToEnter.getByText('Contests show the stat category that you will be ranking.')).toBeVisible();
  await expect(howToEnter.getByText('Build your board')).toBeVisible();
  await expect(howToEnter.getByText('Pick and rank your top 10 from the 20-player pool.')).toBeVisible();
  await expect(howToEnter.getByText('Get your score')).toBeVisible();
  await expect(howToEnter.getByText('Once all players from the player pool have played')).toBeVisible();
  await expect(howToEnter.getByText('See where you finished')).toBeVisible();
  await expect(howToEnter.getByText('Final leaderboard of all contestants will appear')).toBeVisible();
  await expect(howToEnter.getByRole('link', { name: 'View example' })).toHaveAttribute(
    'href',
    '#rank-differential-example',
  );
  const scoring = page.getByRole('heading', { name: 'How scoring works' }).locator('..').locator('..');
  await expect(scoring.getByText('Current scoring direction for the live MVP contest flow.')).toHaveCount(0);
  await expect(scoring.getByText('Add the distance between each selected rank and the official final rank.')).toBeVisible();
  await expect(scoring.getByText('In case of a tie...')).toBeVisible();
  await expect(scoring.getByText('Most 1 differential picks')).toBeVisible();
  const exampleTable = page.getByRole('table');
  await expect(exampleTable).toBeVisible();
  await expect(exampleTable.getByRole('columnheader', { name: 'Selected player' })).toBeVisible();
  await expect(exampleTable.getByRole('columnheader', { name: 'Your rank' })).toBeVisible();
  await expect(exampleTable.getByRole('columnheader', { name: 'Final rank' })).toBeVisible();
  await expect(exampleTable.getByText('Patrick Mahomes')).toBeVisible();
  await expect(exampleTable.getByText('14th')).toBeVisible();
  await expect(page.getByText('Where to Go Next')).toHaveCount(0);

  await page.goto('/wallet');

  await expect(page.getByRole('heading', { name: 'Beta Pass Status' })).toBeVisible();
  await expect(page.getByText('Beta Pass gives you free entry access')).toBeVisible();
  await expect(page.getByText('Future Paid Balances')).toHaveCount(0);
  await expect(page.getByText('Amount Due Today')).toHaveCount(0);
  await expect(page.getByText('Wallet Actions Not Available')).toHaveCount(0);
});

test('logged-out profile keeps account access and entry guidance compact', async ({ page }) => {
  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Create your PickRank account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
  const profileHowItWorksLink = page.getByRole('link', { name: 'How it works' });
  await expect(profileHowItWorksLink).toHaveAttribute('href', '/how-it-works');
  await expect(profileHowItWorksLink).toHaveClass(/h-9/);
  await expect(profileHowItWorksLink).toHaveClass(/border-slate-200/);
  await expect(page.getByRole('link', { name: 'Contact account support' })).toHaveAttribute(
    'href',
    'mailto:support@pickrankgames.com',
  );
  await expect(page.getByRole('heading', { name: 'Entry Readiness' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Beta Entry Readiness' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Contest Identity' })).toHaveCount(0);
  await expect(page.getByText('Paid-entry status')).toHaveCount(0);
  await expect(page.getByText('KYC placeholder')).toHaveCount(0);
  await expect(page.getByText('Withdrawal verification')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account Wallet' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'View Wallet Details' })).toHaveCount(0);
});

test('mobile beta public cleanup pages stay readable without paid clutter', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/contests');

  await expect(page.getByRole('heading', { name: 'Open contests' })).toBeVisible();
  await expect(page.getByText('Contest Board', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Featured', { exact: true })).toHaveCount(0);

  await page.goto('/contests/week-1-qb-passing-yards');

  await expect(page.getByRole('heading', { name: 'Contest details - Free to play during beta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Scoring' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Beta Result Status' })).toHaveCount(0);
  await expect(page.getByText('Your Board', { exact: true })).toHaveCount(0);
  await expect(page.getByText('Beta contest - no payout')).toHaveCount(0);

  await page.goto('/wallet');

  await expect(page.getByRole('heading', { name: 'Beta Pass Status' })).toBeVisible();
  await expect(page.getByText('Future Paid Balances')).toHaveCount(0);
  await expect(page.getByText('Amount Due Today')).toHaveCount(0);

  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Create your PickRank account' })).toBeVisible();
  await expect(page.getByText('Paid-entry status')).toHaveCount(0);
  await expect(page.getByText('KYC placeholder')).toHaveCount(0);
  await expect(page.getByText('Withdrawal verification')).toHaveCount(0);
});

test('paid preview keeps future wallet surfaces available outside production', async ({ page }) => {
  test.skip(!isPaidPreview, 'Paid-preview verification runs with PICKRANK_EXPERIENCE_MODE=paid_preview.');

  await page.goto('/wallet');

  await expect(page.getByRole('heading', { name: 'PickRank Wallet' })).toBeVisible();
  await expect(page.getByText('Future Paid Balances')).toBeVisible();
  await expect(page.getByText('Amount Due Today')).toBeVisible();
  await expect(page.getByText('Wallet actions are not live yet')).toBeVisible();

  await page.goto('/profile');

  await expect(page.getByRole('heading', { name: 'Account Wallet' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View Wallet Details' })).toBeVisible();
});

test('bottom nav still renders on core app routes', async ({ page }) => {
  await page.goto('/contests');

  const navigation = page.getByRole('navigation');

  await expect(navigation).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Home' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Contests' })).toBeVisible();
  await expect(navigation.getByRole('link', { name: 'Results' })).toHaveAttribute('href', '/leaderboard');
  await expect(navigation.getByRole('link', { name: 'Leaderboard' })).toHaveCount(0);
});

test('desktop and mobile static public pages use the responsive public shell', async ({ page }) => {
  const routes = ['/', '/how-it-works', '/profile', '/leaderboard'];

  await page.setViewportSize({ width: 1440, height: 900 });

  for (const route of routes) {
    await page.goto(route);
    const mainBox = await page.locator('main').boundingBox();
    expect(mainBox?.width).toBeGreaterThan(800);
  }

  await page.setViewportSize({ width: 390, height: 844 });

  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator('html')).toHaveJSProperty('scrollWidth', 390);

    if (route === '/') {
      await expect(page.getByRole('navigation')).toHaveCount(0);
    } else {
      await expect(page.getByRole('navigation').getByRole('link', { name: 'Results' })).toHaveAttribute(
        'href',
        '/leaderboard',
      );
    }
  }
});

test('waitlist form requires consent without routing visitors to auth', async ({ page }) => {
  await page.goto('/');

  const emailInput = page.getByLabel('Email address').first();
  const consentCheckbox = page
    .getByLabel('I agree to receive PickRank Early Access Beta and product update emails. I can unsubscribe anytime.')
    .first();

  await emailInput.fill('fan@example.com');
  await page.getByRole('button', { name: 'Join the waitlist' }).first().click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText('You’re on the list.')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Account settings' })).toHaveCount(0);
  await expect(consentCheckbox).not.toBeChecked();
  await expect(consentCheckbox).toHaveJSProperty('validity.valid', false);
});

test('auth remains available as a separate protected-flow route', async ({ page }) => {
  await page.goto('/auth?status=signed-out&next=%2Fprofile');

  await expect(page.getByRole('heading', { name: 'Account settings' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Google sign-in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Email sign-in' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'How PickRank uses your information' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Beta Terms' })).toHaveAttribute('href', '/legal/terms');
  await expect(page.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/legal/privacy');
  await expect(page.getByText("We'll send a sign-in link to your inbox.")).toHaveCount(0);
  await expect(page.getByText('Beta Pass has no cash value.', { exact: false })).toHaveCount(0);
  await expect(page.getByText('No payouts or cash prizes are available during beta.')).toBeVisible();
  await expect(page.getByText('Primary low-friction sign-in path for preserving contest-entry intent.')).toHaveCount(0);
  await expect(page.getByText('Sign in by email if you do not want to use Google.')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Before Beta Entry' })).toHaveCount(0);
});

test('legal terms and privacy pages are available with beta-ready details', async ({ page }) => {
  const staleAgeCopyPattern = new RegExp(String.raw`1${3}\+|under ${13}`, 'i');

  await page.goto('/legal/terms');

  await expect(page.getByRole('heading', { name: 'Beta Terms' })).toBeVisible();
  await expect(page.getByText('Effective August 9, 2026. Last updated August 11, 2026.')).toBeVisible();
  await expect(page.getByText('PickRank is operated by Playground Sports, LLC')).toBeVisible();
  await expect(page.getByText('support@pickrankgames.com')).toHaveCount(2);
  await expect(page.getByText('No purchase, entry fee, deposit, payout, withdrawal, cash prize')).toBeVisible();
  await expect(page.getByText('at least 18 years old')).toBeVisible();
  await expect(page.getByText(staleAgeCopyPattern)).toHaveCount(0);
  await expect(page.getByText('These Beta Terms are governed by Washington law')).toBeVisible();
  await expect(page.getByText('finalize beta results within 24 hours after the last slate game ends')).toBeVisible();

  await page.goto('/legal/beta-rules');

  await expect(page.getByRole('heading', { name: 'Beta contest rules', exact: true })).toBeVisible();
  await expect(page.getByText('confirmed 18+ beta eligibility')).toBeVisible();
  await expect(page.getByText('finalize beta results within 24 hours after the last slate game ends')).toBeVisible();
  await expect(page.getByText('There is no cash-prize cancellation threshold during free beta')).toBeVisible();
  await expect(page.getByText(staleAgeCopyPattern)).toHaveCount(0);

  await page.goto('/legal/acceptable-use');

  await expect(page.getByRole('heading', { name: 'Acceptable Use Policy' })).toBeVisible();
  await expect(page.getByText('Free beta contest integrity')).toBeVisible();
  await expect(page.getByText('18+ beta age gate')).toBeVisible();
  await expect(page.getByText('You may create and use one PickRank account.')).toBeVisible();
  await expect(page.getByText('Do not coordinate entries or share a board')).toBeVisible();
  await expect(page.getByText(/lineup/i)).toHaveCount(0);
  await expect(page.getByText('support@pickrankgames.com')).toBeVisible();

  await page.goto('/legal/privacy');

  await expect(page.getByRole('heading', { name: 'Privacy Policy' })).toBeVisible();
  await expect(page.getByText('Effective August 9, 2026. Last updated August 11, 2026.')).toBeVisible();
  await expect(page.getByText('date of birth, state, Beta Terms acceptance')).toBeVisible();
  await expect(page.getByText('at least 18 years old')).toBeVisible();
  await expect(page.getByText('Users can request account deletion')).toBeVisible();
  await expect(page.getByText('within 30 days')).toBeVisible();
  await expect(page.getByText(staleAgeCopyPattern)).toHaveCount(0);
});

test('logged-out Results route stays public and waits for confirmed final scoring', async ({ page }) => {
  await page.goto('/leaderboard?contest=week-1-qb-passing-yards');

  await expect(page.getByRole('heading', { name: 'Results', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Results not ready' })).toBeVisible();
  await expect(
    page.getByText('This contest is not final yet. Final standings appear only after all games are complete').first(),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'View contest details' })).toHaveAttribute(
    'href',
    '/contests/week-1-qb-passing-yards',
  );
});
