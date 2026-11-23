const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_TIMEOUT_MS = 25000;
const MAX_HOLDINGS = 25;
const MAX_SCOPE_ROWS = 200;
const MAX_SCOPE_SYMBOLS = 120;
const MAX_PEERS = 6;
const FRESH_HOURS = 24;
const AGING_HOURS = 72;

const allowedModes = new Set(["portfolio", "stock", "compare"]);
const allowedContextViews = new Set(["portfolio", "screener", "sector", "simulation"]);
const focusTasks = {
  portfolio_review: "Use reviewQueue as the risk-first order. Review the first supplied Symbol before high-score opportunities: RED severity first, then Exit/Sell/Reduce actions, ORANGE severity, data warnings, losses, and low RRR. Never choose a high-score Buy/Accumulate row while a more urgent row exists unless you clearly explain why. Cite its severity, action, loss, RRR, or data warning. Do not answer only with generic portfolio advice.",
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
const completenessFields = ["Price", "Total_Score", "RRR", "PE", "ROE", "DE", "RSI", "Volume_Ratio", "Trend_Status", "Data_Status"];
const evidenceFields = [...stockFields, "scopeRowCount", "marketValue", "gainLossPct", "avgScore", "urgentActions"];
const decisionStances = ["ควรตรวจเร่งด่วน", "ควรชะลอ", "น่าศึกษาต่อ", "ข้อมูลไม่พอ"];

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
    .slice(0, MAX_SCOPE_ROWS)
    .map(sanitizeStockRow)
    .filter((row) => row.Symbol);
  const portfolioRows = (snapshot?.portfolioRows || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const recommendations = (snapshot?.recommendations || []).map(sanitizeStockRow).filter((row) => row.Symbol);
  const symbol = cleanSymbol(input.symbol);
  const rowsAreScoped = hasExplicitContextView;
  const scopedRows = rowsAreScoped
    ? uniqueBySymbol(currentRows)
    : uniqueBySymbol([...currentRows, ...portfolioRows, ...recommendations]);
  const selectedStock = symbol ? scopedRows.find((row) => row.Symbol === symbol) || null : null;
  const sector = selectedStock?.Sector || "";
  const peers = selectedStock
    ? scopedRows
      .filter((row) => row.Symbol !== selectedStock.Symbol && row.Sector === sector)
      .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))
      .slice(0, MAX_PEERS)
    : [];

  if (["stock", "compare"].includes(mode) && !selectedStock) {
    const error = new Error("ไม่พบหุ้นที่เลือกในผลวิเคราะห์ปัจจุบัน กรุณารัน Analyze my portfolio อีกครั้งแล้วลองใหม่");
    error.statusCode = 400;
    throw error;
  }

  const reviewQueue = mode === "portfolio" && focus === "portfolio_review"
    ? buildPortfolioReviewQueue(scopedRows)
    : [];
  const rowSelection = selectContextRows(scopedRows, {
    mode,
    contextView,
    focus,
    question,
    selectedStock,
    peers,
    reviewQueue,
  });
  const modeRows = mode === "stock"
    ? [selectedStock].filter(Boolean)
    : mode === "compare"
      ? [selectedStock, ...peers].filter(Boolean)
      : rowSelection.rows;
  const allowedSupportingRows = mode === "portfolio" ? scopedRows : uniqueBySymbol(modeRows);
  const marketContext = sanitizeMarketContext(input.marketContext, allowedSupportingRows);
  const researchContext = sanitizeResearchContext(input.researchContext, allowedSupportingRows);
  const contextNeeds = inferAiContextNeeds({ mode, focus, question, contextView });
  const effectiveScopeRows = mode === "portfolio" ? scopedRows : uniqueBySymbol(modeRows);
  const scopeSummary = summarizeScope(effectiveScopeRows, filterSummary);
  const contextSelection = {
    scopeRowCount: effectiveScopeRows.length,
    includedRowCount: uniqueBySymbol(modeRows).length,
    omittedRowCount: Math.max(0, effectiveScopeRows.length - uniqueBySymbol(modeRows).length),
    includedSymbols: uniqueBySymbol(modeRows).map((row) => row.Symbol),
    selectionReason: rowSelection.reason,
  };
  const dataQuality = buildDataQuality({
    generatedAt: snapshot?.generatedAt,
    rows: uniqueBySymbol(modeRows),
    scopeRowCount: effectiveScopeRows.length,
    marketContext,
    researchContext,
    contextNeeds,
    contextView,
    viewContext: input.viewContext,
  });

  return {
    mode,
    focus,
    contextView,
    filterSummary,
    question,
    generatedAt: snapshot?.generatedAt || "",
    dataContract: {
      scoringSource: "Think2 deterministic analysis",
      aiRole: "Decision support with deterministic verification; never replace Think2 outputs",
      companyProfileAvailable: Boolean(researchContext?.profile?.name),
      priceFreshness: marketContext?.fetchedAt ? "Use marketContext fetchedAt; historical chart is not a real-time trade quote" : "Use generatedAt; do not claim real-time data",
    },
    portfolioSummary: contextView === "portfolio" && mode === "portfolio" ? sanitizeSummary(snapshot?.summary || {}) : {},
    holdings: uniqueBySymbol(modeRows).slice(0, MAX_HOLDINGS),
    currentRows: uniqueBySymbol(modeRows).slice(0, MAX_HOLDINGS),
    reviewQueue,
    scopeSummary,
    contextSelection,
    contextNeeds,
    dataQuality,
    viewContext: contextView === "simulation" ? sanitizeSimulationViewContext(input.viewContext) : null,
    marketContext,
    researchContext,
    selectedStock,
    peers: mode === "compare" ? peers : [],
  };
}

