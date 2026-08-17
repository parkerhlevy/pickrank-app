# Browser Verification

## Purpose

Keep Chromium end-to-end verification reliable when a local agent environment cannot launch browser processes.

## Required Browser Gate

GitHub Actions runs the full Playwright suite on Linux for every pull request into `main`, every push to `main`, and every manual workflow dispatch.

The workflow:

1. Installs locked npm dependencies with `npm ci`.
2. Installs the Playwright Chromium version and its Linux system dependencies.
3. Runs `npm run test:e2e:ci`, with each spec isolated in its own Playwright process and one worker.
4. Uploads the Playwright HTML report for passed and failed runs.

Isolate specs because several PickRank browser tests temporarily update shared file-backed fixtures. Use one worker inside each spec for the same reason.

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
- A test reaches a page and fails an assertion: product or test failure. Inspect the uploaded Playwright report and trace.
- The Linux workflow cannot install or launch Chromium: workflow or dependency failure. Inspect the installation and launch logs before changing product code.
