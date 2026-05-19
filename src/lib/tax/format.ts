export { formatMoney } from "@/lib/transactions/format";

export function formatCount(
  count: number,
  singular: string,
  plural?: string
): string {
  const label = count === 1 ? singular : (plural ?? `${singular}s`);
  return `${count} ${label}`;
}
