import Link from "next/link";
import { ArrowRight, PiggyBank, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DashboardEmptyState() {
  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader>
        <CardTitle>Welcome to your money command center</CardTitle>
        <CardDescription>
          Import a statement, add a transaction, or set a savings goal to see your
          dashboard come alive.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" asChild>
          <Link href="/transactions/import">
            <Upload className="mr-2 h-4 w-4" />
            Import bank statement
          </Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/transactions">
            Add manual transaction
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/goals">
            <PiggyBank className="mr-2 h-4 w-4" />
            Create savings goal
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
