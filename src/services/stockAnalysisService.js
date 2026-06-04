import fs from "fs/promises";
import { toCsv } from "./csvService.js";

const NUMERIC_COLUMNS = [
  "Price",
  "PE",
  "PBV",
  "Yield",
  "ROE",
  "High_52W",
  "Low_52W",
  "RSI",
  "DE",
  "Volume",
  "Avg_Vol_10D",
];

export async function analyzeStocks(rows, options = {}) {
  const { outputFile } = options;
  const normalizedRows = normalizeRows(rows);
  const sectorStats = calculateSectorStats(normalizedRows);

  const recommendations = normalizedRows
    .map((row) => analyzeStockRow(row, sectorStats.get(row.Sector || "Unknown")))
    .sort((left, right) => right.Total_Score - left.Total_Score);

  if (outputFile) {
    await fs.writeFile(outputFile, toCsv(recommendations), "utf8");
  }

  return recommendations;
}

export function analyzeStockRow(row, stats = {}) {
  const sectorPe = numberValue(stats.Sector_PE);
  const sectorRoe = numberValue(stats.Sector_ROE);
  const sectorYield = numberValue(stats.Sector_Yield);
  const pricePosition = getPricePosition(row);
  const deScore = getDeScore(row.DE);
  const rsiScore = getRsiScore(row.RSI);
  const relativeQualityScore = getRelativeQualityScore(row, {
    Sector_PE: sectorPe,
    Sector_ROE: sectorRoe,
  });
  const peScore = row.PE < 12 ? 100 : (row.PE < 18 ? 70 : 30);
  const roeScore = row.ROE > 18 ? 100 : (row.ROE > 12 ? 70 : 30);
  const yieldScore = row.Yield > 5 ? 100 : (row.Yield > 3 ? 70 : 30);
  const totalScore = (
    deScore * 0.20
    + ((100 - pricePosition) * 0.10 + rsiScore * 0.10)
    + (peScore * 0.15 + roeScore * 0.15)
    + (relativeQualityScore * 0.30)
  );
  const entryZoneLow = row.Low_52W;
  const entryZoneHigh = row.Low_52W * 1.05;
  const exitZoneLow = row.High_52W * 0.97;
  const exitZoneHigh = row.High_52W;
  const volumeRatio = row.Avg_Vol_10D > 0 ? row.Volume / row.Avg_Vol_10D : 0;
  const stopLoss = row.Low_52W * 0.95;
  const reward = exitZoneLow - row.Price;
  const risk = row.Price - stopLoss;
  const upsidePct = row.Price > 0 ? (reward / row.Price) * 100 : 0;
  const rrr = risk > 0 ? reward / risk : 5.0;

  const analyzed = {
    ...row,
    Sector_PE: sectorPe,
    Sector_ROE: sectorRoe,
    Sector_Yield: sectorYield,
    DE_Score: deScore,
    Price_Position: pricePosition,
    RSI_Score: rsiScore,
    Relative_Quality_Score: relativeQualityScore,
    PE_Score: peScore,
    ROE_Score: roeScore,
    Yield_Score: yieldScore,
    Total_Score: totalScore,
    Entry_Zone_Low: entryZoneLow,
    Entry_Zone_High: entryZoneHigh,
    Exit_Zone_Low: exitZoneLow,
    Exit_Zone_High: exitZoneHigh,
    Volume_Ratio: volumeRatio,
    Stop_Loss: stopLoss,
    Upside_Pct: upsidePct,
    RRR: rrr,
    Recovery_Pct: 0.0,
    Trend_Status: getTrendStatus(row.RSI, pricePosition),
  };

  return {
    ...analyzed,
    Rationale: getRationale(analyzed),
  };
}

