import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canConfirmContestEntry,
  getContestEntryConfirmationError,
  getPaidContestEligibilityError,
  isNonProductionE2eEntryMode,
} from '../../lib/contest-entry-confirmation';
import type { ProfileEligibility } from '../../lib/auth-profile';

const eligibleProfile: ProfileEligibility = {
  ageConfirmed: true,
  jurisdiction: 'CA',
  termsAcceptedAt: '2026-07-24T00:00:00.000Z',
  privacyPolicyAcceptedAt: '2026-07-24T00:00:00.000Z',
  accountStatus: 'active',
  eligibilityStatus: 'eligible',
  eligibilityCheckedAt: '2026-07-24T00:00:00.000Z',
  ageGateStatus: 'confirmed',
  kycStatus: 'not_required',
  selfExclusionStatus: 'none',
  restrictionReason: null,
  isEligibilityComplete: true,
  isEligibleForPaidEntry: true,
};

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
    expect(getContestEntryConfirmationError(500)).toContain('Complete age, location');
  });

  it('blocks paid entries when eligibility is still pending review', () => {
    expect(
      getPaidContestEligibilityError({
        ...eligibleProfile,
        eligibilityStatus: 'pending_review',
        isEligibleForPaidEntry: false,
      }),
    ).toContain('pending legal and provider review');
  });

  it('still fails closed on payment infrastructure after eligibility passes', () => {
    expect(canConfirmContestEntry(500, eligibleProfile)).toBe(false);
    expect(getContestEntryConfirmationError(500, eligibleProfile)).toContain('verified payment infrastructure');
  });

  it('allows the explicit file-backed E2E entry path outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isNonProductionE2eEntryMode()).toBe(true);
    expect(canConfirmContestEntry(500, eligibleProfile)).toBe(true);
  });

  it('never enables the E2E entry path in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isNonProductionE2eEntryMode()).toBe(false);
    expect(canConfirmContestEntry(500, eligibleProfile)).toBe(false);
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
