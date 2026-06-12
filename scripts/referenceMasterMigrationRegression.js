import fs from "fs/promises";
import os from "os";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import {
  createReferenceMasterFromRows,
  writeReferenceMaster,
} from "../src/services/referenceMasterService.js";
import {
  renderReferenceMasterMigrationText,
  runReferenceMasterMigration,
} from "../src/services/referenceMasterMigrationService.js";

const cliPath = fileURLToPath(new URL("./referenceMasterMigration.js", import.meta.url));
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-reference-master-migration-"));
const secretUrl = "postgres://stockflix:super-secret-reference-db@db.example.com:5432/stockflix_staging";
const generatedAt = "2026-06-11T06:39:00.000Z";

class FakeReferenceMasterPostgresClient {
  constructor() {
    this.tables = {};
    this.queries = [];
  }

  async query(sql, params = []) {
    const statement = sql.trim();
    this.queries.push(statement);

    if (/^(BEGIN|COMMIT|ROLLBACK)$/u.test(statement)) {
      return { rows: [] };
    }

    if (/^CREATE TABLE IF NOT EXISTS/u.test(statement)) {
      const table = tableNameFrom(statement);
      this.tables[table] ||= new Map();
      return { rows: [] };
    }

    if (/^CREATE INDEX IF NOT EXISTS/u.test(statement)) {
      return { rows: [] };
    }

    if (/^DELETE FROM/u.test(statement)) {
      this.tables[tableNameFrom(statement)] = new Map();
      return { rows: [] };
    }

    if (/^INSERT INTO/u.test(statement)) {
      const table = tableNameFrom(statement);
      this.tables[table] ||= new Map();
      this.tables[table].set(String(params[0]), {
        symbol: String(params[0]),
        record: JSON.parse(params[9]),
      });
      return { rows: [] };
    }

    if (/^SELECT record FROM/u.test(statement)) {
      const table = this.tables[tableNameFrom(statement)] || new Map();
      return {
        rows: [...table.values()]
          .sort((a, b) => a.symbol.localeCompare(b.symbol))
          .map((row) => ({ record: row.record })),
      };
    }

    throw new Error(`Unexpected fake Postgres query: ${statement}`);
  }
}

