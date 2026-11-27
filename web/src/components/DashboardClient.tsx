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

  const activeFilterCount = Object.values(filters).filter((v) => v !== "ALL").length;

  const tabs: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "overview", label: "1. Executive Overview", icon: LayoutDashboard },
    { id: "eda", label: "2. EDA & Insights", icon: BarChart3 },
    { id: "audit", label: "3. Data Quality & Audit", icon: ShieldAlert },
    { id: "explorer", label: "4. Explorer & Export", icon: FileSearch },
  ];

  return (
    <div className="min-h-screen bg-[#F7FAF8] text-slate-900">
      {/* Top Formal Header */}
      <header className="bg-white border-b border-[#DCE7E0] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#065F46] text-white flex items-center justify-center font-bold text-lg shadow-xs">
              SR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-bold text-[#065F46]">
                  SmartRetail Thailand — Executive Analytics
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] text-[11px] font-semibold text-[#047857]">
                  <CheckCircle2 className="w-3 h-3" />
                  {loading ? "กำลังซิงค์ข้อมูล..." : "49,200 Clean Rows Verified"}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                การวิเคราะห์พฤติกรรมลูกค้าและประสิทธิภาพยอดขาย (ปวช. ระดับจังหวัด)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {dataset && (
              <button
                type="button"
                onClick={() => exportRowsToCsv(dataset, filteredRows)}
                disabled={filteredRows.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#ECFDF5] hover:bg-[#D1FAE5] border border-[#A7F3D0] text-[#065F46] text-xs font-semibold transition-colors disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV ({formatNumber(filteredRows.length)})</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DCE7E0] bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav
          aria-label="Dashboard sections"
          className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t border-[#EFF5F1]"
        >
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  active
                    ? "border-[#047857] text-[#065F46] bg-[#F7FAF8]"
                    : "border-transparent text-slate-600 hover:text-[#047857] hover:bg-[#F7FAF8]/60"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Global Multi-Dimensional Filter Bar */}
        {dataset && (
          <section className="bg-white border border-[#DCE7E0] rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[#065F46]">
                <SlidersHorizontal className="w-4 h-4 text-[#059669]" />
                <span>ตัวกรองข้อมูล (Interactive Filters — อัปเดตทุกกราฟและตารางทันที)</span>
                {activeFilterCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[#047857] text-white text-[11px]">
                    กำลังกรอง {activeFilterCount} เงื่อนไข
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857] hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  ล้างตัวกรองทั้งหมด
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 text-xs">
              <select
                aria-label="ไตรมาส"
                value={filters.quarter}
                onChange={(e) => handleFilterChange("quarter", e.target.value)}
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
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
                className="px-2.5 py-2 rounded-lg border border-[#DCE7E0] bg-[#F7FAF8] text-slate-800"
              >
                <option value="ALL">ทุกช่วงอายุ</option>
                {dataset.lookups.Age_Group.map((a) => (
                  <option key={a} value={a}>
                    อายุ {a} ปี
                  </option>
                ))}
              </select>
            </div>
          </section>
        )}

        {/* Loading Skeleton State */}
        {loading && (
          <div className="space-y-4 animate-pulse" aria-label="Loading dashboard">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-xl bg-white border border-[#DCE7E0]" />
              ))}
            </div>
            <div className="h-80 rounded-xl bg-white border border-[#DCE7E0]" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div
            role="alert"
            className="bg-red-50 border border-red-200 rounded-xl p-6 text-center space-y-3"
          >
            <AlertCircle className="w-8 h-8 text-red-600 mx-auto" />
            <p className="text-sm font-semibold text-red-800">{error}</p>
            <button
              type="button"
              onClick={() => void loadCompactData()}
              className="px-4 py-2 rounded-lg bg-[#047857] text-white text-xs font-semibold hover:bg-[#065F46]"
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
