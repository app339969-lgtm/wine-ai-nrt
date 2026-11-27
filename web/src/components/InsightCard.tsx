import { Lightbulb } from "lucide-react";

interface InsightCardProps {
  what: string;
  soWhat: string;
  nowWhat: string;
}

/** Rubric-aligned What -> So What -> Now What annotation placed below each chart. */
export function InsightCard({ what, soWhat, nowWhat }: InsightCardProps) {
  return (
    <div className="mt-4 rounded-xl bg-[#F7FAF8] border border-[#DCE7E0] p-3.5 text-xs leading-relaxed text-slate-700 space-y-1.5">
      <div className="flex items-center gap-1.5 text-[#065F46] font-semibold">
        <Lightbulb className="w-3.5 h-3.5 text-[#059669]" />
        <span>สรุปความหมายเชิงธุรกิจ (What → So What → Now What)</span>
      </div>
      <p>
        <strong className="text-[#047857]">What:</strong> {what}
      </p>
      <p>
        <strong className="text-[#047857]">So What:</strong> {soWhat}
      </p>
      <p>
        <strong className="text-[#047857]">Now What:</strong> {nowWhat}
      </p>
    </div>
  );
}
