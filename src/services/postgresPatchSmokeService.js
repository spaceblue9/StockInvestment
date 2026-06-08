import crypto from "node:crypto";
import { parseDatabaseUrl } from "./postgresBackupRunbookService.js";
import { patchAppState, readAppState } from "./stateRepository.js";

const AUDIT_HASH_VERSION = "sha256-v1";
const DEFAULT_CANARY_USER_ID = "staging-patch-smoke-user";
const DEFAULT_CANARY_ORGANIZATION_ID = "staging-patch-smoke-org";
const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL/u;
const stateCollections = [
  "users",
  "sessions",
  "organizations",
  "portfolioSnapshots",
  "investorProfiles",
  "billingEvents",
  "paymentSessions",
  "paymentWebhookEvents",
  "advisorAssignments",
  "approvalRequests",
  "auditEvents",
];

export async function runPostgresPatchSmoke(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const confirm = Boolean(options.confirm);
  const dryRun = options.dryRun === undefined ? !confirm : Boolean(options.dryRun);
  const adapter = stringValue(options.repositoryAdapter ?? env.APP_STATE_REPOSITORY ?? "local_file").toLowerCase();
  const databaseUrl = stringValue(options.databaseUrl ?? env.DATABASE_URL);
  const database = parseDatabaseUrl(databaseUrl);
  const sslMode = stringValue(options.sslMode ?? env.DATABASE_SSL_MODE ?? "disable").toLowerCase();
  const nodeEnv = stringValue(options.nodeEnv ?? env.NODE_ENV ?? "development").toLowerCase();
  const allowProduction = Boolean(options.allowProduction);
  const backupEvidence = stringValue(options.backupEvidence ?? env.POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE);
  const validationRunbookReady = Boolean(options.validationRunbookReady ?? truthy(env.POSTGRES_PATCH_VALIDATION_READY));
  const canary = canaryContext(options, env, generatedAt);
  const checks = smokeChecks({
    adapter,
    database,
    sslMode,
    nodeEnv,
    allowProduction,
    dryRun,
    confirm,
    canary,
    backupEvidence,
    validationRunbookReady,
  });
  const summary = summarizeChecks(checks);
  const blocked = summary.blockers > 0;
  let beforeCounts = null;
  let afterCounts = null;
  let patchSummary = null;
  let executed = false;
  let patch = buildCanaryPatch({
    canary,
    generatedAt,
    previousHash: options.previousAuditHash || "<previous-audit-hash>",
  });

  if (!dryRun && !blocked) {
    const stateReader = options.stateReader || readAppState;
    const patchWriter = options.patchWriter || patchAppState;
    const beforeState = await stateReader();
    beforeCounts = collectionCounts(beforeState);
    patch = buildCanaryPatch({
      canary,
      generatedAt,
      previousHash: lastAuditHash(beforeState),
    });
    const result = await patchWriter(patch, options.patchOptions || {});
    patchSummary = result.summary || null;
    const afterState = await stateReader();
    afterCounts = collectionCounts(afterState);
    executed = true;
  }

  const status = blocked ? "blocked" : executed ? "executed" : "dry_run";

  return {
    version: "stockflix-postgres-patch-smoke-v1",
    status,
    executed,
    dryRun,
    confirmRequired: !confirm,
    generatedAt,
    database,
    sanitizedEnvironment: sanitizedEnvironment({
      NODE_ENV: nodeEnv,
      APP_STATE_REPOSITORY: adapter,
      DATABASE_URL: databaseUrl,
      DATABASE_SSL_MODE: sslMode,
      POSTGRES_PATCH_VALIDATION_READY: validationRunbookReady,
      POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE: backupEvidence,
    }),
    canary,
    checks,
    summary,
    patch: {
      operationCount: patch.operations.length,
      operations: patch.operations.map(summarizeOperation),
    },
    evidence: {
      backupEvidence: backupEvidence || "(missing)",
      beforeCounts,
      afterCounts,
      patchSummary,
      rollbackReminder: "Use the verified staging restore point if any canary write behaves unexpectedly.",
    },
  };
}

