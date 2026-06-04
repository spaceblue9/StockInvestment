import { calculateRsi, fetchChart } from "./marketDataService.js";

export async function runStrategySimulation(symbol, options = {}) {
  const {
    startDate,
    initialCapital = 100000,
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
      summary: null,
    };
  }

  let cash = Number(initialCapital);
  let shares = 0;
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

    if (cash >= price * 10 && price <= entryHigh) {
      const buyShares = Math.floor(cash / price);
      const cost = buyShares * price;
      cash -= cost;
      shares += buyShares;
      action = "BUY";
      trades.push(trade(row.date, "BUY", price, buyShares));
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
    });
  }

  const finalValue = portfolioHistory.at(-1).Portfolio_Value;
  const buyHoldValue = portfolioHistory.at(-1).Buy_Hold_Value;

  return {
    symbol: ticker,
    history: portfolioHistory,
    trades,
    summary: {
      finalValue,
      buyHoldValue,
      roi: ((finalValue - initialCapital) / initialCapital) * 100,
      buyHoldRoi: ((buyHoldValue - initialCapital) / initialCapital) * 100,
      totalTrades: trades.length,
    },
  };
}

function trade(date, action, price, shares) {
  return {
    Date: toDateString(date),
    Action: action,
    Price: price,
    Shares: shares,
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
