import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import ExcelJS from "exceljs";
import { parseWatchlistText } from "../src/services/inputService.js";
import { buildLiveMarketCoverageReport } from "../src/services/marketCoverageService.js";

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

  await fs.mkdir(path.join(tempRoot, "data", "outputs"), { recursive: true });
  await fs.writeFile(path.join(tempRoot, "data", "outputs", "siamchart_raw.csv"), "Symbol,Price\nPTT,35\n", "utf8");
  const rawCsvDownload = await getTextWithHeaders(`${baseUrl}/api/analysis/raw`);
  assert((rawCsvDownload.contentDisposition || "").includes("raw_CSV.csv"), "Raw CSV public download filename should be raw_CSV.csv.");
  assert(!String(rawCsvDownload.contentDisposition || "").includes("siamchart_raw.csv"), "Raw CSV public download filename should not expose siamchart_raw.csv.");
  assert(rawCsvDownload.text.includes("PTT"), "Raw CSV download should still serve the generated internal raw CSV content.");

  const coverageReport = buildLiveMarketCoverageReport([{ Symbol: "PTT", Sector: "Energy", PE: 10, ROE: 12, Yield: 3, DE: 0.6 }], {
    targetFile: path.join(tempRoot, "data", "outputs", "siamchart_raw.csv"),
    referenceBySymbol: new Map([["PTT", { Symbol: "PTT" }]]),
  });
  await fs.writeFile(
    path.join(tempRoot, "data", "outputs", "live_market_coverage_report.json"),
    `${JSON.stringify(coverageReport, null, 2)}\n`,
    "utf8",
  );
  const coverageDownload = await getTextWithHeaders(`${baseUrl}/api/analysis/coverage`);
  assert((coverageDownload.contentDisposition || "").includes("live_market_coverage_report.json"), "Coverage report should download as JSON.");
  assert(coverageDownload.text.includes('"targetFile": "raw_CSV.csv"'), "Coverage report should expose raw_CSV.csv in targetFile.");
  assert(!coverageDownload.text.includes("siamchart_raw.csv"), "Coverage report download should not expose the internal raw CSV compatibility filename.");

  const portfolioTemplate = await getBuffer(`${baseUrl}/api/analysis/template/portfolio`);
  assert((portfolioTemplate.contentDisposition || "").includes("portfolio_template.xlsx"), "Portfolio template should download as portfolio_template.xlsx.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(portfolioTemplate.buffer);
  const portfolioSheet = workbook.getWorksheet("Portfolio");
  assert(portfolioSheet, "Portfolio template should include a Portfolio sheet.");
  assertEqual(portfolioSheet.getRow(1).values.slice(1, 4).join("|"), "Symbol|Quantity|Avg_Price", "Portfolio template should contain the required blank input headers.");
  assertEqual(Boolean(portfolioSheet.getRow(2).hasValues), false, "Portfolio template should not include sample holding data.");

  const watchlistTemplate = await getTextWithHeaders(`${baseUrl}/api/analysis/template/watchlist`);
  assert((watchlistTemplate.contentDisposition || "").includes("watchlist_template.txt"), "Watchlist template should download as watchlist_template.txt.");
  assert(watchlistTemplate.text.includes("วิธีกรอก"), "Watchlist template should include Thai fill instructions.");
  assert(watchlistTemplate.text.includes("# PTT"), "Watchlist template should include commented format examples.");
  assertEqual(parseWatchlistText(watchlistTemplate.text).length, 0, "Comment-only watchlist template should not produce symbols.");
  assertEqual(parseWatchlistText(`${watchlistTemplate.text}\nptt\ncpall`).join("|"), "PTT|CPALL", "Watchlist parser should ignore instructions and parse user tickers.");

  const html = await getText(`${baseUrl}/`);
  assertIncludes(html, [
    "StockFlix",
    "Portfolio",
    "Approvals",
    "Screener",
    "Sector",
    "Download blank portfolio template",
    "Download watchlist guide template",
    "data-template-downloads",
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
    "Reference master launch evidence",
    "data-reference-master-launch-evidence",
    "Copy sign-off pack",
    "/api/admin/launch-evidence/export?format=json",
    "data-launch-evidence-download",
    "launch_evidence.export",
    "Download live data coverage report",
    "/api/analysis/coverage",
    "Download raw_CSV.csv",
    "setAnalysisButtonLoading",
    "startAnalysisProgressTimers",
    "Analysis is running. Please wait until the report links appear here.",
    "data-portfolio-data-warning",
    "data-recommended-actions-controls",
    "data-recommended-field-picker",
    "data-recommended-action-filter",
    "data-recommended-score-band",
    "attachPortfolioVisualFilters",
    "recommendedActionFields",
    "attachRecommendedActionsControls",
    "Order by",
    "Beginner filter guide",
    "data-screener-tooltip",
    "Score 60+",
    "RRR 1.5+",
    "D/E <= 1.0",
    "Reference Master Review",
    "/api/admin/reference-master",
    "data-reference-master-review",
    "reference_master.review",
    "Database mode advisor",
    "renderDatabaseModeAdvisor",
    "data-database-mode-advisor",
    "data-database-mode-commands",
    "Production environment advisor",
    "renderProductionEnvironmentAdvisor",
    "data-production-environment-advisor",
    "data-production-env-commands",
    "Portfolio Data Health",
    "System Admin",
    "data-system-admin-panel",
    "data-system-admin-actions",
    "User Management",
    "data-user-management-panel",
    "renderPortfolioDataHealth",
    "data-portfolio-health-panel",
    "data-portfolio-health-commands",
    "/api/admin/portfolio-health",
    "/api/admin/portfolio-health/export",
    "Download health CSV",
    "data-portfolio-health-export",
    "data-portfolio-health-controls",
    "data-portfolio-health-filter",
    "Search customer",
    "Reset view",
    "filterPortfolioHealthSnapshots",
    "portfolio_health.export",
    "Customer",
    "Workspace",
    "renderApprovalsView",
  ], "Frontend bundle should include recent SaaS interaction markers.");

  const styles = await getText(`${baseUrl}/styles.css`);
  assertIncludes(styles, [
    "--red: #e50914",
    ".panel",
    ".analysis-status",
    ".analysis-spinner",
    ".template-downloads",
    ".portfolio-data-warning",
    ".table-control-panel",
    ".field-picker-grid",
    ".table-control-status",
    ".screener-beginner-guide",
    ".tooltip-trigger",
    ".tooltip-card",
    ".reference-master-panel",
    ".reference-master-table",
    ".database-mode-advisor",
    ".mode-status",
    ".advisor-warning-list",
    ".production-environment-advisor",
    ".env-status",
    ".env-group-grid",
    ".portfolio-health-panel",
    ".system-admin-panel",
    ".admin-action-grid",
    ".user-management-panel",
    ".portfolio-health-command-list",
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
      "raw-csv-public-filename",
      "coverage-report-public-target-file",
      "blank-template-downloads",
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

async function getTextWithHeaders(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    text: await response.text(),
    contentDisposition: response.headers.get("content-disposition") || "",
  };
}

async function getBuffer(url) {
  const response = await fetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
    contentDisposition: response.headers.get("content-disposition") || "",
  };
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
