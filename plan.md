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

- สถานะ: Blocked at Push
- เริ่มเมื่อ: 2026-06-05 08:17:58 +07:00
- เสร็จเมื่อ: -
- Blocked เมื่อ: 2026-06-05 08:30:59 +07:00
- งานที่ต้องทำ:
  - ตรวจไฟล์ portfolio ส่วนตัวที่ถูก track อยู่
  - กัน `portfolio_eak.xlsx` และ `portfolio_aom.xlsx` ออกจาก Git ก่อน commit/push
  - กัน report ที่สร้างจาก portfolio ส่วนตัวออกจาก Git ด้วยเพื่อลดความเสี่ยงข้อมูลรั่ว
  - ปรับ regression/CI ไม่ให้พึ่งไฟล์ portfolio ส่วนตัว
  - อัปเดตเอกสารและ `plan.md`
  - รันทดสอบที่จำเป็นก่อน commit
  - commit และ push branch `codex-node-web-app-migration` ไป GitHub

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

- Push ไป GitHub ยังไม่สำเร็จใน sandbox นี้: `git ls-remote` เห็น GitHub ตอบ HTTP 401 แล้ว Git เรียก Credential Manager แต่ sandbox user ไม่มี GitHub credential; ไม่พบ `gh` CLI สำหรับ auth สำรอง
- commit พร้อม push อยู่ที่ clone ชั่วคราว: `C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo`
- คำสั่งสำหรับ push ต่อจากเครื่องที่ออก GitHub ได้:

```bash
cd C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo
git push origin codex-node-web-app-migration
```

- การถอดไฟล์ออกจาก commit รอบนี้เป็นการลบออกจาก Git index/branch ปัจจุบัน ไม่ใช่การลบออกจากประวัติ Git เก่าทั้งหมด หากไฟล์เคยถูก push ไป GitHub แล้วและต้องการลบจาก history จริง ต้องทำ history rewrite แยกต่างหากพร้อมพิจารณา force push อย่างระมัดระวัง

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
- T46 Blocked at Push: ถอด `portfolio_aom.xlsx`, `portfolio_eak.xlsx` และ report ที่เกี่ยวข้องออกจาก Git index, ปรับ CI/compare ให้ใช้ synthetic portfolio แทน private files และสร้าง commit ใน clone ชั่วคราวแล้ว แต่ push ไป GitHub ถูก sandbox/network บล็อก
- Task list ชุดนี้เหลือขั้น push ของ T46
- งานต่อยอดที่แนะนำ: full in-app browser screenshot QA เมื่อสภาพแวดล้อมอนุญาต, ถ้าต้องการลบ portfolio ส่วนตัวออกจาก GitHub history จริงให้ทำ history rewrite แยกต่างหาก, ตั้งค่า operational alert webhook ไปยัง Slack/email/APM/uptime monitor จริงใน staging/production, ซ้อม Postgres restore จริงใน staging/production-like environment, run deployment checklist แบบ strict ใน staging ที่ตั้ง env จริง และทยอยย้าย production endpoint เฉพาะ tenant มาใช้ `readScopedAppState()`

ให้เริ่มจากอ่าน plan.md ก่อนเสมอ หากต้องการทำ T46 ต่อ ให้ push จาก clone ชั่วคราว `C:\Users\saraw\AppData\Local\Temp\stockinvestment-commit-f3edadec9fef4a1599330dee2055a890\repo` ด้วย `git push origin codex-node-web-app-migration` ใน environment ที่ออก GitHub ได้ แล้วอัปเดต plan.md เป็น Done หลัง push สำเร็จ หากไม่มี Task ที่ Pending แล้ว ให้เลือกงานต่อยอดจากรายการแนะนำ หรือแก้ issue ที่ผู้ใช้แจ้ง และอัปเดต plan.md ทันทีเมื่อทำงานนั้นเสร็จ
```
