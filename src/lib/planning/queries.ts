import { createClient } from "@/lib/supabase/server";
import { buildPlanningPlan } from "@/lib/planning/calculations";
import type { PlanningPlan } from "@/lib/planning/types";
import type { SavingsGoalDetailsRow } from "@/lib/planning/types";
import type { SavingsGoalRow } from "@/lib/goals/types";

type GoalWithDetails = SavingsGoalRow & {
  savings_goal_details: SavingsGoalDetailsRow | SavingsGoalDetailsRow[] | null;
};

function normalizeDetails(
  raw: SavingsGoalDetailsRow | SavingsGoalDetailsRow[] | null
): SavingsGoalDetailsRow | null {
  if (!raw) return null;
  return Array.isArray(raw) ? raw[0] ?? null : raw;
}

export async function getPlanningPlans(spaceId: string): Promise<PlanningPlan[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("savings_goals")
    .select("*, savings_goal_details(*)")
    .eq("space_id", spaceId)
    .eq("is_completed", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  const plans: PlanningPlan[] = [];

  for (const row of (data ?? []) as GoalWithDetails[]) {
    const details = normalizeDetails(row.savings_goal_details);
    if (!details) continue;
    const goal: SavingsGoalRow = {
      id: row.id,
      user_id: row.user_id,
      space_id: row.space_id,
      name: row.name,
      target_amount: row.target_amount,
      current_amount: row.current_amount,
      currency: row.currency,
      target_date: row.target_date,
      account_id: row.account_id,
      is_completed: row.is_completed,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
    plans.push(buildPlanningPlan(goal, details));
  }

  plans.sort((a, b) => {
    const pa = a.details.priority;
    const pb = b.details.priority;
    if (pb !== pa) return pb - pa;
    return (
      new Date(b.goal.created_at).getTime() - new Date(a.goal.created_at).getTime()
    );
  });

  return plans;
}

export async function getPlanningPreview(
  spaceId: string,
  limit = 3
): Promise<PlanningPlan[]> {
  const plans = await getPlanningPlans(spaceId);
  return plans.slice(0, limit);
}

export { getSimpleGoalsWithoutDetails } from "@/lib/goals/queries";
