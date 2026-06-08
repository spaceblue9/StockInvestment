# Production Database Migration Foundation

The current SaaS prototype stores account, tenant, billing, payment, and audit data in `data/app-state.json`.

T27 adds a migration foundation so the project can move from that local file to a production database with fewer surprises.

T28 adds a repository layer in `src/services/stateRepository.js`. The app still uses the local file adapter, but `authService` now reads and writes state through this repository boundary instead of touching the JSON file directly.

T35 adds an opt-in Postgres state adapter behind the same repository boundary. The default remains `local_file` so local development and existing demo behavior stay unchanged.

T37 adds a one-time importer from normalized `app-state.json` into the Postgres adapter. It supports dry-run readiness checks before writing to a database.

T39 adds a local backup/restore drill for `app-state.json`, the audit mirror, and external audit receipts. It is a file-backed safety drill before production database cutover.

T40 adds a Postgres scoped read helper so production flows can apply tenant filters in SQL before JSONB records leave the database.

T48 adds a service-level tenant scoped read wrapper for customer/workspace read APIs. In local-file mode it applies an in-memory filter guard, while the Postgres path can use `readScopedAppState()` to apply query-level filters before returning tenant records.

T49 adds a logical state patch write foundation. Local-file mode still writes the full JSON file after applying a patch, but service code can start describing writes as collection-level `upsert`, `append`, and `delete` operations that map more cleanly to future database DML.

T50 starts adopting that boundary in business flows. Investor profile saves, payment session creation, and approval request creation now write through `patchAppState()` with paired append-only audit events while keeping behavior and regression output unchanged.

T51 expands adoption to more complex multi-record flows. Payment webhook success/failure, rejected webhook logging, billing activation, already-paid webhook reconciliation, and approval decisions now use logical patch operations while preserving duplicate provider-event behavior and audit hash-chain integrity.

T52 expands patch write adoption to workspace and team administration flows. Organization create/update, member moves, role updates, advisor assignment, and advisor unassignment now use logical patch operations while preserving permission checks, tenant visibility, and audit events.

T53 expands patch write adoption to auth session flows. Session creation now appends `sessions`, logout deletes the matching session and appends `auth.logout`, expired-session cleanup deletes stale sessions, and standalone audit recording appends `auditEvents` through the patch boundary.

T54 expands patch write adoption to account and portfolio snapshot flows. Registration now upserts the created workspace, appends the new user, and appends `auth.register`; login upserts the updated user and appends `auth.login`; saved portfolio snapshots upsert by `userId` and append `analysis.snapshot_saved`.

T55 adds a Postgres collection-level patch write path. When `APP_STATE_REPOSITORY=postgres`, `patchAppState()` now validates the logical patch against the current state, then maps `upsert`, `append`, and `delete` operations to table-level statements in one Postgres transaction instead of calling the whole-state repository write path.

T56 adds a Postgres patch write staging validation runbook. It is a dry-run CLI for planning real staging validation of collection-level patch writes, scoped reads, audit mirror checks, and rollback evidence without connecting to a database in CI.

T57 adds a Postgres patch smoke execution harness. It defaults to dry-run, requires `--confirm` before writing canary data, emits sanitized evidence, and can exercise the Postgres patch write path in staging with guardrails.

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
- `patchAppState(patch, { normalize })`
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

## Logical State Patch Writes

The state patch helper lives in `src/services/statePatchService.js` and currently supports:

- `upsert`: insert or merge a record by the collection primary key from the schema manifest
- `append`: add a new record and reject duplicate primary keys unless explicitly deduped
- `delete`: remove a record by primary key

Append-only collections such as `auditEvents` are guarded:

- `append` is the normal supported write path
- `upsert` is rejected unless explicitly allowed for controlled maintenance
- `delete` is rejected unless explicitly allowed for controlled maintenance

The repository exposes:

```js
patchAppState({
  operations: [
    {
      type: "upsert",
      collection: "paymentSessions",
      record: {
        id: "payment_123",
        userId: "user_123",
        organizationId: "org_123",
        status: "pending",
      },
    },
    {
      type: "append",
      collection: "auditEvents",
      record: {
        id: "audit_123",
        action: "payment.session_created",
        actorUserId: "user_123",
        organizationId: "org_123",
      },
    },
  ],
});
```

