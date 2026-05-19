import { cn } from "@/lib/utils";
import {
  planningStatusLabel,
  planningStatusTone,
} from "@/lib/planning/calculations";
import type { PlanningStatus } from "@/lib/planning/types";

const toneClasses: Record<ReturnType<typeof planningStatusTone>, string> = {
  default:
    "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300",
  caution:
    "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200",
  attention:
    "border-sky-200/80 bg-sky-50 text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/40 dark:text-sky-200",
};

interface PlanningStatusBadgeProps {
  status: PlanningStatus;
  className?: string;
}

export function PlanningStatusBadge({ status, className }: PlanningStatusBadgeProps) {
  const tone = planningStatusTone(status);
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        toneClasses[tone],
        className
      )}
    >
      {planningStatusLabel(status)}
    </span>
  );
}
