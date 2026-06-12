import fs from "fs/promises";
import os from "os";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import ExcelJS from "exceljs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "stockflix-analysis-portfolio-flow-"));
const nativeFetch = globalThis.fetch.bind(globalThis);

process.chdir(tempRoot);

const { startServer } = await import(pathToFileURL(path.join(repoRoot, "src", "server.js")).href);
const server = await listenInProcess();

try {
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  const auth = await postJson(`${baseUrl}/api/auth/register`, {
    name: "Portfolio Regression",
    email: "portfolio-regression@example.com",
    password: "password123",
  });
  const cookie = sessionCookie(auth.response);
  assert(auth.data.ok, "Registration should succeed before running analysis.");
  assert(cookie, "Registration should set a session cookie.");

  const portfolioBuffer = await buildPortfolioWorkbookBuffer([
    { Symbol: "PTT", Quantity: 100, Avg_Price: 32 },
    { Symbol: "AOT", Quantity: 50, Avg_Price: 61 },
  ]);
  const formData = new FormData();
  formData.append("portfolio", new Blob([portfolioBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "my_renamed_portfolio.xlsx");

  globalThis.fetch = fakeYahooFetch;
  const analysis = await postForm(`${baseUrl}/api/analysis/run`, formData, cookie);
  globalThis.fetch = nativeFetch;

  assertEqual(analysis.data.ok, true, "Analysis should succeed with an uploaded portfolio workbook.");
  assertEqual(analysis.data.portfolioRows.length, 2, "Analysis response should include two portfolio rows.");
  assertEqual(analysis.data.portfolioReport.count, 2, "Portfolio report metadata should count two rows.");
  assertEqual(analysis.data.customerSnapshot.portfolioRows.length, 2, "Saved snapshot should preserve portfolio rows.");
  assertEqual(analysis.data.customerSnapshot.summary.holdings, 2, "Saved snapshot summary should count holdings.");
  assertEqual(analysis.data.portfolioRows.map((row) => row.Symbol).sort().join("|"), "AOT|PTT", "Portfolio rows should preserve uploaded symbols.");
  assert(analysis.data.portfolioRows.every((row) => Number(row.Market_Value) > 0), "Portfolio rows should include market values.");
  assert(String(analysis.data.portfolioReport.downloadUrl || "").includes("my_renamed_portfolio_analysis_report.xlsx"), "Portfolio report should use the uploaded workbook basename, not the raw CSV public filename.");
  assert(String(analysis.data.outputs.raw || "").endsWith(path.join("data", "outputs", "siamchart_raw.csv")), "Internal raw output should remain the compatibility filename.");

  const savedPortfolio = await getJson(`${baseUrl}/api/customer/portfolio`, cookie);
  assertEqual(savedPortfolio.ok, true, "Saved portfolio endpoint should be available after analysis.");
  assertEqual(savedPortfolio.snapshot.portfolioRows.length, 2, "Saved portfolio endpoint should return portfolio rows for frontend render.");

  const internalRawPath = path.join(tempRoot, "data", "outputs", "siamchart_raw.csv");
  const recommendedPath = path.join(tempRoot, "data", "outputs", "recommended_stocks.csv");
  await fs.access(internalRawPath);
  const rawBeforeFailure = await fs.readFile(internalRawPath, "utf8");
  const recommendedBeforeFailure = await fs.readFile(recommendedPath, "utf8");
  const rawCsvDownload = await getTextWithHeaders(`${baseUrl}/api/analysis/raw`, cookie);
  assert((rawCsvDownload.contentDisposition || "").includes("raw_CSV.csv"), "Raw CSV download should still use the public raw_CSV.csv filename.");

  globalThis.fetch = fakeYahooFailureFetch;
  const failedAnalysis = await postForm(`${baseUrl}/api/analysis/run`, buildPortfolioForm(portfolioBuffer), cookie);
  globalThis.fetch = nativeFetch;
  assertEqual(failedAnalysis.response.status, 502, "Analysis should reject a run when no market rows can be fetched.");
  assertEqual(failedAnalysis.data.ok, false, "Failed market fetch should not be reported as a successful analysis.");
  assert((failedAnalysis.data.message || "").includes("Existing portfolio outputs were kept"), "Failure message should explain that existing outputs were kept.");
  assertEqual(await fs.readFile(internalRawPath, "utf8"), rawBeforeFailure, "Failed zero-row fetch must not overwrite the internal raw CSV.");
  assertEqual(await fs.readFile(recommendedPath, "utf8"), recommendedBeforeFailure, "Failed zero-row fetch must not overwrite recommendations.");

  const savedAfterFailure = await getJson(`${baseUrl}/api/customer/portfolio`, cookie);
  assertEqual(savedAfterFailure.snapshot.portfolioRows.length, 2, "Failed zero-row fetch must not replace the saved portfolio snapshot.");

  await fs.writeFile(path.join(tempRoot, "recommended_stocks.csv"), referenceCsv(), "utf8");
  globalThis.fetch = fakeYahooFailureFetch;
  const fallbackAnalysis = await postForm(`${baseUrl}/api/analysis/run`, buildPortfolioForm(portfolioBuffer), cookie);
  globalThis.fetch = nativeFetch;
  assertEqual(fallbackAnalysis.data.ok, true, "Analysis should succeed from reference fallback when live fetch fails but reference rows exist.");
  assertEqual(fallbackAnalysis.data.count, 2, "Reference fallback should provide market rows for both uploaded holdings.");
  assertEqual(fallbackAnalysis.data.portfolioRows.length, 2, "Reference fallback analysis should still return portfolio rows.");
  assert(fallbackAnalysis.data.logs.some((line) => line.includes("Using reference fallback")), "Analysis logs should explain reference fallback usage.");

  console.log(JSON.stringify({
    ok: true,
    checked: [
      "authenticated-analysis-run",
      "renamed-portfolio-workbook-upload",
      "portfolio-rows-response",
      "portfolio-snapshot-persistence",
      "internal-raw-file-compatibility",
      "public-raw-download-filename",
      "zero-row-fetch-rejects",
      "zero-row-fetch-keeps-existing-outputs",
      "zero-row-fetch-keeps-existing-snapshot",
      "reference-fallback-analysis",
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

async function buildPortfolioWorkbookBuffer(rows) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Portfolio");
  worksheet.columns = [
    { header: "Symbol", key: "Symbol", width: 12 },
    { header: "Quantity", key: "Quantity", width: 12 },
    { header: "Avg_Price", key: "Avg_Price", width: 12 },
  ];
  worksheet.addRows(rows);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

function buildPortfolioForm(portfolioBuffer) {
  const formData = new FormData();
  formData.append("portfolio", new Blob([portfolioBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  }), "my_renamed_portfolio.xlsx");
  return formData;
}

async function postJson(url, payload) {
  const response = await nativeFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return {
    response,
    data: await response.json(),
  };
}

async function postForm(url, formData, cookie) {
  const response = await nativeFetch(url, {
    method: "POST",
    headers: { Cookie: cookie },
    body: formData,
  });
  return {
    response,
    data: await response.json(),
  };
}

async function getJson(url, cookie) {
  const response = await nativeFetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return response.json();
}

async function getTextWithHeaders(url, cookie) {
  const response = await nativeFetch(url, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  assert(response.ok, `${url} should return HTTP 2xx, got ${response.status}.`);
  return {
    text: await response.text(),
    contentDisposition: response.headers.get("content-disposition") || "",
  };
}

function sessionCookie(response) {
  return String(response.headers.get("set-cookie") || "").split(";")[0];
}

async function fakeYahooFetch(url) {
  const ticker = decodeURIComponent(String(url).split("/chart/")[1]?.split("?")[0] || "");
  const symbol = ticker.replace(/\.BK$/i, "").toUpperCase();
  const fixture = {
    PTT: { price: 35, high: 42, low: 28, volume: 1200000 },
    AOT: { price: 66, high: 78, low: 54, volume: 900000 },
  }[symbol];

  if (!fixture) {
    return new Response(JSON.stringify({ chart: { result: [], error: { description: "No fixture" } } }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(buildYahooChartPayload(symbol, fixture)), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

async function fakeYahooFailureFetch() {
  return new Response(JSON.stringify({ chart: { result: [], error: { description: "No fixture market data" } } }), {
    status: 404,
    headers: { "Content-Type": "application/json" },
  });
}

function buildYahooChartPayload(symbol, fixture) {
  const timestampStart = 1760000000;
  const timestamps = Array.from({ length: 20 }, (_value, index) => timestampStart + (index * 86400));
  const closes = timestamps.map((_value, index) => fixture.price - 1 + (index % 5) * 0.5);
  const highs = closes.map((close) => close + 1);
  const lows = closes.map((close) => close - 1);
  const volumes = timestamps.map((_value, index) => fixture.volume + (index * 1000));

  return {
    chart: {
      result: [{
        meta: {
          symbol: `${symbol}.BK`,
          regularMarketPrice: fixture.price,
          regularMarketVolume: fixture.volume,
          fiftyTwoWeekHigh: fixture.high,
          fiftyTwoWeekLow: fixture.low,
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
    "Symbol,Sector,Price,PE,PBV,Yield,ROE,High_52W,Low_52W,RSI,DE,Volume,Avg_Vol_10D",
    "PTT,Energy,34,10,1.2,4,12,42,28,55,0.6,1200000,1100000",
    "AOT,Transport,65,22,3.1,1.2,9,78,54,62,0.8,900000,850000",
    "",
  ].join("\n");
}

function closeServer(targetServer) {
  return new Promise((resolve, reject) => {
    targetServer.close((error) => (error ? reject(error) : resolve()));
  });
}

function assert(value, message) {
  if (!value) {
    throw new Error(message);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}
