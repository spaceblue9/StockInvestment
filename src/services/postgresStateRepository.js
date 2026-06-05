import { stateCollectionDefinitions } from "./stateSchemaService.js";

const POSTGRES_DRIVER = "pg";
const POSTGRES_SSL_MODES = new Set(["disable", "require"]);
const collections = stateCollectionDefinitions();

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
