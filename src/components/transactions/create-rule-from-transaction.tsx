"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { RuleFormFields } from "@/components/rules/rule-form-fields";
import { createCategorizationRule } from "@/lib/categorization/actions";
import { ruleFormFromTransaction } from "@/lib/categorization/rule-form";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";

interface CreateRuleFromTransactionProps {
  form: TransactionFormInput;
  transactionLabel: string;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
}

export function CreateRuleFromTransaction({
  form,
  transactionLabel,
  categories,
  hmrcCategories,
  disabled,
}: CreateRuleFromTransactionProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState(() =>
    ruleFormFromTransaction(form, transactionLabel)
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleOpen() {
    setRuleForm(ruleFormFromTransaction(form, transactionLabel));
    setError(null);
    setOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await createCategorizationRule(ruleForm);
      if (!result.success) {
        setError(result.error ?? "Could not save rule.");
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  const hasKeyword =
    form.description.trim() || form.merchant_name.trim();

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || !hasKeyword}
        onClick={handleOpen}
      >
        <Sparkles className="h-4 w-4" />
        Remember this merchant
      </Button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>Remember this merchant</DrawerTitle>
              <DrawerDescription>
                Apply this automatically next time a similar transaction
                appears.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody>
              {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              )}
              <RuleFormFields
                value={ruleForm}
                onChange={setRuleForm}
                categories={categories}
                hmrcCategories={hmrcCategories}
                disabled={isPending}
              />
            </DrawerBody>

            <DrawerFooter>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving…" : "Save rule"}
              </Button>
            </DrawerFooter>
          </form>
        </DrawerContent>
      </Drawer>
    </>
  );
}
