import { requireAuth } from "@/lib/auth/helpers";
import { ensureProfile } from "@/lib/profile/queries";
import { getActiveSpaceContext, getUserSpaces } from "@/lib/spaces/queries";
import { ensureUserSetup } from "@/lib/setup";
import { AppShell } from "@/components/layout/app-shell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAuth();

  try {
    await ensureUserSetup(user.id);
  } catch (err) {
    console.error("[ensureUserSetup]", err);
  }

  const profile = await ensureProfile(user.id);
  const [spaces, { space: activeSpace }] = await Promise.all([
    getUserSpaces(user.id),
    getActiveSpaceContext(user.id),
  ]);

  return (
    <AppShell
      userEmail={user.email}
      financeMode={profile.finance_mode}
      spaces={spaces}
      activeSpaceId={activeSpace.id}
    >
      {children}
    </AppShell>
  );
}
