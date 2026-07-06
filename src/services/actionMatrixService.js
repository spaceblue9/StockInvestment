export function buildActionMatrixShadow(row = {}) {
  const quality = numberValue(row.Quality_Score);
  const valuation = numberValue(row.Valuation_Score);
  const setup = numberValue(row.Setup_Score);
  const balanceRisk = numberValue(row.Balance_Risk_Score);
  const liquidity = numberValue(row.Liquidity_Score);
  const composite = numberValue(row.Composite_Score_v2);
  const technicalRrr = numberValue(row.Technical_RRR ?? row.RRR);
  const conflict = String(row.Conflict_Severity || "GREEN").toUpperCase();
  const dataStatus = String(row.Data_Status || "VALID").toUpperCase();
  const fundamentalStatus = String(row.Fundamental_RRR_Status || "INSUFFICIENT_DATA").toUpperCase();
  const originalAction = String(row.Target_Action || row.Advice || "No Data");

  let action = "HOLD_REVIEW_SHADOW";
  let confidence = "MEDIUM";
  let block = "";
  const reasons = [];

  if (dataStatus === "DATA_ERROR") {
    action = "BLOCKED_DATA_ERROR_SHADOW";
    confidence = "HIGH";
    block = "DATA_ERROR";
    reasons.push("ข้อมูลสำคัญผิดหรือขาด จึงยังไม่ควรให้ action ใหม่");
  } else if (conflict === "RED") {
    action = "BLOCKED_RED_CONFLICT_SHADOW";
    confidence = "HIGH";
    block = "RED_CONFLICT";
    reasons.push("พบ RED conflict ต้องตรวจซ้ำก่อนตัดสินใจ");
  } else if (quality < 50 && technicalRrr >= 2) {
    action = "AVOID_VALUE_TRAP_SHADOW";
    confidence = "MEDIUM";
    reasons.push("RRR ดูดี แต่คุณภาพหุ้นต่ำ เสี่ยงเป็นหุ้นถูกหลอก");
  } else if (quality >= 75 && technicalRrr < 1.5) {
    action = "WAIT_FOR_ENTRY_SHADOW";
    confidence = "MEDIUM";
    reasons.push("หุ้นคุณภาพดี แต่จังหวะเข้าและความคุ้มค่ายังไม่พอ");
  } else if (balanceRisk < 45) {
    action = "REVIEW_BALANCE_RISK_SHADOW";
    confidence = "MEDIUM";
    reasons.push("ความเสี่ยงงบดุลสูงกว่าที่ควร ต้องอ่านหนี้และความเสี่ยงก่อน");
  } else if (quality >= 65 && valuation >= 60 && setup >= 55 && technicalRrr >= 2 && conflict !== "ORANGE") {
    action = "BUY_CANDIDATE_SHADOW";
    confidence = fundamentalStatus === "INSUFFICIENT_DATA" ? "MEDIUM" : "HIGH";
    reasons.push("คุณภาพ ราคา จังหวะ และ Technical RRR ผ่านเกณฑ์เบื้องต้น");
  } else if (composite >= 70 && quality >= 65 && technicalRrr >= 1.5) {
    action = "ACCUMULATE_SMALL_SHADOW";
    confidence = "MEDIUM";
    reasons.push("ภาพรวมดีพอสำหรับสะสมแบบระวัง แต่ยังไม่ใช่ buy signal เต็มรูปแบบ");
  } else if (liquidity < 45) {
    action = "WATCH_LIQUIDITY_SHADOW";
    confidence = "LOW";
    reasons.push("สภาพคล่องต่ำ ควรระวังการซื้อขายจริง");
  } else {
    reasons.push("ยังไม่เข้าเงื่อนไขเด่นของ Action Matrix v2");
  }

  if (fundamentalStatus === "INSUFFICIENT_DATA") {
    reasons.push("ยังไม่มี Fundamental RRR จึงเป็น shadow recommendation เท่านั้น");
  }

  return {
    Action_v2_Shadow: action,
    Action_v2_Confidence: confidence,
    Action_v2_Risk_Block: block || "NONE",
    Action_v2_Rationale: reasons.join(" | "),
    Action_v2_Change: compareActionFamily(originalAction, action),
  };
}

function compareActionFamily(originalAction, shadowAction) {
  const original = actionFamily(originalAction);
  const shadow = actionFamily(shadowAction);
  return original === shadow ? "SAME_FAMILY" : `${original}_TO_${shadow}`;
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

function numberValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
