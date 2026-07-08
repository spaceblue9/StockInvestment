const healthStatus = document.querySelector("#healthStatus");
const appShell = document.querySelector(".app-shell");
const authPanel = document.querySelector("#authPanel");
const accountPanel = document.querySelector("#accountPanel");
const accountName = document.querySelector("#accountName");
const subscriptionBadge = document.querySelector("#subscriptionBadge");
const subscriptionDetails = document.querySelector("#subscriptionDetails");
const authForm = document.querySelector("#authForm");
const authSubmit = document.querySelector("#authSubmit");
const authModeButton = document.querySelector("#authModeButton");
const authMessage = document.querySelector("#authMessage");
const nameField = document.querySelector("#nameField");
const logoutButton = document.querySelector("#logoutButton");
const analysisForm = document.querySelector("#analysisForm");
const analysisSubmitButton = document.querySelector("#analysisSubmitButton");
const analysisStatusPanel = document.querySelector("#analysisStatusPanel");
const analysisStatusTitle = document.querySelector("#analysisStatusTitle");
const analysisStatusText = document.querySelector("#analysisStatusText");
const analysisStepItems = [...document.querySelectorAll("[data-analysis-step]")];
const templateDownloadLinks = [...document.querySelectorAll("[data-template-download]")];
const analysisFileInputs = [...document.querySelectorAll("#analysisForm input[type='file']")];
const runMessage = document.querySelector("#runMessage");
const frontendVersion = document.querySelector("#frontendVersion");
const viewOutput = document.querySelector("#viewOutput");
const customerSnapshot = document.querySelector("#customerSnapshot");
const plansList = document.querySelector("#plansList");
const businessViewButton = document.querySelector("[data-view='business']");
const leftRailToggle = document.querySelector("#leftRailToggle");
const publicLaunchMode = "starter_pro_manual_ready";
const frontendBuildVersion = "20260708-0719";
const leftRailStorageKey = "stockflix.leftRailCollapsed";

const state = {
  user: null,
  authMode: "register",
  recommendations: [],
  portfolioRows: [],
  activeView: "portfolio",
  savedSnapshot: null,
  plans: [],
  deferredPlans: [],
  launchMode: "",
  businessMetrics: null,
  billingEvents: [],
  paymentSessions: [],
  teamUsers: [],
  policy: null,
  auditEvents: [],
  approvalRequests: [],
  organizations: [],
  tenantScope: null,
  operationalReadiness: null,
  launchEvidence: null,
  launchEvidenceExportMessage: "",
  referenceMaster: null,
  portfolioDataHealth: null,
  portfolioHealthFilters: {
    query: "",
    status: "all",
    orderBy: "generatedAt",
    direction: "desc",
  },
  businessSection: "packages",
  analysisRunning: false,
  analysisClickCount: 0,
  lastAnalysisTriggerAt: 0,
  entitlementErrors: {},
};

const recommendedActionFields = [
  { key: "Symbol", label: "Symbol", default: true, required: true },
  { key: "Sector", label: "Sector", default: false },
  { key: "Price", label: "Price", default: true },
  { key: "Market_Value", label: "Market Value", default: false },
  { key: "Cost_Value", label: "Cost Value", default: false },
  { key: "Gain_Loss_Value", label: "Gain/Loss Value", default: false },
  { key: "Gain_Loss_Pct", label: "Gain/Loss %", default: true },
  { key: "Total_Score", label: "Score", default: true },
  { key: "Quality_Score", label: "Quality", default: false },
  { key: "Valuation_Score", label: "Valuation", default: false },
  { key: "Setup_Score", label: "Setup", default: false },
  { key: "Composite_Score_v2", label: "Composite v2", default: false },
  { key: "Conflict_Severity", label: "Conflict", default: true },
  { key: "Data_Status", label: "Data Status", default: false },
  { key: "Conflict_Alerts", label: "Conflict Alerts", default: false },
  { key: "Data_Warnings", label: "Data Warnings", default: false },
  { key: "Action_v2_Shadow", label: "Action v2 Shadow", default: false },
  { key: "Action_v2_Confidence", label: "Action v2 Confidence", default: false },
  { key: "Action_v2_Risk_Block", label: "Action v2 Block", default: false },
  { key: "Action_v2_Change", label: "Action v2 Change", default: false },
  { key: "Action_v2_Rationale", label: "Action v2 Rationale", default: false },
  { key: "Decision_Engine_Mode", label: "Decision Mode", default: false },
  { key: "Effective_Target_Action", label: "Effective Action", default: false },
  { key: "Effective_Action_Source", label: "Action Source", default: false },
  { key: "Advice", label: "Advice", default: true },
  { key: "Target_Action", label: "Target Action", default: true },
  { key: "RRR", label: "RRR", default: true },
  { key: "Technical_RRR", label: "Technical RRR", default: false },
  { key: "Fundamental_RRR_Status", label: "Fundamental RRR", default: false },
  { key: "Fundamental_RRR_Note", label: "Fundamental RRR Note", default: false },
  { key: "Trend_Status", label: "Trend", default: true },
  { key: "PE", label: "P/E", default: false },
  { key: "ROE", label: "ROE", default: false },
  { key: "DE", label: "D/E", default: false },
  { key: "RSI", label: "RSI", default: false },
  { key: "Volume_Ratio", label: "Volume Ratio", default: false },
  { key: "Upside_Pct", label: "Upside %", default: false },
];

const recommendedActionSortFields = [
  { key: "Total_Score", label: "Score" },
  { key: "Market_Value", label: "Market Value" },
  { key: "Gain_Loss_Pct", label: "Gain/Loss %" },
  { key: "RRR", label: "RRR" },
  { key: "Action_v2_Change", label: "Action v2 Change" },
  { key: "Price", label: "Price" },
  { key: "Symbol", label: "Symbol" },
  { key: "Action_Group", label: "Action Group" },
];

const tableColumnTips = {
  Symbol: {
    title: "Symbol",
    meaning: "ชื่อย่อหุ้น ใช้ค้นหาหรือเทียบกับข้อมูลจากตลาดหลักทรัพย์",
    goodValue: "ควรตรวจว่าเป็นหุ้นตัวเดียวกับที่ต้องการจริงก่อนตัดสินใจ",
    caution: "ชื่อย่อคล้ายกันอาจทำให้เลือกผิดตัวได้",
  },
  Sector: {
    title: "Sector",
    meaning: "กลุ่มธุรกิจของหุ้น เช่น พลังงาน ธนาคาร ค้าปลีก",
    goodValue: "ควรกระจายหลาย sector และเริ่มจากกลุ่มที่เข้าใจ",
    caution: "ถือหุ้นหลายตัวแต่เป็น sector เดียวกัน ยังถือว่ากระจุกความเสี่ยง",
  },
  Price: {
    title: "Price",
    meaning: "ราคาหุ้นล่าสุดที่ระบบใช้วิเคราะห์",
    goodValue: "ใช้เทียบกับ Entry Zone, Stop Loss และ Upside ไม่ควรดูราคาอย่างเดียว",
    caution: "ราคาถูกไม่ได้แปลว่าคุ้ม ต้องดูคุณภาพและความเสี่ยงร่วมด้วย",
  },
  Total_Score: {
    title: "Total Score",
    meaning: "คะแนนรวมจากพื้นฐาน ความคุ้มค่า ความเสี่ยง และจังหวะราคา ยิ่งสูงยิ่งผ่านเกณฑ์มากขึ้น",
    goodValue: "60+ เริ่มน่าสนใจ, 70+ คัดเข้มขึ้น, 80+ ถือว่าเด่นมากแต่ยังต้องตรวจข่าวและความเสี่ยง",
    caution: "คะแนนสูงไม่ใช่คำสั่งซื้ออัตโนมัติ ให้ดู RRR, D/E และ trend ประกอบ",
  },
  Quality_Score: {
    title: "Quality Score",
    meaning: "คะแนนคุณภาพธุรกิจจาก ROE และคุณภาพเทียบกลุ่ม แยกออกจากจังหวะราคา",
    goodValue: "65+ เริ่มดี, 80+ เด่นขึ้น เหมาะใช้ดูว่าหุ้นเป็นธุรกิจที่ควรศึกษาไหม",
    caution: "หุ้นคุณภาพดีไม่ได้แปลว่าราคาน่าซื้อทันที ต้องดู Valuation และ RRR ด้วย",
  },
  Valuation_Score: {
    title: "Valuation Score",
    meaning: "คะแนนความถูกแพงจาก P/E, yield และราคาเทียบ sector",
    goodValue: "คะแนนสูงแปลว่าราคาดูน่าสนใจกว่า แต่ต้องไม่ใช่ value trap",
    caution: "P/E ต่ำหรือ yield สูงอาจเกิดจากธุรกิจมีปัญหา ต้องดู Conflict Alerts",
  },
  Setup_Score: {
    title: "Setup Score",
    meaning: "คะแนนจังหวะเข้าโดยดู RSI และตำแหน่งราคาในกรอบ 52 สัปดาห์",
    goodValue: "คะแนนสูงคือจังหวะดูน่าสนใจขึ้น แต่ควรใช้ร่วมกับ Quality",
    caution: "RSI ต่ำหรือราคาใกล้ low ไม่ใช่สัญญาณซื้อเดี่ยวๆ",
  },
  Balance_Risk_Score: {
    title: "Balance Risk Score",
    meaning: "คะแนนความเสี่ยงจากหนี้ โดยใช้ D/E เป็นหลัก",
    goodValue: "คะแนนสูงคือหนี้ดูปลอดภัยกว่า โดยเฉพาะสำหรับมือใหม่",
    caution: "บาง sector เช่น ธนาคารมีโครงสร้างหนี้ต่างจากธุรกิจทั่วไป",
  },
  Liquidity_Score: {
    title: "Liquidity Score",
    meaning: "คะแนนสภาพคล่องและแรงยืนยันจาก volume เทียบค่าเฉลี่ย",
    goodValue: "คะแนนสูงคือ volume ยืนยันมากขึ้นและซื้อขายง่ายขึ้น",
    caution: "Volume spike ไม่ได้แปลว่าดีเสมอ ถ้าราคาลงแรงอาจเป็นแรงขาย",
  },
  Composite_Score_v2: {
    title: "Composite Score v2",
    meaning: "คะแนนรวมแบบ Think2 จาก Quality, Valuation, Setup, Balance Risk และ Liquidity",
    goodValue: "ใช้เป็นภาพรวมเสริมเพื่ออ่านเหตุผลหลายมิติ",
    caution: "Phase 2 ยังไม่ใช้คะแนนนี้แทน Total Score หรือ Target Action",
  },
  Data_Status: {
    title: "Data Status",
    meaning: "สถานะความพร้อมของข้อมูลก่อนใช้ประกอบการตัดสินใจ",
    goodValue: "VALID คือข้อมูลหลักพร้อมใช้, REVIEW_REQUIRED คือควรตรวจซ้ำ, DATA_ERROR คือข้อมูลสำคัญผิดหรือขาด",
    caution: "ถ้าเป็น REVIEW_REQUIRED หรือ DATA_ERROR อย่าตัดสินใจจากคะแนนอย่างเดียว",
  },
  Data_Warnings: {
    title: "Data Warnings",
    meaning: "คำเตือนว่าข้อมูลส่วนไหนอาจทำให้ผลวิเคราะห์คลาดเคลื่อน",
    goodValue: "ควรอ่านเพื่อรู้ว่าระบบกังวลเรื่องข้อมูลอะไร เช่น sector, PE, D/E, RSI หรือ volume",
    caution: "คำเตือนนี้ยังไม่เปลี่ยน action ใน Phase 1 แต่ควรตรวจซ้ำก่อนลงทุนจริง",
  },
  Conflict_Severity: {
    title: "Conflict Severity",
    meaning: "ระดับคำเตือนเมื่อคะแนน, RRR, trend หรือข้อมูลบางส่วนขัดแย้งกัน",
    goodValue: "GREEN = ไม่พบ conflict หลัก, YELLOW = ระวัง, ORANGE = ต้องทบทวน, RED = ไม่ควรตัดสินใจจนกว่าจะตรวจซ้ำ",
    caution: "ถ้ามี ORANGE/RED ให้ดู Conflict Alerts ก่อนทำตาม Target Action",
  },
  Conflict_Alerts: {
    title: "Conflict Alerts",
    meaning: "เหตุผลของคำเตือน เช่น RRR สูงแต่คะแนนต่ำ, RSI ต่ำในขาลง, หรือราคาใกล้ 52W high",
    goodValue: "ใช้เป็น checklist ว่าต้องตรวจอะไรเพิ่มก่อนซื้อ/ถือ/ขาย",
    caution: "เป็น safety layer เสริม ยังไม่ใช่ action engine ใหม่",
  },
  Action_v2_Shadow: {
    title: "Action v2 Shadow",
    meaning: "ผลทดลองจาก Action Matrix แบบ Think2 ที่ดูหลายมิติ เช่น Quality, Valuation, Setup, RRR และ Conflict",
    goodValue: "ใช้ให้ owner/admin เทียบกับ Target Action เดิมก่อนตัดสินใจเปิดใช้จริง",
    caution: "ยังไม่ใช่คำแนะนำจริงของระบบลูกค้า และยังไม่แทน Target Action เดิม",
  },
  Action_v2_Confidence: {
    title: "Action v2 Confidence",
    meaning: "ความมั่นใจของ shadow action จากข้อมูลที่ระบบมีตอนนี้",
    goodValue: "HIGH/MEDIUM/LOW ใช้อ่านระดับความมั่นใจภายในเท่านั้น",
    caution: "ถ้า Fundamental RRR ยังไม่มี ความมั่นใจจะไม่ควรถูกตีความเป็นคำสั่งซื้อ",
  },
  Action_v2_Risk_Block: {
    title: "Action v2 Risk Block",
    meaning: "เหตุผลที่ Action Matrix v2 บล็อกการตัดสินใจ เช่น DATA_ERROR หรือ RED_CONFLICT",
    goodValue: "NONE แปลว่าไม่ถูกบล็อกด้วย safety guard หลัก",
    caution: "ถ้าไม่ใช่ NONE ให้ตรวจข้อมูลหรือ conflict ก่อนอ่าน action อื่น",
  },
  Action_v2_Change: {
    title: "Action v2 Change",
    meaning: "เปรียบเทียบกลุ่ม action เดิมกับ shadow action เช่น BUY_TO_HOLD หรือ SAME_FAMILY",
    goodValue: "SAME_FAMILY แปลว่าแนวคิดใหม่ยังอยู่กลุ่มเดียวกับ action เดิม",
    caution: "ถ้าเปลี่ยนกลุ่มมาก ต้องให้ owner/admin รีวิวก่อนเปิดใช้งานจริง",
  },
  Action_v2_Rationale: {
    title: "Action v2 Rationale",
    meaning: "เหตุผลแบบอ่านง่ายว่าทำไม Action Matrix v2 ให้ผลทดลองแบบนั้น",
    goodValue: "อ่านคู่กับ Conflict Alerts และ Fundamental RRR Status",
    caution: "เป็นเหตุผลของ shadow mode ยังไม่ใช่คำสั่งให้ซื้อหรือขายจริง",
  },
  Decision_Engine_Mode: {
    title: "Decision Engine Mode",
    meaning: "โหมด feature flag ของ decision engine ปัจจุบัน",
    goodValue: "off/shadow = ยังใช้ Target Action เดิม, enabled = เปิด Think2 เป็น effective action",
    caution: "ค่า default ต้องไม่เปลี่ยนคำแนะนำจริงของลูกค้า",
  },
  Effective_Target_Action: {
    title: "Effective Target Action",
    meaning: "Action ที่ระบบจะถือว่าใช้งานจริงตาม feature flag ปัจจุบัน",
    goodValue: "ใน off/shadow mode ค่านี้ควรตรงกับ Target Action เดิม",
    caution: "ถ้าเห็นต่างจาก Target Action แปลว่าเปิด Think2 decision engine จริงแล้ว ต้องแน่ใจว่าผ่าน owner sign-off",
  },
  Effective_Action_Source: {
    title: "Effective Action Source",
    meaning: "แหล่งที่มาของ Effective Action เช่น legacy หรือ think2_shadow",
    goodValue: "legacy คือยังใช้ระบบเดิม ปลอดภัยสำหรับ production ช่วงแรก",
    caution: "think2_shadow แปลว่าเปิดใช้ Think2 จริง ต้องมีแผน rollback",
  },
  Sector_Score: {
    title: "Sector Score",
    meaning: "คะแนนภาพรวมของกลุ่มธุรกิจ คิดจาก score เฉลี่ย, RRR, upside, ROE, D/E และ momentum",
    goodValue: "60+ เริ่มน่าสนใจ, 70+ กลุ่มแข็งแรง ควรดูหุ้นนำในกลุ่มต่อ",
    caution: "เป็นคะแนนระดับกลุ่ม ไม่ได้แปลว่าหุ้นทุกตัวในกลุ่มดี",
  },
  Avg_Score: {
    title: "Avg Score",
    meaning: "คะแนนเฉลี่ยของหุ้นในกลุ่มนั้น",
    goodValue: "60+ แปลว่าหุ้นในกลุ่มโดยรวมเริ่มแข็งแรง",
    caution: "ค่าเฉลี่ยอาจถูกดันโดยหุ้นดีไม่กี่ตัว ควรดูจำนวน Top Ideas ด้วย",
  },
  RRR: {
    title: "RRR",
    meaning: "Reward/Risk Ratio คือกำไรที่คาดหวังเทียบกับความเสี่ยงขาดทุน",
    goodValue: "1.5+ เริ่มน่าสนใจ, 2.0+ เผื่อความเสี่ยงได้ดีขึ้น",
    caution: "ต่ำกว่า 1.0 มักไม่คุ้มเสี่ยง เพราะ upside น้อยกว่า downside",
  },
  Technical_RRR: {
    title: "Technical RRR",
    meaning: "Reward/Risk ที่คำนวณจากกรอบเทคนิคเดิม เช่น 52W high/low, stop loss และ exit zone",
    goodValue: "1.5+ เริ่มน่าสนใจ, 2.0+ เผื่อความเสี่ยงได้ดีขึ้น",
    caution: "เป็น RRR จากกราฟ/ราคา ไม่ใช่มูลค่าพื้นฐานของกิจการ",
  },
  Fundamental_RRR: {
    title: "Fundamental RRR",
    meaning: "Reward/Risk จากมูลค่าพื้นฐาน เช่น fair value, EPS ปกติ หรือ analyst target",
    goodValue: "จะเริ่มใช้เมื่อมีข้อมูลพื้นฐานเพียงพอและตรวจสอบแหล่งข้อมูลได้",
    caution: "ตอนนี้ยังไม่คำนวณจริง เพราะไม่ต้องการสร้าง target ปลอมจากข้อมูลไม่พอ",
  },
  Fundamental_RRR_Status: {
    title: "Fundamental RRR Status",
    meaning: "บอกว่าระบบมีข้อมูลพอคำนวณ Fundamental RRR หรือไม่",
    goodValue: "INSUFFICIENT_DATA แปลว่ายังขาด fair value/EPS/analyst target ไม่ใช่แปลว่าหุ้นไม่ดี",
    caution: "อย่าใช้สถานะนี้เป็นสัญญาณขายหรือซื้อ เป็นเพียงการบอกว่าข้อมูลยังไม่พอ",
  },
  Fundamental_RRR_Note: {
    title: "Fundamental RRR Note",
    meaning: "คำอธิบายว่าทำไมระบบยังไม่คำนวณ RRR จากมูลค่าพื้นฐาน",
    goodValue: "ช่วยป้องกันการตีความผิดว่า 52W high คือ fair value",
    caution: "ต้องมี data source เพิ่มก่อนถึงจะใช้ Fundamental RRR จริงได้",
  },
  Avg_RRR: {
    title: "Avg RRR",
    meaning: "ค่า RRR เฉลี่ยของหุ้นใน sector นั้น",
    goodValue: "1.5+ แปลว่ากลุ่มนั้นมี reward/risk เริ่มน่าสนใจ",
    caution: "ควรดูหุ้นรายตัวอีกครั้ง เพราะค่าเฉลี่ยอาจซ่อนหุ้นเสี่ยงสูง",
  },
  Upside_Pct: {
    title: "Upside %",
    meaning: "เปอร์เซ็นต์โอกาสขึ้นจากราคาปัจจุบันไปยังโซนเป้าหมายตามสูตรของระบบ",
    goodValue: "10%+ เริ่มมีพื้นที่กำไร, 20%+ น่าสนใจขึ้นถ้าความเสี่ยงไม่สูง",
    caution: "Upside สูงอาจมาพร้อมความผันผวนสูง ให้ดู RRR และ Stop Loss ด้วย",
  },
  Avg_Upside_Pct: {
    title: "Avg Upside %",
    meaning: "Upside เฉลี่ยของหุ้นใน sector นั้น",
    goodValue: "10%+ แปลว่ากลุ่มยังมีพื้นที่ให้ศึกษา",
    caution: "อย่าใช้ค่าเฉลี่ยแทนการดูหุ้นรายตัว",
  },
  PE: {
    title: "P/E",
    meaning: "ราคาเทียบกำไร ยิ่งต่ำมักดูถูกกว่า แต่ต้องเทียบกับ sector เดียวกัน",
    goodValue: "โดยทั่วไปต่ำกว่า 15-20 อาจเริ่มน่าสนใจ ถ้ากำไรไม่ถดถอย",
    caution: "P/E ต่ำมากอาจเป็นหุ้นมีปัญหา ไม่ใช่ถูกเสมอไป",
  },
  Median_PE: {
    title: "Median P/E",
    meaning: "ค่า P/E กึ่งกลางของหุ้นใน sector ใช้ดู valuation ของกลุ่ม",
    goodValue: "ต่ำกว่ากลุ่มอื่นอาจถูกกว่า แต่ต้องดูคุณภาพและ trend ร่วมด้วย",
    caution: "sector ต่างกันมี P/E ปกติไม่เท่ากัน อย่าเทียบข้ามกลุ่มแบบตรงๆ",
  },
  ROE: {
    title: "ROE",
    meaning: "ผลตอบแทนต่อส่วนผู้ถือหุ้น บอกว่าบริษัทใช้ทุนสร้างกำไรได้ดีแค่ไหน",
    goodValue: "10%+ เริ่มดี, 15%+ แข็งแรงขึ้น ถ้าหนี้ไม่สูงเกินไป",
    caution: "ROE สูงเพราะหนี้สูงอาจเสี่ยง ต้องดู D/E คู่กัน",
  },
  Median_ROE: {
    title: "Median ROE",
    meaning: "ค่า ROE กึ่งกลางของ sector ใช้ดูคุณภาพกำไรของกลุ่ม",
    goodValue: "10%+ ถือว่ากลุ่มเริ่มมีคุณภาพกำไรดี",
    caution: "ต้องดู D/E และความสม่ำเสมอของกำไรประกอบ",
  },
  Yield: {
    title: "Dividend Yield",
    meaning: "เงินปันผลเทียบราคาหุ้น เป็นเปอร์เซ็นต์ผลตอบแทนจากปันผล",
    goodValue: "3%+ เริ่มน่าสนใจสำหรับสายปันผล ถ้าธุรกิจยังมั่นคง",
    caution: "Yield สูงผิดปกติอาจเกิดจากราคาหุ้นตกแรง หรือปันผลไม่ยั่งยืน",
  },
  Median_Yield: {
    title: "Median Yield",
    meaning: "ค่า Yield กึ่งกลางของ sector",
    goodValue: "ช่วยดูว่า sector นี้เหมาะกับสายปันผลหรือไม่",
    caution: "อย่าดู Yield อย่างเดียว ต้องดูความยั่งยืนของกำไร",
  },
  DE: {
    title: "D/E",
    meaning: "หนี้สินเทียบทุน ยิ่งต่ำมักเสี่ยงเรื่องหนี้น้อยกว่า",
    goodValue: "<= 1.0 เหมาะกับมือใหม่, <= 0.7 ระวังหนี้มากขึ้น",
    caution: "ธนาคารและไฟแนนซ์มัก D/E สูงตามธรรมชาติ ต้องเทียบกับ sector เดียวกัน",
  },
  RSI: {
    title: "RSI",
    meaning: "ตัวชี้วัดจังหวะราคา ใช้ดูว่าหุ้นอาจร้อนแรงหรืออ่อนตัวเกินไป",
    goodValue: "ประมาณ 40-60 มักเป็นโซนกลาง, ต่ำกว่า 35 อาจเริ่ม oversold, สูงกว่า 70 อาจเริ่มร้อนแรง",
    caution: "RSI ไม่ใช่สัญญาณซื้อขายเดี่ยวๆ ต้องดู trend และพื้นฐานด้วย",
  },
  Price_Position: {
    title: "Price Position",
    meaning: "ตำแหน่งราคาปัจจุบันในกรอบ 52 สัปดาห์ 0 คือใกล้ต่ำสุด 100 คือใกล้สูงสุด",
    goodValue: "ค่าต่ำถึงกลางอาจมี margin of safety มากกว่า ถ้าพื้นฐานยังดี",
    caution: "ราคาต่ำอาจต่ำเพราะธุรกิจแย่ ต้องดู score และ trend ด้วย",
  },
  Trend_Status: {
    title: "Trend",
    meaning: "ทิศทางราคาจากข้อมูลเทคนิค เช่น Bullish, Bearish หรือ Sideways",
    goodValue: "Bullish/Uptrend อ่านง่ายกว่า สำหรับมือใหม่ควรระวัง Bearish",
    caution: "Trend เปลี่ยนเร็ว และไม่รับประกันผลตอบแทน",
  },
  Rationale: {
    title: "Rationale",
    meaning: "เหตุผลสั้นๆ ว่าทำไมหุ้นนี้ได้คะแนนหรือคำแนะนำแบบนั้น",
    goodValue: "ควรเห็นเหตุผลหลายด้าน เช่น ถูกกว่ากลุ่ม, ROE ดี, หนี้ต่ำ, อยู่ใน entry zone",
    caution: "เป็นคำอธิบายจากสูตร ไม่ใช่คำแนะนำส่วนบุคคล",
  },
  Portfolio_Exposure_Pct: {
    title: "Portfolio Exposure %",
    meaning: "สัดส่วนเงินในพอร์ตที่อยู่ใน sector นั้น",
    goodValue: "โดยทั่วไปไม่ควรกระจุก sector เดียวสูงเกินไป มือใหม่อาจเริ่มระวังเมื่อเกิน 30-35%",
    caution: "ถ้ากระจุก sector เดียว พอร์ตจะเสี่ยงกับข่าวหรือวัฏจักรของกลุ่มนั้นมากขึ้น",
  },
  Portfolio_Risk: {
    title: "Portfolio Risk",
    meaning: "สรุปความเสี่ยงจากการถือ sector นั้นในพอร์ตของคุณ",
    goodValue: "Balanced คือสัดส่วนดูสมดุล, Possible underweight คือกลุ่มแข็งแรงแต่ถืออยู่น้อย",
    caution: "Overexposed หรือ Concentration risk ควรเปิดดูหุ้นรายตัวและสัดส่วนพอร์ต",
  },
  Rotation_Signal: {
    title: "Rotation Signal",
    meaning: "คำอ่านง่ายๆ ว่า sector นี้น่าศึกษาต่อ หรือควรระวัง",
    goodValue: "Strong Sector หรือ Accumulation Watch คือควรศึกษาเพิ่ม",
    caution: "เป็นสัญญาณระดับ sector ไม่ใช่คำสั่งซื้อหุ้นทุกตัวในกลุ่ม",
  },
  Top_Ideas: {
    title: "Top Ideas",
    meaning: "จำนวนหุ้นใน sector ที่คะแนนถึงเกณฑ์เด่นของระบบ",
    goodValue: "จำนวนมากขึ้นแปลว่ากลุ่มนั้นมีตัวเลือกน่าสนใจมากขึ้น",
    caution: "ควรดูคุณภาพรายตัว ไม่ใช่ซื้อทุกตัวในกลุ่ม",
  },
  Leader: {
    title: "Leader",
    meaning: "หุ้นที่คะแนนสูงสุดใน sector นั้น",
    goodValue: "ใช้เป็นตัวเริ่มศึกษาก่อน ไม่ใช่แปลว่าต้องซื้อทันที",
    caution: "ควรตรวจราคา, RRR, D/E และข่าวล่าสุดก่อนตัดสินใจ",
  },
};

