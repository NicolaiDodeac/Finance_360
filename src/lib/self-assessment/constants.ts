/**
 * SA103F-style expense groupings for Self Assessment prep.
 * Each group maps to one or more `hmrc_categories.code` values from seed data.
 */
export interface Sa103ExpenseGroupDefinition {
  id: string;
  label: string;
  hmrcCodes: readonly string[];
}

export const SA103_EXPENSE_GROUPS: readonly Sa103ExpenseGroupDefinition[] = [
  {
    id: "cost_of_goods",
    label: "Cost of goods / materials",
    hmrcCodes: ["cost_of_goods"],
  },
  {
    id: "car_van_travel",
    label: "Car, van and travel",
    hmrcCodes: ["car_van_travel"],
  },
  {
    id: "wages_staff",
    label: "Wages / staff",
    hmrcCodes: ["wages_staff"],
  },
  {
    id: "rent_rates_power",
    label: "Rent, rates, power and insurance",
    hmrcCodes: ["rent_rates_power", "use_of_home", "insurance"],
  },
  {
    id: "repairs_maintenance",
    label: "Repairs and maintenance",
    hmrcCodes: ["repairs_maintenance"],
  },
  {
    id: "accountancy_legal_professional",
    label: "Accountancy, legal and professional fees",
    hmrcCodes: [
      "accountancy_legal_professional",
      "professional_subscriptions",
    ],
  },
  {
    id: "phone_office_stationery",
    label: "Phone, fax, stationery and other office costs",
    hmrcCodes: ["phone_office_stationery"],
  },
  {
    id: "advertising_entertainment",
    label: "Advertising and business entertainment",
    hmrcCodes: ["advertising_marketing", "entertainment_disallowed"],
  },
  {
    id: "bank_financial_charges",
    label: "Bank, credit card and financial charges",
    hmrcCodes: [
      "interest_bank_charges",
      "bank_credit_card_charges",
      "other_finance_charges",
    ],
  },
  {
    id: "other_allowable",
    label: "Other allowable business expenses",
    hmrcCodes: [
      "other_business_expenses",
      "construction_industry",
      "irrecoverable_debts",
      "depreciation_loss_sale",
      "equipment_tools",
      "training",
      "clothing_uniforms",
    ],
  },
] as const;

/** HMRC codes not covered by the ten SA103 display groups (shown separately if used). */
export const SA103_UNGROUPED_HMRC_CODES = ["personal_private"] as const;

export const SA_PREP_STEPS = [
  {
    id: "income",
    step: 1,
    title: "Check business income",
    description: "Confirm turnover from business income transactions.",
  },
  {
    id: "expenses",
    step: 2,
    title: "Check allowable expenses",
    description: "Review expenses grouped by HMRC-style categories.",
  },
  {
    id: "evidence",
    step: 3,
    title: "Review evidence",
    description: "Strengthen records where helpful before you file.",
  },
  {
    id: "copy",
    step: 4,
    title: "Copy numbers for tax return",
    description: "Copy prepared figures into HMRC Self Assessment.",
  },
] as const;
