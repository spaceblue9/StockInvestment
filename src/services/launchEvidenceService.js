const TRUE_VALUES = new Set(["1", "true", "yes", "y", "done", "ready", "ok", "passed"]);
const SECRET_PATTERN = /SECRET|PASSWORD|TOKEN|KEY|DATABASE_URL/u;

const launchItems = [
  {
    id: "ci_quality",
    title: "CI quality gate",
    command: "npm run ci:quality",
    markerEnv: "LAUNCH_EVIDENCE_CI_QUALITY_DONE",
    evidence: "Attach passing CI output with dependency risk summary.",
    category: "quality",
  },
  {
    id: "postgres_backup_runbook",
    title: "Postgres backup runbook",
    command: "npm run postgres:backup-runbook -- --strategy both --format text --strict",
    markerEnv: "LAUNCH_EVIDENCE_POSTGRES_BACKUP_DONE",
    evidence: "Attach sanitized runbook and backup/restore drill id.",
    category: "database",
  },
  {
    id: "postgres_import_dry_run",
    title: "Postgres importer dry-run",
    command: "npm run import:postgres -- --input data/app-state.json --dry-run",
    markerEnv: "POSTGRES_PATCH_IMPORT_DRY_RUN_DONE",
    evidence: "Attach storage readiness and importer dry-run output.",
    category: "database",
  },
  {
    id: "postgres_patch_validation",
    title: "Postgres patch validation",
    command: "npm run postgres:patch-validation -- --format text --strict",
    markerEnv: "POSTGRES_PATCH_VALIDATION_READY",
    evidence: "Attach ready validation runbook with scoped read and audit verification notes.",
    category: "database",
  },
  {
    id: "postgres_patch_smoke",
    title: "Postgres patch smoke",
    command: "npm run postgres:patch-smoke -- --format json --strict",
    markerEnv: "LAUNCH_EVIDENCE_PATCH_SMOKE_DONE",
    evidence: "Attach dry-run output, confirmed staging evidence, and backup evidence id.",
    category: "database",
    secondaryEnv: "POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE",
  },
  {
    id: "deployment_checklist",
    title: "Deployment checklist",
    command: "npm run deployment:check -- --format text --strict",
    markerEnv: "LAUNCH_EVIDENCE_DEPLOYMENT_CHECK_DONE",
    evidence: "Attach sanitized deployment checklist output.",
    category: "deployment",
  },
  {
    id: "ops_alerts",
    title: "Operational alerts",
    command: "npm run ops:alerts -- --dry-run --format text --strict",
    markerEnv: "LAUNCH_EVIDENCE_OPS_ALERTS_DONE",
    evidence: "Attach dry-run alert payload and monitor destination confirmation.",
    category: "operations",
  },
  {
    id: "audit_evidence",
    title: "Audit evidence",
    command: "GET /api/audit/integrity and GET /api/audit/trail as owner/admin",
    markerEnv: "LAUNCH_EVIDENCE_AUDIT_DONE",
    evidence: "Attach audit integrity, audit mirror, and external audit receipt status.",
    category: "audit",
  },
];

export function buildLaunchEvidenceCenter(options = {}) {
  const env = options.env || process.env;
  const generatedAt = options.generatedAt || new Date().toISOString();
  const items = launchItems.map((item) => launchEvidenceItem(item, env));
  const summary = summarize(items);
  const status = summary.blocked > 0
    ? "blocked"
    : summary.pending > 0
      ? "needs_evidence"
      : "ready";

  return {
    version: "stockflix-launch-evidence-v1",
    status,
    generatedAt,
    summary,
    items,
    preflightCommands: launchItems.map((item) => item.command),
    sanitizedEnvironment: sanitizedEnvironment(env, [
      "APP_STATE_REPOSITORY",
      "DATABASE_URL",
      "DATABASE_SSL_MODE",
      "PAYMENT_GATEWAY_PROVIDER",
      "AUDIT_TRAIL_EXTERNAL_PROVIDER",
      "POSTGRES_BACKUP_STRATEGY",
      "POSTGRES_PATCH_IMPORT_DRY_RUN_DONE",
      "POSTGRES_PATCH_VALIDATION_READY",
      "POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE",
      "LAUNCH_EVIDENCE_CI_QUALITY_DONE",
      "LAUNCH_EVIDENCE_POSTGRES_BACKUP_DONE",
      "LAUNCH_EVIDENCE_PATCH_SMOKE_DONE",
      "LAUNCH_EVIDENCE_DEPLOYMENT_CHECK_DONE",
      "LAUNCH_EVIDENCE_OPS_ALERTS_DONE",
      "LAUNCH_EVIDENCE_AUDIT_DONE",
    ]),
    guardrails: [
      "The web UI displays evidence requirements only; it does not run terminal commands.",
      "Keep raw secrets, database URLs, provider keys, and webhook secrets out of screenshots and tickets.",
      "Use staging or production-like evidence before approving paid subscription traffic.",
      "Keep rollback and restore evidence beside every patch smoke or deployment sign-off.",
    ],
  };
}

