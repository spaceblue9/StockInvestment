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
* เลือกแพ็กเกจ Starter/Pro/Advisor และจำลอง checkout รายเดือนผ่าน local payment gateway/webhook prototype
* รองรับ signed webhook endpoint แบบ HMAC สำหรับ payment gateway prototype พร้อม timestamp tolerance และ rejected webhook log
* เก็บ investor profile เช่น เป้าหมายลงทุน ความเสี่ยง งบรายเดือน และระยะเวลาถือ
* บันทึก portfolio snapshot ของลูกค้าหลังวิเคราะห์พอร์ต
* แสดง Guide สำหรับมือใหม่และ Business metrics เช่น MRR, paid users, revenue collected สำหรับเจ้าของ SaaS
* แสดง workspace metrics เช่น workspaces, customer workspaces, platform members และ revenue ต่อ workspace
* แสดง payment session metrics เช่น pending payments, failed payments, webhook events, verified signatures และ rejected webhooks
* แสดง tenant isolation summary เพื่อดูว่าผู้ใช้มองเห็น workspace/user/records ใดได้ตาม role และตรวจ record ที่ยังไม่มี workspace metadata
* แสดง activity timeline / audit log สำหรับ action สำคัญ เช่น login, checkout, run analysis, update role และ assign advisor พร้อม hash chain สำหรับตรวจ integrity
* แสดง visual dashboard สำหรับ Portfolio, Screener, Sector และ Business view โดยไม่ต้องติดตั้ง chart library เพิ่ม
* มี automated tenant access regression test สำหรับตรวจ owner/admin/advisor/customer scope, payment session access, billing, audit timeline และ tenant metadata
* มี automated subscription lifecycle regression test สำหรับตรวจ trial, failed payment, signed webhook success, duplicate reconciliation และ rejected webhook
* มี storage readiness report และ schema manifest สำหรับเตรียมย้ายจาก local file ไป production database
* มี state repository layer เพื่อแยก persistence ออกจาก business service และเตรียมเปลี่ยน adapter ในอนาคต
* มี append-only audit trail mirror แบบ local NDJSON เพื่อเตรียมต่อยอดเป็น external immutable audit storage
* ใช้ธีมดำ-แดงและ layout แบบ professional dashboard

คู่มือ Web App แบบละเอียดอยู่ที่ `docs/WEB_APP_USAGE.md`

หมายเหตุ: Web App รุ่น Node.js ใช้ Yahoo chart endpoint สำหรับข้อมูลราคา/RSI/volume/52-week range และใช้ `recommended_stocks.csv` เดิมเป็น reference fallback สำหรับข้อมูลพื้นฐาน เช่น PE, ROE, Yield, D/E และ Sector ถ้ามี symbol นั้นอยู่ในไฟล์อ้างอิง หากไม่มีข้อมูลอ้างอิง ระบบจะแสดง Sector เป็น `Unknown`

คำสั่งตรวจระบบสำคัญ:

```bash
npm run test:tenant-access
npm run test:subscription-lifecycle
npm run test:storage-readiness
npm run test:state-repository
npm run test:audit-trail
npm run test-regression
npm run ci:quality
```

CI quality gate สำหรับ GitHub Actions อยู่ที่ `.github/workflows/quality-gate.yml` และรายละเอียดอยู่ที่ `docs/CI_QUALITY_GATE.md` ส่วนแผนฐานข้อมูล production อยู่ที่ `docs/DATABASE_MIGRATION_FOUNDATION.md`

สำหรับการขายจริง ระบบ SaaS ส่วน login, workspace, billing, payment และ audit ยังเป็น local file-backed prototype ใน `data/app-state.json` แม้ critical records จะถูก tag ด้วย `organizationId`, signed webhook prototype จะตรวจ HMAC ได้แล้ว, audit log มี hash chain สำหรับตรวจ integrity, มี tenant/subscription regression tests, มี storage readiness report, มี repository layer และมี append-only audit mirror แล้ว ควรย้ายไป production database, เพิ่ม tenant isolation ระดับ query/database, ใช้ payment provider จริงพร้อม raw-body signature verification และเก็บ audit log แบบ immutable ก่อนเปิดบริการจริง

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
