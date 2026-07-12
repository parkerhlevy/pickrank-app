import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canConfirmContestEntry,
  getContestEntryConfirmationError,
  isNonProductionE2eEntryMode,
} from '../../lib/contest-entry-confirmation';

describe('contest entry confirmation policy', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows zero-fee entries without payment infrastructure', () => {
    expect(canConfirmContestEntry(0)).toBe(true);
    expect(getContestEntryConfirmationError(0)).toBeNull();
  });

  it('fails closed for paid entries by default', () => {
    expect(canConfirmContestEntry(500)).toBe(false);
    expect(getContestEntryConfirmationError(500)).toContain('Paid contest entry is unavailable');
  });

  it('allows the explicit file-backed E2E entry path outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isNonProductionE2eEntryMode()).toBe(true);
    expect(canConfirmContestEntry(500)).toBe(true);
  });

  it('never enables the E2E entry path in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isNonProductionE2eEntryMode()).toBe(false);
    expect(canConfirmContestEntry(500)).toBe(false);
  });

  it('keeps entry creation out of the GET progress route', async () => {
    const routeSource = await readFile(
      path.join(process.cwd(), 'app', 'contests', '[contestId]', 'progress', 'route.ts'),
      'utf8',
    );
    const actionSource = await readFile(
      path.join(process.cwd(), 'app', 'contests', '[contestId]', 'payment', 'actions.ts'),
      'utf8',
    );

    expect(routeSource).not.toContain('ensurePersistedContestEntry');
    expect(actionSource).toContain("'use server'");
    expect(actionSource).toContain('getContestEntryConfirmationError');
    expect(actionSource).toContain('ensurePersistedContestEntry');
  });
});
