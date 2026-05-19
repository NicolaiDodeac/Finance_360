import Link from "next/link";
import { ClipboardList, Download, List, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildReceiptsLink,
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
      <Button type="button" variant="outline" asChild>
        <Link href={buildReceiptsLink()}>
          <Receipt className="h-4 w-4" />
          Go to receipts
        </Link>
      </Button>
      <Button type="button" variant="outline" disabled title="Coming soon">
        <Download className="h-4 w-4" />
        Export — coming soon
      </Button>
    </div>
  );
}
