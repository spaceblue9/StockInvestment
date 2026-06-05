import fs from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { analyzePortfolio } from "../src/services/portfolioService.js";
import { analyzeStocks } from "../src/services/stockAnalysisService.js";
import { parseCsv } from "../src/services/csvService.js";

const rootDir = process.cwd();
const outputDir = path.join(rootDir, "data", "outputs");
const requiredRawColumns = [
  "Symbol",
  "Sector",
  "Price",
  "PE",
  "PBV",
  "Yield",
  "ROE",
  "DE",
  "High_52W",
  "Low_52W",
  "RSI",
  "Volume",
  "Avg_Vol_10D",
];
const requiredRecommendedColumns = [
  ...requiredRawColumns,
  "Sector_PE",
  "Sector_ROE",
  "Sector_Yield",
  "DE_Score",
  "Price_Position",
  "RSI_Score",
  "Relative_Quality_Score",
  "PE_Score",
  "ROE_Score",
  "Yield_Score",
  "Total_Score",
  "Entry_Zone_Low",
  "Entry_Zone_High",
  "Exit_Zone_Low",
  "Exit_Zone_High",
  "Volume_Ratio",
  "Stop_Loss",
  "Upside_Pct",
  "RRR",
  "Recovery_Pct",
  "Trend_Status",
  "Rationale",
];
const formulaColumns = [
  "Sector_PE",
  "Sector_ROE",
  "Sector_Yield",
  "DE_Score",
  "Price_Position",
  "RSI_Score",
  "Relative_Quality_Score",
  "PE_Score",
  "ROE_Score",
  "Yield_Score",
  "Total_Score",
  "Entry_Zone_Low",
  "Entry_Zone_High",
  "Exit_Zone_Low",
  "Exit_Zone_High",
  "Volume_Ratio",
  "Stop_Loss",
  "Upside_Pct",
  "RRR",
];
const reportColumns = [
  "Symbol",
  "Price",
  "Total_Score",
  "Advice",
  "Target_Action",
  "Cost_Value",
  "Market_Value",
  "Gain_Loss_Value",
  "Gain_Loss_Pct",
  "RRR",
];

await fs.mkdir(outputDir, { recursive: true });

const rawRows = await readCsv(path.join(rootDir, "siamchart_raw.csv"));
const pythonRecommendations = await readCsv(path.join(rootDir, "recommended_stocks.csv"));
const jsRecommendations = await analyzeStocks(rawRows, {
  outputFile: path.join(outputDir, "recommended_stocks_compare.csv"),
});
const syntheticPortfolioRows = buildSyntheticPortfolioRows(pythonRecommendations);
const syntheticPortfolioPath = path.join(outputDir, "portfolio_regression_fixture.xlsx");
const syntheticPortfolioReportPath = path.join(outputDir, "portfolio_regression_compare_analysis_report.xlsx");
await writeSyntheticPortfolioWorkbook(syntheticPortfolioRows, syntheticPortfolioPath);
const portfolioRows = await analyzePortfolio(
  syntheticPortfolioPath,
  pythonRecommendations,
  {
    outputFile: syntheticPortfolioReportPath,
  },
);

const rawColumnCheck = checkColumns(rawRows[0], requiredRawColumns);
const recommendedColumnCheck = checkColumns(pythonRecommendations[0], requiredRecommendedColumns);
const formulaComparison = compareFormulaOutputs(pythonRecommendations, jsRecommendations);
const reportComparison = await comparePortfolioReportAgainstExpected({
  marketRows: pythonRecommendations,
  portfolioRows: syntheticPortfolioRows,
  jsReportPath: syntheticPortfolioReportPath,
});

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    rawRows: rawRows.length,
    pythonRecommendedRows: pythonRecommendations.length,
    jsRecommendedRows: jsRecommendations.length,
    syntheticPortfolioRows: portfolioRows.length,
  },
  rawColumnCheck,
  recommendedColumnCheck,
  formulaComparison,
  reportComparison,
  notes: [
    "Formula comparison uses the existing Python-generated siamchart_raw.csv as shared input.",
    "Portfolio comparison uses a synthetic temporary workbook to avoid committing private portfolio files.",
    "Live Node market data still differs from Python because Yahoo chart endpoint does not include PE/ROE/Yield/D/E/Sector.",
  ],
};

