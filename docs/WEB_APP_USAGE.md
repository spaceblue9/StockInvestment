# คู่มือใช้งาน Node.js Web App

เอกสารนี้อธิบายวิธีใช้งาน Web App รุ่น Node.js สำหรับโปรแกรมวิเคราะห์หุ้นไทย โดยยังคงสูตรวิเคราะห์หลักจากระบบ Python เดิม

## สถานะปัจจุบัน

Web App รองรับความสามารถหลักเหล่านี้แล้ว:

- Register / Login / Logout
- แสดง subscription plan แบบรายเดือน
- เลือก plan และ checkout รายเดือนผ่าน local gateway default หรือ Stripe Checkout provider แบบ opt-in
- บังคับใช้ package entitlement สำหรับ Starter / Pro / Advisor ทั้ง backend และ frontend
- แสดง upgrade card เมื่อผู้ใช้เปิด feature ที่แพ็กเกจปัจจุบันยังไม่รวม
- รองรับ signed local gateway webhook และ Stripe-style provider webhook ที่ verify จาก raw body พร้อม timestamp tolerance
- account แรกที่สมัครในระบบจะเป็น owner สำหรับดู Business dashboard
- รองรับ role prototype: owner, admin, advisor, customer
- รองรับ workspace/organization prototype สำหรับจัดกลุ่ม platform team, customers และ client workspaces
- มี tenant isolation summary สำหรับดู visible workspace/user/records ตาม role
- owner สามารถเปลี่ยน role ได้
- owner/admin สามารถ assign advisor ให้ลูกค้าได้
- advisor เห็น client workspace เฉพาะลูกค้าที่ถูก assign
- มี approval workflow prototype ให้ owner/admin/advisor ขออนุมัติ action สำคัญ และให้ customer approve/reject ของตัวเอง
- มี activity timeline / audit log สำหรับ action สำคัญของระบบ
- มี audit integrity hash chain และ API ตรวจ hash chain สำหรับ owner/admin
- มี automated tenant access regression test สำหรับตรวจ role/workspace isolation ก่อนส่งมอบ
- มี automated subscription lifecycle regression test สำหรับตรวจ payment/webhook/billing flow ก่อนส่งมอบ
- มี automated package entitlement regression test สำหรับตรวจ Starter/Pro/Advisor upgrade gate ก่อนส่งมอบ
- มี automated payment provider regression test สำหรับตรวจ Stripe Checkout/provider webhook flow ก่อนส่งมอบ
- มี automated web smoke regression สำหรับตรวจหน้าเว็บ, health/auth API, navigation, Screener drilldown marker และ External Audit UI marker ก่อนส่งมอบ
- มี automated frontend viewport/auth regression สำหรับตรวจ mobile responsive guardrails และ owner/customer access flow แบบ in-process ก่อนส่งมอบ
- มี operational readiness API และ Business dashboard alert cards สำหรับดู production risk ของ storage, audit, payment, dependency gate และ repository
- มี operational alert delivery webhook แบบ opt-in สำหรับส่ง readiness alerts ไปยัง Slack/email/APM/uptime bridge พร้อม HMAC signature, dry-run และ required mode
- มี storage readiness report สำหรับเตรียมย้ายจาก local file ไป production database
- มี state repository layer สำหรับแยกการอ่าน/เขียน state ออกจาก business service
- มี state patch write foundation สำหรับ upsert/append/delete records ผ่าน repository boundary พร้อม append-only guard สำหรับ audit events และเริ่มใช้กับ account, portfolio snapshot, investor profile, payment, approval, workspace, team/admin และ auth session write flows สำคัญแล้ว
- มี Postgres state adapter แบบ opt-in ผ่าน `APP_STATE_REPOSITORY=postgres` และ `DATABASE_URL`
- Postgres adapter เริ่มรองรับ collection-level patch writes โดย map `upsert`, `append`, `delete` เป็น table-level transaction สำหรับ `patchAppState()`
- มี Postgres scoped read helper สำหรับบังคับ tenant filter ใน SQL query ก่อนดึง JSONB record
- มี service-level scoped read wrapper สำหรับ customer/workspace read APIs สำคัญ เพื่อให้ local file mode มี filter guard และต่อยอด Postgres query-level scope ได้
- มี one-time importer จาก `data/app-state.json` เข้า Postgres พร้อม dry-run readiness guard
- มี backup/restore drill สำหรับ local state, audit mirror และ external audit receipts พร้อม checksum และ confirm guard
- มี Postgres patch write staging validation runbook แบบ dry-run สำหรับตรวจ readiness, secret masking, patch smoke plan, scoped read verification และ rollback plan ก่อนใช้ database จริง
- มี Postgres patch smoke harness แบบ dry-run-first สำหรับ staging canary writes พร้อม `--confirm` guard, evidence output และ secret masking
- มี Launch Evidence Center ใน Business dashboard สำหรับ owner/admin เพื่อรวม command/evidence ก่อนเปิดขายจริง โดย frontend ไม่รันคำสั่งและ API ไม่เปิดเผย secret
- มี production deployment checklist แบบ dry-run สำหรับตรวจ env, Postgres, Stripe, webhook, external audit, backup และ CI gate โดย mask secret เสมอ
- มี append-only audit trail mirror แบบ local NDJSON สำหรับเตรียมต่อยอดเป็น external immutable audit storage
- เก็บ investor onboarding profile ของลูกค้า
- บันทึก portfolio snapshot ของลูกค้า
- Upload watchlist เป็นไฟล์ `.txt`
- Upload portfolio เป็นไฟล์ `.xlsx` หรือ `.xls`
- ดึงข้อมูลราคาหุ้นไทยด้วย ticker `.BK`
- สร้าง `siamchart_raw.csv`
- วิเคราะห์หุ้นและสร้าง `recommended_stocks.csv`
- วิเคราะห์พอร์ตและสร้าง Excel report
- แสดง Portfolio, Stock Screener, Sector Analysis และ Strategy Simulation บนหน้าเว็บ
- แสดง visual dashboard เช่น sector exposure, action mix, quality vs reward, sector leaders และ customer funnel
- มีสคริปต์เทียบผลกับ output Python เดิม

## ติดตั้ง

```bash
npm install
```

ถ้าเครื่องมีปัญหาสิทธิ์เขียน npm cache สามารถใช้ cache ภายในโปรเจกต์ได้:

```bash
npm install --cache .\.npm-cache
```

## เปิดใช้งาน

```bash
npm start
```

จากนั้นเปิด browser ไปที่:

```text
http://localhost:3000
```

ระหว่างพัฒนา สามารถใช้:

```bash
npm run dev
```

## วิธีใช้งานหน้าเว็บ

1. เปิดหน้า Web App
2. สมัครสมาชิกหรือเข้าสู่ระบบ
3. เลือกไฟล์ watchlist ถ้ามี
4. เลือกไฟล์ portfolio ถ้ามี
5. กด `Analyze my portfolio`
6. รอระบบดึงข้อมูลและวิเคราะห์
7. ดาวน์โหลดไฟล์ผลลัพธ์จาก link ที่แสดงบนหน้าเว็บ
8. เลือก view ที่ต้องการดู:
   - `My Portfolio`
   - `Guide`
   - `Approvals`
   - `Stock Screener`
   - `Sector Analysis`
   - `Strategy Simulation`
   - `Business` เฉพาะ owner account

