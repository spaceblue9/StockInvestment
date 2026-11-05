const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 25000;
const MAX_HOLDINGS = 25;
const MAX_PEERS = 6;

const allowedModes = new Set(["portfolio", "stock", "compare"]);
const allowedContextViews = new Set(["portfolio", "screener", "sector", "simulation"]);
const focusTasks = {
  portfolio_review: "Name at least one supplied Symbol that needs review first. Cite its severity, action, score, loss, RRR, or data warning. Do not answer only with generic portfolio advice.",
  portfolio_warnings: "Explain the portfolio warnings and what facts the investor should verify before acting.",
  portfolio_concentration: "Explain portfolio concentration and sector exposure in beginner-friendly language.",
  screener_shortlist: "Explain why the strongest supplied screener rows passed the current quality and risk checks.",
  screener_risks: "Explain hidden risks or conflicting signals in the supplied recommendation rows.",
  sector_explain: "Explain sector strength, leaders, and shared risks using only the supplied rows.",
  sector_concentration: "Explain whether the currently filtered sector rows are concentrated in a few stocks and what to review next.",
  simulation_interpretation: "Explain how to read a strategy simulation, emphasizing that backtests do not predict future returns.",
  beginner_stock_basics: "Explain the selected company's verified business profile first, then translate its supplied PE, RSI, RRR, Volume Ratio, debt, and score into plain Thai. Clearly name every missing item, including MACD when it is not supplied.",
  beginner_metrics: "Teach the supplied metrics using the actual values: what each number means, whether it is a strength, warning, or unknown, and why no single metric is enough for a decision.",
  beginner_wait_reasons: "Give the strongest evidence-based reasons to slow down or avoid adding money now. Distinguish a real warning from missing data and list what would change the conclusion.",
};
const stockFields = [
  "Symbol", "Sector", "Price", "Total_Score", "Quality_Score", "Valuation_Score",
  "Setup_Score", "Balance_Risk_Score", "Liquidity_Score", "Composite_Score_v2",
  "PE", "ROE", "DE", "Yield", "RSI", "RRR", "Technical_RRR", "Upside_Pct", "Volume_Ratio",
  "Gain_Loss_Pct", "Market_Value", "Portfolio_Weight_Pct", "Trend_Status",
  "Advice", "Target_Action", "Effective_Target_Action", "Conflict_Severity",
  "Data_Status", "Data_Warnings", "Conflict_Alerts", "Rationale",
];

export function openRouterAiInfo() {
  return {
    configured: Boolean(process.env.OPENROUTER_API_KEY),
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    monthlyLimit: aiMonthlyRequestLimit(),
    privacy: {
      zeroDataRetention: true,
      dataCollection: "deny",
      sendsPersonalIdentity: false,
    },
  };
}

export function aiMonthlyRequestLimit() {
  const configured = Number(process.env.OPENROUTER_MONTHLY_REQUEST_LIMIT || 40);
  return Number.isFinite(configured) ? Math.max(1, Math.min(500, Math.trunc(configured))) : 40;
}

