import { PageHeader } from "@/components/shared/page-header";
import { PlanningView } from "@/components/planning/planning-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getPlanningPlans } from "@/lib/planning/queries";
import { getActiveSpaceContext } from "@/lib/spaces/queries";
import { spaceSwitcherLabel } from "@/lib/spaces/types";

export default async function PlanningPage() {
  const user = await requireAuth();
  const { space, isShared } = await getActiveSpaceContext(user.id);

  let plans: Awaited<ReturnType<typeof getPlanningPlans>> = [];
  let loadError: string | null = null;

  try {
    plans = await getPlanningPlans(space.id);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load your plans.";
  }

  const spaceLabel = spaceSwitcherLabel(space);

  return (
    <>
      <PageHeader
        title={isShared ? `${spaceLabel} planning` : "Planning Hub"}
        description={
          isShared
            ? "Plan together what you are saving for — deposits, trips, and peace of mind."
            : "Connect your savings to what matters — calm, future-focused, one step at a time."
        }
      />
      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}
      <PlanningView
        plans={plans}
        spaceName={space.name}
        isShared={isShared}
        canManage={space.canManage}
      />
    </>
  );
}
