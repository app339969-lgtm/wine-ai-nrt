"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  Cpu,
  Download,
  RotateCcw,
  Search,
  SearchX,
} from "lucide-react";
import { exportRowsToCsv, formatNumber, formatTHB } from "@/lib/analytics";
import type { CompactDataset, CompactTuple } from "@/types/dashboard";

interface ExplorerArchViewProps {
  dataset: CompactDataset;
  filteredRows: CompactTuple[];
  onResetFilters: () => void;
}

type SortKey = "date" | "total" | "units";

export function ExplorerArchView({
  dataset,
  filteredRows,
  onResetFilters,
}: ExplorerArchViewProps) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const searchedRows = useMemo(() => {
    const q = search.trim().toUpperCase();
    const base = q
      ? filteredRows.filter((r) => r[0].includes(q) || r[1].includes(q))
      : filteredRows;

    return [...base].sort((a, b) => {
      if (sortKey === "date") {
        return sortAsc ? a[2].localeCompare(b[2]) : b[2].localeCompare(a[2]);
      }
      const idx = sortKey === "total" ? 9 : 7;
      return sortAsc ? a[idx] - b[idx] : b[idx] - a[idx];
    });
  }, [filteredRows, search, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(searchedRows.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = searchedRows.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortAsc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
    setPage(1);
  };

  const { lookups } = dataset;

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Explorer Card */}
      <section className="bento-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              ตารางเจาะลึกรายการธุรกรรม (Detail Drill-Down Explorer)
            </h3>
            <p className="text-xs text-slate-500">
              แสดง {formatNumber(searchedRows.length)} รายการจากชุดข้อมูลที่คลีนแล้ว พร้อม Export CSV ตามตัวกรอง
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="ค้นหา TXN- หรือ CUST-..."
                className="pl-9 pr-4 py-1.5 rounded-full border border-emerald-950/15 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="button"
              onClick={() => exportRowsToCsv(dataset, searchedRows)}
              disabled={searchedRows.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered CSV ({formatNumber(searchedRows.length)})
            </button>
          </div>
        </div>

        {searchedRows.length === 0 ? (
          <div className="py-14 text-center border border-dashed border-emerald-300 rounded-2xl bg-[#F5FBF7]">
            <SearchX className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-800">
              ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง
            </p>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              ลองปรับคำค้นหาหรือล้างตัวกรองเพื่อดูข้อมูลทั้งหมด 49,200 รายการ
            </p>
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onResetFilters();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              ล้างตัวกรองทั้งหมด
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-emerald-950/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-emerald-950/10 bg-emerald-50/70 text-[#065F46]">
                    <th className="py-3 px-3 font-bold">Transaction_ID</th>
                    <th className="py-3 px-3 font-bold">Customer_ID</th>
                    <th className="py-3 px-3 font-bold">
                      <button
                        type="button"
                        onClick={() => toggleSort("date")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        Date <ArrowDownUp className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 font-bold">Category</th>
                    <th className="py-3 px-3 font-bold">Channel</th>
                    <th className="py-3 px-3 font-bold">Region</th>
                    <th className="py-3 px-3 font-bold">Tier</th>
                    <th className="py-3 px-3 font-bold">Payment</th>
                    <th className="py-3 px-3 font-bold text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("units")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        Units <ArrowDownUp className="w-3 h-3" />
                      </button>
                    </th>
                    <th className="py-3 px-3 font-bold text-right">
                      <button
                        type="button"
                        onClick={() => toggleSort("total")}
                        className="inline-flex items-center gap-1 hover:underline"
                      >
                        Total <ArrowDownUp className="w-3 h-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 tabular-nums bg-white">
                  {pageRows.map((r) => (
                    <tr key={r[0]} className="hover:bg-emerald-50/40 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {r[0]}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">{r[1]}</td>
                      <td className="py-2.5 px-3 text-slate-700">{r[2]}</td>
                      <td className="py-2.5 px-3 text-slate-800">{lookups.Category[r[5]]}</td>
                      <td className="py-2.5 px-3 text-slate-700">{lookups.Channel[r[6]]}</td>
                      <td className="py-2.5 px-3 text-slate-700">{lookups.Region[r[11]]}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#065F46] font-semibold">
                          {lookups.Membership_Tier[r[12]]}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">
                        {lookups.Payment_Method[r[10]]}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                        {r[7]}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#065F46]">
                        {formatTHB(r[9])}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
              <span>
                หน้า <strong>{safePage}</strong> จาก <strong>{formatNumber(totalPages)}</strong>{" "}
                (แสดง {pageRows.length} รายการต่อหน้า)
              </span>
              <div className="inline-flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={safePage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-emerald-950/15 bg-white hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  ก่อนหน้า
                </button>
                <button
                  type="button"
                  disabled={safePage >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-emerald-950/15 bg-white hover:bg-emerald-50 disabled:opacity-40 transition-colors"
                >
                  ถัดไป
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </>
        )}
      </section>

      {/* Performance & Architecture Evidence */}
      <section className="bento-card p-6">
        <div className="flex items-center gap-2 text-[#065F46] font-bold text-base mb-2">
          <Cpu className="w-5 h-5 text-emerald-600" />
          <span>สถาปัตยกรรมระบบและหลักฐานการออกแบบด้านประสิทธิภาพ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-700 mt-3">
          <div className="p-4 rounded-2xl bg-[#F5FBF7] border border-emerald-950/10">
            <p className="font-bold text-[#065F46] mb-1">1. Pre-Aggregated Static Summary</p>
            <p>
              หน้าแรกโหลดสรุป KPI, Time Series และ Correlation Matrix จากไฟล์ <code>summary.json</code> (38.7 KB) ทำให้ First Paint รวดเร็วทันที
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5FBF7] border border-emerald-950/10">
            <p className="font-bold text-[#065F46] mb-1">2. Dictionary-Encoded Compact Engine</p>
            <p>
              ข้อมูลคลีน 49,200 แถวถูกเข้ารหัสเป็น Lookup Index + Compact Tuple ใน <code>transactions_compact.json</code> ทำให้ Filter หลายมิติทำงานระดับมิลลิวินาที
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-[#F5FBF7] border border-emerald-950/10">
            <p className="font-bold text-[#065F46] mb-1">3. Vercel Cloud + Offline Fallback</p>
            <p>
              Deploy ผ่าน GitHub → Vercel Next.js CDN พร้อมสคริปต์สำรองบนเครื่อง (<code>run_dashboard.ps1</code> / <code>run_dashboard.bat</code>) สำหรับรันออฟไลน์ได้ครบถ้วน
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
