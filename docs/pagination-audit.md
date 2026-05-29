# Pagination audit — Finance 360

Audit date: May 2026. Lists that can grow large were reviewed for loading behaviour, expected scale, and recommended pagination pattern.

## Summary

| List | Needs pagination? | Pattern |
|------|-------------------|---------|
| Transactions | **Yes** | Server-side pagination, 25/page, `?page=` |
| Receipt Vault | **Yes** | Server-side pagination, 20/page, load more |
| Categorisation assistant groups | **Yes** | Client load-more, 10 groups at a time |
| Rules | **Conditional** | Pagination only when >25 rules |
| Import preview | **Yes** | Visual cap at 25 rows (import still processes all) |
| Budget category rows | **No** | Small fixed set per month |
| Goals | **No** | Typically <20 per household |
| Planning plans | **No** | Small active set |
| Tax review items | **Partial** | Load-more on category breakdown rows |
| Self Assessment review | **Partial** | Load-more on likely-business income list |

---

## 1. Transactions list

**Files:** `src/app/(app)/transactions/page.tsx`, `src/components/transactions/transactions-view.tsx`, `src/lib/transactions/queries.ts`

| | |
|---|---|
| **Current loading** | Fetches all user transactions in one Supabase query; search and HMRC filters applied in memory after fetch. |
| **Expected scale** | Hundreds to thousands over years of use; also loaded in full for budget/dashboard calculations. |
| **Needs pagination?** | **Yes** — list page only. Dashboard/budget keep full fetch for totals. |
| **Best pattern** | Server-side pagination, default 25/page, URL `?page=1`. Preserve all filters (search, direction, category, tax year, from/to, scope). Mobile: Load more; desktop: Previous/Next. |

---

## 2. Receipt Vault list

**Files:** `src/app/(app)/receipts/page.tsx`, `src/components/receipts/receipts-vault-view.tsx`, `src/lib/receipts/queries.ts`

| | |
|---|---|
| **Current loading** | Fetches all receipts + attached transactions in two queries. Client splits into needs-review / unmatched / matched. |
| **Expected scale** | Grows with business expense capture; match picker elsewhere uses `.limit(200)`. |
| **Needs pagination?** | **Yes** — main “All stored proof” list. Needs-review and unmatched sections stay fully visible (usually small). |
| **Best pattern** | Server-side pagination, 20/page, load more. Recent receipts first (`created_at desc`). |

---

## 3. Categorisation assistant groups

**Files:** `src/app/(app)/transactions/categorise/page.tsx`, `src/components/categorization/categorise-assistant-view.tsx`, `src/lib/categorization/assistant-queries.ts`

| | |
|---|---|
| **Current loading** | Fetches all uncategorised transactions; builds merchant groups server-side; renders all groups. Memory index capped at 400 categorised txs. |
| **Expected scale** | After large imports, dozens of merchant groups possible. |
| **Needs pagination?** | **Yes** — render pagination. |
| **Best pattern** | Client load-more: show first 10 groups, “Load more groups”. Progress count shows total groups left (unchanged). Skipped/deferred behaviour unchanged. |

---

## 4. Rules list

**Files:** `src/app/(app)/settings/rules/page.tsx`, `src/components/rules/rules-list.tsx`

| | |
|---|---|
| **Current loading** | Fetches all rules for user. |
| **Expected scale** | Usually <25; repair hints scan up to 500 transactions. |
| **Needs pagination?** | **Only if >25** |
| **Best pattern** | No change when ≤25; client pagination 25/page when larger. |

---

## 5. Import preview

**Files:** `src/components/import/import-preview-step.tsx`, `src/lib/import/actions.ts`

| | |
|---|---|
| **Current loading** | Full parsed file in memory; table scrolls in 420px container but renders every row. |
| **Expected scale** | Statement-sized batches (tens to low hundreds); 10 MB file cap. |
| **Needs pagination?** | **Yes** — visual only. |
| **Best pattern** | Show first 25 rows + “Showing 25 of X transactions”. Import button still imports all confirmed rows. |

---

## 6. Budget category rows

**Files:** `src/app/(app)/budget/page.tsx`, `src/components/budget/budget-view.tsx`

| | |
|---|---|
| **Current loading** | Budget line items for one month (small). Also loads all transactions for actuals. |
| **Expected scale** | ~5–15 category rows per month. |
| **Needs pagination?** | **No** |
| **Best pattern** | No change. Totals use full month data. |

---

## 7. Goals

**Files:** `src/app/(app)/goals/page.tsx`, `src/lib/goals/queries.ts`

| | |
|---|---|
| **Current loading** | All savings goals for space. Dashboard uses `getActiveSavingsGoals(limit=5)`. |
| **Expected scale** | Typically <20 per household. |
| **Needs pagination?** | **No** |
| **Best pattern** | No change. |

---

## 8. Planning plans

**Files:** `src/app/(app)/planning/page.tsx`, `src/lib/planning/queries.ts`

| | |
|---|---|
| **Current loading** | All non-completed goals with details. Dashboard preview slices to 3. |
| **Expected scale** | Small active set. |
| **Needs pagination?** | **No** |
| **Best pattern** | No change. |

---

## 9. Tax review items (Tax Hub)

**Files:** `src/components/tax/tax-review-section.tsx`, `src/components/tax/tax-category-breakdown.tsx`

| | |
|---|---|
| **Current loading** | Aggregated checklist items (~5 types) + HMRC category breakdown rows. Full tax-year transactions loaded for calculations. |
| **Expected scale** | Review checklist stays small; category breakdown can grow with many HMRC categories. |
| **Needs pagination?** | **Partial** — breakdown rows only. |
| **Best pattern** | Show first 10 breakdown rows per section, load more. Totals unchanged. Review checklist unchanged (already small). |

---

## 10. Self Assessment review items

**Files:** `src/components/self-assessment/sa-review-section.tsx`

| | |
|---|---|
| **Current loading** | Aggregated review items + likely-business income list (previously capped at 5 in UI). |
| **Expected scale** | Review items small; income candidates can grow. |
| **Needs pagination?** | **Partial** — likely-business income detail rows. |
| **Best pattern** | Show first 10, load more. Category/tax totals unaffected. |

---

## Performance notes

- **Pagination is for displayed lists, not totals.** Dashboard, budget, and tax calculations continue to use full relevant datasets.
- **Transactions list** moves search/HMRC filters to SQL so server-side `.range()` is accurate.
- **Receipt vault** paginates main list; priority sections (needs review) fetched separately.
- **Index concerns:** `transactions(user_id, transaction_date desc)` and `receipts(user_id, created_at desc)` support ordered pagination. Consider composite indexes if filter+sort queries slow down at scale.
- **Follow-up:** Paginate `getUnmatchedReceipts` on transactions edit drawer if vault grows very large; lazy-load evidence evaluation for off-screen transaction rows.
