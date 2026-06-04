import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-audit-trail-"));
const auditTrailFile = path.join(tempRoot, "data", "audit-events.ndjson");

process.chdir(tempRoot);

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
  assertEqual(synced.status, "synced", "Fresh audit trail mirror should be synced.");
  assert(synced.stateEvents >= 4, "Expected audit events from register/login/profile flow.");
  assertEqual(synced.stateEvents, synced.trailEvents, "Audit trail should mirror every state audit event.");
  assertEqual(synced.missingFromTrailCount, 0, "Synced trail should have no missing events.");
  assertEqual(synced.invalidLineCount, 0, "Synced trail should have no invalid lines.");

  await expectReject(
    () => auditTrailSummary(customer.id),
    "Customer must not access external audit trail status.",
  );

  const lines = (await fs.readFile(auditTrailFile, "utf8"))
    .trim()
    .split(/\r?\n/);
  await fs.writeFile(auditTrailFile, `${lines.slice(0, -1).join("\n")}\n`, "utf8");
  const missing = await auditTrailSummary(owner.id);
  assertEqual(missing.status, "needs_review", "Missing mirror event should need review.");
  assertEqual(missing.missingFromTrailCount, 1, "Missing mirror event should be counted.");

  await fs.appendFile(auditTrailFile, "not-json\n", "utf8");
  const invalid = await auditTrailSummary(owner.id);
  assertEqual(invalid.status, "needs_review", "Invalid NDJSON line should need review.");
  assertEqual(invalid.invalidLineCount, 1, "Invalid NDJSON line should be counted.");

  const report = {
    ok: true,
    tempRoot,
    synced: {
      status: synced.status,
      stateEvents: synced.stateEvents,
      trailEvents: synced.trailEvents,
    },
    missing: {
      status: missing.status,
      missingFromTrailCount: missing.missingFromTrailCount,
    },
    invalid: {
      status: invalid.status,
      invalidLineCount: invalid.invalidLineCount,
    },
  };

  console.log(JSON.stringify(report, null, 2));
} finally {
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
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
