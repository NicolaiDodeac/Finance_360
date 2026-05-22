import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import {
  businessExpenseChoiceFromCategorySlug,
  isCategoryChoiceId,
} from "@/lib/categorization/categorise-flow/prefill";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import { getAssistantMetadata } from "@/lib/categorization/assistant-metadata";
import { getCategorizationFromRaw } from "@/lib/categorization/apply";
import { ruleMatchesTransaction, sortRulesByPriority } from "@/lib/categorization/match";
import {
  hmrcCodeForCategoryChoice,
  resolveHmrcFromChoice,
} from "@/lib/categorization/hmrc-resolution";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { CategoryRow } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import { getCategorizationRules } from "@/lib/categorization/queries";
import { getCategories } from "@/lib/categories/queries";
import { createClient } from "@/lib/supabase/server";

export type RuleRepairSource =
  | "category_slug"
  | "assistant_choice"
  | "assistant_hmrc_code";

export interface RuleAssistantHint {
  categoryChoice?: CategoryChoiceId;
  hmrcCategoryCode?: string;
}

export interface RuleRepairCandidate {
  ruleId: string;
  ruleName: string;
  proposedHmrcCategoryId: string;
  proposedHmrcCategoryCode: string;
  proposedHmrcCategoryName: string;
  categoryChoiceId: CategoryChoiceId;
  source: RuleRepairSource;
  reason: string;
}

export interface RuleRepairSkip {
  ruleId: string;
  ruleName: string;
  reason: string;
}

export interface RuleRepairDryRunResult {
  repairable: RuleRepairCandidate[];
  skipped: RuleRepairSkip[];
  repairableCount: number;
  skippedCount: number;
}

export interface RuleRepairExecuteResult extends RuleRepairDryRunResult {
  repairedCount: number;
  transactionsUpdated: number;
}

function isRepairCandidateRule(rule: CategorizationRuleRow): boolean {
  return (
    rule.is_business === true &&
    !rule.hmrc_category_id &&
    Boolean(rule.category_id)
  );
}

function choiceFromHmrcCodeOnly(
  code: string
): CategoryChoiceId | null {
  const matches = (
    Object.entries(CHOICE_SPECS) as [CategoryChoiceId, (typeof CHOICE_SPECS)[CategoryChoiceId]][]
  ).filter(([, spec]) => spec.isBusiness && spec.hmrcCode === code);

  if (matches.length !== 1) {
    return null;
  }
  return matches[0][0];
}

function resolveRepairChoice(
  rule: CategorizationRuleRow,
  categorySlug: string | null,
  hint: RuleAssistantHint | undefined
): { choiceId: CategoryChoiceId; source: RuleRepairSource; reason: string } | null {
  if (
    hint?.categoryChoice &&
    isCategoryChoiceId(hint.categoryChoice) &&
    CHOICE_SPECS[hint.categoryChoice].isBusiness &&
    CHOICE_SPECS[hint.categoryChoice].hmrcCode
  ) {
    return {
      choiceId: hint.categoryChoice,
      source: "assistant_choice",
      reason: `From a previous categorisation (${CHOICE_SPECS[hint.categoryChoice].label}).`,
    };
  }

  if (hint?.hmrcCategoryCode) {
    const fromCode = choiceFromHmrcCodeOnly(hint.hmrcCategoryCode);
    if (fromCode) {
      return {
        choiceId: fromCode,
        source: "assistant_hmrc_code",
        reason: `From stored tax category (${hint.hmrcCategoryCode.replace(/_/g, " ")}).`,
      };
    }
  }

  const fromSlug = businessExpenseChoiceFromCategorySlug(categorySlug);
  if (fromSlug) {
    return {
      choiceId: fromSlug,
      source: "category_slug",
      reason: `From financial category mapping (${CHOICE_SPECS[fromSlug].label}).`,
    };
  }

  if (categorySlug === "other-expense") {
    return {
      choiceId: "other_business_expense",
      source: "category_slug",
      reason: "From other business expense category.",
    };
  }

  return null;
}

