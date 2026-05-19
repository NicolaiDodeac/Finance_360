import { FileImage, FileText } from "lucide-react";
import { isImageMimeType, isPdfMimeType } from "@/lib/receipts/storage";
import { cn } from "@/lib/utils";

interface ReceiptFileIconProps {
  mimeType: string | null;
  className?: string;
}

export function ReceiptFileIcon({ mimeType, className }: ReceiptFileIconProps) {
  const Icon = isPdfMimeType(mimeType)
    ? FileText
    : isImageMimeType(mimeType)
      ? FileImage
      : FileText;

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-border bg-muted/50",
        className
      )}
    >
      <Icon className="h-5 w-5 text-muted-foreground" />
    </div>
  );
}
