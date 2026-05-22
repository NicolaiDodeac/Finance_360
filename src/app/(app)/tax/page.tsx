import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { TaxHubLoading } from "@/components/tax/tax-hub-loading";
import { TaxHubView } from "@/components/tax/tax-hub-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getTaxHubData } from "@/lib/tax/queries";

interface TaxHubPageProps {
  searchParams: Promise<{
    taxYear?: string;
  }>;
}

async function TaxHubContent({
  searchParams,
}: {
  searchParams: TaxHubPageProps["searchParams"];
}) {
  const resolved = await searchParams;
  const user = await requireAuth();
  let loadError: string | null = null;
  let data: Awaited<ReturnType<typeof getTaxHubData>> | null = null;

  try {
    data = await getTaxHubData(user.id, resolved.taxYear);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load tax overview.";
  }

  if (!data) {
    return <TaxHubView data={{ taxYears: [], selectedTaxYear: null, summary: null }} loadError={loadError} />;
  }

  return <TaxHubView data={data} loadError={loadError} />;
}

export default function TaxHubPage({ searchParams }: TaxHubPageProps) {
  return (
    <>
      <PageHeader
        title="Tax Hub"
        description="A calm overview of your self-employed income and expenses for UK tax preparation."
      />
      <Suspense fallback={<TaxHubLoading />}>
        <TaxHubContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
