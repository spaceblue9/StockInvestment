import fs from "fs/promises";
import os from "os";
import path from "path";
import { buildLiveMarketCoverageReport, writeLiveMarketCoverageReport } from "../src/services/marketCoverageService.js";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-market-coverage-"));

try {
  const rows = [
    {
      Symbol: "AAA",
      Sector: "Commerce",
      PE: 12.5,
      ROE: 18.2,
      Yield: 3.4,
      DE: 0.7,
    },
    {
      Symbol: "BBB",
      Sector: "Unknown",
      PE: 0,
      ROE: "",
      Yield: 0,
      DE: null,
    },
    {
      Symbol: "CCC",
      Sector: "Energy",
      PE: "-",
      ROE: 9.1,
      Yield: 1.5,
      DE: 0,
    },
  ];
  const referenceBySymbol = new Map([
    ["AAA", rows[0]],
  ]);

  const report = buildLiveMarketCoverageReport(rows, {
    generatedAt: "2026-06-11T01:20:35.000Z",
    referenceBySymbol,
    referenceFile: `${path.join(tempRoot, "data", "reference", "market-reference-master.json")} -> ${path.join(tempRoot, "recommended_stocks.csv")}`,
    targetFile: "data/outputs/siamchart_raw.csv",
  });

  assertEqual(report.version, "live-market-coverage-v1", "Report version should be stable.");
  assertEqual(report.source.targetFile, "raw_CSV.csv", "Report should expose the neutral public raw CSV filename.");
  assertEqual(report.source.fallbackReference, "market-reference-master.json -> recommended_stocks.csv", "Report should not expose absolute reference fallback paths.");
  assertEqual(report.totals.totalRows, 3, "Report should count all rows.");
  assertEqual(report.totals.completeRows, 1, "Report should count rows with complete coverage.");
  assertEqual(report.totals.incompleteRows, 2, "Report should count rows with missing coverage.");
  assertEqual(report.referenceFallback.referenceSymbolCount, 1, "Report should count reference symbols.");
  assertEqual(report.referenceFallback.missingReferenceRowCount, 2, "Report should count rows missing reference fallback.");
  assertEqual(report.unknownSectorCount, 1, "Report should count Unknown sector rows.");
  assertEqual(report.missingFundamentalCounts.PE, 2, "Report should count missing PE values.");
  assertEqual(report.missingFundamentalCounts.ROE, 1, "Report should count missing ROE values.");
  assertEqual(report.missingFundamentalCounts.Yield, 1, "Report should count missing Yield values.");
  assertEqual(report.missingFundamentalCounts.DE, 2, "Report should count missing D/E values.");
  assertEqual(report.productionRecommendation.status, "needs_reference_enrichment", "Incomplete coverage should require enrichment.");
  assert(report.impactedSymbols.some((row) => row.symbol === "BBB" && row.missingFields.includes("Sector")), "Impacted symbols should include missing sector.");
  assert(report.impactedSymbols.some((row) => row.symbol === "CCC" && row.missingFields.includes("DE")), "Impacted symbols should include missing D/E.");

  const outputFile = path.join(tempRoot, "live_market_coverage_report.json");
  await writeLiveMarketCoverageReport(report, outputFile);
  const savedReport = JSON.parse(await fs.readFile(outputFile, "utf8"));
  assertEqual(savedReport.productionRecommendation.status, "needs_reference_enrichment", "Saved report should preserve recommendation status.");
  assert(!JSON.stringify(savedReport).includes("siamchart_raw.csv"), "Saved coverage report should not expose the internal raw CSV compatibility filename.");
  assert(!JSON.stringify(savedReport).includes(tempRoot), "Saved coverage report should not expose absolute local temp paths.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "field-coverage-counts",
      "reference-fallback-counts",
      "production-recommendation",
      "public-target-file-sanitization",
      "public-reference-path-sanitization",
      "json-report-write",
    ],
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}