In local-file mode this still performs:

```text
read current state -> apply logical patch -> write app-state.json
```

In Postgres mode this now performs:

```text
read current state -> validate/apply logical patch -> run collection-level table transaction
```

The important production value is that write callers can move away from hand-editing whole state objects. The Postgres path maps the same patch operations to table-level `INSERT ... ON CONFLICT`, append-only inserts, and targeted deletes by `record_id`.

First adopted app flows:

- `saveInvestorProfile()`: upserts `investorProfiles` and appends `profile.update`
- `createPaymentSession()`: appends `paymentSessions` and `payment.session_created`
- `createApprovalRequest()`: appends `approvalRequests` and `approval.request_created`
- `processPaymentWebhookInState()`: upserts `paymentSessions`, appends `paymentWebhookEvents`, appends paid `billingEvents`, upserts the subscribed `users` record when needed, and appends payment/billing audit events
- `processSignedPaymentWebhook()` and `processProviderPaymentWebhook()`: append rejected `paymentWebhookEvents` and `payment.webhook_rejected` audit events through the patch boundary
- `decideApprovalRequest()`: upserts decided `approvalRequests` and appends approval decision audit events
- `createOrganization()` and `updateOrganization()`: append/upsert `organizations` and append workspace audit events
- `moveUserToOrganization()` and `updateUserRole()`: upsert `users`, upsert touched `organizations`, delete stale `advisorAssignments` when needed, and append team/workspace audit events
- `assignAdvisor()`: append/upsert/delete `advisorAssignments` and append advisor assignment audit events
- `createSession()`, `logoutSession()`, and expired-session cleanup in `getUserFromRequest()`: append or delete `sessions` without rewriting unrelated collections during normal local-file patch flow
- `recordAuditEvent()`: appends standalone `auditEvents` through the patch boundary while preserving audit hash-chain generation
- `createUser()`: upserts the owner/customer `organizations` record, appends `users`, and appends `auth.register`
- `loginUser()`: upserts the updated `users` record and appends `auth.login`
- `saveCustomerPortfolioSnapshot()`: upserts `portfolioSnapshots` by `userId` and appends `analysis.snapshot_saved`

These flows still fall back to the old whole-state write path if an audit append would require pruning beyond the local `MAX_AUDIT_EVENTS` cap. That keeps local-file behavior stable while allowing normal writes to use the patch boundary.

Postgres patch write mapping:

- `upsert`: writes one row with `INSERT ... ON CONFLICT (record_id) DO UPDATE`
- `append`: writes one row with plain `INSERT`, after logical duplicate checks
- `delete`: deletes one row with `DELETE ... WHERE record_id = $1`
- append-only guards and duplicate append behavior are still validated through `applyStatePatch()`

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

The first customer/workspace read APIs now use this pattern through the auth service:

- portfolio snapshot reads
- investor profile reads
- billing history
- payment session history
- approval request listing
- audit timeline
- tenant scope summary
- workspace organization and user listing

The helper still keeps write flows on whole-state reads so updates can preserve unrelated records until a narrower write model is introduced.

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

## Postgres Patch Write Validation Runbook

T56 adds a dry-run runbook generator for validating collection-level patch writes in staging or a production-like database before enabling paid subscription traffic on the Postgres adapter. It does not connect to Postgres and does not write data. It prints a sanitized readiness plan that a deploy operator can use before running real canary writes.

Generate a JSON runbook:

```bash
npm run postgres:patch-validation
```

Generate a text runbook:

```bash
npm run postgres:patch-validation -- --format text
```

Validate strictly and fail when the runbook is blocked:

```bash
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database DATABASE_SSL_MODE=require npm run postgres:patch-validation -- --strict
```

Readiness flags used by the runbook:

