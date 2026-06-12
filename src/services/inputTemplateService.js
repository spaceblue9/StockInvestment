import ExcelJS from "exceljs";

export const PORTFOLIO_TEMPLATE_COLUMNS = ["Symbol", "Quantity", "Avg_Price"];

export async function buildBlankPortfolioTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "StockFlix Investor Studio";
  workbook.created = new Date();

  const portfolioSheet = workbook.addWorksheet("Portfolio");
  portfolioSheet.columns = PORTFOLIO_TEMPLATE_COLUMNS.map((column) => ({
    header: column,
    key: column,
    width: column === "Symbol" ? 18 : 16,
  }));
  portfolioSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  portfolioSheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE50914" },
  };
  portfolioSheet.views = [{ state: "frozen", ySplit: 1 }];

  const guideSheet = workbook.addWorksheet("How to fill");
  guideSheet.columns = [
    { header: "Field", key: "field", width: 18 },
    { header: "What to enter", key: "description", width: 58 },
    { header: "Example format", key: "format", width: 28 },
  ];
  guideSheet.addRows([
    {
      field: "Symbol",
      description: "Thai stock ticker without .BK. Use one holding per row.",
      format: "PTT",
    },
    {
      field: "Quantity",
      description: "Number of shares you currently hold. Use numbers only.",
      format: "1000",
    },
    {
      field: "Avg_Price",
      description: "Your average buy price per share in THB. Use numbers only.",
      format: "35.50",
    },
  ]);
  guideSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
}

export function buildBlankWatchlistTemplateText() {
  return [
    "# StockFlix Watchlist Template",
    "#",
    "# วิธีกรอก:",
    "# - พิมพ์ ticker หุ้นไทย 1 ตัวต่อ 1 บรรทัด",
    "# - ไม่ต้องใส่ .BK เช่น ใช้ PTT ไม่ใช่ PTT.BK",
    "# - บรรทัดที่ขึ้นต้นด้วย # เป็นคำอธิบาย ระบบจะไม่นำไปวิเคราะห์",
    "#",
    "# ตัวอย่างรูปแบบเท่านั้น ไม่ใช่คำแนะนำลงทุน:",
    "# PTT",
    "# CPALL",
    "# AOT",
    "#",
    "# เริ่มกรอก ticker ของคุณด้านล่างนี้:",
    "",
  ].join("\n");
}
