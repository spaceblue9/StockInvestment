import fs from "fs/promises";
import ExcelJS from "exceljs";

const EXCLUDE_SYMBOLS = new Set(["XD", "SYMBOL", "NAME"]);

export const DEFAULT_SYMBOLS = [
  "PTT",
  "CPALL",
  "AOT",
  "ADVANC",
  "SCB",
  "KBANK",
  "DELTA",
  "GULF",
  "BDMS",
  "PTTEP",
];

export function parseWatchlistText(text) {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim().toUpperCase())
    .filter(Boolean);
}

export async function readWatchlistSymbols(filePath) {
  if (!filePath) {
    return [];
  }

  const content = await fs.readFile(filePath, "utf8");
  return parseWatchlistText(content);
}

export async function readPortfolioSymbols(filePath) {
  if (!filePath) {
    return [];
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerRow = worksheet.getRow(1);
  let symbolColumn = 0;

  headerRow.eachCell((cell, columnNumber) => {
    if (String(cell.value || "").trim().toLowerCase() === "symbol") {
      symbolColumn = columnNumber;
    }
  });

  if (!symbolColumn) {
    return [];
  }

  const symbols = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const rawValue = row.getCell(symbolColumn).value;
    const value = normalizeExcelValue(rawValue).trim().toUpperCase();
    if (value) {
      symbols.push(value);
    }
  });

  return symbols;
}

export async function collectSymbolsFromFiles({ watchlistPath, portfolioPath }) {
  const watchlistSymbols = await readWatchlistSymbols(watchlistPath);
  const portfolioSymbols = await readPortfolioSymbols(portfolioPath);
  const combined = [...watchlistSymbols, ...portfolioSymbols];

  const symbols = [...new Set(combined)]
    .map((symbol) => symbol.trim().toUpperCase())
    .filter((symbol) => symbol && !EXCLUDE_SYMBOLS.has(symbol))
    .sort();

  return symbols.length > 0 ? symbols : DEFAULT_SYMBOLS;
}

export function normalizeExcelValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    if ("text" in value) {
      return String(value.text || "");
    }

    if ("result" in value) {
      return String(value.result || "");
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text || "").join("");
    }
  }

  return String(value);
}
