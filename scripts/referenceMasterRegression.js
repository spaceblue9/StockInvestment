import fs from "fs/promises";
import os from "os";
import path from "path";
import { toCsv } from "../src/services/csvService.js";
import { enrichWithReferenceData, loadReferenceMarketData } from "../src/services/referenceDataService.js";
import {
  createReferenceMasterFromRows,
  importReferenceMasterFromCsv,
  loadReferenceMaster,
  loadReferenceMasterMarketData,
  writeReferenceMaster,
} from "../src/services/referenceMasterService.js";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-reference-master-"));

try {
  const csvFile = path.join(tempRoot, "recommended_stocks.csv");
  const masterFile = path.join(tempRoot, "market-reference-master.json");
  const fallbackCsvFile = path.join(tempRoot, "fallback.csv");
  await fs.writeFile(csvFile, toCsv([
    {
      Symbol: "AAA",
      Sector: "Commerce",
      PE: 12.5,
      ROE: 18,
      Yield: 3.2,
      DE: 0.6,
      PBV: 1.5,
      High_52W: 20,
      Low_52W: 10,
    },
    {
      Symbol: "BBB",
      Sector: "Unknown",
      PE: 0,
      ROE: "",
      Yield: 0,
      DE: 0,
      PBV: 0,
      High_52W: 15,
      Low_52W: 7,
    },
  ]), "utf8");
  await fs.writeFile(fallbackCsvFile, toCsv([
    {
      Symbol: "AAA",
      Sector: "Fallback",
      PE: 99,
      ROE: 99,
      Yield: 99,
      DE: 99,
      PBV: 99,
      High_52W: 99,
      Low_52W: 99,
    },
    {
      Symbol: "BBB",
      Sector: "Industrials",
      PE: 15,
      ROE: 9.1,
      Yield: 1.4,
      DE: 0.8,
      PBV: 1.1,
      High_52W: 15,
      Low_52W: 7,
    },
    {
      Symbol: "CCC",
      Sector: "Energy",
      PE: 11,
      ROE: 14,
      Yield: 4,
      DE: 0.5,
      PBV: 1,
      High_52W: 30,
      Low_52W: 18,
    },
  ]), "utf8");

  const master = await importReferenceMasterFromCsv(csvFile, {
    generatedAt: "2026-06-11T02:33:17.000Z",
  });
  assertEqual(master.version, "market-reference-master-v1", "Reference master version should be stable.");
  assertEqual(master.totals.totalRows, 2, "Importer should include all CSV symbols.");
  assertEqual(master.totals.completeRows, 1, "Importer should count complete rows.");
  assertEqual(master.totals.needsReviewRows, 1, "Importer should flag missing fundamental rows.");
  assertEqual(master.totals.missingFieldCounts.Sector, 1, "Importer should count missing sector.");
  assertEqual(master.totals.missingFieldCounts.PE, 1, "Importer should count missing PE.");

  await writeReferenceMaster(master, masterFile);
  const savedMaster = await loadReferenceMaster(masterFile);
  assertEqual(savedMaster.totals.needsReviewRows, 1, "Saved master should preserve review counts.");

  const masterBySymbol = await loadReferenceMasterMarketData(masterFile);
  assertEqual(masterBySymbol.get("AAA").Sector, "Commerce", "Master map should expose complete sector.");
  assertEqual(masterBySymbol.get("BBB").Reference_Review_Status, "needs_review", "Master map should expose review metadata.");

  const referenceBySymbol = await loadReferenceMarketData({
    masterFile,
    csvFile: fallbackCsvFile,
  });
  assertEqual(referenceBySymbol.size, 3, "Merged reference map should contain master and fallback-only symbols.");
  assertEqual(referenceBySymbol.get("AAA").PE, 12.5, "Master value should win when complete.");
  assertEqual(referenceBySymbol.get("BBB").Sector, "Industrials", "CSV fallback should fill missing master sector.");
  assertEqual(referenceBySymbol.get("BBB").PE, 15, "CSV fallback should fill missing master PE.");
  assertEqual(referenceBySymbol.get("CCC").Sector, "Energy", "CSV fallback-only symbol should be available.");

  const enriched = enrichWithReferenceData({
    Symbol: "BBB",
    Sector: "Unknown",
    Price: 10,
    PE: 0,
    ROE: 0,
    Yield: 0,
    DE: 0,
  }, referenceBySymbol.get("BBB"));
  assertEqual(enriched.Sector, "Industrials", "Enrichment should use merged reference sector.");
  assertEqual(enriched.PE, 15, "Enrichment should use merged reference PE.");

  const directCsvOnly = await loadReferenceMarketData(fallbackCsvFile);
  assertEqual(directCsvOnly.get("AAA").Sector, "Fallback", "String API should keep CSV-only compatibility.");

  const dryRunMaster = createReferenceMasterFromRows([
    { Symbol: "DDD", Sector: "Healthcare", PE: 10, ROE: 12, Yield: 2, DE: 0.2 },
  ], { generatedAt: "2026-06-11T02:40:00.000Z" });
  assertEqual(dryRunMaster.totals.completeRows, 1, "Pure builder should support dry-run import previews.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "csv-import",
      "metadata-counts",
      "master-write-read",
      "master-first-fallback-merge",
      "enrichment",
      "csv-compatibility",
    ],
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}
