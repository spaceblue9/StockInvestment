import fs from "fs/promises";
import { toCsv } from "./csvService.js";
import { buildLiveMarketCoverageReport, writeLiveMarketCoverageReport } from "./marketCoverageService.js";
import { enrichWithReferenceData, loadReferenceMarketData } from "./referenceDataService.js";

export async function fetchThaiMarketData(symbols, options = {}) {
  const {
    coverageReportFile,
    liveQuoteBatch = false,
    liveFetchLimit = Infinity,
    outputFile,
    logger = () => {},
    onCoverageReport,
  } = options;

  const rows = [];
  const referenceBySymbol = await loadReferenceMarketData();
  const quoteBySymbol = liveQuoteBatch
    ? await fetchYahooQuoteBatch(symbols, { logger })
    : new Map();
  const normalizedLiveFetchLimit = normalizeLiveFetchLimit(liveFetchLimit);

  for (const [index, symbol] of symbols.entries()) {
    const normalizedSymbol = String(symbol).trim().toUpperCase();
    const referenceRow = referenceBySymbol.get(normalizedSymbol);
    const quoteRow = quoteBySymbol.get(normalizedSymbol);
    if (quoteRow) {
      rows.push(liveQuoteReferenceRow(normalizedSymbol, quoteRow, referenceRow));
      logger(`[+] ${symbol}: Live Yahoo quote price ${quoteRow.Price}`);
      continue;
    }

    if (index >= normalizedLiveFetchLimit) {
      if (referenceRow) {
        rows.push(referenceFallbackRow(normalizedSymbol, referenceRow));
        logger(`[~] ${symbol}: Using reference fallback because live fetch is limited for this environment`);
        continue;
      }

      logger(`[-] ${symbol}: Skipped live fetch because this environment limits live market requests and no reference row was found`);
      continue;
    }

    try {
      const row = await fetchThaiMarketDataForSymbol(symbol, {
        referenceRow,
      });
      if (!row || !row.Price) {
        if (referenceRow) {
          rows.push(referenceFallbackRow(normalizedSymbol, referenceRow));
          logger(`[~] ${symbol}: Using reference fallback because live price was unavailable`);
          continue;
        }

        logger(`[-] ${symbol}: No price data, skipping`);
        continue;
      }

      rows.push(row);
      logger(`[+] ${symbol}: Success`);
    } catch (error) {
      if (referenceRow) {
        rows.push(referenceFallbackRow(normalizedSymbol, referenceRow));
        logger(`[~] ${symbol}: Using reference fallback after live fetch failed (${error.message})`);
        continue;
      }

      logger(`[-] ${symbol}: Failed (${error.message})`);
    }
  }

  if (outputFile && rows.length > 0) {
    await fs.writeFile(outputFile, toCsv(rows), "utf8");
  }

  if (coverageReportFile || onCoverageReport) {
    const coverageReport = buildLiveMarketCoverageReport(rows, {
      referenceBySymbol,
      referenceFile: "data/reference/market-reference-master.json -> recommended_stocks.csv",
      targetFile: outputFile || null,
      publicTargetFile: outputFile ? "raw_CSV.csv" : null,
    });

    if (coverageReportFile) {
      await writeLiveMarketCoverageReport(coverageReport, coverageReportFile);
    }

    if (onCoverageReport) {
      onCoverageReport(coverageReport);
    }
  }

  return rows;
}

export async function fetchYahooQuoteBatch(symbols, options = {}) {
  const { chartConcurrency = 6, chartTimeoutMs = 4500, chunkSize = 40, logger = () => {} } = options;
  const quoteBySymbol = new Map();
  const normalizedSymbols = [...new Set((symbols || [])
    .map((symbol) => String(symbol || "").trim().toUpperCase())
    .filter(Boolean))];

  for (let index = 0; index < normalizedSymbols.length; index += chunkSize) {
    const chunk = normalizedSymbols.slice(index, index + chunkSize);
    try {
      const quotes = await fetchYahooQuoteChunk(chunk);
      for (const quote of quotes) {
        if (quote.Symbol && quote.Price > 0) {
          quoteBySymbol.set(quote.Symbol, quote);
        }
      }
    } catch (error) {
      logger(`[~] Yahoo live quote batch failed for ${chunk.join(", ")} (${error.message})`);
    }
  }

  const missingSymbols = normalizedSymbols.filter((symbol) => !quoteBySymbol.has(symbol));
  if (missingSymbols.length) {
    logger(`[~] Yahoo quote endpoint did not return ${missingSymbols.length} live price(s); trying chart fallback`);
    const chartQuotes = await fetchYahooChartQuoteBatch(missingSymbols, {
      concurrency: chartConcurrency,
      logger,
      timeoutMs: chartTimeoutMs,
    });
    for (const [symbol, quote] of chartQuotes) {
      quoteBySymbol.set(symbol, quote);
    }
  }

  return quoteBySymbol;
}

