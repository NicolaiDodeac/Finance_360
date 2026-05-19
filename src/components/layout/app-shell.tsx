import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import type { FinanceMode } from "@/lib/profile/types";
import type { UserSpace } from "@/lib/spaces/types";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
  financeMode?: FinanceMode;
  spaces?: UserSpace[];
  activeSpaceId?: string;
}

export function AppShell({
  children,
  userEmail,
  financeMode,
  spaces = [],
  activeSpaceId,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar financeMode={financeMode} />
      <div className="flex flex-1 flex-col">
        <AppHeader
          userEmail={userEmail}
          financeMode={financeMode}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
        />
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
