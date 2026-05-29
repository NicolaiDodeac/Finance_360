"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import { UniversalCategorisationReview } from "@/components/categorization/universal-categorisation-review";
import {
  buildReviewSummary,
  CHOICE_SPECS,
  isCategoryChoiceId,
  isIncomeTypeChoiceId,
  type CategoryChoiceId,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow";
import type { ResolvedCategorisation } from "@/lib/categorization/categorise-flow";
import {
  buildDetectedFields,
  buildSuggestedFromResolved,
} from "@/lib/categorization/review-builders";
import { buildReviewContext } from "@/lib/categorization/review-confidence";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionDirection } from "@/types/database";
import type { CategorySuggestion } from "@/lib/categorization/suggestions";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";

interface StepReviewProps {
  choiceId: CategoryChoiceId | IncomeTypeChoiceId;
  direction: TransactionDirection;
  resolved: ResolvedCategorisation;
  hmrcCategories: HmrcCategoryRow[];
  businessUsePercent: number;
  onBusinessUsePercentChange: (value: number) => void;
  hmrcOverrideId?: string | null;
  onHmrcOverrideChange: (id: string | null) => void;
  prefillReason?: string | null;
  disabled?: boolean;
  /** Merchant label for compact detected row */
  merchantLabel?: string | null;
  amountLabel?: string | null;
  suggestion?: CategorySuggestion | null;
  purpose?: CategorisePurpose;
  onConfirm?: () => void;
  confirmLabel?: string;
  isPending?: boolean;
  rememberPanel?: React.ReactNode;
  changePanel?: React.ReactNode;
}

export function StepReview({
  choiceId,
  direction,
  resolved,
  hmrcCategories,
  businessUsePercent,
  onBusinessUsePercentChange,
  hmrcOverrideId,
  onHmrcOverrideChange,
  prefillReason,
  disabled,
  merchantLabel,
  amountLabel,
  suggestion,
  purpose = resolved.purpose,
  onConfirm,
  confirmLabel,
  isPending,
  rememberPanel,
  changePanel,
}: StepReviewProps) {
  const [showHmrcPicker, setShowHmrcPicker] = useState(false);

  const showHmrcRow =
    resolved.isBusiness &&
    resolved.purpose === "business" &&
    !resolved.skipCategoryAssignment &&
    direction === "expense";

  const displayHmrcId =
    hmrcOverrideId !== undefined ? hmrcOverrideId : resolved.hmrcCategoryId;
  const displayHmrcName =
    hmrcCategories.find((h) => h.id === displayHmrcId)?.name ??
    resolved.hmrcCategoryName;

  const needsTaxReview =
    showHmrcRow &&
    isCategoryChoiceId(choiceId) &&
    Boolean(CHOICE_SPECS[choiceId].hmrcCode) &&
    !displayHmrcId;

  const summary = useMemo(
    () =>
      buildReviewSummary(
        choiceId,
        direction,
        resolved,
        hmrcCategories,
        resolved.requiresBusinessUsePercent ? businessUsePercent : null,
        hmrcOverrideId
      ),
    [
      choiceId,
      direction,
      resolved,
      hmrcCategories,
      businessUsePercent,
      hmrcOverrideId,
    ]
  );

  const isIncomeType = isIncomeTypeChoiceId(choiceId);

  const suggested = buildSuggestedFromResolved(resolved, purpose, suggestion ?? null);
  if (prefillReason && !suggested.usuallyNote) {
    suggested.usuallyNote = prefillReason;
  }

  const context = buildReviewContext({
    detected: buildDetectedFields({
      merchant: merchantLabel,
      amount: amountLabel,
    }),
    suggested,
    direction,
    purpose,
    isBusiness: resolved.isBusiness,
    suggestion: suggestion ?? null,
    resolved,
    amountValid: true,
    dateValid: true,
    merchantKnown: Boolean(merchantLabel),
  });

  const advancedPanel = (
    <div className="space-y-3 text-sm">
      <p className="leading-relaxed text-foreground">{summary}</p>
      {needsTaxReview && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Tax category needs review — choose one below before you confirm.
        </p>
      )}
      <dl className="space-y-3">
        <ReviewRow label="Category" value={resolved.categoryName ?? "—"} />
        {isIncomeType ? (
          <ReviewRow label="Income type" value={resolved.choiceLabel} />
        ) : (
          <ReviewRow
            label="Personal or business"
            value={resolved.isBusiness ? "Business" : "Personal"}
          />
        )}
        {resolved.excludeFromIncome && (
          <ReviewRow label="Income insights" value="Excluded" />
        )}
        {resolved.excludeFromSpending && (
          <ReviewRow label="Spending insights" value="Excluded" />
        )}
        {resolved.countsAsTurnover && (
          <ReviewRow label="Self-employed turnover" value="Counts" />
        )}
        {resolved.requiresBusinessUsePercent && (
          <div className="space-y-2">
            <dt className="font-medium text-foreground">How much for business?</dt>
            <dd>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={100}
                  step={1}
                  disabled={disabled}
                  value={businessUsePercent}
                  onChange={(e) =>
                    onBusinessUsePercentChange(Number(e.target.value))
                  }
                  className="min-w-0 flex-1"
                />
                <span className="w-14 shrink-0 text-right font-semibold tabular-nums">
                  {businessUsePercent}%
                </span>
              </div>
            </dd>
          </div>
        )}
        {showHmrcRow && (
          <div className="space-y-1">
            <dt className="font-medium text-foreground">Tax category</dt>
            <dd className="flex flex-wrap items-center gap-2 text-muted-foreground">
              {displayHmrcName ? (
                <span className="text-foreground">{displayHmrcName}</span>
              ) : needsTaxReview ? (
                <span className="text-amber-800 dark:text-amber-200">
                  Needs review
                </span>
              ) : (
                <span>Not required</span>
              )}
              <button
                type="button"
                className="text-xs text-primary underline-offset-2 hover:underline"
                onClick={() => setShowHmrcPicker((v) => !v)}
              >
                {showHmrcPicker ? "Hide" : "Change"}
              </button>
            </dd>
            {showHmrcPicker && (
              <Select
                value={displayHmrcId ?? ""}
                disabled={disabled}
                onChange={(e) =>
                  onHmrcOverrideChange(e.target.value || null)
                }
                className="mt-2 text-sm"
              >
                <option value="">None</option>
                {hmrcCategories.map((hmrc) => (
                  <option key={hmrc.id} value={hmrc.id}>
                    {hmrc.name}
                  </option>
                ))}
              </Select>
            )}
          </div>
        )}
      </dl>
    </div>
  );

  if (onConfirm) {
    return (
      <UniversalCategorisationReview
        context={context}
        onConfirm={onConfirm}
        confirmLabel={confirmLabel}
        disabled={disabled}
        isPending={isPending}
        changePanel={changePanel}
        advancedPanel={advancedPanel}
        rememberPanel={rememberPanel}
      />
    );
  }

  return (
    <UniversalCategorisationReview
      context={context}
      onConfirm={() => {}}
      disabled
      advancedPanel={advancedPanel}
      rememberPanel={rememberPanel}
      changePanel={changePanel}
      footerNote=""
    />
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="font-medium text-foreground">{label}</dt>
      <dd className="text-right text-muted-foreground">{value}</dd>
    </div>
  );
}
