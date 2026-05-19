import { PageHeader } from "@/components/shared/page-header";
import { DashboardView } from "@/components/dashboard/dashboard-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getDashboardData } from "@/lib/dashboard/queries";
import { getActiveSpaceContext } from "@/lib/spaces/queries";

export default async function DashboardPage() {
  const user = await requireAuth();
  const { space, isShared } = await getActiveSpaceContext(user.id);
  let loadError: string | null = null;
  let data: Awaited<ReturnType<typeof getDashboardData>> | null = null;

  try {
    data = await getDashboardData(user.id);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load your dashboard.";
  }

  return (
    <>
      <PageHeader
        title={isShared ? space.name : "Dashboard"}
        description={
          isShared
            ? "Shared goals and planning — your personal transactions stay private."
            : "Your personal money command center — clarity and progress first."
        }
      />
      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}
      {data ? <DashboardView data={data} taxYearId={data.taxYearId} /> : null}
    </>
  );
}
