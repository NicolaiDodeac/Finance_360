"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getMainNavItems } from "@/config/navigation";
import { NavLink } from "@/components/layout/nav-link";
import { MobileSpaceSwitcher } from "@/components/spaces/mobile-space-switcher";
import type { FinanceMode } from "@/lib/profile/types";
import type { UserSpace } from "@/lib/spaces/types";
import Link from "next/link";
import { useState } from "react";

interface MobileNavProps {
  financeMode?: FinanceMode;
  spaces?: UserSpace[];
  activeSpaceId?: string;
}

/** Routes already reachable from the mobile bottom tab bar (Home/Activity/Plans/You). */
const BOTTOM_TAB_HREFS = new Set(["/dashboard", "/transactions", "/planning"]);

export function MobileNav({
  financeMode = "personal",
  spaces = [],
  activeSpaceId,
}: MobileNavProps) {
  const navItems = getMainNavItems(financeMode).filter(
    (item) => !BOTTOM_TAB_HREFS.has(item.href)
  );
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="p-0">
        <SheetTitle className="sr-only">Navigation menu</SheetTitle>
        <div className="flex h-16 items-center border-b border-sidebar-border px-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              F
            </span>
            <span className="text-lg font-semibold">Finance 360</span>
          </Link>
        </div>
        {activeSpaceId ? (
          <MobileSpaceSwitcher spaces={spaces} activeSpaceId={activeSpaceId} />
        ) : null}
        <nav className="flex flex-col gap-1 p-4">
          <p className="px-3 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            More
          </p>
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onNavigate={() => setOpen(false)}
            />
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
