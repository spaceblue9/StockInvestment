import { stateCollectionDefinitions } from "./stateSchemaService.js";

const COLLECTIONS = stateCollectionDefinitions();
const COLLECTION_BY_NAME = new Map(COLLECTIONS.map((collection) => [collection.name, collection]));
const OPERATIONS = new Set(["upsert", "append", "delete"]);

export function applyStatePatch(state = {}, patch = {}, options = {}) {
  const operations = normalizeOperations(patch);
  const nextState = cloneState(state);
  const summary = {
    operationCount: operations.length,
    upserted: 0,
    appended: 0,
    deleted: 0,
    unchanged: 0,
    collections: {},
  };

  for (const operation of operations) {
    applyOperation(nextState, operation, summary, options);
  }

  return {
    state: nextState,
    summary,
  };
}

export function statePatchCapabilities() {
  return {
    supportedOperations: [...OPERATIONS],
    collections: COLLECTIONS.map((collection) => ({
      name: collection.name,
      primaryKey: collection.primaryKey,
      appendOnly: collection.appendOnly,
      tenantScoped: collection.tenantScoped,
    })),
    appendOnlyGuard: true,
    localFileMode: "read_current_apply_patch_write_file",
    productionTarget: "collection_level_dml",
  };
}

function applyOperation(state, operation, summary, options) {
  const type = normalizeOperationType(operation.type);
  const collection = collectionDefinition(operation.collection);
  const collectionSummary = summary.collections[collection.name] ||= {
    upserted: 0,
    appended: 0,
    deleted: 0,
    unchanged: 0,
  };
  state[collection.name] = recordsFor(state, collection.name);

  if (type === "upsert") {
    assertWritableAppendOnly(collection, operation, "upsert");
    const record = cloneRecord(operation.record);
    const key = primaryKeyValue(record, collection.primaryKey);
    assertKey(key, collection.name, "upsert");
    const index = state[collection.name].findIndex((candidate) => primaryKeyValue(candidate, collection.primaryKey) === key);
    const nextRecord = operation.merge === false || index < 0
      ? record
      : {
        ...state[collection.name][index],
        ...record,
      };

    if (index >= 0) {
      state[collection.name][index] = nextRecord;
    } else {
      state[collection.name].push(nextRecord);
    }

    summary.upserted += 1;
    collectionSummary.upserted += 1;
    return;
  }

  if (type === "append") {
    const record = cloneRecord(operation.record);
    const key = primaryKeyValue(record, collection.primaryKey);
    assertKey(key, collection.name, "append");
    const duplicate = state[collection.name].some((candidate) => primaryKeyValue(candidate, collection.primaryKey) === key);

    if (duplicate && operation.dedupe) {
      summary.unchanged += 1;
      collectionSummary.unchanged += 1;
      return;
    }

    if (duplicate) {
      throw new Error(`Cannot append duplicate record '${key}' to ${collection.name}.`);
    }

    state[collection.name].push(record);
    summary.appended += 1;
    collectionSummary.appended += 1;
    return;
  }

  if (type === "delete") {
    if (collection.appendOnly && !operation.allowAppendOnlyDelete && !options.allowAppendOnlyDelete) {
      throw new Error(`Cannot delete from append-only collection ${collection.name} without allowAppendOnlyDelete.`);
    }

    const key = operationKeyValue(operation.key, collection.primaryKey);
    assertKey(key, collection.name, "delete");
    const before = state[collection.name].length;
    state[collection.name] = state[collection.name].filter((record) => primaryKeyValue(record, collection.primaryKey) !== key);
    const deleted = before - state[collection.name].length;

    summary.deleted += deleted;
    collectionSummary.deleted += deleted;
    if (!deleted) {
      summary.unchanged += 1;
      collectionSummary.unchanged += 1;
    }
  }
}

function normalizeOperations(patch = {}) {
  const operations = Array.isArray(patch)
    ? patch
    : Array.isArray(patch.operations)
      ? patch.operations
      : [];

  return operations.map((operation) => ({
    ...operation,
    type: normalizeOperationType(operation?.type),
    collection: cleanText(operation?.collection),
  }));
}

function normalizeOperationType(type) {
  const normalized = cleanText(type).toLowerCase();
  if (!OPERATIONS.has(normalized)) {
    throw new Error(`Unsupported state patch operation: ${type || ""}`);
  }
  return normalized;
}

function collectionDefinition(collectionName) {
  const collection = COLLECTION_BY_NAME.get(cleanText(collectionName));
  if (!collection) {
    throw new Error(`Unknown state collection: ${collectionName || ""}`);
  }
  return collection;
}

function assertWritableAppendOnly(collection, operation, verb) {
  if (collection.appendOnly && !operation.allowAppendOnlyUpsert) {
    throw new Error(`Cannot ${verb} append-only collection ${collection.name}; use append instead.`);
  }
}

function recordsFor(state, collectionName) {
  return Array.isArray(state[collectionName]) ? [...state[collectionName]] : [];
}

function cloneState(state) {
  const cloned = cloneRecord(state || {});
  for (const collection of COLLECTIONS) {
    cloned[collection.name] = recordsFor(cloned, collection.name);
  }
  return cloned;
}

function cloneRecord(record) {
  return JSON.parse(JSON.stringify(record || {}));
}

function primaryKeyValue(record, primaryKey) {
  if (Array.isArray(primaryKey)) {
    const values = primaryKey.map((field) => record?.[field]);
    return values.every(hasValue) ? values.map(String).join(":") : "";
  }

  return hasValue(record?.[primaryKey]) ? String(record[primaryKey]) : "";
}

function operationKeyValue(key, primaryKey) {
  if (typeof key === "object" && key !== null) {
    return primaryKeyValue(key, primaryKey);
  }

  return hasValue(key) ? String(key) : "";
}

function assertKey(key, collectionName, verb) {
  if (!key) {
    throw new Error(`Cannot ${verb} ${collectionName}: missing primary key.`);
  }
}

function cleanText(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}
