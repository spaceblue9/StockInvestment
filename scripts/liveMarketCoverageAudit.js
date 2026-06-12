import fs from "fs/promises";
import path from "path";
import { parseCsv } from "../src/services/csvService.js";
import { buildLiveMarketCoverageReport, writeLiveMarketCoverageReport } from "../src/services/marketCoverageService.js";
import { loadReferenceMarketData } from "../src/services/referenceDataService.js";
import { DEFAULT_REFERENCE_MASTER_FILE } from "../src/services/referenceMasterService.js";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const selectedInputFile = args.input || await defaultInputFile();
const inputFile = path.resolve(rootDir, selectedInputFile);
const referenceFile = path.resolve(rootDir, args.reference || "recommended_stocks.csv");
const masterFile = path.resolve(rootDir, args.master || DEFAULT_REFERENCE_MASTER_FILE);
const outputFile = path.resolve(rootDir, args.output || path.join("data", "outputs", "live_market_coverage_report.json"));

await fs.mkdir(path.dirname(outputFile), { recursive: true });

const rows = parseCsv(await fs.readFile(inputFile, "utf8"));
const referenceBySymbol = await loadReferenceMarketData({
  csvFile: referenceFile,
  masterFile,
});
const report = buildLiveMarketCoverageReport(rows, {
  referenceBySymbol,
  referenceFile: `${masterFile} -> ${referenceFile}`,
  targetFile: inputFile,
});

await writeLiveMarketCoverageReport(report, outputFile);
printSummary(report, outputFile);

if (report.productionRecommendation.status === "blocked") {
  process.exitCode = 1;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--input") {
      parsed.input = values[index + 1];
      index += 1;
    } else if (value === "--reference") {
      parsed.reference = values[index + 1];
      index += 1;
    } else if (value === "--master") {
      parsed.master = values[index + 1];
      index += 1;
    } else if (value === "--output") {
      parsed.output = values[index + 1];
      index += 1;
    }
  }
  return parsed;
}

async function defaultInputFile() {
  const liveOutputFile = path.join("data", "outputs", "siamchart_raw.csv");
  try {
    await fs.access(path.resolve(rootDir, liveOutputFile));
    return liveOutputFile;
  } catch {
    return "siamchart_raw.csv";
  }
}

function printSummary(report, outputFilePath) {
  console.log("Live market coverage audit complete");
  console.log(`rows: ${report.totals.totalRows}`);
  console.log(`status: ${report.productionRecommendation.status}`);
  console.log(`complete rows: ${report.totals.completeRows}`);
  console.log(`unknown sectors: ${report.unknownSectorCount}`);
  console.log(`missing fundamentals: ${Object.entries(report.missingFundamentalCounts)
    .map(([field, count]) => `${field}=${count}`)
    .join(", ")}`);
  console.log(`missing reference rows: ${report.referenceFallback.missingReferenceRowCount}`);
  console.log(`detail: ${path.relative(rootDir, outputFilePath)}`);
}
