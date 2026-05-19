import type { EvidenceConfidenceCounts } from "@/lib/evidence/types";
import type { TaxYearRow } from "@/lib/tax-years/queries";
import type { TaxOverviewMetrics, TaxReviewItem } from "@/lib/tax/types";

export type SaPrepStepStatus = "ready" | "review_recommended" | "pending";

export interface SaPrepStepState {
  id: string;
  step: number;
  title: string;
  description: string;
  status: SaPrepStepStatus;
}

export interface SaIncomeSection {
  grossIncome: number;
  transactionCount: number;
  transactionsLink: string;
}

export interface SaExpenseGroupRow {
  groupId: string;
  label: string;
  totalAmount: number;
  transactionCount: number;
  evidenceCounts: EvidenceConfidenceCounts;
  reviewRecommendedCount: number;
  status: SaPrepStepStatus;
  hmrcCategoryIds: string[];
  transactionsLink: string;
}

export interface SaLikelyBusinessIncomeItem {
  id: string;
  amount: number;
  description: string | null;
  merchantName: string | null;
  transactionDate: string;
  ruleName: string;
  transactionsLink: string;
}

export interface SaCopySummary {
  turnover: number;
  totalAllowableExpenses: number;
  profitBeforeTax: number;
  suggestedTaxPot: number;
  categoryLines: { label: string; amount: number }[];
}

export interface SaPrepSummary {
  steps: SaPrepStepState[];
  income: SaIncomeSection;
  expenseGroups: SaExpenseGroupRow[];
  reviewItems: TaxReviewItem[];
  likelyBusinessIncome: SaLikelyBusinessIncomeItem[];
  highValueWithoutProofCount: number;
  copySummary: SaCopySummary;
  metrics: TaxOverviewMetrics;
  hasBusinessActivity: boolean;
}

export interface SaPrepData {
  taxYears: TaxYearRow[];
  selectedTaxYear: TaxYearRow | null;
  summary: SaPrepSummary | null;
}
