# Plan: Node.js Web App Migration

วันที่สร้างแผน: 2026-06-02 20:55:35 +07:00
Branch ปัจจุบัน: `codex-node-web-app-migration`

## เป้าหมาย

ปรับโปรแกรมวิเคราะห์หุ้นไทยเดิมจาก Python ให้เป็น Web App ที่ใช้งานง่ายขึ้นด้วย Node.js โดยผลลัพธ์และตรรกะหลักต้องยังเทียบเท่าของเดิมให้มากที่สุด ได้แก่:

- ดึงข้อมูลหุ้นจากแหล่งข้อมูลตลาด
- วิเคราะห์หุ้นด้วยคะแนนเดิมหรือใกล้เคียงเดิม
- สร้างรายการหุ้นแนะนำ
- วิเคราะห์พอร์ตจากไฟล์ Excel
- แสดง dashboard, screener, sector analysis และ strategy simulation
- สร้างผลลัพธ์สำคัญ เช่น CSV/Excel/report ตามรูปแบบเดิมหรือรูปแบบใหม่ที่เทียบเท่า

## กฎเหล็กในการทำงาน

- ห้ามลบไฟล์ `plan.md`
- ก่อนเริ่มทำงานจริง ต้องอ่าน `plan.md` ก่อนเสมอ
- ทำงานตาม Task list ทีละข้อ
- เมื่อทำ Task ใดเสร็จ ต้องกลับมาอัปเดต `plan.md`
- การอัปเดตต้องใส่วันที่และเวลาที่แก้ไขเสร็จ
- ถ้ามีการเปลี่ยนแนวทาง ต้องบันทึกเหตุผลใน `plan.md`
- ต้องคงผลลัพธ์การทำงานเดิมให้เทียบเท่ามากที่สุด
- ห้ามลบหรือเขียนทับไฟล์ Python เดิมโดยไม่จำเป็น ให้ย้ายระบบใหม่แบบค่อยเป็นค่อยไป

## สถานะโครงการเดิมที่อ่านแล้ว

โปรแกรมเดิมเป็น Python project สำหรับวิเคราะห์หุ้นไทย มีไฟล์หลักดังนี้:

- `main.py`: จุดเริ่มต้นแบบ command line เลือก watchlist และ portfolio แล้วสร้างผลลัพธ์
- `stock_scraper.py`: ดึงข้อมูลหุ้นผ่าน `yfinance` โดยใช้ ticker `.BK`
- `stock_analyzer.py`: ทำความสะอาดข้อมูลและคำนวณคะแนนหุ้น
- `stock_visualizer.py`: สร้างรูป dashboard ด้วย matplotlib/seaborn
- `stock_simulator.py`: จำลองกลยุทธ์ย้อนหลัง
- `portfolio_dashboard.py`: Streamlit dashboard สำหรับดูพอร์ต, screener, sector analysis และ simulation

ไฟล์ input/output สำคัญ:

- Input portfolio: Excel ที่มีคอลัมน์ `Symbol`, `Quantity`, `Avg_Price`
- Input watchlist: text file รายชื่อหุ้น
- Output เดิม: `siamchart_raw.csv`, `recommended_stocks.csv`, `stock_analysis_dashboard.png`, `*_analysis_report.xlsx`

## Task List

### T00 - เตรียม branch สำหรับงาน migration

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 20:55:35 +07:00
- หมายเหตุ: ตรวจพบว่า branch ปัจจุบันคือ `codex-node-web-app-migration`

### T01 - สร้าง `plan.md` และกำหนดกติกาการทำงาน

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 20:55:35 +07:00
- ผลลัพธ์: มีไฟล์ `plan.md` เป็นศูนย์กลางแผนงานและ prompt ส่งต่อ

### T02 - สรุป behavior contract ของระบบเดิม

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 20:56:50 +07:00
- งานที่ต้องทำ:
  - ระบุ flow เดิมจาก input ถึง output
  - สรุปสูตรคำนวณคะแนนทั้งหมด
  - สรุปคอลัมน์ output ของ CSV และ Excel report
  - ระบุส่วนที่ต้องคงให้เหมือนเดิมกับส่วนที่ปรับเป็น Web App ได้

### T03 - เลือกสถาปัตยกรรม Node.js Web App

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 20:58:19 +07:00
- งานที่ต้องทำ:
  - เลือก framework backend/frontend
  - เลือก library สำหรับอ่าน/เขียน Excel
  - เลือก library สำหรับดึงข้อมูลหุ้น
  - กำหนดโครงสร้าง folder ใหม่โดยไม่ทำลาย Python เดิม

### T04 - สร้างโครงโปรเจกต์ Node.js

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:00:37 +07:00
- งานที่ต้องทำ:
  - เพิ่ม `package.json`
  - เพิ่มโครงสร้าง server/client หรือ full-stack app
  - เพิ่ม script สำหรับ run/dev/test
  - เพิ่ม config ที่จำเป็น

### T05 - Port ระบบดึงข้อมูลหุ้น

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:13:19 +07:00
- งานที่ต้องทำ:
  - อ่าน watchlist และ portfolio upload
  - ดึงข้อมูลหุ้นไทยด้วย ticker `.BK`
  - สร้าง raw market dataset ที่เทียบเท่า `siamchart_raw.csv`

### T06 - Port ระบบวิเคราะห์และให้คะแนนหุ้น

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:18:39 +07:00
- งานที่ต้องทำ:
  - Port สูตร `DE_Score`, `Price_Position`, `RSI_Score`, `Relative_Quality_Score`
  - Port `Total_Score`, Entry/Exit Zone, Stop Loss, Upside, RRR, Trend Status
  - สร้าง `recommended_stocks.csv` หรือ output เทียบเท่า

### T07 - Port ระบบวิเคราะห์พอร์ตและสร้าง Excel report

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:32:15 +07:00
- งานที่ต้องทำ:
  - รับไฟล์ Excel portfolio
  - คำนวณ Market Value, Cost Value, Gain/Loss, Advice, Target Action
  - สร้าง Excel report พร้อม sheet คู่มือการอ่าน

### T08 - สร้าง Web UI สำหรับใช้งานจริง

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:35:08 +07:00
- งานที่ต้องทำ:
  - หน้า upload watchlist/portfolio
  - หน้า dashboard พอร์ต
  - หน้า stock screener
  - หน้า sector analysis
  - หน้า strategy simulation

### T09 - Port strategy simulation

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-02 21:37:49 +07:00
- งานที่ต้องทำ:
  - ดึงราคาย้อนหลัง
  - จำลอง Buy, Take Profit 50%, Stop Loss
  - แสดงผลเปรียบเทียบ strategy กับ buy & hold

### T10 - ตรวจสอบผลลัพธ์เทียบ Python เดิม

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-03 14:25:45 +07:00
- งานที่ต้องทำ:
  - เทียบคอลัมน์สำคัญของ raw/recommended output
  - เทียบสูตรคะแนนด้วย sample data
  - เทียบ report portfolio อย่างน้อย 1 ไฟล์
  - บันทึกความต่างที่ยอมรับได้

### T11 - เพิ่มคู่มือใช้งาน Web App

- สถานะ: Done
- เสร็จเมื่อ: 2026-06-03 14:27:54 +07:00
- งานที่ต้องทำ:
  - อัปเดต README หรือเพิ่มเอกสารใหม่
  - ระบุวิธี install, run, upload, export
  - ระบุข้อจำกัดเรื่องข้อมูลตลาดและความเสี่ยงการลงทุน

### T12 - Fix Sector Analysis

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 14:30:00 +07:00
- เสร็จเมื่อ: 2026-06-03 15:26:18 +07:00
- งานที่ต้องทำ:
  - เติม sector/fundamental fallback ให้ live Node market data
  - ปรับหน้า Sector Analysis ให้เลือก sector และดู leader list ได้ถูกต้อง
  - ตรวจสอบด้วย sample data ว่าไม่มีแค่ `Unknown`
  - อัปเดต `plan.md` เมื่อเสร็จ

### T13 - Commercial SaaS Upgrade

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 15:35:00 +07:00
- เสร็จเมื่อ: 2026-06-03 15:43:10 +07:00
- งานที่ต้องทำ:
  - ออกแบบ Web App ให้เป็น product ที่ขาย subscription รายเดือนได้
  - เพิ่มระบบ register/login/logout แบบ file-backed demo
  - เพิ่มสถานะ subscription และ customer plan
  - บันทึก portfolio snapshot ของลูกค้าหลัง run analysis
  - ปรับ UI เป็น professional SaaS ธีมดำ-แดงคล้าย Netflix
  - ทำให้ผู้ไม่มีความรู้ลงทุนเข้าใจง่ายขึ้นด้วย guidance/metrics/action cards
  - ทดสอบ syntax, auth service, comparison script และอัปเดต `plan.md`

### T14 - Beginner Onboarding and Business Dashboard

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 15:46:11 +07:00
- เสร็จเมื่อ: 2026-06-03 15:55:08 +07:00
- งานที่ต้องทำ:
  - เพิ่ม investor onboarding profile สำหรับผู้ไม่มีความรู้ลงทุน
  - เก็บเป้าหมายลงทุน ระดับประสบการณ์ ระดับความเสี่ยง งบรายเดือน และเวลาที่ต้องการถือ
  - แสดง guidance cards ที่แปลผลพอร์ตเป็นภาษาง่าย
  - เพิ่ม business dashboard prototype สำหรับเจ้าของ SaaS เช่น users, trials, MRR estimate, saved portfolios
  - เพิ่ม UI view ใหม่และอัปเดตเอกสาร/plan
  - ทดสอบ syntax, auth/profile service, comparison script

### T15 - Visual Intelligence Dashboard

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 16:09:08 +07:00
- เสร็จเมื่อ: 2026-06-03 16:14:15 +07:00
- งานที่ต้องทำ:
  - เพิ่ม visual chart แบบไม่เพิ่ม dependency เพื่อให้ Web App ดูเป็น professional SaaS มากขึ้น
  - เพิ่ม Portfolio visuals เช่น sector exposure, action mix และ score distribution
  - เพิ่ม Screener insights เช่น quality vs reward scatter และ top idea summary
  - เพิ่ม Sector visual leaderboard/benchmark ให้เข้าใจง่ายกว่า table อย่างเดียว
  - เพิ่ม Business funnel visual สำหรับ owner account
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, regression เทียบ Python และ HTTP smoke test

### T16 - Subscription Checkout and Billing Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 16:17:22 +07:00
- เสร็จเมื่อ: 2026-06-03 16:22:53 +07:00
- งานที่ต้องทำ:
  - เพิ่ม billing/checkout prototype แบบ local file-backed โดยยังไม่เชื่อม payment gateway จริง
  - ให้ลูกค้ากดเลือก plan Starter/Pro/Advisor จากหน้า pricing ได้
  - อัปเดต subscription status, renewal date และ billing event หลัง checkout
  - เพิ่ม billing metrics ใน Business dashboard เช่น paid users, revenue collected, ARPU
  - เพิ่ม UI account/billing state ที่อ่านง่ายสำหรับผู้ใช้
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, checkout service, HTTP smoke test และ regression เทียบ Python

### T17 - Role Permission and Advisor Workspace Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 16:31:14 +07:00
- เสร็จเมื่อ: 2026-06-03 16:38:35 +07:00
- งานที่ต้องทำ:
  - เพิ่ม role model สำหรับ `owner`, `admin`, `advisor`, `customer`
  - เพิ่ม admin/team APIs สำหรับดู users, เปลี่ยน role และ assign advisor ให้ลูกค้า
  - จำกัดสิทธิ์ owner/admin/advisor ให้ชัดเจนขึ้น
  - เพิ่ม Team/Client workspace ใน Business view
  - เพิ่ม users by role และ advisor assignment metrics
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, role service, HTTP smoke test และ regression เทียบ Python

### T18 - Audit Log and Activity Timeline Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 16:43:37 +07:00
- เสร็จเมื่อ: 2026-06-03 16:52:26 +07:00
- งานที่ต้องทำ:
  - เพิ่ม audit log แบบ local file-backed สำหรับ action สำคัญของ SaaS
  - บันทึกกิจกรรม register, login, logout, run analysis, run simulation, update profile, checkout, update role และ assign advisor
  - เพิ่ม API สำหรับอ่าน activity timeline ตามสิทธิ์ user
  - แสดง Recent activity ในหน้า Business/Workspace
  - เพิ่ม activity metrics สำหรับ owner/admin
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, service flow, HTTP smoke test และ regression เทียบ Python

### T19 - Organization and Workspace Model Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 20:18:53 +07:00
- เสร็จเมื่อ: 2026-06-03 20:29:18 +07:00
- งานที่ต้องทำ:
  - เพิ่ม organization/workspace model แบบ local file-backed สำหรับ SaaS
  - ผูก user กับ workspace เพื่อรองรับทีม ลูกค้า และองค์กรในอนาคต
  - เพิ่ม API สำหรับดู สร้าง อัปเดต และย้าย user เข้า workspace ตามสิทธิ์ owner/admin
  - แสดง workspace summary ใน Business/Workspace UI
  - เพิ่ม metrics เช่นจำนวน workspaces, customer workspaces และ platform members
  - บันทึก audit log สำหรับ workspace create/update/member move
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, service flow, HTTP smoke test และ regression เทียบ Python

### T20 - Payment Gateway and Webhook Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 20:32:08 +07:00
- เสร็จเมื่อ: 2026-06-03 20:40:17 +07:00
- งานที่ต้องทำ:
  - เพิ่ม payment session แบบ local gateway prototype สำหรับ subscription checkout
  - เพิ่ม webhook simulation สำหรับ payment success, failure และ duplicate event reconciliation
  - เพิ่ม API สำหรับสร้าง checkout session, จำลอง webhook และดู payment sessions
  - ให้ checkout เดิมยังทำงานได้ โดยเปลี่ยนให้ผ่าน payment session/webhook ภายใน
  - เพิ่ม billing metrics เช่น pending sessions, failed payments และ webhook events
  - แสดง payment/session status ใน UI และ Business dashboard
  - บันทึก audit log สำหรับ payment session และ webhook actions
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, service flow, HTTP smoke test และ regression เทียบ Python

### T21 - Tenant Isolation and Production Readiness Hardening

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 20:45:05 +07:00
- เสร็จเมื่อ: 2026-06-03 20:55:48 +07:00
- งานที่ต้องทำ:
  - ผูก tenant/workspace metadata กับ portfolio snapshots, investor profiles, billing events, payment sessions, payment webhook events และ audit events
  - normalize ข้อมูลเก่าที่ไม่มี `organizationId` ให้ย้อนกลับไปหา workspace ของ user ได้
  - เพิ่ม tenant scope summary API เพื่อให้ user เห็นเฉพาะขอบเขตข้อมูลตาม role และ workspace
  - แสดง tenant isolation/readiness summary ใน UI เพื่อช่วยเจ้าของ SaaS และ advisor ตรวจว่าข้อมูลถูกแยกตาม workspace
  - เพิ่ม production-readiness note ในเอกสาร โดยระบุว่ายังเป็น local file-backed prototype และฐานข้อมูลจริงยังเป็นงานถัดไป
  - ทดสอบ syntax, service flow, HTTP smoke test, regression เทียบ Python และอัปเดต `plan.md`

### T22 - Payment Webhook Signature Verification

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-03 21:07:11 +07:00
- เสร็จเมื่อ: 2026-06-03 21:15:08 +07:00
- งานที่ต้องทำ:
  - เพิ่ม HMAC signature verification สำหรับ payment webhook prototype
  - เพิ่ม timestamp tolerance เพื่อลด replay webhook เก่า
  - เพิ่ม public signed webhook endpoint ที่ไม่ต้อง login แต่ต้องมี signature ถูกต้อง
  - ให้ webhook event/audit/metrics บันทึกสถานะการ verify ได้
  - คง endpoint simulate เดิมสำหรับหน้าเว็บและ demo flow โดยไม่ทำให้ checkout เดิมพัง
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, service flow, HTTP smoke test, regression เทียบ Python และ audit high severity

### T23 - Immutable Audit Trail and Integrity Hash Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 07:32:16 +07:00
- เสร็จเมื่อ: 2026-06-04 07:40:28 +07:00
- งานที่ต้องทำ:
  - เพิ่ม hash chain ให้ audit events เพื่อช่วยตรวจการแก้ไขย้อนหลัง
  - normalize audit events เก่าที่ไม่มี hash ให้มี `previousHash` และ `eventHash`
  - เพิ่ม audit integrity report/API สำหรับ owner/admin
  - เพิ่ม audit integrity metrics ใน Business dashboard
  - ให้ activity timeline แสดง hash บางส่วนได้โดยไม่ทำให้ UI หนัก
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, service flow, HTTP smoke test, regression เทียบ Python และ audit high severity

### T24 - Automated Tenant Access Regression Tests

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 07:50:19 +07:00
- เสร็จเมื่อ: 2026-06-04 07:55:43 +07:00
- งานที่ต้องทำ:
  - เพิ่มสคริปต์ regression test สำหรับ role และ tenant access แบบรันซ้ำได้
  - จำลอง owner, advisor และ customer หลาย workspace
  - ตรวจว่า owner/admin เห็นภาพรวมได้ แต่ customer เห็นเฉพาะข้อมูลตัวเอง
  - ตรวจว่า advisor เห็นเฉพาะลูกค้าที่ถูก assign และไม่เห็นลูกค้าที่ไม่ได้ assign
  - ตรวจ billing/payment/audit/tenant scope ว่าไม่รั่วข้าม user/workspace
  - เพิ่ม npm script สำหรับรันชุดทดสอบนี้
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, tenant regression, regression เทียบ Python และ audit high severity

### T25 - Subscription Lifecycle Regression Tests

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 08:01:01 +07:00
- เสร็จเมื่อ: 2026-06-04 08:05:08 +07:00
- งานที่ต้องทำ:
  - เพิ่มสคริปต์ regression test สำหรับ subscription/payment lifecycle แบบรันซ้ำได้
  - ตรวจ trial account, payment failed, signed payment success และ subscription activation
  - ตรวจ duplicate webhook ไม่สร้าง invoice/billing event ซ้ำ
  - ตรวจ invalid/stale/missing signature ถูก reject และบันทึก rejected webhook/audit
  - ตรวจ payment metrics เช่น paid users, pending/failed payments, verified/rejected webhook events และ revenue
  - เพิ่ม npm script สำหรับรันชุดทดสอบ subscription lifecycle
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, subscription regression, tenant regression, regression เทียบ Python และ audit high severity

### T26 - CI Quality Gate for SaaS Regression

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 08:14:42 +07:00
- เสร็จเมื่อ: 2026-06-04 08:16:58 +07:00
- งานที่ต้องทำ:
  - เพิ่ม GitHub Actions workflow สำหรับ Node.js regression gate
  - ให้ CI รัน `npm ci`, syntax check, tenant access regression, subscription lifecycle regression และ compare Python
  - ให้ CI ตรวจ `npm audit --audit-level=high`
  - ระบุ Node.js version ที่สอดคล้องกับ local runtime
  - เพิ่มเอกสารอธิบาย CI, required reference files และวิธีแก้เมื่อ test fail
  - อัปเดต README และ `plan.md`
  - ทดสอบ syntax/regression/audit high severity หลังเพิ่ม workflow

### T27 - Production Database Migration Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 08:20:43 +07:00
- เสร็จเมื่อ: 2026-06-04 08:26:43 +07:00
- งานที่ต้องทำ:
  - เพิ่ม schema manifest สำหรับ local app state เพื่อใช้ mapping ไป production database
  - เพิ่ม storage readiness report สำหรับตรวจ record counts, missing ids, duplicate ids, missing tenant metadata และ dangling references
  - เพิ่ม owner/admin API สำหรับดู database migration readiness
  - แสดง storage readiness metric ใน Business dashboard
  - เพิ่ม regression test สำหรับ storage readiness โดยไม่แตะข้อมูล demo จริง
  - เพิ่ม npm script สำหรับรัน storage readiness regression และผูกเข้า CI quality gate
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, storage regression, full regression, compare Python และ audit high severity

### T28 - Production Database Repository Layer

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 08:43:42 +07:00
- เสร็จเมื่อ: 2026-06-04 08:47:03 +07:00
- งานที่ต้องทำ:
  - แยก local app-state read/write ออกจาก `authService` ไปเป็น repository layer
  - เพิ่ม repository metadata เพื่อบอก adapter, state file, normalized-on-read และ production readiness
  - ให้ storage readiness API แสดง repository info แทน hard-code เฉพาะใน service
  - เพิ่ม regression test สำหรับ repository layer โดยไม่แตะข้อมูล demo จริง
  - เพิ่ม npm script สำหรับ repository regression และผูกเข้า test/CI quality gate
  - อัปเดตเอกสาร database migration foundation, CI guide, README และ `plan.md`
  - ทดสอบ syntax, repository regression, full regression, compare Python และ audit high severity

### T29 - External Append-Only Audit Trail Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 08:56:07 +07:00
- เสร็จเมื่อ: 2026-06-04 09:00:19 +07:00
- งานที่ต้องทำ:
  - เพิ่ม append-only audit trail mirror แยกจาก `data/app-state.json`
  - mirror audit events ไป NDJSON file แบบ idempotent และไม่ duplicate event เดิม
  - เพิ่ม audit trail readiness report สำหรับตรวจ missing events, extra events และ invalid lines
  - เพิ่ม owner/admin API สำหรับดู external audit trail status
  - แสดง audit trail mirror metrics ใน Business dashboard
  - เพิ่ม regression test สำหรับ append-only audit trail โดยไม่แตะข้อมูล demo จริง
  - เพิ่ม npm script และผูกเข้า test/CI quality gate
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, audit trail regression, full regression, compare Python และ audit high severity

### T30 - Approval Workflow Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 09:13:33 +07:00
- เสร็จเมื่อ: 2026-06-04 09:31:07 +07:00
- งานที่ต้องทำ:
  - เพิ่ม approval request model สำหรับคำแนะนำ/คำสั่งที่ต้องให้ลูกค้าอนุมัติก่อน
  - เพิ่ม API สำหรับ list, create และ approve/reject approval request ตาม role และ workspace scope
  - จำกัดสิทธิ์ให้ owner/admin เห็นทั้งหมด, advisor เห็นเฉพาะลูกค้าที่ดูแล และ customer เห็น/ตัดสินใจเฉพาะของตัวเอง
  - เพิ่ม audit events สำหรับ create/approve/reject เพื่อให้ต่อกับ hash chain และ external audit trail เดิม
  - เพิ่ม metrics และ UI ใน Business/Workspace เพื่อให้เห็น pending/approved/rejected approvals
  - เพิ่ม regression test สำหรับ approval workflow และผูกเข้า test/CI quality gate
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, approval regression, full regression และ compare Python

### T31 - Chart Interaction and Screener Drilldown

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 09:33:25 +07:00
- เสร็จเมื่อ: 2026-06-04 09:36:48 +07:00
- งานที่ต้องทำ:
  - เพิ่ม filter ในหน้า Screener ให้เลือก sector และ trend ได้
  - ทำให้ visual Sector count ใน Screener คลิกแล้ว filter ตารางตาม sector ได้
  - เพิ่ม visual state/ข้อความสั้นเพื่อบอก filter ที่ใช้อยู่
  - คงสูตรวิเคราะห์และ output เดิมไม่ให้เปลี่ยน
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ frontend syntax, regression รวม และ HTTP smoke test

### T32 - External Immutable Audit Provider Integration

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 13:27:04 +07:00
- เสร็จเมื่อ: 2026-06-04 13:35:02 +07:00
- งานที่ต้องทำ:
  - เพิ่ม external audit provider แบบ HTTP webhook ที่เปิดใช้ด้วย environment variables
  - ส่ง audit events ออกไป provider ภายนอกพร้อม HMAC signature และ timestamp
  - เก็บ receipt เฉพาะ event ที่ provider ตอบรับสำเร็จ เพื่อใช้ readiness report ตรวจ missing external mirror ได้
  - ค่า default ต้องยังใช้ local NDJSON mirror เดิมและไม่ทำให้ app พังถ้ายังไม่ตั้งค่า provider
  - เพิ่ม readiness metrics สำหรับ external provider เช่น enabled, endpoint configured, external receipts และ missing external events
  - เพิ่ม regression test ด้วย local HTTP server โดยไม่แตะข้อมูล demo จริง
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, external audit regression, regression รวม และ CI quality

### T33 - Dependency Risk Gate Hardening

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 13:36:35 +07:00
- เสร็จเมื่อ: 2026-06-04 13:41:35 +07:00
- งานที่ต้องทำ:
  - เพิ่ม dependency risk regression ที่อ่าน `npm audit --json`
  - fail ถ้ามี high/critical vulnerability หรือ moderate vulnerability ใหม่ที่ยังไม่ถูกบันทึกเป็น known accepted risk
  - บันทึก known moderate advisory ปัจจุบันจาก `exceljs -> uuid` ที่ npm แจ้งว่าไม่มี fix available
  - ผูก dependency risk gate เข้า CI quality โดยไม่เปลี่ยนสูตรหรือ output วิเคราะห์เดิม
  - เพิ่มเอกสาร dependency risk register และอัปเดต README/CI docs
  - อัปเดต `plan.md`
  - ทดสอบ dependency risk regression, regression รวม และ CI quality

### T34 - Web App Smoke Verification Harness

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 13:47:43 +07:00
- เสร็จเมื่อ: 2026-06-04 13:53:15 +07:00
- งานที่ต้องทำ:
  - ปรับ `src/server.js` ให้ export app/server factory เพื่อให้ทดสอบเว็บได้ใน process เดียวโดยไม่ต้องเปิด server background
  - เพิ่ม automated web smoke regression สำหรับตรวจหน้าแรก, health API, auth API, static assets, Approvals tab, Screener drilldown และ External Audit UI marker
  - ผูก web smoke regression เข้า npm scripts และ CI quality gate
  - อัปเดต README, CI docs, Web App usage และ `plan.md`
  - ทดสอบ syntax, web smoke regression, regression รวม และ CI quality

### T35 - Production Database Adapter Implementation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 13:56:29 +07:00
- เสร็จเมื่อ: 2026-06-04 14:06:13 +07:00
- งานที่ต้องทำ:
  - เพิ่ม production database adapter สำหรับ Postgres หลัง `stateRepository` โดย default ยังเป็น `local_file`
  - รองรับ env `APP_STATE_REPOSITORY=postgres` และ `DATABASE_URL`
  - เพิ่ม SQL bootstrap/migration helper สำหรับ table ต่อ collection ตาม schema manifest
  - เพิ่ม regression test แบบ fake Postgres client เพื่อทดสอบ read/write/query โดยไม่ต้องต่อฐานข้อมูลจริง
  - เพิ่ม npm script และผูกเข้า regression/CI quality gate
  - อัปเดต README, database migration docs, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, repository regression, database adapter regression, regression รวม และ CI quality

### T36 - Real Payment Provider Integration

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 14:26:19 +07:00
- เสร็จเมื่อ: 2026-06-04 14:36:43 +07:00
- งานที่ต้องทำ:
  - เพิ่ม payment gateway provider layer โดย default ยังเป็น `local_gateway`
  - เพิ่ม Stripe Checkout provider แบบ opt-in ผ่าน environment variables โดยไม่เพิ่ม dependency ใหม่
  - สร้าง external checkout session แบบ pending และคืน checkout URL ให้ UI เปิดจ่ายเงินจริง
  - เพิ่ม public provider webhook endpoint ที่ verify Stripe-style signature จาก raw body
  - map webhook `checkout.session.completed` เป็น `payment.succeeded` และ failed events เป็น `payment.failed`
  - เพิ่ม regression test ด้วย fake Stripe API/fake webhook โดยไม่ต่อ provider จริง
  - อัปเดต README, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, payment provider regression, subscription lifecycle regression, regression รวม และ CI quality

### T37 - One-time App State to Postgres Importer

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 15:02:59 +07:00
- เสร็จเมื่อ: 2026-06-04 15:12:48 +07:00
- งานที่ต้องทำ:
  - เพิ่ม one-time importer จาก local `data/app-state.json` เข้า Postgres adapter
  - รองรับ dry-run เพื่อดู readiness, record counts และ blockers โดยไม่เขียนฐานข้อมูล
  - ใช้ schema/readiness เดิมและ normalize state ก่อน import
  - fail ถ้า readiness เป็น `blocked` ยกเว้นระบุ `--allow-blocked`
  - เพิ่ม regression test ด้วย fake Postgres client โดยไม่ต่อฐานข้อมูลจริง
  - เพิ่ม npm script และเอกสาร README / database migration / Web App usage / CI docs
  - อัปเดต `plan.md` และ prompt ส่งต่อ
  - ทดสอบ syntax, importer regression, regression รวม และ CI quality

### T38 - Package Entitlement Enforcement

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 15:16:36 +07:00
- เสร็จเมื่อ: 2026-06-04 15:41:09 +07:00
- งานที่ต้องทำ:
  - ออกแบบ entitlement policy แยกสิทธิ์ Starter / Pro / Advisor ให้สอดคล้องกับแพ็กเกจ subscription
  - บังคับใช้สิทธิ์กับ API สำคัญ เช่น portfolio snapshot, team/advisor workspace, business metrics, audit/activity และ approval workflow
  - เพิ่ม UI ให้ผู้ใช้เห็นสิทธิ์แพ็กเกจ ปุ่ม upgrade และเหตุผลเมื่อใช้ฟีเจอร์ไม่ได้
  - เพิ่ม regression test เพื่อยืนยันว่าแต่ละแพ็กเกจเข้าถึงฟีเจอร์ได้ตรงตามสิทธิ์
  - อัปเดต README, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, entitlement regression, regression รวม และ CI quality

### T39 - Backup and Restore Drill

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 19:58:33 +07:00
- เสร็จเมื่อ: 2026-06-04 20:07:40 +07:00
- งานที่ต้องทำ:
  - เพิ่ม backup service สำหรับ snapshot local app state, audit mirror และ external audit receipts แบบไม่แตะข้อมูลเดิม
  - เพิ่ม restore service/CLI ที่มี dry-run, validation และ confirm guard ก่อนเขียนกลับ
  - เพิ่ม metadata/checksum/record counts เพื่อใช้ตรวจว่า backup ถูกต้องและ restore ได้จริง
  - เพิ่ม regression test ใน temporary directory สำหรับ backup, dry-run restore, confirm restore และ reject invalid backup
  - เพิ่ม npm scripts และผูกเข้า regression/CI quality gate
  - อัปเดต README, Web App usage, database migration/production readiness docs, CI docs และ `plan.md`
  - ทดสอบ syntax, backup/restore regression, regression รวม และ CI quality

### T40 - Postgres Query-level Tenant Enforcement

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 20:10:57 +07:00
- เสร็จเมื่อ: 2026-06-04 20:18:25 +07:00
- งานที่ต้องทำ:
  - เพิ่ม Postgres scoped read helper ที่บังคับ tenant scope ใน SQL query ก่อนดึง record ออกจากฐานข้อมูล
  - รองรับ platform scope สำหรับ owner/admin และ restricted scope สำหรับ user/advisor/customer
  - ครอบคลุม tenant-scoped collections, users, organizations, sessions และ advisor assignments
  - เพิ่ม regression test ด้วย fake Postgres client เพื่อยืนยันว่า scoped read ไม่ดึงข้อมูลข้าม organization/user
  - อัปเดต repository metadata และเอกสาร production database/CI ให้ระบุ query-level tenant guard
  - อัปเดต `plan.md` และ prompt ส่งต่อ
  - ทดสอบ syntax, Postgres repository regression, regression รวม และ CI quality

### T41 - SaaS Observability and Alerting Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 20:22:21 +07:00
- เสร็จเมื่อ: 2026-06-04 20:33:40 +07:00
- งานที่ต้องทำ:
  - เพิ่ม operational readiness service สำหรับรวม health ของ repository, storage readiness, audit trail, payment provider, dependency risk และ subscription business signals
  - เพิ่ม alert rule แบบ deterministic สำหรับสถานะ critical/warning/ok โดยไม่เพิ่ม dependency
  - เพิ่ม API สำหรับ owner/admin ดู operational readiness และคง public health endpoint แบบ minimal
  - เพิ่ม regression test ที่รันใน temporary directory เพื่อตรวจ alert severity และ auth guard
  - เพิ่ม npm script และผูกเข้า regression/CI quality gate
  - อัปเดต README, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, observability regression, web smoke/regression รวม และ CI quality

### T42 - Production Postgres Backup Runbook and Drill Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 21:00:58 +07:00
- เสร็จเมื่อ: 2026-06-04 21:08:17 +07:00
- งานที่ต้องทำ:
  - เพิ่ม service สำหรับสร้าง Postgres backup/restore runbook แบบ dry-run โดยไม่แตะ production database
  - รองรับ strategy `managed_snapshot`, `pg_dump` และ `both` พร้อม retention, RPO/RTO และ restore drill checklist
  - sanitize `DATABASE_URL` เพื่อไม่ให้ password/secret หลุดใน output
  - เพิ่ม CLI สำหรับพิมพ์ runbook/checklist และ validation summary
  - เพิ่ม regression test เพื่อยืนยันว่า runbook ไม่เปิดเผย secret, ตรวจ strategy/retention และมี backup/restore commands ครบ
  - เพิ่ม npm scripts และผูกเข้า regression/CI quality gate
  - อัปเดต README, Web App usage, database migration docs, CI docs และ `plan.md`
  - ทดสอบ syntax, Postgres backup runbook regression, regression รวม และ CI quality

### T43 - Production Deployment Checklist and Environment Validation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-04 21:14:16 +07:00
- เสร็จเมื่อ: 2026-06-04 21:24:27 +07:00
- งานที่ต้องทำ:
  - เพิ่ม service สำหรับตรวจ deployment readiness แบบ dry-run จาก environment variables โดยไม่ deploy จริง
  - ตรวจ production essentials เช่น `NODE_ENV`, Postgres adapter, `DATABASE_URL`, SSL mode, Stripe Checkout, signed webhooks, external audit, backup strategy และ CI gates
  - sanitize/mask secret และ URL ใน output ทุกครั้ง
  - เพิ่ม CLI สำหรับพิมพ์ deployment checklist แบบ JSON/text และ strict mode
  - เพิ่ม regression test เพื่อยืนยัน ready/blocked cases, secret masking และ checklist commands
  - เพิ่ม npm scripts และผูกเข้า regression/CI quality gate
  - อัปเดต README, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, deployment checklist regression, regression รวม และ CI quality

### T44 - Operational Alert Delivery Webhook Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 07:34:39 +07:00
- เสร็จเมื่อ: 2026-06-05 07:44:58 +07:00
- งานที่ต้องทำ:
  - เพิ่ม service สำหรับส่ง operational alerts ออกไป webhook ภายนอกแบบ opt-in โดยยังไม่ผูก provider จริงเฉพาะเจ้า
  - รองรับ dry-run/disabled mode, required mode, HMAC signature, timeout และ sanitized payload
  - ใช้ alert จาก operational readiness report เดิมเพื่อสร้าง payload ที่ส่งออกได้
  - เพิ่ม CLI สำหรับ preview/dry-run alert delivery และ strict mode
  - เพิ่ม regression test เพื่อยืนยัน disabled/dry-run/success/failure/required cases, signature และ secret masking
  - เพิ่ม npm scripts และผูกเข้า regression/CI quality gate
  - อัปเดต README, Web App usage, CI docs และ `plan.md`
  - ทดสอบ syntax, alert delivery regression, regression รวม และ CI quality

### T45 - In-app Browser Screenshot QA and Visual Polish

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 07:51:29 +07:00
- เสร็จเมื่อ: 2026-06-05 08:06:55 +07:00
- งานที่ต้องทำ:
  - เปิด Web App ผ่าน in-app browser และตรวจหน้าแรกด้วย screenshot จริง
  - ตรวจ desktop viewport สำหรับ landing/auth/dashboard markers หลังงาน SaaS/ops ล่าสุด
  - ตรวจ mobile viewport เพื่อหา layout overflow, text overlap, navigation/button ที่อ่านยาก
  - สมัคร/เข้าสู่ระบบด้วยข้อมูลชั่วคราวใน environment ชั่วคราวเพื่อดูหน้า customer/business ที่ต้อง login
  - ตรวจ console errors และ basic API markers ที่ browser เห็นจริง
  - หากพบปัญหา UI ให้แก้แบบจำกัด scope และไม่กระทบสูตรวิเคราะห์หุ้นเดิม
  - เพิ่ม/ปรับ automated smoke หรือ visual marker regression เท่าที่เหมาะสม
  - อัปเดตเอกสาร/`plan.md` พร้อมผล QA และข้อจำกัด
  - ทดสอบ syntax, web smoke, regression รวม และ CI quality

### T46 - Privacy-safe Commit and GitHub Push

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 08:17:58 +07:00
- เสร็จเมื่อ: 2026-06-05 08:46:18 +07:00
- งานที่ต้องทำ:
  - ตรวจไฟล์ portfolio ส่วนตัวที่ถูก track อยู่
  - กัน `portfolio_eak.xlsx` และ `portfolio_aom.xlsx` ออกจาก Git ก่อน commit/push
  - กัน report ที่สร้างจาก portfolio ส่วนตัวออกจาก Git ด้วยเพื่อลดความเสี่ยงข้อมูลรั่ว
  - ปรับ regression/CI ไม่ให้พึ่งไฟล์ portfolio ส่วนตัว
  - อัปเดตเอกสารและ `plan.md`
  - รันทดสอบที่จำเป็นก่อน commit
  - commit และ push branch `codex-node-web-app-migration` ไป GitHub

### T47 - Private Portfolio History Cleanup Preparation

- สถานะ: Deferred - Ready for Force Push
- เริ่มเมื่อ: 2026-06-05 08:48:51 +07:00
- เสร็จเมื่อ: -
- Ready เมื่อ: 2026-06-05 08:53:28 +07:00
- งานที่ต้องทำ:
  - เตรียม rewrite history เพื่อลบไฟล์ portfolio ส่วนตัวออกจากประวัติ branch `codex-node-web-app-migration`
  - ตรวจ availability ของ `git-filter-repo`; หากไม่มีให้ใช้ built-in Git history rewrite แบบจำกัด branch
  - ทำงานใน clone ชั่วคราวเท่านั้น ไม่ลบไฟล์จริงใน workspace หลัก
  - ลบ `portfolio_aom.xlsx`, `portfolio_eak.xlsx`, `portfolio_aom_analysis_report.xlsx`, `portfolio_eak_analysis_report.xlsx` จากทุก commit ของ branch ปัจจุบัน
  - ตรวจ `git log --all -- <files>` ว่าไม่พบไฟล์ใน history ของ clone ที่ rewrite แล้ว
  - บันทึกคำสั่ง force push ให้ผู้ใช้รันจาก PowerShell ปกติ เพราะ sandbox ไม่มี GitHub credential
  - บันทึกข้อจำกัดว่าหากต้องการลบจากทุก branch/tag/fork/PR cache ต้องทำ mirror rewrite และประสาน GitHub Support ตามความจำเป็น

### T48 - Tenant-scoped Read Adoption for Customer Workspace APIs

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 21:06:36 +07:00
- เสร็จเมื่อ: 2026-06-05 21:14:46 +07:00
- งานที่ต้องทำ:
  - ข้ามขั้น GitHub force push ของ T47 ชั่วคราวตามคำสั่งผู้ใช้
  - เพิ่ม service-level tenant scope helper สำหรับอ่าน state ตาม user/workspace scope
  - ให้ customer/advisor workspace APIs สำคัญเริ่มใช้ scoped read แทนการอ่าน full state ตรง ๆ เมื่อเป็น read-only endpoint
  - คง local file mode ให้ทำงานเหมือนเดิม แต่เพิ่ม filter guard เพื่อกันข้อมูลข้าม workspace
  - เพิ่ม regression test ที่ยืนยันว่า customer/advisor ไม่เห็นข้อมูล user, portfolio, billing, payment, approval และ audit ของ workspace อื่น
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, scoped read regression, tenant access regression และ regression รวมเท่าที่เหมาะสม

### T49 - Narrower State Write Model Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 21:39:23 +07:00
- เสร็จเมื่อ: 2026-06-05 21:47:42 +07:00
- งานที่ต้องทำ:
  - เพิ่ม state patch helper สำหรับ upsert, append และ delete records ตาม schema collection primary key
  - รองรับ append-only guard เพื่อป้องกันการลบ audit events โดยไม่ตั้งใจ
  - เพิ่ม repository-level patch function ที่อ่าน state ปัจจุบัน, apply patch, แล้วเขียนกลับโดย preserve collections อื่น
  - เพิ่ม regression test สำหรับ patch behavior เช่น preserve unrelated records, upsert by primary key, append audit event และ reject invalid patch
  - ผูก regression test เข้า `npm run test-regression` และ `npm run ci:quality`
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, patch regression, regression รวม และ CI quality

### T50 - Adopt Patch Writes in Critical SaaS Write Flows

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-05 21:49:59 +07:00
- เสร็จเมื่อ: 2026-06-05 21:57:06 +07:00
- งานที่ต้องทำ:
  - เลือก write flows สำคัญชุดแรกที่เหมาะกับ `patchAppState()` เช่น payment session, billing event, investor profile หรือ approval request
  - ย้ายเฉพาะ flow ที่มีความเสี่ยงต่ำจาก whole-state mutation ไปใช้ logical patch operations
  - รักษา behavior เดิมของ Web App และ regression เดิมให้ผ่านทั้งหมด
  - เพิ่มหรือปรับ regression test เพื่อยืนยันว่า patch write ไม่ลบ records อื่นและยังบันทึก audit ได้ครบ
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T51 - Expand Patch Writes to Webhook and Decision Flows

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 20:29:41 +07:00
- เสร็จเมื่อ: 2026-06-06 20:37:53 +07:00
- งานที่ต้องทำ:
  - วิเคราะห์ payment webhook reconciliation, billing checkout success/failure และ approval decision flows ที่ยังใช้ whole-state mutation
  - ย้าย flow ที่เหมาะสมไปใช้ `patchAppState()` โดยยังรักษา idempotency, duplicate webhook handling และ audit hash chain
  - เพิ่ม regression ที่จับ duplicate provider event, failed payment, approval approve/reject และ audit integrity หลัง patch write
  - ตรวจว่า local-file behavior ยังเหมือนเดิม และ Postgres future path สามารถ map เป็น collection-level writes ได้ง่ายขึ้น
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T52 - Reduce Whole-state Writes in Workspace and Team Flows

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 20:41:10 +07:00
- เสร็จเมื่อ: 2026-06-06 20:47:09 +07:00
- งานที่ต้องทำ:
  - วิเคราะห์ write flows ฝั่ง workspace/team/admin เช่น create/update organization, move user, role update, advisor assignment และ session cleanup
  - ย้าย flow ที่เหมาะสมไปใช้ `patchAppState()` โดยรักษา permission checks, tenant scope และ audit trail
  - เพิ่ม regression สำหรับ workspace/team write behavior ที่ย้ายแล้ว และตรวจว่า owner/admin/advisor/customer scope ยังถูกต้อง
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T53 - Reduce Whole-state Writes in Auth Session Flows

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 21:03:10 +07:00
- เสร็จเมื่อ: 2026-06-06 21:13:42 +07:00
- งานที่ต้องทำ:
  - วิเคราะห์ auth/session write flows ที่ยังใช้ whole-state writes เช่น create session, logout session, expired session cleanup และ standalone audit event utility
  - ย้ายเฉพาะ flow ที่เหมาะสมไปใช้ `patchAppState()` โดยรักษา login/logout behavior, cookie/session expiry และ audit trail
  - เพิ่ม regression สำหรับ session create/logout/expired cleanup หากยังไม่มี coverage เพียงพอ
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T54 - Reduce Whole-state Writes in Account and Portfolio Snapshot Flows

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 21:18:13 +07:00
- เสร็จเมื่อ: 2026-06-06 21:26:28 +07:00
- งานที่ต้องทำ:
  - วิเคราะห์ whole-state write flows ที่เหลือใน `createUser()`, `loginUser()` และ `saveCustomerPortfolioSnapshot()`
  - ย้าย flow ที่เหมาะสมไปใช้ `patchAppState()` โดยรักษา first-owner registration, customer workspace creation, login last-seen update, session cookie behavior, portfolio entitlement และ audit trail
  - เพิ่ม regression สำหรับ register/login/snapshot behavior หาก coverage เดิมยังไม่พอ
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T55 - Postgres Collection-level Patch Write Adapter Prototype

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 21:30:06 +07:00
- เสร็จเมื่อ: 2026-06-06 21:37:24 +07:00
- งานที่ต้องทำ:
  - วิเคราะห์ `patchAppState()` และ Postgres adapter ปัจจุบันที่ยังใช้ logical patch แล้วตามด้วย whole-state write
  - เพิ่ม Postgres patch write path แบบ opt-in หรือ adapter-aware ให้ map `upsert`, `append`, `delete` ไปยัง table-level operations โดยรักษา local-file behavior เดิม
  - เพิ่ม fake-client regression สำหรับ patch writes ระดับ table เช่น upsert user/session, append audit, delete session และ append-only guard
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T56 - Postgres Patch Write Staging Validation Runbook

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 21:42:03 +07:00
- เสร็จเมื่อ: 2026-06-06 21:52:01 +07:00
- งานที่ต้องทำ:
  - เพิ่ม runbook/CLI dry-run สำหรับตรวจ Postgres patch write readiness ใน staging หรือ production-like database จริง
  - ระบุขั้นตอน migrate/import state, run patch smoke, verify scoped reads, verify audit mirror และ rollback/restore plan
  - เพิ่ม regression สำหรับ runbook output, secret masking และ blocked/ready checks โดยไม่ต่อ database จริง
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T57 - Postgres Patch Smoke Execution Harness

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-06 21:54:56 +07:00
- เสร็จเมื่อ: 2026-06-06 22:05:07 +07:00
- งานที่ต้องทำ:
  - เพิ่ม CLI แบบ dry-run-first สำหรับ canary patch smoke ใน staging โดยใช้ Postgres patch write path เมื่อมี `--confirm` เท่านั้น
  - สร้าง evidence JSON/text ที่มี operation ids, canary ids, before/after count summary, verification checklist และ secret masking
  - เพิ่ม regression ด้วย fake/dry-run path โดยไม่ต่อ database จริง และตรวจ confirm guard ไม่ให้เขียนข้อมูลโดยไม่ตั้งใจ
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T58 - Owner Launch Evidence Center

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-08 07:41:30 +07:00
- เสร็จเมื่อ: 2026-06-08 07:51:44 +07:00
- งานที่ต้องทำ:
  - เพิ่ม owner/admin launch evidence center ใน Business dashboard เพื่อสรุป command/evidence ที่ต้องครบก่อนเปิดขายจริง
  - แสดงสถานะหรือ checklist สำหรับ CI quality, Postgres backup runbook, importer dry-run, patch validation, patch smoke, deployment checklist, ops alerts และ audit evidence
  - เพิ่ม API/service helper แบบไม่เปิดเผย secret และไม่รันคำสั่งจริงจาก frontend
  - เพิ่ม regression/frontend smoke marker สำหรับ launch evidence UI
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T59 - Browser Visual QA for Business Launch Evidence Center

- สถานะ: Deferred - Browser Localhost Blocked
- เริ่มเมื่อ: 2026-06-08 07:57:01 +07:00
- เสร็จเมื่อ: -
- เริ่ม retry ล่าสุด: 2026-06-11 20:07:31 +07:00
- ผล retry ล่าสุด: 2026-06-11 20:13:37 +07:00 - Browser runtime เชื่อมได้แล้ว แต่เปิด `http://localhost:3000` และ `http://127.0.0.1:3000` ถูกบล็อกด้วย `net::ERR_BLOCKED_BY_CLIENT`; PowerShell ตรวจ `/api/health` ผ่าน จึงเป็นข้อจำกัดของ Browser policy ไม่ใช่ server
- งานที่ต้องทำ:
  - เปิด Web App ด้วย browser/in-app browser เมื่อเครื่องมือพร้อม เพื่อ visual QA หน้า Business dashboard หลังเพิ่ม Launch Evidence Center
  - ตรวจ desktop/mobile ว่า cards, command list, table และ metrics ไม่ล้น/ทับกัน
  - ตรวจ owner flow แบบสมัคร account แรก, เปิด Business, ดู Launch Evidence Center และ customer access guard
  - หากพบปัญหาให้ปรับ CSS/UI และเพิ่ม regression marker เท่าที่เหมาะสม
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ targeted regression, regression รวม และ CI quality

### T60 - Launch Evidence Center UI Guardrail Regression

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-08 07:57:01 +07:00
- เสร็จเมื่อ: 2026-06-08 08:04:52 +07:00
- งานที่ต้องทำ:
  - เพิ่ม automated regression เฉพาะ Launch Evidence Center เพื่อชดเชยระหว่างที่ Browser visual QA ยังถูก sandbox block
  - ตรวจ owner/admin API access, customer access guard และ secret masking
  - ตรวจ frontend renderer markers, loading state, evidence card statuses, checklist table, command list และ guardrail output
  - ตรวจ CSS guardrails สำหรับ long command wrapping และ responsive grid fallback
  - ผูก test เข้า `npm run test-regression` และ `npm run ci:quality`
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T61 - Launch Evidence Export and Owner Sign-off Pack

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-08 08:08:20 +07:00
- เสร็จเมื่อ: 2026-06-08 08:16:17 +07:00
- งานที่ต้องทำ:
  - เพิ่ม owner/admin export สำหรับ Launch Evidence Center เป็น JSON/text sign-off pack โดยยังไม่รันคำสั่งจาก frontend
  - รวม generated time, status summary, evidence items, preflight commands, sanitized environment และ guardrails ใน export
  - เพิ่มปุ่มหรือ action ใน Business dashboard เพื่อ copy/download evidence pack ให้เจ้าของ SaaS ใช้ส่งทีม deploy หรือ auditor
  - ตรวจ customer/advisor access guard และ secret masking ใน export
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T62 - Audit Logged Launch Evidence Export Trail

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 07:55:10 +07:00
- เสร็จเมื่อ: 2026-06-11 08:01:13 +07:00
- งานที่ต้องทำ:
  - บันทึก audit event เมื่อ owner/admin export Launch Evidence sign-off pack เพื่อให้ตรวจย้อนหลังได้ว่าใคร export ก่อน deploy
  - แยก format `json`/`text`, launch status, evidence summary และ sanitized metadata ใน audit details โดยไม่เก็บ raw secret
  - แสดง recent export activity ใน Business dashboard หรือ Recent activity เดิมให้ owner/admin ตรวจได้
  - เพิ่ม regression สำหรับ owner export audit event, customer export guard และ secret masking ใน audit details
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T63 - Investigate Python Comparison Reference Drift

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 08:12:37 +07:00
- เสร็จเมื่อ: 2026-06-11 08:18:12 +07:00
- งานที่ต้องทำ:
  - ตรวจสาเหตุที่ `compare:python` ในรอบ 2026-06-11 รายงาน numeric mismatches 48 และ text mismatches 42 แม้ `npm run ci:quality` จะผ่าน exit code 0
  - ตรวจว่าเกิดจาก reference CSV ที่ modified อยู่ใน worktree (`siamchart_raw.csv`, `recommended_stocks.csv`) หรือเกิดจากสูตร JavaScript เปลี่ยนจริง
  - ตรวจความต่างด้าน `Sector` และ fundamental fields (`PE`, `ROE`, `Yield`, `DE`) ระหว่าง run Python เดิม, run Node live data และ regression compare ที่ใช้ raw input เดียวกัน
  - แยกให้ชัดว่าความต่าง `Sector` เกิดจาก data source/fallback mapping หรือเกิดจากสูตรวิเคราะห์หลังได้ raw data แล้ว
  - ห้าม revert reference/output files โดยไม่ขออนุญาต เพราะเป็นไฟล์ที่ modified อยู่ก่อนงาน T62
  - เสนอแนวทางแก้ที่ชัดเจน: regenerate reference, ปรับ threshold/contract, หรือแก้สูตร หากพบสาเหตุจริง
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ targeted regression, regression รวม และ CI quality

### T64 - Live Market Data Sector/Fundamental Coverage Audit

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 08:20:35 +07:00
- เสร็จเมื่อ: 2026-06-11 08:31:44 +07:00
- งานที่ต้องทำ:
  - ตรวจ coverage ของ `Sector`, `PE`, `ROE`, `Yield`, `DE` เมื่อ Node/Web App ดึง live market data จริงผ่าน Yahoo chart endpoint และ fallback จาก `recommended_stocks.csv`
  - ระบุจำนวน symbol ที่ยังเป็น `Unknown` sector หรือ fundamental เป็น 0/blank หลัง fallback
  - เพิ่ม diagnostic/report สำหรับ live data coverage โดยไม่เขียนทับ reference CSV หลัก
  - เสนอแนวทาง production: ใช้ reference master, datasource เพิ่มเติม, หรือ scheduled enrichment สำหรับ sector/fundamental fields
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ targeted regression, regression รวม และ CI quality

### T65 - Production Reference Master and Fundamental Enrichment Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 09:33:17 +07:00
- เสร็จเมื่อ: 2026-06-11 09:43:41 +07:00
- งานที่ต้องทำ:
  - ออกแบบ reference master สำหรับ `Sector`, `PE`, `ROE`, `Yield`, `DE` ให้เหมาะกับ production มากกว่าอ่านจาก `recommended_stocks.csv` โดยตรง
  - เพิ่ม metadata เช่น source, lastUpdated, freshness status และ manual review status เพื่อให้ผู้ใช้เชื่อถือข้อมูลพื้นฐานได้มากขึ้น
  - เพิ่ม importer/normalizer จาก `recommended_stocks.csv` ไปเป็น reference master โดยไม่เขียนทับ reference CSV หลัก
  - ปรับ fallback path ให้รองรับ reference master ก่อน แล้วค่อย fallback ไป CSV เดิมหากยังไม่มี master
  - ทำ regression ตรวจ coverage ดีขึ้นหลังใช้ reference master และไม่ทำให้ `compare:python` แตก
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ targeted regression, regression รวม และ CI quality

### T67 - Reference Master Admin Review and Freshness Workflow

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 13:06:53 +07:00
- เสร็จเมื่อ: 2026-06-11 13:21:21 +07:00
- งานที่ต้องทำ:
  - ออกแบบ owner/admin UI หรือ API สำหรับดู symbol ที่ `reviewStatus = needs_review` จาก reference master
  - เพิ่ม workflow แก้/ยืนยันค่า `Sector`, `PE`, `ROE`, `Yield`, `DE` พร้อม audit event
  - เพิ่ม freshness policy เช่น stale threshold, lastUpdated warning และ summary ใน Business dashboard
  - เตรียม schema/adapter path สำหรับย้าย reference master จาก JSON file ไป database table ใน production
  - เพิ่ม regression ตรวจ admin review flow, audit trail และ fallback หลังแก้ master
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ targeted regression, regression รวม และ CI quality

### T68 - Reference Master Database Adapter and Freshness Scheduler Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 13:24:25 +07:00
- เสร็จเมื่อ: 2026-06-11 13:31:27 +07:00
- เหตุผล:
  - T67 ทำ owner/admin review workflow แบบ file-backed JSON สำเร็จแล้ว แต่ production จริงควรย้าย reference master ไป persistence layer ที่ควบคุม transaction, audit และ scheduled freshness ได้ดีกว่าไฟล์ JSON
  - ข้อมูลพื้นฐานหุ้นยังต้องมีรอบ refresh/review ที่ตรวจ stale data และหลักฐานย้อนหลังได้ เพื่อให้บริการ subscription น่าเชื่อถือขึ้น
- งานที่ต้องทำ:
  - ออกแบบ schema/adapter สำหรับ reference master record ใน production database โดยแยกจาก `data/reference/market-reference-master.json`
  - เพิ่ม repository boundary สำหรับอ่าน summary, update record และ audit metadata โดยยังรองรับ local file mode เป็น fallback
  - เพิ่ม dry-run migration/import plan จาก JSON master เข้า database path โดยไม่แตะ private portfolio files
  - เพิ่ม freshness scheduler/report foundation สำหรับระบุ stale rows, missing fields และ last review age
  - เพิ่ม regression ด้วย fake database/client หรือ temp repository เพื่อยืนยัน adapter, migration dry-run, freshness report และ owner/admin guard
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T69 - Reference Master Staging Migration Execution Guard

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 13:39:00 +07:00
- เสร็จเมื่อ: 2026-06-11 13:47:27 +07:00
- เหตุผล:
  - T68 มี database adapter foundation และ migration dry-run plan แล้ว แต่ยังไม่มี CLI execution harness ที่บังคับ dry-run-first/confirm guard สำหรับ staging
  - ก่อนใช้ production database จริงควรมี evidence output, secret masking และ rollback/verification checklist คล้าย Postgres patch smoke ที่มีอยู่แล้ว
- งานที่ต้องทำ:
  - เพิ่ม CLI สำหรับ reference master database migration แบบ default dry-run และต้องใช้ `--confirm` ก่อน execute
  - เพิ่ม guard ไม่ให้ execute ถ้าไม่มี staging marker, `DATABASE_URL`, backup evidence หรือ migration plan summary
  - เพิ่ม evidence JSON/text output พร้อม masked connection string, row counts, upsert counts, freshness summary และ verification checklist
  - เพิ่ม fake-client regression สำหรับ dry-run, blocked guard, confirm execute path, evidence output และ secret masking
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T70 - Reference Master Launch Evidence Integration

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 19:27:08 +07:00
- เสร็จเมื่อ: 2026-06-11 19:37:52 +07:00
- เหตุผล:
  - T69 มี CLI migration guard แล้ว แต่ owner/admin ยังต้องดูหลักฐาน reference master migration/freshness ผ่าน command output เอง
  - ก่อน go-live ควรให้ Launch Evidence Center แสดง readiness ของ reference master migration, freshness report และ staging evidence แบบอ่านง่ายโดยไม่รันคำสั่งจาก browser
- งานที่ต้องทำ:
  - เพิ่ม Launch Evidence item สำหรับ reference master freshness/migration readiness
  - เพิ่ม env markers เช่น dry-run reviewed, staging migration ready, backup evidence และ migration sign-off โดยต้อง sanitize secret
  - แสดง command/evidence summary ใน Business dashboard หรือ Launch Evidence Center โดย frontend ไม่ execute command
  - เพิ่ม regression ตรวจ evidence status pending/blocked/ready, secret masking, frontend marker และ owner/customer guard
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality

### T71 - Screener Beginner Filter Tooltips

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 13:53:18 +07:00
- เสร็จเมื่อ: 2026-06-11 14:04:21 +07:00
- เหตุผล:
  - กลุ่มเป้าหมายเป็นผู้ไม่มีความรู้ด้านการลงทุน จึงไม่ควรให้กรอก `Min Score`, `Min RRR`, `Max D/E`, `Sector` และ `Trend` โดยไม่มีคำอธิบาย
  - หน้า Screener ควรบอกว่าค่านี้คืออะไร ควรกรองค่าเท่าไหร่จึงถือว่าดี และมีข้อควรระวังแบบภาษาง่าย
  - Tooltip ต้องช่วยให้ผู้ใช้ตัดสินใจได้เองมากขึ้น โดยไม่เปลี่ยนสูตรวิเคราะห์หรือผลลัพธ์เดิม
- งานที่ต้องทำ:
  - เพิ่ม tooltip/help copy ในหน้า Screener สำหรับ `Min Score`, `Min RRR`, `Max D/E`, `Sector` และ `Trend`
  - ใส่ค่าแนะนำสำหรับมือใหม่ เช่น Score 60-70+, RRR 1.5-2.0+ และ D/E ไม่เกิน 0.7-1.0 พร้อมข้อยกเว้นของบางธุรกิจ
  - ทำ tooltip ให้ใช้งานได้ด้วย mouse hover และ keyboard focus พร้อมไม่ล้นบน mobile
  - เพิ่มข้อความสรุปค่าเริ่มต้นที่เหมาะกับมือใหม่โดยไม่เปลี่ยนค่า filter default เดิม
  - เพิ่ม regression/frontend marker เพื่อยืนยันว่า tooltip และคำแนะนำยังอยู่ใน bundle
  - อัปเดต README, Web App usage และ `plan.md`
  - ทดสอบ syntax, targeted frontend regression, web smoke และ CI quality เท่าที่เหมาะสม

### T72 - Recommended Actions Table Controls

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 14:15:49 +07:00
- เสร็จเมื่อ: 2026-06-11 14:25:08 +07:00
- เหตุผล:
  - หน้า Portfolio มีตาราง `Recommended actions` แต่ยังดูได้แบบตารางคงที่ ผู้ใช้ยังกรองรายการ, เลือก field ที่แสดง หรือเรียงลำดับตามคะแนน/มูลค่า/กำไรขาดทุนไม่ได้
  - ผู้ใช้จริงควรจัดมุมมองเองได้ เช่น ดูเฉพาะ action เร่งด่วน, เรียงตามคะแนน, ซ่อน field ที่ไม่จำเป็น หรือเพิ่ม field สำคัญเพื่ออ่านประกอบ
  - ต้องเพิ่มความยืดหยุ่นของ UI โดยไม่เปลี่ยนสูตรวิเคราะห์พอร์ตและไม่เปลี่ยน output เดิม
- งานที่ต้องทำ:
  - เพิ่ม filter สำหรับ `Recommended actions` เช่น ค้นหา Symbol, กลุ่ม Action, Sector, Trend และ Min Score
  - เพิ่ม Order by ให้เลือกเรียงตาม Score, Market Value, Gain/Loss %, RRR, Price หรือ Symbol พร้อม ascending/descending
  - เพิ่ม Field picker ให้เลือกเพิ่ม/ลดคอลัมน์ที่แสดงในตารางได้
  - เพิ่ม status summary ว่ากำลังแสดงกี่รายการจากทั้งหมด และ filter/sort ที่ใช้
  - ทำ UI ให้ responsive และใช้งานง่ายบน desktop/mobile
  - เพิ่ม regression/frontend marker เพื่อยืนยันว่า controls ยังอยู่ใน bundle
  - อัปเดต README, Web App usage และ `plan.md`
  - ทดสอบ syntax, targeted frontend regression, web smoke และ CI quality เท่าที่เหมาะสม

### T73 - Recommended Actions Initialization Bug Fix

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 14:30:04 +07:00
- เสร็จเมื่อ: 2026-06-11 14:33:44 +07:00
- เหตุผล:
  - หลัง T72 หากผู้ใช้มี saved portfolio แล้วหน้า Portfolio render ระหว่าง `await initialize()` จะเกิด error `can't access lexical declaration 'recommendedActionSortFields' before initialization`
  - สาเหตุคือ config ของ Recommended actions ถูกประกาศด้วย `const` หลัง `await initialize()` ทำให้ยังอยู่ใน temporal dead zone ตอน render ครั้งแรก
  - ต้องแก้ให้ config ที่ render ใช้งานถูก initialize ก่อนเริ่ม app และเพิ่ม regression guard กันเกิดซ้ำ
- งานที่ต้องทำ:
  - ย้าย `recommendedActionFields` และ `recommendedActionSortFields` ไปไว้ก่อน `await initialize()`
  - ตรวจว่าฟังก์ชัน render/controls ยังใช้งานได้เหมือนเดิม
  - เพิ่ม regression ตรวจลำดับ declaration ก่อน `await initialize()`
  - อัปเดต `plan.md`
  - ทดสอบ syntax, targeted frontend regression, web smoke และ CI quality เท่าที่เหมาะสม

### T74 - SQLite Adapter and Database Selection Foundation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 19:50:44 +07:00
- เสร็จเมื่อ: 2026-06-11 19:59:33 +07:00
- เหตุผล:
  - ช่วงทดลองระบบหรือ demo ควรมี database แบบง่ายที่ไม่ต้องติดตั้ง server เพื่อให้เอกและผู้ทดลองใช้งานเริ่มได้เร็วกว่า Postgres
  - Production จริงยังควรใช้ Postgres เพราะเหมาะกับผู้ใช้หลายคน, subscription, audit, backup, query-level tenant guard และ deployment จริง
  - ระบบควรเลือก adapter ผ่าน env ได้ชัดเจน เช่น `APP_STATE_REPOSITORY=sqlite` สำหรับทดลอง และ `APP_STATE_REPOSITORY=postgres` สำหรับ production โดยไม่ผูก business logic กับ database ใด database หนึ่ง
- งานที่ต้องทำ:
  - เพิ่ม `sqlite` เป็น supported app-state repository adapter โดย default ยังเป็น `local_file`
  - เพิ่ม SQLite repository foundation สำหรับ read/write state และ repository metadata โดยใช้ไฟล์ local database
  - เพิ่ม env/config docs เช่น `APP_STATE_REPOSITORY=sqlite`, `SQLITE_DATABASE_PATH=data/stockflix.sqlite`
  - เพิ่ม regression ตรวจ default local file, sqlite selectable/read-write, postgres selectable และ unsupported adapter fail-fast
  - อัปเดต README, Web App usage, Database migration foundation, CI quality docs และ `plan.md`
  - ทดสอบ syntax, state repository regression, targeted regression และ CI quality เท่าที่เหมาะสม

### T75 - SQLite Trial to Postgres Promotion Runbook

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 20:13:37 +07:00
- เสร็จเมื่อ: 2026-06-11 20:26:37 +07:00
- เหตุผล:
  - หลังเพิ่ม SQLite adapter แล้ว ผู้ใช้สามารถทดลองระบบด้วยไฟล์ SQLite ได้ง่าย แต่เมื่อต้องขึ้น production ควรมีขั้นตอนย้ายข้อมูลไป Postgres ที่ชัดเจน
  - ต้องทำแบบ dry-run-first เพื่อป้องกันการเขียนฐานข้อมูล production โดยไม่ได้ตรวจ readiness, backup และ target database config
  - ควร reuse state/importer foundation เดิมให้มากที่สุด เพื่อลดความเสี่ยงและทำให้ AI รอบถัดไปอ่านต่อได้จาก `plan.md`
- งานที่ต้องทำ:
  - เพิ่ม service/CLI สำหรับสร้าง promotion plan จาก SQLite trial state ไป Postgres production โดย default เป็น dry-run
  - รองรับ input เช่น `SQLITE_DATABASE_PATH`, `DATABASE_URL`, `--dry-run`, `--confirm` และ guard สำหรับ backup/readiness evidence
  - เพิ่ม output evidence แบบ JSON/text ที่ mask secret และแสดง record counts, blockers/warnings, import target และ next steps
  - เพิ่ม regression ด้วย fake Postgres client หรือ dry-run path เพื่อยืนยันว่าไม่เขียนจริงถ้าไม่ confirm
  - อัปเดต README, Web App usage, Database migration foundation, CI quality docs และ `plan.md`
  - ทดสอบ syntax, targeted regression, regression รวม และ CI quality เท่าที่เหมาะสม

### T76 - Database Mode Advisor for Owner Dashboard

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 07:26:50 +07:00
- เสร็จเมื่อ: 2026-06-12 07:39:16 +07:00
- เหตุผล:
  - หลังระบบรองรับ `local_file`, `sqlite` และ `postgres` แล้ว owner/admin ควรเห็นชัดว่า environment ปัจจุบันใช้ storage แบบใด
  - ผู้ใช้ที่ไม่เชี่ยวชาญฐานข้อมูลควรเห็นคำอธิบายง่าย ๆ ว่า mode นี้เหมาะกับ demo, trial หรือ production
  - ก่อนเปิดขายจริง Business dashboard ควรบอก next action เช่น ใช้ SQLite ทดลองได้, ต้อง promote ไป Postgres, หรือต้องตั้ง backup/SSL/driver ให้ครบ
- งานที่ต้องทำ:
  - เพิ่ม database mode advisor ใน business metrics/storage readiness payload โดยใช้ `stateRepositoryInfo()` และ readiness report เดิม
  - แสดงในหน้า Business dashboard เป็น card/section อ่านง่ายสำหรับ owner/admin
  - ระบุ adapter ปัจจุบัน, production readiness, write mode, migration target, recommended action และ command สำคัญแบบไม่เปิดเผย secret
  - เพิ่ม regression/frontend marker เพื่อยืนยัน UI/ข้อความและ payload ยังอยู่
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, targeted regression, web smoke และ CI quality เท่าที่เหมาะสม

### T77 - Production Environment Advisor for Owner Dashboard

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 07:43:04 +07:00
- เสร็จเมื่อ: 2026-06-12 07:51:33 +07:00
- เหตุผล:
  - ระบบมี deployment checklist/ops alert CLI แล้ว แต่ owner/admin ที่ไม่ถนัดเทคนิคยังต้องอ่าน env และ command หลายจุดเอง
  - ก่อนเปิดขายจริงควรมี advisor ที่แปล production env readiness เป็นภาษาง่าย เห็น blocker, warning, next action และคำสั่งที่ต้องรัน
  - ต้อง reuse deployment checklist เดิม ไม่อ่านหรือแสดง secret และไม่ execute command จากหน้าเว็บ
- งานที่ต้องทำ:
  - เพิ่ม production environment advisor จาก `buildProductionDeploymentChecklist()` เพื่อสรุป status, blockers, warnings, next action, env groups และ commands
  - expose advisor ใน business metrics payload และ Business dashboard สำหรับ owner/admin
  - เพิ่ม frontend section/markers และ CSS ให้ command/checklist ไม่ล้นบน desktop/mobile
  - เพิ่ม regression ตรวจ payload, secret masking และ frontend markers
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, deployment checklist regression, frontend regression, web smoke และ CI quality เท่าที่เหมาะสม

### T78 - Blank Input Template Downloads

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 08:06:56 +07:00
- เสร็จเมื่อ: 2026-06-12 08:12:16 +07:00
- เหตุผล:
  - ผู้ใช้ใหม่ยังไม่มีไฟล์ portfolio/watchlist ที่ format ถูกต้อง จึงไม่รู้ว่าต้องกรอกคอลัมน์อะไร
  - หน้า Upload portfolio ควรมีปุ่ม Download template เปล่าให้โหลดไปกรอกเองก่อนวิเคราะห์
  - Template ต้องไม่มีข้อมูลหุ้น/พอร์ตตัวอย่าง เพื่อไม่ทำให้ผู้ใช้เข้าใจว่าเป็นคำแนะนำลงทุนหรือเปิดเผยข้อมูลส่วนตัว
- งานที่ต้องทำ:
  - เพิ่ม endpoint สำหรับดาวน์โหลด `portfolio_template.xlsx` ที่มี header `Symbol`, `Quantity`, `Avg_Price` และไม่มี holding data
  - เพิ่ม endpoint สำหรับดาวน์โหลด `watchlist_template.txt` แบบไฟล์เปล่าเพื่อให้ผู้ใช้กรอก ticker ทีละบรรทัด
  - เพิ่มลิงก์/ปุ่ม Download template ในหน้า Run Analysis ใกล้ช่อง upload
  - เพิ่มคำอธิบายสั้น ๆ ว่าต้องกรอกอะไรและ template ไม่มีข้อมูลตัวอย่าง
  - เพิ่ม regression ตรวจ endpoint, header/template content และ frontend markers
  - อัปเดต README, Web App usage, CI quality docs และ `plan.md`
  - ทดสอบ syntax, web smoke/frontend regression และ CI quality เท่าที่เหมาะสม

### T79 - Watchlist Template Instructions

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 08:19:03 +07:00
- เสร็จเมื่อ: 2026-06-12 08:23:25 +07:00
- เหตุผล:
  - Watchlist template แบบไฟล์เปล่าใช้งานถูกต้องทางเทคนิค แต่ผู้ใช้ใหม่อาจไม่รู้ว่าต้องกรอก ticker อย่างไร
  - ควรใส่คำอธิบายในไฟล์ template โดยไม่ทำให้ parser เอาคำอธิบายไปวิเคราะห์เป็น symbol
  - ต้องรักษา portfolio template ให้ไม่มี holding data ตัวอย่างเหมือนเดิม เพื่อลดความเข้าใจผิดว่าเป็นคำแนะนำลงทุน
- งานที่ต้องทำ:
  - ปรับ watchlist parser ให้ข้ามบรรทัด comment ที่ขึ้นต้นด้วย `#`
  - ปรับ `watchlist_template.txt` ให้มีคำแนะนำการกรอก, ตัวอย่างรูปแบบที่เป็น comment และพื้นที่ให้เริ่มกรอก
  - อัปเดต UI/docs ให้ไม่บอกว่า watchlist template เป็นไฟล์เปล่า
  - ปรับ regression จากคาดว่าไฟล์ว่าง เป็นคาดว่ามีคำแนะนำและ parser ignore comment ได้
  - อัปเดต `plan.md` พร้อมผลทดสอบ
  - ทดสอบ syntax, web smoke/frontend regression และ CI quality เท่าที่เหมาะสม

### T80 - Public Raw CSV Download Filename

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 08:31:15 +07:00
- เสร็จเมื่อ: 2026-06-12 08:34:30 +07:00
- เหตุผล:
  - ชื่อ download `siamchart_raw.csv` อาจทำให้ผู้ใช้เข้าใจผิดว่าระบบเอาข้อมูลจากเว็บไซต์ SiamChart
  - ต้องเปลี่ยนชื่อไฟล์ที่ผู้ใช้ดาวน์โหลดเป็นกลาง ๆ เช่น `raw_CSV.csv`
  - ควรคงไฟล์ภายใน `siamchart_raw.csv` ไว้ก่อนเพื่อไม่กระทบ Python parity/regression และเอกสาร behavior contract เดิม
- งานที่ต้องทำ:
  - เปลี่ยน `Content-Disposition` ของ `/api/analysis/raw` ให้ download เป็น `raw_CSV.csv`
  - ปรับข้อความ link ใน UI ให้ระบุชื่อไฟล์ใหม่หรือ neutral wording
  - เพิ่ม regression ตรวจ filename จาก raw CSV download โดยไม่ต้อง run market fetch จริง
  - อัปเดต README/docs/plan ให้แยกระหว่าง internal compatibility file กับ public download filename
  - ทดสอบ syntax, web smoke และ CI quality เท่าที่เหมาะสม

### T81 - Coverage Report Public Raw Filename Sanitization

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 08:40:24 +07:00
- เสร็จเมื่อ: 2026-06-12 08:46:14 +07:00
- เหตุผล:
  - แม้ T80 เปลี่ยนชื่อไฟล์ raw CSV ตอน download เป็น `raw_CSV.csv` แล้ว แต่ `live_market_coverage_report.json` ยังมี `source.targetFile` ชี้ path ภายใน `...siamchart_raw.csv`
  - JSON report เป็นสิ่งที่ผู้ใช้ดาวน์โหลดได้ จึงไม่ควร expose ชื่อ internal compatibility file หรือ absolute path ในเครื่อง
  - ต้องรักษาไฟล์ภายใน `siamchart_raw.csv` เพื่อ Python parity/regression แต่ public report ควรใช้ชื่อกลาง
- งานที่ต้องทำ:
  - ปรับ coverage report จาก Web App ให้ `source.targetFile` เป็น public filename `raw_CSV.csv` แทน internal path
  - ปรับ CLI/market coverage report path ให้หลีกเลี่ยง absolute path หรือชื่อที่ทำให้เข้าใจผิดเมื่อต้อง export ให้ผู้ใช้
  - เพิ่ม regression ตรวจว่า coverage report/download ไม่ expose `siamchart_raw.csv` ใน public-facing field
  - อัปเดต docs/plan ให้แยก internal compatibility file กับ public report metadata
  - ทดสอบ syntax, market coverage regression, web smoke และ CI quality เท่าที่เหมาะสม

### T82 - Portfolio Data Missing After Public Filename Rename

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 12:55:52 +07:00
- เสร็จเมื่อ: 2026-06-12 13:10:34 +07:00
- เหตุผล:
  - หลังเปลี่ยนชื่อ public download/raw report filename เป็น `raw_CSV.csv` ผู้ใช้พบว่าหน้า Portfolio ไม่แสดงข้อมูล
  - ต้องแยกให้ชัดว่า portfolio data หายจาก API response, saved portfolio snapshot, หรือ frontend render หลัง analysis
  - ต้องรักษา internal compatibility file `siamchart_raw.csv` ไว้ เพื่อไม่กระทบ Python parity/regression เดิม
- งานที่ต้องทำ:
  - ตรวจ analysis route/service ว่ายังอ่าน internal raw file และ portfolio workbook ถูกต้อง
  - ตรวจ frontend render Portfolio หลัง analysis และหลังโหลด saved snapshot ว่ายังใช้ field ถูกต้อง
  - เพิ่ม regression ที่จำลอง upload/run analysis แล้วต้องมี portfolio rows/render markers ไม่ว่าง
  - แก้จุดที่ผูกชื่อไฟล์ public `raw_CSV.csv` ผิดกับ internal analysis file หากพบ
  - อัปเดต docs/plan และทดสอบ syntax, targeted regression, web smoke และ CI quality เท่าที่เหมาะสม

### T83 - Zero-Market Portfolio Snapshot Recovery Tool

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 13:17:04 +07:00
- เสร็จเมื่อ: 2026-06-12 14:11:23 +07:00
- เหตุผล:
  - T82 ป้องกันไม่ให้ zero-row market fetch ทับข้อมูลในอนาคตแล้ว แต่ snapshot/output ที่เคยถูกทับก่อนหน้าอาจยังค้างเป็น market value/score = 0
  - ผู้ใช้ที่เห็นหน้า Portfolio ว่างหรือ `No Data` จาก snapshot เก่า ควรมีเครื่องมือ dry-run เพื่อดูว่าสามารถซ่อมจาก reference fallback ได้หรือไม่
  - การซ่อมข้อมูลลูกค้าต้องปลอดภัยและไม่เขียนทับจริงถ้าไม่ได้สั่ง `--confirm`
- งานที่ต้องทำ:
  - เพิ่ม CLI dry-run สำหรับหา portfolio snapshots ที่มี holdings แต่ market value เป็น 0/No Data
  - ใช้ reference master/`recommended_stocks.csv` เพื่อ rehydrate portfolio rows ด้วย `analyzeHolding()`
  - default เป็น dry-run, แสดงจำนวน snapshot ที่ซ่อมได้/ซ่อมไม่ได้ และรองรับ `--confirm` เมื่อผู้ใช้ต้องการเขียนจริง
  - เพิ่ม safety backup ก่อน confirm write สำหรับ local state
  - เพิ่ม regression ด้วย temp state/reference เพื่อยืนยัน dry-run/confirm behavior
  - อัปเดต docs/plan และทดสอบ syntax, targeted regression, CI quality เท่าที่เหมาะสม

### T84 - Portfolio Data Health Visibility for Admin

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 14:15:18 +07:00
- เสร็จเมื่อ: 2026-06-12 14:28:29 +07:00
- เหตุผล:
  - T82/T83 ป้องกันและกู้ snapshot ที่ market value เป็น 0 ได้แล้ว แต่ owner/admin ยังไม่มีหน้าจอในเว็บเพื่อมองเห็น health ของ portfolio snapshots
  - ถ้าผู้ใช้หรือทีม support เจอ Portfolio ว่าง ควรเห็นจำนวน snapshot ที่ healthy/repairable/skipped และคำสั่ง dry-run/confirm ที่ปลอดภัยโดยไม่ต้องเดาจาก CLI
  - ต้องไม่ให้ customer ทั่วไปเห็นข้อมูล portfolio ของคนอื่น
- งานที่ต้องทำ:
  - เพิ่ม service summary สำหรับ portfolio data health โดย reuse logic จาก recovery service แบบ dry-run
  - เพิ่ม owner/admin API ที่คืน snapshot health, repairable count, skipped count และ command guidance โดยไม่เขียนข้อมูลจริง
  - เพิ่ม Business dashboard card/panel ให้เห็น Portfolio Data Health พร้อม marker สำหรับ regression
  - เพิ่ม regression ครอบคลุม owner access, customer access denied และ frontend marker
  - อัปเดต docs/plan และทดสอบ targeted regression, web smoke และ CI quality เท่าที่เหมาะสม
- ผลลัพธ์:
  - เพิ่ม `portfolioSnapshotHealthSummary()` แบบ read-only เพื่อสรุป healthy/zero-market/repairable/skipped/empty snapshots โดย reuse recovery dry-run logic
  - เพิ่ม owner/admin API `GET /api/admin/portfolio-health` และกัน customer/advisor ไม่ให้เข้าถึงข้อมูลรวมของ portfolio คนอื่น
  - เพิ่ม Portfolio Data Health panel ใน Business dashboard พร้อม status, metric, dry-run/confirm command guidance, safeguards และ recent snapshot table
  - เพิ่ม regression ใน `test:portfolio-recovery`, `test:frontend-auth`, `test:web-smoke` และอัปเดต docs
  - ทดสอบผ่าน: `npm run check`, `npm run test:portfolio-recovery`, `npm run test:frontend-auth`, `npm run test:web-smoke`, `npm run ci:quality`

### T85 - Portfolio Data Health Support Context and Export

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 14:32:09 +07:00
- เสร็จเมื่อ: 2026-06-12 14:40:56 +07:00
- เหตุผล:
  - T84 ทำให้ owner/admin เห็นว่า snapshot ไหน healthy/repairable แล้ว แต่ตารางยังเน้น `userId` ซึ่งทีม support อ่านยาก
  - ทีม support ควรรู้ว่า record นั้นเป็นของลูกค้าคนไหน, workspace ใด, plan/status อะไร และ export เป็น CSV เพื่อเก็บหลักฐานก่อน/หลัง recovery ได้
  - CSV export ต้องจำกัด owner/admin และควรบันทึก audit event โดยไม่ใส่ข้อมูลลับลง audit details
- งานที่ต้องทำ:
  - เพิ่ม customer/workspace/subscription context ใน `portfolioSnapshotHealthSummary()` โดยไม่เปลี่ยน behavior recovery
  - เพิ่ม CSV renderer และ owner/admin endpoint สำหรับ export Portfolio Data Health
  - เพิ่มปุ่ม/link download ใน Business dashboard และปรับ table ให้ทีม support อ่านได้ง่ายขึ้น
  - เพิ่ม regression ตรวจ owner export, customer denied, frontend marker และ service CSV output
  - อัปเดต docs/plan และทดสอบ targeted regression, web smoke และ CI quality เท่าที่เหมาะสม
- ผลลัพธ์:
  - เพิ่ม support context ใน `portfolioSnapshotHealthSummary()` เช่น customer name/email, workspace, plan และ subscription status โดยยังเป็น read-only summary
  - เพิ่ม `renderPortfolioSnapshotHealthCsv()` และ endpoint `GET /api/admin/portfolio-health/export` สำหรับ owner/admin พร้อม filename `stockflix-portfolio-health-{date}.csv`
  - เพิ่ม audit action `portfolio_health.export` โดยบันทึกเฉพาะ metadata จำนวน snapshot/status ไม่บันทึกรายละเอียดลูกค้าลง audit details
  - ปรับ Business dashboard Portfolio Data Health ให้มี `Download health CSV` และ table แสดง Customer/Email/Workspace/Plan แทน userId อย่างเดียว
  - เพิ่ม regression ใน `test:portfolio-recovery`, `test:frontend-auth`, `test:web-smoke` และอัปเดต docs
  - ทดสอบผ่าน: `npm run check`, `npm run test:portfolio-recovery`, `npm run test:frontend-auth`, `npm run test:web-smoke`, `npm run ci:quality`

### T86 - Portfolio Data Health Support Filters

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 21:50:38 +07:00
- เสร็จเมื่อ: 2026-06-12 21:54:38 +07:00
- เหตุผล:
  - T85 ทำให้ export CSV ได้แล้ว แต่ทีม support ยังต้องอ่านรายการในหน้า Business แบบรวมทั้งหมด
  - เมื่อมีลูกค้าหลายคน ควรค้นหาด้วยชื่อ/email/workspace, filter ตามสถานะ และ sort ตาม generated date/status/market value ได้จากหน้าเว็บทันที
  - controls ต้องเป็น frontend-only ไม่เปลี่ยนข้อมูลจริง และต้องไม่กระทบ recovery/CSV behavior เดิม
- งานที่ต้องทำ:
  - เพิ่ม state และ controls ใน Portfolio Data Health panel สำหรับ search, status filter, order by และ direction
  - ปรับ table ให้ใช้ผลลัพธ์ที่ filter/sort แล้ว พร้อม status text ว่าแสดงกี่รายการจากทั้งหมด
  - เพิ่ม event handler แบบไม่แตะ backend state และ reset view ที่ปลอดภัย
  - เพิ่ม regression/frontend markers และอัปเดต docs/plan
  - ทดสอบ targeted regression, web smoke และ CI quality เท่าที่เหมาะสม
- ผลลัพธ์:
  - เพิ่ม state `portfolioHealthFilters` สำหรับ query/status/orderBy/direction และ reset เมื่อ logout หรือไม่ใช่ owner/admin
  - เพิ่ม controls ใน Portfolio Data Health panel สำหรับ search customer, status filter, order by, direction และ reset view
  - เพิ่ม helper `filterPortfolioHealthSnapshots()` และ `attachPortfolioHealthControls()` ให้ filter/sort ทำงานแบบ frontend-only ไม่เขียน backend state
  - ปรับ table ให้แสดงรายการที่ผ่าน filter/sort พร้อมข้อความ `Showing X of Y snapshots`
  - เพิ่ม regression markers ใน `test:frontend-viewport` และ `test:web-smoke` พร้อมอัปเดต docs
  - ทดสอบผ่าน: `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run ci:quality`

### T87 - Commit and Push Current Web App Work

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 22:07:04 +07:00
- เสร็จเมื่อ: 2026-06-12 22:09:31 +07:00
- เหตุผล:
  - ผู้ใช้ขอให้ commit และ push งานล่าสุดขึ้น GitHub
  - ต้อง stage เฉพาะไฟล์งานที่เกี่ยวข้อง และไม่ commit ไฟล์ state/backup ที่อาจมีข้อมูลส่วนตัว
  - ต้องคง branch `codex-node-web-app-migration` และยังไม่สร้าง Pull Request เข้า main ตามคำสั่งก่อนหน้า
- งานที่ต้องทำ:
  - ตรวจ branch/status และเลือกไฟล์ที่จะ stage
  - exclude `data/app-state*.json` backup/runtime state จาก commit
  - run git diff/check ที่จำเป็นก่อน commit
  - commit ด้วยข้อความที่สรุป portfolio health/support hardening
  - push branch `codex-node-web-app-migration` ไป GitHub
  - อัปเดต `plan.md` พร้อมผลลัพธ์ commit/push
- ผลลัพธ์:
  - commit หลักสำเร็จ: `e53eea5 Improve portfolio health support workflows`
  - push สำเร็จไปที่ `origin/codex-node-web-app-migration`
  - ไม่ stage/commit ไฟล์ `data/app-state*.json` backup/runtime state และเพิ่ม ignore guard ใน `.gitignore`
  - ยังไม่ได้สร้าง Pull Request และยังไม่ได้ merge เข้า `main`

### T88 - System Admin and User Management Surface

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 22:22:42 +07:00
- เสร็จเมื่อ: 2026-06-12 22:27:36 +07:00
- เหตุผล:
  - ผู้ใช้พบว่า Web App ไม่มีหน้าจัดการ User หรือหน้าจัดการระบบที่มองเห็นชัดเจน
  - ระบบมี API/team/workspace/admin readiness อยู่แล้ว แต่ UI รวมอยู่ในหน้า Business ทำให้ไม่ชัดว่าใช้ดูแลระบบอย่างไร
- งานที่ต้องทำ:
  - [x] เพิ่ม System Admin overview ในหน้า Business สำหรับ owner/admin/advisor ตามสิทธิ์
  - [x] แยกส่วน User Management ให้ชัดเจน พร้อมสรุปจำนวน user, role, plan, paid/trial และ advisor assignment
  - [x] ทำ Quick Actions/Operational controls ให้ owner/admin เข้าใจว่าต้องจัดการ role, workspace, advisor, approval, database และ production readiness ที่ไหน
  - [x] ปรับตาราง Team and clients ให้สื่อว่าเป็น User Management และอ่านง่ายขึ้น
  - [x] เพิ่ม marker/UI copy สำหรับ regression test เพื่อยืนยันว่าหน้าจัดการระบบแสดงจริง
  - [x] อัปเดตเอกสารและ `plan.md` เมื่อเสร็จ
- ผลลัพธ์:
  - เพิ่ม `System Admin` panel ในหน้า Business พร้อม metrics ผู้ใช้ ลูกค้า advisor/admin, paid/trial, unassigned customers, workspaces และ advisor links
  - เพิ่ม quick action cards สำหรับ role, advisor assignment, workspace, billing, database readiness และ production guard
  - เปลี่ยนตารางทีมให้เป็น `User Management` / `Assigned Client Management` พร้อม marker `data-user-management-panel`
  - เพิ่ม CSS สำหรับ admin summary/action cards และ responsive guard
  - อัปเดต `docs/WEB_APP_USAGE.md`
  - ทดสอบผ่าน: `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ แล้วทำ T88 ต่อจาก branch `codex-node-web-app-migration`
  - เป้าหมายคือทำให้หน้าเว็บมี System Admin/User Management ที่เห็นชัดสำหรับ owner/admin โดยใช้ backend เดิมเป็นหลัก
  - ตรวจไฟล์หลัก `src/public/app.js`, `src/public/styles.css`, `docs/WEB_APP_USAGE.md`, regression ที่เกี่ยวข้อง เช่น `npm run test:web-smoke` และ `npm run test:frontend-viewport`
  - ห้ามลบ `plan.md`

### T89 - Commit and Push System Admin Surface

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 22:31:31 +07:00
- เสร็จเมื่อ: 2026-06-12 22:33:00 +07:00
- เหตุผล:
  - T88 ทำเสร็จและ targeted tests ผ่านแล้ว แต่ยังเป็น working tree change
  - ต้องแพ็กงานเป็น commit แยกบน branch `codex-node-web-app-migration` เพื่อให้ GitHub มีงานล่าสุด
- งานที่ต้องทำ:
  - [x] ตรวจ `git status` และ stage เฉพาะไฟล์ที่เกี่ยวกับ T88/T89
  - [x] ไม่ stage/commit ไฟล์ portfolio ส่วนตัวหรือ runtime state เช่น `data/app-state*.json`
  - [x] commit ด้วยข้อความสรุป System Admin/User Management surface
  - [x] push ไป `origin/codex-node-web-app-migration`
  - [x] อัปเดต `plan.md` พร้อม commit hash และผล push
- ผลลัพธ์:
  - commit สำเร็จ: `5bfc3e9 Add system admin management surface`
  - push สำเร็จไปที่ `origin/codex-node-web-app-migration`
  - ยังไม่ได้สร้าง Pull Request และยังไม่ได้ merge เข้า `main`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - หาก T89 ยัง In Progress ให้ตรวจ `git status`, commit เฉพาะไฟล์ T88/T89 และ push branch `codex-node-web-app-migration`
  - ห้ามลบ `plan.md` และห้าม commit ไฟล์ข้อมูลส่วนตัว/runtime state

### T90 - Local Owner Login Recovery

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-12 22:39:14 +07:00
- เสร็จเมื่อ: 2026-06-12 22:39:44 +07:00
- เหตุผล:
  - ผู้ใช้จำ email/password ของ account แรกที่เป็น owner ไม่ได้ จึงเข้า Business/System Admin ไม่ได้
  - ระบบเก็บ password เป็น PBKDF2 hash จึงไม่สามารถอ่านรหัสผ่านเดิมกลับมาได้ ต้อง reset password หรือสร้าง owner ใหม่
- งานที่ต้องทำ:
  - [x] ตรวจ owner account ใน `data/app-state.json`
  - [x] สำรอง `data/app-state.json` ก่อนแก้ไข
  - [x] reset passwordHash ของ owner เป็นรหัสชั่วคราวที่ผู้ใช้ใช้ login ได้
  - [x] ไม่ commit ไฟล์ `data/app-state.json` หรือ backup state เพราะเป็นข้อมูล runtime/private
  - [x] อัปเดต `plan.md` พร้อม email owner และแนวทางเข้าใช้งาน
- ผลลัพธ์:
  - owner account ถูก reset ใน local state แล้ว และแจ้ง email ให้ผู้ใช้ใน chat เท่านั้น
  - owner name ถูกตรวจพบและยืนยันใน local state แล้ว
  - temporary password ถูกแจ้งให้ผู้ใช้ใน chat เท่านั้น ไม่บันทึกลง Git tracked file
  - backup state ถูกสร้างใน `data/app-state.owner-reset-*.json`
  - `data/app-state.json` และ backup ถูก ignore โดย `.gitignore` จึงไม่ถูก commit
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - หาก T90 ยัง In Progress ให้ตรวจ `data/app-state.json`, สำรองไฟล์ก่อน reset และอย่า commit runtime state
  - อธิบายผู้ใช้ว่า password เดิมอ่านกลับไม่ได้เพราะเป็น hash

### T91 - Record Sanitized Owner Recovery Plan

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-13 06:58:41 +07:00
- เสร็จเมื่อ: 2026-06-13 07:00:51 +07:00
- เหตุผล:
  - T90 reset owner local สำเร็จแล้ว แต่ `plan.md` ยังเป็น working tree change
  - ต้อง commit เฉพาะแผนที่ sanitize แล้ว โดยไม่ push email/password หรือ runtime state
- งานที่ต้องทำ:
  - [x] ตรวจว่า `plan.md` ไม่บันทึก email/password จริงของ owner reset
  - [x] stage เฉพาะ `plan.md`
  - [x] commit และ push ไป branch `codex-node-web-app-migration`
  - [x] ตรวจ `git status` ให้สะอาดหลัง push
- ผลลัพธ์:
  - commit สำเร็จ: `cbb6b04 Record sanitized owner recovery plan`
  - push สำเร็จไปที่ `origin/codex-node-web-app-migration`
  - `data/app-state.json` และ backup state ยังถูก ignore และไม่ได้ commit
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - หาก T91 ยัง In Progress ให้ commit เฉพาะ `plan.md` ที่ sanitize แล้ว และห้าม commit `data/app-state.json`

### T92 - Portfolio Visual Click Filters

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-13 07:12:06 +07:00
- เสร็จเมื่อ: 2026-06-13 07:14:55 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้การกดสถานะต่าง ๆ ใน `Action mix` และ `Score distribution` บนหน้า Portfolio กรองตาราง Recommended actions ตามสิ่งที่เลือก
  - ปัจจุบัน visual dashboard แสดงสถานะอย่างเดียว ทำให้ผู้ใช้ต้องไปเลือก filter เองอีกครั้ง
- งานที่ต้องทำ:
  - [x] ทำให้ bar ใน `Action mix` เป็นปุ่มที่ตั้งค่า Action filter ของ Recommended actions ตามกลุ่มที่เลือก
  - [x] ทำให้ bar ใน `Score distribution` เป็นปุ่มที่กรองช่วงคะแนนจริง เช่น Strong 70+, Watch 45-69, Risk <45
  - [x] แสดง active/selected state บน bar ที่ถูกเลือก และให้ Reset view ล้าง visual filter ด้วย
  - [x] ไม่เปลี่ยนสูตรวิเคราะห์หรือค่าคะแนนเดิม แก้เฉพาะ interaction/filter UI
  - [x] เพิ่ม regression markers/docs ให้ตรวจว่า feature นี้ยังอยู่
  - [x] ทดสอบ frontend/web smoke ที่เกี่ยวข้อง
- ผลลัพธ์:
  - `Action mix` คลิกเพื่อกรอง Recommended actions ตามกลุ่ม action ได้
  - `Score distribution` คลิกเพื่อกรองช่วงคะแนนจริง `Strong 70+`, `Watch 45-69`, `Risk <45` ได้
  - Reset view ล้าง filter จาก chart และ manual filter ที่เกี่ยวข้อง
  - เพิ่ม markers `data-recommended-action-filter`, `data-recommended-score-band`, `attachPortfolioVisualFilters`
  - ทดสอบผ่าน: `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
  - commit/push สำเร็จ: `a332b42 Add portfolio visual filters`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T92 ยัง In Progress ให้แก้ `src/public/app.js`, `src/public/styles.css`, `docs/WEB_APP_USAGE.md`, regression markers โดยไม่เปลี่ยนสูตรวิเคราะห์
  - ตรวจด้วย `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T93 - Portfolio Sector Exposure Click Filter

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-13 07:21:50 +07:00
- เสร็จเมื่อ: 2026-06-13 07:23:15 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้กดสถานะ/กลุ่มใน `Sector exposure` บนหน้า Portfolio แล้วกรองตาราง Recommended actions ตาม sector ที่เลือก
  - T92 ทำ Action mix และ Score distribution แล้ว แต่ Sector exposure ยังเป็น visual แบบอ่านอย่างเดียว
- งานที่ต้องทำ:
  - [x] ทำให้ bar ใน `Sector exposure` เป็นปุ่มที่ตั้งค่า Sector filter ของ Recommended actions
  - [x] แสดง selected state และให้ Reset view ล้าง sector visual filter ด้วย
  - [x] ไม่เปลี่ยนสูตรวิเคราะห์หรือข้อมูล sector เดิม แก้เฉพาะ interaction/filter UI
  - [x] เพิ่ม regression markers/docs ให้ตรวจว่า feature นี้ยังอยู่
  - [x] ทดสอบ frontend/web smoke ที่เกี่ยวข้อง
- ผลลัพธ์:
  - `Sector exposure` คลิกเพื่อกรอง Recommended actions ตาม sector ได้
  - manual Sector filter จะล้าง selected state จาก sector chart เพื่อไม่ให้สถานะค้าง
  - Reset view ล้าง selected state ของ Sector exposure, Action mix และ Score distribution
  - เพิ่ม marker `data-recommended-sector-filter`
  - ทดสอบผ่าน: `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
  - commit/push สำเร็จ: `b4fa2e5 Add portfolio sector visual filter`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T93 ยัง In Progress ให้แก้ `src/public/app.js`, docs และ regression markers โดย reuse pattern T92
  - ตรวจด้วย `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T94 - Screener and Sector Chart Row Highlight

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 07:55:48 +07:00
- เสร็จเมื่อ: 2026-06-18 07:59:10 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้คลิกหุ้นในรูปกราฟของหน้า Screener และ Sector แล้วไป highlight แถวในตารางข้อมูล เพื่อให้ focus อ่านข้อมูลหุ้นตัวนั้นง่ายขึ้น
  - เป็น UX improvement เท่านั้น ต้องไม่เปลี่ยนสูตรวิเคราะห์ คะแนน หรือข้อมูล output
- งานที่ต้องทำ:
  - [x] ตรวจโครงสร้างกราฟและตารางของหน้า Screener และ Sector
  - [x] ทำให้กราฟหุ้นที่คลิกได้ส่งค่า symbol ไป highlight แถวตารางที่ตรงกัน
  - [x] เพิ่ม selected/highlight style, focus และ scroll behavior ที่อ่านง่าย
  - [x] เพิ่ม regression markers/docs ที่เกี่ยวข้อง
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - หน้า `Stock Screener` คลิกหุ้นใน `Quality vs reward` scatter หรือ `Top ideas` bar แล้ว highlight แถวหุ้นนั้นในตาราง
  - หน้า `Sector Analysis` คลิกหุ้นใน `Sector leaders` bar หรือ `Timing vs quality` scatter แล้ว highlight แถวหุ้นนั้นในตาราง
  - เพิ่ม keyboard support ด้วย Enter/Space สำหรับ element กราฟที่ focus ได้
  - เพิ่ม style `table-row-highlight`, `stock-chart-trigger` และ status text สำหรับบอกหุ้นที่ focus อยู่
  - เพิ่ม docs และ regression markers `data-stock-highlight`, `data-stock-row`, `attachStockHighlightControls`
  - ทดสอบผ่าน: `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T94 ยัง In Progress ให้แก้ `src/public/app.js` และ `src/public/styles.css` โดยเน้น click interaction จากกราฟหุ้นไปยังแถวตาราง ห้ามเปลี่ยนสูตรวิเคราะห์
  - ตรวจด้วย `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T95 - Screener Top Ideas Green Highlight

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 08:07:31 +07:00
- เสร็จเมื่อ: 2026-06-18 08:10:03 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้หุ้นใน `Top ideas` หน้า Screener เด่นขึ้นด้วยสีเขียว เพราะเป็นหุ้นที่ระบบ recommend และควร focus อ่านได้ง่าย
  - ต้องทำเฉพาะ visual emphasis ไม่เปลี่ยนสูตร ranking หรือคะแนน
- งานที่ต้องทำ:
  - [x] ระบุ top idea symbols จากข้อมูลเดียวกับ `Top ideas`
  - [x] ทำให้จุดใน `Quality vs reward` scatter ของหุ้น Top ideas เป็นสีเขียว
  - [x] ทำให้ bar ใน `Top ideas` ใช้สีเขียว/selected visual ที่ชัดเจน
  - [x] เพิ่ม regression markers/docs ที่เกี่ยวข้อง
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - หุ้นใน `Top ideas` หน้า Screener ใช้ bar สีเขียวเพื่อสื่อว่าเป็นกลุ่มที่ระบบ recommend
  - จุดของหุ้น Top ideas ใน `Quality vs reward` scatter เป็นสีเขียวและใหญ่ขึ้นเล็กน้อยเพื่อ focus ง่าย
  - หุ้นอื่นใน scatter ยังใช้สีเดิม และ hover/selected behavior ยังทำงานร่วมกับ highlight แถวตารางจาก T94
  - เพิ่ม docs และ regression markers `top-idea-bar`, `top-idea-point`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T95 ยัง In Progress ให้แก้ `src/public/app.js` และ `src/public/styles.css` เพื่อ highlight หุ้น Top ideas เป็นสีเขียวในหน้า Screener เท่านั้น ห้ามเปลี่ยนสูตรวิเคราะห์
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T96 - Limit Top Ideas Green to Quality vs Reward Dots

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 08:15:13 +07:00
- เสร็จเมื่อ: 2026-06-18 08:16:59 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้สีเขียวแสดงเฉพาะจุดวงกลมในกราฟ `Quality vs reward` ที่เป็นหุ้นตัวเดียวกับ `Top ideas`
  - bar ใน `Top ideas` ไม่ควรเป็นสีเขียว เพื่อไม่ให้ visual emphasis มากเกินไป
- งานที่ต้องทำ:
  - [x] เอา green emphasis ออกจาก `Top ideas` bar
  - [x] คงสีเขียวเฉพาะ scatter point ที่ symbol อยู่ใน Top ideas
  - [x] ปรับ docs/regression markers ให้ตรงกับ behavior ใหม่
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - `Top ideas` bar กลับไปใช้สีเดิม แต่ยังคลิกเพื่อ highlight แถวตารางได้จาก T94
  - สีเขียวเหลือเฉพาะจุดวงกลมใน `Quality vs reward` ที่ symbol ตรงกับหุ้นใน `Top ideas`
  - ลบ/เลิกใช้ marker และ CSS `top-idea-bar`
  - คง marker และ CSS `top-idea-point`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T96 ยัง In Progress ให้คง `top-idea-point` สำหรับ scatter เท่านั้น และลบ/เลิกใช้ `top-idea-bar` จาก UI/tests/docs
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T97 - Simulation Split Buy Tranches

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 08:27:10 +07:00
- เสร็จเมื่อ: 2026-06-18 08:31:09 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้หน้า Simulation รองรับการแบ่งซื้อเป็นหลายไม้ เพื่อทดสอบแนวคิดการทยอยลงทุนได้ดีกว่าซื้อครั้งเดียว
  - ต้องคงโหมดซื้อครั้งเดียวเดิมไว้เพื่อเปรียบเทียบ และเพิ่มโหมดแบ่งไม้แบบเข้าใจง่ายสำหรับมือใหม่
- งานที่ต้องทำ:
  - [x] ตรวจ route/service/frontend ของ Simulation ปัจจุบัน
  - [x] เพิ่ม input `Buy mode`, จำนวนไม้ และระยะห่างการซื้อแต่ละไม้ในหน้าเว็บ
  - [x] เพิ่ม backend simulation แบบ split buy โดยแบ่งเงินเท่าๆ กันต่อไม้และซื้อเป็นรอบตามช่วงวัน trading rows
  - [x] แสดงผลเพิ่ม เช่น เงินต่อไม้, จำนวนไม้ที่ซื้อจริง, trade schedule และ average cost
  - [x] เพิ่ม docs/regression tests ที่เกี่ยวข้อง
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - หน้า `Strategy Simulation` มี `Buy Mode` ให้เลือก `Lump Sum` หรือ `Split Buy`
  - โหมด `Split Buy` ให้กำหนดจำนวนไม้และจำนวน trading days ระหว่างไม้ได้ เช่น 100,000 บาท / 5 ไม้ = 20,000 บาทต่อไม้
  - backend แบ่งเงินเป็นไม้เท่าๆ กันและปล่อยเงินเข้า simulation ตามรอบ trading rows โดย strategy เดิมยังเป็นคนตัดสินใจซื้อเมื่อเข้าเงื่อนไข
  - ผลลัพธ์แสดง `Buy Mode`, average cost, completed tranches, deployed capital และ Split Buy Plan
  - trade history เพิ่ม `Cost` และ portfolio history เพิ่ม `Deployed_Capital`
  - เพิ่ม regression `scripts/simulationSplitBuyRegression.js`, npm script `test:simulation-split-buy` และผูกเข้า `test-regression`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:simulation-split-buy`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T97 ยัง In Progress ให้แก้ Simulation โดยเพิ่ม split buy tranches แบบไม่ลบโหมด lump sum เดิม และอย่าเปลี่ยนสูตรวิเคราะห์หุ้นส่วนอื่น
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, และ regression ของ simulation/frontend ที่เกี่ยวข้อง

### T98 - Sector Analysis Pro Differentiation

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 08:43:00 +07:00
- เสร็จเมื่อ: 2026-06-18 08:46:33 +07:00
- เหตุผล:
  - หน้า Screener และ Sector ตอนนี้ทำงานซ้ำกันมากเกินไป ทำให้แพ็กเกจ Pro ที่มี Sector/Simulation ดูไม่คุ้ม
  - ต้องยกระดับ Sector ให้เป็นเครื่องมือวิเคราะห์ระดับอุตสาหกรรมและพอร์ต ไม่ใช่แค่ตารางหุ้นอีกหน้า
- งานที่ต้องทำ:
  - [x] ตรวจโครงสร้างหน้า Sector, Screener และ Portfolio data ที่ใช้ร่วมกัน
  - [x] เพิ่ม Sector Ranking พร้อม Sector Score, label และ rotation signal
  - [x] เพิ่ม Portfolio Sector Risk โดยเทียบ holdings ในพอร์ตกับ sector ที่เลือก
  - [x] เพิ่ม sector comparison visuals ที่ต่างจาก Screener เช่น quality, valuation, momentum/exposure
  - [x] เพิ่ม docs/regression markers เพื่อสื่อว่า Sector เป็น Pro feature ที่คุ้มขึ้น
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - หน้า `Sector Analysis` เพิ่ม `Pro Sector Intelligence` เพื่อแยกบทบาทจาก Screener ชัดเจน
  - เพิ่ม `Sector Score Ranking` จาก score เฉลี่ย, RRR, upside, ROE, D/E และ momentum โดยไม่เปลี่ยนสูตรหุ้นรายตัว
  - เพิ่ม `Rotation Signal` เช่น `Strong Sector`, `Accumulation Watch`, `Cheap but Selective`, `Weak Momentum`, `Neutral`
  - เพิ่ม `Portfolio Sector Risk` จาก exposure ในพอร์ตและความแข็งแรงของ sector เช่น concentration risk, overexposed weak sector, underweight sector ที่แข็งแรง
  - เพิ่ม visual panels `Sector Score Ranking`, `Portfolio Sector Risk`, `Rotation Signals`, `Quality vs Valuation Context`
  - เพิ่ม docs อธิบายความต่างระหว่าง `Stock Screener` กับ `Sector Analysis` สำหรับ Pro
  - เพิ่ม regression markers `data-sector-pro-intelligence`, `data-sector-ranking-panel`, `data-sector-risk-panel`, `data-sector-rotation-panel`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T98 ยัง In Progress ให้ยกระดับหน้า `Sector Analysis` ให้เน้น sector-level ranking/rotation/portfolio risk โดยไม่ลดความสามารถ Screener และไม่เปลี่ยนสูตรวิเคราะห์หุ้นเดิม
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T99 - Beginner-Friendly Sector UX Simplification

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 08:54:09 +07:00
- เสร็จเมื่อ: 2026-06-18 08:57:14 +07:00
- เหตุผล:
  - หลังเพิ่ม Pro Sector Intelligence หน้า Sector มีข้อมูลเยอะเกินไป มือใหม่อาจงงและไม่รู้ว่าควรอ่านตรงไหนก่อน
  - ต้องคงคุณค่าของแพ็กเกจ Pro แต่จัดลำดับข้อมูลใหม่ให้เริ่มจากคำแนะนำง่ายๆ ก่อนตาราง/ตัวเลขขั้นสูง
- งานที่ต้องทำ:
  - [x] วิเคราะห์จุดที่หน้า Sector ทำให้มือใหม่สับสน
  - [x] เพิ่ม beginner summary/next step ที่สรุปว่าควรดู sector ไหนและเพราะอะไร
  - [x] ลดจำนวน panel ที่แสดงพร้อมกัน และย้ายตารางตัวเลขขั้นสูงเข้า progressive disclosure
  - [x] เปลี่ยนข้อความ/label ให้เข้าใจง่ายขึ้นโดยไม่เปลี่ยนสูตรคำนวณ
  - [x] เพิ่ม docs/regression markers ที่สะท้อน UX ใหม่
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - หน้า `Sector Analysis` เริ่มด้วยคำตอบง่ายๆ 3 ช่อง: กลุ่มน่าศึกษาก่อน, กลุ่มที่เลือกอยู่ควรทำอะไรต่อ, จุดที่ควรเช็กในพอร์ต
  - ลด panel ที่แสดงพร้อมกัน เหลือ 3 เรื่องหลัก: กลุ่มไหนน่าศึกษา, พอร์ตกระจุกตรงไหน, สัญญาณกลุ่มแบบอ่านง่าย
  - ย้ายตารางตัวเลขขั้นสูงของทุก sector เข้า `<details>` ชื่อ `ดูตารางตัวเลขขั้นสูงของทุก Sector`
  - แปล signal/risk เป็นภาษาง่าย เช่น `น่าศึกษาต่อ`, `เริ่มทยอยดูได้`, `ระวังเป็นพิเศษ`, `ถือกระจุกตัว`
  - คง logic Pro Sector Intelligence, Sector Score และ Portfolio Risk เดิมไว้ ไม่เปลี่ยนสูตรหุ้นรายตัว
  - เพิ่ม docs และ regression markers `data-sector-beginner-summary`, `data-sector-advanced-table`, `.sector-beginner-summary`, `.advanced-sector-details`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T99 ยัง In Progress ให้ปรับหน้า Sector ให้มือใหม่อ่านง่ายขึ้น โดยแสดงคำแนะนำ/next step ก่อน แล้วซ่อนตารางขั้นสูงไว้ใน details ห้ามลบ logic Pro Sector Intelligence หรือเปลี่ยนสูตรหุ้นเดิม
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T100 - Beginner Table Header Hints

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 09:22:14 +07:00
- เสร็จเมื่อ: 2026-06-18 09:32:39 +07:00
- เหตุผล:
  - ผู้ใช้กลุ่มเป้าหมายไม่มีความรู้ด้านการลงทุน จึงไม่รู้ว่าคอลัมน์ในตารางเช่น `Total_Score`, `RRR`, `PE`, `ROE`, `DE`, `RSI` คืออะไร และค่าเท่าไหร่ถือว่าดีหรือควรระวัง
  - ต้องเพิ่ม hint ที่ header ของตารางเพื่อช่วยอ่านข้อมูล โดยไม่เปลี่ยนสูตรคำนวณหรือข้อมูลในตาราง
- งานที่ต้องทำ:
  - [x] เพิ่ม dictionary อธิบายคอลัมน์หลักของตารางหุ้น/sector/portfolio
  - [x] ปรับ `renderTable()` ให้ header มีปุ่ม `?` พร้อม tooltip/hint ที่ใช้ keyboard focus ได้
  - [x] เพิ่ม CSS ให้ tooltip ใน header ไม่ทำให้ตารางล้นหรืออ่านยาก
  - [x] เพิ่ม docs/regression markers ที่เกี่ยวข้อง
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - เพิ่ม `tableColumnTips` สำหรับคอลัมน์สำคัญ เช่น `Total_Score`, `RRR`, `Upside_Pct`, `PE`, `ROE`, `DE`, `RSI`, `Portfolio_Risk`, `Rotation_Signal`
  - `renderTable()` สร้าง header hint อัตโนมัติผ่านปุ่ม `?` ในคอลัมน์ที่มีคำอธิบาย
  - Tooltip บอก 3 ส่วน: ค่านี้คืออะไร, ค่าเท่าไหร่น่าเริ่มดู, ข้อควรระวัง
  - รองรับ hover และ keyboard focus ผ่าน `aria-describedby`
  - เพิ่ม CSS `.table-header-help`, `.table-tooltip-trigger`, `.table-tooltip-card`
  - เพิ่ม docs และ regression markers `data-table-header-hint`, `tableColumnTips`, `ค่าที่น่าเริ่มดู`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T100 ยัง In Progress ให้เพิ่ม table header hints สำหรับคอลัมน์การลงทุนหลัก โดยใช้ภาษาง่ายและเกณฑ์ดี/ควรระวัง ไม่เปลี่ยนสูตรคำนวณ
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T101 - Table Header Hint Initialization Fix

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 09:51:54 +07:00
- เสร็จเมื่อ: 2026-06-18 09:53:21 +07:00
- เหตุผล:
  - หลังเพิ่ม T100 โปรแกรม error `can't access lexical declaration 'tableColumnTips' before initialization`
  - สาเหตุคือ `await initialize()` เรียก render ตารางก่อน `const tableColumnTips` ถูกประกาศ
- งานที่ต้องทำ:
  - [x] ย้าย `tableColumnTips` ไปอยู่ก่อน `await initialize()`
  - [x] เพิ่ม regression ตรวจ initialization order เหมือน `recommendedActionFields`
  - [x] ทดสอบด้วย command ที่เกี่ยวข้อง
- ผลลัพธ์:
  - แก้ error `can't access lexical declaration 'tableColumnTips' before initialization`
  - ย้าย `const tableColumnTips` ไปอยู่ช่วงต้นไฟล์ก่อน event listeners และก่อน `await initialize()`
  - เพิ่ม `assertBefore(appJs, "const tableColumnTips", "await initialize();", ...)` ใน `scripts/frontendViewportRegression.js`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T101 ยัง In Progress ให้แก้ initialization order ของ `tableColumnTips` ให้อยู่ก่อน `await initialize()` และตรวจ regression ไม่ให้กลับมาเกิดอีก
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T102 - Portfolio Sector Exposure Other Clarification

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 09:58:42 +07:00
- เสร็จเมื่อ: 2026-06-18 10:00:57 +07:00
- เหตุผล:
  - ผู้ใช้เห็น `Other` ในกราฟ `Sector exposure` เยอะและสงสัยว่าถูกหรือไม่
  - ตรวจข้อมูลล่าสุดแล้ว `Other = 52,239 THB` เกิดจากการรวม sector ที่เหลือเพราะกราฟจำกัด `limit = 6` ไม่ใช่ sector จริง
  - UX ปัจจุบันทำให้เข้าใจผิด และ `Other` ยังถูก render เป็น filter button ทั้งที่ไม่มี sector ชื่อ Other จริง
- งานที่ต้องทำ:
  - [x] ปรับ `Sector exposure` ในหน้า Portfolio ไม่ให้รวม sector ที่เหลือเป็น `Other`
  - [x] แสดง sector จริงทั้งหมดในพอร์ต หรือทำให้ผู้ใช้เห็นชัดว่าเป็นการรวม
  - [x] เพิ่ม regression/docs marker ที่อธิบาย behavior ใหม่
  - [x] ทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - ตรวจข้อมูลล่าสุดแล้ว `Other = 52,239 THB` มาจากการรวม `Basic Materials 21,840`, `Industrials 12,670`, `Healthcare 11,160`, `Consumer Cyclical 4,660`, `Real Estate 1,909`
  - สาเหตุคือ `renderPortfolioVisuals()` เดิมใช้ `breakdownBy(..., limit = 6)` ทำให้แสดง 5 sector แรกและรวม sector ที่เหลือเป็น `Other`
  - ปรับ `Sector exposure` ให้เรียก `breakdownBy()` โดยไม่ส่ง limit เพื่อแสดง sector จริงทั้งหมดในพอร์ต
  - เพิ่มข้อความใต้หัวข้อ `Sector exposure`: `แสดง sector จริงทั้งหมดในพอร์ต ไม่มีการรวมเป็น Other`
  - เพิ่ม docs และ regression markers `data-sector-exposure-complete`, `ไม่มีการรวมเป็น Other`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T102 ยัง In Progress ให้แก้ `Sector exposure` หน้า Portfolio ไม่ให้ `Other` ทำให้ผู้ใช้เข้าใจผิดและไม่ให้คลิก filter ไป sector ที่ไม่มีจริง
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T103 - Simulation Strategy vs Buy & Hold Chart

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 10:34:26 +07:00
- เสร็จเมื่อ: 2026-06-18 10:37:13 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการให้หน้า Simulation มีกราฟเหมือน Python version เพื่อดูการเติบโตของพอร์ตแบบ Strategy เทียบกับ Buy & Hold
  - กราฟช่วยให้มือใหม่เห็นภาพมากกว่าตารางตัวเลขและ trade history อย่างเดียว
- งานที่ต้องทำ:
  - [x] เพิ่มกราฟเส้น `Portfolio_Value` vs `Buy_Hold_Value` จาก simulation history
  - [x] เพิ่ม legend, แกนเวลา/มูลค่า และคำอธิบายวิธีอ่านแบบภาษาง่าย
  - [x] แสดงกราฟหลัง Run Simulation โดยไม่เปลี่ยน backend calculation
  - [x] เพิ่ม CSS และ regression markers
  - [x] อัปเดต docs และทดสอบด้วย command ที่เหมาะสม
- ผลลัพธ์:
  - เพิ่ม native SVG chart `Portfolio Growth: Strategy vs Buy & Hold` ในหน้า Simulation หลัง metric cards
  - กราฟใช้ `data.history` จาก API เดิม โดยเปรียบเทียบ `Portfolio_Value` กับ `Buy_Hold_Value`
  - เพิ่ม legend เส้น Strategy สีฟ้า และ Buy & Hold สีส้ม พร้อมแกนเวลา/มูลค่า
  - เพิ่ม card `Better in this run` เพื่อบอกว่ารอบนี้ Strategy หรือ Buy & Hold ชนะ
  - เพิ่ม `<details>` `วิธีอ่านกราฟนี้` เพื่ออธิบายให้มือใหม่เข้าใจ
  - เพิ่ม CSS `.simulation-growth-panel`, `.simulation-chart-frame`, `.chart-reading-guide`, `.strategy-line`, `.buy-hold-line`
  - เพิ่ม docs และ regression markers `data-simulation-growth-chart`, `data-simulation-chart-guide`
  - ทดสอบผ่าน: `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - ถ้า T103 ยัง In Progress ให้เพิ่ม native SVG chart ในหน้า Simulation เพื่อเทียบ Strategy vs Buy & Hold โดยใช้ `data.history` จาก API เดิม ห้ามเปลี่ยนสูตร simulation
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T104 - Starter/Pro Launch Scope and Package Validity

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 13:27:57 +07:00
- เสร็จเมื่อ: 2026-06-18 13:32:52 +07:00
- เหตุผล:
  - ช่วงเปิดตัวควรลดความซับซ้อนโดยขายจริงเฉพาะ Starter 790 THB/month และ Pro 1,490 THB/month ก่อน
  - Advisor ยังยากต่อการอธิบาย ทดลอง และ support จึงควรเก็บเป็น coming soon/internal prototype
  - ระบบที่ใช้งานจริงต้องตรวจวันหมดอายุของ trial/subscription ได้ แม้ยังไม่มี online payment เต็มรูปแบบ
- งานที่ต้องทำ:
  - [x] แยก public subscription plans ออกจาก internal subscription plans
  - [x] ให้ public pricing/API/checkout เปิดเฉพาะ Starter และ Pro
  - [x] แสดง Advisor เป็น coming soon/manual contact แทนแพ็กเกจที่กดซื้อได้
  - [x] ป้องกัน public checkout/payment session ของ plan ที่ยังไม่เปิดขาย
  - [x] ตรวจสถานะแพ็กเกจหมดอายุจาก `trialEndsAt` และ `renewsAt`
  - [x] อัปเดต docs/regression และทดสอบ targeted commands
- ผลลัพธ์:
  - เพิ่ม `publicSubscriptionPlans()`, `deferredSubscriptionPlans()` และ `isPublicCheckoutPlan()` ใน auth service
  - `/api/subscription/plans` ส่ง public plans เฉพาะ `starter,pro`, ส่ง Advisor ใน `deferredPlans` และระบุ `launchMode: starter_pro_manual_ready`
  - `/api/subscription/checkout` และ `/api/subscription/payment-session` ปฏิเสธ Advisor ใน public flow
  - Pricing UI แสดง Starter/Pro เป็นแพ็กเกจหลัก และแสดง Advisor เป็น coming soon/manual contact
  - Locked feature card ไม่แสดงปุ่ม upgrade ไป Advisor ที่กดแล้ว error แต่แสดงข้อความ deferred upgrade แทน
  - `normalizeSubscription()` เปลี่ยน `trialing/active` เป็น `past_due` เมื่อเลย `trialEndsAt/renewsAt`
  - อัปเดต docs และ regression markers สำหรับ Starter/Pro launch
  - ทดสอบผ่าน: `node --check src/public/app.js`, `node --check src/services/authService.js`, `node --check src/routes/authRoutes.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run test:subscription-lifecycle`, `npm run test:entitlements`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - public launch scope ตอนนี้คือขาย/ทดลองใช้งานจริงเฉพาะ Starter และ Pro ก่อน
  - ห้ามทำให้ Advisor กลับมาเป็น public checkout plan จนกว่าจะมี requirement ใหม่
  - backend ยังเก็บ Advisor entitlement/workspace/approval regression เป็น internal prototype เพื่อไม่ให้ระบบเดิมพัง
  - ถ้าแก้ subscription ให้ตรวจ `trialEndsAt`, `renewsAt`, public plan API และ checkout guard ด้วย `npm run test:web-smoke`, `npm run test:subscription-lifecycle`, `npm run test:entitlements`

### T105 - Manual Subscription Admin Controls

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 13:37:03 +07:00
- เสร็จเมื่อ: 2026-06-18 13:43:27 +07:00
- เหตุผล:
  - ถ้ายังไม่เปิด online payment เต็มรูปแบบ owner/admin ต้องจัดการแพ็กเกจให้ลูกค้าแบบ manual ได้จากหน้าเว็บ
  - ช่วง launch ควรจำกัด manual package ให้เลือก Starter/Pro ก่อน เพื่อให้ product ง่ายและ support ง่าย
  - การเปลี่ยนแพ็กเกจควรมี audit trail และไม่ต้องแก้ไฟล์ฐานข้อมูลเอง
- งานที่ต้องทำ:
  - [x] เพิ่ม service สำหรับ owner/admin update subscription ของ user เป็น Starter/Pro พร้อม status และวันหมดอายุ
  - [x] เพิ่ม API admin สำหรับ update package แบบ manual
  - [x] เพิ่ม controls ใน User Management ให้เลือก package/status/expiry และ save ได้
  - [x] เพิ่ม docs/regression markers และทดสอบ targeted commands
- ผลลัพธ์:
  - เพิ่ม `updateUserSubscription()` ใน auth service เพื่อให้ owner/admin อัปเดต package แบบ manual เป็น Starter/Pro ได้
  - เพิ่ม API `POST /api/admin/users/:userId/subscription`
  - เพิ่ม controls ใน `Business` > `User Management` สำหรับเลือก plan, status, expiry date และปุ่ม `Save package`
  - จำกัด manual launch package เป็น Starter/Pro เท่านั้น
  - บันทึก audit event `team.subscription_update` พร้อม previous/next plan, status และ expiry
  - เพิ่ม regression ใน `npm run test:subscription-lifecycle` ให้ตรวจ manual package update และ audit event
  - ทดสอบผ่าน: `node --check src/services/authService.js`, `node --check src/routes/authRoutes.js`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run test:subscription-lifecycle`, `npm run test:entitlements`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T105 เสร็จแล้ว ถ้าแก้ต่อให้รักษา manual subscription management สำหรับ owner/admin ใน User Management โดยจำกัด launch plan เป็น Starter/Pro และต้องมี audit event
  - ตรวจด้วย `npm run check`, `node --check src/services/authService.js`, `node --check src/routes/authRoutes.js`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T106 - Make Guide Profile Affect User Guidance

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 13:50:24 +07:00
- เสร็จเมื่อ: 2026-06-18 13:55:53 +07:00
- เหตุผล:
  - ผู้ใช้พบว่า Guide กรอกแล้วไม่เห็นผล ทำให้มือใหม่ไม่เข้าใจว่ากรอกไปทำไม
  - Guide ควรเปลี่ยนสิ่งที่ผู้ใช้เห็นจริงใน Portfolio, Screener และ Simulation โดยไม่ต้องอธิบายซ้ำ
  - ช่วงแรกควรทำ personalization ฝั่ง UI ก่อน เพื่อไม่เปลี่ยนสูตรวิเคราะห์เดิมและลด risk regression
- งานที่ต้องทำ:
  - [x] เพิ่ม personalized guide summary ที่บอกชัดว่า Guide ส่งผลกับอะไรบ้าง
  - [x] เพิ่ม personalized guidance ในหน้า Portfolio จาก goal/experience/risk/budget/horizon
  - [x] ปรับค่า default filter/ข้อความแนะนำใน Screener ตาม risk/experience
  - [x] ปรับ default Simulation buy mode/tranches/capital hint ตาม risk/monthly budget/horizon
  - [x] เพิ่ม docs/regression markers และทดสอบ targeted commands
- ผลลัพธ์:
  - เพิ่ม `effectiveGuideProfile()` และ `guidePolicy()` เพื่อแปล Guide profile เป็นค่า Score/RRR/D/E, จำนวนไม้, ระยะห่างไม้ และเงินจำลอง
  - หน้า Guide แสดง `Guide changes your app` เพื่อบอกว่าการกรอก profile จะเปลี่ยน Portfolio, Screener และ Simulation อย่างไร
  - หน้า Portfolio เพิ่ม `Guide personalization` และ `Personalized guidance` เพื่อบอกหุ้นที่ต้องระวัง, หุ้นที่ผ่านเกณฑ์ profile, เงินต่อไม้ และ action ที่ควรเริ่มดูก่อน
  - หน้า Screener ใช้ default filter จาก profile เช่น risk ต่ำใช้ Score 70+, RRR 1.5+, D/E <= 0.7
  - หน้า Simulation ใช้ monthly budget/risk/horizon เพื่อตั้ง initial capital, years back, buy mode, tranches และ tranche interval
  - อัปเดต docs และ regression markers `data-guide-impact-summary`, `data-guide-profile-impact`, `data-profile-portfolio-guidance`, `data-profile-default-filter`, `data-profile-simulation-default`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T106 เสร็จแล้ว ถ้าแก้ต่อให้รักษาหลักการว่า Guide ต้องมีผลที่ผู้ใช้เห็นจริงใน Portfolio/Screener/Simulation โดยไม่เปลี่ยนสูตร scoring/backtest เดิมโดยไม่จำเป็น
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T107 - Hide Guide From Launch UI and Declutter Portfolio

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 14:07:15 +07:00
- เสร็จเมื่อ: 2026-06-18 14:16:49 +07:00
- เหตุผล:
  - ผู้ใช้ยังไม่เห็นประโยชน์ของ Guide แม้ปรับ personalization แล้ว จึงไม่ควรแสดงใน launch UI เพราะทำให้ผู้ใช้มือใหม่สับสน
  - หน้า Portfolio ควรโฟกัสข้อมูลที่ตัดสินใจได้จริง ไม่ควรมี panel ที่อธิบายระบบมากเกินไป
  - ควรซ่อน Guide จาก UI โดยยังเก็บ backend/profile foundation ไว้สำหรับอนาคต ไม่ลบข้อมูลเดิม
- งานที่ต้องทำ:
  - [x] ซ่อนปุ่ม Guide จาก navigation และตัด route/view frontend ที่ผู้ใช้เปิดได้
  - [x] ถอด Guide personalization ออกจาก Portfolio, Screener และ Simulation
  - [x] ลดความรกหน้า Portfolio โดยเอา panel ที่ไม่จำเป็นออก เหลือ metric, visual filter, recommended actions และคำแนะนำสั้นที่ไม่อ้าง Guide
  - [x] อัปเดต docs/regression markers ให้ตรงกับ launch UI ใหม่
  - [x] ทดสอบ syntax, frontend viewport และ web smoke
- ผลลัพธ์:
  - ถอดปุ่ม `Guide` จาก navigation ใน `src/public/index.html`
  - หยุดโหลด investor profile ใน frontend และถอด route/view `onboarding` ออกจาก `renderActiveView()`
  - ถอด Guide personalization, profile-based Screener default และ profile-based Simulation default ออกจาก `src/public/app.js`
  - หน้า Portfolio เหลือ `portfolio-summary-strip` 3 ช่องแบบสั้น ไม่อ้าง Guide และลด panel ซ้ำซ้อน
  - ถอด profile completion/Guide column จาก Business/User Management UI ที่ทำให้ผู้ใช้สับสนเมื่อไม่มีหน้า Guide แล้ว
  - เก็บ backend investor profile service ไว้ภายในสำหรับอนาคต ไม่ลบข้อมูลเก่า
  - อัปเดต docs ให้ระบุว่า Guide ถูกซ่อนจาก launch UI และ frontend smoke guard ว่า navigation ต้องไม่มี `data-view="onboarding"`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T107 เสร็จแล้ว ถ้าแก้ต่อให้รักษาหลักการว่า launch UI ไม่มี Guide และ Portfolio ต้องไม่กลับไปรกด้วย personalization panel ที่ผู้ใช้ไม่เห็นประโยชน์
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T108 - Hide Approvals From Starter/Pro Launch UI

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 18:51:02 +07:00
- เสร็จเมื่อ: 2026-06-18 18:55:23 +07:00
- เหตุผล:
  - ตอนนี้ launch scope เปิดขาย/ทดลองใช้งานจริงเฉพาะ Starter และ Pro ก่อน ส่วน Advisor ถูก defer ไว้
  - เมนู `Approvals` เป็น workflow สำหรับ Advisor/ทีมบริการที่ต้องให้ลูกค้ายืนยัน action สำคัญ จึงทำให้ผู้ใช้มือใหม่สับสนเมื่อยังไม่มี Advisor workflow จริง
  - ควรซ่อนจาก main navigation และเอกสาร launch UI แต่ยังคง backend approval foundation/regression ไว้สำหรับอนาคต
- งานที่ต้องทำ:
  - [x] ซ่อนปุ่ม `Approvals` จาก navigation
  - [x] ป้องกัน frontend route `approvals` ไม่ให้เป็น active view จาก UI ปกติ และไม่ให้ smoke test คาดหวังเมนูนี้
  - [x] ปรับ Business/เอกสารให้สื่อว่า approval workflow เป็น internal/deferred Advisor foundation ไม่ใช่ feature launch phase
  - [x] อัปเดต regression marker ให้ยืนยันว่า launch navigation ไม่มี `data-view="approvals"`
  - [x] ทดสอบ syntax, frontend viewport, web smoke และ check
- ผลลัพธ์:
  - ถอดปุ่ม `Approvals` จาก main navigation ใน `src/public/index.html`
  - ถอด route branch, account pending approval text, Business approval metrics และ Business approval workspace ออกจาก launch frontend surface
  - หยุด frontend โหลด `/api/approvals` ใน startup/analysis/admin refresh path ที่ไม่จำเป็นต่อ launch UI
  - คง backend approval functions/API/regression foundation ไว้สำหรับ Advisor phase ภายหลัง
  - อัปเดต docs ให้ระบุว่า approval workflow เป็น internal/deferred foundation และ public launch package table เหลือ Starter/Pro
  - เพิ่ม regression guard ว่า launch navigation ต้องไม่มี `data-view="approvals"`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T108 เสร็จแล้ว: `Approvals` ถูกซ่อนจาก launch UI เพราะ Starter/Pro phase ยังไม่ควรโชว์ workflow Advisor
  - ห้ามลบ backend approval service/regression โดยไม่มี requirement ใหม่ เพราะยังเป็น foundation สำหรับ Advisor phase ภายหลัง
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T109 - Fix Workspace Hero Stretch on Simulation View

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 19:02:33 +07:00
- เสร็จเมื่อ: 2026-06-18 19:03:20 +07:00
- เหตุผล:
  - เมื่อกด `Simulation` พื้นที่ hero/snapshot ด้านบนยืดยาวผิดปกติ ทำให้หน้าจอดูเหมือน layout พัง
  - สาเหตุจาก `.workspace` เป็น grid item ที่ถูก stretch สูงเท่าคอลัมน์ซ้าย และ grid ด้านในกระจายพื้นที่ว่างให้ row ด้านบน
  - ต้องทำให้ workspace rows สูงตามเนื้อหาจริงและเริ่มชิดด้านบน เพื่อให้ทุก view รวมถึง Simulation ดูสม่ำเสมอ
- งานที่ต้องทำ:
  - [x] ปรับ CSS ของ `.left-rail`/`.workspace` ให้ grid content ไม่ stretch row สูงเกินเนื้อหา
  - [x] ปรับ `.hero-panel`/`.snapshot-card` ให้ card ไม่ยืดเต็มความสูงผิดปกติ
  - [x] เพิ่ม regression marker/guard ใน frontend viewport test เพื่อกัน layout stretch regression
  - [x] ทดสอบ syntax, frontend viewport, web smoke และ check
- ผลลัพธ์:
  - เพิ่ม `align-content: start` และ `align-items: start` ให้ `.left-rail`/`.workspace` เพื่อกัน CSS grid กระจาย row ตามความสูงคอลัมน์
  - เปลี่ยน `.hero-panel` จาก stretch เป็น start และเพิ่ม `align-self: start` เพื่อให้ hero สูงตามเนื้อหา
  - เพิ่ม `align-self: start` ให้ `.snapshot-card` เพื่อไม่ให้ card ด้านขวายืดเต็มพื้นที่ว่าง
  - เพิ่ม regression guard ใน `scripts/frontendViewportRegression.js`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T109 เสร็จแล้ว: hero/snapshot ด้านบนไม่ควรยืดยาวเมื่อเข้า Simulation เพราะ workspace grid ถูกล็อกให้เริ่มด้านบนและสูงตามเนื้อหา
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T110 - Manual Admin Package Assignment Flow

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 19:27:44 +07:00
- เสร็จเมื่อ: 2026-06-18 19:32:31 +07:00
- เหตุผล:
  - ช่วงแรกยังไม่ต้องรับชำระเงินผ่านเว็บ ผู้ใช้ควรสมัครสมาชิกก่อน แล้ว admin เป็นคนกำหนด package ให้ภายหลัง
  - Flow ปัจจุบันยังสื่อเหมือนมี checkout/local payment และสมาชิกใหม่ได้ Pro trial ทำให้ไม่ตรงกับการขายแบบ manual admin assignment
  - ต้องทำให้หน้า admin จัดการ package ชัดเจนขึ้น และให้ผู้ใช้ใหม่รู้ว่ารอ admin เปิดสิทธิ์
- งานที่ต้องทำ:
  - [x] ปรับ default subscription ของสมาชิกใหม่ให้เป็น manual pending/inactive package ยกเว้น owner คนแรกที่ต้องเข้า Business ได้
  - [x] ปรับหน้า auth/pricing ให้บอกชัดว่า signup คือการขอเข้าใช้งาน และ admin จะกำหนด Starter/Pro ให้ภายหลัง
  - [x] ปรับหน้า `Business > User Management` ให้เป็น admin package management ที่ชัดขึ้น พร้อม quick guide และสถานะรอเปิดสิทธิ์
  - [x] ปรับ docs/regression ให้ครอบคลุม manual assignment flow และปุ่ม/marker ของ admin package management
  - [x] ทดสอบ syntax, subscription lifecycle, frontend viewport, web smoke และ check
- ผลลัพธ์:
  - สมาชิกใหม่หลัง owner คนแรกจะได้ subscription `Starter` status `inactive` provider `manual_admin_pending` เพื่อรอ admin กำหนด package
  - owner คนแรกยังได้ Pro trial เพื่อเข้า Business dashboard และจัดการระบบได้
  - หน้า Member Access อธิบายว่าเป็นการสมัครเพื่อให้ admin เปิด Package
  - หน้า Monthly Plans แสดง Starter/Pro เป็นข้อมูลราคาเท่านั้น ปุ่ม plan disabled และข้อความบอกว่า admin จะกำหนด package จาก `Business > User Management`
  - ปิด public `/api/subscription/checkout` และ `/api/subscription/payment-session` ใน launch phase โดยตอบ `manual_admin_assignment`
  - หน้า `Business > User Management` มี guide `data-admin-package-management` พร้อมจำนวน account ที่รอ package และแถว user inactive แสดง `Waiting admin`
  - อัปเดต docs และ regression markers `data-manual-package-flow`, `data-admin-package-management`, `manual_admin_pending`
  - ทดสอบผ่าน: `node --check src/services/authService.js`, `node --check src/routes/authRoutes.js`, `node --check src/public/app.js`, `npm run test:subscription-lifecycle`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T110 เสร็จแล้ว: launch flow เป็นสมัครบัญชีก่อน แล้ว owner/admin กำหนด Starter/Pro, status และ expiry จาก `Business > User Management`
  - ห้ามเปิด payment checkout เป็น flow หลักใน launch phase จนกว่าจะมี requirement ใหม่
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:subscription-lifecycle`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T111 - Simplify Business Admin Cockpit

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 20:05:52 +07:00
- เสร็จเมื่อ: 2026-06-18 20:09:37 +07:00
- เหตุผล:
  - ผู้ใช้เปิดหน้า Business แล้วเจอ panel/เมนูจำนวนมากเกินไป ทำให้ไม่รู้ว่าต้องเริ่มทำอะไร
  - Launch phase ตอนนี้ควรเน้นงานหลักของ admin คือจัดการ Package ให้สมาชิกก่อน ไม่ใช่แสดงระบบหลังบ้านทั้งหมดพร้อมกัน
  - ต้องแยก Business เป็น cockpit แบบเลือกหมวด เพื่อให้มือใหม่เห็นเฉพาะงานที่ต้องทำในขณะนั้น
- งานที่ต้องทำ:
  - [x] เพิ่ม state/controls สำหรับเลือกหมวด Business เช่น Package, System, Data Health, Go-live
  - [x] ทำให้หน้า Business default เปิดที่ Package Management และซ่อน panel อื่นไว้จนกว่าจะเลือก
  - [x] ลด metric ด้านบนให้เหลือเฉพาะตัวเลขที่ admin ใช้ตัดสินใจเร็ว
  - [x] คงฟังก์ชัน System/Data Health/Launch Evidence ไว้ แต่แยกไปอยู่ในหมวดเฉพาะ
  - [x] อัปเดต CSS/docs/regression markers
  - [x] ทดสอบ syntax, frontend viewport, web smoke และ check
- ผลลัพธ์:
  - เพิ่ม `state.businessSection` และ controls `data-business-section-tabs` สำหรับเลือกหมวด Business
  - หน้า Business default เป็น `Package Management` พร้อม guide 3 ขั้นตอนและ User Management table
  - ลด KPI ด้านบนเหลือ Waiting Package, Users, Active Paid, MRR, Portfolios และ System
  - แยก `Users & Workspace`, `Data Health`, `Go-live Readiness` ออกเป็นหมวดที่กดเลือกได้
  - คง panel เดิมไว้แต่ไม่แสดงทั้งหมดพร้อมกัน ได้แก่ System Admin, Tenant/Workspace, Portfolio Data Health, Database Mode Advisor, Reference Master, Production Environment, Operational Readiness และ Launch Evidence
  - เพิ่ม CSS `.business-admin-cockpit`, `.business-section-tabs`, `.business-section-body` และ responsive guard
  - อัปเดต docs และ regression markers `data-business-admin-cockpit`, `data-business-section-tabs`, `data-business-section-default`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T111 เสร็จแล้ว: หน้า Business เป็น admin cockpit แบ่งหมวด และ default เข้า Package Management เพื่อลดความรก
  - ห้ามลบ backend/admin tools เดิมโดยไม่มี requirement ใหม่ ให้ซ่อน/จัดกลุ่มใน UI แทน
  - ตรวจด้วย `npm run check`, `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`

### T112 - Verify Admin Package Management Flow

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 20:26:13 +07:00
- เสร็จเมื่อ: 2026-06-18 20:29:04 +07:00
- เหตุผล:
  - ผู้ใช้ต้องการตรวจสอบว่า admin ทำงานถูกต้องหรือไม่ หลังปรับ Business เป็น admin cockpit และ manual package assignment
  - ต้องยืนยันทั้งสิทธิ์ owner/admin, การกัน customer, การกำหนด package, audit event และ frontend marker ที่ใช้จริง
- งานที่ต้องทำ:
  - [x] ตรวจโค้ด route/service ของ admin users และ subscription update
  - [x] รัน regression ที่เกี่ยวกับ subscription lifecycle และ admin package update
  - [x] รัน frontend/web smoke เพื่อยืนยัน Business cockpit, Package Management และ User Management markers
  - [x] ถ้าพบปัญหาให้แก้และทดสอบซ้ำ
  - [x] อัปเดต `plan.md` พร้อมผลตรวจและ prompt handoff
- ผลตรวจ:
  - `updateUserSubscription()` จำกัดสิทธิ์เฉพาะ owner/admin และบันทึก audit event `team.subscription_update`
  - API `POST /api/admin/users/:userId/subscription` ใช้ service เดียวกันและ customer ถูกปฏิเสธ
  - เพิ่ม API-level regression ใน `scripts/frontendAuthenticatedSmokeRegression.js`: customer ใหม่ต้องเป็น `inactive/manual_admin_pending`, owner update เป็น Pro active ได้, customer update package เองต้องได้ 403
  - พบ regression เดิมใน `scripts/tenantAccessRegression.js`: test ยัง save portfolio ก่อนเปิด package ให้ customer หลัง T110 จึง fail ด้วย `PLAN_UPGRADE_REQUIRED`
  - แก้ regression โดยให้ test เปิด package ให้ customer ก่อน save portfolio ตาม flow ใหม่
  - ผลทดสอบยืนยัน owner/admin admin flow ทำงานถูกต้อง และ tenant/customer guard ยังทำงาน
- ทดสอบผ่าน:
  - `npm run test:subscription-lifecycle`
  - `npm run test:tenant-access`
  - `npm run test:frontend-auth`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T112 เสร็จแล้ว: admin package flow ผ่าน test แล้ว owner update package ให้สมาชิกได้ customer update เองไม่ได้ และ regression tenant access ถูกปรับให้ตรงกับ manual package flow
  - ตรวจด้วย `npm run test:subscription-lifecycle`, `npm run test:tenant-access`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`

### T113 - Add Safe Admin User Deletion

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-18 20:38:28 +07:00
- เสร็จเมื่อ: 2026-06-18 20:46:47 +07:00
- เหตุผล:
  - หน้า User Management ยังไม่มีเมนูลบ User ทำให้ admin จัดการสมาชิกที่สมัครผิด/ทดสอบระบบ/เลิกใช้บริการไม่ได้
  - การลบ User เป็น action เสี่ยง ต้องมี guard ชัดเจนและ audit trail
  - ต้องลบข้อมูลที่ผูกกับ user อย่างเหมาะสมโดยไม่ทำลาย audit history
- งานที่ต้องทำ:
  - [x] เพิ่ม service สำหรับ owner/admin ลบ user แบบปลอดภัย
  - [x] เพิ่ม API route สำหรับลบ user พร้อม guard ห้ามลบตัวเองและห้ามลบ owner คนสุดท้าย
  - [x] เพิ่มปุ่ม Delete user ใน User Management พร้อม confirm dialog
  - [x] ลบ/cleanup records ที่ผูกกับ user เช่น sessions, profile, portfolio snapshot และ advisor assignment พร้อมบันทึก audit `team.user_deleted`
  - [x] ใช้ soft delete/anonymize user แทน hard delete เพื่อไม่ทำลาย audit history และไม่ทำให้ประวัติธุรกรรม/หลักฐานย้อนหลังหาย
  - [x] เพิ่ม/อัปเดต regression สำหรับ admin delete user และ customer guard
  - [x] อัปเดต docs/WEB_APP_USAGE.md อธิบายวิธีลบ user และข้อจำกัด
  - [x] ทดสอบ syntax, frontend auth, tenant access, frontend viewport, web smoke และ check
- ผลลัพธ์:
  - owner/admin เห็นปุ่ม `Delete user` ใน Business > User Management
  - ระบบ confirm ก่อนลบ และเรียก `DELETE /api/admin/users/:userId`
  - customer เรียก API ลบ user เองไม่ได้
  - admin/owner ลบ account ตัวเองไม่ได้ และลบ owner คนสุดท้ายไม่ได้
  - user ที่ถูกลบถูกตัด session ทันที, login ใหม่ไม่ได้, ถูกซ่อนจาก user list/business metrics และถูก anonymize
  - ระบบ cleanup sessions, portfolio snapshots, investor profiles และ advisor assignments ที่ผูกกับ user นั้น
  - ระบบบันทึก audit event `team.user_deleted`
- ทดสอบผ่าน:
  - `node --check src/services/authService.js`
  - `node --check src/routes/authRoutes.js`
  - `node --check src/public/app.js`
  - `node --check scripts/frontendAuthenticatedSmokeRegression.js`
  - `npm run test:frontend-auth`
  - `npm run test:tenant-access`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T113 เสร็จแล้ว: เพิ่ม admin safe user deletion แบบ soft delete/anonymize ใน Business > User Management
  - ห้ามเปลี่ยนเป็น hard delete โดยไม่มี requirement ใหม่ เพราะ audit/billing/history ต้องตรวจย้อนหลังได้
  - ถ้าทำต่อเรื่อง admin ให้รักษา guard เดิม: owner/admin only, customer forbidden, ห้ามลบตัวเอง, ห้ามลบ owner คนสุดท้าย
  - ตรวจด้วย `npm run test:frontend-auth`, `npm run test:tenant-access`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`

### T114 - Require Login Before Download, Browse, or Analysis Actions

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 07:56:34 +07:00
- เสร็จเมื่อ: 2026-06-19 08:00:46 +07:00
- เหตุผล:
  - ตอนยังไม่ login หน้า Run Analysis ยังให้กด download template และ browse ไฟล์ได้ ทำให้ผู้ใช้เข้าใจผิดว่าสามารถใช้งานได้แล้ว
  - ระบบควรบังคับเส้นทางใช้งานง่ายๆ คือสมัคร/เข้าสู่ระบบก่อน แล้วค่อย download template, upload file และ run analysis
  - ต้องล็อกทั้ง frontend และ backend เพราะการซ่อนปุ่มอย่างเดียวไม่พอ ผู้ใช้อาจเรียก URL download โดยตรงได้
- งานที่ต้องทำ:
  - [x] ปรับ frontend ให้ปุ่ม download template, file input และ Analyze disabled เมื่อยังไม่ login
  - [x] แสดงข้อความชัดเจนว่า `Sign in required` ก่อนใช้งาน Run Analysis
  - [x] เพิ่ม backend guard ให้ endpoint download template/output/report ต้อง login ก่อน
  - [x] อัปเดต regression test ให้ anonymous download ถูกปฏิเสธ และ logged-in owner/customer download ได้
  - [x] อัปเดต docs ให้บอกว่าต้อง login ก่อน download/upload/analyze
  - [x] รันทดสอบ frontend viewport, web smoke, frontend auth และ check
- ผลลัพธ์:
  - ก่อน login ลิงก์ download template ไม่มี `href`, ถูกตั้ง `aria-disabled`, file input ถูก disabled และปุ่มเป็น `Sign in to analyze`
  - หน้า Run Analysis แสดงข้อความ `Sign in required` และบอกให้ login ก่อน download, browse/upload หรือ run analysis
  - หลัง login ระบบ restore link download และเปิด file input/button ให้ใช้งาน
  - backend บังคับ login สำหรับ `/api/analysis/template/*`, `/api/analysis/raw`, `/api/analysis/recommended`, `/api/analysis/coverage` และ `/api/analysis/report/:fileName`
  - anonymous เรียก download URL โดยตรงจะได้ 401
- ทดสอบผ่าน:
  - `node --check src/routes/analysisRoutes.js`
  - `node --check src/public/app.js`
  - `node --check scripts/webAppSmokeRegression.js`
  - `node --check scripts/frontendViewportRegression.js`
  - `npm run test:web-smoke`
  - `npm run test:frontend-viewport`
  - `npm run test:frontend-auth`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T114 เสร็จแล้ว: Run Analysis ถูกล็อกก่อน login ทั้ง frontend และ backend
  - ห้ามเปิด anonymous download/browse/analyze กลับมาโดยไม่มี requirement ใหม่
  - ตรวจด้วย `npm run test:frontend-auth`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run check`

### T115 - Fix Single-Stock Display Across Portfolio, Screener, and Sector

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 08:07:35 +07:00
- เสร็จเมื่อ: 2026-06-19 08:11:03 +07:00
- เหตุผล:
  - ผู้ใช้พบว่า Portfolio, Screener และ Sector แสดงผลเหมือนเหลือหุ้นตัวเดียว
  - ต้องแยกให้ชัดว่าเกิดจากข้อมูลที่ run ล่าสุดมี symbol เดียวจริง, snapshot ล่าสุดถูกบันทึกทับ, หรือ frontend filter/render กรองผิด
  - ต้องไม่ลบ `plan.md` และต้องรักษา output/snapshot เดิมถ้ายังจำเป็นต่อการตรวจสอบ
- งานที่ต้องทำ:
  - [x] ตรวจจำนวนแถวใน `recommended_stocks.csv`, `siamchart_raw.csv` และ saved snapshot ล่าสุด
  - [x] ตรวจ frontend filter/render state ของ Portfolio/Screener/Sector ว่ามี filter ค้างหรือจำกัดแถวผิดหรือไม่
  - [x] ปรับ Screener default ให้แสดงหุ้นทั้งหมดก่อน ไม่กรองด้วย Score/RRR/D/E ทันที
  - [x] ปรับ Sector default เป็น `All sectors overview` เพื่อแสดงหุ้นทุก sector ก่อน แล้วค่อยเลือก sector เพื่อเจาะลึก
  - [x] เพิ่มข้อความหน้า Portfolio กรณีมี recommendations แต่ไม่มี portfolio holdings ว่าเป็น watchlist-only run ไม่ใช่ข้อมูลหาย
  - [x] เพิ่ม regression guard สำหรับ default-all stock view
  - [x] รันทดสอบที่เกี่ยวข้องและอัปเดต `plan.md`
- ผลตรวจ:
  - `data/outputs/recommended_stocks.csv` มี 10 หุ้น
  - `data/outputs/siamchart_raw.csv` มี 10 หุ้น
  - saved snapshot ล่าสุดมี recommendations 10 แถว แต่ portfolioRows 0 แถว เพราะรอบล่าสุดไม่มี portfolio holdings
  - default filter เดิมของ Screener คือ Score >= 60, RRR >= 1.5, D/E <= 1.0 ทำให้ชุดข้อมูลล่าสุดเหลือ BDMS ตัวเดียว จึงดูเหมือนระบบแสดงหุ้นเดียว
- ผลลัพธ์:
  - Screener ค่าเริ่มต้นแสดงทุกหุ้นจาก analysis ล่าสุดก่อน แล้วผู้ใช้ค่อยกรองเอง
  - Sector ค่าเริ่มต้นแสดง `All sectors overview` และตารางหุ้นทุกตัวจาก analysis ล่าสุดก่อน
  - Portfolio ถ้าไม่มี holdings จะบอกชัดว่า analysis ล่าสุดมี recommendations กี่ตัว แต่ยังไม่ได้ upload portfolio Excel
- ทดสอบผ่าน:
  - `node --check src/public/app.js`
  - `node --check scripts/frontendViewportRegression.js`
  - `node --check scripts/webAppSmokeRegression.js`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run test:frontend-auth`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T115 เสร็จแล้ว: ปัญหาแสดงหุ้นตัวเดียวเกิดจาก default filter เข้มเกินไป ไม่ใช่ CSV เหลือหุ้นเดียว
  - รักษา default ของ Screener/Sector ให้เริ่มจากแสดงทุกหุ้นก่อน เพื่อไม่ให้ผู้ใช้มือใหม่เข้าใจผิดว่าข้อมูลหาย
  - ห้ามลบ output/snapshot จริงโดยไม่จำเป็น

### T116 - Preserve Portfolio Holdings During Watchlist-only Analysis

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 08:14:58 +07:00
- เสร็จเมื่อ: 2026-06-19 08:18:33 +07:00
- เหตุผล:
  - ผู้ใช้มีไฟล์ portfolio อยู่แล้ว แต่หน้า Portfolio ขึ้น `No portfolio holdings loaded yet`
  - audit ล่าสุดของ user แสดง `hasPortfolio: false` และ `portfolioRows: 0` หลายครั้ง แปลว่า watchlist-only run ไป overwrite saved snapshot เดิม
  - watchlist-only analysis ควรอัปเดต recommendations/screener ได้ แต่ไม่ควรล้าง holdings เดิมของ Portfolio
- งานที่ต้องทำ:
  - [x] ตรวจ audit/snapshot ล่าสุดว่า run มี portfolio file จริงหรือไม่
  - [x] แก้ snapshot save logic ให้ preserve existing portfolioRows เมื่อ run ไม่มี portfolio file
  - [x] รักษา output portfolio report เดิมถ้า watchlist-only run ไม่มี report ใหม่
  - [x] เพิ่ม regression guard ว่า watchlist-only analysis ไม่ล้าง holdings เดิม
  - [x] กู้ snapshot ปัจจุบันของ user ที่ถูก overwrite จาก `portfolio_aom_analysis_report.xlsx`
  - [x] รันทดสอบ state patch/frontend/web smoke/check และอัปเดต `plan.md`
- ผลตรวจ:
  - audit ของ user `882199f9-d31c-4c3f-b493-cbf43bcf779f` มี watchlist-only run หลายครั้ง: `hasPortfolio: false`, `portfolioRows: 0`
  - ก่อนแก้ `saveCustomerPortfolioSnapshot()` จะ upsert snapshot ใหม่ด้วย `portfolioRows: []` จึงล้าง holdings เดิม
  - มี report เดิม `data/outputs/portfolio_aom_analysis_report.xlsx` ที่มี 17 holdings ตรงกับช่วงก่อนถูกทับ
- ผลลัพธ์:
  - watchlist-only analysis ส่ง `preserveExistingPortfolioRows: true` ไปที่ snapshot service
  - snapshot service จะใช้ `existing.portfolioRows` เดิมและคง `portfolioReport` เดิมเมื่อ run ไม่มี portfolio file
  - snapshot ปัจจุบันถูกกู้แล้ว: holdings 17 แถว, recommendations 10 แถว, market value 178,365.6 THB
  - สร้าง backup state ชั่วคราวไว้ที่ `data/app-state.before-t116-portfolio-restore.json`
- ทดสอบผ่าน:
  - `node --check src/services/authService.js`
  - `node --check src/routes/analysisRoutes.js`
  - `node --check scripts/statePatchRegression.js`
  - `npm run test:state-patch`
  - `npm run test:frontend-auth`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T116 เสร็จแล้ว: watchlist-only analysis จะไม่ล้าง saved portfolio holdings เดิมอีก
  - ถ้าผู้ใช้เห็น holdings หายอีก ให้ตรวจ audit `analysis.run` ว่า `hasPortfolio` เป็น false หรือ parser ได้ `portfolioRows: 0`
  - ห้ามให้ `portfolioRows: []` จาก run ที่ไม่มี portfolio file ทับ holdings เดิมอีก

### T117 - Return Preserved Portfolio Rows in Analysis Response

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 08:23:03 +07:00
- เสร็จเมื่อ: 2026-06-19 08:24:25 +07:00
- เหตุผล:
  - หลัง T116 snapshot ถูก preserve แล้ว แต่ frontend ยังอาจแสดง `No portfolio holdings loaded yet` ทันทีหลัง watchlist-only run
  - สาเหตุคือ `/api/analysis/run` ยังตอบ `portfolioRows` จากตัวแปร local ซึ่งเป็น `[]` เมื่อไม่มี portfolio file แม้ `customerSnapshot.portfolioRows` จะถูก preserve แล้ว
  - frontend ใช้ `data.portfolioRows` อัปเดต state ทันที จึงเห็น holdings ว่างจนกว่าจะ reload หรือโหลด snapshot ใหม่
- งานที่ต้องทำ:
  - [x] แก้ API response ให้คืน portfolioRows จาก `customerSnapshot.portfolioRows`
  - [x] ถ้า watchlist-only preserve holdings ให้ `portfolioReport`/outputs สะท้อน report เดิมจาก snapshot
  - [x] เพิ่ม regression ใน analysis portfolio flow ว่า watchlist-only response ไม่ส่ง portfolioRows ว่างเมื่อมี snapshot เดิม
  - [x] รันทดสอบ analysis portfolio flow, frontend auth/viewport/web smoke/check
- ผลลัพธ์:
  - `/api/analysis/run` จะตอบ `portfolioRows` จาก snapshot ที่บันทึกจริง ไม่ใช่ตัวแปร local ที่ว่างตอนไม่มี portfolio file
  - ถ้า run แบบ watchlist-only หลังมี saved portfolio แล้ว response จะบอกว่า existing portfolio holdings were kept
  - `portfolioReport` จะคืน metadata ของ report เดิมพร้อม `preserved: true`
  - ตรวจ state จริงแล้ว `aaa@gmail.com` มี 17 holdings และ `sarawut.shi@mahidol.ac.th` มี 27 holdings
- ทดสอบผ่าน:
  - `node --check src/routes/analysisRoutes.js`
  - `node --check scripts/analysisPortfolioFlowRegression.js`
  - `npm run test:analysis-portfolio-flow`
  - `npm run test:frontend-auth`
  - `npm run test:frontend-viewport`
  - `npm run test:web-smoke`
  - `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T117 เสร็จแล้ว: response หลัง watchlist-only run คืน preserved portfolio rows ให้ frontend แล้ว
  - ตรวจ endpoint `/api/analysis/run` ไม่ใช่แค่ saved snapshot
  - ถ้าผู้ใช้ยังเห็นข้อความเดิมหลังแก้ ให้ refresh/restart server เพื่อโหลด JS/API version ใหม่ แล้วตรวจ `/api/customer/portfolio` ของ account นั้น

### T124 - Commit and Push T122-T123 QA and Owner Checklist

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-25 14:17:58 +07:00
- เสร็จเมื่อ: 2026-06-25 14:19:02 +07:00
- เหตุผล:
  - หลัง T122-T123 เสร็จแล้ว ยังมีไฟล์ค้างใน working tree คือ `docs/WEB_APP_USAGE.md` และ `plan.md`
  - ต้อง commit/push เพื่อเก็บงาน fallback QA และ owner manual launch checklist ขึ้น GitHub
  - ต้องตรวจว่าไม่มีไฟล์ portfolio ส่วนตัวถูก stage
- งานที่ต้องทำ:
  - [x] ตรวจ `git status`
  - [x] stage เฉพาะ `docs/WEB_APP_USAGE.md` และ `plan.md`
  - [x] commit ด้วยข้อความที่อธิบายงาน T122-T123
  - [x] push branch `codex-node-web-app-migration` ไป GitHub
  - [x] อัปเดต `plan.md` พร้อมสถานะงานแพ็กขึ้น GitHub
- ผลลัพธ์:
  - ตรวจพบไฟล์ค้างเฉพาะ `docs/WEB_APP_USAGE.md` และ `plan.md`
  - ไม่มีไฟล์ portfolio ส่วนตัวหรือไฟล์ข้อมูล `.xlsx`, `.csv`, `.png` ใน staged list
  - เตรียม commit/push งาน T122-T123 ขึ้น branch `codex-node-web-app-migration`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T124 เสร็จแล้ว: งาน T122-T123 ถูกแพ็กเพื่อ commit/push ขึ้น GitHub
  - ห้าม stage/commit ไฟล์ portfolio ส่วนตัว เช่น `portfolio_eak.xlsx`, `portfolio_aom.xlsx`, `.xlsx`, `.csv`, `.png`

### T123 - Owner Manual Launch Checklist

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-25 14:14:34 +07:00
- เสร็จเมื่อ: 2026-06-25 14:15:40 +07:00
- เหตุผล:
  - หลัง T122 fallback QA ผ่านแล้ว งานถัดไปควรทำคู่มือ owner ใช้งานจริงแบบทีละขั้น
  - ระบบยังไม่มี online payment ดังนั้น owner ต้องรู้ flow manual: สมาชิกสมัคร -> owner เปิดแพ็กเกจ -> user upload/analyze -> ตรวจผล
  - คู่มือต้องช่วยให้ผู้ไม่มีพื้นฐานระบบหลังบ้านเข้าใจว่าต้องกดอะไรและตรวจอะไร
- งานที่ต้องทำ:
  - [x] เพิ่ม checklist สำหรับ owner ใน docs
  - [x] อธิบาย flow สมัครสมาชิกใหม่และ owner assign package
  - [x] อธิบาย flow user upload/analyze และจุดตรวจผลลัพธ์
  - [x] เพิ่ม troubleshooting สำหรับปัญหา upload/analyze ที่เพิ่งแก้
  - [x] รัน docs/frontend regression ที่เกี่ยวข้อง
  - [x] อัปเดต `plan.md`
- ผลลัพธ์:
  - เพิ่ม section `Owner Manual Launch Checklist` ใน `docs/WEB_APP_USAGE.md`
  - คู่มืออธิบาย flow: สมาชิกสมัคร -> owner เข้า Business > Members -> เลือก Starter/Pro -> ตั้ง status/expiry -> Save package -> สมาชิก upload/analyze
  - เพิ่มจุดตรวจหลัง run analysis เช่นข้อความ `Read watchlist file ...`, `Read portfolio file ...`, จำนวน symbol/holding rows
  - เพิ่ม troubleshooting สำหรับ no file selected, portfolio ไม่มี Symbol, ค่าไม่เปลี่ยนหลังเลือกไฟล์อื่น, download/upload ถูกปิด, Pro feature เข้าไม่ได้, และ delete user
  - ตรวจ docs marker ผ่านด้วย `rg`
  - ทดสอบผ่าน: `npm run test:web-smoke`, `npm run test:frontend-auth`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T123 เสร็จแล้ว คู่มือ owner/manual launch checklist อยู่ใน `docs/WEB_APP_USAGE.md`
  - งานถัดไปที่เหมาะสมคือ commit/push หรือถ้ายังไม่ commit ให้ตรวจ `git status` แล้วแพ็กงานล่าสุด T122-T123

### T122 - Browser Visual QA Fallback for Run Analysis and Business

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-25 14:12:57 +07:00
- เสร็จเมื่อ: 2026-06-25 14:14:07 +07:00
- เหตุผล:
  - T121 แนะนำงานถัดไปคือทดสอบด้วย browser จริง/visual QA หน้า Run Analysis และ Business หลัง restart server
  - รอบนี้ `browser` control tool ไม่ถูก expose และไฟล์ skill browser ที่ประกาศไว้หาไม่พบ จึงต้องทำ fallback verification ด้วย local server + automated smoke/regression ก่อน
  - ต้องยืนยันว่า Run Analysis และ Business/Admin UX ใหม่ยังโหลด marker สำคัญครบ
- งานที่ต้องทำ:
  - [x] ตรวจความพร้อมของ browser tooling ใน environment
  - [x] รัน local server หรือ in-process server เพื่อตรวจหน้าเว็บจริงผ่าน HTTP
  - [x] ยืนยัน marker หน้า Run Analysis: locked anonymous, upload summary, loading/progress, file guard
  - [x] ยืนยัน markerหน้า Business: Member Management, Members/Advanced Ops, package save/delete user
  - [x] รัน regression ที่เกี่ยวข้องหลัง restart/fallback QA
  - [x] อัปเดต `plan.md` พร้อมผลและข้อจำกัด
- ผลลัพธ์:
  - ตรวจแล้วไม่มี Playwright/Puppeteer ใน repo และ `browser` control tool ไม่ถูก expose ในรอบนี้
  - อ่าน browser skill จาก path ที่ประกาศไว้ไม่ได้ เพราะไฟล์ไม่อยู่ใน path นั้น
  - จึงทำ fallback QA ด้วย in-process/local HTTP regression แทน screenshot
  - `npm run test:frontend-viewport` ผ่าน และยืนยัน marker: upload loading, upload FormData before disabled, Run Analysis lock, Member Management/Advanced Ops
  - `npm run test:web-smoke` ผ่าน และยืนยัน server/API/static/frontend markers
  - `npm run test:frontend-auth` ผ่าน และยืนยัน owner/customer auth, owner update customer package เป็น Pro, delete user, alert count
  - `npm run test:analysis-portfolio-flow` ผ่าน และยืนยัน authenticated analysis upload, portfolio rows, empty portfolio guard, watchlist-only preserve snapshot
  - `npm run check` ผ่าน
  - ข้อจำกัด: ยังไม่ได้ capture screenshot desktop/mobile เพราะไม่มี browser automation tool ใน environment นี้
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T122 เสร็จแล้วด้วย fallback QA เพราะ browser-control tool ไม่พร้อมใน environment นี้
  - ถ้า browser tool กลับมาใช้ได้ ให้เปิด localhost แล้ว capture หน้า Run Analysis และ Business ทั้ง desktop/mobile
  - งานถัดไปที่เหมาะสมคือเพิ่ม runbook/manual checklist สำหรับ owner: สมัครสมาชิกใหม่ -> owner เปิดแพ็กเกจ -> user upload/analyze -> ตรวจ portfolio/screener/sector/simulation

### T121 - Simplify Owner Admin Package Management UX

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 09:16:18 +07:00
- เสร็จเมื่อ: 2026-06-19 09:20:08 +07:00
- เหตุผล:
  - งานถัดไปหลังยืนยัน upload คือทำหน้า Admin/Business ให้ง่ายขึ้นสำหรับ owner
  - เมนู Business เดิมมีหลายหมวดและข้อมูลหลังบ้านเยอะ ทำให้ผู้ใช้ใหม่ไม่รู้ว่าต้องทำอะไรก่อน
  - ช่วงเปิดตัวควรโฟกัสงานจริง: จัดการสมาชิก, เลือก Starter/Pro, ตั้งวันหมดอายุ, ลบ user
- งานที่ต้องทำ:
  - [x] ปรับ Business default section ให้เป็น Member Management ที่ตรงกับงาน owner
  - [x] ลด/ซ่อน tab ที่ไม่จำเป็นจาก first-view แต่ยังให้เข้าถึง Advanced Ops ได้
  - [x] เพิ่ม summary สำหรับสมาชิก waiting/admin action/active/expired
  - [x] ปรับ copy และ table ใน User Management ให้เข้าใจง่ายขึ้น
  - [x] เพิ่ม regression markers สำหรับ UX ใหม่
  - [x] รันทดสอบและอัปเดต `plan.md`
- ผลลัพธ์:
  - หน้า Business เปลี่ยนจาก `Business Control Center` เป็น `Member Control Center`
  - ลด tab จาก 4 หมวดเหลือ 2 หมวด: `Members` และ `Advanced Ops`
  - default section เป็น `Member Management` สำหรับงาน owner ที่ใช้จริงช่วงเปิดตัว
  - ตาราง default แสดงเฉพาะ `Member`, `Package / Expiry`, `Status`, `Portfolio`, `Actions`
  - ปุ่มหลักใน default table เหลือ `Save package` และ `Delete user` เพื่อลดความสับสน
  - role/workspace/advisor/data health/readiness/audit ยังไม่ถูกลบ แต่ย้ายเข้า `Advanced Ops`
  - เพิ่ม summary: waiting package, active members, expired/check date
  - อัปเดต docs `WEB_APP_USAGE.md` และ regression markers `data-member-management-focus`, `data-business-advanced-ops`, `data-member-management-row`
  - ทดสอบผ่าน: `node --check src/public/app.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run test:frontend-auth`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T121 เสร็จแล้ว หน้า Business/Admin ถูกลดความซับซ้อนเป็น Members/Advanced Ops โดย default ให้ owner จัดการสมาชิกและ package ก่อน
  - ห้ามนำ tab System/Data/Launch กลับมาแสดงพร้อมกันใน first-view โดยไม่มี requirement ใหม่
  - งานถัดไปที่เหมาะสมคือทดสอบด้วย browser จริง/visual QA หน้า Run Analysis และ Business หลัง restart server

### T120 - Real Upload Analyze Flow Verification

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 09:00:35 +07:00
- เสร็จเมื่อ: 2026-06-19 09:15:47 +07:00
- เหตุผล:
  - หลังแก้ T118/T119 ต้องยืนยันด้วย flow ใกล้เคียงผู้ใช้จริงว่าเลือกไฟล์แล้ว backend ได้รับไฟล์จริง
  - ต้องตรวจว่า upload `watchlist` และ `portfolio` แล้ว response มี `uploadSummary`, จำนวน holdings และข้อมูล portfolio ไม่หาย
  - งานนี้เป็นขั้นแรกของงานถัดไปที่แนะนำก่อนปรับ Admin/Package เพิ่ม
- งานที่ต้องทำ:
  - [x] ตรวจ endpoint auth และสร้าง/ใช้ test user สำหรับ authenticated analysis
  - [x] รัน server ชั่วคราวหรือใช้ test harness เพื่อยิง `/api/analysis/run` ด้วยไฟล์จริงใน workspace
  - [x] ตรวจ response ว่ามี `uploadSummary.watchlist`, `uploadSummary.portfolio`, `parsedSymbols`, `holdings`, `portfolioRows`
  - [x] ตรวจว่า flow ไม่มี error `Please choose a watchlist or portfolio file before running analysis.`
  - [x] รัน regression ที่เกี่ยวข้องหลังทดสอบจริง
  - [x] อัปเดต `plan.md` พร้อมผลลัพธ์และคำแนะนำถัดไป
- ผลลัพธ์:
  - ทดสอบผ่าน server in-process ด้วย authenticated test user และ multipart upload จริง
  - ไฟล์ `portfolio_aom.xlsx` ไม่มีใน workspace ปัจจุบันแล้ว จึงใช้ไฟล์จริงที่ยังอยู่คือ `portfolio.xlsx`
  - Upload จริงที่ทดสอบ: `watchlist.txt` + `portfolio.xlsx`
  - Response จาก `/api/analysis/run` ได้ `httpStatus: 200`, `ok: true`
  - `uploadSummary.watchlist.fileName = watchlist.txt`, `parsedSymbols = 909`
  - `uploadSummary.portfolio.fileName = portfolio.xlsx`, `parsedSymbols = 14`, `holdings = 14`
  - `combinedSymbols = 909`, `portfolioRows = 14`, `portfolioReport.count = 14`, `recommendations = 909`
  - ไม่พบ error `Please choose a watchlist or portfolio file before running analysis.`
  - ทดสอบนี้ใช้ mocked Yahoo market response เพื่อ isolate ว่า upload/read file ทำงานจริง โดยไม่พึ่ง network ภายนอก
  - Regression ผ่าน: `npm run test:analysis-portfolio-flow`, `npm run test:frontend-auth`, `npm run test:web-smoke`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T120 เสร็จแล้ว upload/analyze ด้วยไฟล์จริงใน workspace ผ่าน โดยใช้ `uploadSummary` เป็นหลักฐานว่า backend อ่านไฟล์จริง
  - งานถัดไปที่เหมาะสมคือปรับหน้า Admin/Business ให้ใช้ง่ายขึ้นสำหรับ owner โดยโฟกัสเมนูจัดการสมาชิก, package, วันหมดอายุ และลบ user

### T119 - Fix Analyze Button Not Sending Selected Upload Files

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 08:37:13 +07:00
- เสร็จเมื่อ: 2026-06-19 08:39:33 +07:00
- เหตุผล:
  - ผู้ใช้เลือกไฟล์แล้วกด `Analyze my portfolio` แต่ backend ตอบว่า `Please choose a watchlist or portfolio file before running analysis.`
  - อาการนี้แปลว่า request ไปถึง backend แต่ `multer` ไม่ได้รับ field `watchlist` หรือ `portfolio`
  - ต้องตรวจว่า file input ถูก enable หลัง login จริงไหม และ `FormData` ที่ส่งมีไฟล์จริงหรือไม่
- งานที่ต้องทำ:
  - [x] ตรวจ frontend auth lock/unlock ของ file inputs และ submit button
  - [x] ตรวจ `runAnalysis()` ว่าสร้าง `FormData` จาก form ที่มีไฟล์จริงหรือไม่
  - [x] เพิ่ม client-side guard ถ้า input แสดงชื่อไฟล์แต่ `FormData` ไม่มีไฟล์ ให้แจ้ง error ชัดเจนก่อนยิง API
  - [x] ปรับ backend/frontend ถ้าพบว่าการตั้ง `disabled` ทำให้ไฟล์ไม่ถูกส่ง
  - [x] เพิ่ม regression สำหรับ authenticated upload ต้องมี multipart fields `watchlist`/`portfolio`
  - [x] รันทดสอบและอัปเดต `plan.md`
- ผลลัพธ์:
  - พบ root cause จริงใน `runAnalysis()`: โค้ดเรียก `setAnalysisButtonLoading(true)` ก่อน `new FormData(analysisForm)`
  - `setAnalysisButtonLoading(true)` disable file inputs ทันที และ browser จะไม่รวม disabled file inputs ใน `FormData`
  - แก้ให้ตรวจไฟล์และสร้าง `FormData` ก่อน disable input เพื่อให้ request แนบ field `watchlist`/`portfolio` ไปถึง backend
  - เพิ่ม guard `getAnalysisSelectedFiles()` ถ้ายังไม่มีไฟล์ หรือเลือกไฟล์แล้วแต่แนบไม่ได้ จะแจ้ง error ที่ frontend ก่อนยิง API
  - เพิ่ม regression marker `analysis-upload-formdata-before-disable` เพื่อกันไม่ให้บั๊กนี้กลับมา
  - ทดสอบผ่าน: `node --check src/public/app.js`, `node --check scripts/frontendViewportRegression.js`, `node --check scripts/webAppSmokeRegression.js`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run test:analysis-portfolio-flow`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T119 เสร็จแล้ว สาเหตุคือ frontend disable file inputs ก่อนสร้าง `FormData` ทำให้ backend ไม่ได้รับไฟล์
  - ถ้าผู้ใช้ยังเจอปัญหาเดิม ให้ restart server/refresh browser hard reload แล้วตรวจ network request `/api/analysis/run` ว่ามี multipart fields `watchlist` หรือ `portfolio`

### T118 - Prove Upload Files Are Read and Stop Silent Default Fallback

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-19 08:29:32 +07:00
- เสร็จเมื่อ: 2026-06-19 08:33:47 +07:00
- เหตุผล:
  - ผู้ใช้เลือกไฟล์อื่นแล้วผลไม่เปลี่ยน จึงต้องตรวจว่าโปรแกรมอ่านไฟล์จริงหรือไม่
  - พบความเสี่ยงใน `collectSymbolsFromFiles()` เพราะถ้าอ่าน symbol ไม่ได้จะ fallback เป็น DEFAULT_SYMBOLS 10 ตัว ทำให้ดูเหมือนระบบไม่อ่านไฟล์
  - สำหรับ web upload จริงควร fail ชัดเจนเมื่อไฟล์ว่าง/ผิด format ไม่ควรใช้ default โดยเงียบๆ
- งานที่ต้องทำ:
  - [x] แยกผลอ่านไฟล์เป็น watchlistSymbols และ portfolioSymbols พร้อม metadata
  - [x] ปิด default fallback ใน `/api/analysis/run`
  - [x] ถ้า upload portfolio แล้วอ่าน Symbol ไม่ได้ ให้แจ้ง error ชัดเจน
  - [x] ส่ง metadata กลับ frontend ว่า server ได้รับไฟล์อะไร ขนาดเท่าไหร่ อ่านได้กี่ symbols/holdings
  - [x] แสดง metadata นี้ในหน้าเว็บหลัง run เพื่อให้ผู้ใช้เห็นว่าอ่านไฟล์จริง
  - [x] เพิ่ม regression: portfolio A/B ต้องให้ผล symbols/rows ต่างกัน และ empty file ต้อง error ไม่ fallback
  - [x] รันทดสอบและอัปเดต `plan.md`
- ผลลัพธ์:
  - แก้ให้ web analysis ไม่ fallback เป็น `DEFAULT_SYMBOLS` แบบเงียบๆ เมื่อมี upload แต่ไฟล์ว่างหรืออ่าน Symbol ไม่ได้
  - เพิ่ม `collectInputSymbolsFromFiles()` เพื่อแยกจำนวน symbol จาก watchlist และ portfolio ชัดเจน
  - `/api/analysis/run` จะ reject เมื่อไม่เลือกไฟล์เลย หรือ upload portfolio แล้วไม่มีค่า `Symbol`
  - API ส่ง `uploadSummary` กลับมา เช่น `fileName`, `sizeBytes`, `parsedSymbols`, `holdings`, `combinedSymbols`, `sampleSymbols`
  - หน้าเว็บแสดงหลักฐานหลัง run เช่น `Read portfolio file "portfolio_aom.xlsx": 17 symbol(s), 17 holding row(s).`
  - เพิ่ม regression ว่า upload portfolio คนละไฟล์ต้องเปลี่ยนผลลัพธ์ และ portfolio ว่างต้อง error ไม่ใช้ default
  - ทดสอบผ่าน: `node --check src/services/inputService.js`, `node --check src/routes/analysisRoutes.js`, `node --check src/public/app.js`, `node --check scripts/analysisPortfolioFlowRegression.js`, `npm run test:analysis-portfolio-flow`, `npm run test:frontend-viewport`, `npm run test:web-smoke`, `npm run test:frontend-auth`, `npm run check`
- Prompt AI สำหรับทำต่อ:
  - อ่าน `plan.md` ก่อนเสมอ
  - T118 เสร็จแล้ว ถ้าผู้ใช้ยังบอกว่าค่าไม่เปลี่ยน ให้ตรวจ `uploadSummary` ใน response/audit ก่อนว่า backend ได้รับไฟล์อะไรและอ่านได้กี่ symbols/holdings
  - ห้ามให้ web analysis fallback เป็น DEFAULT_SYMBOLS แบบเงียบๆ เมื่อไฟล์ upload อ่านไม่ได้
  - ถ้าต้อง debug เพิ่ม ให้เช็ก network response ของ `/api/analysis/run` และข้อความในหน้าเว็บที่ขึ้นต้น `Read watchlist file`, `Read portfolio file`, `Combined unique symbols`

### T66 - Analysis Run Loading and Progress UX

- สถานะ: Done
- เริ่มเมื่อ: 2026-06-11 09:13:40 +07:00
- เสร็จเมื่อ: 2026-06-11 09:20:13 +07:00
- เหตุผล:
  - ตอนผู้ใช้กดปุ่ม `Analyze my portfolio` แล้วระบบใช้เวลาทำงาน แต่หน้าเว็บยังไม่มี feedback ชัดเจนว่ากำลังประมวลผลอยู่
  - ผู้ใช้ทั่วไปอาจคิดว่าเว็บค้างหรือ error แล้วกดซ้ำ/ปิดหน้า ก่อนที่ analysis จะเสร็จ
- งานที่ต้องทำ:
  - เพิ่ม loading state ทันทีหลัง submit form วิเคราะห์พอร์ต เช่น spinner, progress message หรือ status panel ที่เห็นชัด
  - เปลี่ยนข้อความปุ่มจาก `Analyze my portfolio` เป็นสถานะกำลังทำงาน เช่น `Analyzing...` และ disable ปุ่มชั่วคราวเพื่อกันกดซ้ำ
  - แสดงข้อความอธิบายสำหรับมือใหม่ว่าอาจใช้เวลาหลายวินาทีถึงหลายนาที เพราะต้องดึงข้อมูลหุ้น, คำนวณคะแนน และสร้างรายงานพอร์ต
  - แยกสถานะสำเร็จ/ล้มเหลวให้ชัด เช่น loading, success, error, retry โดยต้อง restore ปุ่มกลับมาเมื่อจบงานหรือเกิด error
  - เพิ่ม accessibility พื้นฐาน เช่น `aria-live` สำหรับ status message และให้ข้อความไม่ล้นบน mobile
  - เพิ่ม regression/frontend marker เพื่อยืนยันว่ามี loading copy, disabled button handling หรือ marker ที่เกี่ยวข้องใน bundle
  - อัปเดตเอกสารและ `plan.md`
  - ทดสอบ syntax, targeted frontend regression, web smoke และ CI quality เท่าที่เหมาะสม

## บันทึกการอัปเดต

- 2026-06-11 19:50:44 +07:00 - เริ่ม T74: เพิ่ม SQLite adapter/database selection foundation เพื่อให้ทดลองระบบด้วย SQLite และ production ใช้ Postgres ได้จาก env โดยไม่กระทบ local_file default
- 2026-06-11 19:59:33 +07:00 - ทำ T74 เสร็จ: เพิ่ม SQLite state repository adapter แบบ opt-in, รองรับ `APP_STATE_REPOSITORY=sqlite` และ `SQLITE_DATABASE_PATH`, เพิ่ม regression read/write/patch, docs และ `npm run ci:quality` ผ่าน
- 2026-06-11 20:07:31 +07:00 - กลับมาทำ T59: retry Browser Visual QA สำหรับ Business dashboard / Launch Evidence Center หลัง T74 เสร็จ โดยยังข้าม T47 GitHub force push ตามคำสั่งผู้ใช้
- 2026-06-11 20:13:37 +07:00 - เลื่อน T59 ต่อ: Browser runtime เชื่อมได้ แต่ localhost/127.0.0.1 ถูกบล็อกด้วย `net::ERR_BLOCKED_BY_CLIENT` แม้ PowerShell health check ผ่าน จึงเพิ่ม T75 เป็นงานถัดไปสำหรับ SQLite trial to Postgres promotion runbook
- 2026-06-11 20:26:37 +07:00 - ทำ T75 เสร็จ: เพิ่ม SQLite -> Postgres promotion service/CLI แบบ dry-run-first, backup/review guard, secret masking, fake-client regression, docs และ `npm run ci:quality` ผ่าน
- 2026-06-12 07:26:50 +07:00 - เริ่ม T76: เพิ่ม Database Mode Advisor ให้ owner/admin เห็นว่า storage mode ปัจจุบันเป็น local_file/sqlite/postgres เหมาะกับ demo/trial/production แค่ไหน และควรทำอะไรต่อ
- 2026-06-12 07:39:16 +07:00 - ทำ T76 เสร็จ: เพิ่ม Database Mode Advisor ใน storage/business metrics payload และ Business dashboard พร้อม markers/regression/docs และ `npm run ci:quality` ผ่าน
- 2026-06-12 07:43:04 +07:00 - เริ่ม T77: เพิ่ม Production Environment Advisor ให้ owner/admin เห็น deployment/env readiness, blockers, warnings, next action และ command ถัดไปจาก Business dashboard โดยไม่เปิดเผย secret
- 2026-06-12 07:51:33 +07:00 - ทำ T77 เสร็จ: เพิ่ม Production Environment Advisor จาก deployment checklist เข้า business metrics และ Business dashboard พร้อม env group, next action, command list, secret masking regression/docs และ `npm run ci:quality` ผ่าน
- 2026-06-12 08:06:56 +07:00 - เริ่ม T78: เพิ่ม Download blank template สำหรับ portfolio Excel และ watchlist text ในหน้า Run Analysis เพื่อให้ผู้ใช้โหลดไปกรอกข้อมูลเอง
- 2026-06-12 08:12:16 +07:00 - ทำ T78 เสร็จ: เพิ่ม blank portfolio/watchlist template download endpoints, ปุ่มในหน้า Upload portfolio, CSS/docs/regression และ `npm run ci:quality` ผ่าน
- 2026-06-12 08:19:03 +07:00 - เริ่ม T79: ปรับ watchlist template ไม่ให้เป็นไฟล์เปล่า โดยใส่คำแนะนำแบบ comment และให้ parser ข้ามบรรทัด `#`
- 2026-06-12 08:23:25 +07:00 - ทำ T79 เสร็จ: เพิ่มคำแนะนำใน watchlist template, parser ignore comment `#`, ปรับ UI/docs/regression และ `npm run ci:quality` ผ่าน
- 2026-06-12 08:31:15 +07:00 - เริ่ม T80: เปลี่ยน public download filename ของ raw CSV จาก `siamchart_raw.csv` เป็น `raw_CSV.csv` เพื่อลดความเข้าใจผิดเรื่องแหล่งข้อมูล
- 2026-06-12 08:34:30 +07:00 - ทำ T80 เสร็จ: เปลี่ยน `/api/analysis/raw` ให้ download เป็น `raw_CSV.csv`, ปรับ UI/docs/regression และ `npm run ci:quality` ผ่าน โดยคง internal file `siamchart_raw.csv` สำหรับ compatibility
- 2026-06-12 08:40:24 +07:00 - เริ่ม T81: sanitize `source.targetFile` ใน live data coverage report ไม่ให้ expose internal path/name `siamchart_raw.csv` ใน JSON ที่ผู้ใช้ดาวน์โหลด
- 2026-06-12 08:46:14 +07:00 - ทำ T81 เสร็จ: sanitize live data coverage report `source.targetFile` ให้แสดง public filename `raw_CSV.csv` ไม่ expose internal path/name `siamchart_raw.csv` พร้อม regression/docs และ `npm run ci:quality` ผ่าน
- 2026-06-12 08:52:14 +07:00 - เพิ่มเติม T81: sanitize `source.fallbackReference` ไม่ให้ expose absolute path, regenerate `data/outputs/live_market_coverage_report.json` จริง และ `npm run ci:quality` ผ่านพร้อม marker `public-reference-path-sanitization`
- 2026-06-12 12:55:52 +07:00 - เริ่ม T82: ตรวจและแก้ปัญหาหน้า Portfolio ไม่แสดงข้อมูลหลังเปลี่ยนชื่อ public filename เป็น `raw_CSV.csv`
- 2026-06-12 13:10:34 +07:00 - ทำ T82 เสร็จ: ป้องกัน zero-row market fetch ทับ raw/recommended/snapshot เดิม, เพิ่ม reference fallback เมื่อ live fetch ล้ม, เพิ่ม Portfolio warning และ regression `test:analysis-portfolio-flow`; `npm run ci:quality` ผ่าน
- 2026-06-12 13:17:04 +07:00 - เริ่ม T83: เพิ่ม zero-market portfolio snapshot recovery tool แบบ dry-run-first เพื่อช่วยซ่อม snapshot ที่ถูก zero-row market fetch ทับก่อน T82
- 2026-06-12 14:11:23 +07:00 - ทำ T83 เสร็จ: เพิ่ม recovery service/CLI `portfolio:recover-zero-market`, regression `test:portfolio-recovery`, แก้ injected-state confirm ไม่ให้แตะ demo state, กู้ `data/app-state.json` จาก clone เก่าและ merge audit events ปัจจุบัน, dry-run พบไม่มี zero-market snapshot ค้าง, `npm run ci:quality` ผ่าน
- 2026-06-12 22:22:42 +07:00 - เริ่ม T88: เพิ่ม System Admin/User Management surface ให้หน้า Business เห็นชัดว่าจัดการ user, workspace, advisor assignment และ system readiness ได้จากจุดไหน
- 2026-06-12 22:27:36 +07:00 - ทำ T88 เสร็จ: เพิ่ม System Admin panel, User Management panel, admin action cards, responsive CSS, docs และ regression markers; `npm run check`, `npm run test:frontend-viewport`, `npm run test:web-smoke` ผ่าน
- 2026-06-12 22:31:31 +07:00 - เริ่ม T89: commit/push งาน System Admin/User Management surface หลัง T88 เสร็จและ targeted tests ผ่าน
- 2026-06-12 22:33:00 +07:00 - ทำ T89 เสร็จ: commit `5bfc3e9 Add system admin management surface` และ push ไป `origin/codex-node-web-app-migration` สำเร็จ ยังไม่ได้สร้าง PR/merge เข้า `main`
- 2026-06-12 22:39:14 +07:00 - เริ่ม T90: กู้การเข้าใช้งาน owner ใน local state เพราะ password เดิมอ่านกลับไม่ได้จาก PBKDF2 hash
- 2026-06-12 22:39:44 +07:00 - ทำ T90 เสร็จ: สำรอง `data/app-state.json`, reset owner local เป็นรหัสชั่วคราวที่แจ้งใน chat เท่านั้น และยืนยันว่า state/backup ถูก ignore ไม่เข้า Git
- 2026-06-13 07:12:06 +07:00 - เริ่ม T92: เพิ่ม click filter ให้ `Action mix` และ `Score distribution` ในหน้า Portfolio เพื่อกรอง Recommended actions โดยไม่เปลี่ยนสูตรวิเคราะห์
- 2026-06-13 07:14:55 +07:00 - ทำ T92 เสร็จ: chart bars ใน Portfolio กรอง Recommended actions ได้ตาม action group และ score band พร้อม selected state, reset behavior, docs/regression markers และ targeted tests ผ่าน
- 2026-06-13 07:21:50 +07:00 - เริ่ม T93: เพิ่ม click filter ให้ `Sector exposure` ในหน้า Portfolio เพื่อกรอง Recommended actions ตาม sector ที่เลือก
- 2026-06-13 07:23:15 +07:00 - ทำ T93 เสร็จ: Sector exposure bar กรอง Recommended actions ได้, reset/manual filter ล้าง selected state ถูกต้อง, docs/regression markers และ targeted tests ผ่าน
- 2026-06-13 07:27:30 +07:00 - commit/push T93 สำเร็จ: `b4fa2e5 Add portfolio sector visual filter`
- 2026-06-18 07:55:48 +07:00 - เริ่ม T94: เพิ่ม interaction ให้คลิกหุ้นในกราฟหน้า Screener/Sector แล้ว highlight แถวในตารางข้อมูล
- 2026-06-18 07:59:10 +07:00 - ทำ T94 เสร็จ: กราฟหุ้นใน Screener/Sector focus แถวตารางได้, เพิ่ม keyboard support, CSS highlight, docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 08:07:31 +07:00 - เริ่ม T95: ทำให้หุ้นใน `Top ideas` หน้า Screener เด่นด้วยสีเขียวทั้ง bar และจุดใน scatter
- 2026-06-18 08:10:03 +07:00 - ทำ T95 เสร็จ: Top ideas bar และจุด scatter ของหุ้นที่ recommend เป็นสีเขียว, docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 08:15:13 +07:00 - เริ่ม T96: จำกัดสีเขียวของ Top ideas ให้แสดงเฉพาะจุดวงกลมในกราฟ `Quality vs reward`
- 2026-06-18 08:16:59 +07:00 - ทำ T96 เสร็จ: `Top ideas` bar กลับเป็นสีเดิม, สีเขียวเหลือเฉพาะ scatter point ของหุ้นที่อยู่ใน Top ideas, docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 08:27:10 +07:00 - เริ่ม T97: เพิ่ม Simulation แบบแบ่งซื้อหลายไม้เพื่อเทียบกับซื้อครั้งเดียว
- 2026-06-18 08:31:09 +07:00 - ทำ T97 เสร็จ: เพิ่ม Buy Mode แบบ Lump Sum/Split Buy, จำนวนไม้, trading-day interval, metrics/trade history เพิ่มเติม, docs/regression และ targeted tests ผ่าน
- 2026-06-18 08:39:27 +07:00 - commit/push T94-T97 สำเร็จ: `31fcdb8 Improve chart focus and split-buy simulation`
- 2026-06-18 08:43:00 +07:00 - เริ่ม T98: ยกระดับหน้า Sector Analysis ให้ต่างจาก Screener และคุ้มกับแพ็กเกจ Pro
- 2026-06-18 08:46:33 +07:00 - ทำ T98 เสร็จ: เพิ่ม Pro Sector Intelligence, Sector Score Ranking, Rotation Signal, Portfolio Sector Risk, docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 08:54:09 +07:00 - เริ่ม T99: วิเคราะห์และปรับหน้า Sector หลังพบว่า Pro Sector Intelligence ใช้งานยากสำหรับมือใหม่
- 2026-06-18 08:57:14 +07:00 - ทำ T99 เสร็จ: เพิ่ม beginner summary/next step, ลด panel ที่แสดงพร้อมกัน, ซ่อนตารางขั้นสูงใน details, ปรับ label เป็นภาษาง่าย และ targeted tests ผ่าน
- 2026-06-18 09:22:14 +07:00 - เริ่ม T100: เพิ่ม hint ใน header ตารางเพื่ออธิบายความหมาย ค่าแนะนำ และข้อควรระวังของคอลัมน์การลงทุน
- 2026-06-18 09:32:39 +07:00 - ทำ T100 เสร็จ: เพิ่ม table header tooltip สำหรับคอลัมน์สำคัญ, CSS/docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 09:51:54 +07:00 - เริ่ม T101: แก้ error `tableColumnTips` ถูกเรียกก่อน initialization
- 2026-06-18 09:53:21 +07:00 - ทำ T101 เสร็จ: ย้าย `tableColumnTips` ไปก่อน `await initialize()`, เพิ่ม regression initialization order และ targeted tests ผ่าน
- 2026-06-18 09:58:42 +07:00 - เริ่ม T102: ตรวจ `Other` ใน Portfolio Sector exposure และแก้ UX ที่รวม sector ที่เหลือจนผู้ใช้เข้าใจผิด
- 2026-06-18 10:00:57 +07:00 - ทำ T102 เสร็จ: ยืนยัน `Other` เดิมเป็นผลรวม sector ที่เหลือ, ปรับ Sector exposure ให้แสดง sector จริงทั้งหมด, เพิ่ม docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 10:34:26 +07:00 - เริ่ม T103: เพิ่มกราฟ Simulation แบบ Python version เพื่อเทียบ Strategy กับ Buy & Hold
- 2026-06-18 10:37:13 +07:00 - ทำ T103 เสร็จ: เพิ่ม SVG chart Portfolio Growth Strategy vs Buy & Hold, legend, winner card, วิธีอ่านกราฟ, docs/regression markers และ targeted tests ผ่าน
- 2026-06-18 13:27:57 +07:00 - เริ่ม T104: ปรับ launch scope ให้ขายจริงเฉพาะ Starter/Pro ก่อน และตรวจ package validity ให้เหมาะกับการใช้งานจริง
- 2026-06-18 13:32:52 +07:00 - ทำ T104 เสร็จ: public API/pricing/checkout เปิดเฉพาะ Starter/Pro, Advisor เป็น coming soon/manual contact, เพิ่ม expiry check จาก `trialEndsAt`/`renewsAt`, docs/regression และ targeted tests ผ่าน
- 2026-06-18 13:37:03 +07:00 - เริ่ม T105: เพิ่ม manual subscription admin controls เพื่อให้ owner/admin จัดการแพ็กเกจได้แม้ยังไม่มี online payment เต็มรูปแบบ
- 2026-06-18 13:43:27 +07:00 - ทำ T105 เสร็จ: เพิ่ม service/API/UI สำหรับ manual package update Starter/Pro, status, expiry date, audit event `team.subscription_update`, docs/regression และ targeted tests ผ่าน
- 2026-06-18 13:50:24 +07:00 - เริ่ม T106: ทำให้ Guide profile มีผลที่ผู้ใช้เห็นจริงใน Portfolio/Screener/Simulation
- 2026-06-18 13:55:53 +07:00 - ทำ T106 เสร็จ: Guide แสดงผลกระทบชัดเจน, Portfolio มี personalized guidance, Screener ใช้ default filter จาก profile, Simulation ตั้งเงิน/ไม้จาก budget/risk/horizon, docs/regression และ targeted tests ผ่าน
- 2026-06-18 14:07:15 +07:00 - เริ่ม T107: ซ่อน Guide จาก launch UI และลดความรกในหน้า Portfolio ตาม feedback ผู้ใช้
- 2026-06-18 14:16:49 +07:00 - ทำ T107 เสร็จ: ถอด Guide navigation/frontend route/personalization, คืน Screener/Simulation default แบบชัดเจน, ลด Portfolio เหลือ quick guidance 3 ช่อง, ลบ profile completion UI ที่สับสน, docs/regression และ targeted tests ผ่าน
- 2026-06-18 18:51:02 +07:00 - เริ่ม T108: ซ่อน Approvals จาก Starter/Pro launch UI เพราะ Advisor workflow ยัง defer และทำให้ผู้ใช้มือใหม่สับสน
- 2026-06-18 18:55:23 +07:00 - ทำ T108 เสร็จ: ถอด Approvals navigation/account text/Business approval panel, หยุด frontend load approval data ที่ไม่จำเป็น, docs/regression guard และ targeted tests ผ่าน โดยคง backend approval foundation ไว้สำหรับ Advisor phase
- 2026-06-18 19:02:33 +07:00 - เริ่ม T109: แก้ layout hero/snapshot ด้านบนที่ยืดยาวผิดปกติเมื่อเข้า Simulation
- 2026-06-18 19:03:20 +07:00 - ทำ T109 เสร็จ: ปรับ workspace/hero/snapshot CSS ให้ไม่ stretch row ตามความสูงคอลัมน์ซ้าย, เพิ่ม viewport regression guard และ targeted tests ผ่าน
- 2026-06-18 19:27:44 +07:00 - เริ่ม T110: ปรับ flow สมัครสมาชิกเป็น manual admin package assignment เพราะช่วงแรกยังไม่รับชำระผ่านเว็บ
- 2026-06-18 19:32:31 +07:00 - ทำ T110 เสร็จ: สมาชิกใหม่รอ admin package, owner คนแรกยังเข้า Business ได้, หน้า plan ไม่ checkout, ปิด checkout/payment-session route ชั่วคราว, เพิ่ม admin package guide ใน User Management, docs/regression และ targeted tests ผ่าน
- 2026-06-18 20:05:52 +07:00 - เริ่ม T111: ลดความรกหน้า Business เพราะ admin มือใหม่เห็น panel/เมนูเยอะเกินไปและไม่รู้ต้องเริ่มตรงไหน
- 2026-06-18 20:09:37 +07:00 - ทำ T111 เสร็จ: เปลี่ยน Business เป็น admin cockpit แบ่งหมวด Package/System/Data Health/Go-live, default เข้า Package Management, ลด KPI ด้านบน และ targeted tests ผ่าน
- 2026-06-18 20:26:13 +07:00 - เริ่ม T112: ตรวจสอบการทำงานของ admin package management ว่า owner/admin กำหนด package ได้และ customer ถูกกันสิทธิ์
- 2026-06-18 20:29:04 +07:00 - ทำ T112 เสร็จ: เพิ่ม API-level regression สำหรับ admin package update, แก้ tenant regression ให้เปิด package ก่อน save portfolio ตาม flow ใหม่ และทดสอบ subscription/tenant/frontend/web/check ผ่าน
- 2026-06-11 14:30:04 +07:00 - เริ่ม T73: แก้ bug `recommendedActionSortFields` ยังไม่ initialize ตอนหน้า Portfolio render หลัง analysis/saved portfolio
- 2026-06-11 14:33:44 +07:00 - ทำ T73 เสร็จ: ย้าย `recommendedActionFields` และ `recommendedActionSortFields` ไปก่อน `await initialize()`, เพิ่ม regression ตรวจ initialization order และ `npm run ci:quality` ผ่าน
- 2026-06-11 14:15:49 +07:00 - เริ่ม T72: เพิ่ม filter, field picker และ order by ให้ตาราง Recommended actions ในหน้า Portfolio โดยไม่เปลี่ยนสูตรวิเคราะห์เดิม
- 2026-06-11 14:25:08 +07:00 - ทำ T72 เสร็จ: เพิ่ม controls ให้ Recommended actions กรอง Symbol/Action/Sector/Trend/Min Score, เลือก Order by/direction, เลือก field ที่แสดง, reset view, responsive CSS, regression markers, docs และ `npm run ci:quality` ผ่าน
- 2026-06-11 13:53:18 +07:00 - เริ่ม T71: เพิ่ม Screener tooltip และคำแนะนำค่า filter สำหรับผู้ใช้มือใหม่ โดยไม่เปลี่ยนสูตรวิเคราะห์เดิม
- 2026-06-11 14:04:21 +07:00 - ทำ T71 เสร็จ: เพิ่ม beginner guide และ tooltip ในหน้า Screener สำหรับ Score/RRR/D/E/Sector/Trend, เพิ่ม CSS responsive/accessibility, regression markers, docs และ `npm run ci:quality` ผ่าน; Browser visual QA ยังไม่มี tool callable ในรอบนี้
- 2026-06-02 20:55:35 +07:00 - สร้าง `plan.md` และกำหนด Task list สำหรับ migration เป็น Node.js Web App
- 2026-06-02 20:56:50 +07:00 - ทำ T02 เสร็จ: เพิ่ม behavior contract ของระบบเดิมเพื่อใช้เป็นเกณฑ์เทียบตอนย้ายเป็น Node.js
- 2026-06-02 20:58:19 +07:00 - ทำ T03 เสร็จ: เลือกสถาปัตยกรรม Node.js Web App และ library หลัก
- 2026-06-02 21:00:37 +07:00 - ทำ T04 เสร็จ: สร้างโครง Node.js Web App, static frontend, service stubs และ data folders
- 2026-06-02 21:13:19 +07:00 - ทำ T05 เสร็จ: เพิ่มระบบอ่าน input, fetch Yahoo chart data, สร้าง raw CSV และ route upload ขั้นแรก
- 2026-06-02 21:18:39 +07:00 - ทำ T06 เสร็จ: Port สูตรวิเคราะห์หุ้นและสร้าง recommended stocks output
- 2026-06-02 21:32:15 +07:00 - ทำ T07 เสร็จ: Port วิเคราะห์พอร์ตและสร้าง Excel report ด้วย `exceljs`
- 2026-06-02 21:35:08 +07:00 - ทำ T08 เสร็จ: ขยาย Web UI ให้ upload/run analysis และ render Portfolio, Screener, Sector views จากข้อมูลจริง
- 2026-06-02 21:37:49 +07:00 - ทำ T09 เสร็จ: Port strategy simulation และเพิ่ม API/UI สำหรับ backtest
- 2026-06-03 14:25:45 +07:00 - ทำ T10 เสร็จ: เพิ่มสคริปต์เทียบผลกับ Python เดิม และยืนยันสูตร/report ตรงกัน 0 mismatch
- 2026-06-03 14:27:54 +07:00 - ทำ T11 เสร็จ: เพิ่มคู่มือใช้งาน Node.js Web App ใน README และ `docs/WEB_APP_USAGE.md`
- 2026-06-03 14:30:00 +07:00 - เริ่ม T12: แก้ Sector Analysis ที่ยังทำงานไม่ถูกต้อง
- 2026-06-03 15:26:18 +07:00 - ทำ T12 เสร็จ: เพิ่ม reference fallback สำหรับ sector/fundamental และปรับ UI Sector Analysis ให้เลือก sector ได้
- 2026-06-03 15:35:00 +07:00 - เริ่ม T13: ยกระดับ Web App เป็น SaaS เชิงพาณิชย์พร้อม login/subscription และ redesign UI
- 2026-06-03 15:43:10 +07:00 - ทำ T13 เสร็จ: เพิ่ม auth/subscription/customer portfolio snapshot และ redesign UI ธีมดำ-แดงแบบ professional SaaS
- 2026-06-03 15:46:11 +07:00 - เริ่ม T14: เพิ่ม onboarding สำหรับผู้เริ่มลงทุนและ business dashboard สำหรับ SaaS owner
- 2026-06-03 15:55:08 +07:00 - ทำ T14 เสร็จ: เพิ่ม Guide profile, owner-only Business dashboard, guidance cards และอัปเดตเอกสาร
- 2026-06-03 16:04:13 +07:00 - ตรวจ smoke test ผ่าน port ชั่วคราว 3055: health/register/profile/static page/admin 403 ทำงานถูกต้อง
- 2026-06-03 16:09:08 +07:00 - เริ่ม T15: เพิ่ม visual intelligence dashboard แบบไม่เพิ่ม dependency
- 2026-06-03 16:14:15 +07:00 - ทำ T15 เสร็จ: เพิ่ม Portfolio/Screener/Sector/Business visuals และทดสอบ regression/smoke test ผ่าน
- 2026-06-03 16:17:22 +07:00 - เริ่ม T16: เพิ่ม subscription checkout และ billing prototype สำหรับ SaaS รายเดือน
- 2026-06-03 16:22:53 +07:00 - ทำ T16 เสร็จ: เพิ่ม local checkout, billing events, customer billing history และ revenue metrics
- 2026-06-03 16:31:14 +07:00 - เริ่ม T17: เพิ่ม role/permission และ advisor workspace prototype
- 2026-06-03 16:38:35 +07:00 - ทำ T17 เสร็จ: เพิ่ม role policy, team APIs, advisor assignment และ Team/Client workspace
- 2026-06-03 16:43:37 +07:00 - เริ่ม T18: เพิ่ม audit log และ activity timeline prototype สำหรับ SaaS readiness
- 2026-06-03 16:52:26 +07:00 - ทำ T18 เสร็จ: เพิ่ม audit event store, `/api/audit/events`, Recent activity UI, activity metrics และเอกสารใช้งาน
- 2026-06-03 20:18:53 +07:00 - เริ่ม T19: เพิ่ม organization/workspace model prototype สำหรับ SaaS readiness
- 2026-06-03 20:29:18 +07:00 - ทำ T19 เสร็จ: เพิ่ม workspace model, APIs, Business UI, workspace metrics และ audit events สำหรับ workspace actions
- 2026-06-03 20:32:08 +07:00 - เริ่ม T20: เพิ่ม payment gateway และ webhook prototype สำหรับ subscription SaaS
- 2026-06-03 20:40:17 +07:00 - ทำ T20 เสร็จ: เพิ่ม payment sessions, webhook simulation, duplicate reconciliation, payment metrics และ payment UI
- 2026-06-03 20:45:05 +07:00 - เริ่ม T21: harden tenant isolation และเพิ่ม production readiness summary สำหรับระบบ subscription SaaS
- 2026-06-03 20:55:48 +07:00 - ทำ T21 เสร็จ: เพิ่ม tenant metadata, `/api/tenant/scope`, UI Tenant isolation summary และ production-readiness notes
- 2026-06-03 21:07:11 +07:00 - เริ่ม T22: เพิ่ม payment webhook signature verification สำหรับ production readiness
- 2026-06-03 21:15:08 +07:00 - ทำ T22 เสร็จ: เพิ่ม signed payment webhook endpoint, HMAC verification, rejected webhook log และ security metrics
- 2026-06-04 07:32:16 +07:00 - เริ่ม T23: เพิ่ม immutable audit trail และ integrity hash prototype สำหรับ SaaS readiness
- 2026-06-04 07:40:28 +07:00 - ทำ T23 เสร็จ: เพิ่ม audit hash chain, integrity API, Business metrics/UI และ tamper-detection tests
- 2026-06-04 07:50:19 +07:00 - เริ่ม T24: เพิ่ม automated tenant access regression tests สำหรับ role/workspace isolation
- 2026-06-04 07:55:43 +07:00 - ทำ T24 เสร็จ: เพิ่ม tenant access regression script, npm test scripts และเอกสารตรวจ role/workspace isolation
- 2026-06-04 08:01:01 +07:00 - เริ่ม T25: เพิ่ม subscription lifecycle regression tests สำหรับ payment/webhook/billing flow
- 2026-06-04 08:05:08 +07:00 - ทำ T25 เสร็จ: เพิ่ม subscription lifecycle regression script, npm test script, docs และแก้ rejected webhook metadata gap
- 2026-06-04 08:14:42 +07:00 - เริ่ม T26: เพิ่ม CI quality gate สำหรับ SaaS regression และ audit high severity
- 2026-06-04 08:16:58 +07:00 - ทำ T26 เสร็จ: เพิ่ม GitHub Actions quality gate, `ci:quality` script และเอกสาร CI regression
- 2026-06-04 08:20:43 +07:00 - เริ่ม T27: เพิ่ม production database migration foundation และ storage readiness report
- 2026-06-04 08:26:43 +07:00 - ทำ T27 เสร็จ: เพิ่ม state schema manifest, storage readiness API/UI, regression test และเอกสาร database migration foundation
- 2026-06-04 08:43:42 +07:00 - เริ่ม T28: เพิ่ม production database repository layer สำหรับแยก persistence ออกจาก auth service
- 2026-06-04 08:47:03 +07:00 - ทำ T28 เสร็จ: เพิ่ม state repository layer, repository metadata, regression test และผูกเข้า CI quality gate
- 2026-06-04 08:56:07 +07:00 - เริ่ม T29: เพิ่ม external append-only audit trail prototype และ audit mirror readiness
- 2026-06-04 09:00:19 +07:00 - ทำ T29 เสร็จ: เพิ่ม append-only audit trail mirror, API/UI metrics, regression test และเอกสาร audit mirror
- 2026-06-04 09:13:33 +07:00 - เริ่ม T30: เพิ่ม approval workflow prototype สำหรับ SaaS advisor/customer
- 2026-06-04 09:31:07 +07:00 - ทำ T30 เสร็จ: เพิ่ม approval workflow, API/UI, tenant-scoped schema, regression test และผูกเข้า CI quality gate
- 2026-06-04 09:33:25 +07:00 - เริ่ม T31: เพิ่ม chart interaction และ Screener drilldown โดยไม่เปลี่ยนผลวิเคราะห์เดิม
- 2026-06-04 09:36:48 +07:00 - ทำ T31 เสร็จ: เพิ่ม sector/trend filter และคลิก Sector count bar เพื่อ drilldown หน้า Screener
- 2026-06-04 13:27:04 +07:00 - เริ่ม T32: เพิ่ม external immutable audit provider integration แบบ HTTP webhook
- 2026-06-04 13:35:02 +07:00 - ทำ T32 เสร็จ: เพิ่ม external audit HTTP webhook provider, HMAC signature, receipt readiness และ regression test
- 2026-06-04 13:36:35 +07:00 - เริ่ม T33: เพิ่ม dependency risk gate hardening สำหรับ npm audit advisories
- 2026-06-04 13:41:35 +07:00 - ทำ T33 เสร็จ: เพิ่ม dependency risk gate, accepted risk register และผูกเข้า CI quality
- 2026-06-04 13:47:43 +07:00 - เริ่ม T34: เพิ่ม Web App smoke verification harness สำหรับตรวจเว็บโดยไม่ต้องเปิด server background
- 2026-06-04 13:53:15 +07:00 - ทำ T34 เสร็จ: เพิ่ม server factory, automated web smoke regression, npm script, CI docs และ quality gate ผ่าน
- 2026-06-04 13:56:29 +07:00 - เริ่ม T35: เพิ่ม production database adapter implementation สำหรับ Postgres โดยคง local file เป็น default
- 2026-06-04 14:06:13 +07:00 - ทำ T35 เสร็จ: เพิ่ม Postgres state adapter, bootstrap SQL, fake-client regression, npm script, docs และ CI quality ผ่าน
- 2026-06-04 14:26:19 +07:00 - เริ่ม T36: เพิ่ม real payment provider integration แบบ Stripe Checkout opt-in โดยคง local gateway เป็น default
- 2026-06-04 14:36:43 +07:00 - ทำ T36 เสร็จ: เพิ่ม Stripe Checkout provider, raw-body provider webhook, payment provider regression, docs และ CI quality ผ่าน
- 2026-06-04 15:02:59 +07:00 - เริ่ม T37: เพิ่ม one-time importer จาก `app-state.json` เข้า Postgres พร้อม dry-run และ regression test
- 2026-06-04 15:12:48 +07:00 - ทำ T37 เสร็จ: เพิ่ม one-time Postgres importer, dry-run readiness guard, fake-client regression, docs และ CI quality ผ่าน
- 2026-06-04 15:15:28 +07:00 - อัปเดต prompt ส่งต่อหลัง T37 ให้ระบุว่างาน importer เสร็จแล้วและปรับงานต่อยอดถัดไป
- 2026-06-04 15:16:36 +07:00 - เริ่ม T38: เพิ่ม package entitlement enforcement สำหรับ Starter/Pro/Advisor
- 2026-06-04 15:41:09 +07:00 - ทำ T38 เสร็จ: เพิ่ม package entitlement policy/gate, upgrade card UI, regression test, docs และ CI quality ผ่าน
- 2026-06-04 19:58:33 +07:00 - เริ่ม T39: เพิ่ม backup/restore drill สำหรับ local state และ production readiness
- 2026-06-04 20:07:40 +07:00 - ทำ T39 เสร็จ: เพิ่ม backup/restore drill, manifest/checksum, dry-run/confirm guard, regression test, docs และ CI quality ผ่าน
- 2026-06-04 20:10:57 +07:00 - เริ่ม T40: เพิ่ม query-level tenant enforcement สำหรับ Postgres production
- 2026-06-04 20:18:25 +07:00 - ทำ T40 เสร็จ: เพิ่ม Postgres scoped read helper, SQL tenant WHERE guard, regression test, docs และ CI quality ผ่าน
- 2026-06-04 20:22:21 +07:00 - เริ่ม T41: เพิ่ม observability และ alerting foundation สำหรับ subscription SaaS
- 2026-06-04 20:33:40 +07:00 - ทำ T41 เสร็จ: เพิ่ม operational readiness API, alert rules, Business dashboard alert cards, regression test, docs และ CI quality ผ่าน
- 2026-06-04 21:00:58 +07:00 - เริ่ม T42: เพิ่ม production Postgres backup runbook และ snapshot drill foundation
- 2026-06-04 21:08:17 +07:00 - ทำ T42 เสร็จ: เพิ่ม Postgres backup runbook generator, CLI, secret masking, regression test, docs และ CI quality ผ่าน
- 2026-06-04 21:14:16 +07:00 - เริ่ม T43: เพิ่ม production deployment checklist และ environment validation
- 2026-06-04 21:24:27 +07:00 - ทำ T43 เสร็จ: เพิ่ม production deployment checklist dry-run, CLI strict mode, secret masking, regression test, docs และ CI quality ผ่าน
- 2026-06-05 07:34:39 +07:00 - เริ่ม T44: เพิ่ม operational alert delivery webhook foundation แบบ opt-in
- 2026-06-05 07:44:58 +07:00 - ทำ T44 เสร็จ: เพิ่ม operational alert delivery webhook, HMAC signature, dry-run/required mode, regression test, docs และ CI quality ผ่าน
- 2026-06-05 07:51:29 +07:00 - เริ่ม T45: ทำ in-app browser screenshot QA และ visual polish
- 2026-06-05 08:06:55 +07:00 - ทำ T45 เสร็จ: เพิ่ม frontend viewport/auth regression, mobile responsive polish, docs และ CI quality ผ่าน โดยบันทึกข้อจำกัดว่า in-app browser runtime ยังถูก Windows sandbox บล็อก
- 2026-06-05 08:17:58 +07:00 - เริ่ม T46: เตรียม commit/push แบบไม่ส่งไฟล์ portfolio ส่วนตัวขึ้น GitHub
- 2026-06-05 08:30:59 +07:00 - T46 ทำส่วน commit สำเร็จใน clone ชั่วคราว แต่ push ไป GitHub ถูก network/sandbox บล็อก จึงต้อง push ต่อจากเครื่องผู้ใช้หรือ environment ที่ออก GitHub ได้
- 2026-06-05 08:42:14 +07:00 - ตรวจสาเหตุ push เพิ่ม: GitHub ตอบ HTTP 401 และ Git เรียก Credential Manager แต่ sandbox user ไม่มี GitHub credential; ไม่พบ `gh` CLI สำหรับ auth สำรอง
- 2026-06-05 08:46:18 +07:00 - ทำ T46 เสร็จ: ผู้ใช้เพิ่ม safe.directory แล้ว push commit `0a8096c` ไป GitHub สำเร็จบน branch `codex-node-web-app-migration`
- 2026-06-05 08:48:51 +07:00 - เริ่ม T47: เตรียมลบไฟล์ portfolio ส่วนตัวออกจาก Git history ของ branch ปัจจุบันแบบทำใน clone ชั่วคราวก่อน
- 2026-06-05 08:53:28 +07:00 - T47 rewrite history ใน clone ชั่วคราวสำเร็จ และตรวจ `git log --all -- portfolio_...` แล้วไม่พบไฟล์ส่วนตัว เหลือให้ผู้ใช้รัน force push แบบมี lease จาก PowerShell ปกติ
- 2026-06-05 20:53:36 +07:00 - ปรับคำสั่ง T47: short hash `0a8096c` parse ไม่ได้หลังล้าง object เก่าใน clone ที่ rewrite แล้ว จึงเปลี่ยนเป็นดึง full remote hash ด้วย `git ls-remote` ก่อน push แบบมี lease
- 2026-06-05 20:57:21 +07:00 - ผู้ใช้พบ `git-remote-https.exe` crash ระหว่างติดต่อ GitHub ผ่าน HTTPS; clone ชั่วคราวยังพร้อม push อยู่ จึงแนะนำ fallback เป็น SSH remote หรือซ่อม/อัปเดต Git for Windows ก่อน push
- 2026-06-05 20:59:57 +07:00 - ตรวจ SSH แล้ว host GitHub ถูกเพิ่มใน known_hosts สำเร็จ แต่ authentication ยัง fail ด้วย `Permission denied (publickey)` แปลว่ายังไม่มี SSH key ที่ GitHub ยอมรับ ต้องเพิ่ม public key เข้า GitHub หรือซ่อม HTTPS ก่อน push
- 2026-06-05 21:06:36 +07:00 - ผู้ใช้ให้ข้ามเรื่อง GitHub ก่อน จึงเลื่อน T47 ไว้และเริ่ม T48: เพิ่ม tenant-scoped read adoption สำหรับ customer/workspace APIs
- 2026-06-05 21:14:46 +07:00 - ทำ T48 เสร็จ: เพิ่ม `tenantScopeService`, ย้าย customer/workspace read APIs สำคัญไปใช้ scoped read wrapper, เพิ่ม `test:scoped-read`, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-05 21:39:23 +07:00 - เริ่ม T49: เพิ่ม narrower state write model foundation ด้วย state patch helper โดยไม่แตะไฟล์ portfolio ส่วนตัวที่มีสถานะ modified
- 2026-06-05 21:47:42 +07:00 - ทำ T49 เสร็จ: เพิ่ม `statePatchService`, `patchAppState`, `test:state-patch`, เอกสาร state patch write foundation และ `npm run ci:quality` ผ่าน
- 2026-06-05 21:49:59 +07:00 - เริ่ม T50: ย้าย critical SaaS write flows ชุดแรกไปใช้ `patchAppState()` โดยเลือก flow ความเสี่ยงต่ำก่อน เช่น investor profile, payment session creation และ approval request creation
- 2026-06-05 21:57:06 +07:00 - ทำ T50 เสร็จ: ย้าย investor profile save, payment session creation และ approval request creation ไปใช้ `patchAppState()` พร้อม paired audit append, เพิ่ม regression ใน `test:state-patch`, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-06 20:29:41 +07:00 - เริ่ม T51: ขยาย patch write adoption ไปยัง payment webhook/billing reconciliation และ approval decision flows โดยต้องรักษา duplicate handling, idempotency และ audit hash chain
- 2026-06-06 20:37:53 +07:00 - ทำ T51 เสร็จ: ย้าย payment webhook success/failure, rejected webhook logging, billing activation และ approval decisions ไปใช้ patch writes, เพิ่ม already-paid webhook regression, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-06 20:41:10 +07:00 - เริ่ม T52: ลด whole-state writes ใน workspace/team/admin flows โดยเริ่มจาก organization, role update, advisor assignment และ member move ที่มี regression ครอบอยู่แล้ว
- 2026-06-06 20:47:09 +07:00 - ทำ T52 เสร็จ: ย้าย organization create/update, member move, role update และ advisor assignment/unassignment ไปใช้ patch writes, เพิ่ม tenant access regression สำหรับ organization create/update, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-06 21:03:10 +07:00 - เริ่ม T53: ลด whole-state writes ใน auth/session flows เช่น create session, logout session, expired session cleanup และ standalone audit event utility
- 2026-06-06 21:13:42 +07:00 - ทำ T53 เสร็จ: ย้าย session create/logout/expired cleanup และ `recordAuditEvent()` ไปใช้ patch writes, เพิ่ม state patch และ frontend auth regression coverage, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-06 21:18:13 +07:00 - เริ่ม T54: ลด whole-state writes ใน account และ portfolio snapshot flows เช่น register, login และ snapshot save
- 2026-06-06 21:26:28 +07:00 - ทำ T54 เสร็จ: ย้าย `createUser()`, `loginUser()` และ `saveCustomerPortfolioSnapshot()` ไปใช้ patch writes, เพิ่ม account/snapshot regression coverage, อัปเดตเอกสาร และ `npm run ci:quality` ผ่าน
- 2026-06-06 21:30:06 +07:00 - เริ่ม T55: เพิ่ม Postgres collection-level patch write adapter prototype สำหรับ map logical patch เป็น table-level transaction
- 2026-06-06 21:37:24 +07:00 - ทำ T55 เสร็จ: เพิ่ม Postgres patch write path, fake-client regression สำหรับ upsert/append/delete, metadata/docs และ `npm run ci:quality` ผ่าน
- 2026-06-06 21:39:57 +07:00 - อัปเดตสรุปผล T55 และ Prompt AI ส่งต่อให้ชี้ไป T56 เป็นงานถัดไป
- 2026-06-06 21:42:03 +07:00 - เริ่ม T56: เพิ่ม Postgres patch write staging validation runbook/CLI dry-run สำหรับตรวจ readiness ก่อนใช้ database จริง
- 2026-06-06 21:52:01 +07:00 - ทำ T56 เสร็จ: เพิ่ม Postgres patch validation runbook/CLI, regression สำหรับ ready/needs_review/blocked และ secret masking, deployment checklist preflight, docs และ `npm run ci:quality` ผ่าน
- 2026-06-06 21:54:56 +07:00 - เริ่ม T57: เพิ่ม Postgres patch smoke execution harness แบบ dry-run-first และต้องมี confirm guard ก่อนเขียน staging database
- 2026-06-06 22:05:07 +07:00 - ทำ T57 เสร็จ: เพิ่ม Postgres patch smoke harness, confirm/production/canary guards, evidence output, audit hash canary event, regression/docs และ `npm run ci:quality` ผ่าน
- 2026-06-08 07:41:30 +07:00 - เริ่ม T58: เพิ่ม owner/admin Launch Evidence Center ใน Business dashboard เพื่อสรุป command/evidence readiness ก่อนเปิดขายจริง
- 2026-06-08 07:51:44 +07:00 - ทำ T58 เสร็จ: เพิ่ม Launch Evidence Center service/API/UI, secret masking, owner/customer access regression, docs และ `npm run ci:quality` ผ่าน
- 2026-06-08 07:57:01 +07:00 - เริ่มตรวจ T59 แต่ Browser/in-app browser ยังถูก Windows sandbox block ระหว่าง setup (`windows sandbox failed: spawn setup refresh`) จึงเลื่อน T59 ไว้แบบไม่ปิดงานหลอก และเริ่ม T60 เพื่อเพิ่ม automated guardrail ระหว่างรอ Browser ใช้งานได้
- 2026-06-08 08:04:52 +07:00 - ทำ T60 เสร็จ: เพิ่ม `test:launch-evidence`, ตรวจ pending/blocked/ready evidence, importer dry-run marker, secret masking, frontend/CSS guardrails, owner/customer API guard, docs และ `npm run ci:quality` ผ่าน
- 2026-06-08 08:08:20 +07:00 - เริ่ม T61: เพิ่ม Launch Evidence export/sign-off pack สำหรับ owner/admin โดยยังไม่รันคำสั่งจาก frontend และต้องไม่เปิดเผย secret
- 2026-06-08 08:16:17 +07:00 - ทำ T61 เสร็จ: เพิ่ม Launch Evidence JSON/text sign-off export, copy/download action ใน Business dashboard, export regression/header/customer guard/docs และ `npm run ci:quality` ผ่าน; Browser visual QA ยังถูก sandbox block จึงยังไม่ปิด T59
- 2026-06-11 07:55:10 +07:00 - เริ่ม T62: เพิ่ม audit event สำหรับ Launch Evidence export/sign-off pack เพื่อให้ owner/admin ตรวจย้อนหลังได้ก่อน deploy
- 2026-06-11 08:01:13 +07:00 - ทำ T62 เสร็จ: export Launch Evidence JSON/text บันทึก audit action `launch_evidence.export`, Recent activity แสดง export activity หลัง copy/download, regression/docs ผ่าน และ `npm run ci:quality` ผ่าน exit code 0; แต่ `compare:python` รายงาน numeric mismatches 48 และ text mismatches 42 จาก reference/output CSV ที่ modified อยู่ใน worktree จึงเพิ่ม T63 เพื่อตรวจแยก
- 2026-06-11 08:05:46 +07:00 - เพิ่มบันทึกความต่างผลลัพธ์ Python เดิม vs Node/Web App ใหม่ใน `plan.md` โดยระบุ mismatch ล่าสุด, ประเด็น `Sector`/fundamental source และขอบเขตที่ T63 ต้องตรวจต่อ
- 2026-06-11 08:12:37 +07:00 - เริ่ม T63: ตรวจ reference drift ของ `compare:python` โดยเน้น `RSI_Score`, `Trend_Status`, `Rationale` และแยกประเด็น `Sector` live data vs shared raw input
- 2026-06-11 08:18:12 +07:00 - ทำ T63 เสร็จ: แก้ JS numeric parser ให้ค่าว่างเป็น `NaN` เหมือน Python, `RSI_Score`/trend/rationale กลับมาตรง, เพิ่ม sector comparison ใน report, ทำให้ `compare:python` fail หากพบ mismatch และ `npm run ci:quality` ผ่านโดย formula/text/sector mismatch = 0
- 2026-06-11 08:20:35 +07:00 - เริ่ม T64: ตรวจ coverage ของ live market data สำหรับ `Sector`, `PE`, `ROE`, `Yield`, `DE` และออกแบบ diagnostic/report โดยไม่เขียนทับ reference CSV หลัก
- 2026-06-11 08:31:44 +07:00 - ทำ T64 เสร็จ: เพิ่ม live market coverage report, CLI `npm run market:coverage`, regression `npm run test:market-coverage`, endpoint/download link, docs และ `npm run ci:quality` ผ่าน; report ล่าสุดพบ 851 rows, complete coverage 57.11%, unknown sector 18, missing PE 245, ROE 39, Yield 242, D/E 75, missing reference rows 0
- 2026-06-11 08:31:44 +07:00 - เพิ่ม T65 Pending สำหรับทำ production reference master/fundamental enrichment ต่อจากข้อสรุป T64 โดยยังไม่เริ่มแก้โค้ดใน task นี้
- 2026-06-11 08:44:26 +07:00 - เพิ่ม T66 Pending จากข้อสังเกต UX: เมื่อกด `Analyze my portfolio` ต้องมี loading/progress state ชัดเจน กันผู้ใช้เข้าใจผิดว่าเว็บ error หรือกดซ้ำระหว่างระบบยังทำงาน
- 2026-06-11 09:13:40 +07:00 - เริ่ม T66: แก้ UX ตอนกด `Analyze my portfolio` ให้มี loading/progress state, disable ปุ่มกันกดซ้ำ, status message และ regression marker
- 2026-06-11 09:20:13 +07:00 - ทำ T66 เสร็จ: เพิ่ม analysis progress panel, spinner, staged status messages, disable/restore ปุ่ม `Analyze my portfolio`, success/error state, `aria-live`, regression markers, docs และ `npm run ci:quality` ผ่าน; รอบนี้ไม่มี browser control tool สำหรับ screenshot localhost จึงยืนยันด้วย automated frontend/web smoke
- 2026-06-11 09:33:17 +07:00 - เริ่ม T65: ทำ reference master/fundamental enrichment foundation โดยใช้ file-backed JSON master พร้อม metadata และ fallback จาก CSV เดิม
- 2026-06-11 09:43:41 +07:00 - ทำ T65 เสร็จ: เพิ่ม file-backed reference master JSON, importer `npm run reference:import`, dry-run/overwrite guard, master-first CSV fallback, `test:reference-master`, docs, `data/reference/.gitkeep`, ignore generated master และ `npm run ci:quality` ผ่าน; import ล่าสุดสร้าง master 851 rows, complete 486, needs review 365
- 2026-06-11 09:43:41 +07:00 - เพิ่ม T67 Pending สำหรับทำ owner/admin review และ freshness workflow ของ reference master ในขั้นถัดไป
- 2026-06-11 13:06:53 +07:00 - เริ่ม T67: เพิ่ม owner/admin reference master review/freshness workflow พร้อม audit event, UI/API และ regression
- 2026-06-11 13:21:21 +07:00 - ทำ T67 เสร็จ: เพิ่ม owner/admin Reference Master Review UI/API, freshness summary, edit workflow, audit event `reference_master.review`, regression `test:reference-master-admin`, docs และ `npm run ci:quality` ผ่าน; เพิ่ม T68 Pending สำหรับย้าย reference master ไป database adapter/freshness scheduler foundation
- 2026-06-11 13:24:25 +07:00 - เริ่ม T68: เพิ่ม reference master database adapter/repository boundary, dry-run migration/import plan และ freshness scheduler/report foundation โดยยังคง local file fallback
- 2026-06-11 13:31:27 +07:00 - ทำ T68 เสร็จ: เพิ่ม reference master repository/database adapter foundation, Postgres table bootstrap SQL, migration dry-run plan, freshness report CLI `reference:freshness`, fake-client regression `test:reference-master-database`, docs และ `npm run ci:quality` ผ่าน; เพิ่ม T69 Pending สำหรับ staging migration execution guard
- 2026-06-11 13:39:00 +07:00 - เริ่ม T69: เพิ่ม reference master staging migration execution guard แบบ dry-run-first/confirm guard, evidence output, secret masking และ fake-client regression
- 2026-06-11 13:47:27 +07:00 - ทำ T69 เสร็จ: เพิ่ม reference master migration service/CLI `reference:migrate`, dry-run-first/confirm guard, staging/backup/plan-reviewed/production guards, evidence output, secret masking, fake-client regression `test:reference-master-migration`, docs และ `npm run ci:quality` ผ่าน; เพิ่ม task T70 สำหรับ Launch Evidence integration
- 2026-06-11 19:27:08 +07:00 - เริ่ม T70: เชื่อม reference master freshness/migration readiness เข้ากับ Launch Evidence Center พร้อม env markers, secret masking, frontend summary และ regression guard
- 2026-06-11 19:37:52 +07:00 - ทำ T70 เสร็จ: เพิ่ม Reference Master freshness/migration readiness ใน Launch Evidence Center, env markers, reference master summary, sign-off export, frontend marker `data-reference-master-launch-evidence`, regression pending/blocked/ready/owner/customer guard, docs และ `npm run ci:quality` ผ่าน

## ผลลัพธ์ T18: Audit Log and Activity Timeline Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `auditEvents` ใน local state และจำกัดประวัติไว้ที่ 1,000 events ล่าสุด
  - เพิ่ม `recordAuditEvent` และ `getAuditEvents`
  - บันทึก action สำคัญ เช่น register, login, logout, profile update, checkout, role update, advisor assignment, analysis run, simulation run และ portfolio snapshot
  - กรอง timeline ตาม role: owner/admin เห็นทั้งหมด, advisor เห็นตัวเองและลูกค้าที่ดูแล, customer เห็นเฉพาะของตัวเอง
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/audit/events?limit=...`
- `src/routes/analysisRoutes.js`
  - บันทึกกิจกรรมตอน run analysis และ run simulation
- `src/public/app.js`
  - โหลด audit events หลัง action สำคัญ
  - แสดง Recent activity ในหน้า Business/Workspace
  - เพิ่ม Activity Events metric ใน Business dashboard
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย activity timeline / audit log และขอบเขต prototype

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `analysisRoutes.js`, `app.js`
- service flow ผ่าน: owner/advisor/customer เห็น audit events ตามสิทธิ์
- HTTP smoke test ผ่านบน port ชั่วคราว 3061: register, save profile, อ่าน `/api/audit/events`
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw/recommended/report sample mismatch = 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available

## ผลลัพธ์ T19: Organization and Workspace Model Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `organizations` ใน local state พร้อม migration นุ่ม ๆ สำหรับ user เดิมที่ยังไม่มี `organizationId`
  - เพิ่ม `organizationId` ให้ public user และ team user record
  - account แรกอยู่ใน `StockFlix Platform`; customer ใหม่ได้ customer workspace ของตัวเอง
  - เพิ่ม `listOrganizations`, `createOrganization`, `updateOrganization`, `moveUserToOrganization`
  - เพิ่ม workspace metrics ใน `businessMetrics` เช่น workspaces, customer workspaces, platform members และ recent organizations
  - เพิ่ม audit events สำหรับ `organization.create`, `organization.update`, `organization.member_move`
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/admin/organizations`
  - เพิ่ม API `POST /api/admin/organizations`
  - เพิ่ม API `POST /api/admin/organizations/:organizationId`
  - เพิ่ม API `POST /api/admin/users/:userId/organization`
- `src/public/app.js`
  - โหลด workspace list ใน Business/Workspace view
  - เพิ่ม Workspace summary table พร้อม create/edit controls สำหรับ owner/admin
  - เพิ่ม workspace dropdown ใน Team and clients table เพื่อย้ายสมาชิกเข้า workspace
  - เพิ่ม workspace activity labels ใน Recent activity
- `src/public/styles.css`
  - เพิ่ม styling สำหรับ input ใน table และ workspace form
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย workspace/organization prototype และ metrics ที่เกี่ยวข้อง

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `app.js`
- service flow ผ่าน: create/update workspace, move user, list organizations ตามสิทธิ์ และ audit events
- HTTP smoke test ผ่านบน port ชั่วคราว 3062: admin login, create/update workspace, move user, list organizations
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw/recommended/report sample mismatch = 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available

## ผลลัพธ์ T20: Payment Gateway and Webhook Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `paymentSessions` และ `paymentWebhookEvents` ใน local state
  - เพิ่ม `createPaymentSession`, `processPaymentWebhook`, `getPaymentSessions`
  - ปรับ `checkoutSubscription` ให้สร้าง payment session แล้ว process simulated success webhook ภายใน เพื่อให้ endpoint เดิมยังใช้งานได้
  - เพิ่ม duplicate webhook reconciliation ด้วย `providerEventId` เพื่อไม่ออก invoice ซ้ำ
  - เพิ่ม payment metrics ใน `businessMetrics` เช่น pending payment sessions, failed payment sessions และ webhook events
  - เพิ่ม audit events สำหรับ `payment.session_created`, `payment.webhook_succeeded`, `payment.webhook_failed`
- `src/routes/authRoutes.js`
  - เพิ่ม API `POST /api/subscription/payment-session`
  - เพิ่ม API `POST /api/payment/webhook/simulate`
  - เพิ่ม API `GET /api/customer/payments`
  - ปรับ response ของ `POST /api/subscription/checkout` ให้คืน `paymentSession`, `webhookEvent` และ `duplicate`
- `src/public/app.js`
  - โหลด payment sessions หลัง login/checkout
  - แสดง payment status ใน account panel
  - แสดง payment metrics และ Recent payments ใน Business/Workspace UI
  - เพิ่ม label ใน Recent activity สำหรับ payment session/webhook actions
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย local payment gateway/webhook prototype, duplicate reconciliation และ API ที่เกี่ยวข้อง

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `app.js`
- service flow ผ่าน: create payment session, success webhook, duplicate webhook, failure webhook และ endpoint checkout เดิม
- HTTP smoke test ผ่านบน port ชั่วคราว 3064: register, create payment session, simulate failed webhook, checkout success และ list payment sessions
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw/recommended/report sample mismatch = 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available

## ผลลัพธ์ T21: Tenant Isolation and Production Readiness Hardening

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `organizationId` ให้ portfolio snapshots, investor profiles, billing events, payment sessions, payment webhook events และ audit events
  - normalize ข้อมูลเก่าที่ไม่มี `organizationId` จาก user/workspace/session ที่เกี่ยวข้อง
  - เพิ่ม `tenantAccessSummary` สำหรับสรุป visible users, visible workspaces, visible record counts และ metadata gaps ตามสิทธิ์ user
  - เพิ่ม tenant metadata report ใน `businessMetrics`
  - ปรับ payment/audit filtering ให้ตรวจได้ทั้ง user scope และ organization scope
  - ปรับ revenue/saved portfolio ต่อ workspace ให้อิง `organizationId` เมื่อมีข้อมูล
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/tenant/scope`
- `src/public/app.js`
  - โหลด tenant scope หลัง login, checkout, run analysis, save profile และ refresh workspace
  - แสดง scope count ใน account panel
  - เพิ่ม Tenant isolation summary ใน Business/Workspace view พร้อม visible data scope และ workspace access
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย tenant isolation summary, production readiness และข้อจำกัดของ local file-backed prototype

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `app.js`
- service flow ผ่าน: owner/advisor/customer scope, advisor assignment, portfolio/profile snapshot, payment session/webhook และ tenant metadata gaps = 0
- HTTP smoke test ผ่านบน port ชั่วคราว 3066: register, `GET /api/tenant/scope`, checkout และ scope หลัง payment
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw/recommended/report sample mismatch = 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T22: Payment Webhook Signature Verification

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม HMAC SHA-256 signature helper สำหรับ payment webhook prototype
  - เพิ่ม timestamp tolerance 300 วินาที เพื่อลด replay webhook เก่า
  - เพิ่ม `processSignedPaymentWebhook` และ `createPaymentWebhookSignature`
  - เพิ่ม rejected webhook logging เมื่อ signature หาย, timestamp หาย, timestamp stale, signature ผิด หรือ session ไม่ถูกต้อง
  - เพิ่ม `signatureVerified`, `verificationStatus`, `source`, `signedAt` และ `signatureAgeSeconds` ใน webhook events
  - เพิ่ม business metrics: `verifiedWebhookEvents`, `rejectedWebhookEvents` และ `webhookSecurity`
- `src/routes/authRoutes.js`
  - เพิ่ม API `POST /api/payment/webhook/local-gateway` สำหรับ signed webhook endpoint ที่ไม่ต้อง login แต่ต้องมี HMAC signature ถูกต้อง
- `src/public/app.js`
  - เพิ่ม Business metrics สำหรับ Verified Signatures, Rejected Webhooks และ Webhook Tolerance
  - เพิ่ม Recent gateway webhooks table
  - เพิ่ม audit label สำหรับ `payment.webhook_rejected`
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย signed webhook endpoint, headers, `PAYMENT_WEBHOOK_SECRET`, timestamp tolerance และข้อจำกัดก่อน production จริง

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `app.js`
- service flow ผ่าน: signed webhook success, duplicate reconciliation, invalid signature rejected และ metrics verified/rejected
- HTTP smoke test ผ่านบน port ชั่วคราว 3067: register, create payment session, call signed public webhook, reject bad signature และ admin metrics
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw/recommended/report sample mismatch = 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T23: Immutable Audit Trail and Integrity Hash Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม audit hash chain แบบ SHA-256 version `sha256-v1`
  - audit event ใหม่มี `previousHash`, `eventHash`, `integrityVersion` และ `hashPreview`
  - normalize audit event เก่าที่ไม่มี hash ให้มี chain ต่อเนื่องโดยไม่ลบ event เดิม
  - เพิ่ม `auditIntegritySummary` สำหรับ owner/admin ตรวจสถานะ chain
  - business metrics มี `auditIntegrity` เพื่อใช้แสดงสถานะ verified/needs_review, hash gaps และ hash ล่าสุด
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/audit/integrity` สำหรับ owner/admin เท่านั้น
- `src/public/app.js`
  - เพิ่ม Business metrics: Audit Integrity, Audit Hash Gaps และ Last Audit Hash
  - เพิ่ม Audit trail guidance card
  - เพิ่ม hash preview ใน Activity Timeline
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย audit hash chain, integrity API และข้อจำกัดว่า production จริงควรย้ายไป append-only/immutable audit storage ภายนอก

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `authService.js`, `authRoutes.js`, `app.js`
- service flow ผ่าน: audit hash chain verified และตรวจพบ tampered event เป็น `needs_review`
- HTTP smoke test ผ่านบน port ชั่วคราว 3068: owner เรียก `/api/audit/integrity` ได้, customer ถูกปฏิเสธ 403 และ metrics มี audit integrity
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T24: Automated Tenant Access Regression Tests

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `scripts/tenantAccessRegression.js`
  - เพิ่ม automated regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - จำลอง owner, admin, advisor, customer A และ customer B
  - ทดสอบ assign advisor, move user to workspace, investor profile, portfolio snapshot, checkout, payment session และ unauthorized payment webhook simulation
  - ตรวจ owner/admin เห็นภาพรวมได้ครบ
  - ตรวจ customer เห็นเฉพาะ portfolio, billing, payment sessions, audit timeline และ tenant scope ของตัวเอง
  - ตรวจ advisor เห็นเฉพาะลูกค้าที่ถูก assign และไม่เห็นลูกค้าที่ไม่ได้ assign
  - ตรวจ audit integrity เป็น `verified` และ tenant metadata gaps = 0
- `package.json`
  - เพิ่ม `npm run test:tenant-access`
  - เพิ่ม `npm run test-regression` เพื่อรัน syntax check, tenant access regression และ compare Python ต่อเนื่องกัน
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบายชุดทดสอบ role/workspace isolation และคำสั่งสำหรับตรวจระบบก่อนส่งมอบ

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `tenantAccessRegression.js`, `authService.js`, `authRoutes.js`, `app.js`
- `npm run test:tenant-access` ผ่าน: ownerVisibleUsers = 5, advisorVisibleUsers = 2, customer scope แยกกัน, auditIntegrity = `verified`, tenantMetadataGaps = 0
- `npm run test-regression` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T25: Subscription Lifecycle Regression Tests

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `scripts/subscriptionLifecycleRegression.js`
  - เพิ่ม automated regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - จำลอง owner และ customer เพื่อทดสอบ subscription/payment lifecycle
  - ตรวจ customer ใหม่เริ่มจาก `trialing`
  - ตรวจ failed payment ไม่สร้าง invoice และไม่ activate subscription
  - ตรวจ signed webhook success ด้วย HMAC แล้วเปลี่ยน subscription เป็น `active`
  - ตรวจ duplicate provider event ไม่สร้าง billing event ซ้ำ
  - ตรวจ invalid signature, stale timestamp, missing signature และ invalid session ถูก reject พร้อมบันทึก webhook/audit
  - ตรวจ payment sessions คงสถานะ `failed`, `paid`, `pending` ตาม flow
  - ตรวจ business metrics เช่น paid users, pending/failed payments, verified/rejected webhook events และ revenue
- `src/services/authService.js`
  - ปรับ rejected webhook ที่ไม่มี session จริงให้ผูกกับ platform workspace แทนค่าว่าง เพื่อไม่ให้เกิด tenant metadata gap
- `package.json`
  - เพิ่ม `npm run test:subscription-lifecycle`
  - อัปเดต `npm run test-regression` ให้รัน syntax check, tenant access regression, subscription lifecycle regression และ compare Python ต่อเนื่องกัน
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย subscription lifecycle regression, คำสั่งทดสอบ และความหมายของ verified signatures เทียบกับ rejected webhooks

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `subscriptionLifecycleRegression.js`, `tenantAccessRegression.js`, `authService.js`, `authRoutes.js`, `app.js`
- `npm run test:subscription-lifecycle` ผ่าน: failedSession = `failed`, paidSession = `paid`, duplicateReconciled = true, billingEvents = 1, paidUsers = 1, pendingPaymentSessions = 3, failedPaymentSessions = 1, verifiedWebhookEvents = 2, rejectedWebhookEvents = 4, revenueCollected = 1490, auditIntegrity = `verified`
- `npm run test-regression` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T26: CI Quality Gate for SaaS Regression

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `.github/workflows/quality-gate.yml`
  - เพิ่ม GitHub Actions workflow ชื่อ `Quality Gate`
  - trigger เมื่อ push, pull request ไป `main` และ manual dispatch
  - ใช้ Node.js `22.x`
  - ตรวจ reference artifacts ที่ `npm run compare:python` ต้องใช้ ได้แก่ `siamchart_raw.csv`, `recommended_stocks.csv`
  - portfolio report regression ใช้ synthetic temporary workbook เพื่อไม่ต้อง commit ไฟล์ portfolio ส่วนตัว
  - รัน `npm ci` และ `npm run ci:quality`
- `package.json`
  - เพิ่ม `npm run ci:quality` เพื่อรัน regression ทั้งหมดและ `npm audit --audit-level=high`
- `docs/CI_QUALITY_GATE.md`
  - เพิ่มคู่มือ CI quality gate, required reference files และ failure guide
- `README.md` และ `docs/WEB_APP_USAGE.md`
  - เพิ่มคำสั่ง `npm run ci:quality` และตำแหน่ง workflow/เอกสาร CI

ผลการทดสอบ:

- `npm run ci:quality` ผ่าน
- tenant access regression ผ่าน: ownerVisibleUsers = 5, advisorVisibleUsers = 2, auditIntegrity = `verified`, tenantMetadataGaps = 0
- subscription lifecycle regression ผ่าน: duplicateReconciled = true, paidUsers = 1, rejectedWebhookEvents = 4, revenueCollected = 1490
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T27: Production Database Migration Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/stateSchemaService.js`
  - เพิ่ม state schema manifest version `2026-06-04.storage-v1`
  - map local collections ไป production table ที่แนะนำ เช่น `users`, `organizations`, `billing_events`, `payment_sessions`, `audit_events`
  - เพิ่ม readiness report สำหรับตรวจ record counts, missing primary keys, duplicate primary keys, duplicate unique fields, missing required fields, missing `organizationId` และ dangling references
  - แยกสถานะ `ready`, `review`, `blocked` สำหรับใช้ตัดสินใจก่อน migration จริง
- `src/services/authService.js`
  - เพิ่ม `storageReadinessSummary` สำหรับ owner/admin
  - เพิ่ม `storageReadiness` ใน Business metrics
  - normalize rejected payment webhook เก่าที่ไม่มี session/user ให้มี platform workspace fallback
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/storage/readiness` สำหรับ owner/admin เท่านั้น
- `src/public/app.js`
  - เพิ่ม Business metrics: DB Readiness, DB Blockers และ Schema Version
  - เพิ่ม guidance card สำหรับ Database migration
- `scripts/storageReadinessRegression.js`
  - เพิ่ม regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - ตรวจ state ปกติเป็น `ready`
  - จงใจเพิ่ม duplicate user และ orphan billing event เพื่อยืนยันว่า readiness report เป็น `blocked`
- `package.json`
  - เพิ่ม `npm run test:storage-readiness`
  - อัปเดต `npm run test-regression` และ `npm run ci:quality` ให้รวม storage readiness regression
- `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคู่มือ schema manifest, readiness checks, API, UI surface, regression test และ production migration path
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย storage readiness และคำสั่งทดสอบ

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `stateSchemaService.js`, `authService.js`, `authRoutes.js`, `app.js`, `storageReadinessRegression.js`
- `npm run test:storage-readiness` ผ่าน: ready state = `ready`, collectionCount = 10, blockerCount = 0, warningCount = 0 และ corrupted state = `blocked`
- HTTP smoke test ผ่านบน port ชั่วคราว 3072: owner เรียก `/api/storage/readiness` ได้ status `ready`, customer ถูกปฏิเสธ 403
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T28: Production Database Repository Layer

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/stateRepository.js`
  - เพิ่ม repository boundary สำหรับอ่าน/เขียน app state
  - รองรับ adapter ปัจจุบัน `local_file`
  - เพิ่ม `readAppState`, `writeAppState` และ `stateRepositoryInfo`
  - fail-fast หากตั้ง `APP_STATE_REPOSITORY` เป็น adapter ที่ยังไม่รองรับ
  - เปิด metadata แบบ portable เช่น adapter, state file, normalized-on-read และ production readiness โดยไม่เปิดเผย absolute path ใน API
- `src/services/authService.js`
  - เปลี่ยน `readState` และ `writeState` ให้เรียกผ่าน repository layer
  - `storageReadinessSummary` ใช้ `stateRepositoryInfo()` แทน hard-code current store
- `scripts/stateRepositoryRegression.js`
  - เพิ่ม regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - ตรวจ missing file normalize, local file write/read, repository metadata และ unsupported adapter fail-fast
- `package.json`
  - เพิ่ม `npm run test:state-repository`
  - อัปเดต `npm run test-regression` และ `npm run ci:quality` ให้รวม state repository regression
- `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำอธิบาย repository layer และ migration path ใหม่ว่าเหลือ implement production database adapter
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย state repository layer และคำสั่งทดสอบ

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `stateRepository.js`, `authService.js`, `stateRepositoryRegression.js`
- `npm run test:state-repository` ผ่าน: adapter = `local_file`, stateFile = `data/app-state.json`, userCount = 1
- `npm run test:storage-readiness` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T29: External Append-Only Audit Trail Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/auditTrailRepository.js`
  - เพิ่ม local NDJSON append-only audit mirror ที่ `data/audit-events.ndjson`
  - mirror audit events แบบ idempotent โดยไม่ append event id เดิมซ้ำ
  - เพิ่ม audit trail readiness report สำหรับตรวจ missing events, extra events, duplicate ids และ invalid NDJSON lines
  - เปิด metadata เช่น adapter `local_ndjson`, version, trail file, append-only flag และ migration target
- `src/services/stateRepository.js`
  - เรียก `mirrorAuditTrail` ก่อนเขียน `data/app-state.json`
  - เพิ่ม audit trail metadata ใน repository info
- `src/services/authService.js`
  - เพิ่ม `auditTrailSummary` สำหรับ owner/admin
  - เพิ่ม `auditTrail` ใน Business metrics
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/audit/trail` สำหรับ owner/admin เท่านั้น
- `src/public/app.js`
  - เพิ่ม Business metrics: Audit Mirror และ Audit Mirror Gaps
  - เพิ่ม guidance card สำหรับ Audit mirror
- `.gitignore`
  - ignore `data/audit-events.ndjson`
- `scripts/auditTrailRepositoryRegression.js`
  - เพิ่ม regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - ตรวจ audit mirror `synced`, customer ถูกปฏิเสธ, missing mirror event ถูกจับ และ invalid NDJSON line ถูกจับ
- `package.json`
  - เพิ่ม `npm run test:audit-trail`
  - อัปเดต `npm run test-regression` และ `npm run ci:quality` ให้รวม audit trail regression
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำอธิบาย append-only audit mirror, API, UI metric และคำสั่งทดสอบ

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `auditTrailRepository.js`, `stateRepository.js`, `authService.js`, `authRoutes.js`, `app.js`, `auditTrailRepositoryRegression.js`
- `npm run test:audit-trail` ผ่าน: synced stateEvents = 4, trailEvents = 4, missingFromTrailCount = 1 เมื่อจงใจลบ mirror และ invalidLineCount = 1 เมื่อจงใจเพิ่ม invalid line
- HTTP smoke test ผ่านบน port ชั่วคราว 3073: owner เรียก `/api/audit/trail` ได้ status `synced`, customer ถูกปฏิเสธ 403
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของ `.gitignore` และ `README.md`

## ผลลัพธ์ T30: Approval Workflow Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `approvalRequests` ใน local state พร้อม normalize และ tenant metadata
  - เพิ่ม `listApprovalRequests`, `createApprovalRequest` และ `decideApprovalRequest`
  - จำกัดสิทธิ์ owner/admin ให้เห็นทุก request, advisor เห็นเฉพาะลูกค้าที่ถูก assign และ customer เห็น/ตัดสินใจเฉพาะของตัวเอง
  - เพิ่ม audit events `approval.request_created`, `approval.request_approved`, `approval.request_rejected`
  - เพิ่ม business metrics: pending, approved และ rejected approvals
- `src/services/stateSchemaService.js`
  - เพิ่ม schema collection `approvalRequests` mapping ไป production table `approval_requests`
  - ตรวจ required fields, tenant scope และ references ไป `users`/`organizations`
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/approvals`
  - เพิ่ม API `POST /api/approvals`
  - เพิ่ม API `POST /api/approvals/:approvalId/decision`
- `src/public/index.html`, `src/public/app.js`, `src/public/styles.css`
  - เพิ่มแท็บ `Approvals`
  - เพิ่ม form ให้ owner/admin/advisor สร้าง approval request
  - เพิ่ม table ให้ customer approve/reject request ของตัวเอง
  - เพิ่ม Client approvals ใน Business/Workspace และ metric pending/approved/rejected approvals
  - เพิ่ม label ใน Recent activity สำหรับ approval actions
- `scripts/approvalWorkflowRegression.js`
  - เพิ่ม regression test ที่ใช้ temporary directory แยกจากข้อมูล demo จริง
  - ตรวจ advisor สร้าง approval ได้เฉพาะ assigned customer, customer เห็น/ตัดสินใจเฉพาะของตัวเอง, customer อื่นไม่เห็นข้อมูลข้ามกัน, metrics ถูกต้อง, audit integrity verified และ storage readiness ready
- `package.json`
  - เพิ่ม `npm run test:approval-workflow`
  - อัปเดต `npm run test-regression` และ `npm run ci:quality` ให้รวม approval workflow regression
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำอธิบาย approval workflow, schema mapping และคำสั่งทดสอบ

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `src/public/app.js`, `src/services/authService.js`, `src/routes/authRoutes.js`, `scripts/approvalWorkflowRegression.js`
- `npm run test:approval-workflow` ผ่าน: total approvals = 2, approved = 1, rejected = 1, owner scope = 2, advisor/customer scope ถูกต้อง, audit integrity = `verified`, storage readiness = `ready`
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- HTTP smoke test ผ่านบน port ชั่วคราว 3095: `/api/health` ตอบ ok, หน้าแรกโหลดได้ และมีแท็บ `Approvals`
- in-app browser runtime ถูก Windows sandbox บล็อกตอนพยายาม spawn server จาก runtime จึงใช้ HTTP smoke test แทน
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของไฟล์ที่แก้บน Windows

## ผลลัพธ์ T31: Chart Interaction and Screener Drilldown

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/app.js`
  - เพิ่ม filter ในหน้า Screener สำหรับ sector และ trend
  - เพิ่มข้อความสรุปจำนวนหุ้นที่ match filter ปัจจุบัน
  - ทำให้ Sector count visual เป็นปุ่มคลิกเพื่อกรองตารางตาม sector
  - เพิ่ม helper `uniqueValues` สำหรับจัดรายการ filter ที่ไม่ซ้ำ
  - ปรับ `renderBarList` ให้รองรับ action แบบ optional โดย visual อื่นยังแสดงเหมือนเดิม
- `src/public/styles.css`
  - เพิ่ม style สำหรับ bar row ที่เป็นปุ่มและสถานะ selected
- `README.md`, `docs/WEB_APP_USAGE.md`
  - เพิ่มคำอธิบาย sector/trend filter และ sector drilldown ใน Screener

ผลการทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- HTTP smoke test ผ่านบน port ชั่วคราว 3097: `/api/health` ตอบ ok, หน้าแรกยังมี `Approvals`, `app.js` มี `sectorFilter` และ `data-sector-filter`
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของไฟล์ที่แก้บน Windows
- หมายเหตุ: T31 เป็น UI interaction ฝั่ง frontend ไม่เปลี่ยนสูตรวิเคราะห์ หุ้นแนะนำ หรือ report output เดิม

## ผลลัพธ์ T32: External Immutable Audit Provider Integration

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/auditTrailRepository.js`
  - เพิ่ม external audit provider แบบ HTTP webhook โดยเปิดใช้ด้วย `AUDIT_TRAIL_EXTERNAL_PROVIDER=http_webhook`
  - เพิ่มการส่ง audit event ออกไป provider ภายนอกพร้อม HMAC SHA-256 signature และ timestamp headers
  - เพิ่ม `data/audit-external-receipts.ndjson` สำหรับเก็บ receipt ของ event ที่ provider ตอบรับสำเร็จ
  - เพิ่ม readiness report สำหรับ external provider เช่น enabled, endpointConfigured, receiptEvents, missingFromExternalCount และ invalidReceiptLineCount
  - รองรับ `AUDIT_TRAIL_EXTERNAL_REQUIRED=true` เพื่อให้ระบบ fail-closed เมื่อ provider ภายนอกไม่พร้อม
  - ค่า default ยังเป็น local-only และไม่บังคับ external provider
- `src/services/stateRepository.js`
  - เพิ่ม external provider metadata เข้า repository info
- `src/services/authService.js`
  - เพิ่ม external audit provider status เข้า Business metrics
- `src/public/app.js`
  - เพิ่ม Business metrics: External Audit และ External Audit Gaps
  - เพิ่ม guidance card สำหรับ external audit provider
- `.gitignore`
  - ignore `data/audit-external-receipts.ndjson`
- `scripts/auditTrailExternalProviderRegression.js`
  - เพิ่ม regression test ด้วย local HTTP server ชั่วคราว
  - ตรวจ HMAC-signed event delivery, receipt sync, missing external receipt เมื่อ provider ล่ม และ required mode fail-closed
- `package.json`
  - เพิ่ม `npm run test:audit-external`
  - อัปเดต `npm run test-regression` และ `npm run ci:quality` ให้รวม external audit regression
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำอธิบาย external audit provider, env variables, receipt file และคำสั่งทดสอบ

Environment variables สำหรับเปิด external provider:

```text
AUDIT_TRAIL_EXTERNAL_PROVIDER=http_webhook
AUDIT_TRAIL_HTTP_URL=https://your-immutable-audit-provider.example/events
AUDIT_TRAIL_HTTP_SECRET=your-production-secret
AUDIT_TRAIL_EXTERNAL_REQUIRED=true
```

ผลการทดสอบ:

- `node --check` ผ่านสำหรับ `auditTrailRepository.js`, `stateRepository.js`, `authService.js`, `auditTrailExternalProviderRegression.js`
- `npm run test:audit-external` ผ่าน: external provider synced, stateEvents = 4, receiptEvents = 4, missingFromExternalCount = 1 เมื่อ provider ถูกปิด
- `npm run test:audit-trail` ผ่าน ยืนยัน default local NDJSON behavior ยังเหมือนเดิม
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- HTTP smoke test ผ่านบน port ชั่วคราว 3098: `/api/health` ตอบ ok และ `app.js` มี External Audit metrics
- `npm audit --audit-level=high` ผ่านเกณฑ์ high; ยังมี moderate advisory จาก `uuid` ผ่าน `exceljs` และไม่มี fix available
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของไฟล์ที่แก้บน Windows

## ผลลัพธ์ T33: Dependency Risk Gate Hardening

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `scripts/dependencyRiskRegression.js`
  - เพิ่ม dependency risk gate ที่อ่าน `npm audit --json` เป็นหลัก
  - fail เมื่อพบ high/critical vulnerability
  - fail เมื่อพบ moderate vulnerability ใหม่ที่ไม่อยู่ใน accepted risk register
  - fail เมื่อ accepted moderate risk เริ่มมี `fixAvailable: true`
  - เพิ่ม fallback อ่าน `package-lock.json` สำหรับ Windows sandbox ที่ Node child-process spawn เรียก `npm audit` ไม่ได้
- `docs/DEPENDENCY_RISK_REGISTER.md`
  - เพิ่ม accepted risk register สำหรับ moderate advisory ปัจจุบัน `exceljs -> uuid`
  - ระบุ advisory `GHSA-w5hq-g745-h8pq`, สถานะ `fixAvailable: false` และ production action
- `package.json`
  - เพิ่ม `npm run test:dependency-risk`
  - ปรับ `npm run ci:quality` ให้รัน regression รวมแล้วตามด้วย dependency risk gate
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่ง `npm run test:dependency-risk` และอธิบาย dependency risk gate

ผลการทดสอบ:

- `node --check scripts/dependencyRiskRegression.js` ผ่าน
- `npm run test:dependency-risk` ผ่าน: auditSource = `package-lock-fallback` ใน sandbox นี้, direct dependencies = `exceljs`, `express`, `multer`, accepted moderate risks = `exceljs`, `uuid`, high/critical = 0
- `npm run ci:quality` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `git diff --check` ผ่านโดยมีเฉพาะคำเตือน LF/CRLF ของไฟล์ที่แก้บน Windows

## ผลลัพธ์ T34: Web App Smoke Verification Harness

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/server.js`
  - เพิ่ม `createApp()` เพื่อสร้าง Express app สำหรับ production start และ test ได้จาก factory เดียวกัน
  - เพิ่ม `startServer()` เพื่อให้ test เปิด server บน port ชั่วคราวใน process เดียวได้
  - คง `npm start` ให้ทำงานเหมือนเดิมเมื่อรัน `node src/server.js`
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม web smoke regression ที่สร้าง temporary directory แยกจากข้อมูล demo จริง
  - เปิด Web App ใน process เดียวบน port ชั่วคราวโดยไม่ต้องใช้ background server
  - ตรวจ `/api/health`, `/api/auth/me`, `/api/subscription/plans`, admin auth guard, หน้าแรก, `app.js` markers และ `styles.css` markers
  - ตรวจ marker สำคัญของ SaaS UI เช่น Approvals navigation, Screener sector drilldown และ External Audit metrics
- `package.json`
  - เพิ่ม `npm run test:web-smoke`
  - ผูก `test:web-smoke` เข้า `npm run test-regression` และส่งผลให้ `npm run ci:quality` ตรวจด้วย
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย automated web smoke regression และคำสั่งทดสอบ

ผลการทดสอบ:

- `node --check src/server.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:web-smoke` ผ่าน: ตรวจ health, anonymous auth, subscription plans, admin auth guard, main HTML, frontend markers และ stylesheet markers
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: งานนี้ยังไม่ใช่ screenshot QA ผ่าน in-app browser จริง แต่ช่วยปิดช่องว่างจาก Windows sandbox ที่ไม่ยอมให้เปิด server background ในรอบก่อนหน้า และทำให้ CI ตรวจเว็บพื้นฐานได้สม่ำเสมอ

## ผลลัพธ์ T35: Production Database Adapter Implementation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresStateRepository.js`
  - เพิ่ม Postgres state adapter แบบ opt-in หลัง repository boundary
  - รองรับ `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL` และ `DATABASE_SSL_MODE`
  - เพิ่ม bootstrap SQL สำหรับสร้าง table ต่อ collection ตาม schema manifest โดยใช้ `record jsonb`, `organization_id`, `user_id`, `created_at` และ `updated_at`
  - รองรับ whole-state transaction สำหรับ non-append collections และไม่ลบ append-only collection เช่น `auditEvents`
  - dynamic import optional driver `pg` เฉพาะเมื่อเปิดใช้ Postgres adapter
  - fail-fast เมื่อเปิด Postgres แต่ยังไม่ตั้ง `DATABASE_URL`
- `src/services/stateRepository.js`
  - เพิ่ม supported adapter `postgres`
  - default ยังเป็น `local_file`
  - route การอ่าน/เขียนไป Postgres เฉพาะเมื่อ env เลือก adapter
  - metadata ของ `stateRepositoryInfo()` แสดง adapter, engine, production readiness และ bootstrap tables
- `src/services/stateSchemaService.js`
  - เพิ่ม `stateCollectionDefinitions()` เพื่อให้ adapter ใช้ table mapping จาก schema manifest เดิม
- `scripts/postgresStateRepositoryRegression.js`
  - เพิ่ม fake Postgres client regression โดยไม่ต้องต่อฐานข้อมูลจริง
  - ตรวจ bootstrap SQL, read/write JSONB rows, transaction query, non-append rewrite, append-only audit behavior และ missing primary key guard
- `scripts/stateRepositoryRegression.js`
  - อัปเดตให้ตรวจ supported adapters และ Postgres fail-fast เมื่อไม่มี `DATABASE_URL`
- `package.json`
  - เพิ่ม `npm run test:postgres-repository`
  - ผูกเข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำอธิบาย Postgres adapter, env variables, optional `pg` driver, regression test และ production migration path

ผลการทดสอบ:

- `node --check src/services/postgresStateRepository.js` ผ่าน
- `node --check src/services/stateRepository.js` ผ่าน
- `node --check src/services/stateSchemaService.js` ผ่าน
- `node --check scripts/postgresStateRepositoryRegression.js` ผ่าน
- `node --check scripts/stateRepositoryRegression.js` ผ่าน
- `npm run test:postgres-repository` ผ่าน: tables = 11, usersAfterRewrite = 1, auditEventsAfterRewrite = 2
- `npm run test:state-repository` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: ยังไม่ได้ทดสอบกับ Postgres จริงใน sandbox นี้ เพราะไม่มี database/driver `pg` ติดตั้งใน environment ปัจจุบัน แต่ adapter logic, bootstrap SQL และ repository behavior ถูกตรวจด้วย fake client แล้ว

## ผลลัพธ์ T36: Real Payment Provider Integration

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/paymentGatewayService.js`
  - เพิ่ม payment gateway provider layer
  - default ยังเป็น `local_gateway`
  - เพิ่ม Stripe Checkout provider แบบ opt-in ผ่าน `PAYMENT_GATEWAY_PROVIDER=stripe_checkout`
  - สร้าง Stripe Checkout Session ด้วย form-encoded API request โดยใช้ configured recurring price id ต่อ plan
  - เพิ่ม Stripe-style webhook signature verification จาก raw body และ `Stripe-Signature`
  - map `checkout.session.completed` และ `invoice.paid` เป็น `payment.succeeded`
  - map `checkout.session.async_payment_failed`, `invoice.payment_failed` และ `payment_intent.payment_failed` เป็น `payment.failed`
- `src/services/authService.js`
  - ปรับ `checkoutSubscription` ให้ local gateway ยัง auto-complete เหมือนเดิม
  - ถ้าใช้ Stripe provider จะสร้าง pending payment session และคืน checkout URL โดยไม่ activate subscription จนกว่า webhook สำเร็จ
  - เพิ่ม `processProviderPaymentWebhook` สำหรับ public provider webhook endpoint
  - เพิ่ม payment gateway metadata ใน Business metrics
  - เพิ่ม `externalPaymentId`, `requiresRedirect` และ `providerStatus` ใน public payment session
- `src/server.js`
  - เก็บ `req.rawBody` สำหรับ `/api/payment/webhook/*` เพื่อให้ provider webhook verify signature จาก raw body ได้
- `src/routes/authRoutes.js`
  - เพิ่ม `POST /api/payment/webhook/provider/:provider`
- `src/public/app.js`
  - ปรับ checkout message ให้ external provider แสดง link `Open secure checkout`
  - เพิ่ม Business guidance card สำหรับ payment gateway status
- `scripts/paymentProviderRegression.js`
  - เพิ่ม regression test ด้วย fake Stripe API และ fake Stripe webhook signature
  - ตรวจ checkout session, pending subscription, success webhook, failed webhook, duplicate event และ invalid signature
- `package.json`
  - เพิ่ม `npm run test:payment-provider`
  - ผูกเข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย Stripe Checkout provider, env variables, provider webhook endpoint และ regression test

Environment variables สำหรับ Stripe provider:

```text
PAYMENT_GATEWAY_PROVIDER=stripe_checkout
PAYMENT_GATEWAY_STRIPE_SECRET_KEY=sk_live_or_test_key
PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET=whsec_your_endpoint_secret
PAYMENT_GATEWAY_STRIPE_SUCCESS_URL=https://your-app.example/billing/success?session={sessionId}&plan={planId}
PAYMENT_GATEWAY_STRIPE_CANCEL_URL=https://your-app.example/billing/cancel?session={sessionId}
PAYMENT_GATEWAY_STRIPE_PRICE_STARTER=price_...
PAYMENT_GATEWAY_STRIPE_PRICE_PRO=price_...
PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR=price_...
```

ผลการทดสอบ:

- `node --check src/services/paymentGatewayService.js` ผ่าน
- `node --check src/services/authService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/server.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/paymentProviderRegression.js` ผ่าน
- `npm run test:payment-provider` ผ่าน: checkoutRequests = 3, provider = `stripe_checkout`, paidSession = `paid`, failedSession = `failed`, rejectedWebhookEvents = 1
- `npm run test:subscription-lifecycle` ผ่าน ยืนยัน local gateway default ยังเหมือนเดิม
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: ยังไม่ได้ call Stripe จริงใน sandbox นี้ แต่ทดสอบด้วย fake Stripe API/fake webhook แล้ว และ implementation อิง official Stripe Checkout/Webhook raw body pattern

## ผลลัพธ์ T37: One-time App State to Postgres Importer

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresStateImporter.js`
  - เพิ่ม importer service สำหรับอ่าน local `app-state.json`
  - normalize state ด้วย `normalizeAppStateForImport`
  - สร้าง import plan จาก storage readiness และ schema manifest
  - รองรับ dry-run เพื่อดู readiness, blockers, record counts และ table mapping โดยไม่เขียนฐานข้อมูล
  - ปฏิเสธ import จริงถ้า readiness เป็น `blocked` ยกเว้นตั้ง `allowBlocked`
  - เขียนข้อมูลผ่าน Postgres adapter หรือ fake client ใน test
- `scripts/importAppStateToPostgres.js`
  - เพิ่ม CLI สำหรับ one-time import
  - options: `--input`, `--dry-run`, `--allow-blocked`, `--help`
  - script name: `npm run import:postgres`
- `scripts/postgresStateImporterRegression.js`
  - เพิ่ม fake-client regression
  - ตรวจ dry-run, record counts, whole-state write, blocked readiness guard และ forced import ด้วย `allowBlocked`
- `src/services/authService.js`
  - export `normalizeAppStateForImport` เพื่อให้ importer ใช้ normalization logic เดิมก่อน import
- `package.json`
  - เพิ่ม `npm run test:postgres-importer`
  - เพิ่ม `npm run import:postgres`
  - ผูก `test:postgres-importer` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - เพิ่มคำสั่ง dry-run/import จริง, readiness guard, `--allow-blocked` warning และ regression test

คำสั่งใช้งาน:

```text
npm run import:postgres -- --dry-run
npm run import:postgres -- --input data/app-state.json --dry-run
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database npm run import:postgres -- --input data/app-state.json
```

ผลการทดสอบ:

- `node --check src/services/postgresStateImporter.js` ผ่าน
- `node --check scripts/importAppStateToPostgres.js` ผ่าน
- `node --check scripts/postgresStateImporterRegression.js` ผ่าน
- `node --check src/services/authService.js` ผ่าน
- `npm run test:postgres-importer` ผ่าน: dryRunRecords = 3, blockedStatus = `blocked`, blockedIssues = 1
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: ยังไม่ได้ import เข้า Postgres จริงใน sandbox นี้ เพราะไม่มี database/driver `pg` ติดตั้งใน environment ปัจจุบัน แต่ importer behavior ถูกตรวจด้วย fake Postgres client แล้ว

## ผลลัพธ์ T38: Package Entitlement Enforcement

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม package entitlement policy สำหรับ Starter / Pro / Advisor
  - Starter ได้ portfolio analysis, saved snapshot, stock screener, billing, activity timeline และ customer approval decision
  - Pro เพิ่ม sector analysis, strategy simulation และ advanced action plan
  - Advisor เพิ่ม client workspace, advisor approval workflow, business metrics, audit/storage readiness, workspace management, role management และ advisor assignment
  - เพิ่ม `subscriptionEntitlementSummary`, `hasPlanEntitlement`, `requirePlanEntitlement` และ upgrade-required error แบบ `402`
  - normalize subscription เดิมให้มี `planId`, `plan`, `priceThb`, `billing`, `trialEndsAt` และ `renewsAt`
  - ให้ owner/admin เป็น platform operator override สำหรับดูแลระบบหลังบ้าน
- `src/routes/analysisRoutes.js`
  - บังคับ `analysis.run` ก่อน run analysis
  - บังคับ `simulation.run` ก่อน Strategy Simulation และคืน entitlement metadata เมื่อถูก block
- `src/routes/authRoutes.js`
  - เพิ่ม entitlement metadata ใน policy response
  - บังคับ entitlement กับ Business metrics, team workspace, approvals, audit integrity, audit trail, storage readiness และ workspace management routes
  - เพิ่ม `sendAuthError` เพื่อคืน feature/required plan/current plan เมื่อถูก block
- `src/public/app.js`
  - แสดง plan best-for, feature count และ client workspace limit ใน pricing cards
  - แสดง plan access/locked feature count ใน account panel
  - เพิ่ม upgrade card สำหรับ Sector, Simulation, Business และ Approvals เมื่อแพ็กเกจปัจจุบันยังไม่รวม feature
  - ปุ่ม upgrade ใน locked card ใช้ checkout flow เดิม
  - advisor ที่มี role แต่ยังไม่ใช่ Advisor plan จะเห็นทางเข้า Business แล้วเห็นเหตุผลว่าต้อง upgrade
- `src/public/styles.css`
  - เพิ่ม style สำหรับ plan tags และ locked upgrade card ในธีมดำ-แดง
- `scripts/entitlementPolicyRegression.js`
  - เพิ่ม regression test สำหรับ Starter/Pro/Advisor entitlement gate
  - ตรวจ owner operator override, Starter block simulation, Pro unlock simulation/sector และ Advisor unlock workspace/approval
- `scripts/tenantAccessRegression.js`, `scripts/approvalWorkflowRegression.js`
  - ปรับ test เดิมให้ advisor ที่ต้องใช้ client workspace/approval workflow อยู่แพ็กเกจ Advisor ตามกฎใหม่
- `package.json`
  - เพิ่ม `npm run test:entitlements`
  - ผูก `test:entitlements` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มความแตกต่างของแพ็กเกจ, upgrade gate, test command และ failure guide

สิทธิ์แพ็กเกจหลัก:

```text
Starter: portfolio analysis, saved snapshot, stock screener, billing history, activity timeline, customer approval decision
Pro: everything in Starter + sector analysis, strategy simulation, advanced action plan
Advisor: everything in Pro + client workspace, advisor approval workflow, business dashboard, audit/storage readiness, team/workspace management
```

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/entitlementPolicyRegression.js` ผ่าน
- `npm run test:entitlements` ผ่าน: starterFeatures = 6, proFeatures = 9, advisorFeatures = 17, Starter simulation reject requiredPlan = `pro`
- `npm run test:tenant-access` ผ่านหลังปรับ advisor ให้เป็น Advisor plan
- `npm run test:approval-workflow` ผ่านหลังปรับ advisor ให้เป็น Advisor plan
- `npm run test:web-smoke` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- HTTP gate บน server ชั่วคราวผ่าน: customer ที่ checkout เป็น Starter เรียก `/api/simulation/run` ได้ `402` และ message `Strategy simulation requires the Pro plan or higher.`
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: in-app browser screenshot QA ใช้ไม่ได้ใน sandbox รอบนี้เพราะ browser runtime เริ่มไม่สำเร็จ จึงตรวจด้วย automated web smoke และ HTTP gate แทน

## ผลลัพธ์ T39: Backup and Restore Drill

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/pathService.js`
  - เพิ่ม `BACKUP_DIR` และให้ `ensureDataDirs()` สร้าง `data/backups`
- `src/services/backupService.js`
  - เพิ่ม service สำหรับสร้าง backup ของ local app state, audit mirror และ external audit receipts
  - เขียน `manifest.json` พร้อม schema version, repository metadata, readiness summary, record counts, file size และ SHA-256 checksum
  - เพิ่ม verify flow เพื่อตรวจ manifest, supported files, file existence, checksum และ parse state ก่อน restore
  - เพิ่ม restore flow พร้อม dry-run default, `confirm` guard ก่อนเขียนจริง และ safety backup ก่อน restore
  - จำกัด restore สำหรับ `APP_STATE_REPOSITORY=local_file`; ถ้าใช้ Postgres ให้ใช้ managed snapshot หรือ `pg_dump/pg_restore`
- `scripts/backupAppState.js`
  - เพิ่ม CLI `npm run backup:state -- --reason before-deploy`
- `scripts/restoreAppStateBackup.js`
  - เพิ่ม CLI verify/dry-run/confirm เช่น `npm run restore:state -- --backup-dir data/backups/<backup-folder> --verify`
- `scripts/backupRestoreRegression.js`
  - เพิ่ม regression test ใน temporary directory สำหรับ create backup, verify, dry-run, reject restore without confirm, confirmed restore, safety backup และ checksum rejection
- `package.json`
  - เพิ่ม `npm run test:backup-restore`, `npm run backup:state`, `npm run restore:state`
  - ผูก `test:backup-restore` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคู่มือ backup/restore drill, คำสั่งใช้งาน, production note และ failure guide

ผลการทดสอบ:

- `node --check src/services/backupService.js` ผ่าน
- `node --check scripts/backupAppState.js` ผ่าน
- `node --check scripts/restoreAppStateBackup.js` ผ่าน
- `node --check scripts/backupRestoreRegression.js` ผ่าน
- `node --check src/services/pathService.js` ผ่าน
- `npm run test:backup-restore` ผ่าน: users = 2, portfolioSnapshots = 1, billingEvents = 1, restored = true, safetyBackupCreated = true
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: backup/restore ที่เพิ่มเป็น local-file drill สำหรับ state/audit files; production Postgres ยังควรมี runbook แยกสำหรับ managed snapshots, `pg_dump`, `pg_restore` และการซ้อม restore จริงใน environment production-like

## ผลลัพธ์ T40: Postgres Query-level Tenant Enforcement

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresStateRepository.js`
  - เพิ่ม `readScopedPostgresAppState` และ `readScopedStateFromPostgresClient`
  - เพิ่ม helper `postgresPlatformTenantScope` สำหรับ owner/admin style full-state visibility
  - เพิ่ม helper `postgresRestrictedTenantScope` สำหรับ scope ที่จำกัดด้วย `userIds` และ `organizationIds`
  - เพิ่ม `buildPostgresSelectQuery` เพื่อสร้าง SQL `WHERE` ก่อนดึง `record jsonb` จากฐานข้อมูล
  - restricted scope ครอบคลุม tenant-scoped collections, `users`, `organizations`, `user_sessions` และ `advisor_assignments`
  - เพิ่ม repository metadata `tenantQueryGuard` เพื่อบอกว่า adapter รองรับ scoped read แบบ SQL WHERE
- `src/services/stateRepository.js`
  - เพิ่ม `readScopedAppState(tenantScope, options)` เป็น wrapper กลาง
  - เพิ่ม metadata `scopedReads` เพื่อแยก local-file service-level filtering กับ Postgres query-level filtering
- `scripts/postgresStateRepositoryRegression.js`
  - เพิ่ม fake Postgres regression สำหรับข้อมูลหลาย organization
  - ตรวจว่า restricted scoped read ใส่ `WHERE` ทุก collection query
  - ตรวจว่า scoped read เห็นเฉพาะ advisor/customer ที่อยู่ใน scope และไม่เห็นข้อมูล customer นอก scope
  - ตรวจ platform scope ยังอ่าน full-state ได้
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย Postgres scoped read, ข้อควรระวัง production endpoint ต้อง derive scope จาก signed-in viewer, และ failure guide ของ CI

ผลการทดสอบ:

- `node --check src/services/postgresStateRepository.js` ผ่าน
- `node --check src/services/stateRepository.js` ผ่าน
- `node --check scripts/postgresStateRepositoryRegression.js` ผ่าน
- `npm run test:state-repository` ผ่าน
- `npm run test:postgres-repository` ผ่าน: scopedRead users = 2, organizations = 2, portfolioSnapshots = 1, filteredSelects = 11
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: default `readAppState()` ยังเป็น whole-state เพื่อคง migration/local-file behavior เดิม; production endpoint ที่ส่งข้อมูลเฉพาะ tenant ควรย้ายมาใช้ `readScopedAppState()` หลังคำนวณ allowed user ids และ organization ids จาก signed-in viewer แล้ว

## ผลลัพธ์ T41: SaaS Observability and Alerting Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/observabilityService.js`
  - เพิ่ม `operationalReadinessReport()` สำหรับรวม readiness ของ repository, storage, audit, external audit, payment, business signals และ dependency risk gate
  - เพิ่ม `buildOperationalReadinessReport()` เป็น pure function สำหรับ regression test
  - เพิ่ม deterministic alert rules เช่น `storage_blocked`, `audit_integrity_needs_review`, `external_audit_required_not_synced`, `payment_gateway_not_configured`, `webhook_rejection_spike`, `local_payment_gateway` และ `repository_not_production_ready`
  - สรุปสถานะเป็น `ok`, `warning` หรือ `critical` พร้อมจำนวน critical/warning/info alerts และ runbook commands
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/ops/readiness`
  - จำกัดสิทธิ์เฉพาะ owner/admin และใช้ entitlement `business.metrics`
  - anonymous ได้ `401`; customer ได้ `403`
- `src/public/app.js`
  - โหลด operational readiness พร้อม Business metrics
  - เพิ่ม metric `Ops Readiness` และ `Ops Alerts`
  - เพิ่ม Operational readiness panel และ alert cards ในหน้า Business dashboard
- `src/public/styles.css`
  - เพิ่ม style สำหรับ `.ops-alert-grid` และ `.ops-alert-card` แยก critical/warning/ok ในธีมดำ-แดง
- `scripts/observabilityRegression.js`
  - เพิ่ม regression test สำหรับ alert rules แบบ critical
  - ทดสอบ API guard anonymous/customer และ owner readiness response ใน temporary directory
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม smoke check สำหรับ `/api/ops/readiness` auth guard และ frontend/style markers
- `package.json`
  - เพิ่ม `npm run test:observability`
  - ผูกเข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย operational readiness, endpoint, alert cards, test command และ failure guide

ผลการทดสอบ:

- `node --check src/services/observabilityService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/observabilityRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:observability` ผ่าน: pureStatus = `critical`, ownerStatus = `warning`, ownerAlerts = `external_audit_disabled`, `local_payment_gateway`, `repository_not_production_ready`
- `npm run test:web-smoke` ผ่าน: ตรวจ `ops-auth-guard` และ frontend/style markers
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: readiness report เป็น foundation สำหรับ operational visibility ยังไม่ใช่ระบบ monitoring production real-time เต็มรูปแบบ; งานต่อยอดคือเชื่อม alert ไป Slack/email/APM/uptime monitor และกำหนด incident runbook

## ผลลัพธ์ T42: Production Postgres Backup Runbook and Drill Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresBackupRunbookService.js`
  - เพิ่ม `buildPostgresBackupRunbook()` สำหรับสร้าง production Postgres backup/restore runbook แบบ dry-run
  - รองรับ strategy `managed_snapshot`, `pg_dump` และ `both`
  - รองรับ retention days, RPO/RTO และ readiness checks
  - เพิ่ม `parseDatabaseUrl()` และ URL sanitization เพื่อ mask password จาก `DATABASE_URL`
  - เพิ่ม managed snapshot checklist, `pg_dump` / `pg_restore` command templates, restore drill steps และ incident checklist
  - เพิ่ม `renderPostgresBackupRunbookText()` สำหรับ output แบบอ่านง่าย
- `scripts/postgresBackupRunbook.js`
  - เพิ่ม CLI `npm run postgres:backup-runbook`
  - รองรับ `--strategy`, `--retention-days`, `--rpo-minutes`, `--rto-minutes`, `--database-url`, `--repository-adapter`, `--format json|text` และ `--strict`
  - คำสั่งนี้ไม่รัน `pg_dump`, `pg_restore`, snapshot หรือ restore writes จริง เป็น planning dry-run เท่านั้น
- `scripts/postgresBackupRunbookRegression.js`
  - เพิ่ม regression test ที่ตรวจ secret masking, strategy behavior, retention warning, backup/restore command templates และ text renderer
- `package.json`
  - เพิ่ม `npm run postgres:backup-runbook`
  - เพิ่ม `npm run test:postgres-backup-runbook`
  - ผูก test เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่งใช้งาน runbook, production guardrails, restore drill checklist, regression command และ failure guide

ตัวอย่างคำสั่ง:

```bash
npm run postgres:backup-runbook -- --strategy both --retention-days 30 --format text
```

ผลการทดสอบ:

- `node --check src/services/postgresBackupRunbookService.js` ผ่าน
- `node --check scripts/postgresBackupRunbook.js` ผ่าน
- `node --check scripts/postgresBackupRunbookRegression.js` ผ่าน
- `npm run postgres:backup-runbook -- --strategy both --retention-days 30 --database-url "postgres://stockflix:***@db.example.com:5432/stockflix_prod" --repository-adapter postgres --format text` ผ่าน และ output mask password เป็น `****`
- `npm run test:postgres-backup-runbook` ผ่าน: readyStatus = `ready`, planningStatus = `blocked`, strategy = `both`, maskedUrl = `postgres://stockflix:****@db.example.com:5432/stockflix_prod`
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- หมายเหตุ: T42 เป็น runbook/drill foundation และไม่ได้ backup/restore ฐานข้อมูลจริงใน sandbox นี้ การซ้อมจริงต้องทำใน staging/production-like environment ที่มี Postgres และ backup provider จริง

## ผลลัพธ์ T43: Production Deployment Checklist and Environment Validation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/deploymentChecklistService.js`
  - เพิ่ม `buildProductionDeploymentChecklist()` สำหรับตรวจ production readiness จาก environment variables แบบ dry-run
  - ตรวจ production essentials ได้แก่ `NODE_ENV`, `PORT`, `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL`, `DATABASE_SSL_MODE=require`, Stripe Checkout env, signed webhook secret, external audit provider, backup strategy, backup retention และ CI/preflight gates
  - คืนสถานะ `ready`, `needs_review` หรือ `blocked` พร้อม summary จำนวน ok/warning/blocker
  - เพิ่ม `renderProductionDeploymentChecklistText()` สำหรับ output แบบอ่านง่าย
  - sanitize `DATABASE_URL`, secret, password, token และ key ทุกตัวก่อนแสดงผล
- `scripts/deploymentChecklist.js`
  - เพิ่ม CLI `npm run deployment:check`
  - รองรับ `--format json|text`, `--strict` และ `--help`
  - คำสั่งนี้เป็น dry-run validation tool เท่านั้น ไม่ deploy, migrate, backup, restore หรือเรียก provider ภายนอกจริง
- `scripts/deploymentChecklistRegression.js`
  - เพิ่ม regression test สำหรับ ready/blocked cases, secret masking, text renderer, preflight/release/rollback checklist และ CLI strict exit code
- `package.json`
  - เพิ่ม `npm run deployment:check`
  - เพิ่ม `npm run test:deployment-checklist`
  - ผูก test เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่งใช้งาน deployment checklist, strict mode, production env ที่ต้องตั้ง, regression command และ failure guide

ตัวอย่างคำสั่ง:

```bash
npm run deployment:check -- --format text
```

ผลการทดสอบ:

- `node --check src/services/deploymentChecklistService.js` ผ่าน
- `node --check scripts/deploymentChecklist.js` ผ่าน
- `node --check scripts/deploymentChecklistRegression.js` ผ่าน
- `npm run deployment:check -- --format text` ผ่าน และรายงาน local environment ปัจจุบันเป็น `blocked` ตามจริง เพราะยังไม่ได้ตั้ง production env
- `npm run test:deployment-checklist` ผ่าน: readyStatus = `ready`, blockedStatus = `blocked`, readyChecks = 16, blockedBlockers = 5
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows
- หมายเหตุ: T43 ไม่ได้ deploy จริงและไม่ได้เรียก payment/audit/database provider ภายนอก เป็น environment validation แบบ dry-run สำหรับใช้ก่อน staging/production release

## ผลลัพธ์ T44: Operational Alert Delivery Webhook Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/operationalAlertDeliveryService.js`
  - เพิ่ม `buildOperationalAlertPayload()` สำหรับสร้าง payload จาก operational readiness report เดิม
  - เพิ่ม `buildOperationalAlertDeliveryPlan()` สำหรับ preview delivery config, request headers และ sanitized payload
  - เพิ่ม `deliverOperationalAlerts()` สำหรับส่ง readiness alerts ไป generic webhook แบบ opt-in
  - รองรับ disabled mode, dry-run, required mode, timeout, non-2xx handling และ `no_alerts`
  - เพิ่ม HMAC signature header `x-stockflix-ops-signature` จาก `timestamp.payload`
  - sanitize secret, token, password, key, URL query และ signature ก่อนแสดง output
  - เพิ่ม `renderOperationalAlertDeliveryText()` สำหรับ output แบบอ่านง่าย
- `scripts/operationalAlertDelivery.js`
  - เพิ่ม CLI `npm run ops:alerts`
  - รองรับ `--format json|text`, `--dry-run`, `--strict` และ `--help`
  - ใช้ readiness report เดิมจาก `operationalReadinessReport()` แล้วส่ง/preview webhook ตาม environment variables
- `scripts/operationalAlertDeliveryRegression.js`
  - เพิ่ม regression test สำหรับ disabled mode, required blocked mode, dry-run, webhook success/failure, HMAC signature, CLI strict mode, secret masking และ URL query masking
  - ใช้ local HTTP server จำลอง ไม่เรียก provider ภายนอกจริง
- `src/services/observabilityService.js`
  - เพิ่ม runbook command `npm run ops:alerts -- --dry-run --format text` ใน operational readiness report
- `src/services/deploymentChecklistService.js`
  - เพิ่ม preflight command สำหรับ preview operational alert delivery ใน production deployment checklist
- `package.json`
  - เพิ่ม `npm run ops:alerts`
  - เพิ่ม `npm run test:ops-alerts`
  - ผูก test เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่งใช้งาน, env vars, HMAC signature, dry-run/required behavior, regression command และ failure guide

ตัวอย่างคำสั่ง:

```bash
npm run ops:alerts -- --dry-run --format text
```

ผลการทดสอบ:

- `node --check src/services/operationalAlertDeliveryService.js` ผ่าน
- `node --check scripts/operationalAlertDelivery.js` ผ่าน
- `node --check scripts/operationalAlertDeliveryRegression.js` ผ่าน
- `node --check src/services/deploymentChecklistService.js` ผ่าน
- `npm run ops:alerts -- --dry-run --format text` ผ่าน และรายงาน local environment ปัจจุบันเป็น `disabled` เพราะยังไม่ได้ตั้ง webhook URL จริง
- `npm run test:ops-alerts` ผ่าน: alertCount = 5, disabledStatus = `disabled`, blockedStatus = `blocked`, cliDryRunStatus = `dry_run`
- `npm run test:deployment-checklist` ผ่านหลังเพิ่ม preflight command ใหม่
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows
- หมายเหตุ: T44 เป็น webhook foundation แบบ generic และไม่ได้ส่ง alert ไป provider ภายนอกจริงใน sandbox นี้ การเชื่อม Slack/email/APM/uptime monitor จริงต้องตั้ง `OPERATIONAL_ALERT_WEBHOOK_URL` และ `OPERATIONAL_ALERT_WEBHOOK_SECRET` ใน staging/production

## ผลลัพธ์ T45: In-app Browser Screenshot QA and Visual Polish

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/styles.css`
  - เพิ่ม guardrail ลด horizontal overflow บน mobile
  - เพิ่ม `max-width` และ `overflow-wrap` ให้ input/select/button เพื่อไม่ให้ข้อความยาวดัน layout
  - ปรับ `.section-title`, `.header-actions`, `.app-header`, `.app-shell`, `.panel`, `.hero-panel` และ `h1` ใน mobile breakpoint ให้แสดงผลกระชับขึ้น
  - เพิ่ม minimum tap target ให้ปุ่มใน view grid เหมาะกับมือถือมากขึ้น
- `scripts/frontendViewportRegression.js`
  - เพิ่ม static frontend regression สำหรับตรวจ viewport meta, responsive breakpoints, mobile section-title stacking, tap target height, button wrapping, table overflow และ key view markers
- `scripts/frontendAuthenticatedSmokeRegression.js`
  - เพิ่ม in-process authenticated smoke regression โดยใช้ temporary directory
  - สมัคร owner/customer ชั่วคราว ตรวจ owner session, owner admin metrics, owner ops readiness และยืนยันว่า customer ถูกกันออกจาก admin/ops endpoints
- `package.json`
  - เพิ่ม `npm run test:frontend-viewport`
  - เพิ่ม `npm run test:frontend-auth`
  - ผูกสองชุดนี้เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่ง regression ใหม่
  - เพิ่มคำอธิบาย frontend viewport/auth smoke และ failure guide

ผลการทดสอบ:

- `npm run test:frontend-viewport` ผ่าน: ตรวจ `viewport-meta`, `responsive-breakpoints`, `mobile-section-title`, `tap-target-height`, `button-text-wrapping`, `table-overflow`, `key-view-markers`
- `npm run test:frontend-auth` ผ่าน: owner role = `owner`, customer role = `customer`, operational readiness = `warning`, alertCount = 3
- `npm run test:web-smoke` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- พยายามเปิด in-app browser ด้วย Browser plugin แล้ว แต่ `node_repl`/browser runtime ถูก Windows sandbox บล็อกด้วยข้อความ `spawn setup refresh` จึงยังไม่ได้ screenshot จริง
- พยายามเปิด background server สำหรับ browser QA บน port ชั่วคราวแล้ว process ตายหลัง shell จบโดยไม่มี stderr เพิ่มเติม จึงไม่ใช้ผลนั้นเป็นหลักฐาน QA
- งานนี้จึงปิดด้วย fallback QA ที่ตรวจ static responsive markers, in-process authenticated/API smoke, web smoke, regression รวม และ CI quality แทน
- งานต่อยอดยังควรทำ full in-app browser screenshot QA จริงอีกครั้งเมื่อ runtime/sandbox อนุญาต โดยเฉพาะ desktop/mobile visual overlap และ console errors

## ผลลัพธ์ T46: Privacy-safe Commit and GitHub Push

สิ่งที่ทำ:

- ตรวจพบว่าไฟล์ portfolio ส่วนตัวถูก track อยู่ใน Git ได้แก่ `portfolio_aom.xlsx`, `portfolio_eak.xlsx`
- ตรวจพบ report ที่สร้างจาก portfolio เดียวกันและมีโอกาสมีข้อมูลส่วนตัว ได้แก่ `portfolio_aom_analysis_report.xlsx`, `portfolio_eak_analysis_report.xlsx`
- ถอดไฟล์ทั้ง 4 รายการออกจาก Git index แบบเก็บไฟล์จริงไว้ในเครื่องผู้ใช้
- คง `.gitignore` ที่ ignore `*.xlsx` เพื่อกัน portfolio workbook/report ใหม่ไม่ให้ถูกเพิ่มเข้า Git โดยไม่ตั้งใจ
- ปรับ `.github/workflows/quality-gate.yml` ให้ไม่ require `portfolio_aom.xlsx` หรือ `portfolio_aom_analysis_report.xlsx`
- ปรับ `scripts/comparePythonOutputs.js` ให้สร้าง synthetic portfolio workbook ใน `data/outputs` ระหว่าง test แทนการอ่านไฟล์ portfolio ส่วนตัว
- ปรับ `docs/CI_QUALITY_GATE.md` และ `plan.md` ให้บอกว่า portfolio report regression ไม่ต้องใช้ private portfolio files แล้ว
- สร้าง commit ใน clone ชั่วคราวสำเร็จด้วย message `Harden SaaS readiness and remove private portfolios`

ผลการทดสอบ:

- `node --check scripts/comparePythonOutputs.js` ผ่าน
- `npm run compare:python` ผ่าน: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `npm run ci:quality` ผ่าน

ข้อจำกัด:

- Push สำเร็จแล้วจาก PowerShell ปกติของผู้ใช้ เพราะ sandbox user ไม่มี GitHub credential จึง push เองไม่ได้
- การถอดไฟล์ออกจาก commit รอบนี้เป็นการลบออกจาก Git index/branch ปัจจุบัน ไม่ใช่การลบออกจากประวัติ Git เก่าทั้งหมด หากไฟล์เคยถูก push ไป GitHub แล้วและต้องการลบจาก history จริง ต้องทำ history rewrite แยกต่างหากพร้อมพิจารณา force push อย่างระมัดระวัง

## ผลลัพธ์ T47: Private Portfolio History Cleanup Preparation

สิ่งที่ทำ:

- ตรวจพบ `git-filter-repo` ยังไม่ได้ติดตั้งใน environment นี้
- ใช้ built-in `git filter-branch` ผ่าน Git Bash ใน clone ชั่วคราวเพื่อ rewrite history ของ refs ที่ clone มีอยู่
- ลบไฟล์ต่อไปนี้ออกจากทุก commit ของ branch `codex-node-web-app-migration` ใน clone ชั่วคราว:
  - `portfolio_aom.xlsx`
  - `portfolio_eak.xlsx`
  - `portfolio_aom_analysis_report.xlsx`
  - `portfolio_eak_analysis_report.xlsx`
- ล้าง `refs/original`, reflog และรัน `git gc --prune=now --aggressive` ใน clone ชั่วคราว
- ตรวจหลัง rewrite ด้วย `git log --all -- <files>` แล้วไม่พบไฟล์ portfolio ส่วนตัวใน history ของ clone ชั่วคราว
- ตรวจ `git ls-files -- <files>` แล้วไม่พบไฟล์ทั้ง 4 ใน index ของ clone ชั่วคราว

สถานะปัจจุบัน:

- Clone ชั่วคราวที่ rewrite แล้ว: `C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo`
- Branch ใน clone ชั่วคราว: `codex-node-web-app-migration`
- หลัง rewrite history ต้อง force push เพื่อแทนที่ branch remote
- ใช้คำสั่งแบบมี lease โดยดึง full hash ปัจจุบันจาก GitHub ก่อน เพราะหลัง rewrite แล้ว short hash `0a8096c` อาจ parse ไม่ได้ใน clone ที่ล้าง object เก่าแล้ว:

```powershell
$expected = (git ls-remote origin refs/heads/codex-node-web-app-migration).Split()[0]
if (-not $expected) { throw "Cannot read remote branch hash" }
if (-not $expected.StartsWith("0a8096c")) { Write-Host "Remote branch changed to $expected. Stop and send this output to Codex."; exit 1 }
git push "--force-with-lease=refs/heads/codex-node-web-app-migration:${expected}" origin codex-node-web-app-migration
```

ข้อจำกัด:

- งานนี้ rewrite เฉพาะ refs ที่มีใน clone ชั่วคราว ซึ่งมี branch `codex-node-web-app-migration` และ remote tracking branch เดียว ไม่ใช่ mirror clone ครบทุก branch/tag ของ GitHub
- หากต้องการลบข้อมูลออกจากทุก branch/tag/fork/PR cache บน GitHub อย่างสมบูรณ์ ควรทำ mirror clone จาก GitHub ด้วย credential ของผู้ใช้ แล้วใช้ `git-filter-repo --sensitive-data-removal` ตามคู่มือ GitHub และอาจต้องติดต่อ GitHub Support เพื่อล้าง cached PR refs/views
- Sandbox ยังไม่มี GitHub credential จึงไม่สามารถ force push เองได้ ต้องให้ผู้ใช้รันจาก PowerShell ปกติ
- หาก `git-remote-https.exe` crash ระหว่าง `git ls-remote` หรือ `git push` ให้เลี่ยง HTTPS ชั่วคราวโดยเปลี่ยน remote เป็น SSH แล้วรันคำสั่งเดิมอีกครั้ง หรือ repair/update Git for Windows ก่อนกลับมา push
- หาก SSH ขึ้น `Permission denied (publickey)` ให้สร้างหรือใช้ public key ใน `~/.ssh/*.pub`, เพิ่มใน GitHub Settings > SSH and GPG keys แล้วทดสอบ `ssh -T git@github.com` ให้ผ่านก่อน push

## ผลลัพธ์ T48: Tenant-scoped Read Adoption for Customer Workspace APIs

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/tenantScopeService.js`
  - เพิ่ม helper สำหรับสร้าง tenant scope จาก viewer role
  - รองรับ `platform` scope สำหรับ owner/admin และ `restricted` scope สำหรับ customer/advisor
  - เพิ่ม in-memory filter guard สำหรับ local-file mode เพื่อกรอง users, organizations, sessions, portfolio snapshots, billing, payment sessions, payment webhooks, advisor assignments, approvals และ audit events ตาม user/workspace ที่มองเห็นได้
- `src/services/authService.js`
  - import `readScopedAppState()` และเชื่อมกับ `tenantScopeService`
  - เพิ่ม `readScopedStateForViewer()` สำหรับ read-only service path
  - ย้าย customer/workspace read APIs สำคัญให้ใช้ scoped read wrapper ได้แก่ portfolio snapshot read, investor profile read, billing history, payment sessions, approval list, audit timeline, tenant scope summary, organizations list และ workspace users list
  - เพิ่ม `scopedRead` summary ใน `tenantAccessSummary().isolation` เพื่อให้เห็นว่า viewer ใช้ `platform` หรือ `restricted` scope
- `scripts/scopedReadRegression.js`
  - เพิ่ม regression test สำหรับตรวจว่า customer/advisor ไม่เห็นข้อมูลข้าม workspace
  - ตรวจทั้ง service APIs และ direct filter ของ `tenantScopeService`
- `package.json`
  - เพิ่ม `npm run test:scoped-read`
  - ผูก `test:scoped-read` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตคำสั่งทดสอบและ production-readiness note ให้ระบุ scoped read adoption รอบนี้

ผลการทดสอบ:

- `node --check src/services/tenantScopeService.js` ผ่าน
- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/scopedReadRegression.js` ผ่าน
- `npm run test:scoped-read` ผ่าน: owner scope = `platform`, advisor scope = `restricted` เห็น 2 users, customer scope = `restricted` เห็น 1 user
- `npm run test:tenant-access` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- Write flows ยังใช้ whole-state read/write เพื่อรักษา record อื่นไม่ให้หายจนกว่าจะออกแบบ narrower write model
- `getUserFromRequest()` ยังอ่าน session/user จาก state ปกติ จึงควรย้ายเป็น scoped/session-aware repository path เพิ่มเมื่อ production database พร้อม
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T49: Narrower State Write Model Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/statePatchService.js`
  - เพิ่ม `applyStatePatch()` สำหรับ logical patch แบบ pure function โดยไม่ mutate source state
  - รองรับ operation `upsert`, `append` และ `delete` ตาม primary key จาก schema manifest
  - รองรับ composite primary key โดยรวม key เป็น string สำหรับเทียบ record
  - เพิ่ม append-only guard สำหรับ `auditEvents`: ใช้ `append` เป็น path ปกติ, block `upsert/delete` เว้นแต่ตั้ง flag maintenance ชัดเจน
  - เพิ่ม duplicate append guard และ missing primary key guard
  - เพิ่ม `statePatchCapabilities()` เพื่อรายงาน supported operations, collection metadata, append-only guard และ production target
- `src/services/stateRepository.js`
  - เพิ่ม `patchAppState()` ที่อ่าน state ปัจจุบัน, apply logical patch, แล้วเขียนกลับผ่าน repository boundary
  - เพิ่ม `patchWrites` ใน `stateRepositoryInfo()` เพื่อบอกว่า repository รองรับ patch write foundation แล้ว
  - local file mode ยังเป็น `logical_patch_then_local_file_write` เพื่อรักษา behavior เดิม แต่เปิดทางให้ Postgres map เป็น collection-level DML ในอนาคต
- `scripts/statePatchRegression.js`
  - เพิ่ม regression test สำหรับ pure patch และ repository patch
  - ตรวจว่า upsert merge ตาม primary key, append audit event, delete billing event, preserve users/organizations, reject missing key, reject duplicate append และ reject delete append-only audit event
- `package.json`
  - เพิ่ม `npm run test:state-patch`
  - ผูก `test:state-patch` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตคำสั่งทดสอบและ production-readiness note ให้ระบุ state patch write foundation รอบนี้

ผลการทดสอบ:

- `node --check src/services/statePatchService.js` ผ่าน
- `node --check src/services/stateRepository.js` ผ่าน
- `node --check scripts/statePatchRegression.js` ผ่าน
- `npm run test:state-patch` ผ่าน: patch mode = `logical_patch_then_local_file_write`, supported operations = `upsert`, `append`, `delete`, stored users = 2, payment sessions = 1, audit events = 2
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- T49 ยังเป็น foundation: local-file mode ยังคงเขียน `app-state.json` ทั้งไฟล์หลัง apply patch เพื่อรักษา compatibility
- Business write flows ส่วนใหญ่ยังต้องทยอยย้ายมาใช้ `patchAppState()` ใน T50 เพื่อให้ production database path ลดการพึ่ง whole-state mutation จริง
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T50: Adopt Patch Writes in Critical SaaS Write Flows

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - import `patchAppState()` จาก repository layer
  - เพิ่ม helper `patchState()` และ `patchStateWithAudit()` เพื่อรวม logical patch operations กับ append-only audit event
  - `patchStateWithAudit()` จะ fallback ไป `writeState()` เฉพาะกรณี audit log ถึง `MAX_AUDIT_EVENTS` แล้วต้อง trim รายการเก่า เพื่อรักษาพฤติกรรม local-file เดิม
  - ย้าย `saveInvestorProfile()` จาก whole-state mutation/write ไปใช้ `upsert investorProfiles` + `append auditEvents`
  - ย้าย `createPaymentSession()` จาก whole-state mutation/write ไปใช้ `append paymentSessions` + `append auditEvents`
  - ย้าย `createApprovalRequest()` จาก whole-state mutation/write ไปใช้ `append approvalRequests` + `append auditEvents`
- `scripts/statePatchRegression.js`
  - เพิ่ม regression สำหรับ app write flows ที่ adopt patch แล้ว
  - ตรวจว่า investor profile, payment session creation และ approval request creation ยัง persist record ได้ครบ
  - ตรวจว่า paired audit events `profile.update`, `payment.session_created` และ `approval.request_created` ถูก append ครบ
  - ตรวจว่า users เดิมยังถูก preserve หลังหลาย patch flows
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตให้ระบุ first adopted patch write flows และ production migration path ที่เหลือ

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/statePatchRegression.js` ผ่าน
- `npm run test:state-patch` ผ่าน: stored users = 2, investor profiles = 1, payment sessions = 2, approval requests = 1, audit events = 5
- `npm run test:subscription-lifecycle` ผ่าน
- `npm run test:payment-provider` ผ่าน
- `npm run test:approval-workflow` ผ่าน
- `npm run test:tenant-access` ผ่าน
- `npm run test:scoped-read` ผ่าน
- `npm run test:storage-readiness` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- T50 ย้ายเฉพาะ write flows ความเสี่ยงต่ำชุดแรก ยังไม่ย้าย payment webhook reconciliation, billing paid/failed mutation และ approval decision เพราะ flow เหล่านั้นมี idempotency และหลาย record change ใน operation เดียว
- `patchStateWithAudit()` ยังต้อง fallback เป็น whole-state write เมื่อ audit log เต็มถึง cap เพื่อรักษา behavior การ trim รายการเก่า
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T51: Expand Patch Writes to Webhook and Decision Flows

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - ปรับ `patchStateWithAudit()` ให้รองรับ audit event หลายรายการใน patch เดียว เพื่อให้ billing audit และ payment webhook audit ต่อ hash chain ตามลำดับ
  - เพิ่ม `patchRejectedPaymentWebhook()` สำหรับ rejected signed/provider webhook path
  - ย้าย rejected webhook logging จาก `writeState()` ไปใช้ `append paymentWebhookEvents` + `append auditEvents`
  - ย้าย `processPaymentWebhookInState()` ให้บันทึกผ่าน patch operations:
    - `upsert paymentSessions`
    - `append paymentWebhookEvents`
    - `append billingEvents` เฉพาะเมื่อมี invoice ใหม่
    - `upsert users` เฉพาะเมื่อ subscription ถูก activate
    - `append auditEvents` สำหรับ `billing.checkout` และ `payment.webhook_succeeded/payment.webhook_failed`
  - เพิ่ม `createdBillingEvent` guard เพื่อกันการ append billing event ซ้ำเมื่อมี success webhook ใหม่บน session ที่ paid ไปแล้ว
  - ย้าย `decideApprovalRequest()` ไปใช้ `upsert approvalRequests` + `append auditEvents`
  - แยก `billingCheckoutAuditInput()` และ `paymentWebhookPatchOperations()` เพื่อให้ flow หลาย record อ่านง่ายขึ้น
- `scripts/subscriptionLifecycleRegression.js`
  - เพิ่มเคส signed success webhook ใหม่บน session ที่ paid แล้ว
  - ยืนยันว่า webhook ใหม่ถูกบันทึก แต่ไม่สร้าง invoice ซ้ำ และ metrics `verifiedWebhookEvents` เพิ่มตาม expected
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตให้ระบุ T51 patch write adoption สำหรับ payment webhook/billing reconciliation, rejected webhook logging และ approval decisions

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/subscriptionLifecycleRegression.js` ผ่าน
- `npm run test:subscription-lifecycle` ผ่าน: failed session = `failed`, paid session = `paid`, duplicate reconciled = true, billing events = 1, verified webhook events = 3, rejected webhook events = 4, audit integrity = `verified`
- `npm run test:payment-provider` ผ่าน
- `npm run test:approval-workflow` ผ่าน
- `npm run test:tenant-access` ผ่าน
- `npm run test:scoped-read` ผ่าน
- `npm run test:storage-readiness` ผ่าน
- `npm run test:state-patch` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- T51 ยังไม่ย้าย write flows ฝั่ง workspace/team/admin เช่น organization create/update, role update, advisor assignment และ member move ซึ่งถูกแยกเป็น T52
- `patchStateWithAudit()` ยัง fallback เป็น whole-state write เมื่อ audit append จะทำให้เกิน `MAX_AUDIT_EVENTS` เพื่อรักษา behavior local-file เดิม
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T52: Reduce Whole-state Writes in Workspace and Team Flows

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - ย้าย `createOrganization()` ไปใช้ `append organizations` + `append auditEvents`
  - ย้าย `updateOrganization()` ไปใช้ `upsert organizations` + `append auditEvents`
  - ย้าย `moveUserToOrganization()` ไปใช้ `upsert users`, `upsert organizations` และ `append auditEvents`
  - ย้าย `updateUserRole()` ไปใช้ `upsert users`, `delete advisorAssignments` เมื่อ demote advisor และ `append auditEvents`
  - ย้าย `assignAdvisor()` ไปใช้ `append/upsert/delete advisorAssignments` และ `append auditEvents`
  - รองรับกรณี reassign advisor โดย delete assignment key เดิมก่อน append assignment ใหม่ เพื่อเลี่ยง composite key เก่าค้างใน `advisorAssignments`
  - รองรับกรณี unassign advisor โดย delete assignment ที่ตรงกับ customerId และยังบันทึก audit event ผ่าน patch boundary
- `scripts/tenantAccessRegression.js`
  - เพิ่ม regression สำหรับ `createOrganization()` และ `updateOrganization()` เพื่อยืนยันว่า workspace patch writes persist ถูกต้อง
  - tenant access regression เดิมยังตรวจ role update, member move, advisor assignment, tenant metadata, visible users/workspaces และ audit integrity
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตให้ระบุ workspace/team/admin patch write adoption รอบนี้

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/tenantAccessRegression.js` ผ่าน
- `npm run test:tenant-access` ผ่าน: owner visible users = 5, advisor visible users = 2, tenant metadata gaps = 0, audit integrity = `verified`
- `npm run test:scoped-read` ผ่าน
- `npm run test:approval-workflow` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- หลัง T53 เสร็จแล้ว write flows ที่ยังเป็น whole-state ใน `authService` เหลือกลุ่ม account/portfolio เช่น `createUser()`, `loginUser()` และ `saveCustomerPortfolioSnapshot()` ซึ่งถูกแยกเป็น T54
- `patchStateWithAudit()` ยัง fallback เป็น whole-state write เมื่อ audit append จะทำให้เกิน `MAX_AUDIT_EVENTS` เพื่อรักษา behavior local-file เดิม
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T53: Reduce Whole-state Writes in Auth Session Flows

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - ย้าย `createSession()` ไปใช้ `patchAppState()` โดย `append sessions` สำหรับ session ใหม่ และ `delete sessions` สำหรับ session ที่หมดอายุก่อนสร้าง session ใหม่
  - ย้าย `logoutSession()` ไปใช้ `delete sessions` + `append auditEvents` ผ่าน `patchStateWithAudit()` โดยยังบันทึก `auth.logout`
  - ย้าย expired session cleanup ใน `getUserFromRequest()` ไปใช้ `delete sessions` ผ่าน patch boundary และยังคืน `null` เมื่อ session ไม่มีหรือหมดอายุ
  - ย้าย `recordAuditEvent()` ไปใช้ `patchStateWithAudit()` เพื่อ append standalone audit event โดยรักษา audit hash chain และ public audit output เดิม
  - กรณี `patchStateWithAudit()` ต้อง prune audit เกิน `MAX_AUDIT_EVENTS` ยัง fallback เป็น whole-state write เพื่อรักษา local-file behavior เดิม
- `scripts/statePatchRegression.js`
  - เพิ่ม regression สำหรับ create session ผ่าน `createUser()`, logout session deletion, `auth.logout` audit append, expired session cleanup และ standalone `recordAuditEvent()`
- `scripts/frontendAuthenticatedSmokeRegression.js`
  - เพิ่ม smoke test ให้ customer logout แล้วนำ cookie เก่ามาเรียก `/api/auth/me` ต้องได้ `user: null`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตให้ระบุ auth session patch write adoption และ regression coverage รอบนี้
- `plan.md`
  - ปิด T53 และเพิ่ม T54 เป็นงานถัดไปสำหรับ account/portfolio snapshot whole-state writes ที่ยังเหลือ

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/statePatchRegression.js` ผ่าน
- `node --check scripts/frontendAuthenticatedSmokeRegression.js` ผ่าน
- `npm run test:state-patch` ผ่าน: ตรวจ session create/logout/expired cleanup และ standalone audit utility ผ่าน patch boundary
- `npm run test:frontend-auth` ผ่าน: customer logout แล้ว session cookie เก่า authenticate ไม่ได้
- `npm run test:tenant-access` ผ่าน
- `npm run test:scoped-read` ผ่าน
- `npm run test:approval-workflow` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- `createUser()`, `loginUser()` และ `saveCustomerPortfolioSnapshot()` ยังมี whole-state writes ซึ่งถูกแยกเป็น T54
- `patchStateWithAudit()` ยัง fallback เป็น whole-state write เมื่อ audit append จะทำให้เกิน `MAX_AUDIT_EVENTS` เพื่อรักษา behavior local-file เดิม
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T54: Reduce Whole-state Writes in Account and Portfolio Snapshot Flows

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - ย้าย `createUser()` ไปใช้ `patchStateWithAudit()` โดย `upsert organizations`, `append users` และ `append auditEvents` สำหรับ `auth.register`
  - ย้าย `loginUser()` ไปใช้ `upsert users` เพื่อบันทึก `lastLoginAt` และ `append auditEvents` สำหรับ `auth.login`
  - ย้าย `saveCustomerPortfolioSnapshot()` ไปใช้ `upsert portfolioSnapshots` ตาม `userId` และ `append auditEvents` สำหรับ `analysis.snapshot_saved`
  - ยังคงการสร้าง session ผ่าน `createSession()` หลัง register/login เหมือนเดิม เพื่อรักษา session cookie behavior
  - ตรวจแล้ว `await writeState(state)` ใน `authService` เหลือเฉพาะ fallback ของ `patchStateWithAudit()` เมื่อ audit append ต้อง prune เกิน `MAX_AUDIT_EVENTS`
- `scripts/statePatchRegression.js`
  - เพิ่ม regression ด้วย state เปล่าสำหรับ first-owner registration, customer workspace creation, login `lastLoginAt` update, session creation หลัง login และ portfolio snapshot upsert ซ้ำโดยไม่เพิ่ม record ซ้ำ
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตให้ระบุ account/portfolio snapshot patch write adoption และ regression coverage รอบนี้
- `plan.md`
  - ปิด T54 และเพิ่ม T55 เป็นงานถัดไปสำหรับ Postgres collection-level patch write adapter prototype

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check scripts/statePatchRegression.js` ผ่าน
- `npm run test:state-patch` ผ่าน: ตรวจ account registration, login update, portfolio snapshot upsert, auth session และ standalone audit patch flows
- `npm run test:frontend-auth` ผ่าน
- `npm run test:tenant-access` ผ่าน
- `npm run test:scoped-read` ผ่าน
- `npm run test:backup-restore` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `npm run compare:python` ผ่านใน regression รวม: raw rows 108, recommended rows 108, numeric/text mismatches 0, portfolio expected rows 5, JS rows 5, portfolio sample mismatches 0
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- `patchStateWithAudit()` ยัง fallback เป็น whole-state write เมื่อ audit append จะทำให้เกิน `MAX_AUDIT_EVENTS` เพื่อรักษา behavior local-file เดิม
- `patchAppState()` ยังเป็น logical patch แล้วเขียนผ่าน repository write ทั้งก้อนใน Postgres adapter ปัจจุบัน จึงแยก T55 สำหรับ map patch writes เป็น collection-level DML จริง
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T55: Postgres Collection-level Patch Write Adapter Prototype

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresStateRepository.js`
  - เพิ่ม `patchPostgresAppState()` และ `patchStateToPostgresClient()` สำหรับ Postgres adapter
  - map logical patch operations เป็น table-level transaction: `upsert` ใช้ `INSERT ... ON CONFLICT`, `append` ใช้ plain `INSERT`, และ `delete` ใช้ `DELETE ... WHERE record_id = $1`
  - validate patch ด้วย `applyStatePatch()` ก่อนเขียนจริง เพื่อรักษา duplicate append guard, append-only guard และ behavior ของ logical patch เดิม
  - เพิ่ม repository metadata `patchWriteMode: collection_level_transaction`
- `src/services/stateRepository.js`
  - ปรับ `patchAppState()` ให้ใช้ Postgres patch write path เมื่อ `APP_STATE_REPOSITORY=postgres`
  - local-file repository ยังใช้ behavior เดิมคือ apply logical patch แล้วเขียน state ทั้งก้อน เพื่อไม่เปลี่ยนพฤติกรรมของ local demo/data file
  - mirror audit trail ก่อนส่ง patch ไป Postgres เหมือน whole-state write path เดิม
- `scripts/postgresStateRepositoryRegression.js`
  - เพิ่ม fake-client regression สำหรับ collection-level patch write
  - ตรวจ user upsert, session append/delete by `record_id`, audit append, duplicate append rejection และ append-only audit upsert rejection
  - ตรวจว่า patch write ไม่ล้าง table ทั้งก้อน เช่นไม่มี `DELETE FROM "users"` หรือ `DELETE FROM "user_sessions"` แบบ full-table clear
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตเอกสารให้ระบุ Postgres collection-level patch write prototype, mapping ของ `upsert`/`append`/`delete`, regression coverage และข้อควร validate กับ staging database จริง
- `plan.md`
  - ปิด T55, เพิ่ม T56 เป็นงานถัดไปสำหรับ Postgres patch write staging validation runbook และอัปเดต Prompt AI ส่งต่อ

ผลการทดสอบ:

- `node --check src/services/postgresStateRepository.js` ผ่าน
- `node --check src/services/stateRepository.js` ผ่าน
- `node --check scripts/postgresStateRepositoryRegression.js` ผ่าน
- `npm run test:postgres-repository` ผ่าน: `patchWrite` ได้ `upserted=1`, `appended=2`, `deleted=1`, `sessionCount=1`
- `npm run test:state-patch` ผ่าน
- `npm run test:postgres-importer` ผ่าน
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `git diff --check` ผ่าน ไม่มี whitespace error มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- T55 ยัง validate ด้วย fake Postgres client ใน regression เป็นหลัก ต้องมี T56 เพื่อทำ staging validation runbook หรือ dry-run checklist กับ production-like database จริงก่อนเปิดขาย
- `writePostgresAppState()` และ importer ยังรองรับ whole-state transaction สำหรับ import/maintenance compatibility
- T47 GitHub force push ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้ และต้องกลับไปทำเมื่อพร้อมแก้ GitHub auth/SSH/HTTPS

## ผลลัพธ์ T56: Postgres Patch Write Staging Validation Runbook

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresPatchValidationRunbookService.js`
  - เพิ่ม `buildPostgresPatchValidationRunbook()` สำหรับสร้าง readiness runbook แบบ JSON โดยไม่ต่อ database จริง
  - เพิ่ม `renderPostgresPatchValidationRunbookText()` สำหรับ output แบบอ่านง่ายใน terminal
  - ตรวจสถานะ `ready`, `needs_review`, `blocked` จาก adapter, sanitized `DATABASE_URL`, SSL mode, optional `pg` driver readiness, importer dry-run, staging import, backup/restore point, rollback approval, patch smoke approval, scoped read verification และ audit mirror verification
  - เพิ่ม patch smoke matrix สำหรับ `upsert users`, `append sessions`, `delete sessions` และ `append auditEvents`
  - เพิ่ม verification queries, rollback plan และ evidence checklist สำหรับ staging validation
- `scripts/postgresPatchValidationRunbook.js`
  - เพิ่ม CLI `npm run postgres:patch-validation` ที่รองรับ `--format json|text`, `--strict`, `--database-url`, `--repository-adapter`, `--ssl-mode`, `--backup-strategy` และ readiness flags
  - command นี้เป็น dry-run planning tool เท่านั้น ไม่ต่อ Postgres และไม่เขียนข้อมูล
- `scripts/postgresPatchValidationRunbookRegression.js`
  - เพิ่ม regression สำหรับ ready/needs_review/blocked status, CLI strict mode, patch smoke matrix, verification queries, rollback plan และ secret masking โดยไม่ต่อ database จริง
- `package.json`
  - เพิ่ม `test:postgres-patch-validation`
  - เพิ่ม `postgres:patch-validation`
  - ผูก `test:postgres-patch-validation` เข้า `test-regression` และ `ci:quality`
- `src/services/deploymentChecklistService.js`, `scripts/deploymentChecklistRegression.js`
  - เพิ่ม `npm run postgres:patch-validation -- --format text --strict` ใน deployment preflight commands และ regression coverage
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตคู่มือให้ระบุ Postgres patch validation runbook, readiness flags, secret masking, test command และ production migration path
- `plan.md`
  - ปิด T56 และเพิ่ม T57 Pending สำหรับ Postgres patch smoke execution harness แบบ dry-run-first/confirm guard

ผลการทดสอบ:

- `node --check src/services/postgresPatchValidationRunbookService.js` ผ่าน
- `node --check scripts/postgresPatchValidationRunbook.js` ผ่าน
- `node --check scripts/postgresPatchValidationRunbookRegression.js` ผ่าน
- `node --check src/services/deploymentChecklistService.js` ผ่าน
- `node --check scripts/deploymentChecklistRegression.js` ผ่าน
- `npm run test:postgres-patch-validation` ผ่าน: ready=`ready`, needsReview=`needs_review`, blocked=`blocked`, checkCount=13
- `npm run test:deployment-checklist` ผ่าน: ready=`ready`, blocked=`blocked`, readyChecks=16
- `npm run test-regression` ผ่าน และ `compare:python` ยัง mismatch 0
- `npm run ci:quality` ผ่าน รวม dependency risk gate โดยยังมี accepted moderate risks เดิมจาก `exceljs` และ transitive `uuid` ที่ยังไม่มี fix available

ข้อจำกัด:

- T56 ยังเป็น dry-run planning/runbook tool ไม่ได้ execute canary patch smoke กับ database จริง
- ก่อนเปิดขายจริงยังต้องรัน runbook ใน staging/prod-like environment พร้อม env จริง, backup id, importer evidence, scoped read evidence และ audit evidence
- งาน execute canary patch smoke จริงถูกแยกเป็น T57 เพื่อเพิ่ม `--confirm` guard และ evidence output โดยไม่ทำให้ T56 เสี่ยงเขียนข้อมูล

## ผลลัพธ์ T57: Postgres Patch Smoke Execution Harness

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/postgresPatchSmokeService.js`
  - เพิ่ม `runPostgresPatchSmoke()` สำหรับ preview หรือ execute staging canary patch smoke
  - ค่าเริ่มต้นเป็น dry-run และไม่เขียนข้อมูล ถ้าจะ execute จริงต้องมี `confirm`
  - เพิ่ม guard สำหรับ `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL`, `DATABASE_SSL_MODE`, `NODE_ENV=production`, canary ids, validation readiness และ backup evidence
  - เพิ่ม `buildCanaryPatch()` ที่สร้าง patch operations สำหรับ `upsert organizations`, `upsert users`, `append sessions`, `delete sessions` และ `append auditEvents`
  - canary audit event คำนวณ `eventHash` และ `previousHash` ให้ chain ต่อจาก audit event ล่าสุดเมื่อ execute จริง
  - output มี sanitized environment, patch operation summary, before/after collection counts, patch summary, backup evidence และ rollback reminder
- `scripts/postgresPatchSmoke.js`
  - เพิ่ม CLI `npm run postgres:patch-smoke`
  - รองรับ `--format json|text`, `--strict`, `--dry-run`, `--confirm`, `--allow-production`, `--backup-evidence`, `--validation-runbook-ready` และ canary id options
  - ถ้า strict และ readiness blocked จะ exit 1
- `scripts/postgresPatchSmokeRegression.js`
  - เพิ่ม regression สำหรับ dry-run default, production guard, confirm execution ผ่าน injected fake writer, evidence counts, audit hash chaining, CLI strict behavior และ secret masking โดยไม่ต่อ database จริง
- `package.json`
  - เพิ่ม `test:postgres-patch-smoke`
  - เพิ่ม `postgres:patch-smoke`
  - ผูก `test:postgres-patch-smoke` เข้า `test-regression` และ `ci:quality`
- `src/services/deploymentChecklistService.js`, `scripts/deploymentChecklistRegression.js`
  - เพิ่ม `npm run postgres:patch-smoke -- --format text --strict` ใน deployment preflight และ regression coverage
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`
  - อัปเดตคู่มือให้ระบุ smoke harness, guard, staging command, test command และ production migration path
- `plan.md`
  - ปิด T57 และเพิ่ม T58 Pending สำหรับ owner/admin launch evidence center บน Business dashboard

ผลการทดสอบ:

- `node --check src/services/postgresPatchSmokeService.js` ผ่าน
- `node --check scripts/postgresPatchSmoke.js` ผ่าน
- `node --check scripts/postgresPatchSmokeRegression.js` ผ่าน
- `node --check src/services/deploymentChecklistService.js` ผ่าน
- `node --check scripts/deploymentChecklistRegression.js` ผ่าน
- `npm run test:postgres-patch-validation` ผ่าน
- `npm run test:postgres-patch-smoke` ผ่าน: dryRun=`dry_run`, executed=`executed`, blocked=`blocked`, writerCalled=1, operationCount=5
- `npm run test:deployment-checklist` ผ่าน
- `npm run test-regression` ผ่าน และ `compare:python` ยัง mismatch 0
- `npm run ci:quality` ผ่าน รวม dependency risk gate โดยยังมี accepted moderate risks เดิมจาก `exceljs` และ transitive `uuid` ที่ยังไม่มี fix available

ข้อจำกัด:

- Execution จริงของ `postgres:patch-smoke -- --confirm` ยังต้องทำใน staging/prod-like environment ที่มี Postgres จริง, `pg`, backup evidence และ validation evidence พร้อม
- Regression ใช้ injected fake writer เพื่อไม่ต่อ database จริงตามข้อกำหนดความปลอดภัย
- ยังไม่ได้แสดง launch evidence checklist นี้ในหน้า Business dashboard จึงแยกเป็น T58

## ผลลัพธ์ T58: Owner Launch Evidence Center

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/launchEvidenceService.js`
  - เพิ่ม `buildLaunchEvidenceCenter()` สำหรับสร้าง checklist/evidence readiness แบบไม่รันคำสั่งจริง
  - ครอบคลุม CI quality, Postgres backup runbook, importer dry-run, patch validation, patch smoke, deployment checklist, ops alerts และ audit evidence
  - sanitize env สำคัญ เช่น `DATABASE_URL` และ key/secret ก่อนส่งออก
  - ใช้ env marker เช่น `LAUNCH_EVIDENCE_CI_QUALITY_DONE`, `POSTGRES_PATCH_VALIDATION_READY`, `LAUNCH_EVIDENCE_PATCH_SMOKE_DONE` เพื่อแสดง readiness
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/admin/launch-evidence`
  - จำกัดสิทธิ์เฉพาะ owner/admin ที่ผ่าน entitlement `business.metrics`
  - customer/advisor ถูกปฏิเสธ และ frontend ไม่สามารถรันคำสั่ง terminal ผ่าน API นี้
- `src/public/app.js`
  - เพิ่ม state/load function สำหรับ launch evidence
  - เพิ่ม Launch Evidence Center ใน Business dashboard พร้อม metric summary, evidence cards, checklist table, preflight command list และ guardrails
- `src/public/styles.css`
  - เพิ่ม responsive layout สำหรับ launch evidence cards และ command list
- `scripts/frontendAuthenticatedSmokeRegression.js`
  - ตรวจ owner เรียก `/api/admin/launch-evidence` ได้
  - ตรวจ customer ถูกปฏิเสธ
  - ตรวจ `DATABASE_URL` ถูก mask และไม่มี raw secret ใน JSON
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม frontend markers `Launch Evidence Center` และ `data-launch-evidence-center`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารให้ระบุ Launch Evidence Center, API, guardrails และ regression coverage
- `plan.md`
  - ปิด T58 และเพิ่ม T59 Pending สำหรับ Browser visual QA เมื่อเครื่องมือ browser พร้อมใช้งาน

ผลการทดสอบ:

- `node --check src/services/launchEvidenceService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/frontendAuthenticatedSmokeRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:frontend-auth` ผ่าน: ownerRole=`owner`, customerRole=`customer`, launchEvidence=`needs_evidence`
- `npm run test:web-smoke` ผ่าน
- `npm run test-regression` ผ่าน และ `compare:python` ยัง mismatch 0
- `npm run ci:quality` ผ่าน รวม dependency risk gate โดยยังมี accepted moderate risks เดิมจาก `exceljs` และ transitive `uuid` ที่ยังไม่มี fix available

ข้อจำกัด:

- รอบ T58 ยังไม่ได้ทำ visual screenshot QA จริง และรอบ T59 ภายหลังพบว่า Browser/in-app browser setup ถูก Windows sandbox block
- Launch Evidence Center แสดง command/evidence readiness เท่านั้น ไม่ execute command จาก frontend ตามข้อกำหนดความปลอดภัย
- T59 ถูกเพิ่มไว้สำหรับ visual QA และ polish บน desktop/mobile เมื่อ browser tool พร้อม

## ผลลัพธ์ T59/T60: Browser Deferred and Launch Evidence Guardrail Regression

สถานะ T59:

- พยายามต่อ Browser/in-app browser แล้ว แต่ setup ผ่าน Browser skill ล้มเหลวด้วย `windows sandbox failed: spawn setup refresh`
- ยังไม่ได้ทำ screenshot/visual QA จริง จึงบันทึก T59 เป็น `Deferred - Browser Sandbox Blocked` และไม่ปิดเป็น Done

ไฟล์และความสามารถที่เพิ่ม/แก้ใน T60:

- `src/services/launchEvidenceService.js`
  - เพิ่ม `POSTGRES_PATCH_IMPORT_DRY_RUN_DONE` ใน sanitized environment เพื่อให้ evidence marker ของ importer dry-run แสดงครบ
- `scripts/launchEvidenceCenterRegression.js`
  - เพิ่ม regression เฉพาะ Launch Evidence Center
  - ตรวจสถานะ pending เมื่อ marker ยังไม่ครบ
  - ตรวจสถานะ blocked เมื่อ patch smoke marked done แต่ไม่มี backup evidence
  - ตรวจสถานะ ready เมื่อ marker สำคัญครบ
  - ตรวจว่า `DATABASE_URL` password ไม่หลุดใน JSON/API output
  - ตรวจ owner API access, unauth 401 และ customer 403
  - ตรวจ frontend renderer markers, loading state, evidence table/command list และ CSS command wrapping/responsive grid fallback
- `package.json`
  - เพิ่ม `npm run test:launch-evidence`
  - ผูก `test:launch-evidence` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตคำสั่ง test และ coverage ของ Launch Evidence regression
- `plan.md`
  - เลื่อน T59 อย่างโปร่งใส, ปิด T60 และเพิ่ม T61 Pending สำหรับ evidence export/sign-off pack

ผลการทดสอบ:

- `node --check scripts/launchEvidenceCenterRegression.js` ผ่าน
- `node --check src/services/launchEvidenceService.js` ผ่าน
- `npm run test:frontend-auth` ผ่าน
- `npm run test:launch-evidence` ผ่าน: checked pending/blocked/ready, secret masking, renderer markers, CSS guardrails, owner/customer guard
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน รวม `test:launch-evidence`, `compare:python` mismatch 0 และ dependency risk gate ยังผ่านโดยมี accepted moderate risks เดิมจาก `exceljs` และ transitive `uuid` ที่ยังไม่มี fix available
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- T60 เป็น automated guardrail ไม่ใช่ visual screenshot QA จริง จึงยังต้องกลับมาทำ T59 เมื่อ Browser/in-app browser ใช้งานได้
- ยังไม่ได้เพิ่ม export/download evidence pack ให้ owner ใช้ส่งทีม deploy หรือ auditor จึงแยกเป็น T61

## ผลลัพธ์ T61: Launch Evidence Export and Owner Sign-off Pack

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/launchEvidenceService.js`
  - เพิ่ม `buildLaunchEvidenceSignoffPack()` สำหรับสร้าง owner/admin sign-off pack จาก Launch Evidence Center
  - เพิ่ม `renderLaunchEvidenceSignoffText()` สำหรับ export เป็น text pack ที่อ่านง่าย
  - pack รวม generated/exported time, launch status, summary, evidence items, preflight commands, sanitized environment, guardrails, sign-off checklist และ security notes
  - ยังไม่รัน terminal command จาก frontend และไม่เปิดเผย raw `DATABASE_URL` password หรือ secret
- `src/routes/authRoutes.js`
  - เพิ่ม API `GET /api/admin/launch-evidence/export?format=json`
  - เพิ่ม API `GET /api/admin/launch-evidence/export?format=text`
  - จำกัดสิทธิ์เฉพาะ owner/admin ที่ผ่าน entitlement `business.metrics`
  - ส่ง `Content-Disposition` สำหรับ download JSON/text filename
  - unsupported format เช่น `pdf` คืน 400
- `src/public/app.js`
  - เพิ่มปุ่ม `Copy sign-off pack` ใน Launch Evidence Center เพื่อ copy text pack
  - เพิ่มลิงก์ `Download JSON` สำหรับ download sign-off pack
  - เพิ่มข้อความสถานะหลัง copy และ fallback clipboard สำหรับ browser ที่ใช้ `navigator.clipboard` ไม่ได้
- `src/public/styles.css`
  - เพิ่ม layout สำหรับ action header, download link และ copy status message
- `scripts/launchEvidenceCenterRegression.js`
  - ตรวจ sign-off pack builder, text render, JSON/text export, download headers, unsupported format, owner access, customer export guard และ secret masking
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม frontend marker สำหรับ export action
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตการใช้งาน Launch Evidence export/sign-off pack และ regression coverage
- `plan.md`
  - ปิด T61 และเพิ่ม T62 Pending สำหรับ audit logged export trail

ผลการทดสอบ:

- `node --check src/services/launchEvidenceService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/launchEvidenceCenterRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:launch-evidence` ผ่าน: owner JSON/text export, customer export guard, download headers และ secret masking
- `npm run test:frontend-auth` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน รวม `test:launch-evidence`, `compare:python` mismatch 0 และ dependency risk gate ยังผ่านโดยมี accepted moderate risks เดิมจาก `exceljs` และ transitive `uuid` ที่ยังไม่มี fix available
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- Browser/in-app browser setup ยังถูก Windows sandbox block (`windows sandbox failed: spawn setup refresh`) จึงยังไม่ได้ทำ visual screenshot QA จริง และ T59 ยัง Deferred
- การ export sign-off pack ยังไม่ได้บันทึก audit event แยก จึงเพิ่ม T62 เพื่อทำ export audit trail ต่อ

## ผลลัพธ์ T62: Audit Logged Launch Evidence Export Trail

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/routes/authRoutes.js`
  - เพิ่ม audit event หลัง owner/admin export Launch Evidence sign-off pack สำเร็จ
  - action คือ `launch_evidence.export`
  - details เก็บ format (`json`/`text`), pack version, launch status, generated/exported time, ready/pending/blocked/total summary, evidence item count และ sanitized environment
  - unsupported format และ customer/advisor 403 ไม่สร้าง export audit event
- `src/public/app.js`
  - เพิ่ม JS download flow สำหรับ `Download JSON` เพื่อ fetch export, trigger download และ refresh audit events
  - `Copy sign-off pack` refresh audit events หลัง copy สำเร็จ
  - Business dashboard ใช้ `state.auditEvents` ล่าสุดก่อน metrics snapshot เพื่อให้ Recent activity แสดง export activity หลัง action สำเร็จ
  - เพิ่ม label `Launch evidence exported` และ detail summary สำหรับ audit action ใหม่
- `scripts/launchEvidenceCenterRegression.js`
  - ตรวจว่า JSON/text export สร้าง audit events 2 รายการ
  - ตรวจ format, launch status, masked `DATABASE_URL` และไม่มี raw secret ใน audit details
  - ตรวจว่า customer export guard ไม่สร้าง audit event เพิ่ม
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม frontend markers สำหรับ download flow และ `launch_evidence.export`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารให้ระบุ export audit trail และ coverage
- `plan.md`
  - ปิด T62 และเพิ่ม T63 Pending สำหรับตรวจ reference drift ของ Python comparison

ผลการทดสอบ:

- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/launchEvidenceCenterRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:launch-evidence` ผ่าน: owner JSON/text export, owner export audit events, customer export guard และ customer export no-audit-event
- `npm run test:frontend-auth` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน exit code 0 รวม dependency risk gate
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด/ข้อสังเกต:

- `npm run ci:quality` ผ่าน แต่ `compare:python` รอบนี้รายงาน raw/recommended rows 851, numeric mismatches 48 และ text mismatches 42
- Worktree ก่อนเริ่ม T62 มีไฟล์ output/reference modified อยู่แล้ว ได้แก่ `recommended_stocks.csv`, `siamchart_raw.csv`, `stock_analysis_dashboard.png` และ `__pycache__/stock_visualizer.cpython-312.pyc`
- ไม่ได้ revert ไฟล์เหล่านั้นตามกติกาไม่ลบ/ไม่ย้อนงานที่ไม่ได้ทำ จึงเพิ่ม T63 เพื่อวิเคราะห์สาเหตุแยก
- Browser/in-app browser setup ยังถูก Windows sandbox block จึงยังไม่ได้ทำ visual screenshot QA จริง และ T59 ยัง Deferred

## บันทึกความต่างผลลัพธ์ Python เดิม vs Node/Web App ใหม่

อัปเดตล่าสุด: 2026-06-11 08:05:46 +07:00

หลักฐานจากรอบล่าสุด:

- `data/outputs/t10_comparison_report.json`
  - generatedAt: `2026-06-11T01:00:54.337Z`
  - raw rows: 851
  - Python recommended rows: 851
  - JS recommended rows: 851
  - required raw columns: ไม่ขาด
  - required recommended columns: ไม่ขาด
  - formula numeric mismatches: 48
  - formula text mismatches: 42
- sample mismatch ที่เห็นชัด:
  - `TVDH`: `RSI_Score` Python=50, JS=100; `Total_Score` Python=80.25, JS=85.25; `Trend_Status` Python=`Weak Trend ⚠️`, JS=`Bearish 📉`; `Rationale` ของ JS เพิ่ม `Technical entry point`
  - `LRH`: `RSI_Score` Python=50, JS=100; `Total_Score` Python=78.55882352941177, JS=83.55882352941177; `Trend_Status` และ `Rationale` ต่างกัน
  - `CIMBT`, `OHTL`, `BLISS`, `DEXON`, `GLAND` มี pattern คล้ายกัน คือ `RSI_Score` ต่าง ทำให้ `Total_Score`, `Trend_Status`, `Rationale` ต่างตาม
- ตรวจ `Sector`, `Sector_PE`, `Sector_ROE`, `Sector_Yield` ระหว่าง `recommended_stocks.csv` และ `data/outputs/recommended_stocks_compare.csv` ใน regression compare ล่าสุด:
  - `Sector` mismatch count = 0
  - `Sector_PE` mismatch count = 0
  - `Sector_ROE` mismatch count = 0
  - `Sector_Yield` mismatch count = 0

ข้อสรุปชั่วคราว:

- ถ้าใช้ raw input เดียวกันจาก `siamchart_raw.csv` แล้วให้ Node วิเคราะห์ซ้ำผ่าน `analyzeStocks()` รอบนี้ `Sector` และ sector aggregate fields ไม่ต่างจาก Python reference
- ความต่าง `Sector` ที่ผู้ใช้สังเกตจากการ run จริงน่าจะเกิดในขั้น data source/live market data มากกว่าขั้นสูตรวิเคราะห์ เพราะ Node live data จาก Yahoo chart endpoint ไม่ได้ให้ `Sector`, `PE`, `ROE`, `Yield`, `DE` ครบเหมือน reference เดิม
- `scripts/comparePythonOutputs.js` มี note เดิมว่า Live Node market data ยังต่างจาก Python เพราะ Yahoo chart endpoint ไม่ include `PE/ROE/Yield/D/E/Sector`
- ความต่างที่ regression รอบล่าสุดนับจริงอยู่ที่ formula/text หลังใช้ raw เดียวกัน โดยจุดน่าสงสัยหลักคือ handling ของ `RSI_Score`, trend label และ rationale phrase `Technical entry point`

ผลหลังทำ T63:

- สาเหตุจริงของ numeric/text mismatch คือ JS เคย parse ค่าว่างเป็น `0` แต่ Python ใช้ `NaN`
- ผลกระทบหลักคือหุ้นที่ `RSI` ว่างได้ `RSI_Score` 100 ใน JS แต่ Python ได้ 50 ทำให้ `Total_Score`, `Trend_Status` และ `Rationale` ต่างกัน
- แก้ `src/services/stockAnalysisService.js` ให้ blank numeric กลายเป็น `NaN` เหมือน Python และแก้ CSV output ให้ `NaN` เป็น blank
- เพิ่ม sector comparison ใน `scripts/comparePythonOutputs.js` และทำให้ `compare:python` fail หาก row count, required columns, formula, sector aggregate หรือ portfolio report ต่างจาก reference
- `npm run compare:python` หลังแก้แล้วได้ formula numeric mismatches 0, formula text mismatches 0 และ sector mismatches 0

รายการที่แยกไปทำต่อใน T64:

- ตรวจ live data coverage ว่าหลัง Yahoo chart + reference fallback ยังเหลือ `Unknown` sector หรือ fundamental 0/blank แค่ไหน
- แยกให้ชัดว่าปัญหา live `Sector`/fundamental ไม่ใช่สูตรวิเคราะห์ แต่เป็นข้อจำกัดของ data source และ reference master
- ห้าม revert หรือ overwrite `recommended_stocks.csv`, `siamchart_raw.csv`, `stock_analysis_dashboard.png`, `__pycache__/stock_visualizer.cpython-312.pyc` โดยไม่ขออนุญาต เพราะเป็นไฟล์ modified อยู่ก่อนงานนี้

## ผลลัพธ์ T63: Python Comparison Reference Drift Fix

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/stockAnalysisService.js`
  - แก้ numeric parser ให้ค่าว่าง, `-`, `nan` และค่าที่ไม่ใช่เลขเป็น `NaN` แทน `0`
  - แก้ median ของชุดว่างให้เป็น `NaN` เพื่อเลี่ยง sector aggregate ปลอม
  - แก้ price position ให้ใช้ `Number.isFinite()` แทน falsy check
- `src/services/csvService.js`
  - export `NaN` เป็น cell ว่าง เพื่อให้ output CSV ตรงกับ Python reference
- `scripts/comparePythonOutputs.js`
  - เพิ่ม sector comparison สำหรับ `Sector`, `Sector_PE`, `Sector_ROE`, `Sector_Yield`
  - ทำให้ process exit fail หากพบ formula/text/sector/report mismatch
- `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`, `README.md`
  - อัปเดตคำอธิบาย comparison gate และข้อจำกัด live fundamental data

หลักฐานทดสอบ:

- `node --check src/services/stockAnalysisService.js` ผ่าน
- `node --check src/services/csvService.js` ผ่าน
- `node --check scripts/comparePythonOutputs.js` ผ่าน
- `npm run compare:python` ผ่าน: numeric 0, text 0, sector 0, portfolio report mismatch 0
- `npm run test:launch-evidence` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน

## ผลลัพธ์ T64: Live Market Data Sector/Fundamental Coverage Audit

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/marketCoverageService.js`
  - เพิ่ม report builder สำหรับตรวจ `Sector`, `PE`, `ROE`, `Yield`, `DE`
  - นับ `Unknown`, ค่าว่าง, `-`, `NaN` และเลข `0` เป็น missing หลัง fallback
  - สรุป complete coverage, missing reference rows, impacted symbols และ production recommendation
- `src/services/marketDataService.js`
  - สร้าง coverage report หลัง fetch live market data และ enrich ด้วย reference fallback
- `src/routes/analysisRoutes.js`
  - เพิ่ม output `live_market_coverage_report.json`
  - เพิ่ม endpoint `GET /api/analysis/coverage`
- `src/public/app.js`
  - เพิ่มลิงก์ download coverage report และข้อความสรุป status/coverage หลัง run analysis
- `scripts/liveMarketCoverageAudit.js`
  - เพิ่ม CLI `npm run market:coverage`
  - อ่าน `data/outputs/siamchart_raw.csv` หากมี ไม่เช่นนั้น fallback ไป `siamchart_raw.csv`
  - เขียน `data/outputs/live_market_coverage_report.json` โดยไม่เขียนทับ reference CSV หลัก
- `scripts/liveMarketCoverageRegression.js`
  - เพิ่ม regression `npm run test:market-coverage`
- `package.json`, `scripts/webAppSmokeRegression.js`, `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - ผูก regression เข้า quality gate และอัปเดตคู่มือ

ผล audit จริงจาก `npm run market:coverage`:

- rows: 851
- status: `needs_reference_enrichment`
- complete rows: 486
- complete coverage: 57.11%
- unknown sectors: 18
- missing fundamentals:
  - `PE`: 245
  - `ROE`: 39
  - `Yield`: 242
  - `DE`: 75
- missing reference rows: 0
- detail: `data/outputs/live_market_coverage_report.json`

ข้อสรุป:

- reference fallback มี symbol ครบ 851 ตัว แต่ reference master เองยังมี fundamental บาง field เป็น 0/blank
- ความต่างที่เอกเห็นเรื่อง Sector/fundamental ใน live run จึงควรแก้เชิงข้อมูล production ต่อ เช่น ทำ reference master ใน database, เพิ่ม provider fundamental data หรือทำ scheduled enrichment พร้อม freshness metadata
- ไม่ควรสรุปว่า live data เทียบ Python เดิมครบ 100% จนกว่า coverage report จะได้ status `ready`

หลักฐานทดสอบ:

- `node --check src/services/marketCoverageService.js` ผ่าน
- `node --check src/services/marketDataService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check scripts/liveMarketCoverageAudit.js` ผ่าน
- `node --check scripts/liveMarketCoverageRegression.js` ผ่าน
- `npm run test:market-coverage` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run market:coverage` ผ่านและสร้าง report
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน

## ผลลัพธ์ T66: Analysis Run Loading and Progress UX

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/index.html`
  - เพิ่มปุ่ม `#analysisSubmitButton`
  - เพิ่ม progress panel `#analysisStatusPanel` พร้อม `data-analysis-progress`
  - เพิ่ม `aria-live="polite"` และ `aria-busy` สำหรับ status ที่ screen reader อ่านได้
  - เพิ่ม step list สำหรับ `Fetching market data`, `Scoring stocks`, `Building portfolio report`
- `src/public/app.js`
  - เพิ่ม state `analysisRunning`
  - เพิ่ม `setAnalysisButtonLoading()`, `showAnalysisStatus()`, `startAnalysisProgressTimers()`
  - เมื่อกด `Analyze my portfolio` แล้วปุ่มเปลี่ยนเป็น `Analyzing...` และถูก disable ทันที
  - แสดงข้อความว่าระบบกำลังดึงข้อมูลหุ้น, คำนวณคะแนน และสร้างรายงาน
  - แสดง success state เมื่อ report พร้อม และ error state เมื่อ API/ไฟล์มีปัญหา
  - restore ปุ่มกลับเป็น `Analyze my portfolio` เสมอใน `finally`
- `src/public/styles.css`
  - เพิ่ม style สำหรับ `.analysis-status`, `.analysis-spinner`, step active/done และ responsive overflow wrapping
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`
  - เพิ่ม marker ตรวจ loading/progress UX ใน HTML/JS/CSS
- `README.md`, `docs/WEB_APP_USAGE.md`
  - อัปเดตคู่มือว่าระหว่างวิเคราะห์จะมี progress panel และไม่ควรกดซ้ำ

หลักฐานทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `analysis-loading-markers`
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน รวม regression ทั้งหมด, `compare:python` 0 mismatch และ dependency risk gate
- รอบนี้ไม่มี browser control tool สำหรับเปิด/screenshot localhost ให้ใช้โดยตรง จึงยังไม่ได้ทำ visual screenshot จริงจาก Browser plugin

## ผลลัพธ์ T65: Production Reference Master and Fundamental Enrichment Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/referenceMasterService.js`
  - เพิ่ม schema `market-reference-master-v1`
  - normalize `Symbol`, `Sector`, `PE`, `ROE`, `Yield`, `DE`, `PBV`, `High_52W`, `Low_52W`
  - เพิ่ม metadata ต่อ symbol ได้แก่ source, sourceFile, sourceRow, lastUpdated, freshnessStatus, reviewStatus และ missingFields
  - สรุป totals: totalRows, completeRows, needsReviewRows และ missingFieldCounts
- `src/services/referenceDataService.js`
  - ปรับ `loadReferenceMarketData()` ให้ใช้ `data/reference/market-reference-master.json` ก่อน
  - fallback ไป `recommended_stocks.csv` เดิมเมื่อยังไม่มี master หรือ master ยังขาดบาง field
  - normalize fallback number ให้เป็น number เมื่อเป็นตัวเลขจริง
- `scripts/importReferenceMaster.js`
  - เพิ่ม CLI `npm run reference:import`
  - รองรับ `--dry-run`, `--input`, `--output`, `--force`
  - ไม่ overwrite master เดิมหากไม่ระบุ `--force`
- `scripts/referenceMasterRegression.js`
  - เพิ่ม regression `npm run test:reference-master`
  - ตรวจ CSV import, metadata counts, master write/read, master-first fallback merge, enrichment และ CSV compatibility
- `scripts/liveMarketCoverageAudit.js`, `src/services/marketDataService.js`
  - ปรับ coverage/runtime path ให้ถือว่า reference fallback คือ `market-reference-master.json -> recommended_stocks.csv`
- `.gitignore`, `data/reference/.gitkeep`
  - เพิ่มโฟลเดอร์สำหรับ generated reference master โดย ignore ไฟล์ master จริงไม่ให้เผลอ commit snapshot
- `package.json`, `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่ม npm scripts, เอกสารการใช้งาน, regression และ failure guide

ผล import ล่าสุด:

- `npm run reference:import -- --dry-run` ผ่าน
- `npm run reference:import` ผ่านและสร้าง `data/reference/market-reference-master.json`
- rows: 851
- complete rows: 486
- needs review rows: 365
- missing fields:
  - `Sector`: 18
  - `PE`: 245
  - `ROE`: 39
  - `Yield`: 242
  - `DE`: 75

หลักฐานทดสอบ:

- `node --check src/services/referenceMasterService.js` ผ่าน
- `node --check src/services/referenceDataService.js` ผ่าน
- `node --check scripts/importReferenceMaster.js` ผ่าน
- `node --check scripts/referenceMasterRegression.js` ผ่าน
- `node --check scripts/liveMarketCoverageAudit.js` ผ่าน
- `npm run test:reference-master` ผ่าน
- `npm run test:market-coverage` ผ่าน
- `npm run market:coverage -- --input siamchart_raw.csv` ผ่าน: rows 851, missing reference rows 0
- `npm run test-regression` ผ่าน
- `npm run ci:quality` ผ่าน
- `compare:python` ยังได้ numeric/text/sector mismatch = 0

ข้อสรุป:

- ระบบมี foundation สำหรับ reference master แล้ว แต่ข้อมูลที่ import จาก CSV ยังมี 365 rows ที่ต้อง review/enrich
- งานต่อไปควรเป็น T67 เพื่อให้ owner/admin เห็นรายการ needs review, แก้ค่าพื้นฐานได้, มี audit trail และมี freshness warning ก่อนเปิดขายจริง

## ผลลัพธ์ T67: Reference Master Admin Review and Freshness Workflow

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/referenceMasterService.js`
  - เพิ่ม `referenceMasterReviewSummary()` เพื่อสรุป totals, queue ที่ต้อง review, stale rows, reviewed rows และ freshness status
  - เพิ่ม `updateReferenceMasterRecord()` เพื่อให้ owner/admin แก้/ยืนยัน `Sector`, `PE`, `ROE`, `Yield`, `DE` และ metadata ต่อ symbol
  - เพิ่ม stale threshold default 30 วัน และ summary สำหรับ Business dashboard
- `src/routes/authRoutes.js`
  - เพิ่ม `GET /api/admin/reference-master?limit=...` สำหรับ owner/admin ดู review queue และ freshness summary
  - เพิ่ม `POST /api/admin/reference-master/:symbol` สำหรับบันทึกค่าที่รีวิวแล้ว
  - บังคับ `business.metrics` entitlement และปฏิเสธ customer/advisor
  - บันทึก audit action `reference_master.review` พร้อม symbol, changed fields และ missing fields ก่อน/หลัง
- `src/public/app.js`, `src/public/index.html`, `src/public/styles.css`
  - เพิ่ม Reference Master Review panel ในหน้า Business dashboard
  - แสดง metrics เช่น reference rows, needs review, reviewed, stale rows, oldest update และ stale threshold
  - เพิ่ม table queue สำหรับแก้ `Sector`, `PE`, `ROE`, `Yield`, `DE` และ review note
  - เพิ่ม save action, error/retry state และ refresh Recent activity หลังบันทึก
  - ล้าง `referenceMaster` state หลัง logout
- `scripts/referenceMasterAdminRegression.js`
  - เพิ่ม regression สำหรับ owner review summary, owner update record, audit event และ customer guard
- `package.json`
  - เพิ่ม `npm run test:reference-master-admin`
  - ผูก `test:reference-master-admin` เข้า `test-regression`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตคู่มือ Reference Master Review, API, audit event, regression และ quality gate
- `plan.md`
  - ปิด T67 และเพิ่ม T68 สำหรับ database adapter/freshness scheduler foundation

ผลการทดสอบ:

- `node --check src/services/referenceMasterService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/referenceMasterAdminRegression.js` ผ่าน
- `npm run test:reference-master` ผ่าน
- `npm run test:reference-master-admin` ผ่าน
- `npm run test:frontend-viewport` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน
- `compare:python` ยังได้ numeric/text/sector mismatch = 0

ข้อสรุป:

- Owner/admin มี workflow สำหรับรีวิว reference master บน Business dashboard แล้ว
- ข้อมูลแก้ไขถูกบันทึกพร้อม metadata และ audit trail เพื่อให้ตรวจย้อนหลังได้
- ระบบยังเป็น file-backed JSON master; งาน production ถัดไปคือ T68 เพื่อทำ database adapter และ freshness scheduler foundation

## ผลลัพธ์ T68: Reference Master Database Adapter and Freshness Scheduler Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/referenceMasterRepository.js`
  - เพิ่ม repository/database adapter foundation สำหรับ reference master
  - เพิ่ม `referenceMasterRepositoryInfo()` เพื่อบอก adapter, supported adapters, local file path, Postgres table และ freshness report path
  - เพิ่ม Postgres bootstrap SQL สำหรับ table `reference_master_records` และ indexes หลัก
  - เพิ่ม record-level upsert/read helper ที่รับ injected client เพื่อทดสอบได้โดยไม่ต่อ database จริง
  - เพิ่ม migration dry-run plan เพื่อสรุป rows ที่จะ upsert, bootstrap statements, missing fields, stale rows และ guardrails
  - เพิ่ม freshness report builder สำหรับ stale rows, review queue, missing field counts และ recommendations
- `scripts/referenceMasterFreshnessReport.js`
  - เพิ่ม CLI `npm run reference:freshness`
  - รองรับ `--dry-run`, `--input`, `--output`, `--stale-days`, `--limit`
  - dry-run จะแสดง migration plan และ freshness report โดยไม่เขียนไฟล์
  - ถ้าไม่ dry-run จะเขียน report ไปที่ `data/reference/reference-master-freshness-report.json` ซึ่งอยู่ใน path ที่ Git ignore
- `scripts/referenceMasterDatabaseRegression.js`
  - เพิ่ม fake-client regression สำหรับ Postgres bootstrap SQL, repository info, migration dry-run, freshness report, write/read และ record upsert
- `package.json`
  - เพิ่ม `npm run test:reference-master-database`
  - เพิ่ม `npm run reference:freshness`
  - ผูก `test:reference-master-database` เข้า `test-regression`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตคำสั่ง T68, database adapter foundation, freshness report, regression และ CI quality gate
- `plan.md`
  - ปิด T68 และเพิ่ม T69 สำหรับ staging migration execution guard

ผลการทดสอบ:

- `node --check src/services/referenceMasterRepository.js` ผ่าน
- `node --check scripts/referenceMasterFreshnessReport.js` ผ่าน
- `node --check scripts/referenceMasterDatabaseRegression.js` ผ่าน
- `npm run test:reference-master` ผ่าน
- `npm run test:reference-master-admin` ผ่าน
- `npm run test:reference-master-database` ผ่าน
- `npm run reference:freshness -- --dry-run --limit 5` ผ่าน: master 851 rows, needs review 365, stale rows 0, migration dry-run upsert rows 851
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน
- `compare:python` ยังได้ numeric/text/sector mismatch = 0

ข้อสรุป:

- ระบบมี production database adapter foundation สำหรับ reference master แล้ว โดยยังไม่ต้องต่อ database จริงใน regression
- มี dry-run report ที่บอกทั้ง migration plan และ freshness/review status ของ master ปัจจุบัน
- ขั้นถัดไปควรเป็น T69 เพื่อเพิ่ม execution guard สำหรับ staging migration แบบ confirm/evidence/secret masking ก่อนใช้ database จริง

## ผลลัพธ์ T69: Reference Master Staging Migration Execution Guard

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/referenceMasterMigrationService.js`
  - เพิ่ม execution guard สำหรับ reference master migration แบบ dry-run-first
  - default เป็น dry-run และต้องใช้ `--confirm` ก่อน execute
  - เพิ่ม guard สำหรับ `REFERENCE_MASTER_REPOSITORY=postgres`, `DATABASE_URL`, `DATABASE_SSL_MODE`, staging marker, backup evidence, migration plan reviewed และ production guard
  - เพิ่ม evidence output เช่น source rows, planned upserts, before/after counts, needs review rows, stale rows และ verification checklist
  - sanitize `DATABASE_URL` และค่า secret-like keys ทุกครั้งก่อนแสดงผล
  - รองรับ injected fake client สำหรับ regression และใช้ optional `pg` เฉพาะตอน execute จริง
- `scripts/referenceMasterMigration.js`
  - เพิ่ม CLI `npm run reference:migrate`
  - รองรับ `--dry-run`, `--confirm`, `--replace`, `--allow-production`, `--input`, `--database-url`, `--repository-adapter`, `--ssl-mode`, `--node-env`, `--backup-evidence`, `--staging-ready`, `--migration-plan-reviewed`, `--format json|text`, `--strict`
- `scripts/referenceMasterMigrationRegression.js`
  - เพิ่ม regression สำหรับ dry-run guard, secret masking, production blocker, backup blocker, confirm execute path ด้วย fake client และ CLI strict behavior
- `package.json`
  - เพิ่ม `npm run reference:migrate`
  - เพิ่ม `npm run test:reference-master-migration`
  - ผูก `test:reference-master-migration` เข้า `test-regression`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตคำสั่ง migration guard, required flags, execution safety, regression และ CI quality gate
- `plan.md`
  - ปิด T69 และเพิ่ม T70 สำหรับ Launch Evidence integration

ผลการทดสอบ:

- `node --check src/services/referenceMasterMigrationService.js` ผ่าน
- `node --check scripts/referenceMasterMigration.js` ผ่าน
- `node --check scripts/referenceMasterMigrationRegression.js` ผ่าน
- `npm run test:reference-master-migration` ผ่าน
- `npm run reference:migrate -- --dry-run --repository-adapter postgres --database-url postgres://stockflix:demo-secret@db.example.com:5432/stockflix_staging --ssl-mode require --node-env staging --staging-ready --backup-evidence snapshot-reference-demo --migration-plan-reviewed --limit 5 --format json --strict` ผ่าน: status `dry_run`, planned upserts 851, needs review 365, stale rows 0 และ database password ถูก mask
- `npm run test:reference-master-database` ผ่าน
- `npm run test:reference-master-admin` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน
- `compare:python` ยังได้ numeric/text/sector mismatch = 0

ข้อสรุป:

- มี staging migration guard สำหรับ reference master แล้ว และยังไม่เขียน database หากไม่มี `--confirm`
- Execution path ถูกทดสอบด้วย fake client จึงมั่นใจเรื่อง transaction, table clear เฉพาะเมื่อ `--replace`, record-level upsert และ evidence counts
- ขั้นถัดไปควรเป็น T70 เพื่อเอาหลักฐาน reference master migration/freshness เข้า Launch Evidence Center ให้ owner/admin ตรวจ go-live readiness ได้จากหน้า Business dashboard

## ผลลัพธ์ T71: Screener Beginner Filter Tooltips

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/app.js`
  - เพิ่ม `screenerFilterTips` สำหรับอธิบาย `Min Score`, `Min RRR`, `Max D/E`, `Sector` และ `Trend` ด้วยภาษาง่าย
  - เพิ่ม helper `renderScreenerTooltip()` และ `renderScreenerFilterField()` เพื่อให้ filter ทุกตัวมี tooltip และ hint ที่ reusable
  - เพิ่ม beginner guide เหนือ filter: `Score 60+`, `RRR 1.5+`, `D/E <= 1.0` สำหรับเริ่มใช้งาน และค่าเข้มขึ้น `Score 70+`, `RRR 2.0+`, `D/E <= 0.7`
  - ใช้ `<button type="button">` เป็น tooltip trigger พร้อม `aria-describedby` เพื่อรองรับ keyboard focus
  - ไม่เปลี่ยนค่า default filter เดิมและไม่เปลี่ยนสูตรกรอง/สูตรวิเคราะห์เดิม
- `src/public/styles.css`
  - เพิ่ม layout ของ `filter-field`, `filter-label-row`, `screener-beginner-guide`, `tooltip-trigger` และ `tooltip-card`
  - ทำ tooltip ให้แสดงจาก hover/focus, ไม่ล้นด้วย `width: min(320px, calc(100vw - 48px))` และคง responsive breakpoint เดิม
- `scripts/frontendViewportRegression.js`
  - เพิ่ม marker ตรวจ beginner tooltip, recommended filter copy และ CSS tooltip guardrails
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม marker ตรวจ tooltip/guidance ผ่าน static server จริง
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารว่า Screener มี tooltip สำหรับผู้เริ่มต้น พร้อมค่าแนะนำและ coverage ของ regression
- `plan.md`
  - เพิ่ม/ปิด T71 และบันทึกผลลัพธ์พร้อมเวลา

ผลการทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `screener-beginner-tooltip-markers`
- `npm run test:web-smoke` ผ่าน
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0

ข้อจำกัด:

- Browser/in-app browser visual QA ยังไม่ได้ทำในรอบนี้ เพราะ `tool_search` ไม่พบ Browser control tool ที่ callable มีเพียง automation/sub-agent tools ถูก expose มาแทน
- T59 ยังเป็น Browser Visual QA ที่ถูก defer อยู่ หาก Browser กลับมาใช้งานได้ควรกลับมาตรวจ screenshot หน้า Screener desktop/mobile เพิ่ม

ข้อสรุป:

- หน้า Screener เหมาะกับผู้ใช้มือใหม่มากขึ้น เพราะอธิบายความหมายของ filter และบอกค่าที่ควรเริ่มลองโดยไม่เปลี่ยนผลวิเคราะห์เดิม
- หลัง T70 เสร็จ งานหลักที่เหลือคือ T47 GitHub force push/history rewrite และ T59 Browser Visual QA เมื่อ Browser พร้อม

## ผลลัพธ์ T72: Recommended Actions Table Controls

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/app.js`
  - เพิ่ม `recommendedActionFields` และ `recommendedActionSortFields` เพื่อกำหนด field ที่เลือกแสดงได้และ field ที่ใช้เรียงลำดับได้
  - ปรับหน้า Portfolio ส่วน `Recommended actions` จากตารางคงที่เป็น control panel พร้อม output container
  - เพิ่ม filter: ค้นหา Symbol, Action group (`Urgent`, `Exit/Sell`, `Reduce`, `Buy/Accumulate`, `Wait`, `Hold`), Sector, Trend และ Min Score
  - เพิ่ม Order by: Score, Market Value, Gain/Loss %, RRR, Price, Symbol และ Action Group พร้อม direction high-to-low/low-to-high
  - เพิ่ม Field picker ผ่าน `Choose fields to display` ให้เพิ่ม/ลดคอลัมน์ เช่น Market Value, P/E, ROE, D/E, RSI, Upside % ได้ โดย `Symbol` เป็น field หลักที่คงไว้
  - เพิ่ม Reset view และ status summary ว่าแสดงกี่รายการจากทั้งหมด พร้อม filter/sort ที่ใช้อยู่
  - ไม่เปลี่ยนสูตรวิเคราะห์พอร์ต, ไม่เปลี่ยน Excel report และไม่เปลี่ยน output compatibility กับ Python
- `src/public/styles.css`
  - เพิ่ม style สำหรับ `table-control-panel`, `compact-filter-bar`, `field-picker`, `field-picker-grid`, `check-option`, `control-actions` และ `table-control-status`
  - ทำ responsive fallback ให้ controls และ status ไม่ล้นบน mobile
- `scripts/frontendViewportRegression.js`
  - เพิ่ม marker ตรวจ Recommended actions controls และ CSS guardrails
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม marker ตรวจ Recommended actions controls ผ่าน static server จริง
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารว่า Recommended actions รองรับ filter/order by/field picker แล้ว และ regression coverage ตรวจ markers เหล่านี้
- `plan.md`
  - เพิ่ม/ปิด T72 และบันทึกผลลัพธ์พร้อมเวลา

ผลการทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `recommended-actions-control-markers`
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อจำกัด:

- ยังไม่ได้ทำ Browser/in-app browser visual QA เพราะ Browser control tool ไม่ถูก expose ในรอบนี้; T59 ยังเป็นงาน defer สำหรับ screenshot QA จริง

ข้อสรุป:

- ตาราง Recommended actions ใช้งานจริงได้ดีขึ้นสำหรับผู้ใช้มือใหม่และผู้ใช้ที่ต้องการคุมมุมมองเอง เช่น ดูเฉพาะ action เร่งด่วนหรือเรียงตามคะแนนสูงสุด
- หลัง T70 เสร็จ งานหลักที่เหลือคือ T47 GitHub force push/history rewrite และ T59 Browser Visual QA เมื่อ Browser พร้อม

## ผลลัพธ์ T73: Recommended Actions Initialization Bug Fix

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/public/app.js`
  - ย้าย `recommendedActionFields` และ `recommendedActionSortFields` ไปไว้ก่อน `await initialize()`
  - แก้ error `can't access lexical declaration 'recommendedActionSortFields' before initialization` ที่เกิดเมื่อหน้า Portfolio render ระหว่าง app initialization หลัง analysis หรือ saved portfolio load
  - ไม่เปลี่ยนสูตรวิเคราะห์พอร์ต, filter logic, field picker หรือ output report
- `scripts/frontendViewportRegression.js`
  - เพิ่ม `assertBefore()` เพื่อตรวจว่า `recommendedActionFields` และ `recommendedActionSortFields` ต้องอยู่ก่อน `await initialize()`
  - เพิ่ม checked marker `recommended-actions-initialization-order`
- `plan.md`
  - เพิ่ม/ปิด T73 และบันทึกผลลัพธ์พร้อมเวลา

ผลการทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `recommended-actions-initialization-order`
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

ข้อสรุป:

- หน้า Portfolio ไม่ควรเจอ TDZ error ของ `recommendedActionSortFields` ระหว่าง analysis/saved portfolio render แล้ว
- หลัง T70 เสร็จ งานหลักที่เหลือคือ T47 GitHub force push/history rewrite และ T59 Browser Visual QA เมื่อ Browser พร้อม

## ผลลัพธ์ T76: Database Mode Advisor for Owner Dashboard

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `databaseModeAdvisor` ใน `storageReadinessSummary()` และ `businessMetrics()`
  - Advisor ใช้ข้อมูลจาก `stateRepositoryInfo()` และ `buildStorageReadinessReport()`
  - แยกสถานะให้อ่านง่าย:
    - `local_file` = `prototype_only`
    - `sqlite` = `trial_only`
    - `postgres` = `needs_production_verification` หรือ `production_ready`
  - ส่งข้อมูล current adapter, best-use mode, production readiness, write mode, patch write mode, scoped reads, migration target, recommended action, commands, warnings และ blockers โดยไม่เปิดเผย secret
- `src/public/app.js`
  - เพิ่ม metric `DB Store` และ `DB Mode` ใน Business dashboard
  - เพิ่ม `renderDatabaseModeAdvisor()` พร้อม marker `data-database-mode-advisor`, `data-database-mode-commands` และ `data-database-mode-warnings`
  - แสดงคำอธิบายง่าย ๆ ว่า storage ปัจจุบันเหมาะกับ development/demo, trial/demo หรือ production
  - แสดงคำสั่งถัดไป เช่น SQLite trial setup, `sqlite:promote` dry-run, Postgres backup runbook, patch validation, patch smoke และ deployment checklist
- `src/public/styles.css`
  - เพิ่ม style สำหรับ `.database-mode-advisor`, `.mode-status`, `.advisor-warning-list` และ `.database-command-list`
  - ทำ command/warning ให้ wrap ได้และไม่ล้นบนหน้าจอเล็ก
- `scripts/storageReadinessRegression.js`
  - ตรวจว่า storage readiness payload มี database advisor และ local file mode ถูก mark เป็น `prototype_only`
  - ตรวจว่ามี command แนะนำ `APP_STATE_REPOSITORY=sqlite`
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`
  - เพิ่ม frontend/static markers สำหรับ Database Mode Advisor
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารว่ามี Database Mode Advisor ใน Business dashboard และ CI coverage ตรวจ markers แล้ว

ผลการทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/storageReadinessRegression.js` ผ่าน
- `node --check scripts/frontendViewportRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:storage-readiness` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `database-mode-advisor-markers`
- `npm run test:web-smoke` ผ่าน
- `npm run test:frontend-auth` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

หมายเหตุ:

- `npm run test:frontend-auth` รอบแรกใน parallel เจอ Windows sandbox ACL error จึง rerun แยกเดี่ยวแบบ escalated แล้วผ่าน ไม่ใช่ test failure
- T59 ยังไม่ได้ทำ screenshot QA จริงเพราะ Browser เปิด localhost/127.0.0.1 ถูกบล็อกด้วย `net::ERR_BLOCKED_BY_CLIENT`

ข้อสรุป:

- Owner/admin เห็นภาพ database readiness ชัดขึ้นจาก Business dashboard โดยไม่ต้องอ่าน env หรือ docs เอง
- งานหลักที่เหลือยังเป็น T47 GitHub force push/history rewrite ที่ผู้ใช้ให้ข้ามไว้ก่อน และ T59 Browser Visual QA ที่ยังติด local URL block

## ผลลัพธ์ T77: Production Environment Advisor for Owner Dashboard

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/deploymentChecklistService.js`
  - เพิ่ม `buildProductionEnvironmentAdvisor()` โดย reuse `buildProductionDeploymentChecklist()` เดิม
  - แปล deployment checklist เป็นสถานะ owner-friendly: `ready`, `needs_review`, `blocked`
  - ส่ง `healthLabel`, `plainLanguageSummary`, `nextAction`, blockers, warnings, groups, commands, release checklist, rollback checklist และ sanitized environment
  - จัดกลุ่ม checks เป็น Hosting environment, Production database, Payment gateway, Audit retention, Backup and restore และ Quality gate
  - เพิ่ม command `npm run deployment:check -- --format text --strict` ใน advisor command list เพื่อให้ owner/admin เห็นคำสั่งเริ่มต้นชัดเจน
- `src/services/authService.js`
  - เพิ่ม `productionEnvironmentAdvisor` เข้า payload ของ `businessMetrics()`
  - ใช้ server-side sanitized checklist จึงไม่เปิดเผย raw secret/database password ไปยัง frontend
- `src/public/app.js`
  - เพิ่ม metric `Production Env` และ `Env Blockers` ใน Business dashboard
  - เพิ่ม guidance card `Production env`
  - เพิ่ม `renderProductionEnvironmentAdvisor()` พร้อม marker `data-production-environment-advisor`, `data-production-env-groups`, `data-production-env-warnings` และ `data-production-env-commands`
  - แสดง status, blocker/warning count, next action, release/rollback guard, env group cards และ command list โดย frontend ไม่ execute command
- `src/public/styles.css`
  - เพิ่ม style สำหรับ `.production-environment-advisor`, `.env-status`, `.env-group-grid`, `.env-group-card`, `.production-env-warning-list` และ `.production-command-list`
  - เพิ่ม responsive grid fallback ให้ env group ไม่ล้นบน mobile
- `scripts/deploymentChecklistRegression.js`
  - ตรวจ ready/blocked advisor, productionReady flag, database group, command list, next action และ secret masking
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`, `scripts/frontendAuthenticatedSmokeRegression.js`
  - เพิ่ม marker regression และ owner metrics assertion สำหรับ Production Environment Advisor
  - ตรวจว่า `DATABASE_URL` password ไม่หลุดใน advisor payload
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารว่ามี Production Environment Advisor ใน Business dashboard และ CI coverage ตรวจ marker/payload แล้ว

ผลการทดสอบ:

- `node --check src/services/deploymentChecklistService.js` ผ่าน
- `node --check src/services/authService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/deploymentChecklistRegression.js` ผ่าน
- `npm run test:deployment-checklist` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `production-environment-advisor-markers`
- `npm run test:web-smoke` ผ่าน
- `npm run test:frontend-auth` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

หมายเหตุ:

- Advisor นี้เป็น dry-run/read-only guidance จาก environment variables และ checklist เดิม ไม่ deploy, migrate, backup, restore หรือส่ง webhook จริงจากหน้าเว็บ
- Browser visual screenshot QA ยังไม่ได้ทำจริงเพราะ T59 ยังติด Browser เปิด localhost/127.0.0.1 ถูกบล็อกด้วย `net::ERR_BLOCKED_BY_CLIENT`
- T47 GitHub force push/history rewrite ยังถูกเลื่อนไว้ตามคำสั่งผู้ใช้

ข้อสรุป:

- Owner/admin เห็น readiness ก่อนเปิดขายจริงชัดขึ้นใน Business dashboard โดยไม่ต้องอ่าน env/raw command เองทั้งหมด
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T78: Blank Input Template Downloads

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/inputTemplateService.js`
  - เพิ่ม `buildBlankPortfolioTemplateBuffer()` สำหรับสร้าง `portfolio_template.xlsx`
  - Excel template มี sheet `Portfolio` พร้อม header `Symbol`, `Quantity`, `Avg_Price` และไม่มี holding data แถวตัวอย่าง
  - เพิ่ม sheet `How to fill` เพื่ออธิบายความหมายของแต่ละ field โดยไม่ใส่ข้อมูลพอร์ตจริง
  - เพิ่ม `buildBlankWatchlistTemplateText()` สำหรับสร้าง `watchlist_template.txt`; ภายหลัง T79 ปรับให้มีคำแนะนำแบบ comment `#` แทนไฟล์เปล่า
- `src/routes/analysisRoutes.js`
  - เพิ่ม `GET /api/analysis/template/portfolio` เพื่อดาวน์โหลด `portfolio_template.xlsx`
  - เพิ่ม `GET /api/analysis/template/watchlist` เพื่อดาวน์โหลด `watchlist_template.txt`
  - endpoint template เป็น public download ส่วน analysis run ยังต้อง login/entitlement เหมือนเดิม
- `src/public/index.html`
  - เพิ่มกลุ่มปุ่ม `data-template-downloads` ใน panel `Run Analysis`
  - เพิ่มลิงก์ `Download blank portfolio template` และ watchlist template download
  - เพิ่มข้อความสั้น ๆ ว่า portfolio template มี header `Symbol`, `Quantity`, `Avg_Price` และ watchlist ใช้กรอก ticker ทีละบรรทัด
- `src/public/styles.css`
  - เพิ่ม `.template-downloads` ให้ปุ่ม template แตะง่าย, ไม่ล้น และอ่านง่ายบน mobile
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`
  - เพิ่ม marker regression สำหรับ template download
  - web smoke fetch template endpoint จริง, อ่าน Excel workbook แล้วตรวจว่า sheet `Portfolio` มี header ถูกต้องและไม่มี data row
  - ตรวจว่า watchlist template download filename ถูกต้อง; ภายหลัง T79 ปรับ regression ให้ตรวจคำแนะนำและ comment parsing แทนไฟล์เปล่า
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารว่ามี blank template download และ regression coverage แล้ว

ผลการทดสอบ:

- `node --check src/services/inputTemplateService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน และตรวจ `blank-template-download-markers`
- `npm run test:web-smoke` ผ่าน และตรวจ `blank-template-downloads`
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

หมายเหตุ:

- Portfolio template ไม่มีข้อมูลหุ้น/พอร์ตตัวอย่าง เพื่อเลี่ยงความเข้าใจผิดว่าเป็นคำแนะนำลงทุน และไม่มีข้อมูลส่วนตัว
- T79 ปรับ watchlist template ไม่ให้เป็นไฟล์เปล่าแล้ว โดยเพิ่ม comment instruction และ parser ignore บรรทัด `#`

ข้อสรุป:

- ผู้ใช้ใหม่สามารถโหลด template เปล่าจากหน้า Upload portfolio แล้วนำไปกรอกเองก่อนวิเคราะห์ได้แล้ว
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T79: Watchlist Template Instructions

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/inputService.js`
  - ปรับ `parseWatchlistText()` ให้ข้ามบรรทัดว่างและบรรทัดที่ขึ้นต้นด้วย `#`
  - ผู้ใช้ยังกรอก ticker จริงทีละบรรทัดได้เหมือนเดิม และระบบยัง normalize เป็นตัวใหญ่
- `src/services/inputTemplateService.js`
  - เปลี่ยน `watchlist_template.txt` จากไฟล์เปล่าเป็นไฟล์ที่มีคำแนะนำ:
    - วิธีกรอก ticker ทีละบรรทัด
    - ไม่ต้องใส่ `.BK`
    - บรรทัด `#` เป็นคำอธิบายและไม่ถูกนำไปวิเคราะห์
    - ตัวอย่างรูปแบบแบบ comment เช่น `# PTT`, `# CPALL`, `# AOT`
  - คงหลักการว่า template ไม่มี ticker จริงที่ระบบจะนำไปวิเคราะห์โดยอัตโนมัติ
- `src/public/index.html`
  - เปลี่ยนปุ่มเป็น `Download watchlist guide template`
  - ปรับคำอธิบายหน้า Upload portfolio ว่า watchlist template มี `#` instructions และ guidance สำหรับกรอก ticker ทีละบรรทัด
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`
  - เพิ่ม regression ตรวจข้อความปุ่มใหม่
  - web smoke ตรวจว่า watchlist template มีคำว่า `วิธีกรอก`, มีตัวอย่าง comment และ `parseWatchlistText()` ไม่คืน symbol จาก comment-only template
  - ตรวจว่าเมื่อผู้ใช้เพิ่ม `ptt` และ `cpall` ด้านล่าง parser คืน `PTT|CPALL`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อัปเดตเอกสารให้ตรงกับ behavior ใหม่ ไม่เรียก watchlist template ว่าไฟล์เปล่าอีก

ผลการทดสอบ:

- `node --check src/services/inputService.js` ผ่าน
- `node --check src/services/inputTemplateService.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:frontend-viewport` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

ข้อสรุป:

- ผู้ใช้ที่ดาวน์โหลด `watchlist_template.txt` จะไม่เจอไฟล์เปล่าที่งงแล้ว
- ระบบยังไม่เอาคำอธิบายหรือตัวอย่างในไฟล์ template ไปวิเคราะห์เป็นหุ้นจริง เพราะทุกบรรทัดตัวอย่างเป็น comment `#`
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T80: Public Raw CSV Download Filename

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/routes/analysisRoutes.js`
  - เปลี่ยน download filename ของ `GET /api/analysis/raw` จาก `siamchart_raw.csv` เป็น `raw_CSV.csv`
  - ยังอ่านไฟล์ภายในจาก `data/outputs/siamchart_raw.csv` เหมือนเดิม เพื่อรักษา compatibility กับ Python parity/regression และ workflow เดิม
- `src/public/app.js`
  - เปลี่ยนข้อความลิงก์หลัง run analysis เป็น `Download raw_CSV.csv`
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม smoke test สร้าง internal `data/outputs/siamchart_raw.csv` ใน temp output แล้ว fetch `/api/analysis/raw`
  - ตรวจ `Content-Disposition` ว่ามี `raw_CSV.csv`
  - ตรวจว่า public filename ไม่ expose `siamchart_raw.csv`
  - ตรวจว่า content ยังเป็น raw CSV เดิมที่ server สร้าง
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อธิบายให้ชัดว่า `siamchart_raw.csv` เป็น internal compatibility file ส่วนไฟล์ที่ผู้ใช้ดาวน์โหลดจากหน้าเว็บชื่อ `raw_CSV.csv`

ผลการทดสอบ:

- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:web-smoke` ผ่าน และตรวจ `raw-csv-public-filename`
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

ข้อสรุป:

- ผู้ใช้ดาวน์โหลด raw CSV แล้วจะเห็นชื่อไฟล์ `raw_CSV.csv` ไม่ใช่ `siamchart_raw.csv`
- ระบบภายในยังคงไฟล์ `siamchart_raw.csv` เพื่อไม่กระทบผลเทียบ Python เดิมและ regression
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T81: Coverage Report Public Raw Filename Sanitization

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/marketCoverageService.js`
  - เพิ่มการ sanitize `source.targetFile` ก่อนสร้าง live market coverage report
  - หาก target ภายในเป็น `siamchart_raw.csv` จะแสดงเป็น public filename `raw_CSV.csv`
  - sanitize `source.fallbackReference` ด้วย โดยย่อเป็นชื่อไฟล์กลาง เช่น `market-reference-master.json -> recommended_stocks.csv`
  - ตัด absolute path ออกจาก source metadata โดยใช้เฉพาะ basename เพื่อไม่ expose path ในเครื่องผู้ใช้หรือ server
- `src/services/marketDataService.js`
  - ตอน Web App สร้าง coverage report หลังดึงข้อมูลตลาด จะส่ง `publicTargetFile: "raw_CSV.csv"` เข้า report
  - ยังเขียนไฟล์ raw ภายในเป็น `data/outputs/siamchart_raw.csv` เพื่อ compatibility กับ Python parity/regression เดิม
- `scripts/liveMarketCoverageRegression.js`
  - เพิ่ม regression ตรวจว่า `report.source.targetFile` เป็น `raw_CSV.csv`
  - เพิ่ม regression ตรวจว่า `report.source.fallbackReference` ไม่ expose absolute path
  - ตรวจว่า JSON report ที่บันทึกไม่ contain ชื่อ internal `siamchart_raw.csv`
  - เพิ่ม checked markers `public-target-file-sanitization` และ `public-reference-path-sanitization`
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม smoke test สำหรับ download `/api/analysis/coverage`
  - ตรวจว่า downloaded JSON มี `"targetFile": "raw_CSV.csv"`
  - ตรวจว่า downloaded JSON ไม่ expose `siamchart_raw.csv`
  - เพิ่ม checked marker `coverage-report-public-target-file`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อธิบายให้ชัดว่า coverage report public metadata ใช้ `raw_CSV.csv`
  - ย้ำว่า `siamchart_raw.csv` เป็น internal compatibility file เท่านั้น และ source metadata ไม่ควรแสดง absolute path
- `data/outputs/live_market_coverage_report.json`
  - regenerate output จริงด้วย `npm run market:coverage`
  - ค่า `source.targetFile` เป็น `raw_CSV.csv`
  - ค่า `source.fallbackReference` เป็น `market-reference-master.json -> recommended_stocks.csv`

ผลการทดสอบ:

- `node --check src/services/marketCoverageService.js` ผ่าน
- `node --check src/services/marketDataService.js` ผ่าน
- `node --check scripts/liveMarketCoverageRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `npm run test:market-coverage` ผ่าน และตรวจ `public-target-file-sanitization` / `public-reference-path-sanitization`
- `npm run market:coverage` ผ่าน และ regenerate `data/outputs/live_market_coverage_report.json`
- `npm run test:web-smoke` ผ่าน และตรวจ `coverage-report-public-target-file`
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

ข้อสรุป:

- JSON coverage report ที่ผู้ใช้ดาวน์โหลดจะไม่เห็น `"targetFile": "D:\\...\\siamchart_raw.csv"` อีกแล้ว
- ค่า public-facing จะเป็น `"targetFile": "raw_CSV.csv"`
- source metadata จะไม่ expose absolute path ของ reference file; `fallbackReference` จะแสดงเป็น `market-reference-master.json -> recommended_stocks.csv`
- ระบบภายในยังคงไฟล์ `siamchart_raw.csv` เพื่อไม่กระทบ workflow เดิมและผลเทียบ Python
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T82: Portfolio Data Missing After Public Filename Rename

สาเหตุที่ตรวจพบ:

- หลังเปลี่ยน public filename เป็น `raw_CSV.csv` มีการ run analysis รอบที่ live market fetch ได้ `fetchedRows: 0`
- ระบบเดิมยังเขียน `data/outputs/siamchart_raw.csv` และ `data/outputs/recommended_stocks.csv` เป็นไฟล์ว่าง และยัง save portfolio snapshot ต่อด้วย market value/score เป็น 0
- ผลคือผู้ใช้เห็นหน้า Portfolio เหมือนไม่มีข้อมูลหรือมีแต่ `No Data` แม้ไฟล์ portfolio upload มี holdings จริง
- ปัญหาไม่ได้เกิดจากชื่อ download `raw_CSV.csv` โดยตรง แต่เกิดจาก zero-row live fetch ที่ระบบยอมทับ output/snapshot เดิม

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/marketDataService.js`
  - ไม่เขียน raw output ถ้า fetch ได้ 0 rows เพื่อกัน `siamchart_raw.csv` ถูกทับเป็นไฟล์ว่าง
  - ถ้า Yahoo/live fetch ล้ม แต่มี reference row ของ symbol นั้นจาก reference master/`recommended_stocks.csv` จะใช้ reference row เป็น fallback market row
  - เพิ่ม log `Using reference fallback...` เพื่อให้หน้าเว็บ/ผู้ดูแลรู้ว่ารอบนั้นใช้ข้อมูล fallback
- `src/routes/analysisRoutes.js`
  - ถ้า upload แล้วไม่พบ symbol เลย จะคืน 400 พร้อมข้อความให้กรอก `Symbol` ใน portfolio/watchlist
  - ถ้า fetch market rows ไม่ได้เลย จะคืน 502 และหยุด flow ก่อนสร้าง recommendations/report/snapshot
  - ข้อความ error บอกชัดว่า existing portfolio outputs ถูกเก็บไว้ ไม่ถูกทับด้วยไฟล์ว่าง
- `src/public/app.js`, `src/public/styles.css`
  - เพิ่ม warning ในหน้า Portfolio เมื่อ snapshot มี holdings แต่ market data ทั้งหมดเป็น 0/`No Data`
  - แจ้งผู้ใช้ว่ารอบล่าสุด market data unavailable และควร rerun เมื่อ data connection พร้อม
- `scripts/analysisPortfolioFlowRegression.js`
  - เพิ่ม regression ใหม่สำหรับ flow สมัครบัญชี, upload workbook ที่ rename แล้ว, run analysis, ตรวจ `portfolioRows`, saved snapshot, internal raw file และ public raw download filename
  - ตรวจกรณี zero-row fetch ต้อง reject และไม่ทับ raw/recommended/snapshot เดิม
  - ตรวจกรณี live fetch fail แต่มี reference rows ต้องยัง analysis สำเร็จจาก reference fallback
- `package.json`
  - เพิ่ม `npm run test:analysis-portfolio-flow`
  - ผูกเข้า `npm run test-regression` และ `npm run ci:quality`
- `scripts/frontendViewportRegression.js`, `scripts/webAppSmokeRegression.js`
  - เพิ่ม marker สำหรับ Portfolio empty-market-data warning
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - อธิบาย behavior ใหม่ของ reference fallback และ zero-row output protection

ผลการทดสอบ:

- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/services/marketDataService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/analysisPortfolioFlowRegression.js` ผ่าน
- `npm run test:analysis-portfolio-flow` ผ่าน และตรวจ `zero-row-fetch-keeps-existing-outputs`, `zero-row-fetch-keeps-existing-snapshot`, `reference-fallback-analysis`
- `npm run test:frontend-viewport` ผ่าน และตรวจ `portfolio-empty-market-data-warning`
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

ข้อสรุป:

- ต่อไปถ้า live market fetch ได้ 0 rows ระบบจะไม่ทำให้ไฟล์ output และ portfolio snapshot เดิมกลายเป็นข้อมูลว่าง
- ถ้ามี reference data ของหุ้น ระบบจะใช้ fallback เพื่อให้ Portfolio ยังแสดงข้อมูลได้ แม้ live source ใช้งานไม่ได้ชั่วคราว
- ผู้ใช้ที่มี snapshot จากรอบ fail เดิมอาจต้อง rerun analysis อีกครั้งหลัง deploy code นี้ เพื่อสร้าง snapshot ที่มี market data กลับมา
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T83: Zero-Market Portfolio Snapshot Recovery Tool

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/portfolioSnapshotRecoveryService.js`
  - เพิ่ม service สำหรับหา portfolio snapshots ที่มี holdings แต่ market value/market rows เป็น 0 หรือทุก row เป็น `No Data`
  - ใช้ reference master/`recommended_stocks.csv` ร่วมกับ `analyzeHolding()` เพื่อ rehydrate portfolio rows ให้สูตรตรงกับหน้า Portfolio
  - default เป็น dry-run และไม่เขียน state จริง
  - เมื่อใช้ `--confirm` กับ state จริง จะสร้าง safety backup ก่อนเขียน
  - แก้ guard สำคัญ: ถ้า regression/injected state ส่ง state object เข้ามา จะไม่เขียน `data/app-state.json` จริง เว้นแต่ส่ง `stateFile` ชัดเจน
- `scripts/recoverZeroMarketPortfolioSnapshots.js`
  - เพิ่ม CLI `npm run portfolio:recover-zero-market`
  - รองรับ `--format text|json`, `--user-id <id>` และ `--confirm`
- `scripts/portfolioSnapshotRecoveryRegression.js`
  - เพิ่ม regression ตรวจ dry-run detect, dry-run ไม่ mutate state, confirm repair, safety backup, healthy snapshot ไม่ถูกแก้ และ missing reference ถูก skipped
- `package.json`
  - เพิ่ม `npm run test:portfolio-recovery`
  - เพิ่ม `npm run portfolio:recover-zero-market`
  - ผูก `test:portfolio-recovery` เข้า `npm run test-regression` / `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำสั่งและคำอธิบาย recovery flow แบบ dry-run-first

การกู้ state ระหว่างทำ T83:

- ระหว่าง regression รอบแรกพบว่า confirm path เขียน `data/app-state.json` จริงจาก fixture ชั่วคราว
- ได้สำรอง fixture ที่ถูกเขียนทับไว้ที่ `data/app-state.overwritten-by-t83-fixture.json`
- กู้ `data/app-state.json` จาก clone เก่า:
  - `C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo\data\app-state.json`
  - candidate มี users 22, sessions 23, portfolio snapshots 3 และ portfolio market value ปกติ
- merge `auditEvents` จาก `data/audit-events.ndjson` ปัจจุบันกลับเข้า state หลัง restore
- state หลัง restore:
  - users 22
  - sessions 23
  - portfolio snapshots 3
  - audit events 301
  - dry-run recovery หลัง restore: checked snapshots 0, repairable 0, skipped 0

ผลการทดสอบ:

- `node --check src/services/portfolioSnapshotRecoveryService.js` ผ่าน
- `node --check scripts/recoverZeroMarketPortfolioSnapshots.js` ผ่าน
- `node --check scripts/portfolioSnapshotRecoveryRegression.js` ผ่าน
- `npm run test:portfolio-recovery` ผ่าน
- `npm run portfolio:recover-zero-market -- --format text` ผ่าน และพบว่าไม่มี zero-market snapshot ค้าง
- `npm run ci:quality` ผ่านครบ รวม `test:portfolio-recovery`, `test:analysis-portfolio-flow`, `test:web-smoke`, `compare:python` ได้ numeric/text/sector mismatch = 0 และ dependency risk ยังเป็น accepted moderate เดิมของ `exceljs`/`uuid`

ข้อสรุป:

- มีเครื่องมือ recovery สำหรับตรวจ/ซ่อม snapshot ที่ถูก zero-row market fetch ทับก่อน T82 แล้ว
- regression ใหม่ไม่ควรแตะ `data/app-state.json` จริงอีก เพราะ confirm path ของ injected state ถูก guard แล้ว
- หากต้องซ่อมข้อมูลจริงในอนาคต ให้รัน dry-run ก่อน:
  - `npm run portfolio:recover-zero-market -- --format text`
  - ถ้าผลถูกต้องค่อยรัน `npm run portfolio:recover-zero-market -- --confirm --format text`
- Task list หลักยังเหลือเฉพาะ T47 ที่ defer ขั้น GitHub force push และ T59 ที่ต้องรอ Browser/in-app browser เปิด localhost ได้

## ผลลัพธ์ T75: SQLite Trial to Postgres Promotion Runbook

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/sqlitePostgresPromotionService.js`
  - เพิ่ม service สำหรับอ่าน state จาก SQLite trial database แล้วสร้าง Postgres promotion plan
  - default เป็น dry-run และไม่เขียน Postgres ถ้าไม่มี confirm
  - ตรวจ source SQLite file, record counts, storage readiness, target `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL`, pg driver readiness, backup evidence และ dry-run review marker
  - mask `DATABASE_URL` และค่า secret-like ก่อนแสดงใน output
  - รองรับ confirm path โดย reuse `importAppStateToPostgres()` และ fake-client path สำหรับ regression
  - เพิ่ม text renderer สำหรับ evidence/runbook output ที่อ่านง่าย
- `scripts/promoteSQLiteToPostgres.js`
  - เพิ่ม CLI `npm run sqlite:promote`
  - รองรับ `--sqlite`, `--dry-run`, `--confirm`, `--allow-blocked`, `--backup-evidence`, `--promotion-reviewed`, `--pg-driver-ready` และ `--format json|text`
  - real promotion ต้องมี `--confirm` พร้อม env/evidence ที่ครบ
- `scripts/sqlitePostgresPromotionRegression.js`
  - เพิ่ม regression สร้าง SQLite ชั่วคราว, ตรวจ dry-run ready, ตรวจ missing backup blocker, ตรวจ secret masking และตรวจ confirm path ผ่าน fake Postgres client
- `src/services/sqliteStateRepository.js`
  - เพิ่ม options `databasePath` สำหรับอ่าน/เขียน SQLite แบบชี้ไฟล์ชั่วคราวใน regression โดยไม่ต้องพึ่ง env global
- `package.json`
  - เพิ่ม `sqlite:promote`
  - เพิ่ม `test:sqlite-promotion`
  - ผูก `test:sqlite-promotion` เข้า `npm run test-regression` และ `npm run ci:quality`
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มคำอธิบาย SQLite trial -> Postgres production promotion
  - เพิ่มตัวอย่าง dry-run/confirm และ required env/evidence
  - เพิ่ม troubleshooting และ CI coverage note

ตัวอย่างคำสั่ง:

```bash
npm run sqlite:promote -- --sqlite data/stockflix.sqlite --dry-run --format text
```

ก่อนย้ายจริงต้องตั้ง:

```text
APP_STATE_REPOSITORY=postgres
DATABASE_URL=postgres://user:password@host:5432/database
SQLITE_TO_POSTGRES_PG_DRIVER_READY=true
SQLITE_TO_POSTGRES_BACKUP_EVIDENCE=<snapshot-or-pgdump-id>
SQLITE_TO_POSTGRES_PROMOTION_REVIEWED=true
```

แล้วจึงรัน:

```bash
npm run sqlite:promote -- --sqlite data/stockflix.sqlite --confirm --format text
```

ผลการทดสอบ:

- `node --check src/services/sqlitePostgresPromotionService.js` ผ่าน
- `node --check scripts/promoteSQLiteToPostgres.js` ผ่าน
- `node --check scripts/sqlitePostgresPromotionRegression.js` ผ่าน
- `node --check src/services/sqliteStateRepository.js` ผ่าน
- `npm run test:sqlite-promotion` ผ่าน
- `npm run sqlite:promote -- --sqlite data/stockflix.sqlite --dry-run --format text` ผ่าน โดยรายงาน `blocked` อย่างถูกต้องเมื่อ source SQLite ยังไม่มีและ env/evidence production ยังไม่ครบ
- `npm run test:state-repository` ผ่าน
- `npm run test:state-patch` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

หมายเหตุ:

- T59 ถูก retry แล้ว Browser runtime เชื่อมได้ แต่ Browser เปิด localhost/127.0.0.1 ไม่ได้เพราะ `net::ERR_BLOCKED_BY_CLIENT`; PowerShell ตรวจ `/api/health` ผ่าน จึงเป็นข้อจำกัดของ Browser policy รอบนี้ ไม่ใช่ server
- `node:sqlite` ยังแสดง ExperimentalWarning ตามที่คาดไว้ใน Node 22+

ข้อสรุป:

- ตอนนี้ flow database ชัดขึ้น: ทดลองด้วย SQLite ได้, ก่อนขึ้น production มี dry-run/guard/evidence สำหรับ promote ไป Postgres และ CI ตรวจ path นี้แล้ว
- งานหลักที่เหลือยังเป็น T47 GitHub force push/history rewrite ที่ผู้ใช้ให้ข้ามไว้ก่อน และ T59 Browser Visual QA ที่ยังติด local URL block

## ผลลัพธ์ T74: SQLite Adapter and Database Selection Foundation

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/sqliteStateRepository.js`
  - เพิ่ม SQLite state repository adapter แบบ opt-in สำหรับช่วงทดลอง/demo โดยใช้ไฟล์ database local
  - รองรับ read/write state ตาม schema collection เดิม เช่น users, organizations, subscriptions, audit events และ customer portfolio snapshots
  - รองรับ scoped read สำหรับ tenant scope เพื่อให้ flow เดิมที่อ่านตาม organization/user ยังทำงานผ่าน repository layer ได้
  - เพิ่ม bootstrap SQL และ repository metadata สำหรับตรวจ readiness
  - default path คือ `data/stockflix.sqlite` และสามารถกำหนดเองด้วย `SQLITE_DATABASE_PATH`
- `src/services/stateRepository.js`
  - เพิ่ม `sqlite` ใน supported adapters ร่วมกับ `local_file` และ `postgres`
  - รองรับ `APP_STATE_REPOSITORY=sqlite` สำหรับทดลองระบบ
  - default ยังเป็น `local_file` เพื่อไม่กระทบการใช้งานเดิม
  - production จริงยังแนะนำ `APP_STATE_REPOSITORY=postgres`
- `scripts/stateRepositoryRegression.js`
  - เพิ่ม regression ตรวจว่า SQLite selectable, read/write state ได้, scoped read ได้, patch write ผ่าน repository path ได้ และสร้างไฟล์ database จริง
  - ตรวจ supported adapters เป็น `local_file`, `sqlite`, `postgres`
- `.gitignore`
  - ignore ไฟล์ `*.sqlite` และ `*.sqlite-*` เพื่อไม่เผลอ commit database/customer data เข้า Git
- `README.md`, `docs/WEB_APP_USAGE.md`, `docs/DATABASE_MIGRATION_FOUNDATION.md`, `docs/CI_QUALITY_GATE.md`
  - เพิ่มเอกสารการเลือก database adapter ระหว่าง local file, SQLite และ Postgres
  - เพิ่มตัวอย่าง env:
    - `APP_STATE_REPOSITORY=sqlite`
    - `SQLITE_DATABASE_PATH=data/stockflix.sqlite`
  - ระบุว่า SQLite เหมาะกับ trial/demo หรือเครื่องเดียว ส่วน Postgres เหมาะกับ production/subscription จริง

ผลการทดสอบ:

- `node --check src/services/sqliteStateRepository.js` ผ่าน
- `node --check src/services/stateRepository.js` ผ่าน
- `node --check scripts/stateRepositoryRegression.js` ผ่าน
- `npm run test:state-repository` ผ่าน และตรวจ SQLite read/write/patch path
- `npm run test:state-patch` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่านครบ รวม `compare:python` ได้ numeric/text/sector mismatch = 0
- `git diff --check` ผ่าน มีเฉพาะคำเตือน LF/CRLF จาก Git บน Windows

หมายเหตุ:

- Node.js แสดง `ExperimentalWarning: SQLite is an experimental feature` เพราะใช้ built-in `node:sqlite` ใน Node 22+; เป็น warning ที่คาดไว้สำหรับ foundation นี้
- SQLite เป็นตัวเลือกที่ดีสำหรับทดลองระบบก่อน deploy เพราะไม่ต้องติดตั้ง database server แต่ยังไม่ควรใช้เป็น production หลักถ้ามีหลาย user/subscription/customer data จริง
- เมื่อขึ้น production ให้ใช้ Postgres พร้อม backup/restore, migration evidence, tenant guard และ operational monitoring ตาม runbook ที่ทำไว้ก่อนหน้า

ข้อสรุป:

- ระบบเลือก storage ได้ชัดขึ้นเป็น 3 ระดับ: `local_file` สำหรับ dev เดิม, `sqlite` สำหรับ trial/demo และ `postgres` สำหรับ production
- หลัง T74 เสร็จ งานหลักที่เหลือยังเป็น T47 GitHub force push/history rewrite ที่ผู้ใช้ให้ข้ามไว้ก่อน และ T59 Browser Visual QA เมื่อ Browser/in-app browser พร้อมใช้งาน

## ผลลัพธ์ T70: Reference Master Launch Evidence Integration

ไฟล์และความสามารถที่เพิ่ม/แก้:

- `src/services/launchEvidenceService.js`
  - เพิ่ม Launch Evidence items สำหรับ `reference_master_freshness` และ `reference_master_migration_readiness`
  - เพิ่ม required env marker logic หลายตัวสำหรับ migration readiness ได้แก่ `REFERENCE_MASTER_MIGRATION_DRY_RUN_REVIEWED`, alias `REFERENCE_MASTER_MIGRATION_PLAN_REVIEWED`, `REFERENCE_MASTER_MIGRATION_STAGING_READY` และ `REFERENCE_MASTER_MIGRATION_BACKUP_EVIDENCE`
  - เพิ่ม marker หลัก `REFERENCE_MASTER_FRESHNESS_REVIEWED`, `REFERENCE_MASTER_FRESHNESS_REPORT_EVIDENCE` และ `REFERENCE_MASTER_MIGRATION_SIGNED_OFF`
  - เพิ่ม `referenceMaster` summary ใน Launch Evidence payload และ sign-off pack เพื่อให้ export JSON/text มี reference master evidence summary
  - ถ้า sign-off แล้วแต่ required evidence ยังขาด ระบบจะแสดง `blocked`; ถ้ายังไม่ sign-off จะแสดง `pending`; ถ้าครบจะแสดง `ready`
- `src/public/app.js`
  - เพิ่มส่วน `Reference master launch evidence` ใน Launch Evidence Center
  - เพิ่ม marker `data-reference-master-launch-evidence`
  - แสดง command/evidence summary และ required env markers โดย frontend แสดงข้อมูลอย่างเดียว ไม่ execute command
- `src/public/styles.css`
  - เพิ่ม layout สำหรับ reference launch evidence, command wrapping และ marker grid
  - เพิ่ม responsive rule ให้ marker/grid stack เป็นคอลัมน์เดียวบนจอเล็ก
- `scripts/launchEvidenceCenterRegression.js`
  - เพิ่ม regression สำหรับ pending, blocked reference master migration readiness, ready evidence, reference master summary, sign-off export, secret masking และ owner/customer guard
- `scripts/frontendViewportRegression.js`
  - เพิ่ม marker `reference-master-launch-evidence-markers`
- `scripts/webAppSmokeRegression.js`
  - เพิ่ม frontend bundle marker สำหรับ `Reference master launch evidence` และ `data-reference-master-launch-evidence`
- `README.md`
  - อธิบายว่า Launch Evidence Center รวม Reference Master freshness/migration readiness แล้ว
- `docs/WEB_APP_USAGE.md`
  - เพิ่มรายการ evidence ใหม่, env markers และวิธีใช้หลังรีวิว `reference:freshness` / `reference:migrate -- --dry-run`
- `docs/CI_QUALITY_GATE.md`
  - เพิ่ม troubleshooting และ coverage note สำหรับ reference master launch evidence markers

ผลการทดสอบ:

- `node --check src/services/launchEvidenceService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check scripts/launchEvidenceCenterRegression.js` ผ่าน
- `node --check scripts/webAppSmokeRegression.js` ผ่าน
- `node --check scripts/frontendViewportRegression.js` ผ่าน
- `npm run test:launch-evidence` ผ่าน
- `npm run test:frontend-viewport` ผ่าน
- `npm run test:web-smoke` ผ่าน
- `npm run ci:quality` ผ่าน
- `git diff --check` ผ่าน โดยเหลือเฉพาะ warning LF/CRLF จาก Git บน Windows

หมายเหตุ:

- `compare:python` ใน `npm run ci:quality` ยังผ่าน โดย raw rows 108, recommended rows python=108/js=108, formula mismatch 0, sector mismatch 0 และ portfolio report sample mismatch 0
- T70 เสร็จแล้ว งานที่ยังเหลือใน task list หลักคือ T47 ที่ defer เฉพาะ GitHub force push/history rewrite และ T59 ที่ต้องรอ Browser/in-app browser ใช้งานได้สำหรับ visual QA จริง

## ผลลัพธ์ T04: Node.js Scaffolding

ไฟล์และโฟลเดอร์ที่เพิ่ม:

- `package.json`
  - scripts: `start`, `dev`, `check`
  - dependencies ปัจจุบัน: `express`, `multer`, `exceljs`
- `src/server.js`
  - สร้าง Express app
  - serve static frontend จาก `src/public`
  - เพิ่ม health endpoint ที่ `/api/health`
  - mount routes ที่ `/api`
- `src/routes/analysisRoutes.js`
  - เพิ่ม route placeholder สำหรับ `/api/analysis/run`
  - เพิ่ม route placeholder สำหรับ `/api/analysis/outputs`
- `src/services/marketDataService.js`
  - stub สำหรับ T05
- `src/services/stockAnalysisService.js`
  - stub สำหรับ T06
- `src/services/portfolioService.js`
  - stub สำหรับ T07
- `src/services/simulationService.js`
  - stub สำหรับ T09
- `src/services/csvService.js`
  - helper แปลง array of objects เป็น CSV
- `src/public/index.html`
  - หน้าเริ่มต้นสำหรับ upload และเลือก dashboard view
- `src/public/styles.css`
  - style พื้นฐานแบบ responsive
- `src/public/app.js`
  - check health และ interaction placeholder
- `data/uploads/.gitkeep`
- `data/outputs/.gitkeep`

ไฟล์ที่แก้:

- `.gitignore`
  - ignore ไฟล์จริงใน `data/uploads` และ `data/outputs`
  - ยกเว้น `.gitkeep`

ผลตรวจ:

- `node --check src/server.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน

ข้อจำกัดตอนนี้:

- ยังไม่ได้ต่อ workflow วิเคราะห์จริง
- route `/api/analysis/run` ต่อ market data และ stock scoring แล้ว แต่ portfolio report ยังรอ T07

## ผลลัพธ์ T05: Market Data Service

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/inputService.js`
  - อ่าน watchlist text file
  - อ่าน portfolio Excel ด้วย `exceljs`
  - รวม symbol จาก watchlist และ portfolio
  - ใช้ default symbols ถ้าไม่มี input
- `src/services/pathService.js`
  - กำหนด `data/uploads` และ `data/outputs`
  - สร้าง helper สำหรับ output path
- `src/services/marketDataService.js`
  - ดึงข้อมูลหุ้นไทยจาก Yahoo chart endpoint โดยใช้ `{SYMBOL}.BK`
  - คำนวณ RSI จากราคาปิดย้อนหลัง 1 เดือน
  - คำนวณ average volume 10 วัน
  - เขียน raw CSV ผ่าน `csvService`
- `src/routes/analysisRoutes.js`
  - รับ upload `watchlist` และ `portfolio` ผ่าน `multer`
  - เรียก collect symbols และ fetch market data
  - สร้าง `data/outputs/siamchart_raw.csv`
  - เพิ่ม download route `/api/analysis/raw`
- `src/public/app.js`
  - ต่อ form upload ให้เรียก `/api/analysis/run`
  - แสดงจำนวนหุ้นที่ fetch ได้และ link download raw CSV
- `.gitignore`
  - เพิ่ม `node_modules/`
  - เพิ่ม `.npm-cache/`

Dependency changes:

- ติดตั้ง dependencies ผ่าน `npm install --cache .\.npm-cache`
- อัปเกรด `multer` เป็น 2.x
- ถอด `xlsx`
- เพิ่ม `exceljs`
- ถอด `yahoo-finance2`

ผลทดสอบ:

- `node --check src/services/marketDataService.js` ผ่าน
- `node --check src/services/inputService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน
- อ่าน symbols จาก `watchlist.txt` + `portfolio.xlsx` ได้ 909 symbols
- ทดสอบ `calculateRsi` ได้ผลลัพธ์ `71.43` จาก sample input
- ทดสอบดึงข้อมูลจริง `PTT` สำเร็จ และเขียน `data/outputs/siamchart_raw_test.csv`

ตัวอย่าง raw row จาก `PTT`:

```json
{
  "Symbol": "PTT",
  "Sector": "Unknown",
  "Price": 36.5,
  "PE": 0,
  "PBV": 0,
  "Yield": 0,
  "ROE": 0,
  "DE": 0,
  "High_52W": 38,
  "Low_52W": 29.5,
  "RSI": 42.857142857142854,
  "Volume": 85138357,
  "Avg_Vol_10D": 55244485.7
}
```

ข้อจำกัดที่ต้องจำไว้:

- Yahoo chart endpoint ไม่ให้ fundamental fields เช่น `PE`, `PBV`, `Yield`, `ROE`, `DE`, `Sector`
- ตอนนี้ field เหล่านี้จึง fallback เป็น `0` หรือ `Unknown`
- T06 ต้องคำนึงว่าการให้คะแนนจาก fundamental จะยังไม่เทียบเท่า Python เดิมถ้าไม่มี source เพิ่มเติม
- การเปิด server แบบ background เพื่อทดสอบ `/api/health` ถูก sandbox บล็อก จึงยังไม่ได้ทดสอบ API ผ่าน HTTP เต็มรูปแบบ
- `npm audit --audit-level=high` ไม่พบ high severity หลังเปลี่ยนจาก `xlsx` เป็น `exceljs`
- ยังมี moderate severity จาก dependency ย่อย `uuid` ของ `exceljs` และ npm แจ้งว่าไม่มี fix ที่ไม่กระทบ breaking change

## ผลลัพธ์ T06: Stock Analysis Service

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/stockAnalysisService.js`
  - เพิ่ม `analyzeStocks`
  - เพิ่ม `analyzeStockRow`
  - Port สูตร sector median, scoring, price zones, risk/reward, trend status และ rationale
  - เขียน `recommended_stocks.csv` ผ่าน `csvService`
- `src/routes/analysisRoutes.js`
  - หลัง fetch raw market data แล้วเรียก `analyzeStocks`
  - สร้าง `data/outputs/recommended_stocks.csv`
  - เพิ่ม route download `/api/analysis/recommended`
- `src/public/app.js`
  - แสดงจำนวน scored rows
  - เพิ่ม link download `recommended_stocks.csv`

ผลทดสอบ:

- `node --check src/services/stockAnalysisService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน
- ทดสอบดึง `PTT` แล้วส่งต่อเข้า analyzer สำเร็จ
- สร้าง `data/outputs/recommended_stocks_test.csv` สำเร็จ

ตัวอย่างผลวิเคราะห์ `PTT`:

```json
{
  "Symbol": "PTT",
  "Total_Score": 63.26470588235294,
  "Price_Position": 82.35294117647058,
  "RSI_Score": 70,
  "Relative_Quality_Score": 50,
  "Entry_Zone_High": 30.975,
  "Exit_Zone_Low": 36.86,
  "Stop_Loss": 28.025,
  "Upside_Pct": 0.9863013698630121,
  "RRR": 0.04247787610619461,
  "Trend_Status": "Weak Trend ⚠️",
  "Rationale": "Strong balance sheet"
}
```

ข้อจำกัดที่ต้องจำไว้:

- สูตรถูก port แล้ว แต่ผลคะแนนยังไม่เทียบเท่า Python 100% เพราะ T05 ยังไม่มี fundamental data จาก Yahoo เช่น `PE`, `ROE`, `Yield`, `DE`, `Sector`
- ค่า fallback ปัจจุบันทำให้หุ้นหลายตัวอาจได้ `PE_Score` สูงผิดธรรมชาติถ้า `PE = 0`
- T10 ต้องเทียบ sample outputs อย่างจริงจัง และควรตัดสินใจว่าจะหา source fundamental เพิ่มหรือปรับ fallback scoring

## ผลลัพธ์ T07: Portfolio Report Service

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/portfolioService.js`
  - อ่าน portfolio Excel ด้วย `exceljs`
  - คำนวณ `Market_Value`, `Cost_Value`, `Gain_Loss_Value`, `Gain_Loss_Pct`
  - คำนวณ `Recovery_Pct` และ `Suggested_Shares`
  - Port logic `Advice`
  - Port logic `Target_Action`
  - สร้าง `Entry_Zone` และ `Exit_Zone` แบบข้อความ
  - สร้าง Excel report 2 sheets: `Portfolio Analysis` และ `How to Read`
- `src/services/inputService.js`
  - export `normalizeExcelValue` เพื่อ reuse ตอนอ่าน portfolio
- `src/routes/analysisRoutes.js`
  - ถ้ามี portfolio upload จะสร้าง `{portfolio_name}_analysis_report.xlsx`
  - เพิ่ม route download `/api/analysis/report/:fileName`
- `src/public/app.js`
  - แสดง link download portfolio report ถ้าสร้างสำเร็จ

ผลทดสอบ:

- `node --check src/services/portfolioService.js` ผ่าน
- `node --check src/services/inputService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน
- ทดสอบสร้าง `data/outputs/portfolio_test_analysis_report.xlsx` จาก `portfolio.xlsx` สำเร็จ
- อ่าน workbook กลับแล้วพบ sheets: `Portfolio Analysis`, `How to Read`
- `Portfolio Analysis` มี 15 rows รวม header จาก portfolio sample 14 holdings

ตัวอย่างผลวิเคราะห์ holding `ACE`:

```json
{
  "Symbol": "ACE",
  "Quantity": 500,
  "Avg_Price": 2.13,
  "Price": 1.28,
  "Cost_Value": 1065,
  "Market_Value": 640,
  "Gain_Loss_Value": -425,
  "Gain_Loss_Pct": -39.90610328638497,
  "Recovery_Pct": 66.40625,
  "Advice": "Buy More",
  "Target_Action": "Buy Now (Low RRR)"
}
```

ข้อจำกัดที่ต้องจำไว้:

- ถ้า market data ไม่มี symbol ของ portfolio ระบบจะใส่ `No Data`
- ความแม่นของ `Advice` และ `Target_Action` ยังขึ้นกับคุณภาพ market/recommended data จาก T05-T06
- ยังไม่ได้ทดสอบ flow upload ผ่าน browser เพราะ sandbox ไม่ยอมให้เปิด server background ในรอบก่อนหน้า

## ผลลัพธ์ T08: Web UI Data Views

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/routes/analysisRoutes.js`
  - เพิ่ม `recommendations` และ `portfolioRows` ใน JSON response ของ `/api/analysis/run`
- `src/public/app.js`
  - เก็บ state ของ `recommendations` และ `portfolioRows`
  - render Portfolio view จากข้อมูลพอร์ตจริง
  - render Stock Screener view พร้อม filter `Min Score`, `Min RRR`, `Max D/E`
  - render Sector Analysis view แบบ summary/leader table
  - render Strategy Simulation placeholder เพื่อรอ T09
- `src/public/styles.css`
  - เพิ่ม metric cards
  - เพิ่ม filter bar
  - เพิ่ม responsive data table

ผลทดสอบ:

- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน

ข้อจำกัดที่ต้องจำไว้:

- ยังไม่ได้ verify UI ผ่าน browser เพราะรอบก่อนหน้า sandbox บล็อกการเปิด server background
- ยังไม่มี chart library ใน UI รอบนี้ ใช้ metrics และตารางก่อน
- Strategy Simulation view เป็น placeholder และต้องต่อใน T09

## ผลลัพธ์ T09: Strategy Simulation

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/marketDataService.js`
  - export `fetchChart`
  - รองรับ `period1`, `period2`, `range`, `interval`
  - เพิ่ม high/low ใน history rows
- `src/services/simulationService.js`
  - เพิ่ม `runStrategySimulation`
  - ดึงข้อมูลย้อนหลังพร้อม baseline 1 ปี
  - คำนวณ 52-week low/high ต่อวัน
  - คำนวณ RSI
  - จำลอง BUY, STOP LOSS, TAKE PROFIT 50%
  - สร้าง `Portfolio_Value` และ `Buy_Hold_Value`
- `src/routes/analysisRoutes.js`
  - เพิ่ม `POST /api/simulation/run`
- `src/public/app.js`
  - เพิ่ม simulation form
  - แสดง metrics, recent portfolio history และ trade history
- `src/public/styles.css`
  - เพิ่ม inline form styles

ผลทดสอบ:

- `node --check src/services/marketDataService.js` ผ่าน
- `node --check src/services/simulationService.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน
- ทดสอบ `runStrategySimulation('PTT')` ย้อนหลัง 1 ปีสำเร็จ

ตัวอย่างผลทดสอบ `PTT`:

```json
{
  "symbol": "PTT.BK",
  "history": 243,
  "trades": 0,
  "summary": {
    "finalValue": 100000,
    "buyHoldValue": 123728.81355932204,
    "roi": 0,
    "buyHoldRoi": 23.728813559322035,
    "totalTrades": 0
  }
}
```

ข้อจำกัดที่ต้องจำไว้:

- ยังไม่ได้ verify simulation ผ่าน browser
- ยังไม่มีกราฟ line chart เหมือน Streamlit เดิม ใช้ตาราง recent history ก่อน
- T10 ต้องเทียบ logic กับ Python `stock_simulator.py` เพิ่มเติม

## ผลลัพธ์ T10: Validation Against Python Outputs

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `scripts/comparePythonOutputs.js`
  - อ่าน `siamchart_raw.csv` เดิมจาก Python
  - อ่าน `recommended_stocks.csv` เดิมจาก Python
  - รัน JS analyzer จาก raw input เดียวกัน
  - สร้าง `data/outputs/recommended_stocks_compare.csv`
  - สร้าง synthetic temporary portfolio workbook เพื่อทดสอบ portfolio report โดยไม่ต้องใช้ไฟล์ portfolio ส่วนตัว
  - เทียบ portfolio report กับ expected calculations จาก synthetic holdings และ market data
  - เขียนผลละเอียดลง `data/outputs/t10_comparison_report.json`
- `package.json`
  - เพิ่ม script `compare:python`
- `src/services/csvService.js`
  - เพิ่ม `parseCsv` เพื่ออ่าน CSV เดิมของ Python
- `src/services/portfolioService.js`
  - normalize market row ก่อนคำนวณ เพื่อรองรับ rows ที่อ่านจาก CSV เป็น string
- `src/services/stockAnalysisService.js`
  - แก้ `numberValue` ให้รองรับ `inf`, `-inf`, `Infinity`
  - แก้ median ให้รับ infinity แบบ pandas เพื่อให้ sector median ตรงกับ Python

ผลทดสอบ:

- `node --check scripts/comparePythonOutputs.js` ผ่าน
- `node --check src/services/portfolioService.js` ผ่าน
- `node --check src/services/csvService.js` ผ่าน
- `node --check src/services/stockAnalysisService.js` ผ่าน
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน

ผลเทียบกับ Python เดิม:

- raw rows: 108
- Python recommended rows: 108
- JS recommended rows: 108
- raw missing columns: none
- recommended missing columns: none
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report rows: Python 17, JS 17
- portfolio report sample mismatches: 0
- sheets ของ report ตรงกัน: `Portfolio Analysis`, `How to Read`

ไฟล์ผลลัพธ์ validation:

- `data/outputs/t10_comparison_report.json`
- `data/outputs/recommended_stocks_compare.csv`
- `data/outputs/portfolio_regression_compare_analysis_report.xlsx`

ความต่างที่ยอมรับ/ต้องจำไว้:

- เมื่อใช้ raw input เดียวกับ Python สูตร JS ให้ผลตรง 0 mismatch
- แต่ live market data ของ Node ยังต่างจาก Python ได้ เพราะ Yahoo chart endpoint ไม่มี fundamental fields เช่น `PE`, `ROE`, `Yield`, `DE`, `Sector`
- ถ้าต้องให้ live output เทียบเท่า Python เต็มรูปแบบ ต้องหา source fundamental เพิ่ม หรือกลับไปใช้ provider/API ที่ให้ field เทียบเท่า `yfinance`

## ผลลัพธ์ T11: Web App Usage Documentation

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `README.md`
  - เพิ่มวิธีใช้งาน Node.js Web App
  - เพิ่มคำสั่ง `npm install` และ `npm start`
  - ระบุ URL `http://localhost:3000`
  - ระบุ output ใน `data/outputs`
  - ระบุข้อจำกัดของ Yahoo chart endpoint
- `docs/WEB_APP_USAGE.md`
  - เพิ่มคู่มือใช้งาน Web App แบบละเอียด
  - ระบุขั้นตอนติดตั้ง, run, upload, export
  - ระบุ input format ของ watchlist และ portfolio
  - ระบุไฟล์ผลลัพธ์
  - ระบุคำสั่ง validation `npm run compare:python`
  - ระบุคำเตือนเรื่องข้อมูลตลาดและความเสี่ยงการลงทุน

ผลทดสอบ:

- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- `npm audit --audit-level=high` ผ่าน ไม่มี high severity

ข้อจำกัดที่ต้องจำไว้:

- ยังมี moderate severity จาก dependency ย่อย `uuid` ของ `exceljs`; npm แจ้งว่าไม่มี fix ที่ไม่กระทบ breaking change
- ยังไม่ได้ verify UI ผ่าน browser จริงใน sandbox นี้
- live fundamental data ยังไม่ครบเทียบเท่า Python เดิม

## ผลลัพธ์ T12: Sector Analysis Fix

ปัญหา:

- Sector Analysis แสดงผลไม่ถูกต้อง เพราะ live Node market data จาก Yahoo chart endpoint ไม่มี `Sector`, `PE`, `ROE`, `Yield`, `D/E`
- ผลที่ตามมาคือหุ้นถูกจัดอยู่ใน `Unknown` และการวิเคราะห์แยก sector ไม่มีความหมาย

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/referenceDataService.js`
  - เพิ่ม service โหลด `recommended_stocks.csv` เดิมเป็น reference data
  - เติม fallback fields ให้ market rows ได้แก่ `Sector`, `PE`, `PBV`, `Yield`, `ROE`, `DE`, `High_52W`, `Low_52W`
- `src/services/marketDataService.js`
  - โหลด reference data ก่อน fetch live market rows
  - enrich แต่ละ symbol ด้วย reference row ถ้ามี
  - ยังใช้ Yahoo chart สำหรับราคา, RSI, volume และ 52-week range
- `src/public/app.js`
  - ปรับ Sector Analysis ให้มี dropdown เลือก sector
  - แสดง metric ของ sector ที่เลือก
  - แสดง leader และตารางหุ้นใน sector
  - เพิ่ม Sector Summary รวมทุก sector
- `src/public/styles.css`
  - เพิ่ม style สำหรับ select control
- `README.md`
  - อัปเดตหมายเหตุว่า Node ใช้ `recommended_stocks.csv` เป็น reference fallback
- `docs/WEB_APP_USAGE.md`
  - อัปเดตข้อจำกัดและ fallback behavior ให้ตรงกับระบบใหม่

ผลทดสอบ:

- `node --check src/services/referenceDataService.js` ผ่าน
- `node --check src/services/marketDataService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- ทดสอบโหลด reference ได้ 108 symbols
- ทดสอบ enrich `PTT` ได้ `Sector: Energy` พร้อม `PE`, `ROE`, `Yield`, `DE`
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0

วิธีใช้งานหลังแก้:

- ต้องกด `Run` ใหม่ เพื่อให้ state ใน browser โหลด recommendations ที่ enrich แล้ว
- ถ้า symbol มีอยู่ใน `recommended_stocks.csv` เดิม Sector Analysis จะใช้ sector จริง
- ถ้า symbol ไม่มีในไฟล์อ้างอิง จะยังแสดง `Unknown`

## ผลลัพธ์ T13: Commercial SaaS Upgrade

เป้าหมาย:

- ยกระดับ Web App ให้ดูเป็น product ที่ขาย subscription รายเดือนได้
- ทำให้ผู้ไม่มีความรู้ลงทุนเข้าใจง่ายขึ้นผ่าน dashboard, plan, guidance และ action summary
- ใช้ theme ดำ-แดงคล้าย Netflix ในรูปแบบ professional SaaS

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่มระบบ register/login/logout แบบ file-backed demo
  - hash password ด้วย PBKDF2
  - เก็บ session cookie แบบ HttpOnly
  - เพิ่ม subscription profile: plan, status, price, renew date
  - เพิ่ม portfolio snapshot ต่อ user
  - เพิ่ม monthly plan catalog: Starter, Pro, Advisor
- `src/routes/authRoutes.js`
  - เพิ่ม `/api/auth/me`
  - เพิ่ม `/api/auth/register`
  - เพิ่ม `/api/auth/login`
  - เพิ่ม `/api/auth/logout`
  - เพิ่ม `/api/subscription/plans`
  - เพิ่ม `/api/customer/portfolio`
- `src/server.js`
  - mount auth routes
- `src/routes/analysisRoutes.js`
  - require login ก่อน run analysis
  - require login ก่อน run simulation
  - save customer portfolio snapshot หลังวิเคราะห์สำเร็จ
- `src/public/index.html`
  - redesign layout เป็น SaaS dashboard
  - เพิ่ม auth panel, account panel, plan panel, command center
- `src/public/styles.css`
  - redesign theme ดำ-แดง
  - เพิ่ม brand mark, dark panels, subscription cards, dashboard cards, responsive layout
- `src/public/app.js`
  - เพิ่ม auth state
  - เพิ่ม register/login/logout flow
  - โหลด subscription plans
  - โหลด saved portfolio snapshot
  - block analysis/simulation ถ้ายังไม่ login
  - แสดง customer snapshot และ portfolio action plan
- `README.md`
  - เพิ่มรายละเอียด login/subscription/customer snapshot
- `docs/WEB_APP_USAGE.md`
  - เพิ่มขั้นตอนใช้งานหลังมี login
  - ระบุ `data/app-state.json`
  - ระบุว่า subscription/payment เป็น prototype

ผลทดสอบ:

- `node --check src/server.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/routes/analysisRoutes.js` ผ่าน
- `node --check src/services/authService.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- ทดสอบ `authService.createUser` และ `saveCustomerPortfolioSnapshot` ผ่าน
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0
- `npm audit --audit-level=high` ผ่าน ไม่มี high severity

ข้อจำกัด production:

- ระบบ auth/subscription ปัจจุบันเป็น local prototype เก็บใน `data/app-state.json`
- ยังไม่เชื่อม payment gateway จริง
- ยังไม่มี production database
- ยังไม่มี email verification, password reset, role-based admin, billing webhook
- ยังไม่ได้ verify UI ผ่าน browser จริงใน sandbox นี้
- ยังมี moderate severity จาก dependency ย่อย `uuid` ของ `exceljs`; npm แจ้งว่าไม่มี fix ที่ไม่กระทบ breaking change

งานต่อยอดที่แนะนำหลัง T13:

- เชื่อม payment gateway เช่น Omise/Stripe
- ย้าย `data/app-state.json` เป็น database จริง
- เพิ่ม charts และคำอธิบายภาษาไทยในแต่ละ action
- เพิ่ม role/permission ที่ละเอียดขึ้นสำหรับทีมงานและ advisor

## ผลลัพธ์ T14: Beginner Onboarding and Business Dashboard

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `role` ให้ user โดย account แรกเป็น `owner` และ account ถัดไปเป็น `customer`
  - เพิ่ม `saveInvestorProfile` และ `getInvestorProfile`
  - เพิ่ม `businessMetrics` สำหรับ users, active sessions, trials, saved portfolios, completed profiles, MRR estimate และ users by plan
  - เพิ่ม state field `investorProfiles`
  - normalize state เดิมให้ user เก่ามี role fallback
- `src/routes/authRoutes.js`
  - เพิ่ม `/api/customer/profile`
  - เพิ่ม `/api/admin/metrics`
  - จำกัด business metrics ให้เฉพาะ `owner` หรือ `admin`
- `src/public/index.html`
  - เพิ่ม view `Guide`
  - เพิ่ม view `Business`
- `src/public/app.js`
  - เพิ่มการโหลด investor profile และ business metrics
  - เพิ่มหน้า Guide สำหรับตั้งเป้าหมายลงทุน ประสบการณ์ ความเสี่ยง งบรายเดือน และ holding horizon
  - เพิ่ม guidance cards ในหน้า Portfolio เพื่อแปลผลพอร์ตเป็นภาษาง่าย
  - เพิ่มหน้า Business สำหรับ owner account เพื่อดู SaaS metrics
  - ซ่อน Business view จาก customer account
- `src/public/styles.css`
  - เพิ่ม guidance cards, profile form และ responsive layout สำหรับ view ใหม่
  - ปรับ background ให้เป็นธีมดำ-แดงแบบเรียบขึ้น
- `README.md`
  - เพิ่มรายละเอียด owner account, investor profile, Guide และ Business metrics
- `docs/WEB_APP_USAGE.md`
  - เพิ่มคู่มือหน้า Guide
  - เพิ่มคำอธิบาย Business Dashboard Prototype

ผลทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check src/server.js` ผ่าน
- `npm run check` ผ่าน
- ทดสอบ `createUser`, `saveInvestorProfile`, `getInvestorProfile`, `businessMetrics` ผ่าน
- HTTP smoke test ผ่านบน port ชั่วคราว 3055: `/api/health`, `/api/auth/register`, `/api/customer/profile`, static page และ `/api/admin/metrics` ที่ block customer ด้วย 403
- `npm run compare:python` ผ่าน
- raw rows: 108
- recommended rows: python=108, js=108
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0

ข้อจำกัด production:

- owner/customer role ยังเป็น prototype จาก local file state
- `/api/admin/metrics` ยังเป็นภาพรวมเบื้องต้น ไม่ใช่ระบบ admin เต็มรูปแบบ
- ยังไม่เชื่อม payment gateway, billing webhook, production database, email verification หรือ password reset
- `npm audit --audit-level=high` ยังพบ moderate severity จาก `uuid` ซึ่งเป็น dependency ย่อยของ `exceljs` และ npm แจ้งว่าไม่มี fix available
- ยังไม่ได้ verify UI ผ่าน browser จริงใน sandbox นี้

งานต่อยอดที่แนะนำหลัง T14:

- เชื่อม payment gateway เช่น Omise/Stripe และ billing webhook
- ย้าย `data/app-state.json` เป็น production database
- เพิ่ม chart library หากต้องการกราฟขั้นสูงกว่า native visual ปัจจุบัน
- เพิ่ม role/permission สำหรับ owner, analyst, advisor และ customer
- ทดสอบ UI ผ่าน browser จริงหลังเปิด server

## ผลลัพธ์ T15: Visual Intelligence Dashboard

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/public/app.js`
  - เพิ่ม `renderPortfolioVisuals`
  - เพิ่ม `renderScreenerInsights`
  - เพิ่ม `renderSectorVisuals`
  - เพิ่ม `renderBusinessFunnel`
  - เพิ่ม helper `renderBarList`, `renderScatterPlot`, `breakdownBy`, `actionGroup`, `clamp`
  - หน้า Portfolio แสดง sector exposure, action mix และ score distribution ก่อนตาราง
  - หน้า Screener แสดง quality vs reward scatter, top ideas และ sector count ตาม filter ปัจจุบัน
  - หน้า Sector แสดง sector leaders, sector benchmark และ timing vs quality scatter
  - หน้า Business แสดง customer funnel และ plan distribution
- `src/public/styles.css`
  - เพิ่ม style สำหรับ visual grid, chart panel, bar chart และ scatter plot
  - รองรับ responsive layout บนจอเล็ก
- `README.md`
  - เพิ่ม Visual Intelligence Dashboard เป็นฟีเจอร์เด่น
  - ระบุว่า Web App มี visual dashboard โดยไม่ต้องติดตั้ง chart library เพิ่ม
- `docs/WEB_APP_USAGE.md`
  - เพิ่มหมวด Visual Dashboard
  - อธิบาย visual แต่ละ view

ผลทดสอบ:

- `node --check src/public/app.js` ผ่าน
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- raw rows: 108
- recommended rows: python=108, js=108
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0
- HTTP smoke test ผ่านบน port ชั่วคราว 3055: static page และ `/app.js` ถูก serve ได้, พบ view buttons และ visual helper functions ครบ
- `npm audit --audit-level=high` ผ่าน ไม่มี high severity

ข้อจำกัด:

- visual charts เป็น native HTML/CSS/SVG เพื่อไม่เพิ่ม dependency จึงยังไม่มี interaction ขั้นสูงแบบ tooltip/filter drilldown ของ chart library เต็มรูปแบบ
- ยังไม่ได้ verify UI ผ่าน in-app browser screenshot เพราะ browser automation ถูก sandbox บล็อกในรอบนี้
- `npm audit` ยังพบ moderate severity จาก `uuid` ซึ่งเป็น dependency ย่อยของ `exceljs` และ npm แจ้งว่าไม่มี fix available

งานต่อยอดที่แนะนำหลัง T15:

- เพิ่ม browser QA/screenshot เมื่อสภาพแวดล้อมอนุญาต
- เพิ่ม chart interaction ขั้นสูง เช่น click sector เพื่อ filter ตาราง
- เชื่อม payment gateway จริงและ billing webhook
- ย้าย state จาก local file เป็น database จริง
- เพิ่ม role/permission สำหรับ owner, analyst, advisor และ customer

## ผลลัพธ์ T16: Subscription Checkout and Billing Prototype

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม `checkoutSubscription(userId, planId)`
  - เพิ่ม `getBillingHistory(userId)`
  - เพิ่ม `billingEvents` ใน local state
  - checkout จะเปลี่ยน subscription เป็น `active`, บันทึก `planId`, `provider`, renewal date และ billing event
  - เพิ่ม business metrics: paid users, trial users, MRR estimate, trial MRR potential, revenue collected, ARPU และ recent billing events
- `src/routes/authRoutes.js`
  - เพิ่ม `POST /api/subscription/checkout`
  - เพิ่ม `GET /api/customer/billing`
- `src/public/app.js`
  - pricing cards มีปุ่ม `Subscribe`, `Switch plan`, `Activate plan`
  - account panel แสดง role, billing provider และ latest invoice
  - Business dashboard แสดง paid users, revenue collected, trial potential, ARPU และ recent billing
  - checkout ผ่าน frontend จะ refresh user subscription, billing history และ business metrics
- `src/public/styles.css`
  - เพิ่ม disabled button state
  - เพิ่ม `.plan-action`
- `README.md`
  - ระบุว่าระบบเลือกแพ็กเกจและจำลอง checkout รายเดือนได้
- `docs/WEB_APP_USAGE.md`
  - เพิ่มรายละเอียด Subscription Prototype, billing events และ metrics

ผลทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check src/server.js` ผ่าน
- ทดสอบ service `createUser`, `checkoutSubscription`, `getBillingHistory`, `businessMetrics` ผ่าน
- HTTP smoke test ผ่านบน port ชั่วคราว 3056: register, `/api/subscription/checkout`, `/api/customer/billing`
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- raw rows: 108
- recommended rows: python=108, js=108
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0
- `npm audit --audit-level=high` ผ่าน ไม่มี high severity

ข้อจำกัด:

- checkout ยังเป็น `local_demo` ไม่ได้ตัดเงินจริง
- ยังไม่มี payment gateway, billing webhook, failed payment, refund, invoice PDF หรือ tax invoice
- ยังไม่ได้ย้าย billing/customer data ไป production database
- `npm audit` ยังพบ moderate severity จาก `uuid` ซึ่งเป็น dependency ย่อยของ `exceljs` และ npm แจ้งว่าไม่มี fix available

งานต่อยอดที่แนะนำหลัง T16:

- เชื่อม Omise/Stripe หรือ payment provider ที่เหมาะกับตลาดไทย
- เพิ่ม billing webhook และ invoice reconciliation
- เพิ่ม production database สำหรับ users, subscriptions, invoices และ audit logs
- เพิ่ม audit log และ approval flow สำหรับ role/permission
- เพิ่ม browser QA/screenshot เมื่อสภาพแวดล้อมอนุญาต

## ผลลัพธ์ T17: Role Permission and Advisor Workspace Prototype

ไฟล์และโค้ดที่เพิ่ม/แก้:

- `src/services/authService.js`
  - เพิ่ม role policy สำหรับ `owner`, `admin`, `advisor`, `customer`
  - public user มี `permissions`
  - เพิ่ม `listWorkspaceUsers(viewerUserId)`
  - เพิ่ม `updateUserRole(actorUserId, targetUserId, nextRole)`
  - เพิ่ม `assignAdvisor(actorUserId, customerId, advisorId)`
  - เพิ่ม `advisorAssignments` ใน local state
  - เพิ่ม business metrics: `usersByRole` และ `advisorAssignments`
  - normalize state เดิมให้ role ไม่หลุดนอกชุดที่อนุญาต
- `src/routes/authRoutes.js`
  - เพิ่ม `GET /api/admin/policy`
  - เพิ่ม `GET /api/admin/users`
  - เพิ่ม `POST /api/admin/users/:userId/role`
  - เพิ่ม `POST /api/admin/users/:userId/advisor`
  - จำกัด team workspace ให้ owner/admin/advisor
- `src/public/app.js`
  - เพิ่ม state `teamUsers` และ `policy`
  - Business button แสดงตาม permission ไม่ใช่ hard-code role เดิม
  - owner/admin เห็น Team and clients workspace
  - owner เปลี่ยน role ได้
  - owner/admin assign advisor ให้ customer ได้
  - advisor เห็น Assigned clients เฉพาะลูกค้าที่ถูก assign
- `src/public/styles.css`
  - เพิ่ม style สำหรับ table action button และ select ในตาราง
- `README.md`
  - เพิ่ม role prototype และ advisor assignment
- `docs/WEB_APP_USAGE.md`
  - เพิ่มหมวด Role และ Advisor Workspace

ผลทดสอบ:

- `node --check src/services/authService.js` ผ่าน
- `node --check src/routes/authRoutes.js` ผ่าน
- `node --check src/public/app.js` ผ่าน
- `node --check src/server.js` ผ่าน
- ทดสอบ service flow ผ่าน: owner เปลี่ยน user เป็น advisor, assign customer ให้ advisor, advisor เห็นเฉพาะ assigned clients
- HTTP smoke test ผ่านบน port ชั่วคราว 3057: login owner, update role, assign advisor, list admin users
- `npm run check` ผ่าน
- `npm run compare:python` ผ่าน
- raw rows: 108
- recommended rows: python=108, js=108
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0
- `npm audit --audit-level=high` ผ่าน ไม่มี high severity

ข้อจำกัด:

- role/permission ยังเป็น local prototype ไม่ใช่ production RBAC เต็มรูปแบบ
- ยังไม่มี audit log, approval flow, invitation email หรือ organization/team boundary จริง
- advisor assignment ยังเป็น one-advisor-per-customer model
- `npm audit` ยังพบ moderate severity จาก `uuid` ซึ่งเป็น dependency ย่อยของ `exceljs` และ npm แจ้งว่าไม่มี fix available

งานต่อยอดที่แนะนำหลัง T17:

- เพิ่ม audit log สำหรับ role changes, advisor assignment, checkout และ analysis runs
- เพิ่ม organization/team model และ invitation flow
- เชื่อม payment gateway/webhook จริง
- ย้าย state จาก local file เป็น production database
- เพิ่ม browser QA/screenshot เมื่อสภาพแวดล้อมอนุญาต

## สถานะรวมหลังจบ Task List

Task `T00` ถึง `T17` เสร็จครบแล้วตามแผน migration และ SaaS prototype รอบนี้

งานต่อยอดที่แนะนำ:

- เพิ่ม data source สำหรับ fundamental fields เพื่อให้ live Node output เทียบเท่า Python เต็มขึ้น
- เพิ่ม chart interaction ขั้นสูงหรือ chart library หากต้องการ drilldown
- เชื่อม payment gateway จริงและ billing webhook
- เพิ่ม audit log และ organization/team model
- ทดสอบผ่าน browser จริงหลังเปิด server
- พิจารณาทางเลือกแทน `exceljs` หรือแนวทางลด dependency risk หากต้องการ production hardening

## สถาปัตยกรรม Node.js Web App ที่เลือก

### Runtime และแนวทางรวม

- ใช้ Node.js `v22.19.0`
- ใช้ npm `11.12.0`
- ทำเป็น Web App แบบ backend-first ด้วย Express และ static frontend
- ไม่ใช้ React/Vite ในรอบแรก เพื่อลดขั้นตอน build และทำให้ผู้ใช้เปิดใช้งานง่ายที่สุด
- Frontend ใช้ HTML/CSS/JavaScript ปกติที่ Express serve จาก `src/public`
- สูตรคำนวณหุ้นทั้งหมดต้องแยกเป็น service/module เพื่อเทียบกับ Python เดิมได้ง่าย

### Backend

เลือกใช้:

- `express`: Web server และ API routes
- `multer`: รับไฟล์ upload เช่น watchlist และ portfolio
- `exceljs`: อ่าน portfolio Excel และสร้าง Excel report
- Node built-in `fetch`: ดึงข้อมูลหุ้นจาก Yahoo chart endpoint ด้วย ticker `.BK`

หมายเหตุการเปลี่ยนแผน:

- เดิมเลือก `xlsx` แต่เปลี่ยนเป็น `exceljs` เพราะ `xlsx` มี high severity advisory และ npm แจ้งว่าไม่มี fix ผ่าน package นี้
- เดิมเลือก `yahoo-finance2` แต่ถอดออก เพราะ version ที่ติดตั้ง expose เฉพาะ `quote/autoc`, ไม่มี `quoteSummary/historical` และการเรียก `quote` ติด crumb/rate-limit
- Yahoo chart endpoint ทดสอบแล้วใช้ได้สำหรับราคา, 52-week high/low, volume และข้อมูลย้อนหลังที่ใช้คำนวณ RSI

ถ้าจำเป็นในภายหลัง:

- `chart.js` หรือ chart library ฝั่ง browser สำหรับ dashboard
- `nodemon` สำหรับ dev mode

### Frontend

หน้าที่ต้องสร้าง:

- หน้า Home/Run Analysis
  - upload watchlist
  - upload portfolio
  - ปุ่ม run analysis
  - แสดงสถานะการทำงานและ link download output
- หน้า My Portfolio
  - metrics และตาราง holdings
  - charts สำหรับ sector allocation, gain/loss, quality/risk
- หน้า Stock Screener
  - filters สำหรับ score, RRR, D/E, trend, sector
  - chart และตารางหุ้น
- หน้า Sector Analysis
  - เลือก sector
  - แสดง leader list และ scatter summary
- หน้า Strategy Simulation
  - กรอก symbol, initial capital, years back
  - แสดง strategy vs buy & hold และ trade log

### โครงสร้าง folder ใหม่

จะเพิ่มโครงสร้างใหม่โดยไม่ลบไฟล์ Python เดิม:

```text
src/
  server.js
  routes/
    analysisRoutes.js
  services/
    marketDataService.js
    stockAnalysisService.js
    portfolioService.js
    simulationService.js
    csvService.js
  public/
    index.html
    styles.css
    app.js
data/
  uploads/
  outputs/
```

### Output Policy

- ในช่วง migration ให้เขียน output ใหม่ไว้ใต้ `data/outputs`
- สามารถคงชื่อไฟล์เดิม เช่น `siamchart_raw.csv`, `recommended_stocks.csv`, `*_analysis_report.xlsx`
- ถ้าต้องเขียน output ที่ root เหมือนเดิม ต้องระบุชัดใน `plan.md` ก่อน
- Python output เดิมที่ root จะไม่ถูกลบ

### เหตุผลที่เลือกแนวนี้

- ใช้ง่ายกว่า Streamlit สำหรับผู้ใช้ทั่วไป เพราะเปิดผ่าน browser และ upload ไฟล์ได้
- ไม่ต้องมี build step ของ frontend ในเฟสแรก
- Port สูตร Python เป็น JavaScript ได้ตรงและตรวจสอบง่าย
- แยก services ทำให้ AI หรือผู้พัฒนาคนต่อไปอ่านต่อได้ชัด
- ลดความเสี่ยงที่จะเปลี่ยนผลลัพธ์เดิมโดยไม่ตั้งใจ

## Behavior Contract ของระบบเดิม

ส่วนนี้คือเกณฑ์ที่ระบบ Node.js ใหม่ควรรักษาไว้ให้เหมือนหรือเทียบเท่าระบบ Python เดิม

### Flow หลักของ `main.py`

1. ให้ผู้ใช้เลือกไฟล์ watchlist เป็น `.txt`
2. ถ้าไม่เลือก และมี `watchlist.txt` ให้ใช้ไฟล์นั้น
3. ให้ผู้ใช้เลือกไฟล์ portfolio เป็น `.xlsx` หรือ `.xls`
4. ถ้าไม่เลือก และมี `portfolio.xlsx` ให้ใช้ไฟล์นั้น
5. ดึงข้อมูลหุ้นจาก watchlist และ portfolio แล้วบันทึกเป็น `siamchart_raw.csv`
6. วิเคราะห์หุ้นจาก `siamchart_raw.csv` แล้วบันทึกเป็น `recommended_stocks.csv`
7. สร้างรูป dashboard เป็น `stock_analysis_dashboard.png`
8. ถ้ามี watchlist ให้แสดงผลวิเคราะห์หุ้นรายตัวใน console
9. ถ้ามี portfolio ให้ merge กับ market data แล้วสร้าง `*_analysis_report.xlsx`
10. แสดง Top sector leaders จากหุ้นที่มีคะแนนสูงสุดในแต่ละ sector

### Input Contract

ไฟล์ watchlist:

- เป็น text file
- อ่านทีละบรรทัด
- ตัดช่องว่างและแปลงเป็นตัวพิมพ์ใหญ่
- ข้ามบรรทัดว่าง
- ตัด symbol ที่ไม่ใช่หุ้น เช่น `XD`, `SYMBOL`, `NAME`

ไฟล์ portfolio:

- เป็น Excel
- ต้องมีคอลัมน์ `Symbol`
- สำหรับการวิเคราะห์พอร์ตต้องมี `Quantity` และ `Avg_Price`
- `Symbol` ถูก trim และแปลงเป็นตัวพิมพ์ใหญ่

### Raw Market Output: `siamchart_raw.csv`

คอลัมน์ที่ระบบเดิมสร้าง:

- `Symbol`
- `Sector`
- `Price`
- `PE`
- `PBV`
- `Yield`
- `ROE`
- `DE`
- `High_52W`
- `Low_52W`
- `RSI`
- `Volume`
- `Avg_Vol_10D`

กติกาการดึงข้อมูล:

- หุ้นไทยใช้ ticker รูปแบบ `{SYMBOL}.BK`
- ถ้าไม่มี symbol จาก watchlist หรือ portfolio ให้ใช้ default list: `PTT`, `CPALL`, `AOT`, `ADVANC`, `SCB`, `KBANK`, `DELTA`, `GULF`, `BDMS`, `PTTEP`
- ถ้าราคาเป็น 0 หรือไม่มีราคา ให้ข้ามหุ้นนั้น
- `Yield` ถ้าค่าจาก source น้อยกว่าหรือเท่ากับ 1 ให้คูณ 100
- `ROE` ถ้าค่าสัมบูรณ์น้อยกว่าหรือเท่ากับ 1 ให้คูณ 100
- `DE` ถ้ามากกว่า 10 ให้หาร 100
- `RSI` คำนวณจากราคาปิดย้อนหลัง 1 เดือน ใช้ window 14
- `Volume_Ratio` ใช้ volume ล่าสุดหาร average volume 10 วัน แต่คอลัมน์นี้สร้างในขั้น analyzer

### สูตรวิเคราะห์หุ้นใน `stock_analyzer.py`

Cleaning:

- แทน `-` ด้วยค่าว่าง
- map ชื่อคอลัมน์ที่คล้ายกันให้เป็นชื่อมาตรฐาน เช่น `Symbol`, `PE`, `PBV`, `Yield`, `ROE`, `Price`, `DE`, `Sector`
- แปลง numeric columns เป็นตัวเลข
- ถ้าไม่มี `Sector` ให้ใช้ `Unknown`

Sector benchmark:

- คำนวณ median ต่อ sector สำหรับ `PE`, `ROE`, `Yield`
- เพิ่มคอลัมน์ `Sector_PE`, `Sector_ROE`, `Sector_Yield`

คะแนนย่อย:

- `DE_Score`
  - ถ้าไม่มีข้อมูล: 50
  - `DE < 1.0`: 100
  - `DE < 1.5`: 70
  - `DE < 2.5`: 30
  - อื่น ๆ: 0

- `Price_Position`
  - ถ้าไม่มี `High_52W`, `Low_52W` หรือ high เท่ากับ low: 50
  - สูตร: `((Price - Low_52W) / (High_52W - Low_52W)) * 100`
  - จำกัดค่าให้อยู่ระหว่าง 0 ถึง 100

- `RSI_Score`
  - ถ้าไม่มีข้อมูล: 50
  - `RSI < 35`: 100
  - `RSI < 50`: 70
  - `RSI < 70`: 30
  - อื่น ๆ: 0

- `Relative_Quality_Score`
  - เริ่มที่ 50
  - ถ้า `PE < Sector_PE` เพิ่ม 20
  - ถ้า `PE > Sector_PE * 1.5` ลด 20
  - ถ้า `ROE > Sector_ROE` เพิ่ม 20
  - ถ้า `ROE < Sector_ROE * 0.5` ลด 20
  - จำกัดค่า 0 ถึง 100

- `PE_Score`
  - `PE < 12`: 100
  - `PE < 18`: 70
  - อื่น ๆ: 30

- `ROE_Score`
  - `ROE > 18`: 100
  - `ROE > 12`: 70
  - อื่น ๆ: 30

- `Yield_Score`
  - `Yield > 5`: 100
  - `Yield > 3`: 70
  - อื่น ๆ: 30

คะแนนรวม:

```text
Total_Score =
  DE_Score * 0.20
  + ((100 - Price_Position) * 0.10 + RSI_Score * 0.10)
  + (PE_Score * 0.15 + ROE_Score * 0.15)
  + (Relative_Quality_Score * 0.30)
```

โซนราคาและความเสี่ยง:

- `Entry_Zone_Low = Low_52W`
- `Entry_Zone_High = Low_52W * 1.05`
- `Exit_Zone_Low = High_52W * 0.97`
- `Exit_Zone_High = High_52W`
- `Volume_Ratio = Volume / Avg_Vol_10D` ถ้า average volume มากกว่า 0 ไม่เช่นนั้นเป็น 0
- `Stop_Loss = Low_52W * 0.95`
- `Upside_Pct = ((Exit_Zone_Low - Price) / Price) * 100`
- `RRR = (Exit_Zone_Low - Price) / (Price - Stop_Loss)` ถ้า risk มากกว่า 0 ไม่เช่นนั้นเป็น 5.0
- `Recovery_Pct` ใน analyzer เป็น 0.0

Trend status:

- `RSI > 55` และ `Price_Position > 50`: `Bullish 📈`
- `RSI < 45` และ `Price_Position < 40`: `Bearish 📉`
- `45 <= RSI <= 55`: `Sideways ➡️`
- อื่น ๆ: `Weak Trend ⚠️`

Rationale:

- เพิ่มเหตุผลเมื่อหุ้นถูกกว่า sector, ROE ดีกว่า sector, หนี้ต่ำ, RSI ต่ำ, dividend สูงกว่า sector, ราคาอยู่ใน entry zone, หรือ volume spike
- ถ้าไม่มีเหตุผล ให้ใช้ `Balanced performance`

### Recommended Output: `recommended_stocks.csv`

ต้อง sort ด้วย `Total_Score` จากมากไปน้อย และมีคอลัมน์สำคัญ:

- คอลัมน์ raw market ทั้งหมด
- `Sector_PE`, `Sector_ROE`, `Sector_Yield`
- `DE_Score`, `Price_Position`, `RSI_Score`, `Relative_Quality_Score`
- `PE_Score`, `ROE_Score`, `Yield_Score`, `Total_Score`
- `Entry_Zone_Low`, `Entry_Zone_High`, `Exit_Zone_Low`, `Exit_Zone_High`
- `Volume_Ratio`, `Stop_Loss`, `Upside_Pct`, `RRR`, `Recovery_Pct`
- `Trend_Status`, `Rationale`

### Portfolio Report Contract

เมื่อนำ portfolio มา merge กับ market data ต้องคำนวณ:

- `Market_Value = Quantity * Price`
- `Cost_Value = Quantity * Avg_Price`
- `Gain_Loss_Value = Market_Value - Cost_Value`
- `Gain_Loss_Pct = ((Price - Avg_Price) / Avg_Price) * 100`
- `Recovery_Pct`
  - ถ้ากำไรหรือเท่าทุน: 0
  - ถ้าขาดทุน: `((1 / (1 - abs(Gain_Loss_Pct) / 100)) - 1) * 100`
- `Suggested_Shares`
  - risk amount คงที่ 5,000 THB
  - `risk_per_share = Entry_Zone_High - Stop_Loss`
  - ถ้า risk ต่อหุ้น <= 0 ให้ 0
  - ไม่เช่นนั้น `floor(5000 / risk_per_share)`

Advice:

- ถ้าไม่มี `Total_Score`: `No Data`
- ถ้า score >= 70 และขาดทุน: `Buy More`
- ถ้า score >= 70 และ `Price_Position < 40`: `Accumulate`
- ถ้า score >= 70 และเงื่อนไขอื่น: `Hold`
- ถ้า score >= 45: `Wait/Hold`
- ถ้าคะแนนต่ำกว่า 45 และมีกำไร: `Sell`
- ถ้าคะแนนต่ำกว่า 45 และขาดทุนหรือเท่าทุน: `Reduce/Cut`

Target Action:

- ถ้า `Price <= Stop_Loss` หรือ score < 30: `Exit All (100%)`
- ถ้า advice เป็น `Sell` หรือ `Reduce/Cut` หรือ score อยู่ระหว่าง 30 ถึงน้อยกว่า 45: `Reduce 50%`
- ถ้า advice เป็น `Hold` และ price >= `Exit_Zone_Low`: `TP 50% @ {Exit_Zone_Low}`
- ถ้า advice เป็น `Buy More` หรือ `Accumulate` และ price > `Entry_Zone_High`: `Wait & Bid @ {Entry_Zone_High}`
- ถ้า advice เป็น `Buy More` หรือ `Accumulate` และ `RRR >= 2.0`: `Buy Now (Good RRR)`
- ถ้า advice เป็น `Buy More` หรือ `Accumulate` และ `RRR < 2.0`: `Buy Now (Low RRR)`
- อื่น ๆ: `Keep Holding`

Excel report:

- ชื่อไฟล์: `{portfolio_filename_without_ext}_analysis_report.xlsx`
- Sheet 1: `Portfolio Analysis`
- Sheet 2: `How to Read`
- คอลัมน์หลักใน report:
  - `Symbol`, `Sector`, `Quantity`, `Avg_Price`, `Price`, `Trend_Status`
  - `Entry_Zone`, `Exit_Zone`, `Stop_Loss`, `Upside_Pct`, `RRR`
  - `Cost_Value`, `Market_Value`, `Gain_Loss_Value`, `Gain_Loss_Pct`
  - `Price_Position`, `Total_Score`, `Advice`, `Target_Action`, `Volume_Ratio`
  - `PE`, `Yield`, `ROE`, `DE`, `RSI`
  - `Entry_Zone_Low`, `Entry_Zone_High`, `Exit_Zone_Low`, `Exit_Zone_High`

### Dashboard Contract

ระบบ Web App ใหม่ควรแทน Streamlit dashboard เดิมด้วยหน้าเหล่านี้:

- My Portfolio
  - อ่าน `*_analysis_report.xlsx`
  - แสดง current market value, total gain/loss, average D/E, total holdings
  - แสดง sector allocation, individual returns, quality/risk scatter และ holding details
- Stock Screener
  - filter ด้วย min score, min RRR, max D/E, trend, sector
  - แสดง scatter และตารางหุ้นที่ผ่านเงื่อนไข
- Sector Analysis
  - เลือก sector
  - แสดง PE vs ROE พร้อม median line
  - แสดง quality vs price position
  - แสดง leaders list
- Strategy Simulation
  - รับ symbol, initial capital, years back
  - เปรียบเทียบ strategy value กับ buy & hold
  - แสดง trade history

### Strategy Simulation Contract

- ดึงข้อมูลย้อนหลังโดยเริ่มก่อน start date 1 ปีเพื่อคำนวณ 52-week range
- เงินเริ่มต้น default 100,000 THB
- ถ้ามีเงินพอและ price <= `Low_52W * 1.05` ให้ซื้อด้วยเงินสดทั้งหมด
- ถ้าถือหุ้นและ price <= `Low_52W * 0.95` ให้ขายทั้งหมดเป็น stop loss
- ถ้าถือหุ้นอย่างน้อย 2 หุ้นและ price >= `High_52W * 0.97` ให้ขายครึ่งหนึ่ง
- บันทึก `Portfolio_Value`, `Cash`, `Shares`, `Action`
- เพิ่ม `Buy_Hold_Value` เพื่อเปรียบเทียบ

### สิ่งที่ปรับได้เมื่อเป็น Web App

- เปลี่ยน file dialog เป็น upload form
- เปลี่ยน console output เป็นหน้า result/history
- เปลี่ยน Streamlit เป็น Web UI
- เปลี่ยน PNG dashboard เป็น chart บนเว็บ แต่ควรยัง export ได้ถ้าจำเป็น
- จัดเก็บ output ใน folder แยก เช่น `data/outputs` ได้ ถ้าระบุชัดและไม่ทำลาย output เดิม

### สิ่งที่ต้องระวัง

- ข้อมูลหุ้นและ library จาก Yahoo Finance อาจให้ field ไม่ตรงกัน 100%
- ต้องจัดการ missing value ให้เหมือน Python เดิม
- ต้องเทียบสูตรด้วย sample data ก่อนสรุปว่า migration เสร็จ
- ต้องไม่ลบไฟล์ Python เดิม เพราะใช้เป็น reference และ fallback

## Prompt สำหรับส่งต่อให้ AI ทำงานต่อ

คัดลอกข้อความด้านล่างนี้ให้ AI ตัวอื่นหรือรอบถัดไปได้ทันที:

```text
คุณกำลังทำงานในโปรเจกต์ D:\StockInvestment\StockInvestment บน branch codex-node-web-app-migration

กฎสำคัญ:
- ต้องอ่าน plan.md ก่อนเริ่มงานทุกครั้ง
- ห้ามลบ plan.md
- ทำงานตาม Task list ใน plan.md ทีละข้อ
- เมื่อทำ Task ใดเสร็จ ต้องอัปเดต plan.md พร้อมวันที่และเวลาเสร็จ
- ต้องคงผลลัพธ์การทำงานเดิมของ Python ให้เทียบเท่ามากที่สุด
- ห้ามลบหรือเขียนทับไฟล์ Python เดิมโดยไม่จำเป็น

เป้าหมาย:
แปลงโปรแกรมวิเคราะห์หุ้นไทยจาก Python เป็น Node.js Web App ที่ใช้งานง่าย โดยยังคงความสามารถเดิม ได้แก่ ดึงข้อมูลหุ้น, วิเคราะห์คะแนน, สร้างหุ้นแนะนำ, วิเคราะห์พอร์ต Excel, dashboard, screener, sector analysis และ strategy simulation

สถานะล่าสุด:
- T00 Done: เตรียม branch แล้ว
- T01 Done: สร้าง plan.md แล้ว
- T02 Done: สรุป behavior contract ของระบบเดิมแล้ว
- T03 Done: เลือกสถาปัตยกรรม Node.js Web App แล้ว
- T04 Done: สร้างโครงโปรเจกต์ Node.js แล้ว
- T05 Done: Port ระบบดึงข้อมูลหุ้นขั้นแรกแล้ว
- T06 Done: Port ระบบวิเคราะห์และให้คะแนนหุ้นแล้ว
- T07 Done: Port ระบบวิเคราะห์พอร์ตและสร้าง Excel report แล้ว
- T08 Done: สร้าง Web UI สำหรับใช้งานจริงขั้นแรกแล้ว
- T09 Done: Port strategy simulation แล้ว
- T10 Done: ตรวจสอบผลลัพธ์เทียบ Python เดิมแล้ว
- T11 Done: เพิ่มคู่มือใช้งาน Web App แล้ว
- T12 Done: แก้ Sector Analysis แล้ว
- T13 Done: ยกระดับเป็น SaaS prototype พร้อม login/subscription และ UI professional แล้ว
- T14 Done: เพิ่ม Guide profile สำหรับมือใหม่, owner-only Business dashboard และ SaaS metrics แล้ว
- T15 Done: เพิ่ม Visual Intelligence Dashboard สำหรับ Portfolio/Screener/Sector/Business โดยไม่เพิ่ม dependency แล้ว
- T16 Done: เพิ่ม local subscription checkout, billing events, customer billing history และ revenue metrics แล้ว
- T17 Done: เพิ่ม role/permission, team APIs, advisor assignment และ Team/Client workspace แล้ว
- T18 Done: เพิ่ม audit log/activity timeline, API `/api/audit/events`, Recent activity UI และ activity metrics แล้ว
- T19 Done: เพิ่ม organization/workspace model, workspace APIs, Business UI, member move และ workspace metrics แล้ว
- T20 Done: เพิ่ม payment gateway/webhook prototype, payment sessions, duplicate reconciliation, payment metrics และ payment UI แล้ว
- T21 Done: เพิ่ม tenant metadata, normalize record organizationId, API `/api/tenant/scope`, Tenant isolation UI และ production-readiness notes แล้ว
- T22 Done: เพิ่ม signed payment webhook endpoint, HMAC verification, timestamp tolerance, rejected webhook logging และ webhook security metrics แล้ว
- T23 Done: เพิ่ม audit hash chain, API `/api/audit/integrity`, audit integrity metrics/UI และ tamper detection แล้ว
- T24 Done: เพิ่ม automated tenant access regression tests, npm test scripts และเอกสารตรวจ role/workspace isolation แล้ว
- T25 Done: เพิ่ม automated subscription lifecycle regression tests, npm test script, docs และแก้ rejected webhook metadata gap แล้ว
- T26 Done: เพิ่ม GitHub Actions CI quality gate, `npm run ci:quality` และเอกสาร CI regression แล้ว
- T27 Done: เพิ่ม state schema manifest, storage readiness API/UI, regression test และเอกสาร production database migration foundation แล้ว
- T28 Done: เพิ่ม state repository layer, repository metadata, regression test และผูกเข้า CI quality gate แล้ว
- T29 Done: เพิ่ม append-only audit trail mirror, API/UI metrics, regression test และเอกสาร audit mirror แล้ว
- T30 Done: เพิ่ม approval workflow prototype, API/UI, schema, audit events, metrics และ regression test แล้ว
- T31 Done: เพิ่ม chart interaction ใน Screener ด้วย sector/trend filter และคลิก Sector count bar เพื่อ drilldown แล้ว
- T32 Done: เพิ่ม external audit provider แบบ HTTP webhook, HMAC signature, receipt readiness และ regression test แล้ว
- T33 Done: เพิ่ม dependency risk gate, accepted risk register และผูกเข้า CI quality แล้ว
- T34 Done: เพิ่ม server factory และ automated web smoke regression สำหรับตรวจ Web App/API/UI markers โดยไม่ต้องเปิด background server แล้ว
- T35 Done: เพิ่ม Postgres state adapter แบบ opt-in หลัง repository layer พร้อม bootstrap SQL, fake-client regression, docs และ CI quality แล้ว
- T36 Done: เพิ่ม Stripe Checkout provider แบบ opt-in, raw-body provider webhook endpoint, payment provider regression, docs และ CI quality แล้ว
- T37 Done: เพิ่ม one-time importer จาก `app-state.json` เข้า Postgres พร้อม dry-run/readiness guard, fake-client regression, docs และ CI quality แล้ว
- T38 Done: เพิ่ม package entitlement enforcement สำหรับ Starter/Pro/Advisor พร้อม upgrade card UI, regression test, docs และ CI quality แล้ว
- T39 Done: เพิ่ม backup/restore drill สำหรับ local state/audit files พร้อม manifest/checksum, dry-run/confirm guard, regression test, docs และ CI quality แล้ว
- T40 Done: เพิ่ม Postgres query-level tenant scoped read helper พร้อม SQL WHERE guard, regression test, docs และ CI quality แล้ว
- T41 Done: เพิ่ม operational readiness API, alert rules, Business dashboard alert cards, observability regression, docs และ CI quality แล้ว
- T42 Done: เพิ่ม production Postgres backup runbook generator, CLI, secret masking, regression test, docs และ CI quality แล้ว
- T43 Done: เพิ่ม production deployment checklist dry-run, CLI strict mode, secret masking, regression test, docs และ CI quality แล้ว
- T44 Done: เพิ่ม operational alert delivery webhook แบบ opt-in, HMAC signature, dry-run/required mode, regression test, docs และ CI quality แล้ว
- T45 Done: เพิ่ม frontend viewport/auth regression, mobile responsive polish, docs และ CI quality แล้ว แต่ in-app browser screenshot จริงยังถูก Windows sandbox บล็อก จึงบันทึกเป็นข้อจำกัด
- T46 Done: ถอด `portfolio_aom.xlsx`, `portfolio_eak.xlsx` และ report ที่เกี่ยวข้องออกจาก Git index, ปรับ CI/compare ให้ใช้ synthetic portfolio แทน private files และ push commit `0a8096c` ไป GitHub สำเร็จแล้ว
- T47 Deferred - Ready for Force Push: rewrite history ของ clone ชั่วคราวเพื่อลบ private portfolio files ออกจาก branch `codex-node-web-app-migration` แล้ว ตรวจไม่พบไฟล์ใน history ของ clone ชั่วคราว แต่ผู้ใช้ให้ข้าม GitHub push ไว้ก่อน เพราะ HTTPS helper crash และ SSH ยังไม่มี public key ที่ GitHub ยอมรับ
- T48 Done: เพิ่ม `tenantScopeService`, service-level scoped read wrapper สำหรับ customer/workspace read APIs, `npm run test:scoped-read`, docs และ CI quality ผ่าน
- T49 Done: เพิ่ม `statePatchService`, `patchAppState`, `npm run test:state-patch`, docs และ CI quality ผ่าน เพื่อเป็น foundation ของ narrower write model
- T50 Done: ย้าย investor profile save, payment session creation และ approval request creation ไปใช้ `patchAppState()` พร้อม paired audit append, เพิ่ม regression ใน `test:state-patch`, docs และ CI quality ผ่าน
- T51 Done: ย้าย payment webhook success/failure, rejected webhook logging, billing activation และ approval decisions ไปใช้ patch writes, เพิ่ม already-paid webhook regression, docs และ CI quality ผ่าน
- T52 Done: ย้าย organization create/update, member move, role update และ advisor assignment/unassignment ไปใช้ patch writes, เพิ่ม tenant access regression สำหรับ organization create/update, docs และ CI quality ผ่าน
- T53 Done: ย้าย session create/logout/expired cleanup และ standalone `recordAuditEvent()` ไปใช้ patch writes, เพิ่ม session patch regression และ frontend logout smoke coverage, docs และ CI quality ผ่าน
- T54 Done: ย้าย `createUser()`, `loginUser()` และ `saveCustomerPortfolioSnapshot()` ไปใช้ patch writes, เพิ่ม first-owner/customer workspace/login/snapshot upsert regression, docs และ CI quality ผ่าน
- T55 Done: เพิ่ม Postgres collection-level patch write adapter prototype เพื่อ map `upsert`, `append`, `delete` จาก `patchAppState()` ไปยัง table-level transaction จริง, fake-client regression/docs และ CI quality ผ่าน
- T56 Done: เพิ่ม Postgres patch write staging validation runbook/CLI dry-run, readiness flags, patch smoke matrix, secret masking, deployment checklist preflight, docs และ CI quality ผ่าน
- T57 Done: เพิ่ม Postgres patch smoke execution harness แบบ dry-run-first/confirm guard, evidence output, audit hash canary event, regression/docs และ CI quality ผ่าน
- T58 Done: เพิ่ม owner/admin Launch Evidence Center ใน Business dashboard, API/service helper, secret masking, frontend markers, docs และ CI quality ผ่าน
- T59 Deferred - Browser Localhost Blocked: Browser runtime เชื่อมได้แล้ว แต่เปิด `localhost`/`127.0.0.1` ของ Web App ถูกบล็อกด้วย `net::ERR_BLOCKED_BY_CLIENT`; PowerShell health check ผ่าน จึงยังไม่ได้ทำ screenshot QA จริง
- T60 Done: เพิ่ม Launch Evidence Center UI/API guardrail regression, importer dry-run marker visibility, secret masking checks, docs และ CI quality ผ่าน
- T61 Done: เพิ่ม Launch Evidence JSON/text export/sign-off pack, copy/download action ใน Business dashboard, regression/docs และ CI quality ผ่าน
- T62 Done: เพิ่ม audit logged Launch Evidence export trail, Recent activity refresh, regression/docs และ CI quality ผ่าน exit code 0
- T63 Done: แก้ Python comparison reference drift แล้ว โดยทำให้ JS parse missing numeric เป็น `NaN` เหมือน Python, `compare:python` fail เมื่อ mismatch และผลล่าสุด numeric/text/sector mismatch = 0
- T64 Done: เพิ่ม live market data coverage report, CLI `npm run market:coverage`, regression `npm run test:market-coverage`, endpoint/download link, docs และ CI quality ผ่าน; report ล่าสุดพบ rows 851, complete coverage 57.11%, unknown sectors 18, missing PE 245, ROE 39, Yield 242, D/E 75, missing reference rows 0
- T65 Done: เพิ่ม production reference master/fundamental enrichment foundation, importer `npm run reference:import`, master-first CSV fallback, metadata, regression และ CI quality ผ่าน; master ล่าสุด rows 851, complete 486, needs review 365
- T66 Done: เพิ่ม loading/progress UX ตอนกด `Analyze my portfolio`, disable/restore ปุ่ม, success/error state, accessibility markers, docs และ CI quality ผ่าน
- T67 Done: เพิ่ม owner/admin Reference Master Review UI/API, freshness summary, edit workflow, audit event `reference_master.review`, regression `test:reference-master-admin`, docs และ CI quality ผ่าน
- T68 Done: เพิ่ม reference master repository/database adapter foundation, Postgres table bootstrap SQL, migration dry-run plan, freshness report CLI `reference:freshness`, fake-client regression `test:reference-master-database`, docs และ CI quality ผ่าน
- T69 Done: เพิ่ม reference master migration service/CLI `reference:migrate`, dry-run-first/confirm guard, staging/backup/plan-reviewed/production guards, evidence output, secret masking, fake-client regression `test:reference-master-migration`, docs และ CI quality ผ่าน
- T70 Done: เพิ่ม Reference Master Launch Evidence Integration ให้ owner/admin เห็น readiness ของ reference master freshness/migration ใน Launch Evidence Center โดย frontend ไม่ execute command พร้อม env markers, blocked guard, sign-off export และ regression coverage
- T71 Done: เพิ่ม beginner guide และ tooltip ในหน้า Screener สำหรับ `Min Score`, `Min RRR`, `Max D/E`, `Sector` และ `Trend` พร้อมค่าแนะนำสำหรับมือใหม่, CSS responsive/accessibility, regression markers, docs และ CI quality ผ่าน
- T72 Done: เพิ่ม controls ให้ Recommended actions ในหน้า Portfolio สำหรับ filter Symbol/Action/Sector/Trend/Min Score, Order by/direction, field picker, reset view, responsive CSS, regression markers, docs และ CI quality ผ่าน
- T73 Done: แก้ initialization bug ของ Recommended actions โดยย้าย `recommendedActionFields` และ `recommendedActionSortFields` ไปก่อน `await initialize()` พร้อม regression guard `recommended-actions-initialization-order`
- T74 Done: เพิ่ม SQLite state adapter foundation แบบ opt-in สำหรับ trial/demo ผ่าน `APP_STATE_REPOSITORY=sqlite` และ `SQLITE_DATABASE_PATH`, default ยังเป็น `local_file`, production ยังแนะนำ `postgres`, regression/docs/CI quality ผ่าน
- T75 Done: เพิ่ม SQLite trial to Postgres promotion service/CLI `npm run sqlite:promote` แบบ dry-run-first พร้อม backup/review/pg-driver guard, secret masking, fake-client regression, docs และ CI quality ผ่าน
- T76 Done: เพิ่ม Database Mode Advisor ใน Business dashboard/storage readiness ให้ owner/admin เห็น adapter ปัจจุบัน, production readiness, warning/blocker, recommended action และ command ถัดไปสำหรับ local_file/sqlite/postgres พร้อม regression/docs/CI quality ผ่าน
- T77 Done: เพิ่ม Production Environment Advisor ใน Business dashboard/business metrics จาก deployment checklist ให้ owner/admin เห็น production env readiness, env groups, blocker/warning, next action และ command list โดยไม่เปิดเผย secret พร้อม regression/docs/CI quality ผ่าน
- T78 Done: เพิ่ม Download portfolio/watchlist template ในหน้า Run Analysis พร้อม endpoints `/api/analysis/template/portfolio` และ `/api/analysis/template/watchlist`; portfolio template มี header `Symbol`, `Quantity`, `Avg_Price` และไม่มี holding data พร้อม regression/docs/CI quality ผ่าน
- T79 Done: ปรับ watchlist template ไม่ให้เป็นไฟล์เปล่า โดยใส่คำแนะนำแบบ comment `#`, ตัวอย่างรูปแบบที่ไม่ถูกนำไปวิเคราะห์ และปรับ `parseWatchlistText()` ให้ ignore comment พร้อม regression/docs/CI quality ผ่าน
- T80 Done: เปลี่ยน public download filename ของ raw CSV จาก `siamchart_raw.csv` เป็น `raw_CSV.csv` ใน `/api/analysis/raw` และ UI link โดยยังคง internal file `siamchart_raw.csv` เพื่อ Python parity/regression compatibility พร้อม web smoke/docs/CI quality ผ่าน
- T81 Done: sanitize live data coverage report `source.targetFile` ให้แสดง public filename `raw_CSV.csv` และ sanitize `source.fallbackReference` เป็นชื่อไฟล์กลาง ไม่ expose absolute path หรือ internal name `siamchart_raw.csv` พร้อม regenerate output JSON, market coverage/web smoke/docs/CI quality ผ่าน
- T82 Done: แก้ Portfolio ไม่แสดงข้อมูลจาก zero-row live market fetch โดยห้ามทับ raw/recommended/snapshot เดิมด้วยไฟล์ว่าง, เพิ่ม reference fallback เมื่อ live fetch ล้ม, เพิ่ม Portfolio warning และ regression `test:analysis-portfolio-flow` เข้า CI quality ผ่าน
- T83 Done: เพิ่ม recovery tool `npm run portfolio:recover-zero-market` แบบ dry-run-first สำหรับ snapshot ที่ market value เป็น 0/No Data, เพิ่ม regression `test:portfolio-recovery`, แก้ regression ไม่ให้ injected-state confirm แตะ `data/app-state.json` จริง, และกู้ demo state จาก clone เก่า/merge audit events แล้ว
- T84 Done: เพิ่ม Portfolio Data Health สำหรับ owner/admin ใน Business dashboard และ API `GET /api/admin/portfolio-health` แบบ read-only เพื่อดู healthy/repairable/skipped snapshots, command dry-run/confirm, safeguards, owner/customer guard, regression/docs และ CI quality ผ่าน
- T85 Done: เพิ่ม support context และ CSV export ให้ Portfolio Data Health โดยแสดง customer name/email/workspace/plan, เพิ่ม `GET /api/admin/portfolio-health/export`, audit action `portfolio_health.export`, owner/customer guard, regression/docs และ CI quality ผ่าน
- T86 Done: เพิ่ม Portfolio Data Health support filters สำหรับค้นหา customer/email/workspace/plan, filter status, order by generated/status/customer/workspace/market value, direction, reset view, frontend markers/docs และ CI quality ผ่าน
- T87 Done: commit หลัก `e53eea5 Improve portfolio health support workflows` และ push ไป `origin/codex-node-web-app-migration` สำเร็จแล้ว โดยไม่ commit `data/app-state*.json` backup/runtime state และยังไม่สร้าง PR/merge เข้า main
- T88 Done: เพิ่ม System Admin panel และ User Management panel ในหน้า Business ให้ owner/admin เห็นการจัดการ user, role, package, workspace, advisor assignment และ system readiness ชัดเจนขึ้น พร้อม docs/regression markers และ targeted tests ผ่าน
- T89 Done: commit `5bfc3e9 Add system admin management surface` และ push ไป `origin/codex-node-web-app-migration` สำเร็จแล้ว ยังไม่สร้าง PR/merge เข้า main
- T92 Done: เพิ่ม click filter ให้ `Action mix` และ `Score distribution` ในหน้า Portfolio เพื่อกรอง Recommended actions ตาม action group และ score band พร้อม selected/reset behavior, docs/regression markers, targeted tests ผ่าน และ commit/push `a332b42 Add portfolio visual filters` สำเร็จ
- T93 Done: เพิ่ม click filter ให้ `Sector exposure` ในหน้า Portfolio เพื่อกรอง Recommended actions ตาม sector พร้อม selected/reset behavior, docs/regression markers และ targeted tests ผ่าน
- T94 Done: เพิ่ม click highlight ให้กราฟหุ้นในหน้า `Stock Screener` และ `Sector Analysis` โดยคลิกหรือกด Enter/Space ที่หุ้นใน scatter/bar chart แล้ว scroll/focus/highlight แถวหุ้นเดียวกันในตาราง พร้อม docs/regression markers และ targeted tests ผ่าน
- T95 Done: เพิ่มสีเขียวให้ `Top ideas` ในหน้า Screener ทั้ง bar และจุดหุ้นเดียวกันใน `Quality vs reward` scatter เพื่อสื่อว่าเป็นหุ้น recommend และ focus ง่ายขึ้น
- T96 Done: ปรับ scope สีเขียวของ Top ideas ให้เหลือเฉพาะจุดวงกลมใน `Quality vs reward` ที่เป็นหุ้นตัวเดียวกับ Top ideas; `Top ideas` bar ใช้สีเดิมแต่ยังคลิก highlight ตารางได้
- T97 Done: เพิ่ม Simulation แบบแบ่งซื้อหลายไม้ โดยคง Lump Sum เดิม, เพิ่ม Split Buy ที่กำหนดจำนวนไม้/ระยะห่าง trading days, backend ปล่อยเงินแต่ละไม้เข้า strategy, frontend แสดง average cost/completed tranches/deployed capital/Split Buy Plan และเพิ่ม regression `npm run test:simulation-split-buy`; commit/push สำเร็จใน `31fcdb8 Improve chart focus and split-buy simulation`
- T98 Done: ยกระดับ `Sector Analysis` เป็น Pro Sector Intelligence โดยเพิ่ม Sector Score Ranking, Rotation Signal, Portfolio Sector Risk และ Quality vs Valuation Context เพื่อแยกบทบาทจาก Screener ให้ชัดเจน; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 08:46:33 +07:00
- T99 Done: ปรับ `Sector Analysis` ให้มือใหม่ใช้ง่ายขึ้น โดยเพิ่ม beginner summary 3 ช่อง, ลด panel เหลือคำถามหลัก, ซ่อนตารางขั้นสูงใน details และแปล signal/risk เป็นภาษาง่าย โดยคง logic Pro Sector Intelligence เดิม; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 08:57:14 +07:00
- T100 Done: เพิ่ม hint ใน header ตารางผ่าน `tableColumnTips` และ `renderTableHeader()` สำหรับคอลัมน์ลงทุนหลัก เช่น Score/RRR/PE/ROE/D/E/RSI/Portfolio Risk พร้อม tooltip ภาษาง่ายที่บอกความหมาย ค่าแนะนำ และข้อควรระวัง; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 09:32:39 +07:00
- T101 Done: แก้ error `can't access lexical declaration 'tableColumnTips' before initialization` โดยย้าย `tableColumnTips` ไปก่อน `await initialize()` และเพิ่ม regression guard; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 09:53:21 +07:00
- T102 Done: ตรวจ `Other` ใน Portfolio Sector exposure แล้วพบว่าเป็นการรวม sector ที่เหลือจาก limit เดิม ไม่ใช่ sector จริง; ปรับให้แสดง sector จริงทั้งหมดในพอร์ตและเพิ่มข้อความ/marker ว่าไม่มีการรวมเป็น Other; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 10:00:57 +07:00
- T103 Done: เพิ่มกราฟ Simulation แบบ Python version ในหน้าเว็บ โดยใช้ native SVG แสดง `Portfolio_Value` เทียบ `Buy_Hold_Value`, legend, winner card และ guide วิธีอ่านสำหรับมือใหม่ โดยไม่เปลี่ยน backend calculation; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 10:37:13 +07:00
- T104 Done: ปรับ launch scope ให้ขายจริงเฉพาะ Starter 790 THB/month และ Pro 1,490 THB/month ก่อน โดย public pricing/API/checkout เปิดแค่สองแพ็กเกจ, Advisor แสดงเป็น coming soon/manual contact, backend ยังเก็บ internal entitlement สำหรับอนาคต และเพิ่ม package expiry check จาก `trialEndsAt`/`renewsAt`; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 13:32:52 +07:00
- T105 Done: เพิ่ม manual subscription admin controls ให้ owner/admin จัดการ package Starter/Pro, status และ expiry date จาก User Management ได้ แม้ยังไม่มี online payment เต็มรูปแบบ พร้อม audit event `team.subscription_update`; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 13:43:27 +07:00
- T106 Done: ทำให้ Guide profile มีผลที่ผู้ใช้เห็นจริงใน Portfolio/Screener/Simulation โดยเพิ่ม Guide impact summary, personalized portfolio guidance, Screener default filter จาก risk/experience และ Simulation default จาก monthly budget/risk/horizon; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 13:55:53 +07:00
- T107 Done: ซ่อน Guide จาก launch UI, ถอด Guide personalization ออกจาก Portfolio/Screener/Simulation, ลดความรกหน้า Portfolio เหลือ quick guidance 3 ช่องและเอา profile completion UI ที่ไม่มีที่กรอกแล้วออก; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 14:16:49 +07:00
- T108 Done: ซ่อน Approvals จาก Starter/Pro launch UI, ถอด account pending text และ Business approval panel ออก, หยุด frontend load approval data ที่ไม่จำเป็น และคง backend approval foundation ไว้สำหรับ Advisor phase; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 18:55:23 +07:00
- T109 Done: แก้ hero/snapshot ด้านบนยืดยาวเมื่อเข้า Simulation โดยล็อก workspace grid/hero/snapshot ให้ align ด้านบนและสูงตามเนื้อหา พร้อม viewport regression guard; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 19:03:20 +07:00
- T110 Done: เปลี่ยน launch flow เป็น manual admin package assignment โดยสมาชิกใหม่เป็น Starter inactive/manual pending, หน้า plan ไม่ checkout, checkout/payment-session route ถูกปิดชั่วคราว และ owner/admin กำหนด Starter/Pro/status/expiry ใน Business > User Management; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 19:32:31 +07:00
- T111 Done: ลดความรกหน้า Business โดยเปลี่ยนเป็น admin cockpit แบ่งหมวด Package Management, Users & Workspace, Data Health และ Go-live Readiness พร้อม default เข้า Package Management; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 20:09:37 +07:00
- T112 Done: ตรวจ admin package flow แล้วผ่าน โดย owner/admin update package ให้สมาชิกได้, customer update เองไม่ได้, audit `team.subscription_update` ยังบันทึก และ tenant regression ถูกปรับให้ตรงกับ manual package flow; งานนี้ยังเป็น working tree change หากยังไม่ได้ commit หลังเวลาจบ 2026-06-18 20:29:04 +07:00
- Task list ชุดนี้เหลือ T47 ที่ถูก defer เฉพาะขั้น force push ไป GitHub และ T59 ที่ต้องรอ Browser/in-app browser ใช้งานได้
- งานต่อยอดที่แนะนำถ้ายังไม่กลับไปทำ GitHub: กลับมาทำ T59 Browser Visual QA เมื่อ Browser สามารถเปิด localhost ได้, ตั้งค่า operational alert webhook ไปยัง Slack/email/APM/uptime monitor จริงใน staging/production, ซ้อม Postgres restore จริงใน staging/production-like environment หรือ run deployment checklist แบบ strict ใน staging ที่ตั้ง env จริง

ให้เริ่มจากอ่าน plan.md ก่อนเสมอ หากต้องการทดลอง SQLite ให้ตั้ง `APP_STATE_REPOSITORY=sqlite` และ `SQLITE_DATABASE_PATH=data/stockflix.sqlite`; หากต้องการ promote จาก SQLite trial ไป Postgres ให้รัน `npm run sqlite:promote -- --sqlite data/stockflix.sqlite --dry-run --format text` ก่อน แล้วตั้ง `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL`, `SQLITE_TO_POSTGRES_PG_DRIVER_READY=true`, `SQLITE_TO_POSTGRES_BACKUP_EVIDENCE=<snapshot-or-pgdump-id>`, `SQLITE_TO_POSTGRES_PROMOTION_REVIEWED=true` ก่อนใช้ `--confirm`; launch scope ตอนนี้คือขาย/ทดลองใช้งานจริงเฉพาะ Starter 790 THB/month และ Pro 1,490 THB/month ก่อน โดย `/api/subscription/plans` ส่ง public plans แค่ `starter,pro`, ส่ง Advisor ใน `deferredPlans`, frontend แสดง Advisor เป็น coming soon/manual contact, สมาชิกใหม่หลัง owner คนแรกเป็น Starter `inactive` provider `manual_admin_pending` เพื่อรอ admin เปิดสิทธิ์, และ public checkout/payment-session route ถูกปิดชั่วคราวด้วย `manual_admin_assignment` เพราะช่วงแรกยังไม่รับชำระผ่านเว็บ; subscription ต้องตรวจวันหมดอายุจาก `trialEndsAt` สำหรับ trialing และ `renewsAt` สำหรับ active ถ้าหมดอายุต้องเป็น `past_due`; owner/admin จัดการ package แบบ manual จาก Business > Package Management โดยเลือก Starter/Pro, status และ expiry date ผ่าน API `POST /api/admin/users/:userId/subscription` และต้องมี audit event `team.subscription_update`; admin flow ล่าสุดตรวจผ่านแล้ว ได้แก่ owner update customer เป็น Pro active ได้, customer update package เองโดน 403, tenant/customer guard ผ่าน และ regression ต้องเปิด package ให้ customer ก่อน save portfolio ตาม manual flow; หน้า Business ถูกลดความรกแล้ว เป็น admin cockpit แบ่งหมวด `Package Management`, `Users & Workspace`, `Data Health`, `Go-live Readiness` และ default เข้า Package Management ห้ามกลับไป render ทุก admin panel พร้อมกันในหน้าเดียวโดยไม่มี requirement ใหม่; Guide และ Approvals ถูกซ่อนจาก launch UI แล้ว ห้ามใส่กลับใน navigation โดยไม่มี requirement ใหม่ ส่วน backend investor profile service และ backend approval foundation ยังเก็บไว้ภายในสำหรับอนาคต; หน้า Portfolio ถูกลดความรกแล้ว เหลือ metric สรุป, warning ที่จำเป็น, quick guidance 3 ช่อง, visual filters และ Recommended actions controls โดยไม่อ้าง Guide personalization; hero/snapshot ด้านบนถูกแก้ layout แล้ว โดย workspace grid, hero panel และ snapshot card ต้อง align ด้านบนและสูงตามเนื้อหา ห้ามกลับไปใช้ stretch ที่ทำให้ Simulation view ดันพื้นที่ด้านบนยาวผิดปกติ; หน้า Portfolio มี `Sector exposure`, `Action mix` และ `Score distribution` ที่คลิกเพื่อกรอง Recommended actions ตาม sector, action group หรือ score band ได้ โดย Reset view ต้องล้าง visual filter ด้วย; หน้า Run Analysis มี Download blank portfolio template และ Download watchlist guide template แล้ว โดย portfolio template ต้องไม่มี holding data แถวตัวอย่าง ส่วน watchlist template มีคำแนะนำแบบ `#` และ parser ต้อง ignore บรรทัด `#`; raw CSV download จากหน้าเว็บต้องได้ชื่อ `raw_CSV.csv` แม้ internal compatibility file ยังชื่อ `siamchart_raw.csv`; coverage report JSON ที่ผู้ใช้ดาวน์โหลดต้องให้ `source.targetFile` เป็น `raw_CSV.csv` และให้ `source.fallbackReference` เป็นชื่อไฟล์กลาง เช่น `market-reference-master.json -> recommended_stocks.csv` โดยห้าม expose absolute path หรือ internal name `siamchart_raw.csv`; analysis run ต้องไม่ทับ raw/recommended/snapshot เดิมถ้า live market fetch ได้ 0 rows และควรใช้ reference fallback เมื่อมี reference row เพื่อไม่ให้หน้า Portfolio กลายเป็นข้อมูลว่าง ให้ตรวจด้วย `npm run test:analysis-portfolio-flow`; ถ้าพบ snapshot เก่าที่ market value เป็น 0/No Data ให้ดู Portfolio Data Health หรือรัน `npm run portfolio:recover-zero-market -- --format text` แบบ dry-run ก่อน และใช้ `--confirm` เฉพาะหลังตรวจผลแล้ว ให้ระวัง regression ที่มี injected state ต้องไม่แตะ `data/app-state.json` จริงและควรตรวจด้วย `npm run test:portfolio-recovery`. commit/push ล่าสุดบน GitHub คือ `31fcdb8 Improve chart focus and split-buy simulation`; ยังไม่ได้สร้าง PR/merge เข้า `main`. หากเป็น production ให้ใช้ `APP_STATE_REPOSITORY=postgres` และตั้ง `DATABASE_URL`/SSL/backup/Stripe/external audit/ops alert ตาม docs. หากต้องการทำ T47 ต่อ ให้แก้ GitHub auth ก่อนโดยเพิ่ม SSH public key ใน GitHub หรือซ่อม Git HTTPS แล้วเปิด PowerShell ที่ `C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo` จากนั้นรัน force push แบบมี lease ตามผลลัพธ์ T47 หากผู้ใช้ยังให้ข้าม GitHub ให้ทำงานต่อจาก T59 เมื่อ Browser/in-app browser สามารถเปิด localhost ได้ โดยเปิด Web App บน localhost, สมัคร owner account แรก, เปิด Business dashboard, ตรวจ System Admin/User Management, Database Mode Advisor, Production Environment Advisor, Portfolio Data Health/export/filters, Launch Evidence Center, Reference Master Review และ Reference master launch evidence ทั้ง desktop/mobile ว่า card, table, input, command และ metric ไม่ล้น/ทับกัน, ตรวจปุ่ม Download blank template ในหน้า Run Analysis, ตรวจ Portfolio visual click filters, ตรวจ customer access guard, ปรับ CSS/UI หากจำเป็น และบันทึกผลใน plan.md ห้าม revert `recommended_stocks.csv`, `siamchart_raw.csv`, `stock_analysis_dashboard.png` หรือ `__pycache__/stock_visualizer.cpython-312.pyc` โดยไม่ขออนุญาต เพราะเป็นไฟล์ modified ที่มีมาก่อนงาน T62/T63
```
