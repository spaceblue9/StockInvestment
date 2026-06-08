import { parseDatabaseUrl } from "./postgresBackupRunbookService.js";
import { postgresRepositoryInfo } from "./postgresStateRepository.js";

const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL/u;
const TRUE_VALUES = new Set(["1", "true", "yes", "y", "done", "ready", "ok"]);
const DEFAULT_BACKUP_STRATEGY = "both";
const DEFAULT_CANARY_USER_ID = "staging-patch-user";
const DEFAULT_CANARY_ORGANIZATION_ID = "staging-patch-org";

const patchOperationMatrix = [
  {
    operation: "upsert",
    collection: "users",
    table: "users",
    expectedSql: "INSERT ... ON CONFLICT (record_id) DO UPDATE",
    verifies: "user/account updates do not rewrite unrelated users or sessions",
  },
  {
    operation: "append",
    collection: "sessions",
    table: "user_sessions",
    expectedSql: "INSERT INTO user_sessions",
    verifies: "new sessions append and duplicate primary keys are rejected",
  },
  {
    operation: "delete",
    collection: "sessions",
    table: "user_sessions",
    expectedSql: "DELETE FROM user_sessions WHERE record_id = $1",
    verifies: "logout/expiry deletes one session instead of clearing the table",
  },
  {
    operation: "append",
    collection: "auditEvents",
    table: "audit_events",
    expectedSql: "INSERT INTO audit_events",
    verifies: "audit events remain append-only and continue to mirror business actions",
  },
];

export function buildPostgresPatchValidationRunbook(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const adapter = stringValue(options.repositoryAdapter ?? env.APP_STATE_REPOSITORY ?? "local_file").toLowerCase();
  const databaseUrl = stringValue(options.databaseUrl ?? env.DATABASE_URL);
  const database = parseDatabaseUrl(databaseUrl);
  const sslMode = stringValue(options.sslMode ?? env.DATABASE_SSL_MODE ?? "disable").toLowerCase();
  const backupStrategy = stringValue(options.backupStrategy ?? env.POSTGRES_BACKUP_STRATEGY ?? DEFAULT_BACKUP_STRATEGY).toLowerCase();
  const repositoryInfo = postgresRepositoryInfo();
  const patchWriteMode = stringValue(options.patchWriteMode ?? repositoryInfo.patchWriteMode);
  const flags = validationFlags(options, env);
  const canary = {
    userId: stringValue(options.canaryUserId ?? env.POSTGRES_PATCH_VALIDATION_CANARY_USER_ID) || DEFAULT_CANARY_USER_ID,
    organizationId: stringValue(options.canaryOrganizationId ?? env.POSTGRES_PATCH_VALIDATION_CANARY_ORGANIZATION_ID) || DEFAULT_CANARY_ORGANIZATION_ID,
  };
  const checks = readinessChecks({
    adapter,
    database,
    sslMode,
    backupStrategy,
    patchWriteMode,
    flags,
  });
  const summary = summarizeChecks(checks);
  const status = summary.blockers > 0 ? "blocked" : summary.warnings > 0 ? "needs_review" : "ready";

  return {
    version: "stockflix-postgres-patch-validation-runbook-v1",
    status,
    generatedAt,
    summary,
    database,
    patchWriteMode,
    backupStrategy,
    canary,
    checks,
    sanitizedEnvironment: sanitizedEnvironment({
      APP_STATE_REPOSITORY: adapter,
      DATABASE_URL: databaseUrl,
      DATABASE_SSL_MODE: sslMode,
      POSTGRES_BACKUP_STRATEGY: backupStrategy,
      POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY: flags.pgDriverReady,
      POSTGRES_PATCH_IMPORT_DRY_RUN_DONE: flags.importDryRunDone,
      POSTGRES_PATCH_STATE_IMPORTED: flags.stateImported,
      POSTGRES_PATCH_BACKUP_VERIFIED: flags.backupVerified,
      POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED: flags.rollbackPlanApproved,
      POSTGRES_PATCH_SMOKE_APPROVED: flags.patchSmokeApproved,
      POSTGRES_PATCH_SCOPED_READ_VERIFIED: flags.scopedReadVerified,
      POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED: flags.auditMirrorVerified,
    }),
    prerequisiteCommands: prerequisiteCommands(),
    stagingValidationPlan: stagingValidationPlan(canary),
    patchSmoke: patchSmokePlan(canary),
    verificationQueries: verificationQueries(canary),
    rollbackPlan: rollbackPlan(backupStrategy),
    evidenceChecklist: evidenceChecklist(),
  };
}

