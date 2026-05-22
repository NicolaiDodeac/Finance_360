import {
  getSpeechLocaleForAppLanguage,
  SPEECH_FALLBACK_LOCALE,
  type AppLanguage,
  type SpeechRecognitionLocale,
} from "@/lib/i18n/app-language";

export type SpeechRecognitionErrorKind =
  | "unsupported"
  | "permission-denied"
  | "no-speech"
  | "network"
  | "aborted"
  | "generic";

export interface SpeechRecognitionHandle {
  recognition: SpeechRecognitionInstance;
  locale: SpeechRecognitionLocale;
  usedFallback: boolean;
}

/** Minimal typings for the Web Speech API (not in all TS DOM libs). */
export interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onaudioend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognitionInstance, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognitionInstance, ev: SpeechRecognitionResultEvent) => void)
    | null;
  onspeechend: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
  onstart: ((this: SpeechRecognitionInstance, ev: Event) => void) | null;
}

export interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export interface SpeechRecognitionResultEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

export interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getSpeechRecognitionConstructor());
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

export function createSpeechRecognition(
  locale: SpeechRecognitionLocale
): SpeechRecognitionHandle | null {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = locale;

  return {
    recognition,
    locale,
    usedFallback: locale === SPEECH_FALLBACK_LOCALE,
  };
}

export function createSpeechRecognitionForAppLanguage(
  language: AppLanguage,
  options?: { preferFallback?: boolean }
): SpeechRecognitionHandle | null {
  const primary = getSpeechLocaleForAppLanguage(language);
  const locale = options?.preferFallback ? SPEECH_FALLBACK_LOCALE : primary;
  const handle = createSpeechRecognition(locale);
  if (!handle) return null;
  return {
    ...handle,
    usedFallback: Boolean(options?.preferFallback && language === "uk"),
  };
}

export function mapSpeechRecognitionError(
  error: string
): { kind: SpeechRecognitionErrorKind; message: string } {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return {
        kind: "permission-denied",
        message: "Microphone access was denied.",
      };
    case "no-speech":
      return {
        kind: "no-speech",
        message: "No speech detected. Tap the microphone to try again.",
      };
    case "network":
      return {
        kind: "network",
        message: "Voice input failed. Check your connection and try again.",
      };
    case "aborted":
      return {
        kind: "aborted",
        message: "",
      };
    default:
      return {
        kind: "generic",
        message: "Voice input stopped. Tap the microphone to try again.",
      };
  }
}

export function unsupportedSpeechMessage(): string {
  return "Voice input is not supported on this device/browser.";
}

export function ukrainianFallbackNotice(): string {
  return "Ukrainian voice is not available here — listening in English.";
}

/** Optional short haptic on supported mobile browsers. */
export function vibrateSpeechFeedback(pattern: number | number[] = 12): void {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      /* ignore */
    }
  }
}

/** Default pause after last speech before auto-stop (ms). */
export const SPEECH_SILENCE_AUTO_STOP_MS = 2200;
