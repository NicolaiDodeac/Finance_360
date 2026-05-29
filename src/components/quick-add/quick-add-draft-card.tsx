"use client";

import { useMemo } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { UniversalCategorisationReview } from "@/components/categorization/universal-categorisation-review";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CategoryRow } from "@/lib/categories/queries";
import {
  getCategoryOptionLabel,
  getSelectableCategories,
} from "@/lib/categories/display";
import {
  buildDetectedFields,
  buildSuggestedFromResolved,
} from "@/lib/categorization/review-builders";
import { buildReviewContext } from "@/lib/categorization/review-confidence";
import { resolveCategoryChoice } from "@/lib/categorization/categorise-flow/resolve";
import { resolvePurposeNotSure } from "@/lib/categorization/categorise-flow/resolve";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { QuickAddDraft } from "@/lib/quick-add/types";
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
  onEdit: () => void;
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
  onEdit,
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

  const context = buildReviewContext({
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

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`date-${draft.id}`}>Date</Label>
            <Input
              id={`date-${draft.id}`}
              type="date"
              value={draft.transaction_date}
              min={dateMin}
              max={dateMax}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...draft, transaction_date: e.target.value })
              }
            />
          </div>
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
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`merchant-${draft.id}`}>Merchant / description</Label>
            <Input
              id={`merchant-${draft.id}`}
              value={draft.merchant_name}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...draft,
                  merchant_name: e.target.value,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`amount-${draft.id}`}>Amount</Label>
            <Input
              id={`amount-${draft.id}`}
              type="number"
              min={0}
              step="0.01"
              value={draft.amount || ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...draft,
                  amount: Number.parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`cat-${draft.id}`}>Category</Label>
            <Select
              id={`cat-${draft.id}`}
              value={draft.categoryId ?? ""}
              disabled={disabled}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value);
                onChange({
                  ...draft,
                  categoryId: e.target.value || null,
                  categoryName: cat?.name ?? null,
                });
              }}
            >
              <option value="">Suggested / none</option>
              {getSelectableCategories(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryOptionLabel(cat, categories)}
                </option>
              ))}
            </Select>
          </div>
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
        changePanel={
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled}
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
            Edit fields
          </Button>
        }
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
