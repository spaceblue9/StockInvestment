import { parseDatabaseUrl } from "./postgresBackupRunbookService.js";
import {
  DEFAULT_REFERENCE_MASTER_FILE,
  loadReferenceMaster,
} from "./referenceMasterService.js";
import {
  buildReferenceMasterFreshnessReport,
  buildReferenceMasterMigrationPlan,
  readReferenceMasterFromPostgresClient,
  referenceMasterRepositoryInfo,
  writeReferenceMasterToPostgresClient,
} from "./referenceMasterRepository.js";

const POSTGRES_DRIVER = "pg";
const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL/u;

export async function runReferenceMasterMigration(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const confirm = Boolean(options.confirm);
  const dryRun = options.dryRun === undefined ? !confirm : Boolean(options.dryRun);
  const inputFile = stringValue(options.inputFile || env.REFERENCE_MASTER_MIGRATION_INPUT || DEFAULT_REFERENCE_MASTER_FILE);
  const adapter = stringValue(options.repositoryAdapter ?? env.REFERENCE_MASTER_REPOSITORY ?? "local_file").toLowerCase();
  const databaseUrl = stringValue(options.databaseUrl ?? env.DATABASE_URL);
  const database = parseDatabaseUrl(databaseUrl);
  const sslMode = stringValue(options.sslMode ?? env.DATABASE_SSL_MODE ?? "disable").toLowerCase();
  const nodeEnv = stringValue(options.nodeEnv ?? env.NODE_ENV ?? "development").toLowerCase();
  const allowProduction = Boolean(options.allowProduction);
  const replace = Boolean(options.replace);
  const backupEvidence = stringValue(options.backupEvidence ?? env.REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE);
  const stagingReady = Boolean(options.stagingReady ?? truthy(env.REFERENCE_MASTER_MIGRATION_STAGING_READY));
  const migrationPlanReviewed = Boolean(options.migrationPlanReviewed ?? truthy(env.REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED));
  const staleAfterDays = positiveInteger(options.staleAfterDays, undefined);
  const limit = positiveInteger(options.limit, 25);
  const master = options.master || await loadReferenceMaster(inputFile);
  const migrationPlan = buildReferenceMasterMigrationPlan(master, {
    execute: !dryRun,
    replace,
    staleAfterDays,
    limit,
    generatedAt,
  });
  const freshnessReport = buildReferenceMasterFreshnessReport(master, {
    staleAfterDays,
    limit,
    generatedAt,
  });
  const checks = migrationChecks({
    adapter,
    database,
    sslMode,
    nodeEnv,
    allowProduction,
    dryRun,
    confirm,
    backupEvidence,
    stagingReady,
    migrationPlanReviewed,
    migrationPlan,
  });
  const summary = summarizeChecks(checks);
  const blocked = summary.blockers > 0;
  let beforeCounts = null;
  let afterCounts = null;
  let executed = false;

  if (!dryRun && !blocked) {
    await withReferenceMasterClient(options, { databaseUrl, sslMode }, async (client) => {
      beforeCounts = await referenceMasterCounts(client, generatedAt);
      await writeReferenceMasterToPostgresClient(client, master, { replace });
      afterCounts = await referenceMasterCounts(client, generatedAt);
      executed = true;
    });
  }

  const status = blocked ? "blocked" : executed ? "executed" : "dry_run";
  const repository = referenceMasterRepositoryInfo({
    adapter,
    filePath: inputFile,
    staleAfterDays,
  });

  return {
    version: "stockflix-reference-master-migration-v1",
    status,
    executed,
    dryRun,
    confirmRequired: !confirm,
    generatedAt,
    inputFile,
    database,
    repository,
    sanitizedEnvironment: sanitizedEnvironment({
      NODE_ENV: nodeEnv,
      REFERENCE_MASTER_REPOSITORY: adapter,
      DATABASE_URL: databaseUrl,
      DATABASE_SSL_MODE: sslMode,
      REFERENCE_MASTER_MIGRATION_STAGING_READY: stagingReady,
      REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE: backupEvidence,
      REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED: migrationPlanReviewed,
    }),
    checks,
    summary,
    migrationPlan: {
      ...migrationPlan,
      mode: executed ? "execute" : "dry_run",
    },
    freshnessReport,
    evidence: {
      backupEvidence: backupEvidence || "(missing)",
      replaceExisting: replace,
      beforeCounts,
      afterCounts,
      sourceRows: migrationPlan.totalRows,
      plannedUpserts: migrationPlan.operations.upsertRows,
      freshnessStatus: freshnessReport.status,
      needsReviewRows: freshnessReport.totals.needsReviewRows,
      staleRows: freshnessReport.totals.staleRows,
      verificationChecklist: verificationChecklist(),
      rollbackReminder: "Use the verified staging backup or snapshot before promoting reference master migration to production.",
    },
  };
}