const screenerFilterTips = {
  symbol: {
    title: "Search stock",
    meaning: "ค้นหาหุ้นจาก Symbol หรือชื่อที่มีอยู่ในข้อมูลล่าสุด เพื่อไม่ต้องเลื่อนตารางยาวๆ",
    goodValue: "พิมพ์บางส่วนได้ เช่น PTT, AOT, CPALL หรือชื่อบริษัทถ้าข้อมูลมีชื่อบริษัท",
    caution: "Search จะค้นจากผล analysis ล่าสุดเท่านั้น ถ้าหุ้นไม่อยู่ใน watchlist/latest analysis จะไม่เจอ",
  },
  minScore: {
    title: "Min Score",
    meaning: "คะแนนรวมจากหลายปัจจัย เช่น คุณภาพพื้นฐาน ความคุ้มค่า และจังหวะราคา ยิ่งสูงยิ่งผ่านเกณฑ์มากขึ้น",
    goodValue: "มือใหม่เริ่มที่ Score 60+ เพื่อเห็นตัวเลือกมากพอ ถ้าต้องการคัดเข้มให้ใช้ Score 70+",
    caution: "คะแนนสูงไม่ได้แปลว่าซื้อได้ทันที ควรดู RRR, หนี้ และข่าวล่าสุดประกอบ",
  },
  minRrr: {
    title: "Min RRR",
    meaning: "Reward/Risk Ratio คือสัดส่วนกำไรที่คาดหวังเทียบกับความเสี่ยงขาดทุน",
    goodValue: "RRR 1.5+ ถือว่าเริ่มน่าสนใจ และ RRR 2.0+ ถือว่าเผื่อความเสี่ยงได้ดีขึ้น",
    caution: "ถ้าค่านี้ต่ำ แปลว่ากำไรที่หวังอาจไม่คุ้มกับความเสี่ยงที่ต้องรับ",
  },
  maxDe: {
    title: "Max D/E",
    meaning: "Debt to Equity คือหนี้สินเทียบกับทุนของบริษัท ยิ่งต่ำมักยิ่งรับความเสี่ยงหนี้ได้น้อยลง",
    goodValue: "D/E <= 1.0 เหมาะเป็นค่าเริ่มต้น และ D/E <= 0.7 เหมาะกับคนที่อยากระวังหนี้มากขึ้น",
    caution: "ธนาคารและไฟแนนซ์มักมี D/E สูงตามลักษณะธุรกิจ จึงควรเทียบกับหุ้นใน sector เดียวกัน",
  },
  sector: {
    title: "Sector",
    meaning: "กลุ่มธุรกิจของหุ้น เช่น ธนาคาร พลังงาน ค้าปลีก หรือเทคโนโลยี",
    goodValue: "มือใหม่ควรเริ่มจาก sector ที่เข้าใจ และไม่ควรกระจุกเงินไว้ใน sector เดียวทั้งหมด",
    caution: "ถ้าเลือก sector แคบเกินไป อาจพลาดหุ้นดีในกลุ่มอื่น",
  },
  trend: {
    title: "Trend",
    meaning: "ภาพรวมทิศทางราคาหุ้นจากข้อมูลเทคนิค เช่น กำลังขึ้น ลง หรือแกว่งตัว",
    goodValue: "ถ้าไม่ถนัดจับจังหวะ ให้เริ่มดูหุ้นที่เป็น Uptrend/Bullish หรือหลีกเลี่ยง Bearish ก่อน",
    caution: "Trend เป็นข้อมูลจังหวะราคา ไม่ใช่การรับประกันว่าราคาจะขึ้นต่อ",
  },
};

authForm.addEventListener("submit", submitAuth);
authModeButton.addEventListener("click", toggleAuthMode);
logoutButton.addEventListener("click", logout);
analysisForm.addEventListener("submit", runAnalysis);
analysisSubmitButton.addEventListener("click", handleAnalysisButtonClick);
analysisFileInputs.forEach((input) => input.addEventListener("change", updateFrontendDiagnostics));
leftRailToggle?.addEventListener("click", toggleLeftRail);
document.addEventListener("click", handleDelegatedAnalysisClick, true);
document.addEventListener("pointerup", handleDelegatedAnalysisClick, true);
document.querySelectorAll("[data-view]").forEach((button) => {
  button.addEventListener("click", () => {
    state.activeView = button.dataset.view;
    renderActiveView();
  });
});
document.addEventListener("click", (event) => {
  const upgradeButton = event.target.closest("[data-upgrade-plan]");
  if (upgradeButton) {
    checkoutPlan(upgradeButton.dataset.upgradePlan);
  }

  const launchEvidenceCopyButton = event.target.closest("[data-launch-evidence-copy]");
  if (launchEvidenceCopyButton) {
    copyLaunchEvidencePack(launchEvidenceCopyButton);
  }

  const launchEvidenceDownloadButton = event.target.closest("[data-launch-evidence-download]");
  if (launchEvidenceDownloadButton) {
    event.preventDefault();
    downloadLaunchEvidencePack(launchEvidenceDownloadButton);
  }
});

await initialize();

async function initialize() {
  applyLeftRailState(readLeftRailCollapsed());
  updateFrontendDiagnostics();
  await Promise.all([checkHealth(), loadPlans(), loadCurrentUser()]);
  renderAuthState();
  renderPlans();
  if (state.user) {
    await Promise.all([loadSavedPortfolio(), loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadAuditEvents(), loadTenantScope()]);
    renderAuthState();
  }
  renderActiveView();
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health");
    const data = await response.json();
    healthStatus.textContent = data.ok ? "Ready" : "Unavailable";
    healthStatus.classList.toggle("ready", Boolean(data.ok));
  } catch {
    healthStatus.textContent = "Unavailable";
  }
}

async function loadPlans() {
  const response = await fetch("/api/subscription/plans");
  const data = await response.json();
  state.plans = data.plans || [];
  state.deferredPlans = data.deferredPlans || [];
  state.launchMode = data.launchMode || publicLaunchMode;
}

async function loadCurrentUser() {
  const response = await fetch("/api/auth/me");
  const data = await response.json();
  state.user = data.user || null;
}

async function loadSavedPortfolio() {
  const response = await fetch("/api/customer/portfolio");
  const data = await response.json();
  if (data.ok && data.snapshot) {
    state.savedSnapshot = data.snapshot;
    state.portfolioRows = data.snapshot.portfolioRows || [];
    state.recommendations = data.snapshot.recommendations || [];
  }
  renderSnapshot();
}

async function loadBusinessMetrics() {
  if (!canViewBusinessMetrics()) {
    state.businessMetrics = null;
    state.operationalReadiness = null;
    state.launchEvidence = null;
  state.launchEvidenceExportMessage = "";
  state.referenceMaster = null;
  state.portfolioDataHealth = null;
  state.portfolioHealthFilters = defaultPortfolioHealthFilters();
  return;
  }

  const response = await fetch("/api/admin/metrics");
  const data = await response.json();
  if (data.ok) {
    state.businessMetrics = data.metrics;
    state.portfolioDataHealth = data.metrics?.portfolioDataHealth || null;
    await Promise.all([loadOperationalReadiness(), loadLaunchEvidence(), loadReferenceMasterReview(), loadPortfolioDataHealth()]);
    return;
  }

  state.businessMetrics = null;
  state.operationalReadiness = null;
  state.launchEvidence = null;
  state.launchEvidenceExportMessage = "";
  state.referenceMaster = null;
  state.portfolioDataHealth = null;
}

async function loadPortfolioDataHealth() {
  if (!canViewBusinessMetrics()) {
    state.portfolioDataHealth = null;
    return;
  }

  const response = await fetch("/api/admin/portfolio-health");
  const data = await response.json();
  if (data.ok) {
    state.portfolioDataHealth = data.portfolioHealth;
    if (state.businessMetrics) {
      state.businessMetrics.portfolioDataHealth = data.portfolioHealth;
    }
    return;
  }

  state.portfolioDataHealth = null;
}

async function loadOperationalReadiness() {
  if (!canViewBusinessMetrics()) {
    state.operationalReadiness = null;
    return;
  }

  const response = await fetch("/api/ops/readiness");
  const data = await response.json();
  if (data.ok) {
    state.operationalReadiness = data.readiness;
    return;
  }

  state.operationalReadiness = null;
}

async function loadLaunchEvidence() {
  if (!canViewBusinessMetrics()) {
    state.launchEvidence = null;
    return;
  }

  const response = await fetch("/api/admin/launch-evidence");
  const data = await response.json();
  if (data.ok) {
    state.launchEvidence = data.evidence;
    return;
  }

  state.launchEvidence = null;
}

async function loadReferenceMasterReview() {
  if (!canViewBusinessMetrics()) {
    state.referenceMaster = null;
    return;
  }

  const response = await fetch("/api/admin/reference-master?limit=12");
  const data = await response.json();
  if (data.ok) {
    state.referenceMaster = data.referenceMaster;
    return;
  }

  state.referenceMaster = null;
}

async function loadBillingHistory() {
  const response = await fetch("/api/customer/billing");
  const data = await response.json();
  if (data.ok) {
    state.billingEvents = data.events || [];
  }
}

async function loadPaymentSessions() {
  if (!state.user) {
    state.paymentSessions = [];
    return;
  }

  const response = await fetch("/api/customer/payments?limit=20");
  const data = await response.json();
  if (data.ok) {
    state.paymentSessions = data.sessions || [];
  }
}

async function loadAuditEvents() {
  if (!state.user) {
    state.auditEvents = [];
    return;
  }

  const response = await fetch("/api/audit/events?limit=40");
  const data = await response.json();
  if (data.ok) {
    state.auditEvents = data.events || [];
  }
}

async function loadApprovalRequests() {
  if (!state.user) {
    state.approvalRequests = [];
    return;
  }

  const response = await fetch("/api/approvals?limit=60");
  const data = await response.json();
  if (data.ok) {
    state.approvalRequests = data.requests || [];
  }
}

async function loadTeamUsers() {
  if (!canViewWorkspace()) {
    state.teamUsers = [];
    return;
  }

  const response = await fetch("/api/admin/users");
  const data = await response.json();
  if (data.ok) {
    state.teamUsers = data.users || [];
    state.policy = data.policy || state.policy;
  }
}

async function loadOrganizations() {
  if (!state.user) {
    state.organizations = [];
    return;
  }

  const response = await fetch("/api/admin/organizations");
  const data = await response.json();
  if (data.ok) {
    state.organizations = data.organizations || [];
    state.policy = data.policy || state.policy;
  }
}

async function loadTenantScope() {
  if (!state.user) {
    state.tenantScope = null;
    return;
  }

  const response = await fetch("/api/tenant/scope");
  const data = await response.json();
  if (data.ok) {
    state.tenantScope = data.scope || null;
  }
}

async function submitAuth(event) {
  event.preventDefault();
  authMessage.textContent = state.authMode === "register" ? "Creating account..." : "Signing in...";
  const formData = new FormData(authForm);
  const endpoint = state.authMode === "register" ? "/api/auth/register" : "/api/auth/login";
  const payload = Object.fromEntries(formData.entries());

  if (state.authMode === "login") {
    delete payload.name;
  }

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    authMessage.textContent = data.message || "Authentication failed.";
    return;
  }

  state.user = data.user;
  authForm.reset();
  authMessage.textContent = "";
  renderAuthState();
  renderPlans();
  await Promise.all([loadSavedPortfolio(), loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadTeamUsers(), loadOrganizations(), loadAuditEvents(), loadTenantScope()]);
  renderAuthState();
  renderActiveView();
}

async function logout() {
  await fetch("/api/auth/logout", { method: "POST" });
  state.user = null;
  state.savedSnapshot = null;
  state.businessMetrics = null;
  state.referenceMaster = null;
  state.portfolioDataHealth = null;
  state.portfolioHealthFilters = defaultPortfolioHealthFilters();
  state.billingEvents = [];
  state.paymentSessions = [];
  state.teamUsers = [];
  state.policy = null;
  state.auditEvents = [];
  state.approvalRequests = [];
  state.organizations = [];
  state.tenantScope = null;
  state.entitlementErrors = {};
  state.portfolioRows = [];
  state.recommendations = [];
  renderAuthState();
  renderPlans();
  renderSnapshot();
  renderActiveView();
}

function toggleAuthMode() {
  state.authMode = state.authMode === "register" ? "login" : "register";
  renderAuthState();
}

function renderAuthState() {
  const signedIn = Boolean(state.user);
  authPanel.hidden = signedIn;
  accountPanel.hidden = !signedIn;
  logoutButton.hidden = !signedIn;
  businessViewButton.hidden = !canSeeWorkspaceNav();
  nameField.hidden = state.authMode === "login";
  authSubmit.textContent = state.authMode === "register" ? "Create account" : "Sign in";
  authModeButton.textContent = state.authMode === "register"
    ? "I already have an account"
    : "Create a new account";
  syncAnalysisAccess();

  if (!signedIn) {
    return;
  }

  const subscription = state.user.subscription || {};
  const entitlements = state.user.entitlements || {};
  const latestBillingEvent = state.billingEvents[0];
  const latestPaymentSession = state.paymentSessions[0];
  const tenantScope = state.tenantScope;
  const isPendingManualPackage = subscription.status === "inactive" && subscription.provider === "manual_admin_pending";
  accountName.textContent = state.user.name || "Investor";
  subscriptionBadge.textContent = isPendingManualPackage
    ? "Waiting for admin package"
    : `${subscription.plan || "Pro"} ${subscription.status || "active"}`;
  subscriptionDetails.innerHTML = `
    <span>Role: ${escapeHtml(state.user.role || "customer")}</span>
    ${isPendingManualPackage ? `<span>Package: รอ admin กำหนด Starter หรือ Pro</span>` : ""}
    ${tenantScope ? `<span>Scope: ${formatNumber(tenantScope.visibleOrganizationCount || 0)} workspace(s), ${formatNumber(tenantScope.visibleUserCount || 0)} user(s)</span>` : ""}
    <span>${money(subscription.priceThb || 0)} / month</span>
    <span>Plan access: ${formatNumber((entitlements.effectiveFeatures || []).length)} feature(s)</span>
    ${(entitlements.lockedFeatures || []).length ? `<span>Upgrade unlocks: ${formatNumber(entitlements.lockedFeatures.length)} feature(s)</span>` : ""}
    <span>Renewal: ${formatDate(subscription.renewsAt)}</span>
    <span>Billing: ${escapeHtml(subscription.provider || "trial")}</span>
    ${latestPaymentSession ? `<span>Payment: ${escapeHtml(latestPaymentSession.status)} · ${escapeHtml(latestPaymentSession.provider)}</span>` : ""}
    ${latestBillingEvent ? `<span>Latest invoice: ${escapeHtml(latestBillingEvent.invoiceNumber)} · ${money(latestBillingEvent.amountThb || 0)}</span>` : ""}
    <span>${state.user.email}</span>
  `;
}

function renderPlans() {
  plansList.innerHTML = state.plans.map((plan) => `
    <div class="plan-card ${plan.highlighted ? "highlighted" : ""}" data-public-launch-plan="${escapeHtml(plan.id)}">
      <strong>${escapeHtml(plan.name)} · ${money(plan.priceThb)} / month</strong>
      <span class="muted">${escapeHtml(plan.billing)}</span>
      <p class="plan-meta">${escapeHtml(plan.bestFor || "")}</p>
      <div class="plan-tags">
        <span>${formatNumber((plan.entitlements || []).length)} features</span>
        <span>${formatNumber(plan.limits?.clientWorkspaces || 0)} client workspaces</span>
      </div>
      <ul>${(plan.features || []).map((feature) => `<li>${escapeHtml(feature)}</li>`).join("")}</ul>
      <button class="plan-action" type="button" disabled>
        ${state.user ? "Admin assigns this package" : "Create account first"}
      </button>
    </div>
  `).join("");
  const deferredPlanNames = state.deferredPlans.map((plan) => plan.name).join(", ");
  if (deferredPlanNames) {
    plansList.insertAdjacentHTML("beforeend", `
      <div class="plan-card deferred-plan" data-advisor-coming-soon>
        <strong>${escapeHtml(deferredPlanNames)} · Coming soon</strong>
        <p class="plan-meta">ช่วงเปิดตัวจะขายเฉพาะ Starter และ Pro ก่อน เพื่อลดความซับซ้อนในการใช้งานจริง ส่วนงาน advisor/team workflow ยังเก็บไว้เป็น internal prototype สำหรับอนาคต</p>
        <span class="status-pill warning">Manual contact only</span>
      </div>
    `);
  }
  plansList.insertAdjacentHTML("afterbegin", `<p id="billingMessage" class="muted" data-launch-plan-note data-manual-package-flow>Launch phase: สมัครบัญชีไว้ก่อน แล้ว owner/admin จะกำหนด Starter หรือ Pro ให้จาก Business > User Management. ยังไม่รับชำระผ่านหน้าเว็บในรอบนี้.</p>`);
}

