import { shouldCountInLifestyleSpending } from "@/lib/transactions/classification";
import type { TransactionWithRelations } from "@/lib/transactions/types";

export interface CategorySpendingInsight {
  categoryId: string | null;
  categoryName: string;
  currentMonthAmount: number;
  previousThreeMonthAverage: number;
  differenceAmount: number;
  percentOfAverage: number;
}

export interface SpendingInsights {
  worthALook: CategorySpendingInsight[];
}

const SPIKE_RATIO_THRESHOLD = 1.25;
const MIN_DIFFERENCE_GBP = 25;

function isPersonalExpense(tx: TransactionWithRelations): boolean {
  return shouldCountInLifestyleSpending(tx);
}

function isInMonth(isoDate: string, year: number, month: number): boolean {
  const [y, m] = isoDate.split("-").map(Number);
  return y === year && m === month;
}

function monthOffset(reference: Date, offsetMonths: number): { year: number; month: number } {
  const d = new Date(reference.getFullYear(), reference.getMonth() + offsetMonths, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1 };
}

function sumCategoryExpenses(
  expenses: TransactionWithRelations[],
  year: number,
  month: number,
  categoryId: string | null
): number {
  return expenses
    .filter(
      (tx) =>
        isInMonth(tx.transaction_date, year, month) &&
        (tx.category_id ?? null) === categoryId
    )
    .reduce((sum, tx) => sum + Number(tx.amount), 0);
}

function collectCategoryKeys(expenses: TransactionWithRelations[]): Map<
  string,
  { categoryId: string | null; categoryName: string }
> {
  const map = new Map<string, { categoryId: string | null; categoryName: string }>();

  for (const tx of expenses) {
    const key = tx.category_id ?? "__uncategorized__";
    if (!map.has(key)) {
      map.set(key, {
        categoryId: tx.category_id,
        categoryName: tx.category?.name ?? "Needs a category",
      });
    }
  }

  return map;
}

export function detectSpendingInsights(
  transactions: TransactionWithRelations[],
  referenceDate: Date = new Date()
): SpendingInsights {
  const expenses = transactions.filter(isPersonalExpense);
  const categories = collectCategoryKeys(expenses);
  const current = monthOffset(referenceDate, 0);
  const previousMonths = [-1, -2, -3].map((offset) =>
    monthOffset(referenceDate, offset)
  );

  const worthALook: CategorySpendingInsight[] = [];

  for (const { categoryId, categoryName } of categories.values()) {
    const currentMonthAmount = sumCategoryExpenses(
      expenses,
      current.year,
      current.month,
      categoryId
    );

    const previousTotals = previousMonths.map(({ year, month }) =>
      sumCategoryExpenses(expenses, year, month, categoryId)
    );
    const previousThreeMonthAverage =
      previousTotals.reduce((sum, n) => sum + n, 0) / previousTotals.length;

    if (previousThreeMonthAverage <= 0) continue;

    const percentOfAverage = currentMonthAmount / previousThreeMonthAverage;
    const differenceAmount = currentMonthAmount - previousThreeMonthAverage;

    if (
      percentOfAverage > SPIKE_RATIO_THRESHOLD &&
      differenceAmount > MIN_DIFFERENCE_GBP
    ) {
      worthALook.push({
        categoryId,
        categoryName,
        currentMonthAmount,
        previousThreeMonthAverage,
        differenceAmount,
        percentOfAverage,
      });
    }
  }

  worthALook.sort((a, b) => b.differenceAmount - a.differenceAmount);

  return { worthALook };
}