## Visual Dashboard

Web App มี visual dashboard ในตัวโดยไม่ต้องติดตั้ง chart library เพิ่ม:

- `My Portfolio`: sector exposure, action mix และ score distribution
- `Stock Screener`: quality vs reward scatter, top ideas, sector/trend filter และ sector count ที่คลิกเพื่อ drilldown ตารางได้
- `Sector Analysis`: sector leaders, benchmark และ timing vs quality scatter
- `Business`: customer funnel และ plan distribution สำหรับ owner account

กราฟเหล่านี้ช่วยให้ผู้ใช้มือใหม่เห็นภาพรวมก่อนอ่านตารางรายละเอียด และยังคงข้อมูลตารางเดิมไว้สำหรับตรวจสอบเชิงลึก

## Guide สำหรับผู้เริ่มต้น

หน้า `Guide` ใช้เก็บข้อมูลพื้นฐานของผู้ลงทุน เช่น:

- เป้าหมายลงทุน
- ระดับประสบการณ์
- ระดับความเสี่ยงที่รับได้
- งบลงทุนรายเดือน
- ระยะเวลาที่ต้องการถือ

ข้อมูลนี้ถูกใช้เพื่อทำให้ guidance card ในหน้า Portfolio อธิบายพอร์ตด้วยภาษาที่เหมาะกับผู้ใช้มากขึ้น เช่น เน้นปกป้องเงินต้นสำหรับความเสี่ยงต่ำ หรือเตือนให้ใช้ Stop Loss สำหรับความเสี่ยงสูง

## Approval Workflow Prototype

หน้า `Approvals` ใช้สำหรับ workflow ที่ต้องให้ลูกค้ายืนยันก่อน action สำคัญ เช่น rebalance, buy plan หรือ risk action:

- owner/admin สร้าง approval request ให้ customer ได้
- advisor สร้าง approval request ได้เฉพาะลูกค้าที่ถูก assign ให้ดูแล และต้องอยู่แพ็กเกจ Advisor
- customer เห็นเฉพาะ approval request ของตัวเอง
- customer เป็นคน approve หรือ reject request ของตัวเองเท่านั้น
- ทุกการสร้าง request และคำตัดสินจะถูกบันทึกใน activity timeline และ audit hash chain

หน้า `Business` จะแสดงจำนวน pending, approved และ rejected approvals เพื่อช่วยให้ทีมบริการเห็นงานค้างที่ต้องติดตาม

## Business Dashboard Prototype

หน้า `Business` แสดงเฉพาะ owner account และเป็น prototype สำหรับเจ้าของบริการ subscription โดยมีตัวเลขหลัก เช่น:

- จำนวน users
- จำนวน trial users
- MRR estimate
- paid users
- revenue collected
- ARPU
- จำนวน portfolio snapshots ที่ลูกค้าบันทึก
- profile completion rate
- portfolio attach rate
- users by plan
- users by role
- workspace count
- customer workspaces
- platform members
- pending payments
- failed payments
- webhook events
- verified signatures
- rejected webhooks
- pending approvals
- approved approvals
- rejected approvals
- tenant metadata gaps
- audit integrity status
- audit hash gaps
- advisor assignments
- activity events
- team/client workspace
- Launch Evidence Center สำหรับ go-live evidence เช่น CI quality, Postgres backup/import, patch validation, patch smoke, deployment checklist, ops alerts และ audit evidence

## Launch Evidence Center

หน้า `Business` ของ owner/admin มี Launch Evidence Center เพื่อรวม checklist ก่อนเปิดบริการแบบเก็บเงินรายเดือนจริง:

- CI quality gate
- Postgres backup runbook
- Postgres importer dry-run
- Postgres patch validation
- Postgres patch smoke
- production deployment checklist
- operational alert delivery
- audit integrity / audit trail evidence

API ที่ใช้:

```text
GET /api/admin/launch-evidence
GET /api/admin/launch-evidence/export?format=json
GET /api/admin/launch-evidence/export?format=text
```

ข้อสำคัญ:

- frontend แสดง command/evidence เท่านั้น ไม่รันคำสั่ง terminal จาก browser
- output sanitize `DATABASE_URL` และ key/secret ทุกตัว
- customer/advisor ไม่มีสิทธิ์เรียก API นี้
- ใช้ env marker เช่น `LAUNCH_EVIDENCE_CI_QUALITY_DONE=true`, `POSTGRES_PATCH_VALIDATION_READY=true`, `LAUNCH_EVIDENCE_PATCH_SMOKE_DONE=true` เพื่อบันทึกว่า evidence แต่ละข้อพร้อมแล้วใน staging/deploy environment
- owner/admin สามารถกด `Copy sign-off pack` เพื่อ copy text pack หรือ `Download JSON` เพื่อเก็บ evidence pack ที่มี generated/exported time, status summary, evidence items, preflight commands, sanitized environment และ guardrails

## Role และ Advisor Workspace

ระบบ role ปัจจุบันเป็น local prototype:

- `owner`: ดู Business metrics, จัดการ team, เปลี่ยน role และ assign advisor ได้
- `admin`: ดู Business metrics, จัดการ team และ assign advisor ได้ แต่เปลี่ยน role ไม่ได้
- `advisor`: เห็น client workspace เฉพาะลูกค้าที่ถูก assign ให้ดูแลเมื่ออยู่แพ็กเกจ Advisor
- `customer`: ใช้งานวิเคราะห์พอร์ตและ billing ของตัวเอง

ในหน้า `Business`:

- owner/admin จะเห็นตาราง Team and clients
- owner เปลี่ยน role ของ user ได้จากตาราง
- owner/admin assign advisor ให้ customer ได้จากตาราง
- advisor จะเห็นเฉพาะ Assigned clients

## Workspace / Organization Prototype

ระบบ workspace ปัจจุบันเป็น local prototype เพื่อให้โครง SaaS ใกล้ production มากขึ้น:

- account แรกของระบบจะอยู่ใน `StockFlix Platform` workspace
- customer ใหม่จะได้ customer workspace ของตัวเอง
- owner/admin สามารถสร้าง workspace ใหม่ได้จากหน้า `Business`
- owner/admin สามารถแก้ชื่อและ type ของ workspace ได้
- owner/admin สามารถย้าย user ไปยัง workspace อื่นได้จากตาราง Team and clients
- advisor/customer จะเห็นเฉพาะ workspace ที่เกี่ยวข้องกับตัวเองหรือ client ที่ถูก assign

ตัวเลข workspace ที่แสดงใน Business dashboard:

- จำนวน workspaces ทั้งหมด
- จำนวน customer workspaces
- จำนวน platform members
- จำนวน members/customers/paid members ต่อ workspace
- revenue collected ต่อ workspace
- จำนวน saved portfolios ต่อ workspace

ข้อมูล workspace ยังเก็บใน `data/app-state.json` เช่นเดียวกับ user, billing และ audit log หากนำไปขายจริงควรย้ายไป production database และเพิ่ม tenant isolation ที่ระดับ query/database โดยสามารถเริ่มจาก schema/readiness report ใน `GET /api/storage/readiness`

