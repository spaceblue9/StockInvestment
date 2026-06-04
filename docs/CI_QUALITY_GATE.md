# CI Quality Gate

This project has a GitHub Actions workflow at `.github/workflows/quality-gate.yml`.

The workflow is designed as a practical SaaS regression gate before merge or deploy. It runs on push, pull request, and manual dispatch.

## What CI Runs

```bash
npm ci
npm run ci:quality
```

`npm run ci:quality` runs:

- `npm run check`
- `npm run test:tenant-access`
- `npm run test:subscription-lifecycle`
- `npm run test:storage-readiness`
- `npm run test:state-repository`
- `npm run test:audit-trail`
- `npm run compare:python`
- `npm audit --audit-level=high`

## Reference Files Required

The Python comparison still depends on these committed reference artifacts:

- `siamchart_raw.csv`
- `recommended_stocks.csv`
- `portfolio_aom.xlsx`
- `portfolio_aom_analysis_report.xlsx`

If CI fails at `Verify reference artifacts`, restore those files from the repository history or regenerate them from the original Python workflow and commit them intentionally.

## Failure Guide

- Syntax failure: inspect the file reported by `node --check`.
- Tenant access failure: check role/workspace filtering and `organizationId` metadata.
- Subscription lifecycle failure: check payment session status, webhook verification, duplicate event reconciliation, and billing metrics.
- Storage readiness failure: check duplicate ids, missing required fields, tenant metadata, and dangling references before database migration.
- State repository failure: check local file adapter reads/writes and repository metadata.
- Audit trail failure: check append-only NDJSON mirror, missing audit events, invalid lines, and owner/admin access.
- Python comparison failure: check whether the JavaScript formulas changed or whether the Python reference output changed.
- Audit failure: high severity advisories should block release. Moderate advisories currently exist through `exceljs` and `uuid`; they do not fail this gate unless they become high severity or a fix becomes available.

## Notes

The tenant, subscription, storage readiness, state repository, and audit trail regression scripts run in temporary directories. They do not read or modify `data/app-state.json`.
