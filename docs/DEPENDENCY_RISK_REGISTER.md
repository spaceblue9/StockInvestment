# Dependency Risk Register

This document records accepted dependency risks for the Node.js SaaS prototype.

## Current Gate

Run:

```bash
npm run test:dependency-risk
```

The gate reads `npm audit --json` and fails when:

- any `high` or `critical` vulnerability exists
- any `moderate` vulnerability appears outside this accepted risk register
- an accepted moderate vulnerability starts reporting `fixAvailable: true`

In restricted Windows sandbox environments where Node child-process spawning cannot run `npm audit`, the script falls back to `package-lock.json` and validates the known `exceljs -> uuid` dependency tree. In normal CI, `npm audit --json` is used first.

## Accepted Moderate Risks

### `exceljs` -> `uuid`

- Severity: moderate
- Direct dependency affected: `exceljs`
- Transitive dependency: `uuid`
- Advisory: `GHSA-w5hq-g745-h8pq`
- Current npm audit status: `fixAvailable: false`
- Reason accepted: `exceljs` is used to preserve the legacy Python-compatible Excel portfolio report workflow. The current advisory is transitive and npm reports no available fix through the installed dependency tree.

## Production Action

Before production launch:

- re-run `npm run test:dependency-risk`
- check whether `exceljs` has released a patched dependency tree
- upgrade or replace the Excel report dependency if a fix becomes available
- keep `npm run ci:quality` passing after the upgrade
