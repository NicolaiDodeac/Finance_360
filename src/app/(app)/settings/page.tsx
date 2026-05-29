import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { PlaceholderCard } from "@/components/shared/placeholder-card";
import { SetupStatusCard } from "@/components/settings/setup-status-card";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AppLanguageCard } from "@/components/settings/app-language-card";
import { FinanceModeCard } from "@/components/settings/finance-mode-card";
import { requireAuth } from "@/lib/auth/helpers";
import { ensureProfile } from "@/lib/profile/queries";
import { ensureUserSetup, getSetupStatus } from "@/lib/setup";

export default async function SettingsPage() {
  const user = await requireAuth();
  const profile = await ensureProfile(user.id);

  let setupStatus;
  try {
    ({ status: setupStatus } = await ensureUserSetup(user.id));
  } catch {
    setupStatus = await getSetupStatus(user.id);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Manage your account and preferences."
      />
      <div className="grid gap-4 md:grid-cols-2">
        <FinanceModeCard currentMode={profile.finance_mode} />
        <AppLanguageCard />
        <SetupStatusCard status={setupStatus} />
        <Card>
          <CardHeader>
            <CardTitle>Categorisation rules</CardTitle>
            <CardDescription>
              Remember merchants and apply categories automatically on import and
              new transactions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button type="button" variant="outline" asChild>
              <Link href="/settings/rules">Manage rules</Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Tools &amp; more</CardTitle>
            <CardDescription>
              Receipts, tax tools, and insights — all in one place.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" asChild>
              <Link href="/receipts">Receipts</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/insights">Insights</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/tax">Tax Hub</Link>
            </Button>
            <Button type="button" variant="outline" asChild>
              <Link href="/tax/self-assessment">Self Assessment</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
            <CardDescription>
              Signed in as {user.email ?? "your account"}
              {profile.display_name ? ` · ${profile.display_name}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Display name and currency preferences — coming soon.
            </p>
          </CardContent>
        </Card>
        <PlaceholderCard
          title="Notifications"
          description="Email and in-app alerts for goals, tax deadlines, and insights."
        />
        <PlaceholderCard
          title="Connected accounts"
          description="Open Banking connections will be managed here."
        />
      </div>
    </>
  );
}
