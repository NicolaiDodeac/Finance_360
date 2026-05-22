import type { CategoryRow } from "@/lib/categories/queries";
import {
  canonicalMerchantGroupKey,
  isCombinedMerchantGroup,
  strictMerchantGroupKey,
} from "@/lib/categorization/merchant-canonical";
import {
  inferCanonicalMatchKeyword,
  inferGroupMatchKeyword,
  merchantGroupDisplayLabel,
} from "@/lib/categorization/normalize";
import {
  lookupMerchantMemory,
  type MerchantMemoryIndex,
} from "@/lib/categorization/merchant-memory-index";
import { suggestWithMerchantMemory } from "@/lib/categorization/merchant-memory";
import type {
  AssistantTransactionRow,
  MerchantGroup,
  MerchantSubgroup,
} from "@/lib/categorization/assistant-types";
import type { CategorizationRuleRow } from "@/lib/categorization/types";
import type { TransactionDirection } from "@/types/database";

const MAX_EXAMPLES = 3;

function dominantDirection(
  rows: AssistantTransactionRow[]
): TransactionDirection {
  const counts = new Map<TransactionDirection, number>();
  for (const row of rows) {
    counts.set(row.direction, (counts.get(row.direction) ?? 0) + 1);
  }
  let best: TransactionDirection = rows[0]?.direction ?? "expense";
  let bestCount = 0;
  for (const [dir, count] of counts) {
    if (count > bestCount) {
      best = dir;
      bestCount = count;
    }
  }
  return best;
}

function buildSubgroup(
  strictKey: string,
  rows: AssistantTransactionRow[]
): MerchantSubgroup {
  const sorted = [...rows].sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date)
  );
  const representative = sorted[0];
  const totalAmount = rows.reduce((sum, tx) => sum + Number(tx.amount), 0);

  return {
    strictKey,
    merchantLabel: merchantGroupDisplayLabel(strictKey),
    matchKeyword: inferGroupMatchKeyword(
      representative.description,
      representative.merchant_name
    ),
    transactionCount: rows.length,
    totalAmount,
    transactionIds: rows.map((r) => r.id),
    examples: sorted.slice(0, MAX_EXAMPLES).map((tx) => ({
      id: tx.id,
      transaction_date: tx.transaction_date,
      description: tx.description,
      amount: Number(tx.amount),
    })),
  };
}

function buildGroupFromRows(
  groupKey: string,
  rows: AssistantTransactionRow[],
  strictKeys: string[],
  byStrict: Map<string, AssistantTransactionRow[]>,
  categories: CategoryRow[],
  rules: CategorizationRuleRow[],
  memoryIndex?: MerchantMemoryIndex
): MerchantGroup {
  const sorted = [...rows].sort((a, b) =>
    b.transaction_date.localeCompare(a.transaction_date)
  );
  const representative = sorted[0];
  const direction = dominantDirection(rows);
  const totalAmount = rows.reduce((sum, tx) => sum + Number(tx.amount), 0);
  const isCombined = isCombinedMerchantGroup(strictKeys);

  const matchKeyword = isCombined
    ? inferCanonicalMatchKeyword(groupKey)
    : inferGroupMatchKeyword(
        representative.description,
        representative.merchant_name
      );

  const subgroups: MerchantSubgroup[] | undefined = isCombined
    ? strictKeys
        .map((sk) => buildSubgroup(sk, byStrict.get(sk) ?? []))
        .filter((sg) => sg.transactionCount > 0)
        .sort((a, b) => b.transactionCount - a.transactionCount)
    : undefined;

  const confirmedHistory = memoryIndex
    ? lookupMerchantMemory(
        memoryIndex,
        direction,
        representative.description,
        representative.merchant_name
      )
    : null;

  const suggestion = suggestWithMerchantMemory({
    groupKey,
    direction,
    description: representative.description,
    merchant_name: representative.merchant_name,
    categories,
    rules,
    confirmedHistory,
  });

  return {
    groupKey,
    merchantLabel: merchantGroupDisplayLabel(groupKey),
    matchKeyword,
    direction,
    transactionCount: rows.length,
    totalAmount,
    transactionIds: rows.map((r) => r.id),
    examples: sorted.slice(0, MAX_EXAMPLES).map((tx) => ({
      id: tx.id,
      transaction_date: tx.transaction_date,
      description: tx.description,
      amount: Number(tx.amount),
    })),
    suggestion,
    strictGroupKeys: strictKeys,
    isCombined,
    subgroups,
  };
}