export function buildAiInvestmentContext(snapshot, input = {}) {
  const mode = allowedModes.has(input.mode) ? input.mode : "portfolio";
  const hasExplicitContextView = allowedContextViews.has(input.contextView);
  const contextView = hasExplicitContextView ? input.contextView : "portfolio";
  const filterSummary = String(input.filterSummary || "").trim().slice(0, 500);
  const question = String(input.question || "").trim().slice(0, 600);
  const focus = Object.hasOwn(focusTasks, input.focus) ? input.focus : "";
  const currentRows = (Array.isArray(input.currentRows) ? input.currentRows : [])
    .slice(0, MAX_HOLDINGS)
    .map(sanitizeStockRow)
    .filter((row) => row.Symbol);
  const portfolioRows = (snapshot?.portfolioRows || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const recommendations = (snapshot?.recommendations || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const symbol = cleanSymbol(input.symbol);
  const rowsAreScoped = hasExplicitContextView;
  const allRows = rowsAreScoped
    ? uniqueBySymbol(currentRows)
    : uniqueBySymbol([...currentRows, ...portfolioRows, ...recommendations]);
  const selectedStock = symbol ? allRows.find((row) => row.Symbol === symbol) || null : null;
  const sector = selectedStock?.Sector || "";
  const peers = selectedStock
    ? allRows
      .filter((row) => row.Symbol !== selectedStock.Symbol && row.Sector === sector)
      .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))
      .slice(0, MAX_PEERS)
    : [];

  if (["stock", "compare"].includes(mode) && !selectedStock) {
    const error = new Error("ไม่พบหุ้นที่เลือกในผลวิเคราะห์ปัจจุบัน กรุณารัน Analyze my portfolio อีกครั้งแล้วลองใหม่");
    error.statusCode = 400;
    throw error;
  }

  const modeRows = mode === "stock"
    ? [selectedStock].filter(Boolean)
    : mode === "compare"
      ? [selectedStock, ...peers].filter(Boolean)
      : allRows;

  return {
    mode,
    focus,
    contextView,
    filterSummary,
    question,
    generatedAt: snapshot?.generatedAt || "",
    dataContract: {
      scoringSource: "Think2 deterministic analysis",
      aiRole: "Explain and compare only",
      companyProfileAvailable: Boolean(input.researchContext?.profile?.name),
      priceFreshness: input.marketContext?.fetchedAt ? "Use marketContext fetchedAt; historical chart is not a real-time trade quote" : "Use generatedAt; do not claim real-time data",
    },
    portfolioSummary: contextView === "portfolio" && mode === "portfolio" ? sanitizeSummary(snapshot?.summary || {}) : {},
    holdings: uniqueBySymbol(modeRows).slice(0, MAX_HOLDINGS),
    currentRows: uniqueBySymbol(modeRows).slice(0, MAX_HOLDINGS),
    viewContext: contextView === "simulation" ? sanitizeSimulationViewContext(input.viewContext) : null,
    marketContext: sanitizeMarketContext(input.marketContext, allRows),
    researchContext: sanitizeResearchContext(input.researchContext, allRows),
    selectedStock,
    peers: mode === "compare" ? peers : [],
  };
}

export function buildOpenRouterRequest(context) {
  const task = context.contextView === "simulation"
    ? "Explain the supplied simulation summary, strategy versus buy-and-hold result, buy plan, sampled history, and trades. State whether the result merits further study or should be treated cautiously."
    : ({
    portfolio: "Summarize portfolio concentration, strengths, risks, and practical questions the investor should study next.",
    stock: "Explain only the selected stock's Think2 metrics and warnings in beginner-friendly Thai. Do not summarize the portfolio and do not mention any other stock. Do not invent its business description.",
    compare: "Compare only the selected stock with the supplied peers from the same sector using supplied metrics. Do not summarize the whole portfolio.",
  }[context.mode]);
  const focusTask = context.focus ? focusTasks[context.focus] : "";
  const questionTask = context.question
    ? `\nUser question: ${context.question}\nAnswer this question directly. If it asks about a stock, fact, date, or metric outside the supplied scope, explicitly say the information is outside the current scope and do not guess.`
    : "";

  return {
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    temperature: 0.2,
    max_tokens: 1400,
    provider: {
      zdr: true,
      data_collection: "deny",
      require_parameters: true,
    },
    usage: { include: true },
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "stockflix_ai_explanation",
        strict: true,
        schema: aiResponseSchema(),
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are StockFlix AI Explainer for beginner Thai investors.",
          "Reply in Thai using plain language.",
          "Use only the supplied JSON facts. Never calculate or replace Think2 scores or actions.",
          "Never issue a direct buy/sell order, guaranteed return, target price, or suitability claim.",
          "Always provide decision support: choose the most useful next study or review action, explain why using supplied facts, list checks required before acting, and state confidence as ต่ำ, ปานกลาง, or สูง.",
          "Start with a short beginner conclusion. Whenever you mention PE, RSI, RRR, Volume Ratio, debt, yield, score, or another metric, include its supplied value, explain the term in plain Thai, and say what the value can and cannot prove.",
          "Never recommend a stock from Total Score alone. Cross-check valuation, reward versus risk, financial risk, trend/setup, liquidity, data warnings, and portfolio concentration when those facts are supplied.",
          "MACD is not supplied by this application. If asked about MACD, explicitly say it cannot be evaluated from the current data. Never invent missing metrics, company facts, news, forecasts, or price targets.",
          "For PE, never say a stock is cheap, inexpensive, or not expensive from PE alone. A supplied peer or historical comparison is required, and growth plus earnings quality must still be checked. For RSI, explain that it is momentum rather than business quality. For RRR, explain that it is a scenario estimate, not a guaranteed payoff or proof that the stock is suitable. For Volume Ratio, explain that unusual trading activity can be buying or selling pressure.",
          "For stock or compare mode, identify which supplied stock is most worth studying next when evidence permits. For portfolio mode, prioritize what the investor should review first. For simulation, state whether the result merits further study or should be treated cautiously.",
          "Use decision language such as น่าศึกษาต่อ, ควรตรวจ, or ควรชะลอ. Do not say the user should buy or sell.",
          "If company business information is absent, explicitly say that a verified company profile is unavailable; never infer it from the ticker. If researchContext is present, translate industry labels by business meaning: Packaged Foods means อาหารสำเร็จรูปหรืออาหารบรรจุห่อ, not ธุรกิจบรรจุภัณฑ์. Use only its company, sector, industry, and news facts and return only supplied source URLs in citations.",
          "Treat Target_Action as an existing system output and explain it with uncertainty, not as personal financial advice.",
        ].join(" "),
      },
      {
        role: "user",
        content: `${task}${focusTask ? `\nFocus: ${focusTask}` : ""}${questionTask}\n\nVerified application data:\n${JSON.stringify(context)}`,
      },
    ],
  };
}

