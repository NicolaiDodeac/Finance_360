"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
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
import { RulesList } from "@/components/rules/rules-list";
import {
  createCategorizationRule,
  deleteCategorizationRule,
  updateCategorizationRule,
} from "@/lib/categorization/actions";
import {
  emptyRuleForm,
  ruleToFormInput,
} from "@/lib/categorization/rule-form";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface RulesManagerProps {
  rules: CategorizationRuleRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
}

export function RulesManager({
  rules,
  categories,
  hmrcCategories,
}: RulesManagerProps) {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<CategorizationRuleRow | null>(null);
  const [form, setForm] = useState(emptyRuleForm());
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setForm(emptyRuleForm());
    setError(null);
    setDrawerOpen(true);
  }

  function openEdit(rule: CategorizationRuleRow) {
    setEditing(rule);
    setForm(ruleToFormInput(rule));
    setError(null);
    setDrawerOpen(true);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = editing
        ? await updateCategorizationRule(editing.id, form)
        : await createCategorizationRule(form);

      if (!result.success) {
        setError(result.error ?? "Could not save rule.");
        return;
      }

      setDrawerOpen(false);
      router.refresh();
    });
  }

  function handleDelete(rule: CategorizationRuleRow) {
    if (!window.confirm(`Delete rule "${rule.name}"?`)) {
      return;
    }

    setDeletingId(rule.id);
    startTransition(async () => {
      const result = await deleteCategorizationRule(rule.id);
      setDeletingId(null);
      if (!result.success) {
        setError(result.error ?? "Could not delete rule.");
        return;
      }
      router.refresh();
    });
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {rules.length} {rules.length === 1 ? "rule" : "rules"} — remember
          merchants and apply categories automatically.
        </p>
        <Button type="button" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Add rule
        </Button>
      </div>

      {error && !drawerOpen && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {error}
        </p>
      )}

      <RulesList
        rules={rules}
        categories={categories}
        hmrcCategories={hmrcCategories}
        onEdit={openEdit}
        onDelete={handleDelete}
        deletingId={deletingId}
      />

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <form onSubmit={handleSubmit} className="flex h-full flex-col">
            <DrawerHeader>
              <DrawerTitle>
                {editing ? "Edit rule" : "Create rule"}
              </DrawerTitle>
              <DrawerDescription>
                Apply this automatically next time a transaction matches your
                keyword.
              </DrawerDescription>
            </DrawerHeader>

            <DrawerBody>
              {error && (
                <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </p>
              )}
              <RuleFormFields
                value={form}
                onChange={setForm}
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
                onClick={() => setDrawerOpen(false)}
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
