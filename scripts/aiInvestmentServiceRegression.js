import assert from "node:assert/strict";
import {
  buildAiInvestmentContext,
  buildOpenRouterRequest,
  filterVerifiedCitations,
  generateAiInvestmentExplanation,
  inferAiContextNeeds,
  verifyAiInvestmentResponse,
} from "../src/services/aiInvestmentService.js";

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
          title: "คำอธิบาย AAA",
          conclusion: "AAA น่าศึกษาต่อ แต่ยังไม่ควรตัดสินใจจากคะแนนอย่างเดียว",
          stance: "น่าศึกษาต่อ",
          reasons: [{ claim: "คะแนน Think2 อยู่ในระดับที่ควรอ่านต่อ", symbol: "AAA", field: "Total_Score", value: "72" }],
          missingData: ["ไม่มีข้อมูลประเภทธุรกิจที่ยืนยันแล้ว"],
          nextAction: "ตรวจงบและ RRR ของ AAA เพิ่มก่อนตัดสินใจ",
          confidence: "ปานกลาง",
          details: {
            metrics: ["RRR 1.8: เป็นสัดส่วนผลตอบแทนต่อความเสี่ยงโดยประมาณ ไม่ใช่การรับประกัน"],
            risks: ["ควรตรวจข้อมูลเพิ่ม"],
            questions: ["งบล่าสุดเป็นอย่างไร"],
          },
          scopeUsed: "AAA เพียงหุ้นเดียว",
          citations: [{ label: "ข้อมูลหุ้น AAA", url: "https://example.com/aaa-stock" }],
          disclaimer: "ใช้เพื่อการศึกษา",
        }) } }],
      }),
    };
  },
});

assert.equal(response.result.title, "คำอธิบาย AAA");
assert.equal(response.result.decisionHeadline, "น่าศึกษาต่อ");
assert.match(response.result.beginnerConclusion, /ยังไม่ควรตัดสินใจ/u);
assert.equal(response.result.beginnerMetrics.length, 1);
assert.equal(response.result.decisionConfidence, "ปานกลาง");
assert.equal(response.result.verification.passed, true);
assert.deepEqual(response.result.citations, []);
assert.equal(response.usage.totalTokens, 150);
assert.equal(sentRequest.provider.zdr, true);
assert.match(sentRequest.messages[0].content, /five useful parts/u);
assert.match(sentRequest.messages[0].content, /portfolioSummary and scopeSummary cover the full active screen scope/u);
assert.match(sentRequest.messages[0].content, /MACD is not supplied/u);
assert.match(sentRequest.messages[0].content, /Never recommend a stock from Total Score alone/u);
assert.match(sentRequest.messages[0].content, /never say a stock is cheap, inexpensive, or not expensive from PE alone/iu);
assert.match(sentRequest.messages[0].content, /Packaged Foods means อาหารสำเร็จรูปหรืออาหารบรรจุห่อ/u);
assert(sentRequest.response_format.json_schema.schema.required.includes("nextAction"));
assert(sentRequest.response_format.json_schema.schema.required.includes("reasons"));

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

const riskFirstPortfolioContext = buildAiInvestmentContext({
  generatedAt: snapshot.generatedAt,
  portfolioRows: [
    { Symbol: "NSL", Total_Score: 89.7, RRR: 8.45, Conflict_Severity: "YELLOW", Target_Action: "Buy/Accumulate" },
    { Symbol: "TRUE", Total_Score: 51, RRR: 0.7, Conflict_Severity: "ORANGE", Target_Action: "Reduce 50%", Gain_Loss_Pct: -20 },
    { Symbol: "OR", Total_Score: 42, RRR: 0.4, Conflict_Severity: "RED", Target_Action: "Hold", Gain_Loss_Pct: -35 },
  ],
}, {
  mode: "portfolio",
  focus: "portfolio_review",
  contextView: "portfolio",
  currentRows: [
    { Symbol: "NSL", Total_Score: 89.7, RRR: 8.45, Conflict_Severity: "YELLOW", Target_Action: "Buy/Accumulate" },
    { Symbol: "TRUE", Total_Score: 51, RRR: 0.7, Conflict_Severity: "ORANGE", Target_Action: "Reduce 50%", Gain_Loss_Pct: -20 },
    { Symbol: "OR", Total_Score: 42, RRR: 0.4, Conflict_Severity: "RED", Target_Action: "Hold", Gain_Loss_Pct: -35 },
  ],
});
assert.deepEqual(riskFirstPortfolioContext.reviewQueue.map((row) => row.Symbol), ["OR", "TRUE", "NSL"]);
assert.match(riskFirstPortfolioContext.reviewQueue[0].reasons.join(" "), /RED/u);
const riskFirstPrompt = buildOpenRouterRequest(riskFirstPortfolioContext).messages.map((message) => message.content).join("\n");
assert.match(riskFirstPrompt, /follow reviewQueue/iu);
assert.match(riskFirstPrompt, /Never choose a high-score Buy\/Accumulate row/iu);

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

