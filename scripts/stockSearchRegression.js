import assert from "node:assert/strict";
import { createStockSearchMatcher, parseStockSearchTokens } from "../src/public/stockSearch.js";

const rows = [
  { Symbol: "PTT", Name: "PTT Public Company Limited" },
  { Symbol: "PTTEP", Name: "PTT Exploration and Production" },
  { Symbol: "PTTGC", Name: "PTT Global Chemical" },
  { Symbol: "AOT.BK", Name: "Airports of Thailand" },
  { Symbol: "CPALL", Name: "CP All" },
];

function matchedSymbols(query) {
  const search = createStockSearchMatcher(rows, query);
  return rows.filter((row) => search.matches(row)).map((row) => row.Symbol.replace(/\.BK$/u, ""));
}

assert.deepEqual(parseStockSearchTokens(" PTT, AOT.BK; PTT "), ["PTT", "AOT"]);
assert.deepEqual(matchedSymbols("PTT, AOT"), ["PTT", "AOT"], "Known ticker tokens must use exact Symbol matching.");
assert.deepEqual(matchedSymbols("PTT"), ["PTT"], "PTT must not include PTTEP or PTTGC.");
assert.deepEqual(matchedSymbols("PT"), ["PTT", "PTTEP", "PTTGC"], "An unknown partial token should keep text search available.");
assert.deepEqual(matchedSymbols("airports thailand"), ["AOT"], "Company-name words should support partial text search.");
assert.deepEqual(matchedSymbols("PTT airport"), ["PTT", "AOT"], "Exact tickers and free-text terms should work together.");
assert.deepEqual(matchedSymbols(""), ["PTT", "PTTEP", "PTTGC", "AOT", "CPALL"], "Blank search should keep every row.");

console.log("Stock search regression passed.");
