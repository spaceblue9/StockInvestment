import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-reference-master-admin-"));

process.chdir(tempRoot);

const {
  createReferenceMasterFromRows,
  writeReferenceMaster,
} = await import(pathToFileURL(path.join(repoRoot, "src", "services", "referenceMasterService.js")).href);

const master = createReferenceMasterFromRows([
  { Symbol: "AAA", Sector: "Commerce", PE: 12, ROE: 18, Yield: 3, DE: 0.5 },
  { Symbol: "BBB", Sector: "Unknown", PE: 0, ROE: 0, Yield: 0, DE: 0 },
], {
  generatedAt: "2026-06-11T06:06:53.000Z",
  sourceFile: "recommended_stocks.csv",
  sourceType: "regression_fixture",
});
await writeReferenceMaster(master);

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const ownerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Reference Owner",
    email: "reference-owner@example.test",
    password: "password123",
  });
  assertEqual(ownerRegister.body.ok, true, "Owner registration should succeed.");
  assertEqual(ownerRegister.body.user.role, "owner", "First user should be owner.");
  const ownerCookie = cookieHeader(ownerRegister.response);

  const initial = await getJson(`${baseUrl}/api/admin/reference-master?limit=5`, ownerCookie);
  assertEqual(initial.ok, true, "Owner should load reference master review.");
  assertEqual(initial.referenceMaster.totals.needsReviewRows, 1, "Reference master should expose one needs-review row.");
  assertEqual(initial.referenceMaster.reviewQueue[0].Symbol, "BBB", "Needs-review queue should include BBB.");

  const update = await postJson(`${baseUrl}/api/admin/reference-master/BBB`, {
    Sector: "Industrials",
    PE: 15.2,
    ROE: 9.5,
    Yield: 1.8,
    DE: 0.7,
    reviewNote: "Reviewed from regression fixture",
  }, ownerCookie);
  assertEqual(update.body.ok, true, "Owner should update reference master record.");
  assertEqual(update.body.record.metadata.reviewStatus, "reviewed", "Complete update should mark record reviewed.");
  assertEqual(update.body.referenceMaster.totals.needsReviewRows, 0, "Summary should clear needs-review count.");
  assertEqual(update.body.referenceMaster.freshness.status, "fresh", "Freshness should be fresh after review.");

  const audit = await getJson(`${baseUrl}/api/audit/events?limit=10`, ownerCookie);
  assert(audit.events.some((event) => event.action === "reference_master.review" && event.details?.symbol === "BBB"), "Review update should create audit event.");

  const customerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Reference Customer",
    email: "reference-customer@example.test",
    password: "password123",
  });
  const customerCookie = cookieHeader(customerRegister.response);
  const customerReference = await fetch(`${baseUrl}/api/admin/reference-master`, {
    headers: { Cookie: customerCookie },
  });
  assertEqual(customerReference.status, 403, "Customer should not read reference master review.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "owner-review-summary",
      "owner-record-update",
      "audit-event",
      "customer-guard",
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
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}
