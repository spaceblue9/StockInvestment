import assert from "node:assert/strict";
import { buildAiInvestmentContext, buildOpenRouterRequest, generateAiInvestmentExplanation } from "../src/services/aiInvestmentService.js";

const snapshot = {
  generatedAt: "2026-11-03T02:00:00.000Z",
  userEmail: "private@example.com",
  uploadedFile: "portfolio_private.xlsx",
  summary: { holdings: 2, marketValue: 150000, avgScore: 68 },
  portfolioRows: [
    { Symbol: "AAA", Sector: "Energy", Total_Score: 72, RRR: 1.8, Target_Action: "Hold", ownerEmail: "private@example.com" },
    { Symbol: "BBB", Sector: "Energy", Total_Score: 65, RRR: 1.2, Target_Action: "Wait" },
  ],
};

const context = buildAiInvestmentContext(snapshot, { mode: "compare", symbol: "AAA", focus: "sector_explain" });
const serializedContext = JSON.stringify(context);
assert.equal(serializedContext.includes("private@example.com"), false);
assert.equal(serializedContext.includes("portfolio_private.xlsx"), false);
assert.equal(context.selectedStock.Symbol, "AAA");
assert.equal(context.peers[0].Symbol, "BBB");
assert.equal(context.dataContract.companyProfileAvailable, false);
assert.equal(context.focus, "sector_explain");

const request = buildOpenRouterRequest(context);
assert.equal(request.provider.zdr, true);
assert.equal(request.provider.data_collection, "deny");
assert.equal(request.response_format.type, "json_schema");
assert.match(request.messages[0].content, /Never calculate or replace Think2/u);
assert.match(request.messages[0].content, /never infer it from the ticker/iu);
assert.match(request.messages[1].content, /Explain sector strength/u);

let sentRequest;
const response = await generateAiInvestmentExplanation(snapshot, { mode: "stock", symbol: "AAA" }, {
  apiKey: "test-key",
  fetchImpl: async (_url, options) => {
    sentRequest = JSON.parse(options.body);
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        model: "test-model",
        provider: "test-provider",
        usage: { prompt_tokens: 100, completion_tokens: 50, total_tokens: 150, cost: 0.001 },
        choices: [{ message: { content: JSON.stringify({
          title: "คำอธิบาย AAA", summary: "สรุปจากข้อมูล Think2", keyPoints: ["คะแนน 72"],
          decisionHeadline: "AAA น่าศึกษาต่อก่อน", decisionAction: "ตรวจงบและ RRR ของ AAA เพิ่มก่อนตัดสินใจ",
          decisionReasons: ["คะแนนรวมสูงกว่าเพื่อน"], decisionChecks: ["ตรวจงบล่าสุด"], decisionConfidence: "ปานกลาง",
          risks: ["ควรตรวจข้อมูลเพิ่ม"], nextQuestions: ["งบล่าสุดเป็นอย่างไร"],
          dataLimitations: ["ไม่มีข้อมูลประเภทธุรกิจที่ยืนยันแล้ว"], disclaimer: "ใช้เพื่อการศึกษา",
        }) } }],
      }),
    };
  },
});

assert.equal(response.result.title, "คำอธิบาย AAA");
assert.equal(response.result.decisionHeadline, "AAA น่าศึกษาต่อก่อน");
assert.equal(response.result.decisionConfidence, "ปานกลาง");
assert.equal(response.usage.totalTokens, 150);
assert.equal(sentRequest.provider.zdr, true);
assert.match(sentRequest.messages[0].content, /Always provide decision support/u);
assert(sentRequest.response_format.json_schema.schema.required.includes("decisionAction"));

const staleSnapshotContext = buildAiInvestmentContext({
  generatedAt: snapshot.generatedAt,
  portfolioRows: [{ Symbol: "OLD", Sector: "Energy", Total_Score: 55 }],
  recommendations: [],
}, {
  mode: "stock",
  symbol: "NEW",
  currentRows: [{
    Symbol: "NEW",
    Sector: "Technology",
    Total_Score: 81,
    email: "must-not-leak@example.com",
    uploadedFile: "private.xlsx",
  }],
});
assert.equal(staleSnapshotContext.selectedStock.Symbol, "NEW");
assert.equal(JSON.stringify(staleSnapshotContext).includes("must-not-leak@example.com"), false);
assert.equal(JSON.stringify(staleSnapshotContext).includes("private.xlsx"), false);

const filteredScreenerContext = buildAiInvestmentContext({
  generatedAt: snapshot.generatedAt,
  summary: { holdings: 99, marketValue: 999999 },
  portfolioRows: [{ Symbol: "OUTSIDE_PORT", Sector: "Energy", Total_Score: 99 }],
  recommendations: [{ Symbol: "OUTSIDE_REC", Sector: "Energy", Total_Score: 98 }],
}, {
  mode: "stock",
  symbol: "FILTERED",
  contextView: "screener",
  filterSummary: "symbols FILTERED · score >= 70",
  currentRows: [{ Symbol: "FILTERED", Sector: "Healthcare", Total_Score: 80, RRR: 2 }],
});
assert.deepEqual(filteredScreenerContext.currentRows.map((row) => row.Symbol), ["FILTERED"]);
assert.deepEqual(filteredScreenerContext.holdings.map((row) => row.Symbol), ["FILTERED"]);
assert.equal(filteredScreenerContext.selectedStock.Symbol, "FILTERED");
assert.equal(filteredScreenerContext.peers.length, 0);
assert.deepEqual(filteredScreenerContext.portfolioSummary, {});
assert.equal(filteredScreenerContext.filterSummary, "symbols FILTERED · score >= 70");
assert.equal(JSON.stringify(filteredScreenerContext).includes("OUTSIDE_PORT"), false);
assert.equal(JSON.stringify(filteredScreenerContext).includes("OUTSIDE_REC"), false);

