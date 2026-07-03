import ExcelJS from "exceljs";
import { normalizeExcelValue } from "./inputService.js";

const REPORT_COLUMNS = [
  "Symbol",
  "Sector",
  "Quantity",
  "Avg_Price",
  "Price",
  "Trend_Status",
  "Entry_Zone",
  "Exit_Zone",
  "Stop_Loss",
  "Upside_Pct",
  "RRR",
  "Cost_Value",
  "Market_Value",
  "Gain_Loss_Value",
  "Gain_Loss_Pct",
  "Price_Position",
  "Total_Score",
  "Quality_Score",
  "Valuation_Score",
  "Setup_Score",
  "Balance_Risk_Score",
  "Liquidity_Score",
  "Composite_Score_v2",
  "Data_Status",
  "Data_Warnings",
  "Conflict_Severity",
  "Conflict_Alerts",
  "Advice",
  "Target_Action",
  "Volume_Ratio",
  "PE",
  "Yield",
  "ROE",
  "DE",
  "RSI",
  "Entry_Zone_Low",
  "Entry_Zone_High",
  "Exit_Zone_Low",
  "Exit_Zone_High",
];

const MARKET_NUMERIC_COLUMNS = [
  "Price",
  "Stop_Loss",
  "Upside_Pct",
  "RRR",
  "Price_Position",
  "Total_Score",
  "Volume_Ratio",
  "PE",
  "Yield",
  "ROE",
  "DE",
  "RSI",
  "Entry_Zone_Low",
  "Entry_Zone_High",
  "Exit_Zone_Low",
  "Exit_Zone_High",
];

export async function analyzePortfolio(portfolioPath, marketRows, options = {}) {
  const { outputFile } = options;
  const portfolioRows = await readPortfolioRows(portfolioPath);
  const marketBySymbol = new Map(marketRows.map((row) => [row.Symbol, row]));
  const analyzedRows = portfolioRows.map((holding) => {
    const market = marketBySymbol.get(holding.Symbol);
    return analyzeHolding(holding, market);
  });

  if (outputFile) {
    await writePortfolioReport(analyzedRows, outputFile);
  }

  return analyzedRows;
}

export async function readPortfolioRows(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    return [];
  }

  const headerMap = new Map();
  worksheet.getRow(1).eachCell((cell, columnNumber) => {
    headerMap.set(String(cell.value || "").trim(), columnNumber);
  });

  const rows = [];
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) {
      return;
    }

    const symbol = cellText(row, headerMap, "Symbol").trim().toUpperCase();
    if (!symbol) {
      return;
    }

    rows.push({
      Symbol: symbol,
      Quantity: numberValue(cellText(row, headerMap, "Quantity")),
      Avg_Price: numberValue(cellText(row, headerMap, "Avg_Price")),
    });
  });

  return rows;
}

export function analyzeHolding(holding, market) {
  if (!market) {
    return {
      ...holding,
      Sector: "No Data",
      Price: 0,
      Trend_Status: "No Data",
      Entry_Zone: "-",
      Exit_Zone: "-",
      Stop_Loss: 0,
      Upside_Pct: 0,
      RRR: 0,
      Cost_Value: holding.Quantity * holding.Avg_Price,
      Market_Value: 0,
      Gain_Loss_Value: -(holding.Quantity * holding.Avg_Price),
      Gain_Loss_Pct: holding.Avg_Price > 0 ? -100 : 0,
      Price_Position: 0,
      Total_Score: null,
      Quality_Score: null,
      Valuation_Score: null,
      Setup_Score: null,
      Balance_Risk_Score: null,
      Liquidity_Score: null,
      Composite_Score_v2: null,
      Data_Status: "DATA_ERROR",
      Data_Warnings: "No market data found for this holding",
      Conflict_Severity: "RED",
      Conflict_Alerts: "MISSING_MARKET_DATA: No market data found for this holding",
      Advice: "No Data",
      Target_Action: "No Data",
      Volume_Ratio: 0,
      PE: 0,
      Yield: 0,
      ROE: 0,
      DE: 0,
      RSI: 0,
      Entry_Zone_Low: 0,
      Entry_Zone_High: 0,
      Exit_Zone_Low: 0,
      Exit_Zone_High: 0,
    };
  }

  const marketRow = normalizeMarketRow(market);
  const marketValue = holding.Quantity * marketRow.Price;
  const costValue = holding.Quantity * holding.Avg_Price;
  const gainLossValue = marketValue - costValue;
  const gainLossPct = holding.Avg_Price > 0
    ? ((marketRow.Price - holding.Avg_Price) / holding.Avg_Price) * 100
    : 0;
  const row = {
    ...marketRow,
    ...holding,
    Cost_Value: costValue,
    Market_Value: marketValue,
    Gain_Loss_Value: gainLossValue,
    Gain_Loss_Pct: gainLossPct,
    Recovery_Pct: getRecoveryPct(gainLossPct),
    Suggested_Shares: getSuggestedShares(marketRow),
  };

  row.Advice = getAdvice(row);
  row.Target_Action = getTargetAction(row);
  row.Entry_Zone = formatZone(row.Entry_Zone_Low, row.Entry_Zone_High);
  row.Exit_Zone = formatZone(row.Exit_Zone_Low, row.Exit_Zone_High);

  return row;
}

