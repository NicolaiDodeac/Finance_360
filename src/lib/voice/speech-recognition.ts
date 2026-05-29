import {
  SPEECH_RECOGNITION_LOCALE,
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

export function createSpeechRecognition(): SpeechRecognitionHandle | null {
  const Ctor = getSpeechRecognitionConstructor();
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;
  recognition.lang = SPEECH_RECOGNITION_LOCALE;

  return {
    recognition,
    locale: SPEECH_RECOGNITION_LOCALE,
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

/**
 * Common merchant / brand names spoken aloud are often transcribed with
 * spelling variants, spacing, or as ordinary words by the en-GB recogniser.
 * These corrections normalise them back to their canonical form so voice
 * capture stays consistent (e.g. "canvas" → "Canva", "h m r c" → "HMRC").
 *
 * Keys are matched case-insensitively against whole words.
 */
const MERCHANT_SPEECH_CORRECTIONS: Record<string, string> = {
  tesco: "Tesco",
  tescos: "Tesco",
  "tesco's": "Tesco",
  shell: "Shell",
  uber: "Uber",
  cursor: "Cursor",
  canva: "Canva",
  canvas: "Canva",
  booksy: "Booksy",
  "book see": "Booksy",
  bookcy: "Booksy",
  lloyds: "Lloyds",
  "lloyd's": "Lloyds",
  lloyd: "Lloyds",
  hmrc: "HMRC",
  "h m r c": "HMRC",
};

const MERCHANT_CORRECTION_PATTERNS = Object.entries(
  MERCHANT_SPEECH_CORRECTIONS
).map(([phrase, canonical]) => ({
  canonical,
  regex: new RegExp(
    `\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
    "gi"
  ),
}));

/** Normalise spoken merchant names to their canonical spelling. */
export function normaliseMerchantSpeech(transcript: string): string {
  let result = transcript;
  for (const { regex, canonical } of MERCHANT_CORRECTION_PATTERNS) {
    result = result.replace(regex, canonical);
  }
  return result;
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
