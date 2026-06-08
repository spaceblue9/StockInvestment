# 📈 โปรแกรมวิเคราะห์หุ้นไทยระดับเซียน (Elite Thai Stock Analysis System)

โปรแกรมนี้คือผู้ช่วยตัดสินใจลงทุนอัจฉริยะที่รวบรวมหลักการ **Value, Growth และ Momentum Investing** เข้าด้วยกัน พร้อมระบบบริหารความเสี่ยงระดับสถาบัน เพื่อให้คุณลงทุนได้อย่างมืออาชีพและมีวินัย

---

## 🚀 ฟีเจอร์เด่น (Key Features)
1.  **Personalized Portfolio Analysis:** วิเคราะห์พอร์ตของคุณตามต้นทุนจริง พร้อมระบบระบายสีแจ้งเตือนจังหวะราคา
2.  **Multi-Factor Stock Screener:** คัดกรองหุ้น "เพชรในตม" ด้วยคะแนนคุณภาพ (Score), ความคุ้มค่า (RRR) และแนวโน้ม (Trend)
3.  **Smart Price Zones:** คำนวณจุดซื้อที่ได้เปรียบ (Entry) และจุดขายทำกำไร (Exit) อัตโนมัติ
4.  **Strategy Simulator (Backtest):** จำลองการเทรดวนรอบในอดีตเพื่อพิสูจน์ความแม่นยำของกลยุทธ์
5.  **Elite Analysis Guide:** คู่มือในตัวที่สอนให้คุณเข้าใจตัวชี้วัดพื้นฐานและเทคนิคระดับสากล
6.  **Visual Intelligence Dashboard:** แสดง sector exposure, action mix, quality vs reward และ business funnel ในรูปแบบกราฟบนเว็บ

---

## 🧠 หลักการวิเคราะห์ (The Core Methodology)

ระบบใช้การวิเคราะห์แบบ **4 เสาหลัก** เพื่อความแม่นยำสูงสุด:

### 1. การเลือกหุ้น (Selection - 50%)
*   **Fundamental Score:** วิเคราะห์หนี้สิน (D/E), ความเก่งในการทำกำไร (ROE) และความถูกแพง (P/E)
*   **Sector Benchmarking:** เปรียบเทียบหุ้นกับค่ากลางของกลุ่มอุตสาหกรรมเพื่อให้เกิดความยุติธรรมในการให้คะแนน

### 2. จังหวะเวลา (Timing - 20%)
*   **Price Position:** หาราคาที่ถูกที่สุดในรอบปี (Discount Zone)
*   **RSI Indicator:** วัดความร้อนแรงเพื่อหาจุดกลับตัว (Oversold/Overbought)
*   **Trend Analysis:** ระบุสถานะ Bullish, Bearish หรือ Sideways

### 3. ความคุ้มค่าและความเสี่ยง (Risk & Reward - 30%)
*   **RRR (Risk-Reward Ratio):** คัดกรองเฉพาะการเทรดที่มีกำไรคาดหวังสูงกว่าความเสี่ยง 2 เท่าขึ้นไป
*   **Stop Loss (SL):** กำหนดจุดหนีตายเพื่อรักษาเงินต้นเสมอ

### 4. การวางเงิน (Money Management)
*   **Suggested Shares:** คำนวณจำนวนหุ้นที่ควรซื้อตามงบความเสี่ยงที่คุณรับได้จริง

---

## 🛠 วิธีการติดตั้งและเริ่มใช้งาน

### ทางเลือกที่ 1: ใช้งานแบบ Web App ด้วย Node.js

เหมาะสำหรับการใช้งานง่ายผ่าน browser โดย upload watchlist/portfolio แล้วดาวน์โหลดผลลัพธ์ได้จากหน้าเว็บ

```bash
npm install
npm start
```

จากนั้นเปิด:

```text
http://localhost:3000
```

ผลลัพธ์จาก Web App จะถูกสร้างไว้ใน `data/outputs/` เช่น:

* `siamchart_raw.csv`
* `recommended_stocks.csv`
* `{portfolio_name}_analysis_report.xlsx`

Web App รุ่นนี้มีระบบสมาชิกแบบ prototype สำหรับ subscription SaaS:

