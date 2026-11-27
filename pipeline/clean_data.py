"""Reproducible Data Cleaning & Feature Engineering Pipeline for SmartRetail Thailand."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import duckdb
import numpy as np
import pandas as pd


EXPECTED_AGE_RANGE = (18, 90)
CATEGORY_PRICES = {
    "Snacks": 35.0,
    "Beverages": 45.0,
    "Dry Food": 120.0,
    "Personal Care": 250.0,
    "Household": 890.0,
}


def summarize_numeric(series: pd.Series) -> dict[str, float | int]:
    """Compute descriptive statistics (n, mean, std, min, Q1, median, Q3, IQR, max)."""
    clean = series.dropna().astype(float)
    q1 = float(clean.quantile(0.25))
    median = float(clean.quantile(0.50))
    q3 = float(clean.quantile(0.75))
    return {
        "n": int(clean.shape[0]),
        "sum": round(float(clean.sum()), 2),
        "mean": round(float(clean.mean()), 2),
        "std": round(float(clean.std(ddof=1)), 2),
        "min": round(float(clean.min()), 2),
        "q1": round(q1, 2),
        "median": round(median, 2),
        "q3": round(q3, 2),
        "iqr": round(q3 - q1, 2),
        "max": round(float(clean.max()), 2),
    }


def _strip_object_columns(df: pd.DataFrame) -> pd.DataFrame:
    """Trim leading and trailing whitespace across all string/object columns."""
    out = df.copy()
    for col in out.select_dtypes(include=["object", "string"]).columns:
        out[col] = out[col].astype("string").str.strip()
    return out


def load_and_validate_raw(base_dir: Path) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    """Load raw CSVs, parse dates, and validate PK uniqueness and FK integrity."""
    cust_path = base_dir / "customers_data.csv"
    txn_path = base_dir / "transactions_data.csv"

    cust = _strip_object_columns(pd.read_csv(cust_path, encoding="utf-8-sig"))
    txns = _strip_object_columns(pd.read_csv(txn_path, encoding="utf-8-sig"))

    cust["Age"] = pd.to_numeric(cust["Age"], errors="raise").astype("int64")
    cust["Signup_Date"] = pd.to_datetime(cust["Signup_Date"], format="%Y-%m-%d", errors="raise")

    txns["Transaction_Date"] = pd.to_datetime(txns["Transaction_Date"], format="%Y-%m-%d", errors="raise")
    txns["Units_Sold"] = pd.to_numeric(txns["Units_Sold"], errors="coerce")
    txns["Price_Per_Unit"] = pd.to_numeric(txns["Price_Per_Unit"], errors="raise").astype("float64")
    txns["Total_Amount"] = pd.to_numeric(txns["Total_Amount"], errors="coerce")

    cust_pk_unique = bool(cust["Customer_ID"].is_unique)
    txn_pk_unique = bool(txns["Transaction_ID"].is_unique)
    fk_matched = int(txns["Customer_ID"].isin(cust["Customer_ID"]).sum())
    fk_match_rate = round(fk_matched / len(txns) * 100.0, 4)

    if not cust_pk_unique or not txn_pk_unique:
        raise ValueError("Primary key uniqueness check failed.")
    if fk_match_rate < 99.0:
        raise ValueError(f"FK match rate {fk_match_rate}% is below 99% threshold.")

    age_valid = bool(cust["Age"].between(*EXPECTED_AGE_RANGE).all())
    if not age_valid:
        raise ValueError("Customer ages outside expected [18, 90] constraint.")

    validation = {
        "raw_customers_rows": int(len(cust)),
        "raw_transactions_rows": int(len(txns)),
        "customer_pk_unique": cust_pk_unique,
        "transaction_pk_unique": txn_pk_unique,
        "fk_matched_rows": fk_matched,
        "fk_match_rate_pct": fk_match_rate,
        "customers_missing_cells": int(cust.isna().sum().sum()),
    }
    return cust, txns, validation


def detect_outliers_iqr_and_zscore(series: pd.Series) -> tuple[pd.Series, pd.Series, dict[str, float]]:
    """Flag outliers using both IQR (1.5x) and Z-score (|Z| > 3) rules."""
    valid = series.dropna().astype(float)
    q1 = float(valid.quantile(0.25))
    q3 = float(valid.quantile(0.75))
    iqr = q3 - q1
    iqr_lower = q1 - 1.5 * iqr
    iqr_upper = q3 + 1.5 * iqr

    mean = float(valid.mean())
    std = float(valid.std(ddof=1))
    z_scores = (series.astype(float) - mean).abs() / std

    is_iqr = (series < iqr_lower) | (series > iqr_upper)
    is_z = z_scores > 3.0
    bounds = {
        "q1": round(q1, 2),
        "q3": round(q3, 2),
        "iqr": round(iqr, 2),
        "iqr_lower_fence": round(iqr_lower, 2),
        "iqr_upper_fence": round(iqr_upper, 2),
        "z_mean": round(mean, 2),
        "z_std": round(std, 2),
        "z_3sigma_upper": round(mean + 3.0 * std, 2),
    }
    return is_iqr.fillna(False), is_z.fillna(False), bounds


def clean_and_audit_transactions(
    txns: pd.DataFrame,
    cust: pd.DataFrame,
) -> tuple[pd.DataFrame, pd.DataFrame, dict[str, Any]]:
    """Drop dual-missing rows, isolate IQR/Z-score outliers into audit log, and verify invariants."""
    dual_missing_mask = txns["Units_Sold"].isna() & txns["Total_Amount"].isna()
    any_missing_mask = txns["Units_Sold"].isna() | txns["Total_Amount"].isna()
    single_missing_count = int((any_missing_mask & ~dual_missing_mask).sum())
    if single_missing_count > 0:
        raise ValueError(f"Unexpected single-column missing rows: {single_missing_count}")

    missing_by_category = (
        txns.loc[dual_missing_mask, "Category"].value_counts().sort_index().to_dict()
    )
    non_missing = txns.loc[~dual_missing_mask].copy()

    raw_amount_stats = summarize_numeric(non_missing["Total_Amount"])
    raw_units_stats = summarize_numeric(non_missing["Units_Sold"])

    is_iqr, is_z, outlier_bounds = detect_outliers_iqr_and_zscore(non_missing["Units_Sold"])
    outlier_mask = is_iqr | is_z

    outliers_audit = non_missing.loc[outlier_mask].copy()
    outliers_audit["Units_Sold"] = outliers_audit["Units_Sold"].astype("int64")
    outliers_audit["IQR_Outlier"] = is_iqr.loc[outlier_mask].values
    outliers_audit["ZScore_Outlier"] = is_z.loc[outlier_mask].values
    outliers_audit["Outlier_Reason"] = (
        f"Units_Sold > IQR upper fence ({outlier_bounds['iqr_upper_fence']}) "
        f"and |Z| > 3 ({outlier_bounds['z_3sigma_upper']})"
    )

    cleaned = non_missing.loc[~outlier_mask].copy()
    cleaned["Units_Sold"] = cleaned["Units_Sold"].astype("int64")

    # Verify arithmetic, category-price mapping, and chronological ordering
    expected_total = cleaned["Units_Sold"].astype("float64") * cleaned["Price_Per_Unit"]
    if not np.allclose(cleaned["Total_Amount"], expected_total, atol=1e-6):
        raise ValueError("Total_Amount != Units_Sold * Price_Per_Unit mismatch detected.")

    expected_prices = cleaned["Category"].map(CATEGORY_PRICES)
    if not np.allclose(cleaned["Price_Per_Unit"], expected_prices, atol=1e-6):
        raise ValueError("Category to Price_Per_Unit mapping mismatch detected.")

    signup_lookup = cust.set_index("Customer_ID")["Signup_Date"]
    joined_signup = cleaned["Customer_ID"].map(signup_lookup)
    if bool((cleaned["Transaction_Date"] < joined_signup).any()):
        raise ValueError("Found Transaction_Date earlier than Customer Signup_Date.")

    if int(cleaned.isna().sum().sum()) != 0:
        raise ValueError("Cleaned transactions still contain missing values.")

    clean_amount_stats = summarize_numeric(cleaned["Total_Amount"])
    clean_units_stats = summarize_numeric(cleaned["Units_Sold"])
    audit_summary = {
        "dropped_dual_missing_rows": int(dual_missing_mask.sum()),
        "dropped_missing_by_category": {str(k): int(v) for k, v in missing_by_category.items()},
        "outliers_iqr_count": int(is_iqr.sum()),
        "outliers_zscore_count": int(is_z.sum()),
        "outliers_isolated_rows": int(len(outliers_audit)),
        "outliers_unique_units": {str(int(k)): int(v) for k, v in outliers_audit["Units_Sold"].value_counts().items()},
        "outliers_revenue_sum": round(float(outliers_audit["Total_Amount"].sum()), 2),
        "outlier_bounds": outlier_bounds,
        "cleaned_transactions_rows": int(len(cleaned)),
        "before_cleaning_total_amount": raw_amount_stats,
        "after_cleaning_total_amount": clean_amount_stats,
        "before_cleaning_units_sold": raw_units_stats,
        "after_cleaning_units_sold": clean_units_stats,
    }
    return cleaned, outliers_audit, audit_summary


def build_merged_dataset(clean_txns: pd.DataFrame, clean_cust: pd.DataFrame) -> pd.DataFrame:
    """Join cleaned transactions with customers and engineer analytical time/cohort features."""
    merged = clean_txns.merge(clean_cust, on="Customer_ID", how="left", validate="many_to_one")
    merged["Year_Month"] = merged["Transaction_Date"].dt.strftime("%Y-%m")
    merged["Quarter"] = (
        merged["Transaction_Date"].dt.year.astype(str)
        + "-Q"
        + merged["Transaction_Date"].dt.quarter.astype(str)
    )
    merged["Day_Of_Week"] = merged["Transaction_Date"].dt.day_name()
    merged["Age_Group"] = pd.cut(
        merged["Age"],
        bins=[17, 29, 39, 49, 90],
        labels=["18-29", "30-39", "40-49", "50-65"],
    ).astype("string")
    merged["Tenure_Days_At_Purchase"] = (
        merged["Transaction_Date"] - merged["Signup_Date"]
    ).dt.days.astype("int64")

    if bool((merged["Tenure_Days_At_Purchase"] < 0).any()):
        raise ValueError("Negative Tenure_Days_At_Purchase detected.")
    if int(merged.isna().sum().sum()) != 0:
        raise ValueError("Merged cleaned dataset contains missing values.")
    return merged


def _write_csv_with_iso_dates(df: pd.DataFrame, path: Path) -> None:
    """Write DataFrame to UTF-8 CSV formatting datetime columns as YYYY-MM-DD."""
    out = df.copy()
    for col in out.select_dtypes(include=["datetime64[ns]"]).columns:
        out[col] = out[col].dt.strftime("%Y-%m-%d")
    out.to_csv(path, index=False, encoding="utf-8")


def export_outputs(
    output_dir: Path,
    clean_cust: pd.DataFrame,
    clean_txns: pd.DataFrame,
    merged: pd.DataFrame,
    outliers_audit: pd.DataFrame,
    report: dict[str, Any],
) -> dict[str, Any]:
    """Export cleaned CSV/Parquet artifacts, audit log, and verify Parquet parity via DuckDB."""
    output_dir.mkdir(parents=True, exist_ok=True)

    _write_csv_with_iso_dates(clean_cust, output_dir / "cleaned_customers.csv")
    clean_cust.to_parquet(output_dir / "cleaned_customers.parquet", index=False)

    _write_csv_with_iso_dates(clean_txns, output_dir / "cleaned_transactions.csv")
    clean_txns.to_parquet(output_dir / "cleaned_transactions.parquet", index=False)

    _write_csv_with_iso_dates(merged, output_dir / "merged_cleaned.csv")
    merged.to_parquet(output_dir / "merged_cleaned.parquet", index=False)

    _write_csv_with_iso_dates(outliers_audit, output_dir / "outliers_audit.csv")

    merged_parquet = (output_dir / "merged_cleaned.parquet").as_posix()
    con = duckdb.connect()
    try:
        duck_rows, duck_rev = con.execute(
            f"SELECT COUNT(*), ROUND(SUM(Total_Amount), 2) FROM read_parquet('{merged_parquet}')"
        ).fetchone()
    finally:
        con.close()

    report["duckdb_verification"] = {
        "parquet_rows": int(duck_rows),
        "parquet_total_revenue": float(duck_rev),
        "matches_pandas": (
            int(duck_rows) == len(merged)
            and abs(float(duck_rev) - float(merged["Total_Amount"].sum())) < 1e-4
        ),
    }

    report_path = output_dir / "cleaning_report.json"
    report_path.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding="utf-8")
    return report


def run_pipeline(base_dir: Path | None = None, output_dir: Path | None = None) -> dict[str, Any]:
    """Execute end-to-end validation, cleaning, feature engineering, and export."""
    root = base_dir or Path(__file__).resolve().parent.parent
    target_output = output_dir or (root / "data" / "cleaned")

    cust, txns, validation = load_and_validate_raw(root)
    clean_txns, outliers_audit, audit_summary = clean_and_audit_transactions(txns, cust)
    merged = build_merged_dataset(clean_txns, cust)

    report = {
        "validation": validation,
        "cleaning_summary": audit_summary,
        "merged_rows": int(len(merged)),
        "merged_columns": list(merged.columns),
    }
    return export_outputs(target_output, cust, clean_txns, merged, outliers_audit, report)


if __name__ == "__main__":
    result = run_pipeline()
    print(json.dumps(result, indent=2, ensure_ascii=False))
