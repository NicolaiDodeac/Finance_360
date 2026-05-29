"use client";

import { useEffect, useRef, useState } from "react";
import { FileImage, FileText } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getReceiptPreviewUrl } from "@/lib/receipts/actions";
import { isImageMimeType, isPdfMimeType } from "@/lib/receipts/storage";
import { cn } from "@/lib/utils";

interface ReceiptProofPreviewProps {
  receiptId: string;
  mimeType: string | null;
  /** Shown in the full-size viewer title. */
  label?: string | null;
  className?: string;
  /** If already loaded by parent, skip fetch. */
  previewUrl?: string | null;
  /**
   * Defer fetching until the thumbnail is near the viewport.
   * Use on receipt lists so 20 rows don't all hit storage at once.
   */
  lazy?: boolean;
}

/** Shared thumbnail size — matches ReceiptFileIcon row layout. */
const THUMB_CLASS =
  "h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted/50";

function ReceiptProofViewerDialog({
  open,
  onOpenChange,
  label,
  previewUrl,
  mimeType,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label?: string | null;
  previewUrl: string;
  mimeType: string | null;
}) {
  const showImage = isImageMimeType(mimeType);
  const showPdf = isPdfMimeType(mimeType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[min(100vw-2rem,32rem)] gap-3 p-4 sm:p-5">
        <DialogHeader>
          <DialogTitle className="pr-8 text-base">
            {label ?? "Receipt"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Full-size receipt proof for review
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(70vh,36rem)] overflow-auto rounded-lg border border-border bg-muted/20">
          {showImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={previewUrl}
              alt={label ?? "Receipt"}
              className="mx-auto h-auto w-full max-w-full object-contain"
            />
          ) : showPdf ? (
            <iframe
              title={label ?? "Receipt PDF"}
              src={previewUrl}
              className="h-[min(70vh,32rem)] w-full min-h-[280px]"
            />
          ) : (
            <a
              href={previewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block px-4 py-8 text-center text-sm text-primary hover:underline"
            >
              Open receipt file
            </a>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Compact tappable receipt thumbnail (one row with details). Tap opens the
 * same in-app full-size viewer everywhere.
 */
export function ReceiptProofPreview({
  receiptId,
  mimeType,
  label,
  className,
  previewUrl: previewUrlProp,
  lazy = false,
}: ReceiptProofPreviewProps) {
  const thumbRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    previewUrlProp ?? null
  );
  const [loading, setLoading] = useState(!previewUrlProp && !lazy);

  useEffect(() => {
    if (!lazy || inView) return;
    const el = thumbRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [lazy, inView]);

  useEffect(() => {
    if (previewUrlProp) {
      setPreviewUrl(previewUrlProp);
      setLoading(false);
      return;
    }
    if (!inView) return;

    let cancelled = false;
    setLoading(true);
    getReceiptPreviewUrl(receiptId).then((result) => {
      if (cancelled) return;
      if (result.success && result.data?.url) {
        setPreviewUrl(result.data.url);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [receiptId, previewUrlProp, inView]);

  const showImage = isImageMimeType(mimeType);
  const showPdf = isPdfMimeType(mimeType);
  const canOpen = Boolean(previewUrl) && !loading;
  const FallbackIcon = showPdf ? FileText : FileImage;

  return (
    <>
      <button
        ref={thumbRef}
        type="button"
        disabled={!canOpen}
        onClick={(e) => {
          e.stopPropagation();
          if (canOpen) setOpen(true);
        }}
        className={cn(
          THUMB_CLASS,
          "relative transition-colors",
          canOpen &&
            "cursor-pointer hover:border-primary/50 hover:ring-2 hover:ring-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
          !canOpen && "cursor-default",
          className
        )}
        aria-label={canOpen ? "View receipt" : "Receipt loading"}
      >
        {loading ? (
          <span className="flex h-full w-full animate-pulse items-center justify-center bg-muted">
            <FallbackIcon className="h-5 w-5 text-muted-foreground/50" />
          </span>
        ) : showImage && previewUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={previewUrl}
            alt=""
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <FallbackIcon className="h-5 w-5 text-muted-foreground" />
          </span>
        )}
      </button>

      {previewUrl ? (
        <ReceiptProofViewerDialog
          open={open}
          onOpenChange={setOpen}
          label={label}
          previewUrl={previewUrl}
          mimeType={mimeType}
        />
      ) : null}
    </>
  );
}