async function checkoutPlan(planId) {
  const billingMessage = document.querySelector("#billingMessage");
  if (!state.user) {
    billingMessage.textContent = "Please sign in before choosing a plan.";
    return;
  }

  if (!isPublicLaunchPlan(planId)) {
    billingMessage.textContent = "This package is not open for public checkout yet. Please choose Starter or Pro.";
    return;
  }

  billingMessage.textContent = "Creating payment session...";
  plansList.querySelectorAll("[data-plan-id]").forEach((button) => {
    button.disabled = true;
  });

  const response = await fetch("/api/subscription/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  });
  const data = await response.json();

  if (!data.ok) {
    renderPlans();
    document.querySelector("#billingMessage").textContent = data.message || "Checkout failed.";
    return;
  }

  state.user = data.user;
  state.billingEvents = [data.billingEvent, ...state.billingEvents].filter(Boolean);
  state.paymentSessions = [data.paymentSession, ...state.paymentSessions].filter(Boolean);
  renderAuthState();
  renderPlans();
  const updatedBillingMessage = document.querySelector("#billingMessage");
  if (data.paymentSession?.requiresRedirect && data.paymentSession?.checkoutUrl) {
    updatedBillingMessage.innerHTML = `Payment session created with ${escapeHtml(data.paymentSession.provider)}. <a href="${escapeHtml(data.paymentSession.checkoutUrl)}" target="_blank" rel="noopener">Open secure checkout</a>`;
  } else {
    updatedBillingMessage.textContent = data.duplicate
      ? `Payment webhook was already processed for ${data.user.subscription?.plan || "plan"}.`
      : `Payment succeeded via local gateway. Subscribed to ${data.user.subscription?.plan || "plan"}.`;
  }
  await Promise.all([loadBillingHistory(), loadPaymentSessions(), loadBusinessMetrics(), loadAuditEvents(), loadTenantScope()]);
  renderAuthState();
  if (state.activeView === "business") {
    renderBusinessView();
  } else {
    renderActiveView();
  }
}

function toggleLeftRail() {
  applyLeftRailState(!appShell?.classList.contains("left-rail-collapsed"));
}

function applyLeftRailState(collapsed) {
  if (!appShell || !leftRailToggle) {
    return;
  }

  appShell.classList.toggle("left-rail-collapsed", collapsed);
  leftRailToggle.textContent = collapsed ? "Show panel" : "Hide panel";
  leftRailToggle.setAttribute("aria-expanded", String(!collapsed));
  try {
    localStorage.setItem(leftRailStorageKey, collapsed ? "1" : "0");
  } catch {
    // Ignore private browsing or storage-disabled environments.
  }
}

function readLeftRailCollapsed() {
  try {
    return localStorage.getItem(leftRailStorageKey) === "1";
  } catch {
    return false;
  }
}

async function readJsonResponse(response, fallbackMessage = "Request failed.") {
  const contentType = response.headers.get("content-type") || "";
  const bodyText = await response.text();
  if (contentType.includes("application/json")) {
    try {
      return bodyText ? JSON.parse(bodyText) : {};
    } catch {
      throw new Error("The server returned invalid JSON. Please try again.");
    }
  }

  const plainText = bodyText.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const detail = plainText.slice(0, 180);
  throw new Error(detail || `${fallbackMessage} HTTP ${response.status}`);
}

async function runAnalysis(event) {
  event.preventDefault();

  if (!state.user) {
    showAnalysisStatus("error", {
      title: "Sign in required",
      text: "Create an account or sign in before running portfolio analysis.",
      activeStep: null,
    });
    runMessage.textContent = "Please create an account or sign in before running analysis.";
    return;
  }

  if (!canRunPortfolioAnalysis()) {
    showAnalysisStatus("error", {
      title: "Package required",
      text: analysisPackageRequiredMessage(),
      activeStep: null,
    });
    runMessage.textContent = analysisPackageRequiredMessage();
    updateFrontendDiagnostics();
    return;
  }

  if (state.analysisRunning) {
    return;
  }

  const selectedFiles = getAnalysisSelectedFiles();
  if (!selectedFiles.length) {
    showAnalysisStatus("error", {
      title: "Analysis needs attention",
      text: "Please choose a watchlist or portfolio file before running analysis.",
      activeStep: null,
    });
    runMessage.textContent = "Please choose a watchlist or portfolio file before running analysis.";
    return;
  }

  let formData;
  try {
    formData = new FormData(analysisForm);
    const requestHasUpload = ["watchlist", "portfolio"].some((fieldName) => isAttachedUploadFile(formData.get(fieldName)));
    if (!requestHasUpload) {
      showAnalysisStatus("error", {
        title: "Analysis needs attention",
        text: "The selected files could not be attached. Please choose the files again and run analysis.",
        activeStep: null,
      });
      runMessage.textContent = "The selected files could not be attached. Please choose the files again and run analysis.";
      return;
    }
  } catch (error) {
    showAnalysisStatus("error", {
      title: "Analysis needs attention",
      text: "The browser could not prepare the upload. Please choose the files again and try one more time.",
      activeStep: null,
    });
    runMessage.textContent = error.message || "The browser could not prepare the upload.";
    return;
  }

  state.analysisRunning = true;
  setAnalysisButtonLoading(true);
  showAnalysisStatus("loading", {
    title: "Analyzing your portfolio",
    text: "Please keep this page open. This can take several seconds or a few minutes while the app fetches stock data, calculates scores, and builds your report.",
    activeStep: "market",
  });
  runMessage.textContent = "Analysis is running. Please wait until the report links appear here.";
  const progressTimers = startAnalysisProgressTimers();

  try {
    const response = await fetch("/api/analysis/run", {
      method: "POST",
      body: formData,
    });
    const data = await readJsonResponse(response, "Analysis request failed.");

    if (!data.ok) {
      showAnalysisStatus("error", {
        title: "Analysis needs attention",
        text: data.message || "Analysis failed. Please check your files and try again.",
      });
      runMessage.textContent = data.message || "Analysis failed.";
      return;
    }

    const messages = [
      ...renderUploadSummaryMessages(data.uploadSummary),
      `Fetched ${data.count} stocks from ${data.symbols.length} symbols.`,
      `Generated ${data.recommendationCount} scored rows.`,
      `<a href="/api/analysis/raw">Download raw_CSV.csv</a>`,
      `<a href="/api/analysis/recommended">Download recommendations</a>`,
      `<a href="/api/analysis/coverage">Download live data coverage report</a>`,
    ];

    if (data.marketCoverage) {
      const coverage = data.marketCoverage;
      const completePct = Number(coverage.totals?.completeCoveragePct || 0).toFixed(1);
      const unknownSector = coverage.unknownSectorCount || 0;
      const missingFundamental = Object.values(coverage.missingFundamentalCounts || {})
        .reduce((total, count) => total + Number(count || 0), 0);
      messages.push(
        `Live data coverage: ${coverage.productionRecommendation?.status || "unknown"} (${completePct}% complete, ${unknownSector} unknown sectors, ${missingFundamental} missing fundamentals).`,
      );
    }

    if (data.portfolioReport) {
      messages.push(`Generated ${data.portfolioReport.count} portfolio rows.`);
      messages.push(`<a href="${data.portfolioReport.downloadUrl}">Download portfolio report</a>`);
    }

    if (Array.isArray(data.runtimeWarnings) && data.runtimeWarnings.length) {
      messages.push(...data.runtimeWarnings.map((warning) => `Trial note: ${escapeHtml(warning)}`));
    }

    messages.push(data.message);
    runMessage.innerHTML = messages.join("<br>");
    showAnalysisStatus("success", {
      title: "Analysis complete",
      text: "Your dashboard and download links are ready. Review the recommendations before making any investment decision.",
      completed: true,
    });
    state.recommendations = data.recommendations || [];
    state.portfolioRows = data.portfolioRows || [];
    state.savedSnapshot = data.customerSnapshot || null;
    await Promise.all([loadBusinessMetrics(), loadAuditEvents(), loadTenantScope()]);
    renderAuthState();
    state.activeView = state.portfolioRows.length ? "portfolio" : "screener";
    renderSnapshot();
    renderActiveView();
  } catch (error) {
    showAnalysisStatus("error", {
      title: "Analysis could not finish",
      text: `${error.message}. You can check the file format and try again.`,
    });
    runMessage.textContent = error.message;
  } finally {
    clearAnalysisProgressTimers(progressTimers);
    state.analysisRunning = false;
    setAnalysisButtonLoading(false);
  }
}

function handleAnalysisButtonClick(event) {
  if (analysisSubmitButton.disabled || state.analysisRunning) {
    return;
  }

  const now = Date.now();
  if (now - state.lastAnalysisTriggerAt < 600) {
    event.preventDefault();
    return;
  }
  state.lastAnalysisTriggerAt = now;
  state.analysisClickCount += 1;

  event.preventDefault();
  runMessage.textContent = "Preparing your upload...";
  updateFrontendDiagnostics();
  runAnalysis(event);
}

function handleDelegatedAnalysisClick(event) {
  const button = event.target.closest?.("[data-analysis-submit]");
  if (!button || button !== analysisSubmitButton) {
    return;
  }

  handleAnalysisButtonClick(event);
}

function getAnalysisSelectedFiles() {
  return analysisFileInputs.flatMap((input) => [...(input.files || [])]);
}

function isAttachedUploadFile(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  const size = Number(value.size || 0);
  const name = String(value.name || "");
  return size > 0 || Boolean(name && name !== "undefined");
}

function renderUploadSummaryMessages(uploadSummary = {}) {
  const messages = [];
  if (uploadSummary.watchlist) {
    messages.push(`Read watchlist file "${escapeHtml(uploadSummary.watchlist.fileName)}": ${formatNumber(uploadSummary.watchlist.parsedSymbols || 0)} symbol(s).`);
  }
  if (uploadSummary.portfolio) {
    const holdingText = Number.isFinite(Number(uploadSummary.portfolio.holdings))
      ? `, ${formatNumber(uploadSummary.portfolio.holdings)} holding row(s)`
      : "";
    messages.push(`Read portfolio file "${escapeHtml(uploadSummary.portfolio.fileName)}": ${formatNumber(uploadSummary.portfolio.parsedSymbols || 0)} symbol(s)${holdingText}.`);
  }
  if (uploadSummary.combinedSymbols !== undefined) {
    messages.push(`Combined unique symbols sent to market data: ${formatNumber(uploadSummary.combinedSymbols || 0)}.`);
  }
  return messages;
}

function setAnalysisButtonLoading(isLoading) {
  if (!analysisSubmitButton) {
    return;
  }

  const signedIn = Boolean(state.user);
  const canAnalyze = canRunPortfolioAnalysis();
  analysisSubmitButton.disabled = isLoading || !signedIn || !canAnalyze;
  analysisSubmitButton.textContent = !signedIn
    ? "Sign in to analyze"
    : !canAnalyze
      ? "Package required"
    : isLoading
      ? "Analyzing..."
      : "Analyze my portfolio";
  analysisFileInputs.forEach((input) => {
    input.disabled = isLoading || !signedIn || !canAnalyze;
  });
  updateFrontendDiagnostics();
}

function syncAnalysisAccess() {
  const signedIn = Boolean(state.user);
  const canAnalyze = canRunPortfolioAnalysis();
  templateDownloadLinks.forEach((link) => {
    if (!link.dataset.downloadHref) {
      link.dataset.downloadHref = link.getAttribute("href") || "";
    }
    if (signedIn && canAnalyze) {
      if (link.dataset.downloadHref) {
        link.setAttribute("href", link.dataset.downloadHref);
      }
      link.removeAttribute("aria-disabled");
      link.tabIndex = 0;
    } else {
      link.removeAttribute("href");
      link.setAttribute("aria-disabled", "true");
      link.tabIndex = -1;
    }
    link.classList.toggle("disabled", !signedIn || !canAnalyze);
  });

  const templatePanel = document.querySelector("[data-template-downloads]");
  templatePanel?.classList.toggle("locked", !signedIn || !canAnalyze);
  setAnalysisButtonLoading(state.analysisRunning);
  updateFrontendDiagnostics();

  if (!signedIn) {
    showAnalysisStatus("error", {
      title: "Sign in required",
      text: "Create an account or sign in before downloading templates, browsing files, or running portfolio analysis.",
      activeStep: null,
    });
    runMessage.textContent = "Sign in before downloading templates, browsing files, or running analysis.";
    return;
  }

  if (!canAnalyze) {
    showAnalysisStatus("error", {
      title: "Package required",
      text: analysisPackageRequiredMessage(),
      activeStep: null,
    });
    runMessage.textContent = analysisPackageRequiredMessage();
    return;
  }

  if (analysisStatusTitle?.textContent === "Sign in required") {
    analysisStatusPanel.hidden = true;
    runMessage.textContent = "Upload files, then run your analysis.";
  }
}

function canRunPortfolioAnalysis() {
  return Boolean(state.user && hasEntitlement("analysis.run"));
}

function analysisPackageRequiredMessage() {
  return "Portfolio analysis requires Starter or Pro. Ask the owner/admin to open Business > Members, choose Starter or Pro, set status Active or Trialing, set expiry date, then save package.";
}

function updateFrontendDiagnostics() {
  if (!frontendVersion) {
    return;
  }

  const selectedCount = getAnalysisSelectedFiles().length;
  const buttonState = !state.user
    ? "sign-in required"
    : canRunPortfolioAnalysis()
      ? (analysisSubmitButton?.disabled ? "disabled" : "ready")
      : "package required";
  const signedInState = state.user ? "signed in" : "not signed in";
  frontendVersion.textContent = `Frontend version ${frontendBuildVersion} loaded · Analyze button ${buttonState} · ${signedInState} · selected files ${selectedCount} · Analyze clicks ${state.analysisClickCount}`;
}

function showAnalysisStatus(status, options = {}) {
  if (!analysisStatusPanel) {
    return;
  }

  const {
    activeStep = null,
    completed = false,
    text = "",
    title = "",
  } = options;
  analysisStatusPanel.hidden = false;
  analysisStatusPanel.classList.remove("loading", "success", "error");
  analysisStatusPanel.classList.add(status);
  analysisStatusPanel.setAttribute("aria-busy", status === "loading" ? "true" : "false");

  if (analysisStatusTitle) {
    analysisStatusTitle.textContent = title;
  }

  if (analysisStatusText) {
    analysisStatusText.textContent = text;
  }

  updateAnalysisSteps({ activeStep, completed, status });
}

function updateAnalysisSteps({ activeStep, completed, status }) {
  const stepOrder = ["market", "score", "report"];
  const activeIndex = stepOrder.indexOf(activeStep);

  analysisStepItems.forEach((item) => {
    const itemIndex = stepOrder.indexOf(item.dataset.analysisStep);
    item.classList.remove("active", "done");

    if (completed) {
      item.classList.add("done");
    } else if (status === "loading" && itemIndex >= 0) {
      if (itemIndex < activeIndex) {
        item.classList.add("done");
      } else if (itemIndex === activeIndex) {
        item.classList.add("active");
      }
    }
  });
}

function startAnalysisProgressTimers() {
  return [
    setTimeout(() => {
      if (state.analysisRunning) {
        showAnalysisStatus("loading", {
          title: "Scoring stocks",
          text: "Market data is being normalized and scored against sector benchmarks. Please keep this page open.",
          activeStep: "score",
        });
      }
    }, 3500),
    setTimeout(() => {
      if (state.analysisRunning) {
        showAnalysisStatus("loading", {
          title: "Building your report",
          text: "The app is preparing dashboard data, download files, and portfolio actions.",
          activeStep: "report",
        });
      }
    }, 9000),
  ];
}

function clearAnalysisProgressTimers(timers) {
  timers.forEach((timer) => clearTimeout(timer));
}

function renderSnapshot() {
  const snapshot = state.savedSnapshot;
  if (!snapshot) {
    customerSnapshot.innerHTML = `
      <span>No portfolio saved yet</span>
      <strong>Run analysis to create your first snapshot.</strong>
    `;
    return;
  }

  const summary = snapshot.summary || {};
  customerSnapshot.innerHTML = `
    <span>Last saved: ${formatDate(snapshot.generatedAt)}</span>
    <strong>${money(summary.marketValue || 0)} · ${formatNumber(summary.gainLossPct || 0)}% P/L</strong>
    <p class="muted">${summary.holdings || 0} holdings · ${summary.urgentActions || 0} urgent actions · Avg score ${formatNumber(summary.avgScore || 0)}</p>
  `;
}

function renderActiveView() {
  if (!state.user) {
    viewOutput.innerHTML = `
      <div class="metric-grid">
        ${metric("Step 1", "Create account")}
        ${metric("Step 2", "Upload portfolio")}
        ${metric("Step 3", "Read the action plan")}
      </div>
      <p class="muted">StockFlix is designed to explain portfolio health in plain language before showing advanced tables.</p>
    `;
    return;
  }

  if (state.activeView === "portfolio") {
    renderPortfolioView();
    return;
  }

  if (state.activeView === "screener") {
    renderScreenerView();
    return;
  }

  if (state.activeView === "sector") {
    if (!hasEntitlement("sector.analysis")) {
      viewOutput.innerHTML = renderLockedFeature("sector.analysis");
      return;
    }

    renderSectorView();
    return;
  }

  if (state.activeView === "business") {
    if (!canViewWorkspace()) {
      const featureId = hasRolePermission("business_metrics") ? "business.metrics" : "client.workspace";
      viewOutput.innerHTML = renderLockedFeature(featureId);
      return;
    }

    renderBusinessView();
    return;
  }

  if (!hasEntitlement("simulation.run")) {
    viewOutput.innerHTML = renderLockedFeature("simulation.run");
    return;
  }

  renderSimulationView();
}

function renderPortfolioView() {
  if (!state.portfolioRows.length) {
    viewOutput.innerHTML = `
      <section class="portfolio-data-warning" data-portfolio-empty-holdings>
        <strong>No portfolio holdings loaded yet.</strong>
        <span>${state.recommendations.length
          ? `The latest analysis has ${formatNumber(state.recommendations.length)} stock recommendation(s), but no portfolio file was uploaded. Open Screener to review the watchlist results, or upload a portfolio Excel file to see holding-level actions.`
          : "Upload a portfolio Excel file and run analysis to see holding-level actions."}</span>
      </section>
    `;
    return;
  }

  const totalMarketValue = sum(state.portfolioRows, "Market_Value");
  const totalCostValue = sum(state.portfolioRows, "Cost_Value");
  const totalGainLoss = sum(state.portfolioRows, "Gain_Loss_Value");
  const gainLossPct = totalCostValue ? (totalGainLoss / totalCostValue) * 100 : 0;
  const urgentRows = state.portfolioRows.filter((row) => /Exit|Reduce|Sell/i.test(String(row.Target_Action || row.Advice || "")));
  const rows = state.portfolioRows
    .slice()
    .sort((left, right) => numberValue(right.Market_Value) - numberValue(left.Market_Value));

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Portfolio Value", money(totalMarketValue))}
      ${metric("Gain/Loss", `${money(totalGainLoss)} (${formatNumber(gainLossPct)}%)`)}
      ${metric("Urgent Actions", urgentRows.length)}
      ${metric("Avg Score", formatNumber(average(rows, "Total_Score")))}
    </div>
    ${renderPortfolioDataWarning(rows)}
    ${renderThink2SafetySummary(rows, { context: "portfolio" })}
    ${renderScoreMatrixGuide(rows)}
    ${renderPortfolioQuickGuidance({ gainLossPct, urgentRows, avgScore: average(rows, "Total_Score") })}
    ${renderPortfolioVisuals(rows)}
    <h3>Recommended actions</h3>
    ${renderRecommendedActionsControls(rows)}
    <div id="recommendedActionsOutput" data-recommended-actions-output></div>
  `;
  attachRecommendedActionsControls(rows);
}

function renderPortfolioDataWarning(rows) {
  const hasHoldings = rows.length > 0;
  const rowsWithMarketData = rows.filter((row) => numberValue(row.Market_Value) > 0 || !/No Data/i.test(String(row.Advice || row.Target_Action || "")));
  if (!hasHoldings || rowsWithMarketData.length > 0) {
    return "";
  }

  return `
    <div class="portfolio-data-warning" data-portfolio-data-warning>
      <strong>Market data was unavailable in the last run.</strong>
      <span>Your holdings were read, but prices and scores could not be completed. The app now protects existing outputs from being overwritten by an empty market fetch; rerun analysis when the data connection is available.</span>
    </div>
  `;
}

function renderThink2SafetySummary(rows, options = {}) {
  const redCount = rows.filter((row) => String(row.Conflict_Severity || "").toUpperCase() === "RED").length;
  const orangeCount = rows.filter((row) => String(row.Conflict_Severity || "").toUpperCase() === "ORANGE").length;
  const yellowCount = rows.filter((row) => String(row.Conflict_Severity || "").toUpperCase() === "YELLOW").length;
  const reviewCount = rows.filter((row) => String(row.Data_Status || "").toUpperCase() === "REVIEW_REQUIRED").length;
  const dataErrorCount = rows.filter((row) => String(row.Data_Status || "").toUpperCase() === "DATA_ERROR").length;
  const hasSafetyAlert = redCount || orangeCount || yellowCount || reviewCount || dataErrorCount;
  if (!hasSafetyAlert) {
    return "";
  }

  const contextText = options.context === "portfolio"
    ? "These warnings do not change your current Target Action yet, but they show which holdings need review before adding money."
    : "These warnings do not remove stocks from the screener yet, but they help beginners avoid buying from score alone.";

  return `
    <section class="think2-safety-summary" data-think2-safety-summary>
      <div>
        <strong>Safety check before acting</strong>
        <span>${escapeHtml(contextText)}</span>
      </div>
      <div class="safety-counts">
        ${redCount ? `<span class="severity-badge severity-red">${formatNumber(redCount)} red</span>` : ""}
        ${orangeCount ? `<span class="severity-badge severity-orange">${formatNumber(orangeCount)} orange</span>` : ""}
        ${yellowCount ? `<span class="severity-badge severity-yellow">${formatNumber(yellowCount)} yellow</span>` : ""}
        ${dataErrorCount ? `<span class="status-badge status-error">${formatNumber(dataErrorCount)} data error</span>` : ""}
        ${reviewCount ? `<span class="status-badge status-review">${formatNumber(reviewCount)} review</span>` : ""}
      </div>
    </section>
  `;
}

function renderScoreMatrixGuide(rows) {
  if (!rows.length || !rows.some((row) => Number.isFinite(Number(row.Composite_Score_v2)))) {
    return "";
  }

  const items = [
    {
      label: "Quality",
      value: average(rows, "Quality_Score"),
      text: "ธุรกิจดีไหม เช่น ROE และคุณภาพเทียบกลุ่ม",
    },
    {
      label: "Valuation",
      value: average(rows, "Valuation_Score"),
      text: "ราคาดูน่าสนใจไหมเมื่อเทียบกำไร/ปันผล/กลุ่ม",
    },
    {
      label: "Setup",
      value: average(rows, "Setup_Score"),
      text: "จังหวะราคาเป็นใจไหมจาก RSI และกรอบ 52 สัปดาห์",
    },
    {
      label: "Risk",
      value: average(rows, "Balance_Risk_Score"),
      text: "หนี้และงบดุลดูปลอดภัยแค่ไหน",
    },
    {
      label: "Liquidity",
      value: average(rows, "Liquidity_Score"),
      text: "มี volume ยืนยันและซื้อขายง่ายขึ้นไหม",
    },
  ];

  return `
    <section class="score-matrix-guide" data-score-matrix-guide>
      <div class="score-matrix-intro">
        <strong>Score matrix แบบอ่านง่าย</strong>
        <span>คะแนนชุดนี้ช่วยแยกเหตุผล ไม่ได้แทน Total Score หรือ Target Action ในช่วงทดลอง Think2</span>
      </div>
      <div class="score-matrix-cards">
        ${items.map((item) => `
          <article class="score-matrix-card">
            <span>${escapeHtml(item.label)}</span>
            <strong>${formatNumber(item.value)}</strong>
            <p>${escapeHtml(item.text)}</p>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function renderRecommendedActionsControls(rows) {
  const sectors = uniqueValues(rows.map((row) => row.Sector || "Unknown"));
  const trends = uniqueValues(rows.map((row) => row.Trend_Status || "Unknown"));
  const actionGroups = ["Urgent", "Exit/Sell", "Reduce", "Buy/Accumulate", "Wait", "Hold"];

  return `
    <section class="table-control-panel" data-recommended-actions-controls>
      <div class="filter-bar compact-filter-bar">
        <label>Search Symbol
          <input id="actionSearch" type="search" placeholder="AOT, PTT..." autocomplete="off" data-recommended-action-input>
        </label>
        <label>Action
          <select id="actionGroupFilter" data-recommended-action-input>
            <option value="">All actions</option>
            ${actionGroups.map((group) => option(group, group, "")).join("")}
          </select>
        </label>
        <label>Sector
          <select id="actionSectorFilter" data-recommended-action-input>
            <option value="">All sectors</option>
            ${sectors.map((sector) => option(sector, sector, "")).join("")}
          </select>
        </label>
        <label>Trend
          <select id="actionTrendFilter" data-recommended-action-input>
            <option value="">All trends</option>
            ${trends.map((trend) => option(trend, trend, "")).join("")}
          </select>
        </label>
        <label>Min Score
          <input id="actionMinScore" type="number" min="0" max="100" value="0" data-recommended-action-input>
        </label>
        <label>Order by
          <select id="actionSortBy" data-recommended-action-input>
            ${recommendedActionSortFields.map((field) => option(field.key, field.label, "Total_Score")).join("")}
          </select>
        </label>
        <label>Direction
          <select id="actionSortDirection" data-recommended-action-input>
            ${option("desc", "High to low", "desc")}
            ${option("asc", "Low to high", "desc")}
          </select>
        </label>
      </div>
      <details class="field-picker" data-recommended-field-picker>
        <summary>Choose fields to display</summary>
        <div class="field-picker-grid">
          ${recommendedActionFields.map((field) => `
            <label class="check-option">
              <input type="checkbox" data-action-field="${escapeHtml(field.key)}"${field.default ? " checked" : ""}${field.required ? " disabled" : ""}>
              <span>${escapeHtml(field.label)}</span>
            </label>
          `).join("")}
        </div>
      </details>
      <div class="control-actions">
        <button type="button" class="ghost-button" data-reset-recommended-actions>Reset view</button>
      </div>
      <p class="muted visual-filter-hint" data-portfolio-visual-filter-hint>Click Action mix or Score distribution bars to filter this table.</p>
    </section>
  `;
}

function attachRecommendedActionsControls(rows) {
  const panel = document.querySelector("[data-recommended-actions-controls]");
  const output = document.querySelector("[data-recommended-actions-output]");
  if (!panel || !output) {
    return;
  }

  const renderActions = () => {
    const filteredRows = getFilteredRecommendedActions(rows, panel);
    const selectedColumns = getSelectedRecommendedActionFields(panel);
    output.innerHTML = renderRecommendedActionsOutput(filteredRows, rows.length, selectedColumns, panel);
  };

  panel.querySelectorAll("[data-recommended-action-input], [data-action-field]").forEach((control) => {
    const handleManualChange = () => {
      normalizeManualVisualFilters(control, panel);
      renderActions();
    };
    control.addEventListener("input", handleManualChange);
    control.addEventListener("change", handleManualChange);
  });
  panel.querySelector("[data-reset-recommended-actions]")?.addEventListener("click", () => {
    resetRecommendedActionsControls(panel);
    renderActions();
  });
  attachPortfolioVisualFilters(panel, renderActions);
  renderActions();
}

function normalizeManualVisualFilters(control, panel) {
  if (control.id === "actionGroupFilter") {
    clearPortfolioVisualSelection("[data-recommended-action-filter]");
  }

  if (control.id === "actionSectorFilter") {
    clearPortfolioVisualSelection("[data-recommended-sector-filter]");
  }

  if (control.id === "actionMinScore") {
    panel.dataset.scoreBandFilter = "";
    clearPortfolioVisualSelection("[data-recommended-score-band]");
  }
}

function getFilteredRecommendedActions(rows, panel) {
  const search = panel.querySelector("#actionSearch")?.value.trim().toLowerCase() || "";
  const actionFilter = panel.querySelector("#actionGroupFilter")?.value || "";
  const sectorFilter = panel.querySelector("#actionSectorFilter")?.value || "";
  const trendFilter = panel.querySelector("#actionTrendFilter")?.value || "";
  const minScore = numberValue(panel.querySelector("#actionMinScore")?.value || 0);
  const scoreBandFilter = panel.dataset.scoreBandFilter || "";
  const sortBy = panel.querySelector("#actionSortBy")?.value || "Total_Score";
  const direction = panel.querySelector("#actionSortDirection")?.value || "desc";

  return rows
    .filter((row) => !search || String(row.Symbol || "").toLowerCase().includes(search))
    .filter((row) => !actionFilter || matchesRecommendedActionFilter(row, actionFilter))
    .filter((row) => !sectorFilter || (row.Sector || "Unknown") === sectorFilter)
    .filter((row) => !trendFilter || (row.Trend_Status || "Unknown") === trendFilter)
    .filter((row) => numberValue(row.Total_Score) >= minScore)
    .filter((row) => !scoreBandFilter || matchesScoreBandFilter(row, scoreBandFilter))
    .slice()
    .sort((left, right) => compareRecommendedActionRows(left, right, sortBy, direction));
}

function matchesRecommendedActionFilter(row, filterValue) {
  if (filterValue === "Urgent") {
    return /Exit|Reduce|Sell|Cut/i.test(String(row.Target_Action || row.Advice || ""));
  }

  return actionGroup(row) === filterValue;
}

function matchesScoreBandFilter(row, filterValue) {
  const score = numberValue(row.Total_Score);
  if (filterValue === "strong") return score >= 70;
  if (filterValue === "watch") return score >= 45 && score < 70;
  if (filterValue === "risk") return score < 45;
  return true;
}

function compareRecommendedActionRows(left, right, sortBy, direction) {
  const sign = direction === "asc" ? 1 : -1;
  if (sortBy === "Symbol" || sortBy === "Action_Group") {
    const leftValue = sortBy === "Action_Group" ? actionGroup(left) : left.Symbol;
    const rightValue = sortBy === "Action_Group" ? actionGroup(right) : right.Symbol;
    return sign * String(leftValue || "").localeCompare(String(rightValue || ""));
  }

  return sign * (numberValue(left[sortBy]) - numberValue(right[sortBy]));
}

function getSelectedRecommendedActionFields(panel) {
  const selected = [...panel.querySelectorAll("[data-action-field]:checked")].map((input) => input.dataset.actionField);
  return selected.length ? selected : ["Symbol", "Target_Action"];
}

function renderRecommendedActionsOutput(rows, totalRows, selectedColumns, panel) {
  const sortLabel = recommendedActionSortFields.find((field) => field.key === (panel.querySelector("#actionSortBy")?.value || "Total_Score"))?.label || "Score";
  const directionLabel = panel.querySelector("#actionSortDirection")?.value === "asc" ? "low to high" : "high to low";
  const filters = [
    panel.querySelector("#actionSearch")?.value ? `symbol contains "${panel.querySelector("#actionSearch").value.trim()}"` : "",
    panel.querySelector("#actionGroupFilter")?.value ? `action ${panel.querySelector("#actionGroupFilter").value}` : "",
    panel.querySelector("#actionSectorFilter")?.value ? `sector ${panel.querySelector("#actionSectorFilter").value}` : "",
    panel.querySelector("#actionTrendFilter")?.value ? `trend ${panel.querySelector("#actionTrendFilter").value}` : "",
    numberValue(panel.querySelector("#actionMinScore")?.value || 0) ? `score >= ${formatNumber(panel.querySelector("#actionMinScore").value)}` : "",
    panel.dataset.scoreBandFilter ? `score band ${scoreBandLabel(panel.dataset.scoreBandFilter)}` : "",
  ].filter(Boolean);

  return `
    <div class="table-control-status" data-recommended-actions-status>
      <strong>${formatNumber(rows.length)} of ${formatNumber(totalRows)} actions shown</strong>
      <span>Order by ${escapeHtml(sortLabel)} ${escapeHtml(directionLabel)}${filters.length ? ` · ${escapeHtml(filters.join(" · "))}` : ""}</span>
    </div>
    ${renderTable(rows, selectedColumns)}
  `;
}

function resetRecommendedActionsControls(panel) {
  panel.querySelector("#actionSearch").value = "";
  panel.querySelector("#actionGroupFilter").value = "";
  panel.querySelector("#actionSectorFilter").value = "";
  panel.querySelector("#actionTrendFilter").value = "";
  panel.querySelector("#actionMinScore").value = "0";
  panel.querySelector("#actionSortBy").value = "Total_Score";
  panel.querySelector("#actionSortDirection").value = "desc";
  panel.dataset.scoreBandFilter = "";
  clearPortfolioVisualSelection("[data-recommended-action-filter]");
  clearPortfolioVisualSelection("[data-recommended-sector-filter]");
  clearPortfolioVisualSelection("[data-recommended-score-band]");
  panel.querySelectorAll("[data-action-field]").forEach((input) => {
    const field = recommendedActionFields.find((item) => item.key === input.dataset.actionField);
    input.checked = Boolean(field?.default || field?.required);
  });
}

function attachPortfolioVisualFilters(panel, renderActions) {
  document.querySelectorAll("[data-recommended-action-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      panel.querySelector("#actionGroupFilter").value = button.dataset.recommendedActionFilter || "";
      panel.dataset.scoreBandFilter = "";
      updatePortfolioVisualSelection(button, "[data-recommended-action-filter]");
      clearPortfolioVisualSelection("[data-recommended-score-band]");
      renderActions();
      scrollRecommendedActionsIntoView();
    });
  });

  document.querySelectorAll("[data-recommended-score-band]").forEach((button) => {
    button.addEventListener("click", () => {
      panel.dataset.scoreBandFilter = button.dataset.recommendedScoreBand || "";
      panel.querySelector("#actionMinScore").value = "0";
      updatePortfolioVisualSelection(button, "[data-recommended-score-band]");
      renderActions();
      scrollRecommendedActionsIntoView();
    });
  });

  document.querySelectorAll("[data-recommended-sector-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      panel.querySelector("#actionSectorFilter").value = button.dataset.recommendedSectorFilter || "";
      updatePortfolioVisualSelection(button, "[data-recommended-sector-filter]");
      renderActions();
      scrollRecommendedActionsIntoView();
    });
  });
}

function updatePortfolioVisualSelection(activeButton, selector) {
  document.querySelectorAll(selector).forEach((button) => {
    const selected = button === activeButton;
    button.classList.toggle("selected", selected);
    button.setAttribute("aria-pressed", selected ? "true" : "false");
  });
}

function clearPortfolioVisualSelection(selector) {
  document.querySelectorAll(selector).forEach((button) => {
    button.classList.remove("selected");
    button.setAttribute("aria-pressed", "false");
  });
}

