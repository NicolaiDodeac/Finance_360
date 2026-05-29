import { shouldCountInLifestyleSpending } from "@/lib/transactions/classification";
import type { TransactionWithRelations } from "@/lib/transactions/types";

export type RecurringFrequency = "weekly" | "fortnightly" | "monthly" | "irregular";

export interface RecurringPayment {
  merchantKey: string;
  merchantLabel: string;
  averageAmount: number;
  frequency: RecurringFrequency;
  frequencyLabel: string;
  nextExpectedDate: string | null;
  categoryId: string | null;
  categoryName: string | null;
  occurrenceCount: number;
  lastTransactionDate: string;
}

export interface RecurringInsights {
  /** Top recurring expense patterns by average amount. */
  recurringPayments: RecurringPayment[];
  /** Recurring expenses that match common subscription merchants. */
  subscriptionsToReview: RecurringPayment[];
}

const SUBSCRIPTION_MERCHANT_PATTERNS = [
  "netflix",
  "spotify",
  "cursor",
  "adobe",
  "apple",
  "google",
  "microsoft",
  "amazon prime",
  "prime video",
  "disney",
  "hulu",
  "github",
  "notion",
  "slack",
  "zoom",
  "dropbox",
  "office 365",
  "microsoft 365",
  "icloud",
  "youtube",
  "audible",
  "paramount",
  "now tv",
  "twitch",
  "patreon",
  "medium",
  "substack",
  "canva",
  "figma",
  "1password",
  "lastpass",
  "openai",
  "chatgpt",
  "grammarly",
  "headspace",
  "calm",
  "strava",
  "peloton",
  "dazn",
  "crunchyroll",
  "playstation",
  "xbox",
  "nintendo",
  "linkedin",
  "sky",
  "ee ",
  "vodafone",
  "virgin",
  "bt ",
] as const;

const MIN_OCCURRENCES = 3;
const TOP_RECURRING_LIMIT = 6;
const AMOUNT_TOLERANCE_RATIO = 0.2;
const AMOUNT_TOLERANCE_ABSOLUTE = 2;

function isPersonalExpense(tx: TransactionWithRelations): boolean {
  return shouldCountInLifestyleSpending(tx);
}

function normalizeMerchantKey(tx: TransactionWithRelations): string | null {
  const raw = (tx.merchant_name?.trim() || tx.description?.trim() || "")
    .toLowerCase()
    .replace(/\s+/g, " ");
  if (raw.length < 2) return null;
  return raw;
}

