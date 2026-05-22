"use client";

import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReceiptCapture } from "@/components/receipts/use-receipt-capture";
import { cn } from "@/lib/utils";

interface ReceiptCaptureButtonProps {
  defaultTaxYearId?: string | null;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  className?: string;
}

export function ReceiptCaptureButton({
  defaultTaxYearId,
  size = "sm",
  variant = "outline",
  className,
}: ReceiptCaptureButtonProps) {
  const { isPending, error, fileInputs, openCamera } = useReceiptCapture({
    defaultTaxYearId,
  });

  return (
    <div className={cn("flex flex-col items-end gap-1", className)}>
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={isPending}
        onClick={openCamera}
      >
        <Camera className="h-4 w-4" />
        {isPending ? "Reading…" : "Capture receipt"}
      </Button>
      {error ? (
        <p className="max-w-[11rem] text-right text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
      {fileInputs}
    </div>
  );
}
