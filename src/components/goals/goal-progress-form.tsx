"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGoalProgress } from "@/lib/goals/actions";

interface GoalProgressFormProps {
  goalId: string;
  currentAmount: number;
  submitLabel?: string;
  successMessage?: string;
}

export function GoalProgressForm({
  goalId,
  currentAmount,
  submitLabel = "Update saved amount",
  successMessage = "Progress updated",
}: GoalProgressFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setPending(true);
    const result = await updateGoalProgress(new FormData(e.currentTarget));
    setPending(false);
    if (!result.success) {
      setError(result.error ?? "Could not update progress.");
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-t pt-4">
      <input type="hidden" name="goal_id" value={goalId} />
      <div className="min-w-[10rem] flex-1 space-y-1">
        <Label htmlFor={`saved-${goalId}`}>Update saved amount</Label>
        <Input
          id={`saved-${goalId}`}
          name="current_amount"
          type="number"
          min="0"
          step="0.01"
          defaultValue={currentAmount}
          required
        />
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
      {saved ? (
        <p className="w-full text-sm text-emerald-700 dark:text-emerald-400">
          {successMessage}
        </p>
      ) : null}
      {error ? (
        <p className="w-full text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </form>
  );
}
