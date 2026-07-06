# Task: Think2 Safety Layer Migration

วันที่สร้าง: 2026-07-03 11:53:23 +07:00
Branch: `codex/think2-safety-layer-planning`
Baseline เดิม: tag `think-md-v1.0.0`, commit `b8a6cb5`

## เป้าหมาย

นำแนวคิดจาก `Think2.md` มาเพิ่มความปลอดภัยให้โปรแกรมสำหรับนักลงทุนมือใหม่ โดยไม่รื้อระบบเดิมทันที

แนวทางหลัก:

- คง engine เดิมจาก `think.md` ไว้ก่อน ได้แก่ `Total_Score`, `RRR`, `Advice`, `Target_Action`
- เพิ่มชั้นตรวจสอบข้อมูลและคำเตือนก่อนตัดสินใจ
- แยกเหตุผลด้านคุณภาพ ราคา จังหวะ ความเสี่ยง และสภาพคล่องให้ผู้ใช้เห็นง่ายขึ้น
- เปลี่ยน action engine เฉพาะหลังจากมี regression และ evidence เพียงพอ

## กฎเหล็ก

- ห้ามลบ `plan.md`
- ห้ามแก้ logic ซื้อขายหลักก่อนทำ safety layer และ regression
- ห้ามทำให้ผล Python parity/ผลลัพธ์เดิมพังโดยไม่มี migration note
- ห้าม commit ไฟล์ส่วนตัว เช่น `portfolio_eak.xlsx`, `portfolio_aom.xlsx`, runtime database หรือ backup state
- ทุก task ต้องอัปเดตสถานะใน `Task.md` และ `plan.md` พร้อมวันที่เวลาเมื่อเสร็จ
- ถ้า task ใดเปลี่ยน output schema ต้องเพิ่ม regression และบันทึก migration impact

## Phase 0 - Planning and Baseline Protection

### T2-00 - Confirm Think.md Stable Baseline

- สถานะ: Done
- เสร็จเมื่อ: 2026-07-03 11:53:23 +07:00
- ผลลัพธ์:
  - Commit baseline: `b8a6cb5`
  - Tag release: `think-md-v1.0.0`
  - Branch Think2 planning: `codex/think2-safety-layer-planning`

### T2-01 - Document Think2 Scope and Non-Goals

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:02:21 +07:00
- เสร็จเมื่อ: 2026-07-03 12:02:21 +07:00
- งานที่ต้องทำ:
  - [x] สรุปว่าส่วนไหนของ `Think2.md` จะทำก่อน
  - [x] สรุปว่าส่วนไหนยังไม่ทำ เช่น fundamental target จาก EPS/analyst target ที่ข้อมูลยังไม่ครบ
  - [x] ระบุ output ที่ต้องไม่เปลี่ยนใน phase แรก
- Phase 1 scope:
  - เพิ่ม `Data_Status` เพื่อบอกว่าข้อมูลใช้ตัดสินใจได้แค่ไหน
  - เพิ่ม `Data_Warnings` เพื่ออธิบายข้อมูลขาด/ผิดปกติเป็นภาษาง่าย
  - เพิ่ม `Conflict_Severity` และ `Conflict_Alerts` เพื่อเตือนกรณีคะแนนหรือ RRR อาจหลอกมือใหม่
  - เพิ่ม tooltip/คำอธิบายบน Screener และ Portfolio เฉพาะส่วนที่ช่วยให้เข้าใจความเสี่ยงก่อน action
  - เพิ่ม regression เพื่อยืนยันว่า engine เดิมยังคำนวณผลหลักเหมือนเดิม
- Phase 1 non-goals:
  - ยังไม่เปลี่ยนสูตร `Total_Score`
  - ยังไม่เปลี่ยนสูตร `RRR`
  - ยังไม่เปลี่ยน `Advice`
  - ยังไม่เปลี่ยน `Target_Action`
  - ยังไม่เปลี่ยน Simulation buy/sell rules
  - ยังไม่บังคับใช้ action labels ใหม่จาก `Think2.md`
  - ยังไม่สร้าง `Fundamental_RRR` จริงจาก EPS/fair value/analyst target เพราะข้อมูลยังไม่พร้อม
  - ยังไม่ทำ peer group validation เชิงลึกแบบแยก business model เช่น hospital vs pharma distribution จนกว่าจะมี reference master รองรับ
