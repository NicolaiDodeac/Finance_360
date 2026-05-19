import { CheckCircle2, Circle, CircleDot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SaPrepStepState, SaPrepStepStatus } from "@/lib/self-assessment/types";

interface SaPrepStepsProps {
  steps: SaPrepStepState[];
}

function statusLabel(status: SaPrepStepStatus): string {
  switch (status) {
    case "ready":
      return "Ready";
    case "review_recommended":
      return "Review recommended";
    default:
      return "Pending";
  }
}

function statusVariant(
  status: SaPrepStepStatus
): "business" | "warning" | "muted" {
  switch (status) {
    case "ready":
      return "business";
    case "review_recommended":
      return "warning";
    default:
      return "muted";
  }
}

function StepIcon({ status }: { status: SaPrepStepStatus }) {
  if (status === "ready") {
    return (
      <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
    );
  }
  if (status === "review_recommended") {
    return (
      <CircleDot className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
    );
  }
  return <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />;
}

export function SaPrepSteps({ steps }: SaPrepStepsProps) {
  return (
    <nav aria-label="Self Assessment preparation steps">
      <ol className="grid gap-3 sm:grid-cols-2">
        {steps.map((step) => (
          <li
            key={step.id}
            id={`step-${step.id}`}
            className="flex gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <StepIcon status={step.status} />
            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  Step {step.step}
                </span>
                <Badge variant={statusVariant(step.status)}>
                  {statusLabel(step.status)}
                </Badge>
              </div>
              <p className="font-medium text-foreground">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}
