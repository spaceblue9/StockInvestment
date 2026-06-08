#!/usr/bin/env node
import {
  buildPostgresPatchValidationRunbook,
  renderPostgresPatchValidationRunbookText,
} from "../src/services/postgresPatchValidationRunbookService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const runbook = buildPostgresPatchValidationRunbook(args);

if (args.format === "text") {
  process.stdout.write(renderPostgresPatchValidationRunbookText(runbook));
} else {
  process.stdout.write(`${JSON.stringify(runbook, null, 2)}\n`);
}

if (args.strict && runbook.status === "blocked") {
  process.exitCode = 1;
}

function parseArgs(argv) {
  const parsed = {
    format: "json",
    strict: false,
    help: false,
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
    } else if (arg === "--database-url") {
      parsed.databaseUrl = next();
    } else if (arg === "--repository-adapter") {
      parsed.repositoryAdapter = next();
    } else if (arg === "--ssl-mode") {
      parsed.sslMode = next();
    } else if (arg === "--backup-strategy") {
      parsed.backupStrategy = next();
    } else if (arg === "--canary-user-id") {
      parsed.canaryUserId = next();
    } else if (arg === "--canary-organization-id") {
      parsed.canaryOrganizationId = next();
    } else if (arg === "--pg-driver-ready") {
      parsed.pgDriverReady = true;
    } else if (arg === "--import-dry-run-done") {
      parsed.importDryRunDone = true;
    } else if (arg === "--state-imported") {
      parsed.stateImported = true;
    } else if (arg === "--backup-verified") {
      parsed.backupVerified = true;
    } else if (arg === "--rollback-plan-approved") {
      parsed.rollbackPlanApproved = true;
    } else if (arg === "--patch-smoke-approved") {
      parsed.patchSmokeApproved = true;
    } else if (arg === "--scoped-read-verified") {
      parsed.scopedReadVerified = true;
    } else if (arg === "--audit-mirror-verified") {
      parsed.auditMirrorVerified = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Postgres patch write validation runbook dry-run

Usage:
  npm run postgres:patch-validation -- [options]

Options:
  --database-url <postgres-url>
  --repository-adapter local_file|postgres
  --ssl-mode disable|require
  --backup-strategy managed_snapshot|pg_dump|both
  --canary-user-id <id>
  --canary-organization-id <id>
  --pg-driver-ready
  --import-dry-run-done
  --state-imported
  --backup-verified
  --rollback-plan-approved
  --patch-smoke-approved
  --scoped-read-verified
  --audit-mirror-verified
  --format json|text
  --strict
  --help

This command does not connect to Postgres or write data.
It prints a sanitized staging validation plan for collection-level patch writes.
`);
}
