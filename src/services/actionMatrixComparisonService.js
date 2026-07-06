export function buildActionMatrixComparisonReport(rows = [], options = {}) {
  const source = options.source || "portfolio-analysis";
  const normalizedRows = rows.map(normalizeRow).filter((row) => row.Symbol);
  const totalRows = normalizedRows.length;
  const changedRows = normalizedRows.filter((row) => row.Action_v2_Change && row.Action_v2_Change !== "SAME_FAMILY");
  const riskBlockedRows = normalizedRows.filter((row) => row.Action_v2_Risk_Block && row.Action_v2_Risk_Block !== "NONE");
  const redBlockedBuyRows = normalizedRows.filter((row) => (
    legacyFamily(row) === "BUY"
    && (row.Action_v2_Risk_Block === "RED_CONFLICT" || row.Action_v2_Shadow === "BLOCKED_RED_CONFLICT_SHADOW")
  ));
  const dataBlockedRows = normalizedRows.filter((row) => row.Action_v2_Risk_Block === "DATA_ERROR");

  return {
    source,
    mode: "shadow_only",
    totalRows,
    changedRows: changedRows.length,
    sameFamilyRows: totalRows - changedRows.length,
    changedPct: totalRows ? round((changedRows.length / totalRows) * 100) : 0,
    riskBlockedRows: riskBlockedRows.length,
    redBlockedBuyRows: redBlockedBuyRows.length,
    dataBlockedRows: dataBlockedRows.length,
    legacyActionMix: countBy(normalizedRows, legacyFamily),
    shadowActionMix: countBy(normalizedRows, shadowFamily),
    changeMatrix: countBy(normalizedRows, (row) => row.Action_v2_Change || compareFamilies(legacyFamily(row), shadowFamily(row))),
    riskBlockMix: countBy(normalizedRows, (row) => row.Action_v2_Risk_Block || "NONE"),
    reviewSamples: changedRows.slice(0, options.sampleLimit || 15).map(toReviewSample),
    redBlockedBuySamples: redBlockedBuyRows.slice(0, options.sampleLimit || 15).map(toReviewSample),
    recommendation: buildRecommendation({ totalRows, changedRows, riskBlockedRows, redBlockedBuyRows, dataBlockedRows }),
  };
}

function normalizeRow(row) {
  const legacy = legacyFamily(row);
  const shadow = shadowFamily(row);
  return {
    ...row,
    Symbol: String(row.Symbol || "").trim().toUpperCase(),
    Target_Action: String(row.Target_Action || row.Advice || ""),
    Action_v2_Shadow: String(row.Action_v2_Shadow || ""),
    Action_v2_Risk_Block: String(row.Action_v2_Risk_Block || "NONE").toUpperCase(),
    Action_v2_Change: String(row.Action_v2_Change || compareFamilies(legacy, shadow)),
  };
}

function toReviewSample(row) {
  return {
    Symbol: row.Symbol,
    Sector: row.Sector || "Unknown",
    Target_Action: row.Target_Action || "-",
    Action_v2_Shadow: row.Action_v2_Shadow || "-",
    Action_v2_Change: row.Action_v2_Change || "-",
    Action_v2_Risk_Block: row.Action_v2_Risk_Block || "NONE",
    Conflict_Severity: row.Conflict_Severity || "GREEN",
    Data_Status: row.Data_Status || "VALID",
    Total_Score: numericOrNull(row.Total_Score),
    Composite_Score_v2: numericOrNull(row.Composite_Score_v2),
    Technical_RRR: numericOrNull(row.Technical_RRR ?? row.RRR),
    Rationale: row.Action_v2_Rationale || row.Conflict_Alerts || "",
  };
}

function buildRecommendation({ totalRows, changedRows, riskBlockedRows, redBlockedBuyRows, dataBlockedRows }) {
  if (!totalRows) {
    return "No rows available. Run portfolio analysis before reviewing Think2 shadow actions.";
  }

  if (redBlockedBuyRows.length || dataBlockedRows.length) {
    return "Review blocked cases first. Do not enable Think2 action engine until RED/DATA_ERROR cases are understood.";
  }

  if (changedRows.length / totalRows > 0.25) {
    return "Many actions changed. Keep Think2 in shadow mode and review samples with the owner before rollout.";
  }

  if (riskBlockedRows.length) {
    return "Some rows are risk-blocked. Keep shadow mode and review conflict/data quality before rollout.";
  }

  return "Shadow results are mostly aligned, but keep Think2 in review mode until owner sign-off.";
}

function legacyFamily(row) {
  return actionFamily(row.Target_Action || row.Advice);
}

function shadowFamily(row) {
  return actionFamily(row.Action_v2_Shadow);
}

function compareFamilies(legacy, shadow) {
  return legacy === shadow ? "SAME_FAMILY" : `${legacy}_TO_${shadow}`;
}

function actionFamily(action) {
  const text = String(action || "").toUpperCase();

  if (/NO DATA|BLOCKED|DATA_ERROR|RED_CONFLICT/.test(text)) {
    return "BLOCK";
  }

  if (/BUY|ACCUMULATE/.test(text)) {
    return "BUY";
  }

  if (/WAIT|WATCH|REVIEW|HOLD|KEEP/.test(text)) {
    return "HOLD";
  }

  if (/SELL|REDUCE|EXIT|CUT|TP/.test(text)) {
    return "REDUCE";
  }

  if (/AVOID/.test(text)) {
    return "AVOID";
  }

  return "REVIEW";
}

function countBy(rows, keyFn) {
  return rows.reduce((counts, row) => {
    const key = keyFn(row) || "Unknown";
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
}

function numericOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? round(number) : null;
}

function round(value) {
  return Math.round(value * 100) / 100;
}
