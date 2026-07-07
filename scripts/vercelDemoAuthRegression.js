import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import ExcelJS from "exceljs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-vercel-demo-"));
const nativeFetch = globalThis.fetch.bind(globalThis);

process.env.VERCEL = "1";
process.env.APP_STATE_REPOSITORY = "local_file";
process.env.STOCKINVEST_DATA_DIR = path.join(tempRoot, "data");
process.chdir(tempRoot);
await fs.writeFile(path.join(tempRoot, "recommended_stocks.csv"), referenceCsv(), "utf8");

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const me = await getJson(`${baseUrl}/api/auth/me`);
  assertEqual(me.ok, true, "Auth me endpoint should be reachable in Vercel demo mode.");
  assertEqual(me.user?.demoMode, true, "Vercel demo mode should return a stateless demo user when no session exists.");
  assertEqual(me.user?.entitlements?.active, true, "Vercel demo user should have an active trial package.");
  assert(me.user?.entitlements?.effectiveFeatures?.includes("analysis.run"), "Vercel demo user should be allowed to run analysis.");

  const template = await fetch(`${baseUrl}/api/analysis/template/watchlist`);
  assertEqual(template.status, 200, "Vercel demo mode should allow template download without a persisted session.");

  const formData = new FormData();
  formData.append("watchlist", new Blob(["PTT\n"], { type: "text/plain" }), "watchlist.txt");
  formData.append("portfolio", new Blob([await buildPortfolioWorkbookBuffer()], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "portfolio_demo.xlsx");

  globalThis.fetch = fakeYahooFetch;
  const analysis = await postForm(`${baseUrl}/api/analysis/run`, formData);
  globalThis.fetch = nativeFetch;

  assertEqual(analysis.response.status, 200, "Vercel demo analysis should not fail with 401 when no persisted session exists.");
  assertEqual(analysis.data.ok, true, "Vercel demo analysis should succeed.");
  assertEqual(analysis.data.demoMode, true, "Vercel demo analysis response should disclose demo mode.");
  assertEqual(analysis.data.portfolioRows.length, 1, "Vercel demo analysis should return portfolio rows to the frontend.");
  assertEqual(analysis.data.customerSnapshot, null, "Vercel demo analysis should not claim persisted customer snapshot state.");
  assert(analysis.data.logs.some((line) => line.includes("live fetch is limited")), "Vercel analysis should use reference fallback to avoid serverless timeout.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "vercel-demo-auth-me",
      "vercel-demo-template-download",
      "vercel-demo-analysis-run-without-session",
      "vercel-demo-no-persisted-snapshot",
    ],
  }, null, 2));
} finally {
  globalThis.fetch = nativeFetch;
  await closeServer(server);
  process.chdir(repoRoot);
  await fs.rm(tempRoot, { recursive: true, force: true });
}

function listenInProcess() {
  return new Promise((resolve, reject) => {
    const targetServer = startServer({ port: 0, silent: true });
    targetServer.once("listening", () => resolve(targetServer));
    targetServer.once("error", reject);
  });
}

async function buildPortfolioWorkbookBuffer() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Portfolio");
  worksheet.addRow(["Symbol", "Quantity", "Avg_Price"]);
  worksheet.addRow(["PTT", 100, 32]);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function getJson(url) {
  const response = await nativeFetch(url);
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.json();
}

async function postForm(url, formData) {
  const response = await nativeFetch(url, {
    method: "POST",
    body: formData,
  });
  return {
    response,
    data: await response.json(),
  };
}

async function fakeYahooFetch(url) {
  const ticker = decodeURIComponent(String(url).split("/chart/")[1]?.split("?")[0] || "");
  const symbol = ticker.replace(/\.BK$/i, "").toUpperCase();
  if (symbol !== "PTT") {
    return new Response(JSON.stringify({ chart: { result: [], error: { description: "No fixture" } } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(buildYahooChartPayload(symbol)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

function buildYahooChartPayload(symbol) {
  const timestampStart = 1760000000;
  const timestamps = Array.from({ length: 20 }, (_value, index) => timestampStart + (index * 86400));
  const closes = timestamps.map((_value, index) => 34 + (index % 5) * 0.5);
  const highs = closes.map((close) => close + 1);
  const lows = closes.map((close) => close - 1);
  const volumes = timestamps.map((_value, index) => 1200000 + (index * 1000));

  return {
    chart: {
      result: [{
        meta: {
          symbol: `${symbol}.BK`,
          regularMarketPrice: 35,
          regularMarketVolume: 1200000,
          fiftyTwoWeekHigh: 42,
          fiftyTwoWeekLow: 28,
        },
        timestamp: timestamps,
        indicators: {
          quote: [{
            close: closes,
            high: highs,
            low: lows,
            volume: volumes,
          }],
        },
      }],
      error: null,
    },
  };
}

function referenceCsv() {
  return [
    "Symbol,Sector,Price,PE,PBV,Yield,ROE,DE,High_52W,Low_52W,RSI,Volume,Avg_Vol_10D",
    "PTT,Energy,35,10,1.1,4,12,0.6,42,28,55,1200000,1000000",
  ].join("\n");
}

function closeServer(targetServer) {
  return new Promise((resolve, reject) => {
    targetServer.close((error) => (error ? reject(error) : resolve()));
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message} Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
  }
}
