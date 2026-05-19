/** Default UK tax years seeded per user (label → inclusive date range). */
export const DEFAULT_TAX_YEARS = [
  {
    label: "2024/25",
    start_date: "2024-04-06",
    end_date: "2025-04-05",
  },
  {
    label: "2025/26",
    start_date: "2025-04-06",
    end_date: "2026-04-05",
  },
  {
    label: "2026/27",
    start_date: "2026-04-06",
    end_date: "2027-04-05",
  },
  {
    label: "2027/28",
    start_date: "2027-04-06",
    end_date: "2028-04-05",
  },
] as const;

export type DefaultTaxYear = (typeof DEFAULT_TAX_YEARS)[number];

export interface DefaultCategoryParent {
  name: string;
  slug: string;
  sort_order: number;
}

export interface DefaultCategoryChild {
  name: string;
  slug: string;
  parent_slug: "income" | "expenses";
  sort_order: number;
}

export const DEFAULT_CATEGORY_PARENTS: DefaultCategoryParent[] = [
  { name: "Income", slug: "income", sort_order: 0 },
  { name: "Expenses", slug: "expenses", sort_order: 100 },
];

export const DEFAULT_CATEGORY_CHILDREN: DefaultCategoryChild[] = [
  { name: "Salary", slug: "salary", parent_slug: "income", sort_order: 0 },
  {
    name: "Self-employed income",
    slug: "self-employed-income",
    parent_slug: "income",
    sort_order: 10,
  },
  { name: "Refunds", slug: "refunds", parent_slug: "income", sort_order: 20 },
  {
    name: "Other income",
    slug: "other-income",
    parent_slug: "income",
    sort_order: 90,
  },
  { name: "Groceries", slug: "groceries", parent_slug: "expenses", sort_order: 0 },
  { name: "Transport", slug: "transport", parent_slug: "expenses", sort_order: 10 },
  { name: "Fuel", slug: "fuel", parent_slug: "expenses", sort_order: 20 },
  {
    name: "Rent / Mortgage",
    slug: "rent-mortgage",
    parent_slug: "expenses",
    sort_order: 30,
  },
  { name: "Utilities", slug: "utilities", parent_slug: "expenses", sort_order: 40 },
  {
    name: "Phone / Internet",
    slug: "phone-internet",
    parent_slug: "expenses",
    sort_order: 50,
  },
  { name: "Insurance", slug: "insurance", parent_slug: "expenses", sort_order: 60 },
  {
    name: "Subscriptions",
    slug: "subscriptions",
    parent_slug: "expenses",
    sort_order: 70,
  },
  {
    name: "Eating out",
    slug: "eating-out",
    parent_slug: "expenses",
    sort_order: 80,
  },
  {
    name: "Entertainment",
    slug: "entertainment",
    parent_slug: "expenses",
    sort_order: 90,
  },
  { name: "Health", slug: "health", parent_slug: "expenses", sort_order: 100 },
  {
    name: "Personal care",
    slug: "personal-care",
    parent_slug: "expenses",
    sort_order: 110,
  },
  { name: "Clothing", slug: "clothing", parent_slug: "expenses", sort_order: 120 },
  {
    name: "Children / Family",
    slug: "children-family",
    parent_slug: "expenses",
    sort_order: 130,
  },
  {
    name: "Car maintenance",
    slug: "car-maintenance",
    parent_slug: "expenses",
    sort_order: 140,
  },
  { name: "Education", slug: "education", parent_slug: "expenses", sort_order: 150 },
  { name: "Gifts", slug: "gifts", parent_slug: "expenses", sort_order: 160 },
  { name: "Bank fees", slug: "bank-fees", parent_slug: "expenses", sort_order: 170 },
  {
    name: "Tax payment",
    slug: "tax-payment",
    parent_slug: "expenses",
    sort_order: 180,
  },
  {
    name: "Savings transfer",
    slug: "savings-transfer",
    parent_slug: "expenses",
    sort_order: 190,
  },
  {
    name: "Other expense",
    slug: "other-expense",
    parent_slug: "expenses",
    sort_order: 200,
  },
];

/** Slugs that must exist for categories to be considered fully initialized. */
export const REQUIRED_CATEGORY_SLUGS = [
  ...DEFAULT_CATEGORY_PARENTS.map((p) => p.slug),
  ...DEFAULT_CATEGORY_CHILDREN.map((c) => c.slug),
] as const;

export const REQUIRED_TAX_YEAR_LABELS = DEFAULT_TAX_YEARS.map((ty) => ty.label);
