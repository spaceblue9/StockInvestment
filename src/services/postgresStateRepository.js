import { stateCollectionDefinitions } from "./stateSchemaService.js";
import { applyStatePatch } from "./statePatchService.js";

const POSTGRES_DRIVER = "pg";
const POSTGRES_SSL_MODES = new Set(["disable", "require"]);
const collections = stateCollectionDefinitions();
const collectionByName = new Map(collections.map((collection) => [collection.name, collection]));
const patchOperationTypes = new Set(["upsert", "append", "delete"]);

let poolPromise = null;

export async function readPostgresAppState(options = {}) {
  return withPostgresClient((client) => readStateFromPostgresClient(client, options));
}

export async function readScopedPostgresAppState(tenantScope, options = {}) {
  return withPostgresClient((client) => readScopedStateFromPostgresClient(client, tenantScope, options));
}

export async function writePostgresAppState(state = {}) {
  return withPostgresClient((client) => writeStateToPostgresClient(client, state));
}

export async function patchPostgresAppState(patch = {}, options = {}) {
  return withPostgresClient((client) => patchStateToPostgresClient(client, patch, options));
}

export async function readPostgresUserByEmail(email) {
  return withPostgresClient(async (client) => {
    await ensurePostgresSchema(client);
    const result = await client.query(
      `SELECT record FROM "users" WHERE record->>'email' = $1 LIMIT 1`,
      [String(email || "").trim().toLowerCase()],
    );
    return result.rows?.[0]?.record || null;
  });
}

export async function readPostgresUserById(userId) {
  return withPostgresClient(async (client) => {
    await ensurePostgresSchema(client);
    return readPostgresRecordById(client, "users", userId);
  });
}

export async function readPostgresSessionUser(sessionId) {
  return withPostgresClient(async (client) => {
    return readPostgresSessionUserFromClient(client, sessionId);
  });
}

export async function readPostgresSessionUserFromClient(client, sessionId) {
  await ensurePostgresSchema(client);
  const session = await readPostgresRecordById(client, "sessions", sessionId);
  if (!session?.userId) {
    return {
      session,
      user: null,
    };
  }

  return {
    session,
    user: await readPostgresRecordById(client, "users", session.userId),
  };
}

export async function readLatestPostgresAuditEvent() {
  return withPostgresClient(async (client) => {
    await ensurePostgresSchema(client);
    const result = await client.query(
      `SELECT record FROM "audit_events" ORDER BY created_at DESC, record_id DESC LIMIT 1`,
    );
    return result.rows?.[0]?.record || null;
  });
}

export async function deletePostgresSessionRecord({ sessionId, auditEvent }) {
  return withPostgresClient(async (client) => {
    return deletePostgresSessionRecordFromClient(client, { sessionId, auditEvent });
  });
}

