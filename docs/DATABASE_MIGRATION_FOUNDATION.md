# Production Database Migration Foundation

The current SaaS prototype stores account, tenant, billing, payment, and audit data in `data/app-state.json`.

T27 adds a migration foundation so the project can move from that local file to a production database with fewer surprises.

T28 adds a repository layer in `src/services/stateRepository.js`. The app still uses the local file adapter, but `authService` now reads and writes state through this repository boundary instead of touching the JSON file directly.

T35 adds an opt-in Postgres state adapter behind the same repository boundary. The default remains `local_file` so local development and existing demo behavior stay unchanged.

T37 adds a one-time importer from normalized `app-state.json` into the Postgres adapter. It supports dry-run readiness checks before writing to a database.

T39 adds a local backup/restore drill for `app-state.json`, the audit mirror, and external audit receipts. It is a file-backed safety drill before production database cutover.

T40 adds a Postgres scoped read helper so production flows can apply tenant filters in SQL before JSONB records leave the database.

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
- `approvalRequests` -> `approval_requests`
- `auditEvents` -> `audit_events`

`auditEvents` is marked append-only because production should move it to immutable or append-only storage.

## Repository Layer

The repository layer exposes:

- `readAppState({ normalize })`
- `readScopedAppState(tenantScope, { normalize })`
- `writeAppState(state)`
- `stateRepositoryInfo()`

Current adapter:

```text
APP_STATE_REPOSITORY=local_file
```

Supported adapters:

```text
APP_STATE_REPOSITORY=local_file
APP_STATE_REPOSITORY=postgres
```

If an unsupported adapter is configured, reads and writes fail fast so deployments do not silently use an unknown persistence layer.

The local repository also mirrors audit events to:

```text
data/audit-events.ndjson
```

This file is append-only in normal app flow and is a prototype boundary for future external immutable audit storage.

## Postgres Adapter

The Postgres adapter is selected with:

```text
APP_STATE_REPOSITORY=postgres
DATABASE_URL=postgres://user:password@host:5432/database
DATABASE_SSL_MODE=require
```

`DATABASE_SSL_MODE` supports:

- `disable`
- `require`

The adapter uses the schema manifest production table names and creates one JSONB-backed table per collection. Each table has:

- `record_id text PRIMARY KEY`
- `organization_id text`
- `user_id text`
- `record jsonb NOT NULL`
- `created_at timestamptz`
- `updated_at timestamptz`

It also creates indexes on `organization_id` and `user_id` so tenant-scoped queries have a practical starting point.

The default write behavior is a whole-state transaction to match the existing local-file service behavior. Non-append collections are rewritten to match the latest state. Append-only collections such as `auditEvents` are upserted without deleting older rows.

Important: the adapter dynamically imports the optional `pg` driver only when `APP_STATE_REPOSITORY=postgres` is selected. Install it in production before enabling the adapter:

```bash
npm install pg
```

If `APP_STATE_REPOSITORY=postgres` is enabled without `DATABASE_URL`, or if `pg` is missing, the app fails fast instead of silently falling back to the local file.

## Query-level Tenant Guard

The Postgres adapter now supports scoped reads through:

```js
readScopedPostgresAppState({
  mode: "restricted",
  userIds: ["current-user-id", "assigned-customer-id"],
  organizationIds: ["current-workspace-id", "assigned-customer-workspace-id"],
});
```

The generic repository wrapper also exposes:

```js
readScopedAppState(tenantScope, { normalize });
```

Supported scope modes:

- `platform`: owner/admin style full-state visibility
- `restricted`: only records matching allowed `organization_id`, `user_id`, user `record_id`, organization `record_id`, or advisor-assignment user references

Restricted reads add `WHERE` filters before fetching `record jsonb` from these collections:

- tenant-scoped collections such as `portfolio_snapshots`, `billing_events`, `approval_requests`, and `audit_events`
- `users` through visible user ids and visible organization ids
- `organizations` through visible organization ids
- `user_sessions` through visible user ids
- `advisor_assignments` through customer, advisor, and assigner user references

The default `readAppState()` behavior remains whole-state to preserve the current migration path and local-file compatibility. Production endpoints that serve tenant-specific data should move to scoped reads after deriving the viewer's allowed user ids and organization ids.

## One-time Importer

Use the importer after provisioning Postgres and installing `pg` in the target environment.

Dry-run first:

```bash
npm run import:postgres -- --dry-run
```

Dry-run with an explicit source file:

```bash
npm run import:postgres -- --input data/app-state.json --dry-run
```

Run the real import:

```bash
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database npm run import:postgres -- --input data/app-state.json
```

The importer:

- reads local `app-state.json`
- normalizes state with the same app normalization used by the SaaS service
- runs the storage readiness report
- refuses to import if readiness is `blocked`
- writes through the Postgres adapter in a whole-state transaction
- keeps append-only collections such as `auditEvents` from being deleted during import writes

If a team intentionally wants to import despite readiness blockers, pass:

```bash
npm run import:postgres -- --input data/app-state.json --allow-blocked
```

Use `--allow-blocked` only after reviewing the dry-run output because it can intentionally import duplicate/orphaned records.

## Backup / Restore Drill

Use the local backup drill before risky maintenance, before importer runs, and before production handoff rehearsals:

```bash
npm run backup:state -- --reason before-import
```

The backup is written under:

```text
data/backups/<backup-folder>
```

Each backup contains:

- `manifest.json`
- normalized `app-state.json`
- `audit-events.ndjson` when present
- `audit-external-receipts.ndjson` when present

The manifest includes schema version, readiness summary, collection record counts, file sizes, SHA-256 checksums, repository metadata, and restore guard metadata.

