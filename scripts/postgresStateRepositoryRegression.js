import {
  buildPostgresBootstrapSql,
  postgresPlatformTenantScope,
  postgresRepositoryInfo,
  postgresRestrictedTenantScope,
  readScopedStateFromPostgresClient,
  readStateFromPostgresClient,
  writeStateToPostgresClient,
} from "../src/services/postgresStateRepository.js";

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
      const tableName = tableNameFrom(statement);
      if (tableName && !this.tables[tableName]) {
        this.tables[tableName] = new Map();
      }
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
      if (!this.tables[tableName]) {
        this.tables[tableName] = new Map();
      }
      this.tables[tableName].set(String(params[0]), {
        record_id: String(params[0]),
        organization_id: params[1],
        user_id: params[2],
        record: JSON.parse(params[3]),
        created_at: params[4] || new Date().toISOString(),
      });
      return { rows: [] };
    }

    if (/^SELECT record FROM/u.test(statement)) {
      const table = this.tables[tableNameFrom(statement)] || new Map();
      return {
        rows: [...table.values()]
          .filter((row) => matchesScopedSelect(statement, row, params))
          .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || a.record_id.localeCompare(b.record_id))
          .map((row) => ({ record: row.record })),
      };
    }

    throw new Error(`Unexpected fake Postgres query: ${statement}`);
  }
}

const bootstrapSql = buildPostgresBootstrapSql();
assertIncludes(bootstrapSql, [
  'CREATE TABLE IF NOT EXISTS "users"',
  'CREATE TABLE IF NOT EXISTS "audit_events"',
  "record jsonb NOT NULL",
], "Bootstrap SQL should create JSONB-backed production tables.");

const client = new FakePostgresClient();
const organization = {
  id: "org_1",
  name: "StockFlix Demo",
  type: "customer",
  createdAt: "2026-06-04T06:00:00.000Z",
  updatedAt: "2026-06-04T06:00:00.000Z",
};
const owner = {
  id: "user_owner",
  email: "owner@example.test",
  role: "owner",
  organizationId: organization.id,
  createdAt: "2026-06-04T06:01:00.000Z",
};
const customer = {
  id: "user_customer",
  email: "customer@example.test",
  role: "customer",
  organizationId: organization.id,
  createdAt: "2026-06-04T06:02:00.000Z",
};
const eventOne = {
  id: "audit_1",
  action: "auth.register",
  organizationId: organization.id,
  integrityVersion: "hash-chain-v1",
  eventHash: "hash_1",
  createdAt: "2026-06-04T06:03:00.000Z",
};
const eventTwo = {
  id: "audit_2",
  action: "subscription.checkout",
  organizationId: organization.id,
  integrityVersion: "hash-chain-v1",
  eventHash: "hash_2",
  createdAt: "2026-06-04T06:04:00.000Z",
};

await writeStateToPostgresClient(client, {
  organizations: [organization],
  users: [owner, customer],
  sessions: [{
    id: "session_1",
    userId: owner.id,
    createdAt: "2026-06-04T06:05:00.000Z",
    expiresAt: "2026-06-05T06:05:00.000Z",
  }],
  auditEvents: [eventOne],
});

const firstRead = await readStateFromPostgresClient(client, {
  normalize: (state) => ({
    ...state,
    userCount: state.users.length,
    auditCount: state.auditEvents.length,
  }),
});
assertEqual(firstRead.userCount, 2, "Postgres read should restore users from JSONB rows.");
assertEqual(firstRead.auditCount, 1, "Postgres read should restore audit rows.");
assertEqual(firstRead.users[0].email, owner.email, "Postgres read should preserve record content.");
assert(client.queries.some((query) => query.includes("BEGIN")), "Postgres write should run in a transaction.");
assert(client.queries.some((query) => query.includes("COMMIT")), "Postgres write should commit a successful transaction.");

