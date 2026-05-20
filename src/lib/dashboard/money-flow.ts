import type { FinanceMode } from "@/lib/profile/types";
import { showsBusinessFeatures } from "@/lib/profile/types";
import {
  countsAsBusinessTurnover,
  getAssistantClassification,
  getFlowType,
  isDebtRepayment,
  isLifestyleSpending,
  isSavingsOrInvestment,
  isTaxPayment,
  isTransfer,
  shouldCountAsIncome,
} from "@/lib/transactions/classification";
import type { TransactionWithRelations } from "@/lib/transactions/types";
import type { DashboardMoneyFlow } from "@/lib/dashboard/types";

function sumAmount(
  rows: TransactionWithRelations[],
  predicate: (tx: TransactionWithRelations) => boolean
): number {
  return rows
    .filter(predicate)
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

/** Personal income — not business turnover, not transfers/refunds when excluded. */
export function isPersonalIncome(tx: TransactionWithRelations): boolean {
  if (tx.direction !== "income" || tx.is_business) return false;

  const flowType = getFlowType(tx);
  if (flowType === "business_income" || flowType === "transfer" || flowType === "refund") {
    return false;
  }

  const { excludeFromIncome, countsAsTurnover } = getAssistantClassification(tx);
  if (excludeFromIncome || countsAsTurnover) return false;

  if (flowType) return flowType === "income";

  return shouldCountAsIncome(tx);
}

/** Business turnover income for the selected period. */
export function isBusinessIncome(tx: TransactionWithRelations): boolean {
  return countsAsBusinessTurnover(tx);
}

/** Lifestyle spending on personal (non-business) transactions. */
export function isPersonalSpending(tx: TransactionWithRelations): boolean {
  return isLifestyleSpending(tx);
}

/**
 * Business costs — `business_expense` or business-flagged expenses,
 * excluding tax, debt, savings, and transfers.
 */
export function isBusinessExpense(tx: TransactionWithRelations): boolean {
  if (tx.direction !== "expense") return false;
  if (
    isTransfer(tx) ||
    isTaxPayment(tx) ||
    isDebtRepayment(tx) ||
    isSavingsOrInvestment(tx)
  ) {
    return false;
  }

  const flowType = getFlowType(tx);
  if (flowType === "business_expense") return true;
  if (!tx.is_business) return false;

  if (flowType) {
    return flowType === "living_expense" || flowType === "other";
  }

  return !getAssistantClassification(tx).excludeFromSpending;
}

/** Transfers and other movements excluded from income/spending totals. */
export function isTransferExcluded(tx: TransactionWithRelations): boolean {
  if (isTransfer(tx)) return true;
  const { excludeFromIncome, excludeFromSpending } = getAssistantClassification(tx);
  return excludeFromIncome || excludeFromSpending;
}

export function buildDashboardMoneyFlow(
  monthTransactions: TransactionWithRelations[],
  financeMode: FinanceMode
): DashboardMoneyFlow {
  const showBusinessBreakdown = showsBusinessFeatures(financeMode);

  return {
    income: sumAmount(monthTransactions, isPersonalIncome),
    personalSpending: sumAmount(monthTransactions, isPersonalSpending),
    businessIncome: showBusinessBreakdown
      ? sumAmount(monthTransactions, isBusinessIncome)
      : 0,
    businessExpenses: showBusinessBreakdown
      ? sumAmount(monthTransactions, isBusinessExpense)
      : 0,
    savedOrInvested: sumAmount(monthTransactions, isSavingsOrInvestment),
    debtRepaid: sumAmount(monthTransactions, isDebtRepayment),
    taxPaid: sumAmount(monthTransactions, isTaxPayment),
    transfersExcluded: sumAmount(monthTransactions, isTransferExcluded),
    showBusinessBreakdown,
  };
}
