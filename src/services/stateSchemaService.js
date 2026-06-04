export const STATE_SCHEMA_VERSION = "2026-06-04.storage-v1";

const STATE_COLLECTIONS = [
  {
    name: "users",
    primaryKey: "id",
    requiredFields: ["id", "email", "role", "organizationId", "createdAt"],
    tenantScoped: true,
    uniqueFields: ["email"],
    references: [
      { field: "organizationId", collection: "organizations" },
    ],
    productionTable: "users",
  },
  {
    name: "sessions",
    primaryKey: "id",
    requiredFields: ["id", "userId", "createdAt", "expiresAt"],
    tenantScoped: false,
    references: [
      { field: "userId", collection: "users" },
    ],
    productionTable: "user_sessions",
  },
  {
    name: "organizations",
    primaryKey: "id",
    requiredFields: ["id", "name", "type", "createdAt", "updatedAt"],
    tenantScoped: false,
    references: [
      { field: "ownerUserId", collection: "users", optional: true },
    ],
    productionTable: "organizations",
  },
  {
    name: "portfolioSnapshots",
    primaryKey: "userId",
    requiredFields: ["userId", "organizationId", "generatedAt"],
    tenantScoped: true,
    references: [
      { field: "userId", collection: "users" },
      { field: "organizationId", collection: "organizations" },
    ],
    productionTable: "portfolio_snapshots",
  },
  {
    name: "investorProfiles",
    primaryKey: "userId",
    requiredFields: ["userId", "organizationId", "goal", "experience", "riskLevel", "updatedAt"],
    tenantScoped: true,
    references: [
      { field: "userId", collection: "users" },
      { field: "organizationId", collection: "organizations" },
    ],
    productionTable: "investor_profiles",
  },
  {
    name: "billingEvents",
    primaryKey: "id",
    requiredFields: ["id", "userId", "organizationId", "invoiceNumber", "planId", "amountThb", "status", "createdAt"],
    tenantScoped: true,
    uniqueFields: ["invoiceNumber"],
    references: [
      { field: "userId", collection: "users" },
      { field: "organizationId", collection: "organizations" },
      { field: "paymentSessionId", collection: "paymentSessions", optional: true },
    ],
    productionTable: "billing_events",
  },
  {
    name: "paymentSessions",
    primaryKey: "id",
    requiredFields: ["id", "userId", "organizationId", "planId", "amountThb", "status", "createdAt"],
    tenantScoped: true,
    references: [
      { field: "userId", collection: "users" },
      { field: "organizationId", collection: "organizations" },
    ],
    productionTable: "payment_sessions",
  },
  {
    name: "paymentWebhookEvents",
    primaryKey: "id",
    requiredFields: ["id", "providerEventId", "sessionId", "organizationId", "eventType", "status", "createdAt"],
    tenantScoped: true,
    uniqueFields: ["providerEventId"],
    references: [
      { field: "userId", collection: "users", optional: true },
      { field: "organizationId", collection: "organizations" },
      {
        field: "sessionId",
        collection: "paymentSessions",
        optional: true,
        allowMissingWhen: (record) => record.status === "rejected" && record.verificationStatus === "invalid_session",
      },
    ],
    productionTable: "payment_webhook_events",
  },
  {
    name: "advisorAssignments",
    primaryKey: ["customerId", "advisorId"],
    requiredFields: ["customerId", "advisorId", "assignedBy", "assignedAt"],
    tenantScoped: false,
    references: [
      { field: "customerId", collection: "users" },
      { field: "advisorId", collection: "users" },
      { field: "assignedBy", collection: "users" },
    ],
    productionTable: "advisor_assignments",
  },
  {
    name: "auditEvents",
    primaryKey: "id",
    requiredFields: ["id", "action", "organizationId", "integrityVersion", "eventHash", "createdAt"],
    tenantScoped: true,
    references: [
      { field: "actorUserId", collection: "users", optional: true },
      { field: "targetUserId", collection: "users", optional: true },
      { field: "organizationId", collection: "organizations" },
    ],
    productionTable: "audit_events",
    appendOnly: true,
  },
];

export function stateSchemaManifest() {
  return {
    version: STATE_SCHEMA_VERSION,
    storageEngine: "local_file",
    productionTarget: "relational_database",
    collections: STATE_COLLECTIONS.map((collection) => ({
      name: collection.name,
      primaryKey: collection.primaryKey,
      requiredFields: collection.requiredFields,
      tenantScoped: collection.tenantScoped,
      uniqueFields: collection.uniqueFields || [],
      references: (collection.references || []).map((reference) => ({
        field: reference.field,
        collection: reference.collection,
        optional: Boolean(reference.optional),
        conditionalMissingAllowed: Boolean(reference.allowMissingWhen),
      })),
      productionTable: collection.productionTable,
      appendOnly: Boolean(collection.appendOnly),
    })),
  };
}

