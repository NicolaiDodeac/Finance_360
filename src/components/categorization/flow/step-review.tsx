"use client";

import { useMemo, useState } from "react";
import { Select } from "@/components/ui/select";
import {
  buildReviewSummary,
  CHOICE_SPECS,
  isCategoryChoiceId,
  isIncomeTypeChoiceId,
  type CategoryChoiceId,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow";
import type { ResolvedCategorisation } from "@/lib/categorization/categorise-flow";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionDirection } from "@/types/database";

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

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
      <div>
        <h4 className="text-sm font-semibold text-foreground">Review and confirm</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Check the summary below — you can change the tax category if needed.
        </p>
      </div>

      <p className="rounded-lg border border-primary/15 bg-primary/5 px-3 py-3 text-sm leading-relaxed text-foreground">
        {summary}
      </p>

      {needsTaxReview && (
        <p className="rounded-lg border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-950 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Tax category needs review — choose a tax category below before you
          confirm.
        </p>
      )}

      {prefillReason && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          {prefillReason}
        </p>
      )}

      <details className="group text-sm">
        <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
          Show details
        </summary>
        <dl className="mt-3 space-y-3 border-t border-border pt-3">
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
              <dt className="font-medium text-foreground">Business use</dt>
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
                    Tax category needs review
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
      </details>

      {resolved.evidenceRecommendation && (
        <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Evidence: </span>
          {resolved.evidenceRecommendation}
        </p>
      )}
    </div>
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
