import { defineConfig, devices } from '@playwright/test';
import { e2eAppUrl } from './tests/e2e/support/navigation';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  workers: 1,
  use: {
    baseURL: e2eAppUrl,
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      `NEXT_PUBLIC_APP_URL=${e2eAppUrl} NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e-anon-key PICKRANK_E2E_AUTH=1 PICKRANK_E2E_USE_FILE_STORE=1 PICKRANK_STATS_PROVIDER=file PICKRANK_STATS_PROVIDER_FILE_PATH=data/provider-stats.json npm run dev -- --hostname 127.0.0.1`,
    url: e2eAppUrl,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
