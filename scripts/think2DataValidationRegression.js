import { analyzeHolding } from "../src/services/portfolioService.js";
import { analyzeStockRow, analyzeStocks } from "../src/services/stockAnalysisService.js";

const validRow = {
  Symbol: "GOOD",
  Sector: "Healthcare",
  Price: 10,
  PE: 12,
  PBV: 2,
  Yield: 3,
  ROE: 18,
  DE: 0.5,
  High_52W: 20,
  Low_52W: 8,
  RSI: 50,
  Volume: 1000000,
  Avg_Vol_10D: 800000,
};

const reviewRow = {
  ...validRow,
  Symbol: "WARN",
  Sector: "Unknown",
  PE: -4,
  DE: 6.2,
};

const errorRow = {
  ...validRow,
  Symbol: "ERR",
  Price: 0,
  High_52W: 8,
  Low_52W: 8,
};

const highRrrLowScoreRow = {
  ...validRow,
  Symbol: "TRAP",
  Price: 10,
  PE: 30,
  ROE: 5,
  DE: 2.4,
  High_52W: 100,
  Low_52W: 8,
  RSI: 60,
};

const oversoldBearishRow = {
  ...validRow,
  Symbol: "FALL",
  Price: 10,
  High_52W: 25,
  Low_52W: 8,
  RSI: 30,
};

const highScoreLowRrrRow = {
  ...validRow,
  Symbol: "WAIT",
  Price: 19,
  PE: 10,
  ROE: 22,
  DE: 0.3,
  High_52W: 20,
  Low_52W: 8,
  RSI: 60,
};

const lowLiquidityRow = {
  ...validRow,
  Symbol: "THIN",
  Volume: 300000,
  Avg_Vol_10D: 1000000,
};

const overheatedProfitRow = {
  ...validRow,
  Symbol: "PROFIT",
  Sector: "Energy",
  Price: 35.75,
  PE: 16.6,
  ROE: 7.716,
  DE: 1.37,
  High_52W: 40.75,
  Low_52W: 24.2,
  RSI: 76,
  Volume: 5000000,
  Avg_Vol_10D: 7700000,
};

const stats = {
  Sector_PE: 15,
  Sector_ROE: 14,
  Sector_Yield: 2,
};

const validAnalysis = analyzeStockRow(validRow, stats);
assertEqual(validAnalysis.Data_Status, "VALID", "Complete normal market data should be VALID.");
assertEqual(validAnalysis.Data_Warnings, "", "VALID rows should not include warning text.");
assert(Number.isFinite(validAnalysis.Total_Score), "Data validation must not remove Total_Score.");
assert(Number.isFinite(validAnalysis.RRR), "Data validation must not remove RRR.");
assertEqual(validAnalysis.Technical_RRR, validAnalysis.RRR, "Technical_RRR should mirror legacy RRR during placeholder phase.");
assertEqual(validAnalysis.Fundamental_RRR, null, "Fundamental_RRR should remain null until a real fair value data source exists.");
assertEqual(validAnalysis.Fundamental_RRR_Status, "INSUFFICIENT_DATA", "Fundamental_RRR_Status should clearly state insufficient data.");
assertEqual(validAnalysis.Fundamental_RRR_Source, "not_available", "Fundamental_RRR_Source should not claim a fake data source.");
assertIncludes(validAnalysis.Fundamental_RRR_Note, "fair value", "Fundamental_RRR_Note should explain missing fair value data.");
assert(validAnalysis.Action_v2_Shadow, "Stock analysis should include a shadow Action Matrix v2 result.");
assert(validAnalysis.Action_v2_Rationale, "Shadow Action Matrix v2 should explain its rationale.");
assertEqual(validAnalysis.Action_v2_Risk_Block, "NONE", "Valid rows without RED conflict should not be risk-blocked in shadow mode.");
assertScoreBetween(validAnalysis.Quality_Score, "Quality_Score");
assertScoreBetween(validAnalysis.Valuation_Score, "Valuation_Score");
assertScoreBetween(validAnalysis.Setup_Score, "Setup_Score");
assertScoreBetween(validAnalysis.Balance_Risk_Score, "Balance_Risk_Score");
assertScoreBetween(validAnalysis.Liquidity_Score, "Liquidity_Score");
assertScoreBetween(validAnalysis.Composite_Score_v2, "Composite_Score_v2");
assert(validAnalysis.Composite_Score_v2 !== validAnalysis.Total_Score, "Composite_Score_v2 should be a separate shadow score, not a duplicate Total_Score.");

