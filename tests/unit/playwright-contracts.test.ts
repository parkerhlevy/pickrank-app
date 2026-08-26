import { describe, expect, it } from 'vitest';
import { findPlaywrightContractViolations } from '../../scripts/validate-playwright-contracts';

describe('Playwright test contracts', () => {
  it('rejects literal URL assertions and waits because Playwright resolves them against baseURL', () => {
    const violations = findPlaywrightContractViolations(
      [
        "await expect(page).toHaveURL('/contests');",
        "await page.waitForURL('/profile');",
      ].join('\n'),
      'tests/e2e/example.spec.ts',
    );

    expect(violations.map((violation) => violation.rule)).toEqual([
      'host-independent-navigation',
      'host-independent-navigation',
    ]);
  });

  it('rejects duplicated loopback declarations and ambiguous status text locators', () => {
    const violations = findPlaywrightContractViolations(
      [
        "const url = 'http://127.0.0.1:3000';",
        "await expect(card.getByText('Open')).toBeVisible();",
      ].join('\n'),
      'tests/e2e/example.spec.ts',
    );

    expect(violations.map((violation) => violation.rule)).toEqual([
      'centralized-loopback-origin',
      'unambiguous-status-locator',
    ]);
  });

  it('rejects route redirects that inherit a normalized loopback host from request.url', () => {
    const violations = findPlaywrightContractViolations(
      'return NextResponse.redirect(new URL(redirectHref, request.url));',
      'app/contests/[contestId]/progress/route.ts',
    );

    expect(violations.map((violation) => violation.rule)).toEqual([
      'configured-route-redirect-origin',
    ]);
  });

  it('allows host-independent predicates, regular expressions, and scoped test ids', () => {
    const violations = findPlaywrightContractViolations(
      [
        'await expectPagePath(page, "/contests");',
        'await expect(page).toHaveURL(/status=finalized/);',
        "await expect(card.getByTestId('contest-lifecycle-status')).toHaveText('Open');",
        'return NextResponse.redirect(new URL(redirectHref, requestOrigin));',
      ].join('\n'),
      'tests/e2e/example.spec.ts',
    );

    expect(violations).toEqual([]);
    expect(
      findPlaywrightContractViolations(
        "export const e2eAppUrl = 'http://127.0.0.1:3000';",
        'tests/e2e/support/navigation.ts',
      ),
    ).toEqual([]);
  });
});
