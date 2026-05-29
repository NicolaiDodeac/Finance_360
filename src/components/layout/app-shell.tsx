import { AppSidebar } from "@/components/layout/app-sidebar";
import { AppHeader } from "@/components/layout/app-header";
import { AppLanguageProvider } from "@/components/providers/app-language-provider";
import { CaptureProvider } from "@/components/capture/capture-provider";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import type { FinanceMode } from "@/lib/profile/types";
import type { UserSpace } from "@/lib/spaces/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
  financeMode?: FinanceMode;
  spaces?: UserSpace[];
  activeSpaceId?: string;
  captureCategories?: CategoryRow[];
  captureHmrcCategories?: HmrcCategoryRow[];
  captureDefaultTaxYearId?: string | null;
}

export function AppShell({
  children,
  userEmail,
  financeMode,
  spaces = [],
  activeSpaceId,
  captureCategories = [],
  captureHmrcCategories = [],
  captureDefaultTaxYearId,
}: AppShellProps) {
  return (
    <AppLanguageProvider>
    <CaptureProvider
      categories={captureCategories}
      hmrcCategories={captureHmrcCategories}
      defaultTaxYearId={captureDefaultTaxYearId}
    >
    <div className="flex min-h-screen bg-background">
      <AppSidebar financeMode={financeMode} />
      <div className="flex flex-1 flex-col">
        <AppHeader
          userEmail={userEmail}
          financeMode={financeMode}
          spaces={spaces}
          activeSpaceId={activeSpaceId}
        />
        <main className="flex-1 overflow-auto px-4 pt-4 pb-24 sm:px-6 sm:pt-6 lg:p-8">
          <div className="mx-auto max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
    </CaptureProvider>
    </AppLanguageProvider>
  );
}