export async function generateAiInvestmentExplanation(snapshot, input = {}, options = {}) {
  const apiKey = options.apiKey || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    const error = new Error("AI Assistant is not configured yet. The owner must add OPENROUTER_API_KEY on the server.");
    error.code = "AI_NOT_CONFIGURED";
    error.statusCode = 503;
    throw error;
  }

  const context = buildAiInvestmentContext(snapshot, input);
  const requestBody = buildOpenRouterRequest(context);
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || process.env.OPENROUTER_TIMEOUT_MS || DEFAULT_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), Math.max(3000, Math.min(60000, timeoutMs)));

  try {
    const response = await (options.fetchImpl || fetch)(OPENROUTER_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.APP_PUBLIC_URL || "https://thai-stock-investment-web.vercel.app",
        "X-Title": "StockFlix Investor Studio",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
    const payload = await readJsonResponse(response);
    if (!response.ok) {
      const error = new Error(payload?.error?.message || payload?.message || `OpenRouter request failed (${response.status}).`);
      error.statusCode = response.status >= 500 ? 503 : 502;
      throw error;
    }

    const content = payload?.choices?.[0]?.message?.content;
    const result = validateAiResponse(parseJsonContent(content), context);
    return {
      result,
      context: {
        mode: context.mode,
        generatedAt: context.generatedAt,
        symbol: context.selectedStock?.Symbol || "",
        peerCount: context.peers.length,
        holdingCount: context.holdings.length,
      },
      usage: sanitizeUsage(payload?.usage || {}),
      model: payload?.model || requestBody.model,
      provider: payload?.provider || "",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      const timeoutError = new Error("AI Assistant took too long to respond. Please try again.");
      timeoutError.code = "AI_TIMEOUT";
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function aiResponseSchema() {
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "summary", "beginnerConclusion", "beginnerMetrics", "decisionHeadline", "decisionAction", "decisionReasons", "decisionChecks", "decisionConfidence", "keyPoints", "risks", "nextQuestions", "dataLimitations", "citations", "disclaimer"],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      beginnerConclusion: { type: "string" },
      beginnerMetrics: { type: "array", items: { type: "string" }, maxItems: 6 },
      decisionHeadline: { type: "string" },
      decisionAction: { type: "string" },
      decisionReasons: { type: "array", items: { type: "string" }, maxItems: 4 },
      decisionChecks: { type: "array", items: { type: "string" }, maxItems: 4 },
      decisionConfidence: { type: "string", enum: ["ต่ำ", "ปานกลาง", "สูง"] },
      keyPoints: { type: "array", items: { type: "string" }, maxItems: 6 },
      risks: { type: "array", items: { type: "string" }, maxItems: 6 },
      nextQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
      dataLimitations: { type: "array", items: { type: "string" }, maxItems: 5 },
      citations: {
        type: "array",
        maxItems: 6,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["label", "url"],
          properties: { label: { type: "string" }, url: { type: "string" } },
        },
      },
      disclaimer: { type: "string" },
    },
  };
}

