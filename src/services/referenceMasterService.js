import fs from "fs/promises";
import path from "path";
import { parseCsv } from "./csvService.js";

export const REFERENCE_MASTER_VERSION = "market-reference-master-v1";
export const DEFAULT_REFERENCE_MASTER_FILE = path.join(process.cwd(), "data", "reference", "market-reference-master.json");
export const REFERENCE_MASTER_FIELDS = ["Sector", "PE", "ROE", "Yield", "DE"];
export const DEFAULT_REFERENCE_MASTER_STALE_DAYS = 30;
const OPTIONAL_REFERENCE_FIELDS = ["PBV", "High_52W", "Low_52W"];
const NUMERIC_REFERENCE_FIELDS = ["PE", "ROE", "Yield", "DE", ...OPTIONAL_REFERENCE_FIELDS];

export async function importReferenceMasterFromCsv(inputFile, options = {}) {
  const content = await fs.readFile(inputFile, "utf8");
  const sourceStats = await fs.stat(inputFile).catch(() => null);
  const rows = parseCsv(content);
  return createReferenceMasterFromRows(rows, {
    generatedAt: options.generatedAt,
    sourceFile: inputFile,
    sourceLastModifiedAt: sourceStats?.mtime?.toISOString() || null,
    sourceType: options.sourceType || "recommended_stocks_csv",
  });
}

export function createReferenceMasterFromRows(rows, options = {}) {
  const generatedAt = options.generatedAt || new Date().toISOString();
  const records = (Array.isArray(rows) ? rows : [])
    .filter((row) => row.Symbol)
    .map((row, index) => normalizeReferenceRecord(row, {
      generatedAt,
      rowNumber: index + 1,
      sourceFile: options.sourceFile || null,
      sourceType: options.sourceType || "manual",
    }));
  const missingFieldCounts = Object.fromEntries(REFERENCE_MASTER_FIELDS.map((field) => [field, 0]));

  for (const record of records) {
    for (const field of record.metadata.missingFields) {
      if (field in missingFieldCounts) {
        missingFieldCounts[field] += 1;
      }
    }
  }

  const needsReviewRows = records.filter((record) => record.metadata.reviewStatus === "needs_review").length;

  return {
    version: REFERENCE_MASTER_VERSION,
    generatedAt,
    source: {
      type: options.sourceType || "manual",
      file: options.sourceFile || null,
      lastModifiedAt: options.sourceLastModifiedAt || null,
    },
    schema: {
      primaryKey: "Symbol",
      requiredFields: REFERENCE_MASTER_FIELDS,
      optionalFields: OPTIONAL_REFERENCE_FIELDS,
      missingValueRule: "Unknown sector, blank, dash, NaN, or numeric 0 require enrichment/manual review.",
    },
    totals: {
      totalRows: records.length,
      completeRows: records.length - needsReviewRows,
      needsReviewRows,
      missingFieldCounts,
    },
    records,
  };
}

export async function writeReferenceMaster(master, outputFile = DEFAULT_REFERENCE_MASTER_FILE) {
  await fs.mkdir(path.dirname(outputFile), { recursive: true });
  await fs.writeFile(outputFile, `${JSON.stringify(master, null, 2)}\n`, "utf8");
  return outputFile;
}

export async function loadReferenceMaster(filePath = DEFAULT_REFERENCE_MASTER_FILE) {
  const content = await fs.readFile(filePath, "utf8");
  const master = JSON.parse(content);
  if (master.version !== REFERENCE_MASTER_VERSION || !Array.isArray(master.records)) {
    throw new Error(`Unsupported reference master format: ${filePath}`);
  }
  return master;
}

export async function loadReferenceMasterMarketData(filePath = DEFAULT_REFERENCE_MASTER_FILE) {
  try {
    const master = await loadReferenceMaster(filePath);
    return new Map(master.records
      .filter((record) => record.Symbol)
      .map((record) => [String(record.Symbol).trim().toUpperCase(), flattenReferenceRecord(record)]));
  } catch {
    return new Map();
  }
}

export async function referenceMasterReviewSummary(options = {}) {
  const master = await loadReferenceMaster(options.filePath || DEFAULT_REFERENCE_MASTER_FILE);
  return summarizeReferenceMaster(master, options);
}

export function summarizeReferenceMaster(master, options = {}) {
  const staleAfterDays = positiveNumber(options.staleAfterDays, DEFAULT_REFERENCE_MASTER_STALE_DAYS);
  const now = new Date(options.now || new Date());
  const records = Array.isArray(master.records) ? master.records : [];
  const reviewQueue = records
    .filter((record) => record.metadata?.reviewStatus === "needs_review")
    .slice(0, options.limit || 25);
  const staleRecords = records.filter((record) => isStale(record.metadata?.lastUpdated, now, staleAfterDays));
  const oldestLastUpdated = records
    .map((record) => record.metadata?.lastUpdated)
    .filter(Boolean)
    .sort()[0] || null;

  return {
    version: master.version,
    generatedAt: master.generatedAt,
    source: master.source,
    schema: master.schema,
    totals: {
      ...master.totals,
      staleRows: staleRecords.length,
      reviewedRows: records.filter((record) => record.metadata?.reviewStatus === "reviewed").length,
      importedUnreviewedRows: records.filter((record) => record.metadata?.reviewStatus === "imported_unreviewed").length,
    },
    freshness: {
      staleAfterDays,
      status: staleRecords.length > 0 ? "needs_refresh" : "fresh",
      staleRows: staleRecords.length,
      oldestLastUpdated,
      checkedAt: now.toISOString(),
    },
    reviewQueue,
  };
}

