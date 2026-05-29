"use client";

import { useMemo } from "react";
import { SearchableChoiceButtons } from "@/components/categorization/flow/searchable-choice-buttons";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FLOW_COPY, getCategoryChoices } from "@/lib/categorization/categorise-flow/mappings";
import {
  getIncomeTypeChoices,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import {
  applyChoiceToForm,
  applyIncomeTypeToForm,
  applyPurposeToForm,
  inferChoiceIdFromForm,
  inferIncomeTypeIdFromForm,
  purposeFromForm,
} from "@/lib/transactions/category-form";
import type { TransactionFormInput } from "@/lib/transactions/types";

export interface TransactionCategoryFieldsProps {
  form: TransactionFormInput;
  onChange: (form: TransactionFormInput) => void;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
  /** Prefix for input ids (receipt vs transaction edit). */
  idPrefix?: string;
  className?: string;
}

export function TransactionCategoryFields({
  form,
  onChange,
  categories,
  hmrcCategories,
  disabled,
  idPrefix = "tx",
  className,
}: TransactionCategoryFieldsProps) {
  const isIncome = form.direction === "income";
  const purpose = purposeFromForm(form);

  const choiceId = useMemo(
    () => inferChoiceIdFromForm(form, categories, purpose),
    [form, categories, purpose]
  );

  const incomeTypeId = useMemo(
    () => (isIncome ? inferIncomeTypeIdFromForm(form, categories) : null),
    [form, categories, isIncome]
  );

  const categoryChoices = useMemo(
    () => (isIncome ? [] : getCategoryChoices(purpose, form.direction)),
    [isIncome, purpose, form.direction]
  );

  const incomeTypeChoices = useMemo(
    () => (isIncome ? getIncomeTypeChoices() : []),
    [isIncome]
  );

  const showMixedUse =
    !isIncome &&
    form.is_business &&
    choiceId === "mixed_personal_business";

  return (
    <div className={className ?? "space-y-4"}>
      {!isIncome ? (
        <>
          <div className="space-y-2">
            <Label>What was this for?</Label>
            <p className="text-xs text-muted-foreground">
              {FLOW_COPY.expensePurposeHint}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { id: "personal" as const, label: "Personal" },
                  { id: "business" as const, label: "Business" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  disabled={disabled}
                  className={`h-12 rounded-lg border px-3 text-sm font-medium transition-colors ${
                    (opt.id === "business" ? form.is_business : !form.is_business)
                      ? "border-primary bg-primary/10 text-foreground ring-1 ring-primary/30"
                      : "border-border text-muted-foreground hover:border-muted-foreground/40"
                  }`}
                  onClick={() =>
                    onChange(
                      applyPurposeToForm(
                        form,
                        opt.id,
                        categories,
                        hmrcCategories
                      )
                    )
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>
              {form.is_business ? "Business category" : "Personal category"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {form.is_business
                ? "Options for tax and self assessment — different from personal spending."
                : FLOW_COPY.categoryHint}
            </p>
            <SearchableChoiceButtons
              key={`${idPrefix}-${purpose}-${form.direction}`}
              choices={categoryChoices}
              selectedId={choiceId}
              disabled={disabled}
              searchPlaceholder={
                form.is_business
                  ? "Search business category…"
                  : "Search category…"
              }
              onSelect={(id) =>
                onChange(
                  applyChoiceToForm(
                    form,
                    id as CategoryChoiceId,
                    purpose,
                    categories,
                    hmrcCategories
                  )
                )
              }
            />
          </div>

          {form.is_business ? (
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
              <Label htmlFor={`${idPrefix}-hmrc`}>Tax category</Label>
              <p className="text-xs text-muted-foreground">
                Used on your tax return — we suggest one when you pick a business
                category.
              </p>
              <Select
                id={`${idPrefix}-hmrc`}
                value={form.hmrc_category_id ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...form,
                    hmrc_category_id: e.target.value || null,
                  })
                }
              >
                <option value="">Select tax category</option>
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
              <Label htmlFor={`${idPrefix}-biz-pct`}>
                How much was for business? (%)
              </Label>
              <input
                id={`${idPrefix}-biz-pct`}
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
        </>
      ) : (
        <>
          <div className="space-y-2">
            <Label>Income type</Label>
            <p className="text-xs text-muted-foreground">
              Salary, self-employed, refunds, and more — each maps to the right
              category.
            </p>
            <SearchableChoiceButtons
              key={`${idPrefix}-income`}
              choices={incomeTypeChoices}
              selectedId={incomeTypeId}
              disabled={disabled}
              searchPlaceholder="Search income type…"
              onSelect={(id) =>
                onChange(
                  applyIncomeTypeToForm(
                    form,
                    id as IncomeTypeChoiceId,
                    categories
                  )
                )
              }
            />
          </div>
          {form.is_business ? (
            <div className="space-y-2 rounded-lg border border-border/80 bg-muted/20 p-3">
              <Label htmlFor={`${idPrefix}-hmrc-income`}>Tax category</Label>
              <Select
                id={`${idPrefix}-hmrc-income`}
                value={form.hmrc_category_id ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  onChange({
                    ...form,
                    hmrc_category_id: e.target.value || null,
                  })
                }
              >
                <option value="">Select tax category</option>
                {hmrcCategories.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
