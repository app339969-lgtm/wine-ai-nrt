import type { CompactDataset, CompactTuple, DashboardFilters } from "@/types/dashboard";

export const INITIAL_FILTERS: DashboardFilters = {
  quarter: "ALL",
  month: "ALL",
  category: "ALL",
  channel: "ALL",
  region: "ALL",
  tier: "ALL",
  payment: "ALL",
  ageGroup: "ALL",
};

export interface AggregatedBucket {
  name: string;
  revenue: number;
  txns: number;
  units: number;
  sharePct: number;
}

export interface ComputedDashboardMetrics {
  totalRevenue: number;
  totalTxns: number;
  totalUnits: number;
  avgOrderValue: number;
  uniqueCustomers: number;
  monthly: AggregatedBucket[];
  categories: AggregatedBucket[];
  channels: AggregatedBucket[];
  regions: AggregatedBucket[];
  payments: AggregatedBucket[];
  tiers: AggregatedBucket[];
  ageGroups: AggregatedBucket[];
}

export function formatTHB(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000) return `฿${(value / 1_000_000).toFixed(2)}M`;
    if (value >= 1_000) return `฿${(value / 1_000).toFixed(1)}K`;
  }
  return `฿${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("en-US");
}

export function filterCompactRows(
  dataset: CompactDataset,
  filters: DashboardFilters,
): CompactTuple[] {
  const { lookups, rows } = dataset;
  const qIdx = filters.quarter === "ALL" ? -1 : lookups.Quarter.indexOf(filters.quarter);
  const ymIdx = filters.month === "ALL" ? -1 : lookups.Year_Month.indexOf(filters.month);
  const catIdx = filters.category === "ALL" ? -1 : lookups.Category.indexOf(filters.category);
  const chanIdx = filters.channel === "ALL" ? -1 : lookups.Channel.indexOf(filters.channel);
  const regIdx = filters.region === "ALL" ? -1 : lookups.Region.indexOf(filters.region);
  const tierIdx = filters.tier === "ALL" ? -1 : lookups.Membership_Tier.indexOf(filters.tier);
  const payIdx = filters.payment === "ALL" ? -1 : lookups.Payment_Method.indexOf(filters.payment);
  const ageIdx = filters.ageGroup === "ALL" ? -1 : lookups.Age_Group.indexOf(filters.ageGroup);

  if (
    qIdx === -1 &&
    ymIdx === -1 &&
    catIdx === -1 &&
    chanIdx === -1 &&
    regIdx === -1 &&
    tierIdx === -1 &&
    payIdx === -1 &&
    ageIdx === -1
  ) {
    return rows;
  }

  return rows.filter(
    (r) =>
      (qIdx === -1 || r[4] === qIdx) &&
      (ymIdx === -1 || r[3] === ymIdx) &&
      (catIdx === -1 || r[5] === catIdx) &&
      (chanIdx === -1 || r[6] === chanIdx) &&
      (regIdx === -1 || r[11] === regIdx) &&
      (tierIdx === -1 || r[12] === tierIdx) &&
      (payIdx === -1 || r[10] === payIdx) &&
      (ageIdx === -1 || r[14] === ageIdx),
  );
}

function finalizeBuckets(
  map: Map<string, { revenue: number; txns: number; units: number }>,
  totalRevenue: number,
  sortByRevenue = true,
): AggregatedBucket[] {
  const list = Array.from(map.entries()).map(([name, v]) => ({
    name,
    revenue: v.revenue,
    txns: v.txns,
    units: v.units,
    sharePct: totalRevenue > 0 ? Number(((v.revenue / totalRevenue) * 100).toFixed(2)) : 0,
  }));
  return sortByRevenue
    ? list.sort((a, b) => b.revenue - a.revenue)
    : list.sort((a, b) => a.name.localeCompare(b.name));
}

function addToBucket(
  map: Map<string, { revenue: number; txns: number; units: number }>,
  key: string,
  units: number,
  total: number,
): void {
  const curr = map.get(key);
  if (curr) {
    curr.revenue += total;
    curr.txns += 1;
    curr.units += units;
  } else {
    map.set(key, { revenue: total, txns: 1, units });
  }
}

export function computeDashboardMetrics(
  dataset: CompactDataset,
  filteredRows: CompactTuple[],
): ComputedDashboardMetrics {
  const { lookups } = dataset;
  let totalRevenue = 0;
  let totalUnits = 0;
  const customers = new Set<string>();

  const monthMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const catMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const chanMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const regMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const payMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const tierMap = new Map<string, { revenue: number; txns: number; units: number }>();
  const ageMap = new Map<string, { revenue: number; txns: number; units: number }>();

  for (const r of filteredRows) {
    const units = r[7];
    const total = r[9];
    totalRevenue += total;
    totalUnits += units;
    customers.add(r[1]);

    addToBucket(monthMap, lookups.Year_Month[r[3]], units, total);
    addToBucket(catMap, lookups.Category[r[5]], units, total);
    addToBucket(chanMap, lookups.Channel[r[6]], units, total);
    addToBucket(regMap, lookups.Region[r[11]], units, total);
    addToBucket(payMap, lookups.Payment_Method[r[10]], units, total);
    addToBucket(tierMap, lookups.Membership_Tier[r[12]], units, total);
    addToBucket(ageMap, lookups.Age_Group[r[14]], units, total);
  }

  const totalTxns = filteredRows.length;
  return {
    totalRevenue,
    totalTxns,
    totalUnits,
    avgOrderValue: totalTxns > 0 ? totalRevenue / totalTxns : 0,
    uniqueCustomers: customers.size,
    monthly: finalizeBuckets(monthMap, totalRevenue, false),
    categories: finalizeBuckets(catMap, totalRevenue, true),
    channels: finalizeBuckets(chanMap, totalRevenue, true),
    regions: finalizeBuckets(regMap, totalRevenue, true),
    payments: finalizeBuckets(payMap, totalRevenue, true),
    tiers: finalizeBuckets(tierMap, totalRevenue, true),
    ageGroups: finalizeBuckets(ageMap, totalRevenue, false),
  };
}

export function exportRowsToCsv(
  dataset: CompactDataset,
  rows: CompactTuple[],
  filename = "smartretail_filtered_transactions.csv",
): void {
  const { lookups } = dataset;
  const header = [
    "Transaction_ID",
    "Customer_ID",
    "Transaction_Date",
    "Category",
    "Channel",
    "Units_Sold",
    "Price_Per_Unit",
    "Total_Amount",
    "Payment_Method",
    "Region",
    "Membership_Tier",
    "Gender",
    "Age",
  ].join(",");

  const lines = rows.map((r) =>
    [
      r[0],
      r[1],
      r[2],
      lookups.Category[r[5]],
      lookups.Channel[r[6]],
      r[7],
      r[8],
      r[9],
      lookups.Payment_Method[r[10]],
      lookups.Region[r[11]],
      lookups.Membership_Tier[r[12]],
      lookups.Gender[r[13]],
      r[15],
    ].join(","),
  );

  const blob = new Blob(["\uFEFF" + [header, ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
