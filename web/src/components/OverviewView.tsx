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
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowUpRight,
  Banknote,
  Crown,
  Presentation,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Users,
} from "lucide-react";
import {
  formatNumber,
  formatTHB,
  type ComputedDashboardMetrics,
} from "@/lib/analytics";
import type { DashboardFilters, MonthlyPoint } from "@/types/dashboard";
import { AnimatedNumber } from "./AnimatedNumber";
import { InsightCard } from "./InsightCard";
import { MemeWidget } from "./MemeWidget";
import { MemeSticker } from "./MemeSticker";

const EMERALD_PALETTE = ["#047857", "#059669", "#10B981", "#14B8A6", "#34D399"];
const RAINBOW_PALETTE = ["#F43F5E", "#F59E0B", "#10B981", "#06B6D4", "#6366F1", "#EC4899"];

interface OverviewViewProps {
  metrics: ComputedDashboardMetrics;
  monthlyRawComparison: MonthlyPoint[];
  filters: DashboardFilters;
  presentationMode: boolean;
  isRainbow: boolean;
  showMemes: boolean;
  onTogglePresentation: () => void;
  onSelectFilter: (key: keyof DashboardFilters, value: string) => void;
  onDrillToExplorer: () => void;
  onSelectCustomer: (cid: string) => void;
}

