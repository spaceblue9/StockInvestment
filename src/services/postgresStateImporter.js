import fs from "fs/promises";
import path from "path";
import { normalizeAppStateForImport } from "./authService.js";
import { writePostgresAppState, writeStateToPostgresClient } from "./postgresStateRepository.js";
import { buildStorageReadinessReport, stateCollectionDefinitions } from "./stateSchemaService.js";

const DEFAULT_INPUT_FILE = path.join(process.cwd(), "data", "app-state.json");
const collections = stateCollectionDefinitions();

export async function loadAppStateImportFile(inputFile = DEFAULT_INPUT_FILE) {
  const resolvedInputFile = path.resolve(inputFile);
  const content = await fs.readFile(resolvedInputFile, "utf8");
  const parsed = JSON.parse(content);
  const state = normalizeAppStateForImport(parsed);

  return {
    inputFile: resolvedInputFile,
    state,
    bytes: Buffer.byteLength(content, "utf8"),
  };
}

export function buildPostgresImportPlan(state = {}, options = {}) {
  const readiness = buildStorageReadinessReport(state);
  const allowBlocked = Boolean(options.allowBlocked);
  const collectionCounts = collections.map((collection) => ({
    collection: collection.name,
    table: collection.productionTable,
    records: Array.isArray(state[collection.name]) ? state[collection.name].length : 0,
    appendOnly: collection.appendOnly,
  }));
  const totalRecords = collectionCounts.reduce((total, collection) => total + collection.records, 0);
  const blocked = readiness.status === "blocked" && !allowBlocked;

  return {
    okToImport: !blocked,
    dryRun: Boolean(options.dryRun),
    allowBlocked,
    readiness: {
      schemaVersion: readiness.schemaVersion,
      status: readiness.status,
      blockerCount: readiness.blockerCount,
      warningCount: readiness.warningCount,
      totalRecords: readiness.totalRecords,
      issues: readiness.issues,
    },
    collectionCounts,
    totalRecords,
    writeMode: "whole_state_transaction",
    appendOnlyCollections: collections
      .filter((collection) => collection.appendOnly)
      .map((collection) => collection.name),
  };
}

export async function importAppStateToPostgres(options = {}) {
  const loaded = options.state
    ? { inputFile: options.inputFile || "", state: normalizeAppStateForImport(options.state), bytes: 0 }
    : await loadAppStateImportFile(options.inputFile);
  const plan = buildPostgresImportPlan(loaded.state, {
    dryRun: options.dryRun,
    allowBlocked: options.allowBlocked,
  });

  if (!plan.okToImport && !options.dryRun) {
    throw new Error(`Postgres import blocked by storage readiness issues: ${plan.readiness.blockerCount} blocker(s). Run dry-run for details or pass --allow-blocked intentionally.`);
  }

  if (!options.dryRun) {
    if (options.client) {
      await writeStateToPostgresClient(options.client, loaded.state);
    } else {
      await writePostgresAppState(loaded.state);
    }
  }

  return {
    ok: true,
    imported: !options.dryRun,
    inputFile: loaded.inputFile,
    bytes: loaded.bytes,
    plan,
  };
}
