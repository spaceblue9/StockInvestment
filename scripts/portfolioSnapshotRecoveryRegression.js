import fs from "fs/promises";
import os from "os";
import path from "path";
import {
  portfolioSnapshotHealthSummary,
  recoverZeroMarketPortfolioSnapshots,
  renderPortfolioSnapshotHealthCsv,
  renderPortfolioSnapshotRecoveryText,
} from "../src/services/portfolioSnapshotRecoveryService.js";

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-portfolio-recovery-"));

try {
  const zeroSnapshot = sampleZeroSnapshot("user_zero", "PTT");
  const healthySnapshot = {
    ...sampleZeroSnapshot("user_healthy", "AOT"),
    summary: { holdings: 1, marketValue: 6600, costValue: 6100, gainLoss: 500, gainLossPct: 8.2, avgScore: 72, urgentActions: 0 },
    portfolioRows: [{
      Symbol: "AOT",
      Quantity: 100,
      Avg_Price: 61,
      Market_Value: 6600,
      Cost_Value: 6100,
      Gain_Loss_Value: 500,
      Total_Score: 72,
      Advice: "Hold",
      Target_Action: "Hold",
    }],
  };
  const state = {
    users: [
      {
        id: "user_zero",
        name: "Zero Market Customer",
        email: "zero@example.test",
        role: "customer",
        organizationId: "org_user_zero",
        subscription: { plan: "pro", status: "active" },
      },
      {
        id: "user_healthy",
        name: "Healthy Customer",
        email: "healthy@example.test",
        role: "customer",
        organizationId: "org_user_healthy",
        subscription: { plan: "starter", status: "trialing" },
      },
    ],
    organizations: [
      { id: "org_user_zero", name: "Zero Workspace" },
      { id: "org_user_healthy", name: "Healthy Workspace" },
    ],
    portfolioSnapshots: [zeroSnapshot, healthySnapshot],
  };
  const referenceBySymbol = new Map([
    ["PTT", referenceRow("PTT", "Energy", 35, 80)],
    ["AOT", referenceRow("AOT", "Transport", 66, 72)],
  ]);

  const dryRun = await recoverZeroMarketPortfolioSnapshots({
    state: structuredClone(state),
    referenceBySymbol,
    now: "2026-06-12T06:18:00.000Z",
  });
  assertEqual(dryRun.mode, "dry_run", "Default recovery should be dry-run.");
  assertEqual(dryRun.checkedSnapshots, 1, "Recovery should only target zero-market snapshots.");
  assertEqual(dryRun.repairableSnapshots, 1, "Recovery should repair one snapshot.");
  assertEqual(dryRun.repaired[0].userId, "user_zero", "Dry-run should identify the affected user.");
  assert(dryRun.repaired[0].after.marketValue > 0, "Dry-run summary should show recovered market value.");
  assertEqual(state.portfolioSnapshots[0].summary.marketValue, 0, "Dry-run must not mutate source state.");

  const dryRunText = renderPortfolioSnapshotRecoveryText(dryRun);
  assert(dryRunText.includes("Run again with --confirm"), "Dry-run text should explain confirm step.");

  const health = await portfolioSnapshotHealthSummary({
    state: structuredClone(state),
    referenceBySymbol,
    now: "2026-06-12T06:18:30.000Z",
  });
  assertEqual(health.mode, "read_only", "Portfolio health summary should be read-only.");
  assertEqual(health.totalSnapshots, 2, "Portfolio health summary should count all snapshots.");
  assertEqual(health.healthySnapshots, 1, "Portfolio health summary should count healthy snapshots.");
  assertEqual(health.zeroMarketSnapshots, 1, "Portfolio health summary should count zero-market snapshots.");
  assertEqual(health.repairableSnapshots, 1, "Portfolio health summary should surface repairable snapshots.");
  assertEqual(health.status, "needs_recovery", "Repairable snapshots should set needs_recovery status.");
  assert(health.commands.some((command) => command.includes("--confirm")), "Portfolio health summary should include confirm command only when repairable.");
  assert(health.snapshots.some((snapshot) => snapshot.status === "repairable"), "Recent snapshot rows should mark repairable records.");
  const zeroHealthRow = health.snapshots.find((snapshot) => snapshot.userId === "user_zero");
  assertEqual(zeroHealthRow.customerName, "Zero Market Customer", "Portfolio health should include customer support name.");
  assertEqual(zeroHealthRow.customerEmail, "zero@example.test", "Portfolio health should include customer support email.");
  assertEqual(zeroHealthRow.workspaceName, "Zero Workspace", "Portfolio health should include workspace name.");
  assertEqual(zeroHealthRow.subscriptionPlan, "pro", "Portfolio health should include customer subscription plan.");
  const healthCsv = renderPortfolioSnapshotHealthCsv(health);
  assert(healthCsv.includes("Customer,Email,Workspace,Plan"), "Portfolio health CSV should include support context headers.");
  assert(healthCsv.includes("Zero Market Customer,zero@example.test,Zero Workspace,pro"), "Portfolio health CSV should include support context row.");

  const stateFile = path.join(tempRoot, "data", "app-state.json");
  await fs.mkdir(path.dirname(stateFile), { recursive: true });
  await fs.writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  const confirmState = structuredClone(state);
  const confirmed = await recoverZeroMarketPortfolioSnapshots({
    confirm: true,
    state: confirmState,
    referenceBySymbol,
    stateFile,
    now: "2026-06-12T06:19:00.000Z",
  });
  assertEqual(confirmed.mode, "confirm", "Confirmed recovery should report confirm mode.");
  assertEqual(confirmed.repairableSnapshots, 1, "Confirmed recovery should repair one snapshot.");
  assert(confirmed.backupFile.includes("app-state-before-portfolio-recovery"), "Confirmed recovery should create a local safety backup when a state file exists.");
  assert(confirmState.portfolioSnapshots[0].summary.marketValue > 0, "Confirmed recovery should mutate supplied state before write.");
  assertEqual(confirmState.portfolioSnapshots[1].summary.marketValue, 6600, "Confirmed recovery should leave healthy snapshots unchanged.");

  const skipped = await recoverZeroMarketPortfolioSnapshots({
    state: { portfolioSnapshots: [sampleZeroSnapshot("user_missing", "ZZZ")] },
    referenceBySymbol,
  });
  assertEqual(skipped.repairableSnapshots, 0, "Missing reference rows should not be repaired.");
  assertEqual(skipped.skippedSnapshots, 1, "Missing reference rows should be reported as skipped.");

  const missingReferenceHealth = await portfolioSnapshotHealthSummary({
    state: { portfolioSnapshots: [sampleZeroSnapshot("user_missing", "ZZZ")] },
    referenceBySymbol,
  });
  assertEqual(missingReferenceHealth.status, "needs_reference", "Missing reference rows should surface needs_reference status.");
  assert(!missingReferenceHealth.commands.some((command) => command.includes("--confirm")), "Health summary should not include confirm command when nothing is repairable.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "dry-run-detects-zero-market-snapshot",
      "dry-run-does-not-mutate-state",
      "portfolio-health-summary-read-only",
      "portfolio-health-repairable-status",
      "portfolio-health-missing-reference-status",
      "portfolio-health-support-context",
      "portfolio-health-csv-export",
      "confirm-repairs-snapshot",
      "confirm-safety-backup",
      "healthy-snapshot-unchanged",
      "missing-reference-skipped",
    ],
  }, null, 2));
} finally {
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function sampleZeroSnapshot(userId, symbol) {
  return {
    userId,
    organizationId: `org_${userId}`,
    generatedAt: "2026-06-12T02:56:40.000Z",
    summary: {
      holdings: 1,
      marketValue: 0,
      costValue: 3200,
      gainLoss: -3200,
      gainLossPct: -100,
      avgScore: 0,
      urgentActions: 0,
    },
    portfolioRows: [{
      Symbol: symbol,
      Quantity: 100,
      Avg_Price: 32,
      Market_Value: 0,
      Cost_Value: 3200,
      Gain_Loss_Value: -3200,
      Total_Score: null,
      Advice: "No Data",
      Target_Action: "No Data",
    }],
    recommendations: [],
    outputs: {},
  };
}

function referenceRow(symbol, sector, price, score) {
  return {
    Symbol: symbol,
    Sector: sector,
    Price: price,
    PE: 10,
    PBV: 1.2,
    Yield: 4,
    ROE: 12,
    High_52W: price * 1.2,
    Low_52W: price * 0.8,
    RSI: 55,
    DE: 0.6,
    Volume: 1200000,
    Avg_Vol_10D: 1100000,
    Total_Score: score,
    Trend_Status: "Uptrend",
    Entry_Zone_Low: price * 0.8,
    Entry_Zone_High: price * 0.84,
    Exit_Zone_Low: price * 1.16,
    Exit_Zone_High: price * 1.2,
    Stop_Loss: price * 0.76,
    Upside_Pct: 10,
    RRR: 2,
  };
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