export function analyzeRuleForRepair(
  rule: CategorizationRuleRow,
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[],
  hint?: RuleAssistantHint
): RuleRepairCandidate | RuleRepairSkip {
  if (!isRepairCandidateRule(rule)) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: "Rule already has a tax category or is not a business expense rule.",
    };
  }

  const category = categories.find((c) => c.id === rule.category_id);
  if (!category?.slug) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: "Financial category is missing or unknown.",
    };
  }

  const resolved = resolveRepairChoice(rule, category.slug, hint);
  if (!resolved) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason:
        "Could not match this rule to a business expense option with a tax category.",
    };
  }

  const hmrcCode = hmrcCodeForCategoryChoice(resolved.choiceId);
  if (!hmrcCode) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: "This business choice does not use an HMRC tax category.",
    };
  }

  const hmrc = resolveHmrcFromChoice(hmrcCategories, hmrcCode, undefined);
  if (!hmrc) {
    return {
      ruleId: rule.id,
      ruleName: rule.name,
      reason: `HMRC category "${hmrcCode}" is not available in your database.`,
    };
  }

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    proposedHmrcCategoryId: hmrc.id,
    proposedHmrcCategoryCode: hmrc.code,
    proposedHmrcCategoryName: hmrc.name,
    categoryChoiceId: resolved.choiceId,
    source: resolved.source,
    reason: resolved.reason,
  };
}

export function dryRunRuleRepair(
  rules: CategorizationRuleRow[],
  categories: CategoryRow[],
  hmrcCategories: HmrcCategoryRow[],
  hints: Map<string, RuleAssistantHint> = new Map()
): RuleRepairDryRunResult {
  const repairable: RuleRepairCandidate[] = [];
  const skipped: RuleRepairSkip[] = [];

  for (const rule of rules) {
    if (!isRepairCandidateRule(rule)) {
      continue;
    }

    const outcome = analyzeRuleForRepair(
      rule,
      categories,
      hmrcCategories,
      hints.get(rule.id)
    );

    if ("proposedHmrcCategoryId" in outcome) {
      repairable.push(outcome);
    } else {
      skipped.push(outcome);
    }
  }

  return {
    repairable,
    skipped,
    repairableCount: repairable.length,
    skippedCount: skipped.length,
  };
}

