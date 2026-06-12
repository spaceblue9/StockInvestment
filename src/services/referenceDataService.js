import fs from "fs/promises";
import path from "path";
import { parseCsv } from "./csvService.js";
import { DEFAULT_REFERENCE_MASTER_FILE, loadReferenceMasterMarketData } from "./referenceMasterService.js";

const REFERENCE_FILE = path.join(process.cwd(), "recommended_stocks.csv");

export async function loadReferenceMarketData(options = {}) {
  if (typeof options === "string") {
    return loadCsvReferenceMarketData(options);
  }

  const {
    csvFile = REFERENCE_FILE,
    masterFile = DEFAULT_REFERENCE_MASTER_FILE,
    preferMaster = true,
  } = options;
  const csvBySymbol = await loadCsvReferenceMarketData(csvFile);
  if (!preferMaster) {
    return csvBySymbol;
  }

  const masterBySymbol = await loadReferenceMasterMarketData(masterFile);
  return mergeReferenceMaps(masterBySymbol, csvBySymbol);
}

async function loadCsvReferenceMarketData(filePath = REFERENCE_FILE) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    const rows = parseCsv(content);
    return new Map(rows
      .filter((row) => row.Symbol)
      .map((row) => [String(row.Symbol).trim().toUpperCase(), row]));
  } catch {
    return new Map();
  }
}

export function enrichWithReferenceData(row, referenceRow) {
  if (!referenceRow) {
    return row;
  }

  return {
    ...row,
    Sector: fallbackText(row.Sector, referenceRow.Sector, "Unknown"),
    PE: fallbackNumber(row.PE, referenceRow.PE),
    PBV: fallbackNumber(row.PBV, referenceRow.PBV),
    Yield: fallbackNumber(row.Yield, referenceRow.Yield),
    ROE: fallbackNumber(row.ROE, referenceRow.ROE),
    DE: fallbackNumber(row.DE, referenceRow.DE),
    High_52W: fallbackNumber(row.High_52W, referenceRow.High_52W),
    Low_52W: fallbackNumber(row.Low_52W, referenceRow.Low_52W),
  };
}

function mergeReferenceMaps(primaryBySymbol, fallbackBySymbol) {
  const merged = new Map(fallbackBySymbol);
  for (const [symbol, primaryRow] of primaryBySymbol) {
    merged.set(symbol, mergeReferenceRows(primaryRow, fallbackBySymbol.get(symbol)));
  }
  return merged;
}

function mergeReferenceRows(primaryRow, fallbackRow = {}) {
  const output = {
    ...fallbackRow,
    ...primaryRow,
  };
  for (const field of ["Sector"]) {
    output[field] = fallbackText(primaryRow[field], fallbackRow[field], "Unknown");
  }
  for (const field of ["PE", "PBV", "Yield", "ROE", "DE", "High_52W", "Low_52W"]) {
    output[field] = fallbackNumber(primaryRow[field], fallbackRow[field]);
  }
  return output;
}

function fallbackText(value, fallback, emptyValue) {
  if (value && value !== emptyValue) {
    return value;
  }

  return fallback || emptyValue;
}

function fallbackNumber(value, fallback) {
  const number = Number(value);
  if (Number.isFinite(number) && number !== 0) {
    return number;
  }

  const fallbackNumberValue = Number(fallback);
  if (Number.isFinite(fallbackNumberValue) && fallbackNumberValue !== 0) {
    return fallbackNumberValue;
  }

  return fallback ?? value;
}
