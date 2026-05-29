import { Badge } from "@/components/ui/badge";
import { ReceiptProofPreview } from "@/components/receipts/receipt-proof-preview";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import type { ReceiptWithRelations } from "@/lib/receipts/types";

interface ReceiptListItemProps {
  receipt: ReceiptWithRelations;
  onSelect?: (receipt: ReceiptWithRelations) => void;
  onClick?: () => void;
  badge?: string;
}

export function ReceiptListItem({
  receipt,
  onSelect,
  onClick,
  badge,
}: ReceiptListItemProps) {
  const attached = receipt.attached_transaction;
  const displayName =
    receipt.merchant_name ||
    receipt.original_filename ||
    "Stored receipt";

  const statusBadge =
    badge ??
    (attached
      ? "Linked"
      : (receipt as { status?: string }).status === "needs_review"
        ? "Needs review"
        : "Unmatched");

  const handleClick = () => {
    if (onClick) onClick();
    else onSelect?.(receipt);
  };

  return (
    <div className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/40">
      <ReceiptProofPreview
        receiptId={receipt.id}
        mimeType={receipt.mime_type}
        label={displayName}
        lazy
      />
      <button
        type="button"
        onClick={handleClick}
        className="min-w-0 flex-1 space-y-1 text-left"
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{displayName}</p>
          <Badge
            variant={
              statusBadge === "Linked"
                ? "business"
                : statusBadge === "Needs review"
                  ? "warning"
                  : "warning"
            }
          >
            {statusBadge}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {receipt.total_amount !== null
            ? formatMoney(Number(receipt.total_amount))
            : "Amount not set"}
          {receipt.receipt_date
            ? ` · ${formatTransactionDate(receipt.receipt_date)}`
            : ""}
          {receipt.tax_year?.label ? ` · ${receipt.tax_year.label}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {attached
            ? `Linked to ${attached.merchant_name ?? attached.description ?? "transaction"}`
            : "Not linked to a transaction yet"}
          {receipt.notes ? ` · ${receipt.notes}` : ""}
        </p>
      </button>
    </div>
  );
}
