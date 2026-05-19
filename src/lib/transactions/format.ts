import type { TransactionDirection } from "@/types/database";

const gbpFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
});

export function formatMoney(amount: number, currency = "GBP"): string {
  if (currency === "GBP") {
    return gbpFormatter.format(amount);
  }
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatTransactionDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatShortDate(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
  }).format(date);
}

export function signedAmount(
  amount: number,
  direction: TransactionDirection
): number {
  if (direction === "income") return amount;
  if (direction === "expense") return -amount;
  return amount;
}

export function directionLabel(direction: TransactionDirection): string {
  switch (direction) {
    case "income":
      return "Income";
    case "expense":
      return "Expense";
    case "transfer":
      return "Transfer";
  }
}
