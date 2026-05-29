"use client";

import { useMemo } from "react";
import { Trash2 } from "lucide-react";
import { CategorisationEditPanel } from "@/components/categorization/categorisation-edit-panel";
import { UniversalCategorisationReview } from "@/components/categorization/universal-categorisation-review";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  buildDetectedFields,
  buildSuggestedFromResolved,
} from "@/lib/categorization/review-builders";
import { buildReviewContext } from "@/lib/categorization/review-confidence";
import { resolveCategoryChoice } from "@/lib/categorization/categorise-flow/resolve";
import { resolvePurposeNotSure } from "@/lib/categorization/categorise-flow/resolve";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import {
  quickAddDraftToTransactionForm,
  transactionFormToQuickAddDraft,
} from "@/lib/quick-add/draft-form";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { QuickAddDraft } from "@/lib/quick-add/types";
import type { CategoryRow } from "@/lib/categories/queries";
import { formatMoney } from "@/lib/transactions/format";
import type { TransactionDirection } from "@/types/database";

interface QuickAddDraftCardProps {
  draft: QuickAddDraft;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  currency?: string;
  dateMin?: string;
  dateMax?: string;
  editing: boolean;
  disabled?: boolean;
  /** Personal / business toggles (expense drafts). */
  showBusinessPurpose?: boolean;
  /** Footer handles confirm (e.g. voice add). */
  hideInlineConfirm?: boolean;
  onDiscard: () => void;
  onChange: (draft: QuickAddDraft) => void;
  onDoneEdit: () => void;
}

const directions: { value: TransactionDirection; label: string }[] = [
  { value: "expense", label: "Spending" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export function QuickAddDraftCard({
  draft,
  categories,
  hmrcCategories,
  currency = "GBP",
  dateMin,
  dateMax,
  editing,
  disabled,
  showBusinessPurpose = true,
  hideInlineConfirm = false,
  onDiscard,
  onChange,
  onDoneEdit,
}: QuickAddDraftCardProps) {
  const resolved = useMemo(() => {
    if (!draft.categoryChoiceId) return resolvePurposeNotSure();
    return resolveCategoryChoice(
      draft.purpose,
      draft.categoryChoiceId,
      categories,
      hmrcCategories,
      null
    );
  }, [draft, categories, hmrcCategories]);

  const suggested = buildSuggestedFromResolved(
    resolved,
    draft.purpose,
    null
  );

  const baseContext = buildReviewContext({
    detected: buildDetectedFields({
      merchant: draft.merchant_name,
      amount: formatMoney(draft.amount, currency),
      date: draft.transaction_date,
    }),
    suggested,
    direction: draft.direction,
    purpose: draft.purpose,
    isBusiness: draft.isBusiness,
    suggestion: {
      categoryId: draft.categoryId,
      categoryName: draft.categoryName,
      hmrcCategoryId: draft.hmrcCategoryId,
      isBusiness: draft.isBusiness,
      confidence: draft.confidence === "high" ? "high" : "medium",
      reason: draft.reviewRecommended ? "Review recommended" : "Parsed from your note",
      source: "pattern",
    },
    resolved,
    amountValid: draft.amount > 0,
    dateValid: Boolean(draft.transaction_date),
    merchantKnown: Boolean(draft.merchant_name),
  });

  const context = { ...baseContext, compactMode: true };

  const transactionForm = useMemo(
    () => quickAddDraftToTransactionForm(draft),
    [draft]
  );

  const expenseWithBusiness =
    showBusinessPurpose && draft.direction === "expense";

  const panelProps = {
    details: {
      merchant: draft.merchant_name,
      transactionDate: draft.transaction_date,
      amount: draft.amount > 0 ? draft.amount : null,
      paymentMethod: draft.payment_method,
    },
    onDetailsChange: (details: {
      merchant: string;
      transactionDate: string;
      amount: number | null;
      paymentMethod?: typeof draft.payment_method;
    }) =>
      onChange({
        ...draft,
        merchant_name: details.merchant,
        description: details.merchant,
        transaction_date: details.transactionDate,
        amount: details.amount ?? 0,
        payment_method: details.paymentMethod ?? draft.payment_method,
      }),
    showPaymentPicker: draft.direction === "expense",
    categoryForm: transactionForm,
    onCategoryFormChange: (form: typeof transactionForm) =>
      onChange(transactionFormToQuickAddDraft(form, draft, categories, hmrcCategories)),
    categories,
    hmrcCategories,
    showBusinessPurpose: expenseWithBusiness,
    disabled,
    idPrefix: `draft-${draft.id}`,
    dateMin,
    dateMax,
    personalCategoryChoiceId: draft.categoryChoiceId,
    onPersonalCategoryChange: (id: CategoryChoiceId) =>
      onChange({
        ...draft,
        purpose: "personal",
        categoryChoiceId: id,
      }),
  };

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Edit draft</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onDiscard}
          >
            <Trash2 className="h-4 w-4" />
            Discard
          </Button>
        </div>

        <CategorisationEditPanel
          {...panelProps}
          mode="all"
        />

        <div className="space-y-1.5">
          <Label htmlFor={`dir-${draft.id}`}>Direction</Label>
          <Select
            id={`dir-${draft.id}`}
            value={draft.direction}
            disabled={disabled}
            onChange={(e) =>
              onChange({
                ...draft,
                direction: e.target.value as TransactionDirection,
              })
            }
          >
            {directions.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </Select>
        </div>

        <Button type="button" size="sm" disabled={disabled} onClick={onDoneEdit}>
          Done editing
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <UniversalCategorisationReview
        context={context}
        onConfirm={onDoneEdit}
        confirmLabel="Looks good"
        disabled={disabled}
        hideConfirmButton={hideInlineConfirm}
        summaryPanel={
          <CategorisationEditPanel
            {...panelProps}
            mode={draft.direction === "expense" ? "all" : "details"}
          />
        }
        footerNote="You can change this anytime."
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="w-full"
        disabled={disabled}
        onClick={onDiscard}
      >
        <Trash2 className="h-4 w-4" />
        Discard
      </Button>
    </div>
  );
}
