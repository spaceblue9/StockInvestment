import fs from "fs/promises";
import { toCsv } from "./csvService.js";
import { enrichWithReferenceData, loadReferenceMarketData } from "./referenceDataService.js";

export async function fetchThaiMarketData(symbols, options = {}) {
  const {
    outputFile,
    logger = () => {},
  } = options;

  const rows = [];
  const referenceBySymbol = await loadReferenceMarketData();

  for (const symbol of symbols) {
    try {
      const row = await fetchThaiMarketDataForSymbol(symbol, {
        referenceRow: referenceBySymbol.get(String(symbol).trim().toUpperCase()),
      });
      if (!row || !row.Price) {
        logger(`[-] ${symbol}: No price data, skipping`);
        continue;
      }

      rows.push(row);
      logger(`[+] ${symbol}: Success`);
    } catch (error) {
      logger(`[-] ${symbol}: Failed (${error.message})`);
    }
  }

  if (outputFile) {
    await fs.writeFile(outputFile, toCsv(rows), "utf8");
  }

  return rows;
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
