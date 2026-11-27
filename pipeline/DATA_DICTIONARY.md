# Data Dictionary — SmartRetail Thailand Pipeline

เอกสารนี้อธิบายโครงสร้างข้อมูลทั้งหมดของระบบ ตั้งแต่ตารางดิบ ตารางหลังทำความสะอาด (`data/cleaned/`) ตารางตรวจสอบข้อมูลผิดปกติ (`outliers_audit.csv`) และคอลัมน์วิเคราะห์เพิ่มเติมใน `merged_cleaned`

---

## 1. `cleaned_customers` (`cleaned_customers.csv` / `.parquet`)
- **แหล่งที่มา**: `customers_data.csv` (`1,000` แถว, ไม่มี Missing Values)
- **Primary Key**: `Customer_ID` (`100%` Unique)

| Field Name | Data Type | Constraint / Domain | Nullable | Description |
| :--- | :--- | :--- | :---: | :--- |
| `Customer_ID` | String | `CUST-001` .. `CUST-1000` (PK) | No | รหัสประจำตัวลูกค้า |
| `Gender` | String | `Male`, `Female` | No | เพศของลูกค้า |
| `Age` | Int64 | `18` – `65` (เกณฑ์ `18–90`) | No | อายุของลูกค้า (ปี) |
| `Membership_Tier` | String | `Basic`, `Silver`, `Gold`, `Platinum` | No | ระดับสมาชิก |
| `Signup_Date` | Date (`YYYY-MM-DD`) | `2023-01-01` – `2024-12-31` | No | วันที่สมัครสมาชิก |

---

## 2. `cleaned_transactions` (`cleaned_transactions.csv` / `.parquet`)
- **แหล่งที่มา**: `transactions_data.csv` (`50,000` แถวดิบ $\rightarrow$ ตัด Dual-Missing `750` แถว $\rightarrow$ แยก Extreme Outliers `50` แถว $\rightarrow$ เหลือ **`49,200`** แถวสะอาด)
- **Primary Key**: `Transaction_ID` | **Foreign Key**: `Customer_ID` ($\text{Match Rate} = 100\%$)

| Field Name | Data Type | Constraint / Domain | Nullable | Description |
| :--- | :--- | :--- | :---: | :--- |
| `Transaction_ID` | String | `TXN-XXXXX` (PK) | No | รหัสธุรกรรมการซื้อขาย |
| `Customer_ID` | String | FK $\rightarrow$ `cleaned_customers.Customer_ID` | No | รหัสลูกค้าที่ทำรายการ |
| `Transaction_Date` | Date (`YYYY-MM-DD`) | `2025-01-01` – `2025-12-31` ($\ge$ `Signup_Date`) | No | วันที่ทำรายการซื้อขาย |
| `Category` | String | `Dry Food`, `Beverages`, `Personal Care`, `Household`, `Snacks` | No | หมวดหมู่สินค้า |
| `Channel` | String | `In-Store`, `Online` | No | ช่องทางการจำหน่าย |
| `Units_Sold` | Int64 | `1` – `24` (ภายใน IQR Upper Fence `38.5`) | No | จำนวนชิ้นที่ซื้อ |
| `Price_Per_Unit` | Float64 | `35.0`, `45.0`, `120.0`, `250.0`, `890.0` | No | ราคาขายต่อหน่วย (บาท) ผูก 1-ต่อ-1 กับ `Category` |
| `Total_Amount` | Float64 | `Units_Sold * Price_Per_Unit` (`35.0` – `21,360.0`) | No | ยอดรวมรายการ (บาท) |
| `Payment_Method` | String | `Cash`, `Credit Card`, `PromptPay` | No | วิธีการชำระเงิน |
| `Region` | String | `Central`, `North`, `South`, `Northeast`, `West` | No | ภูมิภาคที่เกิดยอดขาย |

---

## 3. `merged_cleaned` (`merged_cleaned.csv` / `.parquet`)
รวมทุกฟิลด์ของ `cleaned_transactions` + `cleaned_customers` (`49,200` แถว) พร้อมคอลัมน์ Feature Engineering 5 คอลัมน์:

| Derived Field | Data Type | Constraint / Domain | Nullable | Description |
| :--- | :--- | :--- | :---: | :--- |
| `Year_Month` | String | `2025-01` – `2025-12` | No | ปี-เดือนสำหรับ Time Series รายเดือน |
| `Quarter` | String | `2025-Q1` – `2025-Q4` | No | ไตรมาสที่เกิดธุรกรรม |
| `Day_Of_Week` | String | `Monday` – `Sunday` | No | วันในสัปดาห์ของธุรกรรม |
| `Age_Group` | String | `18-29`, `30-39`, `40-49`, `50-65` | No | ช่วงอายุลูกค้าสำหรับ Segment Analysis |
| `Tenure_Days_At_Purchase` | Int64 | $\ge 0$ (`Transaction_Date - Signup_Date`) | No | จำนวนวันอายุสมาชิก ณ วันที่ซื้อ |

---

## 4. `outliers_audit.csv` & `cleaning_report.json`
- **`outliers_audit.csv` (`50` แถว)**: เก็บรายการธุรกรรมที่ `Units_Sold` เกินทั้งเกณฑ์ IQR (`> 38.5`) และ Z-score (`|Z| > 3`, `> 135.45`) ได้แก่ `999` (16 แถว), `1,200` (15 แถว), `1,500` (19 แถว) รวมมูลค่า `14,541,495` บาท พร้อมคอลัมน์ `IQR_Outlier`, `ZScore_Outlier`, `Outlier_Reason` เพื่อใช้ตรวจสอบย้อนกลับ
- **`cleaning_report.json`**: เก็บผลตรวจ PK/FK, จำนวนแถวที่ตัด/แยก, ตารางสถิติ Before vs After Cleaning, และผล Cross-Check ด้วย DuckDB บนไฟล์ Parquet
