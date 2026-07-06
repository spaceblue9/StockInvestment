import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-backup-restore-"));

process.chdir(tempRoot);

try {
  const auth = await import(pathToFileURL(path.join(repoRoot, "src", "services", "authService.js")).href);
  const backupService = await import(pathToFileURL(path.join(repoRoot, "src", "services", "backupService.js")).href);
  const {
    checkoutSubscription,
    createUser,
    saveCustomerPortfolioSnapshot,
    saveInvestorProfile,
  } = auth;
  const {
    createLocalStateBackup,
    restoreLocalStateBackup,
    verifyLocalStateBackup,
  } = backupService;

  const owner = await createAccount(createUser, "Owner", "owner@example.test");
  const customer = await createAccount(createUser, "Customer", "customer@example.test");
  await saveInvestorProfile(customer.id, {
    goal: "wealth",
    experience: "beginner",
    riskLevel: "medium",
    monthlyBudget: 12000,
    horizonYears: 7,
  });
  await checkoutSubscription(customer.id, "pro");
  await saveCustomerPortfolioSnapshot(customer.id, samplePortfolio("AOT", 72000, 65000, 7000, 78));

  const backup = await createLocalStateBackup({ reason: "regression" });
  assert(backup.manifest.files.some((file) => file.name === "app-state.json"), "Backup should include app-state.json.");
  assert(backup.manifest.files.some((file) => file.name === "audit-events.ndjson"), "Backup should include audit trail mirror.");
  assertEqual(backup.manifest.recordCounts.users, 2, "Backup should count two users.");
  assertEqual(backup.manifest.recordCounts.portfolioSnapshots, 1, "Backup should count one portfolio snapshot.");
  assertEqual(backup.manifest.readiness.status, "ready", "Backup readiness should be ready.");

  const verified = await verifyLocalStateBackup(backup.backupDir);
  assertEqual(verified.recordCounts.billingEvents, 1, "Verified backup should include billing event.");

  const dryRun = await restoreLocalStateBackup({
    backupDir: backup.backupDir,
    dryRun: true,
  });
  assertEqual(dryRun.restored, false, "Dry-run should not restore.");
  assertEqual(dryRun.plan.recordCounts.users, 2, "Dry-run restore plan should expose user count.");

  await fs.writeFile(path.join(tempRoot, "data", "app-state.json"), JSON.stringify({ users: [] }, null, 2), "utf8");
  const emptyState = JSON.parse(await fs.readFile(path.join(tempRoot, "data", "app-state.json"), "utf8"));
  assertEqual(emptyState.users.length, 0, "State should be intentionally emptied before restore.");

  await expectReject(
    () => restoreLocalStateBackup({
      backupDir: backup.backupDir,
      dryRun: false,
      confirm: false,
    }),
    "Restore without confirm should be rejected.",
  );

  const restored = await restoreLocalStateBackup({
    backupDir: backup.backupDir,
    confirm: true,
  });
  assertEqual(restored.restored, true, "Confirmed restore should restore data.");
  assert(restored.plan.safetyBackupDir, "Confirmed restore should create a safety backup.");
  const restoredState = JSON.parse(await fs.readFile(path.join(tempRoot, "data", "app-state.json"), "utf8"));
  assertEqual(restoredState.users.length, 2, "Restore should bring users back.");
  assertEqual(restoredState.portfolioSnapshots.length, 1, "Restore should bring portfolio snapshot back.");
  assertEqual(restoredState.billingEvents.length, 1, "Restore should bring billing event back.");

  await fs.writeFile(path.join(backup.backupDir, "app-state.json"), JSON.stringify({ users: [] }), "utf8");
  await expectReject(
    () => verifyLocalStateBackup(backup.backupDir),
    "Corrupted backup file should fail checksum verification.",
  );

  console.log(JSON.stringify({
    ok: true,
    tempRoot,
    backupDir: backup.backupDir,
    restored: restored.restored,
    safetyBackupCreated: Boolean(restored.plan.safetyBackupDir),
    recordCounts: {
      users: restoredState.users.length,
      portfolioSnapshots: restoredState.portfolioSnapshots.length,
      billingEvents: restoredState.billingEvents.length,
    },
  }, null, 2));
} finally {
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

async function createAccount(createUser, name, email) {
  const result = await createUser({
    name,
    email,
    password: "strong-password-123",
  });
  return result.user;
}

function samplePortfolio(symbol, marketValue, costValue, gainLossValue, totalScore) {
  return {
    portfolioRows: [{
      Symbol: symbol,
      Market_Value: marketValue,
      Cost_Value: costValue,
      Gain_Loss_Value: gainLossValue,
      Gain_Loss_Pct: costValue ? (gainLossValue / costValue) * 100 : 0,
      Total_Score: totalScore,
      Advice: totalScore >= 70 ? "Hold" : "Watch",
      Target_Action: totalScore >= 70 ? "Hold" : "Review",
    }],
    recommendations: [{
      Symbol: symbol,
      Total_Score: totalScore,
    }],
    outputs: {
      report: `${symbol.toLowerCase()}_analysis_report.xlsx`,
    },
  };
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
