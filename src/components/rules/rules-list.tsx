"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface RulesListProps {
  rules: CategorizationRuleRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  onEdit: (rule: CategorizationRuleRow) => void;
  onDelete: (rule: CategorizationRuleRow) => void;
  deletingId: string | null;
}

function categoryName(
  categoryId: string | null,
  categories: CategoryRow[]
): string | null {
  if (!categoryId) return null;
  return categories.find((c) => c.id === categoryId)?.name ?? null;
}

function hmrcName(
  hmrcId: string | null,
  hmrcCategories: HmrcCategoryRow[]
): string | null {
  if (!hmrcId) return null;
  return hmrcCategories.find((h) => h.id === hmrcId)?.name ?? null;
}

export function RulesList({
  rules,
  categories,
  hmrcCategories,
  onEdit,
  onDelete,
  deletingId,
}: RulesListProps) {
  if (rules.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No rules yet. Create one from a transaction or add a rule below.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {rules.map((rule) => {
        const cat = categoryName(rule.category_id, categories);
        const hmrc = hmrcName(rule.hmrc_category_id, hmrcCategories);

        return (
          <li
            key={rule.id}
            className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{rule.name}</p>
                {!rule.is_active && (
                  <Badge variant="muted">Inactive</Badge>
                )}
                <Badge variant="secondary">
                  Priority {rule.priority}
                </Badge>
                <Badge variant="muted">
                  Matched {rule.times_matched}×
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                When{" "}
                <span className="font-medium text-foreground">
                  {rule.match_field === "both"
                    ? "description or merchant"
                    : rule.match_field.replace("_", " ")}{" "}
                  {rule.match_type.replace("_", " ")}
                </span>{" "}
                &quot;{rule.match_value}&quot;
              </p>
              <p className="text-sm text-muted-foreground">
                → {[cat, hmrc].filter(Boolean).join(" · ") || "No categories set"}
                {rule.is_business === true && " · Business"}
                {rule.is_business === false && " · Personal"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(rule)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={deletingId === rule.id}
                onClick={() => onDelete(rule)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
