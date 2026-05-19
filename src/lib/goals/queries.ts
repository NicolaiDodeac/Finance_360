import { createClient } from "@/lib/supabase/server";
import type { SavingsGoalRow } from "@/lib/goals/types";

export type SavingsGoalWithMeta = SavingsGoalRow & {
  hasPlanningDetails: boolean;
};

type GoalWithDetailsJoin = SavingsGoalRow & {
  savings_goal_details: { goal_id: string } | { goal_id: string }[] | null;
};

function hasDetails(
  raw: { goal_id: string } | { goal_id: string }[] | null
): boolean {
  if (!raw) return false;
  return Array.isArray(raw) ? raw.length > 0 : true;
}

function toGoalWithMeta(row: GoalWithDetailsJoin): SavingsGoalWithMeta {
  const { savings_goal_details, ...goal } = row;
  return {
    ...(goal as SavingsGoalRow),
    hasPlanningDetails: hasDetails(savings_goal_details),
  };
}

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
): Promise<SavingsGoalWithMeta[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*, savings_goal_details(goal_id)")
    .eq("space_id", spaceId)
    .order("is_completed", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as GoalWithDetailsJoin[]).map(toGoalWithMeta);
}

function withoutPlanningMeta(goal: SavingsGoalWithMeta): SavingsGoalRow {
  const { hasPlanningDetails, ...row } = goal;
  void hasPlanningDetails;
  return row;
}

export async function getSimpleGoalsWithoutDetails(
  spaceId: string
): Promise<SavingsGoalRow[]> {
  const goals = await getAllSavingsGoals(spaceId);
  return goals
    .filter((g) => !g.is_completed && !g.hasPlanningDetails)
    .map(withoutPlanningMeta);
}
