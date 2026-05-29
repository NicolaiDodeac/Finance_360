export type AppLanguage = "en" | "uk";

export const APP_LANGUAGE_STORAGE_KEY = "finance360-app-language";

export const APP_LANGUAGE_LABELS: Record<AppLanguage, string> = {
  en: "English",
  uk: "Українська",
};

/**
 * Speech recognition always runs in English (UK), independent of the app
 * language. This keeps voice capture reliable for UK merchant names.
 */
export type SpeechRecognitionLocale = "en-GB";

export const SPEECH_RECOGNITION_LOCALE: SpeechRecognitionLocale = "en-GB";

export function isAppLanguage(value: string | null | undefined): value is AppLanguage {
  return value === "en" || value === "uk";
}

export function readStoredAppLanguage(): AppLanguage | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(APP_LANGUAGE_STORAGE_KEY);
    return isAppLanguage(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function storeAppLanguage(language: AppLanguage): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(APP_LANGUAGE_STORAGE_KEY, language);
  } catch {
    /* ignore quota / private mode */
  }
}

export function detectBrowserAppLanguage(): AppLanguage {
  if (typeof navigator === "undefined") return "en";
  const langs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];
  for (const tag of langs) {
    const lower = tag.toLowerCase();
    if (lower.startsWith("uk")) return "uk";
  }
  return "en";
}