export async function deletePostgresSessionRecordFromClient(client, { sessionId, auditEvent } = {}) {
  await client.query("BEGIN");
  try {
    await ensurePostgresSchema(client);
    await deleteRecordFromPostgresClient(client, collectionDefinition("sessions"), sessionId);
    if (auditEvent?.id) {
      await insertRecordToPostgresClient(client, collectionDefinition("auditEvents"), auditEvent);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function patchPostgresLoginRecords({ user, session, auditEvent }) {
  return withPostgresClient(async (client) => {
    await client.query("BEGIN");
    try {
      await ensurePostgresSchema(client);
      await upsertRecordToPostgresClient(client, collectionDefinition("users"), user);
      await insertRecordToPostgresClient(client, collectionDefinition("sessions"), session);
      if (auditEvent?.id) {
        await insertRecordToPostgresClient(client, collectionDefinition("auditEvents"), auditEvent);
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    }
  });
}

async function readPostgresRecordById(client, collectionName, recordId) {
  const collection = collectionDefinition(collectionName);
  const table = quoteIdentifier(collection.productionTable);
  const result = await client.query(
    `SELECT record FROM ${table} WHERE record_id = $1 LIMIT 1`,
    [String(recordId || "")],
  );
  return result.rows?.[0]?.record || null;
}

export function postgresRepositoryInfo() {
  return {
    adapter: "postgres",
    engine: "postgresql",
    stateFile: null,
    normalizedOnRead: true,
    productionReady: Boolean(process.env.DATABASE_URL),
    databaseUrlConfigured: Boolean(process.env.DATABASE_URL),
    driver: POSTGRES_DRIVER,
    driverInstall: "npm install pg",
    sslMode: postgresSslMode(),
    bootstrapTables: collections.map((collection) => collection.productionTable),
    writeMode: "whole_state_transaction",
    patchWriteMode: "collection_level_transaction",
    appendOnlyCollections: collections
      .filter((collection) => collection.appendOnly)
      .map((collection) => collection.name),
    tenantQueryGuard: {
      available: true,
      defaultReadMode: "whole_state",
      scopedReadMode: "sql_where_before_jsonb_fetch",
      supportedScopes: ["platform", "restricted"],
    },
  };
}

export function assertPostgresRepositoryConfigured() {
  if (!process.env.DATABASE_URL) {
    throw new Error("APP_STATE_REPOSITORY=postgres requires DATABASE_URL.");
  }
  postgresSslMode();
}

export function buildPostgresBootstrapSql() {
  const statements = [];

  for (const collection of collections) {
    const table = quoteIdentifier(collection.productionTable);
    statements.push(`CREATE TABLE IF NOT EXISTS ${table} (
  record_id text PRIMARY KEY,
  organization_id text,
  user_id text,
  record jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
)`);
    statements.push(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${collection.productionTable}_organization_id_idx`)} ON ${table} (organization_id)`);
    statements.push(`CREATE INDEX IF NOT EXISTS ${quoteIdentifier(`${collection.productionTable}_user_id_idx`)} ON ${table} (user_id)`);
  }

  return `${statements.join(";\n\n")};`;
}

export async function readStateFromPostgresClient(client, options = {}) {
  await ensurePostgresSchema(client);
  const state = {};

  for (const collection of collections) {
    const query = buildPostgresSelectQuery(collection, options.tenantScope || options.postgresTenantScope);
    const result = await client.query(query.sql, query.params);
    state[collection.name] = (result.rows || []).map((row) => row.record);
  }

  return typeof options.normalize === "function" ? options.normalize(state) : state;
}

export async function readScopedStateFromPostgresClient(client, tenantScope, options = {}) {
  return readStateFromPostgresClient(client, {
    ...options,
    tenantScope,
  });
}

export function postgresPlatformTenantScope(reason = "platform_operator") {
  return {
    mode: "platform",
    reason,
    organizationIds: [],
    userIds: [],
  };
}

export function postgresRestrictedTenantScope(options = {}) {
  return {
    mode: "restricted",
    reason: cleanText(options.reason) || "tenant_scope",
    organizationIds: uniqueTextValues(options.organizationIds),
    userIds: uniqueTextValues(options.userIds),
  };
}

export async function writeStateToPostgresClient(client, state = {}) {
  await client.query("BEGIN");
  try {
    await ensurePostgresSchema(client);

    for (const collection of collections) {
      const records = Array.isArray(state[collection.name]) ? state[collection.name] : [];
      const table = quoteIdentifier(collection.productionTable);

      if (!collection.appendOnly) {
        await client.query(`DELETE FROM ${table}`);
      }

      for (const record of records) {
        const recordId = primaryKeyValue(record, collection.primaryKey);
        if (!recordId) {
          throw new Error(`Cannot persist ${collection.name}: missing primary key ${JSON.stringify(collection.primaryKey)}`);
        }

        await client.query(
          `INSERT INTO ${table} (record_id, organization_id, user_id, record, created_at, updated_at)
VALUES ($1, $2, $3, $4::jsonb, COALESCE($5::timestamptz, now()), now())
ON CONFLICT (record_id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  user_id = EXCLUDED.user_id,
  record = EXCLUDED.record,
  updated_at = now()`,
          [
            recordId,
            nullableString(record.organizationId),
            nullableString(userReferenceForRecord(record, collection.name)),
            JSON.stringify(record),
            nullableString(record.createdAt || record.updatedAt || record.generatedAt || record.assignedAt),
          ],
        );
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function patchStateToPostgresClient(client, patch = {}, options = {}) {
  await client.query("BEGIN");
  try {
    await ensurePostgresSchema(client);
    const currentState = options.currentState || await readStateFromPostgresClient(client, options);
    const result = options.nextState
      ? {
        state: options.nextState,
        summary: applyStatePatch(currentState, patch, options).summary,
      }
      : applyStatePatch(currentState, patch, options);
    const operations = normalizePatchOperations(patch);

    for (const operation of operations) {
      const collection = collectionDefinition(operation.collection);

      if (operation.type === "upsert") {
        const record = finalRecordForPatchOperation(operation, collection, result.state);
        await upsertRecordToPostgresClient(client, collection, record);
        continue;
      }

      if (operation.type === "append") {
        if (operation.dedupe && recordExistsForPatchOperation(operation, collection, currentState)) {
          continue;
        }

        const record = finalRecordForPatchOperation(operation, collection, result.state);
        await insertRecordToPostgresClient(client, collection, record);
        continue;
      }

      if (operation.type === "delete") {
        await deleteRecordFromPostgresClient(client, collection, operationKeyValue(operation.key, collection.primaryKey));
      }
    }

    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

export async function ensurePostgresSchema(client) {
  for (const statement of buildPostgresBootstrapSql().split(/;\s*/).map((item) => item.trim()).filter(Boolean)) {
    await client.query(statement);
  }
}

export function primaryKeyValue(record, primaryKey) {
  if (Array.isArray(primaryKey)) {
    const values = primaryKey.map((field) => record?.[field]);
    return values.every(hasValue) ? values.map(String).join(":") : "";
  }

  return hasValue(record?.[primaryKey]) ? String(record[primaryKey]) : "";
}

function upsertRecordToPostgresClient(client, collection, record) {
  const recordId = primaryKeyValue(record, collection.primaryKey);
  assertPrimaryKey(recordId, collection.name);
  const table = quoteIdentifier(collection.productionTable);

  return client.query(
    `INSERT INTO ${table} (record_id, organization_id, user_id, record, created_at, updated_at)
VALUES ($1, $2, $3, $4::jsonb, COALESCE($5::timestamptz, now()), now())
ON CONFLICT (record_id) DO UPDATE SET
  organization_id = EXCLUDED.organization_id,
  user_id = EXCLUDED.user_id,
  record = EXCLUDED.record,
  updated_at = now()`,
    postgresRecordParams(recordId, record, collection.name),
  );
}

function insertRecordToPostgresClient(client, collection, record) {
  const recordId = primaryKeyValue(record, collection.primaryKey);
  assertPrimaryKey(recordId, collection.name);
  const table = quoteIdentifier(collection.productionTable);

  return client.query(
    `INSERT INTO ${table} (record_id, organization_id, user_id, record, created_at, updated_at)
VALUES ($1, $2, $3, $4::jsonb, COALESCE($5::timestamptz, now()), now())`,
    postgresRecordParams(recordId, record, collection.name),
  );
}

function deleteRecordFromPostgresClient(client, collection, recordId) {
  assertPrimaryKey(recordId, collection.name);
  const table = quoteIdentifier(collection.productionTable);
  return client.query(`DELETE FROM ${table} WHERE record_id = $1`, [recordId]);
}

function postgresRecordParams(recordId, record, collectionName) {
  return [
    recordId,
    nullableString(record.organizationId),
    nullableString(userReferenceForRecord(record, collectionName)),
    JSON.stringify(record),
    nullableString(record.createdAt || record.updatedAt || record.generatedAt || record.assignedAt),
  ];
}

function normalizePatchOperations(patch = {}) {
  const operations = Array.isArray(patch)
    ? patch
    : Array.isArray(patch.operations)
      ? patch.operations
      : [];

  return operations.map((operation) => ({
    ...operation,
    type: normalizePatchOperationType(operation?.type),
    collection: cleanText(operation?.collection),
  }));
}

function normalizePatchOperationType(type) {
  const normalized = cleanText(type).toLowerCase();
  if (!patchOperationTypes.has(normalized)) {
    throw new Error(`Unsupported state patch operation: ${type || ""}`);
  }
  return normalized;
}

function collectionDefinition(collectionName) {
  const collection = collectionByName.get(cleanText(collectionName));
  if (!collection) {
    throw new Error(`Unknown state collection: ${collectionName || ""}`);
  }

  return collection;
}

function finalRecordForPatchOperation(operation, collection, state) {
  const key = operationRecordKey(operation, collection);
  const record = recordsFor(state, collection.name)
    .find((candidate) => primaryKeyValue(candidate, collection.primaryKey) === key);
  if (!record) {
    throw new Error(`Cannot ${operation.type} ${collection.name}: patched record '${key}' was not found.`);
  }

  return record;
}

function recordExistsForPatchOperation(operation, collection, state) {
  const key = operationRecordKey(operation, collection);
  return recordsFor(state, collection.name)
    .some((candidate) => primaryKeyValue(candidate, collection.primaryKey) === key);
}

function operationRecordKey(operation, collection) {
  const key = primaryKeyValue(operation.record, collection.primaryKey);
  assertPrimaryKey(key, collection.name);
  return key;
}

function operationKeyValue(key, primaryKey) {
  if (typeof key === "object" && key !== null) {
    return primaryKeyValue(key, primaryKey);
  }

  return hasValue(key) ? String(key) : "";
}

function recordsFor(state, collectionName) {
  const records = state?.[collectionName];
  return Array.isArray(records) ? records : [];
}

function assertPrimaryKey(recordId, collectionName) {
  if (!recordId) {
    throw new Error(`Cannot persist ${collectionName}: missing primary key.`);
  }
}

export function buildPostgresSelectQuery(collection, rawTenantScope = null) {
  const table = quoteIdentifier(collection.productionTable);
  const tenantScope = normalizeTenantScope(rawTenantScope);
  const baseSql = `SELECT record FROM ${table}`;
  const orderSql = "ORDER BY created_at ASC, record_id ASC";

  if (!tenantScope || tenantScope.mode === "platform") {
    return {
      sql: `${baseSql} ${orderSql}`,
      params: [],
      scopeMode: tenantScope?.mode || "whole_state",
    };
  }

  const params = [];
  const whereSql = tenantScopeWhereSql(collection, tenantScope, params);

  return {
    sql: `${baseSql} WHERE ${whereSql} ${orderSql}`,
    params,
    scopeMode: tenantScope.mode,
  };
}

async function withPostgresClient(action) {
  assertPostgresRepositoryConfigured();
  const pool = await postgresPool();
  const client = await pool.connect();
  try {
    return await action(client);
  } finally {
    client.release();
  }
}

async function postgresPool() {
  if (!poolPromise) {
    poolPromise = import(POSTGRES_DRIVER)
      .then(({ Pool }) => new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: postgresSslMode() === "require" ? { rejectUnauthorized: false } : undefined,
      }))
      .catch((error) => {
        poolPromise = null;
        throw new Error(`Postgres adapter requires the optional '${POSTGRES_DRIVER}' package. Run npm install pg before using APP_STATE_REPOSITORY=postgres. ${error.message}`);
      });
  }

  return poolPromise;
}

function postgresSslMode() {
  const mode = String(process.env.DATABASE_SSL_MODE || "disable").trim().toLowerCase();
  if (!POSTGRES_SSL_MODES.has(mode)) {
    throw new Error(`Unsupported DATABASE_SSL_MODE: ${mode}`);
  }
  return mode;
}

function quoteIdentifier(identifier) {
  if (!/^[a-z][a-z0-9_]*$/u.test(identifier)) {
    throw new Error(`Unsafe Postgres identifier: ${identifier}`);
  }
  return `"${identifier}"`;
}

function normalizeTenantScope(rawTenantScope) {
  if (!rawTenantScope) {
    return null;
  }

  const mode = cleanText(rawTenantScope.mode || "restricted").toLowerCase();
  if (["platform", "owner", "admin", "all"].includes(mode)) {
    return postgresPlatformTenantScope(rawTenantScope.reason || mode);
  }

  if (!["restricted", "tenant", "user"].includes(mode)) {
    throw new Error(`Unsupported Postgres tenant scope mode: ${mode}`);
  }

  return postgresRestrictedTenantScope(rawTenantScope);
}

function tenantScopeWhereSql(collection, tenantScope, params) {
  const organizationParam = textArrayParam(tenantScope.organizationIds, params);
  const userParam = textArrayParam(tenantScope.userIds, params);
  const conditions = [];

  if (collection.name === "organizations") {
    pushAnyCondition(conditions, "record_id", organizationParam);
  } else if (collection.name === "users") {
    pushAnyCondition(conditions, "record_id", userParam);
    pushAnyCondition(conditions, "organization_id", organizationParam);
  } else if (collection.name === "sessions") {
    pushAnyCondition(conditions, "user_id", userParam);
  } else if (collection.name === "advisorAssignments") {
    pushAnyCondition(conditions, "user_id", userParam);
    pushAnyCondition(conditions, "record->>'advisorId'", userParam);
    pushAnyCondition(conditions, "record->>'assignedBy'", userParam);
  } else if (collection.tenantScoped) {
    pushAnyCondition(conditions, "organization_id", organizationParam);
    pushAnyCondition(conditions, "user_id", userParam);
  } else {
    pushAnyCondition(conditions, "user_id", userParam);
  }

  return conditions.length ? `(${conditions.join(" OR ")})` : "FALSE";
}

function pushAnyCondition(conditions, columnSql, paramSql) {
  if (paramSql) {
    conditions.push(`${columnSql} = ANY(${paramSql}::text[])`);
  }
}

function textArrayParam(values, params) {
  const normalized = uniqueTextValues(values);
  if (!normalized.length) {
    return "";
  }

  params.push(normalized);
  return `$${params.length}`;
}

function uniqueTextValues(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => cleanText(value))
    .filter(Boolean))];
}

function cleanText(value) {
  return hasValue(value) ? String(value).trim() : "";
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

function nullableString(value) {
  return hasValue(value) ? String(value) : null;
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}
