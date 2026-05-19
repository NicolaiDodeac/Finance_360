import { cn } from "@/lib/utils";

const STEPS = [
  { id: "upload", label: "Upload" },
  { id: "preview", label: "Preview" },
  { id: "done", label: "Done" },
] as const;

export type ImportWizardStep = (typeof STEPS)[number]["id"];

interface ImportStepIndicatorProps {
  current: ImportWizardStep;
}

export function ImportStepIndicator({ current }: ImportStepIndicatorProps) {
  const currentIndex = STEPS.findIndex((step) => step.id === current);

  return (
    <ol className="mb-8 flex flex-wrap gap-2 sm:gap-4">
      {STEPS.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = step.id === current;

        return (
          <li key={step.id} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                isComplete && "bg-primary text-primary-foreground",
                isCurrent && "border-2 border-primary text-primary",
                !isComplete && !isCurrent && "bg-muted text-muted-foreground"
              )}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                isCurrent ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step.label}
            </span>
            {index < STEPS.length - 1 && (
              <span className="hidden h-px w-6 bg-border sm:block" aria-hidden />
            )}
          </li>
        );
      })}
    </ol>
  );
}
