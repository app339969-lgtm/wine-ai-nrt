"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowUpRight, Banknote, ShoppingBag, Users, Receipt } from "lucide-react";
import {
  formatNumber,
  formatTHB,
  type ComputedDashboardMetrics,
} from "@/lib/analytics";
import type { DashboardFilters, MonthlyPoint } from "@/types/dashboard";
import { InsightCard } from "./InsightCard";

const MODERN_GREENS = ["#047857", "#059669", "#10B981", "#14B8A6", "#34D399"];

interface OverviewViewProps {
  metrics: ComputedDashboardMetrics;
  monthlyRawComparison: MonthlyPoint[];
  filters: DashboardFilters;
  onSelectFilter: (key: keyof DashboardFilters, value: string) => void;
  onDrillToExplorer: () => void;
}

function MiniSparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 76 + 2;
      const y = 24 - ((v - min) / span) * 20;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="80" height="28" viewBox="0 0 80 28" className="overflow-visible" aria-hidden="true">
      <polyline
        fill="none"
        stroke="#10B981"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={pts}
      />
    </svg>
  );
}

export function OverviewView({
  metrics,
  monthlyRawComparison,
  filters,
  onSelectFilter,
  onDrillToExplorer,
}: OverviewViewProps) {
  const [showRawCompare, setShowRawCompare] = useState(false);

  const hasActiveFilter = Object.values(filters).some((v) => v !== "ALL");
  const chartMonthlyData =
    showRawCompare && !hasActiveFilter
      ? monthlyRawComparison.map((m) => ({
          name: m.month,
          cleanRevenue: m.cleanRevenue,
          rawRevenue: m.rawRevenue,
        }))
      : metrics.monthly.map((m) => ({
          name: m.name,
          cleanRevenue: m.revenue,
          rawRevenue: m.revenue,
        }));

  const revSpark = metrics.monthly.map((m) => m.revenue);
  const txnSpark = metrics.monthly.map((m) => m.txns);
  const aovSpark = metrics.monthly.map((m) => (m.txns > 0 ? m.revenue / m.txns : 0));
  const unitSpark = metrics.monthly.map((m) => m.units);

  const kpis = [
    {
      label: "Clean Revenue",
      thLabel: "ยอดขายสุทธิ",
      value: formatTHB(metrics.totalRevenue, true),
      sub: `${formatTHB(metrics.totalRevenue)} บาท`,
      icon: Banknote,
      spark: revSpark,
    },
    {
      label: "Clean Orders",
      thLabel: "จำนวนบิลสะอาด",
      value: formatNumber(metrics.totalTxns),
      sub: `รวม ${formatNumber(metrics.totalUnits)} ชิ้น`,
      icon: Receipt,
      spark: txnSpark,
    },
    {
      label: "Avg Order Value",
      thLabel: "มูลค่าเฉลี่ยต่อบิล",
      value: formatTHB(Math.round(metrics.avgOrderValue)),
      sub: `เฉลี่ย ${metrics.totalTxns > 0 ? (metrics.totalUnits / metrics.totalTxns).toFixed(2) : "0"} ชิ้น/บิล`,
      icon: ShoppingBag,
      spark: aovSpark,
    },
    {
      label: "Active Customers",
      thLabel: "ลูกค้าที่ซื้อจริง",
      value: formatNumber(metrics.uniqueCustomers),
      sub: `เฉลี่ย ${metrics.uniqueCustomers > 0 ? (metrics.totalTxns / metrics.uniqueCustomers).toFixed(1) : "0"} บิล/คน`,
      icon: Users,
      spark: unitSpark,
    },
  ];

  const topCat = metrics.categories[0];
  const topRegion = metrics.regions[0];
  const onlineShare =
    metrics.channels.find((c) => c.name === "Online")?.sharePct ?? 0;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Bento KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bento-card-interactive p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                    {kpi.label}
                  </span>
                  <p className="text-xs font-medium text-slate-500">{kpi.thLabel}</p>
                </div>
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-sm">
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    {kpi.value}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{kpi.sub}</p>
                </div>
                <MiniSparkline values={kpi.spark} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Bento Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bento-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แนวโน้มยอดขายรายเดือน ปี 2025
              </h3>
              <p className="text-xs text-slate-500">
                เปรียบเทียบเส้น Clean กับ Raw เพื่อเปิดโปงผลกระทบของ Outlier 50 บิล
              </p>
            </div>
            {!hasActiveFilter && (
              <button
                type="button"
                onClick={() => setShowRawCompare((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                  showRawCompare
                    ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-transparent shadow-sm"
                    : "bg-emerald-50/70 text-[#065F46] border-emerald-200 hover:bg-emerald-100/70"
                }`}
              >
                {showRawCompare ? "กำลังเทียบเส้น Raw" : "เทียบเส้น Raw (ก่อน Clean)"}
              </button>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="modernCleanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EFE7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatTHB(Number(value ?? 0)),
                    name === "rawRevenue" ? "ยอดดิบ (รวม Outlier)" : "ยอดสะอาด (Clean)",
                  ]}
                  contentStyle={{
                    borderRadius: "14px",
                    borderColor: "#A7F3D0",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    boxShadow: "0 10px 25px -10px rgba(5,150,105,0.25)",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cleanRevenue"
                  name="ยอดสะอาด (Clean)"
                  stroke="#059669"
                  strokeWidth={3}
                  fill="url(#modernCleanFill)"
                />
                {showRawCompare && !hasActiveFilter && (
                  <Area
                    type="monotone"
                    dataKey="rawRevenue"
                    name="ยอดดิบ (รวม Outlier)"
                    stroke="#94A3B8"
                    strokeDasharray="5 5"
                    strokeWidth={2}
                    fill="none"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <InsightCard
            what="ยอดขายสะอาดแกว่งตัวในกรอบแคบ 10.97M–12.53M บาท/เดือน ตลอดปี 2025 โดย Q4 ใกล้เคียง Q1 (+0.41%) ขณะที่ข้อมูลดิบพุ่งหลอกในเดือน มิ.ย. (14.93M) และ ส.ค. (15.52M) จาก Outlier"
            soWhat="ธุรกิจกำลังเผชิญภาวะยอดขายชะลอตัวจริงตามโจทย์ และหากไม่คลีน Outlier 50 บิลออก จะประเมินผลงานกลางปีคลาดเคลื่อน"
            nowWhat="ใช้ยอดสะอาดเป็นฐาน KPI หลัก และจัดแคมเปญกระตุ้นยอดขายช่วง Low Season (ก.พ., พ.ค., พ.ย.)"
          />
        </section>

        {/* Category Bento */}
        <section className="lg:col-span-5 bento-card p-6">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                สัดส่วนรายได้ตามหมวดหมู่
              </h3>
              <p className="text-xs text-slate-500">
                คลิกที่แท่งกราฟเพื่อ Filter ข้อมูลทั้งหน้า
              </p>
            </div>
            <button
              type="button"
              onClick={onDrillToExplorer}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-[#047857] transition-colors"
            >
              <span>เจาะลึกบิล</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics.categories}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EFE7" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={95}
                  tick={{ fontSize: 12, fill: "#0F172A", fontWeight: 600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatTHB(Number(value ?? 0)), "ยอดขาย"]}
                  contentStyle={{
                    borderRadius: "14px",
                    borderColor: "#A7F3D0",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 10, 10, 0]}
                  cursor="pointer"
                  onClick={(entry) => {
                    if (entry?.name) {
                      onSelectFilter(
                        "category",
                        filters.category === entry.name ? "ALL" : String(entry.name),
                      );
                    }
                  }}
                >
                  {metrics.categories.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={
                        filters.category === entry.name
                          ? "#064E3B"
                          : MODERN_GREENS[idx % MODERN_GREENS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <InsightCard
            what={
              topCat
                ? `หมวดอันดับ 1 คือ ${topCat.name} ทำยอด ${formatTHB(topCat.revenue, true)} (${topCat.sharePct}% ของยอดขายชุดที่กรองอยู่)`
                : "ไม่มีข้อมูลหมวดหมู่ตามเงื่อนไขที่เลือก"
            }
            soWhat="Dry Food และ Beverages มีจำนวนบิลสูงแต่ราคาต่อหน่วยต่ำ จึงต้องพึ่ง Household & Personal Care เป็นตัวสร้างรายได้หลัก"
            nowWhat="จัดชุด Bundle จับคู่สินค้าอุปโภคบริโภคยอดนิยมกับ Household เพื่อดันยอดต่อบิลให้สูงขึ้น"
          />
        </section>
      </div>

      {/* Bottom Bento Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bento-card p-6">
          <h3 className="text-base font-bold text-slate-900">
            ยอดขายแยกตามภูมิภาค (คลิกเพื่อ Filter)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            เปรียบเทียบยอดขายสะอาดข้าม 5 ภูมิภาคหลักของ SmartRetail Thailand
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.regions} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2EFE7" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#0F172A" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [formatTHB(Number(value ?? 0)), "ยอดขาย"]}
                  contentStyle={{
                    borderRadius: "14px",
                    borderColor: "#A7F3D0",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[10, 10, 4, 4]}
                  cursor="pointer"
                  onClick={(entry) => {
                    if (entry?.name) {
                      onSelectFilter(
                        "region",
                        filters.region === entry.name ? "ALL" : String(entry.name),
                      );
                    }
                  }}
                >
                  {metrics.regions.map((entry, idx) => (
                    <Cell
                      key={entry.name}
                      fill={
                        filters.region === entry.name
                          ? "#064E3B"
                          : MODERN_GREENS[idx % MODERN_GREENS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <InsightCard
            what={
              topRegion
                ? `ภูมิภาคอันดับ 1 คือ ${topRegion.name} (${topRegion.sharePct}%) ขณะที่ตลาดรองอย่าง West มีสัดส่วนต่ำกว่าอย่างชัดเจน`
                : "ไม่มีข้อมูลภูมิภาคตามเงื่อนไขที่เลือก"
            }
            soWhat="ยอดขายกระจุกตัวในภาคกลางสูง ทำให้ความเสี่ยงด้านการเติบโตในต่างจังหวัดยังไม่ได้รับการปลดล็อก"
            nowWhat="ออกแคมเปญส่วนลดค่าส่งและโปรโมชันเฉพาะภูมิภาคสำหรับ West และ South"
          />
        </section>

        <section className="lg:col-span-6 bento-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ช่องทางการขายและวิธีชำระเงิน
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คลิกที่การ์ดเพื่อ Filter ข้อมูลทั้งหน้า Dashboard ได้ทันที
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-[#047857] mb-2">
                  Channel Mix
                </p>
                <div className="space-y-2.5">
                  {metrics.channels.map((ch) => (
                    <button
                      key={ch.name}
                      type="button"
                      onClick={() =>
                        onSelectFilter(
                          "channel",
                          filters.channel === ch.name ? "ALL" : ch.name,
                        )
                      }
                      className={`w-full text-left p-3.5 rounded-2xl border transition-all ${
                        filters.channel === ch.name
                          ? "bg-emerald-50 border-emerald-500 shadow-xs"
                          : "bg-[#F5FBF7] border-emerald-950/10 hover:border-emerald-400"
                      }`}
                    >
                      <div className="flex justify-between text-xs font-semibold text-slate-800 mb-2">
                        <span>{ch.name}</span>
                        <span className="tabular-nums">
                          {formatTHB(ch.revenue)} ({ch.sharePct}%) · {formatNumber(ch.txns)} บิล
                        </span>
                      </div>
                      <div className="w-full h-2.5 rounded-full bg-emerald-950/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-teal-500"
                          style={{ width: `${ch.sharePct}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-[#047857] mb-2">
                  Payment Mix
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {metrics.payments.map((pm) => (
                    <button
                      key={pm.name}
                      type="button"
                      onClick={() =>
                        onSelectFilter(
                          "payment",
                          filters.payment === pm.name ? "ALL" : pm.name,
                        )
                      }
                      className={`text-left p-3.5 rounded-2xl border transition-all ${
                        filters.payment === pm.name
                          ? "bg-emerald-50 border-emerald-500 shadow-xs"
                          : "bg-white border-emerald-950/10 hover:border-emerald-400"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-700">{pm.name}</p>
                      <p className="text-lg font-extrabold text-[#065F46] mt-0.5 tabular-nums">
                        {pm.sharePct}%
                      </p>
                      <p className="text-[11px] text-slate-500 tabular-nums">
                        {formatTHB(pm.revenue, true)}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <InsightCard
            what={`Online ครองสัดส่วน ${onlineShare}% และการชำระเงินดิจิทัล (Credit Card + PromptPay) มีสัดส่วนรวมกันเกิน 70%`}
            soWhat="ลูกค้ามีความคุ้นเคยกับดิจิทัลสูง แต่ยอดขายหน้าร้าน In-Store ยังเติบโตช้ากว่า"
            nowWhat="เชื่อมต่อ O2O ด้วยแคมเปญ Click & Collect และคืนเงิน PromptPay เมื่อซื้อที่หน้าร้าน"
          />
        </section>
      </div>
    </div>
  );
}