/** Load assistant hints from transactions previously labelled by each rule. */
export async function gatherRuleAssistantHints(
  userId: string,
  rules: CategorizationRuleRow[]
): Promise<Map<string, RuleAssistantHint>> {
  const hints = new Map<string, RuleAssistantHint>();
  if (rules.length === 0) {
    return hints;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select("id, description, merchant_name, raw_import_data")
    .eq("user_id", userId)
    .eq("is_business", true)
    .not("category_id", "is", null)
    .order("transaction_date", { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(error.message);
  }

  const ruleById = new Map(rules.map((r) => [r.id, r]));

  for (const row of data ?? []) {
    const raw = row.raw_import_data as Record<string, unknown> | null;
    const assistant = getAssistantMetadata(raw);
    if (!assistant) {
      continue;
    }

    const categorization = getCategorizationFromRaw(raw);
    let matchedRule: CategorizationRuleRow | null = null;

    if (categorization?.rule_id && ruleById.has(categorization.rule_id)) {
      matchedRule = ruleById.get(categorization.rule_id) ?? null;
    } else {
      matchedRule =
        rules.find((rule) =>
          ruleMatchesTransaction(rule, {
            description: row.description,
            merchant_name: row.merchant_name,
          })
        ) ?? null;
    }

    if (!matchedRule || hints.has(matchedRule.id)) {
      continue;
    }

    const hint: RuleAssistantHint = {};
    if (
      assistant.category_choice &&
      isCategoryChoiceId(assistant.category_choice)
    ) {
      hint.categoryChoice = assistant.category_choice;
    }
    if (assistant.hmrc_category_code) {
      hint.hmrcCategoryCode = assistant.hmrc_category_code;
    }

    if (hint.categoryChoice || hint.hmrcCategoryCode) {
      hints.set(matchedRule.id, hint);
    }
  }

  return hints;
}

export async function loadRuleRepairContext(userId: string): Promise<{
  rules: CategorizationRuleRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  hints: Map<string, RuleAssistantHint>;
}> {
  const [rules, categories, hmrcCategories] = await Promise.all([
    getCategorizationRules(userId),
    getCategories(userId),
    getHmrcCategories(),
  ]);

  const candidateRules = rules.filter(isRepairCandidateRule);
  const hints = await gatherRuleAssistantHints(userId, candidateRules);

  return { rules, categories, hmrcCategories, hints };
}

export async function dryRunRuleRepairForUser(
  userId: string
): Promise<RuleRepairDryRunResult> {
  const { rules, categories, hmrcCategories, hints } =
    await loadRuleRepairContext(userId);
  return dryRunRuleRepair(rules, categories, hmrcCategories, hints);
}

export async function executeRuleRepair(
  userId: string,
  options: { applyToMatchingTransactions?: boolean } = {}
): Promise<RuleRepairExecuteResult> {
  const { rules, categories, hmrcCategories, hints } =
    await loadRuleRepairContext(userId);
  const preview = dryRunRuleRepair(rules, categories, hmrcCategories, hints);

  if (preview.repairable.length === 0) {
    return {
      ...preview,
      repairedCount: 0,
      transactionsUpdated: 0,
    };
  }

  const supabase = await createClient();
  let repairedCount = 0;

  for (const candidate of preview.repairable) {
    const { error } = await supabase
      .from("categorization_rules")
      .update({ hmrc_category_id: candidate.proposedHmrcCategoryId })
      .eq("id", candidate.ruleId)
      .eq("user_id", userId)
      .is("hmrc_category_id", null)
      .eq("is_business", true);

    if (error) {
      throw new Error(error.message);
    }
    repairedCount += 1;
  }

  let transactionsUpdated = 0;

  if (options.applyToMatchingTransactions && repairedCount > 0) {
    transactionsUpdated = await applyRepairedRulesToUncategorised(
      userId,
      preview.repairable,
      rules
    );
  }

  return {
    ...preview,
    repairedCount,
    transactionsUpdated,
  };
}

/**
 * Apply repaired rules to uncategorised expense rows that match (safe, scoped).
 */
export async function applyRepairedRulesToUncategorised(
  userId: string,
  repaired: RuleRepairCandidate[],
  allRules: CategorizationRuleRow[]
): Promise<number> {
  if (repaired.length === 0) {
    return 0;
  }

  const repairedRuleIds = new Set(repaired.map((r) => r.ruleId));
  const rulesById = new Map(
    allRules
      .filter((r) => repairedRuleIds.has(r.id))
      .map((r) => {
        const patch = repaired.find((c) => c.ruleId === r.id);
        return [
          r.id,
          {
            ...r,
            hmrc_category_id: patch?.proposedHmrcCategoryId ?? r.hmrc_category_id,
          },
        ] as const;
      })
  );

  const activeRepairedRules = sortRulesByPriority(
    [...rulesById.values()].filter(
      (r) => r.is_active && r.category_id && r.hmrc_category_id
    )
  );

  if (activeRepairedRules.length === 0) {
    return 0;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, description, merchant_name, direction, category_id, hmrc_category_id, is_business"
    )
    .eq("user_id", userId)
    .eq("direction", "expense")
    .is("category_id", null)
    .is("hmrc_category_id", null);

  if (error) {
    throw new Error(error.message);
  }

  const updatesByRule = new Map<string, string[]>();
  const assignedTxIds = new Set<string>();

  for (const rule of activeRepairedRules) {
    for (const tx of data ?? []) {
      if (assignedTxIds.has(tx.id)) {
        continue;
      }
      if (
        !ruleMatchesTransaction(rule, {
          description: tx.description,
          merchant_name: tx.merchant_name,
        })
      ) {
        continue;
      }
      assignedTxIds.add(tx.id);
      const ids = updatesByRule.get(rule.id) ?? [];
      ids.push(tx.id);
      updatesByRule.set(rule.id, ids);
    }
  }

  let transactionsUpdated = 0;

  for (const rule of activeRepairedRules) {
    const ids = updatesByRule.get(rule.id);
    if (!ids?.length) {
      continue;
    }

    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        category_id: rule.category_id,
        hmrc_category_id: rule.hmrc_category_id,
        is_business: true,
        business_use_percent: 100,
      })
      .in("id", ids)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(updateError.message);
    }

    transactionsUpdated += ids.length;
  }

  return transactionsUpdated;
}