import { createClient } from "@/lib/supabase/server";
import type { CategorizationRuleRow } from "@/lib/categorization/types";

export async function getCategorizationRules(
  userId: string,
  options?: { activeOnly?: boolean }
): Promise<CategorizationRuleRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categorization_rules")
    .select("*")
    .eq("user_id", userId)
    .order("priority", { ascending: false })
    .order("name", { ascending: true });

  if (options?.activeOnly) {
    query = query.eq("is_active", true);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

export async function getCategorizationRuleById(
  userId: string,
  ruleId: string
): Promise<CategorizationRuleRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("categorization_rules")
    .select("*")
    .eq("user_id", userId)
    .eq("id", ruleId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
