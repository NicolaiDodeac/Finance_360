import { applyChoiceToForm } from "@/lib/transactions/category-form";
import {
  inferChoiceIdFromForm,
  purposeFromForm,
} from "@/lib/transactions/category-form";
import type { CategoryRow } from "@/lib/categories/queries";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { QuickAddDraft } from "@/lib/quick-add/types";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

export function quickAddDraftToTransactionForm(draft: QuickAddDraft): TransactionFormInput {
  return {
    account_id: "",
    transaction_date: draft.transaction_date,
    description: draft.description,
    merchant_name: draft.merchant_name,
    amount: draft.amount,
    direction: draft.direction,
    category_id: draft.categoryId,
    hmrc_category_id: draft.hmrcCategoryId,
    is_business: draft.isBusiness,
    business_use_percent: draft.isBusiness ? 100 : null,
    notes: "",
  };
}

export function transactionFormToQuickAddDraft(
  form: TransactionFormInput,
  prev: QuickAddDraft,
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[]
): QuickAddDraft {
  const purpose = purposeFromForm(form);
  const choiceId =
    form.direction === "income"
      ? prev.categoryChoiceId
      : inferChoiceIdFromForm(form, categories, purpose);

  let next = {
    ...prev,
    merchant_name: form.merchant_name,
    description: form.description || form.merchant_name,
    transaction_date: form.transaction_date,
    amount: form.amount,
    direction: form.direction,
    purpose,
    isBusiness: form.is_business,
    categoryChoiceId: choiceId,
    categoryId: form.category_id,
    hmrcCategoryId: form.hmrc_category_id,
  };

  if (choiceId && form.direction === "expense") {
    const patched = applyChoiceToForm(
      form,
      choiceId,
      purpose,
      categories,
      hmrcCategories
    );
    const cat = categories.find((c) => c.id === patched.category_id);
    const hmrc = hmrcCategories.find((h) => h.id === patched.hmrc_category_id);
    next = {
      ...next,
      categoryId: patched.category_id,
      categoryName: cat?.name ?? null,
      hmrcCategoryId: patched.hmrc_category_id,
      hmrcCategoryName: hmrc?.name ?? null,
      hmrcCategoryCode: hmrc?.code ?? null,
      isBusiness: patched.is_business,
    };
  }

  return next;
}

export function quickAddDraftPurposeChoiceId(
  draft: QuickAddDraft
): CategoryChoiceId | null {
  return draft.categoryChoiceId;
}
