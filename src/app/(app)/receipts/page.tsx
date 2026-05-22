import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ReceiptsLoading } from "@/components/receipts/receipts-loading";
import { ReceiptsVaultView } from "@/components/receipts/receipts-vault-view";
import { requireAuth } from "@/lib/auth/helpers";
import { getReceipts } from "@/lib/receipts/queries";
import { resolveDefaultTaxYear } from "@/lib/tax/tax-year";
import { getTaxYears } from "@/lib/tax-years/queries";

async function ReceiptsContent() {
  const user = await requireAuth();
  let loadError: string | null = null;
  let receipts: Awaited<ReturnType<typeof getReceipts>> = [];
  let taxYears: Awaited<ReturnType<typeof getTaxYears>> = [];

  try {
    [receipts, taxYears] = await Promise.all([
      getReceipts(user.id),
      getTaxYears(user.id),
    ]);
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load receipts.";
  }

  const defaultTaxYearId = resolveDefaultTaxYear(taxYears)?.id ?? null;

  return (
    <ReceiptsVaultView
      receipts={receipts}
      taxYears={taxYears}
      defaultTaxYearId={defaultTaxYearId}
      loadError={loadError}
    />
  );
}

export default function ReceiptsPage() {
  return (
    <>
      <PageHeader
        title="Receipts"
        description="Capture receipts, match them to transactions, or create cash and manual entries — you confirm every link."
      />
      <Suspense fallback={<ReceiptsLoading />}>
        <ReceiptsContent />
      </Suspense>
    </>
  );
}
