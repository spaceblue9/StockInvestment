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
  const { chunkSize = 40, logger = () => {} } = options;
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

  return quoteBySymbol;
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
    Data_Source: "yahoo_quote_live",
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
  } = options;
  const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}`);
  if (period1) {
    url.searchParams.set("period1", String(toUnixSeconds(period1)));
    url.searchParams.set("period2", String(toUnixSeconds(period2 || new Date())));
  } else {
    url.searchParams.set("range", range);
  }
  url.searchParams.set("interval", interval);

  const response = await fetch(url);
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