await fs.writeFile(
  path.join(outputDir, "t10_comparison_report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
  "utf8",
);

printSummary(report);

async function readCsv(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return parseCsv(content);
}

function checkColumns(row, requiredColumns) {
  const actualColumns = row ? Object.keys(row) : [];
  return {
    requiredCount: requiredColumns.length,
    actualCount: actualColumns.length,
    missing: requiredColumns.filter((column) => !actualColumns.includes(column)),
    extra: actualColumns.filter((column) => !requiredColumns.includes(column)),
  };
}

function compareFormulaOutputs(pythonRows, jsRows) {
  const jsBySymbol = new Map(jsRows.map((row) => [row.Symbol, row]));
  const sampleSymbols = pythonRows.slice(0, 10).map((row) => row.Symbol);
  const mismatches = [];
  let numericMismatchCount = 0;
  let textMismatchCount = 0;

  for (const pythonRow of pythonRows) {
    const jsRow = jsBySymbol.get(pythonRow.Symbol);
    if (!jsRow) {
      mismatches.push({
        symbol: pythonRow.Symbol,
        column: "Symbol",
        python: pythonRow.Symbol,
        js: null,
        reason: "Missing JS row",
      });
      continue;
    }

    for (const column of formulaColumns) {
      const diff = Math.abs(numberValue(pythonRow[column]) - numberValue(jsRow[column]));
      if (diff > 1e-6) {
        numericMismatchCount += 1;
        if (mismatches.length < 25) {
          mismatches.push({
            symbol: pythonRow.Symbol,
            column,
            python: numberValue(pythonRow[column]),
            js: numberValue(jsRow[column]),
            diff,
          });
        }
      }
    }

    for (const column of ["Trend_Status", "Rationale"]) {
      if (String(pythonRow[column]) !== String(jsRow[column])) {
        textMismatchCount += 1;
        if (mismatches.length < 25) {
          mismatches.push({
            symbol: pythonRow.Symbol,
            column,
            python: pythonRow[column],
            js: jsRow[column],
          });
        }
      }
    }
  }

  return {
    sampleSymbols,
    numericMismatchCount,
    textMismatchCount,
    sampleMismatches: mismatches,
  };
}

function buildSyntheticPortfolioRows(marketRows) {
  const priceMultipliers = [1.12, 0.88, 1.03, 0.75, 1.25];
  return marketRows
    .filter((row) => row.Symbol && numberValue(row.Price) > 0)
    .slice(0, priceMultipliers.length)
    .map((row, index) => ({
      Symbol: String(row.Symbol).trim().toUpperCase(),
      Quantity: (index + 1) * 100,
      Avg_Price: roundCurrency(numberValue(row.Price) * priceMultipliers[index]),
    }));
}

async function writeSyntheticPortfolioWorkbook(rows, filePath) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Portfolio");
  worksheet.columns = [
    { header: "Symbol", key: "Symbol", width: 12 },
    { header: "Quantity", key: "Quantity", width: 12 },
    { header: "Avg_Price", key: "Avg_Price", width: 12 },
  ];
  worksheet.addRows(rows);
  await workbook.xlsx.writeFile(filePath);
}

async function comparePortfolioReportAgainstExpected({ marketRows, portfolioRows, jsReportPath }) {
  const jsWorkbook = await readWorkbook(jsReportPath);
  const jsSheet = jsWorkbook.getWorksheet("Portfolio Analysis");
  const jsRows = sheetToObjects(jsSheet);
  const jsBySymbol = new Map(jsRows.map((row) => [row.Symbol, row]));
  const expectedRows = buildExpectedPortfolioRows(portfolioRows, marketRows);
  const mismatches = [];

  for (const expectedRow of expectedRows) {
    const jsRow = jsBySymbol.get(expectedRow.Symbol);
    if (!jsRow) {
      mismatches.push({
        symbol: expectedRow.Symbol,
        column: "Symbol",
        expected: expectedRow.Symbol,
        js: null,
      });
      continue;
    }

    for (const column of reportColumns) {
      const expectedValue = expectedRow[column];
      const jsValue = jsRow[column];
      if (typeof expectedValue === "number" || typeof jsValue === "number") {
        const diff = Math.abs(numberValue(expectedValue) - numberValue(jsValue));
        if (diff > 1e-6 && mismatches.length < 25) {
          mismatches.push({
            symbol: expectedRow.Symbol,
            column,
            expected: expectedValue,
            js: jsValue,
            diff,
          });
        }
      } else if (String(expectedValue ?? "") !== String(jsValue ?? "") && mismatches.length < 25) {
        mismatches.push({
          symbol: expectedRow.Symbol,
          column,
          expected: expectedValue,
          js: jsValue,
        });
      }
    }
  }

  return {
    expectedSource: "synthetic portfolio workbook",
    jsSheets: jsWorkbook.worksheets.map((worksheet) => worksheet.name),
    expectedRows: expectedRows.length,
    jsRows: jsRows.length,
    comparedColumns: reportColumns,
    mismatchCount: mismatches.length,
    sampleMismatches: mismatches,
  };
}

