import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SaCopySummaryPanel } from "@/components/self-assessment/sa-copy-summary";
import { SaEvidenceExplainer } from "@/components/self-assessment/sa-evidence-explainer";
import { SaExpensesSection } from "@/components/self-assessment/sa-expenses-section";
import { SaIncomeSectionCard } from "@/components/self-assessment/sa-income-section";
import { SaPrepIntro } from "@/components/self-assessment/sa-prep-intro";
import { SaPrepSteps } from "@/components/self-assessment/sa-prep-steps";
import { SaReviewSection } from "@/components/self-assessment/sa-review-section";
import { TaxHubEmptyNoActivity, TaxHubEmptyNoTaxYears } from "@/components/tax/tax-hub-empty";
import { TaxYearSelector } from "@/components/tax/tax-year-selector";
import type { SaPrepData } from "@/lib/self-assessment/types";

interface SaPrepViewProps {
  data: SaPrepData;
  loadError?: string | null;
}

export function SaPrepView({ data, loadError }: SaPrepViewProps) {
  const { taxYears, selectedTaxYear, summary } = data;

  if (!selectedTaxYear) {
    return (
      <div className="space-y-6">
        <BackToTaxHub />
        <SaPrepIntro />
        <TaxHubEmptyNoTaxYears />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackToTaxHub />

      <SaPrepIntro />

      {loadError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {loadError}
        </p>
      ) : null}

      <TaxYearSelector
        taxYears={taxYears}
        selectedTaxYearId={selectedTaxYear.id}
      />

      {summary && !summary.hasBusinessActivity ? (
        <TaxHubEmptyNoActivity
          taxYearLabel={selectedTaxYear.label}
          taxYearId={selectedTaxYear.id}
        />
      ) : null}

      {summary?.hasBusinessActivity ? (
        <>
          <SaPrepSteps steps={summary.steps} />
          <SaIncomeSectionCard income={summary.income} />
          <SaExpensesSection groups={summary.expenseGroups} />
          <SaEvidenceExplainer />
          <SaReviewSection
            items={summary.reviewItems}
            likelyBusinessIncome={summary.likelyBusinessIncome}
          />
          <SaCopySummaryPanel summary={summary.copySummary} />
        </>
      ) : null}
    </div>
  );
}

function BackToTaxHub() {
  return (
    <Link
      href="/tax"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="h-4 w-4" />
      Back to Tax Hub
    </Link>
  );
}
