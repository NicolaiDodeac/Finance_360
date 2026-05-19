"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/config/navigation";

interface NavLinkProps {
  item: NavItem;
  onNavigate?: () => void;
}

export function NavLink({ item, onNavigate }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === item.href || pathname.startsWith(`${item.href}/`);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-sidebar-accent text-primary"
          : "text-sidebar-foreground hover:bg-muted"
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex min-w-0 flex-col">
        <span>{item.title}</span>
        {item.description ? (
          <span className="text-xs font-normal text-muted-foreground">
            {item.description}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
