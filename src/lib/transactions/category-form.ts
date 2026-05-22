import { choiceIdFromCategorySlug } from "@/lib/categorization/categorise-flow/prefill";
import { resolveCategoryChoice } from "@/lib/categorization/categorise-flow/resolve";
import {
  inferIncomeTypeFromCategory,
  resolveIncomeTypeChoice,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import type {
  CategorisePurpose,
  CategoryChoiceId,
} from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { ReceiptAttachedTransaction } from "@/lib/receipts/types";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionDirection } from "@/types/database";

/** Build transaction form state from a receipt-linked transaction row. */
export function attachedTransactionToFormInput(
  attached: ReceiptAttachedTransaction
): TransactionFormInput {
  return {
    account_id: attached.account_id ?? attached.account?.id ?? "",
    transaction_date: attached.transaction_date,
    description: attached.description ?? "",
    merchant_name: attached.merchant_name ?? "",
    amount: Number(attached.amount),
    direction: attached.direction as TransactionDirection,
    category_id: attached.category_id,
    hmrc_category_id: attached.hmrc_category_id,
    is_business: attached.is_business,
    business_use_percent: attached.is_business ? 100 : null,
    notes: "",
  };
}

export function purposeFromForm(
  form: TransactionFormInput
): CategorisePurpose {
  return form.is_business ? "business" : "personal";
}

export function inferChoiceIdFromForm(
  form: TransactionFormInput,
  categories: CategoryRow[],
  purpose: CategorisePurpose
): CategoryChoiceId | null {
  if (!form.category_id) return null;
  const category = categories.find((c) => c.id === form.category_id);
  if (!category?.slug) return null;
  return choiceIdFromCategorySlug(
    category.slug,
    purpose,
    form.direction
  );
}

export function inferIncomeTypeIdFromForm(
  form: TransactionFormInput,
  categories: CategoryRow[]
): IncomeTypeChoiceId | null {
  if (!form.category_id) return null;
  const category = categories.find((c) => c.id === form.category_id);
  if (!category?.slug) return null;
  return inferIncomeTypeFromCategory(category.slug, form.is_business);
}

export function applyChoiceToForm(
  form: TransactionFormInput,
  choiceId: CategoryChoiceId,
  purpose: CategorisePurpose,
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[]
): TransactionFormInput {
  const resolved = resolveCategoryChoice(
    purpose,
    choiceId,
    categories,
    hmrcCategories,
    form.business_use_percent
  );

  return {
    ...form,
    category_id: resolved.categoryId,
    hmrc_category_id: resolved.hmrcCategoryId,
    is_business: resolved.isBusiness,
    business_use_percent: resolved.businessUsePercent,
  };
}

export function applyIncomeTypeToForm(
  form: TransactionFormInput,
  incomeTypeId: IncomeTypeChoiceId,
  categories: CategoryRow[]
): TransactionFormInput {
  const resolved = resolveIncomeTypeChoice(incomeTypeId, categories);

  return {
    ...form,
    category_id: resolved.categoryId,
    hmrc_category_id: resolved.hmrcCategoryId,
    is_business: resolved.isBusiness,
    business_use_percent: resolved.businessUsePercent,
  };
}

export function applyPurposeToForm(
  form: TransactionFormInput,
  purpose: "personal" | "business",
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[]
): TransactionFormInput {
  const currentPurpose = purposeFromForm(form);
  if (currentPurpose === purpose) {
    return form;
  }

  const category = categories.find((c) => c.id === form.category_id);
  const choiceId = category?.slug
    ? choiceIdFromCategorySlug(category.slug, purpose, form.direction)
    : null;

  const base: TransactionFormInput = {
    ...form,
    is_business: purpose === "business",
    business_use_percent: purpose === "business" ? form.business_use_percent ?? 100 : null,
    hmrc_category_id: purpose === "business" ? form.hmrc_category_id : null,
  };

  if (!choiceId) {
    return {
      ...base,
      category_id: null,
      hmrc_category_id: null,
    };
  }

  return applyChoiceToForm(base, choiceId, purpose, categories, hmrcCategories);
}

export function isExpenseDirection(direction: TransactionDirection): boolean {
  return direction === "expense";
}
