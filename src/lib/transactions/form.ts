import { getCategorizationFromRaw } from "@/lib/categorization/apply";
import type { TransactionFormInput, TransactionWithRelations } from "@/lib/transactions/types";

export function emptyTransactionForm(
  defaultAccountId: string
): TransactionFormInput {
  return {
    account_id: defaultAccountId,
    transaction_date: new Date().toISOString().slice(0, 10),
    description: "",
    merchant_name: "",
    amount: 0,
    direction: "expense",
    category_id: null,
    hmrc_category_id: null,
    is_business: false,
    business_use_percent: 100,
    notes: "",
  };
}

export function transactionToFormInput(
  tx: TransactionWithRelations
): TransactionFormInput {
  return {
    account_id: tx.account_id ?? "",
    transaction_date: tx.transaction_date,
    description: tx.description ?? "",
    merchant_name: tx.merchant_name ?? "",
    amount: Number(tx.amount),
    direction: tx.direction,
    category_id: tx.category_id,
    hmrc_category_id: tx.hmrc_category_id,
    is_business: tx.is_business,
    business_use_percent: tx.business_use_percent ?? 100,
    notes: tx.notes ?? "",
  };
}

export function needsHmrcCategory(tx: TransactionWithRelations): boolean {
  return (
    tx.is_business &&
    tx.direction === "expense" &&
    !tx.hmrc_category_id
  );
}

export function isUncategorized(tx: TransactionWithRelations): boolean {
  return !tx.category_id;
}

export function getAppliedRuleName(
  tx: TransactionWithRelations
): string | null {
  return getCategorizationFromRaw(tx.raw_import_data)?.rule_name ?? null;
}
