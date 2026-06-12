import fs from "fs/promises";
import path from "path";
import { analyzeHolding } from "./portfolioService.js";
import { loadReferenceMarketData } from "./referenceDataService.js";
import { DATA_DIR } from "./pathService.js";
import { readAppState, writeAppState } from "./stateRepository.js";

const DEFAULT_STATE_FILE = path.join(DATA_DIR, "app-state.json");

export async function recoverZeroMarketPortfolioSnapshots(options = {}) {
  const {
    confirm = false,
    userId = "",
    now = new Date().toISOString(),
    state = null,
    referenceBySymbol = null,
    stateFile = DEFAULT_STATE_FILE,
  } = options;
  const hasInjectedState = Boolean(state);
  const hasExplicitStateFile = Object.prototype.hasOwnProperty.call(options, "stateFile");
  const appState = state || await readAppState();
  const references = referenceBySymbol || await loadReferenceMarketData();
  const snapshots = Array.isArray(appState.portfolioSnapshots) ? appState.portfolioSnapshots : [];
  const candidates = snapshots
    .filter((snapshot) => !userId || snapshot.userId === userId)
    .filter(isZeroMarketSnapshot);
  const repairedSnapshots = [];
  const skippedSnapshots = [];

  for (const snapshot of candidates) {
    const repairedRows = [];
    const missingSymbols = [];

    for (const row of snapshot.portfolioRows || []) {
      const symbol = String(row.Symbol || "").trim().toUpperCase();
      const referenceRow = references.get(symbol);
      if (!symbol || !referenceRow) {
        missingSymbols.push(symbol || "(blank)");
        repairedRows.push(row);
        continue;
      }

      repairedRows.push(analyzeHolding({
        Symbol: symbol,
        Quantity: numberValue(row.Quantity),
        Avg_Price: numberValue(row.Avg_Price),
      }, referenceRow));
    }

    const repairedMarketRows = repairedRows.filter((row) => numberValue(row.Market_Value) > 0);
    if (repairedMarketRows.length === 0) {
      skippedSnapshots.push({
        userId: snapshot.userId,
        reason: "no_reference_market_rows",
        holdings: (snapshot.portfolioRows || []).length,
        missingSymbols,
      });
      continue;
    }

    const repairedSnapshot = {
      ...snapshot,
      recoveredAt: now,
      recoverySource: "reference_fallback",
      summary: buildPortfolioSummary(repairedRows),
      portfolioRows: repairedRows,
      recommendations: referenceRecommendations(references),
    };
    repairedSnapshots.push({
      userId: snapshot.userId,
      holdings: repairedRows.length,
      repairedMarketRows: repairedMarketRows.length,
      missingSymbols,
      before: snapshot.summary || {},
      after: repairedSnapshot.summary,
      snapshot: repairedSnapshot,
    });
  }

  let backupFile = "";
  if (confirm && repairedSnapshots.length > 0) {
    const shouldWriteInjectedStateFile = hasInjectedState && hasExplicitStateFile;
    const shouldWriteRepository = !hasInjectedState;
    if (shouldWriteInjectedStateFile || shouldWriteRepository) {
      await createLocalStateBackup(stateFile, now).then((file) => {
        backupFile = file;
      }).catch(() => {
        backupFile = "";
      });
    }

    const repairedByUserId = new Map(repairedSnapshots.map((item) => [item.userId, item.snapshot]));
    appState.portfolioSnapshots = snapshots.map((snapshot) => repairedByUserId.get(snapshot.userId) || snapshot);
    if (shouldWriteInjectedStateFile) {
      await fs.writeFile(stateFile, `${JSON.stringify(appState, null, 2)}\n`, "utf8");
    } else if (shouldWriteRepository) {
      await writeAppState(appState);
    }
  }

  return {
    ok: true,
    mode: confirm ? "confirm" : "dry_run",
    checkedSnapshots: candidates.length,
    repairableSnapshots: repairedSnapshots.length,
    skippedSnapshots: skippedSnapshots.length,
    backupFile,
    repaired: repairedSnapshots.map(({ snapshot, ...item }) => item),
    skipped: skippedSnapshots,
  };
}

