"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { CategoryRow } from "@/lib/categories/queries";
import {
  getCategoryOptionLabel,
  getSelectableCategories,
} from "@/lib/categories/display";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { QuickAddDraft } from "@/lib/quick-add/types";
import { flowTypeBadgeLabel } from "@/lib/transactions/flow-type";
import { formatMoney } from "@/lib/transactions/format";
import type { TransactionDirection } from "@/types/database";

interface QuickAddDraftCardProps {
  draft: QuickAddDraft;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  currency?: string;
  dateMin?: string;
  dateMax?: string;
  editing: boolean;
  disabled?: boolean;
  onEdit: () => void;
  onDiscard: () => void;
  onChange: (draft: QuickAddDraft) => void;
  onDoneEdit: () => void;
}

const directions: { value: TransactionDirection; label: string }[] = [
  { value: "expense", label: "Expense" },
  { value: "income", label: "Income" },
  { value: "transfer", label: "Transfer" },
];

export function QuickAddDraftCard({
  draft,
  categories,
  hmrcCategories,
  currency = "GBP",
  dateMin,
  dateMax,
  editing,
  disabled,
  onEdit,
  onDiscard,
  onChange,
  onDoneEdit,
}: QuickAddDraftCardProps) {
  const flowBadge = draft.flowType ? flowTypeBadgeLabel(draft.flowType) : null;

  if (editing) {
    return (
      <div className="rounded-xl border border-primary/30 bg-card p-4 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">Edit draft</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled}
            onClick={onDiscard}
          >
            <Trash2 className="h-4 w-4" />
            Discard
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`date-${draft.id}`}>Date</Label>
            <Input
              id={`date-${draft.id}`}
              type="date"
              value={draft.transaction_date}
              min={dateMin}
              max={dateMax}
              disabled={disabled}
              onChange={(e) =>
                onChange({ ...draft, transaction_date: e.target.value })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`dir-${draft.id}`}>Direction</Label>
            <Select
              id={`dir-${draft.id}`}
              value={draft.direction}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...draft,
                  direction: e.target.value as TransactionDirection,
                })
              }
            >
              {directions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`merchant-${draft.id}`}>Merchant / description</Label>
            <Input
              id={`merchant-${draft.id}`}
              value={draft.merchant_name}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...draft,
                  merchant_name: e.target.value,
                  description: e.target.value,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`amount-${draft.id}`}>Amount</Label>
            <Input
              id={`amount-${draft.id}`}
              type="number"
              min={0}
              step="0.01"
              value={draft.amount || ""}
              disabled={disabled}
              onChange={(e) =>
                onChange({
                  ...draft,
                  amount: Number.parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`cat-${draft.id}`}>Category</Label>
            <Select
              id={`cat-${draft.id}`}
              value={draft.categoryId ?? ""}
              disabled={disabled}
              onChange={(e) => {
                const cat = categories.find((c) => c.id === e.target.value);
                onChange({
                  ...draft,
                  categoryId: e.target.value || null,
                  categoryName: cat?.name ?? null,
                });
              }}
            >
              <option value="">Suggested / none</option>
              {getSelectableCategories(categories).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {getCategoryOptionLabel(cat, categories)}
                </option>
              ))}
            </Select>
          </div>
          {draft.isBusiness ? (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor={`hmrc-${draft.id}`}>HMRC category</Label>
              <Select
                id={`hmrc-${draft.id}`}
                value={draft.hmrcCategoryId ?? ""}
                disabled={disabled}
                onChange={(e) => {
                  const hmrc = hmrcCategories.find(
                    (h) => h.id === e.target.value
                  );
                  onChange({
                    ...draft,
                    hmrcCategoryId: e.target.value || null,
                    hmrcCategoryName: hmrc?.name ?? null,
                    hmrcCategoryCode: hmrc?.code ?? null,
                  });
                }}
              >
                <option value="">None</option>
                {hmrcCategories.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}
        </div>

        <Button type="button" size="sm" disabled={disabled} onClick={onDoneEdit}>
          Done editing
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-medium">{draft.merchant_name || "Untitled"}</p>
          <p className="text-sm text-muted-foreground tabular-nums">
            {formatMoney(draft.amount, currency)} · {draft.direction}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge
            variant={
              draft.confidence === "high" ? "secondary" : "warning"
            }
          >
            {draft.confidence === "high" ? "High confidence" : "Review recommended"}
          </Badge>
          {flowBadge ? <Badge variant="muted">{flowBadge}</Badge> : null}
        </div>
      </div>

      <dl className="grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        <div>
          <dt className="inline">Date: </dt>
          <dd className="inline text-foreground">{draft.transaction_date}</dd>
        </div>
        {draft.categoryName ? (
          <div>
            <dt className="inline">Category: </dt>
            <dd className="inline text-foreground">{draft.categoryName}</dd>
          </div>
        ) : null}
        {draft.purpose === "business" || draft.isBusiness ? (
          <div>
            <dt className="inline">Purpose: </dt>
            <dd className="inline text-foreground">Business</dd>
          </div>
        ) : null}
        {draft.hmrcCategoryName ? (
          <div className="sm:col-span-2">
            <dt className="inline">HMRC: </dt>
            <dd className="inline text-foreground">{draft.hmrcCategoryName}</dd>
          </div>
        ) : null}
      </dl>

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={onEdit}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={onDiscard}
        >
          <Trash2 className="h-4 w-4" />
          Discard
        </Button>
      </div>
    </div>
  );
}