await writeStateToPostgresClient(client, {
  organizations: [organization],
  users: [customer],
  auditEvents: [eventTwo],
});
const secondRead = await readStateFromPostgresClient(client);
assertEqual(secondRead.users.length, 1, "Non-append collections should match latest whole-state write.");
assertEqual(secondRead.users[0].id, customer.id, "Whole-state write should remove non-append records not present anymore.");
assertEqual(secondRead.auditEvents.length, 2, "Append-only audit events should not be deleted by a later write.");
assertIncludes(secondRead.auditEvents.map((event) => event.id), [eventOne.id, eventTwo.id], "Append-only table should retain old and new audit events.");

const scopedClient = new FakePostgresClient();
const advisorOrganization = {
  id: "org_advisor",
  name: "Advisor Desk",
  type: "advisor",
  createdAt: "2026-06-04T06:10:00.000Z",
  updatedAt: "2026-06-04T06:10:00.000Z",
};
const customerAOrganization = {
  id: "org_customer_a",
  name: "Customer A",
  type: "customer",
  createdAt: "2026-06-04T06:11:00.000Z",
  updatedAt: "2026-06-04T06:11:00.000Z",
};
const customerBOrganization = {
  id: "org_customer_b",
  name: "Customer B",
  type: "customer",
  createdAt: "2026-06-04T06:12:00.000Z",
  updatedAt: "2026-06-04T06:12:00.000Z",
};
const advisor = {
  id: "advisor_1",
  email: "advisor@example.test",
  role: "advisor",
  organizationId: advisorOrganization.id,
  createdAt: "2026-06-04T06:13:00.000Z",
};
const customerA = {
  id: "customer_a",
  email: "customer-a@example.test",
  role: "customer",
  organizationId: customerAOrganization.id,
  createdAt: "2026-06-04T06:14:00.000Z",
};
const customerB = {
  id: "customer_b",
  email: "customer-b@example.test",
  role: "customer",
  organizationId: customerBOrganization.id,
  createdAt: "2026-06-04T06:15:00.000Z",
};