export function buildMerchantGroups(
  transactions: AssistantTransactionRow[],
  categories: CategoryRow[],
  rules: CategorizationRuleRow[],
  memoryIndex?: MerchantMemoryIndex
): MerchantGroup[] {
  const uncategorised = transactions.filter((tx) => !tx.category_id);
  const byStrict = new Map<string, AssistantTransactionRow[]>();

  for (const tx of uncategorised) {
    const strictKey = strictMerchantGroupKey(tx.description, tx.merchant_name);
    if (!strictKey) continue;
    const list = byStrict.get(strictKey) ?? [];
    list.push(tx);
    byStrict.set(strictKey, list);
  }

  const byCanonical = new Map<
    string,
    { rows: AssistantTransactionRow[]; strictKeys: Set<string> }
  >();

  for (const [strictKey, rows] of byStrict) {
    const representative = rows[0];
    const canonicalKey = canonicalMerchantGroupKey(
      representative.description,
      representative.merchant_name
    );
    if (!canonicalKey) continue;

    const bucket = byCanonical.get(canonicalKey) ?? {
      rows: [],
      strictKeys: new Set<string>(),
    };
    bucket.rows.push(...rows);
    bucket.strictKeys.add(strictKey);
    byCanonical.set(canonicalKey, bucket);
  }

  const groups: MerchantGroup[] = [];

  for (const [canonicalKey, { rows, strictKeys }] of byCanonical) {
    const strictKeyList = Array.from(strictKeys).sort();
    groups.push(
      buildGroupFromRows(
        canonicalKey,
        rows,
        strictKeyList,
        byStrict,
        categories,
        rules,
        memoryIndex
      )
    );
  }

  return groups.sort((a, b) => {
    if (b.transactionCount !== a.transactionCount) {
      return b.transactionCount - a.transactionCount;
    }
    return a.merchantLabel.localeCompare(b.merchantLabel);
  });
}

/** Expand a merged group into one card per strict description variant. */
export function splitMerchantGroup(group: MerchantGroup): MerchantGroup[] {
  if (!group.isCombined || !group.subgroups?.length) {
    return [group];
  }

  return group.subgroups.map((sub) => ({
    groupKey: sub.strictKey,
    merchantLabel: sub.merchantLabel,
    matchKeyword: sub.matchKeyword,
    direction: group.direction,
    transactionCount: sub.transactionCount,
    totalAmount: sub.totalAmount,
    transactionIds: sub.transactionIds,
    examples: sub.examples,
    suggestion: group.suggestion,
    strictGroupKeys: [sub.strictKey],
    isCombined: false,
    subgroups: undefined,
  }));
}

export function transactionMatchesGroupKey(
  tx: Pick<AssistantTransactionRow, "description" | "merchant_name" | "category_id">,
  groupKey: string,
  strictGroupKeys?: string[]
): boolean {
  if (tx.category_id) {
    return false;
  }

  const strict = strictMerchantGroupKey(tx.description, tx.merchant_name);
  if (!strict) return false;

  if (strictGroupKeys && strictGroupKeys.length > 0) {
    return strictGroupKeys.includes(strict);
  }

  return (
    strict === groupKey ||
    canonicalMerchantGroupKey(tx.description, tx.merchant_name) === groupKey
  );
}
