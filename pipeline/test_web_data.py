"""Automated parity tests verifying web JSON data matches cleaned Parquet datasets."""

import json
import unittest
from pathlib import Path

import pandas as pd


ROOT_DIR = Path(__file__).resolve().parent.parent
CLEANED_DIR = ROOT_DIR / "data" / "cleaned"
WEB_SUMMARY_PATH = ROOT_DIR / "web" / "src" / "data" / "summary.json"
WEB_COMPACT_PATH = ROOT_DIR / "web" / "public" / "data" / "transactions_compact.json"


class TestWebDataParity(unittest.TestCase):
    """Verify web summary and compact transaction payloads match cleaned data 100%."""

    @classmethod
    def setUpClass(cls) -> None:
        cls.merged = pd.read_parquet(CLEANED_DIR / "merged_cleaned.parquet")
        cls.audit_csv = pd.read_csv(CLEANED_DIR / "outliers_audit.csv", encoding="utf-8")
        cls.summary = json.loads(WEB_SUMMARY_PATH.read_text(encoding="utf-8"))
        cls.compact = json.loads(WEB_COMPACT_PATH.read_text(encoding="utf-8"))

    def test_compact_rows_parity(self) -> None:
        ordered = self.merged.sort_values(["Transaction_Date", "Transaction_ID"]).reset_index(drop=True)
        ordered["Date_Str"] = pd.to_datetime(ordered["Transaction_Date"]).dt.strftime("%Y-%m-%d")

        lookups = self.compact["lookups"]
        rows = self.compact["rows"]
        self.assertEqual(len(rows), 49200)
        self.assertEqual(len(rows), len(ordered))

        total_rev = 0
        for i, r in enumerate(rows):
            mr = ordered.iloc[i]
            self.assertEqual(r[0], mr["Transaction_ID"])
            self.assertEqual(r[1], mr["Customer_ID"])
            self.assertEqual(r[2], mr["Date_Str"])
            self.assertEqual(lookups["Year_Month"][r[3]], mr["Year_Month"])
            self.assertEqual(lookups["Quarter"][r[4]], mr["Quarter"])
            self.assertEqual(lookups["Category"][r[5]], mr["Category"])
            self.assertEqual(lookups["Channel"][r[6]], mr["Channel"])
            self.assertEqual(r[7], int(mr["Units_Sold"]))
            self.assertEqual(r[8], int(round(float(mr["Price_Per_Unit"]))))
            self.assertEqual(r[9], int(round(float(mr["Total_Amount"]))))
            self.assertEqual(lookups["Payment_Method"][r[10]], mr["Payment_Method"])
            self.assertEqual(lookups["Region"][r[11]], mr["Region"])
            self.assertEqual(lookups["Membership_Tier"][r[12]], mr["Membership_Tier"])
            self.assertEqual(lookups["Gender"][r[13]], mr["Gender"])
            self.assertEqual(lookups["Age_Group"][r[14]], str(mr["Age_Group"]))
            self.assertEqual(r[15], int(mr["Age"]))
            total_rev += r[9]

        self.assertEqual(total_rev, 142156505)

    def test_summary_aggregates_parity(self) -> None:
        monthly = self.summary["monthlySeries"]
        self.assertEqual(len(monthly), 12)
        self.assertEqual(sum(m["cleanTxns"] for m in monthly), 49200)
        self.assertAlmostEqual(sum(m["cleanRevenue"] for m in monthly), 142156505.0, places=2)

        hist = {h["units"]: h["count"] for h in self.summary["unitsHistogram"]}
        expected_hist = {int(k): int(v) for k, v in self.merged["Units_Sold"].value_counts().items()}
        self.assertEqual(hist, expected_hist)

        corr_keys = self.summary["correlationMatrix"]["keys"]
        actual_corr = self.merged[corr_keys].corr(method="pearson").round(4)
        for ri, rk in enumerate(corr_keys):
            for ci, ck in enumerate(corr_keys):
                self.assertAlmostEqual(
                    self.summary["correlationMatrix"]["matrix"][ri][ci],
                    float(actual_corr.loc[rk, ck]),
                    places=4,
                )

        self.assertEqual(len(self.summary["outliersAudit"]), len(self.audit_csv))
        self.assertAlmostEqual(
            sum(r["Total_Amount"] for r in self.summary["outliersAudit"]),
            float(self.audit_csv["Total_Amount"].sum()),
            places=2,
        )


if __name__ == "__main__":
    unittest.main()