## Tenant Isolation / Production Readiness

ระบบเพิ่ม tenant metadata ให้ record สำคัญเพื่อให้พร้อมต่อยอดเป็น SaaS มากขึ้น:

- `portfolioSnapshots`
- `investorProfiles`
- `billingEvents`
- `paymentSessions`
- `paymentWebhookEvents`
- `auditEvents`

record เหล่านี้จะมี `organizationId` เพื่อผูกข้อมูลกับ workspace ของ user และ state loader จะ normalize ข้อมูลเก่าที่เคยไม่มี `organizationId` ให้จาก user/workspace ที่เกี่ยวข้อง

API ที่เพิ่มสำหรับตรวจ scope:

- `GET /api/tenant/scope`: คืนข้อมูล visible workspaces, visible users, visible record counts และจำนวน record ที่ยังไม่มี tenant metadata ตามสิทธิ์ user ปัจจุบัน

หน้า `Business` แสดง Tenant isolation summary สำหรับ owner/admin/advisor เพื่อดูว่า account นั้นมองเห็นข้อมูลกี่ workspace, กี่ user และ critical records กี่รายการ หาก `Record Metadata Gaps` มากกว่า 0 แปลว่ายังมีข้อมูลเก่าหรือข้อมูลผิดรูปที่ต้อง cleanup ก่อน production

ข้อจำกัด: ส่วนนี้ยังเป็น local file-backed prototype ไม่ใช่ tenant isolation ระดับฐานข้อมูลจริง แม้ customer/workspace read APIs สำคัญเริ่มใช้ service-level scoped read แล้ว ก่อนเปิดขายควรย้ายไป production database, บังคับ tenant filter ใน query ทุกจุดรวมถึง write flow/global tools และแยก secret/config ออกจาก source code

## Activity Timeline / Audit Log

ระบบบันทึกกิจกรรมสำคัญไว้ใน `data/app-state.json` แบบ local prototype ได้แก่:

- สมัครสมาชิก
- เข้าสู่ระบบ / ออกจากระบบ
- บันทึก Guide profile
- run portfolio analysis
- บันทึก portfolio snapshot
- run strategy simulation
- checkout subscription
- สร้าง payment session และรับ simulated webhook
- เปลี่ยน role
- assign หรือ remove advisor
- สร้างหรือแก้ workspace
- ย้าย user ไป workspace อื่น

การมองเห็น activity timeline ถูกกรองตามสิทธิ์:

- `owner` และ `admin`: เห็นกิจกรรมล่าสุดทั้งหมด
- `advisor`: เห็นกิจกรรมของตัวเองและลูกค้าที่ถูก assign ให้ดูแล
- `customer`: API จะคืนเฉพาะกิจกรรมของตัวเอง

หน้า `Business` แสดง Recent activity เพื่อช่วยให้เจ้าของบริการและ advisor ตรวจสอบว่าใครทำ action สำคัญเมื่อไหร่ โดยไม่บันทึกข้อมูลอ่อนไหว เช่น password, token, cookie หรือ hash

ระบบ audit log มี integrity hash chain แบบ local prototype:

- event ใหม่จะมี `previousHash` และ `eventHash`
- hash คำนวณด้วย SHA-256 จาก event payload ที่ sanitize แล้ว
- event เก่าที่ไม่มี hash จะถูก normalize ให้มี hash chain เมื่อโหลด state
- หากมีการแก้ event ที่มี hash อยู่แล้ว ระบบจะรายงาน `needs_review`

API ที่เพิ่มสำหรับ owner/admin:

- `GET /api/audit/integrity`: คืนสถานะ audit hash chain เช่น `verified`, จำนวน event ที่ verified, จำนวน hash gaps, mismatch samples และ hash ล่าสุด

หน้า `Business` แสดง Audit Integrity, Audit Hash Gaps และ Last Audit Hash เพื่อช่วยให้เจ้าของบริการเห็นความผิดปกติเร็วขึ้น

ระบบยัง mirror audit events ไปที่ append-only local NDJSON file:

```text
data/audit-events.ndjson
```

API สำหรับ owner/admin:

- `GET /api/audit/trail`: คืนสถานะ audit mirror เช่น `synced`, missing events, extra events, duplicate ids และ invalid NDJSON lines

หน้า `Business` แสดง Audit Mirror และ Audit Mirror Gaps เพื่อช่วยดูว่า audit state และ append-only mirror ยังตรงกันหรือไม่

ระบบยังรองรับ external audit provider แบบ HTTP webhook โดยเปิดใช้ด้วย environment variables:

```text
AUDIT_TRAIL_EXTERNAL_PROVIDER=http_webhook
AUDIT_TRAIL_HTTP_URL=https://your-immutable-audit-provider.example/events
AUDIT_TRAIL_HTTP_SECRET=your-production-secret
AUDIT_TRAIL_EXTERNAL_REQUIRED=true
```

เมื่อเปิดใช้ ระบบจะส่ง audit event ออกไป provider ภายนอกพร้อม header:

- `x-stockflix-audit-signature`
- `x-stockflix-audit-timestamp`

signature คำนวณด้วย HMAC SHA-256 จาก payload และ timestamp จากนั้นระบบจะบันทึก receipt เฉพาะ event ที่ provider ตอบรับสำเร็จไว้ที่:

```text
data/audit-external-receipts.ndjson
```

หน้า `Business` แสดง `External Audit` และ `External Audit Gaps` เพื่อดูว่า external provider disabled, synced, needs configuration หรือ needs review

ข้อจำกัด: hash chain, local NDJSON mirror และ HTTP external provider เป็น production-readiness prototype ก่อนเปิดขายควรเชื่อม provider แบบ immutable/write-once จริง, ใช้ production secret, ตั้ง `AUDIT_TRAIL_EXTERNAL_REQUIRED=true` เมื่อพร้อม fail-closed และเพิ่ม monitoring/retry policy ที่เหมาะสม

ถ้านำไปขายจริง ควรต่อยอดด้วย role/permission ที่ละเอียดขึ้น, production database, payment gateway, immutable audit storage provider จริง และระบบจัดการ plan/subscription จริง

## รูปแบบไฟล์ watchlist

เป็นไฟล์ `.txt` ที่มี symbol หุ้นหนึ่งตัวต่อหนึ่งบรรทัด เช่น:

```text
PTT
CPALL
AOT
ADVANC
```

ระบบจะตัดช่องว่างและแปลง symbol เป็นตัวพิมพ์ใหญ่อัตโนมัติ

## รูปแบบไฟล์ portfolio

เป็นไฟล์ Excel ที่ต้องมีคอลัมน์:

```text
Symbol, Quantity, Avg_Price
```

ตัวอย่าง:

```text
Symbol | Quantity | Avg_Price
ACE    | 500      | 2.13
BANPU  | 200      | 6.19
```

## ไฟล์ผลลัพธ์

Web App จะเขียนไฟล์ผลลัพธ์ไว้ที่:

```text
data/outputs/
```

ไฟล์สำคัญ:

- `siamchart_raw.csv`: ข้อมูลตลาดดิบ
- `recommended_stocks.csv`: ผลวิเคราะห์หุ้นและคะแนน
- `{portfolio_name}_analysis_report.xlsx`: รายงานพอร์ต
- `t10_comparison_report.json`: ผลเทียบกับ Python เดิมจากสคริปต์ validation

ข้อมูลสมาชิกและ portfolio snapshot จะถูกเก็บไว้ใน:

```text
data/app-state.json
```

ไฟล์นี้เป็น local prototype store สำหรับ demo เท่านั้น และไม่ควรใช้แทน production database

## Storage Readiness / Database Migration

ระบบมี storage readiness report สำหรับ owner/admin:

```text
GET /api/storage/readiness
```

รายงานนี้ใช้เตรียมย้าย `data/app-state.json` ไป production database โดยตรวจ:

- จำนวน record แยกตาม collection
- missing primary keys
- duplicate primary keys
- duplicate unique fields
- missing required fields
- missing `organizationId` ใน tenant-scoped records
- dangling references ระหว่าง user, workspace, billing, payment และ audit records

Business dashboard แสดง `DB Readiness`, `DB Blockers` และ `Schema Version`

รายละเอียด schema และ migration path อยู่ที่ `docs/DATABASE_MIGRATION_FOUNDATION.md`

## Operational Readiness

เจ้าของระบบและ admin สามารถดู readiness รวมของระบบได้ที่:

```text
GET /api/ops/readiness
```

endpoint นี้ต้อง login และจำกัดเฉพาะ owner/admin โดยข้อมูลที่สรุปมี:

- repository status และ production-ready warning
- storage readiness และ blocker/warning count
- audit hash chain และ append-only audit mirror
- external audit provider status
- payment gateway configuration
- payment webhook rejection ratio
- failed/pending payment sessions
- dependency risk gate ที่ต้องรันใน CI

หน้า Business dashboard แสดง `Ops Readiness`, จำนวน alert และ alert cards สำหรับ critical/warning รายการสำคัญ เช่น `Storage readiness is blocked`, `Payment gateway is not fully configured`, `External audit provider is disabled`, `Local payment gateway is active` และ `Repository is not production-ready`

ข้อควรระวัง: readiness report ไม่ใช่ระบบ monitoring production แบบ real-time เต็มรูปแบบ แต่เป็น foundation สำหรับต่อยอดไปยัง alerting/incident workflow เช่น Slack, email, uptime monitor หรือ APM ในอนาคต

### Operational Alert Delivery

สามารถ preview หรือส่ง operational readiness alerts ออกไป webhook ภายนอกได้ด้วยคำสั่ง:

```bash
npm run ops:alerts -- --dry-run --format text
```

environment variables ที่รองรับ:

```text
OPERATIONAL_ALERT_WEBHOOK_URL=https://your-monitoring-bridge.example/ops-alerts
OPERATIONAL_ALERT_WEBHOOK_SECRET=your-production-signing-secret
OPERATIONAL_ALERT_WEBHOOK_REQUIRED=true
OPERATIONAL_ALERT_WEBHOOK_DRY_RUN=false
OPERATIONAL_ALERT_WEBHOOK_TIMEOUT_MS=5000
```

พฤติกรรมสำคัญ:

- ถ้าไม่มี `OPERATIONAL_ALERT_WEBHOOK_URL` และไม่ได้ตั้ง required mode ระบบจะถือว่า delivery disabled และไม่ block การใช้งาน
- ถ้าตั้ง `OPERATIONAL_ALERT_WEBHOOK_REQUIRED=true` แต่ URL หรือ secret ยังขาด ระบบจะรายงาน `blocked`
- ถ้าใช้ `--dry-run` หรือ `OPERATIONAL_ALERT_WEBHOOK_DRY_RUN=true` ระบบจะสร้าง payload และ request preview แต่ไม่ส่ง webhook จริง
- ทุก payload ถูก sanitize และ request preview จะ mask signature/secret ก่อนแสดงผล
- webhook ที่ส่งจริงมี header `x-stockflix-ops-signature`, `x-stockflix-ops-timestamp` และ `x-stockflix-ops-version`

signature คำนวณแบบ:

```text
hmac_sha256(secret, "<timestamp>.<json-payload>")
```

foundation นี้เป็น generic signed webhook จึงสามารถต่อเข้ากับ Slack/email/APM/uptime monitor ผ่าน bridge หรือ automation service ภายนอกได้ โดยยังไม่ผูกกับ provider เฉพาะเจ้าใน source code

ระบบอ่าน/เขียน state ผ่าน `src/services/stateRepository.js` แล้ว โดย adapter ปัจจุบันคือ `local_file` เพื่อคง behavior เดิม และมี Postgres adapter แบบ opt-in สำหรับ production database path

ระบบมี Postgres state adapter แบบ opt-in สำหรับ production database path แล้ว โดยค่า default ยังเป็น local file:

```bash
APP_STATE_REPOSITORY=postgres
DATABASE_URL=postgres://user:password@host:5432/database
DATABASE_SSL_MODE=require
```

เมื่อตั้ง `APP_STATE_REPOSITORY=postgres` ระบบจะอ่าน/เขียน collection ตาม schema manifest ไปยัง table production เช่น `users`, `organizations`, `payment_sessions`, `approval_requests` และ `audit_events` โดยเก็บ record เป็น `jsonb` พร้อม `organization_id` และ `user_id` index เพื่อใช้กับ tenant-scoped query

Postgres adapter มี scoped read helper สำหรับ production flow ที่ต้องดึงข้อมูลเฉพาะ workspace/user ที่ผู้ใช้มองเห็นได้:

```js
readScopedAppState({
  mode: "restricted",
  userIds: ["current-user-id", "assigned-customer-id"],
  organizationIds: ["current-workspace-id", "assigned-customer-workspace-id"],
});
```

scope แบบ `platform` ใช้สำหรับ owner/admin ที่ต้องเห็น full-state ส่วน scope แบบ `restricted` จะเติม `WHERE` ใน SQL ของแต่ละ collection ก่อนดึง `record jsonb` กลับมา ข้อควรระวังคือ production endpoint ต้อง derive `userIds` และ `organizationIds` จาก signed-in viewer ให้ถูกต้องก่อนเรียก scoped read

หมายเหตุ: ต้องติดตั้ง optional driver `pg` ใน environment จริงก่อนใช้งาน Postgres adapter:

```bash
npm install pg
```

ถ้าเปิด `APP_STATE_REPOSITORY=postgres` แต่ยังไม่ตั้ง `DATABASE_URL` หรือยังไม่มี package `pg` ระบบจะ fail-fast เพื่อไม่ให้ production เผลอกลับไปใช้ persistence ที่ไม่ตั้งใจ

ก่อนย้ายข้อมูลจริง ให้ dry-run importer:

```bash
npm run import:postgres -- --dry-run
```

ถ้าต้องการระบุไฟล์:

```bash
npm run import:postgres -- --input data/app-state.json --dry-run
```

เมื่อ readiness ไม่มี blocker แล้วจึง import จริงใน environment ที่มี Postgres:

```bash
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database npm run import:postgres -- --input data/app-state.json
```