export async function portfolioSnapshotHealthSummary(options = {}) {
  const {
    userId = "",
    now = new Date().toISOString(),
    state = null,
    referenceBySymbol = null,
  } = options;
  const appState = state || await readAppState();
  const snapshots = Array.isArray(appState.portfolioSnapshots) ? appState.portfolioSnapshots : [];
  const usersById = new Map((appState.users || []).map((user) => [user.id, user]));
  const organizationsById = new Map((appState.organizations || []).map((organization) => [organization.id, organization]));
  const scopedSnapshots = snapshots.filter((snapshot) => !userId || snapshot.userId === userId);
  const recovery = await recoverZeroMarketPortfolioSnapshots({
    confirm: false,
    userId,
    now,
    state: appState,
    referenceBySymbol,
  });
  const repairableUserIds = new Set((recovery.repaired || []).map((item) => item.userId));
  const skippedUserIds = new Set((recovery.skipped || []).map((item) => item.userId));
  const zeroMarketSnapshots = scopedSnapshots.filter(isZeroMarketSnapshot);
  const emptySnapshots = scopedSnapshots.filter((snapshot) => !Array.isArray(snapshot.portfolioRows) || snapshot.portfolioRows.length === 0);
  const healthySnapshots = scopedSnapshots.filter((snapshot) => {
    const rows = Array.isArray(snapshot.portfolioRows) ? snapshot.portfolioRows : [];
    return rows.length > 0 && !isZeroMarketSnapshot(snapshot);
  });
  const snapshotRows = scopedSnapshots
    .slice()
    .sort((left, right) => new Date(right.generatedAt || 0) - new Date(left.generatedAt || 0))
    .slice(0, 12)
    .map((snapshot) => {
      const rows = Array.isArray(snapshot.portfolioRows) ? snapshot.portfolioRows : [];
      const user = usersById.get(snapshot.userId) || {};
      const organizationId = snapshot.organizationId || user.organizationId || "";
      const organization = organizationsById.get(organizationId) || {};
      const zeroMarket = isZeroMarketSnapshot(snapshot);
      const status = !rows.length
        ? "empty"
        : repairableUserIds.has(snapshot.userId)
          ? "repairable"
          : skippedUserIds.has(snapshot.userId)
            ? "needs_reference"
            : zeroMarket
              ? "needs_review"
              : "healthy";
      return {
        userId: snapshot.userId,
        shortUserId: shortId(snapshot.userId),
        customerName: user.name || snapshot.userId || "Unknown customer",
        customerEmail: user.email || "",
        customerRole: user.role || "",
        subscriptionPlan: user.subscription?.plan || "",
        subscriptionStatus: user.subscription?.status || "",
        organizationId,
        workspaceName: organization.name || organizationId || "",
        generatedAt: snapshot.generatedAt || "",
        holdings: rows.length,
        marketValue: roundNumber(snapshot.summary?.marketValue || 0),
        costValue: roundNumber(snapshot.summary?.costValue || 0),
        gainLossPct: roundNumber(snapshot.summary?.gainLossPct || 0),
        status,
        recoveredAt: snapshot.recoveredAt || "",
      };
    });
  const commands = [
    userId
      ? `npm run portfolio:recover-zero-market -- --user-id ${userId} --format text`
      : "npm run portfolio:recover-zero-market -- --format text",
  ];
  if (recovery.repairableSnapshots > 0) {
    commands.push(userId
      ? `npm run portfolio:recover-zero-market -- --user-id ${userId} --confirm --format text`
      : "npm run portfolio:recover-zero-market -- --confirm --format text");
  }
  const status = recovery.repairableSnapshots > 0
    ? "needs_recovery"
    : recovery.skippedSnapshots > 0
      ? "needs_reference"
      : zeroMarketSnapshots.length > 0
        ? "needs_review"
        : "healthy";

  return {
    ok: true,
    generatedAt: now,
    mode: "read_only",
    status,
    plainLanguageSummary: portfolioHealthSummaryText({
      status,
      totalSnapshots: scopedSnapshots.length,
      repairableSnapshots: recovery.repairableSnapshots,
      skippedSnapshots: recovery.skippedSnapshots,
    }),
    totalSnapshots: scopedSnapshots.length,
    healthySnapshots: healthySnapshots.length,
    emptySnapshots: emptySnapshots.length,
    zeroMarketSnapshots: zeroMarketSnapshots.length,
    repairableSnapshots: recovery.repairableSnapshots,
    skippedSnapshots: recovery.skippedSnapshots,
    repaired: recovery.repaired || [],
    skipped: recovery.skipped || [],
    snapshots: snapshotRows,
    commands,
    safeguards: [
      "This admin summary is read-only and never writes customer portfolio data.",
      "Run dry-run first and review affected users before using --confirm.",
      "Confirmed recovery creates a local safety backup for file-backed state.",
    ],
  };
}

