"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AccountRow } from "@/lib/accounts/queries";
import type { CategoryRow } from "@/lib/categories/queries";
import {
  getCategoryOptionLabel,
  getSelectableCategories,
} from "@/lib/categories/display";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

interface TransactionFormFieldsProps {
  value: TransactionFormInput;
  onChange: (value: TransactionFormInput) => void;
  accounts: AccountRow[];
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  disabled?: boolean;
}

const directions: { value: TransactionDirection; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Expense" },
  { value: "transfer", label: "Transfer" },
];

export function TransactionFormFields({
  value,
  onChange,
  accounts,
  categories,
  hmrcCategories,
  disabled,
}: TransactionFormFieldsProps) {
  function patch(partial: Partial<TransactionFormInput>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <FormField label="Account" id="account_id" className="sm:col-span-2">
          <Select
            id="account_id"
            value={value.account_id}
            disabled={disabled}
            onChange={(e) => patch({ account_id: e.target.value })}
            required
          >
            <option value="">Select account</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Date" id="transaction_date">
            <Input
              id="transaction_date"
              type="date"
              value={value.transaction_date}
              disabled={disabled}
              onChange={(e) => patch({ transaction_date: e.target.value })}
              required
            />
          </FormField>

          <FormField label="Direction" id="direction">
            <Select
              id="direction"
              value={value.direction}
              disabled={disabled}
              onChange={(e) =>
                patch({ direction: e.target.value as TransactionDirection })
              }
            >
              {directions.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="Description" id="description">
          <Input
            id="description"
            value={value.description}
            disabled={disabled}
            onChange={(e) => patch({ description: e.target.value })}
            placeholder="What was this for?"
          />
        </FormField>

        <FormField label="Merchant name" id="merchant_name">
          <Input
            id="merchant_name"
            value={value.merchant_name}
            disabled={disabled}
            onChange={(e) => patch({ merchant_name: e.target.value })}
            placeholder="Optional"
          />
        </FormField>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Amount" id="amount">
            <Input
              id="amount"
              type="number"
              min={0}
              step="0.01"
              value={value.amount || ""}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  amount: e.target.value === "" ? 0 : Number(e.target.value),
                })
              }
              required
            />
          </FormField>

          <FormField label="Category" id="category_id">
            <Select
              id="category_id"
              value={value.category_id ?? ""}
              disabled={disabled}
              onChange={(e) =>
                patch({ category_id: e.target.value || null })
              }
            >
              <option value="">Uncategorized</option>
              {getSelectableCategories(categories).map((category) => (
                <option key={category.id} value={category.id}>
                  {getCategoryOptionLabel(category, categories)}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        <FormField label="HMRC category" id="hmrc_category_id">
          <Select
            id="hmrc_category_id"
            value={value.hmrc_category_id ?? ""}
            disabled={disabled}
            onChange={(e) =>
              patch({ hmrc_category_id: e.target.value || null })
            }
          >
            <option value="">None</option>
            {hmrcCategories.map((hmrc) => (
              <option key={hmrc.id} value={hmrc.id}>
                {hmrc.name}
              </option>
            ))}
          </Select>
        </FormField>
      </section>

      <section className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <div className="flex items-center gap-3">
          <input
            id="is_business"
            type="checkbox"
            checked={value.is_business}
            disabled={disabled}
            onChange={(e) =>
              patch({
                is_business: e.target.checked,
                business_use_percent: e.target.checked
                  ? value.business_use_percent ?? 100
                  : null,
              })
            }
            className="h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
          />
          <Label htmlFor="is_business" className="cursor-pointer font-normal">
            Business transaction
          </Label>
        </div>

        {value.is_business && (
          <FormField label="Business use (%)" id="business_use_percent">
            <Input
              id="business_use_percent"
              type="number"
              min={0}
              max={100}
              step="1"
              value={value.business_use_percent ?? 100}
              disabled={disabled}
              onChange={(e) =>
                patch({
                  business_use_percent:
                    e.target.value === "" ? null : Number(e.target.value),
                })
              }
            />
          </FormField>
        )}
      </section>

      <FormField label="Notes" id="notes">
        <Textarea
          id="notes"
          value={value.notes}
          disabled={disabled}
          onChange={(e) => patch({ notes: e.target.value })}
          placeholder="Optional notes"
        />
      </FormField>
    </div>
  );
}

function FormField({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", className)}>
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
