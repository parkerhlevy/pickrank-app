import { describe, expect, it } from 'vitest';
import { isAdminRoute } from '../../lib/app-route-scope';

describe('app route scope', () => {
  it('identifies the admin root and nested admin routes', () => {
    expect(isAdminRoute('/admin')).toBe(true);
    expect(isAdminRoute('/admin/contests')).toBe(true);
    expect(isAdminRoute('/admin/eligibility')).toBe(true);
  });

  it('keeps public and similarly prefixed routes outside the admin shell', () => {
    expect(isAdminRoute('/')).toBe(false);
    expect(isAdminRoute('/contests')).toBe(false);
    expect(isAdminRoute('/administrator')).toBe(false);
  });
});
