import { parseDatabaseUrl } from "./postgresBackupRunbookService.js";

const REQUIRED_STRIPE_ENV = [
  "PAYMENT_GATEWAY_STRIPE_SECRET_KEY",
  "PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET",
  "PAYMENT_GATEWAY_STRIPE_SUCCESS_URL",
  "PAYMENT_GATEWAY_STRIPE_CANCEL_URL",
  "PAYMENT_GATEWAY_STRIPE_PRICE_STARTER",
  "PAYMENT_GATEWAY_STRIPE_PRICE_PRO",
  "PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR",
];
const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL/u;
const DEFAULT_PAYMENT_WEBHOOK_SECRET = "stockflix-local-webhook-secret";
const ADVISOR_CATEGORY_ORDER = ["environment", "database", "payment", "audit", "backup", "quality"];
const ADVISOR_CATEGORY_LABELS = {
  environment: "Hosting environment",
  database: "Production database",
  payment: "Payment gateway",
  audit: "Audit retention",
  backup: "Backup and restore",
  quality: "Quality gate",
};
const CHECK_CATEGORY = {
  node_env: "environment",
  port: "environment",
  state_repository: "database",
  database_url: "database",
  database_ssl_mode: "database",
  payment_gateway_provider: "payment",
  stripe_configuration: "payment",
  local_gateway_webhook_secret: "payment",
  external_audit_provider: "audit",
  external_audit_required: "audit",
  external_audit_config: "audit",
  postgres_backup_strategy: "backup",
  postgres_backup_retention: "backup",
  ci_quality: "quality",
  ops_readiness: "quality",
  python_parity: "quality",
};

export function buildProductionDeploymentChecklist(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const checks = [
    ...environmentChecks(env),
    ...databaseChecks(env),
    ...paymentChecks(env),
    ...auditChecks(env),
    ...backupChecks(env),
    ...qualityChecks(env),
  ];
  const blockerCount = checks.filter((check) => check.severity === "blocker").length;
  const warningCount = checks.filter((check) => check.severity === "warning").length;
  const status = blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready";

  return {
    version: "stockflix-production-deployment-checklist-v1",
    status,
    generatedAt,
    summary: {
      blockers: blockerCount,
      warnings: warningCount,
      ok: checks.filter((check) => check.severity === "ok").length,
      totalChecks: checks.length,
    },
    checks,
    sanitizedEnvironment: sanitizedEnvironment(env),
    preflightCommands: [
      "npm run ci:quality",
      "npm run postgres:backup-runbook -- --strategy both --format text --strict",
      "npm run import:postgres -- --dry-run",
      "npm run postgres:patch-validation -- --format text --strict",
      "npm run postgres:patch-smoke -- --format text --strict",
      "GET /api/ops/readiness as owner/admin after staging deploy",
      "npm run ops:alerts -- --dry-run --format text",
    ],
    releaseChecklist: [
      "Run CI quality gate and keep the report attached to the release record.",
      "Run the Postgres backup runbook and verify managed snapshot or pg_dump restore drill in staging.",
      "Run importer dry-run and fix storage readiness blockers before real import.",
      "Verify Stripe Checkout success/cancel URLs and provider webhook endpoint in staging.",
      "Verify external audit provider delivery and receipts if required.",
      "Open Business dashboard and confirm Ops Readiness has no critical alerts.",
      "Record deployment time, operator, commit SHA, environment, and rollback plan.",
    ],
    rollbackChecklist: [
      "Stop the release or route traffic back to the previous deployment.",
      "Capture GET /api/ops/readiness output before changing data.",
      "Use the latest verified managed snapshot or pg_dump artifact in staging first.",
      "Communicate RPO/RTO expectations and customer impact before production restore.",
    ],
  };
}

