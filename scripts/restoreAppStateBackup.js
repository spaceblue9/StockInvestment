import { restoreLocalStateBackup, verifyLocalStateBackup } from "../src/services/backupService.js";

const options = parseArgs(process.argv.slice(2));

try {
  if (options.verifyOnly) {
    const result = await verifyLocalStateBackup(options.backupDir);
    console.log(JSON.stringify({
      ok: true,
      verified: true,
      backupDir: result.backupDir,
      readiness: {
        status: result.readiness.status,
        totalRecords: result.readiness.totalRecords,
        blockerCount: result.readiness.blockerCount,
        warningCount: result.readiness.warningCount,
      },
      recordCounts: result.recordCounts,
      files: result.files.map((file) => ({
        name: file.name,
        role: file.role,
        bytes: file.bytes,
        sha256: file.sha256,
      })),
    }, null, 2));
  } else {
    const result = await restoreLocalStateBackup(options);
    console.log(JSON.stringify({
      ok: true,
      restored: result.restored,
      plan: result.plan,
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
    verifyOnly: false,
  };

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];
    if (arg === "--help") {
      printHelp();
      process.exit(0);
    }
    if (arg === "--backup-dir") {
      options.backupDir = args[index + 1];
      index += 1;
      continue;
    }
    if (arg === "--verify") {
      options.verifyOnly = true;
      continue;
    }
    if (arg === "--dry-run") {
      options.dryRun = true;
      continue;
    }
    if (arg === "--confirm") {
      options.confirm = true;
      options.dryRun = false;
      continue;
    }

    throw new Error(`Unknown option: ${arg}`);
  }

  if (!options.backupDir) {
    throw new Error("--backup-dir is required.");
  }

  return options;
}

function printHelp() {
  console.log(`Usage:
  npm run restore:state -- --backup-dir <dir> [options]

Options:
  --backup-dir <dir>  Backup folder containing manifest.json.
  --verify            Verify manifest and checksums without restore.
  --dry-run           Build a restore plan without writing data. Default.
  --confirm           Restore files. Use only after reviewing dry-run output.
  --help              Show this help message.
`);
}
