import { PageHeader } from "@/components/shared/page-header";
import { CreateHouseholdSpaceForm } from "@/components/spaces/create-household-space-form";
import { requireAuth } from "@/lib/auth/helpers";

export default async function NewHouseholdSpacePage() {
  await requireAuth();

  return (
    <>
      <PageHeader
        title="Create a shared space"
        description="Plan together on savings goals. Your personal transactions stay private."
      />
      <CreateHouseholdSpaceForm />
    </>
  );
}
