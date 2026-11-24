import assert from "node:assert/strict";
import { fetchYahoo52WeekHistory, fetchYahooCompanyResearch, fetchYahooViResearch } from "../src/services/marketDataService.js";

const timestamps = [
  Date.UTC(2026, 0, 2) / 1000,
  Date.UTC(2026, 3, 2) / 1000,
  Date.UTC(2026, 6, 2) / 1000,
  Date.UTC(2026, 10, 3) / 1000,
];

const fakeFetch = async (url) => {
  assert.match(String(url), /PTT\.BK/u);
  assert.match(String(url), /range=1y/u);
  return {
    ok: true,
    json: async () => ({
      chart: {
        result: [{
          meta: { regularMarketPrice: 35 },
          timestamp: timestamps,
          indicators: {
            quote: [{ close: [30, 40, 20, 35], volume: [100, 200, 300, 400] }],
          },
        }],
        error: null,
      },
    }),
  };
};

const result = await fetchYahoo52WeekHistory("PTT", { fetchImpl: fakeFetch, timeoutMs: 1000 });
assert.equal(result.symbol, "PTT");
assert.equal(result.current, 35);
assert.equal(result.low52Week, 20);
assert.equal(result.high52Week, 40);
assert.equal(result.pricePositionPct, 75);
assert.equal(result.history.length, 4);
assert.equal(result.history.at(-1).Date, "2026-11-03");
assert.equal(result.source, "Yahoo Finance chart");

await assert.rejects(() => fetchYahoo52WeekHistory("../../bad", { fetchImpl: fakeFetch }), /Invalid Thai stock symbol/u);

const research = await fetchYahooCompanyResearch("PTT", {
  fetchImpl: async (url) => {
    assert.match(String(url), /q=PTT\.BK/u);
    return {
      ok: true,
      json: async () => ({
        quotes: [{ symbol: "PTT.BK", longname: "PTT Public Company Limited", exchDisp: "SET", sectorDisp: "Energy", industryDisp: "Oil & Gas Integrated" }],
        news: [{ title: "PTT sample news", publisher: "Example", providerPublishTime: timestamps.at(-1), link: "https://example.com/ptt" }],
      }),
    };
  },
});
assert.equal(research.profile.name, "PTT Public Company Limited");
assert.equal(research.profile.industry, "Oil & Gas Integrated");
assert.equal(research.news.length, 1);
assert.equal(research.news[0].url, "https://example.com/ptt");

const viResearch = await fetchYahooViResearch("PTT", {
  fetchImpl: async (url) => {
    if (String(url).includes("/v1/finance/search")) {
      return {
        ok: true,
        json: async () => ({
          quotes: [{ symbol: "PTT.BK", longname: "PTT Public Company Limited", exchDisp: "SET", sectorDisp: "Energy", industryDisp: "Oil & Gas Integrated" }],
          news: [],
        }),
      };
    }
    assert.match(String(url), /fundamentals-timeseries/u);
    const series = (type, values, options = {}) => ({
      meta: { symbol: ["PTT.BK"], type: [type] },
      [type]: values.map((value, index) => ({
        asOfDate: `${2022 + index}-12-31`,
        periodType: options.periodType || "12M",
        currencyCode: options.currencyCode || "THB",
        reportedValue: { raw: value },
      })),
    });
    return {
      ok: true,
      json: async () => ({
        timeseries: {
          result: [
            series("annualTotalRevenue", [200000, 220000, 240000, 260000]),
            series("annualNetIncome", [20000, 22000, 24000, 26000]),
            series("annualFreeCashFlow", [15000, 16000, 17000, 18000]),
            series("annualStockholdersEquity", [100000, 110000, 120000, 130000]),
            series("annualTotalDebt", [50000, 52000, 54000, 56000]),
            series("annualDilutedAverageShares", [10000, 10000, 10000, 10000]),
            series("trailingMarketCap", [150000], { periodType: "TTM" }),
            series("trailingPeRatio", [8, 10, 12, 14], { periodType: "TTM", currencyCode: "" }),
            series("trailingDividendYield", [0.05], { periodType: "TTM", currencyCode: "" }),
          ],
        },
      }),
    };
  },
});
assert.equal(viResearch.symbol, "PTT");
assert.equal(viResearch.viFundamentals.metrics.length, 8);
assert.equal(viResearch.viFundamentals.coveragePct, 100);
assert.equal(viResearch.viFundamentals.metrics.find((metric) => metric.key === "roe").value, 20.8);
assert.equal(viResearch.viFundamentals.metrics.find((metric) => metric.key === "debtToEquity").value, 0.4308);
assert.equal(viResearch.viFundamentals.metrics.find((metric) => metric.key === "dividendYield").value, 5);
assert.equal(viResearch.valuationModel.referencePe, 11);
assert.equal(viResearch.valuationModel.fairValue, 28.6);
assert.equal(viResearch.valuationModel.interestingPriceLow, 20.02);
assert.equal(viResearch.valuationModel.interestingPriceHigh, 22.88);
assert(viResearch.sources.some((source) => source.id === "set_factsheet"));

const viMissing = await fetchYahooViResearch("PTT", {
  fetchImpl: async (url) => String(url).includes("/v1/finance/search")
    ? {
      ok: true,
      json: async () => ({ quotes: [{ symbol: "PTT.BK", longname: "PTT" }], news: [] }),
    }
    : { ok: false, status: 503, json: async () => ({}) },
});
assert.equal(viMissing.viFundamentals.coveragePct, 0);
assert.equal(viMissing.viFundamentals.missingKeys.length, 8);
assert.equal(viMissing.valuationModel, null);
assert.match(viMissing.viFundamentals.warnings[0], /ไม่สำเร็จ/u);

console.log("Market history regression passed.");
