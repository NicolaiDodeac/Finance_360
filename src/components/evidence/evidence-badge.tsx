"use client";

import { Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getEvidenceLevelLabel } from "@/lib/evidence/labels";
import type { EvidenceEvaluation } from "@/lib/evidence/types";
import { cn } from "@/lib/utils";

interface EvidenceBadgeProps {
  evaluation: EvidenceEvaluation;
  className?: string;
  /** When true, badge sits inside a button — use span trigger to avoid nested buttons */
  compact?: boolean;
}

export function EvidenceBadge({
  evaluation,
  className,
  compact,
}: EvidenceBadgeProps) {
  const label = getEvidenceLevelLabel(evaluation.level);

  const badge = (
    <Badge
      variant={label.badgeVariant}
      className={cn("gap-1", className)}
      onClick={(e) => e.stopPropagation()}
    >
      {label.short}
      <Info className="h-3 w-3 opacity-70" aria-hidden />
    </Badge>
  );

  const trigger = compact ? (
    <span
      className="inline-flex cursor-help"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {badge}
    </span>
  ) : (
    <button
      type="button"
      className="inline-flex cursor-help rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
      onClick={(e) => e.stopPropagation()}
    >
      {badge}
    </button>
  );

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>{trigger}</TooltipTrigger>
        <TooltipContent side="top" className="space-y-1.5 text-left">
          <p className="font-medium text-foreground">{label.short}</p>
          <p>{evaluation.summary}</p>
          {evaluation.details.length > 1 ? (
            <ul className="list-inside list-disc space-y-0.5 text-muted-foreground">
              {evaluation.details.slice(0, 4).map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          ) : null}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
