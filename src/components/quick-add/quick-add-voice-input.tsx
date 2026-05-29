"use client";

import { useEffect, useRef } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSpeechRecognition } from "@/lib/voice/use-speech-recognition";

interface QuickAddVoiceInputProps {
  text: string;
  onTextChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  /** Begin listening as soon as the input mounts (e.g. opened from the voice action). */
  autoStart?: boolean;
}

function VoiceWaveform({ active }: { active: boolean }) {
  return (
    <div
      className={cn(
        "flex h-5 items-end gap-0.5",
        active ? "opacity-100" : "opacity-0"
      )}
      aria-hidden
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className={cn(
            "w-1 rounded-full bg-red-500/80",
            active && "animate-pulse"
          )}
          style={{
            height: `${8 + (i % 3) * 6}px`,
            animationDelay: `${i * 120}ms`,
          }}
        />
      ))}
    </div>
  );
}

export function QuickAddVoiceInput({
  text,
  onTextChange,
  disabled,
  className,
  autoStart,
}: QuickAddVoiceInputProps) {
  const textPrefixRef = useRef("");
  const manualEditRef = useRef(false);
  const autoStartedRef = useRef(false);

  const {
    isSupported,
    isListening,
    transcript,
    interimTranscript,
    error,
    languageFallbackNotice,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => () => stopListening(), [stopListening]);

  useEffect(() => {
    if (!autoStart || autoStartedRef.current) return;
    if (!isSupported || disabled || isListening) return;
    autoStartedRef.current = true;
    manualEditRef.current = false;
    const trimmed = text.trim();
    textPrefixRef.current = trimmed ? `${trimmed} ` : "";
    resetTranscript();
    startListening();
  }, [
    autoStart,
    isSupported,
    disabled,
    isListening,
    text,
    resetTranscript,
    startListening,
  ]);

  useEffect(() => {
    if (!isListening || manualEditRef.current) return;

    const prefix = textPrefixRef.current;
    const session = [transcript, interimTranscript].filter(Boolean).join(" ");
    const combined = prefix + session;
    onTextChange(combined);
  }, [isListening, transcript, interimTranscript, onTextChange]);

  function handleMicClick() {
    if (disabled) return;

    if (isListening) {
      stopListening();
      return;
    }

    manualEditRef.current = false;
    const trimmed = text.trim();
    textPrefixRef.current = trimmed ? `${trimmed} ` : "";
    resetTranscript();
    startListening();
  }

  function handleTextChange(value: string) {
    if (isListening) {
      manualEditRef.current = true;
      stopListening();
      textPrefixRef.current = "";
    }
    onTextChange(value);
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder="e.g. Tesco £45 groceries, Uber £12, Cursor £18.86 business software"
          aria-label="Quick Add description"
          className={cn(
            "flex min-h-[120px] w-full resize-y rounded-lg border border-border bg-card py-2 pl-3 pr-14 text-sm shadow-sm transition-colors",
            "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
            "disabled:cursor-not-allowed disabled:opacity-50"
          )}
        />
        <Button
          type="button"
          variant={isListening ? "default" : "outline"}
          size="icon"
          disabled={disabled || !isSupported}
          onClick={handleMicClick}
          aria-label={
            isListening
              ? "Stop voice input"
              : "Start voice input"
          }
          aria-pressed={isListening}
          className={cn(
            "absolute bottom-3 right-3 h-11 w-11 shrink-0 rounded-full shadow-sm",
            isListening &&
              "border-red-500/50 bg-red-600 text-white hover:bg-red-600/90 focus-visible:ring-red-500/40"
          )}
        >
          {isListening ? (
            <Square className="h-5 w-5 fill-current" aria-hidden />
          ) : (
            <Mic className="h-5 w-5" aria-hidden />
          )}
        </Button>
      </div>

      {isListening ? (
        <div
          className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400"
          role="status"
          aria-live="polite"
        >
          <span
            className="relative flex h-2.5 w-2.5 shrink-0"
            aria-hidden
          >
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-60" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
          </span>
          <VoiceWaveform active />
          <span className="font-medium">Listening…</span>
        </div>
      ) : null}

      {languageFallbackNotice ? (
        <p className="text-xs text-muted-foreground">{languageFallbackNotice}</p>
      ) : null}

      {!isSupported ? (
        <p className="text-xs text-muted-foreground">
          Voice input is not supported on this device/browser.
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-amber-800 dark:text-amber-200" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
