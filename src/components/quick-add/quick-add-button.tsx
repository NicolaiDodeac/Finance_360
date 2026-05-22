"use client";

import { useState } from "react";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuickAddDrawer } from "@/components/quick-add/quick-add-drawer";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import type { QuickAddDateContext } from "@/lib/quick-add/date-context";
import { cn } from "@/lib/utils";

interface QuickAddButtonProps {
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  dateContext?: QuickAddDateContext | null;
  size?: "sm" | "default";
  variant?: "outline" | "secondary" | "default";
  className?: string;
}

export function QuickAddButton({
  categories,
  hmrcCategories,
  dateContext,
  size = "default",
  variant = "outline",
  className,
}: QuickAddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={cn(className)}
        onClick={() => setOpen(true)}
      >
        <Zap className="h-4 w-4" />
        Quick add
      </Button>
      <QuickAddDrawer
        open={open}
        onOpenChange={setOpen}
        categories={categories}
        hmrcCategories={hmrcCategories}
        dateContext={dateContext}
      />
    </>
  );
}
