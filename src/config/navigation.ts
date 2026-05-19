import {
  LayoutDashboard,
  ArrowLeftRight,
  Wallet,
  Target,
  Compass,
  Landmark,
  Receipt,
  LineChart,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { FinanceMode } from "@/lib/profile/types";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  /** Shown under the title in the sidebar (e.g. optional module hint). */
  description?: string;
}

export const mainNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", href: "/transactions", icon: ArrowLeftRight },
  { title: "Budget", href: "/budget", icon: Wallet },
  { title: "Goals", href: "/goals", icon: Target },
  {
    title: "Planning",
    href: "/planning",
    icon: Compass,
    description: "What your money is for",
  },
  { title: "Tax Hub", href: "/tax", icon: Landmark },
  { title: "Receipts", href: "/receipts", icon: Receipt },
  { title: "Insights", href: "/insights", icon: LineChart },
  { title: "Settings", href: "/settings", icon: Settings },
];

export function getMainNavItems(financeMode: FinanceMode = "personal"): NavItem[] {
  return mainNavItems.map((item) => {
    if (item.href === "/tax" && financeMode === "personal") {
      return {
        ...item,
        description: "Optional — self-employed tax",
      };
    }
    return item;
  });
}