const reviewAnalysis = analyzeStockRow(reviewRow, stats);
assertEqual(reviewAnalysis.Data_Status, "REVIEW_REQUIRED", "Warnings without hard errors should require review.");
assertIncludes(reviewAnalysis.Data_Warnings, "Sector is unknown", "Unknown sector warning should be beginner-readable.");
assertIncludes(reviewAnalysis.Data_Warnings, "P/E is zero or negative", "Negative PE warning should identify abnormal earnings risk.");
assertIncludes(reviewAnalysis.Data_Warnings, "D/E is outside the normal range", "Abnormal D/E warning should identify balance-sheet data risk.");
assertEqual(reviewAnalysis.Conflict_Severity, "ORANGE", "Unknown sector, negative PE, or abnormal D/E should be ORANGE conflicts.");
assertIncludes(reviewAnalysis.Conflict_Alerts, "UNKNOWN_SECTOR", "Unknown sector conflict should be present.");
assertIncludes(reviewAnalysis.Conflict_Alerts, "PE_LOSS_OR_ABNORMAL", "Negative PE conflict should be present.");
assertIncludes(reviewAnalysis.Conflict_Alerts, "ABNORMAL_DE", "Abnormal D/E conflict should be present.");

const errorAnalysis = analyzeStockRow(errorRow, stats);
assertEqual(errorAnalysis.Data_Status, "DATA_ERROR", "Invalid price or 52-week range should be DATA_ERROR.");
assertIncludes(errorAnalysis.Data_Warnings, "Price is missing or not positive", "Hard price errors should be explained.");
assertIncludes(errorAnalysis.Data_Warnings, "52-week high/low is missing or invalid", "Hard 52W errors should be explained.");
assertEqual(errorAnalysis.Action_v2_Shadow, "BLOCKED_DATA_ERROR_SHADOW", "Action Matrix v2 should block DATA_ERROR rows in shadow mode.");
assertEqual(errorAnalysis.Action_v2_Risk_Block, "DATA_ERROR", "DATA_ERROR rows should expose the shadow risk block.");

const highRrrLowScoreAnalysis = analyzeStockRow(highRrrLowScoreRow, stats);
assertEqual(highRrrLowScoreAnalysis.Conflict_Severity, "ORANGE", "High RRR with low score should be ORANGE.");
assertIncludes(highRrrLowScoreAnalysis.Conflict_Alerts, "HIGH_RRR_LOW_SCORE", "High RRR low score conflict should be present.");

const oversoldBearishAnalysis = analyzeStockRow(oversoldBearishRow, stats);
assertEqual(oversoldBearishAnalysis.Conflict_Severity, "RED", "Oversold bearish conflict should be RED.");
assertIncludes(oversoldBearishAnalysis.Conflict_Alerts, "OVERSOLD_BEARISH", "Oversold bearish conflict should be present.");

const highScoreLowRrrAnalysis = analyzeStockRow(highScoreLowRrrRow, stats);
assertEqual(highScoreLowRrrAnalysis.Conflict_Severity, "YELLOW", "High score with low RRR should be YELLOW.");
assertIncludes(highScoreLowRrrAnalysis.Conflict_Alerts, "HIGH_SCORE_LOW_RRR", "High score low RRR conflict should be present.");
assertIncludes(highScoreLowRrrAnalysis.Conflict_Alerts, "NEAR_52W_HIGH", "Near 52W high conflict should be present.");

const lowLiquidityAnalysis = analyzeStockRow(lowLiquidityRow, stats);
assertEqual(lowLiquidityAnalysis.Conflict_Severity, "YELLOW", "Low liquidity should be YELLOW.");
assertIncludes(lowLiquidityAnalysis.Conflict_Alerts, "LOW_LIQUIDITY", "Low liquidity conflict should be present.");

const sortedRecommendations = await analyzeStocks([reviewRow, validRow, errorRow]);
assertEqual(sortedRecommendations.length, 3, "Validation should not filter out rows in Think2 Phase 1.");
assert(sortedRecommendations.some((row) => row.Data_Status === "VALID"), "Recommendations should include VALID rows.");
assert(sortedRecommendations.some((row) => row.Data_Status === "REVIEW_REQUIRED"), "Recommendations should include REVIEW_REQUIRED rows.");
assert(sortedRecommendations.some((row) => row.Data_Status === "DATA_ERROR"), "Recommendations should include DATA_ERROR rows.");

const holdingWithoutMarket = analyzeHolding({ Symbol: "MISS", Quantity: 10, Avg_Price: 5 }, null);
assertEqual(holdingWithoutMarket.Data_Status, "DATA_ERROR", "Missing market rows should be marked as DATA_ERROR.");
assertIncludes(holdingWithoutMarket.Data_Warnings, "No market data", "Missing market warning should be readable.");
assertEqual(holdingWithoutMarket.Fundamental_RRR_Status, "INSUFFICIENT_DATA", "Missing market rows should not fake Fundamental RRR.");
assertEqual(holdingWithoutMarket.Conflict_Severity, "RED", "Missing market rows should carry a RED conflict.");
assertIncludes(holdingWithoutMarket.Conflict_Alerts, "MISSING_MARKET_DATA", "Missing market conflict should be present.");
assertEqual(holdingWithoutMarket.Action_v2_Shadow, "BLOCKED_DATA_ERROR_SHADOW", "Missing market rows should block shadow action.");
assertEqual(holdingWithoutMarket.Action_v2_Change, "SAME_FAMILY", "Missing market shadow action should stay in the blocked/no-data family.");
assertEqual(holdingWithoutMarket.Decision_Engine_Mode, "shadow", "Missing market rows should still expose safe default decision mode.");
assertEqual(holdingWithoutMarket.Effective_Target_Action, "No Data", "Missing market effective action should remain No Data.");
assertEqual(holdingWithoutMarket.Target_Action, "No Data", "Missing market action should remain unchanged.");