* สมัครสมาชิก / เข้าสู่ระบบ
* account แรกของระบบเป็น owner สำหรับดู Business dashboard และจัดการทีม
* รองรับ role prototype: owner, admin, advisor, customer
* รองรับ workspace/organization prototype สำหรับจัดกลุ่ม platform team, customers และ client workspaces
* assign advisor ให้ลูกค้าเพื่อสร้าง client workspace เบื้องต้น
* แสดงสถานะ plan รายเดือน
* เลือกแพ็กเกจ Starter/Pro/Advisor และ checkout รายเดือนผ่าน local gateway default หรือ Stripe Checkout provider แบบ opt-in
* บังคับใช้ package entitlement จริง: Starter ใช้ portfolio analysis/screener, Pro เพิ่ม sector analysis/strategy simulation, Advisor เพิ่ม client workspace/approval workflow/business readiness
* หน้าเว็บแสดง upgrade card เมื่อผู้ใช้พยายามเข้า feature ที่แพ็กเกจปัจจุบันยังไม่รวม
* รองรับ signed webhook endpoint แบบ HMAC สำหรับ local gateway และ Stripe-style provider webhook ที่ verify จาก raw body พร้อม rejected webhook log
* เก็บ investor profile เช่น เป้าหมายลงทุน ความเสี่ยง งบรายเดือน และระยะเวลาถือ
* บันทึก portfolio snapshot ของลูกค้าหลังวิเคราะห์พอร์ต
* แสดง Guide สำหรับมือใหม่และ Business metrics เช่น MRR, paid users, revenue collected สำหรับเจ้าของ SaaS
* แสดง workspace metrics เช่น workspaces, customer workspaces, platform members และ revenue ต่อ workspace
* แสดง payment session metrics เช่น pending payments, failed payments, webhook events, verified signatures และ rejected webhooks
* แสดง tenant isolation summary เพื่อดูว่าผู้ใช้มองเห็น workspace/user/records ใดได้ตาม role และตรวจ record ที่ยังไม่มี workspace metadata
* แสดง activity timeline / audit log สำหรับ action สำคัญ เช่น login, checkout, run analysis, update role และ assign advisor พร้อม hash chain สำหรับตรวจ integrity
* แสดง visual dashboard สำหรับ Portfolio, Screener, Sector และ Business view โดยไม่ต้องติดตั้ง chart library เพิ่ม
* หน้า Screener รองรับ sector/trend filter และคลิก Sector count bar เพื่อ drilldown ตารางหุ้นได้
* มี automated tenant access regression test สำหรับตรวจ owner/admin/advisor/customer scope, payment session access, billing, audit timeline และ tenant metadata
* มี automated scoped read regression test สำหรับตรวจว่า customer/advisor workspace APIs ไม่ดึง user, portfolio, billing, payment, approval และ audit records ข้าม workspace
* มี automated subscription lifecycle regression test สำหรับตรวจ trial, failed payment, signed webhook success, duplicate reconciliation และ rejected webhook
* มี automated package entitlement regression test สำหรับตรวจสิทธิ์ Starter/Pro/Advisor และ upgrade gate
* มี automated payment provider regression test สำหรับตรวจ Stripe Checkout session, provider webhook success/failure, duplicate reconciliation และ invalid signature
* มี automated web smoke regression สำหรับตรวจหน้าเว็บ, auth/health API, SaaS navigation, Screener drilldown marker และ External Audit UI marker
* มี automated frontend viewport/auth regression สำหรับตรวจ mobile responsive guardrails และ owner/customer access flow แบบ in-process
* มี storage readiness report และ schema manifest สำหรับเตรียมย้ายจาก local file ไป production database
* มี operational readiness API และ Business dashboard alert cards สำหรับดู production risk ของ storage, audit, payment, dependency gate และ repository
* มี operational alert delivery webhook แบบ opt-in สำหรับส่ง readiness alerts ไปยัง Slack/email/APM/uptime bridge พร้อม HMAC signature, dry-run และ required mode
* มี state repository layer เพื่อแยก persistence ออกจาก business service และเตรียมเปลี่ยน adapter ในอนาคต
* มี state patch write foundation สำหรับ upsert/append/delete records ผ่าน repository boundary พร้อม append-only guard สำหรับ audit events และเริ่มใช้กับ account, portfolio snapshot, investor profile, payment, approval, workspace, team/admin และ auth session write flows สำคัญแล้ว
* Postgres adapter เริ่มรองรับ collection-level patch writes โดย map `upsert`, `append`, `delete` เป็น table-level transaction สำหรับเส้นทาง `patchAppState()`
* รองรับ Postgres state adapter แบบ opt-in ผ่าน `APP_STATE_REPOSITORY=postgres` และ `DATABASE_URL` สำหรับ production database path
* Postgres adapter มี scoped read helper ที่บังคับ tenant filter ใน SQL query ก่อนดึง JSONB record ออกจากฐานข้อมูล
* Customer/workspace read APIs สำคัญเริ่มใช้ service-level scoped read wrapper เพื่อให้ local file mode มี filter guard และ Postgres path ต่อกับ query-level scoped reads ได้ง่ายขึ้น
* มี one-time importer จาก `data/app-state.json` เข้า Postgres พร้อม dry-run/readiness guard
* มี backup/restore drill สำหรับ `data/app-state.json`, audit mirror และ external audit receipts พร้อม manifest/checksum/dry-run/confirm guard
* มี Postgres backup runbook generator สำหรับ managed snapshot / `pg_dump` / restore drill โดย sanitize `DATABASE_URL`
* มี Postgres patch write staging validation runbook แบบ dry-run สำหรับเตรียมตรวจ collection-level patch writes กับ database จริงใน staging โดย sanitize `DATABASE_URL`
* มี Postgres patch smoke harness แบบ dry-run-first สำหรับ staging canary write พร้อม `--confirm` guard, evidence output และ secret masking
* Business dashboard มี Launch Evidence Center สำหรับ owner/admin เพื่อสรุป checklist, command, evidence และ export sign-off pack ก่อนเปิดขายจริงโดยไม่รันคำสั่งจากหน้าเว็บ
* มี production deployment checklist แบบ dry-run สำหรับตรวจ env, Postgres, Stripe, signed webhook, external audit, backup และ CI gate โดยไม่แสดง secret
* มี append-only audit trail mirror แบบ local NDJSON เพื่อเตรียมต่อยอดเป็น external immutable audit storage
* รองรับ external audit provider แบบ HTTP webhook ที่เปิดใช้ด้วย env พร้อม HMAC signature และ receipt readiness
* มี approval workflow prototype ให้ owner/admin/advisor สร้างคำขออนุมัติ และให้ลูกค้า approve/reject ของตัวเองพร้อม audit log
* ใช้ธีมดำ-แดงและ layout แบบ professional dashboard