export function buildStorageReadinessReport(state = {}) {
  const collectionMaps = collectionPrimaryKeyMaps(state);
  const collectionReports = {};
  const issues = [];
  let totalRecords = 0;

  for (const collection of STATE_COLLECTIONS) {
    const records = recordsFor(state, collection.name);
    totalRecords += records.length;
    const report = {
      collection: collection.name,
      productionTable: collection.productionTable,
      records: records.length,
      primaryKey: collection.primaryKey,
      tenantScoped: collection.tenantScoped,
      missingPrimaryKeys: [],
      duplicatePrimaryKeys: [],
      duplicateUniqueFields: [],
      missingRequiredFields: [],
      missingOrganizationId: [],
      danglingReferences: [],
      status: "ready",
    };
    const seenPrimaryKeys = new Map();

    records.forEach((record, index) => {
      const primaryKey = primaryKeyValue(record, collection.primaryKey);
      if (!primaryKey) {
        report.missingPrimaryKeys.push({ index });
      } else if (seenPrimaryKeys.has(primaryKey)) {
        report.duplicatePrimaryKeys.push({
          key: primaryKey,
          firstIndex: seenPrimaryKeys.get(primaryKey),
          duplicateIndex: index,
        });
      } else {
        seenPrimaryKeys.set(primaryKey, index);
      }

      for (const field of collection.requiredFields || []) {
        if (!hasValue(record[field])) {
          report.missingRequiredFields.push({ index, field });
        }
      }

      if (collection.tenantScoped && !hasValue(record.organizationId)) {
        report.missingOrganizationId.push({ index });
      }

      for (const reference of collection.references || []) {
        const value = record[reference.field];
        if (!hasValue(value)) {
          if (!reference.optional) {
            report.danglingReferences.push({
              index,
              field: reference.field,
              targetCollection: reference.collection,
              value: "",
              reason: "missing_required_reference",
            });
          }
          continue;
        }

        const targetMap = collectionMaps[reference.collection] || new Map();
        if (!targetMap.has(String(value)) && !reference.allowMissingWhen?.(record)) {
          report.danglingReferences.push({
            index,
            field: reference.field,
            targetCollection: reference.collection,
            value: String(value),
            reason: "target_not_found",
          });
        }
      }
    });

    for (const field of collection.uniqueFields || []) {
      const seenValues = new Map();
      records.forEach((record, index) => {
        const value = normalizeUniqueValue(record[field]);
        if (!value) {
          return;
        }
        if (seenValues.has(value)) {
          report.duplicateUniqueFields.push({
            field,
            value,
            firstIndex: seenValues.get(value),
            duplicateIndex: index,
          });
        } else {
          seenValues.set(value, index);
        }
      });
    }

    const blockerCount = report.missingPrimaryKeys.length
      + report.duplicatePrimaryKeys.length
      + report.duplicateUniqueFields.length
      + report.missingRequiredFields.length
      + report.danglingReferences.length;
    const warningCount = report.missingOrganizationId.length;
    report.status = blockerCount > 0 ? "blocked" : warningCount > 0 ? "review" : "ready";
    collectionReports[collection.name] = report;

    pushIssue(issues, collection.name, "blocker", "missing_primary_key", report.missingPrimaryKeys.length);
    pushIssue(issues, collection.name, "blocker", "duplicate_primary_key", report.duplicatePrimaryKeys.length);
    pushIssue(issues, collection.name, "blocker", "duplicate_unique_field", report.duplicateUniqueFields.length);
    pushIssue(issues, collection.name, "blocker", "missing_required_field", report.missingRequiredFields.length);
    pushIssue(issues, collection.name, "blocker", "dangling_reference", report.danglingReferences.length);
    pushIssue(issues, collection.name, "warning", "missing_organization_id", report.missingOrganizationId.length);
  }

  const blockerCount = issues
    .filter((issue) => issue.severity === "blocker")
    .reduce((total, issue) => total + issue.count, 0);
  const warningCount = issues
    .filter((issue) => issue.severity === "warning")
    .reduce((total, issue) => total + issue.count, 0);

  return {
    schemaVersion: STATE_SCHEMA_VERSION,
    status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "review" : "ready",
    storageEngine: "local_file",
    productionDatabaseRequired: true,
    collectionCount: STATE_COLLECTIONS.length,
    totalRecords,
    blockerCount,
    warningCount,
    issues,
    collectionReports,
  };
}

function collectionPrimaryKeyMaps(state) {
  return Object.fromEntries(STATE_COLLECTIONS.map((collection) => {
    const records = recordsFor(state, collection.name);
    const entries = records
      .map((record) => [primaryKeyValue(record, collection.primaryKey), record])
      .filter(([key]) => hasValue(key))
      .map(([key, record]) => [String(key), record]);
    return [collection.name, new Map(entries)];
  }));
}

function recordsFor(state, collectionName) {
  const records = state?.[collectionName];
  return Array.isArray(records) ? records : [];
}

function primaryKeyValue(record, primaryKey) {
  if (Array.isArray(primaryKey)) {
    const values = primaryKey.map((field) => record?.[field]);
    return values.every(hasValue) ? values.map(String).join(":") : "";
  }

  return hasValue(record?.[primaryKey]) ? String(record[primaryKey]) : "";
}

function normalizeUniqueValue(value) {
  return hasValue(value) ? String(value).trim().toLowerCase() : "";
}

function hasValue(value) {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function pushIssue(issues, collection, severity, type, count) {
  if (count <= 0) {
    return;
  }

  issues.push({
    collection,
    severity,
    type,
    count,
  });
}
