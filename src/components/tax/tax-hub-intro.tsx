import { Info } from "lucide-react";

export function TaxHubIntro() {
  return (
    <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
      <div className="flex gap-3">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <div className="space-y-1 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">
            Self Assessment preparation — not a tax return
          </p>
          <p>
            This dashboard summarises your business transactions for the
            selected UK tax year. Use it to stay organised before filing — it
            does not submit anything to HMRC and does not calculate your final
            tax bill.
          </p>
        </div>
      </div>
    </div>
  );
}