Importer จะ normalize state, ตรวจ storage readiness, ปฏิเสธการ import ถ้า status เป็น `blocked` และเขียนผ่าน Postgres adapter แบบ transaction ถ้าจำเป็นต้อง import ทั้งที่ blocked ต้องใส่ `--allow-blocked` อย่างตั้งใจหลัง review output แล้วเท่านั้น

## Backup / Restore Drill

ระบบมี backup/restore drill สำหรับ local file-backed state เพื่อเตรียมความพร้อมก่อนขายจริง:

- backup `data/app-state.json`
- backup `data/audit-events.ndjson` ถ้ามี
- backup `data/audit-external-receipts.ndjson` ถ้ามี
- สร้าง `manifest.json` พร้อม schema version, readiness summary, record counts, file size และ SHA-256 checksum
- restore รองรับ dry-run และต้องใส่ `--confirm` ก่อนเขียนกลับจริง
- restore จริงจะสร้าง safety backup ของ state ปัจจุบันก่อนเขียนทับ

สร้าง backup:

```bash
npm run backup:state -- --reason before-deploy
```

ตรวจ backup และ checksum:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --verify
```

ดู restore plan โดยไม่เขียนข้อมูล:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --dry-run
```

restore จริงหลังตรวจ dry-run แล้ว:

```bash
npm run restore:state -- --backup-dir data/backups/<backup-folder> --confirm
```

ข้อควรระวัง: restore รองรับ `APP_STATE_REPOSITORY=local_file` เท่านั้น สำหรับ Postgres production ควรใช้ managed snapshot หรือ `pg_dump` / `pg_restore` ควบคู่กับ restore drill นี้

## Production Postgres Backup Runbook

ระบบมี runbook generator สำหรับวางแผน backup/restore ของ Postgres production โดยไม่รันคำสั่ง backup จริง:

```bash
npm run postgres:backup-runbook -- --strategy both --retention-days 30 --format text
```

strategy ที่รองรับ:

- `managed_snapshot`: ใช้ snapshot/PITR จากผู้ให้บริการฐานข้อมูล
- `pg_dump`: ใช้ custom-format `pg_dump` และ restore drill ด้วย `pg_restore`
- `both`: แนะนำสำหรับ production เพราะครอบคลุมทั้ง provider snapshot และ logical dump

runbook จะ sanitize `DATABASE_URL` โดย mask password ก่อนแสดงผล และมี checklist สำหรับ:

- retention, RPO และ RTO
- managed snapshot
- `pg_dump` / `pg_restore`
- restore drill ใน staging
- incident checklist กรณีสงสัยข้อมูลเสียหาย

คำสั่งนี้เป็น dry-run planning tool เท่านั้น การ backup/restore จริงต้องทำใน production/staging environment ที่ควบคุมโดยทีม deploy

## Postgres Patch Write Validation Runbook

ระบบมี runbook generator สำหรับเตรียม validate collection-level patch writes กับ staging หรือ production-like Postgres database จริง โดยคำสั่งนี้ไม่ต่อ database และไม่เขียนข้อมูล:

```bash
npm run postgres:patch-validation -- --format text
```

หากต้องการให้ command fail เมื่อยังมี blocker ใช้ strict mode:

```bash
npm run postgres:patch-validation -- --format json --strict
```

สิ่งที่ตรวจหลัก:

- `APP_STATE_REPOSITORY=postgres`
- `DATABASE_URL` ที่ถูก sanitize ก่อนแสดงผล
- `DATABASE_SSL_MODE=require`
- optional `pg` driver readiness ใน target environment
- importer dry-run, staging state import, backup/restore point และ rollback plan
- approval สำหรับ patch smoke window ใน staging
- post-smoke verification เช่น scoped read และ audit mirror/hash-chain

runbook จะให้ patch smoke matrix สำหรับ `upsert users`, `append sessions`, `delete sessions` และ `append auditEvents` เพื่อยืนยันว่า Postgres adapter ใช้ row-level operations เช่น `INSERT ... ON CONFLICT`, plain `INSERT` และ `DELETE ... WHERE record_id = $1` แทนการ clear table ทั้งก้อน

ตัวอย่าง env marker ที่ใช้บอกว่า checklist พร้อมแล้วใน staging:

```text
POSTGRES_PATCH_VALIDATION_PG_DRIVER_READY=true
POSTGRES_PATCH_IMPORT_DRY_RUN_DONE=true
POSTGRES_PATCH_STATE_IMPORTED=true
POSTGRES_PATCH_BACKUP_VERIFIED=true
POSTGRES_PATCH_ROLLBACK_PLAN_APPROVED=true
POSTGRES_PATCH_SMOKE_APPROVED=true
POSTGRES_PATCH_SCOPED_READ_VERIFIED=true
POSTGRES_PATCH_AUDIT_MIRROR_VERIFIED=true
```

ก่อนเปิดขายจริงควรเก็บ evidence จากคำสั่งนี้ร่วมกับ importer dry-run, backup id, patch smoke row counts, scoped read verification และ audit integrity verification

## Postgres Patch Smoke Harness

ระบบมี CLI สำหรับ preview หรือ execute canary patch smoke ใน staging โดยค่า default เป็น dry-run และจะไม่เขียนข้อมูล:

```bash
npm run postgres:patch-smoke -- --format text
```

ถ้าจะ execute จริงใน staging ต้องมี `--confirm` และ readiness guard ต้องไม่ blocked:

```bash
APP_STATE_REPOSITORY=postgres DATABASE_URL=postgres://user:password@host:5432/database DATABASE_SSL_MODE=require NODE_ENV=staging POSTGRES_PATCH_VALIDATION_READY=true POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE=snapshot-id npm run postgres:patch-smoke -- --confirm --format json --strict
```

harness นี้สร้าง canary patch ที่ครอบคลุม:

- `upsert organizations`
- `upsert users`
- `append sessions`
- `delete sessions`
- `append auditEvents` พร้อม audit hash ที่ chain ต่อจาก event ล่าสุดเมื่อ execute จริง

output จะมี evidence เช่น before/after collection counts, patch summary, backup evidence id, canary ids และ rollback reminder โดย sanitize `DATABASE_URL` เสมอ

guard สำคัญ:

- ต้องเป็น `APP_STATE_REPOSITORY=postgres`
- ต้องมี `DATABASE_URL`
- แนะนำ `DATABASE_SSL_MODE=require`
- ถ้า `NODE_ENV=production` จะ blocked เว้นแต่ใช้ `--allow-production` อย่างตั้งใจ
- canary ids ต้องมีคำว่า `staging` หรือ `canary`
- execute จริงต้องมี `POSTGRES_PATCH_VALIDATION_READY=true` และ `POSTGRES_PATCH_SMOKE_BACKUP_EVIDENCE`

## Production Deployment Checklist

ระบบมี deployment checklist generator สำหรับตรวจความพร้อมก่อนเปิดบริการแบบ subscription จริง โดยอ่านค่า environment variables แล้วรายงานสถานะ `ready`, `needs_review` หรือ `blocked`:

```bash
npm run deployment:check -- --format text
```

หากต้องการให้ command fail เมื่อยังมี blocker ใช้ strict mode:

```bash
npm run deployment:check -- --format json --strict
```

สิ่งที่ตรวจหลัก:

