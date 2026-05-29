"use client";

import { useEffect, useState } from "react";
import { FileText, ZoomIn } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getReceiptPreviewUrl } from "@/lib/receipts/actions";
import { cn } from "@/lib/utils";

function isImageMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  const m = mime.toLowerCase();
  return (
    m.startsWith("image/") ||
    m === "image/jpeg" ||
    m === "image/jpg" ||
    m === "image/png" ||
    m === "image/heic" ||
    m === "image/heif" ||
    m === "image/webp"
  );
}

function isPdfMime(mime: string | null | undefined): boolean {
  if (!mime) return false;
  return mime.toLowerCase().includes("pdf");
}

interface ReceiptProofPreviewProps {
  receiptId: string;
  mimeType: string | null;
  /** Shown on the thumbnail and in the viewer title. */
  label?: string | null;
  className?: string;
  /** If already loaded by parent, skip fetch. */
  previewUrl?: string | null;
}

/**
 * Tappable receipt proof — thumbnail opens an in-app viewer so you can
 * check details without leaving the review screen.
 */
export function ReceiptProofPreview({
  receiptId,
  mimeType,
  label,
  className,
  previewUrl: previewUrlProp,
}: ReceiptProofPreviewProps) {
  const [open, setOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    previewUrlProp ?? null
  );
  const [loading, setLoading] = useState(!previewUrlProp);

  useEffect(() => {
    if (previewUrlProp) {
      setPreviewUrl(previewUrlProp);
      setLoading(false);
      return;
    }

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
  }, [receiptId, previewUrlProp]);

  const showImage = isImageMime(mimeType);
  const showPdf = isPdfMime(mimeType);
  const canOpen = Boolean(previewUrl) && !loading;

  return (
    <>
      <button
        type="button"
        disabled={!canOpen}
        onClick={() => canOpen && setOpen(true)}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-border bg-muted/30 text-left transition-colors",
          canOpen && "cursor-pointer hover:border-primary/40 hover:bg-muted/50",
          !canOpen && "cursor-default opacity-80",
          className
        )}
        aria-label={
          canOpen ? "View receipt photo" : "Receipt photo loading"
        }
      >
        {loading ? (
          <div className="flex aspect-[4/3] max-h-40 items-center justify-center">
            <p className="text-xs text-muted-foreground">Loading photo…</p>
          </div>
        ) : showImage && previewUrl ? (
          <div className="relative aspect-[4/3] max-h-44 w-full bg-muted/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={label ?? "Receipt"}
              className="h-full w-full object-contain object-center"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/10 group-focus-visible:bg-black/10">
              <span className="flex items-center gap-1.5 rounded-full bg-background/90 px-3 py-1.5 text-xs font-medium text-foreground shadow-sm opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ZoomIn className="h-3.5 w-3.5" />
                View receipt
              </span>
            </span>
          </div>
        ) : (
          <div className="flex aspect-[4/3] max-h-36 flex-col items-center justify-center gap-2 px-4">
            <FileText className="h-10 w-10 text-muted-foreground" />
            <p className="text-xs font-medium text-foreground">
              {showPdf ? "PDF receipt" : "Receipt file"}
            </p>
            {canOpen ? (
              <p className="text-xs text-primary">Tap to open</p>
            ) : null}
          </div>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[min(100vw-2rem,32rem)] gap-3 p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="pr-8 text-base">
              {label ?? "Receipt"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Full-size receipt proof for review
            </DialogDescription>
          </DialogHeader>
          {previewUrl ? (
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
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
