import { expect, type Page } from '@playwright/test';

export const e2eAppUrl = 'http://127.0.0.1:3000';

export async function expectPagePath(
  page: Page,
  expectedPath: string,
  options?: { timeout?: number },
) {
  await expect(page).toHaveURL(
    (url) => `${url.pathname}${url.search}${url.hash}` === expectedPath,
    options,
  );
}
