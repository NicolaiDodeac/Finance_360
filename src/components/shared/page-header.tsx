import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Primary action, rendered on the right (desktop) / below (mobile). */
  action?: React.ReactNode;
  /** Optional secondary action, shown next to the primary action. */
  secondaryAction?: React.ReactNode;
  /** Optional "back" link rendered above the title with a consistent style. */
  backHref?: string;
  /** Label for the back link. Defaults to "Back". */
  backLabel?: string;
}

export function PageHeader({
  title,
  description,
  action,
  secondaryAction,
  backHref,
  backLabel = "Back",
}: PageHeaderProps) {
  return (
    <div className="space-y-3">
      {backHref ? (
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {backLabel}
        </Link>
      ) : null}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {action || secondaryAction ? (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {secondaryAction}
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}