function scrollRecommendedActionsIntoView() {
  document.querySelector("[data-recommended-actions-status]")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function scoreBandLabel(value) {
  return {
    strong: "Strong 70+",
    watch: "Watch 45-69",
    risk: "Risk <45",
  }[value] || value;
}

function renderPortfolioQuickGuidance({ gainLossPct, urgentRows, avgScore }) {
  const health = avgScore >= 70 ? "พอร์ตโดยรวมดูแข็งแรง" : avgScore >= 50 ? "พอร์ตยังพอไปต่อได้ แต่ควรคัดหุ้นอ่อนออก" : "พอร์ตมีความเสี่ยงสูง ควรลดหุ้นคะแนนต่ำ";
  const action = urgentRows.length
    ? `มี ${urgentRows.length} รายการที่ควรตรวจทันที เช่น Reduce, Sell หรือ Exit`
    : "ยังไม่มีสัญญาณเร่งด่วน ให้ติดตามโซนซื้อขายและถือวินัย";

  return `
    <section class="portfolio-summary-strip" data-portfolio-quick-guidance>
      <div class="guidance-card"><span>Portfolio health</span><strong>${escapeHtml(health)}</strong></div>
      <div class="guidance-card"><span>Next action</span><strong>${escapeHtml(action)}</strong></div>
      <div class="guidance-card"><span>P/L context</span><strong>${gainLossPct >= 0 ? "กำไรอยู่ ให้เน้นปกป้องกำไร" : "ขาดทุนอยู่ ให้ดู Recovery % และ Stop Loss"}</strong></div>
    </section>
  `;
}

function renderBusinessView() {
  if (canViewBusinessMetrics() && !state.businessMetrics) {
    viewOutput.innerHTML = `<p class="muted">Loading business metrics...</p>`;
    Promise.all([loadBusinessMetrics(), loadTeamUsers(), loadOrganizations()])
      .then(renderBusinessView)
      .catch(() => {
        viewOutput.innerHTML = `<p class="muted">Business metrics are not available for this account.</p>`;
      });
    return;
  }

  if (!canViewBusinessMetrics()) {
    viewOutput.innerHTML = `
      <div class="metric-grid">
        ${metric("Workspace", "Advisor Clients")}
        ${metric("Assigned Clients", state.teamUsers.filter((user) => user.role === "customer").length)}
        ${metric("Visible Workspaces", state.organizations.length)}
        ${metric("Saved Portfolios", state.teamUsers.filter((user) => user.portfolioSummary).length)}
      </div>
      ${renderTenantScopeSummary()}
      ${renderWorkspaceSummary()}
      ${renderTeamWorkspace()}
      <h3>Recent payments</h3>
      ${renderPaymentSessions()}
      <h3>Recent activity</h3>
      ${renderActivityTimeline()}
    `;
    attachTeamActions();
    attachOrganizationActions();
    return;
  }

  const metrics = state.businessMetrics;
  const readiness = state.operationalReadiness;
  const planRows = Object.entries(metrics.usersByPlan || {}).map(([plan, users]) => ({
    Plan: plan,
    Users: users,
    Share_Pct: metrics.users ? (users / metrics.users) * 100 : 0,
  }));
  const roleRows = Object.entries(metrics.usersByRole || {}).map(([role, users]) => ({
    Role: role,
    Users: users,
    Share_Pct: metrics.users ? (users / metrics.users) * 100 : 0,
  }));
  const billingRows = (metrics.recentBillingEvents || []).map((event) => ({
    Invoice: event.invoiceNumber,
    Plan: event.planName,
    Amount_THB: event.amountThb,
    Status: event.status,
    Date: formatDate(event.createdAt),
  }));
  const paymentRows = (metrics.recentPaymentSessions || state.paymentSessions || []).map((session) => ({
    Created: formatDateTime(session.createdAt),
    Plan: session.planName,
    Amount_THB: session.amountThb,
    Status: session.status,
    Provider: session.provider,
    Webhooks: session.webhookEventCount || 0,
  }));
  const webhookRows = (metrics.recentPaymentWebhookEvents || []).map((event) => ({
    Created: formatDateTime(event.createdAt),
    Event: event.eventType,
    Status: event.status,
    Source: event.source || "-",
    Verified: event.signatureVerified ? "Yes" : event.verificationStatus || "No",
    Message: event.message || "-",
  }));
  const pricingRows = (metrics.plans || []).map((plan) => ({
    Plan: plan.name,
    Price_THB: plan.priceThb,
    Billing: plan.billing,
    Focus: (plan.features || []).slice(0, 2).join(", "),
  }));
  const portfolioAttachPct = metrics.users ? (metrics.savedPortfolios / metrics.users) * 100 : 0;
  const pendingPackageAssignments = state.teamUsers.filter((user) => user.subscription?.status === "inactive").length;
  const selectedSection = state.businessSection || "members";

  viewOutput.innerHTML = `
    <section class="business-admin-cockpit" data-business-admin-cockpit>
      <div class="section-title compact-title">
        <div>
          <span class="eyebrow">Admin cockpit</span>
          <h3>Member Control Center</h3>
          <p class="muted">หน้าหลักสำหรับ owner: ตรวจสมาชิกใหม่ เลือก Starter/Pro ตั้งวันหมดอายุ และลบ user ที่ไม่ต้องการใช้งาน</p>
        </div>
        <span class="status-pill ready">${escapeHtml(state.user?.role || "admin")}</span>
      </div>
      <div class="metric-grid compact-grid business-kpi-strip">
        ${metric("Waiting Package", pendingPackageAssignments)}
        ${metric("Users", metrics.users || 0)}
        ${metric("Active Paid", metrics.paidUsers || 0)}
        ${metric("MRR", money(metrics.mrrEstimate || 0))}
        ${metric("Portfolios", metrics.savedPortfolios || 0)}
        ${metric("System", productionEnvironmentStatusLabel(metrics.productionEnvironmentAdvisor?.status))}
      </div>
      ${renderBusinessSectionTabs(selectedSection)}
      <div class="business-section-body" data-business-section-body>
        ${renderBusinessSectionContent(selectedSection, {
          metrics,
          readiness,
          portfolioAttachPct,
          planRows,
          roleRows,
          billingRows,
          paymentRows,
          webhookRows,
          pricingRows,
        })}
      </div>
    </section>
  `;
  attachBusinessSectionControls();
  attachTeamActions();
  attachOrganizationActions();
  attachReferenceMasterActions();
  attachPortfolioHealthControls();
}

function renderBusinessSectionTabs(selectedSection = state.businessSection) {
  const sections = [
    ["members", "Members", "package, expiry, delete"],
    ["advanced", "Advanced Ops", "database, readiness, audit"],
  ];

  return `
    <div class="business-section-tabs" data-business-section-tabs>
      ${sections.map(([id, label, hint]) => `
        <button class="${selectedSection === id ? "active" : ""}" type="button" data-business-section="${id}" aria-pressed="${selectedSection === id ? "true" : "false"}">
          <span>${escapeHtml(label)}</span>
          <small>${escapeHtml(hint)}</small>
        </button>
      `).join("")}
    </div>
  `;
}

function renderBusinessSectionContent(section, context) {
  const {
    metrics,
    readiness,
    portfolioAttachPct,
    planRows,
    roleRows,
    billingRows,
    paymentRows,
    webhookRows,
    pricingRows,
  } = context;

  if (section === "advanced") {
    return `
      <section class="chart-panel advanced-ops-panel" data-business-advanced-ops>
        <div class="section-title compact-title">
          <div>
            <span class="eyebrow">Advanced Ops</span>
            <h3>System checks for deployment</h3>
            <p class="muted">ส่วนนี้เก็บข้อมูลหลังบ้านที่ไม่ต้องใช้ทุกวัน เช่น database, production readiness, audit และ billing evidence</p>
          </div>
        </div>
        <details open>
          <summary>System admin and workspace</summary>
          ${renderSystemAdminPanel()}
          ${renderTenantScopeSummary()}
          ${renderWorkspaceSummary(metrics.recentOrganizations || state.organizations)}
          ${renderBusinessFunnel(metrics, portfolioAttachPct)}
          <h3>Users by plan</h3>
          ${renderTable(planRows, ["Plan", "Users", "Share_Pct"])}
          <h3>Users by role</h3>
          ${renderTable(roleRows, ["Role", "Users", "Share_Pct"])}
          <h3>Recent activity</h3>
          ${renderActivityTimeline(state.auditEvents.length ? state.auditEvents : metrics.recentAuditEvents || [])}
        </details>
        <details>
          <summary>Data health and reference data</summary>
          ${renderPortfolioDataHealth(metrics.portfolioDataHealth)}
          ${renderDatabaseModeAdvisor(metrics.databaseModeAdvisor)}
          ${renderReferenceMasterReview(state.referenceMaster)}
        </details>
        <details>
          <summary>Go-live readiness and billing evidence</summary>
          ${renderProductionEnvironmentAdvisor(metrics.productionEnvironmentAdvisor)}
          ${renderOperationalReadiness(readiness)}
          ${renderLaunchEvidenceCenter(state.launchEvidence)}
          <h3>Recent payments</h3>
          ${renderTable(paymentRows, ["Created", "Plan", "Amount_THB", "Status", "Provider", "Webhooks"])}
          <h3>Recent gateway webhooks</h3>
          ${renderTable(webhookRows, ["Created", "Event", "Status", "Source", "Verified", "Message"])}
          <h3>Recent billing</h3>
          ${renderTable(billingRows, ["Invoice", "Plan", "Amount_THB", "Status", "Date"])}
          <h3>Pricing catalog</h3>
          ${renderTable(pricingRows, ["Plan", "Price_THB", "Billing", "Focus"])}
        </details>
      </section>
    `;
  }

  return `
    <section class="chart-panel business-package-focus" data-business-section-default="members" data-member-management-focus>
      <div class="section-title compact-title">
        <div>
          <span class="eyebrow">Start here</span>
          <h3>Member Management</h3>
          <p class="muted">งานหลักช่วงเปิดตัวคือเปิดแพ็กเกจให้สมาชิกใหม่ เลือก Starter/Pro, ตั้งสถานะ, กำหนดวันหมดอายุ และลบ user ที่ไม่ต้องการ</p>
        </div>
        <span class="status-pill warning">${formatNumber(state.teamUsers.filter((user) => user.subscription?.status === "inactive").length)} waiting</span>
      </div>
      <div class="guidance-grid">
        <div class="guidance-card"><span>1. ตรวจสมาชิกใหม่</span><strong>ดูแถวที่มีสถานะ Waiting admin</strong></div>
        <div class="guidance-card"><span>2. เลือกแพ็กเกจ</span><strong>Starter สำหรับเริ่มต้น, Pro สำหรับ Sector และ Simulation</strong></div>
        <div class="guidance-card"><span>3. เปิดสิทธิ์</span><strong>ตั้ง status เป็น Active หรือ Trialing แล้วกด Save package</strong></div>
      </div>
    </section>
    ${renderTeamWorkspace({ compactAdmin: true })}
  `;
}

function attachBusinessSectionControls() {
  document.querySelectorAll("[data-business-section]").forEach((button) => {
    button.addEventListener("click", () => {
      state.businessSection = button.dataset.businessSection || "packages";
      renderBusinessView();
    });
  });
}

function renderSystemAdminPanel() {
  const metrics = state.businessMetrics || {};
  const users = state.teamUsers || [];
  const organizations = state.organizations.length ? state.organizations : metrics.recentOrganizations || [];
  const visibleCustomers = users.filter((user) => user.role === "customer");
  const visibleOperators = users.filter((user) => ["owner", "admin", "advisor"].includes(user.role));
  const paidUsers = users.filter((user) => user.subscription?.status === "active").length || metrics.paidUsers || 0;
  const trialUsers = users.filter((user) => user.subscription?.status === "trialing").length || metrics.trials || 0;
  const unassignedCustomers = visibleCustomers.filter((user) => !user.advisorId).length;
  const roleSummary = summarizeBy(users, (user) => user.role || "customer");
  const planSummary = summarizeBy(users, (user) => user.subscription?.plan || "none");
  const roleCopy = Object.entries(roleSummary).map(([role, count]) => `${role}: ${count}`).join(" · ") || "-";
  const planCopy = Object.entries(planSummary).map(([plan, count]) => `${plan}: ${count}`).join(" · ") || "-";
  const isOperator = canViewBusinessMetrics();
  const title = isOperator ? "System Admin" : "Advisor Workspace";
  const subtitle = isOperator
    ? "จัดการผู้ใช้ แพ็กเกจ Workspace และความพร้อมของระบบจากจุดเดียว"
    : "พื้นที่ดูแลลูกค้าที่ได้รับมอบหมาย พร้อมตรวจ scope ว่าไม่เห็นข้อมูลลูกค้าคนอื่น";
  const quickActions = isOperator
    ? [
      ["User roles", canManageRoles() ? "เปลี่ยน owner/admin/advisor/customer ได้จาก User Management" : "บัญชีนี้ดู role ได้ แต่เปลี่ยน role ไม่ได้"],
      ["Advisor assignment", canAssignAdvisors() ? "ผูก advisor กับ customer ได้จากคอลัมน์ Advisor" : "ยังไม่มีสิทธิ์ assign advisor"],
      ["Workspace control", canManageOrganizations() ? "สร้าง workspace และย้าย user ได้จาก Workspace Management" : "ดู workspace ได้ตามสิทธิ์"],
      ["Billing monitor", "ตรวจ paid/trial/failed payment และ invoice จาก metrics ด้านล่าง"],
      ["Database readiness", "ดู Database Mode Advisor ก่อนย้ายจาก demo ไป production"],
      ["Production guard", "ดู Production Environment Advisor และ Launch Evidence ก่อน go-live"],
    ]
    : [
      ["Assigned clients", "เห็นเฉพาะลูกค้าที่ owner/admin assign ให้ดูแล"],
      ["Approval requests", "สร้างคำขอให้ลูกค้ายืนยัน action สำคัญก่อนดำเนินการ"],
      ["Client privacy", "ข้อมูล customer ที่ไม่ได้ assign จะไม่แสดงใน workspace นี้"],
    ];

  return `
    <section class="chart-panel system-admin-panel" data-system-admin-panel>
      <div class="section-title">
        <div>
          <span class="eyebrow">${isOperator ? "Admin console" : "Advisor console"}</span>
          <h3>${title}</h3>
          <p class="muted">${subtitle}</p>
        </div>
        <span class="status-pill ${isOperator ? "ready" : "blocked"}">${escapeHtml(state.user?.role || "user")}</span>
      </div>
      <div class="metric-grid compact-grid">
        ${metric("Visible Users", users.length || metrics.users || 0)}
        ${metric("Customers", visibleCustomers.length || metrics.usersByRole?.customer || 0)}
        ${metric("Advisors/Admins", visibleOperators.length || (metrics.usersByRole?.advisor || 0) + (metrics.usersByRole?.admin || 0) + (metrics.usersByRole?.owner || 0))}
        ${metric("Paid Users", paidUsers)}
        ${metric("Trials", trialUsers)}
        ${metric("Unassigned Customers", unassignedCustomers)}
        ${metric("Workspaces", organizations.length || metrics.organizations || 0)}
        ${metric("Advisor Links", metrics.advisorAssignments || users.filter((user) => user.advisorId).length)}
      </div>
      <div class="admin-summary-grid">
        <div class="guidance-card"><span>Roles</span><strong>${escapeHtml(roleCopy)}</strong></div>
        <div class="guidance-card"><span>Plans</span><strong>${escapeHtml(planCopy)}</strong></div>
        <div class="guidance-card"><span>System status</span><strong>${escapeHtml(metrics.productionEnvironmentAdvisor?.nextAction || metrics.databaseModeAdvisor?.recommendedAction || "Review admin controls before production")}</strong></div>
      </div>
      <div class="admin-action-grid" data-system-admin-actions>
        ${quickActions.map(([label, copy]) => `
          <div class="admin-action-card">
            <span>${escapeHtml(label)}</span>
            <strong>${escapeHtml(copy)}</strong>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderReferenceMasterReview(referenceMaster = state.referenceMaster) {
  if (!referenceMaster) {
    return `
      <section class="chart-panel reference-master-panel" data-reference-master-review="true">
        <h3>Reference Master Review</h3>
        <p class="muted">Run <code>npm run reference:import</code> to create the local reference master before reviewing Sector and fundamental data.</p>
      </section>
    `;
  }

  const totals = referenceMaster.totals || {};
  const freshness = referenceMaster.freshness || {};
  const rows = referenceMaster.reviewQueue || [];

  return `
    <section class="chart-panel reference-master-panel" data-reference-master-review="true">
      <div class="section-title">
        <div>
          <h3>Reference Master Review</h3>
          <p class="muted">Review Sector and fundamental data used before the legacy CSV fallback.</p>
        </div>
        <span class="status-pill ${freshness.status === "fresh" ? "ready" : "blocked"}">${escapeHtml(freshness.status || "unknown")}</span>
      </div>
      <div class="metric-grid compact-grid">
        ${metric("Reference Rows", totals.totalRows || 0)}
        ${metric("Needs Review", totals.needsReviewRows || 0)}
        ${metric("Reviewed", totals.reviewedRows || 0)}
        ${metric("Stale Rows", totals.staleRows || 0)}
        ${metric("Oldest Update", freshness.oldestLastUpdated ? formatDate(freshness.oldestLastUpdated) : "-")}
        ${metric("Stale After", `${freshness.staleAfterDays || 30}d`)}
      </div>
      ${rows.length ? renderReferenceMasterReviewTable(rows) : "<p class=\"muted\">No records need review right now.</p>"}
    </section>
  `;
}

function renderDatabaseModeAdvisor(advisor) {
  if (!advisor) {
    return "";
  }

  const warnings = [...(advisor.blockers || []), ...(advisor.warnings || [])].slice(0, 5);
  const commands = advisor.commands || [];

  return `
    <section class="chart-panel database-mode-advisor" data-database-mode-advisor>
      <div class="section-title compact-title">
        <div>
          <span class="eyebrow">Database mode advisor</span>
          <h3>${escapeHtml(advisor.label || "Database mode")}</h3>
        </div>
        <span class="mode-status mode-status-${escapeHtml(advisor.status || "unknown")}">${escapeHtml(databaseModeStatusLabel(advisor.status))}</span>
      </div>
      <div class="metric-grid">
        ${metric("Current Adapter", advisor.adapter || "-")}
        ${metric("Best For", databaseModeUseLabel(advisor.mode))}
        ${metric("Production Ready", advisor.productionReady ? "Yes" : "No")}
        ${metric("Records Ready", state.businessMetrics?.storageReadiness?.status || "-")}
      </div>
      <div class="guidance-grid database-guidance-grid">
        <div class="guidance-card"><span>Current use</span><strong>${escapeHtml(advisor.currentUse || "-")}</strong></div>
        <div class="guidance-card"><span>Recommended next action</span><strong>${escapeHtml(advisor.recommendedAction || "-")}</strong></div>
        <div class="guidance-card"><span>Write mode</span><strong>${escapeHtml(advisor.writeMode || "-")}</strong></div>
        <div class="guidance-card"><span>Scoped reads</span><strong>${escapeHtml(advisor.scopedReads || "-")}</strong></div>
      </div>
      ${warnings.length ? `
        <div class="advisor-warning-list" data-database-mode-warnings>
          ${warnings.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      ` : ""}
      <div class="command-list database-command-list" data-database-mode-commands>
        ${commands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}
      </div>
    </section>
  `;
}

function databaseModeStatusLabel(status) {
  return {
    production_ready: "Production ready",
    needs_production_verification: "Needs verification",
    trial_only: "Trial only",
    prototype_only: "Prototype only",
  }[status] || "Needs review";
}

function databaseModeUseLabel(mode) {
  return {
    development_demo: "Development/Demo",
    trial_demo: "Trial/Demo",
    production: "Production",
  }[mode] || "Needs review";
}

function renderProductionEnvironmentAdvisor(advisor) {
  if (!advisor) {
    return "";
  }

  const groups = advisor.groups || [];
  const issues = [...(advisor.blockers || []), ...(advisor.warnings || [])].slice(0, 6);
  const commands = advisor.commands || [];

  return `
    <section class="chart-panel production-environment-advisor" data-production-environment-advisor>
      <div class="section-title compact-title">
        <div>
          <span class="eyebrow">Production environment advisor</span>
          <h3>${escapeHtml(advisor.healthLabel || "Production readiness")}</h3>
          <p class="muted">${escapeHtml(advisor.plainLanguageSummary || "Review environment readiness before production.")}</p>
        </div>
        <span class="env-status env-status-${escapeHtml(advisor.status || "needs_review")}">${escapeHtml(productionEnvironmentStatusLabel(advisor.status))}</span>
      </div>
      <div class="metric-grid">
        ${metric("Status", productionEnvironmentStatusLabel(advisor.status))}
        ${metric("Blockers", advisor.summary?.blockers || 0)}
        ${metric("Warnings", advisor.summary?.warnings || 0)}
        ${metric("Checks", advisor.summary?.totalChecks || 0)}
      </div>
      <div class="guidance-grid production-guidance-grid">
        <div class="guidance-card"><span>Next action</span><strong>${escapeHtml(advisor.nextAction || "-")}</strong></div>
        <div class="guidance-card"><span>Release guard</span><strong>${escapeHtml((advisor.releaseChecklist || [])[0] || "Attach release evidence before go-live.")}</strong></div>
        <div class="guidance-card"><span>Rollback guard</span><strong>${escapeHtml((advisor.rollbackChecklist || [])[0] || "Keep rollback steps ready before go-live.")}</strong></div>
        <div class="guidance-card"><span>Secret handling</span><strong>Environment values are summarized server-side and secrets stay masked.</strong></div>
      </div>
      <div class="env-group-grid" data-production-env-groups>
        ${groups.map((group) => `
          <article class="env-group-card ${escapeHtml(group.status || "needs_review")}">
            <span>${escapeHtml(productionEnvironmentStatusLabel(group.status))}</span>
            <strong>${escapeHtml(group.label || group.id)}</strong>
            <p>${escapeHtml(`${group.okCount || 0} ok · ${group.warningCount || 0} warning · ${group.blockerCount || 0} blocker`)}</p>
          </article>
        `).join("")}
      </div>
      ${issues.length ? `
        <div class="advisor-warning-list production-env-warning-list" data-production-env-warnings>
          ${issues.map((item) => `<p><strong>${escapeHtml(item.severity)}</strong> ${escapeHtml(item.message)}</p>`).join("")}
        </div>
      ` : ""}
      <div class="command-list production-command-list" data-production-env-commands>
        ${commands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}
      </div>
    </section>
  `;
}

function productionEnvironmentStatusLabel(status) {
  return {
    ready: "Ready",
    needs_review: "Needs review",
    blocked: "Blocked",
  }[status] || "Needs review";
}

function renderPortfolioDataHealth(health) {
  if (!health) {
    return `
      <section class="chart-panel portfolio-health-panel" data-portfolio-health-panel>
        <h3>Portfolio Data Health</h3>
        <p class="muted">Portfolio snapshot health is loading...</p>
      </section>
    `;
  }

  const commands = health.commands || [];
  const safeguards = health.safeguards || [];
  const filters = state.portfolioHealthFilters || defaultPortfolioHealthFilters();
  const snapshots = health.snapshots || [];
  const filteredSnapshots = filterPortfolioHealthSnapshots(snapshots, filters);
  const statusValues = ["all", ...new Set(snapshots.map((snapshot) => snapshot.status).filter(Boolean))];
  const rows = filteredSnapshots.map((snapshot) => ({
    Customer: snapshot.customerName || snapshot.shortUserId || snapshot.userId,
    Email: snapshot.customerEmail || "-",
    Workspace: snapshot.workspaceName || snapshot.organizationId || "-",
    Plan: snapshot.subscriptionPlan || "-",
    Status: portfolioHealthStatusLabel(snapshot.status),
    Holdings: snapshot.holdings,
    Market_Value: snapshot.marketValue,
    "Gain/Loss %": snapshot.gainLossPct,
    Generated: formatDateTime(snapshot.generatedAt),
  }));

  return `
    <section class="chart-panel portfolio-health-panel" data-portfolio-health-panel>
      <div class="section-title compact-title">
        <div>
          <span class="eyebrow">Portfolio support</span>
          <h3>Portfolio Data Health</h3>
          <p class="muted">${escapeHtml(health.plainLanguageSummary || "Review saved portfolio snapshots before customer support follow-up.")}</p>
        </div>
        <div class="launch-evidence-header-actions">
          <span class="status-pill ${health.status === "healthy" ? "ready" : "blocked"}">${escapeHtml(portfolioHealthStatusLabel(health.status))}</span>
          <a class="download-link" href="/api/admin/portfolio-health/export" data-portfolio-health-export>Download health CSV</a>
        </div>
      </div>
      <div class="metric-grid compact-grid">
        ${metric("Snapshots", health.totalSnapshots || 0)}
        ${metric("Healthy", health.healthySnapshots || 0)}
        ${metric("Zero Market", health.zeroMarketSnapshots || 0)}
        ${metric("Repairable", health.repairableSnapshots || 0)}
        ${metric("Skipped", health.skippedSnapshots || 0)}
        ${metric("Empty", health.emptySnapshots || 0)}
      </div>
      <div class="table-control-panel portfolio-health-controls" data-portfolio-health-controls>
        <div class="filter-bar compact-filter-bar">
          <label>
            Search customer
            <input data-portfolio-health-filter="query" value="${escapeHtml(filters.query || "")}" placeholder="Name, email, workspace, plan">
          </label>
          <label>
            Status
            <select data-portfolio-health-filter="status">
              ${statusValues.map((status) => option(status, status === "all" ? "All statuses" : portfolioHealthStatusLabel(status), filters.status || "all")).join("")}
            </select>
          </label>
          <label>
            Order by
            <select data-portfolio-health-filter="orderBy">
              ${[
                ["generatedAt", "Generated date"],
                ["status", "Status"],
                ["customerName", "Customer"],
                ["workspaceName", "Workspace"],
                ["marketValue", "Market value"],
              ].map(([value, label]) => option(value, label, filters.orderBy || "generatedAt")).join("")}
            </select>
          </label>
          <label>
            Direction
            <select data-portfolio-health-filter="direction">
              ${option("desc", "High/New first", filters.direction || "desc")}
              ${option("asc", "Low/Old first", filters.direction || "desc")}
            </select>
          </label>
        </div>
        <div class="table-control-status">
          <span>Showing ${formatNumber(filteredSnapshots.length)} of ${formatNumber(snapshots.length)} snapshots</span>
          <button class="ghost-button" type="button" data-portfolio-health-reset>Reset view</button>
        </div>
      </div>
      <div class="guidance-grid portfolio-health-guidance">
        <div class="guidance-card"><span>Support status</span><strong>${escapeHtml(health.plainLanguageSummary || "-")}</strong></div>
        <div class="guidance-card"><span>Safety rule</span><strong>Admin view is read-only. Use dry-run before any confirmed recovery.</strong></div>
        <div class="guidance-card"><span>Customer impact</span><strong>${health.repairableSnapshots ? "Some customers may see No Data until recovery is confirmed." : "No recovery action is needed right now."}</strong></div>
        <div class="guidance-card"><span>Generated</span><strong>${formatDateTime(health.generatedAt)}</strong></div>
      </div>
      <h3>Recovery commands</h3>
      <div class="command-list portfolio-health-command-list" data-portfolio-health-commands>
        ${commands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}
      </div>
      ${safeguards.length ? `
        <div class="advisor-warning-list portfolio-health-safeguards" data-portfolio-health-safeguards>
          ${safeguards.map((item) => `<p>${escapeHtml(item)}</p>`).join("")}
        </div>
      ` : ""}
      <h3>Recent snapshots</h3>
      ${renderTable(rows, ["Customer", "Email", "Workspace", "Plan", "Status", "Holdings", "Market_Value", "Gain/Loss %", "Generated"])}
    </section>
  `;
}

function portfolioHealthStatusLabel(status) {
  return {
    healthy: "Healthy",
    needs_recovery: "Needs recovery",
    needs_reference: "Needs reference",
    needs_review: "Needs review",
    repairable: "Repairable",
    empty: "Empty",
  }[status] || "Needs review";
}

function defaultPortfolioHealthFilters() {
  return {
    query: "",
    status: "all",
    orderBy: "generatedAt",
    direction: "desc",
  };
}

function filterPortfolioHealthSnapshots(snapshots, filters = state.portfolioHealthFilters) {
  const query = String(filters.query || "").trim().toLowerCase();
  const status = filters.status || "all";
  const orderBy = filters.orderBy || "generatedAt";
  const direction = filters.direction === "asc" ? "asc" : "desc";
  const statusRank = {
    repairable: 5,
    needs_recovery: 5,
    needs_reference: 4,
    needs_review: 3,
    empty: 2,
    healthy: 1,
  };

  return snapshots
    .filter((snapshot) => status === "all" || snapshot.status === status)
    .filter((snapshot) => {
      if (!query) {
        return true;
      }
      const haystack = [
        snapshot.customerName,
        snapshot.customerEmail,
        snapshot.workspaceName,
        snapshot.subscriptionPlan,
        snapshot.subscriptionStatus,
        snapshot.status,
        snapshot.userId,
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    })
    .sort((left, right) => {
      const leftValue = portfolioHealthSortValue(left, orderBy, statusRank);
      const rightValue = portfolioHealthSortValue(right, orderBy, statusRank);
      const comparison = typeof leftValue === "number" && typeof rightValue === "number"
        ? leftValue - rightValue
        : String(leftValue).localeCompare(String(rightValue));
      return direction === "asc" ? comparison : -comparison;
    });
}

function portfolioHealthSortValue(snapshot, orderBy, statusRank) {
  if (orderBy === "generatedAt") {
    return new Date(snapshot.generatedAt || 0).getTime();
  }
  if (orderBy === "marketValue") {
    return numberValue(snapshot.marketValue);
  }
  if (orderBy === "status") {
    return statusRank[snapshot.status] || 0;
  }
  return String(snapshot[orderBy] || "").toLowerCase();
}

function attachPortfolioHealthControls() {
  const controls = document.querySelector("[data-portfolio-health-controls]");
  if (!controls) {
    return;
  }

  controls.querySelectorAll("[data-portfolio-health-filter]").forEach((field) => {
    field.addEventListener("change", () => {
      state.portfolioHealthFilters = {
        ...defaultPortfolioHealthFilters(),
        ...state.portfolioHealthFilters,
        [field.dataset.portfolioHealthFilter]: field.value,
      };
      renderBusinessView();
    });
  });

  controls.querySelector("[data-portfolio-health-reset]")?.addEventListener("click", () => {
    state.portfolioHealthFilters = defaultPortfolioHealthFilters();
    renderBusinessView();
  });
}

function renderReferenceMasterReviewTable(rows) {
  return `
    <div class="table-wrap">
      <table class="reference-master-table">
        <thead>
          <tr>
            <th>Symbol</th>
            <th>Sector</th>
            <th>PE</th>
            <th>ROE</th>
            <th>Yield</th>
            <th>D/E</th>
            <th>Missing</th>
            <th>Note</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr data-reference-row="${escapeHtml(row.Symbol)}">
              <td><strong>${escapeHtml(row.Symbol)}</strong></td>
              <td><input data-reference-field="Sector" value="${escapeHtml(row.Sector || "Unknown")}" aria-label="Sector for ${escapeHtml(row.Symbol)}"></td>
              <td><input data-reference-field="PE" type="number" step="0.01" value="${escapeHtml(row.PE ?? 0)}" aria-label="PE for ${escapeHtml(row.Symbol)}"></td>
              <td><input data-reference-field="ROE" type="number" step="0.01" value="${escapeHtml(row.ROE ?? 0)}" aria-label="ROE for ${escapeHtml(row.Symbol)}"></td>
              <td><input data-reference-field="Yield" type="number" step="0.01" value="${escapeHtml(row.Yield ?? 0)}" aria-label="Yield for ${escapeHtml(row.Symbol)}"></td>
              <td><input data-reference-field="DE" type="number" step="0.01" value="${escapeHtml(row.DE ?? 0)}" aria-label="D/E for ${escapeHtml(row.Symbol)}"></td>
              <td>${escapeHtml((row.metadata?.missingFields || []).join(", ") || "-")}</td>
              <td><input data-reference-field="reviewNote" value="" placeholder="Review note" aria-label="Review note for ${escapeHtml(row.Symbol)}"></td>
              <td><button class="table-action" type="button" data-reference-save="${escapeHtml(row.Symbol)}">Save review</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderLaunchEvidenceCenter(evidence = state.launchEvidence) {
  if (!evidence) {
    return `
      <section class="chart-panel launch-evidence-panel" data-launch-evidence-center="true">
        <h3>Launch Evidence Center</h3>
        <p class="muted">Launch evidence is loading...</p>
      </section>
    `;
  }

  const items = evidence.items || [];
  const commands = evidence.preflightCommands || [];
  const rows = items.map((item) => ({
    Evidence: item.title,
    Status: evidenceStatusLabel(item.status),
    Marker: item.markerEnv,
    Category: item.category,
  }));

  return `
    <section class="chart-panel launch-evidence-panel" data-launch-evidence-center="true">
      <div class="section-title compact-title">
        <div>
          <p class="eyebrow">Go-live evidence</p>
          <h3>Launch Evidence Center</h3>
        </div>
        <div class="launch-evidence-header-actions">
          <span class="status-pill ${evidence.status === "ready" ? "ready" : ""}">${escapeHtml(evidence.status || "needs_evidence")}</span>
          <button class="ghost-button" type="button" data-launch-evidence-copy="true">Copy sign-off pack</button>
          <button class="ghost-button download-link" type="button" data-launch-evidence-download="json">Download JSON</button>
        </div>
      </div>
      ${state.launchEvidenceExportMessage ? `<p class="muted launch-evidence-export-message">${escapeHtml(state.launchEvidenceExportMessage)}</p>` : ""}
      <div class="metric-grid">
        ${metric("Ready Evidence", evidence.summary?.ready || 0)}
        ${metric("Pending Evidence", evidence.summary?.pending || 0)}
        ${metric("Blocked Evidence", evidence.summary?.blocked || 0)}
        ${metric("Evidence Items", evidence.summary?.total || items.length)}
      </div>
      ${renderReferenceMasterLaunchEvidence(evidence.referenceMaster)}
      <div class="launch-evidence-grid">
        ${items.map((item) => `
          <article class="launch-evidence-card ${escapeHtml(item.status || "pending")}">
            <span>${escapeHtml(item.category || "launch")}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.evidence || "-")}</p>
            <code>${escapeHtml(item.command || "-")}</code>
          </article>
        `).join("")}
      </div>
      <h3>Evidence checklist</h3>
      ${renderTable(rows, ["Evidence", "Status", "Marker", "Category"])}
      <h3>Preflight commands</h3>
      <div class="command-list">
        ${commands.map((command) => `<code>${escapeHtml(command)}</code>`).join("")}
      </div>
      <div class="guidance-grid">
        ${(evidence.guardrails || []).slice(0, 4).map((item) => `<div class="guidance-card"><span>Guardrail</span><strong>${escapeHtml(item)}</strong></div>`).join("")}
      </div>
    </section>
  `;
}

function renderReferenceMasterLaunchEvidence(referenceMasterEvidence) {
  if (!referenceMasterEvidence) {
    return "";
  }

  const requiredMarkers = (referenceMasterEvidence.items || [])
    .flatMap((item) => (item.requiredEvidence || []).map((requirement) => ({
      item: item.title,
      ...requirement,
    })));

  return `
    <div class="reference-launch-evidence" data-reference-master-launch-evidence="true">
      <div class="section-title compact-title">
        <div>
          <p class="eyebrow">Reference data go-live</p>
          <h3>Reference master launch evidence</h3>
          <p class="muted">Shows freshness and migration readiness evidence only. The browser does not execute these commands.</p>
        </div>
        <span class="status-pill ${referenceMasterEvidence.status === "ready" ? "ready" : ""}">${escapeHtml(referenceMasterEvidence.status || "needs_evidence")}</span>
      </div>
      <div class="guidance-grid">
        ${(referenceMasterEvidence.items || []).map((item) => `
          <div class="guidance-card">
            <span>${escapeHtml(evidenceStatusLabel(item.status))}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <code>${escapeHtml(item.command || "-")}</code>
          </div>
        `).join("")}
      </div>
      ${requiredMarkers.length ? `
        <div class="evidence-marker-list">
          ${requiredMarkers.map((marker) => `
            <div>
              <span>${escapeHtml(marker.ready ? "Ready" : "Missing")}</span>
              <strong>${escapeHtml(marker.label)}</strong>
              <code>${escapeHtml(marker.env)}</code>
            </div>
          `).join("")}
        </div>
      ` : ""}
    </div>
  `;
}

async function copyLaunchEvidencePack(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Copying...";

  try {
    const response = await fetch("/api/admin/launch-evidence/export?format=text");
    if (!response.ok) {
      throw new Error(`Export failed with HTTP ${response.status}`);
    }

    const text = await response.text();
    await copyTextToClipboard(text);
    state.launchEvidenceExportMessage = "Sign-off pack copied. It is sanitized and ready for owner/admin review.";
    await loadAuditEvents();
  } catch (error) {
    state.launchEvidenceExportMessage = `Could not copy sign-off pack: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    if (state.activeView === "business") {
      renderBusinessView();
    }
  }
}

async function downloadLaunchEvidencePack(button) {
  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Preparing...";

  try {
    const response = await fetch("/api/admin/launch-evidence/export?format=json");
    if (!response.ok) {
      throw new Error(`Export failed with HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const fileName = downloadFileName(response.headers.get("content-disposition")) || "stockflix-launch-evidence.json";
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    state.launchEvidenceExportMessage = "Sign-off pack downloaded. The export event is recorded in Recent activity.";
    await loadAuditEvents();
  } catch (error) {
    state.launchEvidenceExportMessage = `Could not download sign-off pack: ${error.message}`;
  } finally {
    button.disabled = false;
    button.textContent = originalText;
    if (state.activeView === "business") {
      renderBusinessView();
    }
  }
}

async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand("copy");
  document.body.removeChild(textArea);
}

function downloadFileName(contentDisposition = "") {
  const match = String(contentDisposition).match(/filename="?([^"]+)"?/i);
  return match ? match[1] : "";
}

function renderOperationalReadiness(readiness) {
  if (!readiness) {
    return `
      <section class="chart-panel">
        <h3>Operational readiness</h3>
        <p class="muted">Operational checks are loading...</p>
      </section>
    `;
  }

  const alerts = readiness.alerts || [];
  const topAlerts = alerts.slice(0, 6);
  const alertRows = topAlerts.map((item) => ({
    Severity: item.severity,
    Alert: item.title,
    Action: item.message,
  }));

  return `
    <section class="chart-panel">
      <h3>Operational readiness</h3>
      <div class="metric-grid">
        ${metric("Status", readiness.status || "unknown")}
        ${metric("Critical", readiness.summary?.criticalAlerts || 0)}
        ${metric("Warnings", readiness.summary?.warningAlerts || 0)}
        ${metric("Generated", readiness.generatedAt ? new Date(readiness.generatedAt).toLocaleTimeString() : "-")}
      </div>
      <div class="ops-alert-grid">
        ${(topAlerts.length ? topAlerts : [{ severity: "ok", title: "No alerts", message: "Operational readiness checks are clean." }]).map((item) => `
          <div class="ops-alert-card ${escapeHtml(item.severity)}">
            <span>${escapeHtml(item.severity)}</span>
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.message)}</p>
          </div>
        `).join("")}
      </div>
      ${alertRows.length ? renderTable(alertRows, ["Severity", "Alert", "Action"]) : ""}
    </section>
  `;
}

function evidenceStatusLabel(status) {
  return {
    ready: "Ready",
    pending: "Pending",
    blocked: "Blocked",
  }[status] || status || "Pending";
}

function renderApprovalsView() {
  const requests = state.approvalRequests || [];
  const pending = requests.filter((request) => request.status === "pending").length;
  const approved = requests.filter((request) => request.status === "approved").length;
  const rejected = requests.filter((request) => request.status === "rejected").length;

  viewOutput.innerHTML = `
    <div class="metric-grid">
      ${metric("Pending", pending)}
      ${metric("Approved", approved)}
      ${metric("Rejected", rejected)}
      ${metric("Visible Requests", requests.length)}
    </div>
    ${renderApprovalWorkspace(requests)}
  `;
  attachApprovalActions();
}

function renderScreenerTooltip(tipKey) {
  const tip = screenerFilterTips[tipKey];
  const tooltipId = `screener-tip-${tipKey}`;

  return `
    <span class="screener-help-wrap" data-screener-tooltip="${escapeHtml(tipKey)}">
      <button class="tooltip-trigger" type="button" aria-label="Explain ${escapeHtml(tip.title)}" aria-describedby="${tooltipId}">?</button>
      <span id="${tooltipId}" class="tooltip-card" role="tooltip">
        <strong>${escapeHtml(tip.title)}</strong>
        <span>คืออะไร: ${escapeHtml(tip.meaning)}</span>
        <span>ค่าที่น่าเริ่มใช้: ${escapeHtml(tip.goodValue)}</span>
        <span>ข้อควรระวัง: ${escapeHtml(tip.caution)}</span>
      </span>
    </span>
  `;
}

function renderScreenerFilterField({ id, label, tipKey, hint, controlHtml }) {
  return `
    <div class="filter-field" data-screener-filter-help="${escapeHtml(tipKey)}">
      <div class="filter-label-row">
        <label class="filter-label-text" for="${escapeHtml(id)}">${escapeHtml(label)}</label>
        ${renderScreenerTooltip(tipKey)}
      </div>
      ${controlHtml}
      <small id="${escapeHtml(id)}Hint" class="filter-help-text">${escapeHtml(hint)}</small>
    </div>
  `;
}

function renderScreenerView() {
  if (!state.recommendations.length) {
    viewOutput.innerHTML = `<p class="muted">Run analysis to load stock recommendations.</p>`;
    return;
  }

  const sectors = uniqueValues(state.recommendations.map((row) => row.Sector || "Unknown"));
  const trends = uniqueValues(state.recommendations.map((row) => row.Trend_Status || "Unknown"));
  viewOutput.innerHTML = `
    <section class="screener-beginner-guide" data-screener-beginner-guidance data-screener-strict-defaults>
      <div>
        <strong>Beginner filter guide</strong>
        <span>ค่าเริ่มต้นคัดเฉพาะหุ้นที่เริ่มน่าสนใจสำหรับมือใหม่: Score 70+, RRR 1.5+, D/E <= 1.0. ลองลดค่าทีละช่องถ้าต้องการดูหุ้นเพิ่ม.</span>
      </div>
      <span>ใช้ Search เพื่อหาหุ้นตาม Symbol หรือชื่อที่อยู่ในข้อมูล แล้วกด ? เพื่อดูความหมายของแต่ละ filter</span>
    </section>
    <div class="filter-bar">
      ${renderScreenerFilterField({
        id: "symbolSearch",
        label: "Search stock",
        tipKey: "symbol",
        hint: "พิมพ์ Symbol เช่น PTT, AOT, CPALL เพื่อหาหุ้นที่สนใจ",
        controlHtml: '<input id="symbolSearch" type="search" placeholder="Search symbol or stock name" autocomplete="off" aria-describedby="screener-tip-symbol symbolSearchHint" data-screener-symbol-search>',
      })}
      ${renderScreenerFilterField({
        id: "minScore",
        label: "Min Score",
        tipKey: "minScore",
        hint: "ค่าเริ่มต้น 70+ เพื่อคัดหุ้นคุณภาพสูงก่อน",
        controlHtml: '<input id="minScore" type="number" min="0" max="100" value="70" aria-describedby="screener-tip-minScore minScoreHint" data-screener-default-score>',
      })}
      ${renderScreenerFilterField({
        id: "minRrr",
        label: "Min RRR",
        tipKey: "minRrr",
        hint: "ค่าเริ่มต้น 1.5+ เพื่อให้ผลตอบแทนคุ้มความเสี่ยงขั้นต่ำ",
        controlHtml: '<input id="minRrr" type="number" min="-10" step="0.1" value="1.5" aria-describedby="screener-tip-minRrr minRrrHint" data-screener-default-rrr>',
      })}
      ${renderScreenerFilterField({
        id: "maxDe",
        label: "Max D/E",
        tipKey: "maxDe",
        hint: "ค่าเริ่มต้นไม่เกิน 1.0 เพื่อลดความเสี่ยงจากหนี้สูง",
        controlHtml: '<input id="maxDe" type="number" min="0" step="0.1" value="1" aria-describedby="screener-tip-maxDe maxDeHint" data-screener-default-de>',
      })}
      ${renderScreenerFilterField({
        id: "sectorFilter",
        label: "Sector",
        tipKey: "sector",
        hint: "เลือกกลุ่มธุรกิจที่เข้าใจก่อน หรือเลือก All sectors เพื่อดูภาพรวม",
        controlHtml: `<select id="sectorFilter" aria-describedby="screener-tip-sector sectorFilterHint">
          <option value="">All sectors</option>
          ${sectors.map((sector) => option(sector, sector, "")).join("")}
        </select>`,
      })}
      ${renderScreenerFilterField({
        id: "trendFilter",
        label: "Trend",
        tipKey: "trend",
        hint: "มือใหม่ควรระวังหุ้น Bearish และใช้ trend เป็นข้อมูลประกอบเท่านั้น",
        controlHtml: `<select id="trendFilter" aria-describedby="screener-tip-trend trendFilterHint">
          <option value="">All trends</option>
          ${trends.map((trend) => option(trend, trend, "")).join("")}
        </select>`,
      })}
    </div>
    <p id="screenerFilterStatus" class="muted"></p>
    <div id="screenerTable"></div>
  `;

  const symbolSearch = document.querySelector("#symbolSearch");
  const minScore = document.querySelector("#minScore");
  const minRrr = document.querySelector("#minRrr");
  const maxDe = document.querySelector("#maxDe");
  const sectorFilter = document.querySelector("#sectorFilter");
  const trendFilter = document.querySelector("#trendFilter");
  const filterStatus = document.querySelector("#screenerFilterStatus");
  const renderFiltered = () => {
    const searchText = String(symbolSearch.value || "").trim().toUpperCase();
    const rows = state.recommendations
      .filter((row) => {
        if (!searchText) return true;
        return [row.Symbol, row.Name, row.Company, row.Security_Name, row.Sector]
          .some((value) => String(value || "").toUpperCase().includes(searchText));
      })
      .filter((row) => numberValue(row.Total_Score) >= numberValue(minScore.value))
      .filter((row) => numberValue(row.RRR) >= numberValue(minRrr.value))
      .filter((row) => numberValue(row.DE) <= numberValue(maxDe.value))
      .filter((row) => !sectorFilter.value || (row.Sector || "Unknown") === sectorFilter.value)
      .filter((row) => !trendFilter.value || (row.Trend_Status || "Unknown") === trendFilter.value)
      .slice(0, 100);
    const activeFilters = [
      searchText ? `search ${searchText}` : "",
      sectorFilter.value ? `sector ${sectorFilter.value}` : "",
      trendFilter.value ? `trend ${trendFilter.value}` : "",
      numberValue(minScore.value) > 0 ? `score >= ${formatNumber(minScore.value)}` : "",
      numberValue(minRrr.value) > -10 ? `RRR >= ${formatNumber(minRrr.value)}` : "",
      numberValue(maxDe.value) < 99 ? `D/E <= ${formatNumber(maxDe.value)}` : "",
    ].filter(Boolean);
    filterStatus.textContent = activeFilters.length
      ? `${formatNumber(rows.length)} stocks match ${activeFilters.join(" · ")}. Click a stock in the charts to highlight its table row, or click a sector bar to drill down.`
      : `${formatNumber(rows.length)} stocks shown from the latest analysis with beginner defaults. Adjust filters if you want to broaden the list.`;
    document.querySelector("#screenerTable").innerHTML = `
      ${renderThink2SafetySummary(rows, { context: "screener" })}
      ${renderScoreMatrixGuide(rows)}
      ${renderScreenerInsights(rows, {
        selectedSector: sectorFilter.value,
        filterSummary: activeFilters.length ? activeFilters.join(" · ") : "beginner defaults",
        scoreThreshold: numberValue(minScore.value),
        rrrThreshold: numberValue(minRrr.value),
      })}
      <p class="muted table-focus-status" data-stock-highlight-status>Click a stock in Quality vs reward or Top ideas to focus its table row.</p>
      ${renderTable(rows, [
        "Symbol",
        "Sector",
        "Price",
        "Total_Score",
        "Quality_Score",
        "Valuation_Score",
        "Setup_Score",
        "RRR",
        "Technical_RRR",
        "Fundamental_RRR_Status",
        "Conflict_Severity",
        "Conflict_Alerts",
        "Upside_Pct",
        "PE",
        "ROE",
        "DE",
        "RSI",
        "Rationale",
      ], { stockHighlight: true })}
    `;
    document.querySelectorAll("[data-sector-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        sectorFilter.value = button.dataset.sectorFilter || "";
        renderFiltered();
      });
    });
    attachStockHighlightControls(document.querySelector("#screenerTable"));
  };

  [symbolSearch, minScore, minRrr, maxDe].forEach((input) => {
    input.addEventListener("input", renderFiltered);
    input.addEventListener("change", renderFiltered);
  });
  [sectorFilter, trendFilter].forEach((input) => input.addEventListener("change", renderFiltered));
  renderFiltered();
}

function renderSectorView() {
  if (!state.recommendations.length) {
    viewOutput.innerHTML = `<p class="muted">Run analysis to load sector data.</p>`;
    return;
  }

  const sectors = groupBy(state.recommendations, "Sector");
  const sectorNames = Object.keys(sectors).sort((left, right) => {
    if (left === "Unknown") return 1;
    if (right === "Unknown") return -1;
    return left.localeCompare(right);
  });
  const sectorInsights = buildSectorInsights(sectors, state.portfolioRows);

  viewOutput.innerHTML = `
    <section class="sector-pro-panel" data-sector-pro-intelligence data-sector-default-all>
      <div>
        <span class="eyebrow">Pro Sector Intelligence</span>
        <h3>เริ่มจากภาพรวมทุกกลุ่ม ก่อนเลือกหุ้นรายตัว</h3>
        <p class="muted">ค่าเริ่มต้นแสดงทุกหุ้นในทุก sector เพื่อไม่ให้เข้าใจผิดว่าข้อมูลเหลือหุ้นตัวเดียว แล้วค่อยเลือก sector ที่ต้องการเจาะลึก</p>
      </div>
    </section>
    <div class="filter-bar">
      <label>
        Sector
        <select id="sectorSelect">
          <option value="__all" selected>All sectors overview</option>
          ${sectorNames.map((sector) => `<option value="${escapeHtml(sector)}">${escapeHtml(sector)}</option>`).join("")}
        </select>
      </label>
      <label>
        Min Score
        <input id="sectorMinScore" type="number" min="0" max="100" value="0" data-sector-score-filter>
      </label>
      <label>
        Price position line
        <input id="sectorPricePositionThreshold" type="number" min="0" max="100" value="60" data-sector-price-position-filter>
      </label>
    </div>
    <div id="sectorDetails"></div>
    <details class="advanced-sector-details" data-sector-advanced-table>
      <summary>ดูตารางตัวเลขขั้นสูงของทุก Sector</summary>
      ${renderTable(sectorInsights, ["Rank", "Sector", "Sector_Score", "Rotation_Signal", "Portfolio_Exposure_Pct", "Portfolio_Risk", "Avg_Score", "Avg_RRR", "Top_Ideas", "Leader"])}
    </details>
  `;

  const sectorSelect = document.querySelector("#sectorSelect");
  const sectorMinScore = document.querySelector("#sectorMinScore");
  const sectorPricePositionThreshold = document.querySelector("#sectorPricePositionThreshold");
  const renderDetails = () => {
    const selectedSector = sectorSelect.value;
    const isAllSectors = selectedSector === "__all";
    const minScore = numberValue(sectorMinScore.value);
    const pricePositionThreshold = clamp(numberValue(sectorPricePositionThreshold.value || 60), 0, 100);
    const sectorRows = (isAllSectors ? state.recommendations : (sectors[selectedSector] || []))
      .filter((row) => numberValue(row.Total_Score) >= minScore)
      .slice()
      .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score));
    const leader = sectorRows[0];
    const stats = getSectorStats(sectorRows);
    const insight = isAllSectors
      ? { ...(sectorInsights[0] || {}), Sector: "All sectors overview", Rotation_Signal: "Neutral", Portfolio_Risk: "No holding" }
      : sectorInsights.find((item) => item.Sector === selectedSector) || sectorInsights[0];
    document.querySelector("#sectorDetails").innerHTML = `
      ${renderSectorBeginnerSummary(sectorInsights, insight)}
      <div class="metric-grid">
        ${metric("Sector", isAllSectors ? "All sectors" : selectedSector)}
        ${metric(isAllSectors ? "หุ้นที่แสดง" : "คะแนนกลุ่ม", isAllSectors ? `${formatNumber(sectorRows.length)} stocks` : `${formatNumber(insight?.Sector_Score || 0)} / 100`)}
        ${metric("สัญญาณ", isAllSectors ? "ดูภาพรวมก่อน" : beginnerSignalText(insight?.Rotation_Signal))}
        ${metric("ความเสี่ยงพอร์ต", isAllSectors ? "เลือก sector เพื่อดูรายกลุ่ม" : beginnerRiskText(insight?.Portfolio_Risk))}
        ${metric("สัดส่วนในพอร์ต", isAllSectors ? "ทุกกลุ่ม" : `${formatNumber(insight?.Portfolio_Exposure_Pct || 0)}%`)}
        ${metric("Leader", leader ? `${leader.Symbol} (${formatNumber(leader.Total_Score)})` : "-")}
      </div>
      ${isAllSectors ? `<p class="muted">ตอนนี้แสดงหุ้นทั้งหมดจาก analysis ล่าสุด หากต้องการดูหุ้นในกลุ่มเดียว ให้เลือก sector จาก dropdown หรือกดการ์ด sector ด้านล่าง</p>` : ""}
      ${renderSectorProInsights(sectorInsights, insight)}
      ${renderSectorVisuals(sectorRows, stats, {
        filterSummary: `${isAllSectors ? "All sectors" : selectedSector} · score >= ${formatNumber(minScore)} · price line ${formatNumber(pricePositionThreshold)}`,
        scoreThreshold: minScore,
        pricePositionThreshold,
      })}
      <p class="muted table-focus-status" data-stock-highlight-status>Click a stock in Sector leaders or Timing vs quality to focus its table row.</p>
      ${renderTable(sectorRows, ["Symbol", "Price", "Total_Score", "RRR", "Upside_Pct", "Price_Position", "PE", "ROE", "Yield", "DE", "Trend_Status", "Rationale"], { stockHighlight: true })}
    `;
    attachStockHighlightControls(document.querySelector("#sectorDetails"));
    attachSectorSelectionControls(sectorSelect, renderDetails);
  };

  sectorSelect.addEventListener("change", renderDetails);
  [sectorMinScore, sectorPricePositionThreshold].forEach((input) => {
    input.addEventListener("input", renderDetails);
    input.addEventListener("change", renderDetails);
  });
  renderDetails();
}

function renderSimulationView() {
  viewOutput.innerHTML = `
    <form id="simulationForm" class="inline-form">
      <label>Symbol <input name="symbol" value="CPALL" autocomplete="off"></label>
      <label>Initial Capital <input name="initialCapital" type="number" min="1000" step="1000" value="100000"></label>
      <label>Years Back <input name="yearsBack" type="number" min="1" max="3" value="1"></label>
      <label>Buy Mode
        <select name="buyMode" data-simulation-buy-mode>
          <option value="lump_sum">Lump Sum - buy with full cash when signal appears</option>
          <option value="split">Split Buy - divide cash into tranches</option>
        </select>
      </label>
      <label>Buy Tranches <input name="tranches" type="number" min="2" max="24" value="5" data-simulation-split-input></label>
      <label>Trading Days Between Tranches <input name="trancheIntervalDays" type="number" min="1" max="252" value="20" data-simulation-split-input></label>
      <button type="submit">Run Simulation</button>
    </form>
    <p class="muted simulation-hint" data-simulation-split-hint>Split Buy example: 100,000 THB divided into 5 tranches means 20,000 THB is made available each tranche.</p>
    <div id="simulationOutput" class="simulation-output muted">Enter inputs and run the simulation.</div>
  `;

  document.querySelector("#simulationForm").addEventListener("submit", runSimulation);
  attachSimulationBuyModeControls();
}

function attachSimulationBuyModeControls() {
  const buyMode = document.querySelector("[data-simulation-buy-mode]");
  const splitInputs = [...document.querySelectorAll("[data-simulation-split-input]")];
  const updateSplitInputs = () => {
    const isSplit = buyMode?.value === "split";
    splitInputs.forEach((input) => {
      input.disabled = !isSplit;
      input.closest("label")?.classList.toggle("muted-control", !isSplit);
    });
  };
  buyMode?.addEventListener("change", updateSplitInputs);
  updateSplitInputs();
}

async function runSimulation(event) {
  event.preventDefault();
  const output = document.querySelector("#simulationOutput");
  output.textContent = "Running simulation...";

  const formData = new FormData(event.target);
  const response = await fetch("/api/simulation/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(Object.fromEntries(formData.entries())),
  });
  const data = await response.json();

  if (!data.ok) {
    output.textContent = data.message || "Simulation failed.";
    return;
  }

  output.classList.remove("muted");
  output.innerHTML = `
    <div class="metric-grid">
      ${metric("Strategy Value", money(data.summary?.finalValue || 0))}
      ${metric("Strategy ROI", `${formatNumber(data.summary?.roi || 0)}%`)}
      ${metric("Buy & Hold ROI", `${formatNumber(data.summary?.buyHoldRoi || 0)}%`)}
      ${metric("Trades", data.summary?.totalTrades || 0)}
      ${metric("Buy Mode", simulationBuyModeLabel(data.buyPlan))}
      ${metric("Avg Cost", money(data.summary?.averageCost || 0))}
      ${metric("Completed Tranches", `${formatNumber(data.summary?.completedTranches || 0)} / ${formatNumber(data.buyPlan?.tranches || 1)}`)}
      ${metric("Cash Deployed", money(data.summary?.deployedCapital || 0))}
    </div>
    ${renderSimulationBuyPlan(data.buyPlan)}
    ${renderSimulationGrowthChart(data.history || [], data.symbol)}
    <h3>Recent Portfolio History</h3>
    ${renderTable((data.history || []).slice(-20), ["Date", "Price", "Portfolio_Value", "Buy_Hold_Value", "Cash", "Shares", "Deployed_Capital", "Action"])}
    <h3>Trade History</h3>
    ${renderTable(data.trades || [], ["Date", "Action", "Price", "Shares", "Cost"])}
  `;
  await loadAuditEvents();
}

function simulationBuyModeLabel(buyPlan = {}) {
  return buyPlan.mode === "split" ? `Split Buy (${formatNumber(buyPlan.tranches || 0)} tranches)` : "Lump Sum";
}

function renderSimulationBuyPlan(buyPlan = {}) {
  if (!buyPlan || buyPlan.mode !== "split") {
    return `<p class="muted simulation-plan-note" data-simulation-buy-plan>Lump Sum mode keeps the original strategy behavior: cash is available at the start of the simulation.</p>`;
  }

  return `
    <section class="chart-panel simulation-plan-note" data-simulation-buy-plan>
      <h3>Split Buy Plan</h3>
      <p class="muted">Capital is divided equally before strategy rules decide whether each tranche should buy.</p>
      <div class="metric-grid compact-metrics">
        ${metric("Tranches", formatNumber(buyPlan.tranches || 0))}
        ${metric("Amount / Tranche", money(buyPlan.amountPerTranche || 0))}
        ${metric("Trading Days Gap", formatNumber(buyPlan.trancheIntervalDays || 0))}
        ${metric("Completed", formatNumber(buyPlan.completedTranches || 0))}
      </div>
    </section>
  `;
}

function renderSimulationGrowthChart(history = [], symbol = "") {
  const rows = history
    .filter((row) => numberValue(row.Portfolio_Value) || numberValue(row.Buy_Hold_Value))
    .slice(-260);
  if (rows.length < 2) {
    return `
      <section class="chart-panel simulation-growth-panel" data-simulation-growth-chart>
        <h3>Portfolio Growth: Strategy vs Buy & Hold</h3>
        <p class="muted">Run a longer simulation to show the growth chart.</p>
      </section>
    `;
  }

  const width = 920;
  const height = 330;
  const padding = { top: 28, right: 144, bottom: 44, left: 72 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = rows.flatMap((row) => [numberValue(row.Portfolio_Value), numberValue(row.Buy_Hold_Value)]);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = Math.max(maxValue - minValue, 1);
  const yMin = Math.max(0, minValue - valueRange * 0.08);
  const yMax = maxValue + valueRange * 0.08;
  const yRange = Math.max(yMax - yMin, 1);
  const xFor = (index) => padding.left + (index / Math.max(rows.length - 1, 1)) * chartWidth;
  const yFor = (value) => padding.top + (1 - ((numberValue(value) - yMin) / yRange)) * chartHeight;
  const strategyPoints = rows.map((row, index) => `${xFor(index)},${yFor(row.Portfolio_Value)}`).join(" ");
  const buyHoldPoints = rows.map((row, index) => `${xFor(index)},${yFor(row.Buy_Hold_Value)}`).join(" ");
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (yRange / 4) * index);
  const xTicks = pickChartTicks(rows, 5);
  const lastStrategy = numberValue(rows.at(-1)?.Portfolio_Value);
  const lastBuyHold = numberValue(rows.at(-1)?.Buy_Hold_Value);
  const winner = lastStrategy >= lastBuyHold ? "Strategy" : "Buy & Hold";

  return `
    <section class="chart-panel simulation-growth-panel" data-simulation-growth-chart>
      <div class="simulation-chart-heading">
        <div>
          <h3>Portfolio Growth: Strategy vs Buy & Hold</h3>
          <p class="muted">Backtest Result: ${escapeHtml(symbol || "-")}</p>
        </div>
        <div class="simulation-chart-winner" data-simulation-chart-winner>
          <span>Better in this run</span>
          <strong>${escapeHtml(winner)}</strong>
        </div>
      </div>
      <div class="simulation-chart-frame">
        <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Portfolio growth strategy versus buy and hold">
          ${yTicks.map((tick) => {
            const y = yFor(tick);
            return `
              <line class="simulation-grid-line" x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}"></line>
              <text class="axis-text" x="12" y="${y + 4}">${escapeHtml(compactMoney(tick))}</text>
            `;
          }).join("")}
          ${xTicks.map(({ row, index }) => `
            <text class="axis-text" x="${xFor(index) - 26}" y="${height - 12}">${escapeHtml(shortMonth(row.Date))}</text>
          `).join("")}
          <line class="axis-line" x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}"></line>
          <line class="axis-line" x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}"></line>
          <polyline class="simulation-line strategy-line" points="${strategyPoints}"></polyline>
          <polyline class="simulation-line buy-hold-line" points="${buyHoldPoints}"></polyline>
          <circle class="simulation-end-point strategy-point" cx="${xFor(rows.length - 1)}" cy="${yFor(lastStrategy)}" r="4"></circle>
          <circle class="simulation-end-point buy-hold-point" cx="${xFor(rows.length - 1)}" cy="${yFor(lastBuyHold)}" r="4"></circle>
          <g class="simulation-legend" transform="translate(${width - padding.right + 18}, ${padding.top + 10})">
            <line class="simulation-line strategy-line" x1="0" y1="0" x2="26" y2="0"></line>
            <text class="axis-text" x="34" y="4">Strategy</text>
            <line class="simulation-line buy-hold-line" x1="0" y1="26" x2="26" y2="26"></line>
            <text class="axis-text" x="34" y="30">Buy & Hold</text>
          </g>
          <text class="axis-text" x="${width / 2 - 22}" y="${height - 2}">Time</text>
          <text class="axis-text" x="12" y="18">Capital</text>
        </svg>
      </div>
      <details class="chart-reading-guide" data-simulation-chart-guide open>
        <summary>วิธีอ่านกราฟนี้</summary>
        <ul>
          <li><strong>เส้น Strategy</strong> คือมูลค่าพอร์ตตามกฎซื้อ/ขายของระบบ รวมเงินสดและหุ้นที่ถืออยู่</li>
          <li><strong>เส้น Buy & Hold</strong> คือถ้าเอาเงินทั้งหมดซื้อครั้งเดียวแล้วถือยาว ไม่ปรับพอร์ต</li>
          <li>ถ้าเส้น Strategy อยู่เหนือ Buy & Hold แปลว่ากลยุทธ์ในรอบนี้ทำได้ดีกว่าการซื้อถือเฉยๆ</li>
          <li>ถ้าเส้นแกว่งแรง ให้ดู Trade History ประกอบว่าเกิดจากซื้อเพิ่ม, take profit หรือ stop loss</li>
        </ul>
      </details>
    </section>
  `;
}

function pickChartTicks(rows, count) {
  if (!rows.length) return [];
  const maxIndex = rows.length - 1;
  return Array.from({ length: count }, (_, tickIndex) => {
    const index = Math.round((tickIndex / Math.max(count - 1, 1)) * maxIndex);
    return { row: rows[index], index };
  }).filter((item, index, list) => list.findIndex((candidate) => candidate.index === item.index) === index);
}

function shortMonth(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

function compactMoney(value) {
  const number = numberValue(value);
  if (Math.abs(number) >= 1000000) return `${formatNumber(number / 1000000)}m`;
  if (Math.abs(number) >= 1000) return `${formatNumber(number / 1000)}k`;
  return formatNumber(number);
}

function renderPortfolioVisuals(rows) {
  const sectorExposure = breakdownBy(rows, (row) => row.Sector || "Unknown", "Market_Value");
  const actionMix = breakdownBy(rows, actionGroup, () => 1, 5);
  const scoreBands = [
    { label: "Strong 70+", value: rows.filter((row) => numberValue(row.Total_Score) >= 70).length, filterValue: "strong" },
    { label: "Watch 45-69", value: rows.filter((row) => numberValue(row.Total_Score) >= 45 && numberValue(row.Total_Score) < 70).length, filterValue: "watch" },
    { label: "Risk <45", value: rows.filter((row) => numberValue(row.Total_Score) < 45).length, filterValue: "risk" },
  ];

  return `
    <div class="visual-grid">
      <section class="chart-panel">
        <h3>Sector exposure</h3>
        <p class="muted visual-filter-hint" data-sector-exposure-complete>แสดง sector จริงทั้งหมดในพอร์ต ไม่มีการรวมเป็น Other</p>
        ${renderBarList(sectorExposure, { action: "recommended-sector-filter", valueFormatter: money })}
      </section>
      <section class="chart-panel">
        <h3>Action mix</h3>
        ${renderBarList(actionMix, { action: "recommended-action-filter", valueFormatter: (value) => `${formatNumber(value)} holdings` })}
      </section>
      <section class="chart-panel">
        <h3>Score distribution</h3>
        ${renderBarList(scoreBands, { action: "recommended-score-filter", valueFormatter: (value) => `${formatNumber(value)} holdings` })}
      </section>
    </div>
  `;
}

function renderScreenerInsights(rows, options = {}) {
  if (!rows.length) {
    return "";
  }

  const scoreThreshold = clamp(numberValue(options.scoreThreshold ?? 70), 0, 100);
  const rrrThreshold = clamp(numberValue(options.rrrThreshold ?? 1.5), 0, 5);
  const topIdeas = rows
    .slice()
    .sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))
    .slice(0, 5)
    .map((row) => ({
      label: row.Symbol,
      value: numberValue(row.Total_Score),
      caption: `RRR ${formatNumber(row.RRR)} · ${row.Sector || "Unknown"}`,
    }));
  const topIdeaSymbols = new Set(topIdeas.map((item) => item.label));
  const sectorQuality = breakdownBy(rows, (row) => row.Sector || "Unknown", () => 1)
    .map((item) => ({
      ...item,
      selected: item.label === options.selectedSector,
    }));

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel wide">
        <h3>Quality vs reward</h3>
        <p class="chart-filter-context" data-chart-filter-context>
          กราฟนี้อัปเดตตาม filter ปัจจุบัน: ${formatNumber(rows.length)} stocks · ${escapeHtml(options.filterSummary || "current filters")}
        </p>
        ${renderScatterPlot(rows, {
          xKey: "RRR",
          yKey: "Total_Score",
          labelKey: "Symbol",
          xLabel: "Reward/Risk",
          yLabel: "Quality score",
          xHelp: "Reward/Risk ขวา = ผลตอบแทนเทียบความเสี่ยงดีขึ้น",
          yHelp: "Quality score สูง = คุณภาพดีขึ้น",
          xCaption: "Reward/Risk สูงขึ้น = คุ้มความเสี่ยงขึ้น",
          yCaption: "Quality score สูงขึ้น = คุณภาพดีขึ้น",
          note: "วิธีอ่านเร็ว: เริ่มดูหุ้นที่อยู่โซนขวาบนก่อน แล้วคลิกจุดเพื่อไฮไลต์แถวในตาราง.",
          xMax: 5,
          yMax: 100,
          action: "stock-highlight",
          highlightLabels: topIdeaSymbols,
          highlightClass: "top-idea-point",
          quadrant: {
            xThreshold: rrrThreshold,
            yThreshold: scoreThreshold,
            best: "น่าสนใจสุด",
            watch: "คุณภาพดี reward ต่ำ",
            risky: "reward ดีแต่เสี่ยง",
            avoid: "ควรข้ามก่อน",
          },
        })}
        <div class="quadrant-guide" data-screener-quadrant-guide>
          <strong>อ่านกราฟนี้แบบง่าย:</strong>
          <span><i class="zone-dot zone-best"></i><b>ขวาบน</b> ดีสุด: Score ${formatNumber(scoreThreshold)}+ และ RRR ${formatNumber(rrrThreshold)}+.</span>
          <span><i class="zone-dot zone-watch"></i><b>ซ้ายบน</b> Score ผ่านเกณฑ์ แต่ reward ยังไม่คุ้ม.</span>
          <span><i class="zone-dot zone-risky"></i><b>ขวาล่าง</b> reward ดูดีแต่คะแนนรวมยังอ่อน ต้องระวัง.</span>
          <span><i class="zone-dot zone-avoid"></i><b>ซ้ายล่าง</b> มือใหม่ควรข้ามก่อน.</span>
        </div>
      </section>
      <section class="chart-panel">
        <h3>Top ideas</h3>
        ${renderBarList(topIdeas, { action: "stock-highlight", maxValue: 100, valueFormatter: (value) => `${formatNumber(value)} score` })}
      </section>
      <section class="chart-panel">
        <h3>Sector count</h3>
        ${renderBarList(sectorQuality, { action: "sector-filter", valueFormatter: (value) => `${formatNumber(value)} stocks` })}
      </section>
    </div>
  `;
}

function renderSectorVisuals(rows, stats, options = {}) {
  const scoreThreshold = clamp(numberValue(options.scoreThreshold ?? 70), 0, 100);
  const pricePositionThreshold = clamp(numberValue(options.pricePositionThreshold ?? 60), 0, 100);
  const leaders = rows
    .slice(0, 6)
    .map((row) => ({
      label: row.Symbol,
      value: numberValue(row.Total_Score),
      caption: `RRR ${formatNumber(row.RRR)} · PE ${formatNumber(row.PE)}`,
    }));
  const benchmarks = [
    { label: "Median PE", value: stats.pe, caption: "Lower is generally cheaper" },
    { label: "Median ROE", value: stats.roe, caption: "Higher means stronger profitability" },
    { label: "Median Yield", value: stats.yield, caption: "Dividend context" },
  ];

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel">
        <h3>Sector leaders</h3>
        ${renderBarList(leaders, { action: "stock-highlight", maxValue: 100, valueFormatter: (value) => `${formatNumber(value)} score` })}
      </section>
      <section class="chart-panel">
        <h3>Sector benchmark</h3>
        ${renderBarList(benchmarks, { valueFormatter: (value) => formatNumber(value) })}
      </section>
      <section class="chart-panel wide">
        <h3>Timing vs quality</h3>
        <p class="chart-filter-context" data-sector-chart-filter-context>
          กราฟนี้อัปเดตตาม filter ปัจจุบัน: ${formatNumber(rows.length)} stocks · ${escapeHtml(options.filterSummary || "current sector filter")}
        </p>
        ${renderScatterPlot(rows.slice(0, 80), {
          xKey: "Price_Position",
          yKey: "Total_Score",
          labelKey: "Symbol",
          xLabel: "Price position",
          yLabel: "Quality score",
          xHelp: "Price position ขวา = ราคาอยู่ใกล้กรอบบนมากขึ้น",
          yHelp: "Quality score สูง = คุณภาพดีขึ้น",
          xCaption: "Price position สูงขึ้น = ราคาอยู่ใกล้กรอบบนมากขึ้น",
          yCaption: "Quality score สูงขึ้น = คุณภาพดีขึ้น",
          note: "วิธีอ่านเร็ว: เริ่มจากโซนซ้ายบนก่อน เพราะคะแนนดีและราคายังไม่ไล่ขึ้นมากเกินไป.",
          xMax: 100,
          yMax: 100,
          action: "stock-highlight",
          quadrant: {
            xThreshold: pricePositionThreshold,
            yThreshold: scoreThreshold,
            best: "คุณภาพดี แต่ราคาเริ่มสูง",
            watch: "น่าสนใจ: คุณภาพดี ราคาไม่สูง",
            risky: "ราคาไล่ขึ้น ต้องระวัง",
            avoid: "คะแนนอ่อน รอดูก่อน",
            zoneClasses: {
              topLeft: "best",
              topRight: "watch",
              bottomLeft: "avoid",
              bottomRight: "risky",
            },
          },
        })}
        <div class="quadrant-guide sector-chart-guide" data-sector-chart-guide>
          <strong>อ่านกราฟ Sector แบบง่าย:</strong>
          <span><i class="zone-dot zone-best"></i><b>ซ้ายบน</b> น่าสนใจกว่า: คะแนนดีและ Price position ต่ำกว่า ${formatNumber(pricePositionThreshold)}.</span>
          <span><i class="zone-dot zone-watch"></i><b>ขวาบน</b> คุณภาพดี แต่ Price position สูงกว่า ${formatNumber(pricePositionThreshold)} ต้องดูจังหวะ.</span>
          <span><i class="zone-dot zone-risky"></i><b>ขวาล่าง</b> ราคาอยู่สูงกว่าเส้น แต่คะแนนยังไม่แข็งแรง ควรระวัง.</span>
          <span><i class="zone-dot zone-avoid"></i><b>ซ้ายล่าง</b> ยังไม่เด่น รอดูข้อมูลเพิ่มก่อน.</span>
        </div>
      </section>
    </div>
  `;
}

function renderBusinessFunnel(metrics, portfolioAttachPct) {
  const funnel = [
    { label: "Registered users", value: metrics.users || 0, caption: "Top of funnel" },
    { label: "Saved portfolios", value: metrics.savedPortfolios || 0, caption: `${formatNumber(portfolioAttachPct)}% portfolio attach` },
    { label: "Paid users", value: metrics.paidUsers || 0, caption: `${money(metrics.mrrEstimate || 0)} MRR` },
  ];
  const plans = Object.entries(metrics.usersByPlan || {}).map(([label, value]) => ({
    label,
    value,
    caption: "Plan mix",
  }));

  return `
    <div class="visual-grid two-columns">
      <section class="chart-panel">
        <h3>Customer funnel</h3>
        ${renderBarList(funnel, { valueFormatter: (value) => `${formatNumber(value)} users` })}
      </section>
      <section class="chart-panel">
        <h3>Plan distribution</h3>
        ${renderBarList(plans, { valueFormatter: (value) => `${formatNumber(value)} users` })}
      </section>
    </div>
  `;
}

function renderTenantScopeSummary(scope = state.tenantScope) {
  if (!scope) {
    return `<p class="muted">Tenant scope is loading...</p>`;
  }

  const dataScope = scope.dataScope || {};
  const isolation = scope.isolation || {};
  const missing = isolation.missingOrganizationId || {};
  const missingTotal = numberValue(missing.totalMissingOrganizationId);
  const recordRows = [
    ["Portfolio snapshots", dataScope.portfolioSnapshots],
    ["Investor profiles", dataScope.investorProfiles],
    ["Billing events", dataScope.billingEvents],
    ["Payment sessions", dataScope.paymentSessions],
    ["Webhook events", dataScope.paymentWebhookEvents],
    ["Approval requests", dataScope.approvalRequests],
    ["Audit events", dataScope.auditEvents],
  ].map(([record, visible]) => ({
    Record: record,
    Visible: visible || 0,
  }));
  const workspaceRows = (scope.visibleOrganizations || []).slice(0, 8).map((organization) => ({
    Workspace: organization.name,
    Type: organization.type,
    Members: organization.memberCount || 0,
    Revenue_THB: organization.revenueCollected || 0,
  }));

  return `
    <section class="chart-panel">
      <h3>Tenant isolation</h3>
      <div class="metric-grid">
        ${metric("Visible Workspaces", scope.visibleOrganizationCount || 0)}
        ${metric("Visible Users", scope.visibleUserCount || 0)}
        ${metric("Record Metadata Gaps", missingTotal)}
        ${metric("Production Store", isolation.productionDatabaseRequired ? "DB required" : "Ready")}
      </div>
      <div class="guidance-grid">
        <div class="guidance-card"><span>Scope status</span><strong>${missingTotal ? "Some records need workspace metadata before production" : "Critical records are tagged with workspace metadata"}</strong></div>
        <div class="guidance-card"><span>Current store</span><strong>${escapeHtml(isolation.store || "local_file")} prototype for demo and validation</strong></div>
      </div>
      <h3>Visible data scope</h3>
      ${renderTable(recordRows, ["Record", "Visible"])}
      <h3>Workspace access</h3>
      ${renderTable(workspaceRows, ["Workspace", "Type", "Members", "Revenue_THB"])}
    </section>
  `;
}

function renderWorkspaceSummary(organizations = state.organizations) {
  if (!organizations.length) {
    return `<p class="muted">No workspaces available yet.</p>`;
  }

  const organizationTypes = ["client", "customer", "advisor", "platform"];
  const canManage = canManageOrganizations();
  const createForm = canManage
    ? `
      <form id="organizationForm" class="inline-form workspace-form">
        <label>Workspace name <input name="name" placeholder="Client workspace"></label>
        <label>Type <select name="type">${organizationTypes.map((type) => option(type, type, "client")).join("")}</select></label>
        <button type="submit">Create Workspace</button>
      </form>
      <p id="organizationMessage" class="muted">Create client workspaces to group customers, advisors, and future team seats.</p>
    `
    : "";

  return `
    <h3>Workspaces</h3>
    ${createForm}
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Workspace</th>
            <th>Type</th>
            <th>Members</th>
            <th>Customers</th>
            <th>Paid</th>
            <th>Revenue</th>
            <th>Portfolios</th>
            <th>Owner</th>
            ${canManage ? "<th>Actions</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${organizations.map((organization) => {
            const nameControl = canManage
              ? `<input class="table-input" data-organization-name="${escapeHtml(organization.id)}" value="${escapeHtml(organization.name)}">`
              : escapeHtml(organization.name);
            const typeControl = canManage
              ? `<select data-organization-type="${escapeHtml(organization.id)}">${organizationTypes.map((type) => option(type, type, organization.type)).join("")}</select>`
              : escapeHtml(organization.type);

            return `
              <tr>
                <td><strong>${nameControl}</strong></td>
                <td>${typeControl}</td>
                <td>${formatNumber(organization.memberCount || 0)}</td>
                <td>${formatNumber(organization.customerCount || 0)}</td>
                <td>${formatNumber(organization.paidMembers || 0)}</td>
                <td>${money(organization.revenueCollected || 0)}</td>
                <td>${formatNumber(organization.savedPortfolios || 0)}</td>
                <td>${escapeHtml(organization.ownerName || organization.ownerEmail || "-")}</td>
                ${canManage ? `<td><button class="table-action" type="button" data-save-organization="${escapeHtml(organization.id)}">Save workspace</button></td>` : ""}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTeamWorkspace(options = {}) {
  const compactAdmin = Boolean(options.compactAdmin);
  if (!state.teamUsers.length) {
    return `
      <section class="chart-panel user-management-panel" data-user-management-panel>
        <h3>${canViewBusinessMetrics() ? "User Management" : "Assigned Client Management"}</h3>
        <p class="muted">No team or client records available yet.</p>
      </section>
    `;
  }

  const roles = state.policy?.roles || ["owner", "admin", "advisor", "customer"];
  const advisors = state.teamUsers.filter((user) => ["owner", "admin", "advisor"].includes(user.role));
  const organizations = state.organizations.length ? state.organizations : state.businessMetrics?.recentOrganizations || [];
  const launchPlans = state.plans || [];
  const subscriptionStatuses = ["active", "trialing", "past_due", "canceled", "inactive"];
  const canManagePackages = canManageSubscriptions();
  const canDeleteUserAccounts = canDeleteUsers();
  const pendingManualPackages = state.teamUsers.filter((user) => user.subscription?.status === "inactive").length;
  const activeMembers = state.teamUsers.filter((user) => user.subscription?.status === "active").length;
  const expiredMembers = state.teamUsers.filter((user) => {
    const expiresAt = user.subscription?.expiresAt || user.subscription?.renewsAt;
    return expiresAt && new Date(expiresAt).getTime() < Date.now();
  }).length;

  return `
    <section class="chart-panel user-management-panel" data-user-management-panel>
      <div class="section-title">
        <div>
          <span class="eyebrow">${canViewBusinessMetrics() ? "Access control" : "Client scope"}</span>
          <h3>${canViewBusinessMetrics() ? "User Management" : "Assigned Client Management"}</h3>
          <p class="muted">${canViewBusinessMetrics() ? "หน้าหลักของ admin สำหรับเปิด Package ให้สมาชิก: เลือก Starter/Pro, เลือกสถานะ, ตั้งวันหมดอายุ แล้วกด Save package" : "ดูรายชื่อลูกค้าที่ถูก assign ให้ดูแลเท่านั้น"}</p>
        </div>
        <span class="status-pill ready">${formatNumber(state.teamUsers.length)} accounts</span>
      </div>
      ${canManagePackages ? `
        <div class="guidance-grid package-admin-guide" data-admin-package-management>
          <div class="guidance-card"><span>New signups</span><strong>${formatNumber(pendingManualPackages)} account(s) waiting for package assignment</strong></div>
          <div class="guidance-card"><span>Active members</span><strong>${formatNumber(activeMembers)} account(s) currently active</strong></div>
          <div class="guidance-card"><span>Expired / check date</span><strong>${formatNumber(expiredMembers)} account(s) need expiry review</strong></div>
        </div>
      ` : ""}
      <div class="table-wrap">
        <table>
          <thead>
            ${compactAdmin
              ? `<tr>
                  <th>Member</th>
                  <th>Package / Expiry</th>
                  <th>Status</th>
                  <th>Portfolio</th>
                  <th>Actions</th>
                </tr>`
              : `<tr>
                  <th>Account</th>
                  <th>Role</th>
                  <th>Workspace</th>
                  <th>Plan</th>
                  <th>Advisor</th>
                  <th>Portfolio</th>
                  <th>Revenue</th>
                  <th>Actions</th>
                </tr>`}
          </thead>
          <tbody>
            ${state.teamUsers.map((user) => {
              const roleControl = canManageRoles()
                ? `<select data-role-user="${escapeHtml(user.id)}">${roles.map((role) => option(role, role, user.role)).join("")}</select>`
                : escapeHtml(user.role);
              const advisorControl = canAssignAdvisors() && user.role === "customer"
                ? `<select data-advisor-user="${escapeHtml(user.id)}">
                    <option value="">Unassigned</option>
                    ${advisors.map((advisor) => option(advisor.id, `${advisor.name} (${advisor.role})`, user.advisorId)).join("")}
                  </select>`
                : escapeHtml(user.advisorName || "-");
              const organizationControl = canManageOrganizations()
                ? `<select data-organization-user="${escapeHtml(user.id)}">${organizations.map((organization) => option(organization.id, organization.name, user.organizationId)).join("")}</select>`
                : `${escapeHtml(user.organizationName || "-")}<br><span class="muted">${escapeHtml(user.organizationType || "-")}</span>`;
              const subscription = user.subscription || {};
              const packageControl = canManagePackages
                ? `<div class="subscription-admin-control" data-subscription-user="${escapeHtml(user.id)}">
                    ${subscription.status === "inactive" ? `<span class="status-pill warning">Waiting admin</span>` : ""}
                    <select data-subscription-plan-user="${escapeHtml(user.id)}">
                      ${launchPlans.map((plan) => option(plan.id, `${plan.name} (${money(plan.priceThb || 0)})`, subscription.planId)).join("")}
                    </select>
                    <select data-subscription-status-user="${escapeHtml(user.id)}">
                      ${subscriptionStatuses.map((status) => option(status, subscriptionStatusLabel(status), subscription.status)).join("")}
                    </select>
                    <input type="date" data-subscription-expiry-user="${escapeHtml(user.id)}" value="${escapeHtml(subscriptionExpiryValue(subscription))}" aria-label="Package expiry date for ${escapeHtml(user.email)}">
                  </div>`
                : `${escapeHtml(subscription.plan || "-")}<br><span class="muted">${escapeHtml(subscription.status || "-")}</span>`;
              const portfolioValue = user.portfolioSummary ? money(user.portfolioSummary.marketValue || 0) : "-";
              const revenue = money(user.billingSummary?.revenueCollected || 0);
              const subscriptionStatus = subscriptionStatusLabel(subscription.status || "inactive");
              const expiryLabel = formatDate(subscription.expiresAt || subscription.renewsAt);

              if (compactAdmin) {
                return `
                  <tr data-member-management-row>
                    <td><strong>${escapeHtml(user.name || "Investor")}</strong><br><span class="muted">${escapeHtml(user.email)}</span></td>
                    <td>${packageControl}</td>
                    <td><strong>${escapeHtml(subscriptionStatus)}</strong><br><span class="muted">Expiry: ${escapeHtml(expiryLabel)}</span></td>
                    <td>${escapeHtml(portfolioValue)}</td>
                    <td>
                      ${canManagePackages ? `<button class="table-action" type="button" data-save-subscription="${escapeHtml(user.id)}">Save package</button>` : ""}
                      ${canDeleteUserAccounts && user.id !== state.user?.id ? `<button class="table-action danger-action" type="button" data-delete-user="${escapeHtml(user.id)}" data-delete-user-label="${escapeHtml(user.email)}">Delete user</button>` : ""}
                    </td>
                  </tr>
                `;
              }

              return `
                <tr>
                  <td><strong>${escapeHtml(user.name || "Investor")}</strong><br><span class="muted">${escapeHtml(user.email)}</span></td>
                  <td>${roleControl}</td>
                  <td>${organizationControl}</td>
                  <td>${packageControl}</td>
                  <td>${advisorControl}</td>
                  <td>${escapeHtml(portfolioValue)}</td>
                  <td>${escapeHtml(revenue)}</td>
                  <td>
                    ${canManageRoles() ? `<button class="table-action" type="button" data-save-role="${escapeHtml(user.id)}">Save role</button>` : ""}
                    ${canManagePackages ? `<button class="table-action" type="button" data-save-subscription="${escapeHtml(user.id)}">Save package</button>` : ""}
                    ${canManageOrganizations() ? `<button class="table-action" type="button" data-save-organization-user="${escapeHtml(user.id)}">Move workspace</button>` : ""}
                    ${canAssignAdvisors() && user.role === "customer" ? `<button class="table-action" type="button" data-save-advisor="${escapeHtml(user.id)}">Assign advisor</button>` : ""}
                    ${canDeleteUserAccounts && user.id !== state.user?.id ? `<button class="table-action danger-action" type="button" data-delete-user="${escapeHtml(user.id)}" data-delete-user-label="${escapeHtml(user.email)}">Delete user</button>` : ""}
                  </td>
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
      </div>
      <p id="teamMessage" class="muted">${compactAdmin ? "บันทึกเฉพาะ package, status, expiry date หรือ delete user จากหน้านี้ หากต้องจัดการ role/workspace/advisor ให้ไปที่ Advanced Ops." : "User role, manual package update, workspace move และ advisor assignment จะถูกบันทึกใน activity timeline."}</p>
    </section>
  `;
}

function renderSectorBeginnerSummary(sectorInsights, selectedInsight = {}) {
  const bestSector = sectorInsights[0] || {};
  const firstRisk = sectorInsights.find((item) => !["Balanced", "No holding"].includes(item.Portfolio_Risk)) || selectedInsight;
  return `
    <section class="sector-beginner-summary" data-sector-beginner-summary>
      <article>
        <span>1. กลุ่มน่าศึกษาก่อน</span>
        <strong>${escapeHtml(bestSector.Sector || "-")}</strong>
        <p>${escapeHtml(bestSector.Sector ? `คะแนนกลุ่ม ${formatNumber(bestSector.Sector_Score)} และสัญญาณ ${beginnerSignalText(bestSector.Rotation_Signal)}` : "ยังไม่มีข้อมูล sector")}</p>
      </article>
      <article>
        <span>2. กลุ่มที่เลือกอยู่</span>
        <strong>${escapeHtml(selectedInsight.Sector || "-")}</strong>
        <p>${escapeHtml(sectorNextStep(selectedInsight))}</p>
      </article>
      <article>
        <span>3. จุดที่ควรเช็กในพอร์ต</span>
        <strong>${escapeHtml(firstRisk?.Sector || selectedInsight.Sector || "-")}</strong>
        <p>${escapeHtml(beginnerRiskText(firstRisk?.Portfolio_Risk || "No holding"))}</p>
      </article>
    </section>
  `;
}

function renderSectorProInsights(sectorInsights, selectedInsight = {}) {
  const rankingBars = sectorInsights.slice(0, 5).map((item) => ({
    label: item.Sector,
    value: item.Sector_Score,
    selected: item.Sector === selectedInsight.Sector,
    caption: `${beginnerSignalText(item.Rotation_Signal)} · พอร์ต ${formatNumber(item.Portfolio_Exposure_Pct)}%`,
  }));
  const exposureBars = sectorInsights
    .filter((item) => numberValue(item.Portfolio_Exposure_Pct) > 0)
    .slice()
    .sort((left, right) => numberValue(right.Portfolio_Exposure_Pct) - numberValue(left.Portfolio_Exposure_Pct))
    .slice(0, 5)
    .map((item) => ({
      label: item.Sector,
      value: item.Portfolio_Exposure_Pct,
      selected: item.Sector === selectedInsight.Sector,
      caption: beginnerRiskText(item.Portfolio_Risk),
    }));

  return `
    <div class="visual-grid two-columns sector-pro-grid">
      <section class="chart-panel" data-sector-ranking-panel>
        <h3>1. กลุ่มไหนน่าศึกษา</h3>
        <p class="muted">ดู 5 กลุ่มที่คะแนนรวมดีที่สุดก่อน แล้วค่อยลงไปดูหุ้นรายตัว</p>
        ${renderBarList(rankingBars, { action: "sector-select", maxValue: 100, valueFormatter: (value) => `${formatNumber(value)} / 100` })}
      </section>
      <section class="chart-panel" data-sector-risk-panel>
        <h3>2. พอร์ตกระจุกตรงไหน</h3>
        <p class="muted">ถ้ามี portfolio ระบบจะบอกว่าถือกลุ่มไหนเยอะ และควรระวังอะไร</p>
        ${exposureBars.length
          ? renderBarList(exposureBars, { action: "sector-select", maxValue: Math.max(...exposureBars.map((item) => numberValue(item.value)), 1), valueFormatter: (value) => `${formatNumber(value)}%` })
          : `<p class="muted">Upload a portfolio to compare your sector exposure with sector strength.</p>`}
      </section>
      <section class="chart-panel wide" data-sector-rotation-panel>
        <h3>3. สัญญาณกลุ่มแบบอ่านง่าย</h3>
        <div class="sector-signal-grid">
          ${sectorInsights.slice(0, 6).map((item) => `
            <button class="sector-signal-card ${item.Sector === selectedInsight.Sector ? "selected" : ""}" type="button" data-sector-select="${escapeHtml(item.Sector)}">
              <span>${escapeHtml(item.Sector)}</span>
              <strong>${escapeHtml(beginnerSignalText(item.Rotation_Signal))}</strong>
              <small>${escapeHtml(sectorSignalReason(item))}</small>
            </button>
          `).join("")}
        </div>
      </section>
    </div>
  `;
}

function attachSectorSelectionControls(sectorSelect, renderDetails) {
  document.querySelectorAll("[data-sector-select]").forEach((button) => {
    button.addEventListener("click", () => {
      sectorSelect.value = button.dataset.sectorSelect || sectorSelect.value;
      renderDetails();
      document.querySelector("#sectorDetails")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function renderApprovalWorkspace(requests = state.approvalRequests) {
  const customerOptions = state.teamUsers.filter((user) => user.role === "customer");
  const canCreate = canCreateApprovalRequests();
  const createForm = canCreate
    ? `
      <form id="approvalForm" class="inline-form approval-form">
        <label>Customer <select name="customerId" required>
          <option value="">Select customer</option>
          ${customerOptions.map((user) => option(user.id, `${user.name} (${user.email})`, "")).join("")}
        </select></label>
        <label>Title <input name="title" maxlength="100" placeholder="Review AOT rebalance" required></label>
        <label>Action <select name="actionType">
          ${["portfolio_review", "rebalance", "buy_plan", "risk_action", "subscription_support", "other"].map((value) => option(value, approvalActionTypeLabel(value), "portfolio_review")).join("")}
        </select></label>
        <label>Risk <select name="riskLevel">
          ${["low", "medium", "high"].map((value) => option(value, value, "medium")).join("")}
        </select></label>
        <label>Amount THB <input name="amountThb" type="number" min="0" step="1000" placeholder="0"></label>
        <label>Summary <input name="summary" maxlength="600" placeholder="Explain why this approval is needed"></label>
        <button type="submit"${customerOptions.length ? "" : " disabled"}>Request Approval</button>
      </form>
      <p id="approvalMessage" class="muted">${customerOptions.length ? "Approval requests are recorded in the activity timeline." : "Assign or create customer accounts before requesting approval."}</p>
    `
    : "";

  return `
    <h3>Client approvals</h3>
    ${createForm}
    ${renderApprovalTable(requests)}
  `;
}

function renderApprovalTable(requests = state.approvalRequests) {
  if (!requests.length) {
    return `<p class="muted">No approval requests yet.</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Updated</th>
            <th>Customer</th>
            <th>Request</th>
            <th>Risk</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Requested by</th>
            <th>Decision</th>
          </tr>
        </thead>
        <tbody>
          ${requests.map((request) => {
            const canDecide = request.status === "pending" && request.customerId === state.user?.id;
            const decisionCell = canDecide
              ? `
                <button class="table-action" type="button" data-approval-decision="${escapeHtml(request.id)}" data-decision="approved">Approve</button>
                <button class="table-action ghost-button" type="button" data-approval-decision="${escapeHtml(request.id)}" data-decision="rejected">Reject</button>
              `
              : request.decidedAt
                ? `${escapeHtml(request.decidedByName || request.decidedByEmail || "-")}<br><span class="muted">${formatDateTime(request.decidedAt)}</span>`
                : "-";

            return `
              <tr>
                <td>${formatDateTime(request.updatedAt || request.createdAt)}</td>
                <td><strong>${escapeHtml(request.customerName || "Customer")}</strong><br><span class="muted">${escapeHtml(request.customerEmail || "-")}</span></td>
                <td><strong>${escapeHtml(request.title)}</strong><br><span class="muted">${escapeHtml(approvalActionTypeLabel(request.actionType))} · ${escapeHtml(request.summary || "-")}</span></td>
                <td>${escapeHtml(request.riskLevel || "medium")}</td>
                <td>${money(request.amountThb || 0)}</td>
                <td>${escapeHtml(request.status || "pending")}</td>
                <td>${escapeHtml(request.requestedByName || request.requestedByEmail || "-")}</td>
                <td>${decisionCell}</td>
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderActivityTimeline(events = state.auditEvents) {
  if (!events.length) {
    return `<p class="muted">No activity recorded yet.</p>`;
  }

  const rows = events.slice(0, 12).map((event) => ({
    Time: formatDateTime(event.createdAt),
    Activity: auditActionLabel(event.action),
    Actor: event.actorName || event.actorEmail || "-",
    Target: event.targetName || event.targetEmail || "-",
    Detail: summarizeAuditDetails(event),
    Hash: event.hashPreview || shortHash(event.eventHash),
  }));

  return renderTable(rows, ["Time", "Activity", "Actor", "Target", "Detail", "Hash"]);
}

function renderPaymentSessions(sessions = state.paymentSessions) {
  if (!sessions.length) {
    return `<p class="muted">No payment sessions recorded yet.</p>`;
  }

  const rows = sessions.slice(0, 12).map((session) => ({
    Created: formatDateTime(session.createdAt),
    Plan: session.planName || "-",
    Amount_THB: session.amountThb || 0,
    Status: session.status || "-",
    Provider: session.provider || "-",
    Webhooks: session.webhookEventCount || 0,
  }));

  return renderTable(rows, ["Created", "Plan", "Amount_THB", "Status", "Provider", "Webhooks"]);
}

function auditActionLabel(action) {
  return {
    "auth.register": "Account registered",
    "auth.login": "Signed in",
    "auth.logout": "Signed out",
    "analysis.run": "Portfolio analysis",
    "analysis.snapshot_saved": "Snapshot saved",
    "simulation.run": "Simulation",
    "profile.update": "Investor profile updated",
    "billing.checkout": "Subscription checkout",
    "team.role_update": "Role updated",
    "team.subscription_update": "Package updated",
    "team.user_deleted": "User deleted",
    "team.advisor_assigned": "Advisor assigned",
    "team.advisor_reassigned": "Advisor reassigned",
    "team.advisor_unassigned": "Advisor removed",
    "organization.create": "Workspace created",
    "organization.update": "Workspace updated",
    "organization.member_move": "Workspace member moved",
    "payment.session_created": "Payment session",
    "payment.webhook_succeeded": "Payment succeeded",
    "payment.webhook_failed": "Payment failed",
    "payment.webhook_rejected": "Webhook rejected",
    "approval.request_created": "Approval requested",
    "approval.request_approved": "Approval approved",
    "approval.request_rejected": "Approval rejected",
    "launch_evidence.export": "Launch evidence exported",
    "portfolio_health.export": "Portfolio health exported",
    "reference_master.review": "Reference master reviewed",
  }[action] || action;
}

function summarizeAuditDetails(event) {
  const details = event.details || {};

  if (event.action === "billing.checkout") {
    return `${details.planName || details.planId || "Plan"} · ${money(details.amountThb || 0)} · ${details.invoiceNumber || "-"}`;
  }

  if (event.action === "team.role_update") {
    return `${details.previousRole || "-"} → ${details.nextRole || "-"}`;
  }

  if (event.action === "team.subscription_update") {
    return `${details.previousPlanId || "-"} → ${details.nextPlanId || "-"} · ${details.nextStatus || "-"} · expires ${formatDate(details.expiresAt)}`;
  }

  if (event.action === "team.advisor_assigned" || event.action === "team.advisor_reassigned") {
    return details.advisorEmail ? `Advisor: ${details.advisorEmail}` : "Advisor assigned";
  }

  if (event.action === "team.advisor_unassigned") {
    return details.previousAdvisorEmail ? `Removed: ${details.previousAdvisorEmail}` : "Advisor removed";
  }

  if (event.action === "organization.create") {
    return `${details.organizationName || "Workspace"} · ${details.organizationType || "client"}`;
  }

  if (event.action === "organization.update") {
    return `${details.previousName || "-"} → ${details.nextName || "-"}`;
  }

  if (event.action === "organization.member_move") {
    return `${details.previousOrganization || "-"} → ${details.nextOrganization || "-"}`;
  }

  if (event.action === "payment.session_created") {
    return `${details.planName || "-"} · ${money(details.amountThb || 0)} · ${details.status || "pending"}`;
  }

  if (event.action === "payment.webhook_succeeded" || event.action === "payment.webhook_failed") {
    return `${details.planName || "-"} · ${money(details.amountThb || 0)} · ${details.status || "-"} · ${details.verificationStatus || "not_required"}`;
  }

  if (event.action === "payment.webhook_rejected") {
    return `${details.eventType || "-"} · ${details.verificationStatus || "rejected"} · ${details.reason || "-"}`;
  }

  if (event.action === "approval.request_created" || event.action === "approval.request_approved" || event.action === "approval.request_rejected") {
    return `${details.title || "Approval"} · ${details.status || "-"} · ${money(details.amountThb || 0)}`;
  }

  if (event.action === "launch_evidence.export") {
    return `${details.format || "json"} · ${details.launchStatus || "-"} · ready ${formatNumber(details.ready || 0)} / ${formatNumber(details.total || 0)}`;
  }

  if (event.action === "portfolio_health.export") {
    return `${details.format || "csv"} · ${portfolioHealthStatusLabel(details.status)} · ${formatNumber(details.totalSnapshots || 0)} snapshots`;
  }

  if (event.action === "reference_master.review") {
    return `${details.symbol || "-"} · ${details.reviewStatus || "-"} · changed ${(details.changedFields || []).join(", ") || "none"}`;
  }

  if (event.action === "analysis.run") {
    return `${formatNumber(details.symbols || 0)} symbols · ${formatNumber(details.recommendationCount || 0)} ideas · ${formatNumber(details.portfolioRows || 0)} holdings`;
  }

  if (event.action === "analysis.snapshot_saved") {
    return `${formatNumber(details.holdings || 0)} holdings · urgent ${formatNumber(details.urgentActions || 0)} · P/L ${formatNumber(details.gainLossPct || 0)}%`;
  }

  if (event.action === "simulation.run") {
    return `${details.symbol || "-"} · ${formatNumber(details.yearsBack || 0)} years · ${formatNumber(details.trades || 0)} trades`;
  }

  if (event.action === "profile.update") {
    return `${details.goal || "-"} · ${details.riskLevel || "-"} risk · ${formatNumber(details.horizonYears || 0)} years`;
  }

  const entries = Object.entries(details).slice(0, 3);
  return entries.length ? entries.map(([key, value]) => `${key}: ${String(value)}`).join(" · ") : "-";
}

function attachTeamActions() {
  document.querySelectorAll("[data-save-role]").forEach((button) => {
    button.addEventListener("click", () => updateTeamRole(button.dataset.saveRole));
  });
  document.querySelectorAll("[data-save-subscription]").forEach((button) => {
    button.addEventListener("click", () => updateUserSubscription(button.dataset.saveSubscription));
  });
  document.querySelectorAll("[data-save-advisor]").forEach((button) => {
    button.addEventListener("click", () => updateAdvisorAssignment(button.dataset.saveAdvisor));
  });
  document.querySelectorAll("[data-save-organization-user]").forEach((button) => {
    button.addEventListener("click", () => updateUserOrganization(button.dataset.saveOrganizationUser));
  });
  document.querySelectorAll("[data-delete-user]").forEach((button) => {
    button.addEventListener("click", () => deleteManagedUser(button.dataset.deleteUser, button.dataset.deleteUserLabel));
  });
}

function attachOrganizationActions() {
  const organizationForm = document.querySelector("#organizationForm");
  if (organizationForm) {
    organizationForm.addEventListener("submit", createWorkspace);
  }

  document.querySelectorAll("[data-save-organization]").forEach((button) => {
    button.addEventListener("click", () => updateWorkspace(button.dataset.saveOrganization));
  });
}

function attachApprovalActions() {
  const approvalForm = document.querySelector("#approvalForm");
  if (approvalForm) {
    approvalForm.addEventListener("submit", createApprovalRequest);
  }

  document.querySelectorAll("[data-approval-decision]").forEach((button) => {
    button.addEventListener("click", () => decideApprovalRequest(button.dataset.approvalDecision, button.dataset.decision));
  });
}

function attachReferenceMasterActions() {
  document.querySelectorAll("[data-reference-save]").forEach((button) => {
    button.addEventListener("click", () => saveReferenceMasterRecord(button));
  });
}

async function saveReferenceMasterRecord(button) {
  const symbol = button.dataset.referenceSave;
  const row = button.closest("[data-reference-row]");
  if (!symbol || !row) {
    return;
  }

  const payload = {};
  row.querySelectorAll("[data-reference-field]").forEach((input) => {
    payload[input.dataset.referenceField] = input.value;
  });

  const originalText = button.textContent;
  button.disabled = true;
  button.textContent = "Saving...";

  try {
    const response = await fetch(`/api/admin/reference-master/${encodeURIComponent(symbol)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.message || "Reference master update failed.");
    }
    state.referenceMaster = data.referenceMaster;
    await loadAuditEvents();
    renderBusinessView();
  } catch (error) {
    const noteField = row.querySelector("[data-reference-field='reviewNote']");
    if (noteField) {
      noteField.value = error.message;
    }
    button.disabled = false;
    button.textContent = "Retry";
    return;
  }

  button.disabled = false;
  button.textContent = originalText;
}

async function createApprovalRequest(event) {
  event.preventDefault();
  const approvalMessage = document.querySelector("#approvalMessage");
  if (approvalMessage) {
    approvalMessage.textContent = "Creating approval request...";
  }

  const payload = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/approvals", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    if (approvalMessage) {
      approvalMessage.textContent = data.message || "Approval request could not be created.";
    }
    return;
  }

  event.target.reset();
  await refreshWorkspaceData();
  renderAfterApprovalChange();
}

async function decideApprovalRequest(approvalId, decision) {
  const response = await fetch(`/api/approvals/${encodeURIComponent(approvalId)}/decision`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ decision }),
  });
  const data = await response.json();

  if (!data.ok) {
    viewOutput.insertAdjacentHTML("afterbegin", `<p class="muted">${escapeHtml(data.message || "Approval decision failed.")}</p>`);
    return;
  }

  await refreshWorkspaceData();
  renderAfterApprovalChange();
}

function renderAfterApprovalChange() {
  renderAuthState();
  if (state.activeView === "business") {
    renderBusinessView();
    return;
  }

  renderApprovalsView();
}

async function createWorkspace(event) {
  event.preventDefault();
  const organizationMessage = document.querySelector("#organizationMessage");
  if (organizationMessage) {
    organizationMessage.textContent = "Creating workspace...";
  }

  const payload = Object.fromEntries(new FormData(event.target).entries());
  const response = await fetch("/api/admin/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();

  if (!data.ok) {
    if (organizationMessage) {
      organizationMessage.textContent = data.message || "Workspace could not be created.";
    }
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateWorkspace(organizationId) {
  const nameInput = document.querySelector(`[data-organization-name="${cssEscape(organizationId)}"]`);
  const typeSelect = document.querySelector(`[data-organization-type="${cssEscape(organizationId)}"]`);
  const organizationMessage = document.querySelector("#organizationMessage");
  if (!nameInput || !typeSelect) return;

  if (organizationMessage) {
    organizationMessage.textContent = "Saving workspace...";
  }

  const response = await fetch(`/api/admin/organizations/${encodeURIComponent(organizationId)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: nameInput.value,
      type: typeSelect.value,
    }),
  });
  const data = await response.json();

  if (!data.ok) {
    if (organizationMessage) {
      organizationMessage.textContent = data.message || "Workspace could not be saved.";
    }
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateTeamRole(userId) {
  const select = document.querySelector(`[data-role-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Saving role...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Role update failed.";
    return;
  }

  await refreshWorkspaceData({ includeCurrentUser: true });
  renderAuthState();
  renderBusinessView();
}

async function updateUserSubscription(userId) {
  const planSelect = document.querySelector(`[data-subscription-plan-user="${cssEscape(userId)}"]`);
  const statusSelect = document.querySelector(`[data-subscription-status-user="${cssEscape(userId)}"]`);
  const expiryInput = document.querySelector(`[data-subscription-expiry-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!planSelect || !statusSelect || !expiryInput || !teamMessage) return;

  teamMessage.textContent = "Saving manual package update...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/subscription`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      planId: planSelect.value,
      status: statusSelect.value,
      expiresAt: expiryInput.value,
    }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Package update failed.";
    return;
  }

  await refreshWorkspaceData({ includeCurrentUser: state.user?.id === userId });
  renderAuthState();
  renderBusinessView();
}

async function deleteManagedUser(userId, label = "this user") {
  const teamMessage = document.querySelector("#teamMessage");
  if (!teamMessage || !userId) return;

  const confirmed = window.confirm(`Delete ${label}? This will remove access, active sessions, portfolio snapshot, investor profile, and advisor assignments. Audit history will be kept.`);
  if (!confirmed) {
    teamMessage.textContent = "Delete user cancelled.";
    return;
  }

  teamMessage.textContent = "Deleting user...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: "admin_user_management" }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Delete user failed.";
    return;
  }

  await refreshWorkspaceData();
  await loadBusinessMetrics();
  await loadAuditEvents();
  teamMessage.textContent = "User deleted. Audit history was kept.";
  renderBusinessView();
}

async function updateAdvisorAssignment(userId) {
  const select = document.querySelector(`[data-advisor-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Saving advisor assignment...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/advisor`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ advisorId: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Advisor assignment failed.";
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function updateUserOrganization(userId) {
  const select = document.querySelector(`[data-organization-user="${cssEscape(userId)}"]`);
  const teamMessage = document.querySelector("#teamMessage");
  if (!select || !teamMessage) return;

  teamMessage.textContent = "Moving member to workspace...";
  const response = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/organization`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId: select.value }),
  });
  const data = await response.json();

  if (!data.ok) {
    teamMessage.textContent = data.message || "Workspace move failed.";
    return;
  }

  await refreshWorkspaceData();
  renderBusinessView();
}

async function refreshWorkspaceData(options = {}) {
  const loaders = [loadBusinessMetrics(), loadReferenceMasterReview(), loadTeamUsers(), loadOrganizations(), loadPaymentSessions(), loadAuditEvents(), loadTenantScope()];
  if (options.includeCurrentUser) {
    loaders.push(loadCurrentUser());
  }

  await Promise.all(loaders);
}

function renderBarList(items, options = {}) {
  if (!items.length) {
    return `<p class="muted">No visual data yet.</p>`;
  }

  const max = options.maxValue || Math.max(...items.map((item) => numberValue(item.value)), 1);
  const valueFormatter = options.valueFormatter || formatNumber;

  return `
    <div class="bar-list">
      ${items.map((item) => {
        const width = clamp((numberValue(item.value) / max) * 100, 3, 100);
        const rowContent = `
            <div class="bar-row-header">
              <strong>${escapeHtml(item.label)}</strong>
              <span>${escapeHtml(valueFormatter(item.value))}</span>
            </div>
            <div class="bar-track"><div class="bar-fill" style="width: ${width}%"></div></div>
            ${item.caption ? `<p class="muted">${escapeHtml(item.caption)}</p>` : ""}
        `;

        if (options.action === "sector-filter") {
          return `
            <button class="bar-row bar-row-button ${item.selected ? "selected" : ""}" type="button" data-sector-filter="${escapeHtml(item.label)}" title="Filter sector ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        if (options.action === "sector-select") {
          return `
            <button class="bar-row bar-row-button ${item.selected ? "selected" : ""}" type="button" data-sector-select="${escapeHtml(item.label)}" title="Open sector ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        if (options.action === "recommended-action-filter") {
          return `
            <button class="bar-row bar-row-button" type="button" data-recommended-action-filter="${escapeHtml(item.label)}" aria-pressed="false" title="Filter Recommended actions by ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        if (options.action === "recommended-sector-filter") {
          return `
            <button class="bar-row bar-row-button" type="button" data-recommended-sector-filter="${escapeHtml(item.label)}" aria-pressed="false" title="Filter Recommended actions by sector ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        if (options.action === "recommended-score-filter") {
          return `
            <button class="bar-row bar-row-button" type="button" data-recommended-score-band="${escapeHtml(item.filterValue || item.label)}" aria-pressed="false" title="Filter Recommended actions by ${escapeHtml(item.label)}">
              ${rowContent}
            </button>
          `;
        }

        if (options.action === "stock-highlight") {
          return `
            <button class="bar-row bar-row-button" type="button" data-stock-highlight="${escapeHtml(item.label)}" title="Highlight ${escapeHtml(item.label)} in the table">
              ${rowContent}
            </button>
          `;
        }

        return `<div class="bar-row">${rowContent}</div>`;
      }).join("")}
    </div>
  `;
}

function renderScatterPlot(rows, {
  xKey,
  yKey,
  labelKey,
  xLabel,
  yLabel,
  xHelp,
  yHelp,
  xCaption,
  yCaption,
  note,
  xMax,
  yMax,
  action,
  highlightLabels,
  highlightClass,
  quadrant,
}) {
  const supportedQuadrantZoneClasses = "quadrant-zone-watch quadrant-zone-best quadrant-zone-avoid quadrant-zone-risky";
  const width = 560;
  const height = 300;
  const padding = 46;
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;
  const xThreshold = quadrant?.xThreshold ?? xMax * 0.4;
  const yThreshold = quadrant?.yThreshold ?? yMax * 0.7;
  const thresholdX = padding + (clamp(xThreshold, 0, xMax) / xMax) * plotWidth;
  const thresholdY = height - padding - (clamp(yThreshold, 0, yMax) / yMax) * plotHeight;
  const plotBottom = height - padding;
  const plotRight = width - padding;
  const zoneClasses = {
    topLeft: quadrant?.zoneClasses?.topLeft || "watch",
    topRight: quadrant?.zoneClasses?.topRight || "best",
    bottomLeft: quadrant?.zoneClasses?.bottomLeft || "avoid",
    bottomRight: quadrant?.zoneClasses?.bottomRight || "risky",
  };
  const quadrantZones = quadrant ? `
        <rect class="quadrant-zone quadrant-zone-${zoneClasses.topLeft}" x="${padding}" y="${padding}" width="${Math.max(0, thresholdX - padding)}" height="${Math.max(0, thresholdY - padding)}"></rect>
        <rect class="quadrant-zone quadrant-zone-${zoneClasses.topRight}" x="${thresholdX}" y="${padding}" width="${Math.max(0, plotRight - thresholdX)}" height="${Math.max(0, thresholdY - padding)}"></rect>
        <rect class="quadrant-zone quadrant-zone-${zoneClasses.bottomLeft}" x="${padding}" y="${thresholdY}" width="${Math.max(0, thresholdX - padding)}" height="${Math.max(0, plotBottom - thresholdY)}"></rect>
        <rect class="quadrant-zone quadrant-zone-${zoneClasses.bottomRight}" x="${thresholdX}" y="${thresholdY}" width="${Math.max(0, plotRight - thresholdX)}" height="${Math.max(0, plotBottom - thresholdY)}"></rect>
  ` : "";
  const quadrantLabels = quadrant ? [
    { label: quadrant.watch, className: zoneClasses.topLeft, x: padding + Math.max(46, (thresholdX - padding) / 2), y: padding + 20 },
    { label: quadrant.best, className: zoneClasses.topRight, x: thresholdX + Math.max(54, (plotRight - thresholdX) / 2), y: padding + 20 },
    { label: quadrant.avoid, className: zoneClasses.bottomLeft, x: padding + Math.max(46, (thresholdX - padding) / 2), y: plotBottom - 12 },
    { label: quadrant.risky, className: zoneClasses.bottomRight, x: thresholdX + Math.max(54, (plotRight - thresholdX) / 2), y: plotBottom - 12 },
  ].map((item) => `
        <text class="quadrant-label quadrant-label-${item.className}" x="${clamp(item.x, padding + 42, plotRight - 42)}" y="${item.y}" text-anchor="middle">${escapeHtml(item.label)}</text>
  `).join("") : "";
  const xTicks = [0, xThreshold, xMax].map((value) => {
    const x = padding + (clamp(value, 0, xMax) / xMax) * plotWidth;
    return `
        <line class="tick-line" x1="${x}" y1="${plotBottom}" x2="${x}" y2="${plotBottom + 4}"></line>
        <text class="tick-text" x="${x}" y="${plotBottom + 18}" text-anchor="middle">${formatNumber(value)}</text>
    `;
  }).join("");
  const yTicks = [0, yThreshold, yMax].map((value) => {
    const y = height - padding - (clamp(value, 0, yMax) / yMax) * plotHeight;
    return `
        <line class="tick-line" x1="${padding - 4}" y1="${y}" x2="${padding}" y2="${y}"></line>
        <text class="tick-text" x="${padding - 8}" y="${y + 4}" text-anchor="end">${formatNumber(value)}</text>
    `;
  }).join("");
  const points = rows
    .filter((row) => numberValue(row[xKey]) || numberValue(row[yKey]))
    .slice(0, 90)
    .map((row) => {
      const xValue = clamp(numberValue(row[xKey]), 0, xMax);
      const yValue = clamp(numberValue(row[yKey]), 0, yMax);
      return {
        label: row[labelKey] || "-",
        highlighted: highlightLabels?.has(row[labelKey] || "-") || false,
        x: padding + (xValue / xMax) * plotWidth,
        y: height - padding - (yValue / yMax) * plotHeight,
        xValue,
        yValue,
      };
    });

  if (!points.length) {
    return `<p class="muted">No chart data for the current filter.</p>`;
  }

  return `
    <div class="scatter-frame">
      <div class="scatter-axis-summary">
        <span>${escapeHtml(yHelp || `${yLabel} สูง = คุณภาพดีขึ้น`)}</span>
        <span>${escapeHtml(xHelp || `${xLabel} ขวา = ค่าสูงขึ้น`)}</span>
      </div>
      <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(`${xLabel} by ${yLabel}`)}">
        ${quadrantZones}
        ${quadrantLabels}
        <line class="axis-line" x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}"></line>
        <line class="axis-line" x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}"></line>
        <line class="guide-line" x1="${padding}" y1="${thresholdY}" x2="${width - padding}" y2="${thresholdY}"></line>
        <line class="guide-line" x1="${thresholdX}" y1="${padding}" x2="${thresholdX}" y2="${height - padding}"></line>
        ${xTicks}
        ${yTicks}
        <text class="axis-caption x-axis-caption" x="${padding + plotWidth / 2}" y="${height - 8}" text-anchor="middle">${escapeHtml(xCaption || `${xLabel} สูงขึ้น`)}</text>
        <text class="axis-caption y-axis-caption" x="14" y="${padding + plotHeight / 2}" text-anchor="middle" transform="rotate(-90 14 ${padding + plotHeight / 2})">${escapeHtml(yCaption || `${yLabel} สูงขึ้น`)}</text>
        ${points.map((point) => {
          const title = `${point.label}: ${xLabel} ${formatNumber(point.xValue)}, ${yLabel} ${formatNumber(point.yValue)}`;
          const pointClass = point.highlighted && highlightClass ? ` ${highlightClass}` : "";
          const circle = `
            <circle class="scatter-point${pointClass}" cx="${point.x}" cy="${point.y}" r="${point.highlighted ? 7 : 5.5}">
              <title>${escapeHtml(title)}</title>
            </circle>
          `;
          if (action === "stock-highlight") {
            return `
              <g class="stock-chart-trigger" role="button" tabindex="0" data-stock-highlight="${escapeHtml(point.label)}" aria-label="Highlight ${escapeHtml(point.label)} in the table">
                ${circle}
              </g>
            `;
          }
          return circle;
        }).join("")}
      </svg>
      <div class="scatter-legend">
        <span><i class="legend-dot legend-dot-top"></i>Top ideas</span>
        <span><i class="legend-dot legend-dot-normal"></i>หุ้นในผลกรอง</span>
        <span><i class="legend-line"></i>เส้นแดง = เกณฑ์เริ่มน่าสนใจ</span>
      </div>
      <p class="scatter-note">${escapeHtml(note || "คลิกจุดในกราฟเพื่อไฮไลต์แถวในตาราง.")}</p>
    </div>
  `;
}

function breakdownBy(rows, labelGetter, valueGetter, limit) {
  const groups = rows.reduce((totals, row) => {
    const label = typeof labelGetter === "function" ? labelGetter(row) : row[labelGetter];
    const value = typeof valueGetter === "function" ? valueGetter(row) : row[valueGetter];
    const key = label || "Unknown";
    totals[key] = (totals[key] || 0) + numberValue(value);
    return totals;
  }, {});
  const sorted = Object.entries(groups)
    .map(([label, value]) => ({ label, value }))
    .sort((left, right) => numberValue(right.value) - numberValue(left.value));

  if (!limit || sorted.length <= limit) {
    return sorted;
  }

  const visible = sorted.slice(0, limit - 1);
  const otherValue = sorted.slice(limit - 1).reduce((total, item) => total + numberValue(item.value), 0);
  return [...visible, { label: "Other", value: otherValue }];
}

function summarizeBy(rows, labelGetter) {
  return rows.reduce((totals, row) => {
    const label = typeof labelGetter === "function" ? labelGetter(row) : row[labelGetter];
    const key = String(label || "Unknown").trim() || "Unknown";
    totals[key] = (totals[key] || 0) + 1;
    return totals;
  }, {});
}

function uniqueValues(values) {
  return [...new Set(values
    .map((value) => String(value || "Unknown").trim() || "Unknown"))]
    .sort((left, right) => left.localeCompare(right));
}

function actionGroup(row) {
  const text = String(row.Target_Action || row.Advice || "Keep Holding");
  if (/Exit|Sell/i.test(text)) return "Exit/Sell";
  if (/Reduce|Cut/i.test(text)) return "Reduce";
  if (/Buy|Accumulate/i.test(text)) return "Buy/Accumulate";
  if (/Wait/i.test(text)) return "Wait";
  return "Hold";
}

function renderTable(rows, columns, options = {}) {
  if (!rows.length) {
    return `<p class="muted">No rows match the current view.</p>`;
  }

  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((column) => renderTableHeader(column)).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => {
            const symbol = String(row.Symbol || "").trim();
            const rowAttributes = options.stockHighlight && symbol
              ? ` data-stock-row="${escapeHtml(symbol)}" tabindex="-1"`
              : "";
            return `<tr${rowAttributes}>${columns.map((column) => `<td>${formatCell(row[column], column)}</td>`).join("")}</tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTableHeader(column) {
  const tip = tableColumnTips[column];
  if (!tip) {
    return `<th>${escapeHtml(column)}</th>`;
  }

  const tooltipId = `table-tip-${column.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
  return `
    <th>
      <span class="table-header-help" data-table-header-hint="${escapeHtml(column)}">
        <span>${escapeHtml(column)}</span>
        <button class="tooltip-trigger table-tooltip-trigger" type="button" aria-label="Explain ${escapeHtml(tip.title)}" aria-describedby="${tooltipId}">?</button>
        <span id="${tooltipId}" class="tooltip-card table-tooltip-card" role="tooltip">
          <strong>${escapeHtml(tip.title)}</strong>
          <span>คืออะไร: ${escapeHtml(tip.meaning)}</span>
          <span>ค่าที่น่าเริ่มดู: ${escapeHtml(tip.goodValue)}</span>
          <span>ข้อควรระวัง: ${escapeHtml(tip.caution)}</span>
        </span>
      </span>
    </th>
  `;
}

function attachStockHighlightControls(scope = document) {
  if (!scope) {
    return;
  }

  scope.querySelectorAll("[data-stock-highlight]").forEach((control) => {
    const symbol = control.dataset.stockHighlight || "";
    control.addEventListener("click", () => highlightStockTableRow(symbol, scope));
    control.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      highlightStockTableRow(symbol, scope);
    });
  });
}

function highlightStockTableRow(symbol, scope = document) {
  const normalizedSymbol = String(symbol || "").trim();
  if (!normalizedSymbol || !scope) {
    return;
  }

  const rows = [...scope.querySelectorAll("[data-stock-row]")];
  const target = rows.find((row) => row.dataset.stockRow === normalizedSymbol);
  rows.forEach((row) => row.classList.toggle("table-row-highlight", row === target));
  scope.querySelectorAll("[data-stock-highlight]").forEach((control) => {
    control.classList.toggle("selected", (control.dataset.stockHighlight || "") === normalizedSymbol);
  });

  const status = scope.querySelector("[data-stock-highlight-status]");
  if (!target) {
    if (status) {
      status.textContent = `${normalizedSymbol} is not visible in the current table filter.`;
    }
    return;
  }

  if (status) {
    status.textContent = `Focused ${normalizedSymbol} in the table.`;
  }
  target.focus({ preventScroll: true });
  target.scrollIntoView({ behavior: "smooth", block: "center" });
}

function metric(label, value) {
  return `<div class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(String(value))}</strong></div>`;
}

function option(value, label, selectedValue) {
  return `<option value="${escapeHtml(value)}"${value === selectedValue ? " selected" : ""}>${escapeHtml(label)}</option>`;
}

function subscriptionStatusLabel(status) {
  return {
    active: "Active",
    trialing: "Trialing",
    past_due: "Past due",
    canceled: "Canceled",
    inactive: "Inactive",
  }[status] || "Active";
}

function subscriptionExpiryValue(subscription = {}) {
  const dateValue = subscription.status === "trialing"
    ? subscription.trialEndsAt || subscription.renewsAt
    : subscription.renewsAt || subscription.trialEndsAt;
  if (!dateValue) {
    return "";
  }

  const parsed = new Date(dateValue);
  if (!Number.isFinite(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function approvalActionTypeLabel(actionType) {
  return {
    portfolio_review: "Portfolio review",
    rebalance: "Rebalance",
    buy_plan: "Buy plan",
    risk_action: "Risk action",
    subscription_support: "Subscription support",
    other: "Other",
  }[actionType] || "Portfolio review";
}

function canViewWorkspace() {
  return canViewBusinessMetrics() || (hasRolePermission("client_workspace") && hasEntitlement("client.workspace"));
}

function canSeeWorkspaceNav() {
  return hasRolePermission("business_metrics") || hasRolePermission("team_management") || hasRolePermission("client_workspace");
}

function canViewBusinessMetrics() {
  return hasRolePermission("business_metrics") && hasEntitlement("business.metrics");
}

function canManageRoles() {
  return hasRolePermission("role_management") && hasEntitlement("role.management");
}

function canManageSubscriptions() {
  return ["owner", "admin"].includes(state.user?.role) && hasEntitlement("business.metrics");
}

function canDeleteUsers() {
  return canManageSubscriptions();
}

function canAssignAdvisors() {
  return hasRolePermission("advisor_assignment") && hasEntitlement("advisor.assignment");
}

function canManageOrganizations() {
  return hasRolePermission("organization_management") && hasEntitlement("organization.management");
}

function canCreateApprovalRequests() {
  return ["owner", "admin", "advisor"].includes(state.user?.role) && hasEntitlement("approval.workflow");
}

function hasPermission(permission) {
  return hasRolePermission(permission);
}

function hasRolePermission(permission) {
  return Boolean(state.user?.permissions?.includes(permission) || state.policy?.permissions?.includes(permission));
}

function hasEntitlement(featureId) {
  return Boolean(state.user?.entitlements?.effectiveFeatures?.includes(featureId));
}

function featurePolicy(featureId) {
  const lockedFeature = (state.user?.entitlements?.lockedFeatures || []).find((feature) => feature.id === featureId);
  if (lockedFeature) {
    return lockedFeature;
  }

  for (const plan of state.plans || []) {
    if ((plan.entitlements || []).includes(featureId)) {
      return {
        id: featureId,
        label: featureId.replaceAll(".", " "),
        requiredPlanId: plan.id,
        requiredPlanName: plan.name,
        description: "",
      };
    }
  }

  return {
    id: featureId,
    label: featureId.replaceAll(".", " "),
    requiredPlanId: "pro",
    requiredPlanName: "Pro",
    description: "",
  };
}

function renderLockedFeature(featureId) {
  const feature = featurePolicy(featureId);
  const plan = state.plans.find((candidate) => candidate.id === feature.requiredPlanId);
  const currentPlan = state.user?.entitlements?.planName || state.user?.subscription?.plan || "Current plan";
  const publicUpgradeAvailable = Boolean(plan);

  return `
    <section class="locked-card">
      <p class="eyebrow">Upgrade Required</p>
      <h3>${escapeHtml(feature.label)}</h3>
      <p class="muted">${escapeHtml(feature.description || `${feature.label} is not included in ${currentPlan}.`)}</p>
      <div class="metric-grid">
        ${metric("Current Plan", currentPlan)}
        ${metric("Required Plan", feature.requiredPlanName || feature.requiredPlanId)}
        ${metric("Monthly Price", plan ? money(plan.priceThb || 0) : "-")}
        ${metric("Status", state.user?.entitlements?.status || state.user?.subscription?.status || "-")}
      </div>
      ${publicUpgradeAvailable
        ? `<button type="button" data-upgrade-plan="${escapeHtml(feature.requiredPlanId || "pro")}">Upgrade to ${escapeHtml(feature.requiredPlanName || "Pro")}</button>`
        : `<button type="button" disabled data-deferred-upgrade="${escapeHtml(feature.requiredPlanId || "advisor")}">${escapeHtml(feature.requiredPlanName || "Advisor")} coming soon</button>
          <p class="muted" data-deferred-upgrade-note>ช่วงแรกเปิดใช้งานจริงเฉพาะ Starter/Pro ก่อน หากต้องใช้ feature นี้ให้ owner/admin จัดการแบบ manual หรือรอ Advisor package รอบถัดไป</p>`}
    </section>
  `;
}

function isPublicLaunchPlan(planId) {
  return state.plans.some((plan) => plan.id === String(planId || "").toLowerCase());
}

function cssEscape(value) {
  if (globalThis.CSS?.escape) {
    return globalThis.CSS.escape(String(value));
  }

  return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function getCurrentPlanId() {
  const subscription = state.user?.subscription || {};
  if (subscription.planId) {
    return String(subscription.planId).toLowerCase();
  }

  return String(subscription.plan || "").toLowerCase();
}

function getSectorStats(sectorRows) {
  const firstRow = sectorRows.find((row) => numberValue(row.Sector_PE) || numberValue(row.Sector_ROE) || numberValue(row.Sector_Yield));
  return {
    pe: firstRow ? numberValue(firstRow.Sector_PE) : median(sectorRows.map((row) => numberValue(row.PE))),
    roe: firstRow ? numberValue(firstRow.Sector_ROE) : median(sectorRows.map((row) => numberValue(row.ROE))),
    yield: firstRow ? numberValue(firstRow.Sector_Yield) : median(sectorRows.map((row) => numberValue(row.Yield))),
  };
}

function buildSectorInsights(sectors, portfolioRows = []) {
  const totalPortfolioValue = sum(portfolioRows, "Market_Value");
  const portfolioBySector = groupBy(portfolioRows, "Sector");
  return Object.entries(sectors)
    .map(([sector, sectorRows]) => {
      const rows = sectorRows.slice();
      const stats = getSectorStats(rows);
      const leader = rows.slice().sort((left, right) => numberValue(right.Total_Score) - numberValue(left.Total_Score))[0];
      const avgScore = average(rows, "Total_Score");
      const avgRrr = average(rows, "RRR");
      const avgUpside = average(rows, "Upside_Pct");
      const avgDe = average(rows, "DE");
      const bullishPct = percentOf(rows, (row) => /Bullish|Uptrend|Positive/i.test(String(row.Trend_Status || "")));
      const bearishPct = percentOf(rows, (row) => /Bearish|Downtrend|Negative/i.test(String(row.Trend_Status || "")));
      const topIdeas = rows.filter((row) => numberValue(row.Total_Score) >= 70).length;
      const weakIdeas = rows.filter((row) => numberValue(row.Total_Score) < 45).length;
      const portfolioSectorRows = portfolioBySector[sector] || [];
      const portfolioValue = sum(portfolioSectorRows, "Market_Value");
      const exposurePct = totalPortfolioValue ? (portfolioValue / totalPortfolioValue) * 100 : 0;
      const sectorScore = calculateSectorScore({ avgScore, avgRrr, avgUpside, avgRoe: stats.roe, avgDe, bullishPct, bearishPct });
      return {
        Sector: sector,
        Count: rows.length,
        Sector_Score: sectorScore,
        Rotation_Signal: sectorRotationSignal({ sectorScore, avgScore, avgRrr, avgUpside, bullishPct, bearishPct, stats }),
        Portfolio_Exposure_Pct: exposurePct,
        Portfolio_Risk: portfolioSectorRisk({ exposurePct, sectorScore, weakIdeas, portfolioSectorRows }),
        Median_PE: stats.pe,
        Median_ROE: stats.roe,
        Median_Yield: stats.yield,
        Avg_Score: avgScore,
        Avg_RRR: avgRrr,
        Avg_Upside_Pct: avgUpside,
        Bullish_Pct: bullishPct,
        Bearish_Pct: bearishPct,
        Top_Ideas: topIdeas,
        Weak_Ideas: weakIdeas,
        Leader: leader?.Symbol || "-",
        Leader_Score: leader?.Total_Score || 0,
      };
    })
    .sort((left, right) => numberValue(right.Sector_Score) - numberValue(left.Sector_Score))
    .map((item, index) => ({ Rank: index + 1, ...item }));
}

function calculateSectorScore({ avgScore, avgRrr, avgUpside, avgRoe, avgDe, bullishPct, bearishPct }) {
  const rrrScore = clamp(avgRrr * 20, 0, 100);
  const upsideScore = clamp(avgUpside * 2, 0, 100);
  const roeScore = clamp(avgRoe * 3, 0, 100);
  const debtScore = 100 - clamp((avgDe / 3) * 100, 0, 100);
  const momentumScore = clamp(bullishPct - bearishPct + 50, 0, 100);
  return clamp((avgScore * 0.42) + (rrrScore * 0.16) + (upsideScore * 0.16) + (roeScore * 0.1) + (debtScore * 0.08) + (momentumScore * 0.08), 0, 100);
}

function sectorRotationSignal({ sectorScore, avgScore, avgRrr, avgUpside, bullishPct, bearishPct, stats }) {
  if (sectorScore >= 72 && bullishPct >= 45) return "Strong Sector";
  if (sectorScore >= 62 && avgUpside >= 10 && avgRrr >= 1.4) return "Accumulation Watch";
  if (sectorScore >= 55 && stats.pe <= 15 && avgScore >= 55) return "Cheap but Selective";
  if (bearishPct >= 45 || sectorScore < 45) return "Weak Momentum";
  return "Neutral";
}

function beginnerSignalText(signal) {
  return {
    "Strong Sector": "น่าศึกษาต่อ",
    "Accumulation Watch": "เริ่มทยอยดูได้",
    "Cheap but Selective": "ถูกแต่ต้องเลือกหุ้น",
    "Weak Momentum": "ระวังเป็นพิเศษ",
    Neutral: "กลางๆ รอดูเพิ่ม",
  }[signal] || signal || "-";
}

function beginnerRiskText(risk) {
  return {
    "No holding": "ยังไม่ได้ถือกลุ่มนี้",
    "Overexposed weak sector": "ถือเยอะในกลุ่มที่ยังอ่อน ควรทบทวน",
    "Concentration risk": "ถือกระจุกตัว ควรกระจายความเสี่ยง",
    "Review weak holdings": "มีหุ้นอ่อนในกลุ่มนี้ ควรตรวจรายตัว",
    "Possible underweight": "กลุ่มแข็งแรงแต่ถืออยู่น้อย",
    Balanced: "สัดส่วนดูสมดุล",
  }[risk] || risk || "-";
}

function sectorNextStep(insight = {}) {
  const signal = insight.Rotation_Signal || "Neutral";
  const risk = insight.Portfolio_Risk || "No holding";
  if (risk === "Overexposed weak sector" || risk === "Concentration risk") {
    return "เริ่มจากเช็กสัดส่วนในพอร์ตและดูหุ้นที่คะแนนต่ำก่อน";
  }
  if (signal === "Strong Sector" || signal === "Accumulation Watch") {
    return "ดู Sector leaders แล้วเลือกหุ้นที่คะแนนและ RRR ดีเพื่อศึกษาต่อ";
  }
  if (signal === "Cheap but Selective") {
    return "อย่าเหมาซื้อทั้งกลุ่ม ให้เลือกเฉพาะหุ้นที่พื้นฐานและ trend ยังดี";
  }
  if (signal === "Weak Momentum") {
    return "ยังไม่ควรรีบเพิ่มน้ำหนัก ให้ตรวจความเสี่ยงและรอสัญญาณดีขึ้น";
  }
  return "ใช้เป็นข้อมูลประกอบ แล้วเปรียบเทียบกับ sector อันดับสูงกว่า";
}

function sectorSignalReason(item = {}) {
  return `คะแนน ${formatNumber(item.Sector_Score)} · หุ้นเด่น ${formatNumber(item.Top_Ideas)} ตัว · bullish ${formatNumber(item.Bullish_Pct)}%`;
}

function portfolioSectorRisk({ exposurePct, sectorScore, weakIdeas, portfolioSectorRows }) {
  if (!portfolioSectorRows.length) return "No holding";
  if (exposurePct >= 35 && sectorScore < 55) return "Overexposed weak sector";
  if (exposurePct >= 35) return "Concentration risk";
  if (weakIdeas >= 3 && exposurePct >= 15) return "Review weak holdings";
  if (sectorScore >= 65 && exposurePct < 5) return "Possible underweight";
  return "Balanced";
}

function percentOf(rows, predicate) {
  if (!rows.length) return 0;
  return (rows.filter(predicate).length / rows.length) * 100;
}

function formatCell(value, column = "") {
  if (column === "Conflict_Severity") {
    const severity = String(value || "GREEN").toUpperCase();
    return `<span class="severity-badge severity-${escapeHtml(severity.toLowerCase())}">${escapeHtml(severity)}</span>`;
  }

  if (column === "Data_Status") {
    const status = String(value || "VALID").toUpperCase();
    return `<span class="status-badge status-${escapeHtml(status.toLowerCase().replaceAll("_", "-"))}">${escapeHtml(status.replaceAll("_", " "))}</span>`;
  }

  if (column === "Fundamental_RRR_Status") {
    const status = String(value || "INSUFFICIENT_DATA").toUpperCase();
    return `<span class="status-badge status-${escapeHtml(status.toLowerCase().replaceAll("_", "-"))}">${escapeHtml(status.replaceAll("_", " "))}</span>`;
  }

  if (column === "Action_v2_Shadow" || column === "Action_v2_Confidence" || column === "Action_v2_Risk_Block" || column === "Action_v2_Change" || column === "Decision_Engine_Mode" || column === "Effective_Action_Source") {
    const status = String(value || "-").toUpperCase();
    return `<span class="status-badge status-${escapeHtml(status.toLowerCase().replaceAll("_", "-"))}">${escapeHtml(status.replaceAll("_", " "))}</span>`;
  }

  if (column === "Conflict_Alerts" || column === "Data_Warnings" || column === "Action_v2_Rationale") {
    const text = String(value || "");
    return text
      ? `<span class="table-warning-text">${escapeHtml(text)}</span>`
      : `<span class="muted">-</span>`;
  }

  return escapeHtml(typeof value === "number" ? formatNumber(value) : String(value ?? ""));
}

function money(value) {
  return `${formatNumber(value)} THB`;
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

function formatNumber(value) {
  const number = numberValue(value);
  return number.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function shortHash(value) {
  return value ? String(value).slice(0, 12) : "-";
}

function numberValue(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function sum(rows, key) {
  return rows.reduce((total, row) => total + numberValue(row[key]), 0);
}

function average(rows, key) {
  const values = rows.map((row) => numberValue(row[key])).filter((value) => Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
}

function groupBy(rows, key) {
  return rows.reduce((groups, row) => {
    const group = row[key] || "Unknown";
    groups[group] ||= [];
    groups[group].push(row);
    return groups;
  }, {});
}

function median(values) {
  const sorted = values.slice().sort((left, right) => left - right);
  if (!sorted.length) return 0;
  const midpoint = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
