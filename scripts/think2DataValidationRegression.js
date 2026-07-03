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
assertEqual(holdingWithoutMarket.Conflict_Severity, "RED", "Missing market rows should carry a RED conflict.");
assertIncludes(holdingWithoutMarket.Conflict_Alerts, "MISSING_MARKET_DATA", "Missing market conflict should be present.");
assertEqual(holdingWithoutMarket.Target_Action, "No Data", "Missing market action should remain unchanged.");

const holdingWithReviewMarket = analyzeHolding(
  { Symbol: "WARN", Quantity: 10, Avg_Price: 12 },
  {
    ...reviewAnalysis,
    Price: 10,
    Total_Score: 80,
    Price_Position: 30,
    RRR: 2.4,
    Entry_Zone_High: 11,
    Stop_Loss: 7.6,
    Exit_Zone_Low: 19.4,
  },
);
assertEqual(holdingWithReviewMarket.Data_Status, "REVIEW_REQUIRED", "Portfolio rows should keep market data status.");
assertEqual(holdingWithReviewMarket.Conflict_Severity, "ORANGE", "Portfolio rows should keep market conflict severity.");
assertIncludes(holdingWithReviewMarket.Conflict_Alerts, "UNKNOWN_SECTOR", "Portfolio rows should keep market conflict alerts.");
assertEqual(holdingWithReviewMarket.Advice, "Buy More", "Phase 1 validation must not change existing Advice logic.");
assertEqual(holdingWithReviewMarket.Target_Action, "Buy Now (Good RRR)", "Phase 1 validation must not change existing Target_Action logic.");

console.log(JSON.stringify({
  ok: true,
  checked: [
    "valid-data-status",
    "review-required-warnings",
    "data-error-warnings",
    "recommendation-row-preservation",
    "portfolio-data-status",
    "conflict-alerts",
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
