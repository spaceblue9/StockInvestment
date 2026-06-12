import {
  createReferenceMasterFromRows,
} from "../src/services/referenceMasterService.js";
import {
  REFERENCE_MASTER_POSTGRES_TABLE,
  buildReferenceMasterFreshnessReport,
  buildReferenceMasterMigrationPlan,
  buildReferenceMasterPostgresBootstrapSql,
  readReferenceMasterFromPostgresClient,
  referenceMasterRepositoryInfo,
  upsertReferenceMasterRecordToPostgresClient,
  writeReferenceMasterToPostgresClient,
} from "../src/services/referenceMasterRepository.js";

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
  generatedAt: "2026-05-01T00:00:00.000Z",
  sourceType: "regression_seed",
});
master.records[0].metadata = {
  ...master.records[0].metadata,
  reviewStatus: "reviewed",
  freshnessStatus: "fresh",
  missingFields: [],
  lastUpdated: "2026-06-10T00:00:00.000Z",
};

const bootstrapSql = buildReferenceMasterPostgresBootstrapSql();
assertIncludes(bootstrapSql, [
  'CREATE TABLE IF NOT EXISTS "reference_master_records"',
  "record jsonb NOT NULL",
  "review_status text",
  "last_updated timestamptz",
], "Bootstrap SQL should define the reference master table.");

const info = referenceMasterRepositoryInfo({ adapter: "local_file", staleAfterDays: 14 });
assertEqual(info.adapter, "local_file", "Repository info should default to local file mode.");
assertIncludes(info.supportedAdapters, ["postgres"], "Repository info should expose postgres as a supported production path.");

const migrationPlan = buildReferenceMasterMigrationPlan(master, {
  now: "2026-06-11T00:00:00.000Z",
  staleAfterDays: 30,
});
assertEqual(migrationPlan.mode, "dry_run", "Migration plan should be dry-run by default.");
assertEqual(migrationPlan.table, REFERENCE_MASTER_POSTGRES_TABLE, "Migration plan should target the reference table.");
assertEqual(migrationPlan.operations.upsertRows, 2, "Migration plan should include all records as upserts.");
assertEqual(migrationPlan.coverage.needsReviewRows, 1, "Migration plan should expose rows that still need review.");

const freshnessReport = buildReferenceMasterFreshnessReport(master, {
  now: "2026-06-11T00:00:00.000Z",
  staleAfterDays: 30,
});
assertEqual(freshnessReport.status, "needs_refresh", "Freshness report should flag stale reference rows.");
assertEqual(freshnessReport.totals.staleRows, 1, "Freshness report should count stale rows.");
assertEqual(freshnessReport.reviewQueue[0].Symbol, "BBB", "Freshness report should expose the review queue.");

const client = new FakeReferenceMasterPostgresClient();
await writeReferenceMasterToPostgresClient(client, master, { replace: true });
const persistedMaster = await readReferenceMasterFromPostgresClient(client, {
  generatedAt: "2026-06-11T00:00:00.000Z",
});
assertEqual(persistedMaster.records.length, 2, "Postgres adapter should read back all records.");
assertEqual(persistedMaster.totals.needsReviewRows, 1, "Postgres read should rebuild review totals.");
assert(client.queries.some((query) => query === "BEGIN"), "Postgres write should start a transaction.");
assert(client.queries.some((query) => query.startsWith('DELETE FROM "reference_master_records"')), "Replace mode should clear the table before import.");
assert(client.queries.some((query) => query.startsWith('INSERT INTO "reference_master_records"') && query.includes("ON CONFLICT")), "Postgres write should use record-level upsert.");

const reviewedBbb = {
  ...persistedMaster.records.find((record) => record.Symbol === "BBB"),
  Sector: "Energy",
  PE: 15,
  ROE: 9,
  Yield: 2,
  DE: 0.8,
  metadata: {
    source: "owner_admin_review",
    sourceFile: null,
    sourceRow: 2,
    lastUpdated: "2026-06-11T00:00:00.000Z",
    freshnessStatus: "fresh",
    reviewStatus: "reviewed",
    missingFields: [],
    reviewedAt: "2026-06-11T00:00:00.000Z",
    reviewedByUserId: "owner_1",
  },
};
await upsertReferenceMasterRecordToPostgresClient(client, reviewedBbb);
const updatedMaster = await readReferenceMasterFromPostgresClient(client, {
  generatedAt: "2026-06-11T00:00:00.000Z",
});
assertEqual(updatedMaster.totals.needsReviewRows, 0, "Record upsert should update review totals.");
assertEqual(updatedMaster.records.find((record) => record.Symbol === "BBB").Sector, "Energy", "Record upsert should update reviewed fields.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "postgres-bootstrap-sql",
    "repository-info",
    "migration-plan-dry-run",
    "freshness-report",
    "postgres-write-read",
    "record-upsert",
  ],
}, null, 2));

function tableNameFrom(statement) {
  const quoted = statement.match(/"([^"]+)"/u);
  return quoted?.[1] || "";
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(actual, expectedItems, message) {
  const values = Array.isArray(actual) ? actual : [actual];
  for (const expected of expectedItems) {
    if (!values.some((value) => String(value).includes(expected))) {
      throw new Error(`${message}\nMissing: ${expected}`);
    }
  }
}