- `NODE_ENV`, `PORT`
- `APP_STATE_REPOSITORY=postgres`, `DATABASE_URL`, `DATABASE_SSL_MODE=require`
- Stripe Checkout env เช่น secret key, webhook secret, success/cancel URL และ price id ของ Starter/Pro/Advisor
- `PAYMENT_WEBHOOK_SECRET` สำหรับ signed local-gateway compatibility
- external audit provider, URL, secret และ required mode
- Postgres backup strategy และ retention
- preflight command ที่ควรรันก่อน deploy เช่น `npm run ci:quality`, Postgres backup runbook, importer dry-run, Postgres patch validation runbook และ Postgres patch smoke dry-run

output จะ sanitize `DATABASE_URL` และ key/secret ทุกตัวก่อนแสดงผลเสมอ คำสั่งนี้เป็น dry-run validation tool เท่านั้น ไม่ deploy, migrate, backup, restore หรือเรียก provider ภายนอกจริง

## Subscription Prototype

ระบบมี plan ตัวอย่าง:

- Starter
- Pro
- Advisor

สิทธิ์สำคัญที่ระบบบังคับใช้ตอนนี้:

| Feature | Starter | Pro | Advisor |
| --- | --- | --- | --- |
| Portfolio analysis / saved snapshot | Yes | Yes | Yes |
| Stock screener | Yes | Yes | Yes |
| Billing history / payment sessions | Yes | Yes | Yes |
| Customer approval decision | Yes | Yes | Yes |
| Sector analysis | Upgrade | Yes | Yes |
| Strategy simulation | Upgrade | Yes | Yes |
| Advanced action plan | Upgrade | Yes | Yes |
| Client workspace | Upgrade | Upgrade | Yes |
| Advisor approval workflow | Upgrade | Upgrade | Yes |
| Business dashboard / production readiness | Upgrade | Upgrade | Yes |

สมาชิกใหม่จะได้ `Pro trial` จึงทดลอง Sector Analysis และ Strategy Simulation ได้ระหว่าง trial แต่ยังไม่เห็น client workspace จนกว่าจะใช้แพ็กเกจ Advisor ส่วน owner/admin เป็น platform operator จึงยังเข้าถึงหลังบ้านเพื่อดูแลระบบได้แม้เป็น trial

ผู้ใช้สามารถกดเลือกแพ็กเกจใน pricing panel เพื่อ checkout ได้ ระบบ default ยังใช้ local gateway เพื่อ demo ได้ทันที:

- สร้าง payment session แบบ local gateway
- จำลอง gateway webhook สำหรับ payment success
- รองรับ signed gateway webhook ด้วย HMAC SHA-256 และ timestamp tolerance 300 วินาที
- reconcile duplicate webhook event เพื่อไม่ออก invoice ซ้ำ
- เปลี่ยน subscription status เป็น `active`
- ตั้ง renewal date เป็นรอบถัดไป 1 เดือน
- บันทึก billing event แบบ local gateway
- แสดง latest invoice ใน account panel
- นำ billing event และ payment session ไปคำนวณ Business metrics เช่น paid users, MRR estimate, revenue collected, ARPU, pending payments, failed payments, webhook events, verified signatures และ rejected webhooks

ระบบยังรองรับ Stripe Checkout provider แบบ opt-in สำหรับ production handoff โดยไม่เพิ่ม dependency ใหม่:

```bash
PAYMENT_GATEWAY_PROVIDER=stripe_checkout
PAYMENT_GATEWAY_STRIPE_SECRET_KEY=sk_live_or_test_key
PAYMENT_GATEWAY_STRIPE_WEBHOOK_SECRET=whsec_your_endpoint_secret
PAYMENT_GATEWAY_STRIPE_SUCCESS_URL=https://your-app.example/billing/success?session={sessionId}&plan={planId}
PAYMENT_GATEWAY_STRIPE_CANCEL_URL=https://your-app.example/billing/cancel?session={sessionId}
PAYMENT_GATEWAY_STRIPE_PRICE_STARTER=price_...
PAYMENT_GATEWAY_STRIPE_PRICE_PRO=price_...
PAYMENT_GATEWAY_STRIPE_PRICE_ADVISOR=price_...
```

เมื่อเปิด Stripe provider:

- `POST /api/subscription/checkout` จะสร้าง Stripe Checkout Session ผ่าน API provider และคืน `checkoutUrl`
- subscription จะยังไม่ active จนกว่า provider webhook สำเร็จ
- UI จะแสดง link `Open secure checkout`
- provider webhook จะ map `checkout.session.completed` เป็น `payment.succeeded`
- provider webhook จะ map `checkout.session.async_payment_failed`, `invoice.payment_failed` และ `payment_intent.payment_failed` เป็น `payment.failed`
- duplicate provider event จะไม่สร้าง invoice ซ้ำ
- invalid signature จะถูกบันทึกเป็น rejected webhook event

API ที่เพิ่มสำหรับ payment:

- `POST /api/subscription/payment-session`: สร้าง payment session
- `POST /api/payment/webhook/simulate`: จำลอง webhook success/failure สำหรับ payment session
- `POST /api/payment/webhook/local-gateway`: endpoint จำลอง gateway จริงที่ไม่ต้อง login แต่ต้องส่ง HMAC signature ถูกต้อง
- `POST /api/payment/webhook/provider/stripe`: endpoint สำหรับ Stripe-style webhook ที่ verify จาก raw body และ header `Stripe-Signature`
- `GET /api/customer/payments`: ดู payment sessions ตามสิทธิ์ user

signed webhook endpoint ใช้ header:

```text
x-stockflix-signature: v1=<hmac-sha256>
x-stockflix-timestamp: <unix timestamp seconds>
```

signature คำนวณจาก canonical payload ของ prototype ในรูปแบบ:

```text
hmac_sha256(secret, "<timestamp>.<canonical-json-payload>")
```

secret อ่านจาก environment variable `PAYMENT_WEBHOOK_SECRET`; ถ้าไม่ได้ตั้งค่า ระบบใช้ demo secret ภายในสำหรับ local test เท่านั้น

หาก signature หาย, timestamp หาย, timestamp เก่าเกิน tolerance, signature ผิด หรือ session ไม่ถูกต้อง ระบบจะบันทึก rejected webhook event และ audit event `payment.webhook_rejected` โดย webhook ที่ไม่มี session จริงจะถูกผูกกับ platform workspace เพื่อไม่ให้เกิด record ที่ไม่มี tenant metadata

หมายเหตุ: Business metric `verified signatures` นับ webhook ที่ลายเซ็นถูกต้องตาม payload แม้สุดท้ายจะถูก reject เพราะ session ไม่ถูกต้อง ดังนั้นต้องอ่านคู่กับ `rejected webhooks` และ `verificationStatus`

หมายเหตุ production: Stripe provider เป็น integration path แบบ opt-in ที่ต้องตั้งค่า price ids, success/cancel URL และ webhook secret จริงก่อนใช้งาน ควรทดสอบด้วย provider test mode, ตั้ง idempotency/retry/monitoring ตาม environment จริง และพิจารณา provider อื่น เช่น Omise หากต้องการ payment method ที่เหมาะกับตลาดไทยมากขึ้น

## ตรวจสอบระบบ

ตรวจ syntax ของ server:

