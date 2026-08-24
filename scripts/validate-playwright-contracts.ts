import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export type PlaywrightContractViolation = {
  column: number;
  file: string;
  line: number;
  message: string;
  rule: string;
};

type PlaywrightContractRule = {
  allowedFiles?: readonly string[];
  message: string;
  pattern: RegExp;
  rule: string;
};

const contractRules: readonly PlaywrightContractRule[] = [
  {
    rule: 'host-independent-navigation',
    pattern: /\.(?:toHaveURL|waitForURL)\(\s*['"`]/g,
    message:
      'Use expectPagePath() for literal path checks so valid localhost and 127.0.0.1 navigation behave the same.',
  },
  {
    rule: 'centralized-loopback-origin',
    pattern: /http:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?/g,
    allowedFiles: ['tests/e2e/support/navigation.ts'],
    message:
      'Import the shared e2eAppUrl origin. Declare the loopback URL only in tests/e2e/support/navigation.ts.',
  },
  {
    rule: 'unambiguous-status-locator',
    pattern:
      /getByText\(\s*(['"])(?:Open|Scheduled|Locked|Live|Finalizing|Final|Canceled|Entered|Saved)\1(?:\s*,\s*\{[^)]*\})?\s*\)/g,
    message:
      'Use a scoped test id for lifecycle and entry status. Status copy can appear in both badges and metric tiles.',
  },
  {
    rule: 'configured-route-redirect-origin',
    pattern: /new URL\([^,\n]+,\s*request\.url\s*\)/g,
    message:
      'Build route-handler redirects from getRequestOrigin(). Next.js can normalize request.url to a different loopback host.',
  },
] as const;

export function findPlaywrightContractViolations(
  source: string,
  file: string,
): PlaywrightContractViolation[] {
  return contractRules.flatMap((contractRule) => {
    if (contractRule.allowedFiles?.includes(file)) {
      return [];
    }

    return Array.from(source.matchAll(new RegExp(contractRule.pattern.source, 'g')), (match) => {
      const offset = match.index ?? 0;
      const beforeMatch = source.slice(0, offset);
      const lines = beforeMatch.split('\n');

      return {
        column: (lines.at(-1)?.length ?? 0) + 1,
        file,
        line: lines.length,
        message: contractRule.message,
        rule: contractRule.rule,
      };
    });
  });
}

async function listTypeScriptFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listTypeScriptFiles(entryPath);
      }

      return /\.tsx?$/.test(entry.name) ? [entryPath] : [];
    }),
  );

  return files.flat().sort();
}

export async function validatePlaywrightContracts(rootDirectory = process.cwd()) {
  const e2eDirectory = path.join(rootDirectory, 'tests', 'e2e');
  const appDirectory = path.join(rootDirectory, 'app');
  const files = [
    ...(await listTypeScriptFiles(e2eDirectory)),
    ...(await listTypeScriptFiles(appDirectory)).filter((file) => file.endsWith(`${path.sep}route.ts`)),
    path.join(rootDirectory, 'playwright.config.ts'),
  ].sort();
  const violations = (
    await Promise.all(
      files.map(async (file) => {
        const source = await readFile(file, 'utf8');
        return findPlaywrightContractViolations(source, path.relative(rootDirectory, file));
      }),
    )
  ).flat();

  return { files, violations };
}

async function main() {
  const { files, violations } = await validatePlaywrightContracts();

  if (violations.length === 0) {
    console.log(`Playwright contracts passed for ${files.length} TypeScript files.`);
    return;
  }

  console.error('Playwright contract validation failed:');
  for (const violation of violations) {
    console.error(
      `${violation.file}:${violation.line}:${violation.column} [${violation.rule}] ${violation.message}`,
    );
  }
  process.exitCode = 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