const researchContext = buildAiInvestmentContext(snapshot, {
  contextView: "screener",
  currentRows: [{ Symbol: "BBB" }],
  researchContext: {
    symbol: "BBB",
    source: "Yahoo Finance search",
    sourceUrl: "https://finance.yahoo.com/quote/BBB.BK/profile/",
    profile: { name: "BBB Company", sector: "Energy", industry: "Power" },
    news: [{ title: "BBB update", publisher: "Publisher", url: "https://example.com/bbb" }],
    privateNote: "must not leak",
  },
});
assert.equal(researchContext.researchContext.profile.name, "BBB Company");
assert.equal(researchContext.researchContext.news.length, 1);
assert.equal(JSON.stringify(researchContext.researchContext).includes("privateNote"), false);

const orSingleStockContext = buildAiInvestmentContext({
  generatedAt: snapshot.generatedAt,
  summary: { holdings: 3, marketValue: 300000, avgScore: 66.08 },
  portfolioRows: [
    { Symbol: "OR", Sector: "Energy", Total_Score: 61, RRR: 0.8 },
    { Symbol: "CPALL", Sector: "Consumer Defensive", Total_Score: 80, RRR: 2 },
    { Symbol: "PTT", Sector: "Energy", Total_Score: 70, RRR: 1.1 },
  ],
}, {
  mode: "stock",
  symbol: "OR",
  contextView: "portfolio",
  currentRows: [
    { Symbol: "OR", Sector: "Energy", Total_Score: 61, RRR: 0.8 },
    { Symbol: "CPALL", Sector: "Consumer Defensive", Total_Score: 80, RRR: 2 },
    { Symbol: "PTT", Sector: "Energy", Total_Score: 70, RRR: 1.1 },
  ],
});
assert.deepEqual(orSingleStockContext.currentRows.map((row) => row.Symbol), ["OR"]);
assert.deepEqual(orSingleStockContext.holdings.map((row) => row.Symbol), ["OR"]);
assert.deepEqual(orSingleStockContext.portfolioSummary, {});
const orSingleStockPrompt = buildOpenRouterRequest(orSingleStockContext).messages[1].content;
assert.match(orSingleStockPrompt, /Explain only the selected stock/u);
assert.equal(orSingleStockPrompt.includes("CPALL"), false);
assert.equal(orSingleStockPrompt.includes('"PTT"'), false);

const beginnerMetricContext = buildAiInvestmentContext(snapshot, {
  mode: "stock",
  symbol: "AAA",
  focus: "beginner_metrics",
  currentRows: [{ Symbol: "AAA", PE: 14, RSI: 62, RRR: 1.8, Volume_Ratio: 1.6 }],
});
assert.equal(beginnerMetricContext.selectedStock.Volume_Ratio, 1.6);
assert.match(buildOpenRouterRequest(beginnerMetricContext).messages[1].content, /actual values/u);

