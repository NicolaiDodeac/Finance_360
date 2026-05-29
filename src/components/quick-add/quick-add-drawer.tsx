"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Mic, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { QuickAddDraftCard } from "@/components/quick-add/quick-add-draft-card";
import { QuickAddVoiceInput } from "@/components/quick-add/quick-add-voice-input";
import {
  QuickAddVoiceMode,
  type VoiceCapturePhase,
} from "@/components/quick-add/quick-add-voice-mode";
import { saveQuickAddDrafts } from "@/lib/quick-add/actions";
import {
  parseQuickAddText,
  resolveQuickAddDrafts,
} from "@/lib/quick-add";
import type { QuickAddDateContext } from "@/lib/quick-add/date-context";
import type { QuickAddDraft, QuickAddSaveDraftInput } from "@/lib/quick-add/types";
import type { CategoryRow } from "@/lib/categories/queries";
import type { HmrcCategoryRow } from "@/lib/hmrc/queries";
import { formatShortDate } from "@/lib/transactions/format";
import { cn } from "@/lib/utils";

interface QuickAddDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: CategoryRow[];
  hmrcCategories: HmrcCategoryRow[];
  dateContext?: QuickAddDateContext | null;
  /** @deprecated Prefer `mode="voice"`. */
  autoStartVoice?: boolean;
  /** Text typing vs voice-first capture from the global capture sheet. */
  mode?: "text" | "voice";
}

type Step = "input" | "review";

function draftToSaveInput(draft: QuickAddDraft): QuickAddSaveDraftInput {
  return {
    transaction_date: draft.transaction_date,
    merchant_name: draft.merchant_name,
    description: draft.description,
    amount: draft.amount,
    direction: draft.direction,
    purpose: draft.purpose,
    category_choice: draft.categoryChoiceId,
    category_id: draft.categoryId,
    hmrc_category_id: draft.hmrcCategoryId,
    is_business: draft.isBusiness,
    review_recommended: draft.reviewRecommended,
    flow_type: draft.flowType,
    counts_as_turnover: draft.countsAsTurnover,
    exclude_from_income: draft.excludeFromIncome,
    exclude_from_spending: draft.excludeFromSpending,
    original_segment: draft.originalSegment,
    payment_method: draft.payment_method,
  };
}

