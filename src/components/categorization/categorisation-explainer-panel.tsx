import { Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FLOW_COPY, INCOME_FLOW_COPY } from "@/lib/categorization/categorise-flow";

const SECTIONS = [
  {
    title: "Income — what kind is it?",
    body: `${INCOME_FLOW_COPY.hint} No personal-or-business step for money in.`,
  },
  {
    title: "Spending — what was it for?",
    body: `${FLOW_COPY.expensePurposeHint} Then pick a category that fits.`,
  },
  {
    title: "Review and confirm",
    body: "See a plain-English summary before applying. Change the tax category on business costs only if you need to.",
  },
  {
    title: "Not sure is okay",
    body: "Flag a group for review and skip — we won't force a category until you're ready.",
  },
] as const;

export function CategorisationExplainerPanel() {
  return (
    <Card className="border-primary/15 bg-primary/[0.03]">
      <CardHeader>
        <div className="flex gap-3">
          <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0 space-y-1">
            <CardTitle className="text-base">How categorisation works</CardTitle>
            <CardDescription>
              {FLOW_COPY.tagline} {FLOW_COPY.changeLater}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-4 sm:grid-cols-2">
          {SECTIONS.map((section) => (
            <li key={section.title} className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                {section.title}
              </p>
              <p className="text-sm text-muted-foreground">{section.body}</p>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
