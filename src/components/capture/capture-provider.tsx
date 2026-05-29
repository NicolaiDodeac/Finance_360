"use client";

import { createContext, useContext, useMemo, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Camera, Loader2, Mic, Pencil, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useReceiptCapture } from "@/components/receipts/use-receipt-capture";
import { QuickAddDrawer } from "@/components/quick-add/quick-add-drawer";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface CaptureContextValue {
  /** Open the global capture bottom sheet (Receipt / Voice / Quick Add). */
  openCapture: () => void;
}

const CaptureContext = createContext<CaptureContextValue | null>(null);

/** Access the global capture sheet. Must be used within <CaptureProvider>. */
export function useCapture(): CaptureContextValue {
  const ctx = useContext(CaptureContext);
  if (!ctx) {
    throw new Error("useCapture must be used within a CaptureProvider");
  }
  return ctx;
}

interface CaptureProviderProps {
  children: React.ReactNode;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  defaultTaxYearId?: string | null;
}

type QuickAddMode = "text" | "voice" | null;

export function CaptureProvider({
  children,
  categories,
  hmrcCategories,
  defaultTaxYearId,
}: CaptureProviderProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [quickAddMode, setQuickAddMode] = useState<QuickAddMode>(null);

  const { isPending, error, fileInputs, openCamera } = useReceiptCapture({
    defaultTaxYearId,
  });

  const value = useMemo<CaptureContextValue>(
    () => ({ openCapture: () => setSheetOpen(true) }),
    []
  );

  function handleReceipt() {
    setSheetOpen(false);
    openCamera();
  }

  function handleVoice() {
    setSheetOpen(false);
    setQuickAddMode("voice");
  }

  function handleQuickAdd() {
    setSheetOpen(false);
    setQuickAddMode("text");
  }

  return (
    <CaptureContext.Provider value={value}>
      {children}

      {fileInputs}

      <DialogPrimitive.Root open={sheetOpen} onOpenChange={setSheetOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />
          <DialogPrimitive.Content
            className={cn(
              "fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border-t border-border bg-card",
              "p-5 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] shadow-2xl focus:outline-none",
              "data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom"
            )}
          >
            <div className="mx-auto mb-5 h-1.5 w-10 rounded-full bg-muted" />
            <DialogPrimitive.Title className="mb-1 text-center text-lg font-semibold">
              Add something
            </DialogPrimitive.Title>
            <DialogPrimitive.Description className="mb-5 text-center text-sm text-muted-foreground">
              Snap it, say it, or type it.
            </DialogPrimitive.Description>

            <div className="space-y-3">
              <CaptureAction
                emoji="📷"
                icon={<Camera className="h-5 w-5" />}
                title="Receipt"
                subtitle="Take a photo — we read the details"
                onClick={handleReceipt}
                disabled={isPending}
              />
              <CaptureAction
                emoji="🎤"
                icon={<Mic className="h-5 w-5" />}
                title="Voice"
                subtitle={'e.g. "Fuel fifty pounds business"'}
                onClick={handleVoice}
              />
              <CaptureAction
                emoji="✏️"
                icon={<Pencil className="h-5 w-5" />}
                title="Quick Add"
                subtitle={'e.g. "Tesco £45 groceries"'}
                onClick={handleQuickAdd}
              />
            </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            ) : null}

            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      {isPending ? (
        <div className="fixed bottom-24 right-5 z-40 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium shadow-lg lg:bottom-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          Reading receipt…
        </div>
      ) : null}

      <QuickAddDrawer
        open={quickAddMode !== null}
        onOpenChange={(open) => {
          if (!open) setQuickAddMode(null);
        }}
        categories={categories}
        hmrcCategories={hmrcCategories}
        mode={quickAddMode === "voice" ? "voice" : "text"}
      />
    </CaptureContext.Provider>
  );
}

interface CaptureActionProps {
  emoji: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
}

function CaptureAction({
  emoji,
  icon,
  title,
  subtitle,
  onClick,
  disabled,
}: CaptureActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex w-full items-center gap-4 rounded-2xl border border-border bg-background p-4 text-left",
        "transition-colors active:bg-muted disabled:opacity-50",
        "min-h-[4.5rem]"
      )}
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl"
        aria-hidden
      >
        {emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2 text-base font-semibold text-foreground">
          <span className="text-primary [&_svg]:h-5 [&_svg]:w-5" aria-hidden>
            {icon}
          </span>
          {title}
        </span>
        <span className="mt-0.5 block truncate text-sm text-muted-foreground">
          {subtitle}
        </span>
      </span>
    </button>
  );
}
