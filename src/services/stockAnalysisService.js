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
  const dataValidation = getDataValidation(row);
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
  const scoreMatrix = getDerivedScoreMatrix({
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
    Volume_Ratio: volumeRatio,
  });

  const analyzed = {
    ...row,
    Sector_PE: sectorPe,
    Sector_ROE: sectorRoe,
    Sector_Yield: sectorYield,
    Data_Status: dataValidation.status,
    Data_Warnings: dataValidation.warnings.join(" | "),
    DE_Score: deScore,
    Price_Position: pricePosition,
    RSI_Score: rsiScore,
    Relative_Quality_Score: relativeQualityScore,
    PE_Score: peScore,
    ROE_Score: roeScore,
    Yield_Score: yieldScore,
    Quality_Score: scoreMatrix.Quality_Score,
    Valuation_Score: scoreMatrix.Valuation_Score,
    Setup_Score: scoreMatrix.Setup_Score,
    Balance_Risk_Score: scoreMatrix.Balance_Risk_Score,
    Liquidity_Score: scoreMatrix.Liquidity_Score,
    Composite_Score_v2: scoreMatrix.Composite_Score_v2,
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
  const conflictSummary = getConflictSummary(analyzed);

  return {
    ...analyzed,
    Conflict_Severity: conflictSummary.severity,
    Conflict_Alerts: conflictSummary.alerts.map((alert) => `${alert.type}: ${alert.message}`).join(" | "),
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

function getDataValidation(row) {
  const hardErrors = [];
  const warnings = [];

  if (!row.Symbol) {
    hardErrors.push("Missing stock symbol");
  }

  if (isUnknownText(row.Sector)) {
    warnings.push("Sector is unknown, so sector comparison may be unreliable");
  }

  if (!isPositiveFinite(row.Price)) {
    hardErrors.push("Price is missing or not positive");
  }

  if (!isPositiveFinite(row.High_52W) || !isPositiveFinite(row.Low_52W) || row.High_52W <= row.Low_52W) {
    hardErrors.push("52-week high/low is missing or invalid");
  }

  if (!Number.isFinite(row.PE)) {
    warnings.push("P/E is missing, valuation score may be incomplete");
  } else if (row.PE <= 0) {
    warnings.push("P/E is zero or negative, this may mean losses or abnormal earnings");
  }

  if (!Number.isFinite(row.ROE)) {
    warnings.push("ROE is missing, quality score may be incomplete");
  }

  if (!Number.isFinite(row.DE)) {
    warnings.push("D/E is missing, balance sheet risk may be incomplete");
  } else if (row.DE < 0 || row.DE > 5) {
    warnings.push("D/E is outside the normal range, review debt data before relying on this score");
  }

  if (!Number.isFinite(row.RSI) || row.RSI < 0 || row.RSI > 100) {
    warnings.push("RSI is missing or outside 0-100, timing signal may be unreliable");
  }

  if (!isPositiveFinite(row.Volume) || !isPositiveFinite(row.Avg_Vol_10D)) {
    warnings.push("Volume data is missing, liquidity confirmation may be incomplete");
  }

  return {
    status: hardErrors.length ? "DATA_ERROR" : warnings.length ? "REVIEW_REQUIRED" : "VALID",
    warnings: [...hardErrors, ...warnings],
  };
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
  if (!Number.isFinite(row.High_52W) || !Number.isFinite(row.Low_52W) || row.High_52W === row.Low_52W) {
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

function getDerivedScoreMatrix(row) {
  const qualityScore = averageFinite([
    row.ROE_Score,
    row.Relative_Quality_Score,
    scoreRoeAbsolute(row.ROE),
  ]);
  const valuationScore = averageFinite([
    row.PE_Score,
    row.Yield_Score,
    scorePeRelative(row.PE, row.Sector_PE),
  ]);
  const setupScore = averageFinite([
    row.RSI_Score,
    scorePricePositionSetup(row.Price_Position),
  ]);
  const balanceRiskScore = row.DE_Score;
  const liquidityScore = scoreLiquidity(row.Volume_Ratio);
  const compositeScoreV2 = (
    qualityScore * 0.35
    + valuationScore * 0.25
    + setupScore * 0.15
    + balanceRiskScore * 0.15
    + liquidityScore * 0.10
  );

  return {
    Quality_Score: clamp(qualityScore, 0, 100),
    Valuation_Score: clamp(valuationScore, 0, 100),
    Setup_Score: clamp(setupScore, 0, 100),
    Balance_Risk_Score: clamp(balanceRiskScore, 0, 100),
    Liquidity_Score: clamp(liquidityScore, 0, 100),
    Composite_Score_v2: clamp(compositeScoreV2, 0, 100),
  };
}

function scoreRoeAbsolute(roe) {
  if (!Number.isFinite(roe)) return 50;
  if (roe >= 20) return 100;
  if (roe >= 15) return 85;
  if (roe >= 12) return 70;
  if (roe >= 8) return 50;
  return 25;
}

function scorePeRelative(pe, sectorPe) {
  if (!Number.isFinite(pe) || pe <= 0) return 25;
  if (!Number.isFinite(sectorPe) || sectorPe <= 0) return 50;
  if (pe <= sectorPe * 0.75) return 90;
  if (pe <= sectorPe) return 75;
  if (pe <= sectorPe * 1.25) return 55;
  if (pe <= sectorPe * 1.5) return 35;
  return 20;
}

function scorePricePositionSetup(pricePosition) {
  if (!Number.isFinite(pricePosition)) return 50;
  if (pricePosition <= 20) return 90;
  if (pricePosition <= 40) return 75;
  if (pricePosition <= 60) return 55;
  if (pricePosition <= 80) return 35;
  return 20;
}

function scoreLiquidity(volumeRatio) {
  if (!Number.isFinite(volumeRatio) || volumeRatio <= 0) return 40;
  if (volumeRatio >= 2) return 100;
  if (volumeRatio >= 1.2) return 80;
  if (volumeRatio >= 0.8) return 60;
  return 35;
}

function averageFinite(values) {
  const finiteValues = values.filter((value) => Number.isFinite(value));
  if (!finiteValues.length) return 50;
  return finiteValues.reduce((total, value) => total + value, 0) / finiteValues.length;
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

function getConflictSummary(row) {
  const alerts = [];

  if (isUnknownText(row.Sector)) {
    alerts.push({
      severity: "ORANGE",
      type: "UNKNOWN_SECTOR",
      message: "Sector is unknown, so sector-relative scores may compare against the wrong group",
    });
  }

  if (Number.isFinite(row.DE) && (row.DE < 0 || row.DE > 5)) {
    alerts.push({
      severity: "ORANGE",
      type: "ABNORMAL_DE",
      message: "D/E is outside the normal range, review debt data before relying on the score",
    });
  }

  if (Number.isFinite(row.PE) && row.PE <= 0) {
    alerts.push({
      severity: "ORANGE",
      type: "PE_LOSS_OR_ABNORMAL",
      message: "P/E is zero or negative, this may be a loss-making or abnormal earnings case",
    });
  }

  if (row.RRR > 2 && row.Total_Score < 50) {
    alerts.push({
      severity: "ORANGE",
      type: "HIGH_RRR_LOW_SCORE",
      message: "Reward/risk looks high but total score is weak, treat as rebound risk rather than automatic buy",
    });
  }

  if (row.Total_Score > 75 && row.RRR < 1.5) {
    alerts.push({
      severity: "YELLOW",
      type: "HIGH_SCORE_LOW_RRR",
      message: "Stock quality score is high but reward/risk is not attractive yet, waiting may be safer",
    });
  }

  if (row.RSI < 35 && /Bearish/i.test(String(row.Trend_Status || ""))) {
    alerts.push({
      severity: "RED",
      type: "OVERSOLD_BEARISH",
      message: "RSI is oversold while trend is bearish, avoid averaging down until risk improves",
    });
  }

  if (row.Price_Position > 85) {
    alerts.push({
      severity: "YELLOW",
      type: "NEAR_52W_HIGH",
      message: "Price is near the 52-week high, upside may be limited for a new buy",
    });
  }

  if (row.Volume_Ratio > 0 && row.Volume_Ratio < 0.8) {
    alerts.push({
      severity: "YELLOW",
      type: "LOW_LIQUIDITY",
      message: "Current volume is below recent average, confirmation may be weak",
    });
  }

  return {
    severity: highestSeverity(alerts),
    alerts,
  };
}

function highestSeverity(alerts) {
  const severityRank = {
    GREEN: 0,
    YELLOW: 1,
    ORANGE: 2,
    RED: 3,
  };

  return alerts.reduce((highest, alert) => (
    severityRank[alert.severity] > severityRank[highest] ? alert.severity : highest
  ), "GREEN");
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
    return NaN;
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

function isPositiveFinite(value) {
  return Number.isFinite(value) && value > 0;
}

function isUnknownText(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return !normalized || normalized === "unknown" || normalized === "-" || normalized === "nan";
}

function numberValue(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized || normalized === "-" || normalized === "nan") {
      return NaN;
    }

    if (normalized === "inf" || normalized === "infinity") {
      return Infinity;
    }

    if (normalized === "-inf" || normalized === "-infinity") {
      return -Infinity;
    }
  }

  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : NaN;
}
