#!/usr/bin/env node
import { importAppStateToPostgres } from "../src/services/postgresStateImporter.js";

const options = parseArgs(process.argv.slice(2));

try {
  const result = await importAppStateToPostgres(options);
  console.log(JSON.stringify({
    ok: true,
    imported: result.imported,
    inputFile: result.inputFile,
    bytes: result.bytes,
    readiness: result.plan.readiness,
    totalRecords: result.plan.totalRecords,
    collectionCounts: result.plan.collectionCounts,
    appendOnlyCollections: result.plan.appendOnlyCollections,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
  }, null, 2));
  process.exitCode = 1;
}

function parseArgs(args) {
  const options = {
    dryRun: false,
    allowBlocked: false,
    inputFile: undefined,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--dry-run") {
      options.dryRun = true;
    } else if (arg === "--allow-blocked") {
      options.allowBlocked = true;
    } else if (arg === "--input") {
      options.inputFile = args[index + 1];
      index += 1;
    } else if (arg === "--help" || arg === "-h") {
      printHelpAndExit();
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return options;
}

function printHelpAndExit() {
  console.log(`Usage: node scripts/importAppStateToPostgres.js [options]

Options:
  --input <file>      Path to local app-state.json. Defaults to data/app-state.json.
  --dry-run           Validate and print import plan without writing to Postgres.
  --allow-blocked     Allow import even when storage readiness is blocked.
  --help              Show this help text.

Required for a real import:
  APP_STATE_REPOSITORY=postgres
  DATABASE_URL=postgres://user:password@host:5432/database
`);
  process.exit(0);
}
