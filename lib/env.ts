const REQUIRED_BROWSER_SUPABASE_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

type HeaderSource = Pick<Headers, 'get'>;

function readRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getBrowserSupabaseConfig(): BrowserSupabaseConfig {
  return {
    url: readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: readRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  };
}

export function getMissingBrowserSupabaseKeys() {
  return REQUIRED_BROWSER_SUPABASE_KEYS.filter((key) => !process.env[key]);
}

export function hasBrowserSupabaseConfig() {
  return getMissingBrowserSupabaseKeys().length === 0;
}

export function getAppUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

export function getRequestOrigin(headers: HeaderSource, fallbackOrigin = getAppUrl()) {
  const host = headers.get('x-forwarded-host') || headers.get('host');

  if (!host) {
    return fallbackOrigin;
  }

  const fallbackUrl = new URL(fallbackOrigin);
  const protocol = headers.get('x-forwarded-proto') || fallbackUrl.protocol.replace(':', '');

  return `${protocol}://${host}`;
}
