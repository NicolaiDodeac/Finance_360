import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptCaptureReviewView } from "@/components/receipts/receipt-capture-review-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/helpers";
import { getCategories } from "@/lib/categories/queries";
import { getHmrcCategories } from "@/lib/hmrc/queries";
import { getReceiptCaptureReview } from "@/lib/receipts/capture-actions";
import { ensureDefaultCategories } from "@/lib/setup/categories";
import { getTaxYears } from "@/lib/tax-years/queries";

interface ReceiptReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptReviewPage({
  params,
}: ReceiptReviewPageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const [reviewResult, taxYears, categories, hmrcCategories] = await Promise.all([
    getReceiptCaptureReview(id),
    getTaxYears(user.id),
    ensureDefaultCategories(user.id).then(() => getCategories(user.id)),
    getHmrcCategories(),
  ]);

  if (!reviewResult.success || !reviewResult.data) {
    if (reviewResult.error === "Receipt not found.") {
      notFound();
    }
    return (
      <>
        <PageHeader title="Review receipt" />
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {reviewResult.error ?? "Could not load receipt."}
        </p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/receipts">Back to receipts</Link>
        </Button>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Review receipt"
        description="Confirm what this was for, then link or create a transaction."
      />
      <ReceiptCaptureReviewView
        review={reviewResult.data}
        categories={categories}
        hmrcCategories={hmrcCategories}
        taxYears={taxYears}
      />
    </>
  );
}
