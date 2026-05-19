"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { TransactionFormFields } from "@/components/transactions/transaction-form-fields";
import { updateTransaction } from "@/lib/transactions/actions";
import { transactionToFormInput } from "@/lib/transactions/form";
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

  return (
    <Drawer open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent>
        {transaction && activeForm && (
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
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
              <TransactionFormFields
                value={activeForm}
                onChange={setForm}
                accounts={accounts}
                categories={categories}
                hmrcCategories={hmrcCategories}
                disabled={isPending}
              />
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

            <DrawerFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save changes"}
              </Button>
            </DrawerFooter>
          </form>
        )}
      </DrawerContent>
    </Drawer>
  );
}
