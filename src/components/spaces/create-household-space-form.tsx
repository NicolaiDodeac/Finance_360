"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createHouseholdSpace } from "@/lib/spaces/actions";

export function CreateHouseholdSpaceForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const formData = new FormData(e.currentTarget);
    const result = await createHouseholdSpace(formData);
    setPending(false);

    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
            <Users className="h-5 w-5 text-primary" />
          </span>
          <div>
            <CardTitle className="text-lg">Household space</CardTitle>
            <CardDescription>
              Share goals, not everything — perfect for couples and family planning.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="space-name">Space name</Label>
            <Input
              id="space-name"
              name="name"
              placeholder="e.g. Our household"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invited-email">Invite partner (optional)</Label>
            <Input
              id="invited-email"
              name="invited_email"
              type="email"
              placeholder="partner@email.com"
              autoComplete="email"
            />
            <p className="text-xs text-muted-foreground">
              We&apos;ll save the invitation for later. Email delivery is not enabled yet.
            </p>
          </div>
          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          <Button type="submit" disabled={pending} className="w-full sm:w-auto">
            {pending ? "Creating…" : "Create shared space"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
