# คู่มือใช้งาน Node.js Web App

เอกสารนี้อธิบายวิธีใช้งาน Web App รุ่น Node.js สำหรับโปรแกรมวิเคราะห์หุ้นไทย โดยยังคงสูตรวิเคราะห์หลักจากระบบ Python เดิม

## สถานะปัจจุบัน

Web App รองรับความสามารถหลักเหล่านี้แล้ว:

- Register / Login / Logout
- แสดง subscription plan แบบรายเดือน
- เลือก plan และจำลอง checkout รายเดือนผ่าน local payment gateway/webhook prototype
- รองรับ signed payment webhook endpoint พร้อม HMAC signature และ timestamp tolerance
- account แรกที่สมัครในระบบจะเป็น owner สำหรับดู Business dashboard
- รองรับ role prototype: owner, admin, advisor, customer
- รองรับ workspace/organization prototype สำหรับจัดกลุ่ม platform team, customers และ client workspaces
- มี tenant isolation summary สำหรับดู visible workspace/user/records ตาม role
- owner สามารถเปลี่ยน role ได้
- owner/admin สามารถ assign advisor ให้ลูกค้าได้
- advisor เห็น client workspace เฉพาะลูกค้าที่ถูก assign
- มี activity timeline / audit log สำหรับ action สำคัญของระบบ
- มี audit integrity hash chain และ API ตรวจ hash chain สำหรับ owner/admin
- มี automated tenant access regression test สำหรับตรวจ role/workspace isolation ก่อนส่งมอบ
- มี automated subscription lifecycle regression test สำหรับตรวจ payment/webhook/billing flow ก่อนส่งมอบ
- มี storage readiness report สำหรับเตรียมย้ายจาก local file ไป production database
- มี state repository layer สำหรับแยกการอ่าน/เขียน state ออกจาก business service
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
   - `Stock Screener`
   - `Sector Analysis`
   - `Strategy Simulation`
   - `Business` เฉพาะ owner account

## Visual Dashboard

Web App มี visual dashboard ในตัวโดยไม่ต้องติดตั้ง chart library เพิ่ม:

- `My Portfolio`: sector exposure, action mix และ score distribution
- `Stock Screener`: quality vs reward scatter, top ideas และ sector count
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
- tenant metadata gaps
- audit integrity status
- audit hash gaps
- advisor assignments
- activity events
- team/client workspace

## Role และ Advisor Workspace

ระบบ role ปัจจุบันเป็น local prototype:

- `owner`: ดู Business metrics, จัดการ team, เปลี่ยน role และ assign advisor ได้
- `admin`: ดู Business metrics, จัดการ team และ assign advisor ได้ แต่เปลี่ยน role ไม่ได้
- `advisor`: เห็น client workspace เฉพาะลูกค้าที่ถูก assign ให้ดูแล
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

ข้อจำกัด: ส่วนนี้ยังเป็น local file-backed prototype ไม่ใช่ tenant isolation ระดับฐานข้อมูลจริง ก่อนเปิดขายควรย้ายไป production database, บังคับ tenant filter ใน query ทุกจุด, เพิ่ม webhook signature verification และแยก secret/config ออกจาก source code

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

ข้อจำกัด: hash chain และ local NDJSON mirror ช่วยตรวจและแยก audit trail จาก state file ได้ระดับ prototype แต่ยังไม่ใช่ immutable storage จริง ก่อนเปิดขายควรย้าย audit log ไป external append-only/immutable storage หรือฐานข้อมูลที่มี write-once policy

ถ้านำไปขายจริง ควรต่อยอดด้วย role/permission ที่ละเอียดขึ้น, production database, payment gateway, immutable audit storage, approval workflow และระบบจัดการ plan/subscription จริง

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

ระบบอ่าน/เขียน state ผ่าน `src/services/stateRepository.js` แล้ว โดย adapter ปัจจุบันคือ `local_file` เพื่อคง behavior เดิม ส่วน production database adapter ยังเป็นงานต่อยอด

## Subscription Prototype

ระบบมี plan ตัวอย่าง:

- Starter
- Pro
- Advisor

สมาชิกใหม่จะได้ `Pro trial` เพื่อทดลองใช้งาน และสามารถกดเลือกแพ็กเกจใน pricing panel เพื่อจำลอง checkout ได้ ระบบจะ:

- สร้าง payment session แบบ local gateway
- จำลอง gateway webhook สำหรับ payment success
- รองรับ signed gateway webhook ด้วย HMAC SHA-256 และ timestamp tolerance 300 วินาที
- reconcile duplicate webhook event เพื่อไม่ออก invoice ซ้ำ
- เปลี่ยน subscription status เป็น `active`
- ตั้ง renewal date เป็นรอบถัดไป 1 เดือน
- บันทึก billing event แบบ local gateway
- แสดง latest invoice ใน account panel
- นำ billing event และ payment session ไปคำนวณ Business metrics เช่น paid users, MRR estimate, revenue collected, ARPU, pending payments, failed payments, webhook events, verified signatures และ rejected webhooks

API ที่เพิ่มสำหรับ payment prototype:

- `POST /api/subscription/payment-session`: สร้าง payment session
- `POST /api/payment/webhook/simulate`: จำลอง webhook success/failure สำหรับ payment session
- `POST /api/payment/webhook/local-gateway`: endpoint จำลอง gateway จริงที่ไม่ต้อง login แต่ต้องส่ง HMAC signature ถูกต้อง
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

ฟังก์ชันนี้ยังไม่ได้เชื่อม payment gateway จริง หากต้องนำไปขายจริงควรเชื่อมระบบชำระเงินจริง เช่น Stripe, Omise หรือ payment provider ที่เหมาะกับตลาดไทย พร้อม raw-body webhook signature verification ตามมาตรฐาน provider, idempotency key, invoice reconciliation และระบบ retry/error handling จริง

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

ตรวจ append-only audit trail mirror:

```bash
npm run test:audit-trail
```

ชุดนี้ตรวจว่า audit events ถูก mirror ไป local NDJSON ครบ, customer เข้าถึงสถานะ mirror ไม่ได้ และ report ตรวจ missing/invalid audit mirror ได้

เทียบผลลัพธ์กับระบบ Python เดิม:

```bash
npm run compare:python
```

ตรวจ regression สำคัญทั้งหมด:

```bash
npm run test-regression
```

คำสั่งนี้จะรัน syntax check, tenant access regression, subscription lifecycle regression, storage readiness regression, state repository regression, audit trail regression และเปรียบเทียบ output กับ Python เดิมต่อเนื่องกัน

ตรวจ quality gate แบบเดียวกับ CI:

```bash
npm run ci:quality
```

คำสั่งนี้จะรัน regression ทั้งหมดและตรวจ `npm audit --audit-level=high`

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
