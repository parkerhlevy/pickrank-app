import { afterEach, describe, expect, it } from 'vitest';
import { getE2eViewerIdentity } from '../../lib/viewer-identity';

describe('viewer identity', () => {
  afterEach(() => {
    delete process.env.PICKRANK_E2E_AUTH;
  });

  it('reads a ready signed-in identity from the e2e auth cookie when enabled', () => {
    process.env.PICKRANK_E2E_AUTH = '1';

    expect(
      getE2eViewerIdentity(
        JSON.stringify({
          email: 'playwright@pickrank.test',
          username: 'playwright_user',
          displayName: 'playwright_user',
          emailConfirmedAt: '2026-06-29T00:00:00.000Z',
        }),
      ),
    ).toEqual({
      email: 'playwright@pickrank.test',
      username: 'playwright_user',
      displayName: 'playwright_user',
      emailConfirmedAt: '2026-06-29T00:00:00.000Z',
      isAuthenticated: true,
      isEmailVerified: true,
      isProfileComplete: true,
      source: 'e2e-fixture',
    });
  });

  it('ignores the e2e auth cookie when the dedicated flag is off', () => {
    expect(
      getE2eViewerIdentity(
        JSON.stringify({
          email: 'playwright@pickrank.test',
          username: 'playwright_user',
        }),
      ),
    ).toBeNull();
  });
});
