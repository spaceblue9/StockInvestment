import { buildFundamentalReadinessReport } from "../src/services/fundamentalReadinessService.js";

const missingRows = [
  { Symbol: "AAA", PE: 10, ROE: 12 },
  { Symbol: "BBB", PE: 15, ROE: 8 },
];
const missingReport = buildFundamentalReadinessReport(missingRows, { source: "missing-fixture" });
assertEqual(missingReport.overallStatus, "INSUFFICIENT_DATA", "Missing fundamental fields should block Fundamental RRR.");
assertEqual(missingReport.canCalculateFundamentalRrr, false, "Missing fair value/EPS should not allow Fundamental RRR.");
assert(missingReport.requirements.every((item) => item.status === "MISSING"), "All requirements should be missing in the sparse fixture.");
assertIncludes(missingReport.recommendation, "Do not calculate Fundamental RRR yet", "Report should block fake Fundamental RRR.");

const readyRows = [
  {
    Symbol: "AAA",
    Normalized_EPS: 2.5,
    Net_Profit_Growth: 8,
    Revenue_Growth: 7,
    Payout_Ratio: 55,
    Analyst_Target: 38,
    Fair_Value: 40,
  },
  {
    Symbol: "BBB",
    EPS: 1.2,
    Earnings_Growth: 4,
    Sales_Growth: 3,
    Dividend_Payout: 65,
    Consensus_Target: 18,
    Intrinsic_Value: 20,
  },
];
const readyReport = buildFundamentalReadinessReport(readyRows, { source: "ready-fixture" });
assertEqual(readyReport.overallStatus, "PARTIAL_READY", "Ready fixture should allow shadow-mode Fundamental RRR readiness.");
assertEqual(readyReport.canCalculateFundamentalRrr, true, "Fair value/EPS coverage should allow readiness.");
assert(readyReport.requirements.every((item) => item.status === "READY"), "All requirements should be ready in the complete fixture.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "missing-fundamental-data-blocks-rrr",
    "ready-fundamental-data-allows-shadow-readiness",
    "readiness-requirement-coverage",
  ],
}, null, 2));

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
  }
}

function assertIncludes(text, expected, message) {
  if (!String(text || "").includes(expected)) {
    throw new Error(`${message} Expected ${JSON.stringify(text)} to include ${JSON.stringify(expected)}.`);
  }
}
