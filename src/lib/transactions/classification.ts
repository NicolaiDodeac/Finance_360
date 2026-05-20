import {
  getAssistantMetadata,
  type AssistantTransactionMetadata,
} from "@/lib/categorization/assistant-metadata";
import {
  inferFlowTypeFromLegacyAssistant,
} from "@/lib/categorization/categorise-flow/flow-mappings";
import type { FlowType } from "@/lib/transactions/flow-type";
import { flowTypeBadgeLabel, isFlowType } from "@/lib/transactions/flow-type";
import type { TransactionDirection } from "@/types/database";

export type { FlowType } from "@/lib/transactions/flow-type";
export { flowTypeBadgeLabel, isFlowType } from "@/lib/transactions/flow-type";

/** Minimal fields needed for insight / analytics classification. */
export interface ClassifiableTransaction {
  direction: TransactionDirection | string;
  is_business: boolean;
  raw_import_data?: Record<string, unknown> | null;
}

export interface AssistantClassification {
  flowType: FlowType | null;
  incomeTypeId?: string;
  categoryChoice?: string;
  purpose?: string;
  countsAsTurnover: boolean;
  excludeFromIncome: boolean;
  excludeFromSpending: boolean;
  /** True when `raw_import_data.assistant` exists (any keys). */
  hasAssistantMetadata: boolean;
}

function hasClassificationFlags(
  meta: AssistantTransactionMetadata | null
): boolean {
  if (!meta) return false;
  return (
    isFlowType(meta.flow_type) ||
    meta.exclude_from_income === true ||
    meta.exclude_from_spending === true ||
    meta.counts_as_turnover === true ||
    typeof meta.income_type === "string" ||
    typeof meta.category_choice === "string"
  );
}

export function getFlowType(
  transaction: ClassifiableTransaction
): FlowType | null {
  const meta = getAssistantMetadata(transaction.raw_import_data ?? null);
  if (isFlowType(meta?.flow_type)) {
    return meta.flow_type;
  }

  return inferFlowTypeFromLegacyAssistant(
    transaction.direction,
    transaction.is_business,
    meta?.income_type,
    meta?.category_choice,
    meta?.exclude_from_income,
    meta?.exclude_from_spending,
    meta?.counts_as_turnover
  );
}

export function getAssistantClassification(
  transaction: ClassifiableTransaction
): AssistantClassification {
  const meta = getAssistantMetadata(transaction.raw_import_data ?? null);
  const hasAssistantMetadata = meta !== null && hasClassificationFlags(meta);
  const flowType = getFlowType(transaction);

  return {
    flowType,
    incomeTypeId: meta?.income_type,
    categoryChoice: meta?.category_choice,
    purpose: meta?.purpose,
    countsAsTurnover: meta?.counts_as_turnover === true,
    excludeFromIncome: meta?.exclude_from_income === true,
    excludeFromSpending: meta?.exclude_from_spending === true,
    hasAssistantMetadata,
  };
}

function legacyShouldCountAsIncome(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "income") return false;
  return !getAssistantClassification(transaction).excludeFromIncome;
}

function legacyShouldCountAsSpending(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "expense") return false;
  return !getAssistantClassification(transaction).excludeFromSpending;
}

/** Personal/business income included in money-in and income charts. */
export function shouldCountAsIncome(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "income") return false;

  const flowType = getFlowType(transaction);
  if (flowType) {
    if (transaction.is_business) {
      return flowType === "business_income";
    }
    return flowType === "income";
  }

  return legacyShouldCountAsIncome(transaction);
}

/** Expenses included in legacy money-out totals (excludes transfers, savings, etc.). */
export function shouldCountAsSpending(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "expense") return false;

  const flowType = getFlowType(transaction);
  if (flowType) {
    return flowType === "living_expense";
  }

  return legacyShouldCountAsSpending(transaction);
}

export function isLifestyleSpending(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "expense") return false;
  if (transaction.is_business) return false;

  const flowType = getFlowType(transaction);
  if (flowType) {
    return flowType === "living_expense";
  }

  return legacyShouldCountAsSpending(transaction);
}

export function isSavingsOrInvestment(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "expense") return false;

  const flowType = getFlowType(transaction);
  if (flowType) {
    return flowType === "savings" || flowType === "investment";
  }

  return false;
}

export function isDebtRepayment(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "expense") return false;
  return getFlowType(transaction) === "debt_repayment";
}

export function isTaxPayment(transaction: ClassifiableTransaction): boolean {
  if (transaction.direction !== "expense") return false;
  return getFlowType(transaction) === "tax_payment";
}

export function isTransfer(transaction: ClassifiableTransaction): boolean {
  return getFlowType(transaction) === "transfer";
}

export function shouldCountInBudget(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.is_business) return false;
  return isLifestyleSpending(transaction);
}

export function shouldCountInLifestyleSpending(
  transaction: ClassifiableTransaction
): boolean {
  return isLifestyleSpending(transaction);
}

/**
 * Self-employed turnover: business income that counts toward trading turnover.
 * When assistant metadata is absent, all business income still counts (legacy).
 */
export function countsAsBusinessTurnover(
  transaction: ClassifiableTransaction
): boolean {
  if (transaction.direction !== "income" || !transaction.is_business) {
    return false;
  }

  const flowType = getFlowType(transaction);
  if (flowType) {
    return flowType === "business_income" && getAssistantClassification(transaction).countsAsTurnover;
  }

  const meta = getAssistantMetadata(transaction.raw_import_data ?? null);
  if (meta?.counts_as_turnover === true) return true;
  if (meta?.counts_as_turnover === false) return false;
  if (meta?.income_type === "self_employed_income") return true;
  if (meta?.income_type) return false;

  return true;
}

export function isAccountTransfer(transaction: ClassifiableTransaction): boolean {
  return isTransfer(transaction);
}

/** Badge label for transaction list when excluded from insights. */
export function getInsightExclusionLabel(
  transaction: ClassifiableTransaction
): "Transfer" | "Excluded from insights" | null {
  const classification = getAssistantClassification(transaction);
  if (
    !classification.excludeFromIncome &&
    !classification.excludeFromSpending
  ) {
    return null;
  }
  if (isAccountTransfer(transaction)) {
    return "Transfer";
  }
  return "Excluded from insights";
}

export function getFlowTypeBadgeLabel(
  transaction: ClassifiableTransaction
): string | null {
  const flowType = getFlowType(transaction);
  if (!flowType) return null;
  return flowTypeBadgeLabel(flowType);
}
