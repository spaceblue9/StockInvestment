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
  assertEqual(plans.launchMode, "starter_pro_manual_ready", "Public launch should declare Starter/Pro manual-ready mode.");
  assertEqual(plans.plans?.length, 2, "Public pricing should expose only Starter and Pro for the launch phase.");
  assertEqual(plans.plans.map((plan) => plan.id).join(","), "starter,pro", "Public checkout plans should be Starter and Pro only.");
  assert((plans.deferredPlans || []).some((plan) => plan.id === "advisor"), "Advisor should remain deferred for future/manual workflows.");

  const checkoutDisabled = await fetch(`${baseUrl}/api/subscription/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "starter" }),
  });
  assertEqual(checkoutDisabled.status, 401, "Checkout should still require login before manual package assignment.");

  const unauthPolicy = await fetch(`${baseUrl}/api/admin/policy`);
  assertEqual(unauthPolicy.status, 401, "Admin policy should require login.");

  const unauthOps = await fetch(`${baseUrl}/api/ops/readiness`);
  assertEqual(unauthOps.status, 401, "Operational readiness should require login.");

  const unauthPortfolioTemplate = await fetch(`${baseUrl}/api/analysis/template/portfolio`);
  assertEqual(unauthPortfolioTemplate.status, 401, "Anonymous users should not download portfolio templates.");

  const unauthWatchlistTemplate = await fetch(`${baseUrl}/api/analysis/template/watchlist`);
  assertEqual(unauthWatchlistTemplate.status, 401, "Anonymous users should not download watchlist templates.");

  const unauthRawDownload = await fetch(`${baseUrl}/api/analysis/raw`);
  assertEqual(unauthRawDownload.status, 401, "Anonymous users should not download raw analysis output.");

  const ownerRegister = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Web Smoke Owner",
    email: "web-smoke-owner@example.test",
    password: "password123",
  });
  assertEqual(ownerRegister.body.ok, true, "Owner registration should succeed for authenticated downloads.");
  const ownerCookie = cookieHeader(ownerRegister.response);

  await fs.mkdir(path.join(tempRoot, "data", "outputs"), { recursive: true });
  await fs.writeFile(path.join(tempRoot, "data", "outputs", "siamchart_raw.csv"), "Symbol,Price\nPTT,35\n", "utf8");
  const rawCsvDownload = await getTextWithHeaders(`${baseUrl}/api/analysis/raw`, ownerCookie);
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
  const coverageDownload = await getTextWithHeaders(`${baseUrl}/api/analysis/coverage`, ownerCookie);
  assert((coverageDownload.contentDisposition || "").includes("live_market_coverage_report.json"), "Coverage report should download as JSON.");
  assert(coverageDownload.text.includes('"targetFile": "raw_CSV.csv"'), "Coverage report should expose raw_CSV.csv in targetFile.");
  assert(!coverageDownload.text.includes("siamchart_raw.csv"), "Coverage report download should not expose the internal raw CSV compatibility filename.");

  const portfolioTemplate = await getBuffer(`${baseUrl}/api/analysis/template/portfolio`, ownerCookie);
  assert((portfolioTemplate.contentDisposition || "").includes("portfolio_template.xlsx"), "Portfolio template should download as portfolio_template.xlsx.");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(portfolioTemplate.buffer);
  const portfolioSheet = workbook.getWorksheet("Portfolio");
  assert(portfolioSheet, "Portfolio template should include a Portfolio sheet.");
  assertEqual(portfolioSheet.getRow(1).values.slice(1, 4).join("|"), "Symbol|Quantity|Avg_Price", "Portfolio template should contain the required blank input headers.");
  assertEqual(Boolean(portfolioSheet.getRow(2).hasValues), false, "Portfolio template should not include sample holding data.");

  const watchlistTemplate = await getTextWithHeaders(`${baseUrl}/api/analysis/template/watchlist`, ownerCookie);
  assert((watchlistTemplate.contentDisposition || "").includes("watchlist_template.txt"), "Watchlist template should download as watchlist_template.txt.");
  assert(watchlistTemplate.text.includes("วิธีกรอก"), "Watchlist template should include Thai fill instructions.");
  assert(watchlistTemplate.text.includes("# PTT"), "Watchlist template should include commented format examples.");
  assertEqual(parseWatchlistText(watchlistTemplate.text).length, 0, "Comment-only watchlist template should not produce symbols.");
  assertEqual(parseWatchlistText(`${watchlistTemplate.text}\nptt\ncpall`).join("|"), "PTT|CPALL", "Watchlist parser should ignore instructions and parse user tickers.");

  const htmlResponse = await getTextWithHeaders(`${baseUrl}/`);
  const html = htmlResponse.text;
  assert((htmlResponse.cacheControl || "").includes("no-store"), "Main HTML should send no-store cache headers so the browser does not reuse an old app.js reference.");
  assertIncludes(html, [
    "StockFlix",
    "Portfolio",
    "Screener",
    "Sector",
    "Download blank portfolio template",
    "Download watchlist guide template",
    "data-template-downloads",
    "Sign in to analyze",
    "Sign in before downloading templates, browsing files, or running analysis.",
    "Simulation",
    "data-frontend-version",
    "/app.js?v=20260703-1234",
  ], "Main HTML should expose the dashboard navigation.");
  assert(!html.includes('data-view="onboarding"'), "Launch navigation should not expose the hidden Guide view.");
  assert(!html.includes('data-view="approvals"'), "Launch navigation should not expose the deferred Approvals view.");

  const appJsResponse = await getTextWithHeaders(`${baseUrl}/app.js`);
  const appJs = appJsResponse.text;
  assert((appJsResponse.cacheControl || "").includes("no-store"), "app.js should send no-store cache headers so bug fixes load after restart.");
  assertIncludes(appJs, [
    "sectorFilter",
    "data-sector-filter",
    "tableColumnTips",
    "data-table-header-hint",
    "ค่าที่น่าเริ่มดู",
    "Portfolio_Risk",
    "Operational readiness",
    "data-manual-package-flow",
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
    "syncAnalysisAccess",
    "Sign in to analyze",
    "Create an account or sign in before downloading templates",
    "frontendBuildVersion",
    "20260703-1234",
    "canRunPortfolioAnalysis",
    "analysisPackageRequiredMessage",
    "Portfolio analysis requires Starter or Pro",
    "package required",
    "Analyze clicks",
    "handleDelegatedAnalysisClick",
    "pointerup",
    "updateFrontendDiagnostics",
    "Frontend version",
    "getAnalysisSelectedFiles",
    "handleAnalysisButtonClick",
    "Preparing your upload...",
    "isAttachedUploadFile",
    "The selected files could not be attached",
    "The browser could not prepare the upload",
    "renderUploadSummaryMessages",
    "Read portfolio file",
    "Combined unique symbols sent to market data",
    "setAnalysisButtonLoading",
    "startAnalysisProgressTimers",
    "Analysis is running. Please wait until the report links appear here.",
    "data-portfolio-data-warning",
    "Data_Status",
    "Data_Warnings",
    "Conflict_Severity",
    "Conflict_Alerts",
    "Quality_Score",
    "Valuation_Score",
    "Setup_Score",
    "Balance_Risk_Score",
    "Liquidity_Score",
    "Composite_Score_v2",
    "Composite Score v2",
    "Technical_RRR",
    "Fundamental_RRR",
    "Fundamental_RRR_Status",
    "Fundamental_RRR_Note",
    "Fundamental RRR Status",
    "INSUFFICIENT_DATA",
    "data-score-matrix-guide",
    "Score matrix แบบอ่านง่าย",
    "ไม่ได้แทน Total Score หรือ Target Action",
    "data-think2-safety-summary",
    "Safety check before acting",
    "severity-badge",
    "status-badge",
    "Conflict Severity",
    "Conflict Alerts",
    "data-recommended-actions-controls",
    "data-recommended-field-picker",
    "data-recommended-action-filter",
    "data-recommended-sector-filter",
    "data-recommended-score-band",
    "attachPortfolioVisualFilters",
    "data-sector-exposure-complete",
    "ไม่มีการรวมเป็น Other",
    "recommendedActionFields",
    "attachRecommendedActionsControls",
    "Order by",
    "Beginner filter guide",
    "data-screener-strict-defaults",
    "data-screener-symbol-search",
    "data-screener-default-score",
    "data-screener-default-rrr",
    "data-screener-default-de",
    "data-screener-quadrant-guide",
    "quadrant-zone-best",
    "zone-dot zone-best",
    "ขวาบน",
    "beginner defaults",
    "data-portfolio-quick-guidance",
    "data-screener-tooltip",
    "data-stock-highlight",
    "data-stock-row",
    "attachStockHighlightControls",
    "top-idea-point",
    "data-simulation-buy-mode",
    "data-simulation-split-input",
    "data-simulation-buy-plan",
    "data-simulation-growth-chart",
    "data-simulation-chart-guide",
    "strategy-line",
    "buy-hold-line",
    "Portfolio Growth: Strategy vs Buy & Hold",
    "วิธีอ่านกราฟนี้",
    "Split Buy",
    "data-sector-pro-intelligence",
    "data-sector-default-all",
    "All sectors overview",
    "ค่าเริ่มต้นแสดงทุกหุ้นในทุก sector",
    "data-sector-beginner-summary",
    "data-sector-advanced-table",
    "data-sector-ranking-panel",
    "data-sector-risk-panel",
    "data-sector-rotation-panel",
    "กลุ่มไหนน่าศึกษา",
    "พอร์ตกระจุกตรงไหน",
    "สัญญาณกลุ่มแบบอ่านง่าย",
    "ดูตารางตัวเลขขั้นสูง",
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
    "data-business-admin-cockpit",
    "data-business-section-tabs",
    "data-business-section-default",
    "Member Management",
    "data-member-management-focus",
    "data-business-advanced-ops",
    "data-member-management-row",
    "System Admin",
    "data-system-admin-panel",
    "data-system-admin-actions",
    "User Management",
    "data-user-management-panel",
    "data-admin-package-management",
    "data-delete-user",
    "deleteManagedUser",
    "Delete user",
    "team.user_deleted",
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
  ], "Frontend bundle should include recent SaaS interaction markers.");

  const styles = await getText(`${baseUrl}/styles.css`);
  assertIncludes(styles, [
    "--red: #e50914",
    ".panel",
    ".analysis-status",
    ".analysis-spinner",
    ".template-downloads",
    ".portfolio-data-warning",
    ".think2-safety-summary",
    ".severity-badge",
    ".status-badge",
    ".table-warning-text",
    ".score-matrix-guide",
    ".score-matrix-cards",
    ".score-matrix-card",
    ".table-control-panel",
    ".field-picker-grid",
    ".table-control-status",
    ".screener-beginner-guide",
    ".tooltip-trigger",
    ".tooltip-card",
    ".table-header-help",
    ".table-tooltip-card",
    ".simulation-growth-panel",
    ".simulation-chart-frame",
    ".chart-reading-guide",
    ".stock-chart-trigger",
    ".table-row-highlight",
    ".top-idea-point",
    ".sector-pro-panel",
    ".sector-beginner-summary",
    ".advanced-sector-details",
    ".sector-signal-grid",
    ".sector-signal-card",
    ".reference-master-panel",
    ".reference-master-table",
    ".database-mode-advisor",
    ".mode-status",
    ".advisor-warning-list",
    ".production-environment-advisor",
    ".env-status",
    ".env-group-grid",
    ".portfolio-health-panel",
    ".business-section-tabs",
    ".system-admin-panel",
    ".admin-action-grid",
    ".user-management-panel",
    ".danger-action",
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
      "anonymous-analysis-download-guard",
      "authenticated-analysis-downloads",
      "raw-csv-public-filename",
      "coverage-report-public-target-file",
      "blank-template-downloads",
      "main-html",
      "frontend-markers",
      "stylesheet-markers",
      "admin-user-delete-markers",
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

async function getTextWithHeaders(url, cookie = "") {
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    text: await response.text(),
    contentDisposition: response.headers.get("content-disposition") || "",
    cacheControl: response.headers.get("cache-control") || "",
  };
}

async function getBuffer(url, cookie = "") {
  const response = await fetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    buffer: Buffer.from(await response.arrayBuffer()),
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
