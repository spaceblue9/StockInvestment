#!/usr/bin/env node
import {
  renderReferenceMasterMigrationText,
  runReferenceMasterMigration,
} from "../src/services/referenceMasterMigrationService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  const result = await runReferenceMasterMigration(args);
  if (args.format === "text") {
    process.stdout.write(renderReferenceMasterMigrationText(result));
  } else {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  }

  if (args.strict && result.status === "blocked") {
    process.exitCode = 1;
  }
} catch (error) {
  process.stderr.write(`${JSON.stringify({
    ok: false,
    message: error.message,
  }, null, 2)}\n`);
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    format: "json",
    strict: false,
    help: false,
    confirm: false,
    allowProduction: false,
    replace: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => argv[++index] || "";

    if (arg === "--help" || arg === "-h") {
      parsed.help = true;
    } else if (arg === "--format") {
      parsed.format = next() === "text" ? "text" : "json";
    } else if (arg === "--strict") {
      parsed.strict = true;
    } else if (arg === "--confirm") {
      parsed.confirm = true;
      parsed.dryRun = false;
    } else if (arg === "--dry-run") {
      parsed.dryRun = true;
    } else if (arg === "--allow-production") {
      parsed.allowProduction = true;
    } else if (arg === "--replace") {
      parsed.replace = true;
    } else if (arg === "--input") {
      parsed.inputFile = next();
    } else if (arg === "--database-url") {
      parsed.databaseUrl = next();
    } else if (arg === "--repository-adapter") {
      parsed.repositoryAdapter = next();
    } else if (arg === "--ssl-mode") {
      parsed.sslMode = next();
    } else if (arg === "--node-env") {
      parsed.nodeEnv = next();
    } else if (arg === "--backup-evidence") {
      parsed.backupEvidence = next();
    } else if (arg === "--staging-ready") {
      parsed.stagingReady = true;
    } else if (arg === "--migration-plan-reviewed") {
      parsed.migrationPlanReviewed = true;
    } else if (arg === "--stale-days") {
      parsed.staleAfterDays = Number(next());
    } else if (arg === "--limit") {
      parsed.limit = Number(next());
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Reference master staging migration guard

Usage:
  npm run reference:migrate -- [options]

Options:
  --dry-run
  --confirm
  --replace
  --allow-production
  --input <data/reference/market-reference-master.json>
  --database-url <postgres-url>
  --repository-adapter local_file|postgres
  --ssl-mode disable|require
  --node-env development|staging|production
  --backup-evidence <backup-id>
  --staging-ready
  --migration-plan-reviewed
  --stale-days <days>
  --limit <rows>
  --format json|text
  --strict
  --help

Default mode is dry-run. Real reference master migration writes require --confirm and a non-blocked staging configuration.
`);
}
