const FUNDAMENTAL_DATA_REQUIREMENTS = [
  {
    key: "normalized_eps",
    label: "Normalized EPS",
    fields: ["Normalized_EPS", "EPS", "eps"],
    reason: "Needed to estimate a fair value from normalized earnings.",
  },
  {
    key: "profit_growth",
    label: "Profit growth",
    fields: ["Net_Profit_Growth", "Profit_Growth", "Earnings_Growth"],
    reason: "Needed to detect value traps where low PE comes from falling earnings.",
  },
  {
    key: "revenue_growth",
    label: "Revenue growth",
    fields: ["Revenue_Growth", "Sales_Growth"],
    reason: "Needed to confirm that business demand is stable or growing.",
  },
  {
    key: "payout_ratio",
    label: "Payout ratio",
    fields: ["Payout_Ratio", "Dividend_Payout"],
    reason: "Needed to detect dividend traps and unsustainable yield.",
  },
  {
    key: "analyst_target",
    label: "Analyst target",
    fields: ["Analyst_Target", "Consensus_Target", "Target_Price"],
    reason: "Optional source for fundamental upside when fair value is not available.",
  },
  {
    key: "fair_value",
    label: "Fair value",
    fields: ["Fair_Value", "Intrinsic_Value", "Fundamental_Target"],
    reason: "Needed to calculate Fundamental RRR without using 52-week high as a proxy.",
  },
];

export function buildFundamentalReadinessReport(rows = [], options = {}) {
  const totalRows = Array.isArray(rows) ? rows.length : 0;
  const requirements = FUNDAMENTAL_DATA_REQUIREMENTS.map((requirement) => {
    const presentRows = rows.filter((row) => requirement.fields.some((field) => hasUsableValue(row?.[field]))).length;
    const coveragePct = totalRows ? (presentRows / totalRows) * 100 : 0;
    return {
      key: requirement.key,
      label: requirement.label,
      fields: requirement.fields,
      reason: requirement.reason,
      presentRows,
      missingRows: totalRows - presentRows,
      coveragePct,
      status: coveragePct >= 80 ? "READY" : coveragePct >= 30 ? "PARTIAL" : "MISSING",
    };
  });
  const readyCount = requirements.filter((item) => item.status === "READY").length;
  const partialCount = requirements.filter((item) => item.status === "PARTIAL").length;
  const missingCount = requirements.filter((item) => item.status === "MISSING").length;
  const fairValueReady = requirements.find((item) => item.key === "fair_value")?.status === "READY";
  const epsReady = requirements.find((item) => item.key === "normalized_eps")?.status === "READY";
  const canCalculateFundamentalRrr = fairValueReady || epsReady;

  return {
    generatedAt: new Date().toISOString(),
    source: options.source || "rows",
    totalRows,
    canCalculateFundamentalRrr,
    overallStatus: canCalculateFundamentalRrr ? "PARTIAL_READY" : "INSUFFICIENT_DATA",
    summary: {
      readyCount,
      partialCount,
      missingCount,
    },
    requirements,
    recommendation: canCalculateFundamentalRrr
      ? "Fundamental RRR can be piloted in shadow mode, but missing fields should still be reviewed."
      : "Do not calculate Fundamental RRR yet. Add fair value, normalized EPS, growth, payout, and analyst target data first.",
  };
}

export function fundamentalReadinessRequirements() {
  return FUNDAMENTAL_DATA_REQUIREMENTS.map((requirement) => ({ ...requirement }));
}

function hasUsableValue(value) {
  if (value === null || value === undefined) {
    return false;
  }

  const text = String(value).trim();
  if (!text || text === "-" || text.toLowerCase() === "nan" || text.toLowerCase() === "n/a") {
    return false;
  }

  const number = Number(text.replaceAll(",", ""));
  return Number.isFinite(number) ? number !== 0 : true;
}
