#!/usr/bin/env node
import {
  renderPostgresPatchSmokeText,
  runPostgresPatchSmoke,
} from "../src/services/postgresPatchSmokeService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

try {
  const result = await runPostgresPatchSmoke(args);
  if (args.format === "text") {
    process.stdout.write(renderPostgresPatchSmokeText(result));
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
    } else if (arg === "--validation-runbook-ready") {
      parsed.validationRunbookReady = true;
    } else if (arg === "--canary-user-id") {
      parsed.canaryUserId = next();
    } else if (arg === "--canary-organization-id") {
      parsed.canaryOrganizationId = next();
    } else if (arg === "--canary-session-id") {
      parsed.canarySessionId = next();
    } else if (arg === "--canary-audit-event-id") {
      parsed.canaryAuditEventId = next();
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Postgres patch smoke harness

Usage:
  npm run postgres:patch-smoke -- [options]

Options:
  --dry-run
  --confirm
  --allow-production
  --database-url <postgres-url>
  --repository-adapter local_file|postgres
  --ssl-mode disable|require
  --node-env development|staging|production
  --backup-evidence <backup-id>
  --validation-runbook-ready
  --canary-user-id <id>
  --canary-organization-id <id>
  --canary-session-id <id>
  --canary-audit-event-id <id>
  --format json|text
  --strict
  --help

Default mode is dry-run. Real canary writes require --confirm and a non-blocked staging configuration.
`);
}
