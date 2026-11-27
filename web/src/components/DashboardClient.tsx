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
  Minimize2,
  Palette,
  Presentation,
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
  getCustomerProfile,
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
import { CustomerDrawer } from "./CustomerDrawer";

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
  const [presentationMode, setPresentationMode] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [themeMode, setThemeMode] = useState<"rainbow" | "emerald">("rainbow");
  const [showMemes, setShowMemes] = useState(true);

  const isRainbow = themeMode === "rainbow";
  const memesVisible = isRainbow && showMemes;

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

  const selectedCustomerProfile = useMemo(() => {
    if (!dataset || !selectedCustomerId) return null;
    return getCustomerProfile(dataset, selectedCustomerId);
  }, [dataset, selectedCustomerId]);

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
    <div
      className={`min-h-screen text-slate-900 pb-20 ${
        isRainbow ? "theme-rainbow" : "theme-emerald"
      }`}
    >
      {/* Floating Glassmorphic Header */}
      {!presentationMode && (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl text-white flex items-center justify-center font-extrabold text-base shadow-md ${
                  isRainbow ? "rainbow-btn" : "bg-gradient-to-br from-emerald-600 to-teal-600"
                }`}
              >
                SR
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                    SmartRetail <span className="text-emerald-700">Analytics</span>
                  </h1>
                  <span className="hidden xl:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-[#047857]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {loading ? "Syncing..." : "49,200 Verified"}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Customer Behavior &amp; Retail Sales Intelligence
                </p>
              </div>
            </div>

            {/* Segmented Pill Tabs */}
            <nav
              aria-label="Dashboard sections"
              className="order-3 xl:order-2 w-full xl:w-auto flex items-center gap-1 p-1 rounded-full bg-slate-900/5 overflow-x-auto"
            >
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      active
                        ? "bg-white text-slate-900 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="order-2 xl:order-3 flex flex-wrap items-center gap-2">
              {isRainbow && (
                <button
                  type="button"
                  onClick={() => setShowMemes((prev) => !prev)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs transition-colors"
                >
                  <span>{showMemes ? "🤣 มีม: เปิด" : "🙈 มีม: ปิด"}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  setThemeMode((prev) => (prev === "rainbow" ? "emerald" : "rainbow"))
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-xs transition-colors"
              >
                <Palette className="w-3.5 h-3.5 text-pink-500" />
                <span>{isRainbow ? "🌈 Rainbow" : "🌿 Emerald"}</span>
              </button>
              <button
                type="button"
                onClick={() => setPresentationMode(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-colors"
              >
                <Presentation className="w-3.5 h-3.5" />
                <span>นำเสนอ</span>
              </button>
              {dataset && (
                <button
                  type="button"
                  onClick={() => exportRowsToCsv(dataset, filteredRows)}
                  disabled={filteredRows.length === 0}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 ${
                    isRainbow
                      ? "rainbow-btn"
                      : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  }`}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export ({formatNumber(filteredRows.length)})</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {!presentationMode && dataset && (
          <section className="bento-card p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
                className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ALL">ทุกช่วงอายุ</option>
                {dataset.lookups.Age_Group.map((a) => (
                  <option key={a} value={a}>
                    อายุ {a} ปี
                  </option>
                ))}
              </select>
            </div>

            {activeEntries.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeEntries.map(([key, val]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleFilterChange(key, "ALL")}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-semibold transition-colors"
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

        {loading && (
          <div className="space-y-4 animate-pulse" aria-label="Loading dashboard">
            <div className="h-44 rounded-3xl bg-white/70" />
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-white/80" />
              ))}
            </div>
            <div className="h-80 rounded-2xl bg-white/80" />
          </div>
        )}

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

        {!loading && !error && dataset && metrics && (
          <>
            {activeTab === "overview" && (
              <OverviewView
                metrics={metrics}
                monthlyRawComparison={summary.monthlySeries}
                filters={filters}
                presentationMode={presentationMode}
                isRainbow={isRainbow}
                showMemes={memesVisible}
                onTogglePresentation={() => setPresentationMode((prev) => !prev)}
                onSelectFilter={handleFilterChange}
                onDrillToExplorer={() => setActiveTab("explorer")}
                onSelectCustomer={setSelectedCustomerId}
              />
            )}
            {activeTab === "eda" && (
              <EdaInsightsView
                summary={summary}
                ageGroups={metrics.ageGroups}
                showMemes={memesVisible}
              />
            )}
            {activeTab === "audit" && (
              <DataAuditView summary={summary} showMemes={memesVisible} />
            )}
            {activeTab === "explorer" && (
              <ExplorerArchView
                dataset={dataset}
                filteredRows={filteredRows}
                showMemes={memesVisible}
                onResetFilters={handleResetFilters}
                onSelectCustomer={setSelectedCustomerId}
              />
            )}
          </>
        )}
      </main>

      {presentationMode && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1.5 px-3 py-2 rounded-full bg-slate-900/90 backdrop-blur-xl text-white shadow-2xl border border-white/15">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                  active ? `${isRainbow ? "rainbow-btn" : "bg-emerald-500"} text-white` : "text-slate-200 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setThemeMode((prev) => (prev === "rainbow" ? "emerald" : "rainbow"))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold"
          >
            <span>{isRainbow ? "🌿" : "🌈"}</span>
          </button>
          <button
            type="button"
            onClick={() => setPresentationMode(false)}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-xs font-bold ml-1"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      )}

      <CustomerDrawer
        profile={selectedCustomerProfile}
        onClose={() => setSelectedCustomerId(null)}
      />
    </div>
  );
}
