import { createClient } from "@/lib/supabase/server";
import type { SavingsGoalRow } from "@/lib/goals/types";

export async function getActiveSavingsGoals(
  spaceId: string,
  limit = 5
): Promise<SavingsGoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("space_id", spaceId)
    .eq("is_completed", false)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavingsGoalRow[];
}

export async function getAllSavingsGoals(
  spaceId: string
): Promise<SavingsGoalRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("space_id", spaceId)
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as SavingsGoalRow[];
}
