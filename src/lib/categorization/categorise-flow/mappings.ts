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
  keywords?: string[];
}

export const CHOICE_SPECS: Record<CategoryChoiceId, ChoiceSpec> = {
  salary: {
    label: "Salary",
    categorySlug: "salary",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["salary", "wage", "payroll", "employment", "payslip"],
  },
  refund: {
    label: "Refund",
    categorySlug: "refunds",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["refund", "return", "reimbursement"],
  },
  own_transfer: {
    label: "Transfer from own account",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["transfer", "own account", "between accounts"],
  },
  gift: {
    label: "Gift",
    categorySlug: "gifts",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["gift", "present", "donation received"],
  },
  other_personal_income: {
    label: "Other income",
    categorySlug: "other-income",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["income", "other", "misc"],
  },
  groceries: {
    label: "Groceries",
    categorySlug: "groceries",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: [
      "food",
      "grocery",
      "groceries",
      "supermarket",
      "tesco",
      "asda",
      "sainsbury",
      "aldi",
      "lidl",
      "morrisons",
      "shop",
    ],
  },
  rent_mortgage: {
    label: "Rent / mortgage",
    categorySlug: "rent-mortgage",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["rent", "mortgage", "housing", "landlord", "letting"],
  },
  utilities: {
    label: "Utilities",
    categorySlug: "utilities",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["utility", "utilities", "gas", "electric", "electricity", "water"],
  },
  phone_internet: {
    label: "Phone / internet",
    categorySlug: "phone-internet",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["phone", "mobile", "broadband", "internet", "wifi", "sim"],
  },
  subscriptions: {
    label: "Subscriptions",
    categorySlug: "subscriptions",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["subscription", "netflix", "spotify", "streaming", "membership"],
  },
  transport: {
    label: "Transport",
    categorySlug: "transport",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["transport", "train", "bus", "tube", "oyster", "travelcard", "taxi"],
  },
  fuel: {
    label: "Fuel",
    categorySlug: "fuel",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["fuel", "petrol", "diesel", "garage", "filling station"],
  },
  insurance: {
    label: "Insurance",
    categorySlug: "insurance",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["insurance", "premium", "policy"],
  },
  children_family: {
    label: "Children / family",
    categorySlug: "children-family",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["child", "children", "family", "school", "nursery", "parentpay"],
  },
  eating_out: {
    label: "Eating out",
    categorySlug: "eating-out",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: [
      "restaurant",
      "cafe",
      "coffee",
      "takeaway",
      "pizza",
      "pub",
      "bar",
      "food out",
      "dining",
      "deliveroo",
    ],
  },
  entertainment: {
    label: "Entertainment",
    categorySlug: "entertainment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["entertainment", "cinema", "theatre", "concert", "games"],
  },
  clothing: {
    label: "Shopping / clothing",
    categorySlug: "clothing",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["clothing", "clothes", "shopping", "fashion", "retail"],
  },
  health: {
    label: "Health",
    categorySlug: "health",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["health", "medical", "doctor", "dentist", "pharmacy", "optician"],
  },
  car_maintenance: {
    label: "Car maintenance",
    categorySlug: "car-maintenance",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["car", "mot", "service", "repair", "garage", "tyres"],
  },
  education: {
    label: "Education",
    categorySlug: "education",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["education", "course", "tuition", "training", "school fees"],
  },
  bank_fees: {
    label: "Bank fees",
    categorySlug: "bank-fees",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["bank fee", "overdraft", "charge", "interest charge"],
  },
  savings_contribution: {
    label: "Savings contribution",
    categorySlug: "savings-contribution",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: [
      "save",
      "savings",
      "help to save",
      "isa",
      "lisa",
      "moneybox",
      "deposit",
    ],
  },
  investment_contribution: {
    label: "Investment contribution",
    categorySlug: "investment-contribution",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["invest", "investment", "stocks", "shares", "pension pot"],
  },
  debt_repayment: {
    label: "Debt repayment",
    categorySlug: "debt-repayment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["loan", "credit card", "klarna", "repayment", "finance", "debt"],
  },
  credit_card_repayment: {
    label: "Credit card repayment",
    categorySlug: "debt-repayment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["credit card", "card payment", "repayment", "visa", "mastercard"],
  },
  transfer_between_accounts: {
    label: "Transfer between accounts",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["transfer", "between accounts", "own account", "savings transfer"],
  },
  tax_payment: {
    label: "Tax payment",
    categorySlug: "tax-payment",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["tax", "hmrc", "self assessment", "payment on account"],
  },
  other_personal_expense: {
    label: "Other personal expense",
    categorySlug: "other-expense",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["other", "misc", "uncategorised"],
  },
  business_turnover: {
    label: "Business income / turnover",
    categorySlug: "self-employed-income",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation:
      "Keep invoices or payment records — this counts as trading turnover.",
    keywords: ["business", "turnover", "sales", "invoice", "self employed"],
  },
  business_refund: {
    label: "Business refund",
    categorySlug: "refunds",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation: null,
    keywords: ["refund", "business refund", "return"],
  },
  owner_transfer: {
    label: "Owner transfer",
    categorySlug: "savings-transfer",
    hmrcCode: null,
    isBusiness: false,
    evidenceRecommendation: null,
    keywords: ["owner", "transfer", "drawings", "director"],
  },
  other_business_income: {
    label: "Other business income",
    categorySlug: "other-income",
    hmrcCode: null,
    isBusiness: true,
    evidenceRecommendation: null,
    keywords: ["business income", "other income", "misc"],
  },
  software_digital: {
    label: "Software / digital tools",
    categorySlug: "subscriptions",
    hmrcCode: "phone_office_stationery",
    isBusiness: true,
    evidenceRecommendation: "Receipt or invoice helps for software subscriptions.",
    keywords: [
      "software",
      "app",
      "subscription",
      "saas",
      "cursor",
      "adobe",
      "digital",
      "cloud",
    ],
  },
  biz_phone_internet: {
    label: "Phone / internet",
    categorySlug: "phone-internet",
    hmrcCode: "phone_office_stationery",
    isBusiness: true,
    evidenceRecommendation: "Phone or broadband bill supports business use.",
    keywords: ["phone", "mobile", "broadband", "internet", "business line"],
  },
  stock_materials: {
    label: "Products, stock or materials",
    categorySlug: "other-expense",
    hmrcCode: "cost_of_goods",
    isBusiness: true,
    evidenceRecommendation: "Supplier invoice is ideal for stock and materials.",
    keywords: ["stock", "materials", "inventory", "supplier", "goods", "cogs"],
  },
  equipment_tools: {
    label: "Equipment or tools",
    categorySlug: "other-expense",
    hmrcCode: "equipment_tools",
    isBusiness: true,
    evidenceRecommendation: "Keep the purchase receipt for equipment and tools.",
    keywords: ["equipment", "tools", "hardware", "laptop", "machine"],
  },
  fuel_travel: {
    label: "Fuel, parking or travel",
    categorySlug: "fuel",
    hmrcCode: "car_van_travel",
    isBusiness: true,
    evidenceRecommendation: "Mileage log or travel receipt strengthens your records.",
    keywords: ["fuel", "parking", "travel", "mileage", "car", "van", "train"],
  },
  advertising_marketing: {
    label: "Advertising, website or marketing",
    categorySlug: "other-expense",
    hmrcCode: "advertising_marketing",
    isBusiness: true,
    evidenceRecommendation: "Invoice or receipt for ads and marketing costs.",
    keywords: ["advertising", "marketing", "ads", "website", "seo", "social"],
  },
  training_education: {
    label: "Training or education",
    categorySlug: "education",
    hmrcCode: "training",
    isBusiness: true,
    evidenceRecommendation: "Course invoice or booking confirmation.",
    keywords: ["training", "course", "education", "cpd", "learning"],
  },
  professional_help: {
    label: "Professional help",
    categorySlug: "other-expense",
    hmrcCode: "accountancy_legal_professional",
    isBusiness: true,
    evidenceRecommendation: "Professional invoice is the best evidence.",
    keywords: ["accountant", "solicitor", "legal", "professional", "consultant"],
  },
  bank_fees_finance: {
    label: "Bank fees / finance charges",
    categorySlug: "bank-fees",
    hmrcCode: "bank_credit_card_charges",
    isBusiness: true,
    evidenceRecommendation: "Bank statement usually covers fees and charges.",
    keywords: ["bank fee", "finance charge", "interest", "merchant fee"],
  },
  premises_utilities: {
    label: "Business premises / rent / utilities",
    categorySlug: "utilities",
    hmrcCode: "rent_rates_power",
    isBusiness: true,
    evidenceRecommendation: "Utility or premises bill supports this expense.",
    keywords: ["premises", "rent", "rates", "utilities", "office", "shop"],
  },
  repairs_maintenance: {
    label: "Repairs or maintenance",
    categorySlug: "car-maintenance",
    hmrcCode: "repairs_maintenance",
    isBusiness: true,
    evidenceRecommendation: "Repair invoice or receipt.",
    keywords: ["repair", "maintenance", "fix", "service"],
  },
  mixed_personal_business: {
    label: "Mixed personal and business",
    categorySlug: "other-expense",
    hmrcCode: "other_business_expenses",
    isBusiness: true,
    evidenceRecommendation:
      "Note how much was for business — a receipt plus your percentage is helpful.",
    requiresBusinessUsePercent: true,
    keywords: ["mixed", "personal and business", "split", "partial"],
  },
  other_business_expense: {
    label: "Other business expense",
    categorySlug: "other-expense",
    hmrcCode: "other_business_expenses",
    isBusiness: true,
    evidenceRecommendation: null,
    keywords: ["other", "misc", "business expense"],
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
  return ids.map((id) => {
    const spec = CHOICE_SPECS[id];
    return {
      id,
      label: spec.label,
      keywords: spec.keywords,
    };
  });
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
