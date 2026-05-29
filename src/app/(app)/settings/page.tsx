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
      <div className="space-y-10">
        <SettingsSection title="Profile">
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
        </SettingsSection>

        <SettingsSection title="App preferences">
          <AppLanguageCard />
          <PlaceholderCard
            title="Notifications"
            description="Email and in-app alerts for goals, tax deadlines, and insights."
          />
        </SettingsSection>

        <SettingsSection title="Finance mode">
          <FinanceModeCard currentMode={profile.finance_mode} />
        </SettingsSection>

        <SettingsSection title="Rules & automation">
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
        </SettingsSection>

        <SettingsSection title="Tax tools">
          <Card>
            <CardHeader>
              <CardTitle>Tax preparation</CardTitle>
              <CardDescription>
                Review your tax overview and prepare your Self Assessment.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/tax">Tax Hub</Link>
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/tax/self-assessment">Self Assessment</Link>
              </Button>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection title="Receipt vault & evidence">
          <Card>
            <CardHeader>
              <CardTitle>Receipts</CardTitle>
              <CardDescription>
                Your stored proof and spending insights.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" asChild>
                <Link href="/receipts">Receipt vault</Link>
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link href="/insights">Insights</Link>
              </Button>
            </CardContent>
          </Card>
        </SettingsSection>

        <SettingsSection
          title="Developer & setup"
          description="Technical setup status. Most people can ignore this."
        >
          <SetupStatusCard status={setupStatus} />
          <PlaceholderCard
            title="Connected accounts"
            description="Open Banking connections will be managed here."
          />
        </SettingsSection>
      </div>
    </>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="space-y-0.5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </section>
  );
}
