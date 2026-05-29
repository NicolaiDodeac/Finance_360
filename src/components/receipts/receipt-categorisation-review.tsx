"use client";

import { useMemo } from "react";
import { CategorisationEditPanel } from "@/components/categorization/categorisation-edit-panel";
import { UniversalCategorisationReview } from "@/components/categorization/universal-categorisation-review";
import {
  buildDetectedFields,
  buildSuggestedFromResolved,
} from "@/lib/categorization/review-builders";
import { buildReviewContext } from "@/lib/categorization/review-confidence";
import {
  resolveCategoryChoice,
  resolvePurposeNotSure,
} from "@/lib/categorization/categorise-flow/resolve";
import type { ReceiptCreationSuggestion } from "@/lib/receipts/suggest";
import {
  receiptCaptureToTransactionForm,
  transactionFormToReceiptCapture,
  type ReceiptCaptureFormState,
} from "@/lib/receipts/capture-form";
import { formatMoney, formatTransactionDate } from "@/lib/receipts/format";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface ReceiptCategorisationReviewProps {
  captureForm: ReceiptCaptureFormState;
  onCaptureFormChange: (form: ReceiptCaptureFormState) => void;
  paymentLabel: string;
  suggestion: ReceiptCreationSuggestion;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  showBusinessPurpose?: boolean;
  showPaymentField?: boolean;
  disabled?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
}

export function ReceiptCategorisationReview({
  captureForm,
  onCaptureFormChange,
  paymentLabel,
  suggestion,
  categories,
  hmrcCategories,
  showBusinessPurpose = false,
  showPaymentField = false,
  disabled,
  isPending,
  onConfirm,
}: ReceiptCategorisationReviewProps) {
  const { merchant_name, receipt_date, total_amount, purpose } = captureForm;

  const effectiveChoiceId =
    captureForm.categoryChoiceId ?? suggestion.categoryChoiceId;

  const resolved = useMemo(() => {
    if (purpose === "not_sure" || !effectiveChoiceId) {
      return resolvePurposeNotSure();
    }
    const catPurpose = purpose === "business" ? "business" : "personal";
    return resolveCategoryChoice(
      catPurpose,
      effectiveChoiceId,
      categories,
      hmrcCategories,
      100
    );
  }, [purpose, effectiveChoiceId, categories, hmrcCategories]);

  const catPurpose =
    purpose === "not_sure"
      ? ("not_sure" as const)
      : purpose === "business"
        ? "business"
        : "personal";

  const suggested = buildSuggestedFromResolved(resolved, catPurpose, null);
  suggested.categoryLabel = suggestion.categoryLabel;
  suggested.taxNote = suggestion.taxCategoryNote;
  suggested.evidenceNote = suggestion.evidenceNote;
  if (suggestion.hmrcLabel) {
    suggested.hmrcLabel = suggestion.hmrcLabel;
  }

  const context = buildReviewContext({
    detected: buildDetectedFields({
      merchant: merchant_name || null,
      amount:
        total_amount !== null && total_amount > 0
          ? formatMoney(total_amount)
          : null,
      paymentMethod: paymentLabel,
      date: receipt_date ? formatTransactionDate(receipt_date) : null,
    }),
    suggested,
    direction: "expense",
    purpose: catPurpose,
    isBusiness: purpose === "business",
    suggestion: null,
    resolved,
    amountValid: total_amount !== null && total_amount > 0,
    dateValid: Boolean(receipt_date),
    merchantKnown: Boolean(merchant_name?.trim()),
  });

  const transactionForm = useMemo(
    () =>
      receiptCaptureToTransactionForm(
        captureForm,
        categories,
        hmrcCategories,
        suggestion
      ),
    [captureForm, categories, hmrcCategories, suggestion]
  );

  const panelProps = {
    showPaymentPicker: true,
    details: {
      merchant: captureForm.merchant_name,
      transactionDate: captureForm.receipt_date,
      amount: captureForm.total_amount,
      paymentMethod: captureForm.payment_method,
    },
    onDetailsChange: (details: {
      merchant: string;
      transactionDate: string;
      amount: number | null;
      paymentMethod?: typeof captureForm.payment_method;
    }) =>
      onCaptureFormChange({
        ...captureForm,
        merchant_name: details.merchant,
        receipt_date: details.transactionDate,
        total_amount: details.amount,
        payment_method: details.paymentMethod ?? captureForm.payment_method,
      }),
    categoryForm: transactionForm,
    onCategoryFormChange: (form: typeof transactionForm) =>
      onCaptureFormChange(
        transactionFormToReceiptCapture(form, captureForm, categories)
      ),
    categories,
    hmrcCategories,
    showBusinessPurpose,
    showPaymentField,
    disabled,
    idPrefix: "rcpt",
    allowNotSure: showBusinessPurpose,
    isNotSure: purpose === "not_sure",
    onPickPurpose: () =>
      onCaptureFormChange({ ...captureForm, purpose: "personal" }),
    onNotSure: () =>
      onCaptureFormChange({
        ...captureForm,
        purpose: "not_sure",
        categoryChoiceId: null,
      }),
    personalCategoryChoiceId: effectiveChoiceId,
    onPersonalCategoryChange: (id: CategoryChoiceId) =>
      onCaptureFormChange({
        ...captureForm,
        purpose: "personal",
        categoryChoiceId: id,
      }),
  };

  return (
    <UniversalCategorisationReview
      context={context}
      onConfirm={onConfirm}
      confirmLabel={isPending ? "Saving…" : "Create from receipt"}
      disabled={disabled}
      isPending={isPending}
      summaryPanel={<CategorisationEditPanel {...panelProps} mode="all" />}
      footerNote="Receipt saved as proof. You can change this anytime."
    />
  );
}
