export interface TransactionListLinkOptions {
  taxYearId: string;
  direction?: "income" | "expense";
  scope?: "business" | "personal";
  /** Personal/business category id */
  categoryId?: string;
  /** Single HMRC category id */
  hmrcCategoryId?: string;
  /** Multiple HMRC category ids (comma-separated in URL) */
  hmrcCategoryIds?: string[];
}

export function buildTransactionsLink(
  options: TransactionListLinkOptions
): string {
  const params = new URLSearchParams();
  params.set("taxYear", options.taxYearId);
  params.set("scope", options.scope ?? "business");

  if (options.direction) {
    params.set("direction", options.direction);
  }

  if (options.categoryId) {
    params.set("category", options.categoryId);
  }

  if (options.hmrcCategoryIds?.length) {
    params.set("hmrc", options.hmrcCategoryIds.join(","));
  } else if (options.hmrcCategoryId) {
    params.set("hmrc", options.hmrcCategoryId);
  }

  return `/transactions?${params.toString()}`;
}

export function buildSelfAssessmentLink(taxYearId: string): string {
  const params = new URLSearchParams();
  params.set("taxYear", taxYearId);
  return `/tax/self-assessment?${params.toString()}`;
}

export function buildReceiptsLink(): string {
  return "/receipts";
}
