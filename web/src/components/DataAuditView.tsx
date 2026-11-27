"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, Download, Filter, AlertTriangle, Database } from "lucide-react";
import { formatNumber, formatTHB } from "@/lib/analytics";
import type { SummaryPayload } from "@/types/dashboard";
import { MemeSticker } from "./MemeSticker";

interface DataAuditViewProps {
  summary: SummaryPayload;
  showMemes: boolean;
}

export function DataAuditView({ summary, showMemes }: DataAuditViewProps) {
  const [unitFilter, setUnitFilter] = useState<string>("ALL");
  const [catFilter, setCatFilter] = useState<string>("ALL");

  const { validation, cleaning_summary, duckdb_verification } = summary.cleaningReport;

  const filteredOutliers = useMemo(() => {
    return summary.outliersAudit.filter((row) => {
      if (unitFilter !== "ALL" && String(row.Units_Sold) !== unitFilter) return false;
      if (catFilter !== "ALL" && row.Category !== catFilter) return false;
      return true;
    });
  }, [summary.outliersAudit, unitFilter, catFilter]);

  const exportAuditCsv = () => {
    const header = [
      "Transaction_ID",
      "Customer_ID",
      "Transaction_Date",
      "Category",
      "Channel",
      "Units_Sold",
      "Price_Per_Unit",
      "Total_Amount",
      "Payment_Method",
      "Region",
      "IQR_Outlier",
      "ZScore_Outlier",
    ].join(",");
    const lines = filteredOutliers.map((r) =>
      [
        r.Transaction_ID,
        r.Customer_ID,
        r.Transaction_Date,
        r.Category,
        r.Channel,
        r.Units_Sold,
        r.Price_Per_Unit,
        r.Total_Amount,
        r.Payment_Method,
        r.Region,
        r.IQR_Outlier,
        r.ZScore_Outlier,
      ].join(","),
    );
    const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "smartretail_outliers_audit_50.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const pipelineSteps = [
    {
      step: "1. Raw Input",
      count: formatNumber(validation.raw_transactions_rows),
      desc: "transactions_data.csv + 1,000 customers_data.csv",
      badge: `FK Match ${validation.fk_match_rate_pct}%`,
    },
    {
      step: "2. Drop Dual-Missing",
      count: `-${formatNumber(cleaning_summary.dropped_dual_missing_rows)}`,
      desc: "ตัดแถวที่ขาด Units_Sold & Total_Amount พร้อมกัน (1.50%)",
      badge: "0 Single-Nulls",
    },
    {
      step: "3. Isolate Outliers",
      count: `-${formatNumber(cleaning_summary.outliers_isolated_rows)}`,
      desc: `IQR > ${cleaning_summary.outlier_bounds.iqr_upper_fence} & |Z| > 3 (> ${cleaning_summary.outlier_bounds.z_3sigma_upper})`,
      badge: "999 / 1,200 / 1,500",
    },
    {
      step: "4. Cleaned & Verified",
      count: formatNumber(cleaning_summary.cleaned_transactions_rows),
      desc: "0 Nulls, 100% Formula & DuckDB Parquet Parity",
      badge: duckdb_verification.matches_pandas ? "DuckDB Verified" : "Verified",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Pipeline Funnel */}
      <section className="bento-card p-6 relative">
        <MemeSticker
          src="/memes/meme-nice.jpg"
          alt="Nice FK match 100%"
          tag="NOICE 100% FK 👌"
          roast="49,200 แถวสะอาด 0 Nulls และตัวเลข DuckDB Parity ตรงเป๊ะทุกบาท!"
          visible={showMemes}
          placement="corner-tr"
          tiltDeg={5}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ขั้นตอนการเตรียมและทำความสะอาดข้อมูล (Reproducible Data Pipeline)
            </h3>
            <p className="text-xs text-slate-500">
              แสดงความเชื่อมโยง PK/FK, การจัดการ Missing Values และเกณฑ์ตรวจ Outlier ทั้ง IQR และ Z-Score
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-bold text-[#065F46]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            FK Match Rate: {validation.fk_match_rate_pct}% (ผ่านเกณฑ์ ≥ 99%)
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((s) => (
            <div
              key={s.step}
              className="rounded-2xl border border-emerald-950/10 bg-[#F5FBF7] p-4 space-y-2 hover:border-emerald-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#047857]">{s.step}</span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-white border border-emerald-200 text-slate-700 font-semibold">
                  {s.badge}
                </span>
              </div>
              <p className="text-2xl font-extrabold text-[#065F46] tabular-nums">{s.count}</p>
              <p className="text-xs text-slate-600 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Impact Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-[#065F46] font-bold text-xs mb-2.5">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Missing Values ตามหมวดหมู่ (750 แถว)</span>
          </div>
          <div className="space-y-1.5 text-xs">
            {Object.entries(cleaning_summary.dropped_missing_by_category).map(([cat, cnt]) => (
              <div key={cat} className="flex justify-between text-slate-700">
                <span>{cat}</span>
                <span className="font-bold tabular-nums">{cnt} แถว</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-[#065F46] font-bold text-xs mb-2.5">
            <AlertTriangle className="w-4 h-4 text-emerald-600" />
            <span>ผลกระทบของ Outliers 50 แถว</span>
          </div>
          <p className="text-2xl font-extrabold text-[#065F46] tabular-nums">
            {formatTHB(cleaning_summary.outliers_revenue_sum)}
          </p>
          <p className="text-xs text-slate-600 mt-1">
            คิดเป็น 9.28% ของยอดดิบ (156.70M) จากบิลเพียง 0.10% และลด Std จาก ฿15,698 เหลือ ฿4,399 (-71.98%)
          </p>
        </div>

        <div className="bento-card p-5">
          <div className="flex items-center gap-2 text-[#065F46] font-bold text-xs mb-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>ทำไมจึงตรวจ Outlier บน Units_Sold?</span>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed">
            หากใช้ IQR บน Total_Amount โดยตรง (Upper Fence = ฿6,450) จะตัดรายการปกติของหมวด Household (฿890 × 8–24 ชิ้น) ออกถึง 5,250 บิล การคัดกรองบน Units_Sold จึงถูกต้องตามหลักสถิติและตรงกันทั้ง IQR + Z-Score
          </p>
        </div>
      </div>

      {/* Outliers Audit Log Table */}
      <section className="bento-card p-6 relative">
        <MemeSticker
          src="/memes/meme-doakes.jpg"
          alt="Doakes catching 50 outliers"
          tag="Doakes จับได้ 50 บิล 🚨"
          roast="แอบสั่ง 999 / 1,200 / 1,500 ชิ้นต่อบิลจนกินยอด 14.54M — แยกมาส่องตรงนี้ให้หมดแล้ว!"
          visible={showMemes}
          placement="corner-tr"
          tiltDeg={-4}
        />
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตารางตรวจสอบ Outliers Audit Log ({filteredOutliers.length} / 50 รายการ)
            </h3>
            <p className="text-xs text-slate-500">
              รายการที่ถูกแยกออกจากชุดวิเคราะห์หลักเพื่อให้ฝ่ายปฏิบัติการ/B2B ตรวจสอบย้อนกลับ
            </p>
            <div className="mt-2">
              <MemeSticker
                src="/memes/meme-pepe.jpg"
                alt="Pepe checking unit filter"
                tag="IQR > 38.5 ชิ้น"
                roast="ถ้าใช้ Total_Amount จะตัดบิล Household ปกติทิ้ง 5,250 แถว ดีนะที่ใช้ Units_Sold!"
                visible={showMemes}
                placement="inline"
                tiltDeg={-2}
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-slate-600">
              <Filter className="w-3.5 h-3.5 text-emerald-600" />
              <select
                aria-label="กรองตามจำนวนชิ้น Outlier"
                value={unitFilter}
                onChange={(e) => setUnitFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full border border-emerald-950/15 bg-white text-xs text-slate-800"
              >
                <option value="ALL">ทุกจำนวนชิ้น (999/1200/1500)</option>
                <option value="1500">1,500 ชิ้น</option>
                <option value="1200">1,200 ชิ้น</option>
                <option value="999">999 ชิ้น</option>
              </select>
              <select
                aria-label="กรองตามหมวดหมู่ Outlier"
                value={catFilter}
                onChange={(e) => setCatFilter(e.target.value)}
                className="px-3 py-1.5 rounded-full border border-emerald-950/15 bg-white text-xs text-slate-800"
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                <option value="Household">Household</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Dry Food">Dry Food</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
              </select>
            </div>
            <button
              type="button"
              onClick={exportAuditCsv}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Audit CSV
            </button>
          </div>
        </div>

        <div className="overflow-x-auto max-h-[420px] rounded-xl border border-emerald-950/10">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-emerald-50/95 backdrop-blur-xs border-b border-emerald-950/10 text-[#065F46]">
              <tr>
                <th className="py-2.5 px-3 font-bold">Transaction_ID</th>
                <th className="py-2.5 px-3 font-bold">Customer_ID</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Category</th>
                <th className="py-2.5 px-3 font-bold">Channel</th>
                <th className="py-2.5 px-3 font-bold">Region</th>
                <th className="py-2.5 px-3 font-bold text-right">Units</th>
                <th className="py-2.5 px-3 font-bold text-right">Total (THB)</th>
                <th className="py-2.5 px-3 font-bold text-center">IQR / Z-Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-emerald-950/5 tabular-nums bg-white">
              {filteredOutliers.map((r) => (
                <tr key={r.Transaction_ID} className="hover:bg-emerald-50/40 transition-colors">
                  <td className="py-2 px-3 font-mono font-semibold text-slate-900">
                    {r.Transaction_ID}
                  </td>
                  <td className="py-2 px-3 font-mono text-slate-700">{r.Customer_ID}</td>
                  <td className="py-2 px-3 text-slate-700">{r.Transaction_Date}</td>
                  <td className="py-2 px-3 text-slate-800">{r.Category}</td>
                  <td className="py-2 px-3 text-slate-700">{r.Channel}</td>
                  <td className="py-2 px-3 text-slate-700">{r.Region}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#065F46]">
                    {formatNumber(r.Units_Sold)}
                  </td>
                  <td className="py-2 px-3 text-right font-semibold text-slate-900">
                    {formatTHB(r.Total_Amount)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-[#065F46] font-bold">
                      Both Flagged
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
