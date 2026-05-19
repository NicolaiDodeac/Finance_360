import type { TaxHubData } from "@/lib/tax/types";
import { TaxCategoryBreakdown } from "@/components/tax/tax-category-breakdown";
import { TaxHubActions } from "@/components/tax/tax-hub-actions";
import {
  TaxHubEmptyNoActivity,
  TaxHubEmptyNoTaxYears,
} from "@/components/tax/tax-hub-empty";
import { TaxHubIntro } from "@/components/tax/tax-hub-intro";
import { TaxOverviewCards } from "@/components/tax/tax-overview-cards";
import { EvidenceExplainerPanel } from "@/components/evidence/evidence-explainer-panel";
import { TaxEvidenceSummary } from "@/components/tax/tax-evidence-summary";
import { TaxReviewSection } from "@/components/tax/tax-review-section";
import { TaxYearSelector } from "@/components/tax/tax-year-selector";

interface TaxHubViewProps {
  data: TaxHubData;
  loadError?: string | null;
}

export function TaxHubView({ data, loadError }: TaxHubViewProps) {
  const { taxYears, selectedTaxYear, summary } = data;

  if (!selectedTaxYear) {
    return (
      <div className="space-y-6">
        <TaxHubIntro />
        <TaxHubEmptyNoTaxYears />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <TaxHubIntro />

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <TaxYearSelector
          taxYears={taxYears}
          selectedTaxYearId={selectedTaxYear.id}
        />
        <TaxHubActions taxYearId={selectedTaxYear.id} />
      </div>

      {summary && !summary.hasBusinessActivity ? (
        <TaxHubEmptyNoActivity
          taxYearLabel={selectedTaxYear.label}
          taxYearId={selectedTaxYear.id}
        />
      ) : null}

      {summary?.hasBusinessActivity ? (
        <>
          <TaxOverviewCards metrics={summary.metrics} />
          <TaxEvidenceSummary
            counts={summary.metrics.evidenceConfidence}
            taxYearId={selectedTaxYear.id}
          />
          <EvidenceExplainerPanel />
          <TaxCategoryBreakdown
            rows={summary.categoryBreakdown}
            taxYearId={selectedTaxYear.id}
          />
          <TaxReviewSection items={summary.reviewItems} />
        </>
      ) : null}
    </div>
  );
}