```text
POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY=true
POSTGRES_PATCH_IMPORT_DRY_RUN_DONE=true
POSTGRES_PATCH_STATE_IMPORTED=true
POSTGRES_PATCH_BACKUP_VERIFIED=true
POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED=true
POSTGRES_PATCH_SMOKE_APPROVED=true
POSTGRES_PATCH_SCOPED_READ_VERIFIED=true
POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED=true
```

The runbook checks:

- `APP_STATE_REPOSITORY=postgres`
- sanitized `DATABASE_URL`
- `DATABASE_SSL_MODE=require`
- optional `pg` driver readiness in the target environment
- repository metadata `patchWriteMode=collection_level_transaction`
- importer dry-run and staging state import completion
- backup/restore point and rollback plan approval
- staging-only patch smoke approval
- scoped read and audit mirror/hash-chain verification status

Patch smoke matrix:

- `upsert users` -> `INSERT ... ON CONFLICT (record_id) DO UPDATE`
- `append sessions` -> plain `INSERT INTO user_sessions`
- `delete sessions` -> `DELETE FROM user_sessions WHERE record_id = $1`
- `append auditEvents` -> plain `INSERT INTO audit_events`

The intended staging validation is:

1. Prepare an isolated staging database and restore point.
2. Run importer dry-run and real import in staging after readiness blockers are fixed.
3. Start the app with the Postgres adapter.
4. Run canary patch writes against staging-only user/session/audit ids.
5. Verify row counts and scoped reads after the smoke writes.
6. Verify audit mirror/hash-chain and external audit receipts if enabled.
7. Record backup id, patch operation ids, verification output, rollback decision, and go/no-go sign-off.

Regression:

```bash
npm run test:postgres-patch-validation
```

The regression verifies secret masking, ready/needs_review/blocked status handling, patch smoke matrix, verification queries, rollback plan, and strict CLI behavior without connecting to a real database.

## Postgres Patch Smoke Harness

T57 adds a dry-run-first CLI for executing a staging canary patch smoke only after the validation runbook, importer, backup, and rollback evidence are ready. The command defaults to dry-run and will not write data without `--confirm`.

Preview the canary patch and evidence shape:

```bash
npm run postgres:patch-smoke -- --format text
```

Execute in staging after reviewing the runbook and attaching backup evidence:

```bash
APP_STATE_REPOSITORY=postgres \
DATABASE_URL=postgres://user:password@host:5432/database \
DATABASE_SSL_MODE=require \
NODE_ENV=staging \
POSTGRES_PATCH_VALIDATION_READY=true \
POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE=snapshot-id \
npm run postgres:patch-smoke -- --confirm --format json --strict
```

The smoke patch performs:

- `upsert organizations` for a staging canary workspace
- `upsert users` for a staging canary user
- `append sessions` for a staging canary session
- `delete sessions` for the same canary session
- `append auditEvents` with a hash chained to the latest audit event when executed

Execution guards:

- `APP_STATE_REPOSITORY` must be `postgres`
- `DATABASE_URL` must be configured and sanitized in output
- `DATABASE_SSL_MODE=require` is recommended for production-like validation
- default mode is dry-run unless `--confirm` is passed
- `NODE_ENV=production` is blocked unless `--allow-production` is passed intentionally
- canary ids must contain `staging` or `canary`
- `POSTGRES_PATCH_VALIDATION_READY=true` and `POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE` are required for real execution

The output includes before/after collection counts, patch summary, backup evidence id, canary ids, and a rollback reminder. Keep this output with release evidence.

Regression:

```bash
npm run test:postgres-patch-smoke
```

