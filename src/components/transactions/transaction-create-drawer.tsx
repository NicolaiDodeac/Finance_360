"use client";

import { useState, useTransition } from "react";
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
import { TransactionCategorisationReview } from "@/components/transactions/transaction-categorisation-review";
import { TransactionCoreFields } from "@/components/transactions/transaction-core-fields";
import { createTransaction } from "@/lib/transactions/actions";
import { emptyTransactionForm } from "@/lib/transactions/form";
import type { AccountRow } from "@/lib/accounts/queries";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";

interface TransactionCreateDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  accounts: AccountRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  defaultAccountId: string;
}

export function TransactionCreateDrawer({
  open,
  onOpenChange,
  accounts,
  categories,
  hmrcCategories,
  defaultAccountId,
}: TransactionCreateDrawerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<TransactionFormInput>(() =>
    emptyTransactionForm(defaultAccountId)
  );

  function handleOpenChange(next: boolean) {
    if (!next) {
      setError(null);
      setForm(emptyTransactionForm(defaultAccountId));
    }
    onOpenChange(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createTransaction(form);
      if (!result.success) {
        setError(result.error ?? "Could not create transaction.");
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <form
          id="transaction-create-form"
          onSubmit={handleSubmit}
          className="flex h-full flex-col"
        >
          <DrawerHeader>
            <DrawerTitle>Add transaction</DrawerTitle>
            <DrawerDescription>
              Record income, spending, or a transfer manually.
            </DrawerDescription>
          </DrawerHeader>

          <DrawerBody>
            {error && (
              <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {error}
              </p>
            )}
            <TransactionCoreFields
              value={form}
              onChange={setForm}
              accounts={accounts}
              disabled={isPending}
            />
            <div className="mt-6">
              <TransactionCategorisationReview
                form={form}
                onChange={setForm}
                categories={categories}
                hmrcCategories={hmrcCategories}
                disabled={isPending}
                onSave={() => {
                  const el = document.getElementById(
                    "transaction-create-form"
                  ) as HTMLFormElement | null;
                  el?.requestSubmit();
                }}
                isPending={isPending}
                confirmLabel={isPending ? "Saving…" : "Save transaction"}
              />
            </div>
          </DrawerBody>

          <DrawerFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isPending}
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