export function renderPostgresPatchSmokeText(result) {
  const lines = [
    `Postgres Patch Smoke (${result.status})`,
    `Generated: ${result.generatedAt}`,
    `Executed: ${result.executed ? "yes" : "no"}`,
    `Database: ${result.database.safeUrl || "not configured"}`,
    `Canary user: ${result.canary.userId}`,
    `Canary organization: ${result.canary.organizationId}`,
    "",
    "Environment:",
    ...Object.entries(result.sanitizedEnvironment).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Checks:",
    ...result.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Patch Operations:",
    ...result.patch.operations.map((operation) => `- ${operation.type} ${operation.collection} ${operation.key}`),
    "",
    "Evidence:",
    `- backupEvidence: ${result.evidence.backupEvidence}`,
    `- beforeCounts: ${result.evidence.beforeCounts ? JSON.stringify(result.evidence.beforeCounts) : "(not executed)"}`,
    `- afterCounts: ${result.evidence.afterCounts ? JSON.stringify(result.evidence.afterCounts) : "(not executed)"}`,
    `- patchSummary: ${result.evidence.patchSummary ? JSON.stringify(result.evidence.patchSummary) : "(not executed)"}`,
    `- rollbackReminder: ${result.evidence.rollbackReminder}`,
  ];

  return `${lines.join("\n")}\n`;
}

export function buildCanaryPatch({ canary = {}, generatedAt = new Date().toISOString(), previousHash = "" } = {}) {
  const organization = {
    id: canary.organizationId || DEFAULT_CANARY_ORGANIZATION_ID,
    name: "Staging Patch Smoke Workspace",
    type: "customer",
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata: {
      stagingPatchSmoke: true,
    },
  };
  const user = {
    id: canary.userId || DEFAULT_CANARY_USER_ID,
    email: `${safeIdentifier(canary.userId || DEFAULT_CANARY_USER_ID)}@staging.invalid`,
    name: "Staging Patch Smoke User",
    role: "customer",
    organizationId: organization.id,
    subscription: {
      plan: "Pro",
      planId: "pro",
      status: "trialing",
      priceThb: 0,
      billing: "monthly",
      trialEndsAt: generatedAt,
      renewsAt: generatedAt,
    },
    createdAt: generatedAt,
    updatedAt: generatedAt,
    metadata: {
      stagingPatchSmoke: true,
    },
  };
  const session = {
    id: canary.sessionId || `${user.id}:patch-smoke-session`,
    userId: user.id,
    organizationId: organization.id,
    createdAt: generatedAt,
    expiresAt: generatedAt,
    metadata: {
      stagingPatchSmoke: true,
    },
  };
  const auditEvent = buildAuditEvent({
    id: canary.auditEventId || `audit_${safeIdentifier(user.id)}_${timestampToken(generatedAt)}`,
    action: "staging.patch_write_smoke",
    actorUserId: user.id,
    actorEmail: user.email,
    targetUserId: user.id,
    targetEmail: user.email,
    organizationId: organization.id,
    previousHash,
    details: {
      canary: true,
      sessionId: session.id,
      source: "postgres_patch_smoke",
    },
    createdAt: generatedAt,
  });

  return {
    operations: [
      { type: "upsert", collection: "organizations", record: organization },
      { type: "upsert", collection: "users", record: user },
      { type: "append", collection: "sessions", record: session },
      { type: "delete", collection: "sessions", key: session.id },
      { type: "append", collection: "auditEvents", record: auditEvent },
    ],
  };
}

