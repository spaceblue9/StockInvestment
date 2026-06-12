import fs from "fs/promises";
import path from "path";
import { DEFAULT_REFERENCE_MASTER_FILE, importReferenceMasterFromCsv, writeReferenceMaster } from "../src/services/referenceMasterService.js";

const rootDir = process.cwd();
const args = parseArgs(process.argv.slice(2));
const inputFile = path.resolve(rootDir, args.input || "recommended_stocks.csv");
const outputFile = path.resolve(rootDir, args.output || DEFAULT_REFERENCE_MASTER_FILE);
const dryRun = Boolean(args.dryRun);
const force = Boolean(args.force);

const master = await importReferenceMasterFromCsv(inputFile);

if (!dryRun) {
  const exists = await fileExists(outputFile);
  if (exists && !force) {
    throw new Error(`Reference master already exists: ${outputFile}. Re-run with --force to overwrite intentionally.`);
  }
  await writeReferenceMaster(master, outputFile);
}

printSummary(master, {
  dryRun,
  inputFile,
  outputFile,
  wroteFile: !dryRun,
});

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (value === "--input") {
      parsed.input = values[index + 1];
      index += 1;
    } else if (value === "--output") {
      parsed.output = values[index + 1];
      index += 1;
    } else if (value === "--dry-run") {
      parsed.dryRun = true;
    } else if (value === "--force") {
      parsed.force = true;
    }
  }
  return parsed;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function printSummary(master, options) {
  console.log("Reference master import complete");
  console.log(`input: ${path.relative(rootDir, options.inputFile)}`);
  console.log(`output: ${path.relative(rootDir, options.outputFile)}`);
  console.log(`dryRun: ${options.dryRun}`);
  console.log(`wroteFile: ${options.wroteFile}`);
  console.log(`rows: ${master.totals.totalRows}`);
  console.log(`complete rows: ${master.totals.completeRows}`);
  console.log(`needs review rows: ${master.totals.needsReviewRows}`);
  console.log(`missing fields: ${Object.entries(master.totals.missingFieldCounts)
    .map(([field, count]) => `${field}=${count}`)
    .join(", ")}`);
}
