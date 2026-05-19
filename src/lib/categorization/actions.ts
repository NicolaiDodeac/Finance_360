"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import type { CategorizationRuleFormInput } from "@/lib/categorization/types";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/transactions/types";

function validateRuleInput(
  input: CategorizationRuleFormInput
): string | null {
  if (!input.name.trim()) {
    return "Please enter a rule name.";
  }
  if (!input.keyword.trim()) {
    return "Please enter a keyword to match.";
  }
  if (!input.category_id && !input.hmrc_category_id) {
    return "Choose at least a category or HMRC category.";
  }
  return null;
}

function toDbPayload(userId: string, input: CategorizationRuleFormInput) {
  return {
    user_id: userId,
    name: input.name.trim(),
    match_field: input.match_field,
    match_type: input.match_type,
    match_value: input.keyword.trim(),
    category_id: input.category_id || null,
    hmrc_category_id: input.hmrc_category_id || null,
    is_business: input.is_business,
    priority: input.priority,
    is_active: input.is_active,
  };
}

export async function createCategorizationRule(
  input: CategorizationRuleFormInput
): Promise<ActionResult<{ id: string }>> {
  const user = await requireAuth();
  const validationError = validateRuleInput(input);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorization_rules")
    .insert(toDbPayload(user.id, input))
    .select("id")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/rules");
  return { success: true, data: { id: data.id } };
}

export async function updateCategorizationRule(
  ruleId: string,
  input: CategorizationRuleFormInput
): Promise<ActionResult> {
  const user = await requireAuth();
  const validationError = validateRuleInput(input);

  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categorization_rules")
    .update({
      name: input.name.trim(),
      match_field: input.match_field,
      match_type: input.match_type,
      match_value: input.keyword.trim(),
      category_id: input.category_id || null,
      hmrc_category_id: input.hmrc_category_id || null,
      is_business: input.is_business,
      priority: input.priority,
      is_active: input.is_active,
    })
    .eq("id", ruleId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/rules");
  revalidatePath("/transactions");
  return { success: true };
}

export async function deleteCategorizationRule(
  ruleId: string
): Promise<ActionResult> {
  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("categorization_rules")
    .delete()
    .eq("id", ruleId)
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/rules");
  return { success: true };
}