export function renderPortfolioSnapshotHealthCsv(health) {
  const columns = [
    ["Customer", "customerName"],
    ["Email", "customerEmail"],
    ["Workspace", "workspaceName"],
    ["Plan", "subscriptionPlan"],
    ["Subscription Status", "subscriptionStatus"],
    ["Status", "status"],
    ["Holdings", "holdings"],
    ["Market Value", "marketValue"],
    ["Cost Value", "costValue"],
    ["Gain/Loss %", "gainLossPct"],
    ["Generated At", "generatedAt"],
    ["Recovered At", "recoveredAt"],
    ["User ID", "userId"],
  ];
  const lines = [
    columns.map(([label]) => csvEscape(label)).join(","),
    ...((health?.snapshots || []).map((snapshot) => (
      columns.map(([, key]) => csvEscape(snapshot[key] ?? "")).join(",")
    ))),
  ];
  return `${lines.join("\n")}\n`;
}

export function renderPortfolioSnapshotRecoveryText(result) {
  const lines = [
    `Portfolio snapshot recovery ${result.mode}`,
    `checked snapshots: ${result.checkedSnapshots}`,
    `repairable snapshots: ${result.repairableSnapshots}`,
    `skipped snapshots: ${result.skippedSnapshots}`,
  ];

  if (result.backupFile) {
    lines.push(`backup: ${result.backupFile}`);
  }

  for (const item of result.repaired || []) {
    lines.push(`- ${item.userId}: ${item.repairedMarketRows}/${item.holdings} holdings recovered, market value ${roundNumber(item.before.marketValue || 0)} -> ${roundNumber(item.after.marketValue || 0)}`);
    if (item.missingSymbols?.length) {
      lines.push(`  missing reference: ${item.missingSymbols.join(", ")}`);
    }
  }

  for (const item of result.skipped || []) {
    lines.push(`- skipped ${item.userId}: ${item.reason}`);
  }

  if (result.mode === "dry_run" && result.repairableSnapshots > 0) {
    lines.push("Run again with --confirm to write repaired snapshots.");
  }

  return `${lines.join("\n")}\n`;
}

function portfolioHealthSummaryText(summary) {
  if (!summary.totalSnapshots) {
    return "No saved portfolio snapshots yet. Ask customers to run analysis after uploading a portfolio template.";
  }
  if (summary.repairableSnapshots > 0) {
    return `${summary.repairableSnapshots} snapshot(s) can be recovered from reference data. Run the dry-run command before confirm.`;
  }
  if (summary.skippedSnapshots > 0) {
    return `${summary.skippedSnapshots} snapshot(s) need reference data before recovery can rebuild market values.`;
  }
  if (summary.status === "needs_review") {
    return "Some snapshots look incomplete and should be reviewed before customer support responds.";
  }
  return "Saved portfolio snapshots look healthy. No zero-market recovery is needed right now.";
}

function isZeroMarketSnapshot(snapshot) {
  const rows = Array.isArray(snapshot.portfolioRows) ? snapshot.portfolioRows : [];
  if (rows.length === 0) {
    return false;
  }

  const marketValue = numberValue(snapshot.summary?.marketValue);
  const rowsWithMarketValue = rows.filter((row) => numberValue(row.Market_Value) > 0).length;
  const noDataRows = rows.filter((row) => /No Data/i.test(String(row.Advice || row.Target_Action || ""))).length;
  return marketValue === 0 || rowsWithMarketValue === 0 || noDataRows === rows.length;
}

function referenceRecommendations(referenceBySymbol) {
  return [...referenceBySymbol.values()]
    .filter((row) => row.Symbol)
    .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))
    .slice(0, 25);
}

function buildPortfolioSummary(rows) {
  const marketValue = sum(rows, "Market_Value");
  const costValue = sum(rows, "Cost_Value");
  const gainLoss = sum(rows, "Gain_Loss_Value");
  const gainLossPct = costValue ? (gainLoss / costValue) * 100 : 0;
  const avgScore = rows.length ? sum(rows, "Total_Score") / rows.length : 0;
  const urgentActions = rows.filter((row) => /Exit|Reduce|Sell/i.test(String(row.Target_Action || row.Advice || ""))).length;

  return {
    holdings: rows.length,
    marketValue,
    costValue,
    gainLoss,
    gainLossPct,
    avgScore,
    urgentActions,
  };
}

async function createLocalStateBackup(stateFile, now) {
  const source = path.resolve(stateFile);
  const backupDir = path.join(path.dirname(source), "backups");
  const safeTimestamp = now.replace(/[:.]/g, "-");
  const backupFile = path.join(backupDir, `app-state-before-portfolio-recovery-${safeTimestamp}.json`);
  await fs.mkdir(backupDir, { recursive: true });
  await fs.copyFile(source, backupFile);
  return path.relative(process.cwd(), backupFile);
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0);
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function roundNumber(value) {
  return Math.round(numberValue(value) * 100) / 100;
}

function shortId(value) {
  return String(value || "").slice(0, 8);
}

function csvEscape(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/u.test(text)) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
}
