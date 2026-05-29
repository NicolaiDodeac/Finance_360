import Link from "next/link";
import { Receipt, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";

interface TransactionsEmptyStateProps {
  hasFilters: boolean;
  onAddClick: () => void;
}

export function TransactionsEmptyState({
  hasFilters,
  onAddClick,
}: TransactionsEmptyStateProps) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={<Receipt />}
        title="No transactions match your filters"
        description="Try adjusting your search or filters to see more results."
      />
    );
  }

  return (
    <EmptyState
      icon={<Receipt />}
      title="No transactions yet"
      description="Import a PDF statement or CSV from your bank, or add one manually."
      action={
        <Button type="button" variant="outline" asChild>
          <Link href="/transactions/import">
            <Upload className="h-4 w-4" />
            Import statement
          </Link>
        </Button>
      }
      secondaryAction={
        <Button type="button" onClick={onAddClick}>
          Add transaction
        </Button>
      }
    />
  );
}
