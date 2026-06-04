import fs from "fs/promises";
import path from "path";
import { mirrorAuditTrail } from "./auditTrailRepository.js";
import { DATA_DIR, ensureDataDirs } from "./pathService.js";

const STATE_FILE = path.join(DATA_DIR, "app-state.json");
const SUPPORTED_REPOSITORIES = ["local_file"];

export async function readAppState(options = {}) {
  assertSupportedRepository();
  ensureDataDirs();

  try {
    const content = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return normalize(parsed, options.normalize);
  } catch {
    return normalize({}, options.normalize);
  }
}

export async function writeAppState(state) {
  assertSupportedRepository();
  ensureDataDirs();
  await mirrorAuditTrail(state?.auditEvents || []);
  await fs.writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function stateRepositoryInfo() {
  const adapter = selectedRepository();
  return {
    adapter,
    engine: adapter,
    stateFile: "data/app-state.json",
    normalizedOnRead: true,
    auditTrail: {
      adapter: "local_ndjson",
      trailFile: "data/audit-events.ndjson",
      appendOnly: true,
    },
    supportedAdapters: SUPPORTED_REPOSITORIES,
    productionReady: false,
    migrationTarget: "production_database_repository",
  };
}

function normalize(parsed, normalizer) {
  return typeof normalizer === "function" ? normalizer(parsed) : parsed;
}

function selectedRepository() {
  return String(process.env.APP_STATE_REPOSITORY || "local_file").trim().toLowerCase();
}

function assertSupportedRepository() {
  const adapter = selectedRepository();
  if (!SUPPORTED_REPOSITORIES.includes(adapter)) {
    throw new Error(`Unsupported APP_STATE_REPOSITORY adapter: ${adapter}`);
  }
}
