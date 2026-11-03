const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 25000;
const MAX_HOLDINGS = 25;
const MAX_PEERS = 6;

const allowedModes = new Set(["portfolio", "stock", "compare"]);
const focusTasks = {
  portfolio_review: "Prioritize which holdings need review first using severity, portfolio weight, loss, and data warnings.",
  portfolio_warnings: "Explain the portfolio warnings and what facts the investor should verify before acting.",
  portfolio_concentration: "Explain portfolio concentration and sector exposure in beginner-friendly language.",
  screener_shortlist: "Explain why the strongest supplied screener rows passed the current quality and risk checks.",
  screener_risks: "Explain hidden risks or conflicting signals in the supplied recommendation rows.",
  sector_explain: "Explain sector strength, leaders, and shared risks using only the supplied rows.",
  sector_concentration: "Explain whether the portfolio appears concentrated by sector and what to review next.",
  simulation_interpretation: "Explain how to read a strategy simulation, emphasizing that backtests do not predict future returns.",
};
const stockFields = [
  "Symbol", "Sector", "Price", "Total_Score", "Quality_Score", "Valuation_Score",
  "Setup_Score", "Balance_Risk_Score", "Liquidity_Score", "Composite_Score_v2",
  "PE", "ROE", "DE", "Yield", "RSI", "RRR", "Technical_RRR", "Upside_Pct",
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
  const focus = Object.hasOwn(focusTasks, input.focus) ? input.focus : "";
  const currentRows = (Array.isArray(input.currentRows) ? input.currentRows : [])
    .slice(0, MAX_HOLDINGS)
    .map(sanitizeStockRow)
    .filter((row) => row.Symbol);
  const portfolioRows = (snapshot?.portfolioRows || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const recommendations = (snapshot?.recommendations || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const symbol = cleanSymbol(input.symbol);
  const allRows = uniqueBySymbol([...currentRows, ...portfolioRows, ...recommendations]);
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

  return {
    mode,
    focus,
    generatedAt: snapshot?.generatedAt || "",
    dataContract: {
      scoringSource: "Think2 deterministic analysis",
      aiRole: "Explain and compare only",
      companyProfileAvailable: false,
      priceFreshness: "Use generatedAt; do not claim real-time data",
    },
    portfolioSummary: sanitizeSummary(snapshot?.summary || {}),
    holdings: uniqueBySymbol([...currentRows, ...portfolioRows]).slice(0, MAX_HOLDINGS),
    currentRows,
    selectedStock,
    peers,
  };
}

export function buildOpenRouterRequest(context) {
  const task = {
    portfolio: "Summarize portfolio concentration, strengths, risks, and practical questions the investor should study next.",
    stock: "Explain the selected stock's Think2 metrics and warnings in beginner-friendly Thai. Do not invent its business description.",
    compare: "Compare the selected stock with supplied peers from the same sector using only supplied metrics.",
  }[context.mode];
  const focusTask = context.focus ? focusTasks[context.focus] : "";

  return {
    model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
    temperature: 0.2,
    max_tokens: 1100,
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
          "If company business information is absent, explicitly say that a verified company profile is unavailable; never infer it from the ticker.",
          "Treat Target_Action as an existing system output and explain it with uncertainty, not as personal financial advice.",
        ].join(" "),
      },
      {
        role: "user",
        content: `${task}${focusTask ? `\nFocus: ${focusTask}` : ""}\n\nVerified application data:\n${JSON.stringify(context)}`,
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
    const result = validateAiResponse(parseJsonContent(content));
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
    required: ["title", "summary", "keyPoints", "risks", "nextQuestions", "dataLimitations", "disclaimer"],
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      keyPoints: { type: "array", items: { type: "string" }, maxItems: 6 },
      risks: { type: "array", items: { type: "string" }, maxItems: 6 },
      nextQuestions: { type: "array", items: { type: "string" }, maxItems: 5 },
      dataLimitations: { type: "array", items: { type: "string" }, maxItems: 5 },
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

function validateAiResponse(result) {
  if (!result || typeof result !== "object" || !result.title || !result.summary) {
    const error = new Error("AI Assistant response was incomplete. Please try again.");
    error.statusCode = 502;
    throw error;
  }
  return {
    title: String(result.title).slice(0, 180),
    summary: String(result.summary).slice(0, 1800),
    keyPoints: cleanStringList(result.keyPoints, 6),
    risks: cleanStringList(result.risks, 6),
    nextQuestions: cleanStringList(result.nextQuestions, 5),
    dataLimitations: cleanStringList(result.dataLimitations, 5),
    disclaimer: String(result.disclaimer || "ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำเฉพาะบุคคล").slice(0, 500),
  };
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
