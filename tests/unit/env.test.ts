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

  it('builds the request origin from forwarded headers', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrank-app.vercel.app');

    const { getRequestOrigin } = await import('../../lib/env');
    const headers = new Headers({
      host: '127.0.0.1:3000',
      'x-forwarded-host': 'pickrank-preview.vercel.app',
      'x-forwarded-proto': 'https',
    });

    expect(getRequestOrigin(headers)).toBe('https://pickrank-preview.vercel.app');
  });

  it('falls back to NEXT_PUBLIC_APP_URL when host headers are missing', async () => {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://pickrank-app.vercel.app');

    const { getRequestOrigin } = await import('../../lib/env');

    expect(getRequestOrigin(new Headers())).toBe('https://pickrank-app.vercel.app');
  });
});
