import summaryData from "@/data/summary.json";
import { DashboardClient } from "@/components/DashboardClient";
import type { SummaryPayload } from "@/types/dashboard";

export default function HomePage() {
  const summary = summaryData as unknown as SummaryPayload;
  return <DashboardClient summary={summary} />;
}
