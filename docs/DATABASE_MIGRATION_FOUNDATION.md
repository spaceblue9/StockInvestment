# Production Database Migration Foundation

The current SaaS prototype stores account, tenant, billing, payment, and audit data in `data/app-state.json`.

T27 adds a migration foundation so the project can move from that local file to a production database with fewer surprises.

T28 adds a repository layer in `src/services/stateRepository.js`. The app still uses the local file adapter, but `authService` now reads and writes state through this repository boundary instead of touching the JSON file directly.

## Schema Manifest

The schema manifest lives in `src/services/stateSchemaService.js` and is exposed to owner/admin accounts through:

```text
GET /api/storage/readiness
```

The manifest maps local collections to future production tables:

- `users` -> `users`
- `sessions` -> `user_sessions`
- `organizations` -> `organizations`
- `portfolioSnapshots` -> `portfolio_snapshots`
- `investorProfiles` -> `investor_profiles`
- `billingEvents` -> `billing_events`
- `paymentSessions` -> `payment_sessions`
- `paymentWebhookEvents` -> `payment_webhook_events`
- `advisorAssignments` -> `advisor_assignments`
- `auditEvents` -> `audit_events`

`auditEvents` is marked append-only because production should move it to immutable or append-only storage.

## Repository Layer

The repository layer exposes:

- `readAppState({ normalize })`
- `writeAppState(state)`
- `stateRepositoryInfo()`

Current adapter:

```text
APP_STATE_REPOSITORY=local_file
```

Only `local_file` is supported today. If an unsupported adapter is configured, reads and writes fail fast so deployments do not silently use an unknown persistence layer.

The local repository also mirrors audit events to:

```text
data/audit-events.ndjson
```

This file is append-only in normal app flow and is a prototype boundary for future external immutable audit storage.

## Readiness Checks

The readiness report checks:

- record counts by collection
- missing primary keys
- duplicate primary keys
- duplicate unique fields such as email, invoice number, and provider event id
- required fields
- missing `organizationId` on tenant-scoped collections
- dangling references between collections

Status values:

- `ready`: no blockers or warnings
- `review`: no blockers, but migration should review warnings
- `blocked`: production database migration should not proceed

## API Access

Only `owner` and `admin` accounts can call:

```text
GET /api/storage/readiness
```

Customer and advisor accounts are denied because the report describes global storage shape.

## UI Surface

The Business dashboard now includes:

- `DB Readiness`
- `DB Blockers`
- `Schema Version`

These values come from `businessMetrics().storageReadiness`.

## Regression Test

Run:

```bash
npm run test:storage-readiness
npm run test:state-repository
npm run test:audit-trail
```

The storage readiness test creates a temporary state store, verifies a clean state is `ready`, then injects duplicate and orphaned records to confirm the report becomes `blocked`.

The state repository test verifies that the local file adapter reads, writes, exposes metadata, and preserves normalized reads without touching demo data.

The audit trail test verifies that audit events are mirrored to NDJSON, access is owner/admin only, and missing/invalid mirror records are reported.

`npm run test-regression` and `npm run ci:quality` include this test.

## Production Migration Path

Recommended next steps:

1. Choose the production database and hosting environment.
2. Convert this manifest into real migrations.
3. Add a one-time importer from normalized `app-state.json` into tables.
4. Implement a production database adapter behind the repository layer.
5. Enforce tenant filtering at query level.
6. Move audit events to append-only or immutable storage.