export function buildLaunchEvidenceSignoffPack(options = {}) {
  const evidence = options.evidence || buildLaunchEvidenceCenter(options);
  const exportedAt = options.exportedAt || new Date().toISOString();

  return {
    version: "stockflix-launch-evidence-signoff-v1",
    product: "StockFlix Investor Studio",
    purpose: "Owner/admin launch evidence pack for paid subscription go-live review.",
    generatedAt: evidence.generatedAt,
    exportedAt,
    launchStatus: evidence.status,
    summary: evidence.summary,
    evidenceItems: evidence.items.map((item) => ({
      id: item.id,
      title: item.title,
      category: item.category,
      status: item.status,
      markerEnv: item.markerEnv,
      secondaryEnv: item.secondaryEnv,
      secondaryEvidence: item.secondaryEvidence,
      evidenceRequired: item.evidence,
      preflightCommand: item.command,
    })),
    preflightCommands: evidence.preflightCommands,
    sanitizedEnvironment: evidence.sanitizedEnvironment,
    guardrails: evidence.guardrails,
    signoffChecklist: [
      "Attach CI quality output and dependency risk summary.",
      "Attach Postgres backup/restore evidence before patch smoke or deployment sign-off.",
      "Attach staging dry-run or production-like evidence for importer, patch validation, and patch smoke.",
      "Attach operational alert dry-run payload and monitor destination confirmation.",
      "Attach audit integrity, audit trail mirror, and external audit receipt status.",
      "Confirm this pack contains no raw secrets before sharing outside the owner/admin team.",
    ],
    securityNotes: [
      "This pack is generated from sanitized server-side evidence data.",
      "The frontend can copy or download this pack, but it does not execute terminal commands.",
      "Raw database passwords, provider keys, webhook secrets, tokens, and cookies must stay out of exported evidence.",
    ],
  };
}

export function renderLaunchEvidenceSignoffText(pack = buildLaunchEvidenceSignoffPack()) {
  const lines = [
    "StockFlix Launch Evidence Sign-off Pack",
    `Version: ${pack.version || "-"}`,
    `Product: ${pack.product || "-"}`,
    `Purpose: ${pack.purpose || "-"}`,
    `Generated: ${pack.generatedAt || "-"}`,
    `Exported: ${pack.exportedAt || "-"}`,
    `Launch status: ${pack.launchStatus || "-"}`,
    "",
    "Summary",
    `- Ready: ${pack.summary?.ready ?? 0}`,
    `- Pending: ${pack.summary?.pending ?? 0}`,
    `- Blocked: ${pack.summary?.blocked ?? 0}`,
    `- Total: ${pack.summary?.total ?? 0}`,
    "",
    "Evidence Items",
    ...(pack.evidenceItems || []).flatMap((item, index) => [
      `${index + 1}. ${item.title || item.id || "Evidence item"} [${item.status || "pending"}]`,
      `   Category: ${item.category || "-"}`,
      `   Marker: ${item.markerEnv || "-"}`,
      `   Secondary marker: ${item.secondaryEnv || "-"}`,
      `   Secondary evidence: ${item.secondaryEvidence || "-"}`,
      `   Required evidence: ${item.evidenceRequired || "-"}`,
      `   Preflight command: ${item.preflightCommand || "-"}`,
    ]),
    "",
    "Preflight Commands",
    ...(pack.preflightCommands || []).map((command) => `- ${command}`),
    "",
    "Sanitized Environment",
    ...Object.entries(pack.sanitizedEnvironment || {}).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "Guardrails",
    ...(pack.guardrails || []).map((item) => `- ${item}`),
    "",
    "Sign-off Checklist",
    ...(pack.signoffChecklist || []).map((item) => `- ${item}`),
    "",
    "Security Notes",
    ...(pack.securityNotes || []).map((item) => `- ${item}`),
  ];

  return `${lines.join("\n")}\n`;
}

function launchEvidenceItem(item, env) {
  const done = truthy(env[item.markerEnv]);
  const secondary = item.secondaryEnv ? stringValue(env[item.secondaryEnv]) : "";
  const blocked = item.secondaryEnv && done && !secondary;
  const status = blocked ? "blocked" : done ? "ready" : "pending";

  return {
    id: item.id,
    title: item.title,
    category: item.category,
    status,
    command: item.command,
    evidence: item.evidence,
    markerEnv: item.markerEnv,
    secondaryEnv: item.secondaryEnv || "",
    secondaryEvidence: secondary ? maskIfSensitive(item.secondaryEnv, secondary) : "",
  };
}

function summarize(items) {
  return {
    ready: items.filter((item) => item.status === "ready").length,
    pending: items.filter((item) => item.status === "pending").length,
    blocked: items.filter((item) => item.status === "blocked").length,
    total: items.length,
  };
}

function sanitizedEnvironment(env, keys) {
  return Object.fromEntries(keys.map((key) => [key, maskIfSensitive(key, env[key])]));
}

function maskIfSensitive(key, value) {
  const text = stringValue(value);
  if (!text) {
    return "(missing)";
  }

  if (key === "DATABASE_URL") {
    return text.replace(/(:\/\/[^:\s]+:)([^@\s]+)(@)/u, "$1****$3");
  }

  if (SECRET_PATTERN.test(key)) {
    return "****";
  }

  return text;
}

function truthy(value) {
  return TRUE_VALUES.has(stringValue(value).toLowerCase());
}

function stringValue(value) {
  return value === null || value === undefined ? "" : String(value).trim();
}