```bash
npm run check
```

ตรวจ role/workspace isolation อัตโนมัติ:

```bash
npm run test:tenant-access
```

ชุดนี้จะสร้างข้อมูลจำลองใน temporary directory และตรวจว่า:

- owner/admin เห็นผู้ใช้และข้อมูลภาพรวมได้
- customer เห็นเฉพาะ portfolio, billing, payment และ audit ของตัวเอง
- advisor เห็นเฉพาะลูกค้าที่ถูก assign และไม่เห็นลูกค้าที่ไม่ได้ assign
- ผู้ใช้ที่ไม่ได้รับสิทธิ์ไม่สามารถ process payment session ของคนอื่น
- tenant metadata ไม่มี record gap และ audit integrity ยังเป็น `verified`

ตรวจ scoped read guard อัตโนมัติ:

```bash
npm run test:scoped-read
```

ชุดนี้จะสร้างข้อมูลจำลองใน temporary directory และตรวจว่า customer/advisor read APIs ไม่ดึง user, workspace, portfolio, billing, payment, approval หรือ audit records ข้าม workspace รวมถึงตรวจ direct tenant filter ของ `tenantScopeService`

ตรวจ subscription/payment lifecycle อัตโนมัติ:

```bash
npm run test:subscription-lifecycle
```

ชุดนี้จะสร้างข้อมูลจำลองใน temporary directory และตรวจว่า:

- customer ใหม่เริ่มจาก trial
- failed payment ไม่สร้าง invoice และไม่ activate subscription
- signed webhook success เปลี่ยน subscription เป็น `active`
- duplicate provider event ไม่สร้าง billing event ซ้ำ
- invalid, stale, missing signature และ invalid session ถูก reject พร้อมบันทึก audit
- payment metrics เช่น paid users, pending/failed payments, verified/rejected webhooks และ revenue ตรงกับ flow

ตรวจ payment provider integration:

```bash
npm run test:payment-provider
```

ชุดนี้ใช้ fake Stripe API และ fake Stripe webhook signature เพื่อตรวจว่า checkout session ใช้ provider URL, subscription ยัง pending ก่อน webhook, success webhook activate subscription, failed webhook ไม่สร้าง invoice, duplicate event ไม่ออก invoice ซ้ำ และ invalid signature ถูก reject โดยไม่ต้องต่อ provider จริง

ตรวจ package entitlement:

```bash
npm run test:entitlements
```

ชุดนี้ตรวจว่า Starter ยังใช้ portfolio analysis ได้แต่ถูกล็อกจาก simulation, Pro ปลดล็อก simulation และ sector analysis, Advisor ปลดล็อก client workspace และ approval workflow, และ owner/admin ยังมี platform operator override สำหรับดูแลระบบหลังบ้าน

ตรวจ storage/database migration readiness อัตโนมัติ:

```bash
npm run test:storage-readiness
```

ชุดนี้จะสร้าง state ชั่วคราว ตรวจว่า state ปกติพร้อมย้ายฐานข้อมูล และจงใจใส่ duplicate/orphan records เพื่อยืนยันว่า readiness report เปลี่ยนเป็น `blocked`

ตรวจ state repository layer:

```bash
npm run test:state-repository
```

ชุดนี้ตรวจว่า local file adapter อ่าน/เขียน state ผ่าน repository boundary ได้และไม่แตะข้อมูล demo จริง

ตรวจ state patch write foundation:

```bash
npm run test:state-patch
```

ชุดนี้ตรวจว่า logical patch แบบ upsert/append/delete ทำงานตาม primary key ของ schema, preserve records อื่น, append audit event ได้, block duplicate append, reject patch ที่ไม่มี primary key, กันการลบ append-only audit events โดยไม่ตั้งใจ และยืนยันว่า account registration, login last-seen update, portfolio snapshot upsert, investor profile, payment session creation, approval request creation, auth session create/logout/expired cleanup และ standalone audit event utility ที่ย้ายไปใช้ patch ยังบันทึกข้อมูล/audit ครบ

ชุด subscription/payment และ approval regressions ยังตรวจ flow patch write ที่ซับซ้อนขึ้น เช่น payment success/failure webhook, rejected webhook, already-paid webhook ที่ต้องไม่ออก invoice ซ้ำ และ approval approve/reject decision ที่ต้องรักษา audit integrity

ชุด tenant access/scoped read regressions ยังตรวจ workspace/team patch writes เช่น role update, member move, advisor assignment และ organization create/update ว่ายังรักษา permission, tenant scope และ audit integrity ได้ครบ

ตรวจ Postgres repository adapter:

```bash
npm run test:postgres-repository
```

ชุดนี้ใช้ fake Postgres client เพื่อตรวจ bootstrap SQL, whole-state write transaction, read/write JSONB rows, non-append collection rewrite, append-only audit table behavior, missing primary key guard, query-level tenant scoped read และ collection-level patch writes เช่น table-level upsert, append และ delete by `record_id` โดยไม่ต้องต่อฐานข้อมูลจริง

ตรวจ Postgres importer:

```bash
npm run test:postgres-importer
```

ชุดนี้ใช้ fake Postgres client เพื่อตรวจ dry-run plan, record counts, readiness blocked guard, forced import ด้วย `allowBlocked` และ whole-state write โดยไม่ต้องต่อฐานข้อมูลจริง

ตรวจ append-only audit trail mirror:

```bash
npm run test:audit-trail
```

ชุดนี้ตรวจว่า audit events ถูก mirror ไป local NDJSON ครบ, customer เข้าถึงสถานะ mirror ไม่ได้ และ report ตรวจ missing/invalid audit mirror ได้

ตรวจ external audit provider:

```bash
npm run test:audit-external
```

ชุดนี้สร้าง local HTTP provider ชั่วคราว ตรวจว่า audit events ถูกส่งออกพร้อม HMAC signature, receipt ครบเมื่อ provider ตอบรับ, readiness จับ missing external event เมื่อ provider ล่ม และโหมด required fail-closed ได้

ตรวจ backup/restore drill:

```bash
npm run test:backup-restore
```

ชุดนี้สร้าง state ชั่วคราว, สร้าง backup พร้อม manifest/checksum, ตรวจ dry-run restore, reject restore ที่ไม่ใส่ confirm, restore จริงแล้วตรวจข้อมูลกลับครบ และตรวจว่า backup ที่ checksum ผิดต้องถูก reject

ตรวจ operational readiness:

```bash
npm run test:observability
```

ชุดนี้ตรวจ alert rule แบบ deterministic, anonymous/customer access guard, owner readiness API และ Business dashboard markers โดยใช้ temporary directory และ in-process server

ตรวจ operational alert delivery:

```bash
npm run test:ops-alerts
```

ชุดนี้ตรวจ disabled mode, required blocked mode, dry-run, HMAC signature, webhook success/failure, strict CLI, secret masking และ URL query masking โดยใช้ local HTTP server จำลอง

ตรวจ Postgres backup runbook:

```bash
npm run test:postgres-backup-runbook
```

ชุดนี้ตรวจว่า runbook ไม่เปิดเผย password จาก `DATABASE_URL`, strategy ทำงานถูกต้อง, retention warning ถูกสร้าง และมี command template สำหรับ `pg_dump` / `pg_restore`

