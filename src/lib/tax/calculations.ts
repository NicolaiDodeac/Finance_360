import {
  countEvidenceLevels,
  evaluateManyTransactions,
  toEvidenceInput,
} from "@/lib/evidence";
import type { EvidenceEvaluation } from "@/lib/evidence/types";
import {
  SUGGESTED_TAX_POT_RATE,
} from "@/lib/tax/constants";
import { buildTransactionsLink } from "@/lib/tax/links";
import {
  countsAsBusinessTurnover,
  getFlowType,
} from "@/lib/transactions/classification";
import type { TaxPaymentsRecorded } from "@/lib/tax/types";
import type {
  TaxCategoryBreakdownRow,
  TaxHubSummary,
  TaxReviewItem,
  TaxTransactionRow,
} from "@/lib/tax/types";

function sumAmounts(rows: TaxTransactionRow[]): number {
  return rows.reduce((total, row) => total + Number(row.amount), 0);
}

function isTurnoverIncome(tx: TaxTransactionRow): boolean {
  return countsAsBusinessTurnover(tx);
}

function isTaxPaymentExpense(tx: TaxTransactionRow): boolean {
  if (tx.direction !== "expense") return false;
  return getFlowType(tx) === "tax_payment";
}

function isBusinessExpense(tx: TaxTransactionRow): boolean {
  if (isTaxPaymentExpense(tx)) return false;
  return tx.is_business && tx.direction === "expense";
}

function isAllowableExpense(tx: TaxTransactionRow): boolean {
  if (!isBusinessExpense(tx) || !tx.hmrc_category_id) return false;
  return tx.hmrc_category?.is_allowable_expense === true;
}

function needsAdditionalProof(evaluation: EvidenceEvaluation | undefined): boolean {
  if (!evaluation) return false;
  return (
    evaluation.level === "review_recommended" || evaluation.level === "low"
  );
}

function buildCategoryBreakdown(
  businessExpenses: TaxTransactionRow[],
  evaluations: Map<string, EvidenceEvaluation>
): TaxCategoryBreakdownRow[] {
  const byCategory = new Map<string, TaxCategoryBreakdownRow>();

  for (const tx of businessExpenses) {
    if (!tx.hmrc_category_id || !tx.hmrc_category) continue;

    const existing = byCategory.get(tx.hmrc_category_id);
    const amount = Number(tx.amount);
    const proofGap = needsAdditionalProof(evaluations.get(tx.id)) ? 1 : 0;

    if (existing) {
      existing.totalAmount += amount;
      existing.transactionCount += 1;
      existing.additionalProofCount += proofGap;
    } else {
      byCategory.set(tx.hmrc_category_id, {
        hmrcCategoryId: tx.hmrc_category_id,
        categoryName: tx.hmrc_category.name,
        totalAmount: amount,
        transactionCount: 1,
        additionalProofCount: proofGap,
        isAllowable: tx.hmrc_category.is_allowable_expense,
      });
    }
  }

  return Array.from(byCategory.values()).sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
}

function buildReviewItems(
  taxYearId: string,
  businessExpenses: TaxTransactionRow[],
  evaluations: Map<string, EvidenceEvaluation>
): TaxReviewItem[] {
  const uncategorized = businessExpenses.filter((tx) => !tx.hmrc_category_id);
  const reviewRecommended = businessExpenses.filter((tx) => {
    const evaluation = evaluations.get(tx.id);
    return evaluation?.level === "review_recommended";
  });

  const items: TaxReviewItem[] = [];

  if (reviewRecommended.length > 0) {
    items.push({
      id: "evidence-review",
      title: "Additional proof may help",
      description:
        "These business expenses could be strengthened with a receipt, invoice, or short note.",
      count: reviewRecommended.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  if (uncategorized.length > 0) {
    items.push({
      id: "uncategorized-expenses",
      title: "Uncategorized business expenses",
      description:
        "Add an HMRC expense category so allowable costs are tracked correctly.",
      count: uncategorized.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  return items;
}

export function computeTaxHubSummary(
  taxYearId: string,
  transactions: TaxTransactionRow[],
  taxPayments: TaxPaymentsRecorded
): TaxHubSummary {
  const businessIncome = transactions.filter(isTurnoverIncome);
  const businessExpenses = transactions.filter(isBusinessExpense);
  const allowableExpenses = businessExpenses.filter(isAllowableExpense);

  const evidenceInputs = transactions.map(toEvidenceInput);
  const evaluations = evaluateManyTransactions(evidenceInputs, {
    peerTransactions: evidenceInputs,
  });
  const businessEvaluations = transactions
    .filter((tx) => tx.is_business)
    .map((tx) => evaluations.get(tx.id))
    .filter((e): e is EvidenceEvaluation => e != null);

  const grossSelfEmployedIncome = sumAmounts(businessIncome);
  const allowableBusinessExpenses = sumAmounts(allowableExpenses);
  const totalBusinessExpenses = sumAmounts(businessExpenses);
  const estimatedProfit = grossSelfEmployedIncome - allowableBusinessExpenses;
  const suggestedTaxPot = Math.max(0, estimatedProfit * SUGGESTED_TAX_POT_RATE);

  const uncategorizedBusinessExpensesCount = businessExpenses.filter(
    (tx) => !tx.hmrc_category_id
  ).length;

  return {
    metrics: {
      grossSelfEmployedIncome,
      allowableBusinessExpenses,
      totalBusinessExpenses,
      estimatedProfit,
      evidenceConfidence: countEvidenceLevels(businessEvaluations),
      uncategorizedBusinessExpensesCount,
      suggestedTaxPot,
    },
    categoryBreakdown: buildCategoryBreakdown(businessExpenses, evaluations),
    reviewItems: buildReviewItems(taxYearId, businessExpenses, evaluations),
    hasBusinessActivity:
      businessIncome.length > 0 || businessExpenses.length > 0,
    taxPayments,
  };
}
