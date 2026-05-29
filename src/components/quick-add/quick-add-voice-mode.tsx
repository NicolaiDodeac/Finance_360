"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Pencil, RotateCcw, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";

export type VoiceCapturePhase = "recording" | "result" | "edit";

interface QuickAddVoiceModeProps {
  disabled?: boolean;
  autoStart?: boolean;
  onConfirm: (text: string) => void;
  onCancel: () => void;
  onPhaseChange?: (phase: VoiceCapturePhase) => void;
}

const WAVE_SCALES = [0.45, 0.75, 1, 0.9, 0.6, 0.95, 0.7] as const;

function VoiceWaveBars({ active }: { active: boolean }) {
  return (
    <div
      className="flex h-14 items-end justify-center gap-1.5"
      aria-hidden
    >
      {WAVE_SCALES.map((scale, i) => (
        <span
          key={i}
          className={cn(
            "w-2 rounded-full bg-red-500/90",
            active ? "animate-voice-bar" : "h-2 bg-muted-foreground/25"
          )}
          style={
            active
              ? {
                  height: `${14 + scale * 32}px`,
                  animationDelay: `${i * 110}ms`,
                  animationDuration: `${720 + (i % 3) * 180}ms`,
                }
              : undefined
          }
        />
      ))}
    </div>
  );
}

function RecordingVisual({
  onStop,
  disabled,
}: {
  onStop: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-7 py-4">
      <div className="relative flex h-40 w-40 items-center justify-center">
        <span
          className="pointer-events-none absolute inset-0 rounded-full border-2 border-red-500/25 animate-voice-ring"
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-2 rounded-full border border-red-500/20 animate-voice-ring"
          style={{ animationDelay: "0.6s" }}
          aria-hidden
        />
        <span
          className="pointer-events-none absolute inset-5 animate-pulse rounded-full bg-red-500/10"
          aria-hidden
        />
        <button
          type="button"
          disabled={disabled}
          onClick={onStop}
          aria-label="Stop recording"
          className={cn(
            "relative z-10 flex h-28 w-28 items-center justify-center rounded-full",
            "bg-red-600 text-white shadow-lg shadow-red-600/35",
            "transition-transform active:scale-95",
            "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-500/40"
          )}
        >
          <Square className="h-10 w-10 fill-current" aria-hidden />
        </button>
      </div>

      <div className="space-y-3 text-center">
        <p className="flex items-center justify-center gap-2 text-lg font-semibold text-foreground">
          <span className="relative flex h-2.5 w-2.5" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-70" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-600" />
          </span>
          Listening…
        </p>
        <p className="max-w-[18rem] text-sm text-muted-foreground">
          Say amount and what it was for — e.g. &ldquo;Fuel fifty pounds
          business&rdquo;. Tap stop when you&apos;re done.
        </p>
      </div>

      <VoiceWaveBars active />

      <Button
        type="button"
        variant="outline"
        className="h-11 min-w-[9rem] border-red-200/80 text-foreground hover:bg-red-50 dark:border-red-900/40 dark:hover:bg-red-950/30"
        disabled={disabled}
        onClick={onStop}
      >
        <Mic className="mr-2 h-4 w-4 text-red-600" aria-hidden />
        Stop recording
      </Button>
    </div>
  );
}

/**
 * Voice-first capture: record → hear result → confirm or edit.
 * No textarea while recording — distinct from Quick Add typing.
 */