Verify a backup without restoring:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --verify
```

Preview a restore plan without writing data:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --dry-run
```

Restore only after reviewing dry-run output:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --confirm
```

Confirmed restore creates a safety backup of the current state before writing data back.

Important: this drill supports `APP_STATE_REPOSITORY=local_file` only. For Postgres production, use managed database snapshots or `pg_dump` / `pg_restore` and keep this drill for local state handoff and rehearsal.

## Production Postgres Backup Runbook

T42 adds a dry-run runbook generator for production Postgres backup planning. It does not execute `pg_dump`, `pg_restore`, provider snapshots, or restore writes. It prints a sanitized plan that can be reviewed before teams run database operations in the real deployment environment.

Generate a JSON runbook:

```bash
npm run postgres:backup-runbook -- --strategy both --retention-days 30
```

Generate a text runbook:

```bash
npm run postgres:backup-runbook -- --strategy both --retention-days 30 --format text
```

Validate strictly and fail when the runbook is blocked:

```bash
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database npm run postgres:backup-runbook -- --strict
```

Supported strategies:

- `managed_snapshot`: provider-managed automated backups, on-demand snapshots, point-in-time recovery, and staging snapshot restores
- `pg_dump`: custom-format `pg_dump`, `pg_restore --list`, restore-drill database creation, and staging restore commands
- `both`: recommended production planning path because provider snapshots and logical dumps cover different recovery needs

The runbook includes:

- sanitized database URL with password masked
- repository adapter check
- `DATABASE_URL` readiness check
- retention, RPO, and RTO checks
- managed snapshot checklist
- `pg_dump` / `pg_restore` command templates
- restore drill checklist
- incident checklist for suspected data corruption

Important guardrails:

- never restore directly into production before testing in staging
- keep backup artifacts encrypted and outside the application repository
- do not paste raw `DATABASE_URL` values into logs, tickets, or chat
- record every restore drill with operator, backup id, start/end time, and verification result

Regression:

```bash
npm run test:postgres-backup-runbook
```

The regression verifies secret masking, strategy behavior, retention warnings, backup/restore command templates, and render output without connecting to a real database.

T32 adds an opt-in external audit provider over HTTP webhook. It is disabled by default and can be enabled with:

```text
AUDIT_TRAIL_EXTERNAL_PROVIDER=http_webhook
AUDIT_TRAIL_HTTP_URL=https://your-immutable-audit-provider.example/events
AUDIT_TRAIL_HTTP_SECRET=your-production-secret
AUDIT_TRAIL_EXTERNAL_REQUIRED=true
```

When enabled, each audit event is sent with HMAC SHA-256 headers:

- `x-stockflix-audit-signature`
- `x-stockflix-audit-timestamp`

Accepted external events are tracked in:

```text
data/audit-external-receipts.ndjson
```

The readiness report exposes external audit provider status, receipt count, missing external events, invalid receipt lines, and whether the provider is production-ready. The default remains local-only so local development and existing tests keep the same behavior unless the provider env is configured.

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
npm run test:postgres-repository
npm run test:postgres-importer
npm run test:audit-trail
npm run test:approval-workflow
npm run test:audit-external
npm run test:backup-restore
npm run test:postgres-backup-runbook
```

The storage readiness test creates a temporary state store, verifies a clean state is `ready`, then injects duplicate and orphaned records to confirm the report becomes `blocked`.

The state repository test verifies that the local file adapter reads, writes, exposes metadata, and preserves normalized reads without touching demo data.

The Postgres repository test uses a fake Postgres client to verify bootstrap SQL, JSONB row writes, reads, non-append collection rewrites, append-only audit table behavior, missing primary key guardrails, query-level tenant scoped reads, and repository metadata without connecting to a real database.

The Postgres importer test uses a fake Postgres client to verify dry-run plans, record counts, blocked readiness guards, forced imports with `allowBlocked`, and whole-state writes without connecting to a real database.

The audit trail test verifies that audit events are mirrored to NDJSON, access is owner/admin only, and missing/invalid mirror records are reported.

The approval workflow test verifies that `approvalRequests` are tenant-scoped, advisor/customer access is enforced, decisions are customer-owned, audit integrity remains verified, and storage readiness stays `ready`.

The external audit provider test creates a temporary local HTTP provider, verifies HMAC-signed event delivery and receipts, then confirms missing external events are reported and required provider mode fails closed when unavailable.

The backup/restore test creates temporary SaaS state, writes a backup with manifest/checksums, verifies dry-run restore, rejects unconfirmed restore, restores with `confirm`, creates a safety backup, and rejects a corrupted backup with checksum mismatch.

The Postgres backup runbook test verifies that production backup planning masks `DATABASE_URL` secrets, validates strategy/retention/readiness, and includes managed snapshot plus `pg_dump` / `pg_restore` restore-drill commands.

`npm run test-regression` and `npm run ci:quality` include this test.

## Production Migration Path

Recommended next steps:

1. Choose the production hosting environment and provision Postgres.
2. Install `pg` and set `APP_STATE_REPOSITORY=postgres` plus `DATABASE_URL`.
3. Run the app in a staging environment so the adapter bootstraps tables.
4. Run `npm run import:postgres -- --dry-run` and fix any readiness blockers.
5. Run `npm run backup:state -- --reason before-postgres-import` on the local source state.
6. Run the real importer in staging, then production.
7. Configure managed Postgres snapshots or `pg_dump` / `pg_restore` runbooks.
8. Run `npm run postgres:backup-runbook -- --strategy both --format text` and rehearse restore into staging.
9. Replace tenant-specific production flows with scoped reads after deriving allowed user ids and organization ids from the signed-in viewer.
10. Move audit events to append-only or immutable storage.
