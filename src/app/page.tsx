import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getUser } from "@/lib/auth/helpers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const user = await getUser();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mx-auto max-w-lg space-y-8 text-center">
        <div className="space-y-4">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-lg font-bold text-primary-foreground">
            F
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground">
            Finance 360
          </h1>
          <p className="text-lg text-muted-foreground">
            UK-focused personal finance and self-employed tax tracking — calm,
            clear, and built for you.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
