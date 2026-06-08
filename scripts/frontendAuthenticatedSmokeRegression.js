import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-frontend-auth-"));
process.env.DATABASE_URL = "postgres://stockflix:super-secret-launch@db.example.com:5432/stockflix";

process.chdir(tempRoot);

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const html = await getText(`${baseUrl}/`);
  assertIncludes(html, [
    "StockFlix Investor Studio",
    "Member Access",
    "Command Center",
    "Portfolio",
    "Business",
  ], "Landing shell should expose authenticated app structure.");

  const ownerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Browser QA Owner",
    email: "browser-owner@example.test",
    password: "password123",
  });
  assertEqual(ownerRegister.body.ok, true, "Owner registration should succeed.");
  assertEqual(ownerRegister.body.user.role, "owner", "First user should become owner.");
  const ownerCookie = cookieHeader(ownerRegister.response);
  assert(ownerCookie, "Owner registration should set a session cookie.");

  const ownerMe = await getJson(`${baseUrl}/api/auth/me`, ownerCookie);
  assertEqual(ownerMe.user.email, "browser-owner@example.test", "Owner session should be readable.");

  const business = await getJson(`${baseUrl}/api/admin/metrics`, ownerCookie);
  assertEqual(business.ok, true, "Owner should load business metrics.");
  assert(business.metrics.users >= 1, "Business metrics should count registered users.");
  assert(business.metrics.storageReadiness?.status, "Business metrics should include storage readiness summary.");
  assert(business.metrics.paymentGateway?.provider, "Business metrics should include payment gateway summary.");

  const launchEvidence = await getJson(`${baseUrl}/api/admin/launch-evidence`, ownerCookie);
  assertEqual(launchEvidence.ok, true, "Owner should load launch evidence center.");
  assert(launchEvidence.evidence.items.length >= 8, "Launch evidence should include go-live checklist items.");
  assert(launchEvidence.evidence.preflightCommands.some((command) => command.includes("postgres:patch-smoke")), "Launch evidence should include patch smoke command.");
  assert(launchEvidence.evidence.sanitizedEnvironment.DATABASE_URL.includes("****"), "Launch evidence should mask database password.");
  assert(!JSON.stringify(launchEvidence).includes("super-secret-launch"), "Launch evidence JSON must not expose database password.");

  const readiness = await getJson(`${baseUrl}/api/ops/readiness`, ownerCookie);
  assertEqual(readiness.ok, true, "Owner should load operational readiness.");
  assert(["ok", "warning", "critical"].includes(readiness.readiness.status), "Operational readiness should report a known status.");
  assert(readiness.readiness.runbook.alertDelivery.includes("ops:alerts"), "Readiness runbook should include alert delivery preview.");

  const customerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Browser QA Customer",
    email: "browser-customer@example.test",
    password: "password123",
  });
  assertEqual(customerRegister.body.ok, true, "Customer registration should succeed.");
  assertEqual(customerRegister.body.user.role, "customer", "Second user should become customer.");
  const customerCookie = cookieHeader(customerRegister.response);

  const customerBusiness = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerBusiness.status, 403, "Customer should not load Business metrics.");

  const customerLaunchEvidence = await fetch(`${baseUrl}/api/admin/launch-evidence`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerLaunchEvidence.status, 403, "Customer should not load launch evidence.");

  const customerOps = await fetch(`${baseUrl}/api/ops/readiness`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerOps.status, 403, "Customer should not load operational readiness.");

  const customerLogout = await postJson(`${baseUrl}/api/auth/logout`, {}, customerCookie);
  assertEqual(customerLogout.body.ok, true, "Customer logout should succeed.");
  const customerAfterLogout = await getJson(`${baseUrl}/api/auth/me`, customerCookie);
  assertEqual(customerAfterLogout.user, null, "Deleted customer session should no longer authenticate.");

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    ownerRole: ownerRegister.body.user.role,
    customerRole: customerRegister.body.user.role,
    customerLogoutClearedSession: true,
    readiness: readiness.readiness.status,
    launchEvidence: launchEvidence.evidence.status,
    alertCount: readiness.readiness.alerts.length,
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

async function getText(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.text();
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
