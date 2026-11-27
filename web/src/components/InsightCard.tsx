import { Sparkles } from "lucide-react";

interface InsightCardProps {
  what: string;
  soWhat: string;
  nowWhat: string;
}

/** Modern pill-badged What -> So What -> Now What insight card placed below each chart. */
export function InsightCard({ what, soWhat, nowWhat }: InsightCardProps) {
  return (
    <div className="mt-4 rounded-2xl bg-gradient-to-br from-emerald-50/70 to-teal-50/40 border border-emerald-200/70 p-4 text-xs leading-relaxed text-slate-700 space-y-2">
      <div className="flex items-center gap-1.5 text-[#065F46] font-bold">
        <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
        <span>Key Takeaway</span>
      </div>
      <div className="flex items-start gap-2">
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-white border border-emerald-200 text-[#047857] font-bold text-[10px] uppercase">
          What
        </span>
        <p>{what}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-white border border-teal-200 text-teal-800 font-bold text-[10px] uppercase">
          So What
        </span>
        <p>{soWhat}</p>
      </div>
      <div className="flex items-start gap-2">
        <span className="shrink-0 px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold text-[10px] uppercase">
          Now What
        </span>
        <p className="font-medium text-slate-900">{nowWhat}</p>
      </div>
    </div>
  );
}
