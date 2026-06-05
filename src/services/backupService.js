import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { normalizeAppStateForImport } from "./authService.js";
import { BACKUP_DIR, DATA_DIR, ensureDataDirs } from "./pathService.js";
import { stateRepositoryInfo, writeAppState } from "./stateRepository.js";
import { buildStorageReadinessReport, stateSchemaManifest } from "./stateSchemaService.js";

const BACKUP_VERSION = "stockflix-backup-v1";
const STATE_FILE_NAME = "app-state.json";
const AUDIT_TRAIL_FILE_NAME = "audit-events.ndjson";
const EXTERNAL_AUDIT_RECEIPTS_FILE_NAME = "audit-external-receipts.ndjson";
const MANIFEST_FILE_NAME = "manifest.json";
const RESTORE_FILE_NAMES = [
  STATE_FILE_NAME,
  AUDIT_TRAIL_FILE_NAME,
  EXTERNAL_AUDIT_RECEIPTS_FILE_NAME,
];

export async function createLocalStateBackup(options = {}) {
  assertLocalRepository();
  ensureDataDirs();

  const now = new Date();
  const backupRoot = path.resolve(options.backupRoot || BACKUP_DIR);
  const backupId = safeBackupId(options.backupId || `stockflix-backup-${timestampForPath(now)}`);
  const backupDir = path.join(backupRoot, backupId);
  await fs.mkdir(backupDir, { recursive: true });

  const parsedState = await readStateFileForBackup();
  const normalizedState = normalizeAppStateForImport(parsedState);
  const readiness = buildStorageReadinessReport(normalizedState);
  const files = [];

  const statePayload = `${JSON.stringify(normalizedState, null, 2)}\n`;
  await writeBackupFile(backupDir, STATE_FILE_NAME, statePayload, files, {
    role: "app_state",
    source: "data/app-state.json",
  });

  for (const fileName of [AUDIT_TRAIL_FILE_NAME, EXTERNAL_AUDIT_RECEIPTS_FILE_NAME]) {
    const sourcePath = path.join(DATA_DIR, fileName);
    const content = await readOptionalFile(sourcePath);
    if (content.exists) {
      await writeBackupFile(backupDir, fileName, content.buffer, files, {
        role: fileName === AUDIT_TRAIL_FILE_NAME ? "audit_trail" : "external_audit_receipts",
        source: `data/${fileName}`,
      });
    }
  }

  const manifest = {
    version: BACKUP_VERSION,
    backupId,
    createdAt: now.toISOString(),
    reason: String(options.reason || "manual").slice(0, 80),
    schemaVersion: stateSchemaManifest().version,
    repository: stateRepositoryInfo(),
    readiness: summarizeReadiness(readiness),
    recordCounts: collectionCounts(normalizedState),
    files,
    restoreGuard: {
      dryRunSupported: true,
      confirmRequired: true,
      safetyBackupBeforeRestore: true,
    },
    postgres: {
      adapterSupported: false,
      guidance: "Use managed Postgres snapshots or pg_dump/pg_restore in production. This local drill protects the file-backed prototype state.",
    },
  };

  await fs.writeFile(path.join(backupDir, MANIFEST_FILE_NAME), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  return {
    ok: true,
    backupDir,
    manifest,
  };
}

export async function verifyLocalStateBackup(backupDir) {
  if (!backupDir) {
    throw new Error("Backup directory is required.");
  }

  const resolvedBackupDir = path.resolve(backupDir);
  const manifestPath = path.join(resolvedBackupDir, MANIFEST_FILE_NAME);
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  if (manifest.version !== BACKUP_VERSION) {
    throw new Error(`Unsupported backup version: ${manifest.version || "unknown"}.`);
  }

  const verifiedFiles = [];
  for (const file of manifest.files || []) {
    const safeName = path.basename(file.name || "");
    if (!RESTORE_FILE_NAMES.includes(safeName)) {
      throw new Error(`Unsupported backup file in manifest: ${file.name || "unknown"}.`);
    }

    const filePath = path.join(resolvedBackupDir, safeName);
    const buffer = await fs.readFile(filePath);
    const checksum = sha256(buffer);
    if (checksum !== file.sha256) {
      throw new Error(`Backup checksum mismatch for ${safeName}.`);
    }

    verifiedFiles.push({
      ...file,
      path: filePath,
      verified: true,
    });
  }

  const stateFile = verifiedFiles.find((file) => file.name === STATE_FILE_NAME);
  if (!stateFile) {
    throw new Error("Backup manifest is missing app-state.json.");
  }

  const parsedState = JSON.parse(await fs.readFile(stateFile.path, "utf8"));
  const normalizedState = normalizeAppStateForImport(parsedState);
  const readiness = buildStorageReadinessReport(normalizedState);

  return {
    ok: true,
    backupDir: resolvedBackupDir,
    manifest,
    files: verifiedFiles,
    state: normalizedState,
    readiness,
    recordCounts: collectionCounts(normalizedState),
  };
}

export async function restoreLocalStateBackup(options = {}) {
  assertLocalRepository();
  const verification = await verifyLocalStateBackup(options.backupDir);
  const restorePlan = {
    backupDir: verification.backupDir,
    dryRun: Boolean(options.dryRun),
    confirmed: Boolean(options.confirm),
    readiness: summarizeReadiness(verification.readiness),
    recordCounts: verification.recordCounts,
    files: verification.files.map((file) => ({
      name: file.name,
      role: file.role,
      bytes: file.bytes,
      sha256: file.sha256,
    })),
  };

  if (options.dryRun) {
    return {
      ok: true,
      restored: false,
      plan: restorePlan,
    };
  }

  if (!options.confirm) {
    throw new Error("Restore requires confirm=true. Run dry-run first, then pass --confirm intentionally.");
  }

  ensureDataDirs();
  const safetyBackup = await createLocalStateBackup({
    reason: "pre_restore_safety",
  });

  await writeAppState(verification.state);
  await restoreOptionalFile(verification.backupDir, AUDIT_TRAIL_FILE_NAME);
  await restoreOptionalFile(verification.backupDir, EXTERNAL_AUDIT_RECEIPTS_FILE_NAME);

  return {
    ok: true,
    restored: true,
    plan: {
      ...restorePlan,
      safetyBackupDir: safetyBackup.backupDir,
    },
  };
}

function assertLocalRepository() {
  const info = stateRepositoryInfo();
  if (info.adapter !== "local_file") {
    throw new Error("Backup/restore drill currently supports APP_STATE_REPOSITORY=local_file only. Use managed snapshots or pg_dump for Postgres.");
  }
}

async function readStateFileForBackup() {
  const statePath = path.join(DATA_DIR, STATE_FILE_NAME);
  try {
    const content = await fs.readFile(statePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw new Error(`Cannot create backup because data/app-state.json is not valid JSON: ${error.message}`);
  }
}

async function readOptionalFile(filePath) {
  try {
    return {
      exists: true,
      buffer: await fs.readFile(filePath),
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        exists: false,
        buffer: Buffer.alloc(0),
      };
    }
    throw error;
  }
}

async function writeBackupFile(backupDir, fileName, content, files, metadata) {
  const buffer = Buffer.isBuffer(content) ? content : Buffer.from(String(content), "utf8");
  await fs.writeFile(path.join(backupDir, fileName), buffer);
  files.push({
    name: fileName,
    role: metadata.role,
    source: metadata.source,
    bytes: buffer.length,
    sha256: sha256(buffer),
  });
}

async function restoreOptionalFile(backupDir, fileName) {
  const backupPath = path.join(backupDir, fileName);
  const destinationPath = path.join(DATA_DIR, fileName);
  const content = await readOptionalFile(backupPath);
  if (content.exists) {
    await fs.writeFile(destinationPath, content.buffer);
    return;
  }

  await fs.rm(destinationPath, { force: true });
}

function summarizeReadiness(readiness) {
  return {
    schemaVersion: readiness.schemaVersion,
    status: readiness.status,
    totalRecords: readiness.totalRecords,
    collectionCount: readiness.collectionCount,
    blockerCount: readiness.blockerCount,
    warningCount: readiness.warningCount,
  };
}

function collectionCounts(state) {
  return Object.fromEntries(stateSchemaManifest().collections.map((collection) => [
    collection.name,
    Array.isArray(state?.[collection.name]) ? state[collection.name].length : 0,
  ]));
}

function safeBackupId(value) {
  return String(value || "backup")
    .trim()
    .replace(/[^a-zA-Z0-9_.-]+/g, "-")
    .slice(0, 120) || "backup";
}

function timestampForPath(date) {
  return date.toISOString()
    .replaceAll(":", "")
    .replaceAll(".", "")
    .replace("T", "-")
    .replace("Z", "Z");
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}
