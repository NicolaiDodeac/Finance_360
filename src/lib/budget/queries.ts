import { createClient } from "@/lib/supabase/server";
import {
  buildBudgetPageData,
  getCurrentPeriod,
} from "@/lib/budget/calculations";
import type { BudgetItemRow, BudgetPageData, BudgetPeriod, BudgetRow } from "@/lib/budget/types";
import { getCategories } from "@/lib/categories/queries";
import { getActiveSavingsGoals } from "@/lib/goals/queries";
import { ensureProfile } from "@/lib/profile/queries";
import { getActiveSpaceContext } from "@/lib/spaces/queries";
import { getTransactions } from "@/lib/transactions/queries";

interface BudgetWithItemsRow extends BudgetRow {
  budget_items: BudgetItemRow[];
}

export async function getBudgetForPeriod(
  spaceId: string,
  year: number,
  month: number
): Promise<{ budget: BudgetRow | null; items: BudgetItemRow[] }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("budgets")
    .select(
      `
      *,
      budget_items (*)
    `
    )
    .eq("space_id", spaceId)
    .eq("year", year)
    .eq("month", month)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return { budget: null, items: [] };
  }

  const row = data as unknown as BudgetWithItemsRow;
  const { budget_items, ...budget } = row;
  const items = Array.isArray(budget_items)
    ? budget_items
    : budget_items
      ? [budget_items]
      : [];

  return {
    budget: budget as BudgetRow,
    items: items as BudgetItemRow[],
  };
}

export async function getBudgetPageData(
  userId: string,
  period: BudgetPeriod = getCurrentPeriod()
): Promise<BudgetPageData> {
  const profile = await ensureProfile(userId);
  const { space, isShared } = await getActiveSpaceContext(userId);

  const [categories, transactions, goals, budgetData] = await Promise.all([
    getCategories(userId),
    isShared ? Promise.resolve([]) : getTransactions(userId),
    getActiveSavingsGoals(space.id, 20),
    getBudgetForPeriod(space.id, period.year, period.month),
  ]);

  return buildBudgetPageData({
    period,
    budget: budgetData.budget,
    budgetItems: budgetData.items,
    categories,
    transactions,
    goals,
    currency: profile.default_currency,
    isShared,
    spaceName: space.name,
    canManage: space.canManage,
  });
}
