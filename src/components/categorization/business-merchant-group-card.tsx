"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SearchableChoiceButtons } from "@/components/categorization/flow/searchable-choice-buttons";
import { RememberSection } from "@/components/categorization/flow/remember-section";
import { StepReview } from "@/components/categorization/flow/step-review";
import { applyMerchantGroupCategorisation } from "@/lib/categorization/assistant-actions";
import type { MerchantGroup } from "@/lib/categorization/assistant-types";
import {
  CHOICE_SPECS,
  FLOW_COPY,
  getCategoryChoices,
  getIncomeTypeChoices,
  INCOME_FLOW_COPY,
  isAmbiguousMerchant,
  isCategoryChoiceId,
  isIncomeTypeChoiceId,
  prefillFromSuggestion,
  resolveCategoryChoice,
  resolveIncomeTypeChoice,
  resolvePurposeNotSure,
  shouldCreateRule,
  type CategorisePurpose,
  type CategoryChoiceId,
  type IncomeTypeChoiceId,
  type RuleScope,
} from "@/lib/categorization/categorise-flow";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import {
  directionLabel,
  formatMoney,
  formatShortDate,
} from "@/lib/transactions/format";

type ExpenseFlowStep = 1 | 2 | 3;
type IncomeFlowStep = 1 | 2;

const PURPOSE_OPTIONS: { id: CategorisePurpose; label: string }[] = [
  { id: "personal", label: "Personal" },
  { id: "business", label: "Business" },
  { id: "not_sure", label: "Not sure" },
];

export interface CategoriseApplyFeedback {
  transactionCount: number;
  remembered: boolean;
  markReviewRecommended?: boolean;
}

interface BusinessMerchantGroupCardProps {
  group: MerchantGroup;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  onApplied: (groupKey: string, feedback?: CategoriseApplyFeedback) => void;
  onSkipped: (groupKey: string) => void;
  onSplit?: (group: MerchantGroup) => void;
  disabled?: boolean;
}

