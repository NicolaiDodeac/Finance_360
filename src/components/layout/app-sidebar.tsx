"use client";

import Link from "next/link";
import { getMainNavItems } from "@/config/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { Separator } from "@/components/ui/separator";
import type { FinanceMode } from "@/lib/profile/types";
import { financeModeLabel } from "@/lib/profile/types";

interface AppSidebarProps {
  financeMode?: FinanceMode;
}

function sidebarTagline(mode: FinanceMode = "personal"): string {
  switch (mode) {
    case "personal":
      return "Personal money clarity first";
    case "self_employed":
      return "Business & tax when you need it";
    case "both":
      return "Personal & business in one place";
  }
}

export function AppSidebar({ financeMode = "personal" }: AppSidebarProps) {
  const navItems = getMainNavItems(financeMode);

  return (
    <aside className="hidden h-full w-64 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
      <div className="flex h-16 items-center px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
            F
          </span>
          <span className="text-lg font-semibold tracking-tight">Finance 360</span>
        </Link>
      </div>
      <Separator />
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {navItems.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>
      <div className="p-4">
        <p className="rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          {sidebarTagline(financeMode)}
          <span className="mt-1 block text-[10px] opacity-80">
            {financeModeLabel(financeMode)}
          </span>
        </p>
      </div>
    </aside>
  );
}
