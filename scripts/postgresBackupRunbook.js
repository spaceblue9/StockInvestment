import {
  buildPostgresBackupRunbook,
  renderPostgresBackupRunbookText,
} from "../src/services/postgresBackupRunbookService.js";

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const runbook = buildPostgresBackupRunbook({
  strategy: args.strategy,
  retentionDays: args.retentionDays,
  rpoMinutes: args.rpoMinutes,
  rtoMinutes: args.rtoMinutes,
  databaseUrl: args.databaseUrl,
  repositoryAdapter: args.repositoryAdapter,
});

if (args.format === "text") {
  process.stdout.write(renderPostgresBackupRunbookText(runbook));
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
    } else if (arg === "--strategy") {
      parsed.strategy = next();
    } else if (arg === "--retention-days") {
      parsed.retentionDays = next();
    } else if (arg === "--rpo-minutes") {
      parsed.rpoMinutes = next();
    } else if (arg === "--rto-minutes") {
      parsed.rtoMinutes = next();
    } else if (arg === "--database-url") {
      parsed.databaseUrl = next();
    } else if (arg === "--repository-adapter") {
      parsed.repositoryAdapter = next();
    } else if (arg === "--format") {
      parsed.format = next() === "text" ? "text" : "json";
    } else if (arg === "--strict") {
      parsed.strict = true;
    } else {
      throw new Error(`Unknown option: ${arg}`);
    }
  }

  return parsed;
}

function printHelp() {
  process.stdout.write(`Postgres backup runbook dry-run

Usage:
  npm run postgres:backup-runbook -- [options]

Options:
  --strategy managed_snapshot|pg_dump|both
  --retention-days <days>
  --rpo-minutes <minutes>
  --rto-minutes <minutes>
  --database-url <postgres-url>
  --repository-adapter local_file|postgres
  --format json|text
  --strict
  --help

This command does not execute pg_dump, pg_restore, snapshots, or restore writes.
It prints a sanitized runbook/checklist for production Postgres backup planning.
`);
}
