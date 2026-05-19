import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function TaxHubEmptyNoTaxYears() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">No tax years yet</CardTitle>
        <CardDescription>
          Tax years are created automatically when you sign in. Try refreshing
          the page, or contact support if this persists.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

interface TaxHubEmptyNoActivityProps {
  taxYearLabel: string;
  taxYearId: string;
}

export function TaxHubEmptyNoActivity({
  taxYearLabel,
  taxYearId,
}: TaxHubEmptyNoActivityProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">No business activity yet</CardTitle>
        <CardDescription>
          Mark transactions as business and assign them to {taxYearLabel} to
          see your tax overview here.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" variant="outline" asChild>
          <Link href={`/transactions?taxYear=${taxYearId}`}>
            View transactions
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