export async function fetchYahooChartQuoteBatch(symbols, options = {}) {
  const { concurrency = 6, logger = () => {}, timeoutMs = 4500 } = options;
  const quoteBySymbol = new Map();
  const normalizedSymbols = [...new Set((symbols || [])
    .map((symbol) => String(symbol || "").trim().toUpperCase())
    .filter(Boolean))];
  let cursor = 0;

  async function worker() {
    while (cursor < normalizedSymbols.length) {
      const symbol = normalizedSymbols[cursor];
      cursor += 1;
      try {
        const quote = await fetchYahooChartQuote(symbol, { timeoutMs });
        if (quote?.Price > 0) {
          quoteBySymbol.set(symbol, quote);
        }
      } catch (error) {
        logger(`[~] ${symbol}: Yahoo chart live price failed (${error.message})`);
      }
    }
  }

  await Promise.all(Array.from({
    length: Math.min(Math.max(1, concurrency), normalizedSymbols.length || 1),
  }, () => worker()));
  return quoteBySymbol;
}

export async function fetchYahoo52WeekHistory(symbol, options = {}) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase().replace(/\.BK$/iu, "");
  if (!/^[A-Z0-9&-]{1,15}$/u.test(normalizedSymbol)) {
    const error = new Error("Invalid Thai stock symbol.");
    error.statusCode = 400;
    throw error;
  }
  const chart = await fetchChart(`${normalizedSymbol}.BK`, {
    range: "1y",
    interval: "1d",
    timeoutMs: options.timeoutMs || 8000,
    fetchImpl: options.fetchImpl,
  });
  const history = (chart.history || [])
    .filter((row) => numberValue(row.close) > 0)
    .map((row) => ({
      Date: row.date.toISOString().slice(0, 10),
      Close: numberValue(row.close),
      Volume: numberValue(row.volume),
    }));
  if (!history.length) {
    const error = new Error("Yahoo did not return 52-week price history for this symbol.");
    error.statusCode = 502;
    throw error;
  }
  const closes = history.map((row) => row.Close);
  const current = numberValue(chart.meta?.regularMarketPrice) || closes.at(-1);
  const low = Math.min(...closes);
  const high = Math.max(...closes);
  const range = Math.max(high - low, 0);
  return {
    symbol: normalizedSymbol,
    source: "Yahoo Finance chart",
    fetchedAt: new Date().toISOString(),
    current,
    low52Week: low,
    high52Week: high,
    pricePositionPct: range > 0 ? ((current - low) / range) * 100 : 0,
    history,
  };
}

