"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { getActiveSpaceContext, canManageSpace } from "@/lib/spaces/queries";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/transactions/types";

export async function createSavingsGoal(formData: FormData): Promise<ActionResult> {
  const user = await requireAuth();
  const name = String(formData.get("name") ?? "").trim();
  const targetRaw = Number(formData.get("target_amount"));
  const spaceIdFromForm = String(formData.get("space_id") ?? "").trim();

  if (!name) {
    return { success: false, error: "Please enter a goal name." };
  }
  if (!Number.isFinite(targetRaw) || targetRaw <= 0) {
    return { success: false, error: "Target amount must be greater than zero." };
  }

  const { space } = await getActiveSpaceContext(user.id);
  const spaceId = spaceIdFromForm || space.id;

  if (spaceId !== space.id) {
    return { success: false, error: "Invalid space for this goal." };
  }

  const canManage = await canManageSpace(user.id, spaceId);
  if (!canManage) {
    return {
      success: false,
      error: "Only space owners and admins can create goals in a shared space.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("savings_goals").insert({
    user_id: user.id,
    space_id: spaceId,
    name,
    target_amount: targetRaw,
    current_amount: 0,
    currency: "GBP",
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/goals");
  revalidatePath("/planning");
  revalidatePath("/dashboard");

  return { success: true };
}

/** Form-friendly wrapper (Next form actions expect void). */
export async function createSavingsGoalForm(formData: FormData): Promise<void> {
  await createSavingsGoal(formData);
}
