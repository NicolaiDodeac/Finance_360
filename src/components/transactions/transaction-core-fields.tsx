"use client";

import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AccountRow } from "@/lib/accounts/queries";
import type { TransactionFormInput } from "@/lib/transactions/types";
import type { TransactionDirection } from "@/types/database";

interface TransactionCoreFieldsProps {
  value: TransactionFormInput;
  onChange: (value: TransactionFormInput) => void;
  accounts: AccountRow[];
  disabled?: boolean;
}

const directions: { value: TransactionDirection; label: string }[] = [
  { value: "income", label: "Income" },
  { value: "expense", label: "Spending" },
  { value: "transfer", label: "Transfer" },
];

/** Account, date, amount, description — hidden from categorisation review. */
export function TransactionCoreFields({
  value,
  onChange,
  accounts,
  disabled,
}: TransactionCoreFieldsProps) {
  function patch(partial: Partial<TransactionFormInput>) {
    onChange({ ...value, ...partial });
  }

  return (
    <div className="space-y-4">
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

      <FormField label="What was this for?" id="description">
        <Input
          id="description"
          value={value.description}
          disabled={disabled}
          onChange={(e) => patch({ description: e.target.value })}
          placeholder="Short description"
        />
      </FormField>

      <FormField label="Merchant" id="merchant_name">
        <Input
          id="merchant_name"
          value={value.merchant_name}
          disabled={disabled}
          onChange={(e) => patch({ merchant_name: e.target.value })}
          placeholder="Optional"
        />
      </FormField>

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