export async function fetchYahooCompanyResearch(symbol, options = {}) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase().replace(/\.BK$/iu, "");
  if (!/^[A-Z0-9&-]{1,15}$/u.test(normalizedSymbol)) {
    const error = new Error("Invalid Thai stock symbol.");
    error.statusCode = 400;
    throw error;
  }
  const url = new URL("https://query1.finance.yahoo.com/v1/finance/search");
  url.searchParams.set("q", `${normalizedSymbol}.BK`);
  url.searchParams.set("quotesCount", "5");
  url.searchParams.set("newsCount", "5");
  const response = await (options.fetchImpl || fetch)(url, {
    headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 StockFlix/1.0" },
  });
  if (!response.ok) {
    const error = new Error(`Yahoo company research request failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  const payload = await response.json();
  const expectedTicker = `${normalizedSymbol}.BK`;
  const quote = (payload.quotes || []).find((item) => String(item.symbol || "").toUpperCase() === expectedTicker) || null;
  if (!quote) {
    const error = new Error("Yahoo did not return a verified company profile for this symbol.");
    error.statusCode = 502;
    throw error;
  }
  return {
    symbol: normalizedSymbol,
    source: "Yahoo Finance search",
    sourceUrl: `https://finance.yahoo.com/quote/${encodeURIComponent(expectedTicker)}/profile/`,
    fetchedAt: new Date().toISOString(),
    profile: {
      name: String(quote.longname || quote.shortname || normalizedSymbol).slice(0, 200),
      exchange: String(quote.exchDisp || quote.exchange || "SET").slice(0, 80),
      sector: String(quote.sectorDisp || quote.sector || "").slice(0, 120),
      industry: String(quote.industryDisp || quote.industry || "").slice(0, 160),
    },
    news: (payload.news || []).slice(0, 5).map((item) => ({
      title: String(item.title || "").slice(0, 300),
      publisher: String(item.publisher || "").slice(0, 120),
      publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : "",
      url: safeHttpUrl(item.link),
    })).filter((item) => item.title && item.url),
  };
}

export async function fetchYahooViResearch(symbol, options = {}) {
  const company = await fetchYahooCompanyResearch(symbol, options);
  try {
    const vi = await fetchYahooViFundamentals(symbol, options);
    return { ...company, ...vi };
  } catch (error) {
    return {
      ...company,
      viFundamentals: {
        metrics: [],
        histories: {},
        coveragePct: 0,
        missingKeys: viMetricDefinitions.map((metric) => metric.key),
        warnings: [`โหลดข้อมูลงบสำหรับ VI ไม่สำเร็จ: ${String(error.message || "unknown error").slice(0, 240)}`],
      },
      valuationModel: null,
      sources: buildViSources(company.symbol, company.fetchedAt),
    };
  }
}