export function renderPostgresPatchValidationRunbookText(runbook) {
  const lines = [
    `Postgres Patch Write Validation Runbook (${runbook.status})`,
    `Generated: ${runbook.generatedAt}`,
    `Checks: ${runbook.summary.ok} ok, ${runbook.summary.warnings} warnings, ${runbook.summary.blockers} blockers`,
    `Database: ${runbook.database.safeUrl || "not configured"}`,
    `Patch write mode: ${runbook.patchWriteMode}`,
    "",
    "Environment:",
    ...Object.entries(runbook.sanitizedEnvironment).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Checks:",
    ...runbook.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Prerequisite Commands:",
    ...runbook.prerequisiteCommands.map((command) => `- ${command}`),
    "",
    "Staging Validation Plan:",
    ...runbook.stagingValidationPlan.map((step) => `- ${step}`),
    "",
    "Patch Smoke Matrix:",
    ...runbook.patchSmoke.operations.map((operation) => `- ${operation.operation} ${operation.collection} -> ${operation.table}: ${operation.expectedSql}`),
    "",
    "Success Criteria:",
    ...runbook.patchSmoke.successCriteria.map((item) => `- ${item}`),
    "",
    "Verification Queries:",
    ...runbook.verificationQueries.map((query) => `- ${query}`),
    "",
    "Rollback Plan:",
    ...runbook.rollbackPlan.map((item) => `- ${item}`),
    "",
    "Evidence Checklist:",
    ...runbook.evidenceChecklist.map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

function readinessChecks({ adapter, database, sslMode, backupStrategy, patchWriteMode, flags }) {
  return [
    check(
      "repository_adapter",
      adapter === "postgres" ? "ok" : "blocker",
      adapter === "postgres"
        ? "APP_STATE_REPOSITORY is postgres for staging validation."
        : "Set APP_STATE_REPOSITORY=postgres in the staging or production-like environment.",
    ),
    check(
      "database_url",
      database.configured && !database.invalid ? "ok" : "blocker",
      database.configured && !database.invalid
        ? `DATABASE_URL is configured for ${database.safeUrl}.`
        : "DATABASE_URL is missing or invalid; configure a staging Postgres database before patch validation.",
    ),
    check(
      "database_ssl_mode",
      sslMode === "require" ? "ok" : "warning",
      sslMode === "require"
        ? "DATABASE_SSL_MODE=require is configured."
        : "Use DATABASE_SSL_MODE=require for production-like validation unless the provider terminates TLS elsewhere.",
    ),
    check(
      "pg_driver_ready",
      flags.pgDriverReady ? "ok" : "blocker",
      flags.pgDriverReady
        ? "The target environment has confirmed the optional pg driver is installed."
        : "Install pg in the target environment and set POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY=true after confirming startup.",
    ),
    check(
      "patch_write_mode",
      patchWriteMode === "collection_level_transaction" ? "ok" : "blocker",
      patchWriteMode === "collection_level_transaction"
        ? "Postgres repository reports collection-level patch write mode."
        : "Postgres repository patch write mode is not collection_level_transaction.",
    ),
    check(
      "import_dry_run_done",
      flags.importDryRunDone ? "ok" : "blocker",
      flags.importDryRunDone
        ? "Postgres importer dry-run has been reviewed with no unresolved blockers."
        : "Run npm run import:postgres -- --dry-run and review storage readiness before validation.",
    ),
    check(
      "state_imported",
      flags.stateImported ? "ok" : "blocker",
      flags.stateImported
        ? "Staging state has been imported or migrated into Postgres."
        : "Import or migrate normalized state into the staging Postgres database before patch smoke.",
    ),
    check(
      "backup_verified",
      flags.backupVerified ? "ok" : "blocker",
      flags.backupVerified
        ? "A fresh managed snapshot, pg_dump, or equivalent restore point has been verified."
        : "Verify a fresh staging restore point before running patch smoke writes.",
    ),
    check(
      "rollback_plan_approved",
      flags.rollbackPlanApproved ? "ok" : "blocker",
      flags.rollbackPlanApproved
        ? "Rollback/restore plan is approved for the validation window."
        : "Approve the rollback/restore plan before running staging patch smoke writes.",
    ),
    check(
      "patch_smoke_approved",
      flags.patchSmokeApproved ? "ok" : "blocker",
      flags.patchSmokeApproved
        ? "Patch smoke write window is approved for staging."
        : "Approve a staging-only patch smoke window so canary writes cannot affect customer production data.",
    ),
    check(
      "scoped_read_verified",
      flags.scopedReadVerified ? "ok" : "warning",
      flags.scopedReadVerified
        ? "Scoped read verification has been completed after patch smoke."
        : "After patch smoke, verify customer/advisor scoped reads do not leak cross-workspace data.",
    ),
    check(
      "audit_mirror_verified",
      flags.auditMirrorVerified ? "ok" : "warning",
      flags.auditMirrorVerified
        ? "Audit mirror/hash-chain verification has been completed after patch smoke."
        : "After patch smoke, verify audit event count, hash-chain integrity, and external audit receipts if enabled.",
    ),
    check(
      "backup_strategy",
      ["managed_snapshot", "pg_dump", "both"].includes(backupStrategy) ? "ok" : "blocker",
      ["managed_snapshot", "pg_dump", "both"].includes(backupStrategy)
        ? `Postgres backup strategy is ${backupStrategy}.`
        : "Set POSTGRES_BACKUP_STRATEGY to managed_snapshot, pg_dump, or both.",
    ),
  ];
}

function prerequisiteCommands() {
  return [
    "npm run ci:quality",
    "npm run postgres:backup-runbook -- --strategy both --format text --strict",
    "npm run import:postgres -- --input data/app-state.json --dry-run",
    "APP_STATE_REPOSITORY=postgres DATABASE_URL=<staging-database-url> npm run import:postgres -- --input data/app-state.json",
    "npm run postgres:patch-validation -- --format text --strict",
  ];
}

function stagingValidationPlan(canary) {
  return [
    "Provision an isolated staging or production-like Postgres database from a verified snapshot or clean migration target.",
    "Set APP_STATE_REPOSITORY=postgres, DATABASE_URL, DATABASE_SSL_MODE=require, and confirm the pg driver is installed in that environment.",
    "Run importer dry-run, fix readiness blockers, then import normalized state into staging only.",
    "Start the app in staging and verify owner/admin can access storage readiness, operational readiness, tenant scope, billing, and audit integrity views.",
    `Run canary patch smoke for user ${canary.userId} in organization ${canary.organizationId}; do not reuse a real customer account.`,
    "Confirm patch writes update only the intended table rows and do not issue whole-table clears for users or user_sessions.",
    "Verify restricted scoped reads as customer/advisor after the canary patch smoke.",
    "Verify audit mirror/hash chain and external audit receipts when the external provider is enabled.",
    "Record evidence and keep rollback commands ready until validation is signed off.",
  ];
}

function patchSmokePlan(canary) {
  return {
    canary,
    operations: patchOperationMatrix,
    successCriteria: [
      "User upsert changes only the canary user row and uses ON CONFLICT by record_id.",
      "Session append creates one canary session row and duplicate append is rejected.",
      "Session delete removes only the canary session row with WHERE record_id = $1.",
      "Audit append creates a staging patch smoke event and append-only audit guards still reject upsert/delete maintenance unless explicitly allowed.",
      "No patch smoke statement clears an entire production table.",
    ],
  };
}

function verificationQueries(canary) {
  return [
    `SELECT record_id, record->>'email' AS email FROM users WHERE record_id = '${canary.userId}';`,
    `SELECT record_id FROM user_sessions WHERE record_id = '${canary.userId}:patch-smoke-session';`,
    `SELECT COUNT(*) FROM audit_events WHERE record->>'action' = 'staging.patch_write_smoke' AND organization_id = '${canary.organizationId}';`,
    "SELECT COUNT(*) FROM users;",
    "SELECT COUNT(*) FROM user_sessions;",
  ];
}

function rollbackPlan(strategy) {
  return [
    `Use the ${strategy} backup/restore path prepared before the patch smoke.`,
    "If validation corrupts staging data, stop the staging app before restoring.",
    "Restore into staging first, never directly into production without rehearsal.",
    "Re-run npm run import:postgres -- --dry-run and GET /api/storage/readiness after restore.",
    "Document source backup id, restore start/end time, operator, and verification result.",
  ];
}

function evidenceChecklist() {
  return [
    "Sanitized output from npm run postgres:patch-validation -- --format text --strict.",
    "Importer dry-run output and final import timestamp.",
    "Backup id or pg_dump artifact id plus restore drill evidence.",
    "Patch smoke operation ids and before/after row counts.",
    "Scoped read verification result for customer and advisor views.",
    "Audit integrity and external audit receipt verification result.",
    "Rollback decision and production go/no-go sign-off.",
  ];
}

function validationFlags(options, env) {
  return {
    pgDriverReady: booleanFlag(options.pgDriverReady ?? env.POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY),
    importDryRunDone: booleanFlag(options.importDryRunDone ?? env.POSTGRES_PATCH_IMPORT_DRY_RUN_DONE),
    stateImported: booleanFlag(options.stateImported ?? env.POSTGRES_PATCH_STATE_IMPORTED),
    backupVerified: booleanFlag(options.backupVerified ?? env.POSTGRES_PATCH_BACKUP_VERIFIED),
    rollbackPlanApproved: booleanFlag(options.rollbackPlanApproved ?? env.POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED),
    patchSmokeApproved: booleanFlag(options.patchSmokeApproved ?? env.POSTGRES_PATCH_SMOKE_APPROVED),
    scopedReadVerified: booleanFlag(options.scopedReadVerified ?? env.POSTGRES_PATCH_SCOPED_READ_VERIFIED),
    auditMirrorVerified: booleanFlag(options.auditMirrorVerified ?? env.POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED),
  };
}

function summarizeChecks(checks) {
  return {
    blockers: checks.filter((check) => check.severity === "blocker").length,
    warnings: checks.filter((check) => check.severity === "warning").length,
    ok: checks.filter((check) => check.severity === "ok").length,
    totalChecks: checks.length,
  };
}

function sanitizedEnvironment(env) {
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [key, safeValue(key, value)]));
}

function safeValue(key, value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const text = stringValue(value);
  if (!text) {
    return "(missing)";
  }

  if (key === "DATABASE_URL") {
    return parseDatabaseUrl(text).safeUrl || "(invalid)";
  }

  if (SECRET_PATTERN.test(key)) {
    return "****";
  }

  return text;
}

function check(id, severity, message) {
  return { id, severity, message };
}

function booleanFlag(value) {
  if (typeof value === "boolean") {
    return value;
  }

  return TRUE_VALUES.has(stringValue(value).toLowerCase());
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
