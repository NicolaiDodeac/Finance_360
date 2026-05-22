"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ReceiptDeleteButtonProps {
  onDelete: () => void;
  disabled?: boolean;
  className?: string;
  variant?: "footer" | "inline";
}

export function ReceiptDeleteButton({
  onDelete,
  disabled,
  className,
  variant = "footer",
}: ReceiptDeleteButtonProps) {
  if (variant === "inline") {
    return (
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        className={cn("text-muted-foreground hover:text-destructive", className)}
        onClick={onDelete}
        aria-label="Delete receipt"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={disabled}
      className={cn(
        "h-11 w-full gap-2 border-destructive/30 text-destructive hover:bg-destructive/5 hover:text-destructive",
        className
      )}
      onClick={onDelete}
    >
      <Trash2 className="h-4 w-4" />
      Delete receipt
    </Button>
  );
}

export function confirmDeleteReceipt(): boolean {
  return window.confirm(
    "Delete this receipt? The photo and any link to a transaction will be removed. This cannot be undone."
  );
}
