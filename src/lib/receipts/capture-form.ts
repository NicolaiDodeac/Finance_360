import { applyChoiceToForm } from "@/lib/transactions/category-form";
import {
  inferChoiceIdFromForm,
  purposeFromForm,
} from "@/lib/transactions/category-form";
import type { CategoryRow } from "@/lib/categories/queries";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import type { ReceiptCreationSuggestion } from "@/lib/receipts/suggest";
import type { ReceiptPurpose } from "@/lib/receipts/classify";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptPaymentMethod } from "@/types/database";

export interface ReceiptCaptureFormState {
  merchant_name: string;
  receipt_date: string;
  total_amount: number | null;
  payment_method: ReceiptPaymentMethod | null;
  purpose: ReceiptPurpose;
  categoryChoiceId: CategoryChoiceId | null;
}

export function receiptPurposeToCategorise(
  purpose: ReceiptPurpose
): CategorisePurpose {
  if (purpose === "business") return "business";
  if (purpose === "personal") return "personal";
  return "not_sure";
}

export function categorisePurposeToReceipt(
  purpose: CategorisePurpose
): ReceiptPurpose {
  if (purpose === "business") return "business";
  if (purpose === "personal") return "personal";
  return "not_sure";
}

export function receiptCaptureToTransactionForm(
  capture: ReceiptCaptureFormState,
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[],
  suggestion: ReceiptCreationSuggestion
): TransactionFormInput {
  const catPurpose = receiptPurposeToCategorise(capture.purpose);
  const effectivePurpose =
    catPurpose === "not_sure" ? "personal" : catPurpose;

  let form: TransactionFormInput = {
    account_id: "",
    transaction_date: capture.receipt_date,
    description: capture.merchant_name,
    merchant_name: capture.merchant_name,
    amount: capture.total_amount ?? 0,
    direction: "expense",
    category_id: null,
    hmrc_category_id: null,
    is_business: capture.purpose === "business",
    business_use_percent: capture.purpose === "business" ? 100 : null,
    notes: "",
  };

  const choiceId =
    capture.categoryChoiceId ?? suggestion.categoryChoiceId ?? null;

  if (choiceId && capture.purpose !== "not_sure") {
    form = applyChoiceToForm(
      form,
      choiceId,
      effectivePurpose,
      categories,
      hmrcCategories
    );
  }

  return form;
}

export function transactionFormToReceiptCapture(
  form: TransactionFormInput,
  prev: ReceiptCaptureFormState,
  categories: CategoryRow[]
): ReceiptCaptureFormState {
  const purpose = categorisePurposeToReceipt(purposeFromForm(form));
  const catPurpose = purposeFromForm(form);
  const choiceId =
    purpose === "not_sure"
      ? null
      : inferChoiceIdFromForm(form, categories, catPurpose);

  return {
    ...prev,
    merchant_name: form.merchant_name,
    receipt_date: form.transaction_date,
    total_amount: form.amount > 0 ? form.amount : null,
    purpose,
    categoryChoiceId: choiceId,
  };
}

export function receiptCaptureFormToMetadataFormData(
  capture: ReceiptCaptureFormState,
  taxYearId: string | null,
  notes: string
): FormData {
  const formData = new FormData();
  formData.set("merchant_name", capture.merchant_name);
  formData.set("receipt_date", capture.receipt_date);
  if (capture.total_amount !== null) {
    formData.set("total_amount", String(capture.total_amount));
  }
  if (capture.payment_method) {
    formData.set("payment_method", capture.payment_method);
  }
  if (taxYearId) formData.set("tax_year_id", taxYearId);
  formData.set("notes", notes);
  return formData;
}