function smokeChecks({ adapter, database, sslMode, nodeEnv, allowProduction, dryRun, confirm, canary, backupEvidence, validationRunbookReady }) {
  return [
    check(
      "repository_adapter",
      adapter === "postgres" ? "ok" : "blocker",
      adapter === "postgres"
        ? "APP_STATE_REPOSITORY is postgres."
        : "Set APP_STATE_REPOSITORY=postgres before executing patch smoke.",
    ),
    check(
      "database_url",
      database.configured && !database.invalid ? "ok" : "blocker",
      database.configured && !database.invalid
        ? `DATABASE_URL is configured for ${database.safeUrl}.`
        : "DATABASE_URL is missing or invalid.",
    ),
    check(
      "database_ssl_mode",
      sslMode === "require" ? "ok" : "warning",
      sslMode === "require"
        ? "DATABASE_SSL_MODE=require is configured."
        : "Use DATABASE_SSL_MODE=require for production-like smoke validation.",
    ),
    check(
      "confirm_guard",
      confirm ? "ok" : "warning",
      confirm
        ? "Confirm guard is present; write execution is allowed if no blocker remains."
        : "Dry-run only. Pass --confirm after reviewing output to execute canary writes.",
    ),
    check(
      "production_guard",
      nodeEnv === "production" && !allowProduction ? "blocker" : "ok",
      nodeEnv === "production" && !allowProduction
        ? "Refusing production execution without --allow-production; use staging first."
        : `NODE_ENV=${nodeEnv || "development"} is allowed for this smoke mode.`,
    ),
    check(
      "canary_scope",
      safeCanary(canary) ? "ok" : "blocker",
      safeCanary(canary)
        ? "Canary ids are staging-scoped."
        : "Use canary ids containing staging or canary so smoke writes cannot target real customers.",
    ),
    check(
      "validation_runbook",
      validationRunbookReady ? "ok" : dryRun ? "warning" : "blocker",
      validationRunbookReady
        ? "Postgres patch validation runbook evidence is marked ready."
        : "Run npm run postgres:patch-validation and set POSTGRES_PATCH_VALIDATION_READY=true before executing.",
    ),
    check(
      "backup_evidence",
      backupEvidence ? "ok" : dryRun ? "warning" : "blocker",
      backupEvidence
        ? "Backup/restore evidence id is attached."
        : "Attach POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE before executing canary writes.",
    ),
    check(
      "patch_operation_matrix",
      "ok",
      "Smoke patch covers organization/user upsert, session append/delete, and audit append.",
    ),
  ];
}

function canaryContext(options, env, generatedAt) {
  const userId = stringValue(options.canaryUserId ?? env.POSTGRES_PATCH_SMOKE_CANARY_USER_ID) || DEFAULT_CANARY_USER_ID;
  const organizationId = stringValue(options.canaryOrganizationId ?? env.POSTGRES_PATCH_SMOKE_CANARY_ORGANIZATION_ID) || DEFAULT_CANARY_ORGANIZATION_ID;
  return {
    userId,
    organizationId,
    sessionId: stringValue(options.canarySessionId ?? env.POSTGRES_PATCH_SMOKE_CANARY_SESSION_ID) || `${userId}:patch-smoke-session`,
    auditEventId: stringValue(options.canaryAuditEventId ?? env.POSTGRES_PATCH_SMOKE_CANARY_AUDIT_EVENT_ID) || `audit_${safeIdentifier(userId)}_${timestampToken(generatedAt)}`,
  };
}

function buildAuditEvent(event) {
  const auditEvent = {
    id: event.id,
    action: normalizeAuditAction(event.action),
    actorUserId: event.actorUserId || "",
    actorEmail: event.actorEmail || "",
    targetUserId: event.targetUserId || "",
    targetEmail: event.targetEmail || "",
    organizationId: event.organizationId || "",
    integrityVersion: AUDIT_HASH_VERSION,
    previousHash: event.previousHash || "",
    details: sanitizeAuditDetails(event.details || {}),
    createdAt: event.createdAt,
  };
  auditEvent.eventHash = hashAuditEvent(auditEvent);
  auditEvent.hashPreview = auditEvent.eventHash.slice(0, 12);
  return auditEvent;
}

