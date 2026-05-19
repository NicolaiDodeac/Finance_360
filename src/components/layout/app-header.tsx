"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SpaceSwitcher } from "@/components/spaces/space-switcher";
import { financeModeLabel } from "@/lib/profile/types";
import type { FinanceMode } from "@/lib/profile/types";
import type { UserSpace } from "@/lib/spaces/types";

interface AppHeaderProps {
  userEmail?: string;
  financeMode?: FinanceMode;
  spaces?: UserSpace[];
  activeSpaceId?: string;
}

export function AppHeader({
  userEmail,
  financeMode = "personal",
  spaces = [],
  activeSpaceId,
}: AppHeaderProps) {
  const router = useRouter();
  const initials = userEmail
    ? userEmail.slice(0, 2).toUpperCase()
    : "U";

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-card/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <MobileNav
        financeMode={financeMode}
        spaces={spaces}
        activeSpaceId={activeSpaceId}
      />
      {activeSpaceId ? (
        <SpaceSwitcher spaces={spaces} activeSpaceId={activeSpaceId} />
      ) : (
        <div className="hidden lg:block" />
      )}
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-foreground">
            {userEmail ?? "Account"}
          </p>
          <p className="text-xs text-muted-foreground">
            {financeModeLabel(financeMode)}
          </p>
        </div>
        <Avatar>
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <Button variant="ghost" size="icon" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sign out</span>
        </Button>
      </div>
    </header>
  );
}
