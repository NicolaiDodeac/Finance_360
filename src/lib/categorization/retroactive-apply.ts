import {
  buildCategorizationMetadata,
  mergeRawImportCategorization,
} from "@/lib/categorization/apply";
import { incrementRulesTimesMatched } from "@/lib/categorization/increment";
import { ruleFormFromTransaction } from "@/lib/categorization/rule-form";
import {
  categorizationChanged,
  filterRetroactiveTargets,
  hasCategorizationToApply,
  inferMatchKeyword,
  type CategorizationAssignment,
  type RetroactiveMatchableTransaction,
} from "@/lib/categorization/retroactive";
import type {
  CategorizationRuleRow,
  RuleMatchableTransaction,
} from "@/lib/categorization/types";
import { createClient } from "@/lib/supabase/server";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

export interface RetroactiveApplyResult {
  updatedCount: number;
  rule: CategorizationRuleRow | null;
}

async function fetchUserTransactionsForMatching(
  userId: string
): Promise<RetroactiveMatchableTransaction[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "id, description, merchant_name, direction, category_id, hmrc_category_id, is_business, raw_import_data"
    )
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as RetroactiveMatchableTransaction[];
}

async function ensureRuleForTransaction(
  userId: string,
  form: TransactionFormInput,
  label: string
): Promise<CategorizationRuleRow | null> {
  const keyword = inferMatchKeyword({
    description: form.description.trim() || null,
    merchant_name: form.merchant_name.trim() || null,
  });
  if (!keyword) {
    return null;
  }

  const supabase = await createClient();
  const { data: existingRules, error: listError } = await supabase
    .from("categorization_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("match_field", "both")
    .eq("match_type", "contains")
    .eq("match_value", keyword);

  if (listError) {
    throw new Error(listError.message);
  }

  const exactRule = (existingRules ?? [])[0] ?? null;

  const payload = {
    category_id: form.category_id || null,
    hmrc_category_id: form.hmrc_category_id || null,
    is_business: form.is_business ? true : null,
    is_active: true,
  };

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

  const ruleInput = ruleFormFromTransaction(form, label);
  const { data, error } = await supabase
    .from("categorization_rules")
    .insert({
      user_id: userId,
      name: ruleInput.name.trim(),
      match_field: ruleInput.match_field,
      match_type: ruleInput.match_type,
      match_value: ruleInput.keyword.trim(),
      category_id: ruleInput.category_id || null,
      hmrc_category_id: ruleInput.hmrc_category_id || null,
      is_business: ruleInput.is_business,
      priority: ruleInput.priority,
      is_active: ruleInput.is_active,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as CategorizationRuleRow;
}

/**
 * When the user categorizes a transaction, apply the same labels to similar
 * existing rows and ensure a categorization rule exists for future imports.
 */
export async function applyRetroactiveCategorization(
  userId: string,
  transactionId: string,
  anchor: RuleMatchableTransaction & { direction: TransactionDirection },
  before: CategorizationAssignment,
  after: CategorizationAssignment,
  form: TransactionFormInput,
  transactionLabel: string
): Promise<RetroactiveApplyResult> {
  if (
    !categorizationChanged(before, after) ||
    !hasCategorizationToApply(after)
  ) {
    return { updatedCount: 0, rule: null };
  }

  const rule = await ensureRuleForTransaction(userId, form, transactionLabel);
  const allRows = await fetchUserTransactionsForMatching(userId);
  const targets = filterRetroactiveTargets(
    allRows,
    transactionId,
    anchor,
    before,
    after
  );

  if (targets.length === 0) {
    return { updatedCount: 0, rule };
  }

  const supabase = await createClient();
  const businessUsePercent = after.is_business ? form.business_use_percent : null;
  const targetIds = targets.map((t) => t.id);

  const { error } = await supabase
    .from("transactions")
    .update({
      category_id: after.category_id,
      hmrc_category_id: after.hmrc_category_id,
      is_business: after.is_business,
      business_use_percent: after.is_business ? businessUsePercent : null,
    })
    .in("id", targetIds)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  if (rule) {
    const metadata = buildCategorizationMetadata(rule);
    for (const target of targets) {
      const existingRaw = target.raw_import_data ?? null;
      const { error: rawError } = await supabase
        .from("transactions")
        .update({
          raw_import_data: mergeRawImportCategorization(existingRaw, metadata),
        })
        .eq("id", target.id)
        .eq("user_id", userId);

      if (rawError) {
        throw new Error(rawError.message);
      }
    }
  }

  if (rule && targets.length > 0) {
    await incrementRulesTimesMatched(userId, [rule.id]);
  }

  return { updatedCount: targets.length, rule };
}
