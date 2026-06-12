import fs from "fs/promises";
import path from "path";
import {
  DEFAULT_REFERENCE_MASTER_FILE,
  DEFAULT_REFERENCE_MASTER_STALE_DAYS,
  REFERENCE_MASTER_FIELDS,
  REFERENCE_MASTER_VERSION,
  summarizeReferenceMaster,
} from "./referenceMasterService.js";

export const REFERENCE_MASTER_POSTGRES_TABLE = "reference_master_records";
export const DEFAULT_REFERENCE_MASTER_FRESHNESS_REPORT_FILE = path.join(process.cwd(), "data", "reference", "reference-master-freshness-report.json");

const SUPPORTED_REFERENCE_MASTER_ADAPTERS = ["local_file", "postgres"];

export function referenceMasterRepositoryInfo(options = {}) {
  const adapter = referenceMasterAdapter(options.adapter);
  return {
    adapter,
    supportedAdapters: SUPPORTED_REFERENCE_MASTER_ADAPTERS,
    localFile: options.filePath || DEFAULT_REFERENCE_MASTER_FILE,
    productionReady: adapter === "postgres" && Boolean(process.env.DATABASE_URL),
    postgres: {
      table: REFERENCE_MASTER_POSTGRES_TABLE,
      bootstrapSqlAvailable: true,
      writeMode: "record_level_upsert",
      migrationMode: "dry_run_first",
      runtimeDependency: "pg",
    },
    freshness: {
      staleAfterDays: positiveInteger(options.staleAfterDays, DEFAULT_REFERENCE_MASTER_STALE_DAYS),
      reportFile: options.reportFile || DEFAULT_REFERENCE_MASTER_FRESHNESS_REPORT_FILE,
    },
  };
}

export function buildReferenceMasterPostgresBootstrapSql() {
  const table = quoteIdentifier(REFERENCE_MASTER_POSTGRES_TABLE);
  return [
    `CREATE TABLE IF NOT EXISTS ${table} (
  symbol text PRIMARY KEY,
  sector text,
  pe numeric,
  roe numeric,
  yield_percent numeric,
  de numeric,
  pbv numeric,
  high_52w numeric,
  low_52w numeric,
  record jsonb NOT NULL,
  review_status text,
  freshness_status text,
  missing_fields text[] NOT NULL DEFAULT '{}',
  source text,
  last_updated timestamptz,
  reviewed_at timestamptz,
  reviewed_by_user_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${REFERENCE_MASTER_POSTGRES_TABLE}_review_status_idx`)} ON ${table} (review_status)`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${REFERENCE_MASTER_POSTGRES_TABLE}_freshness_status_idx`)} ON ${table} (freshness_status)`,
    `CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${REFERENCE_MASTER_POSTGRES_TABLE}_last_updated_idx`)} ON ${table} (last_updated)`,
  ].join(";\n\n") + ";";
}

export function buildReferenceMasterMigrationPlan(master, options = {}) {
  const records = Array.isArray(master?.records) ? master.records : [];
  const summary = summarizeReferenceMaster(master || emptyReferenceMaster(), {
    limit: options.limit || 25,
    staleAfterDays: options.staleAfterDays,
    now: options.now,
  });
  return {
    adapter: "postgres",
    table: REFERENCE_MASTER_POSTGRES_TABLE,
    mode: options.execute ? "execute" : "dry_run",
    replaceExisting: Boolean(options.replace),
    generatedAt: new Date(options.generatedAt || new Date()).toISOString(),
    sourceVersion: master?.version || null,
    totalRows: records.length,
    operations: {
      bootstrapStatements: buildReferenceMasterPostgresBootstrapSql().split(/;\s*/u).filter((statement) => statement.trim()).length,
      upsertRows: records.length,
      deleteBeforeImport: Boolean(options.replace),
    },
    coverage: {
      needsReviewRows: summary.totals.needsReviewRows || 0,
      staleRows: summary.totals.staleRows || 0,
      missingFieldCounts: summary.totals.missingFieldCounts || {},
    },
    guardrails: [
      "Run dry-run first and review counts before executing.",
      "Do not import private portfolio workbook data into reference master tables.",
      "Keep application audit events append-only; reference master review audit stays in auditEvents.",
      "Use a staging database before production execution.",
    ],
  };
}