const viResearchInput = {
  symbol: "AAA",
  source: "Yahoo Finance research",
  sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/profile/",
  fetchedAt: "2026-11-24T00:00:00.000Z",
  profile: { name: "AAA Company", exchange: "SET", sector: "Commerce", industry: "Retail" },
  news: [],
  sources: [
    { id: "yahoo_financials", label: "Yahoo Financials", url: "https://finance.yahoo.com/quote/AAA.BK/financials/", fetchedAt: "2026-11-24T00:00:00.000Z" },
    { id: "yahoo_statistics", label: "Yahoo Statistics", url: "https://finance.yahoo.com/quote/AAA.BK/key-statistics/", fetchedAt: "2026-11-24T00:00:00.000Z" },
    { id: "set_factsheet", label: "SET Factsheet", url: "https://www.set.or.th/th/market/product/stock/quote/AAA/factsheet", fetchedAt: "2026-11-24T00:00:00.000Z" },
  ],
  viFundamentals: {
    metrics: [
      { key: "revenue", label: "Revenue", value: 1000000, unit: "THB", asOfDate: "2025-12-31", periodType: "12M", sourceId: "yahoo_financials", sourceLabel: "Yahoo Financials", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/financials/" },
      { key: "netIncome", label: "Net income", value: 100000, unit: "THB", asOfDate: "2025-12-31", periodType: "12M", sourceId: "yahoo_financials", sourceLabel: "Yahoo Financials", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/financials/" },
      { key: "roe", label: "ROE", value: 15, unit: "%", asOfDate: "2025-12-31", periodType: "12M", sourceId: "yahoo_financials", sourceLabel: "Yahoo Financials", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/financials/", formula: "net income / equity" },
      { key: "debtToEquity", label: "D/E", value: 0.7, unit: "x", asOfDate: "2025-12-31", periodType: "12M", sourceId: "yahoo_financials", sourceLabel: "Yahoo Financials", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/financials/" },
      { key: "freeCashFlow", label: "FCF", value: 80000, unit: "THB", asOfDate: "2025-12-31", periodType: "12M", sourceId: "yahoo_financials", sourceLabel: "Yahoo Financials", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/financials/" },
      { key: "pe", label: "P/E", value: 12, unit: "x", asOfDate: "2026-11-20", periodType: "TTM", sourceId: "yahoo_statistics", sourceLabel: "Yahoo Statistics", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/key-statistics/" },
      { key: "pbv", label: "P/BV", value: 1.5, unit: "x", asOfDate: "2026-11-20", periodType: "TTM/12M", sourceId: "yahoo_statistics", sourceLabel: "Yahoo Statistics", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/key-statistics/" },
      { key: "dividendYield", label: "Yield", value: 4, unit: "%", asOfDate: "2026-10-31", periodType: "TTM", sourceId: "yahoo_statistics", sourceLabel: "Yahoo Statistics", sourceUrl: "https://finance.yahoo.com/quote/AAA.BK/key-statistics/" },
    ],
    histories: {},
    coveragePct: 100,
    missingKeys: [],
    warnings: ["Verify with SET"],
  },
  valuationModel: {
    method: "EPS x median PE",
    formula: "5 x 12 = 60 THB",
    eps: 5,
    epsAsOfDate: "2025-12-31",
    referencePe: 12,
    referencePeSampleCount: 5,
    fairValue: 60,
    marginOfSafetyMinPct: 20,
    marginOfSafetyMaxPct: 30,
    interestingPriceLow: 42,
    interestingPriceHigh: 48,
    currency: "THB",
    sourceUrls: ["https://finance.yahoo.com/quote/AAA.BK/financials/", "https://finance.yahoo.com/quote/AAA.BK/key-statistics/"],
    limitations: ["Simple model"],
  },
};
const viContext = buildAiInvestmentContext(snapshot, {
  mode: "stock",
  symbol: "AAA",
  focus: "value_investing",
  contextView: "portfolio",
  currentRows: [{ Symbol: "AAA", Price: 45, Total_Score: 72 }],
  marketContext: { symbol: "AAA", source: "Yahoo Finance chart", fetchedAt: "2026-11-24T00:00:00.000Z", current: 45, history: [] },
  researchContext: { ...viResearchInput, privateNote: "must-not-leak" },
});
assert.equal(viContext.focus, "value_investing");
assert.equal(viContext.contextNeeds.vi, true);
assert.equal(viContext.dataQuality.completenessPct, 100);
assert.equal(viContext.researchContext.valuationModel.interestingPriceHigh, 48);
assert.equal(JSON.stringify(viContext).includes("must-not-leak"), false);
const viRequest = buildOpenRouterRequest(viContext);
assert.match(viRequest.messages[0].content, /long-term Thai value-investing review/u);
assert.equal(viRequest.response_format.json_schema.schema.properties.metricAssessments.minItems, 8);

const viResponse = await generateAiInvestmentExplanation(snapshot, {
  mode: "stock",
  symbol: "AAA",
  focus: "value_investing",
  contextView: "portfolio",
  currentRows: [{ Symbol: "AAA", Price: 45, Total_Score: 72 }],
  marketContext: { symbol: "AAA", source: "Yahoo Finance chart", fetchedAt: "2026-11-24T00:00:00.000Z", current: 45, history: [] },
  researchContext: viResearchInput,
}, {
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "AAA แบบ VI",
        companyOverview: "AAA ทำธุรกิจค้าปลีกจากข้อมูลบริษัทที่ยืนยันแล้ว",
        metricAssessments: viResearchInput.viFundamentals.metrics.map((metric) => ({ key: metric.key, assessment: "ปานกลาง", explanation: "ควรอ่านแนวโน้มย้อนหลังร่วมด้วย" })),
        competitiveAdvantages: [{ claim: "ขนาดรายได้ช่วยให้มีฐานธุรกิจ", sourceId: "yahoo_financials" }],
        valuationCommentary: "กรอบราคา 999 บาท",
        risks: ["กำไรอาจผันผวน"],
        verdict: "กิจการน่าสนใจ แต่ควรรอราคาที่เหมาะกว่า",
        verdictReasons: [{ claim: "กระแสเงินสดเป็นบวก", metricKey: "freeCashFlow" }],
        confidence: "ปานกลาง",
        missingData: [],
        nextAction: "ตรวจ 56-1 One Report",
        citations: [
          { label: "Yahoo Financials", url: "https://finance.yahoo.com/quote/AAA.BK/financials/" },
          { label: "Fake", url: "https://example.com/fake" },
        ],
        disclaimer: "ใช้ประกอบการตัดสินใจเท่านั้น",
      }) } }],
    }),
  }),
});
assert.equal(viResponse.result.type, "value_investing");
assert.equal(viResponse.result.metricTable.length, 8);
assert.equal(viResponse.result.metricTable.find((metric) => metric.key === "revenue").value, 1000000);
assert.equal(viResponse.result.valuation.fairValue, 60);
assert.equal(viResponse.result.valuation.interestingPriceLow, 42);
assert.equal(viResponse.result.valuation.interestingPriceHigh, 48);
assert.equal(viResponse.result.valuation.commentary.includes("999"), false);
assert.deepEqual(viResponse.result.citations.map((citation) => citation.url), ["https://finance.yahoo.com/quote/AAA.BK/financials/"]);

