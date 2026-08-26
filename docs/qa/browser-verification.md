# Browser Verification

## Purpose

Keep Chromium end-to-end verification reliable when a local agent environment cannot launch browser processes.

## Required Browser Gate

GitHub Actions runs the full Playwright suite on Linux for every pull request into `main`, every push to `main`, and every manual workflow dispatch.

The workflow:

1. Installs locked npm dependencies with `npm ci`.
2. Runs `npm run test:e2e:contracts` before installing a browser.
3. Installs the Playwright Chromium version and its Linux system dependencies.
4. Runs `npm run test:e2e:ci`, with each suite isolated in its own Playwright process and one worker. Stateful final-results cases each receive a separate process.
5. Uploads the Playwright HTML report for passed and failed runs.

Isolate suites because several PickRank browser tests temporarily update shared file-backed fixtures. Isolate final-results cases because Next.js server state can otherwise outlive the fixture reset between cases. Use one worker inside each process for the same reason.

The CI runner completes all remaining suites after one suite fails, then returns one failing exit code with the failed suite names. Playwright retains a trace and screenshot for each failed test. This gives one pull request run enough evidence to diagnose independent failures instead of revealing them one push at a time.

ESLint excludes `playwright-report/**` and `test-results/**`. A retained failure trace must not cause the next `npm run lint` check to scan generated Playwright assets.

## Test Authoring Contracts

Run the fast contract check before a focused browser test:

```bash
npm run test:e2e:contracts
```

The contract check enforces these repository rules:

- Use `expectPagePath()` from `tests/e2e/support/navigation.ts` for literal path and query assertions. Do not compare a browser URL to a full `localhost` or `127.0.0.1` origin.
- Use `e2eAppUrl` as the only loopback origin in test fixtures. Playwright starts Next.js on the explicit `127.0.0.1` hostname.
- Build App Router route-handler redirects from `getRequestOrigin()` instead of `request.url`. Next.js can normalize `request.url` to another loopback host and drop host-scoped auth cookies.
- Use scoped test IDs for lifecycle and entry status labels. Do not select repeated labels such as `Open` or `Entered` through broad exact-text locators.
- Keep stateful browser execution on one worker. Do not re-enable full parallel execution while specs share file-backed fixtures.

These rules address two deterministic failures found in pull request `#26`. One assertion matched both the header `Open` badge and the `Status: Open` metric. Another assertion rejected a successful lineup navigation because Linux returned `localhost` while the test expected `127.0.0.1`.

## Local Command

Use this command in a normal terminal session when macOS permits Chromium and the local Next.js server to start:

```bash
npm run test:e2e:ci
```

Use a focused file during implementation:

```bash
npm run test:e2e:ci -- tests/e2e/lineup-builder.spec.ts
```

## Codex Desktop macOS Failure

This error is an execution-environment failure:

```text
bootstrap_check_in org.chromium.Chromium.MachPortRendezvousServer: Permission denied (1100)
```

Chromium fails before Playwright creates a page or runs a test. The process inherited from Codex desktop cannot register the required macOS bootstrap service. A broader command sandbox retry can still fail because it does not remove the parent application's macOS process sandbox.

Do not change Chromium flags, application code, test assertions, or fixture data for this error. Do not report browser verification as passed from that run.

Use the GitHub Actions `Browser verification` result as the browser gate. If a normal Terminal session is available, the local command above remains a valid additional check.

## Failure Classification

- `MachPortRendezvousServer ... Permission denied (1100)`: local macOS execution environment. Use the Linux workflow.
- `listen EPERM` while starting the Next.js server: local bind restriction. Use the Linux workflow.
- `strict mode violation` with more than one matching element: test locator ambiguity. Scope the assertion to a semantic region or stable test ID. Do not use positional selectors to hide an ambiguous contract.
- Expected `127.0.0.1` but received `localhost`, or the reverse: test origin coupling. Assert the path and query with `expectPagePath()` and keep `e2eAppUrl` as the fixture origin.
- A test reaches a page and fails an assertion: product or test failure. Inspect the uploaded Playwright report and trace.
- The Linux workflow cannot install or launch Chromium: workflow or dependency failure. Inspect the installation and launch logs before changing product code.
