import type {
  CategorisePurpose,
  CategoryChoiceId,
  PlainChoice,
} from "@/lib/categorization/categorise-flow/types";
import type { TransactionDirection } from "@/types/database";

export interface ChoiceSpec {
  label: string;
  categorySlug: string | null;
  hmrcCode: string | null;
  isBusiness: boolean;
  evidenceRecommendation: string | null;
  requiresBusinessUsePercent?: boolean;
}

export const CHOICE_SPECS: Record<CategoryChoiceId, ChoiceSpec> = {
  salary: {
    label: "Salary",
    categorySlug: "salary",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  refund: {
    label: "Refund",
    categorySlug: "refunds",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  own_transfer: {
    label: "Transfer from own account",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  gift: {
    label: "Gift",
    categorySlug: "gifts",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  other_personal_income: {
    label: "Other income",
    categorySlug: "other-income",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  groceries: {
    label: "Groceries",
    categorySlug: "groceries",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  rent_mortgage: {
    label: "Rent / mortgage",
    categorySlug: "rent-mortgage",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  utilities: {
    label: "Utilities",
    categorySlug: "utilities",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  phone_internet: {
    label: "Phone / internet",
    categorySlug: "phone-internet",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  subscriptions: {
    label: "Subscriptions",
    categorySlug: "subscriptions",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  transport: {
    label: "Transport",
    categorySlug: "transport",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  fuel: {
    label: "Fuel",
    categorySlug: "fuel",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  insurance: {
    label: "Insurance",
    categorySlug: "insurance",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  children_family: {
    label: "Children / family",
    categorySlug: "children-family",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  eating_out: {
    label: "Eating out",
    categorySlug: "eating-out",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  entertainment: {
    label: "Entertainment",
    categorySlug: "entertainment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  clothing: {
    label: "Shopping / clothing",
    categorySlug: "clothing",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  health: {
    label: "Health",
    categorySlug: "health",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  car_maintenance: {
    label: "Car maintenance",
    categorySlug: "car-maintenance",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  education: {
    label: "Education",
    categorySlug: "education",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  bank_fees: {
    label: "Bank fees",
    categorySlug: "bank-fees",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  savings_contribution: {
    label: "Savings contribution",
    categorySlug: "savings-contribution",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  investment_contribution: {
    label: "Investment contribution",
    categorySlug: "investment-contribution",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  debt_repayment: {
    label: "Debt repayment",
    categorySlug: "debt-repayment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  credit_card_repayment: {
    label: "Credit card repayment",
    categorySlug: "debt-repayment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  transfer_between_accounts: {
    label: "Transfer between accounts",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  tax_payment: {
    label: "Tax payment",
    categorySlug: "tax-payment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  other_personal_expense: {
    label: "Other personal expense",
    categorySlug: "other-expense",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  business_turnover: {
    label: "Business income / turnover",
    categorySlug: "self-employed-income",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation:
      "Keep invoices or payment records — this counts as trading turnover.",
  },
  business_refund: {
    label: "Business refund",
    categorySlug: "refunds",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation: null,
  },
  owner_transfer: {
    label: "Owner transfer",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
  },
  other_business_income: {
    label: "Other business income",
    categorySlug: "other-income",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation: null,
  },
  software_digital: {
    label: "Software / digital tools",
    categorySlug: "subscriptions",
    hmrcCode: "other_business_expenses",
    isBusiness: true,
    evidenceRecommendation: "Receipt or invoice helps for software subscriptions.",
  },
  biz_phone_internet: {
    label: "Phone / internet",
    categorySlug: "phone-internet",
    hmrcCode: "phone_office_stationery",
    isBusiness: true,
    evidenceRecommendation: "Phone or broadband bill supports business use.",
  },
  stock_materials: {
    label: "Products, stock or materials",
    categorySlug: "other-expense",
    hmrcCode: "cost_of_goods",
    isBusiness: true,
    evidenceRecommendation: "Supplier invoice is ideal for stock and materials.",
  },
  equipment_tools: {
    label: "Equipment or tools",
    categorySlug: "other-expense",
    hmrcCode: "equipment_tools",
    isBusiness: true,
    evidenceRecommendation: "Keep the purchase receipt for equipment and tools.",
  },
  fuel_travel: {
    label: "Fuel, parking or travel",
    categorySlug: "fuel",
    hmrcCode: "car_van_travel",
    isBusiness: true,
    evidenceRecommendation: "Mileage log or travel receipt strengthens your records.",
  },
  advertising_marketing: {
    label: "Advertising, website or marketing",
    categorySlug: "other-expense",
    hmrcCode: "advertising_marketing",
    isBusiness: true,
    evidenceRecommendation: "Invoice or receipt for ads and marketing costs.",
  },
  training_education: {
    label: "Training or education",
    categorySlug: "education",
    hmrcCode: "training",
    isBusiness: true,
    evidenceRecommendation: "Course invoice or booking confirmation.",
  },
  professional_help: {
    label: "Professional help",
    categorySlug: "other-expense",
    hmrcCode: "accountancy_legal_professional",
    isBusiness: true,
    evidenceRecommendation: "Professional invoice is the best evidence.",
  },
  bank_fees_finance: {
    label: "Bank fees / finance charges",
    categorySlug: "bank-fees",
    hmrcCode: "bank_credit_card_charges",
    isBusiness: true,
    evidenceRecommendation: "Bank statement usually covers fees and charges.",
  },
  premises_utilities: {
    label: "Business premises / rent / utilities",
    categorySlug: "utilities",
    hmrcCode: "rent_rates_power",
    isBusiness: true,
    evidenceRecommendation: "Utility or premises bill supports this expense.",
  },
  repairs_maintenance: {
    label: "Repairs or maintenance",
    categorySlug: "car-maintenance",
    hmrcCode: "repairs_maintenance",
    isBusiness: true,
    evidenceRecommendation: "Repair invoice or receipt.",
  },
  mixed_personal_business: {
    label: "Mixed personal and business",
    categorySlug: "other-expense",
    hmrcCode: "other_business_expenses",
    isBusiness: true,
    evidenceRecommendation:
      "Note how much was for business — a receipt plus your percentage is helpful.",
    requiresBusinessUsePercent: true,
  },
  other_business_expense: {
    label: "Other business expense",
    categorySlug: "other-expense",
    hmrcCode: "other_business_expenses",
    isBusiness: true,
    evidenceRecommendation: null,
  },
};

const PERSONAL_INCOME_IDS: CategoryChoiceId[] = [
  "salary",
  "refund",
  "own_transfer",
  "gift",
  "other_personal_income",
];

const PERSONAL_EXPENSE_IDS: CategoryChoiceId[] = [
  "groceries",
  "rent_mortgage",
  "utilities",
  "phone_internet",
  "subscriptions",
  "transport",
  "fuel",
  "insurance",
  "children_family",
  "eating_out",
  "entertainment",
  "clothing",
  "health",
  "car_maintenance",
  "education",
  "bank_fees",
  "savings_contribution",
  "investment_contribution",
  "debt_repayment",
  "credit_card_repayment",
  "transfer_between_accounts",
  "tax_payment",
  "other_personal_expense",
];

const BUSINESS_INCOME_IDS: CategoryChoiceId[] = [
  "business_turnover",
  "business_refund",
  "owner_transfer",
  "other_business_income",
];

const BUSINESS_EXPENSE_IDS: CategoryChoiceId[] = [
  "software_digital",
  "biz_phone_internet",
  "stock_materials",
  "equipment_tools",
  "fuel_travel",
  "advertising_marketing",
  "training_education",
  "professional_help",
  "bank_fees_finance",
  "premises_utilities",
  "repairs_maintenance",
  "mixed_personal_business",
  "other_business_expense",
];

function toChoices(ids: CategoryChoiceId[]): PlainChoice[] {
  return ids.map((id) => ({
    id,
    label: CHOICE_SPECS[id].label,
  }));
}

export function getCategoryChoices(
  purpose: CategorisePurpose,
  direction: TransactionDirection
): PlainChoice[] {
  if (purpose === "not_sure") return [];

  const income = direction === "income";

  if (purpose === "personal") {
    return toChoices(income ? PERSONAL_INCOME_IDS : PERSONAL_EXPENSE_IDS);
  }

  return toChoices(income ? BUSINESS_INCOME_IDS : BUSINESS_EXPENSE_IDS);
}

export const FLOW_COPY = {
  tagline: "Teach once. We'll remember next time.",
  expensePurposeQuestion: "What was this for?",
  expensePurposeHint:
    "Personal, business, or not sure — then choose a category.",
  categoryHint:
    "Choose what it was. Finance 360 handles the tax category where needed.",
  changeLater: "You can always change this later.",
} as const;
