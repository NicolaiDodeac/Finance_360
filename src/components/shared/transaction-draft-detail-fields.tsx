"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { ReceiptPaymentMethod } from "@/types/database";

export interface TransactionDraftDetailFieldsProps {
  merchant: string;
  transactionDate: string;
  amount: number | null;
  onMerchantChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAmountChange: (value: number | null) => void;
  disabled?: boolean;
  idPrefix?: string;
  dateMin?: string;
  dateMax?: string;
  /** Show payment method row (receipt capture). */
  paymentMethod?: ReceiptPaymentMethod | null;
  onPaymentMethodChange?: (value: ReceiptPaymentMethod | null) => void;
}

/**
 * Merchant, date, and amount fields shared by Quick Add drafts and receipt capture.
 */
export function TransactionDraftDetailFields({
  merchant,
  transactionDate,
  amount,
  onMerchantChange,
  onDateChange,
  onAmountChange,
  disabled,
  idPrefix = "draft",
  dateMin,
  dateMax,
  paymentMethod,
  onPaymentMethodChange,
}: TransactionDraftDetailFieldsProps) {
  const showPayment = onPaymentMethodChange !== undefined;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor={`${idPrefix}-merchant`}>Merchant / description</Label>
        <Input
          id={`${idPrefix}-merchant`}
          value={merchant}
          disabled={disabled}
          onChange={(e) => onMerchantChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-date`}>Date</Label>
        <Input
          id={`${idPrefix}-date`}
          type="date"
          value={transactionDate}
          min={dateMin}
          max={dateMax}
          disabled={disabled}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${idPrefix}-amount`}>Amount</Label>
        <Input
          id={`${idPrefix}-amount`}
          type="number"
          min={0}
          step="0.01"
          value={amount ?? ""}
          disabled={disabled}
          onChange={(e) => {
            const raw = e.target.value;
            onAmountChange(raw === "" ? null : Number.parseFloat(raw) || 0);
          }}
        />
      </div>
      {showPayment ? (
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-payment`}>How did you pay?</Label>
          <Select
            id={`${idPrefix}-payment`}
            value={paymentMethod ?? ""}
            disabled={disabled}
            onChange={(e) => {
              const v = e.target.value;
              onPaymentMethodChange!(
                v === "cash" ||
                  v === "card" ||
                  v === "contactless" ||
                  v === "unknown"
                  ? v
                  : null
              );
            }}
          >
            <option value="">Not sure</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="contactless">Contactless</option>
            <option value="unknown">Other</option>
          </Select>
        </div>
      ) : null}
    </div>
  );
}
