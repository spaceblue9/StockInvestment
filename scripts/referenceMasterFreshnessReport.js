import {
  DEFAULT_REFERENCE_MASTER_FILE,
  loadReferenceMaster,
} from "../src/services/referenceMasterService.js";
import {
  DEFAULT_REFERENCE_MASTER_FRESHNESS_REPORT_FILE,
  buildReferenceMasterFreshnessReport,
  buildReferenceMasterMigrationPlan,
  referenceMasterRepositoryInfo,
  writeReferenceMasterFreshnessReport,
} from "../src/services/referenceMasterRepository.js";

const args = parseArgs(process.argv.slice(2));
const inputFile = args.input || DEFAULT_REFERENCE_MASTER_FILE;
const outputFile = args.output || DEFAULT_REFERENCE_MASTER_FRESHNESS_REPORT_FILE;
const staleAfterDays = args["stale-days"] ? Number(args["stale-days"]) : undefined;
const limit = args.limit ? Number(args.limit) : undefined;

try {
  const master = await loadReferenceMaster(inputFile);
  const report = buildReferenceMasterFreshnessReport(master, {
    staleAfterDays,
    limit,
  });
  const migrationPlan = buildReferenceMasterMigrationPlan(master, {
    staleAfterDays,
    limit,
  });
  const payload = {
    ok: true,
    inputFile,
    outputFile: args["dry-run"] ? null : outputFile,
    repository: referenceMasterRepositoryInfo({
      filePath: inputFile,
      reportFile: outputFile,
      staleAfterDays,
    }),
    migrationPlan,
    report,
  };

  if (!args["dry-run"]) {
    await writeReferenceMasterFreshnessReport(report, outputFile);
  }

  console.log(JSON.stringify(payload, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    inputFile,
    error: error.message,
  }, null, 2));
  process.exitCode = 1;
}

function parseArgs(values) {
  const parsed = {};
  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];
    if (!value.startsWith("--")) {
      continue;
    }

    const key = value.slice(2);
    const next = values[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }
  return parsed;
}
