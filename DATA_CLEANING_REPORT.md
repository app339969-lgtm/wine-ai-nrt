# รายงานการตรวจสอบและทำความสะอาดข้อมูล (Data Cleaning Report) — SmartRetail Thailand

> เอกสารฉบับนี้สรุปสถานะของข้อมูลดิบ ขั้นตอนการทำความสะอาดข้อมูลจริง ผลเปรียบเทียบสถิติก่อน-หลัง (Before vs After) การตรวจสอบความถูกต้องด้วยชุดทดสอบอัตโนมัติ + DuckDB และคำสั่งสำหรับรันซ้ำ (Reproducibility)

---

## 1. สรุปสถานะข้อมูลดิบ vs ข้อมูลหลังทำความสะอาด

| ไฟล์ข้อมูล | สถานะ | จำนวนแถว | รายละเอียดความสะอาด / ปัญหาที่พบ |
| :--- | :---: | :---: | :--- |
| [`customers_data.csv`](customers_data.csv) | ต้นฉบับ (สะอาดแล้ว) | `1,000` | ไม่มี Missing Values, `Customer_ID` ไม่ซ้ำ `100%`, `Age` อยู่ในช่วง `18–65`, `Signup_Date` อยู่ในช่วง `2023-01-01` ถึง `2024-12-31` |
| [`transactions_data.csv`](transactions_data.csv) | **ต้นฉบับ (ยังไม่คลีน)** | `50,000` | `Transaction_ID` ไม่ซ้ำ `100%`, `FK Match = 100%` แต่พบ **Missing Values `750` แถว** และ **Extreme Outliers `50` แถว** |
| [`data/cleaned/cleaned_customers.csv`](data/cleaned/cleaned_customers.csv) | **คลีนแล้ว** | `1,000` | แปลง Type และตัดช่องว่างหัว-ท้ายครบ (`0` nulls) |
| [`data/cleaned/cleaned_transactions.csv`](data/cleaned/cleaned_transactions.csv) | **คลีนแล้ว** | `49,200` | ตัด Dual-Missing `750` แถว + แยก Outliers `50` แถว (`0` nulls, `Units_Sold` ช่วง `1–24` ชิ้น) |
| [`data/cleaned/merged_cleaned.csv`](data/cleaned/merged_cleaned.csv) | **คลีน + Join + Feature** | `49,200` | รวมข้อมูลธุรกรรม + ลูกค้า (`19` คอลัมน์) พร้อมคอลัมน์วิเคราะห์เวลา/ช่วงอายุ/อายุสมาชิก |
| [`data/cleaned/outliers_audit.csv`](data/cleaned/outliers_audit.csv) | **Audit Log** | `50` | แยกธุรกรรมผิดปกติ (`999 / 1,200 / 1,500` ชิ้น) รวมมูลค่า `14,541,495` บาท เพื่อตรวจสอบย้อนกลับ |

> ไฟล์ชุดข้อมูลคลีนทั้งหมดถูกส่งออกไว้ทั้งรูปแบบ `.csv` และ `.parquet` ในโฟลเดอร์ `data/cleaned/` โดยไฟล์ดิบต้นฉบับถูกคงไว้เหมือนเดิมโดยไม่ถูกเขียนทับ

---

## 2. ปัญหาคุณภาพข้อมูลที่ตรวจพบในข้อมูลดิบ

### 2.1 การตรวจสอบโครงสร้างและ Integrity (Validation)
- **Primary Key Uniqueness**: `Customer_ID` ไม่ซ้ำ `1,000 / 1,000` (`100%`) และ `Transaction_ID` ไม่ซ้ำ `50,000 / 50,000` (`100%`)
- **Foreign Key Integrity**: `transactions_data.Customer_ID` จับคู่กับ `customers_data.Customer_ID` ได้ครบ **`50,000 / 50,000` (`100.0%`)** (ผ่านเกณฑ์ $\ge 99\%$)
- **Date & Business Logic**: ไม่พบวันที่ผิดรูปแบบ (`YYYY-MM-DD`), ไม่พบ `Transaction_Date < Signup_Date`, ไม่พบช่องว่างเกินหัว-ท้าย, และทุกแถวที่ไม่เป็น Missing มี `Total_Amount == Units_Sold * Price_Per_Unit` ถูกต้อง `100%`

