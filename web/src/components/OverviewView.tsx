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

const GREEN_PALETTE = ["#065F46", "#047857", "#059669", "#10B981", "#34D399"];

interface OverviewViewProps {
  metrics: ComputedDashboardMetrics;
  monthlyRawComparison: MonthlyPoint[];
  filters: DashboardFilters;
  onSelectFilter: (key: keyof DashboardFilters, value: string) => void;
  onDrillToExplorer: () => void;
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
  const chartMonthlyData = showRawCompare && !hasActiveFilter
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

  const kpis = [
    {
      label: "ยอดขายสุทธิ (Clean Revenue)",
      value: formatTHB(metrics.totalRevenue, true),
      sub: `${formatTHB(metrics.totalRevenue)} บาท`,
      icon: Banknote,
    },
    {
      label: "จำนวนบิลที่สะอาด (Clean Orders)",
      value: formatNumber(metrics.totalTxns),
      sub: `รวม ${formatNumber(metrics.totalUnits)} ชิ้น`,
      icon: Receipt,
    },
    {
      label: "ยอดใช้จ่ายเฉลี่ยต่อบิล (AOV)",
      value: formatTHB(Math.round(metrics.avgOrderValue)),
      sub: `เฉลี่ย ${metrics.totalTxns > 0 ? (metrics.totalUnits / metrics.totalTxns).toFixed(2) : "0"} ชิ้น/บิล`,
      icon: ShoppingBag,
    },
    {
      label: "จำนวนลูกค้าที่ซื้อ (Active Customers)",
      value: formatNumber(metrics.uniqueCustomers),
      sub: `เฉลี่ย ${metrics.uniqueCustomers > 0 ? (metrics.totalTxns / metrics.uniqueCustomers).toFixed(1) : "0"} บิล/คน`,
      icon: Users,
    },
  ];