คู่มือ Web App แบบละเอียดอยู่ที่ `docs/WEB_APP_USAGE.md`

หมายเหตุ: Web App รุ่น Node.js ใช้ Yahoo chart endpoint สำหรับข้อมูลราคา/RSI/volume/52-week range และใช้ `recommended_stocks.csv` เดิมเป็น reference fallback สำหรับข้อมูลพื้นฐาน เช่น PE, ROE, Yield, D/E และ Sector ถ้ามี symbol นั้นอยู่ในไฟล์อ้างอิง หากไม่มีข้อมูลอ้างอิง ระบบจะแสดง Sector เป็น `Unknown`

คำสั่งตรวจระบบสำคัญ:

```bash
npm run test:tenant-access
npm run test:scoped-read
npm run test:subscription-lifecycle
npm run test:storage-readiness
npm run test:state-repository
npm run test:state-patch
npm run test:postgres-repository
npm run test:postgres-importer
npm run test:audit-trail
npm run test:approval-workflow
npm run test:entitlements
npm run test:payment-provider
npm run test:audit-external
npm run test:backup-restore
npm run test:observability
npm run test:ops-alerts
npm run test:postgres-backup-runbook
npm run test:postgres-patch-validation
npm run test:postgres-patch-smoke
npm run test:deployment-checklist
npm run test:frontend-viewport
npm run test:frontend-auth
npm run test:launch-evidence
npm run test:web-smoke
npm run test:dependency-risk
npm run test-regression
npm run ci:quality
```

CI quality gate สำหรับ GitHub Actions อยู่ที่ `.github/workflows/quality-gate.yml` และรายละเอียดอยู่ที่ `docs/CI_QUALITY_GATE.md` ส่วนแผนฐานข้อมูล production อยู่ที่ `docs/DATABASE_MIGRATION_FOUNDATION.md` และ dependency risk register อยู่ที่ `docs/DEPENDENCY_RISK_REGISTER.md`

