"""Automated verification tests for the SmartRetail Thailand data cleaning pipeline."""

import json
import sys
import tempfile
import unittest
from pathlib import Path

import duckdb
import pandas as pd

PIPELINE_DIR = Path(__file__).resolve().parent
ROOT_DIR = PIPELINE_DIR.parent
if str(PIPELINE_DIR) not in sys.path:
    sys.path.insert(0, str(PIPELINE_DIR))

from clean_data import run_pipeline


class TestCleanDataPipeline(unittest.TestCase):
    """End-to-end validation for cleaned outputs, outlier isolation, and statistical parity."""

    @classmethod
    def setUpClass(cls) -> None:
        cls._tmp_dir = tempfile.TemporaryDirectory()
        cls.cleaned_dir = Path(cls._tmp_dir.name)
        cls.report = run_pipeline(ROOT_DIR, output_dir=cls.cleaned_dir)

    @classmethod
    def tearDownClass(cls) -> None:
        cls._tmp_dir.cleanup()

    def test_expected_output_files_exist(self) -> None:
        expected = [
            "cleaned_customers.csv",
            "cleaned_customers.parquet",
            "cleaned_transactions.csv",
            "cleaned_transactions.parquet",
            "merged_cleaned.csv",
            "merged_cleaned.parquet",
            "outliers_audit.csv",
            "cleaning_report.json",
        ]
        for filename in expected:
            self.assertTrue((self.cleaned_dir / filename).is_file(), f"Missing {filename}")

    def test_validation_and_row_counts(self) -> None:
        val = self.report["validation"]
        summary = self.report["cleaning_summary"]

        self.assertEqual(val["raw_customers_rows"], 1000)
        self.assertEqual(val["raw_transactions_rows"], 50000)
        self.assertEqual(val["fk_match_rate_pct"], 100.0)
        self.assertEqual(summary["dropped_dual_missing_rows"], 750)
        self.assertEqual(summary["outliers_iqr_count"], 50)
        self.assertEqual(summary["outliers_zscore_count"], 50)
        self.assertEqual(summary["outliers_isolated_rows"], 50)
        self.assertEqual(summary["cleaned_transactions_rows"], 49200)
        self.assertEqual(self.report["merged_rows"], 49200)

    def test_cleaned_transactions_invariants(self) -> None:
        df = pd.read_parquet(self.cleaned_dir / "cleaned_transactions.parquet")
        self.assertEqual(len(df), 49200)
        self.assertEqual(int(df.isna().sum().sum()), 0)
        self.assertTrue(df["Units_Sold"].between(1, 24).all())
        self.assertAlmostEqual(float(df["Total_Amount"].sum()), 142156505.0, places=2)
        self.assertAlmostEqual(float(df["Total_Amount"].mean()), 2889.36, places=2)
        self.assertTrue((df["Total_Amount"] == df["Units_Sold"] * df["Price_Per_Unit"]).all())

    def test_outliers_audit_invariants(self) -> None:
        audit = pd.read_csv(self.cleaned_dir / "outliers_audit.csv")
        self.assertEqual(len(audit), 50)
        self.assertEqual(set(audit["Units_Sold"].unique()), {999, 1200, 1500})
        self.assertAlmostEqual(float(audit["Total_Amount"].sum()), 14541495.0, places=2)
        self.assertTrue(audit["IQR_Outlier"].all())
        self.assertTrue(audit["ZScore_Outlier"].all())

    def test_merged_features_and_duckdb_parity(self) -> None:
        merged = pd.read_parquet(self.cleaned_dir / "merged_cleaned.parquet")
        self.assertEqual(len(merged), 49200)
        self.assertEqual(int(merged.isna().sum().sum()), 0)
        self.assertTrue((merged["Tenure_Days_At_Purchase"] >= 0).all())
        self.assertEqual(
            set(merged["Quarter"].unique()),
            {"2025-Q1", "2025-Q2", "2025-Q3", "2025-Q4"},
        )

        report_disk = json.loads((self.cleaned_dir / "cleaning_report.json").read_text(encoding="utf-8"))
        self.assertTrue(report_disk["duckdb_verification"]["matches_pandas"])
        self.assertEqual(report_disk["duckdb_verification"]["parquet_rows"], 49200)

        parquet_path = (self.cleaned_dir / "merged_cleaned.parquet").as_posix()
        con = duckdb.connect()
        try:
            count, rev = con.execute(
                f"SELECT COUNT(*), SUM(Total_Amount) FROM read_parquet('{parquet_path}')"
            ).fetchone()
        finally:
            con.close()
        self.assertEqual(count, 49200)
        self.assertAlmostEqual(float(rev), 142156505.0, places=2)


if __name__ == "__main__":
    unittest.main()
