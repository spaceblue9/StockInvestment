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
- `npm run test:postgres-repository`
- `npm run test:postgres-importer`
- `npm run test:audit-trail`
- `npm run test:approval-workflow`
- `npm run test:entitlements`
- `npm run test:payment-provider`
- `npm run test:audit-external`
- `npm run test:backup-restore`
- `npm run test:observability`
- `npm run test:ops-alerts`
- `npm run test:postgres-backup-runbook`
- `npm run test:deployment-checklist`
- `npm run test:frontend-viewport`
- `npm run test:frontend-auth`
- `npm run test:web-smoke`
- `npm run compare:python`
- `npm run test:dependency-risk`

## Reference Files Required

The Python formula comparison still depends on these committed reference artifacts:

- `siamchart_raw.csv`
- `recommended_stocks.csv`

Portfolio report regression now creates a synthetic temporary workbook during the test so private portfolio files are not required in Git.

If CI fails at `Verify reference artifacts`, restore `siamchart_raw.csv` and `recommended_stocks.csv` from the repository history or regenerate them from the original Python workflow and commit them intentionally.

## Failure Guide

- Syntax failure: inspect the file reported by `node --check`.
- Tenant access failure: check role/workspace filtering and `organizationId` metadata.
- Subscription lifecycle failure: check payment session status, webhook verification, duplicate event reconciliation, and billing metrics.
- Storage readiness failure: check duplicate ids, missing required fields, tenant metadata, and dangling references before database migration.
- State repository failure: check local file adapter reads/writes and repository metadata.
- Postgres repository failure: check bootstrap SQL, table mapping from the schema manifest, whole-state transaction behavior, append-only audit handling, primary key guards, and query-level tenant scoped read filters.
- Postgres importer failure: check dry-run readiness plans, blocked import guards, allowBlocked handling, and whole-state writes through the Postgres adapter.
- Audit trail failure: check append-only NDJSON mirror, missing audit events, invalid lines, and owner/admin access.
- Approval workflow failure: check advisor/customer scope, approval decision ownership, approval metrics, and audit/storage readiness.
- Entitlement failure: check Starter/Pro/Advisor feature ids, subscription status normalization, upgrade-required errors, and owner/admin operator override.
- Payment provider failure: check Stripe Checkout env mapping, fake provider API calls, provider webhook signature verification, duplicate reconciliation, and rejected webhook logging.
- External audit failure: check HTTP provider URL, HMAC signature headers, receipt writes, missing external events, and required fail-closed behavior.
- Backup/restore failure: check manifest version, file checksums, restore dry-run output, confirm guard, safety backup creation, and invalid backup rejection.
- Observability failure: check operational alert rules, `/api/ops/readiness` owner/admin guard, repository/payment/audit/storage status mapping, and Business dashboard alert markers.
- Operational alert delivery failure: check webhook URL/secret env mapping, disabled and required modes, HMAC signature headers, dry-run behavior, non-2xx handling, CLI strict mode, secret masking, and URL query masking.
- Postgres backup runbook failure: check strategy handling, retention/RPO/RTO checks, `DATABASE_URL` sanitization, and `pg_dump` / `pg_restore` command templates.
- Deployment checklist failure: check production env mapping, Postgres adapter/SSL/DATABASE_URL settings, Stripe Checkout envs, signed webhook secret, external audit config, backup strategy, secret masking, and strict blocked status.
- Frontend viewport failure: check viewport meta, mobile breakpoints, section-title stacking, tap target height, button wrapping, table overflow, and key view markers.
- Frontend authenticated smoke failure: check in-process server startup, register/session cookie flow, owner admin metrics, ops readiness access, and customer access guards.
- Web smoke failure: check server startup exports, static assets, health/auth APIs, operational readiness auth guard, dashboard navigation, Screener drilldown markers, and External Audit/Operational Readiness UI markers.
- Dependency risk failure: check high/critical advisories, new moderate advisories, or accepted moderate advisories that now have a fix available.
- Python comparison failure: check whether the JavaScript formulas changed or whether the Python reference output changed.
- Audit failure: high and critical advisories should block release. Moderate advisories currently accepted through `exceljs` and `uuid` are documented in `docs/DEPENDENCY_RISK_REGISTER.md`; they fail the gate if a fix becomes available or if a new moderate advisory appears.

## Notes

The tenant, subscription, storage readiness, state repository, Postgres repository, Postgres importer, audit trail, approval workflow, entitlement, payment provider, external audit, backup/restore, observability, operational alert delivery, Postgres backup runbook, deployment checklist, frontend viewport/auth, and web smoke regression scripts run in temporary directories, pure builders, local HTTP test servers, or fake clients. The Postgres repository regression also verifies restricted scoped reads add SQL `WHERE` filters before JSONB records are returned. They do not read or modify `data/app-state.json`.

The dependency risk gate reads npm audit data and does not modify project files.