### 2.2 Missing Values (`750` แถว = `1.50%`)
- ทุกแถวที่พบ Missing (`750` แถว) ขาดค่า **ทั้ง `Units_Sold` และ `Total_Amount` พร้อมกัน** (`0` แถวที่ขาดเพียงคอลัมน์เดียว)
- จำนวนแถว Missing แยกตามหมวดหมู่สินค้า:
  - `Dry Food`: `199` แถว
  - `Beverages`: `172` แถว
  - `Personal Care`: `164` แถว
  - `Household`: `111` แถว
  - `Snacks`: `104` แถว
- **วิธีจัดการ**: ตัด (`Drop`) ออกจากการวิเคราะห์หลัก เนื่องจากขาดข้อมูลปริมาณและยอดเงินพร้อมกัน (ไม่สามารถคำนวณย้อนกลับได้อย่างแม่นยำ) และคิดเป็นสัดส่วนเพียง `1.50%`

### 2.3 Extreme Outliers (`50` แถว = `0.10%`)
- ตรวจจับด้วย 2 วิธีพร้อมกันบน `Units_Sold` (`n = 49,250` แถวที่ไม่เป็น Missing):
  1. **IQR Method**: $Q_1 = 6.0$, $Q_3 = 19.0$, $\text{IQR} = 13.0$ $\rightarrow$ Upper Fence ($Q_3 + 1.5 \times \text{IQR}$) $= \mathbf{38.5}$ ชิ้น (Lower Fence $= -13.5$)
  2. **Z-Score Method**: $\text{Mean} = 13.75$, $\text{Std} = 40.57$ $\rightarrow$ เกณฑ์ $|Z| > 3$ คือ $> \mathbf{135.45}$ ชิ้น
- **ผลลัพธ์**: ทั้งวิธี IQR และ Z-Score จับกลุ่ม Outlier ได้ตรงกันพอดีที่ **`50` แถว** ซึ่งมีค่าผิดปกติเพียง 3 ค่าคือ:
  - `1,500` ชิ้น (`19` แถว) — เช่น `TXN-47997` และ `TXN-55134` (หมวด `Household` ยอดสูงถึง `1,335,000` บาท/บิล)
  - `999` ชิ้น (`16` แถว)
  - `1,200` ชิ้น (`15` แถว)
- ขณะที่ข้อมูลปกติอีก `49,200` แถวอยู่ในช่วง **`1` ถึง `24` ชิ้น** เท่านั้น
- **วิธีจัดการ**: แยก `50` แถวนี้ไปเก็บใน [`data/cleaned/outliers_audit.csv`](data/cleaned/outliers_audit.csv) พร้อมคอลัมน์ `IQR_Outlier`, `ZScore_Outlier`, และ `Outlier_Reason` เพื่อไม่ให้บิดเบือนค่าเฉลี่ยและแนวโน้มค้าปลีกปกติ แต่ยังคงตรวจสอบย้อนกลับได้

---

## 3. ตารางเปรียบเทียบสถิติ: ก่อน Clean vs หลัง Clean

### 3.1 ยอดเงินรวมต่อรายการ (`Total_Amount`, บาท)

| ตัวชี้วัด | ก่อน Clean (`n = 49,250`) | หลัง Clean (`n = 49,200`) | ผลกระทบจากการ Clean |
| :--- | :---: | :---: | :--- |
| **ผลรวม (Sum)** | `156,698,000.00` | `142,156,505.00` | แยกยอด Outlier ออก `14,541,495.00` (`-9.28%`) |
| **ค่าเฉลี่ย (Mean)** | `3,181.69` | `2,889.36` | ลดค่าเฉลี่ยที่ถูกดึงสูงเกินจริง (`-9.19%`) |
| **ส่วนเบี่ยงเบนมาตรฐาน (Std)** | `15,697.61` | `4,399.19` | ลดความผันผวนเทียมลง **`-71.98%`** |
| **Min / Max** | `35.00` / `1,335,000.00` | `35.00` / `21,360.00` | ค่าสูงสุดกลับสู่ระดับปกติ (`24 x 890`) |
| **Q1 / Median / Q3 (IQR)** | `500` / `1,035` / `2,880` (`2,380`) | `500` / `1,035` / `2,880` (`2,380`) | ตำแหน่งควอไทล์หลักคงที่สมบูรณ์ |