const viMissingResponse = await generateAiInvestmentExplanation(snapshot, {
  mode: "stock",
  symbol: "AAA",
  focus: "value_investing",
  contextView: "portfolio",
  currentRows: [{ Symbol: "AAA", Price: 45 }],
  researchContext: { ...viResearchInput, viFundamentals: { metrics: [], coveragePct: 0, missingKeys: viResearchInput.viFundamentals.metrics.map((metric) => metric.key), warnings: [] }, valuationModel: null },
}, {
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "AAA แบบ VI",
        companyOverview: "AAA",
        metricAssessments: viResearchInput.viFundamentals.metrics.map((metric) => ({ key: metric.key, assessment: "ดี", explanation: "เดา" })),
        competitiveAdvantages: [],
        valuationCommentary: "ซื้อได้ที่ 99 บาท",
        risks: [],
        verdict: "น่าศึกษาต่อในราคาปัจจุบัน",
        verdictReasons: [{ claim: "กำไรดี", metricKey: "netIncome" }],
        confidence: "สูง",
        missingData: [],
        nextAction: "ลงทุน",
        citations: [],
        disclaimer: "ศึกษาเท่านั้น",
      }) } }],
    }),
  }),
});
assert.equal(viMissingResponse.result.verdict, "ข้อมูลยังไม่พอประเมิน");
assert.equal(viMissingResponse.result.confidence, "ต่ำ");
assert.equal(viMissingResponse.result.valuation.available, false);
assert.equal(viMissingResponse.result.metricTable.every((metric) => metric.assessment === "ข้อมูลไม่พอ"), true);

const orCompareContext = buildAiInvestmentContext({ portfolioRows: [] }, {
  mode: "compare",
  symbol: "OR",
  contextView: "portfolio",
  currentRows: [
    { Symbol: "OR", Sector: "Energy", Total_Score: 61 },
    { Symbol: "PTT", Sector: "Energy", Total_Score: 70 },
    { Symbol: "CPALL", Sector: "Consumer Defensive", Total_Score: 80 },
  ],
});
assert.deepEqual(orCompareContext.currentRows.map((row) => row.Symbol), ["OR", "PTT"]);
assert.equal(JSON.stringify(orCompareContext).includes("CPALL"), false);

