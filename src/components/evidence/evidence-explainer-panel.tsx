import { FileText } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EVIDENCE_EXPLAINER_SECTIONS } from "@/lib/evidence/labels";

export function EvidenceExplainerPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-3">
          <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">What counts as evidence?</CardTitle>
            <CardDescription>
              Finance 360 scores how well each business transaction is supported —
              without judging you. Stronger evidence is always available if you want it.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-2">
          {EVIDENCE_EXPLAINER_SECTIONS.map((section) => (
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