ตรวจ Postgres patch write validation runbook:

```bash
npm run test:postgres-patch-validation
```

ชุดนี้ตรวจว่า runbook/CLI ไม่เปิดเผย password จาก `DATABASE_URL`, แยกสถานะ `ready`, `needs_review`, `blocked` ได้ถูกต้อง, มี patch smoke matrix สำหรับ upsert/append/delete, มี verification query/rollback plan และ strict mode fail เมื่อ readiness ยัง blocked โดยไม่ต่อฐานข้อมูลจริง

ตรวจ Postgres patch smoke harness:

```bash
npm run test:postgres-patch-smoke
```

ชุดนี้ตรวจว่า smoke harness ค่า default เป็น dry-run, blocked เมื่อ guard ไม่ครบ, execute path ทำงานผ่าน injected fake writer โดยไม่ต่อฐานข้อมูลจริง, สร้าง evidence before/after counts, append audit event ที่มี hash chain, strict CLI behavior และไม่เปิดเผย password จาก `DATABASE_URL`

ตรวจ Launch Evidence Center:

```bash
npm run test:frontend-auth
npm run test:launch-evidence
npm run test:web-smoke
```

ชุด frontend authenticated smoke ตรวจว่า owner เรียก `/api/admin/launch-evidence` ได้, customer ถูกปฏิเสธ และ output mask `DATABASE_URL` ส่วน `test:launch-evidence` ตรวจสถานะ pending/blocked/ready, importer dry-run marker, JSON/text sign-off export, download headers, CSS command wrapping, responsive grid fallback และ owner/customer API guard โดยตรง ก่อนที่ web smoke จะตรวจ marker `Launch Evidence Center` / `data-launch-evidence-center` / export action ใน frontend bundle

ตรวจ production deployment checklist:

```bash
npm run test:deployment-checklist
```

ชุดนี้ตรวจว่า checklist พร้อม deploy เมื่อ env ครบ, blocked เมื่อยังเป็น local prototype, มี preflight/release/rollback checklist และไม่เปิดเผย password, Stripe key, webhook secret หรือ external audit secret ใน JSON/text output

ตรวจ frontend viewport/mobile guardrails:

```bash
npm run test:frontend-viewport
```

ชุดนี้ตรวจ viewport meta, responsive breakpoints, mobile section title stacking, tap target height, button text wrapping, table overflow และ key view markers เพื่อกัน layout แตกบนมือถือก่อนทำ browser screenshot QA จริง

ตรวจ authenticated frontend/API smoke:

```bash
npm run test:frontend-auth
```

ชุดนี้เปิด server แบบ in-process ใน temporary directory, สมัคร owner/customer ชั่วคราว, ตรวจ owner Business metrics และ operational readiness API พร้อมตรวจว่า customer ถูกกันออกจาก admin/ops endpoints

ตรวจ web smoke อัตโนมัติ:

```bash
npm run test:web-smoke
```

ชุดนี้เปิด Web App ใน process เดียวบนพอร์ตชั่วคราวโดยไม่ต้องเปิด server background แล้วตรวจหน้าแรก, health API, anonymous auth, subscription plans, admin auth guard, operational readiness auth guard, navigation, Screener drilldown marker, External Audit marker, Operational readiness marker และ stylesheet theme marker

ตรวจ dependency risk gate:

```bash
npm run test:dependency-risk
```

ชุดนี้อ่าน `npm audit --json`, fail หากมี high/critical vulnerability, moderate vulnerability ใหม่ หรือ accepted moderate risk ที่เริ่มมี fix available รายละเอียด accepted risk อยู่ที่ `docs/DEPENDENCY_RISK_REGISTER.md`

ตรวจ approval workflow อัตโนมัติ:

```bash
npm run test:approval-workflow
```

ชุดนี้ตรวจว่า advisor สร้าง approval ได้เฉพาะลูกค้าที่ถูก assign, customer เห็นและตัดสินใจเฉพาะ request ของตัวเอง, customer คนอื่นไม่เห็นข้อมูลข้ามกัน, metrics ตรงกับ flow และ audit/storage readiness ยังผ่าน

เทียบผลลัพธ์กับระบบ Python เดิม:

```bash
npm run compare:python
```

ตรวจ regression สำคัญทั้งหมด:

```bash
npm run test-regression
```

คำสั่งนี้จะรัน syntax check, tenant access regression, scoped read regression, subscription lifecycle regression, storage readiness regression, state repository regression, state patch regression, Postgres repository regression, Postgres importer regression, audit trail regression, approval workflow regression, package entitlement regression, payment provider regression, external audit provider regression, backup/restore regression, observability regression, operational alert delivery regression, Postgres backup runbook regression, Postgres patch validation regression, Postgres patch smoke regression, deployment checklist regression, frontend viewport regression, authenticated frontend smoke regression, web smoke regression และเปรียบเทียบ output กับ Python เดิมต่อเนื่องกัน

ตรวจ quality gate แบบเดียวกับ CI:

```bash
npm run ci:quality
```

คำสั่งนี้จะรัน regression ทั้งหมดและตรวจ dependency risk gate จาก `npm audit --json`

GitHub Actions workflow อยู่ที่ `.github/workflows/quality-gate.yml` และเอกสารเพิ่มเติมอยู่ที่ `docs/CI_QUALITY_GATE.md`

ผล validation ล่าสุด:

- raw rows ตรงกัน 108 rows
- recommended rows ตรงกัน 108 rows
- raw missing columns: none
- recommended missing columns: none
- formula numeric mismatches: 0
- formula text mismatches: 0
- portfolio report sample mismatches: 0

## ข้อจำกัดสำคัญ

ระบบ Node.js รุ่นนี้ใช้ Yahoo chart endpoint ซึ่งให้ข้อมูลราคา, 52-week range, volume และข้อมูลย้อนหลังสำหรับ RSI ได้ และจะใช้ `recommended_stocks.csv` เดิมเป็น reference fallback สำหรับข้อมูลพื้นฐานและ Sector ถ้ามี symbol นั้นอยู่ในไฟล์อ้างอิง

ข้อมูลพื้นฐานที่ใช้ fallback ได้แก่:

- PE
- PBV
- Yield
- ROE
- D/E
- Sector

ถ้าไม่มี symbol ในไฟล์อ้างอิง ข้อมูลเหล่านี้จะเป็นค่า fallback เช่น `0` หรือ `Unknown` ดังนั้น live output จาก Node.js อาจต่างจาก Python เดิมที่ใช้ `yfinance` ซึ่งดึง fundamental fields ได้มากกว่า

ถ้าใช้ `siamchart_raw.csv` เดิมเป็น input ร่วมกัน สูตร JavaScript เทียบกับ Python แล้วตรงกัน 0 mismatch ตามผล T10

## คำเตือนการลงทุน

ผลลัพธ์เป็นการวิเคราะห์เชิงตัวเลขและสถิติเท่านั้น ไม่ใช่คำแนะนำการลงทุน ผู้ใช้ควรตรวจสอบงบการเงิน ข่าวบริษัท สภาพคล่อง และความเสี่ยงด้วยตนเองก่อนตัดสินใจซื้อขายทุกครั้ง
