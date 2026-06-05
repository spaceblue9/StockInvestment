const BACKUP_STRATEGIES = ["managed_snapshot", "pg_dump", "both"];
const DEFAULT_RETENTION_DAYS = 30;
const DEFAULT_RPO_MINUTES = 60;
const DEFAULT_RTO_MINUTES = 240;

export function buildPostgresBackupRunbook(options = {}) {
  const strategy = normalizeStrategy(options.strategy || process.env.POSTGRES_BACKUP_STRATEGY || "both");
  const retentionDays = positiveInteger(options.retentionDays ?? process.env.POSTGRES_BACKUP_RETENTION_DAYS, DEFAULT_RETENTION_DAYS);
  const rpoMinutes = positiveInteger(options.rpoMinutes ?? process.env.POSTGRES_BACKUP_RPO_MINUTES, DEFAULT_RPO_MINUTES);
  const rtoMinutes = positiveInteger(options.rtoMinutes ?? process.env.POSTGRES_BACKUP_RTO_MINUTES, DEFAULT_RTO_MINUTES);
  const databaseUrl = stringValue(options.databaseUrl ?? process.env.DATABASE_URL);
  const adapter = stringValue(options.repositoryAdapter ?? process.env.APP_STATE_REPOSITORY ?? "local_file").toLowerCase();
  const generatedAt = options.generatedAt || new Date().toISOString();
  const database = parseDatabaseUrl(databaseUrl);
  const checks = readinessChecks({
    adapter,
    database,
    strategy,
    retentionDays,
    rpoMinutes,
    rtoMinutes,
  });
  const status = checks.some((check) => check.severity === "blocker")
    ? "blocked"
    : checks.some((check) => check.severity === "warning")
      ? "needs_review"
      : "ready";

  return {
    version: "stockflix-postgres-backup-runbook-v1",
    status,
    generatedAt,
    strategy,
    retentionDays,
    rpoMinutes,
    rtoMinutes,
    database,
    checks,
    guardrails: [
      "Never run production restore before testing the backup in staging.",
      "Always take or verify a fresh managed snapshot before a migration/import.",
      "Keep backup artifacts encrypted and outside the application repository.",
      "Do not paste raw DATABASE_URL values into tickets, logs, or chat.",
      "Record every production restore drill with timestamp, operator, backup id, duration, and verification result.",
    ],
    managedSnapshot: managedSnapshotPlan(strategy),
    pgDump: pgDumpPlan(strategy, database),
    restoreDrill: restoreDrillPlan(strategy, database),
    incidentChecklist: incidentChecklist(strategy),
  };
}

