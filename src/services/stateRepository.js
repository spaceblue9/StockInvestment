import fs from "fs/promises";
import path from "path";
import { auditTrailInfo, mirrorAuditTrail } from "./auditTrailRepository.js";
import { DATA_DIR, ensureDataDirs } from "./pathService.js";
import {
  assertPostgresRepositoryConfigured,
  patchPostgresAppState,
  postgresRepositoryInfo,
  readPostgresAppState,
  readScopedPostgresAppState,
  writePostgresAppState,
} from "./postgresStateRepository.js";
import { applyStatePatch, statePatchCapabilities } from "./statePatchService.js";

const STATE_FILE = path.join(DATA_DIR, "app-state.json");
const SUPPORTED_REPOSITORIES = ["local_file", "postgres"];

export async function readAppState(options = {}) {
  const adapter = assertSupportedRepository();
  if (adapter === "postgres") {
    return readPostgresAppState(options);
  }

  ensureDataDirs();
  try {
    const content = await fs.readFile(STATE_FILE, "utf8");
    const parsed = JSON.parse(content);
    return normalize(parsed, options.normalize);
  } catch {
    return normalize({}, options.normalize);
  }
}

export async function readScopedAppState(tenantScope, options = {}) {
  const adapter = assertSupportedRepository();
  if (adapter === "postgres") {
    return readScopedPostgresAppState(tenantScope, options);
  }

  return readAppState(options);
}

export async function writeAppState(state) {
  const adapter = assertSupportedRepository();
  if (adapter === "postgres") {
    assertPostgresRepositoryConfigured();
  }

  ensureDataDirs();
  await mirrorAuditTrail(state?.auditEvents || []);

  if (adapter === "postgres") {
    await writePostgresAppState(state);
    return;
  }

  await fs.writeFile(STATE_FILE, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export async function patchAppState(patch, options = {}) {
  const currentState = await readAppState({ normalize: options.normalize });
  const result = applyStatePatch(currentState, patch, options);

  if (assertSupportedRepository() === "postgres") {
    ensureDataDirs();
    await mirrorAuditTrail(result.state?.auditEvents || []);
    await patchPostgresAppState(patch, {
      ...options,
      currentState,
      nextState: result.state,
    });
    return result;
  }

  await writeAppState(result.state);
  return result;
}

export function stateRepositoryInfo() {
  const adapter = assertSupportedRepository();
  const auditTrail = auditTrailInfo();
  const adapterInfo = adapter === "postgres"
    ? postgresRepositoryInfo()
    : {
      adapter,
      engine: adapter,
      stateFile: "data/app-state.json",
      productionReady: false,
    };

  return {
    ...adapterInfo,
    normalizedOnRead: true,
    auditTrail: {
      adapter: auditTrail.adapter,
      trailFile: auditTrail.trailFile,
      appendOnly: auditTrail.appendOnly,
      externalProvider: auditTrail.externalProvider,
    },
    supportedAdapters: SUPPORTED_REPOSITORIES,
    migrationTarget: adapter === "postgres" ? "postgres_state_repository" : "production_database_repository",
    scopedReads: adapter === "postgres" ? "query_level_sql_where" : "service_level_filtering_only",
    patchWrites: {
      available: true,
      mode: adapter === "postgres" ? "collection_level_postgres_transaction" : "logical_patch_then_local_file_write",
      capabilities: statePatchCapabilities(),
    },
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
  return adapter;
}