export async function writePortfolioReport(rows, outputFile) {
  const workbook = new ExcelJS.Workbook();
  const analysisSheet = workbook.addWorksheet("Portfolio Analysis");
  analysisSheet.columns = REPORT_COLUMNS.map((column) => ({
    header: column,
    key: column,
    width: 15,
  }));

  for (const row of rows) {
    const reportRow = {};
    for (const column of REPORT_COLUMNS) {
      reportRow[column] = sanitizeExcelValue(row[column]);
    }
    analysisSheet.addRow(reportRow);
  }

  const guideSheet = workbook.addWorksheet("How to Read");
  guideSheet.columns = [
    { header: "หัวข้อ (Field)", key: "field", width: 22 },
    { header: "ความหมาย", key: "meaning", width: 55 },
    { header: "เกณฑ์การดู", key: "criteria", width: 45 },
  ];
  guideSheet.addRows([
    {
      field: "Total_Score",
      meaning: "คะแนนเปรียบเทียบในกลุ่มอุตสาหกรรม",
      criteria: "> 70 = แกร่งกว่าค่าเฉลี่ยกลุ่ม",
    },
    {
      field: "Quality_Score",
      meaning: "คะแนนคุณภาพธุรกิจจาก ROE และคุณภาพเทียบกลุ่ม",
      criteria: "65+ เริ่มดี, 80+ เด่น แต่ยังไม่ใช่คำสั่งซื้อ",
    },
    {
      field: "Valuation_Score",
      meaning: "คะแนนความถูกแพงจาก P/E, yield และราคาเทียบกลุ่ม",
      criteria: "สูงขึ้นแปลว่าราคาดูน่าสนใจขึ้น แต่ต้องดู quality ด้วย",
    },
    {
      field: "Setup_Score",
      meaning: "คะแนนจังหวะราคาจาก RSI และตำแหน่งในกรอบ 52 สัปดาห์",
      criteria: "ใช้ดูจังหวะเท่านั้น ไม่ใช่เหตุผลหลักในการซื้อ",
    },
    {
      field: "Composite_Score_v2",
      meaning: "คะแนนรวมแบบ Think2 จาก Quality, Valuation, Setup, Risk และ Liquidity",
      criteria: "เป็นข้อมูลประกอบใน Phase 2 ยังไม่แทน Total_Score หรือ Target_Action",
    },
    {
      field: "Upside_Pct",
      meaning: "โอกาสกำไร (%) จากราคาปัจจุบันถึงเป้าหมาย",
      criteria: "> 10% = น่าสนใจสะสม",
    },
    {
      field: "RRR",
      meaning: "Risk-Reward Ratio (ความคุ้มค่า)",
      criteria: "> 2.0 = คุ้มค่าที่จะเสี่ยง",
    },
    {
      field: "Data_Status",
      meaning: "สถานะความพร้อมของข้อมูลก่อนใช้ประกอบการตัดสินใจ",
      criteria: "VALID = ใช้ได้, REVIEW_REQUIRED = ควรตรวจซ้ำ, DATA_ERROR = ข้อมูลสำคัญผิด/ขาด",
    },
    {
      field: "Data_Warnings",
      meaning: "คำเตือนว่าข้อมูลส่วนไหนอาจทำให้ผลวิเคราะห์คลาดเคลื่อน",
      criteria: "ควรอ่านก่อนทำตาม Target_Action โดยเฉพาะมือใหม่",
    },
    {
      field: "Conflict_Severity",
      meaning: "ระดับความเสี่ยงที่ระบบตรวจพบก่อนทำตามคำแนะนำ",
      criteria: "GREEN = ปกติ, YELLOW = ระวัง, ORANGE = ต้องทบทวน, RED = ไม่ควรตัดสินใจจนกว่าจะตรวจซ้ำ",
    },
    {
      field: "Conflict_Alerts",
      meaning: "เหตุผลของคำเตือน เช่น ข้อมูลผิดปกติ คะแนนสูงแต่ RRR ต่ำ หรือ oversold ในขาลง",
      criteria: "ถ้ามี ORANGE/RED ควรตรวจหุ้นตัวนั้นก่อนซื้อเพิ่ม",
    },
    {
      field: "Target_Action",
      meaning: "แผนปฏิบัติการระบุราคาและสัดส่วนชัดเจน",
      criteria: "TP = ขายทำกำไร, Reduce = ลดพอร์ต",
    },
    {
      field: "Stop_Loss",
      meaning: "จุดตัดขาดทุนเมื่อหลุดแนวรับ",
      criteria: "ห้ามถือหุ้นหากราคาหลุดจุดนี้",
    },
  ]);

  await workbook.xlsx.writeFile(outputFile);
}

