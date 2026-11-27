"""Export cleaned SmartRetail datasets into fast, pre-computed web JSON assets."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parent.parent
CLEANED_DIR = ROOT_DIR / "data" / "cleaned"
WEB_SRC_DATA_DIR = ROOT_DIR / "web" / "src" / "data"
WEB_PUBLIC_DATA_DIR = ROOT_DIR / "web" / "public" / "data"


def build_summary_payload(
    merged: pd.DataFrame,
    raw_txns: pd.DataFrame,
    cleaning_report: dict[str, Any],
    outliers_audit: pd.DataFrame,
) -> dict[str, Any]:
    """Pre-compute global KPIs, raw-vs-clean monthly trends, correlation matrix, and insights."""
    # Monthly clean vs raw revenue
    raw_valid = raw_txns.dropna(subset=["Units_Sold", "Total_Amount"]).copy()
    raw_valid["Year_Month"] = pd.to_datetime(raw_valid["Transaction_Date"]).dt.strftime("%Y-%m")
    raw_monthly = raw_valid.groupby("Year_Month")["Total_Amount"].agg(["count", "sum"])

    clean_monthly = merged.groupby("Year_Month").agg(
        clean_txns=("Transaction_ID", "count"),
        clean_revenue=("Total_Amount", "sum"),
        clean_units=("Units_Sold", "sum"),
    )

    monthly_series = []
    for ym in sorted(clean_monthly.index):
        c_row = clean_monthly.loc[ym]
        r_count = int(raw_monthly.loc[ym, "count"]) if ym in raw_monthly.index else 0
        r_sum = round(float(raw_monthly.loc[ym, "sum"]), 2) if ym in raw_monthly.index else 0.0
        monthly_series.append(
            {
                "month": ym,
                "cleanTxns": int(c_row["clean_txns"]),
                "cleanRevenue": round(float(c_row["clean_revenue"]), 2),
                "cleanUnits": int(c_row["clean_units"]),
                "rawTxns": r_count,
                "rawRevenue": r_sum,
            }
        )

    # Units_Sold histogram (1..24)
    units_counts = merged["Units_Sold"].value_counts().sort_index()
    units_histogram = [
        {"units": int(u), "count": int(cnt)} for u, cnt in units_counts.items()
    ]

    # Pearson correlation matrix
    corr_cols = [
        "Units_Sold",
        "Price_Per_Unit",
        "Total_Amount",
        "Age",
        "Tenure_Days_At_Purchase",
    ]
    corr_labels = {
        "Units_Sold": "Units Sold",
        "Price_Per_Unit": "Unit Price",
        "Total_Amount": "Total Amount",
        "Age": "Customer Age",
        "Tenure_Days_At_Purchase": "Tenure (Days)",
    }
    corr_df = merged[corr_cols].corr(method="pearson").round(4)
    corr_matrix = {
        "labels": [corr_labels[c] for c in corr_cols],
        "keys": corr_cols,
        "matrix": [
            [float(corr_df.loc[r, c]) for c in corr_cols] for r in corr_cols
        ],
    }

    # Customer-level tier summary
    cust_tier_stats = []
    tier_order = ["Basic", "Silver", "Gold", "Platinum"]
    tier_grouped = merged.groupby("Membership_Tier").agg(
        customers=("Customer_ID", "nunique"),
        txns=("Transaction_ID", "count"),
        revenue=("Total_Amount", "sum"),
    )
    for tier in tier_order:
        if tier in tier_grouped.index:
            row = tier_grouped.loc[tier]
            cust_count = int(row["customers"])
            rev = float(row["revenue"])
            cust_tier_stats.append(
                {
                    "tier": tier,
                    "customers": cust_count,
                    "txns": int(row["txns"]),
                    "revenue": round(rev, 2),
                    "avgRevenuePerCustomer": round(rev / cust_count, 2),
                    "avgTxnsPerCustomer": round(int(row["txns"]) / cust_count, 2),
                }
            )

    # Outliers audit list sorted by Total_Amount desc
    outliers_records = (
        outliers_audit.sort_values("Total_Amount", ascending=False)
        .assign(Transaction_Date=lambda d: d["Transaction_Date"].astype(str))
        .to_dict(orient="records")
    )

    insights = [
        {
            "id": "pareto-category",
            "title": "รายได้ 79.78% กระจุกตัวใน Household และ Personal Care",
            "metric": "58.03% Household",
            "what": "หมวด Household และ Personal Care มีสัดส่วนเพียง 35.36% ของบิล แต่สร้างรายได้ถึง 113.41 ล้านบาท จากยอดสะอาด 142.16 ล้านบาท ขณะที่ Dry Food, Beverages และ Snacks รวมกันทำเงิน 20.22%",
            "soWhat": "ลูกค้าซื้อเฉลี่ย ~12.50 ชิ้น/บิลเท่ากันในทุกหมวด (Corr(Price, Units) = -0.0065) แต่ราคาต่อหน่วยของ Household (890 บาท) ขับเคลื่อนมูลค่าบิลโดยตรง (Corr = +0.8123)",
            "nowWhat": "จัดแคมเปญ Cross-Selling จับคู่สินค้าขายดีฝั่ง Dry Food/Beverages คู่กับ Household/Personal Care เพื่อเพิ่มมูลค่าต่อบิล",
            "owner": "ทีม Merchandising & Marketing",
            "timeline": "เดือนที่ 1–2",
        },
        {
            "id": "stagnant-growth",
            "title": "ยอดขายปี 2025 ชะลอตัวคงที่ และข้อมูลดิบมีสัญญาณลวงจาก Outlier",
            "metric": "10.97M–12.53M / เดือน",
            "what": "ยอดขายสะอาดตลอดปี 2025 แกว่งในกรอบแคบ 10.97–12.53 ล้านบาท/เดือน (Q4 ลดลง -2.49% จาก Q3) ขณะที่ข้อมูลดิบทำให้เดือน มิ.ย. (14.93M) และ ส.ค. (15.52M) ดูสูงผิดปกติจากบิล 999–1,500 ชิ้น",
            "soWhat": "หากตัดสินใจจากข้อมูลดิบจะเข้าใจผิดว่าแคมเปญกลางปีสำเร็จ ทั้งที่ความจริงยอดขายกำลังชะลอตัวต่อเนื่อง",
            "nowWhat": "ยึด Cleaned Pipeline เป็นมาตรฐานเดียว แยก 50 บิลผิดปกติให้ฝ่ายปฏิบัติการตรวจสอบ และจัดแคมเปญกระตุ้นช่วง Low Season (ก.พ., พ.ค., พ.ย.)",
            "owner": "ทีม Data & Operations",
            "timeline": "สัปดาห์ที่ 1–4",
        },
        {
            "id": "online-digital",
            "title": "ช่องทาง Online นำหน้า (55.53%) และชำระเงินดิจิทัลครอง 70.54%",
            "metric": "78.95M Online",
            "what": "ยอดขาย Online สูงถึง 78.95 ล้านบาท เทียบกับ In-Store 63.21 ล้านบาท และลูกค้าชำระผ่าน Credit Card (40.51%) + PromptPay (30.03%) รวม 70.54%",
            "soWhat": "พฤติกรรมผู้บริโภคเปลี่ยนสู่ดิจิทัลชัดเจนแล้ว แต่หน้าร้าน In-Store ยังขาดแรงส่งและการเชื่อมโยง O2O",
            "nowWhat": "ผลักดันระบบ Click & Collect และโปรโมชัน QR PromptPay Cashback สำหรับหน้าร้านเพื่อเชื่อม Traffic ระหว่างสองช่องทาง",
            "owner": "ทีม E-Commerce & Store Ops",
            "timeline": "ไตรมาสที่ 1–2",
        },
        {
            "id": "regional-gap",
            "title": "ช่องว่างภูมิภาค: Central สูงกว่า West ถึง 3.36 เท่า",
            "metric": "35.30% vs 10.51%",
            "what": "ภาคกลางสร้างรายได้ 50.18 ล้านบาท (35.30%) ขณะที่ภาคตะวันตกทำได้ 14.94 ล้านบาท (10.51%) และภาคใต้ 21.18 ล้านบาท (14.90%)",
            "soWhat": "รายได้บริษัทพึ่งพาภาคกลางสูงเกินไป ทำให้ขยายฐานลูกค้าใหม่ได้จำกัดในต่างจังหวัด",
            "nowWhat": "จัดแคมเปญเฉพาะพื้นที่ (Localized Promotion) และลดเกณฑ์ส่งฟรีสำหรับภาค West และ South",
            "owner": "ทีม Regional Sales",
            "timeline": "เดือนที่ 2–3",
        },
        {
            "id": "flat-tier",
            "title": "ระดับสมาชิกยังไม่สร้างความแตกต่างด้านยอดใช้จ่ายต่อคน",
            "metric": "~142k บาท/คน ทุกระดับ",
            "what": "ยอดใช้จ่ายเฉลี่ยต่อลูกค้าตั้งแต่ Basic (140.5k) จนถึง Platinum (144.2k) และความถี่ (~49.2 บิล/คน) แทบไม่ต่างกัน",
            "soWhat": "โครงสร้าง Loyalty Program ปัจจุบันยังไม่จูงใจให้กลุ่ม Gold/Platinum เพิ่มยอดซื้อ หรือดึงกลุ่ม Basic (499 คน) ให้อัปเกรด",
            "nowWhat": "ปรับสิทธิประโยชน์แบบ Tiered Rewards เช่น ส่วนลดเฉพาะหมวด Household และส่งฟรีไม่จำกัดสำหรับ Gold/Platinum",
            "owner": "ทีม CRM & Loyalty",
            "timeline": "เดือนที่ 1–3",
        },
    ]

    return {
        "generatedAt": "2025-12-31 Cleaned Snapshot",
        "cleaningReport": cleaning_report,
        "monthlySeries": monthly_series,
        "unitsHistogram": units_histogram,
        "correlationMatrix": corr_matrix,
        "tierStats": cust_tier_stats,
        "outliersAudit": outliers_records,
        "insights": insights,
    }


def build_compact_transactions(merged: pd.DataFrame) -> dict[str, Any]:
    """Dictionary-encode all 49,200 clean rows into a compact JSON payload."""
    ordered = merged.sort_values(["Transaction_Date", "Transaction_ID"]).reset_index(drop=True)
    ordered["Date_Str"] = pd.to_datetime(ordered["Transaction_Date"]).dt.strftime("%Y-%m-%d")

    dict_cols = [
        "Year_Month",
        "Quarter",
        "Category",
        "Channel",
        "Payment_Method",
        "Region",
        "Membership_Tier",
        "Gender",
        "Age_Group",
    ]
    lookups: dict[str, list[str]] = {}
    encoded_cols: dict[str, list[int]] = {}
    for col in dict_cols:
        uniques = sorted(ordered[col].astype(str).unique().tolist())
        mapping = {val: idx for idx, val in enumerate(uniques)}
        lookups[col] = uniques
        encoded_cols[col] = [mapping[v] for v in ordered[col].astype(str)]

    rows = []
    for i, row in enumerate(ordered.itertuples(index=False)):
        rows.append(
            [
                row.Transaction_ID,
                row.Customer_ID,
                row.Date_Str,
                encoded_cols["Year_Month"][i],
                encoded_cols["Quarter"][i],
                encoded_cols["Category"][i],
                encoded_cols["Channel"][i],
                int(row.Units_Sold),
                int(round(float(row.Price_Per_Unit))),
                int(round(float(row.Total_Amount))),
                encoded_cols["Payment_Method"][i],
                encoded_cols["Region"][i],
                encoded_cols["Membership_Tier"][i],
                encoded_cols["Gender"][i],
                encoded_cols["Age_Group"][i],
                int(row.Age),
            ]
        )

    return {
        "fields": [
            "id",
            "cid",
            "date",
            "ym",
            "q",
            "cat",
            "chan",
            "units",
            "price",
            "total",
            "pay",
            "reg",
            "tier",
            "gen",
            "ageGrp",
            "age",
        ],
        "lookups": lookups,
        "rows": rows,
    }


def export_web_data() -> None:
    """Run web export and verify exported record counts and revenue parity."""
    merged = pd.read_parquet(CLEANED_DIR / "merged_cleaned.parquet")
    raw_txns = pd.read_csv(ROOT_DIR / "transactions_data.csv", encoding="utf-8-sig")
    cleaning_report = json.loads((CLEANED_DIR / "cleaning_report.json").read_text(encoding="utf-8"))
    outliers_audit = pd.read_csv(CLEANED_DIR / "outliers_audit.csv", encoding="utf-8")

    WEB_SRC_DATA_DIR.mkdir(parents=True, exist_ok=True)
    WEB_PUBLIC_DATA_DIR.mkdir(parents=True, exist_ok=True)

    summary = build_summary_payload(merged, raw_txns, cleaning_report, outliers_audit)
    compact = build_compact_transactions(merged)

    summary_path = WEB_SRC_DATA_DIR / "summary.json"
    compact_path = WEB_PUBLIC_DATA_DIR / "transactions_compact.json"

    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    compact_path.write_text(json.dumps(compact, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")

    total_sum = sum(r[9] for r in compact["rows"])
    assert len(compact["rows"]) == 49200, f"Expected 49200 rows, got {len(compact['rows'])}"
    assert total_sum == 142156505, f"Expected 142156505 revenue, got {total_sum}"
    print(
        json.dumps(
            {
                "summary_bytes": summary_path.stat().st_size,
                "compact_bytes": compact_path.stat().st_size,
                "compact_rows": len(compact["rows"]),
                "compact_revenue": total_sum,
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    export_web_data()
