import { ReceiptListItem } from "@/components/receipts/receipt-list-item";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReceiptWithRelations } from "@/lib/receipts/types";

interface ReceiptUnmatchedSectionProps {
  receipts: ReceiptWithRelations[];
  onSelect: (receipt: ReceiptWithRelations) => void;
}

export function ReceiptUnmatchedSection({
  receipts,
  onSelect,
}: ReceiptUnmatchedSectionProps) {
  if (receipts.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Unmatched receipts</CardTitle>
        <CardDescription>
          Proof stored but not yet linked to a business expense — tap to match.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {receipts.map((receipt) => (
          <ReceiptListItem
            key={receipt.id}
            receipt={receipt}
            onSelect={onSelect}
          />
        ))}
      </CardContent>
    </Card>
  );
}
