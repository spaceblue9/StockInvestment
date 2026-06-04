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

## บันทึกการอัปเดต

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
  - ตรวจ reference artifacts ที่ `npm run compare:python` ต้องใช้ ได้แก่ `siamchart_raw.csv`, `recommended_stocks.csv`, `portfolio_aom.xlsx`, `portfolio_aom_analysis_report.xlsx`
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
  - สร้าง JS portfolio report จาก `portfolio_aom.xlsx`
  - เทียบกับ `portfolio_aom_analysis_report.xlsx` เดิม
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
- `data/outputs/portfolio_aom_compare_analysis_report.xlsx`

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
- Task list ชุดนี้เสร็จครบแล้ว
- งานต่อยอดที่แนะนำ: production database adapter implementation, external immutable audit provider integration, approval workflow, chart interaction, verify browser, harden dependency และ real payment provider integration

ให้เริ่มจากอ่าน plan.md ก่อนเสมอ หากไม่มี Task ที่ Pending แล้ว ให้เลือกงานต่อยอดจากรายการแนะนำ หรือแก้ issue ที่ผู้ใช้แจ้ง และอัปเดต plan.md ทันทีเมื่อทำงานนั้นเสร็จ
```
