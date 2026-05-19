"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Plus, Users } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { setActiveSpace } from "@/lib/spaces/actions";
import {
  spaceSwitcherLabel,
  type UserSpace,
} from "@/lib/spaces/types";

interface SpaceSwitcherProps {
  spaces: UserSpace[];
  activeSpaceId: string;
}

export function SpaceSwitcher({ spaces, activeSpaceId }: SpaceSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const active = spaces.find((s) => s.id === activeSpaceId) ?? spaces[0];

  function handleChange(spaceId: string) {
    if (spaceId === activeSpaceId) return;
    startTransition(async () => {
      await setActiveSpace(spaceId);
      router.refresh();
    });
  }

  if (!active) return null;

  const householdSpaces = spaces.filter((s) => s.type === "household");

  return (
    <div className="relative hidden items-center gap-2 lg:flex">
      <label htmlFor="space-switcher" className="sr-only">
        Finance space
      </label>
      <div className="relative">
        <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <select
          id="space-switcher"
          value={activeSpaceId}
          disabled={pending}
          onChange={(e) => handleChange(e.target.value)}
          className="h-9 min-w-[11rem] appearance-none rounded-lg border border-border bg-card pl-9 pr-8 text-sm font-medium shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60"
        >
          {spaces.map((space) => (
            <option key={space.id} value={space.id}>
              {spaceSwitcherLabel(space)}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {householdSpaces.length === 0 ? (
        <Button type="button" variant="outline" size="sm" asChild>
          <Link href="/spaces/new">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Shared space
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