const verifiedCitations = filterVerifiedCitations([
  { label: "โปรไฟล์ OR", url: "https://finance.yahoo.com/quote/OR.BK/profile/" },
  { label: "ข่าว OR", url: "https://example-news.com/or" },
  { label: "ลิงก์ที่ AI สร้างเอง", url: "https://example.com/or-stock" },
], {
  sourceUrl: "https://finance.yahoo.com/quote/OR.BK/profile/",
  news: [{ url: "https://example-news.com/or" }],
});
assert.deepEqual(verifiedCitations.map((item) => item.url), [
  "https://finance.yahoo.com/quote/OR.BK/profile/",
  "https://example-news.com/or",
]);
assert.deepEqual(filterVerifiedCitations([{ label: "ปลอม", url: "https://example.com/or-stock" }], null), []);

const oversizedRows = Array.from({ length: 30 }, (_value, index) => ({
  Symbol: `S${String(index + 1).padStart(2, "0")}`,
  Sector: index % 2 ? "Energy" : "Commerce",
  Total_Score: 50 + index,
  RRR: 0.5 + index / 10,
  Market_Value: 1000 + index,
  Conflict_Severity: index === 29 ? "RED" : "YELLOW",
}));
const oversizedContext = buildAiInvestmentContext({ generatedAt: "2026-11-10T00:00:00.000Z" }, {
  mode: "portfolio",
  focus: "portfolio_review",
  contextView: "portfolio",
  currentRows: oversizedRows,
  filterSummary: "30 filtered stocks",
});
assert.equal(oversizedContext.scopeSummary.rowCount, 30);
assert.equal(oversizedContext.contextSelection.includedRowCount, 25);
assert.equal(oversizedContext.contextSelection.omittedRowCount, 5);
assert.equal(oversizedContext.contextSelection.includedSymbols.includes("S30"), true);
assert.equal(oversizedContext.scopeSummary.symbols.includes("S01"), true);
assert.equal(oversizedContext.dataQuality.snapshot.status, "stale");

const latestScreenRows = Array.from({ length: 28 }, (_value, index) => ({
  Symbol: `P${String(index + 1).padStart(2, "0")}`,
  Sector: index % 2 ? "Energy" : "Commerce",
  Total_Score: 50 + index,
  Market_Value: 10000 + index,
  Cost_Value: 11000 + index,
  Gain_Loss_Value: -1000,
  Target_Action: index === 27 ? "Reduce 50%" : "Hold",
}));
const currentScreenPortfolioContext = buildAiInvestmentContext({
  generatedAt: "2026-11-01T00:00:00.000Z",
  summary: {
    holdings: 25,
    marketValue: 297206.5,
    costValue: 331915.78,
    gainLoss: -34709.28,
    gainLossPct: -10.46,
    avgScore: 62.47,
  },
  portfolioRows: latestScreenRows.slice(0, 25),
}, {
  mode: "portfolio",
  contextView: "portfolio",
  analysisGeneratedAt: new Date().toISOString(),
  currentRows: latestScreenRows,
  filterSummary: "all 28 current holdings",
});
assert.equal(currentScreenPortfolioContext.contextSelection.summarySource, "current_screen_scope");
assert.equal(currentScreenPortfolioContext.contextSelection.freshnessSource, "current_screen_analysis");
assert.equal(currentScreenPortfolioContext.dataQuality.snapshot.status, "fresh");
assert.equal(currentScreenPortfolioContext.contextSelection.scopeRowCount, 28);
assert.equal(currentScreenPortfolioContext.contextSelection.includedRowCount, 25);
assert.equal(currentScreenPortfolioContext.contextSelection.omittedRowCount, 3);
assert.equal(currentScreenPortfolioContext.portfolioSummary.holdings, 28);
assert.equal(currentScreenPortfolioContext.portfolioSummary.marketValue, 280378);
assert.equal(currentScreenPortfolioContext.portfolioSummary.costValue, 308378);
assert.equal(currentScreenPortfolioContext.portfolioSummary.gainLoss, -28000);
assert.equal(currentScreenPortfolioContext.portfolioSummary.gainLossPct, -9.08);
assert.equal(currentScreenPortfolioContext.portfolioSummary.avgScore, 63.5);
assert.equal(currentScreenPortfolioContext.portfolioSummary.urgentActions, 1);
assert.equal(currentScreenPortfolioContext.currentRows.some((row) => row.Cost_Value > 0), true);
assert.notEqual(currentScreenPortfolioContext.portfolioSummary.marketValue, 297206.5);