export function renderReferenceMasterMigrationText(result) {
  const lines = [
    `Reference Master Migration (${result.status})`,
    `Generated: ${result.generatedAt}`,
    `Executed: ${result.executed ? "yes" : "no"}`,
    `Input: ${result.inputFile}`,
    `Database: ${result.database.safeUrl || "not configured"}`,
    `Table: ${result.migrationPlan.table}`,
    "",
    "Environment:",
    ...Object.entries(result.sanitizedEnvironment).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Checks:",
    ...result.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Migration Plan:",
    `- mode: ${result.migrationPlan.mode}`,
    `- source rows: ${result.migrationPlan.totalRows}`,
    `- planned upserts: ${result.migrationPlan.operations.upsertRows}`,
    `- replace existing: ${result.migrationPlan.replaceExisting ? "yes" : "no"}`,
    `- needs review rows: ${result.migrationPlan.coverage.needsReviewRows}`,
    `- stale rows: ${result.migrationPlan.coverage.staleRows}`,
    "",
    "Evidence:",
    `- backupEvidence: ${result.evidence.backupEvidence}`,
    `- beforeCounts: ${result.evidence.beforeCounts ? JSON.stringify(result.evidence.beforeCounts) : "(not executed)"}`,
    `- afterCounts: ${result.evidence.afterCounts ? JSON.stringify(result.evidence.afterCounts) : "(not executed)"}`,
    `- freshnessStatus: ${result.evidence.freshnessStatus}`,
    `- needsReviewRows: ${result.evidence.needsReviewRows}`,
    `- staleRows: ${result.evidence.staleRows}`,
    `- rollbackReminder: ${result.evidence.rollbackReminder}`,
    "",
    "Verification Checklist:",
    ...result.evidence.verificationChecklist.map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

async function withReferenceMasterClient(options, databaseConfig, action) {
  if (options.client) {
    return action(options.client);
  }

  if (typeof options.clientFactory === "function") {
    const client = await options.clientFactory(databaseConfig);
    return action(client);
  }

  const { Pool } = await import(POSTGRES_DRIVER).catch((error) => {
    throw new Error(`Reference master migration requires optional '${POSTGRES_DRIVER}' package for execution. Run npm install pg in the target environment. ${error.message}`);
  });
  const pool = new Pool({
    connectionString: databaseConfig.databaseUrl,
    ssl: databaseConfig.sslMode === "require" ? { rejectUnauthorized: false } : undefined,
  });
  const client = await pool.connect();
  try {
    return await action(client);
  } finally {
    client.release();
    await pool.end();
  }
}

async function referenceMasterCounts(client, generatedAt) {
  const master = await readReferenceMasterFromPostgresClient(client, { generatedAt });
  return {
    rows: master.records.length,
    needsReviewRows: master.totals.needsReviewRows,
    completeRows: master.totals.completeRows,
  };
}

function migrationChecks({ adapter, database, sslMode, nodeEnv, allowProduction, dryRun, confirm, backupEvidence, stagingReady, migrationPlanReviewed, migrationPlan }) {
  return [
    check(
      "reference_master_repository",
      adapter === "postgres" ? "ok" : "blocker",
      adapter === "postgres"
        ? "REFERENCE_MASTER_REPOSITORY is postgres."
        : "Set REFERENCE_MASTER_REPOSITORY=postgres before executing reference master migration.",
    ),
    check(
      "database_url",
      database.configured && !database.invalid ? "ok" : "blocker",
      database.configured && !database.invalid
        ? `DATABASE_URL is configured for ${database.safeUrl}.`
        : "DATABASE_URL is missing or invalid.",
    ),
    check(
      "database_ssl_mode",
      sslMode === "require" ? "ok" : "warning",
      sslMode === "require"
        ? "DATABASE_SSL_MODE=require is configured."
        : "Use DATABASE_SSL_MODE=require for staging or production-like migration.",
    ),
    check(
      "confirm_guard",
      confirm ? "ok" : "warning",
      confirm
        ? "Confirm guard is present; migration execution is allowed if no blocker remains."
        : "Dry-run only. Pass --confirm after reviewing output to execute migration writes.",
    ),
    check(
      "production_guard",
      nodeEnv === "production" && !allowProduction ? "blocker" : "ok",
      nodeEnv === "production" && !allowProduction
        ? "Refusing production migration without --allow-production; use staging first."
        : `NODE_ENV=${nodeEnv || "development"} is allowed for this migration mode.`,
    ),
    check(
      "staging_marker",
      stagingReady ? "ok" : dryRun ? "warning" : "blocker",
      stagingReady
        ? "Reference master staging marker is set."
        : "Set REFERENCE_MASTER_MIGRATION_STAGING_READY=true after selecting the staging database.",
    ),
    check(
      "backup_evidence",
      backupEvidence ? "ok" : dryRun ? "warning" : "blocker",
      backupEvidence
        ? "Backup/restore evidence id is attached."
        : "Attach REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE before executing migration writes.",
    ),
    check(
      "migration_plan_reviewed",
      migrationPlanReviewed ? "ok" : dryRun ? "warning" : "blocker",
      migrationPlanReviewed
        ? "Migration dry-run plan has been reviewed."
        : "Review npm run reference:migrate -- --dry-run output and set REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED=true before executing.",
    ),
    check(
      "migration_summary",
      migrationPlan.totalRows > 0 && migrationPlan.operations.upsertRows === migrationPlan.totalRows ? "ok" : "blocker",
      migrationPlan.totalRows > 0
        ? `Migration plan will upsert ${migrationPlan.operations.upsertRows} reference rows.`
        : "Reference master has no rows to migrate.",
    ),
    check(
      "private_data_guard",
      "ok",
      "Migration reads only reference master JSON; private portfolio workbooks are not imported.",
    ),
  ];
}

function verificationChecklist() {
  return [
    "Run npm run reference:freshness -- --dry-run and compare counts with migration evidence.",
    "Verify reference_master_records row count equals sourceRows.",
    "Verify needsReviewRows and staleRows match the Business dashboard Reference Master Review summary.",
    "Verify owner/admin can still open /api/admin/reference-master after migration.",
    "Verify customer/advisor still receive 403 from reference master admin APIs.",
    "Keep the staging backup evidence until owner/admin sign-off is complete.",
  ];
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

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function truthy(value) {
  return /^(1|true|yes|y|ready|done|ok)$/u.test(stringValue(value).toLowerCase());
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