- Output ที่ต้องไม่เปลี่ยนใน phase แรก:
  - `recommended_stocks.csv` ยังต้องมี field เดิม เช่น `Symbol`, `Sector`, `Price`, `PE`, `Yield`, `ROE`, `Total_Score`, `RRR`, `Rationale`
  - Portfolio rows ยังต้องมี `Advice` และ `Target_Action` เดิมเพื่อไม่ให้หน้า Portfolio/Summary/Simulation พัง
  - Public UI ยังต้องอ่าน `Total_Score` ได้เหมือนเดิม
  - Python parity/comparison ต้องไม่ fail จากการเปลี่ยน behavior หลัก
  - Field ใหม่ของ Think2 safety layer ต้องเป็น additive fields เท่านั้น
- Acceptance criteria:
  - อ่าน `Task.md` แล้วรู้ทันทีว่า Think2 phase แรกคือ safety layer ไม่ใช่ engine replacement
  - AI รอบถัดไปมี non-goals ชัดเจนพอที่จะไม่แก้ action engine ก่อนเวลา
  - Task ถัดไปที่ควรทำคือ `T2-02 - Add Data Validation Status`

## Phase 1 - Safety Layer Without Replacing Existing Engine

### T2-02 - Add Data Validation Status

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:03:46 +07:00
- เสร็จเมื่อ: 2026-07-03 12:06:48 +07:00
- เป้าหมาย:
  - เพิ่ม `Data_Status`: `VALID`, `REVIEW_REQUIRED`, `DATA_ERROR`
  - เพิ่ม `Data_Warnings` แบบอ่านง่าย
- เงื่อนไขสำคัญ:
  - ยังไม่เปลี่ยน `Total_Score`
  - ยังไม่เปลี่ยน `Target_Action`
  - ถ้าข้อมูลหาย ให้เตือนก่อน ไม่ใช่ให้คำแนะนำมั่นใจเกินจริง
- ผลลัพธ์:
  - เพิ่ม `Data_Status` และ `Data_Warnings` ใน stock recommendation rows
  - เพิ่ม `Data_Status` และ `Data_Warnings` ให้ portfolio rows ทั้งกรณีมี market row และไม่มี market row
  - เพิ่มคำอธิบาย `Data_Status`/`Data_Warnings` ใน Excel guide sheet
  - เพิ่ม regression `scripts/think2DataValidationRegression.js`
  - เพิ่ม npm script `test:think2-data-validation` และใส่ใน `test-regression`
  - ยืนยันว่า Phase 1 ยังไม่เปลี่ยน `Total_Score`, `RRR`, `Advice`, `Target_Action`
- ทดสอบผ่าน:
  - `node --check src/services/stockAnalysisService.js`
  - `node --check src/services/portfolioService.js`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-03 - Add Conflict Alerts`

### T2-03 - Add Conflict Alerts

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:07:51 +07:00
- เสร็จเมื่อ: 2026-07-03 12:10:01 +07:00
- Conflict ขั้นแรกที่ใช้ข้อมูลปัจจุบันได้:
  - `UNKNOWN_SECTOR`
  - `ABNORMAL_DE`
  - `PE_LOSS_OR_ABNORMAL`
  - `HIGH_RRR_LOW_SCORE`
  - `HIGH_SCORE_LOW_RRR`
  - `OVERSOLD_BEARISH`
  - `NEAR_52W_HIGH`
  - `LOW_LIQUIDITY`
- ผลลัพธ์ที่ต้องมี:
  - `Conflict_Severity`: `GREEN`, `YELLOW`, `ORANGE`, `RED`
  - `Conflict_Alerts`: ข้อความเตือนสำหรับผู้ใช้มือใหม่
- ผลลัพธ์:
  - เพิ่ม `Conflict_Severity` และ `Conflict_Alerts` ใน stock recommendation rows
  - เพิ่ม conflict สำหรับ `UNKNOWN_SECTOR`, `ABNORMAL_DE`, `PE_LOSS_OR_ABNORMAL`, `HIGH_RRR_LOW_SCORE`, `HIGH_SCORE_LOW_RRR`, `OVERSOLD_BEARISH`, `NEAR_52W_HIGH`, `LOW_LIQUIDITY`
  - เพิ่ม `MISSING_MARKET_DATA` เป็น RED conflict สำหรับ portfolio holding ที่ไม่มี market row
  - เพิ่ม field conflict ใน Portfolio Excel report และ guide sheet
  - ขยาย regression `test:think2-data-validation` ให้ตรวจ conflict หลักและยืนยันว่า Phase 1 ยังไม่เปลี่ยน `Advice`/`Target_Action`
- ทดสอบผ่าน:
  - `node --check src/services/stockAnalysisService.js`
  - `node --check src/services/portfolioService.js`
  - `node --check scripts/think2DataValidationRegression.js`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-04 - Show Conflicts in Screener and Portfolio`

