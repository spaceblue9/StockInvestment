import fs from "fs/promises";
import path from "path";
import { parseCsv } from "./csvService.js";

const REFERENCE_FILE = path.join(process.cwd(), "recommended_stocks.csv");

export async function loadReferenceMarketData(filePath = REFERENCE_FILE) {
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

  return fallback ?? value;
}
