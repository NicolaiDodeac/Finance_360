import type { IncomeTypeChoiceId } from "@/lib/categorization/categorise-flow/income-types";
import type {
  CategorisePurpose,
  CategoryChoiceId,
} from "@/lib/categorization/categorise-flow/types";
import type { FlowType } from "@/lib/transactions/flow-type";

export interface FlowTypeFlags {
  flowType: FlowType;
  excludeFromIncome: boolean;
  excludeFromSpending: boolean;
  countsAsTurnover: boolean;
}

const LIVING: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: false,
  countsAsTurnover: false,
};

const SAVINGS: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const INVESTMENT: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const DEBT: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const TRANSFER: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const TAX_PAYMENT: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const INCOME: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: false,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const REFUND: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

const BUSINESS_EXPENSE: Omit<FlowTypeFlags, "flowType"> = {
  excludeFromIncome: true,
  excludeFromSpending: true,
  countsAsTurnover: false,
};

export const CATEGORY_CHOICE_FLOW: Record<CategoryChoiceId, FlowTypeFlags> = {
  salary: { flowType: "income", ...INCOME },
  refund: { flowType: "refund", ...REFUND },
  own_transfer: { flowType: "transfer", ...TRANSFER },
  gift: { flowType: "income", ...INCOME },
  other_personal_income: { flowType: "income", ...INCOME },
  groceries: { flowType: "living_expense", ...LIVING },
  rent_mortgage: { flowType: "living_expense", ...LIVING },
  utilities: { flowType: "living_expense", ...LIVING },
  phone_internet: { flowType: "living_expense", ...LIVING },
  subscriptions: { flowType: "living_expense", ...LIVING },
  transport: { flowType: "living_expense", ...LIVING },
  fuel: { flowType: "living_expense", ...LIVING },
  insurance: { flowType: "living_expense", ...LIVING },
  children_family: { flowType: "living_expense", ...LIVING },
  eating_out: { flowType: "living_expense", ...LIVING },
  entertainment: { flowType: "living_expense", ...LIVING },
  clothing: { flowType: "living_expense", ...LIVING },
  health: { flowType: "living_expense", ...LIVING },
  car_maintenance: { flowType: "living_expense", ...LIVING },
  education: { flowType: "living_expense", ...LIVING },
  bank_fees: { flowType: "living_expense", ...LIVING },
  other_personal_expense: { flowType: "living_expense", ...LIVING },
  savings_contribution: { flowType: "savings", ...SAVINGS },
  investment_contribution: { flowType: "investment", ...INVESTMENT },
  debt_repayment: { flowType: "debt_repayment", ...DEBT },
  credit_card_repayment: { flowType: "debt_repayment", ...DEBT },
  transfer_between_accounts: { flowType: "transfer", ...TRANSFER },
  tax_payment: { flowType: "tax_payment", ...TAX_PAYMENT },
  business_turnover: {
    flowType: "business_income",
    excludeFromIncome: false,
    excludeFromSpending: true,
    countsAsTurnover: true,
  },
  business_refund: { flowType: "refund", ...REFUND },
  owner_transfer: { flowType: "transfer", ...TRANSFER },
  other_business_income: {
    flowType: "business_income",
    excludeFromIncome: false,
    excludeFromSpending: true,
    countsAsTurnover: false,
  },
  software_digital: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  biz_phone_internet: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  stock_materials: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  equipment_tools: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  fuel_travel: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  advertising_marketing: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  training_education: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  professional_help: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  bank_fees_finance: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  premises_utilities: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  repairs_maintenance: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  mixed_personal_business: { flowType: "business_expense", ...BUSINESS_EXPENSE },
  other_business_expense: { flowType: "business_expense", ...BUSINESS_EXPENSE },
};

export const INCOME_TYPE_FLOW: Record<IncomeTypeChoiceId, FlowTypeFlags> = {
  employment_salary: { flowType: "income", ...INCOME },
  self_employed_income: {
    flowType: "business_income",
    excludeFromIncome: false,
    excludeFromSpending: true,
    countsAsTurnover: true,
  },
  account_transfer: { flowType: "transfer", ...TRANSFER },
  refund_income: { flowType: "refund", ...REFUND },
  investment_income: { flowType: "income", ...INCOME },
  gift_income: { flowType: "income", ...INCOME },
  benefit_payment: { flowType: "income", ...INCOME },
  other_income: { flowType: "income", ...INCOME },
  income_not_sure: {
    flowType: "other",
    excludeFromIncome: false,
    excludeFromSpending: false,
    countsAsTurnover: false,
  },
};