export function renderPostgresBackupRunbookText(runbook) {
  const lines = [
    `Postgres Backup Runbook (${runbook.status})`,
    `Generated: ${runbook.generatedAt}`,
    `Strategy: ${runbook.strategy}`,
    `Retention: ${runbook.retentionDays} days`,
    `RPO/RTO: ${runbook.rpoMinutes}m / ${runbook.rtoMinutes}m`,
    `Database: ${runbook.database.safeUrl || "not configured"}`,
    "",
    "Checks:",
    ...runbook.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Guardrails:",
    ...runbook.guardrails.map((item) => `- ${item}`),
    "",
    "Managed Snapshot:",
    ...runbook.managedSnapshot.steps.map((item) => `- ${item}`),
    "",
    "pg_dump Commands:",
    ...runbook.pgDump.commands.map((item) => `- ${item}`),
    "",
    "Restore Drill:",
    ...runbook.restoreDrill.steps.map((item) => `- ${item}`),
    "",
    "Incident Checklist:",
    ...runbook.incidentChecklist.map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

export function parseDatabaseUrl(databaseUrl = "") {
  const raw = stringValue(databaseUrl);
  if (!raw) {
    return {
      configured: false,
      safeUrl: "",
      host: "",
      port: "",
      database: "",
      user: "",
    };
  }

  try {
    const parsed = new URL(raw);
    const safe = new URL(raw);
    if (safe.password) {
      safe.password = "****";
    }
    if (safe.username) {
      safe.username = encodeURIComponent(decodeURIComponent(safe.username));
    }

    return {
      configured: true,
      safeUrl: safe.toString(),
      protocol: parsed.protocol.replace(/:$/u, ""),
      host: parsed.hostname,
      port: parsed.port || "5432",
      database: parsed.pathname.replace(/^\//u, ""),
      user: decodeURIComponent(parsed.username || ""),
    };
  } catch {
    return {
      configured: false,
      invalid: true,
      safeUrl: maskPotentialSecret(raw),
      host: "",
      port: "",
      database: "",
      user: "",
    };
  }
}

function readinessChecks({ adapter, database, strategy, retentionDays, rpoMinutes, rtoMinutes }) {
  const checks = [];

  pushCheck(checks, "repository_adapter", adapter === "postgres" ? "ok" : "warning", adapter === "postgres"
    ? "APP_STATE_REPOSITORY is set to postgres for production backup planning."
    : "APP_STATE_REPOSITORY is not postgres; this runbook is a production planning dry-run.");
  pushCheck(checks, "database_url", database.configured && !database.invalid ? "ok" : "blocker", database.configured && !database.invalid
    ? "DATABASE_URL is configured and can be sanitized for runbook output."
    : "DATABASE_URL is missing or invalid; set it only in the target deployment environment.");
  pushCheck(checks, "backup_strategy", BACKUP_STRATEGIES.includes(strategy) ? "ok" : "blocker", `Backup strategy is ${strategy}.`);
  pushCheck(checks, "retention_days", retentionDays >= 7 ? "ok" : "warning", retentionDays >= 7
    ? `Retention is ${retentionDays} days.`
    : "Retention is below 7 days; production subscriptions should keep longer recovery windows.");
  pushCheck(checks, "rpo_minutes", rpoMinutes <= 240 ? "ok" : "warning", rpoMinutes <= 240
    ? `RPO target is ${rpoMinutes} minutes.`
    : "RPO target is loose; consider more frequent snapshots or WAL/PITR.");
  pushCheck(checks, "rto_minutes", rtoMinutes <= 480 ? "ok" : "warning", rtoMinutes <= 480
    ? `RTO target is ${rtoMinutes} minutes.`
    : "RTO target is loose; rehearse restore automation and verification.");

  return checks;
}

function managedSnapshotPlan(strategy) {
  const enabled = ["managed_snapshot", "both"].includes(strategy);
  return {
    enabled,
    steps: enabled
      ? [
        "Enable provider-managed automated backups and point-in-time recovery.",
        "Create an on-demand snapshot before importer runs, schema changes, or major payment provider changes.",
        "Verify snapshot retention and encryption settings in the cloud database console.",
        "Restore the latest snapshot into staging at least once per release cycle.",
      ]
      : ["Managed snapshot strategy is disabled for this runbook."],
  };
}

function pgDumpPlan(strategy, database) {
  const enabled = ["pg_dump", "both"].includes(strategy);
  if (!enabled) {
    return {
      enabled: false,
      commands: ["pg_dump strategy is disabled for this runbook."],
    };
  }

  const target = database.safeUrl || "$DATABASE_URL";
  return {
    enabled: true,
    commands: [
      `pg_dump --format=custom --no-owner --no-privileges --dbname="${target}" --file="backups/stockflix-$(date +%Y%m%d-%H%M%S).dump"`,
      `pg_restore --list "backups/<backup-file>.dump"`,
      `createdb stockflix_restore_drill`,
      `pg_restore --clean --if-exists --no-owner --dbname="postgres://<user>:****@<host>:5432/stockflix_restore_drill" "backups/<backup-file>.dump"`,
    ],
  };
}

function restoreDrillPlan(strategy, database) {
  return {
    required: true,
    targetEnvironment: "staging_or_restore_drill_database",
    steps: [
      "Select the newest backup artifact or managed snapshot.",
      "Restore into an isolated staging database, never directly into production first.",
      "Set APP_STATE_REPOSITORY=postgres and DATABASE_URL to the restored staging database.",
      "Run npm run test:postgres-repository against fake client in CI and run app smoke tests against staging.",
      "Open owner Business dashboard and verify Ops Readiness, DB Readiness, Audit Integrity, payment sessions, and tenant scope.",
      `Record source database ${database.safeUrl || "not configured"}, strategy ${strategy}, start/end time, operator, and verification result.`,
    ],
  };
}

function incidentChecklist(strategy) {
  return [
    "Freeze risky writes if data corruption is suspected.",
    "Capture current operational readiness output from GET /api/ops/readiness.",
    "Identify last known-good backup, snapshot id, or pg_dump artifact.",
    `Use ${strategy} restore path in staging before production restore.`,
    "Verify users, organizations, subscriptions, payment sessions, approval requests, and audit events.",
    "Communicate expected RPO/RTO to stakeholders before production restore.",
  ];
}

function pushCheck(checks, id, severity, message) {
  checks.push({
    id,
    severity,
    message,
  });
}

function normalizeStrategy(strategy) {
  const value = stringValue(strategy).toLowerCase();
  return BACKUP_STRATEGIES.includes(value) ? value : "both";
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function maskPotentialSecret(value) {
  return stringValue(value).replace(/(:\/\/[^:\s]+:)([^@\s]+)(@)/u, "$1****$3");
}
