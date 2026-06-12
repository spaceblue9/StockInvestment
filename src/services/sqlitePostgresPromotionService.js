import fs from "fs/promises";
import path from "path";
import { normalizeAppStateForImport } from "./authService.js";
import { parseDatabaseUrl } from "./postgresBackupRunbookService.js";
import { buildPostgresImportPlan, importAppStateToPostgres } from "./postgresStateImporter.js";
import { readSQLiteAppState, sqliteRepositoryInfo } from "./sqliteStateRepository.js";
import { stateCollectionDefinitions } from "./stateSchemaService.js";

const DEFAULT_SQLITE_DATABASE_PATH = path.join(process.cwd(), "data", "stockflix.sqlite");
const TRUE_VALUES = new Set(["1", "true", "yes", "y", "done", "ready", "ok", "reviewed", "verified"]);

export async function loadSQLiteTrialState(options = {}) {
  const sqliteDatabasePath = resolveSQLiteDatabasePath(options);
  const sqliteFile = await sqliteFileInfo(sqliteDatabasePath);
  const state = sqliteFile.exists
    ? await readSQLiteAppState({
      databasePath: sqliteDatabasePath,
      normalize: normalizeAppStateForImport,
    })
    : emptyState();

  return {
    sqliteDatabasePath,
    sqliteFile,
    state,
    repositoryInfo: sqliteRepositoryInfo({ databasePath: sqliteDatabasePath }),
  };
}

export async function buildSQLitePostgresPromotionPlan(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const dryRun = options.dryRun !== undefined ? Boolean(options.dryRun) : !Boolean(options.confirm);
  const allowBlocked = Boolean(options.allowBlocked);
  const loaded = options.loaded || await loadSQLiteTrialState(options);
  const importPlan = buildPostgresImportPlan(loaded.state, { dryRun: true, allowBlocked });
  const databaseUrl = cleanText(options.databaseUrl ?? env.DATABASE_URL);
  const database = parseDatabaseUrl(databaseUrl);
  const repositoryAdapter = cleanText(options.repositoryAdapter ?? env.APP_STATE_REPOSITORY ?? "local_file").toLowerCase();
  const flags = promotionFlags(options, env);
  const checks = promotionChecks({
    allowBlocked,
    database,
    dryRun,
    flags,
    importPlan,
    loaded,
    repositoryAdapter,
    usesInjectedClient: Boolean(options.client),
  });
  const summary = summarizeChecks(checks);
  const status = summary.blockers > 0 ? "blocked" : summary.warnings > 0 ? "needs_review" : "ready";

  return {
    version: "stockflix-sqlite-to-postgres-promotion-v1",
    status,
    okToPromote: status !== "blocked",
    generatedAt,
    dryRun,
    confirmRequired: true,
    allowBlocked,
    sqlite: {
      databasePath: loaded.sqliteDatabasePath,
      portablePath: portablePath(loaded.sqliteDatabasePath),
      exists: loaded.sqliteFile.exists,
      bytes: loaded.sqliteFile.bytes,
      modifiedAt: loaded.sqliteFile.modifiedAt,
      repository: {
        adapter: loaded.repositoryInfo.adapter,
        engine: loaded.repositoryInfo.engine,
        productionReady: loaded.repositoryInfo.productionReady,
        writeMode: loaded.repositoryInfo.writeMode,
      },
    },
    postgres: {
      repositoryAdapter,
      database,
      writeMode: "whole_state_transaction",
      importer: "importAppStateToPostgres",
    },
    summary,
    checks,
    importPlan,
    sanitizedEnvironment: sanitizedEnvironment({
      APP_STATE_REPOSITORY: repositoryAdapter,
      SQLITE_DATABASE_PATH: loaded.sqliteDatabasePath,
      DATABASE_URL: databaseUrl,
      SQLITE_TO_POSTGRES_PG_DRIVER_READY: flags.pgDriverReady,
      SQLITE_TO_POSTGRES_BACKUP_EVIDENCE: flags.backupEvidence,
      SQLITE_TO_POSTGRES_PROMOTION_REVIEWED: flags.promotionReviewed,
    }),
    commands: promotionCommands(loaded.sqliteDatabasePath),
    guardrails: [
      "Run dry-run first and review storage readiness before writing to Postgres.",
      "Take a managed snapshot, pg_dump, or provider backup of the target Postgres database before confirm.",
      "Do not commit SQLite database files, Postgres dumps, or customer data into Git.",
      "Run promotion in staging before production and verify login, portfolio snapshots, billing, audit events, and tenant scope.",
      "Keep SQLite trial files as temporary migration sources only; production subscriptions should use Postgres.",
    ],
    nextSteps: nextSteps(status),
  };
}