### T2-04 - Show Conflicts in Screener and Portfolio

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:10:49 +07:00
- เสร็จเมื่อ: 2026-07-03 12:14:54 +07:00
- งานที่ต้องทำ:
  - [x] เพิ่ม column หรือ badge ในตาราง
  - [x] เพิ่ม tooltip ภาษาง่าย
  - [x] แสดงคำเตือนก่อน action เมื่อมี RED/ORANGE conflict
- UX requirement:
  - มือใหม่ต้องเข้าใจว่า “คะแนนสูงแต่ยังไม่ควรซื้อเพราะอะไร”
- ผลลัพธ์:
  - เพิ่ม `Conflict_Severity`, `Data_Status`, `Conflict_Alerts`, `Data_Warnings` ใน field picker ของ Recommended actions
  - หน้า Screener แสดง `Conflict_Severity` และ `Conflict_Alerts` ในตาราง
  - เพิ่ม `Safety check before acting` summary บน Portfolio และ Screener เมื่อมี YELLOW/ORANGE/RED หรือ data warning
  - เพิ่ม badge สีสำหรับ `Conflict_Severity` และ `Data_Status`
  - เพิ่ม tooltip header สำหรับ field safety layer ทั้งหมด
  - bump frontend bundle เป็น `20260703-1211`
- ทดสอบผ่าน:
  - `node --check src/public/app.js`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-05 - Add Regression for Safety Layer`

### T2-05 - Add Regression for Safety Layer

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:15:39 +07:00
- เสร็จเมื่อ: 2026-07-03 12:15:39 +07:00
- งานที่ต้องทำ:
  - [x] เพิ่ม fixture หุ้นที่มีข้อมูลผิด/เสี่ยง
  - [x] ตรวจว่า engine เดิมยังให้ `Total_Score` ได้
  - [x] ตรวจว่า safety layer สร้าง warning ถูกต้อง
  - [x] ตรวจว่า phase นี้ยังไม่เปลี่ยน action หลัก
- ผลลัพธ์:
  - `scripts/think2DataValidationRegression.js` ครอบคลุม valid/review/data error, conflict alerts, portfolio propagation และ action unchanged
  - `scripts/frontendViewportRegression.js` และ `scripts/webAppSmokeRegression.js` ครอบคลุม marker ของ safety summary, badge และ tooltip
  - `scripts/comparePythonOutputs.js` ยังยืนยัน formula/text/sector mismatch = 0
- ทดสอบที่ใช้ยืนยัน:
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
- งานถัดไป:
  - `T2-06 - Add Derived Score Matrix`

## Phase 2 - Explainable Score Matrix

### T2-06 - Add Derived Score Matrix

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:22:02 +07:00
- เสร็จเมื่อ: 2026-07-03 12:25:02 +07:00
- เป้าหมาย:
  - เพิ่มคะแนนแยกที่คำนวณจากข้อมูลเดิมก่อน:
    - `Quality_Score`
    - `Valuation_Score`
    - `Setup_Score`
    - `Balance_Risk_Score`
    - `Liquidity_Score`
    - `Composite_Score_v2`
- เงื่อนไข:
  - `Composite_Score_v2` เป็นข้อมูลประกอบเท่านั้น
  - ยังไม่ใช้แทน `Total_Score` จนกว่าจะผ่าน comparison/report
- ผลลัพธ์:
  - เพิ่ม `Quality_Score`, `Valuation_Score`, `Setup_Score`, `Balance_Risk_Score`, `Liquidity_Score`, `Composite_Score_v2`
  - สูตรใช้เฉพาะข้อมูลที่มีอยู่แล้ว เช่น ROE, PE, Yield, D/E, RSI, Price Position และ Volume Ratio
  - ส่งต่อ score matrix ไป Portfolio rows และ Excel report
  - เพิ่ม tooltip สำหรับ score matrix fields
  - เพิ่ม field optional ใน Recommended actions field picker
  - เพิ่มคอลัมน์ `Quality_Score`, `Valuation_Score`, `Setup_Score` ใน Screener table เพื่ออ่านเหตุผลแยกมิติ
  - bump frontend bundle เป็น `20260703-1224`
  - ยืนยันว่า `Composite_Score_v2` ยังเป็น shadow/additive information และไม่แทน `Total_Score`
- ทดสอบผ่าน:
  - `node --check src/services/stockAnalysisService.js`
  - `node --check src/services/portfolioService.js`
  - `node --check src/public/app.js`
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-07 - Add Beginner Explanation Cards`