The regression verifies dry-run default behavior, blocked guard behavior, confirmed execution through an injected fake writer, evidence counts, audit hash chaining, CLI strict behavior, and secret masking without connecting to a real database.

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
npm run test:state-patch
npm run test:scoped-read
npm run test:postgres-repository
npm run test:postgres-importer
npm run test:audit-trail
npm run test:approval-workflow
npm run test:audit-external
npm run test:backup-restore
npm run test:postgres-backup-runbook
npm run test:postgres-patch-validation
npm run test:postgres-patch-smoke
```

The storage readiness test creates a temporary state store, verifies a clean state is `ready`, then injects duplicate and orphaned records to confirm the report becomes `blocked`.

The state repository test verifies that the local file adapter reads, writes, exposes metadata, and preserves normalized reads without touching demo data.

The state patch test verifies pure patch behavior, repository-level patch writes, and adopted app flows. It confirms unrelated collections are preserved, upserts merge by primary key, audit events append safely, invalid patches are rejected, duplicate append is blocked, append-only audit deletion is guarded, account registration/login/portfolio snapshot writes persist their paired records and audit events, investor profile/payment session/approval request writes still persist their paired audit events, and auth session create/logout/expired cleanup plus standalone audit recording still work through the patch boundary.

The Postgres repository test verifies bootstrap SQL, whole-state transaction compatibility, scoped read SQL filters, and collection-level patch writes using a fake Postgres client. It confirms table-level user upsert, session append/delete by `record_id`, audit append, duplicate append rejection, append-only upsert rejection, and that patch writes do not clear unrelated tables.

The subscription lifecycle test now also verifies that a new signed success webhook on an already-paid session is recorded without creating a duplicate invoice. The approval workflow test verifies approve/reject decisions still preserve tenant scope and audit integrity after moving to patch writes.

The tenant access and scoped read tests cover workspace/team patch-write adoption. They verify role updates, member moves, advisor assignments, organization create/update, workspace visibility, tenant metadata, and audit integrity remain correct.

The scoped read test verifies that customer/advisor read APIs and direct tenant filters do not leak users, organizations, portfolio snapshots, billing events, payment sessions, approval requests, or audit events across workspace boundaries.

The Postgres repository test uses a fake Postgres client to verify bootstrap SQL, JSONB row writes, reads, non-append collection rewrites, append-only audit table behavior, missing primary key guardrails, query-level tenant scoped reads, and repository metadata without connecting to a real database.

The Postgres importer test uses a fake Postgres client to verify dry-run plans, record counts, blocked readiness guards, forced imports with `allowBlocked`, and whole-state writes without connecting to a real database.

The audit trail test verifies that audit events are mirrored to NDJSON, access is owner/admin only, and missing/invalid mirror records are reported.

The approval workflow test verifies that `approvalRequests` are tenant-scoped, advisor/customer access is enforced, decisions are customer-owned, audit integrity remains verified, and storage readiness stays `ready`.

The external audit provider test creates a temporary local HTTP provider, verifies HMAC-signed event delivery and receipts, then confirms missing external events are reported and required provider mode fails closed when unavailable.

The backup/restore test creates temporary SaaS state, writes a backup with manifest/checksums, verifies dry-run restore, rejects unconfirmed restore, restores with `confirm`, creates a safety backup, and rejects a corrupted backup with checksum mismatch.

The Postgres backup runbook test verifies that production backup planning masks `DATABASE_URL` secrets, validates strategy/retention/readiness, and includes managed snapshot plus `pg_dump` / `pg_restore` restore-drill commands.

The Postgres patch validation test verifies that staging validation planning masks `DATABASE_URL` secrets, reports ready/needs_review/blocked status, includes the collection-level patch smoke matrix, emits verification queries and rollback steps, and fails strict CLI mode while blocked.

The Postgres patch smoke test verifies that the canary smoke harness defaults to dry-run, blocks unsafe execution, executes through an injected fake writer when confirmed, emits before/after evidence, preserves audit hash chaining, and masks `DATABASE_URL` secrets.

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
9. Run `npm run postgres:patch-validation -- --format text --strict` in staging after importer, backup, rollback, scoped-read, and audit evidence is ready.
10. Run `npm run postgres:patch-smoke -- --confirm --format json --strict` in staging after reviewing the dry-run output and attaching backup evidence.
11. Continue replacing tenant-specific production flows with scoped reads after deriving allowed user ids and organization ids from the signed-in viewer.
12. Move any remaining write flows from whole-state updates to `patchAppState()` operations and validate them through the Postgres patch runbook/smoke harness.
13. Move audit events to append-only or immutable storage.
