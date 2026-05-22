import Link from "next/link";
import { notFound } from "next/navigation";
import { ReceiptCaptureReviewView } from "@/components/receipts/receipt-capture-review-view";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { requireAuth } from "@/lib/auth/helpers";
import { getReceiptCaptureReview } from "@/lib/receipts/capture-actions";
import { getTaxYears } from "@/lib/tax-years/queries";

interface ReceiptReviewPageProps {
  params: Promise<{ id: string }>;
}

export default async function ReceiptReviewPage({
  params,
}: ReceiptReviewPageProps) {
  const { id } = await params;
  const user = await requireAuth();

  const [reviewResult, taxYears] = await Promise.all([
    getReceiptCaptureReview(id),
    getTaxYears(user.id),
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
        description="Check what we read from your receipt, then link or create a transaction."
      />
      <ReceiptCaptureReviewView
        review={reviewResult.data}
        taxYears={taxYears}
      />
    </>
  );
}