### T2-07 - Add Beginner Explanation Cards

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:25:48 +07:00
- เสร็จเมื่อ: 2026-07-03 12:28:15 +07:00
- งานที่ต้องทำ:
  - [x] อธิบายคะแนนแต่ละมิติแบบภาษาคนทั่วไป
  - [x] แยก “หุ้นดี”, “ราคาน่าสนใจ”, “จังหวะเข้า”, “ความเสี่ยง”, “สภาพคล่อง”
  - [x] หลีกเลี่ยงการทำหน้าแน่นเกินไป
- ผลลัพธ์:
  - เพิ่ม `Score matrix แบบอ่านง่าย` บน Portfolio และ Screener เมื่อมี score matrix data
  - การ์ดอธิบาย Quality, Valuation, Setup, Risk, Liquidity เป็นภาษาง่าย
  - การ์ดย้ำว่า score matrix ยังไม่แทน `Total_Score` หรือ `Target_Action`
  - เพิ่ม responsive CSS สำหรับจอแคบ
  - bump frontend bundle เป็น `20260703-1227`
- ทดสอบผ่าน:
  - `node --check src/public/app.js`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-08 - Split Technical RRR and Fundamental RRR Placeholder`

## Phase 3 - Technical vs Fundamental RRR

### T2-08 - Split Technical RRR and Fundamental RRR Placeholder

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:31:08 +07:00
- เสร็จเมื่อ: 2026-07-03 12:34:32 +07:00
- แนวทาง:
  - `Technical_RRR` ใช้ 52W high/low เหมือนเดิม
  - `Fundamental_RRR` เริ่มเป็น `INSUFFICIENT_DATA` หากยังไม่มี fair value/EPS target
  - ห้ามสร้าง fundamental target ปลอมจากข้อมูลไม่พอ
- ผลลัพธ์:
  - เพิ่ม `Technical_RRR` โดย mirror ค่า `RRR` เดิมใน placeholder phase
  - เพิ่ม `Fundamental_RRR`, `Fundamental_RRR_Status`, `Fundamental_RRR_Source`, `Fundamental_RRR_Note`
  - `Fundamental_RRR` เป็น `null` และ status เป็น `INSUFFICIENT_DATA` จนกว่าจะมี fair value/EPS/analyst target จริง
  - ส่งต่อ fields ไป Portfolio rows และ Excel report
  - เพิ่ม tooltip/field optional ใน frontend และ Screener table แสดง `Technical_RRR`, `Fundamental_RRR_Status`
  - bump frontend bundle เป็น `20260703-1234`
- ทดสอบผ่าน:
  - `node --check src/services/stockAnalysisService.js`
  - `node --check src/services/portfolioService.js`
  - `node --check src/public/app.js`
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-09 - Add Fundamental Data Readiness Report`

### T2-09 - Add Fundamental Data Readiness Report

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-03 12:35:21 +07:00
- เสร็จเมื่อ: 2026-07-03 12:37:47 +07:00
- งานที่ต้องทำ:
  - [x] ตรวจว่าข้อมูลใดต้องเพิ่มเพื่อทำ Think2 เต็มรูปแบบ
  - [x] รายงาน missing EPS, growth, payout, analyst target, fair value
  - [x] ใช้ผลนี้ตัดสินใจว่าจะลงทุนเพิ่ม data source หรือไม่
