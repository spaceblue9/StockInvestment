import { calculateRsi, fetchChart } from "./marketDataService.js";

export async function runStrategySimulation(symbol, options = {}) {
  const {
    startDate,
    initialCapital = 100000,
    buyMode = "lump_sum",
    tranches = 1,
    trancheIntervalDays = 20,
  } = options;

  if (!symbol) {
    throw new Error("Symbol is required.");
  }

  if (!startDate) {
    throw new Error("startDate is required.");
  }

  const ticker = symbol.includes(".") ? symbol.toUpperCase() : `${symbol.toUpperCase()}.BK`;
  const baselineStart = new Date(startDate);
  baselineStart.setFullYear(baselineStart.getFullYear() - 1);

  const chart = await fetchChart(ticker, {
    period1: baselineStart,
    period2: new Date(),
    interval: "1d",
  });
  const allRows = chart.history
    .filter((row) => row.close && row.high && row.low)
    .sort((left, right) => left.date - right.date);
  const simulationStart = new Date(startDate);
  const simRows = allRows.filter((row) => row.date >= simulationStart);

  if (!simRows.length) {
    return {
      symbol: ticker,
      history: [],
      trades: [],
      buyPlan: buildBuyPlan({ initialCapital, buyMode, tranches, trancheIntervalDays }),
      summary: null,
    };
  }

  const result = simulateRows(allRows, simRows, {
    initialCapital,
    buyMode,
    tranches,
    trancheIntervalDays,
  });

  return {
    symbol: ticker,
    ...result,
  };
}

export function simulateRows(allRows, simRows, options = {}) {
  const {
    initialCapital = 100000,
    buyMode = "lump_sum",
    tranches = 1,
    trancheIntervalDays = 20,
  } = options;
  const buyPlan = buildBuyPlan({ initialCapital, buyMode, tranches, trancheIntervalDays });
  let cash = buyPlan.mode === "split" ? 0 : Number(initialCapital);
  let shares = 0;
  let deployedCapital = 0;
  let totalBuyCost = 0;
  let totalBuyShares = 0;
  let nextTrancheIndex = 0;
  const portfolioHistory = [];
  const trades = [];
  const firstPrice = simRows[0].close;

  for (const row of simRows) {
    const window = allRows.filter((historyRow) => historyRow.date <= row.date).slice(-252);
    const low52w = min(window.map((historyRow) => historyRow.low));
    const high52w = max(window.map((historyRow) => historyRow.high));
    const closesForRsi = allRows
      .filter((historyRow) => historyRow.date <= row.date)
      .map((historyRow) => historyRow.close)
      .slice(-30);
    const price = row.close;
    const rsi = calculateRsi(closesForRsi);
    const entryHigh = low52w * 1.05;
    const exitLow = high52w * 0.97;
    const stopLoss = low52w * 0.95;
    let action = "HOLD";
    const trancheAmount = buyPlan.mode === "split" ? dueTrancheAmount(buyPlan, nextTrancheIndex, simRows, row) : 0;

    if (trancheAmount > 0) {
      cash += trancheAmount;
      deployedCapital += trancheAmount;
      nextTrancheIndex += 1;
      action = `TRANCHE ${nextTrancheIndex} READY`;
    }

    if (cash >= price * 10 && price <= entryHigh) {
      const buyShares = Math.floor(cash / price);
      const cost = buyShares * price;
      cash -= cost;
      shares += buyShares;
      action = "BUY";
      totalBuyCost += cost;
      totalBuyShares += buyShares;
      trades.push(trade(row.date, buyPlan.mode === "split" ? `BUY T${nextTrancheIndex || 1}` : "BUY", price, buyShares, cost));
    } else if (shares > 0 && price <= stopLoss) {
      cash += shares * price;
      action = "STOP LOSS";
      trades.push(trade(row.date, "STOP LOSS", price, shares));
      shares = 0;
    } else if (shares >= 2 && price >= exitLow) {
      const sellHalf = Math.floor(shares / 2);
      cash += sellHalf * price;
      action = "TAKE PROFIT (50%)";
      trades.push(trade(row.date, "TP 50%", price, sellHalf));
      shares -= sellHalf;
    }

    const portfolioValue = cash + (shares * price);
    portfolioHistory.push({
      Date: toDateString(row.date),
      Price: price,
      RSI: rsi,
      Portfolio_Value: portfolioValue,
      Buy_Hold_Value: (initialCapital / firstPrice) * price,
      Cash: cash,
      Shares: shares,
      Action: action,
      Deployed_Capital: buyPlan.mode === "split" ? deployedCapital : Number(initialCapital),
    });
  }

  const finalValue = portfolioHistory.at(-1).Portfolio_Value;
  const buyHoldValue = portfolioHistory.at(-1).Buy_Hold_Value;
  const averageCost = totalBuyShares ? totalBuyCost / totalBuyShares : 0;

  return {
    history: portfolioHistory,
    trades,
    buyPlan: {
      ...buyPlan,
      completedTranches: buyPlan.mode === "split" ? nextTrancheIndex : 1,
      deployedCapital: buyPlan.mode === "split" ? deployedCapital : Number(initialCapital),
      averageCost,
    },
    summary: {
      finalValue,
      buyHoldValue,
      roi: ((finalValue - initialCapital) / initialCapital) * 100,
      buyHoldRoi: ((buyHoldValue - initialCapital) / initialCapital) * 100,
      totalTrades: trades.length,
      averageCost,
      deployedCapital: buyPlan.mode === "split" ? deployedCapital : Number(initialCapital),
      completedTranches: buyPlan.mode === "split" ? nextTrancheIndex : 1,
    },
  };
}

function buildBuyPlan({ initialCapital, buyMode, tranches, trancheIntervalDays }) {
  const mode = buyMode === "split" ? "split" : "lump_sum";
  const trancheCount = mode === "split" ? Math.max(2, Math.min(24, Math.round(Number(tranches) || 5))) : 1;
  const intervalDays = Math.max(1, Math.min(252, Math.round(Number(trancheIntervalDays) || 20)));
  const amountPerTranche = Number(initialCapital) / trancheCount;
  return {
    mode,
    tranches: trancheCount,
    trancheIntervalDays: intervalDays,
    amountPerTranche,
  };
}

function dueTrancheAmount(buyPlan, nextTrancheIndex, simRows, row) {
  if (buyPlan.mode !== "split" || nextTrancheIndex >= buyPlan.tranches) {
    return 0;
  }
  const rowIndex = simRows.indexOf(row);
  if (rowIndex < nextTrancheIndex * buyPlan.trancheIntervalDays) {
    return 0;
  }
  return buyPlan.amountPerTranche;
}

function trade(date, action, price, shares, cost = price * shares) {
  return {
    Date: toDateString(date),
    Action: action,
    Price: price,
    Shares: shares,
    Cost: cost,
  };
}

function min(values) {
  return Math.min(...values.filter((value) => Number.isFinite(value)));
}

function max(values) {
  return Math.max(...values.filter((value) => Number.isFinite(value)));
}

function toDateString(date) {
  return date.toISOString().slice(0, 10);
}