export async function updateReferenceMasterRecord(symbol, updates = {}, options = {}) {
  const filePath = options.filePath || DEFAULT_REFERENCE_MASTER_FILE;
  const master = await loadReferenceMaster(filePath);
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();
  const recordIndex = master.records.findIndex((record) => record.Symbol === normalizedSymbol);
  if (recordIndex < 0) {
    throw new Error(`Reference master symbol not found: ${normalizedSymbol}`);
  }

  const previousRecord = structuredClone(master.records[recordIndex]);
  const generatedAt = options.updatedAt || new Date().toISOString();
  const nextRecord = normalizeReferenceRecord({
    ...previousRecord,
    ...updates,
    Symbol: normalizedSymbol,
  }, {
    generatedAt,
    rowNumber: previousRecord.metadata?.sourceRow || null,
    sourceFile: previousRecord.metadata?.sourceFile || master.source?.file || null,
    sourceType: "owner_admin_review",
  });
  nextRecord.metadata = {
    ...previousRecord.metadata,
    ...nextRecord.metadata,
    source: "owner_admin_review",
    lastUpdated: generatedAt,
    freshnessStatus: "fresh",
    reviewStatus: nextRecord.metadata.missingFields.length > 0 ? "needs_review" : "reviewed",
    reviewedAt: generatedAt,
    reviewedByUserId: options.reviewerId || null,
    reviewedByName: options.reviewerName || null,
    reviewNote: String(updates.reviewNote || options.reviewNote || "").trim() || null,
  };

  master.records[recordIndex] = nextRecord;
  master.generatedAt = generatedAt;
  master.totals = recalculateTotals(master.records);
  await writeReferenceMaster(master, filePath);

  return {
    record: nextRecord,
    previousRecord,
    summary: summarizeReferenceMaster(master, {
      staleAfterDays: options.staleAfterDays,
      now: generatedAt,
    }),
  };
}

function normalizeReferenceRecord(row, options = {}) {
  const symbol = String(row.Symbol || "").trim().toUpperCase();
  const fields = {
    Sector: normalizeSector(row.Sector),
    PE: normalizeReferenceNumber(row.PE),
    ROE: normalizeReferenceNumber(row.ROE),
    Yield: normalizeReferenceNumber(row.Yield),
    DE: normalizeReferenceNumber(row.DE),
    PBV: normalizeReferenceNumber(row.PBV),
    High_52W: normalizeReferenceNumber(row.High_52W),
    Low_52W: normalizeReferenceNumber(row.Low_52W),
  };
  const missingFields = REFERENCE_MASTER_FIELDS.filter((field) => isMissingReferenceField(field, fields[field]));

  return {
    Symbol: symbol,
    ...fields,
    metadata: {
      source: options.sourceType || "manual",
      sourceFile: options.sourceFile || null,
      sourceRow: options.rowNumber || null,
      lastUpdated: options.generatedAt,
      freshnessStatus: "snapshot_unverified",
      reviewStatus: missingFields.length > 0 ? "needs_review" : "imported_unreviewed",
      missingFields,
    },
  };
}

function recalculateTotals(records) {
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

function isStale(lastUpdated, now, staleAfterDays) {
  if (!lastUpdated) {
    return true;
  }
  const updatedAt = new Date(lastUpdated);
  if (Number.isNaN(updatedAt.getTime())) {
    return true;
  }
  return now.getTime() - updatedAt.getTime() > staleAfterDays * 24 * 60 * 60 * 1000;
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function flattenReferenceRecord(record) {
  return {
    Symbol: record.Symbol,
    Sector: record.Sector,
    PE: record.PE,
    ROE: record.ROE,
    Yield: record.Yield,
    DE: record.DE,
    PBV: record.PBV,
    High_52W: record.High_52W,
    Low_52W: record.Low_52W,
    Reference_Source: record.metadata?.source || "reference_master",
    Reference_Last_Updated: record.metadata?.lastUpdated || null,
    Reference_Freshness_Status: record.metadata?.freshnessStatus || "unknown",
    Reference_Review_Status: record.metadata?.reviewStatus || "unknown",
  };
}

function normalizeSector(value) {
  const text = String(value ?? "").trim();
  return text && text !== "-" ? text : "Unknown";
}

function normalizeReferenceNumber(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  const text = String(value).replace(/,/g, "").trim();
  if (!text || text === "-" || text.toLowerCase() === "nan") {
    return 0;
  }

  const number = Number(text);
  return Number.isFinite(number) ? number : 0;
}

function isMissingReferenceField(field, value) {
  if (field === "Sector") {
    return !value || String(value).trim().toLowerCase() === "unknown";
  }

  return NUMERIC_REFERENCE_FIELDS.includes(field) && Number(value) === 0;
}
