const REQUIRED_BROWSER_SUPABASE_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

type BrowserSupabaseConfig = {
  url: string;
  anonKey: string;
};

type ServiceRoleSupabaseConfig = {
  url: string;
  serviceRoleKey: string;
};

export type ProvisionalStatsSourceMode = 'replay_validation' | 'in_season_live';
export type SportsDataIoAuthMode = 'header' | 'query';

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
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

export function getSportsDataIoReplayBaseUrl() {
  return process.env.PICKRANK_SPORTSDATAIO_REPLAY_BASE_URL || 'https://replay.sportsdata.io/api/v3/nfl';
}

export function getSportsDataIoReplayApiKey() {
  return process.env.PICKRANK_SPORTSDATAIO_REPLAY_API_KEY || '';
}

export function getProvisionalStatsSourceMode(): ProvisionalStatsSourceMode {
  return process.env.PICKRANK_PROVISIONAL_STATS_SOURCE_MODE === 'in_season_live'
    ? 'in_season_live'
    : 'replay_validation';
}

export function getSportsDataIoLiveBaseUrl() {
  return process.env.PICKRANK_SPORTSDATAIO_LIVE_BASE_URL || 'https://api.sportsdata.io/v3/nfl';
}

export function getSportsDataIoLiveApiKey() {
  return process.env.PICKRANK_SPORTSDATAIO_LIVE_API_KEY || '';
}

export function getSportsDataIoLiveAuthMode(): SportsDataIoAuthMode {
  return process.env.PICKRANK_SPORTSDATAIO_LIVE_AUTH_MODE === 'query' ? 'query' : 'header';
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
