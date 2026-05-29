"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Compass,
  LayoutDashboard,
  Plus,
  User,
  type LucideIcon,
} from "lucide-react";
import { useCapture } from "@/components/capture/capture-provider";
import { cn } from "@/lib/utils";

interface BottomTab {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Match nested routes (e.g. /transactions/import highlights Activity). */
  matchPrefix?: boolean;
}

const leftTabs: BottomTab[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "Activity", href: "/transactions", icon: ArrowLeftRight, matchPrefix: true },
];

const rightTabs: BottomTab[] = [
  { label: "Plans", href: "/planning", icon: Compass },
  { label: "You", href: "/settings", icon: User, matchPrefix: true },
];

function isActive(pathname: string, tab: BottomTab): boolean {
  if (tab.matchPrefix) {
    return pathname === tab.href || pathname.startsWith(`${tab.href}/`);
  }
  return pathname === tab.href;
}

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openCapture } = useCapture();

  return (
    <nav
      aria-label="Primary"
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md lg:hidden",
        "pb-[env(safe-area-inset-bottom)]"
      )}
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-2">
        {leftTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
        ))}

        <button
          type="button"
          onClick={openCapture}
          aria-label="Capture"
          className="relative flex flex-1 flex-col items-center justify-end pb-1.5 focus:outline-none"
        >
          <span className="absolute -top-5 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 ring-4 ring-card transition active:scale-95">
            <Plus className="h-7 w-7" />
          </span>
          <span className="mt-auto text-[10px] font-medium text-muted-foreground">
            Capture
          </span>
        </button>

        {rightTabs.map((tab) => (
          <TabLink key={tab.href} tab={tab} active={isActive(pathname, tab)} />
        ))}
      </div>
    </nav>
  );
}

function TabLink({ tab, active }: { tab: BottomTab; active: boolean }) {
  const Icon = tab.icon;
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex flex-1 flex-col items-center justify-center gap-1 rounded-lg text-muted-foreground transition-colors",
        active && "text-primary"
      )}
    >
      <Icon className={cn("h-5 w-5", active && "fill-primary/10")} />
      <span className="text-[10px] font-medium">{tab.label}</span>
    </Link>
  );
}
