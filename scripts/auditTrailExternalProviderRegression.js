import crypto from "crypto";
import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-audit-external-"));
const externalSecret = "external-audit-regression-secret";
const receivedEvents = [];

process.chdir(tempRoot);
process.env.AUDIT_TRAIL_EXTERNAL_PROVIDER = "http_webhook";
process.env.AUDIT_TRAIL_HTTP_SECRET = externalSecret;
delete process.env.AUDIT_TRAIL_EXTERNAL_REQUIRED;

const server = http.createServer(async (req, res) => {
  const body = await readBody(req);
  const timestamp = req.headers["x-stockflix-audit-timestamp"];
  const signature = req.headers["x-stockflix-audit-signature"];
  const expectedSignature = signBody(body, timestamp);
  const parsed = JSON.parse(body);
  const signatureVerified = signature === expectedSignature;

  receivedEvents.push({
    eventId: parsed.event?.id || "",
    action: parsed.event?.action || "",
    signatureVerified,
  });

  if (req.method !== "POST" || req.url !== "/audit" || !signatureVerified) {
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: false }));
    return;
  }

  res.writeHead(202, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    ok: true,
    receiptId: `receipt-${parsed.event?.id || "unknown"}`,
  }));
});

await listen(server);
process.env.AUDIT_TRAIL_HTTP_URL = `http://127.0.0.1:${server.address().port}/audit`;

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    auditTrailSummary,
    createUser,
    loginUser,
    saveInvestorProfile,
  } = auth;

  const owner = (await createUser({
    name: "Owner",
    email: "owner@example.test",
    password: "strong-password-123",
  })).user;
  const customer = (await createUser({
    name: "Customer",
    email: "customer@example.test",
    password: "strong-password-123",
  })).user;
  await loginUser({
    email: "customer@example.test",
    password: "strong-password-123",
  });
  await saveInvestorProfile(customer.id, {
    goal: "wealth",
    experience: "beginner",
    riskLevel: "medium",
    monthlyBudget: 10000,
    horizonYears: 5,
  });

  const synced = await auditTrailSummary(owner.id);
  assertEqual(synced.status, "synced", "Fresh external provider mirror should be synced.");
  assertEqual(synced.external.enabled, true, "External audit provider should be enabled.");
  assertEqual(synced.external.endpointConfigured, true, "External audit endpoint should be configured.");
  assertEqual(synced.external.status, "synced", "External audit receipts should be synced.");
  assertEqual(synced.external.missingFromExternalCount, 0, "External receipts should cover every audit event.");
  assert(receivedEvents.length >= synced.stateEvents, "Local provider should receive every audit event at least once.");
  assert(receivedEvents.every((event) => event.signatureVerified), "Every external audit event should be HMAC signed.");

  await closeServer(server);
  await saveInvestorProfile(customer.id, {
    goal: "income",
    experience: "beginner",
    riskLevel: "low",
    monthlyBudget: 5000,
    horizonYears: 3,
  });

  const missing = await auditTrailSummary(owner.id);
  assertEqual(missing.status, "needs_review", "Unavailable provider should surface missing external receipts.");
  assertEqual(missing.external.status, "needs_review", "External provider readiness should need review.");
  assertEqual(missing.external.missingFromExternalCount, 1, "One new event should be missing from external receipts.");

  process.env.AUDIT_TRAIL_EXTERNAL_REQUIRED = "true";
  await expectReject(
    () => loginUser({
      email: "customer@example.test",
      password: "strong-password-123",
    }),
    "Required external audit provider should fail closed when unavailable.",
  );

  const report = {
    ok: true,
    tempRoot,
    synced: {
      status: synced.status,
      externalStatus: synced.external.status,
      stateEvents: synced.stateEvents,
      receiptEvents: synced.external.receiptEvents,
    },
    missing: {
      status: missing.status,
      externalStatus: missing.external.status,
      missingFromExternalCount: missing.external.missingFromExternalCount,
    },
    receivedEvents: receivedEvents.length,
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  if (server.listening) {
    await closeServer(server);
  }
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function listen(targetServer) {
  return new Promise((resolve) => {
    targetServer.listen(0, "127.0.0.1", resolve);
  });
}

function closeServer(targetServer) {
  return new Promise((resolve) => {
    targetServer.close(resolve);
  });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.setEncoding("utf8");
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function signBody(body, timestamp) {
  const digest = crypto
    .createHmac("sha256", externalSecret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
  return `v1=${digest}`;
}

async function expectReject(action, message) {
  try {
    await action();
  } catch {
    return;
  }

  throw new Error(message);
}

function assertEqual(actual, expected, message) {
  assert(actual === expected, message, { actual, expected });
}

function assert(condition, message, details = {}) {
  if (condition) {
    return;
  }

  throw new Error(`${message}\n${JSON.stringify(details, null, 2)}`);
}
