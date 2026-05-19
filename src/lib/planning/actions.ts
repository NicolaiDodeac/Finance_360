"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { updateGoalProgress } from "@/lib/goals/actions";
import { roundMoney } from "@/lib/goals/calculations";
import {
  computeEmergencyFundTarget,
  computeHouseDepositTarget,
} from "@/lib/planning/calculations";
import type { SavingsGoalType } from "@/lib/planning/types";
import { getActiveSpaceContext, canManageSpace } from "@/lib/spaces/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/transactions/types";

const PLANNING_PATHS = ["/planning", "/dashboard", "/goals"] as const;

function revalidatePlanning() {
  for (const path of PLANNING_PATHS) {
    revalidatePath(path);
  }
}

function parseOptionalNumber(raw: FormDataEntryValue | null): number | null {
  if (raw === null || raw === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredPositive(
  formData: FormData,
  key: string,
  label: string
): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(formData.get(key));
  if (!Number.isFinite(n) || n <= 0) {
    return { ok: false, error: `${label} must be greater than zero.` };
  }
  return { ok: true, value: n };
}

function parseNonNegative(
  formData: FormData,
  key: string,
  label: string
): { ok: true; value: number } | { ok: false; error: string } {
  const n = Number(formData.get(key));
  if (!Number.isFinite(n) || n < 0) {
    return { ok: false, error: `${label} must be zero or more.` };
  }
  return { ok: true, value: n };
}

async function assertCanManageSpace(
  userId: string,
  spaceId: string
): Promise<ActionResult | null> {
  const canManage = await canManageSpace(userId, spaceId);
  if (!canManage) {
    return {
      success: false,
      error: "Only space owners and admins can create or edit plans in this space.",
    };
  }
  return null;
}

export async function createHouseDepositPlan(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim() || "House deposit";
  const property = parseRequiredPositive(
    formData,
    "property_price",
    "Property target price"
  );
  if (!property.ok) return { success: false, error: property.error };

  const depositPercent = Number(formData.get("deposit_percent"));
  if (!Number.isFinite(depositPercent) || depositPercent <= 0 || depositPercent > 100) {
    return { success: false, error: "Deposit percentage must be between 1 and 100." };
  }

  const current = parseNonNegative(formData, "current_amount", "Current saved");
  if (!current.ok) return { success: false, error: current.error };

  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));

  const targetAmount = computeHouseDepositTarget(property.value, depositPercent);

  return insertPlanningGoal({
    userId: user.id,
    spaceId: space.id,
    name,
    targetAmount,
    currentAmount: current.value,
    targetDate,
    goalType: "house_deposit",
    notes,
    estimatedTotalCost: property.value,
    depositPercent,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function createTripPlan(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const destination = String(formData.get("destination") ?? "").trim();
  if (!destination) {
    return { success: false, error: "Please enter a destination." };
  }

  const estimated = parseRequiredPositive(formData, "estimated_cost", "Estimated cost");
  if (!estimated.ok) return { success: false, error: estimated.error };

  const current = parseNonNegative(formData, "current_amount", "Current saved");
  if (!current.ok) return { success: false, error: current.error };

  const peopleRaw = parseOptionalNumber(formData.get("people_count"));
  const peopleCount =
    peopleRaw !== null && peopleRaw > 0 ? Math.round(peopleRaw) : null;

  const targetDate = String(formData.get("travel_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));
  const name =
    String(formData.get("name") ?? "").trim() || `Trip to ${destination}`;

  return insertPlanningGoal({
    userId: user.id,
    spaceId: space.id,
    name,
    targetAmount: estimated.value,
    currentAmount: current.value,
    targetDate,
    goalType: "trip",
    notes,
    estimatedTotalCost: estimated.value,
    destination,
    peopleCount,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function createEmergencyFundPlan(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const essentials = parseRequiredPositive(
    formData,
    "monthly_essential_expenses",
    "Monthly essential expenses"
  );
  if (!essentials.ok) return { success: false, error: essentials.error };

  const monthsRaw = Number(formData.get("target_months_cover"));
  if (!Number.isFinite(monthsRaw) || monthsRaw <= 0) {
    return { success: false, error: "Target months of cover must be greater than zero." };
  }

  const current = parseNonNegative(formData, "current_amount", "Current saved");
  if (!current.ok) return { success: false, error: current.error };

  const targetAmount = computeEmergencyFundTarget(essentials.value, monthsRaw);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));
  const name = String(formData.get("name") ?? "").trim() || "Emergency fund";

  return insertPlanningGoal({
    userId: user.id,
    spaceId: space.id,
    name,
    targetAmount,
    currentAmount: current.value,
    targetDate: String(formData.get("target_date") ?? "").trim() || null,
    goalType: "emergency_fund",
    notes,
    monthlyEssentialExpenses: essentials.value,
    targetMonthsCover: monthsRaw,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function createBigPurchasePlan(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    return { success: false, error: "Please name your purchase plan." };
  }

  const target = parseRequiredPositive(formData, "target_amount", "Target amount");
  if (!target.ok) return { success: false, error: target.error };

  const current = parseNonNegative(formData, "current_amount", "Current saved");
  if (!current.ok) return { success: false, error: current.error };

  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));
  const estimated = parseOptionalNumber(formData.get("estimated_total_cost"));

  return insertPlanningGoal({
    userId: user.id,
    spaceId: space.id,
    name,
    targetAmount: target.value,
    currentAmount: current.value,
    targetDate,
    goalType: "big_purchase",
    notes,
    estimatedTotalCost: estimated ?? target.value,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function updatePlanProgress(formData: FormData): Promise<ActionResult> {
  const result = await updateGoalProgress(formData);
  if (result.success) {
    revalidatePlanning();
  }
  return result;
}

interface InsertPlanningGoalInput {
  userId: string;
  spaceId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string | null;
  goalType: SavingsGoalType;
  notes: string | null;
  estimatedTotalCost?: number | null;
  depositPercent?: number | null;
  destination?: string | null;
  peopleCount?: number | null;
  monthlyEssentialExpenses?: number | null;
  targetMonthsCover?: number | null;
  monthlyContributionTarget?: number | null;
  priority?: number;
}

export async function enrichHouseDepositGoal(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const goalId = String(formData.get("goal_id") ?? "").trim();
  if (!goalId) return { success: false, error: "Missing goal." };

  const property = parseRequiredPositive(
    formData,
    "property_price",
    "Property target price"
  );
  if (!property.ok) return { success: false, error: property.error };

  const depositPercent = Number(formData.get("deposit_percent"));
  if (!Number.isFinite(depositPercent) || depositPercent <= 0 || depositPercent > 100) {
    return { success: false, error: "Deposit percentage must be between 1 and 100." };
  }

  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));
  const targetAmount = computeHouseDepositTarget(property.value, depositPercent);

  return enrichExistingGoal({
    goalId,
    spaceId: space.id,
    goalType: "house_deposit",
    targetAmount,
    targetDate,
    notes,
    estimatedTotalCost: property.value,
    depositPercent,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function enrichTripGoal(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const goalId = String(formData.get("goal_id") ?? "").trim();
  if (!goalId) return { success: false, error: "Missing goal." };

  const destination = String(formData.get("destination") ?? "").trim();
  if (!destination) {
    return { success: false, error: "Please enter a destination." };
  }

  const estimated = parseRequiredPositive(formData, "estimated_cost", "Estimated cost");
  if (!estimated.ok) return { success: false, error: estimated.error };

  const peopleRaw = parseOptionalNumber(formData.get("people_count"));
  const peopleCount =
    peopleRaw !== null && peopleRaw > 0 ? Math.round(peopleRaw) : null;

  const targetDate = String(formData.get("travel_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));

  return enrichExistingGoal({
    goalId,
    spaceId: space.id,
    goalType: "trip",
    targetAmount: estimated.value,
    targetDate,
    notes,
    estimatedTotalCost: estimated.value,
    destination,
    peopleCount,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function enrichEmergencyFundGoal(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const goalId = String(formData.get("goal_id") ?? "").trim();
  if (!goalId) return { success: false, error: "Missing goal." };

  const essentials = parseRequiredPositive(
    formData,
    "monthly_essential_expenses",
    "Monthly essential expenses"
  );
  if (!essentials.ok) return { success: false, error: essentials.error };

  const monthsRaw = Number(formData.get("target_months_cover"));
  if (!Number.isFinite(monthsRaw) || monthsRaw <= 0) {
    return { success: false, error: "Target months of cover must be greater than zero." };
  }

  const targetAmount = computeEmergencyFundTarget(essentials.value, monthsRaw);
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));

  return enrichExistingGoal({
    goalId,
    spaceId: space.id,
    goalType: "emergency_fund",
    targetAmount,
    targetDate: String(formData.get("target_date") ?? "").trim() || null,
    notes,
    monthlyEssentialExpenses: essentials.value,
    targetMonthsCover: monthsRaw,
    monthlyContributionTarget: monthlyTarget,
  });
}

export async function enrichBigPurchaseGoal(
  formData: FormData
): Promise<ActionResult> {
  const user = await requireAuth();
  const { space } = await getActiveSpaceContext(user.id);
  const denied = await assertCanManageSpace(user.id, space.id);
  if (denied) return denied;

  const goalId = String(formData.get("goal_id") ?? "").trim();
  if (!goalId) return { success: false, error: "Missing goal." };

  const target = parseRequiredPositive(formData, "target_amount", "Target amount");
  if (!target.ok) return { success: false, error: target.error };

  const targetDate = String(formData.get("target_date") ?? "").trim() || null;
  const notes = String(formData.get("notes") ?? "").trim() || null;
  const monthlyTarget = parseOptionalNumber(formData.get("monthly_contribution_target"));
  const estimated = parseOptionalNumber(formData.get("estimated_total_cost"));

  return enrichExistingGoal({
    goalId,
    spaceId: space.id,
    goalType: "big_purchase",
    targetAmount: target.value,
    targetDate,
    notes,
    estimatedTotalCost: estimated ?? target.value,
    monthlyContributionTarget: monthlyTarget,
  });
}

interface EnrichExistingGoalInput {
  goalId: string;
  spaceId: string;
  goalType: SavingsGoalType;
  targetAmount?: number;
  targetDate?: string | null;
  notes: string | null;
  estimatedTotalCost?: number | null;
  depositPercent?: number | null;
  destination?: string | null;
  peopleCount?: number | null;
  monthlyEssentialExpenses?: number | null;
  targetMonthsCover?: number | null;
  monthlyContributionTarget?: number | null;
}

async function enrichExistingGoal(
  input: EnrichExistingGoalInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("id")
    .eq("id", input.goalId)
    .eq("space_id", input.spaceId)
    .eq("is_completed", false)
    .maybeSingle();

  if (goalError || !goal) {
    return { success: false, error: "Goal not found or already completed." };
  }

  const { data: existingDetails } = await supabase
    .from("savings_goal_details")
    .select("goal_id")
    .eq("goal_id", input.goalId)
    .maybeSingle();

  if (existingDetails) {
    return { success: false, error: "This goal already has planning details." };
  }

  const goalUpdate: {
    target_amount?: number;
    target_date?: string | null;
  } = {};
  if (input.targetAmount !== undefined) {
    goalUpdate.target_amount = roundMoney(input.targetAmount);
  }
  if (input.targetDate !== undefined) {
    goalUpdate.target_date = input.targetDate;
  }

  if (Object.keys(goalUpdate).length > 0) {
    const { error: updateError } = await supabase
      .from("savings_goals")
      .update(goalUpdate)
      .eq("id", input.goalId)
      .eq("space_id", input.spaceId);

    if (updateError) {
      return { success: false, error: updateError.message };
    }
  }

  const { error: detailsError } = await supabase.from("savings_goal_details").insert({
    goal_id: input.goalId,
    goal_type: input.goalType,
    notes: input.notes,
    estimated_total_cost: input.estimatedTotalCost ?? null,
    deposit_percent: input.depositPercent ?? null,
    destination: input.destination ?? null,
    people_count: input.peopleCount ?? null,
    priority: 0,
    monthly_contribution_target: input.monthlyContributionTarget ?? null,
    monthly_essential_expenses: input.monthlyEssentialExpenses ?? null,
    target_months_cover: input.targetMonthsCover ?? null,
  });

  if (detailsError) {
    return { success: false, error: detailsError.message };
  }

  revalidatePlanning();
  return { success: true };
}

async function insertPlanningGoal(
  input: InsertPlanningGoalInput
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .insert({
      user_id: input.userId,
      space_id: input.spaceId,
      name: input.name,
      target_amount: roundMoney(input.targetAmount),
      current_amount: roundMoney(input.currentAmount),
      currency: "GBP",
      target_date: input.targetDate,
    })
    .select("id")
    .single();

  if (goalError || !goal) {
    return { success: false, error: goalError?.message ?? "Could not create plan." };
  }

  const { error: detailsError } = await supabase.from("savings_goal_details").insert({
    goal_id: goal.id,
    goal_type: input.goalType,
    notes: input.notes,
    estimated_total_cost: input.estimatedTotalCost ?? null,
    deposit_percent: input.depositPercent ?? null,
    destination: input.destination ?? null,
    people_count: input.peopleCount ?? null,
    priority: input.priority ?? 0,
    monthly_contribution_target: input.monthlyContributionTarget ?? null,
    monthly_essential_expenses: input.monthlyEssentialExpenses ?? null,
    target_months_cover: input.targetMonthsCover ?? null,
  });

  if (detailsError) {
    await supabase.from("savings_goals").delete().eq("id", goal.id);
    return { success: false, error: detailsError.message };
  }

  revalidatePlanning();
  return { success: true };
}
