function normalizeSymbol(value) {
  return String(value || "").trim().toUpperCase().replace(/\.BK$/u, "");
}

export function resolveAiCompanionSymbol({
  availableSymbols = [],
  selectedSymbol = "",
  marketChartSymbol = "",
  companyResearchSymbol = "",
  fallbackSymbol = "",
} = {}) {
  const allowedSymbols = [...new Set(availableSymbols.map(normalizeSymbol).filter(Boolean))];
  const allowedSet = new Set(allowedSymbols);
  return [selectedSymbol, marketChartSymbol, companyResearchSymbol, fallbackSymbol]
    .map(normalizeSymbol)
    .find((symbol) => allowedSet.has(symbol)) || allowedSymbols[0] || "";
}

export function buildAiCompanionPrompts(view, value) {
  const symbol = normalizeSymbol(value);
  const stockLabel = symbol || "หุ้นที่เลือก";
  const prompts = {
    portfolio: [
      { id: "portfolio_review", mode: "portfolio", label: "วันนี้ควรตรวจหุ้นตัวไหนก่อน" },
      { id: "value_investing", mode: "vi", symbol, requiresViResearch: true, label: `วิเคราะห์ ${stockLabel} แบบ VI ระยะยาว` },
      { id: "beginner_wait_reasons", mode: "portfolio", label: "ถ้าจะเพิ่มเงิน มีเหตุผลอะไรที่ควรชะลอก่อน" },
      { id: "beginner_metrics", mode: "portfolio", label: "แปล Score, PE, RSI, RRR และ Volume ในพอร์ตนี้" },
      { id: "portfolio_concentration", mode: "portfolio", label: "พอร์ตกระจุกตัวตรงไหนและเสี่ยงอย่างไร" },
    ],
    screener: [
      { id: "value_investing", mode: "vi", symbol, requiresViResearch: true, label: `วิเคราะห์ ${stockLabel} แบบ VI ระยะยาว` },
      { id: "beginner_stock_basics", mode: "stock", symbol, requiresResearch: true, label: `${stockLabel} ทำธุรกิจอะไร และตัวเลขบอกอะไร` },
      { id: "screener_shortlist", mode: "stock", symbol, label: `ทำไม ${stockLabel} จึงน่าศึกษา และยังขาดอะไร` },
      { id: "beginner_wait_reasons", mode: "stock", symbol, label: `มีเหตุผลอะไรที่ยังไม่ควรลงทุนใน ${stockLabel}` },
      { id: "beginner_metrics", mode: "stock", symbol, label: `แปล PE, RSI, RRR และ Volume ของ ${stockLabel}` },
    ],
    sector: [
      { id: "sector_explain", mode: "compare", symbol, label: `${stockLabel} ต่างจากคู่แข่งในกลุ่มอย่างไรจากตัวเลขจริง` },
      { id: "sector_concentration", mode: "portfolio", label: "Sector ที่เลือกกระจุกตัวในหุ้นใด" },
      { id: "beginner_metrics", mode: "compare", symbol, label: `แปลตัวเลขสำคัญของ ${stockLabel} และหุ้นในกลุ่ม` },
      { id: "beginner_wait_reasons", mode: "compare", symbol, label: `อะไรทำให้ยังไม่ควรรีบเลือก ${stockLabel}` },
    ],
    simulation: [
      { id: "simulation_interpretation", mode: "portfolio", label: "ควรอ่านผล Simulation อย่างไร" },
      { id: "portfolio_warnings", mode: "portfolio", label: "ข้อจำกัดของ Backtest มีอะไรบ้าง" },
    ],
  };
  return prompts[view] || prompts.portfolio;
}