### 3.2 จำนวนชิ้นต่อรายการ (`Units_Sold`, ชิ้น)

| ตัวชี้วัด | ก่อน Clean (`n = 49,250`) | หลัง Clean (`n = 49,200`) |
| :--- | :---: | :---: |
| **ผลรวม (Sum)** | `677,363` | `614,879` |
| **Mean / Std** | `13.75` / `40.57` | `12.50` / `6.93` |
| **Min / Max** | `1` / `1,500` | `1` / `24` |
| **Q1 / Median / Q3 (IQR)** | `6` / `13` / `19` (`13`) | `6` / `13` / `19` (`13`) |

---

## 4. ขั้นตอน Pipeline และคอลัมน์วิเคราะห์เพิ่มเติม

ดำเนินการผ่านสคริปต์ [`pipeline/clean_data.py`](pipeline/clean_data.py) (`C:\W-AI\.venv` พร้อม [`requirements.txt`](requirements.txt)):

1. `load_and_validate_raw`: อ่าน CSV ดิบ, ตัดช่องว่าง, แปลงวันที่/ตัวเลข, ตรวจ PK/FK และขอบเขตอายุลูกค้า (`18–90`)
2. `clean_and_audit_transactions`: ตัด Dual-Missing `750` แถว, แยก IQR/Z-Score Outliers `50` แถวลง Audit Log, ตรวจสูตร `Total_Amount == Units_Sold * Price_Per_Unit`, ตรวจราคาต่อหมวดหมู่ และตรวจ `Transaction_Date >= Signup_Date`
3. `build_merged_dataset`: Join กับ `customers_data` บน `Customer_ID` (`many_to_one`) และเพิ่มคอลัมน์วิเคราะห์ `5` คอลัมน์ใน `merged_cleaned` (`19` คอลัมน์รวม — ดูรายละเอียดใน [`pipeline/DATA_DICTIONARY.md`](pipeline/DATA_DICTIONARY.md)):
   - `Year_Month` (`2025-01` – `2025-12`)
   - `Quarter` (`2025-Q1` – `2025-Q4`)
   - `Day_Of_Week` (`Monday` – `Sunday`)
   - `Age_Group` (`18-29`, `30-39`, `40-49`, `50-65`)
   - `Tenure_Days_At_Purchase` ($\ge 0$ วัน)
4. `export_outputs`: ส่งออก `.csv`, `.parquet`, `outliers_audit.csv` และตรวจสอบความตรงกันของ `merged_cleaned.parquet` ด้วย **DuckDB** (`49,200` แถว, ยอดรวม `142,156,505.0` บาท, `matches_pandas: true`) แล้วบันทึกลง [`data/cleaned/cleaning_report.json`](data/cleaned/cleaning_report.json)

---

## 5. การรันซ้ำและผลการทดสอบอัตโนมัติ (Verification)

### คำสั่งรัน Pipeline และชุดทดสอบบน Windows
```powershell
& 'C:\W-AI\.venv\Scripts\python.exe' 'C:\W-AI\pipeline\clean_data.py'
& 'C:\W-AI\.venv\Scripts\python.exe' -m unittest discover -s 'C:\W-AI\pipeline' -p 'test_*.py' -v
```

### ผลตรวจยืนยันล่าสุด
- ชุดทดสอบ [`pipeline/test_clean_data.py`](pipeline/test_clean_data.py): **ผ่านครบ `5 / 5` tests (`0.880s`)**
  - `test_expected_output_files_exist` — ok
  - `test_validation_and_row_counts` — ok
  - `test_cleaned_transactions_invariants` — ok
  - `test_outliers_audit_invariants` — ok
  - `test_merged_features_and_duckdb_parity` — ok
- `DuckDB` Parquet Cross-check: `49,200` แถว, ยอดรวม `142,156,505.0` บาท (`matches_pandas: true`)
