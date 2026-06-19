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
  assert(business.metrics.productionEnvironmentAdvisor?.status, "Business metrics should include production environment advisor.");
  assert(business.metrics.portfolioDataHealth?.status, "Business metrics should include portfolio data health summary.");
  assertEqual(business.metrics.portfolioDataHealth.mode, "read_only", "Portfolio data health in metrics should be read-only.");
  assert(!JSON.stringify(business.metrics.productionEnvironmentAdvisor).includes("super-secret-launch"), "Production environment advisor must not expose database password.");
  assert(business.metrics.paymentGateway?.provider, "Business metrics should include payment gateway summary.");

  const portfolioHealth = await getJson(`${baseUrl}/api/admin/portfolio-health`, ownerCookie);
  assertEqual(portfolioHealth.ok, true, "Owner should load portfolio data health endpoint.");
  assertEqual(portfolioHealth.portfolioHealth.mode, "read_only", "Portfolio health endpoint should never perform recovery writes.");
  assert(Array.isArray(portfolioHealth.portfolioHealth.commands), "Portfolio health endpoint should include CLI command guidance.");

  const portfolioHealthExport = await getTextWithHeaders(`${baseUrl}/api/admin/portfolio-health/export`, ownerCookie);
  assert((portfolioHealthExport.contentDisposition || "").includes("stockflix-portfolio-health-"), "Portfolio health export should download a dated CSV file.");
  assert(portfolioHealthExport.text.startsWith("Customer,Email,Workspace,Plan"), "Portfolio health CSV should include support context headers.");

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
  assertEqual(customerRegister.body.user.subscription.status, "inactive", "New customer should wait for admin package assignment.");
  assertEqual(customerRegister.body.user.subscription.provider, "manual_admin_pending", "New customer should be marked pending manual package review.");
  const customerCookie = cookieHeader(customerRegister.response);

  const ownerPackageUpdate = await postJson(`${baseUrl}/api/admin/users/${encodeURIComponent(customerRegister.body.user.id)}/subscription`, {
    planId: "pro",
    status: "active",
    expiresAt: "2026-12-31",
  }, ownerCookie);
  assertEqual(ownerPackageUpdate.response.status, 200, "Owner should update customer package from admin API.");
  assertEqual(ownerPackageUpdate.body.ok, true, "Owner package update should return ok.");
  assertEqual(ownerPackageUpdate.body.user.subscription.planId, "pro", "Owner package update should set Pro package.");
  assertEqual(ownerPackageUpdate.body.user.subscription.status, "active", "Owner package update should activate subscription.");

  const customerPackageUpdate = await postJson(`${baseUrl}/api/admin/users/${encodeURIComponent(customerRegister.body.user.id)}/subscription`, {
    planId: "starter",
    status: "active",
    expiresAt: "2026-12-31",
  }, customerCookie);
  assertEqual(customerPackageUpdate.response.status, 403, "Customer should not update own package via admin API.");

  const deleteTargetRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Delete Me Customer",
    email: "delete-me@example.test",
    password: "password123",
  });
  assertEqual(deleteTargetRegister.body.ok, true, "Delete target registration should succeed.");
  const deleteTargetCookie = cookieHeader(deleteTargetRegister.response);

  const customerDeleteAttempt = await deleteJson(`${baseUrl}/api/admin/users/${encodeURIComponent(deleteTargetRegister.body.user.id)}`, customerCookie);
  assertEqual(customerDeleteAttempt.response.status, 403, "Customer should not delete users via admin API.");

  const ownerDeleteUser = await deleteJson(`${baseUrl}/api/admin/users/${encodeURIComponent(deleteTargetRegister.body.user.id)}`, ownerCookie);
  assertEqual(ownerDeleteUser.response.status, 200, "Owner should delete user from admin API.");
  assertEqual(ownerDeleteUser.body.ok, true, "Owner delete user should return ok.");
  assert(ownerDeleteUser.body.deletion.deletedAt, "Delete response should include deletedAt.");

  const deletedUserAfterDelete = await getJson(`${baseUrl}/api/auth/me`, deleteTargetCookie);
  assertEqual(deletedUserAfterDelete.user, null, "Deleted user's active session should be removed.");
  const deletedUserLogin = await postJson(`${baseUrl}/api/auth/login`, {
    email: "delete-me@example.test",
    password: "password123",
  });
  assertEqual(deletedUserLogin.response.status, 401, "Deleted user should not be able to login again.");

  const usersAfterDelete = await getJson(`${baseUrl}/api/admin/users`, ownerCookie);
  assert(!usersAfterDelete.users.some((user) => user.id === deleteTargetRegister.body.user.id), "Deleted user should be hidden from admin user list.");

  const customerBusiness = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerBusiness.status, 403, "Customer should not load Business metrics.");

  const customerPortfolioHealth = await fetch(`${baseUrl}/api/admin/portfolio-health`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerPortfolioHealth.status, 403, "Customer should not load portfolio data health.");

  const customerPortfolioHealthExport = await fetch(`${baseUrl}/api/admin/portfolio-health/export`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerPortfolioHealthExport.status, 403, "Customer should not export portfolio data health.");

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
    productionEnvironment: business.metrics.productionEnvironmentAdvisor.status,
    portfolioDataHealth: business.metrics.portfolioDataHealth.status,
    ownerUpdatedCustomerPackage: ownerPackageUpdate.body.user.subscription.planId,
    ownerDeletedUser: ownerDeleteUser.body.deletion.id,
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

async function deleteJson(url, cookie = "") {
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: JSON.stringify({ reason: "frontend_auth_regression" }),
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

async function getTextWithHeaders(url, cookie = "") {
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    text: await response.text(),
    contentDisposition: response.headers.get("content-disposition") || "",
  };
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