await writeStateToPostgresClient(scopedClient, {
  organizations: [advisorOrganization, customerAOrganization, customerBOrganization],
  users: [advisor, customerA, customerB],
  sessions: [
    { id: "session_advisor", userId: advisor.id, createdAt: "2026-06-04T06:16:00.000Z", expiresAt: "2026-06-05T06:16:00.000Z" },
    { id: "session_a", userId: customerA.id, createdAt: "2026-06-04T06:17:00.000Z", expiresAt: "2026-06-05T06:17:00.000Z" },
    { id: "session_b", userId: customerB.id, createdAt: "2026-06-04T06:18:00.000Z", expiresAt: "2026-06-05T06:18:00.000Z" },
  ],
  portfolioSnapshots: [
    { userId: customerA.id, organizationId: customerA.organizationId, generatedAt: "2026-06-04T06:19:00.000Z", totalValue: 100000 },
    { userId: customerB.id, organizationId: customerB.organizationId, generatedAt: "2026-06-04T06:20:00.000Z", totalValue: 200000 },
  ],
  investorProfiles: [
    { userId: customerA.id, organizationId: customerA.organizationId, goal: "growth", experience: "beginner", riskLevel: "medium", updatedAt: "2026-06-04T06:21:00.000Z" },
    { userId: customerB.id, organizationId: customerB.organizationId, goal: "income", experience: "beginner", riskLevel: "low", updatedAt: "2026-06-04T06:22:00.000Z" },
  ],
  billingEvents: [
    { id: "billing_a", userId: customerA.id, organizationId: customerA.organizationId, invoiceNumber: "INV-A", planId: "pro", amountThb: 1490, status: "paid", createdAt: "2026-06-04T06:23:00.000Z" },
    { id: "billing_b", userId: customerB.id, organizationId: customerB.organizationId, invoiceNumber: "INV-B", planId: "starter", amountThb: 490, status: "paid", createdAt: "2026-06-04T06:24:00.000Z" },
  ],
  paymentSessions: [
    { id: "payment_a", userId: customerA.id, organizationId: customerA.organizationId, planId: "pro", amountThb: 1490, status: "paid", createdAt: "2026-06-04T06:25:00.000Z" },
    { id: "payment_b", userId: customerB.id, organizationId: customerB.organizationId, planId: "starter", amountThb: 490, status: "paid", createdAt: "2026-06-04T06:26:00.000Z" },
  ],
  paymentWebhookEvents: [
    { id: "webhook_a", providerEventId: "evt_a", sessionId: "payment_a", userId: customerA.id, organizationId: customerA.organizationId, eventType: "payment.succeeded", status: "verified", createdAt: "2026-06-04T06:27:00.000Z" },
    { id: "webhook_b", providerEventId: "evt_b", sessionId: "payment_b", userId: customerB.id, organizationId: customerB.organizationId, eventType: "payment.succeeded", status: "verified", createdAt: "2026-06-04T06:28:00.000Z" },
  ],
  advisorAssignments: [
    { customerId: customerA.id, advisorId: advisor.id, assignedBy: advisor.id, assignedAt: "2026-06-04T06:29:00.000Z" },
    { customerId: customerB.id, advisorId: "advisor_other", assignedBy: "advisor_other", assignedAt: "2026-06-04T06:30:00.000Z" },
  ],
  approvalRequests: [
    { id: "approval_a", customerId: customerA.id, organizationId: customerA.organizationId, requestedByUserId: advisor.id, title: "Review A", status: "pending", createdAt: "2026-06-04T06:31:00.000Z", updatedAt: "2026-06-04T06:31:00.000Z" },
    { id: "approval_b", customerId: customerB.id, organizationId: customerB.organizationId, requestedByUserId: "advisor_other", title: "Review B", status: "pending", createdAt: "2026-06-04T06:32:00.000Z", updatedAt: "2026-06-04T06:32:00.000Z" },
  ],
  auditEvents: [
    { id: "audit_a", action: "approval.create", actorUserId: advisor.id, targetUserId: customerA.id, organizationId: customerA.organizationId, integrityVersion: "hash-chain-v1", eventHash: "audit_hash_a", createdAt: "2026-06-04T06:33:00.000Z" },
    { id: "audit_b", action: "approval.create", actorUserId: "advisor_other", targetUserId: customerB.id, organizationId: customerB.organizationId, integrityVersion: "hash-chain-v1", eventHash: "audit_hash_b", createdAt: "2026-06-04T06:34:00.000Z" },
  ],
});

const scopedQueryStart = scopedClient.queries.length;
const scopedRead = await readScopedStateFromPostgresClient(scopedClient, postgresRestrictedTenantScope({
  reason: "advisor_customer_scope",
  userIds: [advisor.id, customerA.id],
  organizationIds: [advisor.organizationId, customerA.organizationId],
}));
const scopedSelectQueries = scopedClient.queries.slice(scopedQueryStart).filter((query) => query.startsWith("SELECT record FROM"));
assert(scopedSelectQueries.every((query) => query.includes(" WHERE ")), "Restricted scoped read should add SQL WHERE filters to every collection query.");
assertIncludes(scopedRead.users.map((user) => user.id), [advisor.id, customerA.id], "Restricted scoped read should include visible users.");
assert(!scopedRead.users.some((user) => user.id === customerB.id), "Restricted scoped read should exclude users outside the tenant scope.");
assertIncludes(scopedRead.organizations.map((item) => item.id), [advisor.organizationId, customerA.organizationId], "Restricted scoped read should include visible organizations.");
assert(!scopedRead.organizations.some((item) => item.id === customerB.organizationId), "Restricted scoped read should exclude organizations outside the tenant scope.");
assertEqual(scopedRead.sessions.length, 2, "Restricted scoped read should only include visible user sessions.");
assertEqual(scopedRead.portfolioSnapshots.length, 1, "Restricted scoped read should only include visible portfolio snapshots.");
assertEqual(scopedRead.investorProfiles.length, 1, "Restricted scoped read should only include visible investor profiles.");
assertEqual(scopedRead.billingEvents.length, 1, "Restricted scoped read should only include visible billing events.");
assertEqual(scopedRead.paymentSessions.length, 1, "Restricted scoped read should only include visible payment sessions.");
assertEqual(scopedRead.paymentWebhookEvents.length, 1, "Restricted scoped read should only include visible webhook events.");
assertEqual(scopedRead.advisorAssignments.length, 1, "Restricted scoped read should include only visible advisor assignments.");
assertEqual(scopedRead.approvalRequests.length, 1, "Restricted scoped read should only include visible approval requests.");
assertEqual(scopedRead.auditEvents.length, 1, "Restricted scoped read should only include visible audit events.");