export function QuickAddDrawer({
  open,
  onOpenChange,
  categories,
  hmrcCategories,
  dateContext,
  autoStartVoice,
  mode: modeProp,
}: QuickAddDrawerProps) {
  const router = useRouter();
  const mode = modeProp ?? (autoStartVoice ? "voice" : "text");
  const isVoiceMode = mode === "voice";
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<Step>("input");
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<QuickAddDraft[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [parseNotice, setParseNotice] = useState<string | null>(null);
  const [voicePhase, setVoicePhase] = useState<VoiceCapturePhase>("recording");
  const [draftDefaultDate, setDraftDefaultDate] = useState(
    () => dateContext?.defaultDate ?? new Date().toISOString().slice(0, 10)
  );

  useEffect(() => {
    if (open) {
      setDraftDefaultDate(
        dateContext?.defaultDate ?? new Date().toISOString().slice(0, 10)
      );
    }
  }, [open, dateContext?.defaultDate]);

  const hasValidDrafts = useMemo(
    () =>
      drafts.length > 0 &&
      drafts.every(
        (d) =>
          d.amount > 0 &&
          (d.direction !== "expense" || Boolean(d.payment_method))
      ),
    [drafts]
  );

  const usingMonthEnd =
    dateContext?.allowAlternateToday &&
    draftDefaultDate === dateContext.defaultDate;

  function reset() {
    setStep("input");
    setText("");
    setDrafts([]);
    setEditingId(null);
    setError(null);
    setParseNotice(null);
    setVoicePhase("recording");
    setDraftDefaultDate(
      dateContext?.defaultDate ?? new Date().toISOString().slice(0, 10)
    );
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset();
    onOpenChange(next);
  }

  function handleTextChange(value: string) {
    setText(value);
  }

  function handleCreateDrafts(fromText?: string) {
    setError(null);
    setParseNotice(null);
    const trimmed = (fromText ?? text).trim();
    if (!trimmed) {
      setError("Describe what you spent or type an amount and merchant.");
      return;
    }

    setText(trimmed);

    const segments = parseQuickAddText(trimmed);
    if (segments.length === 0) {
      setError("Could not parse any items. Try amount and merchant, e.g. Tesco £45.");
      return;
    }

    const resolved = resolveQuickAddDrafts(
      segments,
      categories,
      hmrcCategories,
      draftDefaultDate
    );
    const invalid = resolved.filter((d) => d.amount <= 0);
    if (invalid.length === resolved.length) {
      setError("Add an amount for each item (e.g. £45 or 45).");
      return;
    }

    if (invalid.length > 0) {
      setParseNotice(
        `${invalid.length} item${invalid.length === 1 ? "" : "s"} need an amount — review before saving.`
      );
    }

    setDrafts(resolved);
    setEditingId(null);
    setStep("review");
  }

  function handleConfirmAll() {
    if (!hasValidDrafts) {
      setError("Fix amounts on drafts before saving.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await saveQuickAddDrafts({
        original_text: text.trim(),
        drafts: drafts.map(draftToSaveInput),
      });
      if (!result.success) {
        setError(result.error ?? "Could not save drafts.");
        return;
      }
      handleOpenChange(false);
      router.refresh();
    });
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle className="flex items-center gap-2">
            {isVoiceMode ? (
              <>
                <Mic className="h-5 w-5 text-red-600" />
                Voice add
              </>
            ) : (
              <>
                <Zap className="h-5 w-5 text-primary" />
                Quick Add
              </>
            )}
          </DrawerTitle>
          <DrawerDescription
            className={cn(
              isVoiceMode &&
                step === "input" &&
                voicePhase === "recording" &&
                "sr-only"
            )}
          >
            {isVoiceMode
              ? voicePhase === "recording"
                ? "Recording. Say amount and what it was for, then stop when you are done."
                : voicePhase === "result" || voicePhase === "edit"
                  ? "Check what we heard, then continue."
                  : step === "review"
                    ? "Check the details, choose personal or business, then confirm below."
                    : "Speak naturally — we show what we heard when you stop, then you confirm."
              : "Quick Add is for cash spending, small corrections, or things your bank statement does not explain well."}
          </DrawerDescription>
        </DrawerHeader>

        <DrawerBody className="space-y-4">
          {dateContext?.helperLabel && !(step === "input" && isVoiceMode) ? (
            <p className="flex items-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-sm font-medium text-foreground">
              <Calendar className="h-4 w-4 shrink-0 text-primary" />
              {dateContext.helperLabel}
            </p>
          ) : null}

          {error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </p>
          ) : null}

          {step === "input" ? (
            isVoiceMode ? (
              <QuickAddVoiceMode
                key={open ? "voice-open" : "voice-closed"}
                autoStart={open}
                disabled={isPending}
                onPhaseChange={setVoicePhase}
                onConfirm={(heard) => handleCreateDrafts(heard)}
                onCancel={() => handleOpenChange(false)}
              />
            ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Your bank import remains the main record. Quick Add helps fill the
                gaps.
              </p>

              {dateContext?.allowAlternateToday ? (
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={usingMonthEnd ? "secondary" : "outline"}
                    disabled={isPending}
                    onClick={() => setDraftDefaultDate(dateContext.defaultDate)}
                  >
                    End of month ({formatShortDate(dateContext.defaultDate)})
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={!usingMonthEnd ? "secondary" : "outline"}
                    disabled={isPending}
                    onClick={() =>
                      setDraftDefaultDate(
                        dateContext.alternateTodayDate ??
                          new Date().toISOString().slice(0, 10)
                      )
                    }
                  >
                    Today
                  </Button>
                </div>
              ) : null}

              <QuickAddVoiceInput
                text={text}
                onTextChange={handleTextChange}
                disabled={isPending}
              />
            </>
            )
          ) : (
            <>
              {!isVoiceMode ? (
                <p className="text-sm text-muted-foreground">
                  Review drafts before they are saved to your Manual Account.
                  Nothing is saved until you confirm.
                </p>
              ) : null}
              {parseNotice ? (
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  {parseNotice}
                </p>
              ) : null}
              <div className="space-y-3">
                {drafts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No drafts left. Go back to add more.
                  </p>
                ) : (
                  drafts.map((draft) => (
                    <QuickAddDraftCard
                      key={draft.id}
                      draft={draft}
                      categories={categories}
                      hmrcCategories={hmrcCategories}
                      dateMin={dateContext?.minDate}
                      dateMax={dateContext?.maxDate}
                      editing={editingId === draft.id}
                      disabled={isPending}
                      showBusinessPurpose
                      hideInlineConfirm={isVoiceMode}
                      onDiscard={() =>
                        setDrafts((prev) => prev.filter((d) => d.id !== draft.id))
                      }
                      onChange={(next) =>
                        setDrafts((prev) =>
                          prev.map((d) => (d.id === next.id ? next : d))
                        )
                      }
                      onDoneEdit={() => setEditingId(null)}
                    />
                  ))
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={isPending}
                onClick={() => {
                  setStep("input");
                  setEditingId(null);
                  setVoicePhase("recording");
                }}
              >
                {isVoiceMode ? "Record again" : "Back to edit text"}
              </Button>
            </>
          )}
        </DrawerBody>

        <DrawerFooter>
          {step === "input" && isVoiceMode ? null : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => handleOpenChange(false)}
              >
                Cancel
              </Button>
              {step === "input" ? (
                <Button
                  type="button"
                  disabled={isPending || !text.trim()}
                  onClick={() => handleCreateDrafts()}
                >
                  Create drafts
                </Button>
              ) : (
                <Button
                  type="button"
                  disabled={isPending || !hasValidDrafts || drafts.length === 0}
                  onClick={handleConfirmAll}
                >
                  {isPending
                    ? "Saving…"
                    : `Confirm ${drafts.length} draft${drafts.length === 1 ? "" : "s"}`}
                </Button>
              )}
            </>
          )}
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
