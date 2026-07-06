import fs from "fs/promises";
import path from "path";
import ExcelJS from "exceljs";
import { parseCsv } from "../src/services/csvService.js";
import { buildActionMatrixComparisonReport } from "../src/services/actionMatrixComparisonService.js";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputFile = path.resolve(rootDir, args.input || "data/outputs/portfolio_regression_compare_analysis_report.xlsx");
const outputFile = path.resolve(rootDir, args.output || "data/outputs/action_matrix_comparison_report.json");
const format = args.format || "text";

const rows = await readRows(inputFile);
const report = buildActionMatrixComparisonReport(rows, {
  source: path.relative(rootDir, inputFile).replaceAll("\\", "/"),
});

await fs.mkdir(path.dirname(outputFile), { recursive: true });
await fs.writeFile(outputFile, `${JSON.stringify(report, null, 2)}\n`, "utf8");

if (format === "json") {
  console.log(JSON.stringify(report, null, 2));
} else {
  printTextReport(report, outputFile);
}

async function readCsv(filePath) {
  const content = await fs.readFile(filePath, "utf8");
  return parseCsv(content);
}

async function readRows(filePath) {
  if (/\.xlsx$/i.test(filePath)) {
    return readWorkbookRows(filePath);
  }

  return readCsv(filePath);
}

async function readWorkbookRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.getWorksheet("Portfolio Analysis") || workbook.worksheets[0];
  if (!worksheet) {
    return [];
  }

  const headers = [];
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headers[columnNumber] = String(cell.value || "").trim();
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const item = {};
    for (let columnNumber = 1; columnNumber < headers.length; columnNumber += 1) {
      const header = headers[columnNumber];
      if (header) {
        item[header] = cellValue(row.getCell(columnNumber).value);
      }
    }

    if (item.Symbol) {
      rows.push(item);
    }
  });

  return rows;
}

function cellValue(value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object" && "text" in value) {
    return value.text;
  }

  if (typeof value === "object" && "result" in value) {
    return value.result;
  }

  return value;
}

function printTextReport(report, filePath) {
  console.log("Think2 action matrix comparison");
  console.log(`source: ${report.source}`);
  console.log(`mode: ${report.mode}`);
  console.log(`rows: ${report.totalRows}`);
  console.log(`changed action family: ${report.changedRows} (${report.changedPct.toFixed(2)}%)`);
  console.log(`risk blocked: ${report.riskBlockedRows}`);
  console.log(`RED blocked legacy buy: ${report.redBlockedBuyRows}`);
  console.log(`DATA_ERROR blocked: ${report.dataBlockedRows}`);
  console.log(`output: ${path.relative(rootDir, filePath)}`);
  console.log(`recommendation: ${report.recommendation}`);
  if (report.reviewSamples.length) {
    console.log("review samples:");
    for (const sample of report.reviewSamples.slice(0, 5)) {
      console.log(`- ${sample.Symbol}: ${sample.Target_Action} -> ${sample.Action_v2_Shadow} (${sample.Action_v2_Change}, block ${sample.Action_v2_Risk_Block})`);
    }
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      continue;
    }

    const key = value.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}
