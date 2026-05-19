import {
  countEvidenceLevels,
  evaluateManyTransactions,
  toEvidenceInput,
} from "@/lib/evidence";
import type { EvidenceConfidenceCounts, EvidenceEvaluation } from "@/lib/evidence/types";
import { getCategorizationRules } from "@/lib/categorization/queries";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import {
  SA103_EXPENSE_GROUPS,
  SA_PREP_STEPS,
} from "@/lib/self-assessment/constants";
import { findLikelyBusinessIncome } from "@/lib/self-assessment/likely-business";
import type {
  SaCopySummary,
  SaExpenseGroupRow,
  SaIncomeSection,
  SaPrepStepState,
  SaPrepStepStatus,
  SaPrepSummary,
} from "@/lib/self-assessment/types";
import { HIGH_VALUE_EXPENSE_THRESHOLD, SUGGESTED_TAX_POT_RATE } from "@/lib/tax/constants";
import { buildTransactionsLink } from "@/lib/tax/links";
import type { TaxHmrcCategoryRef, TaxReviewItem, TaxTransactionRow } from "@/lib/tax/types";

function sumAmounts(rows: TaxTransactionRow[]): number {
  return rows.reduce((total, row) => total + Number(row.amount), 0);
}

function isBusinessIncome(tx: TaxTransactionRow): boolean {
  return tx.is_business && tx.direction === "income";
}

function isBusinessExpense(tx: TaxTransactionRow): boolean {
  return tx.is_business && tx.direction === "expense";
}

function isAllowableExpense(tx: TaxTransactionRow): boolean {
  if (!isBusinessExpense(tx) || !tx.hmrc_category_id) return false;
  return tx.hmrc_category?.is_allowable_expense === true;
}

function isHighValueWithoutProof(
  tx: TaxTransactionRow,
  evaluation: EvidenceEvaluation | undefined
): boolean {
  if (!isBusinessExpense(tx)) return false;
  const amount = Number(tx.amount);
  if (amount < HIGH_VALUE_EXPENSE_THRESHOLD) return false;
  if (tx.receipt_id) return false;
  return (
    evaluation?.level === "review_recommended" || evaluation?.level === "low"
  );
}

function countEvidenceForTransactions(
  transactions: TaxTransactionRow[],
  evaluations: Map<string, EvidenceEvaluation>
): EvidenceConfidenceCounts {
  const levels = transactions
    .map((tx) => evaluations.get(tx.id))
    .filter((e): e is EvidenceEvaluation => e != null);
  return countEvidenceLevels(levels);
}

function groupStatus(
  transactionCount: number,
  reviewRecommendedCount: number,
  uncategorizedInGroup: number
): SaPrepStepStatus {
  if (transactionCount === 0) return "pending";
  if (reviewRecommendedCount > 0 || uncategorizedInGroup > 0) {
    return "review_recommended";
  }
  return "ready";
}

function buildExpenseGroups(
  taxYearId: string,
  businessExpenses: TaxTransactionRow[],
  evaluations: Map<string, EvidenceEvaluation>,
  codeToId: Map<string, string>
): SaExpenseGroupRow[] {
  return SA103_EXPENSE_GROUPS.map((group) => {
    const codeSet = new Set(group.hmrcCodes);
    const hmrcCategoryIds = group.hmrcCodes
      .map((code) => codeToId.get(code))
      .filter((id): id is string => id != null);

    const txs = businessExpenses.filter(
      (tx) => tx.hmrc_category?.code && codeSet.has(tx.hmrc_category.code)
    );

    const reviewRecommendedCount = txs.filter(
      (tx) => evaluations.get(tx.id)?.level === "review_recommended"
    ).length;

    const uncategorizedInGroup = 0;

    return {
      groupId: group.id,
      label: group.label,
      totalAmount: sumAmounts(txs),
      transactionCount: txs.length,
      evidenceCounts: countEvidenceForTransactions(txs, evaluations),
      reviewRecommendedCount,
      status: groupStatus(
        txs.length,
        reviewRecommendedCount,
        uncategorizedInGroup
      ),
      hmrcCategoryIds,
      transactionsLink: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        hmrcCategoryIds: hmrcCategoryIds.length > 0 ? hmrcCategoryIds : undefined,
      }),
    };
  });
}

