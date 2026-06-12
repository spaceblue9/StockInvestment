import fs from "fs/promises";
import path from "path";

export const MARKET_COVERAGE_FIELDS = ["Sector", "PE", "ROE", "Yield", "DE"];
const NUMERIC_FUNDAMENTAL_FIELDS = ["PE", "ROE", "Yield", "DE"];
const REPORT_VERSION = "live-market-coverage-v1";

export function buildLiveMarketCoverageReport(rows, options = {}) {
  const normalizedRows = Array.isArray(rows) ? rows.map(normalizeRow) : [];
  const referenceBySymbol = options.referenceBySymbol instanceof Map
    ? options.referenceBySymbol
    : new Map();
  const missingReferenceSymbols = [];
  const impactedSymbols = [];
  const fieldStats = Object.fromEntries(MARKET_COVERAGE_FIELDS.map((field) => [field, {
    presentCount: 0,
    missingCount: 0,
    coveragePct: 0,
  }]));

  for (const row of normalizedRows) {
    const symbol = row.Symbol;
    const missingFields = [];

    if (symbol && !referenceBySymbol.has(symbol)) {
      missingReferenceSymbols.push(symbol);
    }

    for (const field of MARKET_COVERAGE_FIELDS) {
      const missing = field === "Sector"
        ? isMissingSector(row[field])
        : isMissingFundamental(row[field]);

      if (missing) {
        fieldStats[field].missingCount += 1;
        missingFields.push(field);
      } else {
        fieldStats[field].presentCount += 1;
      }
    }

    if (missingFields.length > 0) {
      impactedSymbols.push({
        symbol,
        missingFields,
        sector: row.Sector || "Unknown",
      });
    }
  }

  for (const field of MARKET_COVERAGE_FIELDS) {
    fieldStats[field].coveragePct = normalizedRows.length > 0
      ? roundPct((fieldStats[field].presentCount / normalizedRows.length) * 100)
      : 0;
  }

  const totalMissingFieldCount = Object.values(fieldStats)
    .reduce((total, stats) => total + stats.missingCount, 0);
  const status = normalizedRows.length === 0
    ? "blocked"
    : totalMissingFieldCount > 0
      ? "needs_reference_enrichment"
      : "ready";

  return {
    version: REPORT_VERSION,
    generatedAt: options.generatedAt || new Date().toISOString(),
    source: {
      liveProvider: "Yahoo chart endpoint",
      targetFile: publicTargetFileName(options.publicTargetFile || options.targetFile),
      fallbackReference: publicReferenceFileName(options.referenceFile || "recommended_stocks.csv"),
      limitation: "Yahoo chart endpoint does not provide Sector, PE, ROE, Yield, or D/E; these fields depend on reference fallback or another fundamental data source.",
    },
    totals: {
      totalRows: normalizedRows.length,
      completeRows: normalizedRows.length - impactedSymbols.length,
      incompleteRows: impactedSymbols.length,
      completeCoveragePct: normalizedRows.length > 0
        ? roundPct(((normalizedRows.length - impactedSymbols.length) / normalizedRows.length) * 100)
        : 0,
    },
    referenceFallback: {
      referenceSymbolCount: referenceBySymbol.size,
      matchedReferenceRowCount: normalizedRows.length - missingReferenceSymbols.length,
      missingReferenceRowCount: missingReferenceSymbols.length,
      sampleMissingReferenceSymbols: missingReferenceSymbols.slice(0, 50),
    },
    fields: fieldStats,
    unknownSectorCount: fieldStats.Sector.missingCount,
    missingFundamentalCounts: Object.fromEntries(NUMERIC_FUNDAMENTAL_FIELDS.map((field) => [
      field,
      fieldStats[field].missingCount,
    ])),
    impactedSymbols: impactedSymbols.slice(0, 50),
    productionRecommendation: buildProductionRecommendation(status, totalMissingFieldCount),
  };
}

export async function writeLiveMarketCoverageReport(report, outputFile) {
  await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return outputFile;
}

function buildProductionRecommendation(status, totalMissingFieldCount) {
  const nextSteps = [
    "Keep a reviewed reference master for Sector, PE, ROE, Yield, and D/E, preferably in a database table with data freshness metadata.",
    "Add a trusted fundamental data source for Thai equities if live coverage must be equivalent to the original Python yfinance path.",
    "Run scheduled enrichment and alert when any symbol remains Unknown or has 0/blank fundamental fields after fallback.",
  ];

  if (status === "ready") {
    return {
      status,
      summary: "All audited rows have Sector and fundamental fields after fallback.",
      nextSteps,
    };
  }

  if (status === "blocked") {
    return {
      status,
      summary: "No live market rows were available to audit.",
      nextSteps,
    };
  }

  return {
    status,
    summary: `${totalMissingFieldCount} Sector/fundamental field values are still missing after fallback.`,
    nextSteps,
  };
}

function normalizeRow(row = {}) {
  return {
    ...row,
    Symbol: String(row.Symbol || "").trim().toUpperCase(),
  };
}

function isMissingSector(value) {
  const text = String(value ?? "").trim();
  return !text || text.toLowerCase() === "unknown" || text === "-";
}

function isMissingFundamental(value) {
  if (value === null || value === undefined) {
    return true;
  }

  const text = String(value).trim();
  if (!text || text === "-" || text.toLowerCase() === "nan") {
    return true;
  }

  const number = Number(text.replace(/,/g, ""));
  return !Number.isFinite(number) || number === 0;
}

function roundPct(value) {
  return Math.round(value * 100) / 100;
}

function publicTargetFileName(value) {
  if (!value) {
    return null;
  }

  const fileName = publicFileName(value);
  return fileName.toLowerCase() === "siamchart_raw.csv" ? "raw_CSV.csv" : fileName;
}

function publicReferenceFileName(value) {
  return String(value)
    .split("->")
    .map((part) => publicFileName(part.trim()))
    .filter(Boolean)
    .join(" -> ");
}

function publicFileName(value) {
  return path.basename(String(value));
}