export async function writeReferenceMasterToPostgresClient(client, master, options = {}) {
  assertReferenceMaster(master);
  await client.query("BEGIN");
  try {
    await ensureReferenceMasterPostgresSchema(client);
    if (options.replace) {
      await client.query(`DELETE FROM ${quoteIdentifier(REFERENCE_MASTER_POSTGRES_TABLE)}`);
    }
    for (const record of master.records) {
      await upsertReferenceMasterRecordToPostgresClient(client, record);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function readReferenceMasterFromPostgresClient(client, options = {}) {
  await ensureReferenceMasterPostgresSchema(client);
  const result = await client.query(
    `SELECT record FROM ${quoteIdentifier(REFERENCE_MASTER_POSTGRES_TABLE)} ORDER BY symbol`,
  );
  const records = (result.rows || []).map((row) => row.record);
  return {
    version: REFERENCE_MASTER_VERSION,
    generatedAt: options.generatedAt || records
      .map((record) => record.metadata?.lastUpdated)
      .filter(Boolean)
      .sort()
      .at(-1) || null,
    source: {
      type: "postgres_reference_master",
      table: REFERENCE_MASTER_POSTGRES_TABLE,
      lastModifiedAt: null,
    },
    schema: {
      primaryKey: "Symbol",
      requiredFields: REFERENCE_MASTER_FIELDS,
      optionalFields: ["PBV", "High_52W", "Low_52W"],
      missingValueRule: "Unknown sector, blank, dash, NaN, or numeric 0 require enrichment/manual review.",
    },
    totals: recalculateReferenceMasterTotals(records),
    records,
  };
}

export async function upsertReferenceMasterRecordToPostgresClient(client, record) {
  const symbol = String(record?.Symbol || "").trim().toUpperCase();
  if (!symbol) {
    throw new Error("Cannot persist reference master record without Symbol.");
  }
  const metadata = record.metadata || {};
  await client.query(
    `INSERT INTO ${quoteIdentifier(REFERENCE_MASTER_POSTGRES_TABLE)} (
  symbol, sector, pe, roe, yield_percent, de, pbv, high_52w, low_52w,
  record, review_status, freshness_status, missing_fields, source,
  last_updated, reviewed_at, reviewed_by_user_id, created_at, updated_at
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13::text[], $14, $15::timestamptz, $16::timestamptz, $17, COALESCE($18::timestamptz, now()), now())
ON CONFLICT (symbol) DO UPDATE SET
  sector = EXCLUDED.sector,
  pe = EXCLUDED.pe,
  roe = EXCLUDED.roe,
  yield_percent = EXCLUDED.yield_percent,
  de = EXCLUDED.de,
  pbv = EXCLUDED.pbv,
  high_52w = EXCLUDED.high_52w,
  low_52w = EXCLUDED.low_52w,
  record = EXCLUDED.record,
  review_status = EXCLUDED.review_status,
  freshness_status = EXCLUDED.freshness_status,
  missing_fields = EXCLUDED.missing_fields,
  source = EXCLUDED.source,
  last_updated = EXCLUDED.last_updated,
  reviewed_at = EXCLUDED.reviewed_at,
  reviewed_by_user_id = EXCLUDED.reviewed_by_user_id,
  updated_at = now()`,
    [
      symbol,
      nullableString(record.Sector),
      nullableNumber(record.PE),
      nullableNumber(record.ROE),
      nullableNumber(record.Yield),
      nullableNumber(record.DE),
      nullableNumber(record.PBV),
      nullableNumber(record.High_52W),
      nullableNumber(record.Low_52W),
      JSON.stringify({ ...record, Symbol: symbol }),
      nullableString(metadata.reviewStatus),
      nullableString(metadata.freshnessStatus),
      metadata.missingFields || [],
      nullableString(metadata.source),
      nullableString(metadata.lastUpdated),
      nullableString(metadata.reviewedAt),
      nullableString(metadata.reviewedByUserId),
      nullableString(metadata.lastUpdated),
    ],
  );
}

export async function ensureReferenceMasterPostgresSchema(client) {
  const statements = buildReferenceMasterPostgresBootstrapSql()
    .split(/;\s*/u)
    .map((statement) => statement.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await client.query(statement);
  }
}

export function buildReferenceMasterFreshnessReport(master, options = {}) {
  const summary = summarizeReferenceMaster(master || emptyReferenceMaster(), {
    limit: options.limit || 25,
    staleAfterDays: options.staleAfterDays,
    now: options.now,
  });
  const records = Array.isArray(master?.records) ? master.records : [];
  const staleRows = records
    .filter((record) => staleReferenceRecord(record, summary.freshness.checkedAt, summary.freshness.staleAfterDays))
    .slice(0, options.limit || 25)
    .map(minimalReferenceRecord);
  const reviewQueue = (summary.reviewQueue || []).slice(0, options.limit || 25).map(minimalReferenceRecord);

  return {
    generatedAt: new Date(options.generatedAt || new Date()).toISOString(),
    status: summary.freshness.status,
    version: master?.version || null,
    totals: summary.totals,
    freshness: summary.freshness,
    staleRows,
    reviewQueue,
    recommendations: buildFreshnessRecommendations(summary),
  };
}

export async function writeReferenceMasterFreshnessReport(report, outputFile = DEFAULT_REFERENCE_MASTER_FRESHNESS_REPORT_FILE) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputFile;
}

function buildFreshnessRecommendations(summary) {
  const recommendations = [];
  if ((summary.totals?.needsReviewRows || 0) > 0) {
    recommendations.push("Review missing Sector/PE/ROE/Yield/D/E values before trusting production recommendations.");
  }
  if ((summary.totals?.staleRows || 0) > 0) {
    recommendations.push("Refresh stale reference rows from a trusted market data source or confirm them through owner/admin review.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Reference master is fresh under the configured stale threshold.");
  }
  return recommendations;
}

function recalculateReferenceMasterTotals(records) {
  const missingFieldCounts = Object.fromEntries(REFERENCE_MASTER_FIELDS.map((field) => [field, 0]));
  for (const record of records) {
    for (const field of record.metadata?.missingFields || []) {
      if (field in missingFieldCounts) {
        missingFieldCounts[field] += 1;
      }
    }
  }
  const needsReviewRows = records.filter((record) => record.metadata?.reviewStatus === "needs_review").length;
  return {
    totalRows: records.length,
    completeRows: records.length - needsReviewRows,
    needsReviewRows,
    missingFieldCounts,
  };
}

function minimalReferenceRecord(record) {
  return {
    Symbol: record.Symbol,
    Sector: record.Sector,
    PE: record.PE,
    ROE: record.ROE,
    Yield: record.Yield,
    DE: record.DE,
    reviewStatus: record.metadata?.reviewStatus || "unknown",
    freshnessStatus: record.metadata?.freshnessStatus || "unknown",
    missingFields: record.metadata?.missingFields || [],
    lastUpdated: record.metadata?.lastUpdated || null,
  };
}

function staleReferenceRecord(record, checkedAt, staleAfterDays) {
  const lastUpdated = record.metadata?.lastUpdated;
  if (!lastUpdated) {
    return true;
  }
  const checkedDate = new Date(checkedAt);
  const updatedDate = new Date(lastUpdated);
  if (Number.isNaN(checkedDate.getTime()) || Number.isNaN(updatedDate.getTime())) {
    return true;
  }
  return checkedDate.getTime() - updatedDate.getTime() > staleAfterDays * 24 * 60 * 60 * 1000;
}

function referenceMasterAdapter(adapter) {
  const selected = String(adapter || process.env.REFERENCE_MASTER_REPOSITORY || "local_file").trim().toLowerCase();
  if (!SUPPORTED_REFERENCE_MASTER_ADAPTERS.includes(selected)) {
    throw new Error(`Unsupported REFERENCE_MASTER_REPOSITORY adapter: ${selected}`);
  }
  return selected;
}

function assertReferenceMaster(master) {
  if (master?.version !== REFERENCE_MASTER_VERSION || !Array.isArray(master.records)) {
    throw new Error("Unsupported reference master format.");
  }
}

function emptyReferenceMaster() {
  return {
    version: REFERENCE_MASTER_VERSION,
    generatedAt: null,
    source: null,
    schema: null,
    totals: {
      totalRows: 0,
      completeRows: 0,
      needsReviewRows: 0,
      missingFieldCounts: Object.fromEntries(REFERENCE_MASTER_FIELDS.map((field) => [field, 0])),
    },
    records: [],
  };
}

function nullableString(value) {
  const text = String(value ?? "").trim();
  return text || null;
}

function nullableNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function quoteIdentifier(value) {
  return `"${String(value).replace(/"/g, "\"\"")}"`;
}
