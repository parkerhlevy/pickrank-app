import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  defaultE2eViewerUserId,
  getE2eAuthFixture,
  getE2eViewerIdentity,
} from '../../lib/viewer-identity';

describe('viewer identity', () => {
  afterEach(() => {
    delete process.env.PICKRANK_E2E_AUTH;
    vi.unstubAllEnvs();
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
          userId: defaultE2eViewerUserId,
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
      userId: defaultE2eViewerUserId,
    });
  });

  it('keeps optional role slugs on the parsed e2e fixture payload', () => {
    process.env.PICKRANK_E2E_AUTH = '1';

    expect(
      getE2eAuthFixture(
        JSON.stringify({
          email: 'operator@pickrank.test',
          username: 'operator_user',
          displayName: 'Operator User',
          roleSlugs: ['contest_operator'],
        }),
      ),
    ).toEqual({
      email: 'operator@pickrank.test',
      username: 'operator_user',
      displayName: 'Operator User',
      emailConfirmedAt: expect.any(String),
      userId: defaultE2eViewerUserId,
      roleSlugs: ['contest_operator'],
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

  it('ignores the e2e auth cookie in production even when the flag is enabled', () => {
    vi.stubEnv('NODE_ENV', 'production');
    process.env.PICKRANK_E2E_AUTH = '1';

    expect(
      getE2eAuthFixture(
        JSON.stringify({
          email: 'operator@pickrank.test',
          username: 'operator_user',
          roleSlugs: ['contest_operator'],
        }),
      ),
    ).toBeNull();
  });
});