export function inferAiContextNeeds(input = {}) {
  const text = [input.question, input.focus, input.mode, input.contextView].filter(Boolean).join(" ").toLowerCase();
  const research = input.focus === "beginner_stock_basics"
    || /(ทำธุรกิจ|บริษัท|อุตสาหกรรม|คู่แข่ง|ข่าว|งบ|รายได้|กำไร|business|company|industry|competitor|news|earnings)/iu.test(text);
  const market = ["stock", "compare"].includes(input.mode)
    || /(ราคา|กราฟ|52\s*สัปดาห์|แนวโน้ม|volume|rsi|macd|rrr|ตอนนี้|น่าลงทุน|price|chart|week|trend)/iu.test(text);
  return {
    market,
    research,
    reasons: [
      ...(market ? ["คำถามต้องใช้บริบทราคา/แนวโน้ม"] : []),
      ...(research ? ["คำถามต้องใช้ข้อมูลบริษัทหรือข่าวที่ยืนยันแหล่งที่มา"] : []),
    ],
  };
}

function selectContextRows(rows, options = {}) {
  if (options.mode === "stock") return { rows: [options.selectedStock].filter(Boolean), reason: "selected stock only" };
  if (options.mode === "compare") return { rows: [options.selectedStock, ...(options.peers || [])].filter(Boolean), reason: "selected stock and same-sector peers" };
  if (rows.length <= MAX_HOLDINGS) return { rows, reason: "all rows in the active scope" };

  const mentionedSymbols = findMentionedSymbols(options.question, rows.map((row) => row.Symbol));
  const urgentSymbols = new Set((options.reviewQueue || []).map((row) => row.Symbol));
  const ranked = rows.slice().sort((left, right) => {
    const mentionedDelta = Number(mentionedSymbols.has(right.Symbol)) - Number(mentionedSymbols.has(left.Symbol));
    if (mentionedDelta) return mentionedDelta;
    const urgentDelta = Number(urgentSymbols.has(right.Symbol)) - Number(urgentSymbols.has(left.Symbol));
    if (urgentDelta) return urgentDelta;
    const riskDelta = portfolioReviewPriority(right).score - portfolioReviewPriority(left).score;
    if (riskDelta) return riskDelta;
    const marketValueDelta = numberValue(right.Market_Value) - numberValue(left.Market_Value);
    if (marketValueDelta) return marketValueDelta;
    return numberValue(right.Total_Score) - numberValue(left.Total_Score);
  });
  return {
    rows: ranked.slice(0, MAX_HOLDINGS),
    reason: mentionedSymbols.size
      ? "question symbols first, then urgent risk and portfolio relevance"
      : "urgent risk, portfolio weight, and score relevance",
  };
}

