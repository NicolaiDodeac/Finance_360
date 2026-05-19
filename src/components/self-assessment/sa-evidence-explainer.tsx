import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SA_EVIDENCE_SECTIONS = [
  {
    title: "Bank statements",
    body: "Imported transactions from your bank or card help show that payment happened — date, amount, and merchant on your account.",
  },
  {
    title: "Receipts and invoices",
    body: "Linking a receipt or invoice strengthens your records, especially for higher amounts or one-off purchases.",
  },
  {
    title: "Notes and context",
    body: "A short note about business purpose helps explain expenses that are not obvious from the merchant name alone.",
  },
  {
    title: "Record preparation only",
    body: "Finance 360 helps you organise figures and evidence for Self Assessment. It does not provide legal or tax advice, and it does not file your return.",
  },
] as const;

export function SaEvidenceExplainer() {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">What counts as evidence?</CardTitle>
            <CardDescription>
              Stronger records are always available if you want them — this is
              about preparation, not perfection.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SA_EVIDENCE_SECTIONS.map((section) => (
            <li key={section.title} className="space-y-1">
              <p className="text-sm font-medium text-foreground">{section.title}</p>
              <p className="text-sm text-muted-foreground">{section.body}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
