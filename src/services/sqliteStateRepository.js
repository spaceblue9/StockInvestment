import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { DATA_DIR } from "./pathService.js";
import { stateCollectionDefinitions } from "./stateSchemaService.js";

const SQLITE_DRIVER = "node:sqlite";
const DEFAULT_SQLITE_DATABASE_PATH = path.join(DATA_DIR, "stockflix.sqlite");
const collections = stateCollectionDefinitions();

let sqliteDriverPromise = null;

export async function readSQLiteAppState(options = {}) {
  return withSQLiteDatabase(options, (db) => readStateFromSQLiteDatabase(db, options));
}

export async function readScopedSQLiteAppState(_tenantScope, options = {}) {
  return readSQLiteAppState(options);
}

export async function writeSQLiteAppState(state = {}, options = {}) {
  return withSQLiteDatabase(options, (db) => writeStateToSQLiteDatabase(db, state));
}

export function sqliteRepositoryInfo(options = {}) {
  const databasePath = sqliteDatabasePath(options);
  return {
    adapter: "sqlite",
    engine: "sqlite",
    stateFile: portableSQLiteDatabasePath(options),
    normalizedOnRead: true,
    productionReady: false,
    databasePath,
    databasePathConfigured: Boolean(cleanText(options.databasePath) || cleanText(process.env.SQLITE_DATABASE_PATH) || sqliteDatabaseUrlPath()),
    driver: SQLITE_DRIVER,
    driverInstall: "Built into Node.js 22+ as an experimental module.",
    bootstrapTables: collections.map((collection) => collection.productionTable),
    writeMode: "whole_state_sqlite_transaction",
    patchWriteMode: "logical_patch_then_sqlite_write",
    appendOnlyCollections: collections
      .filter((collection) => collection.appendOnly)
      .map((collection) => collection.name),
    tenantQueryGuard: {
      available: false,
      defaultReadMode: "whole_state",
      scopedReadMode: "service_level_filtering_only",
      supportedScopes: ["service_level"],
    },
  };
}

export function buildSQLiteBootstrapSql() {
  const statements = [];

  for (const collection of collections) {
    const table = quoteIdentifier(collection.productionTable);
    statements.push(`CREATE TABLE IF NOT EXISTS ${table} (
  record_id TEXT PRIMARY KEY,
  organization_id TEXT,
  user_id TEXT,
  record TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
)`);
    statements.push(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${collection.productionTable}_organization_id_idx`)} ON ${table} (organization_id)`);
    statements.push(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${collection.productionTable}_user_id_idx`)} ON ${table} (user_id)`);
  }

  return `${statements.join(";\n\n")};`;
}

export function readStateFromSQLiteDatabase(db, options = {}) {
  ensureSQLiteSchema(db);
  const state = {};

  for (const collection of collections) {
    const table = quoteIdentifier(collection.productionTable);
    const rows = db.prepare(`SELECT record FROM ${table} ORDER BY created_at ASC, record_id ASC`).all();
    state[collection.name] = rows.map((row) => JSON.parse(row.record));
  }

  return typeof options.normalize === "function" ? options.normalize(state) : state;
}

export function writeStateToSQLiteDatabase(db, state = {}) {
  db.exec("BEGIN IMMEDIATE");
  try {
    ensureSQLiteSchema(db);

    for (const collection of collections) {
      const records = Array.isArray(state[collection.name]) ? state[collection.name] : [];
      const table = quoteIdentifier(collection.productionTable);

      if (!collection.appendOnly) {
        db.prepare(`DELETE FROM ${table}`).run();
      }

      const upsert = db.prepare(`INSERT INTO ${table} (record_id, organization_id, user_id, record, created_at, updated_at)
VALUES (?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP), CURRENT_TIMESTAMP)
ON CONFLICT(record_id) DO UPDATE SET
  organization_id = excluded.organization_id,
  user_id = excluded.user_id,
  record = excluded.record,
  updated_at = CURRENT_TIMESTAMP`);

      for (const record of records) {
        const recordId = primaryKeyValue(record, collection.primaryKey);
        assertPrimaryKey(recordId, collection.name);
        upsert.run(
          recordId,
          nullableString(record.organizationId),
          nullableString(userReferenceForRecord(record, collection.name)),
          JSON.stringify(record),
          nullableString(record.createdAt || record.updatedAt || record.generatedAt || record.assignedAt),
        );
      }
    }

    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function ensureSQLiteSchema(db) {
  db.exec(buildSQLiteBootstrapSql());
}

async function withSQLiteDatabase(options, action) {
  const { DatabaseSync } = await sqliteDriver();
  const databasePath = sqliteDatabasePath(options);
  ensureSQLiteParentDir(databasePath);
  const db = new DatabaseSync(databasePath);
  try {
    db.exec("PRAGMA journal_mode = WAL");
    db.exec("PRAGMA foreign_keys = ON");
    return action(db);
  } finally {
    db.close();
  }
}

async function sqliteDriver() {
  if (!sqliteDriverPromise) {
    sqliteDriverPromise = import(SQLITE_DRIVER).catch((error) => {
      sqliteDriverPromise = null;
      throw new Error(`SQLite adapter requires Node.js 22+ with '${SQLITE_DRIVER}'. Use APP_STATE_REPOSITORY=local_file or APP_STATE_REPOSITORY=postgres if unavailable. ${error.message}`);
    });
  }

  return sqliteDriverPromise;
}

function sqliteDatabasePath(options = {}) {
  return path.resolve(cleanText(options.databasePath) || cleanText(process.env.SQLITE_DATABASE_PATH) || sqliteDatabaseUrlPath() || DEFAULT_SQLITE_DATABASE_PATH);
}

function portableSQLiteDatabasePath(options = {}) {
  const absolutePath = sqliteDatabasePath(options);
  const relativePath = path.relative(process.cwd(), absolutePath);
  return relativePath && !relativePath.startsWith("..") ? relativePath.replace(/\\/g, "/") : absolutePath;
}

function sqliteDatabaseUrlPath() {
  const databaseUrl = cleanText(process.env.DATABASE_URL);
  if (!databaseUrl.startsWith("file:")) {
    return "";
  }

  if (databaseUrl.startsWith("file://")) {
    return fileURLToPath(databaseUrl);
  }

  return databaseUrl.slice("file:".length);
}

function ensureSQLiteParentDir(databasePath) {
  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
}

function primaryKeyValue(record, primaryKey) {
  if (Array.isArray(primaryKey)) {
    const values = primaryKey.map((field) => record?.[field]);
    return values.every(hasValue) ? values.map(String).join(":") : "";
  }

  return hasValue(record?.[primaryKey]) ? String(record[primaryKey]) : "";
}

function userReferenceForRecord(record, collectionName) {
  if (collectionName === "users") {
    return record.id;
  }

  return record.userId
    || record.customerId
    || record.advisorId
    || record.actorUserId
    || record.targetUserId
    || record.requestedByUserId
    || null;
}

function assertPrimaryKey(recordId, collectionName) {
  if (!recordId) {
    throw new Error(`Cannot persist ${collectionName}: missing primary key.`);
  }
}

function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/u.test(identifier)) {
    throw new Error(`Unsafe SQLite identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function nullableString(value) {
  return hasValue(value) ? String(value) : null;
}

function cleanText(value) {
  return hasValue(value) ? String(value).trim() : "";
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}
