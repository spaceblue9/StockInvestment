import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");

const {
  buildLaunchEvidenceCenter,
  buildLaunchEvidenceSignoffPack,
  renderLaunchEvidenceSignoffText,
} = await import(pathToFileURL(path.join(repoRoot, "src", "services", "launchEvidenceService.js")).href);

const appJs = await fs.readFile(path.join(repoRoot, "src", "public", "app.js"), "utf8");
const styles = await fs.readFile(path.join(repoRoot, "src", "public", "styles.css"), "utf8");

const readyEnv = {
  APP_STATE_REPOSITORY: "postgres",
  DATABASE_URL: "postgres://stockflix:top-secret-launch-password@db.example.com:5432/stockflix",
  DATABASE_SSL_MODE: "require",
  PAYMENT_GATEWAY_PROVIDER: "stripe",
  AUDIT_TRAIL_EXTERNAL_PROVIDER: "webhook",
  POSTGRES_BACKUP_STRATEGY: "both",
  POSTGRES_PATCH_IMPORT_DRY_RUN_DONE: "done",
  POSTGRES_PATCH_VALIDATION_READY: "ready",
  POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE: "staging-backup-2026-06-08",
  REFERENCE_MASTER_FRESHNESS_REVIEWED: "done",
  REFERENCE_MASTER_FRESHNESS_REPORT_EVIDENCE: "freshness-report-2026-06-08",
  REFERENCE_MASTER_MIGRATION_DRY_RUN_REVIEWED: "done",
  REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED: "done",
  REFERENCE_MASTER_MIGRATION_STAGING_READY: "ready",
  REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE: "reference-master-staging-backup-2026-06-08",
  REFERENCE_MASTER_MIGRATION_SIGNED_OFF: "done",
  LAUNCH_EVIDENCE_CI_QUALITY_DONE: "passed",
  LAUNCH_EVIDENCE_POSTGRES_BACKUP_DONE: "done",
  LAUNCH_EVIDENCE_PATCH_SMOKE_DONE: "done",
  LAUNCH_EVIDENCE_DEPLOYMENT_CHECK_DONE: "done",
  LAUNCH_EVIDENCE_OPS_ALERTS_DONE: "done",
  LAUNCH_EVIDENCE_AUDIT_DONE: "done",
};

