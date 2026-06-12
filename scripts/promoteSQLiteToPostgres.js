#!/usr/bin/env node
import {
  promoteSQLiteTrialToPostgres,
  renderSQLitePostgresPromotionText,
} from "../src/services/sqlitePostgresPromotionService.js";

const options = parseArgs(process.argv.slice(2));

try {
  const result = await promoteSQLiteTrialToPostgres(options);
  if (options.format === "text") {
    console.log(renderSQLitePostgresPromotionText(result));
  } else {
    console.log(JSON.stringify({
      ok: true,
      imported: result.imported,
      status: result.plan.status,
      dryRun: result.plan.dryRun,
      sqlite: result.plan.sqlite,
      postgres: result.plan.postgres,
      summary: result.plan.summary,
      totalRecords: result.plan.importPlan.totalRecords,
      collectionCounts: result.plan.importPlan.collectionCounts,
      checks: result.plan.checks,
      sanitizedEnvironment: result.plan.sanitizedEnvironment,
      nextSteps: result.plan.nextSteps,
    }, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
  }, null, 2));
  process.exitCode = 1;
}

function parseArgs(args) {
  const options = {
    dryRun: true,
    confirm: false,
    allowBlocked: false,
    format: "json",
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--sqlite" || arg === "--input") {
      options.sqliteDatabasePath = args[index + 1];
      index += 1;
    } else if (arg === "--dry-run") {
      options.dryRun = true;
      options.confirm = false;
    } else if (arg === "--confirm") {
      options.confirm = true;
      options.dryRun = false;
    } else if (arg === "--allow-blocked") {
      options.allowBlocked = true;
    } else if (arg === "--backup-evidence") {
      options.backupEvidence = args[index + 1];
      index += 1;
    } else if (arg === "--promotion-reviewed") {
      options.promotionReviewed = true;
    } else if (arg === "--pg-driver-ready") {
      options.pgDriverReady = true;
    } else if (arg === "--format") {
      options.format = args[index + 1] === "text" ? "text" : "json";
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
  console.log(`Usage: node scripts/promoteSQLiteToPostgres.js [options]

Options:
  --sqlite <file>          SQLite trial database path. Defaults to data/stockflix.sqlite.
  --dry-run                Build promotion evidence without writing to Postgres. Default.
  --confirm                Write SQLite state into Postgres after all guardrails are ready.
  --allow-blocked          Allow import despite storage readiness blockers.
  --backup-evidence <id>   Backup/snapshot evidence for the target Postgres database.
  --promotion-reviewed     Mark the dry-run plan as reviewed for this execution.
  --pg-driver-ready        Mark the Postgres driver/write path as verified.
  --format json|text       Output format. Defaults to json.
  --help                   Show this help text.

Required for a real promotion:
  APP_STATE_REPOSITORY=postgres
  DATABASE_URL=postgres://user:password@host:5432/database
  SQLITE_TO_POSTGRES_PG_DRIVER_READY=true
  SQLITE_TO_POSTGRES_BACKUP_EVIDENCE=<snapshot-or-pgdump-id>
  SQLITE_TO_POSTGRES_PROMOTION_REVIEWED=true
`);
  process.exit(0);
}
