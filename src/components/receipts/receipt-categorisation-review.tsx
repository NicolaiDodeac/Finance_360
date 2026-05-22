"use client";

import { useMemo } from "react";
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
import type { ReceiptPurpose } from "@/lib/receipts/classify";
import { formatMoney, formatTransactionDate } from "@/lib/receipts/format";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface ReceiptCategorisationReviewProps {
  merchant: string | null;
  amount: number | null;
  receiptDate: string | null;
  paymentLabel: string;
  purpose: ReceiptPurpose;
  suggestion: ReceiptCreationSuggestion;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  purposePanel?: React.ReactNode;
}

export function ReceiptCategorisationReview({
  merchant,
  amount,
  receiptDate,
  paymentLabel,
  purpose,
  suggestion,
  categories,
  hmrcCategories,
  disabled,
  isPending,
  onConfirm,
  purposePanel,
}: ReceiptCategorisationReviewProps) {
  const resolved = useMemo(() => {
    if (purpose === "not_sure" || !suggestion.categoryChoiceId) {
      return resolvePurposeNotSure();
    }
    const catPurpose = purpose === "business" ? "business" : "personal";
    return resolveCategoryChoice(
      catPurpose,
      suggestion.categoryChoiceId,
      categories,
      hmrcCategories,
      100
    );
  }, [purpose, suggestion.categoryChoiceId, categories, hmrcCategories]);

  const catPurpose =
    purpose === "not_sure" ? ("not_sure" as const) : purpose === "business" ? "business" : "personal";

  const suggested = buildSuggestedFromResolved(resolved, catPurpose, null);
  suggested.categoryLabel = suggestion.categoryLabel;
  suggested.taxNote = suggestion.taxCategoryNote;
  suggested.evidenceNote = suggestion.evidenceNote;
  if (suggestion.hmrcLabel) {
    suggested.hmrcLabel = suggestion.hmrcLabel;
  }

  const context = buildReviewContext({
    detected: buildDetectedFields({
      merchant,
      amount: amount !== null ? formatMoney(amount) : null,
      paymentMethod: paymentLabel,
      date: receiptDate ? formatTransactionDate(receiptDate) : null,
    }),
    suggested,
    direction: "expense",
    purpose: catPurpose,
    isBusiness: purpose === "business",
    suggestion: null,
    resolved,
    amountValid: amount !== null && amount > 0,
    dateValid: Boolean(receiptDate),
    merchantKnown: Boolean(merchant),
  });

  return (
    <UniversalCategorisationReview
      context={context}
      onConfirm={onConfirm}
      confirmLabel={isPending ? "Saving…" : "Confirm"}
      disabled={disabled}
      isPending={isPending}
      changePanel={purposePanel}
      footerNote="Receipt saved as proof. You can change this anytime."
    />
  );
}