function sanitizeStockRow(row = {}) {
  return stockFields.reduce((result, field) => {
    const value = row?.[field];
    if (value !== undefined && value !== null && value !== "") {
      result[field] = sanitizeScalar(value);
    }
    return result;
  }, {});
}

function sanitizeSummary(summary = {}) {
  return ["holdings", "marketValue", "costValue", "gainLoss", "gainLossPct", "avgScore", "urgentActions"]
    .reduce((result, field) => {
      if (summary[field] !== undefined && summary[field] !== null) {
        result[field] = numberValue(summary[field]);
      }
      return result;
    }, {});
}

function sanitizeSimulationViewContext(input = {}) {
  if (!input || typeof input !== "object") return null;
  const numericSummaryFields = ["initialCapital", "finalValue", "roi", "buyHoldValue", "buyHoldRoi", "totalTrades", "averageCost", "completedTranches", "deployedCapital"];
  const summary = numericSummaryFields.reduce((result, field) => {
    if (input.summary?.[field] !== undefined && input.summary?.[field] !== null) result[field] = numberValue(input.summary[field]);
    return result;
  }, {});
  const buyPlan = ["mode", "tranches", "trancheIntervalDays", "amountPerTranche", "completedTranches", "deployedCapital", "averageCost"].reduce((result, field) => {
    const value = input.buyPlan?.[field];
    if (value !== undefined && value !== null && value !== "") result[field] = sanitizeScalar(value);
    return result;
  }, {});
  const historyFields = ["Date", "Price", "Portfolio_Value", "Buy_Hold_Value", "Cash", "Shares", "Deployed_Capital", "Action"];
  const tradeFields = ["Date", "Action", "Price", "Shares", "Cost"];
  return {
    symbol: cleanSymbol(input.symbol),
    summary,
    buyPlan,
    history: sanitizeRecordList(input.history, historyFields, 25),
    trades: sanitizeRecordList(input.trades, tradeFields, 20),
  };
}

function sanitizeMarketContext(input = {}, allowedRows = []) {
  const symbol = cleanSymbol(input?.symbol);
  const allowedSymbols = new Set(allowedRows.map((row) => row.Symbol));
  if (!symbol || !allowedSymbols.has(symbol)) return null;
  const history = (Array.isArray(input.history) ? input.history : []).slice(-260).map((row) => ({
    Date: String(row?.Date || "").slice(0, 10),
    Close: numberValue(row?.Close),
    Volume: numberValue(row?.Volume),
  })).filter((row) => /^\d{4}-\d{2}-\d{2}$/u.test(row.Date) && row.Close > 0);
  return {
    symbol,
    source: String(input?.source || "").slice(0, 80),
    fetchedAt: String(input?.fetchedAt || "").slice(0, 40),
    current: numberValue(input?.current),
    low52Week: numberValue(input?.low52Week),
    high52Week: numberValue(input?.high52Week),
    pricePositionPct: numberValue(input?.pricePositionPct),
    history,
  };
}

function sanitizeResearchContext(input = {}, allowedRows = []) {
  const symbol = cleanSymbol(input?.symbol);
  const allowedSymbols = new Set(allowedRows.map((row) => row.Symbol));
  if (!symbol || !allowedSymbols.has(symbol)) return null;
  const safeUrl = (value) => {
    try {
      const url = new URL(String(value || ""));
      return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 1000) : "";
    } catch {
      return "";
    }
  };
  return {
    symbol,
    source: String(input?.source || "").slice(0, 80),
    sourceUrl: safeUrl(input?.sourceUrl),
    fetchedAt: String(input?.fetchedAt || "").slice(0, 40),
    profile: {
      name: String(input?.profile?.name || "").slice(0, 200),
      exchange: String(input?.profile?.exchange || "").slice(0, 80),
      sector: String(input?.profile?.sector || "").slice(0, 120),
      industry: String(input?.profile?.industry || "").slice(0, 160),
    },
    news: (Array.isArray(input?.news) ? input.news : []).slice(0, 5).map((item) => ({
      title: String(item?.title || "").slice(0, 300),
      publisher: String(item?.publisher || "").slice(0, 120),
      publishedAt: String(item?.publishedAt || "").slice(0, 40),
      url: safeUrl(item?.url),
    })).filter((item) => item.title && item.url),
  };
}