const holdingWithReviewMarket = analyzeHolding(
  { Symbol: "WARN", Quantity: 10, Avg_Price: 12 },
  {
    ...reviewAnalysis,
    Price: 10,
    Total_Score: 80,
    Price_Position: 30,
    RRR: 2.4,
    Technical_RRR: 2.4,
    Entry_Zone_High: 11,
    Stop_Loss: 7.6,
    Exit_Zone_Low: 19.4,
  },
);
assertEqual(holdingWithReviewMarket.Data_Status, "REVIEW_REQUIRED", "Portfolio rows should keep market data status.");
assertEqual(holdingWithReviewMarket.Conflict_Severity, "ORANGE", "Portfolio rows should keep market conflict severity.");
assertIncludes(holdingWithReviewMarket.Conflict_Alerts, "UNKNOWN_SECTOR", "Portfolio rows should keep market conflict alerts.");
assertScoreBetween(holdingWithReviewMarket.Quality_Score, "Portfolio Quality_Score");
assertScoreBetween(holdingWithReviewMarket.Composite_Score_v2, "Portfolio Composite_Score_v2");
assertEqual(holdingWithReviewMarket.Technical_RRR, holdingWithReviewMarket.RRR, "Portfolio Technical_RRR should mirror legacy RRR during placeholder phase.");
assertEqual(holdingWithReviewMarket.Fundamental_RRR_Status, "INSUFFICIENT_DATA", "Portfolio rows should keep Fundamental RRR placeholder status.");
assert(holdingWithReviewMarket.Action_v2_Shadow, "Portfolio rows should include Action_v2_Shadow.");
assert(holdingWithReviewMarket.Action_v2_Change, "Portfolio rows should compare legacy action and shadow action.");
assertIncludes(holdingWithReviewMarket.Action_v2_Rationale, "shadow", "Portfolio shadow action rationale should clearly state shadow mode when fundamental RRR is missing.");
assertEqual(holdingWithReviewMarket.Decision_Engine_Mode, "shadow", "Default decision engine mode should be shadow.");
assertEqual(holdingWithReviewMarket.Effective_Target_Action, holdingWithReviewMarket.Target_Action, "Default effective action must equal legacy Target_Action.");
assertEqual(holdingWithReviewMarket.Effective_Action_Source, "legacy", "Default effective action source must remain legacy.");
assertEqual(holdingWithReviewMarket.Advice, "Buy More", "Phase 1 validation must not change existing Advice logic.");
assertEqual(holdingWithReviewMarket.Target_Action, "Buy Now (Good RRR)", "Phase 1 validation must not change existing Target_Action logic.");

const overheatedProfitMarket = analyzeStockRow(overheatedProfitRow, {
  Sector_PE: 9.7,
  Sector_ROE: 7.707,
  Sector_Yield: 4.6,
});
const overheatedProfitHolding = analyzeHolding(
  { Symbol: "PROFIT", Quantity: 100, Avg_Price: 14.52 },
  overheatedProfitMarket,
);
assertEqual(overheatedProfitHolding.Target_Action, "Keep Holding", "Profit protection must not mutate legacy Target_Action in shadow mode.");
assertEqual(overheatedProfitHolding.Action_v2_Shadow, "TAKE_PROFIT_REVIEW_SHADOW", "High-profit, overheated, low-RRR holdings should get a Think2 take-profit review shadow action.");
assertEqual(overheatedProfitHolding.Action_v2_Confidence, "HIGH", "High profit above 50% should make profit protection high confidence.");
assertEqual(overheatedProfitHolding.Action_v2_Change, "HOLD_TO_REDUCE", "Take-profit review should be grouped as a reduce/profit-taking action.");
assertIncludes(overheatedProfitHolding.Action_v2_Rationale, "Reward/Risk", "Profit protection rationale should explain low reward/risk.");
assertEqual(overheatedProfitHolding.Effective_Target_Action, "Keep Holding", "Default shadow mode should keep the legacy effective action.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "valid-data-status",
    "review-required-warnings",
    "data-error-warnings",
    "recommendation-row-preservation",
    "portfolio-data-status",
    "conflict-alerts",
    "derived-score-matrix",
    "technical-fundamental-rrr-placeholder",
    "action-matrix-v2-shadow",
    "take-profit-review-shadow",
    "decision-engine-feature-flag-default-safe",
    "phase-one-action-unchanged",
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

function assertScoreBetween(value, label) {
  assert(Number.isFinite(value), `${label} should be a finite number.`);
  assert(value >= 0 && value <= 100, `${label} should stay within 0-100. Got ${value}.`);
}