function hashAuditEvent(event) {
  const payload = {
    id: event.id || "",
    action: normalizeAuditAction(event.action),
    actorUserId: event.actorUserId || "",
    actorEmail: event.actorEmail || "",
    targetUserId: event.targetUserId || "",
    targetEmail: event.targetEmail || "",
    organizationId: event.organizationId || "",
    integrityVersion: event.integrityVersion || AUDIT_HASH_VERSION,
    previousHash: event.previousHash || "",
    details: sanitizeAuditDetails(event.details || {}),
    createdAt: event.createdAt || "",
  };

  return crypto.createHash("sha256").update(stableStringify(payload)).digest("hex");
}

function lastAuditHash(state = {}) {
  const auditEvents = Array.isArray(state.auditEvents) ? state.auditEvents : [];
  return auditEvents.at(-1)?.eventHash || "";
}

function collectionCounts(state = {}) {
  return Object.fromEntries(stateCollections.map((collection) => [
    collection,
    Array.isArray(state[collection]) ? state[collection].length : 0,
  ]));
}

function summarizeOperation(operation) {
  const record = operation.record || {};
  const key = operation.key || record.id || record.userId || "";
  return {
    type: operation.type,
    collection: operation.collection,
    key: String(key),
  };
}

function summarizeChecks(checks) {
  return {
    blockers: checks.filter((check) => check.severity === "blocker").length,
    warnings: checks.filter((check) => check.severity === "warning").length,
    ok: checks.filter((check) => check.severity === "ok").length,
    totalChecks: checks.length,
  };
}

function sanitizedEnvironment(env) {
  return Object.fromEntries(Object.entries(env).map(([key, value]) => [key, safeValue(key, value)]));
}

function safeValue(key, value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  const text = stringValue(value);
  if (!text) {
    return "(missing)";
  }

  if (key === "DATABASE_URL") {
    return parseDatabaseUrl(text).safeUrl || "(invalid)";
  }

  if (SECRET_PATTERN.test(key)) {
    return "****";
  }

  return text;
}

function safeCanary(canary) {
  return [canary.userId, canary.organizationId, canary.sessionId, canary.auditEventId]
    .every((value) => /staging|canary/u.test(stringValue(value).toLowerCase()));
}

function check(id, severity, message) {
  return { id, severity, message };
}

function normalizeAuditAction(action) {
  return stringValue(action || "system.event").toLowerCase().replace(/[^a-z0-9_.-]+/gu, "_").slice(0, 80);
}

function sanitizeAuditDetails(details) {
  if (!details || typeof details !== "object" || Array.isArray(details)) {
    return {};
  }

  return Object.fromEntries(Object.entries(details)
    .filter(([key]) => !/password|secret|token|cookie|hash/iu.test(key))
    .slice(0, 20)
    .map(([key, value]) => [
      String(key).replace(/[^a-zA-Z0-9_.-]+/gu, "_").slice(0, 60),
      sanitizeAuditValue(value),
    ]));
}

function sanitizeAuditValue(value) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.slice(0, 8).map(sanitizeAuditValue);
  }

  if (typeof value === "object") {
    return Object.fromEntries(Object.entries(value)
      .filter(([key]) => !/password|secret|token|cookie|hash/iu.test(key))
      .slice(0, 8)
      .map(([key, nestedValue]) => [
        String(key).replace(/[^a-zA-Z0-9_.-]+/gu, "_").slice(0, 60),
        sanitizeAuditValue(nestedValue),
      ]));
  }

  return String(value).slice(0, 160);
}

function stableStringify(value) {
  if (value === null || value === undefined) {
    return "null";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  return `{${Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`)
    .join(",")}}`;
}

function safeIdentifier(value) {
  return stringValue(value).toLowerCase().replace(/[^a-z0-9_.:-]+/gu, "-").slice(0, 80) || "staging-patch-smoke";
}

function timestampToken(value) {
  return stringValue(value).replace(/[^0-9a-zA-Z]+/gu, "").slice(0, 24) || "now";
}

function truthy(value) {
  return /^(1|true|yes|y|ready|done|ok)$/u.test(stringValue(value).toLowerCase());
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