const invalidCurrentTimestampContext = buildAiInvestmentContext({
  generatedAt: "2026-11-01T00:00:00.000Z",
  portfolioRows: latestScreenRows,
}, {
  mode: "portfolio",
  contextView: "portfolio",
  analysisGeneratedAt: new Date(Date.now() + 86400000).toISOString(),
  currentRows: latestScreenRows,
});
assert.equal(invalidCurrentTimestampContext.contextSelection.freshnessSource, "saved_snapshot");
assert.equal(invalidCurrentTimestampContext.generatedAt, "2026-11-01T00:00:00.000Z");
assert.equal(invalidCurrentTimestampContext.dataQuality.snapshot.status, "stale");

assert.deepEqual(inferAiContextNeeds({ mode: "stock", question: "PTT ทำธุรกิจอะไรและราคา 52 สัปดาห์อยู่ตรงไหน" }), {
  market: true,
  research: true,
  vi: false,
  reasons: ["คำถามต้องใช้บริบทราคา/แนวโน้ม", "คำถามต้องใช้ข้อมูลบริษัทหรือข่าวที่ยืนยันแหล่งที่มา"],
});
assert.deepEqual(inferAiContextNeeds({ mode: "stock", focus: "value_investing" }), {
  market: true,
  research: true,
  vi: true,
  reasons: [
    "คำถามต้องใช้บริบทราคา/แนวโน้ม",
    "คำถามต้องใช้ข้อมูลบริษัทหรือข่าวที่ยืนยันแหล่งที่มา",
    "การวิเคราะห์ VI ต้องใช้งบย้อนหลังและ valuation model ที่ตรวจสอบได้",
  ],
});

const verificationContext = buildAiInvestmentContext(snapshot, {
  mode: "stock",
  symbol: "AAA",
  contextView: "portfolio",
  currentRows: [{ Symbol: "AAA", Total_Score: 72, RRR: 1.8 }],
});
const validVerification = verifyAiInvestmentResponse({
  title: "AAA",
  conclusion: "AAA มีคะแนนที่ควรศึกษาเพิ่ม",
  nextAction: "ตรวจงบ AAA",
  confidence: "ปานกลาง",
  reasons: [{ claim: "คะแนนรวม", symbol: "AAA", field: "Total_Score", value: "72" }],
}, verificationContext);
assert.equal(validVerification.passed, true);

const invalidVerification = verifyAiInvestmentResponse({
  title: "AAA เทียบ OUTSIDE",
  conclusion: "ข้อมูลวันนี้เป็นเรียลไทม์",
  nextAction: "ซื้อ OUTSIDE",
  confidence: "สูง",
  reasons: [{ claim: "คะแนนรวม", symbol: "AAA", field: "Total_Score", value: "99" }],
}, verificationContext);
assert.equal(invalidVerification.passed, false);
assert.match(invalidVerification.issues.join(" "), /ข้อมูลจริงคือ 72/u);
assert.match(invalidVerification.issues.join(" "), /OUTSIDE/u);
assert.match(invalidVerification.issues.join(" "), /ผล Think2 เก่า/u);

const guardedResponse = await generateAiInvestmentExplanation(snapshot, { mode: "stock", symbol: "AAA" }, {
  apiKey: "test-key",
  fetchImpl: async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify({
      choices: [{ message: { content: JSON.stringify({
        title: "AAA",
        conclusion: "AAA มีข้อมูลวันนี้แบบเรียลไทม์",
        stance: "น่าศึกษาต่อ",
        reasons: [{ claim: "คะแนนรวมสูง", symbol: "AAA", field: "Total_Score", value: "99" }],
        missingData: [],
        nextAction: "ตรวจงบ AAA",
        confidence: "สูง",
        details: { metrics: [], risks: [], questions: [] },
        scopeUsed: "AAA",
        citations: [],
        disclaimer: "ใช้เพื่อการศึกษา",
      }) } }],
    }),
  }),
});
assert.equal(guardedResponse.result.verification.passed, false);
assert.equal(guardedResponse.result.decisionConfidence, "ต่ำ");
assert.equal(guardedResponse.result.decisionHeadline, "ข้อมูลไม่พอ");
assert.match(guardedResponse.result.dataLimitations.join(" "), /ตัวตรวจคำตอบ/u);
console.log("AI investment service regression passed.");
