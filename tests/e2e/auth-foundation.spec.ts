import { expect, test } from '@playwright/test';

test('auth and profile show the Phase 1 setup states when Supabase is not configured', async ({ page }) => {
  await page.goto('/auth');

  await expect(page.getByRole('heading', { name: 'Account Access Preview' })).toBeVisible();
  await expect(page.getByText('Missing environment values')).toBeVisible();
  await expect(page.getByText('NEXT_PUBLIC_SUPABASE_URL')).toBeVisible();
  await expect(page.getByText('NEXT_PUBLIC_SUPABASE_ANON_KEY')).toBeVisible();

  await page.goto('/profile');
  await expect(page.getByRole('heading', { name: 'Account Preview' })).toBeVisible();
  await expect(page.getByText('Create an account or log in to continue to Profile and contest entry.')).toBeVisible();
  await expect(page.getByText('Add Supabase environment values before testing sign-in.')).toBeVisible();
});

test('contest detail sends logged-out users into auth with the intended return path', async ({ page }) => {
  await page.goto('/contests/week-1-sunday-qb-passing-yards');

  const cta = page.getByRole('link', { name: 'Sign Up / Log In to Enter' });

  await expect(cta).toHaveAttribute(
    'href',
    '/auth?next=%2Fcontests%2Fweek-1-sunday-qb-passing-yards%2Fprogress%3Fstage%3Dpayment-review',
  );
});
