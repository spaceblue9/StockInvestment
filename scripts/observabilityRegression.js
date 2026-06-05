import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-observability-"));

process.chdir(tempRoot);

const { buildOperationalReadinessReport } = await import(pathToFileURL(path.join(repoRoot, "src", "services", "observabilityService.js")).href);
const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);

const criticalReport = buildOperationalReadinessReport({
  users: 3,
  paidUsers: 1,
  mrrEstimate: 1490,
  revenueCollected: 1490,
  storageReadiness: {
    status: "blocked",
    blockerCount: 2,
    warningCount: 0,
    issues: [{ collection: "users", severity: "blocker", type: "duplicate_primary_key", count: 1 }],
  },
  auditIntegrity: {
    status: "needs_review",
    invalidEvents: 1,
  },
  auditTrail: {
    status: "needs_review",
    missingFromTrailCount: 1,
    invalidLineCount: 0,
    external: {
      enabled: true,
      required: true,
      status: "needs_configuration",
      endpointConfigured: false,
      missingFromExternalCount: 1,
    },
  },
  paymentGateway: {
    provider: "stripe_checkout",
    configured: false,
  },
  webhookEvents: 4,
  rejectedWebhookEvents: 3,
}, {
  repository: {
    adapter: "postgres",
    productionReady: true,
    scopedReads: "query_level_sql_where",
  },
  generatedAt: "2026-06-04T13:22:21.000Z",
});

assertEqual(criticalReport.status, "critical", "Blocked storage and unconfigured provider should make readiness critical.");
assertEqual(criticalReport.ok, false, "Critical readiness should set ok false.");
assert(criticalReport.alerts.some((alert) => alert.id === "storage_blocked"), "Critical readiness should include storage alert.");
assert(criticalReport.alerts.some((alert) => alert.id === "external_audit_required_not_synced"), "Critical readiness should include external audit alert.");
assert(criticalReport.alerts.some((alert) => alert.id === "payment_gateway_not_configured"), "Critical readiness should include payment gateway alert.");
assert(criticalReport.alerts.some((alert) => alert.id === "webhook_rejection_spike"), "Critical readiness should include webhook spike alert.");

const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const anonymousReadiness = await fetch(`${baseUrl}/api/ops/readiness`);
  assertEqual(anonymousReadiness.status, 401, "Operational readiness should require login.");

  const ownerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Owner",
    email: "owner@example.test",
    password: "password123",
  });
  assertEqual(ownerRegister.body.ok, true, "Owner registration should succeed.");
  const ownerCookie = cookieHeader(ownerRegister.response);

  const ownerReadiness = await getJson(`${baseUrl}/api/ops/readiness`, ownerCookie);
  assertEqual(ownerReadiness.ok, true, "Owner readiness endpoint should return ok wrapper.");
  assert(["ok", "warning", "critical"].includes(ownerReadiness.readiness.status), "Readiness should expose a known status.");
  assert(ownerReadiness.readiness.alerts.some((alert) => alert.id === "repository_not_production_ready"), "Local-file repository should raise production warning.");
  assert(ownerReadiness.readiness.alerts.some((alert) => alert.id === "local_payment_gateway"), "Local payment gateway should raise production warning.");
  assertEqual(ownerReadiness.readiness.checks.dependencyRisk.gate, "npm run test:dependency-risk", "Readiness should point to dependency risk gate.");

  const customerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Customer",
    email: "customer@example.test",
    password: "password123",
  });
  const customerCookie = cookieHeader(customerRegister.response);
  const customerReadiness = await fetch(`${baseUrl}/api/ops/readiness`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerReadiness.status, 403, "Customer should not see operational readiness.");

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    pureStatus: criticalReport.status,
    ownerStatus: ownerReadiness.readiness.status,
    ownerAlerts: ownerReadiness.readiness.alerts.map((alert) => alert.id),
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

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n${JSON.stringify({ actual, expected }, null, 2)}`);
  }
}
