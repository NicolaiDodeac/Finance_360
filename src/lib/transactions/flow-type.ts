/** How money moved — stored in `raw_import_data.assistant.flow_type`. */
export type FlowType =
  | "income"
  | "living_expense"
  | "savings"
  | "investment"
  | "debt_repayment"
  | "transfer"
  | "tax_payment"
  | "business_income"
  | "business_expense"
  | "refund"
  | "other";

export const FLOW_TYPES: FlowType[] = [
  "income",
  "living_expense",
  "savings",
  "investment",
  "debt_repayment",
  "transfer",
  "tax_payment",
  "business_income",
  "business_expense",
  "refund",
  "other",
];

export function isFlowType(value: string | undefined | null): value is FlowType {
  return Boolean(value && FLOW_TYPES.includes(value as FlowType));
}

/** Short badge label for transaction list. */
export function flowTypeBadgeLabel(flowType: FlowType): string | null {
  switch (flowType) {
    case "savings":
      return "Savings";
    case "investment":
      return "Investment";
    case "debt_repayment":
      return "Debt repayment";
    case "transfer":
      return "Transfer";
    case "tax_payment":
      return "Tax payment";
    case "business_income":
    case "business_expense":
      return "Business";
    default:
      return null;
  }
}
