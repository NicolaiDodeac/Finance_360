import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderCard } from "@/components/shared/placeholder-card";

export default function InsightsPage() {
  return (
    <>
      <PageHeader
        title="Insights"
        description="Spending patterns and smart suggestions for your finances."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <PlaceholderCard
          title="Spending insights"
          description="Category breakdowns and month-over-month comparisons."
        />
        <PlaceholderCard
          title="AI recommendations"
          description="Personalised tips and anomaly detection — coming in a future release."
        />
      </div>
      {/* Future: Recharts visualisations, AI insights from categorization module */}
    </>
  );
}
