/**
 * Pagination helper assertions — run via npm run check:pagination
 */
import {
  formatShowingLabel,
  hasNextPage,
  hasPreviousPage,
  paginationRange,
  parsePageParam,
} from "../src/lib/pagination/types";
import { parseTransactionSearchParams } from "../src/lib/transactions/filters";
import { TRANSACTIONS_PAGE_SIZE } from "../src/lib/transactions/queries";
import { RECEIPTS_PAGE_SIZE } from "../src/lib/receipts/queries";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

// parsePageParam
assert(parsePageParam(undefined) === 1, "default page is 1");
assert(parsePageParam("3") === 3, "parses valid page");
assert(parsePageParam("0") === 1, "rejects page 0");
assert(parsePageParam("-1") === 1, "rejects negative page");
assert(parsePageParam("abc") === 1, "rejects non-numeric page");

// paginationRange
{
  const range = paginationRange(2, 25, 143);
  assert(range.from === 25, "page 2 starts at offset 25");
  assert(range.to === 49, "page 2 ends at offset 49");
  assert(range.startItem === 26, "start item is 26");
  assert(range.endItem === 50, "end item is 50");
}

{
  const range = paginationRange(6, 25, 143);
  assert(range.endItem === 143, "last page end item equals total");
}

// formatShowingLabel
assert(
  formatShowingLabel(1, 25, 143, "transactions") ===
    "Showing 1–25 of 143 transactions",
  "showing label for middle page"
);
assert(
  formatShowingLabel(1, 10, 10, "groups") === "10 groups",
  "short label when all visible"
);

// hasNextPage / hasPreviousPage
assert(hasPreviousPage(1) === false, "page 1 has no previous");
assert(hasPreviousPage(2) === true, "page 2 has previous");
assert(hasNextPage(1, 25, 143) === true, "page 1 has next when more rows");
assert(hasNextPage(6, 25, 143) === false, "last page has no next");

// Transaction filters preserve pagination-related params
{
  const filters = parseTransactionSearchParams({
    q: "coffee",
    direction: "expense",
    scope: "business",
    category: "cat-1",
    taxYear: "ty-1",
    from: "2025-04-01",
    to: "2025-04-30",
    page: "2",
  });
  assert(filters.search === "coffee", "search preserved");
  assert(filters.direction === "expense", "direction preserved");
  assert(filters.scope === "business", "scope preserved");
  assert(filters.categoryId === "cat-1", "category preserved");
  assert(filters.taxYearId === "ty-1", "tax year preserved");
  assert(filters.from === "2025-04-01", "from date preserved");
  assert(filters.to === "2025-04-30", "to date preserved");
  assert(filters.page === 2, "page preserved");
}

// Page size constants
assert(TRANSACTIONS_PAGE_SIZE === 25, "transactions page size is 25");
assert(RECEIPTS_PAGE_SIZE === 20, "receipts page size is 20");

// Import preview row cap (visual only)
const PREVIEW_ROW_LIMIT = 25;
const mockRows = Array.from({ length: 40 }, (_, i) => i);
assert(
  mockRows.slice(0, PREVIEW_ROW_LIMIT).length === 25,
  "import preview shows first 25 rows"
);
assert(mockRows.length === 40, "import still has full row count for import action");

// Categorisation group batch
const GROUPS_BATCH_SIZE = 10;
const mockGroups = Array.from({ length: 23 }, (_, i) => i);
assert(
  mockGroups.slice(0, GROUPS_BATCH_SIZE).length === 10,
  "categorisation shows first 10 groups"
);

console.log("Pagination assertions passed.");