function buildExpectedPortfolioRows(portfolioRows, marketRows) {
  const marketBySymbol = new Map(marketRows.map((row) => [String(row.Symbol).trim().toUpperCase(), row]));
  return portfolioRows.map((holding) => {
    const market = normalizeExpectedMarketRow(marketBySymbol.get(holding.Symbol));
    const costValue = holding.Quantity * holding.Avg_Price;
    const marketValue = holding.Quantity * market.Price;
    const gainLossValue = marketValue - costValue;
    const gainLossPct = holding.Avg_Price > 0
      ? ((market.Price - holding.Avg_Price) / holding.Avg_Price) * 100
      : 0;
    const row = {
      ...market,
      ...holding,
      Cost_Value: costValue,
      Market_Value: marketValue,
      Gain_Loss_Value: gainLossValue,
      Gain_Loss_Pct: gainLossPct,
    };
    row.Advice = getExpectedAdvice(row);
    row.Target_Action = getExpectedTargetAction(row);
    return row;
  });
}

function normalizeExpectedMarketRow(row = {}) {
  return {
    ...row,
    Symbol: String(row.Symbol || "").trim().toUpperCase(),
    Price: numberValue(row.Price),
    Total_Score: numberValue(row.Total_Score),
    RRR: numberValue(row.RRR),
    Stop_Loss: numberValue(row.Stop_Loss),
    Entry_Zone_High: numberValue(row.Entry_Zone_High),
    Exit_Zone_Low: numberValue(row.Exit_Zone_Low),
    Price_Position: numberValue(row.Price_Position),
  };
}

function getExpectedAdvice(row) {
  if (row.Total_Score === null || row.Total_Score === undefined) {
    return "No Data";
  }

  if (row.Total_Score >= 70) {
    if (row.Gain_Loss_Pct < 0) {
      return "Buy More";
    }

    if (row.Price_Position < 40) {
      return "Accumulate";
    }

    return "Hold";
  }

  if (row.Total_Score >= 45) {
    return "Wait/Hold";
  }

  return row.Gain_Loss_Pct > 0 ? "Sell" : "Reduce/Cut";
}

function getExpectedTargetAction(row) {
  if (row.Price <= row.Stop_Loss || row.Total_Score < 30) {
    return "Exit All (100%)";
  }

  if (
    row.Advice === "Sell"
    || row.Advice === "Reduce/Cut"
    || (row.Total_Score >= 30 && row.Total_Score < 45)
  ) {
    return "Reduce 50%";
  }

  if (row.Advice === "Hold" && row.Price >= row.Exit_Zone_Low) {
    return `TP 50% @ ${row.Exit_Zone_Low.toFixed(2)}`;
  }

  if (row.Advice === "Buy More" || row.Advice === "Accumulate") {
    if (row.Price > row.Entry_Zone_High) {
      return `Wait & Bid @ ${row.Entry_Zone_High.toFixed(2)}`;
    }

    if (row.RRR >= 2.0) {
      return "Buy Now (Good RRR)";
    }

    return "Buy Now (Low RRR)";
  }

  return "Keep Holding";
}

async function readWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  return workbook;
}

function sheetToObjects(worksheet) {
  const headers = [];
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = String(cell.value || "");
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const object = {};
    for (let columnNumber = 1; columnNumber < headers.length; columnNumber += 1) {
      object[headers[columnNumber]] = row.getCell(columnNumber).value;
    }
    rows.push(object);
  });

  return rows;
}

function printSummary(report) {
  console.log("T10 comparison complete");
  console.log(`raw rows: ${report.inputs.rawRows}`);
  console.log(`recommended rows: python=${report.inputs.pythonRecommendedRows}, js=${report.inputs.jsRecommendedRows}`);
  console.log(`raw missing columns: ${report.rawColumnCheck.missing.join(", ") || "none"}`);
  console.log(`recommended missing columns: ${report.recommendedColumnCheck.missing.join(", ") || "none"}`);
  console.log(`formula numeric mismatches: ${report.formulaComparison.numericMismatchCount}`);
  console.log(`formula text mismatches: ${report.formulaComparison.textMismatchCount}`);
  console.log(`portfolio report rows: expected=${report.reportComparison.expectedRows}, js=${report.reportComparison.jsRows}`);
  console.log(`portfolio report sample mismatches: ${report.reportComparison.mismatchCount}`);
  console.log("detail: data/outputs/t10_comparison_report.json");
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
