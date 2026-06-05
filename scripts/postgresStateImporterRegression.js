import { importAppStateToPostgres } from "../src/services/postgresStateImporter.js";

function FakePostgresClient() {
  this.tables = {};
  this.queries = [];
}

FakePostgresClient.prototype.query = async function query(sql, params = []) {
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
};

FakePostgresClient.prototype.tableRecords = function tableRecords(tableName) {
  return this.tables[tableName]?.size || 0;
};

const cleanState = sampleState();
const dryRun = await importAppStateToPostgres({
  state: cleanState,
  dryRun: true,
});
assertEqual(dryRun.imported, false, "Dry-run should not import.");
assertEqual(dryRun.plan.readiness.status, "ready", "Clean import state should be ready.");
assert(dryRun.plan.totalRecords >= 3, "Dry-run should report record counts.");
assert(dryRun.plan.collectionCounts.some((item) => item.table === "users" && item.records === 1), "Dry-run should include users table count.");

const fakeClient = new FakePostgresClient();
const imported = await importAppStateToPostgres({
  state: cleanState,
  client: fakeClient,
});
assertEqual(imported.imported, true, "Importer should write when dry-run is false.");
assertEqual(fakeClient.tableRecords("users"), 1, "Importer should write user rows.");
assertEqual(fakeClient.tableRecords("organizations"), 1, "Importer should write organization rows.");
assertEqual(fakeClient.tableRecords("audit_events"), 1, "Importer should write audit rows.");
assert(fakeClient.queries.some((query) => query === "BEGIN"), "Importer should use Postgres transaction.");
assert(fakeClient.queries.some((query) => query === "COMMIT"), "Importer should commit successful import.");

const blockedState = sampleState({
  users: [
    sampleUser("user_owner", "owner@example.test"),
    sampleUser("user_owner", "duplicate@example.test"),
  ],
});
const blockedDryRun = await importAppStateToPostgres({
  state: blockedState,
  dryRun: true,
});
assertEqual(blockedDryRun.imported, false, "Blocked dry-run should not import.");
assertEqual(blockedDryRun.plan.okToImport, false, "Blocked dry-run should expose okToImport false.");
assert(blockedDryRun.plan.readiness.blockerCount > 0, "Blocked dry-run should include readiness blockers.");

await expectReject(
  () => importAppStateToPostgres({
    state: blockedState,
    client: new FakePostgresClient(),
  }),
  "Blocked import should reject without --allow-blocked.",
);

const forced = await importAppStateToPostgres({
  state: blockedState,
  client: new FakePostgresClient(),
  allowBlocked: true,
});
assertEqual(forced.imported, true, "allowBlocked should permit intentional import.");
assertEqual(forced.plan.allowBlocked, true, "Import plan should record allowBlocked.");

console.log(JSON.stringify({
  ok: true,
  dryRunRecords: dryRun.plan.totalRecords,
  importedTables: Object.keys(fakeClient.tables).sort(),
  blockedStatus: blockedDryRun.plan.readiness.status,
  blockedIssues: blockedDryRun.plan.readiness.blockerCount,
}, null, 2));

function sampleState(overrides = {}) {
  const base = {
    organizations: [{
      id: "org_platform",
      name: "StockFlix Platform",
      type: "platform",
      ownerUserId: "user_owner",
      createdAt: "2026-06-04T07:00:00.000Z",
      updatedAt: "2026-06-04T07:00:00.000Z",
    }],
    users: [sampleUser("user_owner", "owner@example.test")],
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
      createdAt: "2026-06-04T07:01:00.000Z",
    }],
  };

  return {
    ...base,
    ...overrides,
  };
}

function sampleUser(id, email) {
  return {
    id,
    name: "Owner",
    email,
    role: "owner",
    organizationId: "org_platform",
    createdAt: "2026-06-04T07:00:00.000Z",
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

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}
