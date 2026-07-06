import fs from "fs/promises";
import path from "path";

const repoRoot = process.cwd();
const releaseDoc = await fs.readFile(path.join(repoRoot, "docs", "THINK2_BETA_RELEASE.md"), "utf8");

assertIncludes(releaseDoc, [
  "THINK2_DECISION_ENGINE",
  "off",
  "shadow",
  "enabled",
  "`Target_Action` is never mutated",
  "Effective_Target_Action",
  "think-md-v1.0.0",
  "b8a6cb5",
  "npm run action:compare -- --format text",
  "npm run test:decision-engine-flag",
  "npm run test:think2-data-validation",
  "npm run test:action-matrix-comparison",
  "npm run compare:python",
  "Changed action family: 2 rows (40.00%)",
  "Do not enable Think2 as the default production engine",
], "Think2 beta runbook should include release gate, flag, rollback, and latest comparison summary.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "think2-beta-release-runbook",
    "feature-flag-documentation",
    "rollback-baseline",
    "release-gate-commands",
    "comparison-summary",
    "production-warning",
  ],
}, null, 2));

function assertIncludes(text, expectedItems, message) {
  const missing = expectedItems.filter((item) => !text.includes(item));
  if (missing.length) {
    throw new Error(`${message}\nMissing: ${missing.join(", ")}`);
  }
}
