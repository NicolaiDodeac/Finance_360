import { ensureCategoryAssignment } from "@/lib/categorization/ensure-category-assignment";
import { mergeAssistantMetadata } from "@/lib/categorization/assistant-metadata";
import {
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { transactionMatchesGroupKey } from "@/lib/categorization/groups";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import type {
  ApplyGroupResult,
  AssistantTransactionRow,
  GroupCategorisationInput,
} from "@/lib/categorization/assistant-types";
import { emptyRuleForm } from "@/lib/categorization/rule-form";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import { createClient } from "@/lib/supabase/server";

function hasAssignment(
  input: Pick<
    GroupCategorisationInput,
    "category_id" | "hmrc_category_id" | "mark_review_recommended"
  >
): boolean {
  return Boolean(
    input.mark_review_recommended ||
      input.category_id ||
      input.hmrc_category_id
  );
}

function businessUsePercentForUpdate(
  input: GroupCategorisationInput
): number | null {
  if (!input.is_business) {
    return null;
  }
  const percent = input.business_use_percent ?? 100;
  return Math.min(100, Math.max(0, percent));
}

async function ensureRuleForGroup(
  userId: string,
  matchKeyword: string,
  merchantLabel: string,
  input: GroupCategorisationInput
): Promise<CategorizationRuleRow | null> {
  if (!input.create_rule || !matchKeyword.trim()) {
    return null;
  }

  const supabase = await createClient();
  const { data: existingRules, error: listError } = await supabase
    .from("categorization_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("match_field", "both")
    .eq("match_type", "contains")
    .eq("match_value", matchKeyword.trim());

  if (listError) {
    throw new Error(listError.message);
  }

  const payload = {
    category_id: input.category_id || null,
    hmrc_category_id: input.hmrc_category_id || null,
    is_business: input.is_business ? true : null,
    is_active: true,
  };

  const exactRule = (existingRules ?? [])[0] ?? null;
  const shortLabel =
    merchantLabel.length > 36
      ? `${merchantLabel.slice(0, 36)}…`
      : merchantLabel;
  const ruleName = shortLabel ? `Remember: ${shortLabel}` : "New rule";

  if (exactRule) {
    const { data, error } = await supabase
      .from("categorization_rules")
      .update(payload)
      .eq("id", exactRule.id)
      .eq("user_id", userId)
      .select("*")
      .single();

    if (error) {
      throw new Error(error.message);
    }
    return data as CategorizationRuleRow;
  }

  const base = emptyRuleForm();
  const { data, error } = await supabase
    .from("categorization_rules")
    .insert({
      user_id: userId,
      name: ruleName,
      match_field: base.match_field,
      match_type: base.match_type,
      match_value: matchKeyword.trim(),
      category_id: payload.category_id,
      hmrc_category_id: payload.hmrc_category_id,
      is_business: payload.is_business,
      priority: 10,
      is_active: true,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CategorizationRuleRow;
}

function validateTargets(
  rows: AssistantTransactionRow[],
  groupKey: string,
  transactionIds: string[],
  strictGroupKeys?: string[]
): AssistantTransactionRow[] {
  const idSet = new Set(transactionIds);
  return rows.filter(
    (tx) =>
      idSet.has(tx.id) &&
      transactionMatchesGroupKey(tx, groupKey, strictGroupKeys)
  );
}

export async function applyGroupCategorisation(
  userId: string,
  allUncategorised: AssistantTransactionRow[],
  matchKeyword: string,
  merchantLabel: string,
  rawInput: GroupCategorisationInput
): Promise<ApplyGroupResult> {
  const input = await ensureCategoryAssignment(userId, rawInput);

  if (!hasAssignment(input)) {
    throw new Error("Choose an option to categorise this group.");
  }

  const targets = validateTargets(
    allUncategorised,
    input.groupKey,
    input.transactionIds,
    input.strict_group_keys
  );

  if (targets.length === 0) {
    return { updatedCount: 0, ruleId: null };
  }

  const rule = input.mark_review_recommended
    ? null
    : await ensureRuleForGroup(userId, matchKeyword, merchantLabel, input);

  const supabase = await createClient();
  const targetIds = targets.map((t) => t.id);

  const assistantPatch = {
    review_recommended: true,
    review_marked_at: new Date().toISOString(),
    evidence_recommendation: input.evidence_recommendation ?? undefined,
    purpose: input.purpose,
    category_choice: input.category_choice,
    income_type: input.income_type,
    rule_scope: input.rule_scope,
    counts_as_turnover: input.counts_as_turnover,
    exclude_from_income: input.exclude_from_income,
    exclude_from_spending: input.exclude_from_spending,
  };

  if (input.mark_review_recommended) {
    for (const target of targets) {
      const { error: rawError } = await supabase
        .from("transactions")
        .update({
          raw_import_data: mergeAssistantMetadata(
            target.raw_import_data,
            assistantPatch
          ),
        })
        .eq("id", target.id)
        .eq("user_id", userId);

      if (rawError) {
        throw new Error(rawError.message);
      }
    }

    return { updatedCount: targets.length, ruleId: null };
  }

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: input.category_id,
      hmrc_category_id: input.hmrc_category_id,
      is_business: input.is_business,
      business_use_percent: businessUsePercentForUpdate(input),
    })
    .in("id", targetIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  for (const target of targets) {
    let raw = target.raw_import_data;
    raw = mergeAssistantMetadata(raw, {
      review_recommended: false,
      evidence_recommendation: input.evidence_recommendation ?? undefined,
      purpose: input.purpose,
      flow_type: input.flow_type,
      category_choice: input.category_choice,
      income_type: input.income_type,
      rule_scope: input.rule_scope,
      counts_as_turnover: input.counts_as_turnover ?? false,
      exclude_from_income: input.exclude_from_income ?? false,
      exclude_from_spending: input.exclude_from_spending ?? false,
    });

    if (rule) {
      raw = mergeRawImportCategorization(
        raw,
        buildCategorizationMetadata(rule)
      );
    }

    const { error: rawError } = await supabase
      .from("transactions")
      .update({ raw_import_data: raw })
      .eq("id", target.id)
      .eq("user_id", userId);

    if (rawError) {
      throw new Error(rawError.message);
    }
  }

  if (rule) {
    await incrementRulesTimesMatched(
      userId,
      Array(targets.length).fill(rule.id)
    );
  }

  return { updatedCount: targets.length, ruleId: rule?.id ?? null };
}
