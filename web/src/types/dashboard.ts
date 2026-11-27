export interface NumericStats {
  n: number;
  sum: number;
  mean: number;
  std: number;
  min: number;
  q1: number;
  median: number;
  q3: number;
  iqr: number;
  max: number;
}

export interface MonthlyPoint {
  month: string;
  cleanTxns: number;
  cleanRevenue: number;
  cleanUnits: number;
  rawTxns: number;
  rawRevenue: number;
}

export interface InsightItem {
  id: string;
  title: string;
  metric: string;
  what: string;
  soWhat: string;
  nowWhat: string;
  owner: string;
  timeline: string;
}

export interface OutlierRow {
  Transaction_ID: string;
  Customer_ID: string;
  Transaction_Date: string;
  Category: string;
  Channel: string;
  Units_Sold: number;
  Price_Per_Unit: number;
  Total_Amount: number;
  Payment_Method: string;
  Region: string;
  IQR_Outlier: boolean;
  ZScore_Outlier: boolean;
  Outlier_Reason: string;
}

export interface SummaryPayload {
  generatedAt: string;
  cleaningReport: {
    validation: {
      raw_customers_rows: number;
      raw_transactions_rows: number;
      customer_pk_unique: boolean;
      transaction_pk_unique: boolean;
      fk_matched_rows: number;
      fk_match_rate_pct: number;
      customers_missing_cells: number;
    };
    cleaning_summary: {
      dropped_dual_missing_rows: number;
      dropped_missing_by_category: Record<string, number>;
      outliers_iqr_count: number;
      outliers_zscore_count: number;
      outliers_isolated_rows: number;
      outliers_unique_units: Record<string, number>;
      outliers_revenue_sum: number;
      outlier_bounds: {
        q1: number;
        q3: number;
        iqr: number;
        iqr_lower_fence: number;
        iqr_upper_fence: number;
        z_mean: number;
        z_std: number;
        z_3sigma_upper: number;
      };
      cleaned_transactions_rows: number;
      before_cleaning_total_amount: NumericStats;
      after_cleaning_total_amount: NumericStats;
      before_cleaning_units_sold: NumericStats;
      after_cleaning_units_sold: NumericStats;
    };
    merged_rows: number;
    duckdb_verification: {
      parquet_rows: number;
      parquet_total_revenue: number;
      matches_pandas: boolean;
    };
  };
  monthlySeries: MonthlyPoint[];
  unitsHistogram: { units: number; count: number }[];
  correlationMatrix: {
    labels: string[];
    keys: string[];
    matrix: number[][];
  };
  tierStats: {
    tier: string;
    customers: number;
    txns: number;
    revenue: number;
    avgRevenuePerCustomer: number;
    avgTxnsPerCustomer: number;
  }[];
  outliersAudit: OutlierRow[];
  insights: InsightItem[];
}

export type CompactTuple = [
  string, // 0 id
  string, // 1 cid
  string, // 2 date
  number, // 3 ym idx
  number, // 4 q idx
  number, // 5 cat idx
  number, // 6 chan idx
  number, // 7 units
  number, // 8 price
  number, // 9 total
  number, // 10 pay idx
  number, // 11 reg idx
  number, // 12 tier idx
  number, // 13 gen idx
  number, // 14 ageGrp idx
  number, // 15 age
];

export interface CompactDataset {
  fields: string[];
  lookups: {
    Year_Month: string[];
    Quarter: string[];
    Category: string[];
    Channel: string[];
    Payment_Method: string[];
    Region: string[];
    Membership_Tier: string[];
    Gender: string[];
    Age_Group: string[];
  };
  rows: CompactTuple[];
}

export interface DashboardFilters {
  quarter: string;
  month: string;
  category: string;
  channel: string;
  region: string;
  tier: string;
  payment: string;
  ageGroup: string;
}
