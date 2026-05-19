import Link from "next/link";
import { Receipt, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TransactionsEmptyStateProps {
  hasFilters: boolean;
  onAddClick: () => void;
}

export function TransactionsEmptyState({
  hasFilters,
  onAddClick,
}: TransactionsEmptyStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Receipt className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="max-w-sm space-y-1">
          <p className="font-medium">
            {hasFilters ? "No transactions match your filters" : "No transactions yet"}
          </p>
          <p className="text-sm text-muted-foreground">
            {hasFilters
              ? "Try adjusting your search or filters to see more results."
              : "Add a manual transaction or import a PDF statement / CSV from your bank."}
          </p>
        </div>
        {!hasFilters && (
          <div className="flex flex-wrap justify-center gap-2">
            <Button type="button" onClick={onAddClick}>
              Add transaction
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/transactions/import">
                <Upload className="h-4 w-4" />
                Import Center
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
