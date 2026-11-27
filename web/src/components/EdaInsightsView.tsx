"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Target, UserCheck, Clock } from "lucide-react";
import { formatNumber, formatTHB } from "@/lib/analytics";
import type { SummaryPayload } from "@/types/dashboard";
import { InsightCard } from "./InsightCard";

interface EdaInsightsViewProps {
  summary: SummaryPayload;
}

export function EdaInsightsView({ summary }: EdaInsightsViewProps) {
  const {
    before_cleaning_total_amount,
    after_cleaning_total_amount,
    before_cleaning_units_sold,
    after_cleaning_units_sold,
  } = summary.cleaningReport.cleaning_summary;

  const statsRows = [
    { label: "Total_Amount (Raw)", data: before_cleaning_total_amount, isMoney: true },
    { label: "Total_Amount (Cleaned)", data: after_cleaning_total_amount, isMoney: true },
    { label: "Units_Sold (Raw)", data: before_cleaning_units_sold, isMoney: false },
    { label: "Units_Sold (Cleaned)", data: after_cleaning_units_sold, isMoney: false },
  ];

  const getCellBg = (val: number) => {
    const abs = Math.abs(val);
    if (val === 1) return "bg-[#065F46] text-white";
    if (abs >= 0.7) return "bg-[#047857] text-white";
    if (abs >= 0.3) return "bg-[#A7F3D0] text-[#064E3B]";
    return "bg-[#F7FAF8] text-slate-700";
  };

  return (
    <div className="space-y-6">
      {/* Descriptive Statistics Table */}
      <section className="bg-white border border-[#DCE7E0] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            สถิติเชิงพรรณนา (Descriptive Statistics: Mean / Median / Std / IQR)
          </h3>
          <p className="text-xs text-slate-500">
            เปรียบเทียบผลลัพธ์ก่อนและหลังแยก Outliers 50 แถวออกจากชุดข้อมูลหลัก
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[#DCE7E0] bg-[#F7FAF8] text-[#065F46]">
                <th className="py-2.5 px-3 font-semibold">ตัวแปร / สถานะ</th>
                <th className="py-2.5 px-3 font-semibold text-right">n</th>
                <th className="py-2.5 px-3 font-semibold text-right">Mean</th>
                <th className="py-2.5 px-3 font-semibold text-right">Std. Dev.</th>
                <th className="py-2.5 px-3 font-semibold text-right">Min</th>
                <th className="py-2.5 px-3 font-semibold text-right">Q1</th>
                <th className="py-2.5 px-3 font-semibold text-right">Median</th>
                <th className="py-2.5 px-3 font-semibold text-right">Q3</th>
                <th className="py-2.5 px-3 font-semibold text-right">IQR</th>
                <th className="py-2.5 px-3 font-semibold text-right">Max</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFF5F1] tabular-nums">
              {statsRows.map((row) => (
                <tr key={row.label} className="hover:bg-[#F7FAF8]">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{row.label}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.n)}</td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isMoney ? formatTHB(row.data.mean) : row.data.mean.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {row.isMoney ? formatTHB(row.data.std) : row.data.std.toFixed(2)}
                  </td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.min)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.q1)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.median)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.q3)}</td>
                  <td className="py-2.5 px-3 text-right">{formatNumber(row.data.iqr)}</td>
                  <td className="py-2.5 px-3 text-right font-semibold text-[#047857]">
                    {formatNumber(row.data.max)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Distribution + Correlation Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-[#DCE7E0] rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900">
            การกระจายตัวของจำนวนชิ้นต่อบิล (Units_Sold: 1–24 ชิ้น)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            หลังตัด Outlier (999/1,200/1,500) ข้อมูลมีการกระจายตัวสม่ำเสมอ
          </p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summary.unitsHistogram}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="units" tick={{ fontSize: 11, fill: "#475569" }} />
                <YAxis tick={{ fontSize: 11, fill: "#475569" }} />
                <Tooltip
                  formatter={(value) => [formatNumber(Number(value ?? 0)), "จำนวนบิล"]}
                  labelFormatter={(label) => `จำนวน ${label} ชิ้น/บิล`}
                />
                <Bar dataKey="count" fill="#059669" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <InsightCard
            what="ปริมาณการซื้อต่อบิลกระจายตัวสม่ำเสมอในช่วง 1–24 ชิ้น (Mean = 12.50, Median = 13.00, Std = 6.93)"
            soWhat="พฤติกรรมการหยิบสินค้าต่อครั้งของลูกค้ามีความสม่ำเสมอมาก ไม่มีหางยาวผิดปกติหลังจากคลีนแล้ว"
            nowWhat="การเพิ่มรายได้ต่อบิลทำได้ง่ายกว่าผ่านการขยับมูลค่าสินค้า (Upsell/Bundle) มากกว่าการบังคับเพิ่มจำนวนชิ้น"
          />
        </section>

        <section className="lg:col-span-6 bg-white border border-[#DCE7E0] rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900">
            เมทริกซ์ความสัมพันธ์ของตัวแปร (Pearson Correlation Heatmap)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            วัดความสัมพันธ์เชิงเส้นระหว่างตัวแปรเชิงตัวเลขทั้ง 5 ตัว (n = 49,200)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-center border-collapse text-xs">
              <thead>
                <tr>
                  <th className="p-2 text-left text-slate-500 font-medium">ตัวแปร</th>
                  {summary.correlationMatrix.labels.map((lbl) => (
                    <th key={lbl} className="p-2 text-slate-700 font-semibold">
                      {lbl}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {summary.correlationMatrix.labels.map((rowLbl, rIdx) => (
                  <tr key={rowLbl}>
                    <td className="p-2 text-left font-semibold text-slate-800 whitespace-nowrap">
                      {rowLbl}
                    </td>
                    {summary.correlationMatrix.matrix[rIdx].map((val, cIdx) => (
                      <td key={`${rIdx}-${cIdx}`} className="p-1">
                        <div
                          className={`rounded-md py-2 px-1.5 font-mono font-semibold tabular-nums ${getCellBg(val)}`}
                        >
                          {val.toFixed(2)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <InsightCard
            what="Price_Per_Unit สัมพันธ์กับ Total_Amount สูงมาก (+0.8123) ขณะที่ Price vs Units (-0.0065) และ Age vs Total_Amount (-0.0037) แทบไม่มีความสัมพันธ์"
            soWhat="ยอดใช้จ่ายต่อบิลถูกกำหนดโดยหมวดหมู่/ราคาสินค้าที่เลือก มากกว่าจำนวนชิ้นหรืออายุของลูกค้า"
            nowWhat="มุ่งเป้ากลยุทธ์แนะนำสินค้ากลุ่มราคาสูง (Household / Personal Care) ให้ลูกค้าทุกช่วงวัย"
          />
        </section>
      </div>

      {/* Membership Tier Performance */}
      <section className="bg-white border border-[#DCE7E0] rounded-xl p-5">
        <h3 className="text-base font-bold text-slate-900 mb-3">
          เปรียบเทียบประสิทธิภาพตามระดับสมาชิก (Membership Tier Analysis)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {summary.tierStats.map((t) => (
            <div
              key={t.tier}
              className="rounded-xl border border-[#DCE7E0] bg-[#F7FAF8] p-4 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[#065F46]">{t.tier}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#D1FAE5] text-[#065F46] font-semibold">
                  {t.customers} ลูกค้า
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {formatTHB(t.revenue, true)}
              </p>
              <p className="text-xs text-slate-600 tabular-nums">
                เฉลี่ย/คน: <strong>{formatTHB(t.avgRevenuePerCustomer)}</strong> · {t.avgTxnsPerCustomer} บิล/คน
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5 Strategic Insights Cards */}
      <section className="bg-white border border-[#DCE7E0] rounded-xl p-5">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900">
            5 Business Insights &amp; Action Plan สำหรับผู้บริหาร (พร้อม Owner และ Timeline)
          </h3>
          <p className="text-xs text-slate-500">
            สรุปหลักฐานเชิงตัวเลขเพื่อใช้ต่อยอดในสไลด์นำเสนอและตัดสินใจเชิงกลยุทธ์
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.insights.map((item, idx) => (
            <article
              key={item.id}
              className="rounded-xl border border-[#DCE7E0] bg-[#F7FAF8] p-4 flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-[#065F46]">
                    {idx + 1}. {item.title}
                  </h4>
                  <span className="shrink-0 px-2.5 py-0.5 rounded-full bg-[#047857] text-white text-[11px] font-semibold">
                    {item.metric}
                  </span>
                </div>
                <p className="text-xs text-slate-700">
                  <strong>What:</strong> {item.what}
                </p>
                <p className="text-xs text-slate-700">
                  <strong>So What:</strong> {item.soWhat}
                </p>
                <p className="text-xs text-slate-900 bg-white border border-[#DCE7E0] rounded-lg p-2.5">
                  <strong className="text-[#047857]">Now What:</strong> {item.nowWhat}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#DCE7E0] text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-[#059669]" />
                  {item.owner}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#059669]" />
                  {item.timeline}
                </span>
                <span className="inline-flex items-center gap-1 text-[#047857] font-medium">
                  <Target className="w-3.5 h-3.5" />
                  Verified
                </span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
