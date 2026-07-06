import { buildActionMatrixComparisonReport } from "../src/services/actionMatrixComparisonService.js";

const report = buildActionMatrixComparisonReport([
  {
    Symbol: "SAME",
    Sector: "Energy",
    Target_Action: "Buy Now (Good RRR)",
    Action_v2_Shadow: "BUY_CANDIDATE_SHADOW",
    Action_v2_Risk_Block: "NONE",
    Action_v2_Change: "SAME_FAMILY",
    Conflict_Severity: "GREEN",
    Data_Status: "VALID",
    Total_Score: 82,
    Composite_Score_v2: 78,
    Technical_RRR: 2.4,
  },
  {
    Symbol: "WAIT",
    Sector: "Healthcare",
    Target_Action: "Buy Now (Low RRR)",
    Action_v2_Shadow: "WAIT_FOR_ENTRY_SHADOW",
    Action_v2_Risk_Block: "NONE",
    Action_v2_Change: "BUY_TO_HOLD",
    Conflict_Severity: "YELLOW",
    Data_Status: "VALID",
    Total_Score: 76,
    Composite_Score_v2: 74,
    Technical_RRR: 1.2,
  },
  {
    Symbol: "RED",
    Sector: "Technology",
    Target_Action: "Buy Now (Good RRR)",
    Action_v2_Shadow: "BLOCKED_RED_CONFLICT_SHADOW",
    Action_v2_Risk_Block: "RED_CONFLICT",
    Action_v2_Change: "BUY_TO_BLOCK",
    Conflict_Severity: "RED",
    Data_Status: "VALID",
    Total_Score: 80,
    Composite_Score_v2: 70,
    Technical_RRR: 2.5,
  },
  {
    Symbol: "ERR",
    Sector: "Unknown",
    Target_Action: "No Data",
    Action_v2_Shadow: "BLOCKED_DATA_ERROR_SHADOW",
    Action_v2_Risk_Block: "DATA_ERROR",
    Action_v2_Change: "SAME_FAMILY",
    Conflict_Severity: "RED",
    Data_Status: "DATA_ERROR",
    Total_Score: "",
    Composite_Score_v2: "",
    Technical_RRR: "",
  },
], { source: "regression-fixture", sampleLimit: 10 });

assertEqual(report.mode, "shadow_only", "Comparison report should be explicitly shadow-only.");
assertEqual(report.totalRows, 4, "All fixture rows should be counted.");
assertEqual(report.changedRows, 2, "Only rows with changed action families should be counted as changed.");
assertEqual(report.sameFamilyRows, 2, "Same-family rows should be counted separately.");
assertEqual(report.riskBlockedRows, 2, "RED and DATA_ERROR rows should be risk-blocked.");
assertEqual(report.redBlockedBuyRows, 1, "Legacy buy blocked by RED conflict should be highlighted.");
assertEqual(report.dataBlockedRows, 1, "DATA_ERROR blocked row should be counted.");
assertEqual(report.legacyActionMix.BUY, 3, "Legacy action mix should group buy actions.");
assertEqual(report.shadowActionMix.BLOCK, 2, "Shadow action mix should group blocked actions.");
assertEqual(report.changeMatrix.BUY_TO_HOLD, 1, "Change matrix should include BUY_TO_HOLD.");
assertEqual(report.changeMatrix.BUY_TO_BLOCK, 1, "Change matrix should include BUY_TO_BLOCK.");
assertEqual(report.riskBlockMix.RED_CONFLICT, 1, "Risk block mix should include RED_CONFLICT.");
assertEqual(report.riskBlockMix.DATA_ERROR, 1, "Risk block mix should include DATA_ERROR.");
assertEqual(report.reviewSamples.length, 2, "Changed action rows should appear in review samples.");
assertEqual(report.redBlockedBuySamples.length, 1, "RED blocked buy should appear in dedicated samples.");
assertIncludes(report.recommendation, "Review blocked cases first", "Recommendation should warn before rollout.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "shadow-only-mode",
    "changed-action-summary",
    "risk-block-summary",
    "red-blocked-legacy-buy",
    "review-samples",
    "rollout-recommendation",
  ],
}, null, 2));

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
