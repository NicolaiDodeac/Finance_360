import type { FinanceMode } from "@/types/database";

export type { FinanceMode };

export type ProfileRow = {
  id: string;
  user_id: string;
  display_name: string | null;
  default_currency: string;
  timezone: string;
  is_self_employed: boolean;
  finance_mode: FinanceMode;
  created_at: string;
  updated_at: string;
};

export function showsBusinessFeatures(mode: FinanceMode): boolean {
  return mode === "self_employed" || mode === "both";
}

export function financeModeLabel(mode: FinanceMode): string {
  switch (mode) {
    case "personal":
      return "Personal finance";
    case "self_employed":
      return "Self-employed";
    case "both":
      return "Personal & business";
  }
}
