import { PageHeader } from "@/components/shared/page-header";
import { GoalsView } from "@/components/goals/goals-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getAllSavingsGoals } from "@/lib/goals/queries";
import { getActiveSpaceContext } from "@/lib/spaces/queries";
import { spaceSwitcherLabel } from "@/lib/spaces/types";

export default async function GoalsPage() {
  const user = await requireAuth();
  const { space, isShared } = await getActiveSpaceContext(user.id);
  let goals: Awaited<ReturnType<typeof getAllSavingsGoals>> = [];
  let loadError: string | null = null;

  try {
    goals = await getAllSavingsGoals(space.id);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load savings goals.";
  }

  const spaceLabel = spaceSwitcherLabel(space);

  return (
    <>
      <PageHeader
        title={isShared ? `${spaceLabel} goals` : "Goals"}
        description={
          isShared
            ? "Shared savings targets for your household. Personal spending stays private."
            : "Set savings targets and watch your progress grow."
        }
      />
      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}
      <GoalsView
        goals={goals}
        spaceId={space.id}
        spaceName={space.name}
        isShared={isShared}
        canManage={space.canManage}
      />
    </>
  );
}
