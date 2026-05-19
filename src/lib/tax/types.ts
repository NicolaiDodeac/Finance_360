import type { EvidenceConfidenceCounts } from "@/lib/evidence/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";

export interface TaxHmrcCategoryRef {
  id: string;
  code: string;
  name: string;
  is_allowable_expense: boolean;
}

export interface TaxTransactionRow {
  id: string;
  amount: number;
  direction: "income" | "expense" | "transfer";
  is_business: boolean;
  category_id: string | null;
  hmrc_category_id: string | null;
  receipt_id: string | null;
  transaction_date: string;
  description: string | null;
  merchant_name: string | null;
  notes: string | null;
  account_id: string | null;
  hmrc_category: TaxHmrcCategoryRef | null;
}

export interface TaxOverviewMetrics {
  grossSelfEmployedIncome: number;
  allowableBusinessExpenses: number;
  totalBusinessExpenses: number;
  estimatedProfit: number;
  evidenceConfidence: EvidenceConfidenceCounts;
  uncategorizedBusinessExpensesCount: number;
  suggestedTaxPot: number;
}

export interface TaxCategoryBreakdownRow {
  hmrcCategoryId: string;
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  additionalProofCount: number;
  isAllowable: boolean;
}

export interface TaxReviewItem {
  id: string;
  title: string;
  description: string;
  count: number;
  href: string;
}

export interface TaxHubSummary {
  metrics: TaxOverviewMetrics;
  categoryBreakdown: TaxCategoryBreakdownRow[];
  reviewItems: TaxReviewItem[];
  hasBusinessActivity: boolean;
}

export interface TaxHubData {
  taxYears: TaxYearRow[];
  selectedTaxYear: TaxYearRow | null;
  summary: TaxHubSummary | null;
}
