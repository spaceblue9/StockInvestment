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

- สถานะ: Pending
- งานที่ต้องทำ:
  - สรุปว่าส่วนไหนของ `Think2.md` จะทำก่อน
  - สรุปว่าส่วนไหนยังไม่ทำ เช่น fundamental target จาก EPS/analyst target ที่ข้อมูลยังไม่ครบ
  - ระบุ output ที่ต้องไม่เปลี่ยนใน phase แรก

## Phase 1 - Safety Layer Without Replacing Existing Engine

### T2-02 - Add Data Validation Status

- สถานะ: Pending
- เป้าหมาย:
  - เพิ่ม `Data_Status`: `VALID`, `REVIEW_REQUIRED`, `DATA_ERROR`
  - เพิ่ม `Data_Warnings` แบบอ่านง่าย
- เงื่อนไขสำคัญ:
  - ยังไม่เปลี่ยน `Total_Score`
  - ยังไม่เปลี่ยน `Target_Action`
  - ถ้าข้อมูลหาย ให้เตือนก่อน ไม่ใช่ให้คำแนะนำมั่นใจเกินจริง

### T2-03 - Add Conflict Alerts

- สถานะ: Pending
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

### T2-04 - Show Conflicts in Screener and Portfolio

- สถานะ: Pending
- งานที่ต้องทำ:
  - เพิ่ม column หรือ badge ในตาราง
  - เพิ่ม tooltip ภาษาง่าย
  - แสดงคำเตือนก่อน action เมื่อมี RED/ORANGE conflict
- UX requirement:
  - มือใหม่ต้องเข้าใจว่า “คะแนนสูงแต่ยังไม่ควรซื้อเพราะอะไร”

### T2-05 - Add Regression for Safety Layer

- สถานะ: Pending
- งานที่ต้องทำ:
  - เพิ่ม fixture หุ้นที่มีข้อมูลผิด/เสี่ยง
  - ตรวจว่า engine เดิมยังให้ `Total_Score` ได้
  - ตรวจว่า safety layer สร้าง warning ถูกต้อง
  - ตรวจว่า phase นี้ยังไม่เปลี่ยน action หลัก

## Phase 2 - Explainable Score Matrix

### T2-06 - Add Derived Score Matrix

- สถานะ: Pending
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

### T2-07 - Add Beginner Explanation Cards

- สถานะ: Pending
- งานที่ต้องทำ:
  - อธิบายคะแนนแต่ละมิติแบบภาษาคนทั่วไป
  - แยก “หุ้นดี”, “ราคาน่าสนใจ”, “จังหวะเข้า”, “ความเสี่ยง”, “สภาพคล่อง”
  - หลีกเลี่ยงการทำหน้าแน่นเกินไป

## Phase 3 - Technical vs Fundamental RRR

### T2-08 - Split Technical RRR and Fundamental RRR Placeholder

- สถานะ: Pending
- แนวทาง:
  - `Technical_RRR` ใช้ 52W high/low เหมือนเดิม
  - `Fundamental_RRR` เริ่มเป็น `INSUFFICIENT_DATA` หากยังไม่มี fair value/EPS target
  - ห้ามสร้าง fundamental target ปลอมจากข้อมูลไม่พอ

### T2-09 - Add Fundamental Data Readiness Report

- สถานะ: Pending
- งานที่ต้องทำ:
  - ตรวจว่าข้อมูลใดต้องเพิ่มเพื่อทำ Think2 เต็มรูปแบบ
  - รายงาน missing EPS, growth, payout, analyst target, fair value
  - ใช้ผลนี้ตัดสินใจว่าจะลงทุนเพิ่ม data source หรือไม่

## Phase 4 - Action Matrix Pilot

### T2-10 - Build Action Matrix in Shadow Mode

- สถานะ: Pending
- เป้าหมาย:
  - สร้าง `Action_v2_Shadow` โดยไม่แทน `Target_Action`
  - แสดงเฉพาะ owner/admin หรือ debug panel ก่อน
  - เทียบผลต่างระหว่าง action เดิมกับ action v2

### T2-11 - Compare Think.md Action vs Think2 Shadow Action

- สถานะ: Pending
- งานที่ต้องทำ:
  - สรุปจำนวนหุ้นที่ action เปลี่ยน
  - แยกกรณีที่ Think2 block buy เพราะ RED conflict
  - ให้เอกรีวิวก่อนเปิดใช้กับผู้ใช้จริง

## Phase 5 - Controlled Rollout

### T2-12 - Add Feature Flag for Think2 Decision Engine

- สถานะ: Pending
- แนวทาง:
  - Default ยังใช้ Think.md engine
  - เปิด Think2 เฉพาะ env/config หรือ owner setting
  - ต้อง rollback กลับ Think.md ได้ทันที

### T2-13 - Release Think2 Beta

- สถานะ: Pending
- เงื่อนไขก่อน release:
  - regression ผ่าน
  - มี comparison report
  - มี UX warning ชัดเจน
  - มี rollback tag/branch

## AI Prompt สำหรับทำต่อ

อ่าน `plan.md`, `Task.md`, `think.md`, และ `Think2.md` ก่อนเริ่มงานเสมอ

เป้าหมายของ branch นี้คือเพิ่ม Think2 แบบปลอดภัย:

1. อย่ารื้อ engine เดิมทันที
2. เริ่มจาก safety layer: data status + conflict alerts
3. รักษา `Total_Score`, `RRR`, `Advice`, `Target_Action` เดิมใน phase แรก
4. ทุกครั้งที่เพิ่ม field ใหม่ ต้องเพิ่ม regression และ tooltip/คำอธิบายสำหรับมือใหม่
5. ถ้าจะเปลี่ยน action จริง ต้องทำ shadow mode และ comparison report ก่อน