function MiniSparkline({ values, stroke }: { values: number[]; stroke: string }) {
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
        stroke={stroke}
        strokeWidth="2.4"
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
  presentationMode,
  isRainbow,
  showMemes,
  onTogglePresentation,
  onSelectFilter,
  onDrillToExplorer,
  onSelectCustomer,
}: OverviewViewProps) {
  const [showRawCompare, setShowRawCompare] = useState(false);

  const palette = isRainbow ? RAINBOW_PALETTE : EMERALD_PALETTE;
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
      rawVal: metrics.totalRevenue,
      format: (v: number) => formatTHB(v, true),
      sub: `${formatTHB(metrics.totalRevenue)} บาท`,
      icon: Banknote,
      spark: revSpark,
      color: isRainbow ? "#F43F5E" : "#10B981",
    },
    {
      label: "Clean Orders",
      thLabel: "จำนวนบิลสะอาด",
      rawVal: metrics.totalTxns,
      format: (v: number) => formatNumber(Math.round(v)),
      sub: `รวม ${formatNumber(metrics.totalUnits)} ชิ้น`,
      icon: Receipt,
      spark: txnSpark,
      color: isRainbow ? "#F59E0B" : "#10B981",
    },
    {
      label: "Avg Order Value",
      thLabel: "มูลค่าเฉลี่ยต่อบิล",
      rawVal: metrics.avgOrderValue,
      format: (v: number) => formatTHB(v, false, 2),
      sub: `เฉลี่ย ${metrics.totalTxns > 0 ? (metrics.totalUnits / metrics.totalTxns).toFixed(2) : "0"} ชิ้น/บิล`,
      icon: ShoppingBag,
      spark: aovSpark,
      color: isRainbow ? "#06B6D4" : "#10B981",
    },
    {
      label: "Active Customers",
      thLabel: "ลูกค้าที่ซื้อจริง",
      rawVal: metrics.uniqueCustomers,
      format: (v: number) => formatNumber(Math.round(v)),
      sub: `เฉลี่ย ${metrics.uniqueCustomers > 0 ? (metrics.totalTxns / metrics.uniqueCustomers).toFixed(1) : "0"} บิล/คน`,
      icon: Users,
      spark: unitSpark,
      color: isRainbow ? "#8B5CF6" : "#10B981",
    },
  ];

  const topCat = metrics.categories[0];
  const topRegion = metrics.regions[0];
  const onlineShare =
    metrics.channels.find((c) => c.name === "Online")?.sharePct ?? 0;
  const digitalPayShare = Number(
    (
      (metrics.payments.find((p) => p.name === "Credit Card")?.sharePct ?? 0) +
      (metrics.payments.find((p) => p.name === "PromptPay")?.sharePct ?? 0)
    ).toFixed(2),
  );
  const monthlyRevs = metrics.monthly.map((m) => m.revenue);
  const minMonthlyRev = monthlyRevs.length > 0 ? Math.min(...monthlyRevs) : 0;
  const maxMonthlyRev = monthlyRevs.length > 0 ? Math.max(...monthlyRevs) : 0;
  const timeInsightWhat = hasActiveFilter
    ? `ตามเงื่อนไขที่กรองอยู่ ยอดขายรายเดือนแกว่งในช่วง ${formatTHB(minMonthlyRev, true)} – ${formatTHB(maxMonthlyRev, true)} (รวม ${formatNumber(metrics.totalTxns)} บิล)`
    : "ยอดขายสะอาดแกว่งตัวในกรอบแคบ 10.97M–12.53M บาท/เดือน ตลอดปี 2025 โดย Q4 ใกล้เคียง Q1 (+0.41%) ขณะที่ข้อมูลดิบพุ่งหลอกในเดือน มิ.ย. (14.93M) และ ส.ค. (15.52M) จาก Outlier";

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Grand Executive Hero Command Banner */}
      <div className="relative">
        <MemeSticker
          src="/memes/meme-selfie.jpg"
          alt="Monkey taking selfie with KPIs"
          tag="ขอเซลฟี่ 142.16M 🤳"
          roast="ยอดขายสะอาด 49,200 บิลครบเป๊ะทุกบาท ถ่ายรูปอวดกรรมการสักหน่อย!"
          visible={showMemes}
          placement="corner-tr"
          tiltDeg={6}
        />
        <section
          className={`rounded-3xl text-white p-6 sm:p-8 shadow-xl relative overflow-hidden ${
            isRainbow
              ? "rainbow-hero"
              : "bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600"
          }`}
        >
        <div className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-white/15 blur-3xl" />
        <div className="pointer-events-none absolute left-1/3 -bottom-20 w-64 h-64 rounded-full bg-white/15 blur-3xl" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/25 text-xs font-semibold text-white">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {isRainbow
                  ? "🌈 SmartRetail Thailand · Rainbow Command Center"
                  : "SmartRetail Thailand · Executive Command Center"}
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums">
                <AnimatedNumber value={metrics.totalRevenue} formatter={(v) => formatTHB(v, true)} />
              </h2>
              <span className="text-sm text-white/90 font-medium tabular-nums">
                ({formatTHB(metrics.totalRevenue)} บาท · {formatNumber(metrics.totalTxns)} บิลสะอาด)
              </span>
            </div>
            <p className="text-xs sm:text-sm text-white/90 max-w-2xl leading-relaxed">
              สรุปภาพรวมประสิทธิภาพยอดขายค้าปลีกออนไลน์และหน้าร้านปี 2025 พร้อมตัวกรองอัจฉริยะ 7 มิติ การเจาะลึก Customer 360° และการส่งออกข้อมูลทันที
            </p>
            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onDrillToExplorer}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-900 hover:bg-slate-50 text-xs font-bold shadow-sm transition-all"
              >
                <span>เจาะลึกรายการบิล</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onTogglePresentation}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white/20 hover:bg-white/30 border border-white/30 text-white text-xs font-bold backdrop-blur-md transition-all"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>{presentationMode ? "ออกจากโหมดนำเสนอ" : "โหมดนำเสนอกรรมการ"}</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
            <div className="sm:col-span-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-4 flex flex-col items-center text-center">
              <div className="relative w-20 h-20 flex items-center justify-center">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="32" stroke="rgba(255,255,255,0.25)" strokeWidth="7" fill="none" />
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
                    stroke="#FFFFFF"
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray="201"
                    strokeDashoffset="0"
                    fill="none"
                  />
                </svg>
                <span className="absolute text-sm font-extrabold tabular-nums">100%</span>
              </div>
              <p className="text-[11px] font-bold text-white mt-1 inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                FK Integrity
              </p>
              <p className="text-[10px] text-white/85">0 Nulls · 50 Audited</p>
            </div>

            <div className="sm:col-span-3 grid grid-cols-2 gap-2">
              {metrics.quarters.map((q, idx) => {
                const prev = idx > 0 ? metrics.quarters[idx - 1].revenue : null;
                const qoq = prev && prev > 0 ? ((q.revenue - prev) / prev) * 100 : null;
                return (
                  <button
                    key={q.name}
                    type="button"
                    onClick={() =>
                      onSelectFilter("quarter", filters.quarter === q.name ? "ALL" : q.name)
                    }
                    className={`text-left rounded-xl p-2.5 border transition-all ${
                      filters.quarter === q.name
                        ? "bg-white text-slate-900 border-white shadow-sm"
                        : "bg-white/15 hover:bg-white/25 text-white border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-bold opacity-90">
                      <span>{q.name}</span>
                      {qoq !== null && (
                        <span>{`${qoq >= 0 ? "+" : ""}${qoq.toFixed(1)}%`}</span>
                      )}
                    </div>
                    <p className="text-sm font-extrabold mt-0.5 tabular-nums">
                      {formatTHB(q.revenue, true)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* Bento KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div key={kpi.label} className="bento-card-interactive p-5 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: kpi.color }}
                  >
                    {kpi.label}
                  </span>
                  <p className="text-xs font-medium text-slate-500">{kpi.thLabel}</p>
                </div>
                <div
                  className={`p-2.5 rounded-xl text-white shadow-sm ${
                    isRainbow ? "rainbow-btn" : "bg-gradient-to-br from-emerald-500 to-teal-500"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="text-2xl font-extrabold text-slate-900 tabular-nums tracking-tight">
                    <AnimatedNumber value={kpi.rawVal} formatter={kpi.format} />
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5 tabular-nums">{kpi.sub}</p>
                </div>
                <MiniSparkline values={kpi.spark} stroke={kpi.color} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Bento Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bento-card p-6 relative">
          <MemeSticker
            src="/memes/meme-doakes.jpg"
            alt="Doakes watching monthly outlier spike"
            tag="Doakes จับพิรุธ 🕵️‍♂️"
            roast="ลองกดปุ่ม 'เทียบเส้น Raw' ดูสิ จะเห็นเดือน มิ.ย. กับ ส.ค. พุ่งหลอกเพราะ Outlier 50 บิล!"
            visible={showMemes}
            placement="corner-tr"
            tiltDeg={-5}
          />
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
                    ? `${isRainbow ? "rainbow-btn" : "bg-emerald-600"} text-white border-transparent shadow-sm`
                    : "bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100"
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
                  <linearGradient id="modernCleanFill" x1="0" y1="0" x2="1" y2="1">
                    {isRainbow ? (
                      <>
                        <stop offset="0%" stopColor="#F43F5E" stopOpacity={0.32} />
                        <stop offset="50%" stopColor="#10B981" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#6366F1" stopOpacity={0.25} />
                      </>
                    ) : (
                      <>
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.32} />
                        <stop offset="95%" stopColor="#14B8A6" stopOpacity={0.02} />
                      </>
                    )}
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
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
                    borderColor: "#E2E8F0",
                    backgroundColor: "rgba(255,255,255,0.95)",
                    fontSize: "12px",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="cleanRevenue"
                  name="ยอดสะอาด (Clean)"
                  stroke={isRainbow ? "#6366F1" : "#059669"}
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
            what={timeInsightWhat}
            soWhat="ธุรกิจกำลังเผชิญภาวะยอดขายชะลอตัวจริงตามโจทย์ และหากไม่คลีน Outlier 50 บิลออก จะประเมินผลงานกลางปีคลาดเคลื่อน"
            nowWhat="ใช้ยอดสะอาดเป็นฐาน KPI หลัก และจัดแคมเปญกระตุ้นยอดขายช่วง Low Season (ก.พ., พ.ค., พ.ย.)"
          />
        </section>

        {/* Category Bento */}
        <section className="lg:col-span-5 bento-card p-6 relative">
          <MemeSticker
            src="/memes/meme-pepe.jpg"
            alt="Pepe impressed by Household 58.03%"
            tag="Household แบก 58% 👀"
            roast="หมวดเดียวฟาดไป ฿82.49M — อีก 4 หมวดที่เหลือมองตาปริบๆ!"
            visible={showMemes}
            placement="corner-br"
            tiltDeg={4}
          />
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
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-800 transition-colors"
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
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
                    borderColor: "#E2E8F0",
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
                          ? "#0F172A"
                          : palette[idx % palette.length]
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

      {/* Middle Row: Region + Radial Donut Charts */}
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
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
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
                    borderColor: "#E2E8F0",
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
                          ? "#0F172A"
                          : palette[idx % palette.length]
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

        {/* Radial Donut Mix */}
        <section className="lg:col-span-6 bento-card p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              สัดส่วนช่องทางการขาย &amp; วิธีชำระเงิน (Radial Donut Mix)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              คลิกที่ชิ้น Donut หรือปุ่มด้านล่างเพื่อ Filter ข้อมูลทั้ง Dashboard
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-800 text-center mb-1">Channel Mix</p>
                <div className="h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.channels}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={4}
                        cursor="pointer"
                        onClick={(entry) => {
                          if (entry?.name) {
                            onSelectFilter(
                              "channel",
                              filters.channel === entry.name ? "ALL" : String(entry.name),
                            );
                          }
                        }}
                      >
                        {metrics.channels.map((c, idx) => (
                          <Cell
                            key={c.name}
                            fill={
                              filters.channel === c.name
                                ? "#0F172A"
                                : palette[idx % palette.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatTHB(Number(v ?? 0)), "ยอดขาย"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-semibold">Online</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {onlineShare}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {metrics.channels.map((ch) => (
                    <button
                      key={ch.name}
                      type="button"
                      onClick={() =>
                        onSelectFilter("channel", filters.channel === ch.name ? "ALL" : ch.name)
                      }
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                        filters.channel === ch.name
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {ch.name} ({ch.sharePct}%)
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50/80 border border-slate-200 p-3">
                <p className="text-xs font-bold text-slate-800 text-center mb-1">Payment Mix</p>
                <div className="h-44 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.payments}
                        dataKey="revenue"
                        nameKey="name"
                        innerRadius={44}
                        outerRadius={68}
                        paddingAngle={4}
                        cursor="pointer"
                        onClick={(entry) => {
                          if (entry?.name) {
                            onSelectFilter(
                              "payment",
                              filters.payment === entry.name ? "ALL" : String(entry.name),
                            );
                          }
                        }}
                      >
                        {metrics.payments.map((p, idx) => (
                          <Cell
                            key={p.name}
                            fill={
                              filters.payment === p.name
                                ? "#0F172A"
                                : palette[(idx + 2) % palette.length]
                            }
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [formatTHB(Number(v ?? 0)), "ยอดขาย"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[10px] text-slate-500 font-semibold">Digital</span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {digitalPayShare}%
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap justify-center gap-1.5 mt-1">
                  {metrics.payments.map((pm) => (
                    <button
                      key={pm.name}
                      type="button"
                      onClick={() =>
                        onSelectFilter("payment", filters.payment === pm.name ? "ALL" : pm.name)
                      }
                      className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                        filters.payment === pm.name
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-white text-slate-700 border-slate-200"
                      }`}
                    >
                      {pm.name} ({pm.sharePct}%)
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <InsightCard
            what={`Online ครองสัดส่วน ${onlineShare}% และการชำระเงินดิจิทัล (Credit Card + PromptPay) มีสัดส่วนรวม ${digitalPayShare}%`}
            soWhat="ลูกค้ามีความคุ้นเคยกับดิจิทัลสูง แต่ยอดขายหน้าร้าน In-Store ยังเติบโตช้ากว่า"
            nowWhat="เชื่อมต่อ O2O ด้วยแคมเปญ Click & Collect และคืนเงิน PromptPay เมื่อซื้อที่หน้าร้าน"
          />
        </section>
      </div>

      {/* Bottom Row: Top Customers Leaderboard + Funny Meme Corner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-7 bento-card p-6 relative">
          <MemeSticker
            src="/memes/meme-nice.jpg"
            alt="Nice VIP Customers"
            tag="VIP Customer · NOICE 👌"
            roast="คลิกการ์ดลูกค้าด้านล่างเพื่อเปิดประวัติช้อป 360° ได้เลย!"
            visible={showMemes}
            placement="corner-tr"
            tiltDeg={5}
          />
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 inline-flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span>Top Customers Leaderboard (คลิกดู Customer 360°)</span>
              </h3>
              <p className="text-xs text-slate-500">
                อันดับลูกค้าที่สร้างยอดขายสูงสุดภายใต้ตัวกรองปัจจุบัน
              </p>
            </div>
            <button
              type="button"
              onClick={onDrillToExplorer}
              className="text-xs font-bold text-[#047857] hover:underline inline-flex items-center gap-1"
            >
              <span>ดูบิลทั้งหมด</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metrics.topCustomers.map((c, idx) => (
              <button
                key={c.cid}
                type="button"
                onClick={() => onSelectCustomer(c.cid)}
                className="text-left rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:border-emerald-400 p-3.5 transition-all group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold text-slate-900 group-hover:underline">
                    #{idx + 1} · {c.cid}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-white border border-slate-200 text-[10px] font-bold text-slate-700">
                    {c.tier}
                  </span>
                </div>
                <p className="text-lg font-extrabold text-slate-900 mt-1 tabular-nums">
                  {formatTHB(c.revenue)}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                  {c.txns} บิล · {formatNumber(c.units)} ชิ้น · {c.gender} ({c.age} ปี)
                </p>
              </button>
            ))}
          </div>

          {showMemes && (
            <div className="mt-4 pt-3 border-t border-slate-200/70 flex flex-wrap gap-3">
              <MemeSticker
                src="/memes/meme-doakes.jpg"
                alt="Doakes watching VIP spend"
                tag="Doakes เช็ก VIP"
                roast="คลิกรายชื่อด้านบนดูได้เลยว่าซื้อ Household เยอะขนาดไหน 👀"
                visible={showMemes}
                placement="inline"
                tiltDeg={-2}
              />
              <MemeSticker
                src="/memes/meme-selfie.jpg"
                alt="Selfie monkey"
                tag="Selfie Time 🤳"
                roast="มีมกระจายครบทุกแท็บ! สลับแท็บ EDA / Audit / Explorer ดูต่อได้เลย"
                visible={showMemes}
                placement="inline"
                tiltDeg={3}
              />
            </div>
          )}
        </section>

        <div className="lg:col-span-5">
          <MemeWidget isRainbow={isRainbow} />
        </div>
      </div>
    </div>
  );
}
