import Link from "next/link";
import { ClipboardList, List } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildSelfAssessmentLink,
  buildTransactionsLink,
} from "@/lib/tax/links";

interface TaxHubActionsProps {
  taxYearId: string;
}

export function TaxHubActions({ taxYearId }: TaxHubActionsProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" asChild>
        <Link href={buildSelfAssessmentLink(taxYearId)}>
          <ClipboardList className="h-4 w-4" />
          Prepare Self Assessment
        </Link>
      </Button>
      <Button type="button" variant="outline" asChild>
        <Link href={buildTransactionsLink({ taxYearId })}>
          <List className="h-4 w-4" />
          View related transactions
        </Link>
      </Button>
    </div>
  );
}
