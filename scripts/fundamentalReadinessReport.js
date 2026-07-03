import fs from "fs/promises";
import path from "path";
import { parseCsv } from "../src/services/csvService.js";
import { buildFundamentalReadinessReport } from "../src/services/fundamentalReadinessService.js";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputFile = path.resolve(rootDir, args.input || "recommended_stocks.csv");
const outputFile = path.resolve(rootDir, args.output || "data/outputs/fundamental_readiness_report.json");
const format = args.format || "text";

const rows = await readCsv(inputFile);
const report = buildFundamentalReadinessReport(rows, {
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

function printTextReport(report, filePath) {
  console.log("Fundamental data readiness");
  console.log(`source: ${report.source}`);
  console.log(`rows: ${report.totalRows}`);
  console.log(`status: ${report.overallStatus}`);
  console.log(`can calculate Fundamental RRR: ${report.canCalculateFundamentalRrr ? "yes" : "no"}`);
  console.log(`output: ${path.relative(rootDir, filePath)}`);
  for (const item of report.requirements) {
    console.log(`- ${item.label}: ${item.status} (${item.presentRows}/${report.totalRows}, ${item.coveragePct.toFixed(2)}%)`);
  }
  console.log(`recommendation: ${report.recommendation}`);
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