export async function fetchYahooViFundamentals(symbol, options = {}) {
  const normalizedSymbol = normalizeThaiSymbol(symbol);
  const ticker = `${normalizedSymbol}.BK`;
  const fetchedAt = new Date().toISOString();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const fromSeconds = nowSeconds - (6 * 366 * 86400);
  const url = new URL(`https://query1.finance.yahoo.com/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(ticker)}`);
  url.searchParams.set("symbol", ticker);
  url.searchParams.set("type", viTimeSeriesTypes.join(","));
  url.searchParams.set("period1", String(fromSeconds));
  url.searchParams.set("period2", String(nowSeconds));

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Math.max(2000, Math.min(15000, Number(options.timeoutMs || 8000))));
  let response;
  try {
    response = await (options.fetchImpl || fetch)(url, {
      headers: { Accept: "application/json", "User-Agent": "Mozilla/5.0 StockFlix/1.0" },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const error = new Error(`Yahoo VI fundamentals request failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  const payload = await response.json();
  const resultByType = new Map((payload.timeseries?.result || [])
    .map((series) => [String(series.meta?.type?.[0] || ""), series])
    .filter(([type]) => type));
  const histories = Object.fromEntries(viTimeSeriesTypes.map((type) => [type, timeSeriesPoints(resultByType.get(type), type)]));
  const latest = (type) => histories[type]?.at(-1) || null;
  const sources = buildViSources(normalizedSymbol, fetchedAt);
  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const revenue = latest("annualTotalRevenue");
  const netIncome = latest("annualNetIncome");
  const freeCashFlow = latest("annualFreeCashFlow");
  const equityHistory = histories.annualStockholdersEquity || [];
  const equity = equityHistory.at(-1) || null;
  const debt = latest("annualTotalDebt");
  const marketCap = latest("trailingMarketCap");
  const pe = latest("trailingPeRatio");
  const dividendYield = latest("trailingDividendYield");
  const averageEquity = average(equityHistory.slice(-2).map((point) => point.value).filter((value) => value > 0));
  const roeValue = netIncome?.value > 0 && averageEquity > 0 ? (netIncome.value / averageEquity) * 100 : null;
  const deValue = debt?.value >= 0 && equity?.value > 0 ? debt.value / equity.value : null;
  const pbvValue = marketCap?.value > 0 && equity?.value > 0 ? marketCap.value / equity.value : null;

  const rawMetrics = {
    revenue: metricFromPoint("revenue", revenue, "THB", sourceById.get("yahoo_financials")),
    netIncome: metricFromPoint("netIncome", netIncome, "THB", sourceById.get("yahoo_financials")),
    freeCashFlow: metricFromPoint("freeCashFlow", freeCashFlow, "THB", sourceById.get("yahoo_cashflow")),
    roe: derivedMetric("roe", roeValue, "%", netIncome?.asOfDate || equity?.asOfDate, "12M", sourceById.get("yahoo_financials"), "กำไรสุทธิ / ส่วนของผู้ถือหุ้นเฉลี่ย 2 ปี × 100"),
    debtToEquity: derivedMetric("debtToEquity", deValue, "x", debt?.asOfDate || equity?.asOfDate, "12M", sourceById.get("yahoo_balance_sheet"), "หนี้สินที่มีดอกเบี้ยรวม / ส่วนของผู้ถือหุ้น"),
    pe: metricFromPoint("pe", pe, "x", sourceById.get("yahoo_statistics")),
    pbv: derivedMetric("pbv", pbvValue, "x", marketCap?.asOfDate || equity?.asOfDate, "TTM/12M", sourceById.get("yahoo_statistics"), "มูลค่าตลาดล่าสุด / ส่วนของผู้ถือหุ้นงวดล่าสุด"),
    dividendYield: metricFromPoint("dividendYield", dividendYield ? { ...dividendYield, value: dividendYield.value * 100 } : null, "%", sourceById.get("yahoo_statistics")),
  };
  const metrics = viMetricDefinitions.map((definition) => ({
    ...definition,
    ...(rawMetrics[definition.key] || {}),
  }));
  const missingKeys = metrics.filter((metric) => !Number.isFinite(metric.value)).map((metric) => metric.key);
  const valuationModel = buildViValuationModel({
    netIncome,
    shares: latest("annualDilutedAverageShares"),
    peHistory: histories.trailingPeRatio || [],
    sourceById,
  });
  return {
    viFundamentals: {
      metrics,
      histories: {
        revenue: histories.annualTotalRevenue || [],
        netIncome: histories.annualNetIncome || [],
        freeCashFlow: histories.annualFreeCashFlow || [],
        pe: histories.trailingPeRatio || [],
      },
      coveragePct: Math.round(((metrics.length - missingKeys.length) / metrics.length) * 100),
      missingKeys,
      warnings: [
        "ตัวเลข VI มาจาก Yahoo Finance และควรตรวจยืนยันกับ SET/56-1 One Report ก่อนลงทุนจริง",
        ...(missingKeys.length ? [`ข้อมูลไม่ครบ: ${missingKeys.join(", ")}`] : []),
      ],
    },
    valuationModel,
    sources,
  };
}

const viMetricDefinitions = [
  { key: "revenue", label: "รายได้รวม" },
  { key: "netIncome", label: "กำไรสุทธิ" },
  { key: "roe", label: "ROE" },
  { key: "debtToEquity", label: "D/E" },
  { key: "freeCashFlow", label: "Free Cash Flow" },
  { key: "pe", label: "P/E" },
  { key: "pbv", label: "P/BV" },
  { key: "dividendYield", label: "Dividend Yield" },
];

const viTimeSeriesTypes = [
  "annualTotalRevenue",
  "annualNetIncome",
  "annualFreeCashFlow",
  "annualStockholdersEquity",
  "annualTotalDebt",
  "annualDilutedAverageShares",
  "trailingMarketCap",
  "trailingPeRatio",
  "trailingDividendYield",
];

function normalizeThaiSymbol(symbol) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase().replace(/\.BK$/iu, "");
  if (!/^[A-Z0-9&-]{1,15}$/u.test(normalizedSymbol)) {
    const error = new Error("Invalid Thai stock symbol.");
    error.statusCode = 400;
    throw error;
  }
  return normalizedSymbol;
}

function timeSeriesPoints(series, type) {
  return (series?.[type] || []).map((point) => ({
    asOfDate: String(point.asOfDate || "").slice(0, 10),
    periodType: String(point.periodType || "").slice(0, 20),
    currencyCode: String(point.currencyCode || "").slice(0, 10),
    value: numberOrNull(point.reportedValue?.raw ?? point.dataValue),
  })).filter((point) => /^\d{4}-\d{2}-\d{2}$/u.test(point.asOfDate) && Number.isFinite(point.value));
}

function metricFromPoint(key, point, unit, source) {
  if (!point || !Number.isFinite(point.value)) return {};
  return {
    key,
    value: roundValue(point.value),
    unit,
    asOfDate: point.asOfDate,
    periodType: point.periodType || "",
    sourceId: source?.id || "",
    sourceLabel: source?.label || "",
    sourceUrl: source?.url || "",
    formula: "",
  };
}

function derivedMetric(key, value, unit, asOfDate, periodType, source, formula) {
  if (!Number.isFinite(value)) return {};
  return {
    key,
    value: roundValue(value),
    unit,
    asOfDate: String(asOfDate || "").slice(0, 10),
    periodType,
    sourceId: source?.id || "",
    sourceLabel: source?.label || "",
    sourceUrl: source?.url || "",
    formula,
  };
}

function buildViValuationModel({ netIncome, shares, peHistory, sourceById }) {
  if (!(netIncome?.value > 0) || !(shares?.value > 0)) return null;
  const peValues = peHistory.map((point) => point.value).filter((value) => value > 0 && value <= 100);
  if (peValues.length < 3) return null;
  const eps = netIncome.value / shares.value;
  const referencePe = median(peValues);
  const fairValue = eps * referencePe;
  if (!(fairValue > 0)) return null;
  return {
    method: "EPS ล่าสุด × ค่ากลาง P/E ย้อนหลังที่ Yahoo มีข้อมูล",
    formula: `${roundValue(eps)} × ${roundValue(referencePe)} = ${roundValue(fairValue)} บาท`,
    eps: roundValue(eps),
    epsAsOfDate: netIncome.asOfDate,
    referencePe: roundValue(referencePe),
    referencePeSampleCount: peValues.length,
    fairValue: roundValue(fairValue),
    marginOfSafetyMinPct: 20,
    marginOfSafetyMaxPct: 30,
    interestingPriceLow: roundValue(fairValue * 0.70),
    interestingPriceHigh: roundValue(fairValue * 0.80),
    currency: "THB",
    sourceUrls: [sourceById.get("yahoo_financials")?.url, sourceById.get("yahoo_statistics")?.url].filter(Boolean),
    limitations: [
      "เป็นแบบจำลองอย่างง่าย ไม่ใช่มูลค่าที่แท้จริงหรือราคาเป้าหมาย",
      "สมมติว่ากำไรต่อหุ้นและ P/E อ้างอิงยังเหมาะสม จึงต้องตรวจแนวโน้มกำไรและ 56-1 เพิ่ม",
    ],
  };
}

function buildViSources(symbol, fetchedAt) {
  const ticker = `${symbol}.BK`;
  const yahooBase = `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`;
  const setBase = `https://www.set.or.th/th/market/product/stock/quote/${encodeURIComponent(symbol)}`;
  return [
    { id: "yahoo_financials", label: "Yahoo Finance - Financials", url: `${yahooBase}/financials/`, fetchedAt, purpose: "รายได้ กำไร และข้อมูลหุ้นสำหรับสูตร" },
    { id: "yahoo_cashflow", label: "Yahoo Finance - Cash Flow", url: `${yahooBase}/cash-flow/`, fetchedAt, purpose: "Free Cash Flow" },
    { id: "yahoo_balance_sheet", label: "Yahoo Finance - Balance Sheet", url: `${yahooBase}/balance-sheet/`, fetchedAt, purpose: "หนี้และส่วนของผู้ถือหุ้น" },
    { id: "yahoo_statistics", label: "Yahoo Finance - Statistics", url: `${yahooBase}/key-statistics/`, fetchedAt, purpose: "P/E, P/BV, Dividend Yield และมูลค่าตลาด" },
    { id: "set_factsheet", label: "SET - Factsheet (ตรวจยืนยัน)", url: `${setBase}/factsheet`, fetchedAt, purpose: "ตรวจยืนยันข้อมูลกับแหล่งทางการ" },
    { id: "set_financials", label: "SET - Company Highlights (ตรวจยืนยัน)", url: `${setBase}/financial-statement/company-highlights`, fetchedAt, purpose: "ตรวจยืนยันงบและอัตราส่วนกับแหล่งทางการ" },
  ];
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

function numberOrNull(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function roundValue(value) {
  if (!Number.isFinite(value)) return null;
  const magnitude = Math.abs(value);
  if (magnitude >= 1000000) return Math.round(value);
  return Math.round(value * 10000) / 10000;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

async function fetchYahooChartQuote(symbol, options = {}) {
  const chart = await fetchChart(`${symbol}.BK`, {
    interval: "1d",
    range: "1d",
    timeoutMs: options.timeoutMs,
  });
  const meta = chart.meta || {};
  const history = chart.history || [];
  const volumes = history.map((row) => numberValue(row.volume)).filter((value) => value >= 0);
  const closes = history.map((row) => numberValue(row.close)).filter((value) => value > 0);
  const price = numberValue(meta.regularMarketPrice) || closes.at(-1) || 0;
  return {
    Symbol: symbol,
    Price: price,
    Volume: numberValue(meta.regularMarketVolume) || volumes.at(-1) || 0,
    Avg_Vol_10D: average(volumes.slice(-10)),
    High_52W: numberValue(meta.fiftyTwoWeekHigh) || null,
    Low_52W: numberValue(meta.fiftyTwoWeekLow) || null,
    Source: "yahoo_chart_live",
  };
}

async function fetchYahooQuoteChunk(symbols) {
  if (!symbols.length) {
    return [];
  }

  const url = new URL("https://query1.finance.yahoo.com/v7/finance/quote");
  url.searchParams.set("symbols", symbols.map((symbol) => `${symbol}.BK`).join(","));
  url.searchParams.set("fields", [
    "symbol",
    "regularMarketPrice",
    "regularMarketVolume",
    "averageDailyVolume10Day",
    "fiftyTwoWeekHigh",
    "fiftyTwoWeekLow",
  ].join(","));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Yahoo quote request failed with ${response.status}`);
  }

  const payload = await response.json();
  return (payload.quoteResponse?.result || [])
    .map((quote) => normalizeYahooQuote(quote))
    .filter((quote) => quote.Symbol);
}

function normalizeYahooQuote(quote = {}) {
  const symbol = String(quote.symbol || "").replace(/\.BK$/i, "").toUpperCase();
  const price = numberValue(quote.regularMarketPrice);
  return {
    Symbol: symbol,
    Price: price,
    Volume: numberValue(quote.regularMarketVolume),
    Avg_Vol_10D: numberValue(quote.averageDailyVolume10Day),
    High_52W: numberValue(quote.fiftyTwoWeekHigh) || null,
    Low_52W: numberValue(quote.fiftyTwoWeekLow) || null,
  };
}

function normalizeLiveFetchLimit(value) {
  if (value === Infinity) {
    return Infinity;
  }

  const number = Number(value);
  if (!Number.isFinite(number)) {
    return Infinity;
  }

  return Math.max(0, Math.floor(number));
}

export async function fetchThaiMarketDataForSymbol(symbol, options = {}) {
  const { referenceRow } = options;
  const ticker = `${symbol}.BK`;
  const chart = await fetchChart(ticker);
  const meta = chart.meta || {};
  const history = chart.history || [];
  const closes = history.map((row) => numberValue(row.close)).filter((value) => value > 0);
  const volumes = history.map((row) => numberValue(row.volume)).filter((value) => value >= 0);
  const currentVolume = numberValue(meta.regularMarketVolume)
    || (volumes.length > 0 ? volumes.at(-1) : 0);
  const avgVol10d = average(volumes.slice(-10));
  const price = numberValue(meta.regularMarketPrice)
    || (closes.length > 0 ? closes.at(-1) : 0);

  if (!price) {
    return null;
  }

  return enrichWithReferenceData({
    Symbol: symbol,
    Sector: "Unknown",
    Price: price,
    PE: 0,
    PBV: 0,
    Yield: 0,
    ROE: 0,
    DE: 0,
    High_52W: numberValue(meta.fiftyTwoWeekHigh) || null,
    Low_52W: numberValue(meta.fiftyTwoWeekLow) || null,
    RSI: calculateRsi(closes),
    Volume: currentVolume,
    Avg_Vol_10D: avgVol10d,
  }, referenceRow);
}

function referenceFallbackRow(symbol, referenceRow) {
  return {
    ...referenceRow,
    Symbol: symbol,
  };
}

function liveQuoteReferenceRow(symbol, quoteRow, referenceRow = {}) {
  return enrichWithReferenceData({
    Symbol: symbol,
    Sector: referenceRow?.Sector || "Unknown",
    Price: quoteRow.Price,
    PE: 0,
    PBV: 0,
    Yield: 0,
    ROE: 0,
    DE: 0,
    High_52W: quoteRow.High_52W || null,
    Low_52W: quoteRow.Low_52W || null,
    RSI: numberValue(referenceRow?.RSI) || 50,
    Volume: quoteRow.Volume,
    Avg_Vol_10D: quoteRow.Avg_Vol_10D,
    Data_Source: quoteRow.Source || "yahoo_quote_live",
  }, referenceRow);
}

export function calculateRsi(prices, window = 14) {
  if (!Array.isArray(prices) || prices.length < window + 1) {
    return 50;
  }

  const deltas = [];
  for (let index = 1; index < prices.length; index += 1) {
    deltas.push(prices[index] - prices[index - 1]);
  }

  const recentDeltas = deltas.slice(-window);
  const gains = recentDeltas.map((delta) => (delta > 0 ? delta : 0));
  const losses = recentDeltas.map((delta) => (delta < 0 ? Math.abs(delta) : 0));
  const avgGain = average(gains);
  const avgLoss = average(losses);

  if (avgLoss === 0) {
    return 100;
  }

  const relativeStrength = avgGain / avgLoss;
  return 100 - (100 / (1 + relativeStrength));
}

export async function fetchChart(ticker, options = {}) {
  const {
    range = "1mo",
    interval = "1d",
    period1,
    period2,
    signal,
    timeoutMs,
    fetchImpl = fetch,
  } = options;
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
  if (period1) {
    url.searchParams.set("period1", String(toUnixSeconds(period1)));
    url.searchParams.set("period2", String(toUnixSeconds(period2 || new Date())));
  } else {
    url.searchParams.set("range", range);
  }
  url.searchParams.set("interval", interval);

  const timeoutSignal = timeoutMs && typeof AbortSignal !== "undefined" && "timeout" in AbortSignal
    ? AbortSignal.timeout(timeoutMs)
    : null;
  const response = await fetchImpl(url, {
    signal: signal || timeoutSignal || undefined,
  });
  if (!response.ok) {
    throw new Error(`Yahoo chart request failed with ${response.status}`);
  }

  const payload = await response.json();
  const result = payload.chart?.result?.[0];
  const error = payload.chart?.error;

  if (!result || error) {
    throw new Error(error?.description || "Yahoo chart response has no result");
  }

  const timestamps = result.timestamp || [];
  const quote = result.indicators?.quote?.[0] || {};
  const closes = quote.close || [];
  const highs = quote.high || [];
  const lows = quote.low || [];
  const volumes = quote.volume || [];

  const history = timestamps.map((timestamp, index) => ({
    date: new Date(timestamp * 1000),
    close: closes[index],
    high: highs[index],
    low: lows[index],
    volume: volumes[index],
  }));

  return {
    meta: result.meta || {},
    history,
  };
}

function toUnixSeconds(date) {
  return Math.floor(new Date(date).getTime() / 1000);
}

function average(values) {
  if (!values.length) {
    return 0;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function numberValue(value) {
  if (value === null || value === undefined) {
    return 0;
  }

  if (typeof value === "object" && "raw" in value) {
    return Number(value.raw) || 0;
  }

  return Number(value) || 0;
}
