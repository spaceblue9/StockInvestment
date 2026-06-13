import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const html = await fs.readFile(path.join(repoRoot, "src", "public", "index.html"), "utf8");
const styles = await fs.readFile(path.join(repoRoot, "src", "public", "styles.css"), "utf8");
const appJs = await fs.readFile(path.join(repoRoot, "src", "public", "app.js"), "utf8");

assertIncludes(html, [
  '<meta name="viewport" content="width=device-width, initial-scale=1">',
  "StockFlix Investor Studio",
  'data-view="portfolio"',
  'data-view="business"',
  'data-analysis-progress',
  'data-template-downloads',
  'Download watchlist guide template',
  '/api/analysis/template/portfolio',
  '/api/analysis/template/watchlist',
  'aria-live="polite"',
], "HTML should expose viewport meta, brand, and primary dashboard navigation.");

assertIncludes(styles, [
  "overflow-x: hidden;",
  "max-width: 100%;",
  "overflow-wrap: anywhere;",
  "@media (max-width: 980px)",
  ".section-title",
  ".section-title > * + *",
  "@media (max-width: 640px)",
  ".view-grid button",
  ".analysis-status",
  ".analysis-spinner",
  ".template-downloads",
  ".reference-master-panel",
  ".reference-master-table input",
  ".reference-launch-evidence",
  ".evidence-marker-list",
  ".screener-beginner-guide",
  ".tooltip-trigger",
  ".tooltip-card",
  ".table-control-panel",
  ".field-picker-grid",
  ".table-control-status",
  ".portfolio-data-warning",
  ".database-mode-advisor",
  ".mode-status",
  ".advisor-warning-list",
  ".production-environment-advisor",
  ".env-status",
  ".env-group-grid",
  ".system-admin-panel",
  ".admin-action-grid",
  ".user-management-panel",
  "min-height: 44px;",
], "Stylesheet should include responsive viewport and tap-target safeguards.");

assertIncludes(styles, [
  "--red: #e50914",
  "grid-template-columns: minmax(300px, 380px) 1fr",
  "grid-template-columns: 1fr;",
  ".table-wrap",
  "overflow: auto;",
], "Stylesheet should keep desktop SaaS layout and table overflow guardrails.");

assertIncludes(appJs, [
  "renderBusinessView",
  "renderPortfolioView",
  "renderScreenerView",
  "renderSectorView",
  "renderSimulationView",
  "ops-alert-card",
  "renderLockedFeature",
  "data-upgrade-plan",
  "setAnalysisButtonLoading",
  "startAnalysisProgressTimers",
  "Analyzing your portfolio",
  "data-recommended-actions-controls",
  "data-recommended-field-picker",
  "data-recommended-action-filter",
  "data-recommended-score-band",
  "attachPortfolioVisualFilters",
  "recommendedActionFields",
  "attachRecommendedActionsControls",
  "data-portfolio-data-warning",
  "Market data was unavailable in the last run.",
  "Order by",
  "data-screener-beginner-guidance",
  "data-screener-tooltip",
  "Score 60+",
  "RRR 1.5+",
  "D/E <= 1.0",
  "renderReferenceMasterReview",
  "data-reference-master-launch-evidence",
  "renderDatabaseModeAdvisor",
  "data-database-mode-advisor",
  "Database mode advisor",
  "data-database-mode-commands",
  "renderProductionEnvironmentAdvisor",
  "data-production-environment-advisor",
  "Production environment advisor",
  "data-production-env-commands",
  "Portfolio Data Health",
  "System Admin",
  "data-system-admin-panel",
  "data-system-admin-actions",
  "User Management",
  "data-user-management-panel",
  "data-portfolio-health-controls",
  "data-portfolio-health-filter",
  "attachPortfolioHealthControls",
  "filterPortfolioHealthSnapshots",
  "saveReferenceMasterRecord",
  "reference_master.review",
], "Frontend bundle should keep key authenticated and entitlement-gated views.");

assertBefore(appJs, "const recommendedActionFields", "await initialize();", "Recommended action fields must initialize before the app can render a saved portfolio.");
assertBefore(appJs, "const recommendedActionSortFields", "await initialize();", "Recommended action sort fields must initialize before the app can render a saved portfolio.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "viewport-meta",
    "responsive-breakpoints",
    "mobile-section-title",
    "tap-target-height",
    "button-text-wrapping",
    "table-overflow",
    "key-view-markers",
    "analysis-loading-markers",
    "blank-template-download-markers",
    "screener-beginner-tooltip-markers",
    "recommended-actions-control-markers",
    "portfolio-visual-filter-markers",
    "recommended-actions-initialization-order",
    "portfolio-empty-market-data-warning",
    "reference-master-launch-evidence-markers",
    "database-mode-advisor-markers",
    "production-environment-advisor-markers",
    "portfolio-health-control-markers",
    "system-admin-management-markers",
  ],
}, null, 2));

function assertIncludes(text, expectedParts, message) {
  const missing = expectedParts.filter((part) => !text.includes(part));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
  }
}

function assertBefore(text, beforePart, afterPart, message) {
  const beforeIndex = text.indexOf(beforePart);
  const afterIndex = text.indexOf(afterPart);
  if (beforeIndex === -1 || afterIndex === -1 || beforeIndex > afterIndex) {
    throw new Error(`${message}\nExpected "${beforePart}" before "${afterPart}".`);
  }
}
