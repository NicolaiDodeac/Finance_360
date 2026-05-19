import { Badge } from "@/components/ui/badge";
import { ReceiptFileIcon } from "@/components/receipts/receipt-file-icon";
import {
  formatMoney,
  formatTransactionDate,
} from "@/lib/receipts/format";
import type { ReceiptWithRelations } from "@/lib/receipts/types";

interface ReceiptListItemProps {
  receipt: ReceiptWithRelations;
  onSelect: (receipt: ReceiptWithRelations) => void;
}

export function ReceiptListItem({ receipt, onSelect }: ReceiptListItemProps) {
  const attached = receipt.attached_transaction;
  const displayName =
    receipt.merchant_name ||
    receipt.original_filename ||
    "Stored receipt";

  return (
    <button
      type="button"
      onClick={() => onSelect(receipt)}
      className="flex w-full gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-muted/40"
    >
      <ReceiptFileIcon mimeType={receipt.mime_type} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium text-foreground">{displayName}</p>
          {attached ? (
            <Badge variant="business">Linked</Badge>
          ) : (
            <Badge variant="warning">Unmatched</Badge>
          )}
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
      </div>
    </button>
  );
}
