import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command:
      'NEXT_PUBLIC_APP_URL=http://127.0.0.1:3000 NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co NEXT_PUBLIC_SUPABASE_ANON_KEY=e2e-anon-key PICKRANK_E2E_AUTH=1 PICKRANK_E2E_USE_FILE_STORE=1 PICKRANK_STATS_PROVIDER=file PICKRANK_STATS_PROVIDER_FILE_PATH=data/provider-stats.json npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