export function QuickAddVoiceMode({
  disabled,
  autoStart,
  onConfirm,
  onCancel,
  onPhaseChange,
}: QuickAddVoiceModeProps) {
  const [phase, setPhase] = useState<VoiceCapturePhase>("recording");
  const [heardText, setHeardText] = useState("");
  const [editText, setEditText] = useState("");
  const autoStartedRef = useRef(false);
  const wasListeningRef = useRef(false);
  const transcriptRef = useRef("");
  const interimRef = useRef("");

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    restartListening,
    resetTranscript,
  } = useSpeechRecognition();

  transcriptRef.current = transcript;
  interimRef.current = interimTranscript;

  function setPhaseAndNotify(next: VoiceCapturePhase) {
    setPhase(next);
    onPhaseChange?.(next);
  }

  useEffect(() => () => stopListening(), [stopListening]);

  useEffect(() => {
    if (!autoStart) {
      autoStartedRef.current = false;
      stopListening();
      return;
    }
    if (autoStartedRef.current || disabled || !isSupported) return;
    autoStartedRef.current = true;
    resetTranscript();
    setHeardText("");
    setEditText("");
    setPhaseAndNotify("recording");
    startListening();
  }, [
    autoStart,
    disabled,
    isSupported,
    resetTranscript,
    startListening,
    stopListening,
  ]);

  // Silence auto-stop and engine onend — same path as the Stop button.
  useEffect(() => {
    if (wasListeningRef.current && !isListening && phase === "recording") {
      const text = [transcriptRef.current, interimRef.current]
        .filter(Boolean)
        .join(" ")
        .trim();
      setHeardText(text);
      setEditText(text);
      setPhaseAndNotify("result");
    }
    wasListeningRef.current = isListening;
  }, [isListening, phase]);

  function finishRecording() {
    const text = [transcriptRef.current, interimRef.current]
      .filter(Boolean)
      .join(" ")
      .trim();
    stopListening();
    setHeardText(text);
    setEditText(text);
    setPhaseAndNotify("result");
  }

  function handleStop() {
    finishRecording();
  }

  function handleSayAgain() {
    resetTranscript();
    transcriptRef.current = "";
    interimRef.current = "";
    setHeardText("");
    setEditText("");
    wasListeningRef.current = false;
    setPhaseAndNotify("recording");
    restartListening();
  }

  function handleConfirm() {
    const text = (phase === "edit" ? editText : heardText).trim();
    if (!text) return;
    stopListening();
    onConfirm(text);
  }

  if (!isSupported) {
    return (
      <div className="space-y-4 py-4 text-center">
        <p className="text-sm text-muted-foreground">
          Voice input is not supported on this device or browser. Use Quick Add
          to type instead.
        </p>
        <Button type="button" variant="outline" onClick={onCancel}>
          Close
        </Button>
      </div>
    );
  }

  if (phase === "recording") {
    return (
      <div
        className="rounded-2xl border border-red-500/15 bg-gradient-to-b from-red-500/[0.06] to-transparent px-2"
        role="region"
        aria-label="Voice recording"
      >
        <RecordingVisual onStop={handleStop} disabled={disabled} />
        {error ? (
          <p className="pb-3 text-center text-sm text-amber-800 dark:text-amber-200">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  if (phase === "edit") {
    return (
      <div className="space-y-4" role="region" aria-label="Edit voice transcript">
        <p className="text-sm font-medium text-foreground">Edit what we heard</p>
        <textarea
          value={editText}
          onChange={(e) => setEditText(e.target.value)}
          disabled={disabled}
          rows={4}
          autoFocus
          className={cn(
            "flex min-h-[100px] w-full resize-y rounded-lg border border-border bg-card px-3 py-2 text-sm shadow-sm",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
          )}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            disabled={disabled}
            onClick={() => setPhaseAndNotify("result")}
          >
            Back
          </Button>
          <Button
            type="button"
            className="flex-1"
            disabled={disabled || !editText.trim()}
            onClick={handleConfirm}
          >
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-5 py-2"
      role="region"
      aria-label="Confirm voice transcript"
    >
      <div className="space-y-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">We heard</p>
        {heardText ? (
          <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4 text-base leading-relaxed text-foreground">
            &ldquo;{heardText}&rdquo;
          </p>
        ) : (
          <p className="rounded-xl border border-dashed border-border bg-muted/30 px-4 py-6 text-sm text-muted-foreground">
            We didn&apos;t catch anything. Try speaking again in a quiet place.
          </p>
        )}
      </div>

      {error ? (
        <p className="text-center text-sm text-amber-800 dark:text-amber-200">
          {error}
        </p>
      ) : null}

      <div className="grid gap-2">
        <Button
          type="button"
          className="h-12 w-full"
          disabled={disabled || !heardText.trim()}
          onClick={handleConfirm}
        >
          Looks right — continue
        </Button>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={disabled || !heardText.trim()}
            onClick={() => setPhaseAndNotify("edit")}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-11"
            disabled={disabled}
            onClick={handleSayAgain}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Say again
          </Button>
        </div>
        <Button
          type="button"
          variant="ghost"
          className="h-10"
          disabled={disabled}
          onClick={onCancel}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
