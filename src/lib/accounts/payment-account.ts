import {
  findCashManualAccountId,
  findManualAccountId,
} from "@/lib/accounts/queries";
import type { AccountRow } from "@/lib/accounts/queries";
import type { ReceiptPaymentMethod } from "@/types/database";

export function accountIdForPayment(
  payment: ReceiptPaymentMethod | null,
  accounts: AccountRow[]
): string {
  const cashId = findCashManualAccountId(accounts);
  const manualId = findManualAccountId(accounts);

  if (payment === "cash") {
    return cashId || manualId;
  }
  return manualId || cashId;
}