export function BusinessMerchantGroupCard({
  group,
  categories,
  hmrcCategories,
  onApplied,
  onSkipped,
  onSplit,
  disabled,
}: BusinessMerchantGroupCardProps) {
  const isIncome = group.direction === "income";
  const totalSteps = isIncome ? 2 : 3;
  const ambiguous = isAmbiguousMerchant(group.groupKey, group.merchantLabel);
  const initialPrefill = useMemo(
    () => prefillFromSuggestion(group.suggestion, categories, group.direction),
    [group.suggestion, categories, group.direction]
  );

  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [expenseStep, setExpenseStep] = useState<ExpenseFlowStep>(
    initialPrefill?.choiceId && initialPrefill.purpose ? 3 : 1
  );
  const [incomeStep, setIncomeStep] = useState<IncomeFlowStep>(
    initialPrefill?.incomeTypeId ? 2 : 1
  );
  const [purpose, setPurpose] = useState<CategorisePurpose | null>(
    initialPrefill?.purpose ?? null
  );
  const [choiceId, setChoiceId] = useState<CategoryChoiceId | null>(
    initialPrefill?.choiceId ?? null
  );
  const [incomeTypeId, setIncomeTypeId] = useState<IncomeTypeChoiceId | null>(
    initialPrefill?.incomeTypeId ?? null
  );
  const [businessUsePercent, setBusinessUsePercent] = useState(50);
  const [hmrcOverrideId, setHmrcOverrideId] = useState<string | null | undefined>(
    undefined
  );
  const [rememberEnabled, setRememberEnabled] = useState(!ambiguous);
  const [ruleScope, setRuleScope] = useState<RuleScope>(
    ambiguous ? "group_only" : "future_similar"
  );
  const [prefillReason, setPrefillReason] = useState<string | null>(
    initialPrefill?.prefillReason ?? null
  );

  useEffect(() => {
    setExpenseStep(initialPrefill?.choiceId && initialPrefill.purpose ? 3 : 1);
    setIncomeStep(initialPrefill?.incomeTypeId ? 2 : 1);
    setPurpose(initialPrefill?.purpose ?? null);
    setChoiceId(initialPrefill?.choiceId ?? null);
    setIncomeTypeId(initialPrefill?.incomeTypeId ?? null);
    setPrefillReason(initialPrefill?.prefillReason ?? null);
    setRememberEnabled(!ambiguous);
    setRuleScope(ambiguous ? "group_only" : "future_similar");
    setHmrcOverrideId(undefined);
    setError(null);
  }, [group.groupKey, initialPrefill, ambiguous]);

  const categoryChoices = useMemo(() => {
    if (!purpose || purpose === "not_sure") return [];
    return getCategoryChoices(purpose, group.direction);
  }, [purpose, group.direction]);

  const incomeTypeChoices = useMemo(() => getIncomeTypeChoices(), []);

  const resolved = useMemo(() => {
    if (isIncome) {
      if (!incomeTypeId) return null;
      if (incomeTypeId === "income_not_sure") {
        return resolvePurposeNotSure();
      }
      return resolveIncomeTypeChoice(incomeTypeId, categories);
    }

    if (purpose === "not_sure") return resolvePurposeNotSure();
    if (!purpose || !choiceId) return null;
    return resolveCategoryChoice(
      purpose,
      choiceId,
      categories,
      hmrcCategories,
      choiceId === "mixed_personal_business" ? businessUsePercent : null,
      hmrcOverrideId
    );
  }, [
    isIncome,
    incomeTypeId,
    purpose,
    choiceId,
    categories,
    hmrcCategories,
    businessUsePercent,
    hmrcOverrideId,
  ]);

  const reviewChoiceId = isIncome ? incomeTypeId : choiceId;

  function handlePurposeSelect(next: CategorisePurpose) {
    setPurpose(next);
    setChoiceId(null);
    setHmrcOverrideId(undefined);
    setPrefillReason(null);
    if (next === "not_sure") {
      setExpenseStep(1);
      return;
    }
    setExpenseStep(2);
  }

  function handleCategorySelect(id: string) {
    if (!isCategoryChoiceId(id)) return;
    setChoiceId(id);
    setHmrcOverrideId(undefined);
    setExpenseStep(3);
  }

  function handleIncomeTypeSelect(id: string) {
    if (!isIncomeTypeChoiceId(id)) return;
    setIncomeTypeId(id);
    setPrefillReason(null);
    if (id === "income_not_sure") {
      applyResolved(resolvePurposeNotSure(), false, "group_only", id);
      return;
    }
    setIncomeStep(2);
  }

  function handleMarkNotSure() {
    setPurpose("not_sure");
    applyResolved(resolvePurposeNotSure(), false, "group_only");
  }

  function applyResolved(
    mapping: ReturnType<typeof resolvePurposeNotSure>,
    remember: boolean,
    scope: RuleScope,
    incomeTypeOverride?: IncomeTypeChoiceId
  ) {
    setError(null);
    const effectiveIncomeType = incomeTypeOverride ?? incomeTypeId ?? undefined;
    startTransition(async () => {
      const createRule = shouldCreateRule(remember, scope);
      const result = await applyMerchantGroupCategorisation({
        groupKey: group.groupKey,
        strict_group_keys: group.strictGroupKeys,
        transactionIds: group.transactionIds,
        matchKeyword: group.matchKeyword,
        merchantLabel: group.merchantLabel,
        category_id: mapping.categoryId,
        hmrc_category_id: mapping.hmrcCategoryId,
        is_business: mapping.isBusiness,
        business_use_percent: mapping.businessUsePercent,
        create_rule: createRule && !mapping.markReviewRecommended,
        mark_review_recommended: mapping.markReviewRecommended,
        evidence_recommendation: mapping.evidenceRecommendation,
        purpose: mapping.purpose,
        category_choice: isIncome
          ? effectiveIncomeType
          : (choiceId ?? undefined),
        income_type: effectiveIncomeType,
        flow_type: mapping.flowType,
        counts_as_turnover: mapping.countsAsTurnover,
        exclude_from_income: mapping.excludeFromIncome,
        exclude_from_spending: mapping.excludeFromSpending,
        rule_scope: scope,
      });

      if (!result.success) {
        setError(result.error ?? "Could not apply.");
        return;
      }

      const count = result.data?.updatedCount ?? group.transactionCount;
      onApplied(group.groupKey, {
        transactionCount: count,
        remembered: createRule && !mapping.markReviewRecommended,
        markReviewRecommended: mapping.markReviewRecommended,
      });
    });
  }

  function handleConfirm() {
    if (!resolved) {
      setError("Complete the steps above first.");
      return;
    }

    if (
      resolved.requiresBusinessUsePercent &&
      (businessUsePercent <= 0 || businessUsePercent > 100)
    ) {
      setError("Enter a business use percentage between 1 and 100.");
      return;
    }

    if (!resolved.skipCategoryAssignment && !resolved.categoryId) {
      setError(
        "This category is not set up yet. Add categories in Settings or go back."
      );
      return;
    }

    if (
      !resolved.skipCategoryAssignment &&
      resolved.isBusiness &&
      resolved.purpose === "business" &&
      choiceId &&
      CHOICE_SPECS[choiceId].hmrcCode &&
      !resolved.hmrcCategoryId
    ) {
      setError(
        "Tax category needs review — pick a tax category on the review step before confirming."
      );
      return;
    }

    const effectiveRemember =
      ruleScope === "transaction_only" ? false : rememberEnabled;
    const effectiveScope: RuleScope =
      ruleScope === "transaction_only"
        ? "transaction_only"
        : rememberEnabled
          ? "future_similar"
          : "group_only";

    applyResolved(resolved, effectiveRemember, effectiveScope);
  }

  const currentStep = isIncome ? incomeStep : expenseStep;
  const stepLabel = isIncome
    ? incomeStep === 1
      ? "Income type"
      : "Review"
    : expenseStep === 1
      ? "Purpose"
      : expenseStep === 2
        ? "Category"
        : "Review";

  const showConfirm =
    isIncome
      ? incomeStep === 2 && incomeTypeId !== "income_not_sure"
      : expenseStep === 3 && purpose !== "not_sure";

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold leading-tight">
              {group.merchantLabel}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {group.transactionCount} transaction
              {group.transactionCount === 1 ? "" : "s"} ·{" "}
              {formatMoney(group.totalAmount)} ·{" "}
              {directionLabel(group.direction)}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary" className="text-xs">
              Step {currentStep} of {totalSteps} · {stepLabel}
            </Badge>
            {group.isCombined && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Combined
              </Badge>
            )}
            {group.suggestion?.source === "rule" && group.suggestion.ruleName && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                Saved rule
              </Badge>
            )}
          </div>
        </div>
        {group.isCombined && group.subgroups && group.subgroups.length > 1 && (
          <div className="space-y-2 rounded-lg border border-border/80 bg-muted/30 px-3 py-2.5">
            <p className="text-sm text-muted-foreground">
              {group.subgroups.length} similar descriptions combined (e.g. different
              reference numbers). One choice applies to all, or split if you need
              different categories.
            </p>
            {onSplit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 w-full sm:w-auto"
                disabled={disabled || isPending}
                onClick={() => onSplit(group)}
              >
                Categorise separately
              </Button>
            )}
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer font-medium text-foreground/80">
                Show descriptions ({group.subgroups.length})
              </summary>
              <ul className="mt-2 space-y-1">
                {group.subgroups.map((sub) => (
                  <li key={sub.strictKey} className="flex justify-between gap-2">
                    <span className="truncate">{sub.merchantLabel}</span>
                    <span className="shrink-0 tabular-nums">
                      {sub.transactionCount}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        )}
        <ul className="space-y-1 text-sm text-muted-foreground">
          {group.examples.map((ex) => (
            <li key={ex.id} className="flex justify-between gap-2">
              <span className="truncate">
                {formatShortDate(ex.transaction_date)}
                {ex.description ? ` · ${ex.description}` : ""}
              </span>
              <span className="shrink-0 font-medium text-foreground">
                {formatMoney(ex.amount)}
              </span>
            </li>
          ))}
          {group.transactionCount > group.examples.length && (
            <li className="text-xs">
              +{group.transactionCount - group.examples.length} more like this
            </li>
          )}
        </ul>
      </CardHeader>

      <CardContent className="space-y-4 border-t border-border pt-4">
        <p className="text-sm text-muted-foreground">{FLOW_COPY.tagline}</p>

        {isIncome && incomeStep === 1 && (
          <div className="space-y-3">
            <p className="text-base font-semibold">{INCOME_FLOW_COPY.question}</p>
            <p className="text-sm text-muted-foreground">{INCOME_FLOW_COPY.hint}</p>
            <SearchableChoiceButtons
              choices={incomeTypeChoices}
              selectedId={incomeTypeId}
              disabled={disabled || isPending}
              onSelect={handleIncomeTypeSelect}
            />
          </div>
        )}

        {!isIncome && expenseStep === 1 && (
          <div className="space-y-3">
            <p className="text-base font-semibold">
              {FLOW_COPY.expensePurposeQuestion}
            </p>
            <p className="text-sm text-muted-foreground">
              {FLOW_COPY.expensePurposeHint}
            </p>
            <div className="grid gap-2">
              {PURPOSE_OPTIONS.map((p) => (
                <Button
                  key={p.id}
                  type="button"
                  variant={purpose === p.id ? "default" : "outline"}
                  disabled={disabled || isPending}
                  className="h-auto min-h-12 justify-start px-4 py-3 text-left text-base font-medium"
                  onClick={() => handlePurposeSelect(p.id)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            {purpose === "not_sure" && (
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/40 dark:bg-amber-950/30">
                <p className="text-sm text-amber-950 dark:text-amber-100">
                  We&apos;ll flag these for review — no category forced. You can
                  skip and come back later.
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  disabled={disabled || isPending}
                  onClick={handleMarkNotSure}
                >
                  {isPending ? "Saving…" : "Mark for review"}
                </Button>
              </div>
            )}
          </div>
        )}

        {!isIncome && expenseStep === 2 && purpose && purpose !== "not_sure" && (
          <div className="space-y-3">
            <p className="text-base font-semibold">What was this?</p>
            <p className="text-sm text-muted-foreground">
              {FLOW_COPY.categoryHint}
            </p>
            <SearchableChoiceButtons
              choices={categoryChoices}
              selectedId={choiceId}
              disabled={disabled || isPending}
              onSelect={handleCategorySelect}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="px-0"
              onClick={() => setExpenseStep(1)}
            >
              ← Back
            </Button>
          </div>
        )}

        {showConfirm && resolved && reviewChoiceId && (
          <StepReview
            choiceId={reviewChoiceId}
            direction={group.direction}
            resolved={resolved}
            hmrcCategories={hmrcCategories}
            businessUsePercent={businessUsePercent}
            onBusinessUsePercentChange={setBusinessUsePercent}
            hmrcOverrideId={hmrcOverrideId}
            onHmrcOverrideChange={setHmrcOverrideId}
            prefillReason={prefillReason}
            disabled={disabled || isPending}
            merchantLabel={group.merchantLabel}
            amountLabel={formatMoney(group.totalAmount)}
            suggestion={group.suggestion}
            purpose={purpose ?? resolved.purpose}
            onConfirm={handleConfirm}
            confirmLabel={
              isPending
                ? "Applying…"
                : `Confirm for ${group.transactionCount} transaction${group.transactionCount === 1 ? "" : "s"}`
            }
            isPending={isPending}
            rememberPanel={
              <RememberSection
                merchantLabel={group.merchantLabel}
                rememberEnabled={rememberEnabled}
                onRememberChange={(on) => {
                  setRememberEnabled(on);
                  setRuleScope(on ? "future_similar" : "group_only");
                }}
                ruleScope={ruleScope}
                onRuleScopeChange={(scope) => {
                  setRuleScope(scope);
                  if (scope === "transaction_only") setRememberEnabled(false);
                  if (scope === "future_similar") setRememberEnabled(true);
                }}
                isAmbiguous={ambiguous}
                disabled={disabled || isPending}
              />
            }
            changePanel={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="px-0"
                onClick={() =>
                  isIncome ? setIncomeStep(1) : setExpenseStep(2)
                }
              >
                ← {isIncome ? "Change income type" : "Change category"}
              </Button>
            }
          />
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </CardContent>

      <div className="flex flex-col gap-2 border-t border-border bg-muted/20 p-4 sm:p-6">
        <Button
          type="button"
          variant="ghost"
          disabled={disabled || isPending}
          onClick={() => onSkipped(group.groupKey)}
          className="h-11 w-full"
        >
          Skip for now
        </Button>
      </div>
    </Card>
  );
}