  const topCat = metrics.categories[0];
  const topRegion = metrics.regions[0];
  const onlineShare =
    metrics.channels.find((c) => c.name === "Online")?.sharePct ?? 0;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="bg-white border border-[#DCE7E0] rounded-xl p-5 shadow-xs flex items-start justify-between"
            >
              <div>
                <p className="text-xs font-medium text-slate-500">{kpi.label}</p>
                <p className="text-2xl font-bold text-[#065F46] mt-1.5 tabular-nums">
                  {kpi.value}
                </p>
                <p className="text-xs text-slate-600 mt-1 tabular-nums">{kpi.sub}</p>
              </div>
              <div className="p-2.5 rounded-lg bg-[#ECFDF5] text-[#047857]">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Monthly Revenue Time Series */}
        <section className="lg:col-span-7 bg-white border border-[#DCE7E0] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                แนวโน้มยอดขายรายเดือน ปี 2025 (Time Series)
              </h3>
              <p className="text-xs text-slate-500">
                คลิกเปรียบเทียบข้อมูลก่อน/หลังตัด Outlier 50 แถว (หน่วย: บาท)
              </p>
            </div>
            {!hasActiveFilter && (
              <button
                type="button"
                onClick={() => setShowRawCompare((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  showRawCompare
                    ? "bg-[#047857] text-white border-[#047857]"
                    : "bg-[#F7FAF8] text-[#065F46] border-[#DCE7E0] hover:bg-[#ECFDF5]"
                }`}
              >
                {showRawCompare ? "กำลังเทียบเส้น Raw (มี Outlier)" : "เทียบเส้น Raw (ก่อน Clean)"}
              </button>
            )}
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartMonthlyData} margin={{ top: 10, right: 16, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="cleanFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#475569" }} />
                <YAxis
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(1)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip
                  formatter={(value, name) => [
                    formatTHB(Number(value ?? 0)),
                    name === "rawRevenue" ? "ยอดดิบ (รวม Outlier)" : "ยอดสะอาด (Clean)",
                  ]}
                  contentStyle={{
                    borderRadius: "10px",
                    borderColor: "#DCE7E0",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cleanRevenue"
                  name="ยอดสะอาด (Clean)"
                  stroke="#047857"
                  strokeWidth={2.5}
                  fill="url(#cleanFill)"
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

        {/* Category Revenue Pareto */}
        <section className="lg:col-span-5 bg-white border border-[#DCE7E0] rounded-xl p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                สัดส่วนรายได้ตามหมวดหมู่สินค้า (คลิกเพื่อ Filter)
              </h3>
              <p className="text-xs text-slate-500">
                เรียงตามมูลค่ายอดขายจากมากไปน้อย
              </p>
            </div>
            <button
              type="button"
              onClick={onDrillToExplorer}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] hover:underline"
            >
              <span>ดูรายการบิล</span>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={95}
                  tick={{ fontSize: 12, fill: "#0F172A", fontWeight: 500 }}
                />
                <Tooltip
                  formatter={(value) => [formatTHB(Number(value ?? 0)), "ยอดขาย"]}
                  contentStyle={{
                    borderRadius: "10px",
                    borderColor: "#DCE7E0",
                    fontSize: "12px",
                  }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[0, 6, 6, 0]}
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
                          : GREEN_PALETTE[idx % GREEN_PALETTE.length]
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

      {/* Bottom Row: Region + Channel & Payment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-6 bg-white border border-[#DCE7E0] rounded-xl p-5">
          <h3 className="text-base font-bold text-slate-900">
            ประสิทธิภาพยอดขายแยกตามภูมิภาค (คลิกเพื่อ Filter)
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            เปรียบเทียบยอดขายสะอาดข้าม 5 ภูมิภาคหลักของ SmartRetail Thailand
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.regions} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#0F172A" }} />
                <YAxis
                  tickFormatter={(v) => `${(Number(v) / 1_000_000).toFixed(0)}M`}
                  tick={{ fontSize: 12, fill: "#475569" }}
                />
                <Tooltip
                  formatter={(value) => [formatTHB(Number(value ?? 0)), "ยอดขาย"]}
                  contentStyle={{ borderRadius: "10px", borderColor: "#DCE7E0", fontSize: "12px" }}
                />
                <Bar
                  dataKey="revenue"
                  radius={[6, 6, 0, 0]}
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
                          : GREEN_PALETTE[idx % GREEN_PALETTE.length]
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

        <section className="lg:col-span-6 bg-white border border-[#DCE7E0] rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ช่องทางการขายและวิธีการชำระเงิน (Channel &amp; Payment Mix)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คลิกที่แท่งหรือรายการเพื่อ Filter ข้อมูลทั้งหน้า Dashboard
            </p>

            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-[#065F46] mb-2">
                  ช่องทางจำหน่าย (Channel)
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
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        filters.channel === ch.name
                          ? "bg-[#ECFDF5] border-[#047857]"
                          : "bg-[#F7FAF8] border-[#DCE7E0] hover:bg-[#ECFDF5]/60"
                      }`}
                    >
                      <div className="flex justify-between text-xs font-semibold text-slate-800 mb-1.5">
                        <span>{ch.name}</span>
                        <span className="tabular-nums">
                          {formatTHB(ch.revenue)} ({ch.sharePct}%) · {formatNumber(ch.txns)} บิล
                        </span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#047857]"
                          style={{ width: `${ch.sharePct}%` }}
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#065F46] mb-2">
                  วิธีการชำระเงิน (Payment Method)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
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
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        filters.payment === pm.name
                          ? "bg-[#ECFDF5] border-[#047857]"
                          : "bg-white border-[#DCE7E0] hover:bg-[#F7FAF8]"
                      }`}
                    >
                      <p className="text-xs font-semibold text-slate-800">{pm.name}</p>
                      <p className="text-sm font-bold text-[#065F46] mt-0.5 tabular-nums">
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
