"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

export interface CategoriseToastMessage {
  id: string;
  primary: string;
  secondary?: string;
}

interface CategoriseToastProps {
  toast: CategoriseToastMessage | null;
  onDismiss: () => void;
}

const DISMISS_MS = 4500;

export function CategoriseToast({ toast, onDismiss }: CategoriseToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4"
    >
      <div className="pointer-events-auto flex max-w-sm gap-3 rounded-xl border border-border bg-background px-4 py-3 shadow-lg">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <div>
          <p className="text-sm font-medium text-foreground">{toast.primary}</p>
          {toast.secondary && (
            <p className="mt-0.5 text-sm text-muted-foreground">{toast.secondary}</p>
          )}
        </div>
      </div>
    </div>
  );
}
