import {
  buildPostgresBackupRunbook,
  parseDatabaseUrl,
  renderPostgresBackupRunbookText,
} from "../src/services/postgresBackupRunbookService.js";

const secretUrl = "postgres://stockflix:super-secret-password@db.example.com:5432/stockflix_prod";
const runbook = buildPostgresBackupRunbook({
  strategy: "both",
  retentionDays: 30,
  rpoMinutes: 60,
  rtoMinutes: 240,
  databaseUrl: secretUrl,
  repositoryAdapter: "postgres",
  generatedAt: "2026-06-04T14:00:58.000Z",
});

assertEqual(runbook.status, "ready", "Configured Postgres backup runbook should be ready.");
assertEqual(runbook.database.host, "db.example.com", "Runbook should parse database host.");
assertEqual(runbook.database.database, "stockflix_prod", "Runbook should parse database name.");
assert(!JSON.stringify(runbook).includes("super-secret-password"), "Runbook JSON must not expose database password.");
assert(runbook.database.safeUrl.includes("****"), "Runbook should mask database password.");
assert(runbook.managedSnapshot.steps.length >= 3, "Runbook should include managed snapshot steps.");
assert(runbook.pgDump.commands.some((command) => command.includes("pg_dump")), "Runbook should include pg_dump command.");
assert(runbook.pgDump.commands.some((command) => command.includes("pg_restore")), "Runbook should include pg_restore command.");
assert(runbook.restoreDrill.steps.some((step) => step.includes("staging")), "Runbook should include staging restore drill.");

const text = renderPostgresBackupRunbookText(runbook);
assert(text.includes("Postgres Backup Runbook"), "Text renderer should include title.");
assert(text.includes("pg_dump"), "Text renderer should include pg_dump command.");
assert(!text.includes("super-secret-password"), "Text renderer must not expose database password.");

const planningRunbook = buildPostgresBackupRunbook({
  strategy: "pg_dump",
  retentionDays: 3,
  databaseUrl: "",
  repositoryAdapter: "local_file",
});
assertEqual(planningRunbook.status, "blocked", "Missing DATABASE_URL should block production runbook readiness.");
assert(planningRunbook.checks.some((check) => check.id === "database_url" && check.severity === "blocker"), "Missing database URL should produce blocker.");
assert(planningRunbook.checks.some((check) => check.id === "retention_days" && check.severity === "warning"), "Short retention should produce warning.");
assert(planningRunbook.pgDump.enabled, "pg_dump strategy should enable pg_dump plan.");
assert(!planningRunbook.managedSnapshot.enabled, "pg_dump strategy should disable managed snapshot plan.");

const managedOnly = buildPostgresBackupRunbook({
  strategy: "managed_snapshot",
  retentionDays: 14,
  databaseUrl: secretUrl,
  repositoryAdapter: "postgres",
});
assert(managedOnly.managedSnapshot.enabled, "Managed snapshot strategy should enable snapshot plan.");
assert(!managedOnly.pgDump.enabled, "Managed snapshot strategy should disable pg_dump plan.");

const invalid = parseDatabaseUrl("postgres://stockflix:still-secret@");
assertEqual(invalid.configured, false, "Invalid database URL should not be configured.");
assert(!invalid.safeUrl.includes("still-secret") || invalid.safeUrl.includes("****"), "Invalid URL masking should not reveal obvious password fragments.");

console.log(JSON.stringify({
  ok: true,
  readyStatus: runbook.status,
  planningStatus: planningRunbook.status,
  strategy: runbook.strategy,
  maskedUrl: runbook.database.safeUrl,
  checkCount: runbook.checks.length,
}, null, 2));

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
  }
}
