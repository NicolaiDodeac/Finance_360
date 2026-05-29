import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import type { FlowType } from "@/lib/transactions/flow-type";
import type {
  ReceiptPaymentMethod,
  TransactionDirection,
} from "@/types/database";

export interface HintMatch {
  categoryChoiceId: CategoryChoiceId | null;
  purpose: CategorisePurpose | null;
  flowTypeOverride: FlowType | null;
  direction: TransactionDirection | null;
  paymentMethod?: ReceiptPaymentMethod | null;
}

/** Longer phrases first so “debt repayment” wins over “repayment”. */
const HINT_PHRASES: Array<{ pattern: RegExp; hint: HintMatch }> = [
  {
    pattern: /\bdebt\s+repayment\b/i,
    hint: {
      categoryChoiceId: "debt_repayment",
      purpose: "personal",
      flowTypeOverride: "debt_repayment",
      direction: "expense",
    },
  },
  {
    pattern: /\b(credit\s+card\s+)?repayment\b/i,
    hint: {
      categoryChoiceId: "debt_repayment",
      purpose: "personal",
      flowTypeOverride: "debt_repayment",
      direction: "expense",
    },
  },
  {
    pattern: /\bsavings?\b/i,
    hint: {
      categoryChoiceId: "savings_contribution",
      purpose: "personal",
      flowTypeOverride: "savings",
      direction: "expense",
    },
  },
  {
    pattern: /\btransfer\b/i,
    hint: {
      categoryChoiceId: "transfer_between_accounts",
      purpose: "personal",
      flowTypeOverride: "transfer",
      direction: "transfer",
    },
  },
  {
    pattern: /\b(business\s+)?software\b|\bsaas\b|\bdigital\s+tools?\b/i,
    hint: {
      categoryChoiceId: "software_digital",
      purpose: "business",
      flowTypeOverride: "business_expense",
      direction: "expense",
    },
  },
  {
    pattern: /\bsubscription\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: null,
      flowTypeOverride: null,
      direction: "expense",
    },
  },
  {
    pattern: /\bgroceries?\b|\bsupermarket\b/i,
    hint: {
      categoryChoiceId: "groceries",
      purpose: "personal",
      flowTypeOverride: "living_expense",
      direction: "expense",
    },
  },
  {
    pattern: /\bfuel\b|\bpetrol\b|\bdiesel\b/i,
    hint: {
      categoryChoiceId: "fuel",
      purpose: "personal",
      flowTypeOverride: "living_expense",
      direction: "expense",
    },
  },
  {
    pattern: /\b(uber|taxi|lyft)\b/i,
    hint: {
      categoryChoiceId: "transport",
      purpose: "personal",
      flowTypeOverride: "living_expense",
      direction: "expense",
    },
  },
  {
    pattern: /\b(restaurant|lunch|coffee|cafe|takeaway)\b/i,
    hint: {
      categoryChoiceId: "eating_out",
      purpose: "personal",
      flowTypeOverride: "living_expense",
      direction: "expense",
    },
  },
  {
    pattern: /\bbusiness\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: "business",
      flowTypeOverride: null,
      direction: "expense",
    },
  },
  {
    pattern: /\bpersonal\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: "personal",
      flowTypeOverride: null,
      direction: "expense",
    },
  },
  {
    pattern: /\b(contactless|tap\s+to\s+pay|apple\s+pay|google\s+pay)\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: null,
      flowTypeOverride: null,
      direction: "expense",
      paymentMethod: "contactless",
    },
  },
  {
    pattern: /\b(debit\s+card|credit\s+card|by\s+card|on\s+card|card\s+payment|paid\s+by\s+card)\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: null,
      flowTypeOverride: null,
      direction: "expense",
      paymentMethod: "card",
    },
  },
  {
    pattern: /\b(paid\s+)?cash\b|\bin\s+cash\b|\bby\s+cash\b/i,
    hint: {
      categoryChoiceId: null,
      purpose: null,
      flowTypeOverride: null,
      direction: "expense",
      paymentMethod: "cash",
    },
  },
];

const STRIP_WORDS = new Set(
  [
    "groceries",
    "grocery",
    "fuel",
    "petrol",
    "diesel",
    "taxi",
    "uber",
    "lyft",
    "software",
    "saas",
    "subscription",
    "subscriptions",
    "restaurant",
    "lunch",
    "coffee",
    "cafe",
    "takeaway",
    "business",
    "personal",
    "cash",
    "card",
    "contactless",
    "paid",
    "pay",
    "savings",
    "saving",
    "repayment",
    "repay",
    "debt",
    "credit",
    "transfer",
    "digital",
    "tools",
  ].map((w) => w.toLowerCase())
);

export function matchHints(text: string): HintMatch {
  const merged: HintMatch = {
    categoryChoiceId: null,
    purpose: null,
    flowTypeOverride: null,
    direction: null,
    paymentMethod: null,
  };

  for (const { pattern, hint } of HINT_PHRASES) {
    if (!pattern.test(text)) continue;
    if (hint.categoryChoiceId) merged.categoryChoiceId = hint.categoryChoiceId;
    if (hint.purpose) merged.purpose = hint.purpose;
    if (hint.flowTypeOverride) merged.flowTypeOverride = hint.flowTypeOverride;
    if (hint.direction) merged.direction = hint.direction;
    if (hint.paymentMethod) merged.paymentMethod = hint.paymentMethod;
  }

  if (!merged.paymentMethod && /\bcard\b/i.test(text) && !/\bcredit\s+card\s+repayment\b/i.test(text)) {
    merged.paymentMethod = "card";
  }

  if (/\bsubscription\b/i.test(text) && !merged.categoryChoiceId) {
    merged.categoryChoiceId = merged.purpose === "business"
      ? "software_digital"
      : "subscriptions";
    merged.flowTypeOverride =
      merged.purpose === "business" ? "business_expense" : "living_expense";
  }

  return merged;
}

/** Remove currency amounts and hint tokens to isolate merchant name. */
export function stripForMerchant(text: string): string {
  let s = text
    .replace(/[£$€]\s*(\d+(?:\.\d{1,2})?)/gi, " ")
    .replace(/(\d+(?:\.\d{1,2})?)\s*[£$€]/gi, " ")
    .replace(/\b\d+(?:\.\d{1,2})?\b/g, " ");

  for (const { pattern } of HINT_PHRASES) {
    s = s.replace(pattern, " ");
  }
  s = s.replace(/\bsubscription\b/gi, " ");
  s = s.replace(
    /\b(contactless|debit\s+card|credit\s+card|apple\s+pay|google\s+pay|tap\s+to\s+pay|paid\s+by|by\s+card|on\s+card|in\s+cash|by\s+cash|card\s+payment)\b/gi,
    " "
  );
  s = s.replace(/\b(paid\s+)?cash\b/gi, " ");
  s = s.replace(/\bcard\b/gi, " ");

  return s
    .split(/\s+/)
    .filter((word) => word.length > 0 && !STRIP_WORDS.has(word.toLowerCase()))
    .join(" ")
    .trim();
}