export function renderProductionDeploymentChecklistText(checklist) {
  const lines = [
    `Production Deployment Checklist (${checklist.status})`,
    `Generated: ${checklist.generatedAt}`,
    `Checks: ${checklist.summary.ok} ok, ${checklist.summary.warnings} warnings, ${checklist.summary.blockers} blockers`,
    "",
    "Environment:",
    ...Object.entries(checklist.sanitizedEnvironment).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Checks:",
    ...checklist.checks.map((check) => `- [${check.severity}] ${check.id}: ${check.message}`),
    "",
    "Preflight Commands:",
    ...checklist.preflightCommands.map((command) => `- ${command}`),
    "",
    "Release Checklist:",
    ...checklist.releaseChecklist.map((item) => `- ${item}`),
    "",
    "Rollback Checklist:",
    ...checklist.rollbackChecklist.map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

export function buildProductionEnvironmentAdvisor(options = {}) {
  const checklist = options.checklist || buildProductionDeploymentChecklist(options);
  const blockers = checklist.checks.filter((check) => check.severity === "blocker").map(advisorCheck);
  const warnings = checklist.checks.filter((check) => check.severity === "warning").map(advisorCheck);
  const nextCheck = blockers[0] || warnings[0] || null;

  return {
    version: "stockflix-production-environment-advisor-v1",
    generatedAt: checklist.generatedAt,
    status: checklist.status,
    productionReady: checklist.status === "ready",
    healthLabel: productionHealthLabel(checklist.status),
    plainLanguageSummary: productionPlainLanguageSummary(checklist.status, checklist.summary),
    nextAction: nextCheck
      ? `${nextCheck.severity === "blocker" ? "Fix blocker" : "Review warning"}: ${nextCheck.message}`
      : "Production environment is ready. Keep CI, backup, monitoring, and rollback evidence attached to the release.",
    summary: checklist.summary,
    blockers,
    warnings,
    groups: buildAdvisorGroups(checklist.checks),
    commands: ["npm run deployment:check -- --format text --strict", ...checklist.preflightCommands],
    releaseChecklist: checklist.releaseChecklist,
    rollbackChecklist: checklist.rollbackChecklist,
    sanitizedEnvironment: checklist.sanitizedEnvironment,
  };
}

function environmentChecks(env) {
  return [
    check(
      "node_env",
      stringValue(env.NODE_ENV) === "production" ? "ok" : "warning",
      stringValue(env.NODE_ENV) === "production"
        ? "NODE_ENV is set to production."
        : "Set NODE_ENV=production before deploying paid subscription traffic.",
    ),
    check(
      "port",
      stringValue(env.PORT) ? "ok" : "warning",
      stringValue(env.PORT)
        ? `PORT is configured as ${stringValue(env.PORT)}.`
        : "PORT is not configured; platform default may still work, but declare it in deployment config.",
    ),
  ];
}

function databaseChecks(env) {
  const database = parseDatabaseUrl(env.DATABASE_URL || "");
  const adapter = stringValue(env.APP_STATE_REPOSITORY || "local_file").toLowerCase();
  const sslMode = stringValue(env.DATABASE_SSL_MODE || "disable").toLowerCase();

  return [
    check(
      "state_repository",
      adapter === "postgres" ? "ok" : "blocker",
      adapter === "postgres"
        ? "APP_STATE_REPOSITORY is postgres."
        : "Set APP_STATE_REPOSITORY=postgres before production launch.",
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
        : "Set DATABASE_SSL_MODE=require unless the managed database explicitly terminates TLS elsewhere.",
    ),
  ];
}

function paymentChecks(env) {
  const provider = normalizePaymentProvider(env.PAYMENT_GATEWAY_PROVIDER);
  const missingStripe = REQUIRED_STRIPE_ENV.filter((name) => !stringValue(env[name]));
  return [
    check(
      "payment_gateway_provider",
      provider === "stripe_checkout" ? "ok" : "blocker",
      provider === "stripe_checkout"
        ? "Stripe Checkout provider is selected."
        : "Set PAYMENT_GATEWAY_PROVIDER=stripe_checkout before charging real customers.",
    ),
    check(
      "stripe_configuration",
      missingStripe.length === 0 ? "ok" : "blocker",
      missingStripe.length === 0
        ? "Stripe Checkout secret, webhook secret, URLs, and plan price ids are configured."
        : `Stripe Checkout configuration is missing: ${missingStripe.join(", ")}.`,
    ),
    check(
      "local_gateway_webhook_secret",
      strongSecret(env.PAYMENT_WEBHOOK_SECRET) ? "ok" : "warning",
      strongSecret(env.PAYMENT_WEBHOOK_SECRET)
        ? "PAYMENT_WEBHOOK_SECRET is configured for signed local-gateway compatibility."
        : "Set PAYMENT_WEBHOOK_SECRET to a production secret even if Stripe is the primary provider.",
    ),
  ];
}

function auditChecks(env) {
  const provider = stringValue(env.AUDIT_TRAIL_EXTERNAL_PROVIDER || "disabled").toLowerCase();
  const required = stringValue(env.AUDIT_TRAIL_EXTERNAL_REQUIRED).toLowerCase() === "true";
  return [
    check(
      "external_audit_provider",
      provider === "http_webhook" ? "ok" : "warning",
      provider === "http_webhook"
        ? "External audit provider is enabled."
        : "External audit provider is disabled; enable it when immutable audit retention is required.",
    ),
    check(
      "external_audit_required",
      required ? "ok" : "warning",
      required
        ? "AUDIT_TRAIL_EXTERNAL_REQUIRED=true is configured."
        : "Set AUDIT_TRAIL_EXTERNAL_REQUIRED=true for fail-closed audit delivery in production.",
    ),
    check(
      "external_audit_config",
      stringValue(env.AUDIT_TRAIL_HTTP_URL) && strongSecret(env.AUDIT_TRAIL_HTTP_SECRET) ? "ok" : "warning",
      stringValue(env.AUDIT_TRAIL_HTTP_URL) && strongSecret(env.AUDIT_TRAIL_HTTP_SECRET)
        ? "External audit URL and secret are configured."
        : "Configure AUDIT_TRAIL_HTTP_URL and AUDIT_TRAIL_HTTP_SECRET before requiring external audit delivery.",
    ),
  ];
}

function backupChecks(env) {
  const strategy = stringValue(env.POSTGRES_BACKUP_STRATEGY || "both").toLowerCase();
  const retentionDays = Number(env.POSTGRES_BACKUP_RETENTION_DAYS || 30);
  return [
    check(
      "postgres_backup_strategy",
      ["managed_snapshot", "pg_dump", "both"].includes(strategy) ? "ok" : "blocker",
      ["managed_snapshot", "pg_dump", "both"].includes(strategy)
        ? `Postgres backup strategy is ${strategy}.`
        : "Set POSTGRES_BACKUP_STRATEGY to managed_snapshot, pg_dump, or both.",
    ),
    check(
      "postgres_backup_retention",
      Number.isFinite(retentionDays) && retentionDays >= 30 ? "ok" : "warning",
      Number.isFinite(retentionDays) && retentionDays >= 30
        ? `Postgres backup retention is ${retentionDays} days.`
        : "Set POSTGRES_BACKUP_RETENTION_DAYS to at least 30 for production planning.",
    ),
  ];
}

function qualityChecks() {
  return [
    check("ci_quality", "ok", "Run npm run ci:quality before every production deployment."),
    check("ops_readiness", "ok", "Check GET /api/ops/readiness after staging deployment."),
    check("python_parity", "ok", "npm run test-regression includes compare:python to protect legacy output parity."),
  ];
}

function sanitizedEnvironment(env) {
  const keys = [
    "NODE_ENV",
    "PORT",
    "APP_STATE_REPOSITORY",
    "DATABASE_URL",
    "DATABASE_SSL_MODE",
    "PAYMENT_GATEWAY_PROVIDER",
    "PAYMENT_GATEWAY_STRIPE_SUCCESS_URL",
    "PAYMENT_GATEWAY_STRIPE_CANCEL_URL",
    "PAYMENT_GATEWAY_STRIPE_PRICE_STARTER",
    "PAYMENT_GATEWAY_STRIPE_PRICE_PRO",
    "PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR",
    "PAYMENT_WEBHOOK_SECRET",
    "AUDIT_TRAIL_EXTERNAL_PROVIDER",
    "AUDIT_TRAIL_HTTP_URL",
    "AUDIT_TRAIL_EXTERNAL_REQUIRED",
    "POSTGRES_BACKUP_STRATEGY",
    "POSTGRES_BACKUP_RETENTION_DAYS",
  ];

  return Object.fromEntries(keys.map((key) => [key, safeValue(key, env[key])]));
}

function check(id, severity, message) {
  return { id, severity, message };
}

function buildAdvisorGroups(checks) {
  const grouped = new Map(ADVISOR_CATEGORY_ORDER.map((category) => [category, []]));
  for (const checkItem of checks) {
    const category = CHECK_CATEGORY[checkItem.id] || "quality";
    if (!grouped.has(category)) {
      grouped.set(category, []);
    }
    grouped.get(category).push(checkItem);
  }

  return Array.from(grouped.entries())
    .filter(([, groupChecks]) => groupChecks.length)
    .map(([category, groupChecks]) => {
      const blockerCount = groupChecks.filter((item) => item.severity === "blocker").length;
      const warningCount = groupChecks.filter((item) => item.severity === "warning").length;
      return {
        id: category,
        label: ADVISOR_CATEGORY_LABELS[category] || category,
        status: blockerCount > 0 ? "blocked" : warningCount > 0 ? "needs_review" : "ready",
        blockerCount,
        warningCount,
        okCount: groupChecks.filter((item) => item.severity === "ok").length,
        checks: groupChecks.map(advisorCheck),
      };
    });
}

function advisorCheck(checkItem) {
  return {
    id: checkItem.id,
    severity: checkItem.severity,
    message: checkItem.message,
  };
}

function productionHealthLabel(status) {
  return {
    ready: "Ready for production",
    needs_review: "Needs review",
    blocked: "Blocked for production",
  }[status] || "Needs review";
}

function productionPlainLanguageSummary(status, summary = {}) {
  if (status === "ready") {
    return "Core production environment checks are ready for paid subscription traffic.";
  }
  if (status === "needs_review") {
    return `Production can move forward only after reviewing ${summary.warnings || 0} warning(s).`;
  }
  return `Production launch is blocked by ${summary.blockers || 0} blocker(s). Fix these before charging real customers.`;
}

function normalizePaymentProvider(provider) {
  const normalized = stringValue(provider || "local_gateway").toLowerCase();
  return normalized === "stripe" ? "stripe_checkout" : normalized;
}

function strongSecret(value) {
  const text = stringValue(value);
  return text.length >= 16 && text !== DEFAULT_PAYMENT_WEBHOOK_SECRET;
}

function safeValue(key, value) {
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

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
