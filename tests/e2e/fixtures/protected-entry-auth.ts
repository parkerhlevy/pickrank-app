import { test as base } from '@playwright/test';
import {
  defaultE2eViewerUserId,
  e2eAuthCookieName,
  encodeE2eAuthCookie,
} from '@/lib/viewer-identity';
import { e2eAppUrl } from '../support/navigation';

const readyAccountCookieValue = encodeE2eAuthCookie({
  email: 'playwright@pickrank.test',
  username: 'playwright_user',
  displayName: 'playwright_user',
  emailConfirmedAt: '2026-06-29T00:00:00.000Z',
  userId: defaultE2eViewerUserId,
  ageConfirmed: true,
  dateOfBirth: '1990-01-01',
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

    if (baseURL !== e2eAppUrl) {
      throw new Error(`The protected entry auth fixture requires ${e2eAppUrl}. Received ${baseURL}.`);
    }

    await context.addCookies([
      {
        name: e2eAuthCookieName,
        value: readyAccountCookieValue,
        url: e2eAppUrl,
      },
    ]);

    await run(context);
  },
});
