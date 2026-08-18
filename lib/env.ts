const REQUIRED_BROWSER_SUPABASE_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

type ServiceRoleSupabaseConfig = {
  url: string;
  serviceRoleKey: string;
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

export function getServiceRoleSupabaseConfig(): ServiceRoleSupabaseConfig {
  return {
    url: readRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    serviceRoleKey: readRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
  };
}

export function getMissingBrowserSupabaseKeys() {
  return REQUIRED_BROWSER_SUPABASE_KEYS.filter((key) => !process.env[key]);
}

export function hasBrowserSupabaseConfig() {
  return getMissingBrowserSupabaseKeys().length === 0;
}

export function getAppUrl() {
  const vercelDeploymentUrl = getVercelDeploymentUrl();

  if (process.env.VERCEL_ENV && process.env.VERCEL_ENV !== 'production' && vercelDeploymentUrl) {
    return vercelDeploymentUrl;
  }

  return process.env.NEXT_PUBLIC_APP_URL || vercelDeploymentUrl || 'http://localhost:3000';
}

function getVercelDeploymentUrl() {
  const vercelUrl = process.env.VERCEL_URL;

  if (!vercelUrl) {
    return '';
  }

  try {
    return new URL(vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`).origin;
  } catch {
    return '';
  }
}

export function getStatsProviderMode(): 'disabled' | 'file' | 'persisted_snapshot' {
  if (process.env.PICKRANK_STATS_PROVIDER === 'file') {
    return 'file';
  }

  if (process.env.PICKRANK_STATS_PROVIDER === 'persisted_snapshot') {
    return 'persisted_snapshot';
  }

  return 'disabled';
}

export function getStatsProviderFilePath() {
  return process.env.PICKRANK_STATS_PROVIDER_FILE_PATH || `${process.cwd()}/data/provider-stats.json`;
}

export function getPersistedStatsSnapshotFilePath() {
  return process.env.PICKRANK_STATS_SNAPSHOT_FILE_PATH || `${process.cwd()}/data/contest-stat-snapshots.json`;
}

export function getProvisionalStatsSnapshotFilePath() {
  return process.env.PICKRANK_PROVISIONAL_STATS_SNAPSHOT_FILE_PATH || `${process.cwd()}/data/contest-provisional-snapshots.json`;
}

export function getStatsProviderFetchUrl() {
  return process.env.PICKRANK_STATS_PROVIDER_FETCH_URL || '';
}

export function getStatsProviderFetchToken() {
  return process.env.PICKRANK_STATS_PROVIDER_FETCH_TOKEN || '';
}

export function getRequestOrigin(headers: HeaderSource, fallbackOrigin = getAppUrl()) {
  const previewOrigin = getTrustedPreviewRequestOrigin(headers);

  if (previewOrigin) {
    return previewOrigin;
  }

  return new URL(fallbackOrigin).origin;
}

function getTrustedPreviewRequestOrigin(headers: HeaderSource) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return '';
  }

  const forwardedHost = headers.get('x-forwarded-host') || headers.get('host') || '';
  const forwardedProto = headers.get('x-forwarded-proto') || 'https';
  const host = forwardedHost.split(',')[0]?.trim().toLowerCase();

  if (!host || !host.endsWith('.vercel.app')) {
    return '';
  }

  if (forwardedProto !== 'https') {
    return '';
  }

  return `https://${host}`;
}
