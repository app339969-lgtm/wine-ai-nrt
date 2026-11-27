"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Download,
  FileSearch,
  LayoutDashboard,
  LogOut,
  RotateCcw,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import {
  computeDashboardMetrics,
  exportRowsToCsv,
  filterCompactRows,
  formatNumber,
  INITIAL_FILTERS,
} from "@/lib/analytics";
import type {
  CompactDataset,
  DashboardFilters,
  SummaryPayload,
} from "@/types/dashboard";
import { OverviewView } from "./OverviewView";
import { EdaInsightsView } from "./EdaInsightsView";
import { DataAuditView } from "./DataAuditView";
import { ExplorerArchView } from "./ExplorerArchView";

type TabId = "overview" | "eda" | "audit" | "explorer";

interface DashboardClientProps {
  summary: SummaryPayload;
}

const FILTER_LABELS: Record<keyof DashboardFilters, string> = {
  quarter: "ไตรมาส",
  month: "เดือน",
  category: "หมวดหมู่",
  channel: "ช่องทาง",
  region: "ภูมิภาค",
  tier: "สมาชิก",
  payment: "ชำระเงิน",
  ageGroup: "อายุ",
};

export function DashboardClient({ summary }: DashboardClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [filters, setFilters] = useState<DashboardFilters>(INITIAL_FILTERS);
  const [dataset, setDataset] = useState<CompactDataset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCompactData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/data/transactions_compact.json");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = (await res.json()) as CompactDataset;
      setDataset(data);
    } catch {
      setError("ไม่สามารถโหลดชุดข้อมูลธุรกรรม (transactions_compact.json) ได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCompactData();
  }, []);

  const filteredRows = useMemo(() => {
    if (!dataset) return [];
    return filterCompactRows(dataset, filters);
  }, [dataset, filters]);

  const metrics = useMemo(() => {
    if (!dataset) return null;
    return computeDashboardMetrics(dataset, filteredRows);
  }, [dataset, filteredRows]);

  const handleFilterChange = (key: keyof DashboardFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "quarter" && value !== "ALL" ? { month: "ALL" } : {}),
    }));
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
  };

  const handleLogout = async () => {
    await fetch("/api/auth", { method: "DELETE" });
    router.push("/login");
    router.refresh();
  };

  const activeEntries = (Object.entries(filters) as [keyof DashboardFilters, string][]).filter(
    ([, v]) => v !== "ALL",
  );

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "eda", label: "EDA & Insights", icon: BarChart3 },
    { id: "audit", label: "Data Audit", icon: ShieldAlert },
    { id: "explorer", label: "Explorer & Export", icon: FileSearch },
  ];

  return (
    <div className="min-h-screen text-slate-900 pb-12">
      {/* Floating Glassmorphic Header */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-emerald-950/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center font-extrabold text-base shadow-md shadow-emerald-600/20">
              SR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                  SmartRetail <span className="text-emerald-700">Analytics</span>
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#047857]">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  {loading ? "Syncing..." : "49,200 Verified"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Customer Behavior &amp; Retail Sales Intelligence
              </p>
            </div>
          </div>

          {/* Segmented Pill Tabs (Desktop Center/Right) */}
          <nav
            aria-label="Dashboard sections"
            className="order-3 lg:order-2 w-full lg:w-auto flex items-center gap-1 p-1 rounded-full bg-emerald-950/5 overflow-x-auto"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? "bg-white text-[#065F46] shadow-xs"
                      : "text-slate-600 hover:text-emerald-800"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="order-2 lg:order-3 flex items-center gap-2">
            {dataset && (
              <button
                type="button"
                onClick={() => exportRowsToCsv(dataset, filteredRows)}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ({formatNumber(filteredRows.length)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-emerald-950/15 bg-white hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Modern Floating Bento Filter Bar */}
        {dataset && (
          <section className="bento-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                <span>ตัวกรองอัจฉริยะ (Interactive Filters)</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3" /> Real-time
                </span>
              </div>
              {activeEntries.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#047857] hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ล้างทั้งหมด
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <select
                aria-label="ไตรมาส"
                value={filters.quarter}
                onChange={(e) => handleFilterChange("quarter", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกไตรมาส (2025)</option>
                {dataset.lookups.Quarter.map((q) => (
                  <option key={q} value={q}>
                    {q}
                  </option>
                ))}
              </select>

              <select
                aria-label="หมวดหมู่สินค้า"
                value={filters.category}
                onChange={(e) => handleFilterChange("category", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกหมวดหมู่</option>
                {dataset.lookups.Category.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                aria-label="ช่องทางการขาย"
                value={filters.channel}
                onChange={(e) => handleFilterChange("channel", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกช่องทาง</option>
                {dataset.lookups.Channel.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                aria-label="ภูมิภาค"
                value={filters.region}
                onChange={(e) => handleFilterChange("region", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกภูมิภาค</option>
                {dataset.lookups.Region.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              <select
                aria-label="ระดับสมาชิก"
                value={filters.tier}
                onChange={(e) => handleFilterChange("tier", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกระดับสมาชิก</option>
                {dataset.lookups.Membership_Tier.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <select
                aria-label="วิธีชำระเงิน"
                value={filters.payment}
                onChange={(e) => handleFilterChange("payment", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกวิธีชำระเงิน</option>
                {dataset.lookups.Payment_Method.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>

              <select
                aria-label="ช่วงอายุ"
                value={filters.ageGroup}
                onChange={(e) => handleFilterChange("ageGroup", e.target.value)}
                className="px-3 py-2 rounded-xl border border-emerald-950/15 bg-[#F5FBF7] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกช่วงอายุ</option>
                {dataset.lookups.Age_Group.map((a) => (
                  <option key={a} value={a}>
                    อายุ {a} ปี
                  </option>
                ))}
              </select>
            </div>

            {/* Active Removable Filter Chips */}
            {activeEntries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeEntries.map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFilterChange(key, "ALL")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/80 hover:bg-emerald-200/80 text-[#065F46] text-xs font-semibold transition-colors"
                  >
                    <span>
                      {FILTER_LABELS[key]}: <strong>{val}</strong>
                    </span>
                    <X className="w-3 h-3" />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Loading Skeleton State */}
        {loading && (
          <div className="space-y-4 animate-pulse" aria-label="Loading dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/80 border border-emerald-950/10" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-white/80 border border-emerald-950/10" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            role="alert"
            className="rounded-2xl bg-red-50 border border-red-200 p-6 text-center space-y-3"
          >
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadCompactData()}
              className="px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700"
            >
              โหลดข้อมูลใหม่อีกครั้ง
            </button>
          </div>
        )}

        {/* Active View Content */}
        {!loading && !error && dataset && metrics && (
          <>
            {activeTab === "overview" && (
              <OverviewView
                metrics={metrics}
                monthlyRawComparison={summary.monthlySeries}
                filters={filters}
                onSelectFilter={handleFilterChange}
                onDrillToExplorer={() => setActiveTab("explorer")}
              />
            )}
            {activeTab === "eda" && <EdaInsightsView summary={summary} />}
            {activeTab === "audit" && <DataAuditView summary={summary} />}
            {activeTab === "explorer" && (
              <ExplorerArchView
                dataset={dataset}
                filteredRows={filteredRows}
                onResetFilters={handleResetFilters}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