function findMentionedSymbols(question, symbols) {
  const normalized = String(question || "").toUpperCase();
  return new Set(symbols.filter((symbol) => new RegExp(`(^|[^A-Z0-9])${escapeRegExp(symbol)}([^A-Z0-9]|$)`, "u").test(normalized)));
}

function summarizeScope(rows, filterSummary) {
  const symbols = rows.map((row) => row.Symbol).filter(Boolean);
  return {
    filterSummary,
    rowCount: rows.length,
    symbolCount: new Set(symbols).size,
    symbols: symbols.slice(0, MAX_SCOPE_SYMBOLS),
    symbolsOmitted: Math.max(0, symbols.length - MAX_SCOPE_SYMBOLS),
    sectors: countValues(rows.map((row) => row.Sector || "Unknown"), 12),
    severities: countValues(rows.map((row) => String(row.Conflict_Severity || "NONE").toUpperCase()), 6),
    actions: countValues(rows.map((row) => row.Effective_Target_Action || row.Target_Action || row.Advice || "Unknown"), 10),
    metrics: {
      avgScore: averagePresent(rows, "Total_Score"),
      avgRrr: averagePresent(rows, "RRR"),
      totalMarketValue: sumPresent(rows, "Market_Value"),
    },
  };
}

function buildDataQuality({ generatedAt, rows, scopeRowCount, marketContext, researchContext, contextNeeds, contextView, viewContext }) {
  const snapshotFreshness = freshnessDetails(generatedAt);
  const marketFreshness = freshnessDetails(marketContext?.fetchedAt);
  const researchFreshness = freshnessDetails(researchContext?.fetchedAt);
  const isSimulation = contextView === "simulation";
  const checkedFields = isSimulation
    ? ["initialCapital", "finalValue", "roi", "buyHoldValue", "buyHoldRoi", "totalTrades"]
    : completenessFields;
  const checkedRows = isSimulation ? [viewContext?.summary || {}] : rows;
  const totalCells = Math.max(1, checkedRows.length * checkedFields.length);
  const presentCells = checkedRows.reduce((count, row) => count + checkedFields.filter((field) => hasMeaningfulValue(row[field])).length, 0);
  const coverageByField = Object.fromEntries(checkedFields.map((field) => [
    field,
    checkedRows.length ? Math.round((checkedRows.filter((row) => hasMeaningfulValue(row[field])).length / checkedRows.length) * 100) : 0,
  ]));
  const missingFields = checkedFields.filter((field) => coverageByField[field] < 60);
  const warnings = [];
  if (snapshotFreshness.status === "stale") warnings.push(`ผล Think2 เก่าประมาณ ${snapshotFreshness.ageDays} วัน ควรรัน Analyze ใหม่ก่อนใช้ตัดสินใจ`);
  if (snapshotFreshness.status === "unknown") warnings.push("ไม่พบเวลาที่สร้างผล Think2 จึงยืนยันความสดของข้อมูลไม่ได้");
  if (contextNeeds.market && !marketContext) warnings.push("คำถามนี้ต้องใช้ข้อมูลราคา/แนวโน้ม แต่ยังไม่มี Yahoo market context");
  if (contextNeeds.research && !researchContext) warnings.push("คำถามนี้ต้องใช้ข้อมูลบริษัท/ข่าว แต่ยังไม่มี research context ที่ยืนยันแหล่งที่มา");
  if (missingFields.length) warnings.push(`ข้อมูลตัวเลขยังไม่ครบ: ${missingFields.join(", ")}`);
  return {
    snapshot: snapshotFreshness,
    market: marketFreshness,
    research: researchFreshness,
    completenessPct: Math.round((presentCells / totalCells) * 100),
    coverageByField,
    missingFields,
    warnings,
    scopeRowCount,
    sources: [
      isSimulation ? "Think2 simulation result" : "Think2 deterministic snapshot",
      ...(marketContext ? [marketContext.source || "Yahoo Finance chart"] : []),
      ...(researchContext ? [researchContext.source || "Yahoo Finance research"] : []),
    ],
  };
}

function freshnessDetails(value) {
  const timestamp = new Date(value || "").getTime();
  if (!Number.isFinite(timestamp)) return { fetchedAt: "", ageHours: null, ageDays: null, status: "unknown" };
  const ageHours = Math.max(0, (Date.now() - timestamp) / 3600000);
  return {
    fetchedAt: new Date(timestamp).toISOString(),
    ageHours: Math.round(ageHours * 10) / 10,
    ageDays: Math.round((ageHours / 24) * 10) / 10,
    status: ageHours <= FRESH_HOURS ? "fresh" : ageHours <= AGING_HOURS ? "aging" : "stale",
  };
}