function getAdvice(row) {
  if (row.Total_Score === null || row.Total_Score === undefined) {
    return "No Data";
  }

  const score = row.Total_Score;
  const gainLossPct = row.Gain_Loss_Pct;
  const pricePosition = row.Price_Position;

  if (score >= 70) {
    if (gainLossPct < 0) {
      return "Buy More";
    }

    if (pricePosition < 40) {
      return "Accumulate";
    }

    return "Hold";
  }

  if (score >= 45) {
    return "Wait/Hold";
  }

  return gainLossPct > 0 ? "Sell" : "Reduce/Cut";
}

function getTargetAction(row) {
  const advice = row.Advice;
  const price = row.Price;
  const entryHigh = row.Entry_Zone_High;
  const exitLow = row.Exit_Zone_Low;
  const stopLoss = row.Stop_Loss;
  const score = row.Total_Score;
  const rrr = row.RRR;

  if (price <= stopLoss || score < 30) {
    return "Exit All (100%)";
  }

  if (advice === "Sell" || advice === "Reduce/Cut" || (score >= 30 && score < 45)) {
    return "Reduce 50%";
  }

  if (advice === "Hold" && price >= exitLow) {
    return `TP 50% @ ${exitLow.toFixed(2)}`;
  }

  if (advice === "Buy More" || advice === "Accumulate") {
    if (price > entryHigh) {
      return `Wait & Bid @ ${entryHigh.toFixed(2)}`;
    }

    if (rrr >= 2.0) {
      return "Buy Now (Good RRR)";
    }

    return "Buy Now (Low RRR)";
  }

  return "Keep Holding";
}

function getRecoveryPct(gainLossPct) {
  if (gainLossPct >= 0) {
    return 0.0;
  }

  const loss = Math.abs(gainLossPct) / 100;
  return ((1 / (1 - loss)) - 1) * 100;
}

function getSuggestedShares(row) {
  const riskAmount = 5000;
  const riskPerShare = row.Entry_Zone_High - row.Stop_Loss;
  if (riskPerShare <= 0) {
    return 0;
  }

  return Math.floor(riskAmount / riskPerShare);
}

function formatZone(low, high) {
  if (!Number.isFinite(low) || !Number.isFinite(high)) {
    return "-";
  }

  return `${low.toFixed(2)} - ${high.toFixed(2)}`;
}

function cellText(row, headerMap, columnName) {
  const column = headerMap.get(columnName);
  if (!column) {
    return "";
  }

  return normalizeExcelValue(row.getCell(column).value);
}

function normalizeMarketRow(row) {
  const normalized = {
    ...row,
    Symbol: String(row.Symbol || "").trim().toUpperCase(),
    Sector: row.Sector || "Unknown",
  };

  for (const column of MARKET_NUMERIC_COLUMNS) {
    normalized[column] = numberValue(normalized[column]);
  }

  return normalized;
}

function sanitizeExcelValue(value) {
  if (typeof value === "number" && !Number.isFinite(value)) {
    return null;
  }

  return value ?? null;
}

function numberValue(value) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}
