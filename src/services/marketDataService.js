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
