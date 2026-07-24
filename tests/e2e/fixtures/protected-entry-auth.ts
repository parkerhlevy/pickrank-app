import { test as base } from '@playwright/test';
import { defaultE2eViewerUserId, e2eAuthCookieName } from '@/lib/viewer-identity';

const readyAccountCookieValue = JSON.stringify({
  email: 'playwright@pickrank.test',
  username: 'playwright_user',
  displayName: 'playwright_user',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: defaultE2eViewerUserId,
  ageConfirmed: true,
  jurisdiction: 'CA',
  termsAcceptedAt: '2026-06-29T00:00:00.000Z',
  privacyPolicyAcceptedAt: '2026-06-29T00:00:00.000Z',
  eligibilityStatus: 'eligible',
});

export const test = base.extend({
  context: async ({ context, baseURL }, run) => {
    if (!baseURL) {
      throw new Error('A baseURL is required for the protected entry auth fixture.');
    }

    await context.addCookies([
      {
        name: e2eAuthCookieName,
        value: readyAccountCookieValue,
        url: baseURL,
      },
      {
        name: e2eAuthCookieName,
        value: readyAccountCookieValue,
        url: 'http://localhost:3000',
      },
    ]);

    await run(context);
  },
});
