import { PageHeader } from "@/components/shared/page-header";
import { BudgetView } from "@/components/budget/budget-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getBudgetPageData } from "@/lib/budget/queries";
import { getCategories } from "@/lib/categories/queries";
import { getSelectableCategories } from "@/lib/categories/display";
import { getActiveSpaceContext } from "@/lib/spaces/queries";
import { spaceSwitcherLabel } from "@/lib/spaces/types";

export default async function BudgetPage() {
  const user = await requireAuth();
  const { space, isShared } = await getActiveSpaceContext(user.id);

  let data: Awaited<ReturnType<typeof getBudgetPageData>> | null = null;
  let loadError: string | null = null;

  try {
    data = await getBudgetPageData(user.id);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load your monthly plan.";
  }

  const allCategories = await getCategories(user.id);
  const expensesParent = allCategories.find((c) => c.slug === "expenses");
  const expenseCategories = getSelectableCategories(allCategories).filter(
    (c) => expensesParent && c.parent_id === expensesParent.id
  );

  const spaceLabel = spaceSwitcherLabel(space);

  return (
    <>
      <PageHeader
        title={isShared ? `${spaceLabel} budget` : "Budget"}
        description={
          isShared
            ? "A calm monthly plan for your household — awareness over restriction."
            : "Guide your spending with a flexible monthly plan — no guilt, just clarity."
        }
      />
      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}
      {data ? (
        <BudgetView
          data={data}
          expenseCategories={expenseCategories}
          allCategories={allCategories}
        />
      ) : null}
    </>
  );
}