function displayMerchantLabel(txs: TransactionWithRelations[]): string {
  const withMerchant = txs.find((tx) => tx.merchant_name?.trim());
  if (withMerchant?.merchant_name?.trim()) {
    return withMerchant.merchant_name.trim();
  }
  const withDescription = txs.find((tx) => tx.description?.trim());
  return withDescription?.description?.trim() ?? "Unknown merchant";
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function amountsAreSimilar(amounts: number[]): boolean {
  if (amounts.length < MIN_OCCURRENCES) return false;
  const ref = median(amounts);
  if (ref <= 0) return false;
  return amounts.every((amount) => {
    const diff = Math.abs(amount - ref);
    return diff <= AMOUNT_TOLERANCE_ABSOLUTE || diff / ref <= AMOUNT_TOLERANCE_RATIO;
  });
}

function parseLocalIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function daysBetween(a: string, b: string): number {
  const start = parseLocalIsoDate(a).getTime();
  const end = parseLocalIsoDate(b).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function addDays(isoDate: string, days: number): string {
  const date = parseLocalIsoDate(isoDate);
  date.setDate(date.getDate() + days);
  return formatIsoDate(date);
}

function intervalStats(sortedDates: string[]): {
  medianDays: number;
  isRegular: boolean;
} {
  if (sortedDates.length < 2) {
    return { medianDays: 0, isRegular: false };
  }

  const intervals: number[] = [];
  for (let i = 1; i < sortedDates.length; i++) {
    const gap = daysBetween(sortedDates[i - 1], sortedDates[i]);
    if (gap > 0) intervals.push(gap);
  }

  if (intervals.length === 0) {
    return { medianDays: 0, isRegular: false };
  }

  const medianDays = median(intervals);
  const deviations = intervals.map((gap) => Math.abs(gap - medianDays));
  const medianDeviation = median(deviations);
  const isRegular =
    medianDays >= 5 &&
    medianDays <= 45 &&
    (medianDays === 0 || medianDeviation / medianDays <= 0.45);

  return { medianDays, isRegular };
}

function classifyFrequency(medianDays: number): RecurringFrequency {
  if (medianDays >= 6 && medianDays <= 9) return "weekly";
  if (medianDays >= 12 && medianDays <= 16) return "fortnightly";
  if (medianDays >= 25 && medianDays <= 35) return "monthly";
  return "irregular";
}

function frequencyLabel(frequency: RecurringFrequency, medianDays: number): string {
  switch (frequency) {
    case "weekly":
      return "About weekly";
    case "fortnightly":
      return "About every two weeks";
    case "monthly":
      return "About monthly";
    case "irregular":
      if (medianDays >= 20 && medianDays <= 40) return "Roughly monthly";
      if (medianDays >= 5 && medianDays <= 12) return "Roughly weekly";
      return "Recurring";
  }
}

function pickCategory(
  txs: TransactionWithRelations[]
): { categoryId: string | null; categoryName: string | null } {
  const counts = new Map<string, { id: string | null; name: string; count: number }>();

  for (const tx of txs) {
    const key = tx.category_id ?? "__uncategorized__";
    const name = tx.category?.name ?? "Needs a category";
    const existing = counts.get(key);
    if (existing) {
      existing.count += 1;
    } else {
      counts.set(key, {
        id: tx.category_id,
        name,
        count: 1,
      });
    }
  }

  const best = Array.from(counts.values()).sort((a, b) => b.count - a.count)[0];
  return {
    categoryId: best?.id ?? null,
    categoryName: best?.name ?? null,
  };
}

function buildRecurringPayment(
  merchantKey: string,
  txs: TransactionWithRelations[]
): RecurringPayment | null {
  if (txs.length < MIN_OCCURRENCES) return null;

  const amounts = txs.map((tx) => Number(tx.amount));
  if (!amountsAreSimilar(amounts)) return null;

  const sorted = [...txs].sort((a, b) =>
    a.transaction_date.localeCompare(b.transaction_date)
  );
  const sortedDates = sorted.map((tx) => tx.transaction_date);
  const { medianDays, isRegular } = intervalStats(sortedDates);

  if (!isRegular) return null;

  const frequency = classifyFrequency(medianDays);
  const lastTransactionDate = sortedDates[sortedDates.length - 1];
  const nextExpectedDate =
    medianDays > 0 ? addDays(lastTransactionDate, Math.round(medianDays)) : null;
  const { categoryId, categoryName } = pickCategory(txs);

  return {
    merchantKey,
    merchantLabel: displayMerchantLabel(txs),
    averageAmount: amounts.reduce((sum, n) => sum + n, 0) / amounts.length,
    frequency,
    frequencyLabel: frequencyLabel(frequency, medianDays),
    nextExpectedDate,
    categoryId,
    categoryName,
    occurrenceCount: txs.length,
    lastTransactionDate,
  };
}

export function looksLikeSubscription(merchantKey: string): boolean {
  return SUBSCRIPTION_MERCHANT_PATTERNS.some((pattern) =>
    merchantKey.includes(pattern)
  );
}

function isInMonth(isoDate: string, year: number, month: number): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

function recurringActiveInMonth(
  payment: RecurringPayment,
  transactions: TransactionWithRelations[],
  year: number,
  month: number
): boolean {
  return transactions.some((tx) => {
    if (!isPersonalExpense(tx)) return false;
    const key = normalizeMerchantKey(tx);
    if (key !== payment.merchantKey) return false;
    return isInMonth(tx.transaction_date, year, month);
  });
}

export function filterRecurringForMonth(
  insights: RecurringInsights,
  transactions: TransactionWithRelations[],
  year: number,
  month: number
): RecurringInsights {
  return {
    recurringPayments: insights.recurringPayments.filter((item) =>
      recurringActiveInMonth(item, transactions, year, month)
    ),
    subscriptionsToReview: insights.subscriptionsToReview.filter((item) =>
      recurringActiveInMonth(item, transactions, year, month)
    ),
  };
}

export function detectRecurringPayments(
  transactions: TransactionWithRelations[]
): RecurringInsights {
  const expenses = transactions.filter(isPersonalExpense);
  const groups = new Map<string, TransactionWithRelations[]>();

  for (const tx of expenses) {
    const key = normalizeMerchantKey(tx);
    if (!key) continue;
    const existing = groups.get(key);
    if (existing) {
      existing.push(tx);
    } else {
      groups.set(key, [tx]);
    }
  }

  const recurring: RecurringPayment[] = [];
  for (const [merchantKey, txs] of groups) {
    const payment = buildRecurringPayment(merchantKey, txs);
    if (payment) recurring.push(payment);
  }

  recurring.sort((a, b) => b.averageAmount - a.averageAmount);

  const subscriptionsToReview = recurring.filter((item) =>
    looksLikeSubscription(item.merchantKey)
  );

  return {
    recurringPayments: recurring.slice(0, TOP_RECURRING_LIMIT),
    subscriptionsToReview,
  };
}