const pendingEvidence = buildLaunchEvidenceCenter({
  env: {
    DATABASE_URL: readyEnv.DATABASE_URL,
  },
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assertEqual(pendingEvidence.status, "needs_evidence", "Missing launch markers should require evidence.");
assertEqual(pendingEvidence.summary.pending, 10, "All launch evidence items should be pending without markers.");
assertEqual(pendingEvidence.referenceMaster.status, "needs_evidence", "Reference master launch evidence should be pending without markers.");
assert(!JSON.stringify(pendingEvidence).includes("top-secret-launch-password"), "Pending launch evidence should not expose database passwords.");

const blockedEvidence = buildLaunchEvidenceCenter({
  env: {
    ...readyEnv,
    POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE: "",
  },
  generatedAt: "2026-06-08T00:00:00.000Z",
});
const blockedPatchSmoke = blockedEvidence.items.find((item) => item.id === "postgres_patch_smoke");
assertEqual(blockedEvidence.status, "blocked", "Patch smoke without backup evidence should block launch.");
assertEqual(blockedEvidence.summary.blocked, 1, "Only patch smoke should be blocked in this scenario.");
assertEqual(blockedPatchSmoke.status, "blocked", "Patch smoke item should surface its blocked status.");

const blockedReferenceMigrationEvidence = buildLaunchEvidenceCenter({
  env: {
    ...readyEnv,
    REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE: "",
  },
  generatedAt: "2026-06-08T00:00:00.000Z",
});
const blockedReferenceMigration = blockedReferenceMigrationEvidence.items.find((item) => item.id === "reference_master_migration_readiness");
assertEqual(blockedReferenceMigrationEvidence.status, "blocked", "Reference master sign-off without backup evidence should block launch.");
assertEqual(blockedReferenceMigrationEvidence.referenceMaster.status, "blocked", "Reference master evidence summary should surface blocked migration readiness.");
assertEqual(blockedReferenceMigration.status, "blocked", "Reference master migration readiness item should be blocked when required backup evidence is missing.");
assert(blockedReferenceMigration.requiredEvidence.some((item) => item.env === "REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE" && item.ready === false), "Reference master migration readiness should expose missing backup evidence marker.");

const readyEvidence = buildLaunchEvidenceCenter({
  env: readyEnv,
  generatedAt: "2026-06-08T00:00:00.000Z",
});
assertEqual(readyEvidence.status, "ready", "Complete launch markers should make the evidence center ready.");
assertEqual(readyEvidence.summary.ready, readyEvidence.summary.total, "All evidence items should be ready with complete markers.");
assertEqual(readyEvidence.referenceMaster.status, "ready", "Reference master launch evidence should be ready with complete markers.");
assertEqual(readyEvidence.sanitizedEnvironment.DATABASE_URL, "postgres://stockflix:****@db.example.com:5432/stockflix", "Launch evidence should mask database URL passwords.");
assertEqual(readyEvidence.sanitizedEnvironment.POSTGRES_PATCH_IMPORT_DRY_RUN_DONE, "done", "Importer dry-run marker should be visible in sanitized environment.");
assertEqual(readyEvidence.sanitizedEnvironment.REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE, "reference-master-staging-backup-2026-06-08", "Reference master backup evidence marker should be visible when it is not a secret.");
assert(readyEvidence.items.some((item) => item.id === "reference_master_freshness" && item.status === "ready"), "Launch evidence should include ready reference master freshness item.");
assert(readyEvidence.items.some((item) => item.id === "reference_master_migration_readiness" && item.requiredEvidence.length === 3), "Launch evidence should include reference master migration readiness requirements.");
assert(!JSON.stringify(readyEvidence).includes("top-secret-launch-password"), "Ready launch evidence should not expose database passwords.");

const signoffPack = buildLaunchEvidenceSignoffPack({
  evidence: readyEvidence,
  exportedAt: "2026-06-08T00:01:00.000Z",
});
const signoffText = renderLaunchEvidenceSignoffText(signoffPack);
assertEqual(signoffPack.version, "stockflix-launch-evidence-signoff-v1", "Sign-off pack should expose its version.");
assertEqual(signoffPack.launchStatus, "ready", "Sign-off pack should carry launch status.");
assertEqual(signoffPack.referenceMaster.status, "ready", "Sign-off pack should include reference master evidence status.");
assert(signoffPack.evidenceItems.some((item) => item.preflightCommand.includes("ci:quality")), "Sign-off pack should include preflight commands per evidence item.");
assert(signoffPack.evidenceItems.some((item) => item.id === "reference_master_migration_readiness" && item.requiredEvidence.length === 3), "Sign-off pack should include reference master required marker evidence.");
assert(signoffText.includes("StockFlix Launch Evidence Sign-off Pack"), "Text export should include a clear title.");
assert(signoffText.includes("Reference Master Evidence"), "Text export should include reference master evidence summary.");
assert(signoffText.includes("REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE"), "Text export should include reference master migration markers.");
assert(signoffText.includes("Sanitized Environment"), "Text export should include sanitized environment.");
assert(!JSON.stringify(signoffPack).includes("top-secret-launch-password"), "Sign-off pack JSON should not expose database passwords.");
assert(!signoffText.includes("top-secret-launch-password"), "Sign-off pack text should not expose database passwords.");

assertIncludes(appJs, [
  "function renderLaunchEvidenceCenter",
  "data-launch-evidence-center=\"true\"",
  "Launch evidence is loading...",
  "Ready Evidence",
  "Blocked Evidence",
  "Evidence checklist",
  "Reference master launch evidence",
  "data-reference-master-launch-evidence",
  "The browser does not execute these commands.",
  "Preflight commands",
  "Copy sign-off pack",
  "Download JSON",
  "data-launch-evidence-copy",
  "data-launch-evidence-download",
  "downloadLaunchEvidencePack",
  "launchEvidenceExportMessage",
  "/api/admin/launch-evidence/export?format=json",
  "/api/admin/launch-evidence/export?format=text",
  "launch_evidence.export",
  "Launch evidence exported",
  "evidenceStatusLabel",
  "escapeHtml(item.command",
  "renderLaunchEvidenceCenter(state.launchEvidence)",
], "Frontend renderer should keep Launch Evidence Center structure and escaped command output.");

assertIncludes(styles, [
  ".launch-evidence-panel",
  ".launch-evidence-grid",
  "grid-template-columns: repeat(4, minmax(180px, 1fr));",
  ".launch-evidence-card code,",
  ".reference-launch-evidence",
  ".evidence-marker-list",
  ".guidance-card code",
  ".command-list code",
  ".launch-evidence-header-actions",
  ".download-link",
  ".launch-evidence-export-message",
  "overflow-wrap: anywhere;",
  ".launch-evidence-card.blocked",
], "Stylesheet should keep Launch Evidence Center card, command, and status guardrails.");
assertRegex(styles, /@media \(max-width: 980px\)[\s\S]*\.launch-evidence-grid,[\s\S]*grid-template-columns: 1fr;/u, "Responsive CSS should stack Launch Evidence cards on tablet/mobile widths.");

Object.assign(process.env, {
  ...readyEnv,
  APP_STATE_REPOSITORY: "local_file",
});
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-launch-evidence-"));
process.chdir(tempRoot);

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const unauthResponse = await fetch(`${baseUrl}/api/admin/launch-evidence`);
  assertEqual(unauthResponse.status, 401, "Launch evidence API should require login.");

  const ownerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Launch Evidence Owner",
    email: "launch-owner@example.test",
    password: "password123",
  });
  assertEqual(ownerRegister.body.ok, true, "Owner registration should succeed.");
  assertEqual(ownerRegister.body.user.role, "owner", "First user should become owner.");
  const ownerCookie = cookieHeader(ownerRegister.response);

  const ownerLaunchEvidence = await getJson(`${baseUrl}/api/admin/launch-evidence`, ownerCookie);
  assertEqual(ownerLaunchEvidence.ok, true, "Owner should load launch evidence.");
  assertEqual(ownerLaunchEvidence.evidence.status, "ready", "Owner API should report ready evidence with complete markers.");
  assert(ownerLaunchEvidence.evidence.items.some((item) => item.id === "postgres_import_dry_run"), "API should include Postgres importer dry-run evidence.");
  assert(ownerLaunchEvidence.evidence.items.some((item) => item.id === "reference_master_migration_readiness"), "API should include reference master migration readiness evidence.");
  assertEqual(ownerLaunchEvidence.evidence.referenceMaster.status, "ready", "API should include ready reference master evidence summary.");
  assertEqual(ownerLaunchEvidence.evidence.sanitizedEnvironment.POSTGRES_PATCH_IMPORT_DRY_RUN_DONE, "done", "API should expose importer dry-run marker without secrets.");
  assertEqual(ownerLaunchEvidence.evidence.sanitizedEnvironment.REFERENCE_MASTER_MIGRATION_SIGNED_OFF, "done", "API should expose reference master migration sign-off marker.");
  assert(!JSON.stringify(ownerLaunchEvidence).includes("top-secret-launch-password"), "Launch evidence API should not expose database passwords.");

  const ownerJsonExportResponse = await fetch(`${baseUrl}/api/admin/launch-evidence/export?format=json`, {
    headers: { Cookie: ownerCookie },
  });
  assertEqual(ownerJsonExportResponse.status, 200, "Owner should export launch evidence JSON.");
  assert((ownerJsonExportResponse.headers.get("content-type") || "").includes("application/json"), "JSON export should use application/json.");
  assert((ownerJsonExportResponse.headers.get("content-disposition") || "").includes(".json"), "JSON export should include download filename.");
  const ownerJsonExport = await ownerJsonExportResponse.json();
  assertEqual(ownerJsonExport.version, "stockflix-launch-evidence-signoff-v1", "JSON export should return sign-off pack.");
  assertEqual(ownerJsonExport.launchStatus, "ready", "JSON export should include launch status.");
  assert(ownerJsonExport.signoffChecklist.length >= 5, "JSON export should include sign-off checklist.");
  assert(!JSON.stringify(ownerJsonExport).includes("top-secret-launch-password"), "JSON export should not expose database passwords.");

  const ownerTextExportResponse = await fetch(`${baseUrl}/api/admin/launch-evidence/export?format=text`, {
    headers: { Cookie: ownerCookie },
  });
  assertEqual(ownerTextExportResponse.status, 200, "Owner should export launch evidence text.");
  assert((ownerTextExportResponse.headers.get("content-type") || "").includes("text/plain"), "Text export should use text/plain.");
  assert((ownerTextExportResponse.headers.get("content-disposition") || "").includes(".txt"), "Text export should include download filename.");
  const ownerTextExport = await ownerTextExportResponse.text();
  assert(ownerTextExport.includes("StockFlix Launch Evidence Sign-off Pack"), "Text export should include clear title.");
  assert(ownerTextExport.includes("Preflight Commands"), "Text export should include preflight commands.");
  assert(!ownerTextExport.includes("top-secret-launch-password"), "Text export should not expose database passwords.");

  const unsupportedExport = await fetch(`${baseUrl}/api/admin/launch-evidence/export?format=pdf`, {
    headers: { Cookie: ownerCookie },
  });
  assertEqual(unsupportedExport.status, 400, "Unsupported export format should return 400.");

  const ownerAuditEvents = await getJson(`${baseUrl}/api/audit/events?limit=20`, ownerCookie);
  const exportEvents = ownerAuditEvents.events.filter((event) => event.action === "launch_evidence.export");
  assertEqual(exportEvents.length, 2, "JSON and text exports should each create an audit event.");
  assert(exportEvents.some((event) => event.details?.format === "json"), "Audit trail should include JSON export format.");
  assert(exportEvents.some((event) => event.details?.format === "text"), "Audit trail should include text export format.");
  assert(exportEvents.every((event) => event.details?.launchStatus === "ready"), "Audit trail should include sanitized launch status.");
  assert(exportEvents.every((event) => event.details?.sanitizedEnvironment?.DATABASE_URL?.includes("****")), "Audit trail should retain only masked database URL details.");
  assert(!JSON.stringify(exportEvents).includes("top-secret-launch-password"), "Export audit events should not expose database passwords.");

  const customerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Launch Evidence Customer",
    email: "launch-customer@example.test",
    password: "password123",
  });
  assertEqual(customerRegister.body.ok, true, "Customer registration should succeed.");
  assertEqual(customerRegister.body.user.role, "customer", "Second user should become customer.");
  const customerCookie = cookieHeader(customerRegister.response);

  const customerLaunchEvidence = await fetch(`${baseUrl}/api/admin/launch-evidence`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerLaunchEvidence.status, 403, "Customer should not load launch evidence.");

  const customerLaunchEvidenceExport = await fetch(`${baseUrl}/api/admin/launch-evidence/export?format=json`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerLaunchEvidenceExport.status, 403, "Customer should not export launch evidence.");

  const ownerAuditAfterCustomerExport = await getJson(`${baseUrl}/api/audit/events?limit=20`, ownerCookie);
  const exportEventsAfterCustomerGuard = ownerAuditAfterCustomerExport.events.filter((event) => event.action === "launch_evidence.export");
  assertEqual(exportEventsAfterCustomerGuard.length, 2, "Rejected customer export should not create an export audit event.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "pending-evidence",
      "blocked-patch-smoke",
      "blocked-reference-master-migration",
      "ready-evidence",
      "reference-master-evidence-summary",
      "secret-masking",
      "frontend-renderer-markers",
      "css-command-wrapping",
      "responsive-grid-fallback",
      "owner-api-access",
      "owner-json-export",
      "owner-text-export",
      "owner-export-audit-events",
      "customer-api-guard",
      "customer-export-guard",
      "customer-export-no-audit-event",
    ],
    launchEvidenceStatus: ownerLaunchEvidence.evidence.status,
  }, null, 2));
} finally {
  await closeServer(server);
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function listenInProcess() {
  return new Promise((resolve, reject) => {
    const targetServer = startServer({ port: 0, silent: true });
    targetServer.once("listening", () => resolve(targetServer));
    targetServer.once("error", reject);
  });
}

async function postJson(url, body, cookie = "") {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify(body),
  });
  return {
    response,
    body: await response.json(),
  };
}

async function getJson(url, cookie = "") {
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.json();
}

function cookieHeader(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  return setCookie.split(";")[0];
}

function closeServer(targetServer) {
  return new Promise((resolve, reject) => {
    targetServer.close((error) => (error ? reject(error) : resolve()));
  });
}

function assertIncludes(text, expectedParts, message) {
  const missing = expectedParts.filter((part) => !text.includes(part));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
  }
}

function assertRegex(text, pattern, message) {
  if (!pattern.test(text)) {
    throw new Error(message);
  }
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}
