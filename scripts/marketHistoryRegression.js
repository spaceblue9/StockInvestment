import assert from "node:assert/strict";
import { fetchYahoo52WeekHistory, fetchYahooCompanyResearch } from "../src/services/marketDataService.js";

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

console.log("Market history regression passed.");