const filteredSectorContext = buildAiInvestmentContext({
  generatedAt: snapshot.generatedAt,
  recommendations: [{ Symbol: "OTHER_SECTOR", Sector: "Energy", Total_Score: 99 }],
}, {
  mode: "compare",
  symbol: "HEALTH_A",
  focus: "sector_concentration",
  contextView: "sector",
  filterSummary: "Healthcare · score >= 70 · price position line 60",
  currentRows: [
    { Symbol: "HEALTH_A", Sector: "Healthcare", Total_Score: 82 },
    { Symbol: "HEALTH_B", Sector: "Healthcare", Total_Score: 75 },
  ],
});
assert.deepEqual(filteredSectorContext.currentRows.map((row) => row.Symbol), ["HEALTH_A", "HEALTH_B"]);
assert.equal(filteredSectorContext.selectedStock.Symbol, "HEALTH_A");
assert.deepEqual(filteredSectorContext.peers.map((row) => row.Symbol), ["HEALTH_B"]);
assert.equal(JSON.stringify(filteredSectorContext).includes("OTHER_SECTOR"), false);
assert.match(buildOpenRouterRequest(filteredSectorContext).messages[1].content, /currently filtered sector rows/u);

const filteredPortfolioContext = buildAiInvestmentContext(snapshot, {
  mode: "portfolio",
  contextView: "portfolio",
  filterSummary: "symbols BBB",
  currentRows: [{ Symbol: "BBB", Sector: "Energy", Total_Score: 65, RRR: 1.2 }],
  question: "หุ้นตัวไหนควรตรวจต่อ เพราะอะไร",
});
assert.deepEqual(filteredPortfolioContext.currentRows.map((row) => row.Symbol), ["BBB"]);
assert.deepEqual(filteredPortfolioContext.holdings.map((row) => row.Symbol), ["BBB"]);
assert.equal(JSON.stringify(filteredPortfolioContext.holdings).includes("AAA"), false);
assert.equal(filteredPortfolioContext.question, "หุ้นตัวไหนควรตรวจต่อ เพราะอะไร");
assert.match(buildOpenRouterRequest(filteredPortfolioContext).messages[1].content, /User question:/u);

const simulationContext = buildAiInvestmentContext(snapshot, {
  mode: "portfolio",
  contextView: "simulation",
  question: "กลยุทธ์นี้ดีกว่าซื้อถือหรือไม่",
  currentRows: [],
  viewContext: {
    symbol: "CPALL",
    summary: { initialCapital: 100000, finalValue: 112000, roi: 12, buyHoldRoi: 8, totalTrades: 3 },
    buyPlan: { mode: "split", tranches: 5, trancheIntervalDays: 20 },
    history: [{ Date: "2026-01-01", Price: 50, Portfolio_Value: 100000, Buy_Hold_Value: 100000 }],
    trades: [{ Date: "2026-01-01", Action: "BUY", Price: 50, Shares: 400 }],
    privateNote: "must-not-leak",
  },
});
assert.equal(simulationContext.viewContext.symbol, "CPALL");
assert.equal(simulationContext.viewContext.summary.roi, 12);
assert.equal(simulationContext.viewContext.buyPlan.tranches, 5);
assert.equal(JSON.stringify(simulationContext).includes("must-not-leak"), false);
assert.match(buildOpenRouterRequest(simulationContext).messages[1].content, /strategy versus buy-and-hold/u);

const marketContext = buildAiInvestmentContext(snapshot, {
  contextView: "screener",
  mode: "stock",
  symbol: "BBB",
  currentRows: [{ Symbol: "BBB", Sector: "Energy", Total_Score: 77 }],
  marketContext: {
    symbol: "BBB",
    source: "Yahoo Finance chart",
    fetchedAt: "2026-11-04T01:30:00.000Z",
    current: 12,
    low52Week: 8,
    high52Week: 16,
    pricePositionPct: 50,
    history: [{ Date: "2026-11-03", Close: 12, Volume: 1000 }],
    privateNote: "must not leak",
  },
});
assert.equal(marketContext.marketContext.symbol, "BBB");
assert.equal(marketContext.marketContext.pricePositionPct, 50);
assert.equal(JSON.stringify(marketContext.marketContext).includes("privateNote"), false);

const rejectedMarketContext = buildAiInvestmentContext(snapshot, {
  contextView: "screener",
  currentRows: [{ Symbol: "BBB" }],
  marketContext: { symbol: "AAA", current: 99 },
});
assert.equal(rejectedMarketContext.marketContext, null);
console.log("AI investment service regression passed.");