export async function promoteSQLiteTrialToPostgres(options = {}) {
  const dryRun = options.dryRun !== undefined ? Boolean(options.dryRun) : !Boolean(options.confirm);
  if (!dryRun && !options.confirm) {
    throw new Error("SQLite to Postgres promotion refuses to write without confirm. Run dry-run first, then pass --confirm intentionally.");
  }

  const loaded = await loadSQLiteTrialState(options);
  const plan = await buildSQLitePostgresPromotionPlan({
    ...options,
    dryRun,
    loaded,
  });

  if (dryRun) {
    return {
      ok: true,
      imported: false,
      plan,
    };
  }

  if (!plan.okToPromote) {
    throw new Error(`SQLite to Postgres promotion blocked: ${plan.summary.blockers} blocker(s). Run dry-run and resolve evidence/readiness first.`);
  }

  const importResult = await importAppStateToPostgres({
    state: loaded.state,
    client: options.client,
    allowBlocked: options.allowBlocked,
    dryRun: false,
  });

  return {
    ok: true,
    imported: true,
    plan,
    importResult,
  };
}

export function renderSQLitePostgresPromotionText(resultOrPlan) {
  const plan = resultOrPlan.plan || resultOrPlan;
  const lines = [
    `SQLite to Postgres Promotion (${plan.status})`,
    `Generated: ${plan.generatedAt}`,
    `Mode: ${plan.dryRun ? "dry-run" : "confirm"}`,
    `SQLite: ${plan.sqlite.portablePath} (${plan.sqlite.exists ? `${plan.sqlite.bytes} bytes` : "missing"})`,
    `Postgres: ${plan.postgres.database.safeUrl || "not configured"}`,
    `Records: ${plan.importPlan.totalRecords}`,
    `Checks: ${plan.summary.ok} ok, ${plan.summary.warnings} warnings, ${plan.summary.blockers} blockers`,
    "",
    "Environment:",
    ...Object.entries(plan.sanitizedEnvironment).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Checks:",
    ...plan.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Collection Counts:",
    ...plan.importPlan.collectionCounts.map((item) => `- ${item.collection} -> ${item.table}: ${item.records}`),
    "",
    "Commands:",
    ...plan.commands.map((command) => `- ${command}`),
    "",
    "Guardrails:",
    ...plan.guardrails.map((item) => `- ${item}`),
    "",
    "Next Steps:",
    ...plan.nextSteps.map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

function promotionChecks({ allowBlocked, database, dryRun, flags, importPlan, loaded, repositoryAdapter, usesInjectedClient }) {
  const checks = [];
  pushCheck(checks, "sqlite_file", loaded.sqliteFile.exists ? "ok" : "blocker", loaded.sqliteFile.exists
    ? `SQLite trial database exists at ${portablePath(loaded.sqliteDatabasePath)}.`
    : `SQLite trial database is missing at ${portablePath(loaded.sqliteDatabasePath)}.`);
  pushCheck(checks, "sqlite_records", importPlan.totalRecords > 0 ? "ok" : "warning", importPlan.totalRecords > 0
    ? `SQLite state contains ${importPlan.totalRecords} record(s) to promote.`
    : "SQLite state contains no promotable records.");
  pushCheck(checks, "storage_readiness", importPlan.okToImport ? "ok" : "blocker", importPlan.okToImport
    ? `Storage readiness is ${importPlan.readiness.status} with ${importPlan.readiness.blockerCount} blocker(s).`
    : `Storage readiness is blocked with ${importPlan.readiness.blockerCount} blocker(s); resolve issues before promotion${allowBlocked ? " or proceed only because allowBlocked is set" : ""}.`);
  pushCheck(checks, "repository_adapter", repositoryAdapter === "postgres" ? "ok" : "blocker", repositoryAdapter === "postgres"
    ? "APP_STATE_REPOSITORY is postgres for the target environment."
    : "Set APP_STATE_REPOSITORY=postgres before confirmed promotion.");
  pushCheck(checks, "database_url", database.configured && !database.invalid ? "ok" : "blocker", database.configured && !database.invalid
    ? `DATABASE_URL is configured for ${database.safeUrl}.`
    : "DATABASE_URL is missing or invalid; configure the target Postgres database.");
  pushCheck(checks, "pg_driver_ready", flags.pgDriverReady || usesInjectedClient ? "ok" : "blocker", flags.pgDriverReady || usesInjectedClient
    ? "Postgres write path is available for promotion."
    : "Install/verify the optional pg driver in the target environment and set SQLITE_TO_POSTGRES_PG_DRIVER_READY=true.");
  pushCheck(checks, "backup_evidence", flags.backupEvidence ? "ok" : "blocker", flags.backupEvidence
    ? "Backup evidence is recorded for the target Postgres database."
    : "Record backup evidence before confirmed promotion, for example SQLITE_TO_POSTGRES_BACKUP_EVIDENCE=<snapshot-id>.");
  pushCheck(checks, "promotion_reviewed", flags.promotionReviewed ? "ok" : "blocker", flags.promotionReviewed
    ? "Dry-run promotion plan has been reviewed."
    : "Review dry-run output and set SQLITE_TO_POSTGRES_PROMOTION_REVIEWED=true before confirmed promotion.");
  pushCheck(checks, "confirm_guard", dryRun ? "ok" : "ok", dryRun
    ? "This run is dry-run only and will not write to Postgres."
    : "Confirm mode requested; promotion will write only after all blockers are clear.");

  return checks;
}

function promotionFlags(options, env) {
  return {
    pgDriverReady: booleanFlag(options.pgDriverReady ?? env.SQLITE_TO_POSTGRES_PG_DRIVER_READY),
    backupEvidence: cleanText(options.backupEvidence ?? env.SQLITE_TO_POSTGRES_BACKUP_EVIDENCE),
    promotionReviewed: booleanFlag(options.promotionReviewed ?? env.SQLITE_TO_POSTGRES_PROMOTION_REVIEWED),
  };
}

function promotionCommands(sqliteDatabasePath) {
  const sqlitePath = portablePath(sqliteDatabasePath);
  return [
    `npm run sqlite:promote -- --sqlite "${sqlitePath}" --dry-run --format text`,
    "set APP_STATE_REPOSITORY=postgres",
    "set DATABASE_URL=postgres://<user>:****@<host>:5432/<database>",
    "set SQLITE_TO_POSTGRES_PG_DRIVER_READY=true",
    "set SQLITE_TO_POSTGRES_BACKUP_EVIDENCE=<snapshot-or-pgdump-id>",
    "set SQLITE_TO_POSTGRES_PROMOTION_REVIEWED=true",
    `npm run sqlite:promote -- --sqlite "${sqlitePath}" --confirm --format text`,
  ];
}

function nextSteps(status) {
  if (status === "ready") {
    return [
      "Run the confirm command in staging first.",
      "Verify owner login, customer login, portfolio snapshots, billing events, audit integrity, and tenant-scoped reads.",
      "Repeat the same process in production only after staging evidence is approved.",
    ];
  }

  return [
    "Resolve blocker checks shown in the dry-run output.",
    "Capture backup evidence for the target Postgres database.",
    "Review record counts and storage readiness before passing --confirm.",
  ];
}

function emptyState() {
  return Object.fromEntries(stateCollectionDefinitions().map((collection) => [collection.name, []]));
}

async function sqliteFileInfo(sqliteDatabasePath) {
  try {
    const stat = await fs.stat(sqliteDatabasePath);
    return {
      exists: true,
      bytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        exists: false,
        bytes: 0,
        modifiedAt: "",
      };
    }
    throw error;
  }
}

function resolveSQLiteDatabasePath(options = {}) {
  return path.resolve(cleanText(options.sqliteDatabasePath ?? options.databasePath ?? options.sqlite ?? options.env?.SQLITE_DATABASE_PATH ?? process.env.SQLITE_DATABASE_PATH) || DEFAULT_SQLITE_DATABASE_PATH);
}

function sanitizedEnvironment(values) {
  return Object.fromEntries(Object.entries(values).map(([key, value]) => [
    key,
    /DATABASE_URL|PASSWORD|SECRET|TOKEN|KEY/u.test(key)
      ? maskPotentialSecret(value)
      : cleanText(value) || "(not set)",
  ]));
}

function summarizeChecks(checks) {
  return checks.reduce((summary, check) => {
    if (check.severity === "warning") {
      summary.warnings += 1;
    } else if (check.severity === "blocker") {
      summary.blockers += 1;
    } else {
      summary.ok += 1;
    }
    return summary;
  }, { ok: 0, warnings: 0, blockers: 0 });
}

function pushCheck(checks, id, severity, message) {
  checks.push({ id, severity, message });
}

function portablePath(absolutePath) {
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath && !relativePath.startsWith("..") ? relativePath.replace(/\\/g, "/") : absolutePath;
}

function booleanFlag(value) {
  return TRUE_VALUES.has(cleanText(value).toLowerCase());
}

function cleanText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function maskPotentialSecret(value) {
  return cleanText(value).replace(/(:\/\/[^:\s]+:)([^@\s]+)(@)/u, "$1****$3");
}