try {
  const masterFile = path.join(tempRoot, "market-reference-master.json");
  const master = createReferenceMasterFromRows([
    {
      Symbol: "AAA",
      Sector: "Commerce",
      PE: 12,
      ROE: 18,
      Yield: 3,
      DE: 0.6,
    },
    {
      Symbol: "BBB",
      Sector: "Unknown",
      PE: 0,
      ROE: "",
      Yield: 0,
      DE: 0,
    },
  ], {
    generatedAt,
    sourceType: "migration_regression",
  });
  await writeReferenceMaster(master, masterFile);

  const dryRun = await runReferenceMasterMigration({
    master,
    inputFile: masterFile,
    repositoryAdapter: "postgres",
    databaseUrl: secretUrl,
    sslMode: "require",
    nodeEnv: "staging",
    backupEvidence: "snapshot-reference-001",
    stagingReady: true,
    migrationPlanReviewed: true,
    generatedAt,
  });
  assertEqual(dryRun.status, "dry_run", "Ready migration without confirm should stay in dry-run mode.");
  assertEqual(dryRun.executed, false, "Dry-run must not execute migration writes.");
  assertHasCheck(dryRun, "confirm_guard", "warning");
  assertEqual(dryRun.migrationPlan.totalRows, 2, "Dry-run should include source row count.");
  assertEqual(dryRun.migrationPlan.operations.upsertRows, 2, "Dry-run should include planned upserts.");
  assertEqual(dryRun.evidence.needsReviewRows, 1, "Dry-run evidence should include review queue count.");
  assert(!JSON.stringify(dryRun).includes("super-secret-reference-db"), "Dry-run JSON must not expose database password.");

  const dryRunText = renderReferenceMasterMigrationText(dryRun);
  assert(dryRunText.includes("Reference Master Migration"), "Text renderer should include title.");
  assert(dryRunText.includes("Migration Plan"), "Text renderer should include migration plan.");
  assert(!dryRunText.includes("super-secret-reference-db"), "Text renderer must not expose database password.");

  const blockedProduction = await runReferenceMasterMigration({
    master,
    inputFile: masterFile,
    repositoryAdapter: "postgres",
    databaseUrl: secretUrl,
    sslMode: "require",
    nodeEnv: "production",
    confirm: true,
    dryRun: false,
    backupEvidence: "snapshot-reference-001",
    stagingReady: true,
    migrationPlanReviewed: true,
    generatedAt,
  });
  assertEqual(blockedProduction.status, "blocked", "Production migration should block without allowProduction.");
  assertHasCheck(blockedProduction, "production_guard", "blocker");

  const blockedBackup = await runReferenceMasterMigration({
    master,
    inputFile: masterFile,
    repositoryAdapter: "postgres",
    databaseUrl: secretUrl,
    sslMode: "require",
    nodeEnv: "staging",
    confirm: true,
    dryRun: false,
    stagingReady: true,
    migrationPlanReviewed: true,
    generatedAt,
  });
  assertEqual(blockedBackup.status, "blocked", "Confirmed migration should block without backup evidence.");
  assertHasCheck(blockedBackup, "backup_evidence", "blocker");

  const client = new FakeReferenceMasterPostgresClient();
  const executed = await runReferenceMasterMigration({
    master,
    inputFile: masterFile,
    repositoryAdapter: "postgres",
    databaseUrl: secretUrl,
    sslMode: "require",
    nodeEnv: "staging",
    confirm: true,
    dryRun: false,
    replace: true,
    backupEvidence: "snapshot-reference-001",
    stagingReady: true,
    migrationPlanReviewed: true,
    generatedAt,
    client,
  });
  assertEqual(executed.status, "executed", "Confirmed staging migration should execute with fake client.");
  assertEqual(executed.evidence.beforeCounts.rows, 0, "Execution should capture before row count.");
  assertEqual(executed.evidence.afterCounts.rows, 2, "Execution should capture after row count.");
  assertEqual(executed.evidence.afterCounts.needsReviewRows, 1, "Execution should preserve review totals.");
  assert(client.queries.some((query) => query === "BEGIN"), "Execution should use a transaction.");
  assert(client.queries.some((query) => query.startsWith('DELETE FROM "reference_master_records"')), "Replace execution should clear target table first.");
  assert(client.queries.some((query) => query.startsWith('INSERT INTO "reference_master_records"') && query.includes("ON CONFLICT")), "Execution should use record-level upsert.");
  assert(!JSON.stringify(executed).includes("super-secret-reference-db"), "Executed evidence must not expose database password.");

  const readyCli = runCli([
    "--input",
    masterFile,
    "--format",
    "json",
    "--strict",
  ], readyEnv());
  assertEqual(readyCli.status, 0, "CLI strict dry-run should exit 0 when non-blocked.");
  const readyCliResult = JSON.parse(readyCli.stdout);
  assertEqual(readyCliResult.status, "dry_run", "CLI should default to dry-run.");
  assert(!readyCli.stdout.includes("super-secret-reference-db"), "CLI output must not expose database password.");

  const blockedCli = runCli([
    "--input",
    masterFile,
    "--format",
    "json",
    "--strict",
  ], {
    REFERENCE_MASTER_REPOSITORY: "local_file",
    DATABASE_URL: "",
  });
  assertEqual(blockedCli.status, 1, "CLI strict mode should exit 1 when blocked.");
  const blockedCliResult = JSON.parse(blockedCli.stdout);
  assertEqual(blockedCliResult.status, "blocked", "Blocked CLI output should report blocked.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "dry-run-guard",
      "secret-masking",
      "production-blocker",
      "backup-blocker",
      "confirm-execute-fake-client",
      "cli-strict",
    ],
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function readyEnv() {
  return {
    REFERENCE_MASTER_REPOSITORY: "postgres",
    DATABASE_URL: secretUrl,
    DATABASE_SSL_MODE: "require",
    NODE_ENV: "staging",
    REFERENCE_MASTER_MIGRATION_STAGING_READY: "true",
    REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE: "snapshot-reference-001",
    REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED: "true",
  };
}

function runCli(args, env) {
  const scrubbedEnv = {
    REFERENCE_MASTER_REPOSITORY: "",
    DATABASE_URL: "",
    DATABASE_SSL_MODE: "",
    NODE_ENV: "",
    REFERENCE_MASTER_MIGRATION_STAGING_READY: "",
    REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE: "",
    REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED: "",
  };
  const result = spawnSync(process.execPath, [cliPath, ...args], {
    env: {
      ...process.env,
      ...scrubbedEnv,
      ...env,
    },
    encoding: "utf8",
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

function tableNameFrom(statement) {
  const quoted = statement.match(/"([^"]+)"/u);
  return quoted?.[1] || "";
}

function assertHasCheck(result, id, severity) {
  assert(
    result.checks.some((check) => check.id === id && check.severity === severity),
    `Expected ${id} to be ${severity}.`,
  );
}

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
