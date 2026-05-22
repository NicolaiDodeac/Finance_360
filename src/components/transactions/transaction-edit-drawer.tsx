"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { CreateRuleFromTransaction } from "@/components/transactions/create-rule-from-transaction";
import { TransactionCategorisationReview } from "@/components/transactions/transaction-categorisation-review";
import { TransactionCoreFields } from "@/components/transactions/transaction-core-fields";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { deleteTransaction, updateTransaction } from "@/lib/transactions/actions";
import { transactionToFormInput } from "@/lib/transactions/form";
import { formatMoney } from "@/lib/transactions/format";
import type { AccountRow } from "@/lib/accounts/queries";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { ReceiptWithRelations } from "@/lib/receipts/types";
import type {
  TransactionFormInput,
  TransactionWithRelations,
} from "@/lib/transactions/types";
import { TransactionReceiptSection } from "@/components/transactions/transaction-receipt-section";

interface TransactionEditDrawerProps {
  transaction: TransactionWithRelations | null;
  onClose: () => void;
  onSaved?: (info: { similarUpdatedCount: number }) => void;
  accounts: AccountRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  unmatchedReceipts: ReceiptWithRelations[];
}

export function TransactionEditDrawer({
  transaction,
  onClose,
  onSaved,
  accounts,
  categories,
  hmrcCategories,
  unmatchedReceipts,
}: TransactionEditDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormInput | null>(null);

  const activeForm =
    transaction && (form ?? transactionToFormInput(transaction));

  useEffect(() => {
    if (transaction) {
      setForm(transactionToFormInput(transaction));
      setError(null);
    } else {
      setForm(null);
    }
  }, [transaction]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!transaction || !activeForm) return;

    setError(null);
    startTransition(async () => {
      const result = await updateTransaction(transaction.id, activeForm);
      if (!result.success) {
        setError(result.error ?? "Could not update transaction.");
        return;
      }
      const similarCount = result.data?.similarUpdatedCount ?? 0;
      onSaved?.({ similarUpdatedCount: similarCount });
      onClose();
      router.refresh();
    });
  }

  function handleDelete() {
    if (!transaction) return;

    const label =
      transaction.merchant_name?.trim() ||
      transaction.description?.trim() ||
      "this transaction";
    const amountLabel = formatMoney(Number(transaction.amount));
    const hasReceipt = Boolean(transaction.receipt_id ?? transaction.receipt);

    const message = hasReceipt
      ? `Delete "${label}" (${amountLabel})?\n\nThe stored receipt proof will stay in Receipts but will no longer be linked to this entry. This cannot be undone.`
      : `Delete "${label}" (${amountLabel})? This cannot be undone.`;

    if (!window.confirm(message)) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteTransaction(transaction.id);
      if (!result.success) {
        setError(result.error ?? "Could not delete transaction.");
        return;
      }
      onClose();
      router.refresh();
    });
  }

  return (
    <Drawer open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {transaction && activeForm && (
          <form
            id="transaction-edit-form"
            onSubmit={handleSubmit}
            className="flex h-full flex-col"
          >
            <DrawerHeader>
              <DrawerTitle>Edit transaction</DrawerTitle>
              <DrawerDescription>
                Update details for this entry.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody>
              {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              )}

              <TransactionCategorisationReview
                form={activeForm}
                onChange={setForm}
                categories={categories}
                hmrcCategories={hmrcCategories}
                disabled={isPending}
                variant="edit"
                onSave={() => {
                  const formEl = document.getElementById(
                    "transaction-edit-form"
                  ) as HTMLFormElement | null;
                  formEl?.requestSubmit();
                }}
                isPending={isPending}
              />

              <details className="mt-6 rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
                <summary className="cursor-pointer py-2 text-sm font-medium text-muted-foreground">
                  Transaction details (account, date, amount)
                </summary>
                <div className="pb-3 pt-2">
                  <TransactionCoreFields
                    value={activeForm}
                    onChange={setForm}
                    accounts={accounts}
                    disabled={isPending}
                  />
                </div>
              </details>

              <details className="mt-4 rounded-lg border border-border/80 bg-muted/20 px-3 py-2">
                <summary className="cursor-pointer py-2 text-sm font-medium text-muted-foreground">
                  Notes
                </summary>
                <div className="pb-3 pt-1">
                  <Label htmlFor="notes" className="sr-only">
                    Notes
                  </Label>
                  <Textarea
                    id="notes"
                    value={activeForm.notes}
                    disabled={isPending}
                    onChange={(e) =>
                      setForm({ ...activeForm, notes: e.target.value })
                    }
                    placeholder="Optional notes"
                  />
                </div>
              </details>
              <div className="mt-6 border-t border-border pt-4">
                <TransactionReceiptSection
                  transaction={transaction}
                  unmatchedReceipts={unmatchedReceipts}
                  disabled={isPending}
                />
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <p className="mb-3 text-sm text-muted-foreground">
                  Similar past and future transactions are matched automatically
                  when you save a category. Adjust the rule here if needed.
                </p>
                <CreateRuleFromTransaction
                  form={activeForm}
                  transactionLabel={
                    transaction.description ??
                    transaction.merchant_name ??
                    "transaction"
                  }
                  categories={categories}
                  hmrcCategories={hmrcCategories}
                  disabled={isPending}
                />
              </div>
            </DrawerBody>

            <DrawerFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <Button
                type="button"
                variant="ghost"
                disabled={isPending}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
                Delete transaction
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
