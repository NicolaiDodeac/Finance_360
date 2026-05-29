"use client";

import { useMemo } from "react";
import { UniversalCategorisationReview } from "@/components/categorization/universal-categorisation-review";
import { TransactionCategoryFields } from "@/components/transactions/transaction-category-fields";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  buildDetectedFields,
  buildSuggestedFromResolved,
} from "@/lib/categorization/review-builders";
import { buildReviewContext } from "@/lib/categorization/review-confidence";
import { resolveCategoryChoice } from "@/lib/categorization/categorise-flow/resolve";
import {
  resolveIncomeTypeChoice,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import {
  inferChoiceIdFromForm,
  inferIncomeTypeIdFromForm,
  purposeFromForm,
} from "@/lib/transactions/category-form";
import type { TransactionFormInput } from "@/lib/transactions/types";
import { formatMoney } from "@/lib/transactions/format";

interface TransactionCategorisationReviewProps {
  form: TransactionFormInput;
  onChange: (form: TransactionFormInput) => void;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
  onSave: () => void;
  isPending?: boolean;
  confirmLabel?: string;
  currency?: string;
  variant?: "default" | "edit";
}

export function TransactionCategorisationReview({
  form,
  onChange,
  categories,
  hmrcCategories,
  disabled,
  onSave,
  isPending,
  confirmLabel = "Save changes",
  currency = "GBP",
  variant = "default",
}: TransactionCategorisationReviewProps) {
  const isIncome = form.direction === "income";
  const purpose = purposeFromForm(form);

  const category = categories.find((c) => c.id === form.category_id);
  const hmrc = hmrcCategories.find((h) => h.id === form.hmrc_category_id);

  const choiceId = useMemo(
    () => inferChoiceIdFromForm(form, categories, purpose),
    [form, categories, purpose]
  );

  const incomeTypeId = useMemo(
    () => (isIncome ? inferIncomeTypeIdFromForm(form, categories) : null),
    [form, categories, isIncome]
  );

  const resolved = useMemo(() => {
    if (isIncome && incomeTypeId) {
      return resolveIncomeTypeChoice(incomeTypeId, categories);
    }
    if (!isIncome && choiceId) {
      try {
        return resolveCategoryChoice(
          purpose,
          choiceId,
          categories,
          hmrcCategories,
          form.business_use_percent
        );
      } catch {
        return null;
      }
    }
    return null;
  }, [
    isIncome,
    incomeTypeId,
    choiceId,
    purpose,
    categories,
    hmrcCategories,
    form.business_use_percent,
  ]);

  const suggested = resolved
    ? buildSuggestedFromResolved(resolved, purpose, null)
    : {
        purposeLabel: purpose === "business" ? "Business" : "Personal",
        categoryLabel: category?.name ?? "Needs a category",
        businessPersonalLabel: form.is_business ? "Business" : "Personal",
        hmrcLabel: hmrc?.name ?? null,
        taxNote: form.is_business && hmrc ? "Tax category on file." : null,
      };

  const context = buildReviewContext({
    detected: buildDetectedFields({
      merchant: form.merchant_name || form.description,
      amount: formatMoney(form.amount, currency),
      date: form.transaction_date,
    }),
    suggested,
    direction: form.direction,
    purpose,
    isBusiness: form.is_business,
    suggestion: null,
    resolved,
    amountValid: form.amount > 0,
    dateValid: Boolean(form.transaction_date),
    merchantKnown: Boolean(form.merchant_name || form.description),
  });

  const reviewContext =
    variant === "edit" ? { ...context, compactMode: false } : context;

  const showMixedUse =
    !isIncome &&
    form.is_business &&
    choiceId === "mixed_personal_business";

  const changePanel = (
    <TransactionCategoryFields
      form={form}
      onChange={onChange}
      categories={categories}
      hmrcCategories={hmrcCategories}
      disabled={disabled}
      idPrefix="tx"
    />
  );

  const advancedPanel =
    variant === "edit" ? null : (
      <div className="space-y-4">
        {form.is_business && !isIncome ? (
          <div className="space-y-2">
            <Label htmlFor="tx-hmrc-adv">Tax category</Label>
            <Select
              id="tx-hmrc-adv"
              value={form.hmrc_category_id ?? ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...form,
                  hmrc_category_id: e.target.value || null,
                })
              }
            >
              <option value="">None</option>
              {hmrcCategories.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </Select>
          </div>
        ) : null}
        {showMixedUse ? (
          <div className="space-y-2">
            <Label htmlFor="tx-biz-pct-adv">How much was for business? (%)</Label>
            <input
              id="tx-biz-pct-adv"
              type="number"
              min={0}
              max={100}
              disabled={disabled}
              value={form.business_use_percent ?? 100}
              onChange={(e) =>
                onChange({
                  ...form,
                  business_use_percent:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
          </div>
        ) : null}
      </div>
    );

  return (
    <UniversalCategorisationReview
      context={reviewContext}
      onConfirm={onSave}
      confirmLabel={isPending ? "Saving…" : confirmLabel}
      disabled={disabled}
      isPending={isPending}
      changePanel={changePanel}
      advancedPanel={advancedPanel}
      alwaysShowChange={variant === "edit"}
      footerNote={
        variant === "edit"
          ? "Categories update when you switch personal or business."
          : "You can change this anytime."
      }
    />
  );
}
