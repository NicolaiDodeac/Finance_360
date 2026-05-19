import { PlaceholderCard } from "@/components/shared/placeholder-card";
import { Button } from "@/components/ui/button";

export function TransactionsPlaceholder() {
  return (
    <div className="space-y-6">
      <PlaceholderCard
        title="No transactions yet"
        description="Connect your bank or add transactions manually. Open Banking integration coming soon."
      >
        <Button disabled variant="secondary" className="mt-2">
          Connect bank (coming soon)
        </Button>
      </PlaceholderCard>
      {/* Future: transaction list, filters, import from lib/transactions */}
    </div>
  );
}
