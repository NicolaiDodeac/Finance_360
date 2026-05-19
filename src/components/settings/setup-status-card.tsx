import { CheckCircle2, Circle } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { SetupStatus } from "@/lib/setup";

interface SetupStatusCardProps {
  status: SetupStatus;
}

interface SetupItemProps {
  label: string;
  done: boolean;
  detail?: string;
}

function SetupItem({ label, done, detail }: SetupItemProps) {
  return (
    <li className="flex items-start gap-3">
      {done ? (
        <CheckCircle2
          className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
          aria-hidden
        />
      ) : (
        <Circle
          className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
          aria-hidden
        />
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        {detail ? (
          <p className="text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </div>
    </li>
  );
}

export function SetupStatusCard({ status }: SetupStatusCardProps) {
  const allComplete =
    status.defaultAccountExists &&
    status.categoriesInitialized &&
    status.taxYearsInitialized &&
    status.hmrcCategoriesAvailable;

  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Setup</CardTitle>
        <CardDescription>
          {allComplete
            ? "Your workspace is ready for transactions and tax tracking."
            : "Finance 360 runs setup automatically when you sign in. Items below show what is ready."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          <SetupItem
            label="Default account"
            done={status.defaultAccountExists}
            detail={
              status.defaultAccountExists
                ? "Manual Account is available for new transactions."
                : "A default account will be created on your next visit."
            }
          />
          <SetupItem
            label="Categories initialized"
            done={status.categoriesInitialized}
            detail={
              status.categoriesInitialized
                ? `${status.categoryCount} categories (Income & Expenses groups).`
                : "Default income and expense categories are being prepared."
            }
          />
          <SetupItem
            label="Tax years initialized"
            done={status.taxYearsInitialized}
            detail={
              status.taxYearsInitialized
                ? `${status.taxYearCount} UK tax years (2024/25–2027/28).`
                : "UK tax year ranges will be added automatically."
            }
          />
          <SetupItem
            label="HMRC categories available"
            done={status.hmrcCategoriesAvailable}
            detail={
              status.hmrcCategoriesAvailable
                ? `${status.hmrcCategoryCount} reference categories for self-employed expenses.`
                : "HMRC reference data is not loaded yet. Run database migrations."
            }
          />
        </ul>
      </CardContent>
    </Card>
  );
}
