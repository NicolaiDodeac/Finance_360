import {
  buildBudgetPageData,
  buildDashboardBudgetSnapshot,
} from "@/lib/budget/calculations";
import { getBudgetForPeriod } from "@/lib/budget/queries";
import { getCategories } from "@/lib/categories/queries";
import { buildDashboardData } from "@/lib/dashboard/calculations";
import { parseMonthParam } from "@/lib/dashboard/month-context";
import type { DashboardData } from "@/lib/dashboard/types";
import { getActiveSavingsGoals } from "@/lib/goals/queries";
import { getPlanningPreview } from "@/lib/planning/queries";
import { ensureProfile } from "@/lib/profile/queries";
import { showsBusinessFeatures } from "@/lib/profile/types";
import { getActiveSpaceContext } from "@/lib/spaces/queries";
import { getTaxHubData } from "@/lib/tax/queries";
import { getTransactions } from "@/lib/transactions/queries";

export async function getDashboardData(
  userId: string,
  monthParam?: string
): Promise<DashboardData> {
  const profile = await ensureProfile(userId);
  const spaceContext = await getActiveSpaceContext(userId);
  const { space, isShared } = spaceContext;
  const month = parseMonthParam(monthParam);
  const period = {
    year: month.year,
    month: month.month,
    label: month.label,
  };

  const [transactions, goals, planningPlans, categories, budgetData] =
    await Promise.all([
      isShared ? Promise.resolve([]) : getTransactions(userId),
      getActiveSavingsGoals(space.id, 5),
      getPlanningPreview(space.id, 3),
      getCategories(userId),
      getBudgetForPeriod(space.id, period.year, period.month),
    ]);

  const budgetPageSlice = buildBudgetPageData({
    period,
    month,
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
  const budgetSnapshot = buildDashboardBudgetSnapshot(budgetPageSlice);

  let taxSummary = null;
  let taxYearLabel: string | null = null;
  let taxYearId: string | null = null;

  if (!isShared && showsBusinessFeatures(profile.finance_mode)) {
    const taxHub = await getTaxHubData(userId);
    taxSummary = taxHub.summary;
    taxYearLabel = taxHub.selectedTaxYear?.label ?? null;
    taxYearId = taxHub.selectedTaxYear?.id ?? null;
  }

  return buildDashboardData({
    financeMode: profile.finance_mode,
    currency: profile.default_currency,
    transactions,
    taxSummary,
    taxYearLabel,
    taxYearId,
    goals,
    planningPlans,
    spaceContext: { space, isShared },
    budgetSnapshot,
    month,
  });
}