const platformRead = await readScopedStateFromPostgresClient(scopedClient, postgresPlatformTenantScope());
assertEqual(platformRead.users.length, 3, "Platform scoped read should preserve full-state visibility.");
assertEqual(platformRead.portfolioSnapshots.length, 2, "Platform scoped read should include all tenant-scoped records.");

await expectReject(
  () => writeStateToPostgresClient(new FakePostgresClient(), {
    users: [{ email: "missing-primary@example.test" }],
  }),
  "Postgres write should reject records missing primary keys.",
);

const info = postgresRepositoryInfo();
assertEqual(info.adapter, "postgres", "Repository info should identify the postgres adapter.");
assertEqual(info.productionReady, false, "Postgres adapter should not be production ready without DATABASE_URL.");
assertIncludes(info.bootstrapTables, ["users", "audit_events"], "Repository info should list bootstrap tables.");

process.env.DATABASE_URL = "postgres://stockflix@example.test:5432/stockflix";
try {
  assertEqual(postgresRepositoryInfo().productionReady, true, "DATABASE_URL should mark adapter configuration as production ready.");
} finally {
  delete process.env.DATABASE_URL;
}

console.log(JSON.stringify({
  ok: true,
  tables: Object.keys(client.tables).sort(),
  usersAfterRewrite: secondRead.users.length,
  auditEventsAfterRewrite: secondRead.auditEvents.length,
  scopedRead: {
    users: scopedRead.users.length,
    organizations: scopedRead.organizations.length,
    portfolioSnapshots: scopedRead.portfolioSnapshots.length,
    filteredSelects: scopedSelectQueries.length,
  },
  queryCount: client.queries.length,
}, null, 2));

function tableNameFrom(statement) {
  return statement.match(/"([a-z][a-z0-9_]*)"/u)?.[1] || "";
}

function matchesScopedSelect(statement, row, params) {
  if (!statement.includes(" WHERE ")) {
    return true;
  }

  if (statement.includes("WHERE FALSE")) {
    return false;
  }

  return anySqlParamIncludes(statement, "record_id", row.record_id, params)
    || anySqlParamIncludes(statement, "organization_id", row.organization_id, params)
    || anySqlParamIncludes(statement, "user_id", row.user_id, params)
    || jsonbFieldParamIncludes(statement, "advisorId", row.record?.advisorId, params)
    || jsonbFieldParamIncludes(statement, "assignedBy", row.record?.assignedBy, params);
}

function anySqlParamIncludes(statement, columnName, value, params) {
  const pattern = new RegExp(`${escapeRegExp(columnName)} = ANY\\(\\$(\\d+)::text\\[\\]\\)`, "u");
  const match = statement.match(pattern);
  return match ? paramIncludes(params, match[1], value) : false;
}

function jsonbFieldParamIncludes(statement, fieldName, value, params) {
  const pattern = new RegExp(`record->>'${escapeRegExp(fieldName)}' = ANY\\(\\$(\\d+)::text\\[\\]\\)`, "u");
  const match = statement.match(pattern);
  return match ? paramIncludes(params, match[1], value) : false;
}

function paramIncludes(params, paramIndex, value) {
  const values = params[Number(paramIndex) - 1] || [];
  return values.map(String).includes(String(value));
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
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

function assertIncludes(actual, expectedItems, message) {
  const haystack = Array.isArray(actual) ? actual : [String(actual)];
  const missing = expectedItems.filter((item) => !haystack.some((value) => String(value).includes(item)));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
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
