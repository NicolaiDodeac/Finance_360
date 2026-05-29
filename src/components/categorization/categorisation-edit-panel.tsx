"use client";

import { useMemo } from "react";
import { CategoryChoiceSelect } from "@/components/shared/category-choice-select";
import { PaymentMethodPicker } from "@/components/shared/payment-method-picker";
import { TransactionCategoryFields } from "@/components/transactions/transaction-category-fields";
import { TransactionDraftDetailFields } from "@/components/shared/transaction-draft-detail-fields";
import { getCategoryChoices } from "@/lib/categorization/categorise-flow/mappings";
import { FLOW_COPY } from "@/lib/categorization/categorise-flow/mappings";
import {
  getIncomeTypeChoices,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import {
  applyChoiceToForm,
  applyIncomeTypeToForm,
  inferChoiceIdFromForm,
  purposeFromForm,
} from "@/lib/transactions/category-form";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { ReceiptPaymentMethod } from "@/types/database";
import { Button } from "@/components/ui/button";

export interface CategorisationDetailValues {
  merchant: string;
  transactionDate: string;
  amount: number | null;
  paymentMethod?: ReceiptPaymentMethod | null;
}

interface CategorisationEditPanelProps {
  details: CategorisationDetailValues;
  onDetailsChange: (details: CategorisationDetailValues) => void;
  showPaymentField?: boolean;
  /** Cash / card chips on the summary step (quick add, receipt). */
  showPaymentPicker?: boolean;
  categoryForm: TransactionFormInput;
  onCategoryFormChange: (form: TransactionFormInput) => void;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  showBusinessPurpose?: boolean;
  allowNotSure?: boolean;
  isNotSure?: boolean;
  onPickPurpose?: () => void;
  onNotSure?: () => void;
  personalCategoryChoiceId?: CategoryChoiceId | null;
  onPersonalCategoryChange?: (id: CategoryChoiceId) => void;
  disabled?: boolean;
  idPrefix?: string;
  dateMin?: string;
  dateMax?: string;
  mode?: "all" | "details" | "category";
}

export function CategorisationEditPanel({
  details,
  onDetailsChange,
  showPaymentField,
  showPaymentPicker,
  categoryForm,
  onCategoryFormChange,
  categories,
  hmrcCategories,
  showBusinessPurpose = false,
  allowNotSure,
  isNotSure,
  onPickPurpose,
  onNotSure,
  personalCategoryChoiceId,
  onPersonalCategoryChange,
  disabled,
  idPrefix = "cat",
  dateMin,
  dateMax,
  mode = "all",
}: CategorisationEditPanelProps) {
  const purpose = purposeFromForm(categoryForm);
  const isIncome = categoryForm.direction === "income";
  const choiceId = inferChoiceIdFromForm(categoryForm, categories, purpose);

  const personalCategoryChoices = useMemo(
    () => getCategoryChoices("personal", "expense"),
    []
  );

  const incomeTypeChoices = useMemo(
    () => (isIncome ? getIncomeTypeChoices() : []),
    [isIncome]
  );

  const showDetails = mode === "all" || mode === "details";
  const showCategory = mode === "all" || mode === "category";

  return (
    <div className="space-y-4">
      {showDetails ? (
        <TransactionDraftDetailFields
          idPrefix={`${idPrefix}-detail`}
          merchant={details.merchant}
          transactionDate={details.transactionDate}
          amount={details.amount}
          dateMin={dateMin}
          dateMax={dateMax}
          disabled={disabled}
          paymentMethod={details.paymentMethod}
          onMerchantChange={(merchant) =>
            onDetailsChange({ ...details, merchant })
          }
          onDateChange={(transactionDate) =>
            onDetailsChange({ ...details, transactionDate })
          }
          onAmountChange={(amount) => onDetailsChange({ ...details, amount })}
          onPaymentMethodChange={
            showPaymentField
              ? (paymentMethod) =>
                  onDetailsChange({ ...details, paymentMethod })
              : undefined
          }
        />
      ) : null}

      {showCategory ? (
        <div className="space-y-4">
          {showPaymentPicker ? (
            <PaymentMethodPicker
              value={details.paymentMethod ?? null}
              onChange={(paymentMethod) =>
                onDetailsChange({ ...details, paymentMethod })
              }
              disabled={disabled}
            />
          ) : null}

          {showBusinessPurpose && isNotSure ? (
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              disabled={disabled}
              onClick={onPickPurpose}
            >
              Pick personal or business to choose a category
            </Button>
          ) : showBusinessPurpose ? (
            <>
              <TransactionCategoryFields
                form={categoryForm}
                onChange={onCategoryFormChange}
                categories={categories}
                hmrcCategories={hmrcCategories}
                disabled={disabled}
                idPrefix={idPrefix}
                categoryInput="dropdown"
              />
            </>
          ) : isIncome ? (
            <CategoryChoiceSelect
              id={`${idPrefix}-income-type`}
              label="Income type"
              hint="Salary, self-employed, refunds, and more."
              choices={incomeTypeChoices}
              value={choiceId as CategoryChoiceId | null}
              disabled={disabled}
              onChange={(id) => {
                if (!id) return;
                onCategoryFormChange(
                  applyIncomeTypeToForm(
                    categoryForm,
                    id as IncomeTypeChoiceId,
                    categories
                  )
                );
              }}
            />
          ) : (
            <CategoryChoiceSelect
              id={`${idPrefix}-personal-cat`}
              label="Category"
              hint={FLOW_COPY.categoryHint}
              choices={personalCategoryChoices}
              value={personalCategoryChoiceId ?? null}
              disabled={disabled}
              onChange={(id) => {
                if (!id) return;
                onPersonalCategoryChange?.(id);
              }}
            />
          )}

          {showBusinessPurpose && allowNotSure && onNotSure ? (
            <button
              type="button"
              disabled={disabled}
              onClick={onNotSure}
              className={
                isNotSure
                  ? "text-xs font-medium text-foreground underline underline-offset-2"
                  : "text-xs text-muted-foreground underline-offset-2 hover:underline"
              }
            >
              Not sure yet
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