function sanitizeRecordList(rows, fields, limit) {
  return (Array.isArray(rows) ? rows : []).slice(-limit).map((row) => fields.reduce((result, field) => {
    const value = row?.[field];
    if (value !== undefined && value !== null && value !== "") result[field] = sanitizeScalar(value);
    return result;
  }, {}));
}

function sanitizeScalar(value) {
  return typeof value === "number" ? (Number.isFinite(value) ? value : 0) : String(value).slice(0, 500);
}

function uniqueBySymbol(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    if (!row.Symbol || seen.has(row.Symbol)) return false;
    seen.add(row.Symbol);
    return true;
  });
}

function cleanSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/\.BK$/u, "").slice(0, 20);
}

function numberValue(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function readJsonResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    const error = new Error("OpenRouter returned an invalid response.");
    error.statusCode = 502;
    throw error;
  }
}

function parseJsonContent(content) {
  if (typeof content === "object" && content !== null) return content;
  const text = String(content || "").trim().replace(/^```(?:json)?\s*/iu, "").replace(/\s*```$/u, "");
  try {
    return JSON.parse(text);
  } catch {
    const error = new Error("AI Assistant returned an unexpected format. Please try again.");
    error.statusCode = 502;
    throw error;
  }
}

function validateAiResponse(result, context = {}) {
  if (!result || typeof result !== "object" || !result.title || !result.summary) {
    const error = new Error("AI Assistant response was incomplete. Please try again.");
    error.statusCode = 502;
    throw error;
  }
  return {
    title: String(result.title).slice(0, 180),
    summary: String(result.summary).slice(0, 1800),
    beginnerConclusion: String(result.beginnerConclusion || "ยังไม่ควรตัดสินใจจากตัวเลขเดียว ควรอ่านเหตุผลและข้อมูลที่ขาดก่อน").slice(0, 800),
    beginnerMetrics: cleanStringList(result.beginnerMetrics, 6),
    decisionHeadline: String(result.decisionHeadline || "ควรตรวจข้อมูลเพิ่มก่อนตัดสินใจ").slice(0, 240),
    decisionAction: String(result.decisionAction || "ทบทวนข้อมูลและความเสี่ยงที่ระบบแสดงก่อนดำเนินการ").slice(0, 800),
    decisionReasons: cleanStringList(result.decisionReasons, 4),
    decisionChecks: cleanStringList(result.decisionChecks, 4),
    decisionConfidence: ["ต่ำ", "ปานกลาง", "สูง"].includes(result.decisionConfidence) ? result.decisionConfidence : "ต่ำ",
    keyPoints: cleanStringList(result.keyPoints, 6),
    risks: cleanStringList(result.risks, 6),
    nextQuestions: cleanStringList(result.nextQuestions, 5),
    dataLimitations: cleanStringList(result.dataLimitations, 5),
    citations: filterVerifiedCitations(result.citations, context.researchContext),
    disclaimer: String(result.disclaimer || "ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำเฉพาะบุคคล").slice(0, 500),
  };
}

export function filterVerifiedCitations(citations, researchContext) {
  if (!researchContext) return [];
  const allowedUrls = new Set([
    researchContext.sourceUrl,
    ...(researchContext.news || []).map((item) => item.url),
  ].map(safeCitationUrl).filter(Boolean));
  return (Array.isArray(citations) ? citations : []).slice(0, 6).map((item) => ({
    label: String(item?.label || "แหล่งข้อมูล").slice(0, 200),
    url: safeCitationUrl(item?.url),
  })).filter((item) => allowedUrls.has(item.url));
}

function safeCitationUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 1000) : "";
  } catch {
    return "";
  }
}

function cleanStringList(values, limit) {
  return (Array.isArray(values) ? values : []).slice(0, limit).map((value) => String(value).slice(0, 500));
}

function sanitizeUsage(usage = {}) {
  return {
    promptTokens: numberValue(usage.prompt_tokens),
    completionTokens: numberValue(usage.completion_tokens),
    totalTokens: numberValue(usage.total_tokens),
    costUsd: numberValue(usage.cost),
  };
}
