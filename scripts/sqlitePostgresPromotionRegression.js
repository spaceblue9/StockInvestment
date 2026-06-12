import fs from "fs/promises";
import os from "os";
import path from "path";
import { pathToFileURL } from "url";

const repoRoot = process.cwd();
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-sqlite-promotion-"));
class FakePostgresClient {
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
      this.tables[tableNameFrom(statement)] ||= new Map();
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
      const tableName = tableNameFrom(statement);
      this.tables[tableName] ||= new Map();
      this.tables[tableName].set(String(params[0]), JSON.parse(params[3]));
      return { rows: [] };
    }

    throw new Error(`Unexpected fake Postgres query: ${statement}`);
  }

  tableRecords(tableName) {
    return this.tables[tableName]?.size || 0;
  }
}

process.chdir(tempRoot);

try {
  const sqliteRepository = await import(pathToFileURL(path.join(repoRoot, "src", "services", "sqliteStateRepository.js")).href);
  const promotionService = await import(pathToFileURL(path.join(repoRoot, "src", "services", "sqlitePostgresPromotionService.js")).href);
  const { writeSQLiteAppState } = sqliteRepository;
  const {
    promoteSQLiteTrialToPostgres,
    renderSQLitePostgresPromotionText,
  } = promotionService;
  const sqliteDatabasePath = path.join(tempRoot, "data", "trial-stockflix.sqlite");
  const envReady = {
    APP_STATE_REPOSITORY: "postgres",
    DATABASE_URL: "postgres://stockflix:super-secret@db.example.com:5432/stockflix_prod",
    SQLITE_TO_POSTGRES_PG_DRIVER_READY: "true",
    SQLITE_TO_POSTGRES_BACKUP_EVIDENCE: "snapshot-2026-06-11-001",
    SQLITE_TO_POSTGRES_PROMOTION_REVIEWED: "true",
  };

  await writeSQLiteAppState(sampleState(), { databasePath: sqliteDatabasePath });

  const dryRun = await promoteSQLiteTrialToPostgres({
    sqliteDatabasePath,
    dryRun: true,
    env: envReady,
    generatedAt: "2026-06-11T13:13:37.000Z",
  });
  assertEqual(dryRun.imported, false, "Dry-run must not write to Postgres.");
  assertEqual(dryRun.plan.status, "ready", "Promotion dry-run should be ready when all evidence is present.");
  assertEqual(dryRun.plan.sqlite.exists, true, "Promotion plan should see the SQLite source file.");
  assert(dryRun.plan.importPlan.totalRecords >= 3, "Promotion plan should report promotable records.");
  assertIncludes(dryRun.plan.sanitizedEnvironment.DATABASE_URL, "****", "Promotion plan should mask DATABASE_URL password.");

  const text = renderSQLitePostgresPromotionText(dryRun);
  assertIncludes(text, "SQLite to Postgres Promotion (ready)", "Text output should include promotion status.");
  assertIncludes(text, "postgres://stockflix:****@db.example.com", "Text output should mask database secret.");

  const blockedDryRun = await promoteSQLiteTrialToPostgres({
    sqliteDatabasePath,
    dryRun: true,
    env: {
      ...envReady,
      SQLITE_TO_POSTGRES_BACKUP_EVIDENCE: "",
    },
  });
  assertEqual(blockedDryRun.plan.status, "blocked", "Missing backup evidence should block promotion.");
  assert(blockedDryRun.plan.checks.some((check) => check.id === "backup_evidence" && check.severity === "blocker"), "Backup evidence blocker should be explicit.");

  await expectReject(
    () => promoteSQLiteTrialToPostgres({
      sqliteDatabasePath,
      confirm: true,
      dryRun: false,
      env: {
        ...envReady,
        SQLITE_TO_POSTGRES_BACKUP_EVIDENCE: "",
      },
      client: new FakePostgresClient(),
    }),
    "Confirmed promotion should reject when guardrails are blocked.",
  );

  const fakeClient = new FakePostgresClient();
  const imported = await promoteSQLiteTrialToPostgres({
    sqliteDatabasePath,
    confirm: true,
    dryRun: false,
    env: envReady,
    client: fakeClient,
  });
  assertEqual(imported.imported, true, "Confirmed promotion should import with ready evidence.");
  assertEqual(fakeClient.tableRecords("users"), 1, "Promotion should write users to fake Postgres.");
  assertEqual(fakeClient.tableRecords("organizations"), 1, "Promotion should write organizations to fake Postgres.");
  assertEqual(fakeClient.tableRecords("audit_events"), 1, "Promotion should write audit events to fake Postgres.");

  const missingSource = await promoteSQLiteTrialToPostgres({
    sqliteDatabasePath: path.join(tempRoot, "missing.sqlite"),
    dryRun: true,
    env: envReady,
  });
  assertEqual(missingSource.plan.status, "blocked", "Missing SQLite source should block dry-run status.");

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    status: dryRun.plan.status,
    records: dryRun.plan.importPlan.totalRecords,
    blockedStatus: blockedDryRun.plan.status,
    importedTables: Object.keys(fakeClient.tables).sort(),
  }, null, 2));
} finally {
  process.chdir(repoRoot);
}

function sampleState() {
  return {
    organizations: [{
      id: "org_platform",
      name: "StockFlix Platform",
      type: "platform",
      ownerUserId: "user_owner",
      createdAt: "2026-06-11T13:00:00.000Z",
      updatedAt: "2026-06-11T13:00:00.000Z",
    }],
    users: [{
      id: "user_owner",
      name: "Owner",
      email: "owner@example.test",
      role: "owner",
      organizationId: "org_platform",
      createdAt: "2026-06-11T13:00:00.000Z",
    }],
    sessions: [],
    portfolioSnapshots: [],
    investorProfiles: [],
    billingEvents: [],
    paymentSessions: [],
    paymentWebhookEvents: [],
    advisorAssignments: [],
    approvalRequests: [],
    auditEvents: [{
      id: "audit_1",
      action: "auth.register",
      organizationId: "org_platform",
      integrityVersion: "sha256-v1",
      eventHash: "hash_1",
      createdAt: "2026-06-11T13:01:00.000Z",
    }],
  };
}

function tableNameFrom(statement) {
  return statement.match(/"([a-z][a-z0-9_]*)"/u)?.[1] || "";
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

function assertIncludes(actual, expected, message) {
  if (!String(actual).includes(expected)) {
    throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
  }
}

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}
