import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { SaPrepLoading } from "@/components/self-assessment/sa-prep-loading";
import { SaPrepView } from "@/components/self-assessment/sa-prep-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getSelfAssessmentPrepData } from "@/lib/self-assessment/queries";

interface SelfAssessmentPageProps {
  searchParams: Promise<{
    taxYear?: string;
  }>;
}

async function SelfAssessmentContent({
  searchParams,
}: {
  searchParams: SelfAssessmentPageProps["searchParams"];
}) {
  const resolved = await searchParams;
  const user = await requireAuth();
  let loadError: string | null = null;
  let data: Awaited<ReturnType<typeof getSelfAssessmentPrepData>> | null = null;

  try {
    data = await getSelfAssessmentPrepData(user.id, resolved.taxYear);
  } catch (err) {
    loadError =
      err instanceof Error
        ? err.message
        : "Failed to load Self Assessment preparation.";
  }

  if (!data) {
    return (
      <SaPrepView
        data={{ taxYears: [], selectedTaxYear: null, summary: null }}
        loadError={loadError}
      />
    );
  }

  return <SaPrepView data={data} loadError={loadError} />;
}

export default function SelfAssessmentPage({
  searchParams,
}: SelfAssessmentPageProps) {
  return (
    <>
      <PageHeader
        title="Self Assessment prep"
        description="A step-by-step assistant to prepare your self-employment figures before you enter them into HMRC."
      />
      <Suspense fallback={<SaPrepLoading />}>
        <SelfAssessmentContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
