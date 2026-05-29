import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /** Optional icon, rendered in a soft circle above the title. */
  icon?: React.ReactNode;
  /** What this page/section is. */
  title: string;
  /** What the user should do next. */
  description: string;
  /** Primary next-step action (e.g. Capture receipt, Import statement). */
  action?: React.ReactNode;
  /** Optional secondary action. */
  secondaryAction?: React.ReactNode;
  className?: string;
}

/**
 * Standard empty state. Every empty state should answer two questions:
 * what is this for, and what should I do next. Always pass an `action`
 * unless the surface is genuinely read-only.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className,
}: EmptyStateProps) {
  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        {icon ? (
          <span
            className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary [&_svg]:h-6 [&_svg]:w-6"
            aria-hidden
          >
            {icon}
          </span>
        ) : null}
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        </div>
        {action || secondaryAction ? (
          <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
            {action}
            {secondaryAction}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
