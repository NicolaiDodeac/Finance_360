import { Suspense } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { ReceiptsLoading } from "@/components/receipts/receipts-loading";
import { ReceiptsVaultView } from "@/components/receipts/receipts-vault-view";
import { requireAuth } from "@/lib/auth/helpers";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { getCategories } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import {
  getReceiptPrioritySections,
  getReceiptsPage,
  parsePageParam,
} from "@/lib/receipts/queries";
import { resolveDefaultTaxYear } from "@/lib/tax/tax-year";
import { getTaxYears } from "@/lib/tax-years/queries";

interface ReceiptsPageProps {
  searchParams: Promise<{ page?: string }>;
}

async function ReceiptsContent({
  searchParams,
}: {
  searchParams: ReceiptsPageProps["searchParams"];
}) {
  const resolvedSearchParams = await searchParams;
  const page = parsePageParam(resolvedSearchParams.page);
  const user = await requireAuth();
  let loadError: string | null = null;
  let receipts: Awaited<ReturnType<typeof getReceiptsPage>>["items"] = [];
  let receiptTotalCount = 0;
  let receiptPage = 1;
  let receiptPageSize = 20;
  let needsReview: Awaited<
    ReturnType<typeof getReceiptPrioritySections>
  >["needsReview"] = [];
  let unmatched: Awaited<
    ReturnType<typeof getReceiptPrioritySections>
  >["unmatched"] = [];
  let taxYears: Awaited<ReturnType<typeof getTaxYears>> = [];
  let categories: Awaited<ReturnType<typeof getCategories>> = [];
  let hmrcCategories: Awaited<ReturnType<typeof getHmrcCategories>> = [];

  try {
    await ensureDefaultCategories(user.id);
    const [pageResult, priority, taxYearsResult, categoriesResult, hmrcResult] =
      await Promise.all([
        getReceiptsPage(user.id, { page }),
        getReceiptPrioritySections(user.id),
        getTaxYears(user.id),
        getCategories(user.id),
        getHmrcCategories(),
      ]);
    receipts = pageResult.items;
    receiptTotalCount = pageResult.totalCount;
    receiptPage = pageResult.page;
    receiptPageSize = pageResult.pageSize;
    needsReview = priority.needsReview;
    unmatched = priority.unmatched;
    taxYears = taxYearsResult;
    categories = categoriesResult;
    hmrcCategories = hmrcResult;
  } catch (err) {
    loadError =
      err instanceof Error ? err.message : "Failed to load receipts.";
  }

  const defaultTaxYearId = resolveDefaultTaxYear(taxYears)?.id ?? null;

  return (
    <ReceiptsVaultView
      receipts={receipts}
      receiptTotalCount={receiptTotalCount}
      receiptPage={receiptPage}
      receiptPageSize={receiptPageSize}
      needsReview={needsReview}
      unmatched={unmatched}
      taxYears={taxYears}
      categories={categories}
      hmrcCategories={hmrcCategories}
      defaultTaxYearId={defaultTaxYearId}
      loadError={loadError}
    />
  );
}

export default function ReceiptsPage({
  searchParams,
}: ReceiptsPageProps) {
  return (
    <>
      <PageHeader
        title="Receipts"
        description="Capture receipts, match them to transactions, or create cash and manual entries — you confirm every link."
      />
      <Suspense fallback={<ReceiptsLoading />}>
        <ReceiptsContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
