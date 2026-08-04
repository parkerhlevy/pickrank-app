import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canConfirmContestEntry,
  getControlledTestEntryEligibilityError,
  getContestEntryConfirmationError,
  getPaidContestEligibilityError,
  isControlledTestEntryMode,
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

const internallyEligibleProfile: ProfileEligibility = {
  ...eligibleProfile,
  eligibilityStatus: 'eligible_for_internal_testing',
  isEligibleForPaidEntry: false,
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
    expect(getContestEntryConfirmationError(500)).toContain('Complete age, state');
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

  it('still fails closed on paid launch mode after eligibility passes', () => {
    expect(canConfirmContestEntry(500, { eligibility: eligibleProfile })).toBe(false);
    expect(getContestEntryConfirmationError(500, { eligibility: eligibleProfile })).toContain(
      'not available during Early Access Beta',
    );
  });

  it('allows only internally approved accounts through the explicit file-backed E2E entry path', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isControlledTestEntryMode({ viewerSource: 'e2e-fixture' })).toBe(true);
    expect(getControlledTestEntryEligibilityError(internallyEligibleProfile)).toBeNull();
    expect(
      canConfirmContestEntry(500, {
        eligibility: internallyEligibleProfile,
        viewerSource: 'e2e-fixture',
      }),
    ).toBe(true);
  });

  it('does not treat public paid-entry eligibility as internal test approval', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(
      getContestEntryConfirmationError(500, {
        eligibility: eligibleProfile,
        viewerSource: 'e2e-fixture',
      }),
    ).toContain('internal test approval');
    expect(
      canConfirmContestEntry(500, {
        eligibility: eligibleProfile,
        viewerSource: 'e2e-fixture',
      }),
    ).toBe(false);
  });

  it('does not let ordinary non-production users bypass payment infrastructure', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isControlledTestEntryMode({ viewerSource: 'supabase' })).toBe(false);
    expect(canConfirmContestEntry(500, {
      eligibility: eligibleProfile,
      viewerSource: 'supabase',
    })).toBe(false);
    expect(getContestEntryConfirmationError(500, {
      eligibility: eligibleProfile,
      viewerSource: 'supabase',
    })).toContain('not available during Early Access Beta');
  });

  it('never enables the E2E entry path in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('PICKRANK_E2E_AUTH', '1');
    vi.stubEnv('PICKRANK_E2E_USE_FILE_STORE', '1');

    expect(isControlledTestEntryMode({ viewerSource: 'e2e-fixture' })).toBe(false);
    expect(canConfirmContestEntry(500, {
      eligibility: internallyEligibleProfile,
      viewerSource: 'e2e-fixture',
    })).toBe(false);
    expect(getContestEntryConfirmationError(500, {
      eligibility: internallyEligibleProfile,
      viewerSource: 'e2e-fixture',
    })).toContain('pending legal and provider review');
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
