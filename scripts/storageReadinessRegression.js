import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-storage-readiness-"));
const stateFile = path.join(tempRoot, "data", "app-state.json");

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const {
    checkoutSubscription,
    createPaymentSession,
    createUser,
    saveCustomerPortfolioSnapshot,
    saveInvestorProfile,
    storageReadinessSummary,
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

  await saveInvestorProfile(customer.id, {
    goal: "wealth",
    experience: "beginner",
    riskLevel: "medium",
    monthlyBudget: 10000,
    horizonYears: 5,
  });
  await saveCustomerPortfolioSnapshot(customer.id, {
    portfolioRows: [{
      Symbol: "AOT",
      Market_Value: 72000,
      Cost_Value: 65000,
      Gain_Loss_Value: 7000,
      Total_Score: 78,
      Target_Action: "Hold",
    }],
    recommendations: [{ Symbol: "AOT", Total_Score: 78 }],
    outputs: { report: "aot_analysis_report.xlsx" },
  });
  await checkoutSubscription(customer.id, "pro");
  await createPaymentSession(customer.id, "starter");

  const ready = await storageReadinessSummary(owner.id);
  assertEqual(ready.readiness.status, "ready", "Fresh normalized state should be ready for database mapping.");
  assertEqual(ready.readiness.blockerCount, 0, "Ready state should have no blockers.");
  assertEqual(ready.readiness.warningCount, 0, "Ready state should have no warnings.");
  assertEqual(ready.schema.collections.length, ready.readiness.collectionCount, "Schema and readiness collection counts should match.");
  assert(ready.schema.collections.some((collection) => collection.name === "auditEvents" && collection.appendOnly), "Audit events should be marked append-only.");

  await expectReject(
    () => storageReadinessSummary(customer.id),
    "Customer must not access storage readiness.",
  );

  const rawState = JSON.parse(await fs.readFile(stateFile, "utf8"));
  rawState.users.push({
    ...rawState.users.find((user) => user.id === customer.id),
    email: "customer-copy@example.test",
  });
  rawState.billingEvents.push({
    id: "orphan_billing_event",
    userId: "missing_user",
    organizationId: "missing_org",
    invoiceNumber: "ORPHAN-1",
    planId: "pro",
    planName: "Pro",
    amountThb: 1490,
    currency: "THB",
    status: "paid",
    provider: "local_gateway",
    createdAt: new Date().toISOString(),
  });
  await fs.writeFile(stateFile, `${JSON.stringify(rawState, null, 2)}\n`, "utf8");

  const blocked = await storageReadinessSummary(owner.id);
  assertEqual(blocked.readiness.status, "blocked", "Corrupted state should be blocked.");
  assert(blocked.readiness.blockerCount >= 2, "Corrupted state should report multiple blockers.");
  assert(
    blocked.readiness.issues.some((issue) => issue.collection === "users" && issue.type === "duplicate_primary_key"),
    "Duplicate user id should be reported.",
  );
  assert(
    blocked.readiness.issues.some((issue) => issue.collection === "billingEvents" && issue.type === "dangling_reference"),
    "Orphan billing event should be reported.",
  );

  const report = {
    ok: true,
    tempRoot,
    ready: {
      status: ready.readiness.status,
      totalRecords: ready.readiness.totalRecords,
      collectionCount: ready.readiness.collectionCount,
      blockerCount: ready.readiness.blockerCount,
      warningCount: ready.readiness.warningCount,
      schemaVersion: ready.readiness.schemaVersion,
    },
    blocked: {
      status: blocked.readiness.status,
      blockerCount: blocked.readiness.blockerCount,
      issueTypes: blocked.readiness.issues.map((issue) => `${issue.collection}:${issue.type}:${issue.count}`),
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
