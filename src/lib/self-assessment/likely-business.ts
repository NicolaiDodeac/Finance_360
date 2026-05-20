import { applyCategorizationRules } from "@/lib/categorization/apply";
import { shouldCountAsIncome } from "@/lib/transactions/classification";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import { buildTransactionsLink } from "@/lib/tax/links";
import type { TaxTransactionRow } from "@/lib/tax/types";
import type { SaLikelyBusinessIncomeItem } from "@/lib/self-assessment/types";

export function findLikelyBusinessIncome(
  taxYearId: string,
  transactions: TaxTransactionRow[],
  rules: CategorizationRuleRow[]
): SaLikelyBusinessIncomeItem[] {
  const candidates = transactions.filter(
    (tx) => !tx.is_business && shouldCountAsIncome(tx)
  );

  const items: SaLikelyBusinessIncomeItem[] = [];

  for (const tx of candidates) {
    const applied = applyCategorizationRules(tx, rules, {
      onlyFillEmpty: false,
      existing: { is_business: tx.is_business },
    });

    if (applied.is_business !== true || !applied.matched_rule) {
      continue;
    }

    items.push({
      id: tx.id,
      amount: Number(tx.amount),
      description: tx.description,
      merchantName: tx.merchant_name,
      transactionDate: tx.transaction_date,
      ruleName: applied.matched_rule.name,
      transactionsLink: buildTransactionsLink({
        taxYearId,
        direction: "income",
        scope: "personal",
      }),
    });
  }

  return items.sort((a, b) => b.amount - a.amount);
}
