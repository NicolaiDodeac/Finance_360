import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import {
  flowTypeReviewSummary,
  getFlowTypeForCategoryChoice,
  getFlowTypeForIncomeType,
} from "@/lib/categorization/categorise-flow/flow-mappings";
import {
  INCOME_TYPE_SPECS,
  type IncomeTypeChoiceId,
} from "@/lib/categorization/categorise-flow/income-types";
import type {
  CategoryChoiceId,
  ResolvedCategorisation,
} from "@/lib/categorization/categorise-flow/types";
import type { TransactionDirection } from "@/types/database";

/** Plain-language HMRC labels for review sentences. */
const HMRC_TAX_LABELS: Record<string, string> = {
  phone_office_stationery: "Office costs",
  other_business_expenses: "Other business expenses",
  cost_of_goods: "Cost of goods",
  car_van_travel: "Travel costs",
  rent_rates_power: "Premises and utilities",
  repairs_maintenance: "Repairs and maintenance",
  advertising_marketing: "Advertising and marketing",
  training: "Training",
  accountancy_legal_professional: "Professional fees",
  bank_credit_card_charges: "Bank and finance charges",
  equipment_tools: "Equipment and tools",
  personal_private: "Personal (not allowable)",
};

function taxLabelForHmrc(
  hmrcCode: string | null | undefined,
  hmrcDisplayName: string | null | undefined
): string | null {
  if (hmrcCode && HMRC_TAX_LABELS[hmrcCode]) {
    return HMRC_TAX_LABELS[hmrcCode];
  }
  if (hmrcDisplayName) {
    return hmrcDisplayName;
  }
  return null;
}

function friendlyExpensePhrase(choiceId: CategoryChoiceId): string {
  const spec = CHOICE_SPECS[choiceId];
  const label = spec.label.toLowerCase();

  if (choiceId === "software_digital") return "software";
  if (choiceId === "mixed_personal_business") return "mixed";
  if (choiceId === "biz_phone_internet") return "phone or internet";
  if (choiceId === "fuel_travel") return "travel";
  if (choiceId === "bank_fees_finance") return "bank or finance";
  if (choiceId === "premises_utilities") return "premises or utilities";
  if (choiceId === "savings_contribution") return "savings";
  if (choiceId === "investment_contribution") return "investing";
  if (choiceId === "debt_repayment" || choiceId === "credit_card_repayment") {
    return "debt repayment";
  }
  if (choiceId === "transfer_between_accounts") return "transfer";
  if (choiceId === "tax_payment") return "tax payment";

  return label;
}

function buildIncomeReviewSummary(incomeTypeId: IncomeTypeChoiceId): string {
  const flow = getFlowTypeForIncomeType(incomeTypeId);
  const flowLine = flowTypeReviewSummary(flow.flowType);

  switch (incomeTypeId) {
    case "employment_salary":
      return `${flowLine} It will not count as self-employed turnover.`;
    case "self_employed_income":
      return flowLine;
    case "account_transfer":
      return flowLine;
    case "refund_income":
      return flowLine;
    case "investment_income":
      return `${flowLine} It will not count as self-employed turnover.`;
    case "gift_income":
    case "benefit_payment":
    case "other_income":
      return `${flowLine} It will not count as self-employed turnover.`;
    default:
      return "We'll flag this for review so you can decide later.";
  }
}

function buildExpenseFlowSummary(choiceId: CategoryChoiceId): string | null {
  const flow = getFlowTypeForCategoryChoice(choiceId);
  if (
    flow.flowType === "savings" ||
    flow.flowType === "investment" ||
    flow.flowType === "debt_repayment" ||
    flow.flowType === "transfer" ||
    flow.flowType === "tax_payment" ||
    flow.flowType === "living_expense"
  ) {
    return flowTypeReviewSummary(flow.flowType);
  }
  return null;
}

export function buildReviewSummary(
  choiceId: CategoryChoiceId | IncomeTypeChoiceId,
  direction: TransactionDirection,
  resolved: ResolvedCategorisation,
  hmrcCategories: { id: string; code: string; name: string }[],
  businessUsePercent: number | null,
  hmrcOverrideId?: string | null
): string {
  if (resolved.flowType) {
    const fromResolved = flowTypeReviewSummary(resolved.flowType);
    if (
      resolved.flowType === "savings" ||
      resolved.flowType === "investment" ||
      resolved.flowType === "debt_repayment" ||
      resolved.flowType === "transfer" ||
      resolved.flowType === "tax_payment" ||
      resolved.flowType === "living_expense" ||
      resolved.flowType === "refund"
    ) {
      return fromResolved;
    }
  }

  if (direction === "income" && choiceId in INCOME_TYPE_SPECS) {
    return buildIncomeReviewSummary(choiceId as IncomeTypeChoiceId);
  }

  const hmrcId =
    hmrcOverrideId !== undefined ? hmrcOverrideId : resolved.hmrcCategoryId;
  const hmrcRow = hmrcCategories.find((h) => h.id === hmrcId);
  const hmrcCode = hmrcRow?.code ?? null;
  const hmrcName = taxLabelForHmrc(hmrcCode, hmrcRow?.name ?? resolved.hmrcCategoryName);

  if (direction === "income") {
    if (choiceId === "salary") {
      return "We'll treat this as employment salary. It will not count as self-employed turnover.";
    }
    if (choiceId === "business_turnover") {
      return flowTypeReviewSummary("business_income");
    }
    if (resolved.purpose === "business") {
      if (choiceId === "business_refund") {
        return flowTypeReviewSummary("refund");
      }
      if (choiceId === "owner_transfer") {
        return flowTypeReviewSummary("transfer");
      }
      return flowTypeReviewSummary("business_income");
    }
    return `We'll treat this as personal income (${resolved.choiceLabel.toLowerCase()}). It will not count as self-employed turnover.`;
  }

  const expenseFlow = buildExpenseFlowSummary(choiceId as CategoryChoiceId);
  if (expenseFlow) {
    return expenseFlow;
  }

  const phrase = friendlyExpensePhrase(choiceId as CategoryChoiceId);

  if (resolved.purpose === "personal") {
    return `We'll treat this as a personal ${phrase} expense.`;
  }

  if (choiceId === "mixed_personal_business" && businessUsePercent !== null) {
    const taxPart = hmrcName
      ? ` and organise it under ${hmrcName} for tax`
      : "";
    return `We'll treat this as a mixed expense (about ${businessUsePercent}% for business)${taxPart}.`;
  }

  if (hmrcName) {
    return `We'll treat this as a business ${phrase} expense and organise it under ${hmrcName} for tax.`;
  }

  return `We'll treat this as a business ${phrase} expense.`;
}

export function buildApplyToastMessages(
  transactionCount: number,
  remembered: boolean,
  markReviewRecommended?: boolean
): { primary: string; secondary?: string } {
  if (markReviewRecommended) {
    return {
      primary: `Marked for review — ${transactionCount} transaction${transactionCount === 1 ? "" : "s"}.`,
    };
  }

  const primary = `Done — ${transactionCount} similar transaction${transactionCount === 1 ? "" : "s"} updated.`;
  const secondary = remembered ? "We'll remember this next time." : undefined;
  return { primary, secondary };
}