- ผลลัพธ์:
  - เพิ่ม `src/services/fundamentalReadinessService.js`
  - เพิ่ม CLI `npm run fundamental:readiness`
  - เพิ่ม regression `npm run test:fundamental-readiness`
  - report ล่าสุดจาก `recommended_stocks.csv`: rows 108, status `INSUFFICIENT_DATA`
  - coverage ล่าสุด: Normalized EPS 0/108, Profit growth 0/108, Revenue growth 0/108, Payout ratio 0/108, Analyst target 0/108, Fair value 0/108
  - recommendation: ยังไม่ควรคำนวณ Fundamental RRR จริงจนกว่าจะเพิ่ม data source
- ทดสอบผ่าน:
  - `node --check src/services/fundamentalReadinessService.js`
  - `node --check scripts/fundamentalReadinessReport.js`
  - `node --check scripts/fundamentalReadinessRegression.js`
  - `npm run test:fundamental-readiness`
  - `npm run fundamental:readiness -- --format text`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-10 - Build Action Matrix in Shadow Mode`

## Phase 4 - Action Matrix Pilot

### T2-10 - Build Action Matrix in Shadow Mode

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 07:42:32 +07:00
- เสร็จเมื่อ: 2026-07-06 07:47:46 +07:00
- เป้าหมาย:
  - สร้าง `Action_v2_Shadow` โดยไม่แทน `Target_Action`
  - แสดงเฉพาะ owner/admin หรือ debug panel ก่อน
  - เทียบผลต่างระหว่าง action เดิมกับ action v2
- งานที่ต้องทำ:
  - [x] เพิ่ม action matrix service/helper แบบ shadow-only
  - [x] ส่งต่อ `Action_v2_Shadow`, เหตุผล, risk block และ comparison ไปยัง portfolio/report
  - [x] เพิ่ม UI/debug fields สำหรับ owner/admin โดยไม่เปิดใช้เป็น action จริง
  - [x] เพิ่ม regression ยืนยันว่า `Advice` และ `Target_Action` เดิมไม่เปลี่ยน
  - [x] อัปเดต `plan.md` หลังทดสอบเสร็จ
- ผลลัพธ์:
  - เพิ่ม `src/services/actionMatrixService.js` สำหรับคำนวณ `Action_v2_Shadow`
  - เพิ่ม field `Action_v2_Shadow`, `Action_v2_Confidence`, `Action_v2_Risk_Block`, `Action_v2_Change`, `Action_v2_Rationale`
  - Portfolio report และ UI รองรับ field ใหม่แบบ optional/debug
  - `Target_Action` และ `Advice` เดิมยังไม่ถูกแทน
  - bump frontend bundle เป็น `20260706-0748`
- ทดสอบผ่าน:
  - `node --check src/services/actionMatrixService.js`
  - `node --check src/services/stockAnalysisService.js`
  - `node --check src/services/portfolioService.js`
  - `node --check src/public/app.js`
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-11 - Compare Think.md Action vs Think2 Shadow Action`

### T2-11 - Compare Think.md Action vs Think2 Shadow Action

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 07:49:32 +07:00
- เสร็จเมื่อ: 2026-07-06 07:53:26 +07:00
- งานที่ต้องทำ:
  - [x] สรุปจำนวนหุ้นที่ action เปลี่ยน
  - [x] แยกกรณีที่ Think2 block buy เพราะ RED conflict
  - [x] สร้าง report/CLI ให้เอกรีวิวก่อนเปิดใช้กับผู้ใช้จริง
  - [x] เพิ่ม regression กัน report หายหรือคำนวณผิด
  - [x] อัปเดต `plan.md` หลังทดสอบเสร็จ
