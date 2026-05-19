"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { createClient } from "@/lib/supabase/server";
import type { FinanceMode } from "@/lib/profile/types";
import type { ActionResult } from "@/lib/transactions/types";

const VALID_MODES: FinanceMode[] = ["personal", "self_employed", "both"];

export async function updateFinanceMode(
  financeMode: FinanceMode
): Promise<ActionResult> {
  if (!VALID_MODES.includes(financeMode)) {
    return { success: false, error: "Invalid finance mode." };
  }

  const user = await requireAuth();
  const supabase = await createClient();

  const { error } = await supabase
    .from("profiles")
    .update({
      finance_mode: financeMode,
      is_self_employed:
        financeMode === "self_employed" || financeMode === "both",
    })
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/settings");

  return { success: true };
}
