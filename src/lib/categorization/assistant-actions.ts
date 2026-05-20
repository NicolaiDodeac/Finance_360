"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import { applyGroupCategorisation } from "@/lib/categorization/assistant-apply";
import type {
  ApplyGroupResult,
  GroupCategorisationInput,
} from "@/lib/categorization/assistant-types";
import { getUncategorisedTransactionsForAssistant } from "@/lib/categorization/assistant-queries";
import type { ActionResult } from "@/lib/transactions/types";

const REVALIDATE_PATHS = [
  "/transactions",
  "/transactions/categorise",
  "/dashboard",
  "/tax",
  "/tax/self-assessment",
  "/settings/rules",
];

function revalidateAssistantPaths(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function applyMerchantGroupCategorisation(
  input: GroupCategorisationInput & {
    matchKeyword: string;
    merchantLabel: string;
  }
): Promise<ActionResult<ApplyGroupResult>> {
  const user = await requireAuth();

  if (
    !input.mark_review_recommended &&
    !input.category_id &&
    !input.hmrc_category_id
  ) {
    return {
      success: false,
      error: "Choose an option to categorise this group.",
    };
  }

  if (!input.transactionIds.length) {
    return { success: false, error: "No transactions selected for this group." };
  }

  try {
    const uncategorised = await getUncategorisedTransactionsForAssistant(
      user.id
    );
    const data = await applyGroupCategorisation(
      user.id,
      uncategorised,
      input.matchKeyword,
      input.merchantLabel,
      input
    );
    revalidateAssistantPaths();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not apply category.",
    };
  }
}
