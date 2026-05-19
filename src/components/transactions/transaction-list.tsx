"use client";

import { TransactionItem } from "@/components/transactions/transaction-item";
import type { EvidenceEvaluation } from "@/lib/evidence/types";
import type { TransactionWithRelations } from "@/lib/transactions/types";

interface TransactionListProps {
  transactions: TransactionWithRelations[];
  evidenceByTransactionId: Map<string, EvidenceEvaluation>;
  onSelect: (transaction: TransactionWithRelations) => void;
}

export function TransactionList({
  transactions,
  evidenceByTransactionId,
  onSelect,
}: TransactionListProps) {
  return (
    <div className="space-y-2">
      {transactions.map((transaction) => (
        <TransactionItem
          key={transaction.id}
          transaction={transaction}
          evidence={evidenceByTransactionId.get(transaction.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