- ผลลัพธ์:
  - เพิ่ม `src/services/actionMatrixComparisonService.js`
  - เพิ่ม CLI `npm run action:compare`
  - เพิ่ม regression `npm run test:action-matrix-comparison` และใส่เข้า `test-regression`
  - report ล่าสุดจาก `data/outputs/portfolio_regression_compare_analysis_report.xlsx`: rows 5, changed action family 2 (40.00%), risk blocked 0, RED blocked legacy buy 0, DATA_ERROR blocked 0
  - recommendation: ยังควรเก็บ Think2 เป็น shadow mode เพราะ action เปลี่ยนกลุ่มหลายตัวใน sample
- ทดสอบผ่าน:
  - `node --check src/services/actionMatrixComparisonService.js`
  - `node --check scripts/actionMatrixComparisonReport.js`
  - `node --check scripts/actionMatrixComparisonRegression.js`
  - `npm run test:action-matrix-comparison`
  - `npm run action:compare -- --format text`
  - `npm run test:think2-data-validation`
  - `npm run test:analysis-portfolio-flow`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-12 - Add Feature Flag for Think2 Decision Engine`

## Phase 5 - Controlled Rollout

### T2-12 - Add Feature Flag for Think2 Decision Engine

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 07:55:12 +07:00
- เสร็จเมื่อ: 2026-07-06 07:59:40 +07:00
- แนวทาง:
  - Default ยังใช้ Think.md engine
  - เปิด Think2 เฉพาะ env/config หรือ owner setting
  - ต้อง rollback กลับ Think.md ได้ทันที
- งานที่ต้องทำ:
  - [x] เพิ่ม feature flag service สำหรับ `THINK2_DECISION_ENGINE=off|shadow|enabled`
  - [x] เพิ่ม effective action field โดย default ยังเท่ากับ `Target_Action`
  - [x] เปิด Think2 action จริงได้เฉพาะเมื่อตั้ง flag เป็น `enabled`
  - [x] แสดงสถานะ flag ใน health/UI/debug โดยไม่ทำให้ผู้ใช้ทั่วไปสับสน
  - [x] เพิ่ม regression ตรวจ default off/shadow และ enabled mode
  - [x] อัปเดต `plan.md` หลังทดสอบเสร็จ
- ผลลัพธ์:
  - เพิ่ม `src/services/decisionEngineConfigService.js`
  - รองรับ env `THINK2_DECISION_ENGINE=off|shadow|enabled`
  - default mode คือ `shadow` แต่ `think2DecisionEnabled=false` และ `Effective_Target_Action` ยังเท่ากับ `Target_Action`
  - ถ้าเปิด `enabled` จะใช้ `Action_v2_Shadow` เป็น `Effective_Target_Action` แต่ยังไม่ mutate `Target_Action`
  - `/api/health` แสดงสถานะ decision engine
  - UI field picker เพิ่ม `Decision_Engine_Mode`, `Effective_Target_Action`, `Effective_Action_Source`
  - bump frontend bundle เป็น `20260706-0758`
  - เพิ่ม regression `npm run test:decision-engine-flag`
- ทดสอบผ่าน:
  - `node --check src/services/decisionEngineConfigService.js`
  - `node --check src/services/portfolioService.js`
  - `node --check src/server.js`
  - `node --check scripts/decisionEngineFeatureFlagRegression.js`
  - `npm run test:decision-engine-flag`
  - `npm run test:think2-data-validation`
  - `npm run test:action-matrix-comparison`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`
- งานถัดไป:
  - `T2-13 - Release Think2 Beta`

### T2-13 - Release Think2 Beta

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 08:04:32 +07:00
- เสร็จเมื่อ: 2026-07-06 08:07:04 +07:00
- เงื่อนไขก่อน release:
  - [x] regression ผ่าน
  - [x] มี comparison report
  - [x] มี UX warning ชัดเจน
  - [x] มี rollback tag/branch
- งานที่ต้องทำ:
  - [x] เพิ่มเอกสาร Think2 Beta release note/runbook
  - [x] ระบุ feature flag, default mode, วิธีเปิด beta และวิธี rollback
  - [x] สรุป comparison report ล่าสุดและข้อควรระวัง
  - [x] รันทดสอบ release gate ที่เกี่ยวข้อง
  - [x] อัปเดต `plan.md` หลังทดสอบเสร็จ
