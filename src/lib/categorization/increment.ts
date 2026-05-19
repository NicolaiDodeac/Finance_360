import { createClient } from "@/lib/supabase/server";

/** Increments times_matched for each rule id (batched per id count). */
export async function incrementRulesTimesMatched(
  userId: string,
  ruleIds: string[]
): Promise<void> {
  if (ruleIds.length === 0) {
    return;
  }

  const counts = new Map<string, number>();
  for (const id of ruleIds) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const supabase = await createClient();

  for (const [ruleId, count] of counts) {
    const { data: rule, error: fetchError } = await supabase
      .from("categorization_rules")
      .select("times_matched")
      .eq("user_id", userId)
      .eq("id", ruleId)
      .single();

    if (fetchError || !rule) {
      continue;
    }

    await supabase
      .from("categorization_rules")
      .update({ times_matched: rule.times_matched + count })
      .eq("user_id", userId)
      .eq("id", ruleId);
  }
}