function normalizeRows(rows) {
  return rows
    .filter((row) => row && row.Symbol)
    .map((row) => {
      const normalized = {
        ...row,
        Symbol: String(row.Symbol || "").trim().toUpperCase(),
        Sector: row.Sector || "Unknown",
      };

      for (const column of NUMERIC_COLUMNS) {
        normalized[column] = numberValue(normalized[column]);
      }

      return normalized;
    });
}

function calculateSectorStats(rows) {
  const groups = new Map();

  for (const row of rows) {
    const sector = row.Sector || "Unknown";
    if (!groups.has(sector)) {
      groups.set(sector, []);
    }

    groups.get(sector).push(row);
  }

  const stats = new Map();
  for (const [sector, sectorRows] of groups.entries()) {
    stats.set(sector, {
      Sector_PE: median(sectorRows.map((row) => row.PE)),
      Sector_ROE: median(sectorRows.map((row) => row.ROE)),
      Sector_Yield: median(sectorRows.map((row) => row.Yield)),
    });
  }

  return stats;
}

function getDeScore(de) {
  if (!Number.isFinite(de)) {
    return 50;
  }

  if (de < 1.0) {
    return 100;
  }

  if (de < 1.5) {
    return 70;
  }

  if (de < 2.5) {
    return 30;
  }

  return 0;
}

function getPricePosition(row) {
  if (!row.High_52W || !row.Low_52W || row.High_52W === row.Low_52W) {
    return 50;
  }

  const position = ((row.Price - row.Low_52W) / (row.High_52W - row.Low_52W)) * 100;
  return clamp(position, 0, 100);
}

function getRsiScore(rsi) {
  if (!Number.isFinite(rsi)) {
    return 50;
  }

  if (rsi < 35) {
    return 100;
  }

  if (rsi < 50) {
    return 70;
  }

  if (rsi < 70) {
    return 30;
  }

  return 0;
}

function getRelativeQualityScore(row, stats) {
  let score = 50;

  if (row.PE < stats.Sector_PE) {
    score += 20;
  } else if (row.PE > stats.Sector_PE * 1.5) {
    score -= 20;
  }

  if (row.ROE > stats.Sector_ROE) {
    score += 20;
  } else if (row.ROE < stats.Sector_ROE * 0.5) {
    score -= 20;
  }

  return clamp(score, 0, 100);
}

function getTrendStatus(rsi, pricePosition) {
  if (rsi > 55 && pricePosition > 50) {
    return "Bullish 📈";
  }

  if (rsi < 45 && pricePosition < 40) {
    return "Bearish 📉";
  }

  if (rsi >= 45 && rsi <= 55) {
    return "Sideways ➡️";
  }

  return "Weak Trend ⚠️";
}

function getRationale(row) {
  const reasons = [];

  if (row.PE < row.Sector_PE) {
    reasons.push(`Cheaper than ${row.Sector} avg`);
  }

  if (row.ROE > row.Sector_ROE) {
    reasons.push("Above sector profitability");
  }

  if (row.DE < 1.0) {
    reasons.push("Strong balance sheet");
  }

  if (row.RSI < 35) {
    reasons.push("Technical entry point");
  }

  if (row.Yield > row.Sector_Yield) {
    reasons.push("High relative dividend");
  }

  if (row.Price <= row.Entry_Zone_High) {
    reasons.push("Within Entry Zone");
  }

  if (row.Volume_Ratio > 2.0) {
    reasons.push(`Volume Spike (${row.Volume_Ratio.toFixed(1)}x)`);
  }

  return reasons.length > 0 ? reasons.join(", ") : "Balanced performance";
}

function median(values) {
  const sorted = values
    .filter((value) => !Number.isNaN(value))
    .sort((left, right) => left - right);

  if (!sorted.length) {
    return 0;
  }

  const midpoint = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[midpoint];
  }

  return (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function numberValue(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (normalized === "inf" || normalized === "infinity") {
      return Infinity;
    }

    if (normalized === "-inf" || normalized === "-infinity") {
      return -Infinity;
    }
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
