import { createLocalStateBackup } from "../src/services/backupService.js";

const options = parseArgs(process.argv.slice(2));

try {
  const result = await createLocalStateBackup(options);
  console.log(JSON.stringify({
    ok: true,
    backupDir: result.backupDir,
    backupId: result.manifest.backupId,
    createdAt: result.manifest.createdAt,
    readiness: result.manifest.readiness,
    recordCounts: result.manifest.recordCounts,
    files: result.manifest.files,
  }, null, 2));
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    message: error.message,
  }, null, 2));
  process.exitCode = 1;
}

function parseArgs(args) {
  const options = {};

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--backup-root") {
      options.backupRoot = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--backup-id") {
      options.backupId = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--reason") {
      options.reason = args[index + 1];
      index += 1;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run backup:state -- [options]

Options:
  --backup-root <dir>  Directory that will contain backup folders. Defaults to data/backups.
  --backup-id <id>     Optional backup folder name.
  --reason <text>      Short reason stored in the manifest.
  --help               Show this help message.
`);
}
