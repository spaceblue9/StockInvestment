import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-web-smoke-"));

process.chdir(tempRoot);

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const health = await getJson(`${baseUrl}/api/health`);
  assertEqual(health.ok, true, "Health endpoint should return ok true.");
  assertEqual(health.migration, "node-web-app", "Health endpoint should expose migration marker.");

  const me = await getJson(`${baseUrl}/api/auth/me`);
  assertEqual(me.ok, true, "Auth me endpoint should be reachable.");
  assertEqual(me.user, null, "Anonymous auth me should not return a user.");

  const plans = await getJson(`${baseUrl}/api/subscription/plans`);
  assert(plans.plans?.length >= 3, "Subscription plans should be available for the pricing panel.");

  const unauthPolicy = await fetch(`${baseUrl}/api/admin/policy`);
  assertEqual(unauthPolicy.status, 401, "Admin policy should require login.");

  const unauthOps = await fetch(`${baseUrl}/api/ops/readiness`);
  assertEqual(unauthOps.status, 401, "Operational readiness should require login.");

  const html = await getText(`${baseUrl}/`);
  assertIncludes(html, [
    "StockFlix",
    "Portfolio",
    "Approvals",
    "Screener",
    "Sector",
    "Simulation",
  ], "Main HTML should expose the dashboard navigation.");

  const appJs = await getText(`${baseUrl}/app.js`);
  assertIncludes(appJs, [
    "sectorFilter",
    "data-sector-filter",
    "External Audit",
    "Operational readiness",
    "Launch Evidence Center",
    "data-launch-evidence-center",
    "Copy sign-off pack",
    "/api/admin/launch-evidence/export?format=json",
    "renderApprovalsView",
  ], "Frontend bundle should include recent SaaS interaction markers.");

  const styles = await getText(`${baseUrl}/styles.css`);
  assertIncludes(styles, [
    "--red: #e50914",
    ".panel",
    "bar-row-button",
    "ops-alert-card",
  ], "Stylesheet should include professional theme and interactive chart styles.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "health",
      "anonymous-auth",
      "subscription-plans",
      "admin-auth-guard",
      "ops-auth-guard",
      "main-html",
      "frontend-markers",
      "stylesheet-markers",
    ],
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

async function getJson(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.json();
}

async function getText(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.text();
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
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertIncludes(text, expectedParts, message) {
  const missing = expectedParts.filter((part) => !text.includes(part));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
  }
}
