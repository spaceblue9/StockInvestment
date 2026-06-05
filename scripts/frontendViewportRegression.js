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
], "Frontend bundle should keep key authenticated and entitlement-gated views.");

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
  ],
}, null, 2));

function assertIncludes(text, expectedParts, message) {
  const missing = expectedParts.filter((part) => !text.includes(part));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
  }
}