export function getFlowTypeForCategoryChoice(
  choiceId: CategoryChoiceId
): FlowTypeFlags {
  return CATEGORY_CHOICE_FLOW[choiceId];
}

export function getFlowTypeForIncomeType(
  incomeTypeId: IncomeTypeChoiceId
): FlowTypeFlags {
  return INCOME_TYPE_FLOW[incomeTypeId];
}

/** Infer flow type when a rule only provides category slug (no assistant metadata). */
export function inferFlowTypeFromCategorySlug(
  slug: string | undefined,
  direction: string,
  isBusiness: boolean
): FlowType | null {
  if (!slug) return null;

  if (direction === "income") {
    if (slug === "self-employed-income" && isBusiness) return "business_income";
    if (slug === "savings-transfer") return "transfer";
    if (slug === "refunds") return "refund";
    if (
      slug === "salary" ||
      slug === "investment-income" ||
      slug === "benefits" ||
      slug === "gifts" ||
      slug === "other-income"
    ) {
      return isBusiness ? "business_income" : "income";
    }
    return isBusiness ? "business_income" : "income";
  }

  if (slug === "savings-contribution") return "savings";
  if (slug === "investment-contribution") return "investment";
  if (slug === "debt-repayment") return "debt_repayment";
  if (slug === "savings-transfer") return "transfer";
  if (slug === "tax-payment") return "tax_payment";
  if (isBusiness) return "business_expense";

  const livingSlugs = new Set([
    "groceries",
    "rent-mortgage",
    "utilities",
    "phone-internet",
    "subscriptions",
    "transport",
    "fuel",
    "insurance",
    "children-family",
    "eating-out",
    "entertainment",
    "clothing",
    "health",
    "car-maintenance",
    "education",
    "bank-fees",
    "personal-care",
    "other-expense",
  ]);
  if (livingSlugs.has(slug)) return "living_expense";

  return null;
}

export function inferFlowTypeFromLegacyAssistant(
  direction: string,
  isBusiness: boolean,
  incomeType?: string,
  categoryChoice?: string,
  excludeFromIncome?: boolean,
  excludeFromSpending?: boolean,
  countsAsTurnover?: boolean
): FlowType | null {
  if (incomeType && incomeType in INCOME_TYPE_FLOW) {
    return INCOME_TYPE_FLOW[incomeType as IncomeTypeChoiceId].flowType;
  }
  if (categoryChoice && categoryChoice in CATEGORY_CHOICE_FLOW) {
    return CATEGORY_CHOICE_FLOW[categoryChoice as CategoryChoiceId].flowType;
  }

  if (incomeType === "account_transfer" || categoryChoice === "own_transfer") {
    return "transfer";
  }
  if (
    incomeType === "refund_income" ||
    categoryChoice === "refund" ||
    categoryChoice === "business_refund"
  ) {
    return "refund";
  }
  if (
    incomeType === "self_employed_income" ||
    categoryChoice === "business_turnover"
  ) {
    return "business_income";
  }

  if (direction === "income") {
    if (excludeFromIncome) return "transfer";
    if (isBusiness || countsAsTurnover) return "business_income";
    return "income";
  }

  if (direction === "expense") {
    if (excludeFromSpending) {
      if (isBusiness) return "business_expense";
      return "transfer";
    }
    if (isBusiness) return "business_expense";
    return "living_expense";
  }

  return null;
}

export function flowTypeReviewSummary(flowType: FlowType): string {
  switch (flowType) {
    case "savings":
      return "We'll treat this as savings, not spending.";
    case "investment":
      return "We'll treat this as investing, not everyday spending.";
    case "debt_repayment":
      return "We'll treat this as debt repayment, so it won't affect lifestyle spending.";
    case "transfer":
      return "We'll treat this as a transfer and exclude it from insights.";
    case "living_expense":
      return "We'll treat this as everyday spending.";
    case "business_expense":
      return "We'll treat this as a business expense for tax — not personal lifestyle spending.";
    case "business_income":
      return "We'll treat this as business income. It will count toward your self-employed turnover.";
    case "income":
      return "We'll treat this as personal income.";
    case "refund":
      return "We'll treat this as a refund. It won't inflate your income totals.";
    case "tax_payment":
      return "We'll treat this as a tax payment, separate from everyday spending.";
    default:
      return "We'll save how you want this treated.";
  }
}

export function flowFlagsForPurposeChoice(
  purpose: CategorisePurpose,
  choiceId: CategoryChoiceId
): FlowTypeFlags {
  const flags = getFlowTypeForCategoryChoice(choiceId);
  if (purpose === "business" && flags.flowType === "living_expense") {
    return { ...flags, flowType: "business_expense", ...BUSINESS_EXPENSE };
  }
  return flags;
}