function countValues(values, limit) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(String(value), (counts.get(String(value)) || 0) + 1));
  return Object.fromEntries([...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, limit));
}

function averagePresent(rows, field) {
  const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
  return values.length ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 100) / 100 : null;
}

function sumPresent(rows, field) {
  const values = rows.map((row) => Number(row[field])).filter(Number.isFinite);
  return values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) * 100) / 100 : null;
}

function hasMeaningfulValue(value) {
  return value !== undefined && value !== null && value !== "";
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
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
        name: "stockflix_ai_decision_companion_v2",
        strict: true,
        schema: aiResponseSchema(context),
      },
    },
    messages: [
      {
        role: "system",
        content: [
          "You are StockFlix AI Decision Companion for beginner Thai investors.",
          "Reply in concise, plain Thai. Use only the supplied JSON facts and stay inside scopeSummary.",
          "Never calculate or replace Think2 scores or actions. Never issue a direct buy/sell order, guaranteed return, target price, or suitability claim.",
          "Return five useful parts: a short conclusion, one decision stance, evidence-backed reasons, missing data, and exactly one practical next action.",
          "Every reason must cite one supplied Symbol and field with the exact supplied value. Use an empty Symbol only for supplied portfolioSummary or scopeRowCount evidence.",
          "If dataQuality reports stale or missing required context, state it, lower confidence, and never claim the data is real-time, current today, or complete.",
          "Whenever you mention PE, RSI, RRR, Volume Ratio, debt, yield, score, or another metric, explain the term in plain Thai and say what the value can and cannot prove.",
          "Never recommend a stock from Total Score alone. Cross-check valuation, reward versus risk, financial risk, trend/setup, liquidity, data warnings, and portfolio concentration when those facts are supplied.",
          "MACD is not supplied by this application. If asked about MACD, explicitly say it cannot be evaluated from the current data. Never invent missing metrics, company facts, news, forecasts, or price targets.",
          "For PE, never say a stock is cheap, inexpensive, or not expensive from PE alone. A supplied peer or historical comparison is required, and growth plus earnings quality must still be checked. For RSI, explain that it is momentum rather than business quality. For RRR, explain that it is a scenario estimate, not a guaranteed payoff or proof that the stock is suitable. For Volume Ratio, explain that unusual trading activity can be buying or selling pressure.",
          "For stock or compare mode, identify which supplied stock is most worth studying next when evidence permits. For portfolio review, follow reviewQueue in its supplied risk-first order and do not replace it with a highest-score ranking. For simulation, state whether the result merits further study or should be treated cautiously.",
          "Use only these stance values: ควรตรวจเร่งด่วน, ควรชะลอ, น่าศึกษาต่อ, or ข้อมูลไม่พอ. Do not say the user should buy or sell.",
          "If company business information is absent, explicitly say that a verified company profile is unavailable; never infer it from the ticker. If researchContext is present, translate industry labels by business meaning: Packaged Foods means อาหารสำเร็จรูปหรืออาหารบรรจุห่อ, not ธุรกิจบรรจุภัณฑ์. Use only its company, sector, industry, and news facts and return only supplied source URLs in citations.",
          "Treat Target_Action as an existing system output and explain it with uncertainty, not as personal financial advice. Do not repeat the same point across multiple sections.",
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
      verification: result.verification,
      context: {
        mode: context.mode,
        generatedAt: context.generatedAt,
        symbol: context.selectedStock?.Symbol || "",
        peerCount: context.peers.length,
        holdingCount: context.holdings.length,
        scopeSummary: context.scopeSummary,
        contextSelection: context.contextSelection,
        contextNeeds: context.contextNeeds,
        dataQuality: context.dataQuality,
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

function aiResponseSchema(context = {}) {
  const allowedSymbols = ["", ...new Set((context.currentRows || []).map((row) => row.Symbol).filter(Boolean))];
  return {
    type: "object",
    additionalProperties: false,
    required: ["title", "conclusion", "stance", "reasons", "missingData", "nextAction", "confidence", "details", "scopeUsed", "citations", "disclaimer"],
    properties: {
      title: { type: "string" },
      conclusion: { type: "string" },
      stance: { type: "string", enum: decisionStances },
      reasons: {
        type: "array",
        minItems: 1,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          required: ["claim", "symbol", "field", "value"],
          properties: {
            claim: { type: "string" },
            symbol: { type: "string", enum: allowedSymbols },
            field: { type: "string", enum: evidenceFields },
            value: { type: "string" },
          },
        },
      },
      missingData: { type: "array", items: { type: "string" }, maxItems: 5 },
      nextAction: { type: "string" },
      confidence: { type: "string", enum: ["ต่ำ", "ปานกลาง", "สูง"] },
      details: {
        type: "object",
        additionalProperties: false,
        required: ["metrics", "risks", "questions"],
        properties: {
          metrics: { type: "array", items: { type: "string" }, maxItems: 5 },
          risks: { type: "array", items: { type: "string" }, maxItems: 5 },
          questions: { type: "array", items: { type: "string" }, maxItems: 4 },
        },
      },
      scopeUsed: { type: "string" },
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

function buildPortfolioReviewQueue(rows) {
  return uniqueBySymbol(rows)
    .map((row) => ({ row, priority: portfolioReviewPriority(row) }))
    .filter((entry) => entry.row.Symbol)
    .sort((left, right) => right.priority.score - left.priority.score
      || numberValue(left.row.Total_Score) - numberValue(right.row.Total_Score)
      || left.row.Symbol.localeCompare(right.row.Symbol))
    .slice(0, 5)
    .map((entry, index) => ({
      rank: index + 1,
      Symbol: entry.row.Symbol,
      reasons: entry.priority.reasons,
      Conflict_Severity: entry.row.Conflict_Severity || "",
      Target_Action: entry.row.Effective_Target_Action || entry.row.Target_Action || "",
      Advice: entry.row.Advice || "",
      Gain_Loss_Pct: entry.row.Gain_Loss_Pct ?? null,
      RRR: entry.row.RRR ?? null,
      Total_Score: entry.row.Total_Score ?? null,
      Data_Warnings: entry.row.Data_Warnings || "",
    }));
}

function portfolioReviewPriority(row) {
  const severity = String(row.Conflict_Severity || "").trim().toUpperCase();
  const action = String(row.Effective_Target_Action || row.Target_Action || row.Advice || "").trim();
  const warnings = [row.Data_Warnings, row.Conflict_Alerts].filter(Boolean).join(" ").trim();
  const loss = numberValue(row.Gain_Loss_Pct);
  const rrr = numberValue(row.RRR);
  const reasons = [];
  let score = 0;

  if (severity === "RED") {
    score += 100000;
    reasons.push("สถานะ RED ต้องตรวจข้อมูลและความขัดแย้งก่อน");
  }
  if (/exit|sell|ขาย/iu.test(action)) {
    score += 8000;
    reasons.push(`ระบบเดิมให้ทบทวนการออกจากสถานะ: ${action}`);
  } else if (/reduce|ลด/iu.test(action)) {
    score += 7000;
    reasons.push(`ระบบเดิมให้ลดความเสี่ยง: ${action}`);
  }
  if (severity === "ORANGE") {
    score += 5000;
    reasons.push("สถานะ ORANGE มีคำเตือนสำคัญ");
  }
  if (warnings) {
    score += 2000;
    reasons.push(`มีคำเตือนข้อมูล: ${warnings.slice(0, 180)}`);
  }
  if (loss < 0) {
    score += Math.min(1000, Math.abs(loss) * 10);
    reasons.push(`ผลตอบแทนพอร์ตติดลบ ${loss}%`);
  }
  if (rrr > 0 && rrr < 1) {
    score += 500;
    reasons.push(`RRR ${rrr} ต่ำกว่า 1 ควรตรวจความคุ้มความเสี่ยง`);
  }
  if (!reasons.length) {
    reasons.push("ไม่มีสัญญาณเร่งด่วนระดับสูง ใช้เป็นรายการตรวจลำดับรอง");
  }

  return { score, reasons };
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
  if (!result || typeof result !== "object" || !result.title || !result.conclusion) {
    const error = new Error("AI Assistant response was incomplete. Please try again.");
    error.statusCode = 502;
    throw error;
  }
  const normalized = {
    title: String(result.title).slice(0, 180),
    conclusion: String(result.conclusion).slice(0, 900),
    stance: decisionStances.includes(result.stance) ? result.stance : "ข้อมูลไม่พอ",
    reasons: normalizeEvidenceReasons(result.reasons),
    missingData: cleanStringList(result.missingData, 5),
    nextAction: String(result.nextAction || "ตรวจข้อมูลที่ขาดหนึ่งรายการก่อนตัดสินใจ").slice(0, 600),
    confidence: ["ต่ำ", "ปานกลาง", "สูง"].includes(result.confidence) ? result.confidence : "ต่ำ",
    details: {
      metrics: cleanStringList(result.details?.metrics, 5),
      risks: cleanStringList(result.details?.risks, 5),
      questions: cleanStringList(result.details?.questions, 4),
    },
    scopeUsed: String(result.scopeUsed || "").slice(0, 500),
    citations: filterVerifiedCitations(result.citations, context.researchContext),
    disclaimer: String(result.disclaimer || "ข้อมูลนี้ใช้เพื่อการศึกษา ไม่ใช่คำแนะนำเฉพาะบุคคล").slice(0, 500),
  };
  const verification = verifyAiInvestmentResponse(normalized, context);
  const invalidIndexes = new Set(verification.invalidReasonIndexes);
  normalized.reasons = normalized.reasons.filter((_reason, index) => !invalidIndexes.has(index));
  if (!normalized.reasons.length) normalized.reasons = [fallbackEvidenceReason(context)];
  normalized.missingData = uniqueStrings([
    ...normalized.missingData,
    ...(context.dataQuality?.warnings || []),
    ...verification.issues.map((issue) => `ตัวตรวจคำตอบ: ${issue}`),
  ], 7);
  if (!verification.passed) {
    normalized.confidence = "ต่ำ";
    normalized.stance = "ข้อมูลไม่พอ";
  } else if (context.dataQuality?.snapshot?.status === "stale" && normalized.confidence === "สูง") {
    normalized.confidence = "ปานกลาง";
  }
  const reasonTexts = normalized.reasons.map(formatEvidenceReason);
  return {
    ...normalized,
    verification: {
      passed: verification.passed,
      issues: verification.issues,
      checkedEvidenceCount: verification.checkedEvidenceCount,
    },
    summary: normalized.conclusion,
    beginnerConclusion: normalized.conclusion,
    beginnerMetrics: normalized.details.metrics,
    decisionHeadline: normalized.stance,
    decisionAction: normalized.nextAction,
    decisionReasons: reasonTexts,
    decisionChecks: normalized.missingData,
    decisionConfidence: normalized.confidence,
    keyPoints: reasonTexts,
    risks: normalized.details.risks,
    nextQuestions: normalized.details.questions,
    dataLimitations: normalized.missingData,
  };
}

export function verifyAiInvestmentResponse(result, context = {}) {
  const issues = [];
  const invalidReasonIndexes = [];
  const rowsBySymbol = new Map((context.currentRows || []).map((row) => [row.Symbol, row]));
  const reasons = Array.isArray(result.reasons) ? result.reasons : [];
  reasons.forEach((reason, index) => {
    const expected = expectedEvidenceValue(reason, context, rowsBySymbol);
    if (!expected.found) {
      invalidReasonIndexes.push(index);
      issues.push(`หลักฐานข้อ ${index + 1} อ้าง ${reason.symbol || "ภาพรวม"}.${reason.field} ที่ไม่มีใน Scope`);
      return;
    }
    if (!evidenceValueMatches(reason.value, expected.value)) {
      invalidReasonIndexes.push(index);
      issues.push(`หลักฐานข้อ ${index + 1} ใช้ค่า ${reason.value || "ว่าง"} แต่ข้อมูลจริงคือ ${expected.value}`);
    }
  });

  const unknownSymbols = findUnknownClaimedSymbols(result, rowsBySymbol);
  if (unknownSymbols.length) issues.push(`พบ Symbol นอก Scope: ${unknownSymbols.join(", ")}`);
  const responseText = JSON.stringify(result);
  if (context.dataQuality?.snapshot?.status === "stale" && /(เรียลไทม์|real[- ]?time|ข้อมูลวันนี้|ราคาวันนี้)/iu.test(responseText)) {
    issues.push("คำตอบอ้างว่าข้อมูลเป็นปัจจุบัน ทั้งที่ผล Think2 เก่า");
  }
  if ((context.dataQuality?.warnings || []).some((warning) => /ยังไม่มี/u.test(warning)) && result.confidence === "สูง") {
    issues.push("คำตอบให้ความมั่นใจสูงทั้งที่บริบทสำคัญยังขาด");
  }
  return {
    passed: issues.length === 0,
    issues: uniqueStrings(issues, 8),
    invalidReasonIndexes: [...new Set(invalidReasonIndexes)],
    checkedEvidenceCount: reasons.length,
  };
}

function normalizeEvidenceReasons(values) {
  return (Array.isArray(values) ? values : []).slice(0, 4).map((reason) => ({
    claim: String(reason?.claim || "").slice(0, 500),
    symbol: cleanSymbol(reason?.symbol),
    field: String(reason?.field || "").slice(0, 80),
    value: String(reason?.value ?? "").slice(0, 120),
  })).filter((reason) => reason.claim && reason.field);
}

function expectedEvidenceValue(reason, context, rowsBySymbol) {
  if (reason.symbol) {
    const row = rowsBySymbol.get(reason.symbol);
    if (!row || !hasMeaningfulValue(row[reason.field])) return { found: false, value: null };
    return { found: true, value: row[reason.field] };
  }
  if (reason.field === "scopeRowCount") return { found: true, value: context.scopeSummary?.rowCount ?? 0 };
  const summaryFieldMap = {
    marketValue: "marketValue",
    gainLossPct: "gainLossPct",
    avgScore: "avgScore",
    urgentActions: "urgentActions",
  };
  const summaryField = summaryFieldMap[reason.field];
  if (summaryField && hasMeaningfulValue(context.portfolioSummary?.[summaryField])) {
    return { found: true, value: context.portfolioSummary[summaryField] };
  }
  return { found: false, value: null };
}

function evidenceValueMatches(actualText, expectedValue) {
  if (typeof expectedValue === "number") {
    const match = String(actualText || "").replace(/,/gu, "").match(/-?\d+(?:\.\d+)?/u);
    if (!match) return false;
    const actual = Number(match[0]);
    return Number.isFinite(actual) && Math.abs(actual - expectedValue) <= Math.max(0.02, Math.abs(expectedValue) * 0.0005);
  }
  return String(actualText || "").toLowerCase().includes(String(expectedValue || "").toLowerCase());
}

function findUnknownClaimedSymbols(result, rowsBySymbol) {
  const allowed = new Set(rowsBySymbol.keys());
  const ignored = new Set(["AI", "PE", "ROE", "DE", "RSI", "RRR", "MACD", "THB", "SET", "ETF", "ESG", "IPO", "RED", "ORANGE", "YELLOW", "THINK2", "YAHOO"]);
  const text = [result.title, result.conclusion, result.nextAction, ...(result.reasons || []).map((reason) => reason.claim)].join(" ");
  const candidates = text.match(/\b[A-Z][A-Z0-9]{1,9}\b/gu) || [];
  return [...new Set(candidates.filter((token) => !allowed.has(token) && !ignored.has(token) && !/^\d/u.test(token)))];
}

function fallbackEvidenceReason(context) {
  const row = context.currentRows?.[0];
  if (row && hasMeaningfulValue(row.Total_Score)) {
    return { claim: "ใช้คะแนน Think2 เป็นจุดเริ่มต้นและต้องตรวจปัจจัยอื่นร่วมด้วย", symbol: row.Symbol, field: "Total_Score", value: String(row.Total_Score) };
  }
  return { claim: "ระบบตรวจได้เฉพาะจำนวนรายการใน Scope นี้", symbol: "", field: "scopeRowCount", value: String(context.scopeSummary?.rowCount ?? 0) };
}

function formatEvidenceReason(reason) {
  const source = reason.symbol ? `${reason.symbol} ${reason.field}` : reason.field;
  return `${reason.claim} (${source} = ${reason.value})`;
}

function uniqueStrings(values, limit) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))].slice(0, limit);
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
