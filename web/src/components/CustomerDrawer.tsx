"use client";

import { useEffect } from "react";
import { X, Award, ShoppingBag, MapPin, Tag, Sparkles } from "lucide-react";
import { formatNumber, formatTHB, type CustomerProfile } from "@/lib/analytics";

interface CustomerDrawerProps {
  profile: CustomerProfile | null;
  onClose: () => void;
}

export function CustomerDrawer({ profile, onClose }: CustomerDrawerProps) {
  useEffect(() => {
    if (!profile) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [profile, onClose]);

  if (!profile) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-emerald-950/30 backdrop-blur-xs"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Customer profile ${profile.cid}`}
    >
      <aside
        className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-emerald-950/10 flex flex-col overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Banner */}
        <div className="bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-600 text-white p-6 flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-50 text-[11px] font-bold mb-2">
              <Sparkles className="w-3 h-3" />
              Customer 360° Drill-Down
            </div>
            <h2 className="text-2xl font-extrabold font-mono tracking-tight">
              {profile.cid}
            </h2>
            <p className="text-xs text-emerald-100 mt-1">
              {profile.gender} · อายุ {profile.age} ปี ({profile.ageGroup}) · ระดับสมาชิก{" "}
              <strong className="text-white">{profile.tier}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="ปิดหน้าต่างข้อมูลลูกค้า"
            className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Spend Summary */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#F5FBF7] border border-emerald-200 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">ยอดซื้อสะสม</p>
              <p className="text-lg font-extrabold text-[#065F46] mt-0.5 tabular-nums">
                {formatTHB(profile.totalRevenue, true)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5FBF7] border border-emerald-200 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">จำนวนบิล</p>
              <p className="text-lg font-extrabold text-[#065F46] mt-0.5 tabular-nums">
                {formatNumber(profile.totalTxns)}
              </p>
            </div>
            <div className="rounded-2xl bg-[#F5FBF7] border border-emerald-200 p-3.5">
              <p className="text-[11px] font-semibold text-slate-500">เฉลี่ย/บิล</p>
              <p className="text-lg font-extrabold text-[#065F46] mt-0.5 tabular-nums">
                {formatTHB(Math.round(profile.avgOrderValue))}
              </p>
            </div>
          </div>

          {/* Behavioral Tags */}
          <div className="rounded-2xl border border-emerald-950/10 bg-white p-4 space-y-2.5 text-xs">
            <p className="font-bold text-slate-900">พฤติกรรมการซื้อหลัก</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70">
                <Tag className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500">หมวดหลัก</p>
                  <p className="font-bold text-[#065F46]">{profile.favoriteCategory}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70">
                <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500">ช่องทางหลัก</p>
                  <p className="font-bold text-[#065F46]">{profile.favoriteChannel}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50/70">
                <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-500">ภูมิภาคหลัก</p>
                  <p className="font-bold text-[#065F46]">{profile.favoriteRegion}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                ประวัติคำสั่งซื้อล่าสุด (15 รายการล่าสุดจาก {profile.totalTxns} บิล)
              </h3>
            </div>
            <div className="overflow-hidden rounded-2xl border border-emerald-950/10">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-emerald-50/80 text-[#065F46] border-b border-emerald-950/10">
                    <th className="py-2 px-3 font-bold">TXN</th>
                    <th className="py-2 px-3 font-bold">Date</th>
                    <th className="py-2 px-3 font-bold">Category</th>
                    <th className="py-2 px-3 font-bold text-right">Units</th>
                    <th className="py-2 px-3 font-bold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/5 tabular-nums">
                  {profile.recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-emerald-50/40">
                      <td className="py-2 px-3 font-mono font-semibold text-slate-900">{o.id}</td>
                      <td className="py-2 px-3 text-slate-600">{o.date}</td>
                      <td className="py-2 px-3 text-slate-800">{o.category}</td>
                      <td className="py-2 px-3 text-right">{o.units}</td>
                      <td className="py-2 px-3 text-right font-bold text-[#065F46]">
                        {formatTHB(o.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
