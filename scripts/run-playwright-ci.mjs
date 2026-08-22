import { spawnSync } from 'node:child_process';
import path from 'node:path';

const explicitArguments = process.argv.slice(2);
const suites = explicitArguments.length
  ? [{ name: 'focused', arguments: explicitArguments }]
  : [
      { name: 'admin-shell', arguments: ['tests/e2e/admin-shell.spec.ts'] },
      { name: 'homepage', arguments: ['tests/e2e/homepage.spec.ts'] },
      { name: 'profile-status', arguments: ['tests/e2e/profile-status.spec.ts'] },
      { name: 'lineup-builder', arguments: ['tests/e2e/lineup-builder.spec.ts'] },
      {
        name: 'final-results-publish',
        arguments: ['tests/e2e/final-results.spec.ts', '--grep', 'finalizes the locked contest'],
      },
      {
        name: 'final-results-free-proof',
        arguments: ['tests/e2e/final-results.spec.ts', '--grep', 'locks and finalizes the same zero-fee proof contest'],
      },
      {
        name: 'final-results-correction',
        arguments: ['tests/e2e/final-results.spec.ts', '--grep', 'reruns finalization after a stat correction'],
      },
      {
        name: 'final-results-tie',
        arguments: ['tests/e2e/final-results.spec.ts', '--grep', 'renders a saved shared paid tie'],
      },
    ];
const executable = path.join(
  process.cwd(),
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'playwright.cmd' : 'playwright',
);

for (const suite of suites) {
  const result = spawnSync(
    executable,
    ['test', ...suite.arguments, '--workers=1', '--reporter=line,html'],
    {
      stdio: 'inherit',
      env: {
        ...process.env,
        PLAYWRIGHT_HTML_OPEN: 'never',
        PLAYWRIGHT_HTML_OUTPUT_DIR: path.join('playwright-report', suite.name),
      },
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
