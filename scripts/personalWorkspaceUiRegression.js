import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const html = await fs.readFile(path.join(repoRoot, "src", "public", "index.html"), "utf8");
const appJs = await fs.readFile(path.join(repoRoot, "src", "public", "app.js"), "utf8");
const styles = await fs.readFile(path.join(repoRoot, "src", "public", "styles.css"), "utf8");

assertIncludes(html, [
  "Personal Investment Workspace",
  "Personal Access",
  "เข้าสู่พื้นที่ลงทุนส่วนตัว",
  "Personal Workspace",
  "Private use",
  "วิเคราะห์พอร์ตของฉัน",
  "ไฟล์ตัวอย่างพอร์ต",
  "คู่มือ Watchlist",
  'class="panel pricing-panel" hidden data-personal-use-hidden',
  'data-view="business" hidden data-personal-use-hidden',
], "Personal workspace HTML should prioritize sign-in and portfolio analysis while hiding commercial surfaces.");

assertIncludes(appJs, [
  "const personalUseMode = true;",
  'authMode: personalUseMode ? "login" : "register"',
  "businessViewButton.hidden = personalUseMode || !canSeeWorkspaceNav()",
  'subscriptionBadge.textContent = "Private use"',
  'plansList.closest(".pricing-panel")?.setAttribute("hidden", "")',
  "Think2 Personal Investment Workspace v1.2.0",
], "Personal workspace behavior should force login-only UI and keep package cards hidden.");

assertIncludes(styles, [
  "grid-template-columns: minmax(280px, 330px) 1fr;",
  "[hidden]",
  "display: none !important;",
  ".personal-account-heading",
  ".personal-use-badge",
  ".workspace-system-details",
  ".analysis-panel",
  "grid-template-columns: repeat(2, minmax(0, 1fr));",
  ".analysis-panel .frontend-version",
], "Personal workspace CSS should keep the sidebar compact and readable.");

assertIncludes(appJs, [
  'metric("ขั้นที่ 1", "เข้าสู่ระบบ")',
  'metric("ขั้นที่ 2", "เลือกไฟล์พอร์ต")',
  'metric("ขั้นที่ 3", "อ่านสรุปและตรวจความเสี่ยง")',
  "AI INVESTMENT ASSISTANT",
  "AI INVESTMENT COMPANION",
  "Sector Intelligence",
], "Personal workspace guidance should avoid commercial plan labels in visible investment tools.");

assertBefore(
  appJs,
  "if (personalUseMode) {\n    subscriptionBadge.textContent = \"Private use\";",
  "subscriptionBadge.textContent = isPendingManualPackage",
  "Personal account rendering must return before commercial subscription details are rendered.",
);
assertBefore(
  appJs,
  "if (personalUseMode) {\n    plansList.innerHTML = \"\";",
  "const currentPlanId = currentPlanIdForUser();",
  "Personal plan rendering must stop before commercial cards are created.",
);

console.log(JSON.stringify({
  ok: true,
  checked: [
    "personal-branding",
    "login-only-access",
    "private-account-card",
    "commercial-ui-hidden",
    "compact-analysis-panel",
    "personal-mode-render-guards",
  ],
}, null, 2));

function assertIncludes(source, markers, message) {
  const missing = markers.filter((marker) => !source.includes(marker));
  if (missing.length) {
    throw new Error(`${message} Missing: ${missing.join(", ")}`);
  }
}

function assertBefore(source, first, second, message) {
  const firstIndex = source.indexOf(first);
  const secondIndex = source.indexOf(second);
  if (firstIndex < 0 || secondIndex < 0 || firstIndex >= secondIndex) {
    throw new Error(message);
  }
}
