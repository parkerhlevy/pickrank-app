import { describe, expect, it, vi } from 'vitest';

describe('env helpers', () => {
  it('reports missing browser Supabase keys', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', '');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', '');

    const { getMissingBrowserSupabaseKeys, hasBrowserSupabaseConfig } = await import('../../lib/env');

    expect(getMissingBrowserSupabaseKeys()).toEqual([
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ]);
    expect(hasBrowserSupabaseConfig()).toBe(false);
  });

  it('returns configured browser Supabase values', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'anon-key');

    const { getBrowserSupabaseConfig, hasBrowserSupabaseConfig } = await import('../../lib/env');

    expect(getBrowserSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      anonKey: 'anon-key',
    });
    expect(hasBrowserSupabaseConfig()).toBe(true);
  });

  it('returns configured service-role Supabase values', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-role-key');

    const { getServiceRoleSupabaseConfig } = await import('../../lib/env');

    expect(getServiceRoleSupabaseConfig()).toEqual({
      url: 'https://example.supabase.co',
      serviceRoleKey: 'service-role-key',
    });
  });

  it('uses the trusted Vercel deployment URL for preview auth callbacks', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrankgames.com');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('VERCEL_URL', 'pickrank-app-git-codex-eligibility-example.vercel.app');

    const { getAppUrl } = await import('../../lib/env');

    expect(getAppUrl()).toBe('https://pickrank-app-git-codex-eligibility-example.vercel.app');
  });

  it('keeps production auth callbacks pinned to the configured app URL', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrankgames.com');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('VERCEL_URL', 'pickrank-app-production.vercel.app');

    const { getAppUrl } = await import('../../lib/env');

    expect(getAppUrl()).toBe('https://pickrankgames.com');
  });

  it('ignores forwarded host headers when building the request origin', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrank-app.vercel.app');

    const { getRequestOrigin } = await import('../../lib/env');
    const headers = new Headers({
      host: '127.0.0.1:3000',
      'x-forwarded-host': 'attacker.example',
      'x-forwarded-proto': 'https',
    });

    expect(getRequestOrigin(headers)).toBe('https://pickrank-app.vercel.app');
  });

  it('falls back to NEXT_PUBLIC_APP_URL when host headers are missing', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrank-app.vercel.app');

    const { getRequestOrigin } = await import('../../lib/env');

    expect(getRequestOrigin(new Headers())).toBe('https://pickrank-app.vercel.app');
  });
});