function buildReviewItems(
  taxYearId: string,
  businessExpenses: TaxTransactionRow[],
  businessIncome: TaxTransactionRow[],
  evaluations: Map<string, EvidenceEvaluation>
): TaxReviewItem[] {
  const items: TaxReviewItem[] = [];

  const uncategorizedExpenses = businessExpenses.filter((tx) => !tx.category_id);
  if (uncategorizedExpenses.length > 0) {
    items.push({
      id: "uncategorized-business-expenses",
      title: "Uncategorized business expenses",
      description:
        "Add a category so your spending is easier to review and group.",
      count: uncategorizedExpenses.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  const missingHmrc = businessExpenses.filter((tx) => !tx.hmrc_category_id);
  if (missingHmrc.length > 0) {
    items.push({
      id: "missing-hmrc-category",
      title: "Business expenses without HMRC category",
      description:
        "Assign an HMRC expense line so allowable costs are grouped for your return.",
      count: missingHmrc.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  const reviewRecommended = businessExpenses.filter(
    (tx) => evaluations.get(tx.id)?.level === "review_recommended"
  );
  if (reviewRecommended.length > 0) {
    items.push({
      id: "evidence-review",
      title: "Review recommended evidence items",
      description:
        "A receipt, invoice, or short note could strengthen these records.",
      count: reviewRecommended.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  const highValueNoProof = businessExpenses.filter((tx) =>
    isHighValueWithoutProof(tx, evaluations.get(tx.id))
  );
  if (highValueNoProof.length > 0) {
    items.push({
      id: "high-value-no-proof",
      title: "Higher-value expenses without additional proof",
      description: `Business expenses of £${HIGH_VALUE_EXPENSE_THRESHOLD} or more without a linked receipt.`,
      count: highValueNoProof.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "expense",
        scope: "business",
      }),
    });
  }

  const uncategorizedIncome = businessIncome.filter((tx) => !tx.category_id);
  if (uncategorizedIncome.length > 0) {
    items.push({
      id: "uncategorized-income",
      title: "Uncategorized business income",
      description: "Label income sources so your turnover is easy to verify.",
      count: uncategorizedIncome.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "income",
        scope: "business",
      }),
    });
  }

  return items;
}

function buildSteps(
  income: SaIncomeSection,
  expenseGroups: SaExpenseGroupRow[],
  reviewItems: TaxReviewItem[],
  hasActivity: boolean
): SaPrepStepState[] {
  const expensesNeedReview = expenseGroups.some(
    (g) => g.status === "review_recommended"
  );
  const hasReviewItems = reviewItems.length > 0;

  const stepStatuses: Record<string, SaPrepStepStatus> = {
    income:
      income.transactionCount === 0
        ? hasActivity
          ? "review_recommended"
          : "pending"
        : "ready",
    expenses: expensesNeedReview ? "review_recommended" : "ready",
    evidence: hasReviewItems ? "review_recommended" : "ready",
    copy: hasActivity ? "ready" : "pending",
  };

  return SA_PREP_STEPS.map((step) => ({
    id: step.id,
    step: step.step,
    title: step.title,
    description: step.description,
    status: stepStatuses[step.id] ?? "pending",
  }));
}

function buildCopySummary(
  grossIncome: number,
  allowableExpenses: number,
  expenseGroups: SaExpenseGroupRow[]
): SaCopySummary {
  const profitBeforeTax = grossIncome - allowableExpenses;
  const categoryLines = expenseGroups
    .filter((g) => g.totalAmount > 0)
    .map((g) => ({ label: g.label, amount: g.totalAmount }));

  return {
    turnover: grossIncome,
    totalAllowableExpenses: allowableExpenses,
    profitBeforeTax,
    suggestedTaxPot: Math.max(0, profitBeforeTax * SUGGESTED_TAX_POT_RATE),
    categoryLines,
  };
}

export interface ComputeSaPrepInput {
  taxYearId: string;
  businessTransactions: TaxTransactionRow[];
  taxYearIncomeCandidates: TaxTransactionRow[];
  hmrcCategories: TaxHmrcCategoryRef[];
  rules: CategorizationRuleRow[];
}

export function computeSelfAssessmentPrepSummary(
  input: ComputeSaPrepInput
): SaPrepSummary {
  const {
    taxYearId,
    businessTransactions,
    taxYearIncomeCandidates,
    hmrcCategories,
    rules,
  } = input;

  const businessIncome = businessTransactions.filter(isBusinessIncome);
  const businessExpenses = businessTransactions.filter(isBusinessExpense);
  const allowableExpenses = businessExpenses.filter(isAllowableExpense);

  const evidenceInputs = businessTransactions.map(toEvidenceInput);
  const evaluations = evaluateManyTransactions(evidenceInputs, {
    peerTransactions: evidenceInputs,
  });

  const codeToId = new Map(
    hmrcCategories.map((c) => [c.code, c.id] as const)
  );

  const expenseGroups = buildExpenseGroups(
    taxYearId,
    businessExpenses,
    evaluations,
    codeToId
  );

  const grossIncome = sumAmounts(businessIncome);
  const allowableTotal = sumAmounts(allowableExpenses);

  const income: SaIncomeSection = {
    grossIncome,
    transactionCount: businessIncome.length,
    transactionsLink: buildTransactionsLink({
      taxYearId,
      direction: "income",
      scope: "business",
    }),
  };

  const reviewItems = buildReviewItems(
    taxYearId,
    businessExpenses,
    businessIncome,
    evaluations
  );

  const likelyBusinessIncome = findLikelyBusinessIncome(
    taxYearId,
    taxYearIncomeCandidates,
    rules
  );

  if (likelyBusinessIncome.length > 0) {
    reviewItems.push({
      id: "likely-business-income",
      title: "Income that may be business",
      description:
        "These income transactions are not marked as business, but match a rule that usually marks business income.",
      count: likelyBusinessIncome.length,
      href: buildTransactionsLink({
        taxYearId,
        direction: "income",
        scope: "personal",
      }),
    });
  }

  const highValueWithoutProofCount = businessExpenses.filter((tx) =>
    isHighValueWithoutProof(tx, evaluations.get(tx.id))
  ).length;

  const businessEvaluations = businessTransactions
    .map((tx) => evaluations.get(tx.id))
    .filter((e): e is EvidenceEvaluation => e != null);

  const hasBusinessActivity =
    businessIncome.length > 0 || businessExpenses.length > 0;

  const copySummary = buildCopySummary(
    grossIncome,
    allowableTotal,
    expenseGroups
  );

  const steps = buildSteps(income, expenseGroups, reviewItems, hasBusinessActivity);

  return {
    steps,
    income,
    expenseGroups,
    reviewItems,
    likelyBusinessIncome,
    highValueWithoutProofCount,
    copySummary,
    metrics: {
      grossSelfEmployedIncome: grossIncome,
      allowableBusinessExpenses: allowableTotal,
      totalBusinessExpenses: sumAmounts(businessExpenses),
      estimatedProfit: copySummary.profitBeforeTax,
      evidenceConfidence: countEvidenceLevels(businessEvaluations),
      uncategorizedBusinessExpensesCount: businessExpenses.filter(
        (tx) => !tx.hmrc_category_id
      ).length,
      suggestedTaxPot: copySummary.suggestedTaxPot,
    },
    hasBusinessActivity,
  };
}

/** Async wrapper used by queries — loads rules when computing prep data. */
export async function computeSelfAssessmentPrepSummaryWithRules(
  userId: string,
  input: Omit<ComputeSaPrepInput, "rules">
): Promise<SaPrepSummary> {
  const rules = await getCategorizationRules(userId, { activeOnly: true });
  return computeSelfAssessmentPrepSummary({ ...input, rules });
}
