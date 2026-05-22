"use server";

import { revalidatePath } from "next/cache";
import { requireAuth } from "@/lib/auth/helpers";
import {
  dryRunRuleRepairForUser,
  executeRuleRepair,
} from "@/lib/categorization/rule-repair";
import type { ActionResult } from "@/lib/transactions/types";

const REVALIDATE_PATHS = [
  "/settings/rules",
  "/transactions",
  "/transactions/categorise",
  "/tax",
  "/tax/self-assessment",
];

function revalidateAfterRepair(): void {
  for (const path of REVALIDATE_PATHS) {
    revalidatePath(path);
  }
}

export async function dryRunRuleRepairAction(): Promise<
  ActionResult<{
    repairableCount: number;
    skippedCount: number;
  }>
> {
  const user = await requireAuth();

  try {
    const result = await dryRunRuleRepairForUser(user.id);
    return {
      success: true,
      data: {
        repairableCount: result.repairableCount,
        skippedCount: result.skippedCount,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not analyse rules.",
    };
  }
}

export async function repairCategorizationRulesAction(options?: {
  applyToMatchingTransactions?: boolean;
}): Promise<
  ActionResult<{
    repairedCount: number;
    skippedCount: number;
    transactionsUpdated: number;
  }>
> {
  const user = await requireAuth();

  try {
    const result = await executeRuleRepair(user.id, {
      applyToMatchingTransactions: options?.applyToMatchingTransactions ?? false,
    });

    revalidateAfterRepair();

    return {
      success: true,
      data: {
        repairedCount: result.repairedCount,
        skippedCount: result.skippedCount,
        transactionsUpdated: result.transactionsUpdated,
      },
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Could not improve rules.",
    };
  }
}