- ผลลัพธ์:
  - เพิ่ม `docs/THINK2_BETA_RELEASE.md`
  - เพิ่ม `npm run test:think2-beta-release`
  - เอกสารระบุ feature flag `THINK2_DECISION_ENGINE=off|shadow|enabled`
  - เอกสารระบุ rollback baseline `think-md-v1.0.0` commit `b8a6cb5`
  - เอกสารสรุป comparison ล่าสุด: rows 5, changed action family 2 (40.00%), risk blocked 0, RED blocked legacy buy 0
  - ยังไม่สร้าง tag ใหม่ เพราะงาน T2-10 ถึง T2-13 ยังไม่ได้ commit
- ทดสอบผ่าน:
  - `node --check scripts/think2BetaReleaseRegression.js`
  - `npm run test:think2-beta-release`
  - `npm run test:decision-engine-flag`
  - `npm run test:action-matrix-comparison`
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run action:compare -- --format text`
  - `npm run check`

### T2-14 - Package Think2 Beta Foundation Commit

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 08:08:42 +07:00
- เสร็จเมื่อ: 2026-07-06 08:10:32 +07:00
- เป้าหมาย:
  - Commit งาน T2-10 ถึง T2-13 เป็นจุดย้อนกลับก่อนสร้าง beta tag หรือเปิด feature flag จริง
  - Stage เฉพาะโค้ด เอกสาร และ regression ที่เกี่ยวข้อง
  - ห้าม stage private workbook, database, CSV output หรือ runtime artifacts
- งานที่ต้องทำ:
  - [x] ตรวจ working tree และรายการไฟล์
  - [x] รันทดสอบ release gate สำคัญซ้ำก่อน commit
  - [x] Stage เฉพาะไฟล์งาน Think2 beta foundation
  - [x] Commit ด้วยข้อความชัดเจน
  - [x] อัปเดต `plan.md` หลัง commit สำเร็จ
- ผลลัพธ์:
  - Commit สำเร็จ: `64caa6a Add Think2 beta decision foundation`
  - Stage เฉพาะไฟล์โค้ด เอกสาร และ regression ของ Think2 beta foundation
  - ไม่มี private workbook, database, CSV output หรือ runtime artifacts ถูก stage
  - Working tree สะอาดหลัง commit ก่อนอัปเดต ledger ปิดงาน
- ทดสอบผ่านก่อน commit:
  - `npm run test:think2-beta-release`
  - `npm run test:decision-engine-flag`
  - `npm run test:action-matrix-comparison`
  - `npm run test:think2-data-validation`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:analysis-portfolio-flow`
  - `npm run compare:python`
  - `npm run check`

### T2-15 - Create Think2 Beta Local Tag

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 08:20:36 +07:00
- เสร็จเมื่อ: 2026-07-06 08:25:17 +07:00
- เป้าหมาย:
  - สร้าง local beta tag ให้ commit `b6c2feb Add Think2 beta decision foundation`
  - ใช้เป็นจุดอ้างอิง release/rollback ของ Think2 beta foundation
  - ยังไม่ push tag ไป GitHub จนกว่าเอกสั่ง
- งานที่ต้องทำ:
  - [x] ตรวจว่า working tree สะอาด
  - [x] ตรวจว่ายังไม่มี tag beta ซ้ำ
  - [x] สร้าง annotated tag สำหรับ Think2 beta
  - [x] ตรวจ tag ชี้ commit ถูกต้อง
  - [x] อัปเดต `plan.md` หลังสร้าง tag
- ผลลัพธ์:
  - สร้าง local annotated tag `think2-beta-v0.1.0`
  - tag ชี้ commit `b6c2feb Add Think2 beta decision foundation`
  - ยังไม่ได้ push tag ไป GitHub
  - หลังสร้าง tag มีเฉพาะ `Task.md` และ `plan.md` ที่แก้เพื่อปิด ledger

### T2-16 - Push Think2 Beta Branch and Tag

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 08:32:28 +07:00
- Blocked เมื่อ: 2026-07-06 08:36:42 +07:00
- เสร็จเมื่อ: 2026-07-06 09:26:25 +07:00
- เป้าหมาย:
  - Push branch `codex/think2-safety-layer-planning` ไป GitHub
  - Push local tag `think2-beta-v0.1.0` ไป GitHub
  - ไม่ merge เข้า `main` และไม่สร้าง Pull Request
