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
const portfolioRows = await analyzePortfolio(
  path.join(rootDir, "portfolio_aom.xlsx"),
  pythonRecommendations,
  {
    outputFile: path.join(outputDir, "portfolio_aom_compare_analysis_report.xlsx"),
  },
);

const rawColumnCheck = checkColumns(rawRows[0], requiredRawColumns);
const recommendedColumnCheck = checkColumns(pythonRecommendations[0], requiredRecommendedColumns);
const formulaComparison = compareFormulaOutputs(pythonRecommendations, jsRecommendations);
const reportComparison = await comparePortfolioReports({
  pythonReportPath: path.join(rootDir, "portfolio_aom_analysis_report.xlsx"),
  jsReportPath: path.join(outputDir, "portfolio_aom_compare_analysis_report.xlsx"),
});

const report = {
  generatedAt: new Date().toISOString(),
  inputs: {
    rawRows: rawRows.length,
    pythonRecommendedRows: pythonRecommendations.length,
    jsRecommendedRows: jsRecommendations.length,
    portfolioRows: portfolioRows.length,
  },
  rawColumnCheck,
  recommendedColumnCheck,
  formulaComparison,
  reportComparison,
  notes: [
    "Formula comparison uses the existing Python-generated siamchart_raw.csv as shared input.",
    "Portfolio comparison uses existing recommended_stocks.csv as market data to isolate portfolio report logic.",
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

async function comparePortfolioReports({ pythonReportPath, jsReportPath }) {
  const pythonWorkbook = await readWorkbook(pythonReportPath);
  const jsWorkbook = await readWorkbook(jsReportPath);
  const pythonSheet = pythonWorkbook.getWorksheet("Portfolio Analysis");
  const jsSheet = jsWorkbook.getWorksheet("Portfolio Analysis");
  const pythonRows = sheetToObjects(pythonSheet);
  const jsRows = sheetToObjects(jsSheet);
  const jsBySymbol = new Map(jsRows.map((row) => [row.Symbol, row]));
  const mismatches = [];

  for (const pythonRow of pythonRows) {
    const jsRow = jsBySymbol.get(pythonRow.Symbol);
    if (!jsRow) {
      mismatches.push({
        symbol: pythonRow.Symbol,
        column: "Symbol",
        python: pythonRow.Symbol,
        js: null,
      });
      continue;
    }

    for (const column of reportColumns) {
      const pythonValue = pythonRow[column];
      const jsValue = jsRow[column];
      if (typeof pythonValue === "number" || typeof jsValue === "number") {
        const diff = Math.abs(numberValue(pythonValue) - numberValue(jsValue));
        if (diff > 1e-6 && mismatches.length < 25) {
          mismatches.push({
            symbol: pythonRow.Symbol,
            column,
            python: pythonValue,
            js: jsValue,
            diff,
          });
        }
      } else if (String(pythonValue ?? "") !== String(jsValue ?? "") && mismatches.length < 25) {
        mismatches.push({
          symbol: pythonRow.Symbol,
          column,
          python: pythonValue,
          js: jsValue,
        });
      }
    }
  }

  return {
    pythonSheets: pythonWorkbook.worksheets.map((worksheet) => worksheet.name),
    jsSheets: jsWorkbook.worksheets.map((worksheet) => worksheet.name),
    pythonRows: pythonRows.length,
    jsRows: jsRows.length,
    comparedColumns: reportColumns,
    mismatchCount: mismatches.length,
    sampleMismatches: mismatches,
  };
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
  console.log(`portfolio report rows: python=${report.reportComparison.pythonRows}, js=${report.reportComparison.jsRows}`);
  console.log(`portfolio report sample mismatches: ${report.reportComparison.mismatchCount}`);
  console.log("detail: data/outputs/t10_comparison_report.json");
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}