ตัวอย่าง dry-run ก่อน import local state เข้า Postgres:

```bash
npm run import:postgres -- --dry-run
```

ตัวอย่าง backup และ dry-run restore local state:

```bash
npm run backup:state -- --reason before-deploy
npm run restore:state -- --backup-dir data/backups/<backup-folder> --dry-run
```

การ restore จริงต้องใส่ `--confirm` หลังตรวจ dry-run แล้วเท่านั้น

ตัวอย่างสร้าง Postgres backup runbook แบบ dry-run โดยไม่รัน `pg_dump` จริง:

```bash
npm run postgres:backup-runbook -- --strategy both --retention-days 30 --format text
```

ตัวอย่างสร้าง Postgres patch write validation runbook สำหรับ staging โดยไม่ต่อ database จริง:

```bash
npm run postgres:patch-validation -- --format text
```

ตัวอย่าง preview Postgres patch smoke harness แบบ dry-run ก่อนเขียน staging database:

```bash
npm run postgres:patch-smoke -- --format text
```

ตัวอย่างตรวจ production deployment checklist แบบ dry-run โดยไม่ deploy จริง:

```bash
npm run deployment:check -- --format text
```

ตัวอย่าง preview operational alerts แบบ dry-run โดยไม่ส่ง webhook จริง:

```bash
npm run ops:alerts -- --dry-run --format text
```

สำหรับการขายจริง ระบบ SaaS ส่วน login, workspace, approval, billing, payment และ audit ยังเป็น local file-backed prototype ใน `data/app-state.json` เป็นค่า default แม้ critical records จะถูก tag ด้วย `organizationId`, มี package entitlement gate, backup/restore drill, Postgres backup runbook, Postgres patch validation runbook, Postgres patch smoke harness, Launch Evidence Center, deployment checklist, operational readiness alerts, operational alert delivery webhook, Stripe Checkout provider แบบ opt-in, signed webhook verification, audit log hash chain, tenant/scoped-read/subscription/entitlement/backup/postgres-backup/postgres-patch-validation/postgres-patch-smoke/deployment/ops-alert/observability/payment-provider/approval/external-audit/launch-evidence/web-smoke/postgres-repository/state-patch regression tests, storage readiness report, repository layer, state patch write foundation, adopted patch write flows for account/portfolio/profile/payment/approval/workspace/team/auth sessions, Postgres adapter แบบ opt-in, Postgres scoped read helper, Postgres collection-level patch write prototype, append-only audit mirror และ external audit webhook provider แบบ opt-in แล้ว ก่อนเปิดบริการจริงควรทดสอบกับฐานข้อมูลจริง, ใช้ scoped read ทุก production flow, ตรวจ Postgres patch writes กับ database จริงใน staging, ตั้งค่า production Stripe price/webhook secret จริง, run deployment checklist แบบ strict ใน staging, ตั้งค่า operational alert webhook ไปยังระบบ monitor จริง และเชื่อม immutable audit provider จริง

### ทางเลือกที่ 2: ใช้งานระบบ Python เดิม

#### 1. การเตรียมความพร้อม
*   **ติดตั้ง Python** และโปรแกรมเสริม:
    ```bash
    pip install -r requirements.txt
    ```

#### 2. การรันโปรแกรม
*   **โหมดสร้างรายงาน (Excel):** `python main.py`
*   **โหมด Dashboard อัจฉริยะ:** `streamlit run portfolio_dashboard.py`

---

## 💡 เคล็ดลับการบริหารเงิน (Elite Investment Tips)
*   **ห้ามซื้อหมดในคราวเดียว:** แบ่งเงินเป็น 3-4 ไม้ เข้าตาม `Entry Zone`
*   **จัดการหุ้นติดลบอย่างมีสติ:** ถ้าหุ้นดีราคาถูกลงให้ `Buy More` ถ้าหุ้นเน่าให้ `Exit All` ทันที
*   **เงินสดคือโอกาส:** คงเงินสดไว้ 20-30% เพื่อรอช้อนซื้อในวันที่ตลาดตระหนก

---
**หมายเหตุ**: ข้อมูลที่ได้เป็นเพียงการวิเคราะห์เชิงตัวเลขทางสถิติ ผู้ลงทุนควรศึกษาข้อมูลธุรกิจเพิ่มเติมก่อนตัดสินใจทุกครั้ง