- งานที่ต้องทำ:
  - [x] ตรวจ working tree, remote, branch และ tag
  - [x] Push branch ปัจจุบันไป `origin`
  - [x] Push tag `think2-beta-v0.1.0` ไป `origin`
  - [x] ตรวจสถานะหลัง push attempt
  - [x] อัปเดต `plan.md` หลัง push attempt
- สถานะล่าสุด:
  - 2026-07-06: เอก push tag สำเร็จแล้ว: `think2-beta-v0.1.0 -> think2-beta-v0.1.0`
  - 2026-07-06: push branch สำเร็จแล้ว: `fe8beb8..51155a7 codex/think2-safety-layer-planning -> codex/think2-safety-layer-planning`
  - Remote branch และ remote tag พร้อมบน GitHub
  - Working tree สะอาดหลัง push สำเร็จ

### T2-17 - Post-Push Think2 Beta Verification

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 15:14:05 +07:00
- เสร็จเมื่อ: 2026-07-06 15:14:05 +07:00
- เป้าหมาย:
  - ตรวจสถานะหลัง push branch/tag สำเร็จ
  - รัน gate สั้นสำหรับ Think2 beta
  - บันทึกข้อจำกัดของ remote verification ใน environment นี้
- ผลลัพธ์:
  - Working tree สะอาด
  - `git status -sb` แสดง branch `codex/think2-safety-layer-planning...origin/codex/think2-safety-layer-planning`
  - `git ls-remote` ใน Codex ยังคืน exit code 1 แบบไม่มี output จึงใช้ push output ล่าสุดและ branch tracking เป็นหลักฐาน
  - `npm run test:think2-beta-release` ผ่าน
  - `npm run test:decision-engine-flag` ผ่าน
  - `npm run action:compare -- --format text` ผ่าน
  - comparison ล่าสุด: rows 5, changed action family 2 (40.00%), risk blocked 0, RED blocked legacy buy 0, DATA_ERROR blocked 0
- งานถัดไป:
  - รอเอกสั่งว่าจะเปิด Pull Request, review beta branch, หรือเริ่ม feature ใหม่

### T2-18 - Review Think2 Beta Branch Readiness

- สถานะ: Done
- เริ่มเมื่อ: 2026-07-06 15:17:25 +07:00
- เสร็จเมื่อ: 2026-07-06 15:24:58 +07:00
- เป้าหมาย:
  - ตรวจ readiness ของ beta branch หลัง push โดยยังไม่เปิด PR และยังไม่ merge เข้า `main`
  - รัน regression รวมที่ branch ปัจจุบันเพื่อจับ regression ที่ targeted gate อาจไม่ครอบคลุม
  - บันทึกผลให้เอกใช้ตัดสินใจว่าจะเปิด PR หรือ review เพิ่ม
- งานที่ต้องทำ:
  - [x] ตรวจ working tree และ branch tracking
  - [x] รัน `npm run test-regression`
  - [x] บันทึกผลและข้อจำกัดใน `plan.md`
  - [x] Commit/push ledger ถ้าทดสอบผ่าน
- ผลลัพธ์:
  - `npm run test-regression` ผ่านครบ
  - ปรับ regression fixtures 4 ไฟล์ให้ตรงกับ flow package ปัจจุบัน: สมัครสมาชิกแล้วต้องมี package active ก่อนใช้ feature ที่มี entitlement
  - ยังไม่เปิด PR และยังไม่ merge เข้า `main`

## AI Prompt สำหรับทำต่อ

อ่าน `plan.md`, `Task.md`, `think.md`, และ `Think2.md` ก่อนเริ่มงานเสมอ

เป้าหมายของ branch นี้คือเพิ่ม Think2 แบบปลอดภัย:

1. อย่ารื้อ engine เดิมทันที
2. เริ่มจาก safety layer: data status + conflict alerts
3. รักษา `Total_Score`, `RRR`, `Advice`, `Target_Action` เดิมใน phase แรก
4. ทุกครั้งที่เพิ่ม field ใหม่ ต้องเพิ่ม regression และ tooltip/คำอธิบายสำหรับมือใหม่
5. ถ้าจะเปลี่ยน action จริง ต้องทำ shadow mode และ comparison report ก่อน
