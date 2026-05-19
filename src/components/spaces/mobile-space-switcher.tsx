"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setActiveSpace } from "@/lib/spaces/actions";
import {
  spaceSwitcherLabel,
  type UserSpace,
} from "@/lib/spaces/types";

interface MobileSpaceSwitcherProps {
  spaces: UserSpace[];
  activeSpaceId: string;
}

export function MobileSpaceSwitcher({
  spaces,
  activeSpaceId,
}: MobileSpaceSwitcherProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const hasHousehold = spaces.some((s) => s.type === "household");

  function handleChange(spaceId: string) {
    if (spaceId === activeSpaceId) return;
    startTransition(async () => {
      await setActiveSpace(spaceId);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2 border-b border-border px-4 py-3 lg:hidden">
      <p className="text-xs font-medium text-muted-foreground">Finance space</p>
      <select
        value={activeSpaceId}
        disabled={pending}
        onChange={(e) => handleChange(e.target.value)}
        className="flex h-9 w-full rounded-lg border border-border bg-card px-3 text-sm"
        aria-label="Finance space"
      >
        {spaces.map((space) => (
          <option key={space.id} value={space.id}>
            {spaceSwitcherLabel(space)}
          </option>
        ))}
      </select>
      {!hasHousehold ? (
        <Button type="button" variant="outline" size="sm" className="w-full" asChild>
          <Link href="/spaces/new">
            <Plus className="mr-2 h-4 w-4" />
            Create household space
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
