import { CHOICE_SPECS } from "@/lib/categorization/categorise-flow/mappings";
import {
  resolveCategoryChoice,
  resolvePurposeNotSure,
} from "@/lib/categorization/categorise-flow/resolve";
import type { CategoryChoiceId } from "@/lib/categorization/categorise-flow/types";
import type { CategorisePurpose } from "@/lib/categorization/categorise-flow/types";
import {
  choiceIdForPurpose,
  classifyReceiptText,
  suggestDefaultPurpose,
  type ReceiptPurpose,
  type ReceiptTextClassification,
} from "@/lib/receipts/classify";
import type { ReceiptTransactionKind } from "@/lib/receipts/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { FinanceMode, ReceiptPaymentMethod } from "@/types/database";
import type { FlowType } from "@/lib/transactions/flow-type";

const HMRC_DISPLAY: Record<string, string> = {
  phone_office_stationery: "Office costs",
  cost_of_goods: "Cost of goods / materials",
  car_van_travel: "Travel / motor expenses",
  advertising_marketing: "Advertising and marketing",
  training: "Training",
  equipment_tools: "Equipment and tools",
  other_business_expenses: "Other business expenses",
};

export interface ReceiptCreationSuggestion {
  purpose: ReceiptPurpose;
  purposeDefault: ReceiptPurpose;
  categoryChoiceId: CategoryChoiceId | null;
  categoryLabel: string;
  hmrcLabel: string | null;
  hmrcNeedsReview: boolean;
  taxCategoryNote: string;
  flowType: FlowType;
  summaryTitle: string;
  paymentLabel: string;
  evidenceNote: string;
  kind: ReceiptTransactionKind;
  isBusiness: boolean;
  categoryId: string | null;
  hmrcCategoryId: string | null;
  businessUsePercent: number | null;
}

function paymentDisplayLabel(method: ReceiptPaymentMethod | null): string {
  switch (method) {
    case "cash":
      return "Paid cash";
    case "card":
      return "Paid by card";
    case "contactless":
      return "Paid contactless";
    default:
      return "Payment not detected";
  }
}

function kindForExpense(
  purpose: ReceiptPurpose,
  payment: ReceiptPaymentMethod | null
): ReceiptTransactionKind {
  if (purpose !== "business" && purpose !== "personal") {
    return payment === "cash" ? "cash_expense" : "card_manual_expense";
  }
  if (payment === "cash") {
    return "cash_expense";
  }
  return "card_manual_expense";
}

function buildSummaryTitle(
  purpose: ReceiptPurpose,
  classification: ReceiptTextClassification,
  choiceId: CategoryChoiceId | null
): string {
  if (classification.summaryTitle && purpose === "business") {
    return classification.summaryTitle;
  }
  if (choiceId && CHOICE_SPECS[choiceId]) {
    const spec = CHOICE_SPECS[choiceId];
    if (purpose === "business") {
      return `Business ${spec.label.toLowerCase()}`;
    }
    return spec.label;
  }
  if (purpose === "business") {
    return "Business expense";
  }
  if (purpose === "personal") {
    return "Personal expense";
  }
  return "Expense from receipt";
}

export function buildReceiptCreationSuggestion(options: {
  financeMode: FinanceMode;
  merchant: string | null;
  rawText: string | null;
  paymentMethod: ReceiptPaymentMethod | null;
  purpose?: ReceiptPurpose;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
}): ReceiptCreationSuggestion {
  const classification = classifyReceiptText(
    options.merchant,
    options.rawText
  );
  const purposeDefault = suggestDefaultPurpose(options.financeMode, classification);
  const purpose = options.purpose ?? purposeDefault;
  const payment = options.paymentMethod;

  const choiceId = choiceIdForPurpose(purpose, classification);
  const categorisePurpose: CategorisePurpose =
    purpose === "not_sure" ? "not_sure" : purpose;

  let resolved =
    purpose === "not_sure" || !choiceId
      ? resolvePurposeNotSure()
      : resolveCategoryChoice(
          categorisePurpose,
          choiceId,
          options.categories,
          options.hmrcCategories,
          100
        );

  if (purpose === "personal" && choiceId) {
    resolved = resolveCategoryChoice(
      "personal",
      choiceId,
      options.categories,
      options.hmrcCategories,
      null
    );
  }

  const hmrcCode = resolved.hmrcCategoryCode ?? null;
  const hmrcLabel =
    purpose === "business" && hmrcCode
      ? (HMRC_DISPLAY[hmrcCode] ??
        resolved.hmrcCategoryName ??
        "Business expense")
      : null;

  const hmrcNeedsReview =
    purpose === "business" &&
    !resolved.hmrcCategoryId &&
    choiceId !== null;

  const taxCategoryNote =
    purpose === "personal"
      ? "Personal — no tax expense category."
      : hmrcLabel
        ? "Tax category filled automatically."
        : purpose === "not_sure"
          ? "Tax category needs review."
          : "Tax category needs review.";

  const flowType: FlowType =
    resolved.flowType ??
    (purpose === "business" ? "business_expense" : "living_expense");

  return {
    purpose,
    purposeDefault,
    categoryChoiceId: choiceId,
    categoryLabel: resolved.categoryName ?? "Expense",
    hmrcLabel,
    hmrcNeedsReview,
    taxCategoryNote,
    flowType,
    summaryTitle: buildSummaryTitle(purpose, classification, choiceId),
    paymentLabel: paymentDisplayLabel(payment),
    evidenceNote: classification.evidenceHint ?? "Receipt saved as proof.",
    kind: kindForExpense(purpose, payment),
    isBusiness: purpose === "business",
    categoryId: resolved.categoryId,
    hmrcCategoryId:
      purpose === "business" ? resolved.hmrcCategoryId : null,
    businessUsePercent: purpose === "business" ? 100 : null,
  };
}

export function needsPaymentPrompt(
  paymentMethod: ReceiptPaymentMethod | null
): boolean {
  return !paymentMethod || paymentMethod === "unknown";
}
